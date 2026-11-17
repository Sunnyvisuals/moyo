// Rend un build Astro navigable sans serveur (aperçu artefact) : chemins absolus → relatifs,
// liens de dossier → index.html. Usage : node scripts/relativize.mjs dist-preview
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';
const dir = process.argv[2] || 'dist-preview';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(dir);
const fix = (url, fromFile) => {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  const m = url.match(/^([^?#]*)(.*)$/);
  let path = m[1], rest = m[2];
  if (path.endsWith('/')) path += 'index.html';
  else if (!posix.basename(path).includes('.')) path += '/index.html';
  let rel = relative(dirname(fromFile), join(dir, path)).split('\\').join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel + rest;
};
for (const f of files) {
  if (f.endsWith('.html')) {
    let s = readFileSync(f, 'utf8');
    s = s.replace(/(\s(?:href|src|action|poster))="(\/[^"]*)"/g, (_, a, u) => `${a}="${fix(u, f)}"`);
    s = s.replace(/\ssrcset="([^"]*)"/g, (_, v) => ` srcset="${v.split(',').map((p) => { const [u, w] = p.trim().split(/\s+/); return `${fix(u, f)}${w ? ' ' + w : ''}`; }).join(', ')}"`);
    s = s.replace(/url\((\/[^)]+)\)/g, (_, u) => `url(${fix(u, f)})`);
    writeFileSync(f, s);
  } else if (f.endsWith('.css')) {
    let s = readFileSync(f, 'utf8');
    s = s.replace(/url\((\/[^)]+)\)/g, (_, u) => `url(${fix(u, f)})`);
    writeFileSync(f, s);
  }
}
console.log('relativized', files.length, 'files');
