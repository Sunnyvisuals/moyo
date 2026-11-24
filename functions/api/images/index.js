import { json, requireAdmin } from '../../_lib/auth.js';

const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm' };
const MB = 1024 * 1024; // the admin page resizes pictures before upload; these are only ceilings (KV keeps at most 25 MB per file)

/* Upload one image, GIF or video as the raw request body. Returns its id; the image is kept once a saved project references it. */
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MOYO) return json({ error: 'no_storage', message: 'Le stockage KV « MOYO » n’est pas relié au projet.' }, 500);

  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) return json({ error: 'bad_type', message: 'Formats acceptés : WebP, JPEG, PNG, AVIF, GIF, MP4, WebM.' }, 415);

  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: 'empty', message: 'Fichier vide.' }, 400);
  const video = type.startsWith('video/'), max = video ? 24 : type === 'image/gif' ? 20 : 10;
  if (buf.byteLength > max * MB) return json({ error: 'too_big', message: `${video ? 'Vidéo trop lourde' : type === 'image/gif' ? 'GIF trop lourd' : 'Image trop lourde'} (${max} Mo maximum).` }, 413);
  // the content has to be what it says it is
  const h = new Uint8Array(buf.slice(0, 12)), txt = String.fromCharCode(...h), ok = { webp: txt.startsWith('RIFF') && txt.slice(8) === 'WEBP', jpg: h[0] === 0xff && h[1] === 0xd8, png: h[0] === 0x89 && txt.slice(1, 4) === 'PNG', avif: txt.slice(4, 8) === 'ftyp', gif: txt.startsWith('GIF8'), mp4: txt.slice(4, 8) === 'ftyp', webm: h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3 }[ext];
  if (!ok) return json({ error: 'bad_content', message: 'Le contenu du fichier ne correspond pas à son format.' }, 415);

  const id = crypto.randomUUID() + '.' + ext;
  await env.MOYO.put('img:' + id, buf, { metadata: { type, size: buf.byteLength, at: Date.now() } });
  return json({ ok: true, id, url: '/img/' + id }, 201);
}
