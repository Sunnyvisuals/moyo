/* Admin session: one password (secret ADMIN_PASSWORD), a signed cookie, no user table.
   Cookie value: "<expiry ms>.<HMAC-SHA256(secret, 'moyo-admin.' + expiry)>", HttpOnly, Secure, SameSite=Strict. */

const COOKIE = 'moyo_admin';
const MAX_AGE = 7 * 24 * 3600; // seconds
const enc = new TextEncoder();

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function key(env) {
  // SESSION_SECRET is optional; without it, sessions are signed with a key derived from the password,
  // so changing the password signs everyone out.
  const raw = env.SESSION_SECRET || ('moyo:' + env.ADMIN_PASSWORD);
  return crypto.subtle.importKey('raw', enc.encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(env, exp) {
  return b64url(await crypto.subtle.sign('HMAC', await key(env), enc.encode('moyo-admin.' + exp)));
}

function sameBytes(a, b) {
  a = new Uint8Array(a); b = new Uint8Array(b);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export async function passwordMatches(env, given) {
  if (!env.ADMIN_PASSWORD || typeof given !== 'string') return false;
  const [x, y] = await Promise.all([given, env.ADMIN_PASSWORD].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))));
  return sameBytes(x, y);
}

export async function sessionCookie(env) {
  const exp = Date.now() + MAX_AGE * 1000;
  return `${COOKIE}=${exp}.${await sign(env, exp)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}

export const clearCookie = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([\\w-]+)`));
  if (!m) return false;
  const exp = +m[1];
  if (!(exp > Date.now())) return false;
  return sameBytes(enc.encode(await sign(env, exp)), enc.encode(m[2]));
}

/* Writes must come from our own admin page: the custom header forces a CORS preflight for any other origin,
   on top of the SameSite=Strict cookie. */
export async function requireAdmin(request, env) {
  if (request.headers.get('X-Moyo-Admin') !== '1') return json({ error: 'bad_request' }, 400);
  if (!(await isAdmin(request, env))) return json({ error: 'unauthorized' }, 401);
  return null;
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}
