/* /mentions-legales: the page built from src/mentions-legales.src.html, filled with what the admin holds. While it is not online, there is no such
   page. */
import { fresh } from './_lib/fresh.js';
import { legalOf, legalHTML } from './_lib/legal.js';

/* the filled page, or null */
export async function page({ env, request }) {
  const info = await legalOf(env);
  if (!info.online) return null;
  const res = await env.ASSETS.fetch(new Request(new URL('/mentions-legales', request.url), { headers: { Accept: 'text/html' } }));
  return new HTMLRewriter()
    .on('#legalFr', { element: el => { el.setInnerContent(legalHTML(info, 'fr'), { html: true }); } })
    .on('#legalEn', { element: el => { el.setInnerContent(legalHTML(info, 'en'), { html: true }); } })
    .transform(await fresh(res, 'legal', env));
}

export async function onRequestGet(ctx) {
  const r = await page(ctx);
  if (r) return r;
  const lost = await ctx.env.ASSETS.fetch(new Request(new URL('/404', ctx.request.url), { headers: { Accept: 'text/html' } }));
  return new Response(lost.body, { status: 404, headers: lost.headers });
}
export const onRequestHead = onRequestGet;
