/* Build the static site into dist/ (what Cloudflare Pages serves):
     src/index.src.html   -> dist/index.html        (home)
     src/projets.src.html -> dist/projets.html      (every project, filtered by category)
     src/admin.html       -> dist/admin/index.html  (admin, talks to functions/api)
     src/*.js             -> dist/*.js              (behaviour, one file per job)
   Tokens, type, grid and components: shared/design.js. Header, menu and footer: shared/chrome.js.
   Project lists are pre-rendered from data/projects.json (the seed). Once the admin saves, functions/_middleware.js
   re-renders them from KV on each request. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const r = p => path.join(root, p);
const read = p => fs.readFileSync(r(p), 'utf8');
const out = (p, s) => { fs.mkdirSync(path.dirname(r(p)), { recursive: true }); fs.writeFileSync(r(p), s); return s.length; };
const fill = (s, map) => Object.entries(map).reduce((acc, [k, v]) => acc.split(k).join(v), s);

const { rowsHTML, featuredOf, dataJSON } = await import(pathToFileURL(r('shared/render.js')).href);
const { DESIGN_CSS, sheetHTML, headCommon, scripts } = await import(pathToFileURL(r('shared/design.js')).href);
const { CHROME_CSS, chromeHead, FOOTER_CSS, GLASS_CSS, footerHTML, teamRows } = await import(pathToFileURL(r('shared/chrome.js')).href);
const { SITE, metaTags, homeLD, ldScript, websiteLD, orgLD, breadcrumbLD } = await import(pathToFileURL(r('shared/seo.js')).href);
const seed = JSON.parse(read('data/projects.json'));
const renderSrc = read('shared/render.js').replace(/^export \{[^}]*\};?\s*$/m, '');
if (/^\s*export\b/m.test(renderSrc)) throw new Error('shared/render.js: keep `export` on the last line only');

const CSS = DESIGN_CSS + CHROME_CSS + FOOTER_CSS + GLASS_CSS;
const lenis = read('vendor/lenis.min.js').replace('//# sourceMappingURL=lenis.min.js.map', '');
/* a service that has projects leads to them */
const services = html => html.replace(/<a class="la" data-cat="([^"]+)"/g, (m, c) => seed.projects.some(p => p.category === c) ? `${m} href="/projets?cat=${c}"` : m);
const common = { __HEAD__: headCommon, __CSS__: CSS, __DATA__: dataJSON(seed), __SHEET__: sheetHTML, __SCRIPTS__: scripts };

fs.rmSync(r('dist'), { recursive: true, force: true });

const sizes = {
  'index.html': out('dist/index.html', services(fill(read('src/index.src.html'), {
    ...common,
    __META__: metaTags({ title: 'Moyo Studio · Agence créative en Provence-Alpes-Côte d’Azur', desc: 'Moyo, agence créative indépendante basée en Provence-Alpes-Côte d’Azur : direction artistique, identités, sites immersifs, données, audiovisuel et campagnes, à partir d’une seule idée.', path: '/' }),
    __LD__: homeLD(seed, featuredOf(seed)),
    __CHROME_HEAD__: chromeHead(0, { land: true }),
    __ROWS__: rowsHTML(featuredOf(seed), 'fr'),
    __TEAM__: teamRows(seed.team),
    __FOOTER__: footerHTML(seed.team, { home: true })
  }))),
  'projets.html': out('dist/projets.html', fill(read('src/projets.src.html'), {
    ...common,
    __META__: metaTags({ title: 'Projets · Moyo Studio', desc: 'Tous les projets de Moyo, agence créative basée en Provence-Alpes-Côte d’Azur, par catégorie : direction artistique, identités, sites, données, motion, audiovisuel, communication et print.', path: '/projets' }),
    __LD__: ldScript(websiteLD(), orgLD(seed), { '@type': 'CollectionPage', name: 'Projets', url: SITE + '/projets', isPartOf: { '@id': SITE + '/#site' } }, breadcrumbLD([['Accueil', '/'], ['Projets', '/projets']])),
    __CHROME_HEAD__: chromeHead(1),
    __ROWS__: rowsHTML(seed.projects, 'fr'),
    __FOOTER__: footerHTML(seed.team)
  })),
  '404.html': out('dist/404.html', fill(read('src/404.src.html'), { ...common, __CHROME_HEAD__: chromeHead(0), __FOOTER__: footerHTML(seed.team) })),
  'admin/index.html': out('dist/admin/index.html', read('src/admin.html')),
  'robots.txt': out('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`), // sitemap.xml and llms.txt: functions/
  'site.js': out('dist/site.js', fill(read('src/site.js'), { __RENDER__: renderSrc }))
};
/* behaviour: one file per job */
const RUNTIME = { chrome: 'chrome-rt', footer: 'footer-rt', glass: 'glass-rt', stage: 'stage', reveal: 'reveal', roll: 'roll', leave: 'leave', cursor: 'cursor', load: 'load', path: 'path', eyes: 'eyes', method: 'method', weight: 'weight', stack: 'stack', ink: 'ink', trades: 'trades', play: 'play' };
for (const [to, from] of Object.entries(RUNTIME)) out(`dist/${to}.js`, read(`src/${from}.js`));
out('dist/lenis.js', lenis);
fs.copyFileSync(r('assets/og.png'), r('dist/og.png')); // image shown when the site is shared
fs.mkdirSync(r('dist/proj'), { recursive: true });
for (const n of fs.readdirSync(r('assets/proj'))) fs.copyFileSync(r('assets/proj/' + n), r('dist/proj/' + n));
fs.mkdirSync(r('dist/fonts'), { recursive: true });
fs.copyFileSync(r('fonts/hanken-grotesk-latin-wght-normal.woff2'), r('dist/fonts/hanken-grotesk.woff2'));

for (const [k, v] of Object.entries(sizes)) console.log(`dist/${k}`.padEnd(24), (v / 1024).toFixed(1), 'Ko');
for (const f of ['index.html', 'projets.html', '404.html', 'site.js']) {
  const left = fs.readFileSync(r('dist/' + f), 'utf8').match(/__[A-Z_]+__/g);
  if (left) throw new Error(`markers left in ${f}: ${left.join(', ')}`);
}
