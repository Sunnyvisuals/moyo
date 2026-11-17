/**
 * Cloudflare Worker — point d'entrée unique.
 * Route POST /api/contact vers le handler contact, tout le reste vers les assets statiques (Astro).
 *
 * Variables d'environnement (Cloudflare → Settings → Variables) :
 *   TURNSTILE_SECRET   clé secrète Turnstile
 *   RESEND_API_KEY     clé API Resend
 *   CONTACT_TO         adresse destinataire (ex. hello@moyo.studio)
 *   CONTACT_FROM       expéditeur vérifié Resend (ex. site@moyo.studio)
 */

interface Env {
  ASSETS: Fetcher;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) || '').trim();
  const lang = get('lang') === 'en' ? 'en' : 'fr';
  const back = lang === 'en' ? '/en/contact/' : '/contact/';

  const reply = (ok: boolean, error?: string, status = ok ? 200 : 400) =>
    wantsJson
      ? Response.json({ ok, error }, { status })
      : Response.redirect(new URL(`${back}?${ok ? 'sent=1' : 'error=1'}`, request.url).toString(), 303);

  // 1. Honeypot
  if (get('website')) return reply(true);

  // 2. Délai minimal (< 3 s = bot)
  const started = Number(get('t'));
  if (started && Date.now() - started < 3000) return reply(true);

  const name = get('name'),
    email = get('email'),
    message = get('message');

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
    message.length < 10 ||
    get('consent') !== '1'
  )
    return reply(false, 'invalid');

  if (message.length > 8000) return reply(false, 'too_long');

  // 3. Turnstile
  const token = get('cf-turnstile-response');
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') || '',
    }),
  })
    .then((r) => r.json<{ success: boolean }>())
    .catch(() => ({ success: false }));

  if (!verify.success) return reply(false, 'captcha', 403);

  // 4. Envoi via Resend
  const needs = form.getAll('needs').map(String).join(', ');
  const html = `<h2>Nouveau message depuis moyo</h2>
<p><b>Nom :</b> ${esc(name)}<br><b>E-mail :</b> ${esc(email)}<br><b>Société :</b> ${esc(get('company')) || '—'}<br>
<b>Secteur :</b> ${esc(get('sector')) || '—'}<br><b>Besoins :</b> ${esc(needs) || '—'}<br><b>Langue :</b> ${lang}</p>
<p>${esc(message).replace(/\n/g, '<br>')}</p>`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `moyo · ${name}${get('company') ? ` (${get('company')})` : ''}`,
      html,
    }),
  });

  if (!sent.ok) return reply(false, 'mail', 502);
  return reply(true);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    // Tout le reste : fichiers statiques Astro
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
