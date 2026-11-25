import { json, requireAdmin } from '../_lib/auth.js';
import { validate } from '../_lib/store.js';
import { keep } from '../_lib/preview.js';

/* What the admin has not published yet, kept for an hour so that the preview can show it (_lib/preview.js). What is not valid is left out, and said. */
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MOYO) return json({ error: 'no_storage', message: 'Le stockage KV « MOYO » n’est pas relié au projet.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json', message: 'JSON invalide.' }, 400); }
  const { errors, data } = validate(body);
  if (!data) return json({ error: 'invalid', message: errors.join('\n') }, 422);
  return json({ ok: true, errors }, 200, { 'Set-Cookie': await keep(env, data) });
}
