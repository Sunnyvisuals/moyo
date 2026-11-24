import { json, requireAdmin } from '../../_lib/auth.js';
import { getData, imagesOf, IMAGE_ID } from '../../_lib/store.js';

/* Delete an uploaded image or video that nothing saved uses (e.g. uploaded, then removed before saving). */
export async function onRequestDelete({ request, env, params }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const id = String(params.id || '');
  if (!IMAGE_ID.test(id)) return json({ error: 'bad_id' }, 400);
  if (imagesOf(await getData(env)).has(id)) return json({ error: 'in_use', message: 'Fichier utilisé sur le site.' }, 409);
  await env.MOYO.delete('img:' + id);
  return json({ ok: true });
}
