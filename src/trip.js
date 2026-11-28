/* From "Studio." to "Équipe.": once, when "Équipe" comes on screen, the point of the studio lets go, falls on the sentence under it and bumps on
   its letters (each letter is an obstacle as tall as it is drawn: capitals, d, l, t and accents stand out, a, e, o are low, g, p, y go under the
   line), rolls to the space between two words and goes through, line after line, then falls to its place after "Équipe" and lands. Drawn on
   twos, like the drop of the first screen: each drawing held for two frames of film. The fall is worked out for the layout of the moment
   (gravity, bounces, a drift toward the nearest space) and lives in the page: the scroll does not drive it. One point at a time; the studio gets
   its point back the next time its title comes. Nothing with reduced motion. */
(() => {
'use strict';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const studio = document.getElementById('studio'), team = document.getElementById('equipe');
const a = studio && studio.querySelector('h2 .dot b'), z = team && team.querySelector('h2 .dot b'), head = team && team.querySelector('h2');
if (!a || !z || !head) return;
const D2 = 83, PACE = 1.35, DT = 2.5; // a drawing held for two frames of film; the fall a little faster than life; ms of fall per step of plan()
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const st = document.createElement('style');
st.textContent = '.trip{position:absolute;left:0;top:0;z-index:80;border-radius:50%;background:var(--klein);pointer-events:none;visibility:hidden;transform-origin:50% 50%;will-change:transform}';
document.head.appendChild(st);
const ball = document.createElement('i'); ball.className = 'trip'; ball.setAttribute('aria-hidden', 'true'); document.body.appendChild(ball);

// the point of "Équipe" does not fall in by itself: it is the one of the studio that comes (stage.js leaves the points marked data-trip alone)
z.parentElement.setAttribute('data-trip', ''); z.style.transition = 'none'; z.parentElement.classList.add('in'); z.style.visibility = 'hidden';

/* where each letter is drawn, in the page: from the top of its ink to the bottom (in em, from the baseline) */
const ink = ch => {
  if (/[,;]/.test(ch)) return [.14, .14]; if (ch === '.') return [.14, 0]; if (/[’'"]/.test(ch)) return [.72, -.45];
  if (/[-–—]/.test(ch)) return [.33, -.24]; if (ch === ':') return [.5, 0]; if (ch === 't') return [.63, 0];
  const low = /[gjpqyç]/.test(ch) ? .2 : 0;
  if (/[A-Z0-9bdfhkl]/.test(ch) || ch.normalize('NFD').length > 1) return [.72, low]; // the dot of an i or a j is too small to stop it
  return [.52, low];
};
function letters() {
  const out = [], rg = document.createRange(), g = document.createElement('canvas').getContext('2d'), asc = new Map();
  for (const host of studio.querySelectorAll('.say,.defs')) {
    const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      if (!n.data.trim() || n.parentElement.closest('.sr')) continue;
      const cs = getComputedStyle(n.parentElement), fs = parseFloat(cs.fontSize), key = cs.fontWeight + cs.fontFamily;
      if (!asc.has(key)) { g.font = `${cs.fontWeight} 100px ${cs.fontFamily}`; asc.set(key, g.measureText('M').fontBoundingBoxAscent / 100); }
      for (let i = 0; i < n.length; i++) {
        const ch = n.data[i]; if (/[\s⁠]/.test(ch)) continue;
        rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getClientRects()[0]; if (!r || r.width < .5) continue;
        const base = r.top + asc.get(key) * fs + scrollY, [up, dn] = ink(ch);
        out.push({ l: r.left, r: r.right, t: base - up * fs, b: base + dn * fs, base, fs });
      }
    }
  }
  /* the letters of a word touch: no slit between them; only the ends of a word give back their side bearing, so that the spaces stay open */
  const lines = []; for (const o of out) { let w = lines.find(q => Math.abs(q.base - o.base) < o.fs * .3); if (!w) lines.push(w = { base: o.base, list: [] }); w.list.push(o); }
  for (const w of lines) { w.list.sort((p, q) => p.l - q.l); const ends = w.list.map((o, i) => [!i || o.l - w.list[i - 1].r > o.fs * .02, i === w.list.length - 1 || w.list[i + 1].l - o.r > o.fs * .02]);
    w.list.forEach((o, i) => { const side = o.fs * .04; if (ends[i][0]) o.l += side; if (ends[i][1]) o.r -= side; o.k = Math.max(0, Math.min((o.r - o.l) / 2, (o.b - o.t) / 2, o.fs * .16)); }); }
  return out;
}
const centre = b => { const r = b.getBoundingClientRect(), t = getComputedStyle(b).translate, m = t && t !== 'none' ? t.split(' ').map(parseFloat) : [0, 0]; return [r.left + r.width / 2 - (m[0] || 0), r.top + r.height / 2 - (m[1] || 0) + scrollY, r.width / 2]; };

/* the fall, step by step: gravity up to a top speed, bounces that lose a little, letters with round corners so that it rolls off them, and on the
   top of a letter a push toward the nearest space of its line wide enough to let it through */
function plan() {
  const S = centre(a), E = centre(z), r = S[2], obs = letters(); if (!obs.length || E[1] <= S[1]) return null;
  const fs = parseFloat(getComputedStyle(studio.querySelector('.say') || studio).fontSize), g = 46 * fs, top = 14 * fs, rc = r * .85, dt = DT / 1000, e = .36; // scaled on the sentence it falls through
  const sc = getComputedStyle(studio), sr = studio.getBoundingClientRect(), L = sr.left + parseFloat(sc.paddingLeft) - r, R = sr.right - parseFloat(sc.paddingRight) + r; // it may go into the margins, not out of the page
  const rows = []; for (const o of obs) { let w = rows.find(q => Math.abs(q.base - o.base) < o.fs * .3); if (!w) rows.push(w = { base: o.base, list: [], t: o.t, b: o.b }); w.list.push(o); w.t = Math.min(w.t, o.t); w.b = Math.max(w.b, o.b); o.row = w; }
  for (const w of rows) { // the openings of a line: the spaces wide enough, and its two ends where there is room beside it
    const l = w.list.sort((p, q) => p.l - q.l), a0 = l[0].l - rc * 1.4, a1 = l[l.length - 1].r + rc * 1.4; let wide = 0, at = 0; w.gaps = [];
    if (a0 >= L) w.gaps.push(a0); if (a1 <= R) w.gaps.push(a1);
    for (let i = 1; i < l.length; i++) { const d = l[i].l - l[i - 1].r, c = (l[i].l + l[i - 1].r) / 2; if (d > rc * 1.8) w.gaps.push(c); if (d > wide) { wide = d; at = c; } }
    if (!w.gaps.length) w.gaps.push(at); } // no opening: it squeezes through the widest
  const gapOf = (w, x) => w.gaps.reduce((p, q) => Math.abs(q - x) < Math.abs(p - x) ? q : p);
  const last = Math.max(...rows.map(w => w.b));
  const X = [], Y = [], VX = [], VY = [], HIT = []; let x = S[0], y = S[1], vx = 0, vy = 0, imp = 0, best = y, idle = 0, on = null;
  const keep = () => { X.push(x); Y.push(y); VX.push(vx); VY.push(vy); HIT.push(imp); };
  keep();
  for (let s = 0; s < 16000 && y - rc < last + fs * .6; s++) {
    vy = Math.min(top, vy + g * dt); vx *= 1 - .8 * dt; x += vx * dt; y += vy * dt; imp *= Math.exp(-dt / .045); on = null;
    for (let pass = 0; pass < 2; pass++) for (const w of rows) { // twice: wedged between two letters, it is pushed out of both
      if (y + rc < w.t - 2 || y - rc > w.b + 2) continue;
      for (const o of w.list) {
        if (x + rc < o.l - 1 || x - rc > o.r + 1) continue;
        const qx = clamp(x, o.l + o.k, o.r - o.k), qy = clamp(y, o.t + o.k, o.b - o.k), dx = x - qx, dy = y - qy, d = Math.hypot(dx, dy), lim = rc + o.k;
        if (d >= lim) continue;
        const nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : -1; x = qx + nx * lim; y = qy + ny * lim;
        const vn = vx * nx + vy * ny;
        if (vn < 0) { vx -= (1 + e) * vn * nx; vy -= (1 + e) * vn * ny; const tg = vx * -ny + vy * nx; vx -= tg * -ny * .08; vy -= tg * nx * .08; imp = Math.max(imp, clamp(-vn / (top * .6))); }
        if (ny < -.5) { on = w; const gx = gapOf(w, x); if (Math.abs(gx - x) > 1) vx += Math.sign(gx - x) * (30 * fs * dt + (vn < 0 ? -vn * .12 : 0)); }
      }
    }
    if (x < L) { x = L; vx = Math.abs(vx) * e; } else if (x > R) { x = R; vx = -Math.abs(vx) * e; }
    if (y > best + .5) { best = y; idle = 0; }
    else if (on && Math.abs(vy) < g * .04 && (idle += dt) > .3) { // resting, held by a taller letter (an i, a d): a hop over it that lands on the space
      const gx = gapOf(on, x), lo = Math.min(x, gx) - rc, hi = Math.max(x, gx) + rc, crest = on.list.filter(o => o.r > lo && o.l < hi).reduce((m, o) => Math.min(m, o.t), y + rc);
      const up = Math.sqrt(2 * g * Math.max(on.list[0].fs * .3, y - crest + rc * 4)), T = 2 * up / g; // up first, high enough to pass the tallest letter on the way, then across
      vy = -up; vx = Math.sign(gx - x || 1) * clamp(Math.max(Math.abs(gx - x) / T, top * .12), 0, top); idle = 0; }
    keep();
  }
  // under the last line: it falls to the place of the point of "Équipe", drifting to it, and arrives there exactly
  const x0 = x, v0 = vx; let n = 0; const ys = [], vys = [];
  while (y < E[1] && n < 8000) { vy = Math.min(top, Math.max(vy, 0) + g * dt); y = Math.min(E[1], y + vy * dt); ys.push(y); vys.push(vy); n++; }
  const T = n * dt || dt;
  for (let i = 0; i < n; i++) {
    const s = (i + 1) / n, s2 = s * s, s3 = s2 * s; x = (2 * s3 - 3 * s2 + 1) * x0 + (s3 - 2 * s2 + s) * v0 * T + (3 * s2 - 2 * s3) * E[0];
    imp *= Math.exp(-dt / .045); X.push(x); Y.push(ys[i]); VX.push(((6 * s2 - 6 * s) * x0 + (3 * s2 - 4 * s + 1) * v0 * T + (6 * s - 6 * s2) * E[0]) / T); VY.push(vys[i]); HIT.push(imp);
  }
  X.push(E[0]); Y.push(E[1]); VX.push(0); VY.push(top); HIT.push(0);
  return { X, Y, VX, VY, HIT, r, top };
}

/* one drawing: drawn out by its speed, or flattened when it has just hit a letter (a hit between two drawings is still seen) */
function pose(P, i, j) {
  let hit = 0; for (let k = i + 1; k <= j; k++) hit = Math.max(hit, P.HIT[k]);
  const r = P.r, s = 1 + Math.min(.4, Math.hypot(P.VX[j], P.VY[j]) / (P.top * 2.4)); let sx = 1 / s, sy = s, an = Math.atan2(P.VY[j], P.VX[j]) - Math.PI / 2;
  if (hit > .04) { sx = 1 + .38 * hit; sy = 1 - .32 * hit; an = 0; }
  ball.style.transform = `translate3d(${(P.X[j] - r).toFixed(2)}px,${(P.Y[j] - r).toFixed(2)}px,0) rotate(${an.toFixed(3)}rad) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
}
let busy = false, done = false;
function land() {
  busy = false; done = true; ball.style.visibility = 'hidden'; z.style.visibility = '';
  z.animate([{ scale: '1.55 .5', translate: '0 .045em' }, { scale: '.78 1.3', translate: '0 -.14em' }, { scale: '1.1 .92', translate: '0 0' }, { scale: '1 1', translate: '0 0' }], { duration: 580, easing: 'steps(7, end)' });
  a.style.visibility = ''; a.parentElement.classList.remove('in'); // the studio gets a point again the next time its title comes (stage.js lets it fall in)
}
function play() {
  if (busy || done) return;
  const P = plan(); if (!P) { done = true; z.style.visibility = ''; return; }
  const N = P.X.length - 1, pace = Math.max(PACE, N * DT / 4200); busy = true; // a long way (a phone, many lines) goes faster: never much more than four seconds
  ball.style.width = ball.style.height = P.r * 2 + 'px'; pose(P, 0, 0); a.style.visibility = 'hidden'; ball.style.visibility = 'visible';
  const t0 = performance.now(); let last = 0;
  const frame = now => {
    if (!busy) return;
    const j = Math.min(N, Math.floor(Math.floor((now - t0) / D2) * D2 * pace / DT)); // on twos
    if (j !== last) { pose(P, last, j); last = j; }
    if (j >= N) land(); else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
// once, when "Équipe" comes on screen; a change of size while it falls ends it in place
new IntersectionObserver((es, o) => { if (es.some(x => x.isIntersecting)) { o.disconnect(); document.fonts.ready.then(play); } }, { rootMargin: '0px 0px -12% 0px' }).observe(head);
addEventListener('resize', () => { if (busy) land(); });
})();
