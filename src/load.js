/* What opens a page (the class was chosen in the <head>):
   - html.load: first visit or reload. A number counts up where the title will be, followed by the dot. At 100 the number leaves and the dot
     draws the title, line after line, then stays as its final point ("Moyo dessine…").
   - html.enter: coming from a link of the site. The screen is blue (the dot opened on the click, see leave.js) and closes on the final point of the title.
   window.moyoReady resolves when the stage is free (stage.js waits for it). Any key, click or scroll jumps to the end. Nothing with reduced motion. */
(() => {
'use strict';
const root = document.documentElement;
let free; window.moyoReady = new Promise(r => { free = r; });
const mode = root.classList.contains('load') ? 'load' : root.classList.contains('enter') ? 'enter' : '';
if (!mode) return free();
const wait = ms => new Promise(r => setTimeout(r, ms));
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out = t => 1 - Math.pow(1 - t, 4);
let hurry = false, layer = null, title = null, mark = null;
const tween = (ms, ease, fn) => new Promise(done => { const t0 = performance.now(); const f = t => { const u = hurry ? 1 : Math.min(1, (t - t0) / ms); fn(ease(u)); u < 1 ? requestAnimationFrame(f) : done(); }; requestAnimationFrame(f); });
function end() {
  root.classList.remove('load', 'enter');
  if (layer) layer.remove();
  if (title) title.style.clipPath = '';
  if (mark) mark.style.visibility = '';
  free();
}
const skip = () => { hurry = true; };
['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(n => addEventListener(n, skip, { once: true, passive: true }));

/* the final point of the title on screen: the one of the h1, or of the section the link leads to */
const onScreen = r => r.bottom > 0 && r.top < innerHeight;
function findMark() { return [...document.querySelectorAll('h1 .dot b,main h2 .dot b')].find(b => onScreen(b.getBoundingClientRect())) || null; }

async function enter() {
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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
  title = document.querySelector('h1.t-hero'); mark = title && title.querySelector('.dot b');
  if (!mark || location.hash.length > 1 || scrollY > 20) return end();
  const C = getComputedStyle(title), fs = parseFloat(C.fontSize), g = document.createElement('canvas').getContext('2d');
  g.font = `${C.fontWeight} 100px ${C.fontFamily}`; const fm = g.measureText('M'), A = fm.fontBoundingBoxAscent / 100, D = fm.fontBoundingBoxDescent / 100;
  // the lines of the title as they are laid out
  const box = title.getBoundingClientRect(), rg = document.createRange(), rows = [], tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (!n.textContent.replace(/[\s⁠]/g, '')) continue; rg.selectNodeContents(n);
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
  await new Promise(done => { let v = 0; const f = t => { const e = (t - t0) / 620, goal = full || t - t0 > 3200 ? out(Math.min(1, e)) : Math.min(.9, out(Math.min(1, e)) * .9); v = hurry ? 1 : Math.max(v, goal);
    dig.textContent = String(Math.round(v * 100)); px = after(); put(px, py); (v >= .999 || hurry) ? done() : requestAnimationFrame(f); }; requestAnimationFrame(f); });
  // the number leaves, the dot goes to the first line
  dig.animate([{ translate: '0 0' }, { translate: '0 -125%' }], { duration: hurry ? 1 : 420, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
  const x0 = px, y0 = py, sx = rows[0].l, sy = rows[0].base - d;
  await tween(400, io, u => put(x0 + (sx - x0) * u, y0 + (sy - y0) * u - Math.sin(u * Math.PI) * fs * .5));
  // it draws
  for (let i = 0; i < rows.length; i++) {
    const o = rows[i], last = i === rows.length - 1, len = o.r - o.l, ms = 170 + len / innerWidth * 330;
    await tween(ms, last ? out : io, u => { const x = o.l + len * u; ws[i] = x + (u >= 1 && !last ? fs : d * .5); cut(ws); put(x, o.base - d); });
    if (!last) { const n = rows[i + 1], xa = o.r, ya = o.base - d, xb = n.l, yb = n.base - d; await tween(170, io, u => put(xa + (xb - xa) * u, ya + (yb - ya) * u)); }
  }
  put(m.left, m.top);
  const b = mark; end(); b.animate([{ scale: 1.9 }, { scale: 1 }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
}

const dcl = document.readyState === 'loading' ? new Promise(r => addEventListener('DOMContentLoaded', r, { once: true })) : Promise.resolve();
Promise.all([dcl, Promise.race([document.fonts.ready, wait(1500)])]).then(() => new Promise(r => requestAnimationFrame(r))).then(mode === 'load' ? load : enter).catch(end);
})();
