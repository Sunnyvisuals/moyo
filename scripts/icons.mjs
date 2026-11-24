/* Draws the icons of the site (assets/icons) and cuts the pictures of the start for a preview (assets/og). Run once, the results are in the repository:
   node scripts/icons.mjs   (needs sharp, which comes with wrangler) */
import fs from 'node:fs';
import sharp from 'sharp';

fs.mkdirSync('assets/icons', { recursive: true }); fs.mkdirSync('assets/og', { recursive: true });
/* the dot on its paper: rounded for a browser tab, square (the system rounds it) for a phone */
const svg = (n, r, dot) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n}" height="${n}"><rect width="${n}" height="${n}" rx="${r}" fill="#F5F4F0"/><circle cx="${n / 2}" cy="${n / 2}" r="${dot}" fill="#002FA7"/></svg>`;
fs.writeFileSync('assets/icons/favicon.svg', svg(48, 10, 11));
const png = (n, r, dot) => sharp(Buffer.from(svg(n, r, dot)), { density: 144 }).resize(n, n).png({ compressionLevel: 9 }).toBuffer();
for (const n of [192, 512]) fs.writeFileSync(`assets/icons/icon-${n}.png`, await png(n, 0, n * .23));
fs.writeFileSync('assets/icons/apple-touch-icon.png', await png(180, 0, 41));
/* .ico: one 48 px PNG in its container */
const p = await png(48, 10, 11), h = Buffer.alloc(22); h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4); h[6] = 48; h[7] = 48; h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(p.length, 14); h.writeUInt32LE(22, 18);
fs.writeFileSync('assets/icons/favicon.ico', Buffer.concat([h, p]));
const TOP = { '1.jpg': .05 }; // where the subject is, when it is not found by itself
for (const f of fs.readdirSync('assets/proj').filter(f => f.endsWith('.jpg'))) {
  let im = sharp('assets/proj/' + f); const m = await im.metadata(), h = Math.round(m.width * 630 / 1200);
  if (f in TOP) im = im.extract({ left: 0, top: Math.round((m.height - h) * TOP[f]), width: m.width, height: h });
  await im.resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 82, mozjpeg: true }).toFile('assets/og/' + f);
}
console.log(fs.readdirSync('assets/icons').join(' '), '|', fs.readdirSync('assets/og').join(' '));
