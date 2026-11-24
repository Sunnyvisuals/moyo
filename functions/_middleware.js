/* Runs before every request.
   - Home and /projets: once the admin has saved projects in KV, the static lists (built from the seed)
     are replaced on the fly with the current ones, so the pages stay complete without JavaScript.
   - Adds a few security headers everywhere, and keeps /admin out of search engines. */
import { fresh } from './_lib/fresh.js';

const PAGES = { '/': 'home', '/index.html': 'home', '/projets': 'all', '/projets/': 'all', '/projets.html': 'all' };

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  if (url.searchParams.has('projet') && PAGES[url.pathname]) return Response.redirect(new URL('/projets/' + encodeURIComponent(url.searchParams.get('projet')), url.origin).toString(), 301); // older addresses
  let res = await next();
  // the pictures that come with the site exist in AVIF, three times lighter, for the browsers that read it
  if (/^\/proj\/[\w-]+\.jpg$/.test(url.pathname) && env.ASSETS) {
    if ((request.headers.get('Accept') || '').includes('image/avif')) { const a = await env.ASSETS.fetch(new Request(new URL(url.pathname.replace(/jpg$/, 'avif'), url.origin), { method: 'GET' })); if (a.ok) { res = new Response(a.body, a); res.headers.set('Content-Type', 'image/avif'); } }
    res = new Response(res.body, res); res.headers.append('Vary', 'Accept');
  }
  const page = request.method === 'GET' && PAGES[url.pathname];
  const isHTML = (res.headers.get('Content-Type') || '').includes('text/html');

  if (page && isHTML && res.ok) res = await fresh(res, page, env);

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
