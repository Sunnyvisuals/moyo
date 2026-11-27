/* Every page worth finding, in both languages, from the data of the moment. The examples of the start and the profiles still in lorem ipsum stay out
   until they are replaced (shared/seo.js). */
import seed from '../data/projects.json';
import { getData } from './_lib/store.js';
import { SITE, full, sample, waiting } from '../shared/seo.js';
import { imgURL } from '../shared/render.js';

const x = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export async function onRequestGet({ env }) {
  const d = await getData(env), real = (d.projects || []).filter(p => !sample(p, seed));
  const pages = [['/'], ['/projets'], ['/confidentialite'], ...real.map(p => ['/projets/' + encodeURIComponent(p.id), p]), ...(d.team || []).filter(m => !waiting(m)).map(m => ['/equipe/' + encodeURIComponent(m.id)])];
  const alt = path => ['fr', 'en'].map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${x(full(path, l))}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${x(full(path, 'fr'))}"/>`;
  const pics = p => !p ? '' : [p.cover, ...(p.images || [])].filter(Boolean).slice(0, 20).map(i => `<image:image><image:loc>${x(new URL(imgURL(i), SITE).href)}</image:loc></image:image>`).join('');
  const urls = pages.flatMap(([path, p]) => ['fr', 'en'].map(l => `<url><loc>${x(full(path, l))}</loc>${alt(path)}${pics(p)}</url>`));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
