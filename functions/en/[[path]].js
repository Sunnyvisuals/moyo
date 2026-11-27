/* The site in English, at /en: real pages for English readers, search engines and answer engines. Made from the French pages (see _lib/english.js). */
import seed from '../../data/projects.json';
import { getData } from '../_lib/store.js';
import { english } from '../_lib/english.js';
import { fresh } from '../_lib/fresh.js';
import { featuredOf } from '../../shared/render.js';
import { HOME, LIST, PRIVACY, LOST, head, ldHome, ldList, sample } from '../../shared/seo.js';
import { page as project } from '../projets/[id].js';
import { page as profile } from '../equipe/[id].js';

export async function onRequestGet(ctx) {
  const { request, env, params } = ctx, origin = new URL(request.url).origin;
  const parts = (Array.isArray(params.path) ? params.path : [params.path]).filter(Boolean), [a, b] = parts;
  const asset = p => env.ASSETS.fetch(new Request(origin + p, { headers: { Accept: 'text/html' } }));
  if (!parts.length) {
    const data = await getData(env);
    return english(await fresh(await asset('/'), 'home', env), { head: head({ path: '/', lang: 'en', ...HOME.en, ogTitle: 'Moyo Studio', ld: ldHome(data.team, 'en') }), rows: featuredOf(data) });
  }
  if (a === 'projets' && parts.length === 1) {
    const data = await getData(env), real = data.projects.filter(p => !sample(p, seed));
    return english(await fresh(await asset('/projets'), 'all', env), { head: head({ path: '/projets', lang: 'en', ...LIST.en, ld: ldList(real, 'en') }), rows: data.projects });
  }
  if (a === 'confidentialite' && parts.length === 1) return english(await fresh(await asset('/confidentialite'), 'legal', env), { head: head({ path: '/confidentialite', lang: 'en', ...PRIVACY.en }) });
  if (parts.length === 2 && (a === 'projets' || a === 'equipe')) {
    const r = await (a === 'projets' ? project : profile)({ ...ctx, params: { id: b } }, 'en');
    if (r) return r.status === 200 ? english(r) : r;
  }
  const lost = await asset('/404');
  return english(new Response(lost.body, { status: 404, headers: lost.headers }), { head: head({ path: '/', lang: 'en', ...LOST.en, robots: 'noindex', alternates: false }) });
}
export const onRequestHead = onRequestGet;
