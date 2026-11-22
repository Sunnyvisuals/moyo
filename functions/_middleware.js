/* Runs before every request.
   - Home and /projets: once the admin has saved projects in KV, the static lists (built from the seed)
     are replaced on the fly with the current ones, so the pages stay complete without JavaScript.
   - Adds a few security headers everywhere, and keeps /admin out of search engines. */
import { getData, hasStored } from './_lib/store.js';
import { rowsHTML, cardsHTML, featuredOf, dataJSON } from '../shared/render.js';

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
      .on('#projects', { element: el => { el.setInnerContent((page === 'home' ? cardsHTML : rowsHTML)(list, 'fr'), { html: true }); } })
      .on('script#moyo-data', { element: el => { el.setInnerContent(dataJSON(data), { html: true }); } })
      .transform(res);
  }

  // contact form posted without JavaScript: say so on the page it lands on
  if (page === 'home' && isHTML && res.ok && (url.searchParams.has('envoye') || url.searchParams.has('erreur'))) {
    const ok = url.searchParams.has('envoye');
    res = new HTMLRewriter()
      .on('#ctStatus', { element: el => { el.setInnerContent(ok ? 'Message envoyé. Merci !' : 'Le message n’a pas pu partir. Vérifiez les champs et réessayez.'); if (!ok) el.setAttribute('class', 'f-status err'); } })
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
