import { json, requireAdmin } from '../../_lib/auth.js';
import { getData, imagesOf, IMAGE_ID } from '../../_lib/store.js';

/* Delete an uploaded image that no saved project uses (e.g. uploaded, then removed before saving). */
export async function onRequestDelete({ request, env, params }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const id = String(params.id || '');
  if (!IMAGE_ID.test(id)) return json({ error: 'bad_id' }, 400);
  if (imagesOf(await getData(env)).has(id)) return json({ error: 'in_use', message: 'Image utilisée par un projet enregistré.' }, 409);
  await env.MOYO.delete('img:' + id);
  return json({ ok: true });
}
