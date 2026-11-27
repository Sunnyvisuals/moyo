/* Admin session: one password, a signed cookie, no user table.
   The password is
   - the one chosen in the admin (KV "auth"): the browser stretches it (PBKDF2, 600 000 rounds) and only sends the result, of which a SHA-256 is kept,
   - or, until one is chosen, the secret ADMIN_PASSWORD of the Cloudflare project, if there is one.
   Lost or never chosen: the login page sends a one-time link to the studio's mailbox (api/forgot.js). Or delete the KV key "auth": the secret takes over.
   Cookie value: "<expiry ms>.<HMAC-SHA256(key, 'moyo-admin.' + expiry)>", HttpOnly, Secure, SameSite=Strict. A new password signs everyone out.
   A second step (an authenticator application) can be added: _lib/totp.js. */

const COOKIE = 'moyo_admin';
const DAY = 24 * 3600;
export const TRIES = 5; // wrong tries per address, then a quarter of an hour of waiting
const enc = new TextEncoder();

export const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const bytes = s => { try { return Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); } catch { return new Uint8Array(); } };
export const random = n => b64url(crypto.getRandomValues(new Uint8Array(n)));
export const sha = async data => new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));

/* the password chosen in the admin: { v, salt, iter, hash, key, at }, or null */
export async function chosen(env) {
  const a = env.MOYO ? await env.MOYO.get('auth', 'json') : null;
  return a && a.v === 1 && a.salt && a.hash && a.key ? a : null;
}
export const configured = async env => !!(env.ADMIN_PASSWORD || (await chosen(env)));

/* next: { salt, iter, proof } made by the browser. Throws a message when it is not what it should be. */
export async function choose(env, next) {
  const salt = String(next?.salt || ''), iter = Number(next?.iter), proof = bytes(next?.proof);
  if (!env.MOYO) throw new Error('Le stockage KV « MOYO » n’est pas relié au projet.');
  if (!/^[\w-]{22}$/.test(salt) || !Number.isInteger(iter) || iter < 300000 || iter > 3000000 || proof.length !== 32) throw new Error('Mot de passe illisible. Rechargez la page et réessayez.');
  const old = await chosen(env); // the second step stays when the password changes
  const a = { v: 1, salt, iter, hash: b64url(await sha(proof)), key: random(32), at: Date.now(), ...(old?.totp ? { totp: old.totp } : {}) };
  await env.MOYO.put('auth', JSON.stringify(a));
  return a;
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

/* given: { proof } once a password has been chosen in the admin, { password } before */
export async function matches(env, given, a) {
  if (a === undefined) a = await chosen(env);
  if (a) { const p = bytes(given?.proof); return p.length === 32 && same(await sha(p), bytes(a.hash)); }
  if (!env.ADMIN_PASSWORD || typeof given?.password !== 'string') return false;
  return same(await sha(given.password), await sha(env.ADMIN_PASSWORD));
}

async function sign(env, a, exp) {
  const raw = a ? a.key : env.SESSION_SECRET || 'moyo:' + env.ADMIN_PASSWORD;
  const key = await crypto.subtle.importKey('raw', enc.encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('moyo-admin.' + exp)));
}

/* remember: seven days on this device; otherwise until the browser is closed, twelve hours at most */
export async function sessionCookie(env, { remember = false, auth } = {}) {
  const a = auth === undefined ? await chosen(env) : auth, age = remember ? 7 * DAY : DAY / 2, exp = Date.now() + age * 1000;
  return `${COOKIE}=${exp}.${b64url(await sign(env, a, exp))}; Path=/; ${remember ? `Max-Age=${age}; ` : ''}HttpOnly; Secure; SameSite=Strict`;
}
export const clearCookie = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function isAdmin(request, env) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([\\w-]+)`));
  if (!m || !(+m[1] > Date.now())) return false;
  const a = await chosen(env);
  if (!a && !env.ADMIN_PASSWORD) return false;
  return same(await sign(env, a, +m[1]), bytes(m[2]));
}

/* A request sent by a page of another site (a browser says where it comes from). Without these headers (not a browser), nothing to say. */
export function foreign(request) {
  const origin = request.headers.get('Origin'), from = request.headers.get('Sec-Fetch-Site');
  return !!(origin && origin !== new URL(request.url).origin) || from === 'cross-site' || from === 'same-site';
}
/* Writes of the admin must come from our own admin page (against forged requests, CSRF): the custom header forces a CORS preflight for any other
   origin, which is never granted; the origin the browser announces must be ours; and the cookie is SameSite=Strict. */
export const ours = request => request.headers.get('X-Moyo-Admin') === '1' && !foreign(request);
export async function requireAdmin(request, env) {
  if (!ours(request)) return json({ error: 'bad_request' }, 400);
  if (!(await isAdmin(request, env))) return json({ error: 'unauthorized' }, 401);
  return null;
}

/* a counter per address: limit(env, 'rl:' + ip, 10, 900) → { full, add, clear } */
export async function limit(env, name, max, seconds) {
  const n = env.MOYO ? +((await env.MOYO.get(name)) || 0) : 0;
  return { full: n >= max, add: () => env.MOYO && env.MOYO.put(name, String(n + 1), { expirationTtl: seconds }), clear: () => n && env.MOYO && env.MOYO.delete(name) };
}
/* the address that is counted: for IPv6, the whole network of 64 bits, that one machine can walk through at will */
export function ipOf(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  if (!ip.includes(':') || ip.includes('.')) return ip;
  const [head, tail = ''] = ip.split('::'), h = head ? head.split(':') : [], t = tail ? tail.split(':') : [];
  return (ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h).slice(0, 4).map(x => parseInt(x, 16).toString(16)).join(':') + '::/64';
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}
