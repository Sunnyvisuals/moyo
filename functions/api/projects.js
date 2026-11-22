import { json, requireAdmin } from '../_lib/auth.js';
import { getData, saveData, validate, imagesOf } from '../_lib/store.js';

export async function onRequestGet({ env }) {
  return json(await getData(env));
}

/* Replace the whole document. Images that were used before and are no longer referenced are deleted. */
export async function onRequestPut({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MOYO) return json({ error: 'no_storage', message: 'Le stockage KV « MOYO » n’est pas relié au projet.' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json', message: 'JSON invalide.' }, 400); }
  const { errors, data } = validate(body);
  if (errors.length) return json({ error: 'invalid', message: errors.join('\n'), errors }, 422);

  const before = imagesOf(await getData(env));
  const after = imagesOf(data);
  await saveData(env, data);
  const gone = [...before].filter(i => !after.has(i));
  await Promise.all(gone.map(i => env.MOYO.delete('img:' + i)));
  return json({ ok: true, data, deletedImages: gone.length });
}
