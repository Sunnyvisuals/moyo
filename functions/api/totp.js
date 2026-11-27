/* The second step of the sign-in, set up from the admin (see _lib/totp.js): turned on with a first device, more devices added (one for each of the
   studio), taken away one by one or all at once. Every change asks the password (and a code, to take something away). Turning it on or taking a device
   away signs the other sessions out. */
import { json, requireAdmin, chosen, matches, sessionCookie, limit, ipOf, random, TRIES } from '../_lib/auth.js';
import { newSecret, otpauth, stepOf, recoveryCodes, hashCode, secondStep, devicesOf, MOST } from '../_lib/totp.js';

const SETUP = 'totp-setup';

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const a = await chosen(env);
  return json({ on: !!a?.totp, left: a?.totp?.codes.length || 0, ready: !!a, most: MOST, devices: devicesOf(a?.totp).map(({ id, name, at }) => ({ id, name, at })) });
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

/* 1. the password and a name: a new key, to be put in the application of a device. It counts once a code of it has been given (PUT) */
export async function onRequestPost(ctx) {
  const { env } = ctx, { answer, body, a, tries } = await asked(ctx);
  if (answer) return answer;
  if (!(await matches(env, body.current, a))) return wrong(tries, 'Ce n’est pas le mot de passe actuel.');
  const devices = devicesOf(a.totp);
  if (devices.length >= MOST) return json({ error: 'full', message: `${MOST} appareils au plus : retirez-en un d’abord.` }, 409);
  const secret = newSecret(), name = (typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim().slice(0, 40) : '') || `Appareil ${devices.length + 1}`;
  await env.MOYO.put(SETUP, JSON.stringify({ secret, name }), { expirationTtl: 600 });
  return json({ ok: true, secret, name, url: otpauth(secret) });
}

/* 2. a first code of the device: it is added. With the first one the second step is on, and the recovery codes are shown, this once */
export async function onRequestPut(ctx) {
  const { env } = ctx, { answer, body, a, tries } = await asked(ctx);
  if (answer) return answer;
  const wait = await env.MOYO.get(SETUP, 'json');
  if (!wait) return json({ error: 'expired', message: 'La clé a expiré (dix minutes). Recommencez.' }, 410);
  const step = await stepOf(wait.secret, body.code);
  if (step === null) return wrong(tries, 'Ce code n’est pas le bon. Vérifiez l’heure du téléphone.');
  const device = { id: random(6), name: wait.name, secret: wait.secret, last: step, at: Date.now() };
  let codes = null;
  if (a.totp) a.totp = { devices: [...devicesOf(a.totp), device].slice(0, MOST), codes: a.totp.codes };
  else {
    codes = recoveryCodes();
    a.totp = { devices: [device], codes: await Promise.all(codes.map(hashCode)) };
    a.key = random(32);
  }
  await env.MOYO.put('auth', JSON.stringify(a));
  await env.MOYO.delete(SETUP);
  await tries.clear();
  return json({ ok: true, codes }, 200, { 'Set-Cookie': await sessionCookie(env, { remember: !!body.remember, auth: a }) });
}

/* a device is taken away (body.device), or the whole second step: the password and a code */
export async function onRequestDelete(ctx) {
  const { env } = ctx, { answer, body, a, tries } = await asked(ctx);
  if (answer) return answer;
  if (!a.totp) return json({ ok: true });
  if (!(await matches(env, body.current, a))) return wrong(tries, 'Ce n’est pas le mot de passe actuel.');
  if (!(await secondStep(env, a, body.code))) return wrong(tries, 'Ce code n’est pas le bon.');
  const rest = body.device ? devicesOf(a.totp).filter(d => d.id !== body.device) : [];
  if (rest.length) a.totp = { devices: rest, codes: a.totp.codes };
  else delete a.totp;
  a.key = random(32);
  await env.MOYO.put('auth', JSON.stringify(a));
  await tries.clear();
  return json({ ok: true, on: !!a.totp }, 200, { 'Set-Cookie': await sessionCookie(env, { remember: !!body.remember, auth: a }) });
}
