import { json, requireAdmin } from '../../_lib/auth.js';

const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'image/gif': 'gif' };
const MAX = 10 * 1024 * 1024; // the admin page resizes before upload; this is only a ceiling

/* Upload one image as the raw request body. Returns its id; the image is kept once a saved project references it. */
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MOYO) return json({ error: 'no_storage', message: 'Le stockage KV « MOYO » n’est pas relié au projet.' }, 500);

  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) return json({ error: 'bad_type', message: 'Formats acceptés : WebP, JPEG, PNG, AVIF, GIF.' }, 415);

  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: 'empty', message: 'Fichier vide.' }, 400);
  if (buf.byteLength > MAX) return json({ error: 'too_big', message: 'Image trop lourde (10 Mo maximum).' }, 413);

  const id = crypto.randomUUID() + '.' + ext;
  await env.MOYO.put('img:' + id, buf, { metadata: { type, size: buf.byteLength, at: Date.now() } });
  return json({ ok: true, id, url: '/img/' + id }, 201);
}
