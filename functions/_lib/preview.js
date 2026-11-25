/* The preview of the admin: the real pages, made with what is not published yet.
   Only for the signed-in admin, and only inside a frame of our own pages (the admin): everywhere else, and for everyone else, the site is the published
   one. The draft is kept for an hour in KV under "preview:<random>"; the cookie of the same name says which one.
   ?en-ligne: the published page, in the frame (to compare). */
import { isAdmin, random } from './auth.js';
import { fresh } from './fresh.js';
import { page as project } from '../projets/[id].js';
import { page as profile } from '../equipe/[id].js';
import { onRequestGet as english } from '../en/[[path]].js';

const COOKIE = 'moyo_apercu', HOUR = 3600;

/* keeps a draft; returns the cookie that leads to it */
export async function keep(env, data) {
  const id = random(24); // a new name each time: KV never answers with an older draft
  await env.MOYO.put('preview:' + id, JSON.stringify(data), { expirationTtl: HOUR });
  return `${COOKIE}=${id}; Path=/; Max-Age=${HOUR}; HttpOnly; Secure; SameSite=Strict`;
}

export async function draftOf(request, env, url) {
  if (request.method !== 'GET' || request.headers.get('Sec-Fetch-Dest') !== 'iframe' && request.headers.get('X-Moyo-Apercu') !== '1' || url.searchParams.has('en-ligne') || !env.MOYO || /^\/(admin|api|img|proj|fonts|og)(\/|$)/.test(url.pathname)) return null;
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([\\w-]{32})(?:;|$)`));
  return m && (await isAdmin(request, env)) ? env.MOYO.get('preview:' + m[1], 'json') : null;
}

/* nothing is sent from a preview */
const GUARD = `<script>document.documentElement.dataset.apercu='';addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();var s=e.target.querySelector('[role=status]');if(s)s.textContent=document.documentElement.lang==='en'?'Preview: nothing is sent.':'Aperçu : rien n’est envoyé.'},true)</script>`;

/* the page of this address, made with the draft; null when it is not a page of the site */
export async function preview(ctx, url, doc) {
  const { env, request } = ctx, kv = env.MOYO, mine = { ...env, MOYO: { get: async (k, type) => k === 'projects' ? structuredClone(doc) : kv.get(k, type) } };
  const c = { request, env: mine, next: ctx.next, params: {} }, seg = url.pathname.replace(/\.html$/, '').split('/').filter(Boolean).map(decodeURIComponent), [a, b] = seg;
  const asset = p => env.ASSETS.fetch(new Request(url.origin + p, { headers: { Accept: 'text/html' } }));
  let r = null;
  if (a === 'en') r = await english({ ...c, params: { path: seg.slice(1) } });
  else if (!seg.length || a === 'index') r = await fresh(await asset('/'), 'home', mine);
  else if (a === 'projets' && seg.length === 1) r = await fresh(await asset('/projets'), 'all', mine);
  else if (seg.length === 2 && (a === 'projets' || a === 'equipe')) { r = await (a === 'projets' ? project : profile)({ ...c, params: { id: b } }); if (!r) { const lost = await asset('/404'); r = new Response(lost.body, { status: 404, headers: lost.headers }); } }
  if (!r) return null;
  r = new HTMLRewriter().on('head', { element: e => { e.prepend(GUARD, { html: true }); } }).transform(new Response(r.body, r));
  r.headers.set('X-Moyo-Apercu', '1');
  return r;
}
