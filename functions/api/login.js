import { json, passwordMatches, sessionCookie } from '../_lib/auth.js';

const MAX_TRIES = 10;        // failed attempts per IP
const WINDOW = 15 * 60;      // seconds

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ error: 'not_configured', message: 'Le mot de passe admin (ADMIN_PASSWORD) n’est pas défini sur Cloudflare.' }, 500);
  if (request.headers.get('X-Moyo-Admin') !== '1') return json({ error: 'bad_request' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const rlKey = 'rl:' + ip;
  const tries = env.MOYO ? +((await env.MOYO.get(rlKey)) || 0) : 0;
  if (tries >= MAX_TRIES) return json({ error: 'too_many', message: 'Trop d’essais. Réessayez dans 15 minutes.' }, 429);

  let password = '';
  try { ({ password } = await request.json()); } catch {}

  if (!(await passwordMatches(env, password))) {
    if (env.MOYO) await env.MOYO.put(rlKey, String(tries + 1), { expirationTtl: WINDOW });
    await new Promise(r => setTimeout(r, 400));
    return json({ error: 'wrong_password', message: 'Mot de passe incorrect.' }, 401);
  }
  if (tries && env.MOYO) await env.MOYO.delete(rlKey);
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env) });
}
