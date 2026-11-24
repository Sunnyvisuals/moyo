import { json, requireAdmin, chosen, choose, matches, sessionCookie, limit, ipOf, sha } from '../_lib/auth.js';

const hex = u => [...u].map(b => b.toString(16).padStart(2, '0')).join('');

/* Change the password: signed in, with the current one. The other devices are signed out. */
export async function onRequestPut({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const tries = await limit(env, 'rl:' + ipOf(request), 10, 15 * 60);
  if (tries.full) return json({ error: 'too_many', message: 'Trop d’essais. Réessayez dans 15 minutes.' }, 429);
  let body = {};
  try { body = await request.json(); } catch {}
  const a = await chosen(env);
  if (!(await matches(env, body.current, a))) { await tries.add(); await new Promise(r => setTimeout(r, 400)); return json({ error: 'wrong_password', message: 'Ce n’est pas le mot de passe actuel.' }, 403); }
  return done(env, body, tries);
}

/* Choose the password with the one-time link received by e-mail (api/forgot.js). */
export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-Moyo-Admin') !== '1') return json({ error: 'bad_request' }, 400);
  const tries = await limit(env, 'rl:' + ipOf(request), 10, 15 * 60);
  if (tries.full) return json({ error: 'too_many', message: 'Trop d’essais. Réessayez dans 15 minutes.' }, 429);
  let body = {};
  try { body = await request.json(); } catch {}
  const name = /^[\w-]{43}$/.test(body.token || '') && env.MOYO ? 'reset:' + hex(await sha(body.token)) : null;
  if (!name || !(await env.MOYO.get(name))) { await tries.add(); return json({ error: 'expired', message: 'Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.' }, 410); }
  const r = await done(env, body, tries);
  if (r.ok) await env.MOYO.delete(name);
  return r;
}

async function done(env, body, tries) {
  let auth;
  try { auth = await choose(env, body.next); } catch (e) { return json({ error: 'invalid', message: e.message }, 422); }
  await tries.clear();
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env, { remember: !!body.remember, auth }) });
}
