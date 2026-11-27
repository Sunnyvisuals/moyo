import { json, chosen, matches, sessionCookie, limit, ipOf, ours, TRIES } from '../_lib/auth.js';
import { secondStep } from '../_lib/totp.js';

export async function onRequestPost({ request, env }) {
  if (!ours(request)) return json({ error: 'bad_request' }, 400);
  const a = await chosen(env);
  if (!a && !env.ADMIN_PASSWORD) return json({ error: 'not_configured', message: 'L’admin n’a pas encore de mot de passe.' }, 409);

  const tries = await limit(env, 'rl:' + ipOf(request), TRIES, 15 * 60); // failed attempts per address
  if (tries.full) return json({ error: 'too_many', message: 'Trop d’essais. Réessayez dans 15 minutes.' }, 429);

  let body = {};
  try { body = await request.json(); } catch {}
  if (!(await matches(env, body, a))) {
    await tries.add();
    await new Promise(r => setTimeout(r, 400));
    return json({ error: 'wrong_password', message: 'Ce n’est pas le bon mot de passe.' }, 401);
  }
  if (a?.totp) { // the second step: the code of the application, or a recovery code
    if (!body.code) return json({ error: 'code', message: 'Entrez le code à six chiffres de votre application.' }, 401);
    if (!(await secondStep(env, a, body.code))) {
      await tries.add();
      await new Promise(r => setTimeout(r, 400));
      return json({ error: 'code', message: 'Ce code n’est pas le bon.' }, 401);
    }
  }
  await tries.clear();
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env, { remember: !!body.remember, auth: a }) });
}
