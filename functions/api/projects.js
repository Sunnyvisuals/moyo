import { json, requireAdmin } from '../_lib/auth.js';
import { getData, validate, publish } from '../_lib/store.js';

export async function onRequestGet({ env }) {
  return json(await getData(env));
}

/* Replace the whole document. The one before is kept (see _lib/store.js); pictures nothing shows any more are deleted. */
export async function onRequestPut({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MOYO) return json({ error: 'no_storage', message: 'Le stockage KV « MOYO » n’est pas relié au projet.' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json', message: 'JSON invalide.' }, 400); }
  const { errors, data } = validate(body);
  if (errors.length) return json({ error: 'invalid', message: errors.join('\n'), errors }, 422);

  const deletedImages = await publish(env, data);
  return json({ ok: true, data, deletedImages });
}
