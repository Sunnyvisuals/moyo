// The brand files of moyo (marque/), drawn from the site's own font, colours and shapes: profile pictures, banners, Instagram templates, highlight covers, logos.
// node scripts/marque.mjs marque      (needs Playwright and Chrome: npm i -D playwright, outside the site's dependencies)
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const OUT = path.resolve(process.argv[2] || 'out'); fs.mkdirSync(OUT, { recursive: true });
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..'); // the root of the site
const FONT = pathToFileURL(path.join(ROOT, 'fonts/hanken-grotesk-latin-wght-normal.woff2')).href, PROJ = n => pathToFileURL(path.join(ROOT, 'assets/proj', n)).href;
const INK = '#121214', PAPER = '#FAFAF8', KLEIN = '#002FA7', MUTE = '#65656B';

/* the eye: the o of moyo, its pupil is the dot, looking down at the page. 16 / 10 / 6 units, the pupil 2 units off the centre (scripts/icons.mjs) */
const eye = (cx, cy, R, dark) => { const u = R / 16; return dark
  ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${PAPER}"/><circle cx="${cx + 2 * u}" cy="${cy + 2 * u}" r="${10 * u}" fill="${KLEIN}"/>` // on ink the ring would be lost: the eye is the white of the paper
  : `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${INK}"/><circle cx="${cx}" cy="${cy}" r="${10 * u}" fill="${PAPER}"/><circle cx="${cx + 2 * u}" cy="${cy + 2 * u}" r="${6 * u}" fill="${KLEIN}"/>`; };

const head = (w, h, bg = PAPER, extra = '') => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:"Hanken Grotesk";src:url(${FONT}) format("woff2");font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px}
body{position:relative;overflow:hidden;background:${bg};color:${INK};font-family:"Hanken Grotesk",system-ui,sans-serif;-webkit-font-smoothing:antialiased;font-kerning:normal}
.t{font-weight:700;letter-spacing:-.05em;line-height:.94;text-wrap:balance}
.k{color:${KLEIN}}.w{color:${PAPER}}.mute{color:${MUTE}}
.d{display:inline-block;width:.155em;height:.155em;margin-left:.075em;border-radius:50%;background:${KLEIN}}
.d.w{background:${PAPER}}
.lead{font-weight:600;letter-spacing:-.024em;line-height:1.3}
.mark{position:absolute;font-weight:700;letter-spacing:-.055em;line-height:1;white-space:nowrap}
.pu{position:absolute;border-radius:50%;background:${KLEIN}}
${extra}</style>`;

/* in the page: fit a block of words into a box (largest size, no word alone on a line but the last), and put the pupils in the o of a wordmark */
const TOOLS = `<script>
window.fit = (el, W, H, lo = 12, hi = 600) => { const words = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n; (n = tw.nextNode());) { let i = 0; for (const w of n.data.split(' ')) { if (w.trim()) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length); words.push(r); } i += w.length + 1; } }
  const alone = f => { const rows = []; words.forEach(r => { const t = Math.round(r.getClientRects()[0]?.top ?? 0), o = rows.find(q => Math.abs(q.t - t) < f * .3); if (o) o.n++; else rows.push({ t, n: 1 }); }); return rows.slice(0, -1).some(q => q.n < 2); };
  const all = document.createRange(); all.selectNodeContents(el);
  const ok = f => { el.style.fontSize = f + 'px'; if (el.offsetHeight > H) return false; const a = el.getBoundingClientRect(), b = all.getBoundingClientRect(); return b.right <= a.left + W + 1 && !alone(f); };
  el.style.width = W + 'px'; for (let i = 0; i < 18 && hi - lo > .5; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } el.style.fontSize = Math.floor(lo) + 'px'; return Math.floor(lo); };
