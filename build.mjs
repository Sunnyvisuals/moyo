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

const { rowsHTML, featuredOf, stepsHTML, tabsHTML, dataJSON } = await import(pathToFileURL(r('shared/render.js')).href);
const { DESIGN_CSS, sheetHTML, headCommon, scripts } = await import(pathToFileURL(r('shared/design.js')).href);
const { SITE, HOME, LIST, LOST, SERVICES, head, ldHome, ldList, sample } = await import(pathToFileURL(r('shared/seo.js')).href);
const { CHROME, CHROME_ARIA, FOOT_EN } = await import(pathToFileURL(r('shared/i18n.js')).href);
const { CHROME_CSS, chromeHead, FOOTER_CSS, GLASS_CSS, footerHTML, teamRows } = await import(pathToFileURL(r('shared/chrome.js')).href);
const seed = JSON.parse(read('data/projects.json'));
const renderSrc = read('shared/render.js').replace(/^export \{[^}]*\};?\s*$/m, '');
if (/^\s*export\b/m.test(renderSrc)) throw new Error('shared/render.js: keep `export` on the last line only');

const CSS = DESIGN_CSS + CHROME_CSS + FOOTER_CSS + GLASS_CSS;
const lenis = read('vendor/lenis.min.js').replace('//# sourceMappingURL=lenis.min.js.map', '');
/* a service that has projects leads to them */
const services = html => html.replace(/<a class="la" data-cat="([^"]+)"/g, (m, c) => seed.projects.some(p => p.category === c) ? `${m} href="/projets?cat=${c}"` : m);
/* what the structured data and llms.txt say is what the page says */
const homeSrc = read('src/index.src.html'), homeEN = JSON.parse(homeSrc.match(/id="en">([\s\S]*?)<\/script>/)[1]);
for (const [k, t] of SERVICES.map(s => [s[0], s[2]])) for (const [i, f] of [[0, 't'], [1, 'p']]) {
  const fr = (homeSrc.match(new RegExp(`data-i="${k}${f}">([^<]*)<`)) || [])[1], plain = x => String(x).replace(/&amp;/g, '&').replace(/&nbsp;| /g, ' ');
  if (plain(fr) !== plain(t.fr[i]) || homeEN[k + f] !== t.en[i]) throw new Error(`shared/seo.js and the page differ: ${k}${f}`);
}
const common = { __HEAD__: headCommon, __CSS__: CSS, __DATA__: dataJSON({ categories: seed.categories, projects: seed.projects }), __SHEET__: sheetHTML, __SCRIPTS__: scripts };

fs.rmSync(r('dist'), { recursive: true, force: true });

const sizes = {
  'index.html': out('dist/index.html', services(fill(homeSrc, {
    ...common,
    __META__: head({ path: '/', ...HOME.fr, ogTitle: 'Moyo Studio', ld: ldHome(seed.team) }),
    __CHROME_HEAD__: chromeHead(0, { land: true }),
    __ROWS__: rowsHTML(featuredOf(seed), 'fr'),
    __MTH_STEPS__: stepsHTML(seed.method),
    __MTH_TABS__: tabsHTML(seed.method),
    __TEAM__: teamRows(seed.team),
    __FOOTER__: footerHTML(seed.team, { home: true })
  }))),
  'projets.html': out('dist/projets.html', fill(read('src/projets.src.html'), {
    ...common,
    __META__: head({ path: '/projets', ...LIST.fr, ld: ldList(seed.projects.filter(p => !sample(p, seed))) }),
    __CHROME_HEAD__: chromeHead(1),
    __ROWS__: rowsHTML(seed.projects, 'fr'),
    __FOOTER__: footerHTML(seed.team)
  })),
  '404.html': out('dist/404.html', fill(read('src/404.src.html'), { ...common, __META__: head({ path: '/', ...LOST.fr, robots: 'noindex', alternates: false }), __CHROME_HEAD__: chromeHead(0), __FOOTER__: footerHTML(seed.team) })),
  'admin/index.html': out('dist/admin/index.html', read('src/admin.html')),
  // search engines, and the engines that answer (AI): same rules for all
  'robots.txt': out('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\n# Moteurs de réponse\n${['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'Bingbot', 'DuckAssistBot', 'MistralAI-User', 'Amazonbot', 'CCBot', 'meta-externalagent'].map(b => 'User-agent: ' + b).join('\n')}\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`),
  'site.webmanifest': out('dist/site.webmanifest', JSON.stringify({ name: 'Moyo Studio', short_name: 'moyo', description: HOME.fr.desc, lang: 'fr', start_url: '/', scope: '/', display: 'browser', background_color: '#FAFAF8', theme_color: '#FAFAF8', icons: [192, 512].map(n => ({ src: `/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png', purpose: 'any' })).concat({ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }) }, null, 1)),
  'site.js': out('dist/site.js', fill(read('src/site.js'), { __RENDER__: renderSrc }))
};
/* behaviour: one file per job */
const RUNTIME = { chrome: 'chrome-rt', footer: 'footer-rt', glass: 'glass-rt', stage: 'stage', reveal: 'reveal', roll: 'roll', leave: 'leave', cursor: 'cursor', load: 'load', path: 'path', eyes: 'eyes', method: 'method', weight: 'weight', stack: 'stack', ink: 'ink', trades: 'trades', play: 'play', divide: 'divide' };
const words = { __CHROME__: JSON.stringify(CHROME), __CHROME_ARIA__: JSON.stringify(CHROME_ARIA), __FOOT_EN__: JSON.stringify(FOOT_EN) };
for (const [to, from] of Object.entries(RUNTIME)) out(`dist/${to}.js`, fill(read(`src/${from}.js`), words));
out('dist/lenis.js', lenis);
for (const n of ['partage-2.png', 'partage.png', 'og.png']) fs.copyFileSync(r('assets/' + n), r('dist/' + n)); // image shown when the site is shared (the older ones stay, for links shared before)
for (const n of fs.readdirSync(r('assets/icons'))) fs.copyFileSync(r('assets/icons/' + n), r('dist/' + n));
fs.mkdirSync(r('dist/og'), { recursive: true });
for (const n of fs.readdirSync(r('assets/og'))) fs.copyFileSync(r('assets/og/' + n), r('dist/og/' + n)); // the projects of the start, cut for a preview
fs.mkdirSync(r('dist/proj'), { recursive: true });
for (const n of fs.readdirSync(r('assets/proj'))) fs.copyFileSync(r('assets/proj/' + n), r('dist/proj/' + n));
fs.mkdirSync(r('dist/fonts'), { recursive: true });
fs.copyFileSync(r('fonts/hanken-grotesk-latin-wght-normal.woff2'), r('dist/fonts/hanken-grotesk.woff2'));

for (const [k, v] of Object.entries(sizes)) console.log(`dist/${k}`.padEnd(24), (v / 1024).toFixed(1), 'Ko');
for (const f of ['index.html', 'projets.html', '404.html', 'site.js']) {
  const left = fs.readFileSync(r('dist/' + f), 'utf8').match(/__[A-Z_]+__/g);
  if (left) throw new Error(`markers left in ${f}: ${left.join(', ')}`);
}
