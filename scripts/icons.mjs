/* Draws the icons of the site (assets/icons) and cuts the pictures of the start for a preview (assets/og). Run once, the results are in the repository:
   node scripts/icons.mjs   (needs sharp, which comes with wrangler) */
import fs from 'node:fs';
import sharp from 'sharp';

fs.mkdirSync('assets/icons', { recursive: true }); fs.mkdirSync('assets/og', { recursive: true });
/* The eye: the o of moyo, its pupil is the dot, and it looks down at the page (in a tab, the page is below and on the right). 32 units: 16 / 10 / 6, the pupil
   2 units off the centre, so that every edge falls on a pixel of a 16 px tab. In a dark tab the ring would be lost: the eye is the white of the paper. */
const INK = '#121214', PAPER = '#FAFAF8', KLEIN = '#002FA7';
const eye = (c, R, u = R / 16) => `<circle cx="${c}" cy="${c}" r="${R}" fill="${INK}"/><circle cx="${c}" cy="${c}" r="${10 * u}" fill="${PAPER}"/><circle cx="${c + 2 * u}" cy="${c + 2 * u}" r="${6 * u}" fill="${KLEIN}"/>`;
const svg = (n, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n}" height="${n}">${body}</svg>`;
fs.writeFileSync('assets/icons/favicon.svg', svg(32, '<style>@media (prefers-color-scheme:dark){.o{fill:#FAFAF8}.p{r:10px}}</style>' + eye(16, 16).replace('<circle', '<circle class="o"').replace(/<circle(?=[^>]*#002FA7)/, '<circle class="p"')));
const png = (n, body, v = n) => sharp(Buffer.from(svg(v, body)), { density: 72 * n / v }).resize(n, n).png({ compressionLevel: 9 }).toBuffer();
/* phones: on its paper, square (the system rounds it), inside what a round mask keeps */
const tile = n => `<rect width="${n}" height="${n}" fill="${PAPER}"/>${eye(n / 2, n * .344)}`;
for (const n of [192, 512]) fs.writeFileSync(`assets/icons/icon-${n}.png`, await png(n, tile(n)));
fs.writeFileSync('assets/icons/apple-touch-icon.png', await png(180, tile(180)));
/* .ico: 16, 32 and 48 px, each one a PNG */
const ICO = [16, 32, 48], pics = []; for (const n of ICO) pics.push(await png(n, eye(16, 16), 32));
const h = Buffer.alloc(6 + 16 * ICO.length); h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(ICO.length, 4);
let at = h.length; ICO.forEach((n, i) => { const o = 6 + 16 * i; h[o] = n; h[o + 1] = n; h.writeUInt16LE(1, o + 4); h.writeUInt16LE(32, o + 6); h.writeUInt32LE(pics[i].length, o + 8); h.writeUInt32LE(at, o + 12); at += pics[i].length; });
fs.writeFileSync('assets/icons/favicon.ico', Buffer.concat([h, ...pics]));
const TOP = { '1.jpg': .05 }; // where the subject is, when it is not found by itself
for (const f of fs.readdirSync('assets/proj').filter(f => f.endsWith('.jpg'))) {
  let im = sharp('assets/proj/' + f); const m = await im.metadata(), h = Math.round(m.width * 630 / 1200);
  if (f in TOP) im = im.extract({ left: 0, top: Math.round((m.height - h) * TOP[f]), width: m.width, height: h });
  await im.resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 82, mozjpeg: true }).toFile('assets/og/' + f);
}
console.log(fs.readdirSync('assets/icons').join(' '), '|', fs.readdirSync('assets/og').join(' '));
