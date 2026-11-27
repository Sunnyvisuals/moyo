/* The legal notice, from the admin (see _lib/legal.js). */
import { json, requireAdmin } from '../_lib/auth.js';
import { legalOf, legalClean, legalMissing } from '../_lib/legal.js';

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const info = await legalOf(env);
  return json({ info, missing: legalMissing(info) });
}

export async function onRequestPut({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MOYO) return json({ error: 'no_storage', message: 'Le stockage KV « MOYO » n’est pas relié au projet.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json', message: 'JSON invalide.' }, 400); }
  let info;
  try { info = legalClean(body); } catch (x) { return json({ error: 'invalid', message: x.message }, 422); }
  await env.MOYO.put('legal', JSON.stringify(info));
  return json({ ok: true, info, missing: legalMissing(info) });
}
