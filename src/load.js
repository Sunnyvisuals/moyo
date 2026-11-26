/* What opens a page (the class was chosen in the <head>):
   - html.load: first visit or reload. A number counts up where the title will be, followed by the dot. At 100 the number leaves and the dot
     draws the title, line after line, then stays as its final point ("Moyo dessine…").
   - html.enter: coming from a link of the site. The screen is blue (the dot opened on the click, see leave.js) and closes on the final point of the title.
   - On the home, the camera comes out of the point instead (pullBack()): the point of the counter opens until the screen is blue, or the blue of the link is
     there, then the camera pulls back from inside the final point of the sentence, and the sentence, enormous at first, lands around it.
   window.moyoReady resolves when the stage is free (stage.js waits for it), window.moyoDrawn when the title is there. Any key, click or scroll jumps to the end. Nothing with reduced motion. */
(() => {
'use strict';
const root = document.documentElement;
let free, drawn; window.moyoReady = new Promise(r => { free = r; }); window.moyoDrawn = new Promise(r => { drawn = r; });
const mode = root.classList.contains('load') ? 'load' : root.classList.contains('enter') ? 'enter' : '';
if (!mode) { free(); return drawn(); }
const wait = ms => new Promise(r => setTimeout(r, ms));
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out = t => 1 - Math.pow(1 - t, 4);
let hurry = false, layer = null, title = null, mark = null;
const tween = (ms, ease, fn) => new Promise(done => { const t0 = performance.now(); const f = t => { const u = hurry ? 1 : Math.min(1, (t - t0) / ms); fn(ease(u)); u < 1 ? requestAnimationFrame(f) : done(); }; requestAnimationFrame(f); });
function end() {
  root.classList.remove('load', 'enter');
  if (layer) layer.remove();
  if (title) title.style.clipPath = '';
  if (mark) mark.style.visibility = '';
  free(); drawn();
}
const skip = () => { hurry = true; };
['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(n => addEventListener(n, skip, { once: true, passive: true }));
addEventListener('scroll', function f() { if (scrollY < 24) return; removeEventListener('scroll', f); skip(); }, { passive: true }); // the scroll bar, a script

/* the final point of the title on screen: the one of the h1, or of the section the link leads to */
const onScreen = r => r.bottom > 0 && r.top < innerHeight;
function findMark() { return [...document.querySelectorAll('h1 .dot b,main h2 .dot b')].find(b => onScreen(b.getBoundingClientRect())) || null; }

async function enter() {
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (home() && scrollY < 20 && location.hash.length < 2) return pullBack();
  mark = findMark();
  const r = mark && mark.getBoundingClientRect(), x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2, r1 = r ? r.width / 2 : 0;
  layer = document.createElement('div'); layer.className = 'kl'; document.body.appendChild(layer);
  root.classList.remove('enter');
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4;
  await tween(860, t => 1 - Math.pow(1 - t, 3.2), u => { layer.style.clipPath = `circle(${(r1 + (R - r1) * (1 - u)).toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`; });
  end();
  if (mark) mark.animate([{ scale: 1.7 }, { scale: 1 }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
}

async function load() {
  if (window.moyoFit) moyoFit(); // the first sentence takes its size before it is measured (hero.js)
  title = document.querySelector('h1.t-hero'); mark = title && title.querySelector('.dot b');
  if (!mark || location.hash.length > 1 || scrollY > 20) return end();
  const C = getComputedStyle(title), fs = parseFloat(C.fontSize), g = document.createElement('canvas').getContext('2d');
  g.font = `${C.fontWeight} 100px ${C.fontFamily}`; const fm = g.measureText('M'), A = fm.fontBoundingBoxAscent / 100, D = fm.fontBoundingBoxDescent / 100;
  // the lines of the title as they are laid out
  const box = title.getBoundingClientRect(), rg = document.createRange(), rows = [], tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (!n.textContent.replace(/[\s\u2060]/g, '')) continue; rg.selectNodeContents(n);
    for (const q of rg.getClientRects()) { if (q.width < 2) continue; const row = rows.find(o => Math.abs(o.top - q.top) < fs * .4); if (row) { row.l = Math.min(row.l, q.left); row.r = Math.max(row.r, q.right); } else rows.push({ top: q.top, l: q.left, r: q.right }); } }
  rows.sort((a, b) => a.top - b.top); rows.forEach(o => { o.base = o.top + A * fs; });
  const m = mark.getBoundingClientRect(), d = m.width, lastRow = rows[rows.length - 1]; lastRow.r = m.left;
  // cut of the title: a staircase of rectangles, one per line
  const cut = ws => { const pt = [], x = v => (v - box.left).toFixed(1) + 'px', y = v => (v - box.top).toFixed(1) + 'px', X0 = box.left - fs * .2;
    pt.push(x(X0) + ' ' + y(rows[0].top - fs * .1));
    rows.forEach((o, i) => { const t = i ? rows[i - 1].base + fs * .245 : rows[0].top - fs * .1, b = i < rows.length - 1 ? o.base + fs * .245 : o.base + fs * .4; pt.push(x(ws[i]) + ' ' + y(t), x(ws[i]) + ' ' + y(b)); });
    pt.push(x(X0) + ' ' + y(lastRow.base + fs * .4)); title.style.clipPath = 'polygon(' + pt.join(',') + ')'; };
  const ws = rows.map(() => box.left - fs * .2); cut(ws); mark.style.visibility = 'hidden';
  // the counter
  layer = document.createElement('div'); layer.className = 'ld'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<span class="ld-n"><span>0</span></span><i class="ld-d"></i>'; document.body.appendChild(layer);
  const num = layer.firstChild, dig = num.firstChild, dot = layer.lastChild; dot.style.width = dot.style.height = d + 'px';
  num.style.left = box.left + 'px'; num.style.padding = '0 .06em .24em 0'; num.style.top = (lastRow.base - (1 - (A + D)) / 2 * fs - A * fs) + 'px';
  const put = (x, y) => { dot.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`; };
  const gap = d * .48, after = () => dig.firstChild ? (rg.selectNodeContents(dig), rg.getBoundingClientRect().right + gap) : box.left;
  let px = after(), py = lastRow.base - d; put(px, py);
  root.classList.remove('load');
  let full = document.readyState === 'complete'; addEventListener('load', () => { full = true; }, { once: true });
  const t0 = performance.now();
  await new Promise(done => { let v = 0; const f = t => { const e = (t - t0) / 1250, goal = full || t - t0 > 3200 ? out(Math.min(1, e)) : Math.min(.9, out(Math.min(1, e)) * .9); v = hurry ? 1 : Math.max(v, goal);
    dig.textContent = String(Math.round(v * 100)); px = after(); put(px, py); (v >= .999 || hurry) ? done() : requestAnimationFrame(f); }; requestAnimationFrame(f); });
  if (home()) { dig.animate([{ translate: '0 0' }, { translate: '0 -125%' }], { duration: hurry ? 1 : 760, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }); return pullBack(px + d / 2, py + d / 2, d / 2, dot); }
  // the number leaves, the dot goes to the first line
  dig.animate([{ translate: '0 0' }, { translate: '0 -125%' }], { duration: hurry ? 1 : 760, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
  const x0 = px, y0 = py, sx = rows[0].l, sy = rows[0].base - d;
  free(); // the rest of the first screen arrives while the sentence is being written
  await tween(900, io, u => put(x0 + (sx - x0) * u, y0 + (sy - y0) * u - Math.sin(u * Math.PI) * fs * .5));
  // it draws
  for (let i = 0; i < rows.length; i++) {
    const o = rows[i], last = i === rows.length - 1, len = o.r - o.l, ms = 720 + len / innerWidth * 1150; // slow enough to be watched
    await tween(ms, last ? out : io, u => { const x = o.l + len * u; ws[i] = x + (u >= 1 && !last ? fs : d * .5); cut(ws); put(x, o.base - d); });
    if (!last) { const n = rows[i + 1], xa = o.r, ya = o.base - d, xb = n.l, yb = n.base - d; await tween(520, io, u => put(xa + (xb - xa) * u, ya + (yb - ya) * u)); }
  }
  put(m.left, m.top);
  const b = mark; end(); b.animate([{ scale: 1.9 }, { scale: 1 }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
}

/* ---------- the home: out of the point ----------
   Drawn on a canvas for the time of the move, so that the letters stay sharp at any size: each letter where the page puts it, seen from closer.
   The camera is first inside the final point (the screen is blue), then it pulls back; the page takes over at the end, exactly in place. */
const home = () => !!(title || (title = document.querySelector('h1.t-hero'))) && !!title.closest('#top');
async function pullBack(fx, fy, fr, from) {
  if (window.moyoFit) moyoFit();
  title = document.querySelector('#top h1.t-hero'); mark = title && title.querySelector('.dot b'); if (!mark) return end();
  const W = innerWidth, H = innerHeight, D = Math.min(2, devicePixelRatio || 1), m = mark.getBoundingClientRect(), P = [m.left + m.width / 2, m.top + m.height / 2], r0 = m.width / 2;
  const C = getComputedStyle(title), fs = parseFloat(C.fontSize), font = `${C.fontWeight} ${fs}px ${C.fontFamily}`, g0 = document.createElement('canvas').getContext('2d');
  g0.font = `${C.fontWeight} 100px ${C.fontFamily}`; const A = g0.measureText('M').fontBoundingBoxAscent / 100;
  const list = [], rg = document.createRange(), tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { const col = getComputedStyle(n.parentElement).color;
    for (let i = 0; i < n.length; i++) { const ch = n.data[i]; if (/[\s\u2060]/.test(ch)) continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getClientRects()[0]; if (r) list.push([ch, r.left, r.top + A * fs, r.width, col]); } }
  if (!title.style.clipPath) title.style.clipPath = 'inset(0 0 100% 0)'; mark.style.visibility = 'hidden';
  if (!layer) { layer = document.createElement('div'); layer.className = 'ld'; layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer); }
  const cv = document.createElement('canvas'); cv.width = Math.round(W * D); cv.height = Math.round(H * D); cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%'; layer.prepend(cv);
  const g = cv.getContext('2d'), KL = getComputedStyle(root).getPropertyValue('--klein').trim() || '#002FA7';
  const far = (x, y) => Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 2;
  const disc = (x, y, r) => { g.setTransform(D, 0, 0, D, 0, 0); g.fillStyle = KL; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  const clear = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); };
  const seen = s => { clear(); disc(P[0], P[1], r0 * s); g.font = font; // the sentence, s times larger, around its point
    for (const [ch, x, y, w, col] of list) { const X = P[0] + (x - P[0]) * s, Y = P[1] + (y - P[1]) * s; if (X > W || X + w * s < 0 || Y - fs * s > H || Y + fs * s * .35 < 0) continue; g.fillStyle = col; g.setTransform(D * s, 0, 0, D * s, X * D, Y * D); g.fillText(ch, 0, 0); } };
  const S0 = far(P[0], P[1]) / r0, L0 = Math.log(S0);
  if (fr == null) { seen(S0); root.classList.remove('enter'); } // the blue of the link is already there
  else { if (from) from.style.visibility = 'hidden'; const R = far(fx, fy); await tween(hurry ? 1 : 640, t => t * t * t, u => { clear(); disc(fx, fy, fr + (R - fr) * u); }); } // the point of the counter opens
  let freed = false;
  await tween(2100, t => 1 - Math.pow(1 - t, 4), u => { seen(Math.exp(L0 * (1 - u))); if (!freed && u > .72) { freed = true; free(); } }); // the camera pulls back
  const b = mark; end(); b.animate([{ scale: 1.32 }, { scale: 1 }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
}

const dcl = document.readyState === 'loading' ? new Promise(r => addEventListener('DOMContentLoaded', r, { once: true })) : Promise.resolve();
Promise.all([dcl, Promise.race([document.fonts.ready, wait(1500)])]).then(() => new Promise(r => requestAnimationFrame(r))).then(mode === 'load' ? load : enter).catch(end);
})();
