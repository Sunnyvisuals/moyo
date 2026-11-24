/* Runs before every request.
   - Home and /projets: once the admin has saved projects in KV, the static lists (built from the seed)
     are replaced on the fly with the current ones, so the pages stay complete without JavaScript.
   - Adds a few security headers everywhere, and keeps /admin out of search engines. */
import { getData, hasStored } from './_lib/store.js';
import { rowsHTML, featuredOf, dataJSON, txt, imgURL } from '../shared/render.js';
import { creditLinks, teamRows } from '../shared/chrome.js';

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
      .on('.fby', { element: el => { el.setInnerContent(creditLinks(data.team), { html: true }); } })
      .on('.names', { element: el => { el.setInnerContent(teamRows(data.team), { html: true }); } })
      .on('a.la', { element: el => { const c = el.getAttribute('data-cat'); if (data.projects.some(p => p.category === c)) el.setAttribute('href', '/projets?cat=' + c); else el.removeAttribute('href'); } })
      .on('script#moyo-data', { element: el => { el.setInnerContent(dataJSON(data), { html: true }); } })
      .transform(res);
  }

  // a shared project (?projet=id): its own title, text and picture in the preview
  if (page && isHTML && res.ok && url.searchParams.has('projet')) {
    const p = (await getData(env)).projects.find(x => x.id === url.searchParams.get('projet'));
    if (p) {
      const t = txt(p, 'fr'), set = v => ({ element: el => { if (v) el.setAttribute('content', v); } });
      res = new HTMLRewriter()
        .on('title', { element: el => { el.setInnerContent(t.title + ' · Moyo Studio'); } })
        .on('meta[property="og:title"]', set(t.title + ' · Moyo Studio')).on('meta[property="og:description"]', set(t.desc)).on('meta[name="description"]', set(t.desc))
        .on('meta[property="og:image"],meta[name="twitter:image"]', set(p.cover && new URL(imgURL(p.cover), url.origin).href))
        .on('meta[property^="og:image:"]', { element: el => { if (p.cover) el.remove(); } })
        .transform(res);
    }
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
  if (url.pathname.startsWith('/fonts/') && res.ok) h.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (url.pathname.startsWith('/proj/') && res.ok) h.set('Cache-Control', 'public, max-age=86400');
  if (isHTML) {
    h.set('X-Frame-Options', 'DENY');
    h.set('Cache-Control', 'no-cache');
  }
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) h.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
