/**
 * Cloudflare Pages Function — POST /api/contact
 * Anti-spam en trois couches : champ piège (honeypot), délai minimal de saisie, Cloudflare Turnstile.
 * Envoi de l'e-mail via l'API Resend (https://resend.com), offre gratuite suffisante pour ce volume.
 *
 * Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
 *   TURNSTILE_SECRET   clé secrète Turnstile
 *   RESEND_API_KEY     clé API Resend
 *   CONTACT_TO         adresse qui reçoit les messages (ex. hello@moyo.studio)
 *   CONTACT_FROM       expéditeur vérifié chez Resend (ex. site@moyo.studio)
 */
interface Env { TURNSTILE_SECRET: string; RESEND_API_KEY: string; CONTACT_TO: string; CONTACT_FROM: string }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) || '').trim();
  const lang = get('lang') === 'en' ? 'en' : 'fr';
  const back = lang === 'en' ? '/en/contact/' : '/contact/';
  const reply = (ok: boolean, error?: string, status = ok ? 200 : 400) =>
    wantsJson
      ? Response.json({ ok, error }, { status })
      : Response.redirect(new URL(`${back}?${ok ? 'sent=1' : 'error=1'}`, request.url).toString(), 303);

  // 1. Honeypot : un humain ne remplit jamais ce champ. On répond « ok » pour ne rien apprendre au robot.
  if (get('website')) return reply(true);
  // 2. Délai : moins de 3 secondes entre l'affichage et l'envoi = robot.
  const started = Number(get('t'));
  if (started && Date.now() - started < 3000) return reply(true);

  const name = get('name'), email = get('email'), message = get('message');
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10 || get('consent') !== '1')
    return reply(false, 'invalid');
  if (message.length > 8000) return reply(false, 'too_long');

  // 3. Turnstile
  const token = get('cf-turnstile-response');
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get('CF-Connecting-IP') || '' }),
  }).then((r) => r.json<{ success: boolean }>()).catch(() => ({ success: false }));
  if (!verify.success) return reply(false, 'captcha', 403);

  const needs = form.getAll('needs').map(String).join(', ');
  const html = `<h2>Nouveau message depuis moyo</h2>
<p><b>Nom :</b> ${esc(name)}<br><b>E-mail :</b> ${esc(email)}<br><b>Société :</b> ${esc(get('company')) || '—'}<br>
<b>Secteur :</b> ${esc(get('sector')) || '—'}<br><b>Besoins :</b> ${esc(needs) || '—'}<br><b>Langue :</b> ${lang}</p>
<p>${esc(message).replace(/\n/g, '<br>')}</p>`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CONTACT_FROM, to: [env.CONTACT_TO], reply_to: email, subject: `moyo · ${name}${get('company') ? ` (${get('company')})` : ''}`, html }),
  });
  if (!sent.ok) return reply(false, 'mail', 502);
  return reply(true);
};
