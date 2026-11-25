/* First screen: what the sentence says, drawn. A field of dots (moyō, the pattern) and one of them, the idea: alone, then the sun of an image, the
   button of a site, the ball of a film. The dots change around it, starting from it; it never leaves. The legend under it is inked as it is drawn.
   Pointed at, in the legend or in the sentence itself, an image, a site, a film or the idea is drawn at once; under the pointer the dots move away.
   With reduced motion: one still image. Nothing is drawn while it is not on screen. */
(() => {
'use strict';
const fig = document.querySelector('.fig'), cv = fig && fig.querySelector('canvas'); if (!cv) return;
const g = cv.getContext('2d'), words = [...fig.querySelectorAll('[data-fig]')], title = document.querySelector('h1.t-hero'), hero = document.getElementById('top');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, NX = 32, NY = 20, TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t, smooth = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); }, bell = (v, w) => Math.exp(-(v * v) / (w * w));
const box = (c, r, a, b, d, e) => c >= a && c <= d && r >= b && r <= e; // a block of the grid

/* ---------- the four drawings. ink(column, row, time): how much ink, 0 to 1. dot(time): where the idea is [column, row], its radius (in steps of the
   grid), and how it is squashed. They are written in steps of the grid: 32 by 20 ---------- */
const ball = t => { const f = ((t / 1.15) % 1 + 1) % 1, near = bell(Math.min(f, 1 - f), .075); return [17.5, 14.6 - 9.4 * 4 * f * (1 - f), 1.75, 1 + .24 * near, 1 - .28 * near]; }; // a ball that bounces: the first exercise of animation
const DRAW = [
  { ink: () => 0, dot: t => [15.5, 9.5, 3.3 + .12 * Math.sin(t * 1.7)] },
  { // the sea, seen from here
    ink: (c, r, t) => {
      const H = 11.4, far = H - 3.6 * bell(c - 6.2, 4.6) - 2.3 * bell(c - 14.6, 3.4), near = H + .6 - 2.4 * bell(c + 1.5, 6.4);
      if (r < H) return r >= near ? .92 : r >= far ? .3 + .05 * (r - far) : 0;
      const d = (r - H) / (19 - H), w = Math.sin(r * 2.4 + Math.sin(c * .2 + t * .45) * 1.7 + t * .7), sun = bell(c - 21.6 + Math.sin(r * 2.1 + t * 1.3) * (.35 + 1.1 * d), .8 + 2.2 * d);
      return clamp((.15 + .58 * d + .15 * w) * (1 - .97 * sun));
    },
    dot: t => [21.6, 6.6 + .16 * Math.sin(t * .8), 2.6]
  },
  { // a page being read: its name, its menu, a title, an image, a text, a button
    ink: (c, r, t) => {
      const say = (a, n, k) => c < a + n * smooth((t - k) / .8) - .5; // a line is written from the left
      if (r === 1) return c >= 1 && c <= 4 && say(1, 5, .1) ? .8 : (c === 22 || c === 25 || c === 28) && t > .3 ? .3 : 0;
      if (c < 17 && (r === 5 || r === 6)) return c >= 1 && say(1, 15, .35) ? 1 : 0;
      if (c < 17 && (r === 8 || r === 9)) return c >= 1 && say(1, 11, .6) ? 1 : 0;
      if (c < 17 && c >= 1 && r >= 11 && r <= 13) return say(1, [12, 13, 8][r - 11], .85 + (r - 11) * .14) ? .16 : 0;
      if (box(c, r, 19, 5, 30, 17)) { const v = smooth((t - .5 - (c - 19 + r - 5) * .03) / .7), light = bell((c - 19) * .7 + (r - 5) - 8 - 5 * Math.sin(t * .5), 5); return v * clamp(.86 - .02 * (c - 19) - .58 * light); }
      return 0;
    },
    dot: t => { const p = bell((t % 2.6) - 2.1, .12); return [2.4, 16.5, 1.6 * (1 - .24 * p)]; }
  },
  { // a strip that goes by, and the ball that bounces from a frame to the next
    ink: (c, r, t) => {
      const x = c + t * 4, band = r < 3 || r > 16;
      if (band) { const p = ((x % 4) + 4) % 4; return r === 1 || r === 18 ? .72 * clamp((Math.abs(p - 1.5) - .55) * 1.6) : .72; }
      const f = ((x % 16) + 16) % 16; if (f < 1.5) return .72 * clamp(1.5 - Math.abs(f - .6) * 1.5);
      let v = 0; for (let k = 1; k < 9; k++) { const p = ball(t - k * .075); v = Math.max(v, (.5 - k * .05) * bell(Math.hypot(c - p[0] + k * 1.15, r - p[1]), 1.05)); }
      return v;
    },
    dot: ball
  }
];
const HOLD = [2300, 4300, 4600, 4300], MOVE = 1500;

