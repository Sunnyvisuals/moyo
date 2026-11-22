import { json, requireAdmin } from '../../_lib/auth.js';

/* Delete one contact message (admin only). */
export async function onRequestDelete({ request, env, params }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const id = String(params.id || '');
  if (!/^\d{15}-[a-f0-9]{8}$/.test(id)) return json({ error: 'bad_id' }, 400);
  await env.MOYO.delete('msg:' + id);
  return json({ ok: true });
}
