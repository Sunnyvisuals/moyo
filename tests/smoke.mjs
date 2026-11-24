/* Smoke test of the running site: every page answers, no script error, no broken image or internal link,
   SEO basics (one h1, title, description, canonical, JSON-LD), axe-core accessibility (serious and critical only),
   the project sheet opens and closes, the filters work.
     npm run dev            (in another terminal)
     npm test               (or: BASE=https://moyo-d0n.pages.dev npm test) */
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // npm i -D playwright, if it is not installed globally
const BASE = process.env.BASE || 'http://localhost:8788';
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const seed = JSON.parse(fs.readFileSync(new URL('../data/projects.json', import.meta.url)));
const PAGES = ['/', '/projets', `/projets/${seed.projects[0].id}`, `/equipe/${seed.team[0].id}`];
let fails = 0;
const fail = (...a) => { fails++; console.log('  ✗', ...a); };

const br = await chromium.launch();
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const path of PAGES) {
    const pg = await br.newPage({ viewport, locale: 'fr-FR' });
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('response', r => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
    const res = await pg.goto(BASE + path, { waitUntil: 'networkidle' });
    console.log(viewport.width, path, res.status());
    if (res.status() !== 200) fail('status', res.status());
    const H = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 700) { await pg.evaluate(y => scrollTo(0, y), y); await pg.waitForTimeout(40); }
    await pg.waitForTimeout(300);
    const seo = await pg.evaluate(() => ({
      h1: document.querySelectorAll('h1').length, title: document.title, desc: document.querySelector('meta[name=description]')?.content || '',
      canon: !!document.querySelector('link[rel=canonical]'), ld: [...document.querySelectorAll('script[type="application/ld+json"]')].every(s => { try { JSON.parse(s.textContent); return true; } catch { return false; } }) && !!document.querySelector('script[type="application/ld+json"]'),
      noAlt: document.querySelectorAll('img:not([alt])').length, broken: [...document.querySelectorAll('img')].filter(i => i.complete && !i.naturalWidth).map(i => i.src),
      wide: document.documentElement.scrollWidth > innerWidth + 1,
      links: [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href').split('#')[0]).filter(Boolean)
    }));
    if (seo.h1 !== 1) fail('h1 count', seo.h1);
    if (!seo.title || seo.desc.length < 50 || !seo.canon || !seo.ld) fail('seo', JSON.stringify({ ...seo, links: undefined }));
    if (seo.noAlt || seo.broken.length) fail('images', seo.noAlt, seo.broken);
    if (seo.wide) fail('horizontal scroll');
    for (const l of new Set(seo.links)) { const r = await fetch(BASE + l, { redirect: 'manual' }); if (r.status >= 400) fail('link', l, r.status); }
    await pg.addScriptTag({ content: axe });
    const v = await pg.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.filter(x => ['serious', 'critical'].includes(x.impact)).map(x => `${x.id} (${x.nodes.length})`));
    if (v.length) fail('axe', v.join(', '));
    if (errs.length) fail('errors', errs.join(' | '));
    await pg.close();
  }
}
/* interactions */
const pg = await br.newPage({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
await pg.goto(BASE + '/projets', { waitUntil: 'networkidle' });
await pg.click('#projects .row'); await pg.waitForTimeout(1200);
if (!(await pg.evaluate(() => document.getElementById('proj').open && /projet=/.test(location.search)))) fail('sheet does not open');
await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(1200);
await pg.click('#pClose'); await pg.waitForTimeout(1500);
if (await pg.evaluate(() => document.getElementById('proj').open)) fail('sheet does not close');
const cat = seed.projects[0].category;
await pg.click(`#filters button[data-cat="${cat}"]`); await pg.waitForTimeout(800);
const shown = await pg.evaluate(() => [...document.querySelectorAll('#projects>li')].filter(l => !l.hidden).length);
if (shown !== seed.projects.filter(p => p.category === cat).length) fail('filter', cat, shown);
for (const u of ['/sitemap.xml', '/llms.txt', '/robots.txt']) { const r = await fetch(BASE + u); if (!r.ok) fail(u, r.status); }
await br.close();
console.log(fails ? `\n${fails} problème(s)` : '\nTout est bon.');
process.exit(fails ? 1 : 0);
