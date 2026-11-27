/* The second step of the sign-in, set up from the admin (see _lib/totp.js). Every change asks the password (and the code, to take it away); it signs the
   other devices out. */
import { json, requireAdmin, chosen, matches, sessionCookie, limit, ipOf, random, TRIES } from '../_lib/auth.js';
import { newSecret, otpauth, stepOf, recoveryCodes, hashCode, secondStep } from '../_lib/totp.js';

const SETUP = 'totp-setup';

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const a = await chosen(env);
  return json({ on: !!a?.totp, left: a?.totp?.codes.length || 0, ready: !!a });
}

/* the request of a change: signed in, not too many wrong tries; returns { body, a, tries } or an answer */
async function asked({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return { answer: denied };
  const tries = await limit(env, 'rl:' + ipOf(request), TRIES, 15 * 60);
  if (tries.full) return { answer: json({ error: 'too_many', message: 'Trop d’essais. Réessayez dans 15 minutes.' }, 429) };
  let body = {};
  try { body = await request.json(); } catch {}
  const a = await chosen(env);
  if (!a) return { answer: json({ error: 'no_password', message: 'Choisissez d’abord un mot de passe pour l’admin.' }, 409) };
  return { body, a, tries };
}
const wrong = async (tries, message) => { await tries.add(); await new Promise(r => setTimeout(r, 400)); return json({ error: 'wrong', message }, 403); };

/* 1. the password: a new key, to be put in the application. It counts once a code of it has been given (PUT) */
export async function onRequestPost(ctx) {
  const { env } = ctx, { answer, body, a, tries } = await asked(ctx);
  if (answer) return answer;
  if (!(await matches(env, body.current, a))) return wrong(tries, 'Ce n’est pas le mot de passe actuel.');
  if (a.totp) return json({ error: 'on', message: 'La double vérification est déjà active.' }, 409);
  const secret = newSecret();
  await env.MOYO.put(SETUP, secret, { expirationTtl: 600 });
  return json({ ok: true, secret, url: otpauth(secret) });
}

/* 2. a first code: the second step is on. The recovery codes are shown this once */
export async function onRequestPut(ctx) {
  const { env } = ctx, { answer, body, a, tries } = await asked(ctx);
  if (answer) return answer;
  const secret = await env.MOYO.get(SETUP);
  if (!secret) return json({ error: 'expired', message: 'La clé a expiré (dix minutes). Recommencez.' }, 410);
  const step = await stepOf(secret, body.code);
  if (step === null) return wrong(tries, 'Ce code n’est pas le bon. Vérifiez l’heure du téléphone.');
  const codes = recoveryCodes();
  a.totp = { secret, last: step, codes: await Promise.all(codes.map(hashCode)) };
  a.key = random(32);
  await env.MOYO.put('auth', JSON.stringify(a));
  await env.MOYO.delete(SETUP);
  await tries.clear();
  return json({ ok: true, codes }, 200, { 'Set-Cookie': await sessionCookie(env, { remember: !!body.remember, auth: a }) });
}

export async function onRequestDelete(ctx) {
  const { env } = ctx, { answer, body, a, tries } = await asked(ctx);
  if (answer) return answer;
  if (!a.totp) return json({ ok: true });
  if (!(await matches(env, body.current, a))) return wrong(tries, 'Ce n’est pas le mot de passe actuel.');
  if (!(await secondStep(env, a, body.code))) return wrong(tries, 'Ce code n’est pas le bon.');
  delete a.totp;
  a.key = random(32);
  await env.MOYO.put('auth', JSON.stringify(a));
  await tries.clear();
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env, { remember: !!body.remember, auth: a }) });
}
