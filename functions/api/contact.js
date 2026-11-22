/* Contact form. Accepts JSON (the page's script) or a plain form post (no JavaScript).
   Messages are kept in KV under "msg:<15-digit time>-<8 hex>" and read from /admin. */
import { json } from '../_lib/auth.js';

const TYPES = ['identite', 'site', 'donnees', 'motion', 'audiovisuel', 'communication', 'autre'];
const BUDGETS = ['lt5', '5-15', '15-40', 'gt40', 'tbd'];
const MAX_PER_HOUR = 5;
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i;
const str = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+\n/g, '\n').slice(0, max) : '');

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
  await env.MOYO.put('msg:' + id, JSON.stringify({ id, at: new Date().toISOString(), ...msg }));
  return reply(true, 201);
}
