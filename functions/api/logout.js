import { json, clearCookie, ours } from '../_lib/auth.js';

export async function onRequestPost({ request }) {
  if (!ours(request)) return json({ error: 'bad_request' }, 400); // no other site can sign the studio out
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie });
}