window.pupils = (el, angle = .8, reach = 1) => { const size = parseFloat(getComputedStyle(el).fontSize), S = 800, cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  cv.width = S * 4; cv.height = S * 2; g.font = '700 ' + S + 'px "Hanken Grotesk"'; g.letterSpacing = (-.055 * S) + 'px'; const X0 = S * .3, Y0 = S * 1.2; g.fillText('moyo', X0, Y0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data, on = (x, y) => d[((y | 0) * cv.width + (x | 0)) * 4 + 3] > 110;
  const mid = Y0 - S * .262, runs = []; let s = -1; for (let x = X0; x < cv.width; x++) { const v = on(x, mid); if (!v && s >= 0) continue; if (!v && s < 0) { s = x; continue; } if (v && s >= 0) { runs.push([s, x]); s = -1; } }
  const holes = runs.filter(r => { const cx = (r[0] + r[1]) / 2; let up = 0, dn = 0; while (up < S * .5 && !on(cx, mid - up)) up++; while (dn < S * .5 && !on(cx, mid + dn)) dn++; r.up = up; r.dn = dn; return up < S * .5 && dn < S * .5 && r[1] - r[0] > S * .08; }).slice(-2);
  const t = el.firstChild, rg = document.createRange(); rg.setStart(t, 0); rg.setEnd(t, 1); const L = rg.getBoundingClientRect().left, pr = document.createElement('i'); pr.style.cssText = 'display:inline-block;width:0;height:0'; el.appendChild(pr); const base = pr.getBoundingClientRect().bottom; pr.remove();
  const box = el.offsetParent.getBoundingClientRect(), k = size / S;
  holes.forEach(r => { const rx = (r[1] - r[0]) / 2 * k, ry = (r.up + r.dn) / 2 * k, cx = L + ((r[0] + r[1]) / 2 - X0) * k, cy = base + (mid + (r.dn - r.up) / 2 - Y0) * k, R = Math.min(rx, ry) * .6, p = document.createElement('i');
    p.className = 'pu'; p.style.cssText = 'width:' + R * 2 + 'px;height:' + R * 2 + 'px;left:' + (cx - box.left - R + Math.cos(angle) * (rx - R) * .86 * reach) + 'px;top:' + (cy - box.top - R + Math.sin(angle) * (ry - R) * .9 * reach) + 'px'; el.offsetParent.appendChild(p); });
  return holes.length; };
</script>`;

const SENT = `Moyo dessine des images, des sites et des films à&nbsp;partir <span class="k">d’une seule&nbsp;idée</span><i class="d"></i>`;
const A = []; // [file, w, h, html, after(page)]
const add = (file, w, h, html, run = '') => A.push({ file, w, h, html, run });

/* ---------- profile pictures (1080, shown in a circle) ---------- */
add('profil/moyo-profil-oeil.png', 1080, 1080, head(1080, 1080) + `<svg width="1080" height="1080" viewBox="0 0 1080 1080">${eye(540, 540, 371.5)}</svg>`);
add('profil/moyo-profil-oeil-encre.png', 1080, 1080, head(1080, 1080, INK) + `<svg width="1080" height="1080" viewBox="0 0 1080 1080">${eye(540, 540, 371.5, true)}</svg>`);
add('profil/moyo-profil-mot.png', 1080, 1080, head(1080, 1080) + TOOLS + `<div class="mark" id="m" style="font-size:330px">moyo</div>`,
  `const m=document.getElementById('m');const r=m.getBoundingClientRect();m.style.left=(540-r.width/2-m.offsetWidth*0)+'px';m.style.top=(540-r.height*.62)+'px';pupils(m,.8)`);

/* ---------- banners: the sentence, set like the first screen, clear of where each site puts the profile picture ---------- */
const banner = (file, w, h, box) => add(file, w, h, head(w, h) + TOOLS + `<p class="t" id="s" style="position:absolute;left:${box[0]}px;top:${box[1]}px">${SENT}</p>`,
  `const s=document.getElementById('s');fit(s,${box[2]},${box[3]});s.style.top=(${box[1]}+${box[3]}-s.offsetHeight)+'px'`);
banner('bannieres/linkedin-1584x396.png', 1584, 396, [460, 62, 1060, 272]);
banner('bannieres/x-1500x500.png', 1500, 500, [430, 70, 1010, 330]);
banner('bannieres/facebook-1640x624.png', 1640, 624, [250, 120, 1140, 384]);
banner('bannieres/youtube-2560x1440.png', 2560, 1440, [507, 539, 1546, 362]);
/* the other one: the wordmark that looks back, as at the end of the site; the tail of the y cut by the edge */
const mono = (file, w, h, x, width, base, angle) => add(file, w, h, head(w, h) + TOOLS + `<div class="mark" id="m" style="font-size:100px">moyo</div>`,
  `const m=document.getElementById('m');const r0=m.getBoundingClientRect().width;m.style.fontSize=(100*${width}/r0)+'px';const pr=document.createElement('i');pr.style.cssText='display:inline-block;width:0;height:0';m.appendChild(pr);const b=pr.getBoundingClientRect().bottom;pr.remove();m.style.left='${x}px';m.style.top=(${base}-b)+'px';pupils(m,${angle})`);
mono('bannieres/linkedin-1584x396-mot.png', 1584, 396, 470, 1050, 352, -2.5);
mono('bannieres/x-1500x500-mot.png', 1500, 500, 430, 1010, 446, -2.5);

/* ---------- Instagram: posts (1080 x 1350), stories (1080 x 1920), highlight covers ---------- */
add('instagram/post-projet.png', 1080, 1350, head(1080, 1350) + TOOLS + `<style>.img{position:absolute;left:0;top:0;width:1080px;height:880px;background:url(${PROJ('3.jpg')}) 50% 40%/cover;filter:grayscale(1)}</style>
<div class="img"></div><p class="t" id="t" style="position:absolute;left:72px;top:952px;font-size:118px">Villa Chaux<i class="d"></i></p>
<p class="lead mute" style="position:absolute;left:72px;top:1108px;font-size:36px">Identité et site<br>Cap Ferrat, 2025</p><p class="lead" style="position:absolute;right:72px;top:1196px;font-size:36px">moyo</p>`);
add('instagram/post-phrase.png', 1080, 1350, head(1080, 1350) + TOOLS + `<p class="lead" style="position:absolute;left:72px;top:72px;font-size:34px">Studio créatif indépendant<br><span class="mute">Provence-Alpes-Côte d’Azur</span></p><p class="t" id="s" style="position:absolute;left:66px;top:300px">${SENT}</p>`,
  `const s=document.getElementById('s');fit(s,948,960);s.style.top=(1278-s.offsetHeight)+'px'`);
add('instagram/post-methode.png', 1080, 1350, head(1080, 1350) + `<p class="lead mute" style="position:absolute;left:72px;top:72px;font-size:34px">Méthode</p>
<p class="t" style="position:absolute;left:66px;bottom:66px;font-size:150px;line-height:1.02">Écouter<i class="d"></i><br>Choisir<i class="d"></i><br>Construire<i class="d"></i><br>Accompagner<i class="d"></i></p>`);
add('instagram/post-question.png', 1080, 1350, head(1080, 1350) + `<p class="lead" style="position:absolute;left:72px;top:72px;font-size:34px">Écrivez-nous<br><span class="mute">contact.moyostudio@gmail.com</span></p>
<p class="t" style="position:absolute;left:66px;bottom:66px;width:948px;font-size:200px">Quelle est votre idée&nbsp;<span class="k">?</span></p>`);
add('instagram/story-projet.png', 1080, 1920, head(1080, 1920, INK) + `<style>.img{position:absolute;inset:0;background:url(${PROJ('2.jpg')}) 50% 30%/cover;filter:grayscale(1)}.img::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgb(18 18 20 / .86),rgb(18 18 20 / .5) 30%,rgb(18 18 20 / 0) 58%)}</style>
<div class="img"></div><p class="lead w" style="position:absolute;left:72px;top:180px;font-size:38px">Nouveau projet</p>
<p class="t w" style="position:absolute;left:66px;bottom:380px;font-size:150px;width:950px">Port Hercule à l’échelle<i class="d w"></i></p>
<p class="lead w" style="position:absolute;left:72px;bottom:270px;font-size:38px;opacity:.78">Site interactif, Monaco, 2026</p>`);
add('instagram/story-question.png', 1080, 1920, head(1080, 1920) + `<p class="lead" style="position:absolute;left:72px;top:250px;font-size:38px">Écrivez-nous<br><span class="mute">contact.moyostudio@gmail.com</span></p>
<p class="t" style="position:absolute;left:66px;bottom:300px;width:948px;font-size:180px">Quelle est votre idée&nbsp;<span class="k">?</span></p>`);
/* highlight covers: one sign each, inside the circle Instagram keeps */
const cover = (file, body) => add(file, 1080, 1920, head(1080, 1920) + `<svg width="1080" height="1920" viewBox="0 0 1080 1920">${body}</svg>`);
cover('instagram/une-projets.png', `<circle cx="540" cy="960" r="150" fill="${KLEIN}"/>`);
cover('instagram/une-studio.png', eye(540, 960, 230));
cover('instagram/une-methode.png', `<rect x="533" y="730" width="14" height="460" rx="7" fill="${INK}" opacity=".24"/><circle cx="540" cy="1036" r="62" fill="${KLEIN}"/>`); // the way of the site: one line, one dot
add('instagram/une-contact.png', 1080, 1920, head(1080, 1920) + `<p class="t k" style="position:absolute;left:0;right:0;top:960px;transform:translateY(-55%);text-align:center;font-size:520px;letter-spacing:0">?</p>`);

/* ---------- logos ---------- */
const logo = (file, w, h, color, bg) => add(file, w, h, head(w, h, bg || 'transparent', `.mark{color:${color}}`) + TOOLS + `<div class="mark" id="m" style="font-size:100px">moyo</div>`,
  `const m=document.getElementById('m');const r0=m.getBoundingClientRect();m.style.fontSize=(100*${w * .86}/r0.width)+'px';const r=m.getBoundingClientRect();m.style.left=(${w / 2}-r.width/2)+'px';const pr=document.createElement('i');pr.style.cssText='display:inline-block;width:0;height:0';m.appendChild(pr);const b=pr.getBoundingClientRect().bottom;pr.remove();m.style.top=(${h * .66}-b)+'px';pupils(m,.8)`);
logo('logo/moyo-logo-encre.png', 4000, 1800, INK);
logo('logo/moyo-logo-papier.png', 4000, 1800, PAPER);
add('logo/moyo-oeil.png', 2048, 2048, head(2048, 2048, 'transparent') + `<svg width="2048" height="2048" viewBox="0 0 2048 2048">${eye(1024, 1024, 1024)}</svg>`);
add('logo/moyo-oeil-encre.png', 2048, 2048, head(2048, 2048, 'transparent') + `<svg width="2048" height="2048" viewBox="0 0 2048 2048">${eye(1024, 1024, 1024, true)}</svg>`);

/* ---------- draw ---------- */
const b = await chromium.launch({ channel: 'chrome' }), page = await (await b.newContext({ deviceScaleFactor: 1 })).newPage(), only = process.env.ONLY;
for (const a of A) { if (only && !a.file.includes(only)) continue;
  await page.setViewportSize({ width: a.w, height: a.h }); const tmp = path.join(OUT, '_page.html'); fs.writeFileSync(tmp, a.html); await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.load('700 100px "Hanken Grotesk"', 'moyo')); await page.evaluate(() => document.fonts.ready); if (a.run) await page.evaluate(a.run); await page.waitForTimeout(150);
  const f = path.join(OUT, a.file); fs.mkdirSync(path.dirname(f), { recursive: true }); await page.screenshot({ path: f, omitBackground: /transparent/.test(a.html.slice(0, 900)) && a.file.startsWith('logo/') });
  console.log(a.file, a.w + 'x' + a.h); }
/* the eye as vectors: circles only, exact */
for (const [n, dark] of [['moyo-oeil.svg', false], ['moyo-oeil-encre.svg', true]]) fs.writeFileSync(path.join(OUT, 'logo', n), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512">${eye(16, 16, 16, dark)}</svg>\n`);
/* the wordmark as vectors: a PDF (the font goes in it, the letters stay true), and an SVG that carries the font */
const W = 2000, H = 900; await page.setViewportSize({ width: W, height: H }); const tmp = path.join(OUT, '_page.html');
fs.writeFileSync(tmp, head(W, H, 'transparent') + TOOLS + `<div class="mark" id="m" style="font-size:100px">moyo</div>`); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.load('700 100px "Hanken Grotesk"', 'moyo'));
const geo = await page.evaluate(([W, H]) => { const m = document.getElementById('m'), r0 = m.getBoundingClientRect(); m.style.fontSize = (100 * W * .86 / r0.width) + 'px'; const r = m.getBoundingClientRect(); m.style.left = (W / 2 - r.width / 2) + 'px'; const pr = document.createElement('i'); pr.style.cssText = 'display:inline-block;width:0;height:0'; m.appendChild(pr); const b = pr.getBoundingClientRect().bottom; pr.remove(); m.style.top = (H * .66 - b) + 'px'; pupils(m, .8);
  const t = m.firstChild, rg = document.createRange(); rg.setStart(t, 0); rg.setEnd(t, 1); return { size: parseFloat(m.style.fontSize), x: rg.getBoundingClientRect().left, base: H * .66, pupils: [...document.querySelectorAll('.pu')].map(p => [p.offsetLeft + p.offsetWidth / 2, p.offsetTop + p.offsetHeight / 2, p.offsetWidth / 2]) }; }, [W, H]);
await page.pdf({ path: path.join(OUT, 'logo/moyo-logo.pdf'), width: W + 'px', height: H + 'px', printBackground: false, pageRanges: '1' });
const font = fs.readFileSync(path.join(ROOT, 'fonts/hanken-grotesk-latin-wght-normal.woff2')).toString('base64');
fs.writeFileSync(path.join(OUT, 'logo/moyo-logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><style>@font-face{font-family:"Hanken Grotesk";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900}</style><text x="${geo.x.toFixed(1)}" y="${geo.base.toFixed(1)}" font-family="Hanken Grotesk" font-weight="700" font-size="${geo.size.toFixed(1)}" letter-spacing="${(-.055 * geo.size).toFixed(2)}" fill="${INK}">moyo</text>${geo.pupils.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${KLEIN}"/>`).join('')}</svg>\n`);
fs.rmSync(tmp, { force: true }); await b.close(); console.log('fini');