/* ---------- the field ---------- */
let W = 0, H = 0, S = 1, D = 1, cur = 0, was = 0, since = 0, when = 0, at = [15.5, 9.5, 0, 1, 1], on = false, raf = 0, ptr = null, held = -1, next = 0, born = 0;
function size() { const r = cv.getBoundingClientRect(); if (!r.width) return; D = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; S = W / NX; cv.width = Math.round(W * D); cv.height = Math.round(H * D); if (reduce) still(); }
function paint(t, u, b) { // t: the time of the drawing, u: how far it is from the one before, b: how far the field is born
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
  const A = DRAW[was], B = DRAW[cur], base = Math.max(.6, S * .052), reach = Math.hypot(NX, NY);
  for (let r = 0; r < NY; r++) for (let c = 0; c < NX; c++) {
    const d = Math.hypot(c - at[0], r - at[1]), w = smooth((u * 1.75 - d / reach * 1.25) / .62), v = w >= 1 ? B.ink(c, r, t) : w <= 0 ? A.ink(c, r, t + 3) : mix(A.ink(c, r, t + 3), B.ink(c, r, t), w), n = smooth((b * 1.9 - d / reach * 1.4) / .5);
    let R = Math.max(base * n, S * .48 * Math.sqrt(v) * n); if (d < at[2] + .75) R *= clamp((d - at[2] - .05) / .6); if (R < .2) continue;
    let x = (c + .5) * S, y = (r + .5) * S;
    if (ptr) { const dx = x - ptr[0], dy = y - ptr[1], q = Math.hypot(dx, dy) || 1, k = S * 1.7 * Math.exp(-(q * q) / (S * S * 9)); x += dx / q * k; y += dy / q * k; }
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fillStyle = v * n > .03 ? '#121214' : 'rgb(18 18 20 / .3)'; g.globalAlpha = v * n > .03 ? clamp(.5 + v * 1.4) : 1; g.fill();
  }
  g.globalAlpha = 1; g.beginPath(); g.ellipse((at[0] + .5) * S, (at[1] + .5) * S, at[2] * S * at[3], at[2] * S * at[4], 0, 0, TAU); g.fillStyle = '#002FA7'; g.fill();
}
function frame(now) {
  raf = 0; if (!on || !bare()) return; if (!born) born = now;
  const t = (now - when) / 1000, u = clamp((now - since) / MOVE), b = clamp((now - born) / 1500), p = DRAW[cur].dot(Math.max(0, t)), k = smooth(u);
  if (u < 1) { const f = from, arc = Math.sin(k * Math.PI) * Math.min(1.6, Math.hypot(p[0] - f[0], p[1] - f[1]) * .12); at = [mix(f[0], p[0], k), mix(f[1], p[1], k) - arc, mix(f[2], p[2], k), mix(f[3], p[3] || 1, k), mix(f[4], p[4] || 1, k)]; }
  else at = [p[0], p[1], p[2], p[3] || 1, p[4] || 1];
  at[2] *= b < 1 ? 1 + .35 * Math.sin(b * Math.PI) * (1 - b) : 1;
  paint(Math.max(0, t), u, b); if (now > next && held < 0) show((cur + 1) % 4, now);
  raf = requestAnimationFrame(frame);
}
let from = at;
function show(i, now = performance.now()) {
  if (i === cur && since) return; from = [...at]; if (!since) from[2] = 0; was = cur; cur = i; since = now; when = now + (i === 3 ? 900 : 260); next = now + MOVE + HOLD[i]; ink(i);
}
function ink(i) { words.forEach((w, k) => w.classList.toggle('on', k === i)); }
function still() { was = cur = 1; at = [...DRAW[1].dot(1), 1, 1].slice(0, 5); at[3] = at[4] = 1; ink(-1); fig.classList.add('all'); paint(1.4, 1, 1); }
const over = document.querySelector('.hero + .over'), bare = () => !over || over.getBoundingClientRect().top > -40; // the sheet of the projects has not covered it
const go = () => { if (on && !raf && !reduce && bare()) raf = requestAnimationFrame(frame); };
addEventListener('scroll', go, { passive: true });
const hold = i => { held = i; if (i >= 0) show(i); else next = performance.now() + 2600; };

/* what is pointed at: the legend, the words of the sentence, the field */
words.forEach((w, i) => { w.addEventListener('pointerenter', () => hold(i)); w.addEventListener('pointerleave', () => hold(-1)); w.addEventListener('click', e => { e.preventDefault(); hold(i); held = -1; next = performance.now() + MOVE + HOLD[i]; }); });
const SAY = [/^(idée|idea|seule|single)$/i, /^images?$/i, /^(sites?|websites?)$/i, /^films?$/i];
if (title && matchMedia('(hover:hover)').matches) {
  title.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return; const p = document.caretPositionFromPoint ? document.caretPositionFromPoint(e.clientX, e.clientY) : null, r = p ? null : document.caretRangeFromPoint?.(e.clientX, e.clientY), n = p ? p.offsetNode : r && r.startContainer, o = p ? p.offset : r ? r.startOffset : 0;
    let i = -1; if (n && n.nodeType === 3 && title.contains(n)) { const s = n.data, a = s.slice(0, o).search(/[\p{L}]*$/u), z = o + s.slice(o).search(/[^\p{L}]|$/u); i = SAY.findIndex(x => x.test(s.slice(a, z))); }
    if (i !== held) hold(i);
  });
  title.addEventListener('pointerleave', () => { if (held >= 0) hold(-1); });
}
cv.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const b = cv.getBoundingClientRect(); ptr = [e.clientX - b.left, e.clientY - b.top]; }, { passive: true });
cv.addEventListener('pointerleave', () => { ptr = null; });

new ResizeObserver(size).observe(cv); size();
if (reduce) still();
else (window.moyoReady || Promise.resolve()).then(() => {
  new IntersectionObserver(es => { on = es[es.length - 1].isIntersecting; if (on) { if (!since) show(0); go(); } }, { rootMargin: '-4% 0px 0px 0px' }).observe(cv);
});
window.moyoFigure = i => { held = i; show(i); }; // tests
})();
