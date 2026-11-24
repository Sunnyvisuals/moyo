/* Runs before every request.
   - Home and /projets: once the admin has saved projects in KV, the static lists (built from the seed)
     are replaced on the fly with the current ones, so the pages stay complete without JavaScript.
   - Adds a few security headers everywhere, and keeps /admin out of search engines. */
import { getData, hasStored } from './_lib/store.js';
import { rowsHTML, featuredOf, dataJSON, txt } from '../shared/render.js';
import { creditLinks, teamRows } from '../shared/chrome.js';
import { SITE, abs, snippet, homeLD } from '../shared/seo.js';

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
      .on('script#ld', { element: el => { if (page === 'home') el.replace(homeLD(data, list), { html: true }); } })
      .transform(res);
  }

  // a shared project (?projet=id): its own title, text and picture in the preview; its page (/projets/<id>) is the canonical one
  if (page && isHTML && res.ok && url.searchParams.has('projet')) {
    const p = (await getData(env)).projects.find(x => x.id === url.searchParams.get('projet'));
    if (p) {
      const t = txt(p, 'fr'), set = v => ({ element: el => { if (v) el.setAttribute('content', v); } });
      const canon = SITE + '/projets/' + encodeURIComponent(p.id), d = snippet(t.desc);
      res = new HTMLRewriter()
        .on('title', { element: el => { el.setInnerContent(t.title + ' · Moyo Studio'); } })
        .on('link[rel="canonical"]', { element: el => { el.setAttribute('href', canon); } })
        .on('meta[property="og:url"]', set(canon))
        .on('meta[property="og:title"]', set(t.title + ' · Moyo Studio')).on('meta[property="og:description"]', set(d)).on('meta[name="description"]', set(d))
        .on('meta[property="og:image"],meta[name="twitter:image"]', set(p.cover && abs(p.cover)))
        .on('meta[property="og:image:width"],meta[property="og:image:height"]', { element: el => { if (p.cover) el.remove(); } })
        .on('meta[property="og:image:alt"]', set(t.alt || t.title))
        .transform(res);
    }
  }

  // contact form or sign-up posted without JavaScript: say so on the page it lands on
  const q = url.searchParams;
  if (page === 'home' && isHTML && res.ok && (q.has('envoye') || q.has('erreur'))) {
    const ok = q.has('envoye');
    res = new HTMLRewriter()
      .on('#ctStatus', { element: el => { el.setInnerContent(ok ? 'Message envoyé. Merci !' : 'Le message n’a pas pu partir. Vérifiez les champs et réessayez.'); if (!ok) el.setAttribute('class', 'f-status err'); } })
      .transform(res);
  }
  if (page && isHTML && res.ok && q.has('inscription')) {
    const ok = q.get('inscription') === 'ok';
    res = new HTMLRewriter()
      .on('#subMsg', { element: el => { el.setInnerContent(ok ? 'Merci, à très vite.' : 'Indiquez une adresse e-mail valide.'); if (!ok) el.setAttribute('class', 'sub-msg err'); } })
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
