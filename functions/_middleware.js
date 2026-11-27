/* Runs before every request.
   - Home and /projets: once the admin has saved projects in KV, the static lists (built from the seed)
     are replaced on the fly with the current ones, so the pages stay complete without JavaScript.
   - In the preview of the admin, the pages are made with what is not published yet (_lib/preview.js).
   - Adds a few security headers everywhere, and keeps /admin out of search engines. */
import { fresh } from './_lib/fresh.js';
import { draftOf, preview } from './_lib/preview.js';

const PAGES = { '/': 'home', '/index.html': 'home', '/projets': 'all', '/projets/': 'all', '/projets.html': 'all', '/confidentialite': 'legal', '/confidentialite.html': 'legal', '/mentions-legales': 'legal', '/mentions-legales.html': 'legal' };

/* What a page may load and who may show it. The pages carry their own scripts and styles; nothing runs from elsewhere.
   The site: its own files, and, in a project, the frames of other services once the visitor asks. The admin: shown by no one. */
const BASE = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'";
const CSP = { site: BASE + "; frame-ancestors 'self'", admin: BASE + "; frame-ancestors 'none'" };

export async function onRequest(ctx) {
  const { request, env, next } = ctx, url = new URL(request.url);
  // https everywhere (a local test server stays as it is)
  if (url.protocol === 'http:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) { url.protocol = 'https:'; return Response.redirect(url.toString(), 301); }
  if (url.searchParams.has('projet') && PAGES[url.pathname]) return Response.redirect(new URL('/projets/' + encodeURIComponent(url.searchParams.get('projet')), url.origin).toString(), 301); // older addresses
  const draft = await draftOf(request, env, url), drawn = draft && await preview(ctx, url, draft);
  let res = drawn || await next();
  // the pictures that come with the site exist in AVIF, three times lighter, for the browsers that read it
  if (/^\/proj\/[\w-]+\.jpg$/.test(url.pathname) && env.ASSETS) {
    if ((request.headers.get('Accept') || '').includes('image/avif')) { const a = await env.ASSETS.fetch(new Request(new URL(url.pathname.replace(/jpg$/, 'avif'), url.origin), { method: 'GET' })); if (a.ok) { res = new Response(a.body, a); res.headers.set('Content-Type', 'image/avif'); } }
    res = new Response(res.body, res); res.headers.append('Vary', 'Accept');
  }
  const page = request.method === 'GET' && PAGES[url.pathname];
  const isHTML = (res.headers.get('Content-Type') || '').includes('text/html');

  if (page && isHTML && res.ok && !drawn) res = await fresh(res, page, env);

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
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // https only, remembered a year
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  if (url.pathname.startsWith('/fonts/') && res.ok) h.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (url.pathname.startsWith('/proj/') && res.ok) h.set('Cache-Control', 'public, max-age=86400');
  if (isHTML) {
    const admin = url.pathname.startsWith('/admin');
    h.set('X-Frame-Options', admin ? 'DENY' : 'SAMEORIGIN'); // the site can be framed by itself (the preview), the admin by no one
    h.set('Content-Security-Policy', admin ? CSP.admin : CSP.site);
    h.set('Cache-Control', drawn ? 'no-store' : 'no-cache');
    if (drawn || url.searchParams.has('en-ligne')) h.set('X-Robots-Tag', 'noindex, nofollow');
  }
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) h.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
