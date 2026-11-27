/* The second step of the sign-in: the six figures of an authenticator application (TOTP, RFC 6238: HMAC-SHA1, a new code every 30 seconds), and eight
   recovery codes for the day the phone is lost. Each code works once. */
import { sha, b64url } from './auth.js';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', STEP = 30;

export function base32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return bits ? out + B32[(value << (5 - bits)) & 31] : out;
}
export function unbase32(text) {
  let bits = 0, value = 0; const out = [];
  for (const c of String(text).toUpperCase()) {
    const i = B32.indexOf(c); if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

export const newSecret = () => base32(crypto.getRandomValues(new Uint8Array(20)));
export const otpauth = secret => `otpauth://totp/moyo:admin?secret=${secret}&issuer=moyo&algorithm=SHA1&digits=6&period=${STEP}`;

export async function codeAt(secret, step) {
  const key = await crypto.subtle.importKey('raw', unbase32(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const count = new Uint8Array(8); new DataView(count.buffer).setUint32(4, step); new DataView(count.buffer).setUint32(0, Math.floor(step / 2 ** 32));
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, count)), o = h[19] & 15;
  const n = ((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1000000;
  return String(n).padStart(6, '0');
}
/* the step of a right code (this one, the one before or after: clocks differ a little), only if it is newer than the last one used; or null */
export async function stepOf(secret, given, last = 0, now = Date.now()) {
  const code = String(given || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return null;
  const at = Math.floor(now / 1000 / STEP);
  for (const step of [at, at - 1, at + 1]) if (step > last && (await codeAt(secret, step)) === code) return step;
  return null;
}

const plain = c => String(c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const hashCode = async c => b64url(await sha('moyo-secours.' + plain(c)));
export function recoveryCodes(n = 8) {
  return Array.from({ length: n }, () => { const s = base32(crypto.getRandomValues(new Uint8Array(7))).slice(0, 10).toLowerCase(); return s.slice(0, 5) + '-' + s.slice(5); });
}
/* A code given at the sign-in, against the second step of the auth document. Right: it is used up (written to KV) and true. */
export async function secondStep(env, auth, given) {
  const t = auth.totp, step = await stepOf(t.secret, given, t.last);
  if (step !== null) t.last = step;
  else {
    if (plain(given).length !== 10) return false;
    const at = t.codes.indexOf(await hashCode(given));
    if (at < 0) return false;
    t.codes.splice(at, 1);
  }
  await env.MOYO.put('auth', JSON.stringify(auth));
  return true;
}
