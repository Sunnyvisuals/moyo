/* Build the static site into dist/ (what Cloudflare Pages serves):
     src/index.src.html   -> dist/index.html        (self-contained: font + Lenis inlined, as before)
     src/projets.src.html -> dist/projets.html      (all projects, filtered by category)
     src/admin.html       -> dist/admin/index.html  (admin, talks to functions/api)
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

const { rowsHTML, cardsHTML, featuredOf, dataJSON } = await import(pathToFileURL(r('shared/render.js')).href);
const seed = JSON.parse(read('data/projects.json'));
const renderSrc = read('shared/render.js').replace(/^export \{[^}]*\};?\s*$/m, '');
if (/^\s*export\b/m.test(renderSrc)) throw new Error('shared/render.js: keep `export` on the last line only');

const font = fs.readFileSync(r('fonts/hanken-grotesk-latin-wght-normal.woff2'));
const lenis = read('vendor/lenis.min.js').replace('//# sourceMappingURL=lenis.min.js.map', '');
if (lenis.includes('</script')) throw new Error('lenis contains </script');

fs.rmSync(r('dist'), { recursive: true, force: true });

const sizes = {
  'index.html': out('dist/index.html', fill(read('src/index.src.html'), {
    __FONT__: font.toString('base64'),
    __LENIS__: lenis,
    __RENDER__: renderSrc,
    __ROWS__: cardsHTML(featuredOf(seed), 'fr'),
    __DATA__: dataJSON(seed)
  })),
  'projets.html': out('dist/projets.html', fill(read('src/projets.src.html'), {
    __RENDER__: renderSrc,
    __ROWS__: rowsHTML(seed.projects, 'fr'),
    __DATA__: dataJSON(seed)
  })),
  'admin/index.html': out('dist/admin/index.html', read('src/admin.html')),
  'robots.txt': out('dist/robots.txt', 'User-agent: *\nDisallow: /admin\nDisallow: /api/\n')
};
out('dist/cursor.js', read('src/cursor.js'));
fs.mkdirSync(r('dist/fonts'), { recursive: true });
fs.copyFileSync(r('fonts/hanken-grotesk-latin-wght-normal.woff2'), r('dist/fonts/hanken-grotesk.woff2'));

for (const [k, v] of Object.entries(sizes)) console.log(`dist/${k}`.padEnd(24), (v / 1024).toFixed(1), 'Ko');
const left = fs.readFileSync(r('dist/index.html'), 'utf8').match(/__[A-Z]+__/g);
if (left) throw new Error('markers left in index.html: ' + left.join(', '));
