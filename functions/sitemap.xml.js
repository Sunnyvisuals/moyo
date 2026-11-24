/* /sitemap.xml, from the published data: every page, project and person, with their pictures. */
import { getData } from './_lib/store.js';
import { SITE, abs, esc } from '../shared/seo.js';

export async function onRequestGet({ env }) {
  const data = await getData(env);
  const url = (path, imgs = []) => `<url><loc>${SITE}${path}</loc>${imgs.filter(Boolean).map(i => `<image:image><image:loc>${esc(abs(i))}</image:loc></image:image>`).join('')}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[url('/', ['/og.png']), url('/projets'),
  ...(data.projects || []).map(p => url('/projets/' + encodeURIComponent(p.id), [p.cover, ...(p.images || [])])),
  ...(data.team || []).map(m => url('/equipe/' + encodeURIComponent(m.id), [m.photo]))].join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
