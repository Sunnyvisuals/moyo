/* Project page: /projets/<id>, rendered on the server from the data the admin publishes (shared/page.js).
   On the home and on /projets a click on a card opens the same project as a sheet; this page is what search engines,
   shared links and new tabs get. */
import { getData } from '../_lib/store.js';
import { projectPage } from '../../shared/page.js';

export async function onRequestGet({ params, env, request }) {
  const data = await getData(env);
  const i = (data.projects || []).findIndex(p => p.id === params.id);
  if (i < 0) return Response.redirect(new URL('/projets', request.url).toString(), 302);
  return new Response(projectPage(data, i), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
