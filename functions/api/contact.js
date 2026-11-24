/* Contact form. Accepts JSON (the page's script) or a plain form post (no JavaScript).
   Messages are kept in KV under "msg:<15-digit time>-<8 hex>" and read from /admin. */
import { json } from '../_lib/auth.js';

const TYPES = ['identite', 'site', 'donnees', 'motion', 'audiovisuel', 'communication', 'print', 'autre'];
const BUDGETS = ['lt5', '5-15', '15-40', 'gt40', 'tbd'];
const MAX_PER_HOUR = 5;
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i;
const str = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+\n/g, '\n').slice(0, max) : '');
const esc = (v) => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function onRequestPost({ request, env }) {
  const isForm = !(request.headers.get('Content-Type') || '').includes('application/json');
  const reply = (ok, status, message) => isForm
    ? Response.redirect(new URL(ok ? '/?envoye=1#contact' : '/?erreur=1#contact', request.url).toString(), 303)
    : json(ok ? { ok: true } : { error: true, message }, status);

  let body = {};
  try { body = isForm ? Object.fromEntries(await request.formData()) : await request.json(); }
  catch { return reply(false, 400, 'Formulaire illisible.'); }

  // honeypot: humans never fill the hidden "website" field; pretend it worked
  if (str(body.website, 200)) return reply(true, 200);

  const msg = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    type: TYPES.includes(body.type) ? body.type : '',
    budget: BUDGETS.includes(body.budget) ? body.budget : '',
    message: str(body.message, 5000),
    lang: body.lang === 'en' ? 'en' : 'fr'
  };
  const en = msg.lang === 'en';
  if (!msg.name) return reply(false, 422, en ? 'Please enter your name.' : 'Indiquez votre nom.');
  if (!EMAIL.test(msg.email)) return reply(false, 422, en ? 'Please enter a valid email address.' : 'Indiquez une adresse e-mail valide.');
  if (msg.message.length < 10) return reply(false, 422, en ? 'Your message is a little short.' : 'Votre message est un peu court.');
  if (!env.MOYO) return reply(false, 500, en ? 'The form is unavailable. Write to contact.moyostudio@gmail.com.' : 'Le formulaire est indisponible. Écrivez à contact.moyostudio@gmail.com.');

  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const rl = 'rlc:' + ip;
  const n = +((await env.MOYO.get(rl)) || 0);
  if (n >= MAX_PER_HOUR) return reply(false, 429, en ? 'Too many messages. Try again in an hour, or write to contact.moyostudio@gmail.com.' : 'Trop de messages. Réessayez dans une heure, ou écrivez à contact.moyostudio@gmail.com.');
  await env.MOYO.put(rl, String(n + 1), { expirationTtl: 3600 });

  const hex = [...crypto.getRandomValues(new Uint8Array(4))].map(b => b.toString(16).padStart(2, '0')).join('');
  const id = String(Date.now()).padStart(15, '0') + '-' + hex;
  const at = new Date().toISOString();
  await env.MOYO.put('msg:' + id, JSON.stringify({ id, at, ...msg }));

  // Send an e-mail notification to the studio (best-effort; the message is already saved in KV).
  // Set RESEND_API_KEY as a Pages secret to enable delivery. Optional: TO_EMAIL, FROM_EMAIL.
  if (env.RESEND_API_KEY) {
    const to = env.TO_EMAIL || 'contact.moyostudio@gmail.com';
    const from = env.FROM_EMAIL || 'moyo <onboarding@resend.dev>';
    const label = { identite: 'Identité', site: 'Site / web', donnees: 'Données', motion: 'Motion', audiovisuel: 'Audiovisuel', communication: 'Communication', print: 'Édition & print', autre: 'Autre' };
    const budget = { lt5: 'Moins de 5 000 €', '5-15': '5 000 à 15 000 €', '15-40': '15 000 à 40 000 €', gt40: 'Plus de 40 000 €', tbd: 'À définir' };
    const typeTxt = msg.type ? (label[msg.type] || msg.type) : '';
    const budgetTxt = msg.budget ? (budget[msg.budget] || msg.budget) : '';
    const first = msg.name.split(/\s+/)[0] || msg.name;
    let when = at;
    try { when = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(at)); } catch (_) {}

    // Plain-text fallback (clients without HTML)
    const lines = [
      `Nom : ${msg.name}`,
      `E-mail : ${msg.email}`,
      typeTxt ? `Type : ${typeTxt}` : null,
      budgetTxt ? `Budget : ${budgetTxt}` : null,
      `Langue : ${msg.lang}`,
      '',
      msg.message,
      '',
      `Reçu le ${when} · réf. ${id}`
    ].filter(l => l !== null).join('\n');

    // Styled HTML receipt (table-based, inline styles for e-mail clients)
    const chip = (k, v) => `<td style="padding:0 18px 0 0;vertical-align:top"><p style="margin:0 0 3px;font:600 11px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#9aa0a8">${esc(k)}</p><p style="margin:0;font:600 15px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1020">${esc(v)}</p></td>`;
    const chips = [typeTxt ? chip('Type', typeTxt) : '', budgetTxt ? chip('Budget', budgetTxt) : '', chip('Langue', msg.lang === 'en' ? 'Anglais' : 'Français')].join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#eef0ef;padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,10,50,.08)">
<tr><td style="background:#002FA7;padding:20px 28px">
  <table role="presentation" width="100%"><tr>
    <td style="font:600 19px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.02em;color:#fff">moyo</td>
    <td align="right" style="font:500 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.04em;color:rgba(255,255,255,.72)">NOUVEAU MESSAGE</td>
  </tr></table>
</td></tr>
<tr><td style="padding:26px 28px 6px">
  <p style="margin:0 0 3px;font:600 22px/1.2 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.01em;color:#0b1020">${esc(msg.name)}</p>
  <a href="mailto:${esc(msg.email)}" style="font:500 15px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#002FA7;text-decoration:none">${esc(msg.email)}</a>
</td></tr>
<tr><td style="padding:18px 28px 0"><table role="presentation"><tr>${chips}</tr></table></td></tr>
<tr><td style="padding:18px 28px 0">
  <div style="background:#f5f6f8;border-left:3px solid #002FA7;border-radius:0 10px 10px 0;padding:16px 18px;font:400 15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1f2b;white-space:pre-wrap">${esc(msg.message)}</div>
</td></tr>
<tr><td style="padding:22px 28px 26px">
  <a href="mailto:${esc(msg.email)}" style="display:inline-block;background:#002FA7;color:#fff;text-decoration:none;font:600 14px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:12px 24px;border-radius:999px">Répondre à ${esc(first)}</a>
</td></tr>
<tr><td style="padding:14px 28px;border-top:1px solid #eef0ef;background:#fafbfb">
  <p style="margin:0;font:400 12px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#9aa0a8">Reçu le ${esc(when)} &middot; réf. ${esc(id)}</p>
</td></tr>
</table></body></html>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: msg.email,
          subject: `Nouveau message de ${msg.name}`,
          text: lines,
          html
        })
      });
    } catch (_) { /* KV copy already stored; don't fail the form if e-mail is down */ }
  }

  return reply(true, 201);
}
