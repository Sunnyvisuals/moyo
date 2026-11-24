/* Team profile page: /equipe/<id>, rendered on the server from the data the admin publishes (shared/page.js). */
import { getData } from '../_lib/store.js';
import { personPage } from '../../shared/page.js';

export async function onRequestGet({ params, env, request }) {
  const data = await getData(env);
  const i = (data.team || []).findIndex(m => m.id === params.id);
  if (i < 0) return Response.redirect(new URL('/#equipe', request.url).toString(), 302);
  return new Response(personPage(data, i), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
