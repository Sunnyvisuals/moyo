/* Newsletter sign-up. Accepts JSON (the footer form) or a plain form post.
   Each address is kept once in KV under "sub:<email-lowercased>"; the /admin list can read the "sub:" prefix. */
import { json } from '../_lib/auth.js';

const MAX_PER_HOUR = 10;
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function onRequestPost({ request, env }) {
  const isForm = !(request.headers.get('Content-Type') || '').includes('application/json');
  const reply = (ok, status, body) => isForm
    ? Response.redirect(new URL(ok ? '/?inscrit=1#foot' : '/?erreur=1#foot', request.url).toString(), 303)
    : json(ok ? { ok: true, ...body } : { error: true, ...body }, status);

  let body = {};
  try { body = isForm ? Object.fromEntries(await request.formData()) : await request.json(); }
  catch { return reply(false, 400, { message: 'Requête illisible.' }); }

  // honeypot: humans never fill the hidden "website" field; pretend it worked
  if (str(body.website, 200)) return reply(true, 200);

  const email = str(body.email, 200);
  const lang = body.lang === 'en' ? 'en' : 'fr';
  const en = lang === 'en';
  if (!EMAIL.test(email)) return reply(false, 422, { message: en ? 'Please enter a valid email address.' : 'Indiquez une adresse e-mail valide.' });
  if (!env.MOYO) return reply(false, 500, { message: en ? 'Sign-up is unavailable. Write to contact.moyostudio@gmail.com.' : 'L’inscription est indisponible. Écrivez à contact.moyostudio@gmail.com.' });

  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const rl = 'rls:' + ip;
  const n = +((await env.MOYO.get(rl)) || 0);
  if (n >= MAX_PER_HOUR) return reply(false, 429, { message: en ? 'Too many attempts. Try again in an hour.' : 'Trop de tentatives. Réessayez dans une heure.' });
  await env.MOYO.put(rl, String(n + 1), { expirationTtl: 3600 });

  const key = 'sub:' + email.toLowerCase();
  if (await env.MOYO.get(key)) return reply(true, 200, { already: true });
  await env.MOYO.put(key, JSON.stringify({ email, lang, at: new Date().toISOString() }));
  return reply(true, 201);
}
