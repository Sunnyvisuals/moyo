/* A picture is born from one dot: the dot of its plate divides in two, each half divides again, until there are enough of them to be the picture
   (darker places get bigger dots). It leaves the same way, backwards and faster. While the picture is still loading, its dot waits.
   window.moyoDivide(plate, what, { delay, p, from, ms }) returns a promise. what: 'hide' (away, at once), true (born), false (back to nothing),
   'dot' (back to one dot, which stays), 'end' (there, at once). Used by stage.js when a picture arrives or leaves, and by site.js when the
   sheet goes from one project to the next. Nothing with reduced motion: the picture is simply there. */
(() => {
'use strict';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const CELL = 10, UP = 1180, DOWN = 520, POP = .19, SEE = .84, FADE = .38; // smallest cell (px), durations (ms), shares of the way: the first dot, the picture over its dots
const TAU = Math.PI * 2, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t, smooth = t => t * t * (3 - 2 * t);
const st = document.createElement('style');
st.textContent = `.plate.dv{background:transparent}.plate.dv>img{opacity:0}.plate.dv.born{background:var(--tint)}.plate.dv.born>img{opacity:1}
.dvc{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
:is(#proj,.work) .plate.dv>img{position:relative}`;
document.head.appendChild(st);
const runs = new WeakMap(), sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
const runOf = plate => { let r = runs.get(plate); if (!r) runs.set(plate, r = { plate, p: -POP, dir: 0, raf: 0, last: 0, t0: 0, ready: false, cv: null, done: null, from: null }); return r; };

function tones(plate, img, src) { // how dark the visible part of the picture is, as a summed-area table
  const n = 96, S = new Float32Array((n + 1) * (n + 1));
  try {
    const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d', { willReadFrequently: true }), P = plate.getBoundingClientRect(), I = img.getBoundingClientRect();
    const f = src.width / img.naturalWidth, k = Math.max(I.width / img.naturalWidth, I.height / img.naturalHeight), ox = (I.width - img.naturalWidth * k) * .5, oy = (I.height - img.naturalHeight * k) * .08; // object-fit: cover, 50% 8%
    g.drawImage(src, (P.left - I.left - ox) / k * f, (P.top - I.top - oy) / k * f, P.width / k * f, P.height / k * f, 0, 0, n, n);
    const d = g.getImageData(0, 0, n, n).data;
    for (let y = 0; y < n; y++) for (let x = 0, row = 0; x < n; x++) { const o = (y * n + x) * 4; row += 1 - (.2126 * d[o] + .7152 * d[o + 1] + .0722 * d[o + 2]) / 255; S[(y + 1) * (n + 1) + x + 1] = S[y * (n + 1) + x + 1] + row; }
  } catch (_) { for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) S[y * (n + 1) + x] = x * y * .8; }
  return (u0, v0, u1, v1) => { const a = Math.floor(u0 * n), b = Math.floor(v0 * n), c = Math.max(a + 1, Math.ceil(u1 * n)), e = Math.max(b + 1, Math.ceil(v1 * n)), w = n + 1; return (S[e * w + c] - S[b * w + c] - S[e * w + a] + S[b * w + a]) / ((c - a) * (e - b)); };
}
function build(r) {
  const W = r.W = r.plate.clientWidth, H = r.H = r.plate.clientHeight; if (!W || !H) return false;
  const D = r.D = Math.min(2, devicePixelRatio || 1), cv = r.cv && r.cv.isConnected ? r.cv : document.createElement('canvas');
  cv.className = 'dvc'; cv.setAttribute('aria-hidden', 'true'); cv.width = Math.round(W * D); cv.height = Math.round(H * D); if (!cv.isConnected) r.plate.prepend(cv);
  r.cv = cv; r.g = cv.getContext('2d');
  const L = r.L = [[1, 1]]; for (;;) { const [a, b] = L[L.length - 1], w = W / a, h = H / b; if (w * h < CELL * CELL || L.length > 13) break; L.push(w >= h ? [a * 2, b] : [a, b * 2]); } // each division doubles the columns or the rows
  r.K = L.length - 1; r.rho = Math.min(.13 * W, .2 * H) / Math.sqrt(W * H); r.dark = null;
  return true;
}
function read(r) { const img = r.plate.querySelector('img'); if (!img || r.dark || !r.L) return; const at = tones(r.plate, img, r.src || img); r.dark = r.L.map(([a, b]) => { const o = new Float32Array(a * b); for (let j = 0; j < b; j++) for (let i = 0; i < a; i++) o[j * a + i] = at(i / a, j / b, (i + 1) / a, (j + 1) / b); return o; }); }
function draw(r, now) {
  const { g, D, W, H, L, K } = r, p = clamp(r.p), lev = K * Math.pow(p, 1.5), k = Math.min(K - 1, Math.floor(lev)), u = smooth(lev - k), q = lev / K;
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
  const m = smooth(clamp((q - .12) / .6)), col = `rgb(${mix(0, 18, m) | 0},${mix(47, 18, m) | 0},${mix(167, 20, m) | 0})`;
  const pop = r.p < 0 ? 1 - Math.pow(-r.p / POP, 2) : r.ready ? 1 : 1 + .07 * Math.sin((now - r.t0) / 260), F = r.from ? 1 - smooth(clamp(p / .4)) : 0, fx = F ? r.from[0] * F : 0, fy = F ? r.from[1] * F : 0;
  g.fillStyle = col;
  const s0 = Math.sqrt(W * H), rad = (lv, d) => s0 / Math.pow(2, lv / 2) * mix(r.rho, .18 + .62 * d, Math.pow(lv / K, 1.6));
  if (p <= 0 || !r.dark) { g.beginPath(); g.arc(W / 2 + fx, H / 2 + fy, Math.max(0, rad(0, 0) * pop), 0, TAU); g.fill(); return; }
  const [a, b] = L[k], [c, d] = L[k + 1], A = r.dark[k], B = r.dark[k + 1], wide = c > a, n = c * d, small = n > 600;
  if (small) { const x = sprite.getContext('2d'); x.clearRect(0, 0, 64, 64); x.fillStyle = col; x.beginPath(); x.arc(32, 32, 31, 0, TAU); x.fill(); } else g.beginPath();
  for (let j = 0; j < d; j++) for (let i = 0; i < c; i++) {
    const pi = wide ? i >> 1 : i, pj = wide ? j : j >> 1, x = mix((pi + .5) / a, (i + .5) / c, u) * W + fx, y = mix((pj + .5) / b, (j + .5) / d, u) * H + fy, e = mix(rad(k, A[pj * a + pi]), rad(k + 1, B[j * c + i]), u);
    if (small) g.drawImage(sprite, x - e, y - e, e * 2, e * 2); else { g.moveTo(x + e, y); g.arc(x, y, e, 0, TAU); }
  }
  if (!small) g.fill();
}
const image = r => r.plate.querySelector(':scope>img');
function settle(r, shown) { // the end of a run: nothing left but the picture, or nothing
  cancelAnimationFrame(r.raf); r.raf = 0; r.dir = 0; if (r.cv) r.cv.remove(); r.cv = null; r.L = null; r.from = null; r.p = shown ? SEE + FADE : -POP;
  const img = image(r); if (img) img.style.opacity = ''; r.plate.classList.toggle('born', shown); if (r.done) { const f = r.done; r.done = null; f(); }
}
function frame(r, now) {
  r.raf = 0; const dt = Math.min(40, now - (r.last || now)); r.last = now; const img = image(r);
  if (!r.plate.isConnected || !img || !r.cv || Math.abs(r.plate.clientWidth - r.W) > 14) return settle(r, r.dir > 0);
  if (now >= r.t0) r.p += r.dir * dt / (r.dir > 0 ? r.ms : DOWN);
  if (r.dir > 0 && !r.ready) { r.p = Math.min(r.p, 0); if (now - r.t0 > 5000) return settle(r, true); }
  if (r.p >= 0 && r.ready) read(r);
  img.style.opacity = clamp((r.p - SEE) / FADE).toFixed(3);
  if (now >= r.t0) draw(r, now);
  if (r.dir > 0 && r.p >= SEE + FADE) return settle(r, true);
  if (r.dir < 0 && r.p <= r.stop) { if (r.stop < 0) return settle(r, false); r.p = 0; r.dir = 0; draw(r, now); if (r.done) { const f = r.done; r.done = null; f(); } return; }
  r.raf = requestAnimationFrame(t => frame(r, t));
}
function load(r) { const img = image(r); if (img && !r.ready) img.decode() // decoded and made small off the main thread, before it is read
  .then(() => createImageBitmap(img, { resizeWidth: 128, resizeHeight: Math.max(1, Math.round(128 * img.naturalHeight / img.naturalWidth)) }).catch(() => null)).then(b => { r.src = b; r.ready = true; }, () => { if (r.dir > 0) settle(r, true); }); }
window.moyoDivide = (plate, what, { delay = 0, p, from, ms = UP } = {}) => {
  const r = runOf(plate); plate.classList.add('dv');
  if (what === 'hide') { settle(r, false); return Promise.resolve(); }
  if (what === 'end' || !image(r)) { settle(r, what !== false); return Promise.resolve(); }
  const go = what === true;
  if (go && plate.classList.contains('born') && !r.dir && p === undefined) return Promise.resolve();
  if (!go && !plate.classList.contains('born') && !r.cv) return Promise.resolve();
  if (plate.classList.contains('born') && !r.cv) r.p = SEE + FADE; // it was simply there
  if (p !== undefined) { r.p = p; r.ready = false; if (r.cv) r.cv.remove(); r.cv = null; }
  if (!r.cv || !r.cv.isConnected || !r.L) { if (!build(r)) { settle(r, go); return Promise.resolve(); } }
  plate.classList.remove('born'); r.from = from ? (b => [from[0] - b.left - b.width / 2, from[1] - b.top - b.height / 2])(plate.getBoundingClientRect()) : r.from;
  load(r); r.ms = ms; r.dir = go ? 1 : -1; r.stop = what === 'dot' ? 0 : -POP; r.t0 = performance.now() + delay; r.last = 0;
  const img = image(r); img.style.opacity = clamp((r.p - SEE) / FADE).toFixed(3); if (!delay) { if (r.p >= 0 && r.ready) read(r); draw(r, r.t0); }
  if (!r.raf) r.raf = requestAnimationFrame(t => frame(r, t));
  return new Promise(f => { if (r.done) r.done(); r.done = f; });
};
})();
