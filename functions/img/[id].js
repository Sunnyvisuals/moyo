import { IMAGE_ID } from '../_lib/store.js';

/* Serve an uploaded image from KV. Ids are random and never reused, so the response can be cached forever. */
export async function onRequestGet({ request, env, params }) {
  const id = String(params.id || '');
  if (!IMAGE_ID.test(id) || !env.MOYO) return new Response('Not found', { status: 404 });
  const etag = '"' + id + '"';
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
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
