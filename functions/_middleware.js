/* Runs before every request.
   - Home and /projets: once the admin has saved projects in KV, the static lists (built from the seed)
     are replaced on the fly with the current ones, so the pages stay complete without JavaScript.
   - Adds a few security headers everywhere, and keeps /admin out of search engines. */
import { getData, hasStored } from './_lib/store.js';
import { rowsHTML, featuredOf, dataJSON } from '../shared/render.js';

const PAGES = { '/': 'home', '/index.html': 'home', '/projets': 'all', '/projets/': 'all', '/projets.html': 'all' };

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  let res = await next();
  const page = request.method === 'GET' && PAGES[url.pathname];
  const isHTML = (res.headers.get('Content-Type') || '').includes('text/html');

  if (page && isHTML && res.ok && (await hasStored(env))) {
    const data = await getData(env);
    const list = page === 'home' ? featuredOf(data) : data.projects;
    res = new HTMLRewriter()
      .on('#projects', { element: el => { el.setInnerContent(rowsHTML(list, 'fr'), { html: true }); } })
      .on('script#moyo-data', { element: el => { el.setInnerContent(dataJSON(data), { html: true }); } })
      .transform(res);
  }

  res = new Response(res.body, res);
  const h = res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isHTML) {
    h.set('X-Frame-Options', 'DENY');
    h.set('Cache-Control', 'no-cache');
  }
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) h.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
