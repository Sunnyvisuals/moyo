import { IMAGE_ID } from '../_lib/store.js';

/* Serve an uploaded image or video from KV. Ids are random and never reused, so the response can be cached forever. */
export async function onRequestGet({ request, env, params }) {
  const id = String(params.id || '');
  if (!IMAGE_ID.test(id) || !env.MOYO) return new Response('Not found', { status: 404 });
  const etag = '"' + id + '"';
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  if (/\.(mp4|webm)$/.test(id)) return film(request, env, id, etag);
  const { value, metadata } = await env.MOYO.getWithMetadata('img:' + id, 'stream');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: {
      'Content-Type': metadata?.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag
    }
  });
}

/* A video is asked for in pieces (Safari plays nothing otherwise): answer with the bytes that are asked for. */
async function film(request, env, id, etag) {
  const { value, metadata } = await env.MOYO.getWithMetadata('img:' + id, { type: 'arrayBuffer', cacheTtl: 86400 });
  if (!value) return new Response('Not found', { status: 404 });
  const size = value.byteLength, head = { 'Content-Type': metadata?.type || (id.endsWith('.webm') ? 'video/webm' : 'video/mp4'), 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', ETag: etag };
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
  if (!m || (!m[1] && !m[2])) return new Response(value, { headers: { ...head, 'Content-Length': String(size) } });
  const from = m[1] ? +m[1] : Math.max(0, size - +m[2]), to = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  if (from > to || from >= size) return new Response(null, { status: 416, headers: { ...head, 'Content-Range': `bytes */${size}` } });
  return new Response(value.slice(from, to + 1), { status: 206, headers: { ...head, 'Content-Range': `bytes ${from}-${to}/${size}`, 'Content-Length': String(to - from + 1) } });
}
