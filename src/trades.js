/* Services: the dot practises every trade. One field of dots, one of them blue, takes the shape of the service being read:
   it aligns (art direction), runs along a mark (identity), opens a depth (websites), counts (data), plays (audiovisual),
   spreads (communication), prints a halftone (publishing). From one service to the next the same dots move: one idea, seven forms.
   The service being read is the one under the pointer or the focus, otherwise the one in the middle of the screen.
   Large screens: on the fourth axis, level with the row. Small screens: next to its description.
   With reduced motion: one still image per service. */
(() => {
'use strict';
const svc = document.querySelector('.svc'), cv = svc && svc.querySelector('.svc-c');
if (!cv) return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, wide = matchMedia('(min-width:1081px)');
const rows = [...svc.querySelectorAll('.line')], g = cv.getContext('2d');
const N = 121, TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t, fract = v => v - Math.floor(v), smooth = t => t * t * t * (t * (t * 6 - 15) + 10);
/* a rhythm: every `s` seconds, from one step to the next; the move takes the first part of the beat, the rest is a pause */
const beat = (t, s, n, part) => { const k = Math.floor(t / s); return [k % n, (k + 1) % n, clamp((t / s - k) / part)]; };

/* ---------- the seven scenes: where dot i is at time t, in a square from -1 to 1: [x, y, radius, alpha, blue]. Dot 0 is the blue one. ---------- */
const CELL = .21, NODES = [[-2, -1], [1, -3], [3, 1], [0, 2], [-3, 3]];
const align = (i, t) => { // it finds its place on the grid, and what is on its axes answers
  const [a, b, u] = beat(t, 1.9, NODES.length, .62), X = mix(NODES[a][0], NODES[b][0], smooth(clamp(u * 2))) * CELL, Y = mix(NODES[a][1], NODES[b][1], smooth(clamp(u * 2 - 1))) * CELL;
  if (!i) return [X, Y, .13, 1, 1];
  const n = i - 1; if (n > 80) return [X, Y, 0, 0, 0];
  const x = (n % 9 - 4) * CELL, y = (Math.floor(n / 9) - 4) * CELL, w = Math.max(Math.exp(-((x - X) ** 2) / .005), Math.exp(-((y - Y) ** 2) / .005));
  return [x, y, .012 + .014 * w, .24 + .76 * w, 0];
};
const poly = V => { const L = []; let sum = 0; for (let k = 1; k < V.length; k++) { const l = Math.hypot(V[k][0] - V[k - 1][0], V[k][1] - V[k - 1][1]); L.push(l); sum += l; } return s => { let d = s * sum, k = 0; while (k < L.length - 1 && d > L[k]) d -= L[k++]; const u = d / L[k]; return [mix(V[k][0], V[k + 1][0], u), mix(V[k][1], V[k + 1][1], u)]; }; };
const MARKS = [s => [Math.sin(s * TAU) * .76, -Math.cos(s * TAU) * .76], poly([[0, -.68], [.68, -.68], [.68, .68], [-.68, .68], [-.68, -.68], [0, -.68]]), poly([[0, -.8], [.84, .62], [-.84, .62], [0, -.8]])];
const mark = (i, t) => { // a mark that changes shape, and the dot that runs on it
  const [a, b, u] = beat(t, 2.3, 3, .5), k = smooth(u), at = s => { const p = MARKS[a](s), q = MARKS[b](s); return [mix(p[0], q[0], k), mix(p[1], q[1], k)]; }, head = fract(t * .13);
  if (!i) { const p = at(head); return [p[0], p[1], .1, 1, 1]; }
  if (i > 84) { const p = at(head); return [p[0], p[1], 0, 0, 0]; }
  const s = (i - 1) / 84, p = at(s), tail = Math.exp(-fract(head - s) * 11); return [p[0], p[1], .014 + .022 * tail, .5 + .5 * tail, 0];
};
const depth = (i, t) => { // a depth to go into
  if (!i) return [0, 0, .062 + .007 * Math.sin(t * 2), 1, 1];
  const n = i - 1, ring = n % 8, a = Math.floor(n / 8) / 15 * TAU + ring * .21 + t * .06, z = fract(ring / 8 + t * .11), R = .1 * Math.pow(9.4, z);
  return [Math.cos(a) * R, Math.sin(a) * R, .005 + .027 * z * z, Math.min(1, z * 6) * Math.min(1, (1 - z) * 4), 0];
};
const height = (c, t) => 1.4 + 6.4 * (.5 + .5 * Math.sin(t * .6 + c * 1.7) * Math.cos(t * .37 + c * .9));
const count = (i, t) => { // values, and the highest one
  if (!i) { let m = 0; for (let c = 1; c < 9; c++) if (height(c, t) > height(m, t)) m = c; return [(m - 4) * .2, .82 - Math.ceil(height(m, t)) * .2 - .01, .082, 1, 1]; }
  const n = i - 1; if (n > 80) return [0, .82, 0, 0, 0];
  const c = n % 9, k = Math.floor(n / 9), v = clamp(height(c, t) - k); return [(c - 4) * .2, .82 - k * .2 - (1 - v) * .07, .058 * Math.sqrt(v), 1, 0];
};
const play = (i, t) => { // a film being played
  const X = -.92 + 1.84 * fract(t / 5.2); if (!i) return [X, 0, .075, 1, 1];
  const n = i - 1, c = n % 24, k = Math.floor(n / 24) - 2, x = (c - 11.5) * .08, a = Math.abs(Math.sin(c * .58 + t * 1.5)) * (.25 + .75 * Math.abs(Math.sin(c * .23 - t * .6)));
  return [x, k * (.03 + .24 * a), .021, x < X ? 1 : .26, 0];
};
const HEX = (() => { const a = []; for (let q = -5; q <= 5; q++) for (let r = Math.max(-5, -q - 5); r <= Math.min(5, -q + 5); r++) if (q || r) a.push([(q + r / 2) * .166, r * .166 * .866]); return a.sort((p, q) => Math.hypot(...p) - Math.hypot(...q)); })();
const spread = (i, t) => { // a message, heard further and further
  const s = fract(t / 2.6), front = s * 1.35; if (!i) return [0, 0, .088 + .03 * Math.exp(-s * 9), 1, 1];
  const p = HEX[i - 1]; if (!p) return [0, 0, 0, 0, 0];
  const w = Math.exp(-(((Math.hypot(p[0], p[1]) - front) / .12) ** 2)) * (1 - s * .55); return [p[0], p[1], .014 + .034 * w, .26 + .74 * w, w];
};
const DOTS = (() => { const a = []; for (let r = -8; r <= 8; r++) for (let c = -8; c <= 8; c++) { const x = (c + r) * .1115, y = (c - r) * .1115; if (Math.hypot(x, y) < .88) a.push([x, y]); } return a; })();
const print = (i, t) => { // a halftone, and the light on it
  const X = Math.cos(t * .7 - 2.2) * .5, Y = Math.sin(t * .7 - 2.2) * .5; if (!i) return [X, Y, .088, 1, 1];
  const p = DOTS[i - 1]; if (!p) return [X, Y, 0, 0, 0];
  return [p[0], p[1], .008 + .074 * Math.pow(clamp(Math.hypot(p[0] - X, p[1] - Y) / 1.3), 1.25), 1, 0];
};
const SCENES = { s1t: align, s4t: mark, s2t: depth, s3t: count, s5t: play, s6t: spread, s7t: print };
const scene = rows.map(r => SCENES[r.querySelector('[data-i]').dataset.i] || align);

/* ---------- the dots ---------- */
const X = new Float32Array(N), Y = new Float32Array(N), R = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N), VX = new Float32Array(N), VY = new Float32Array(N), LX = new Float32Array(N).fill(9), LY = new Float32Array(N).fill(9);
let W = 0, S = 1, D = 1, cur = -1, t0 = 0, since = 0, on = false, raf = 0, last = 0, ptr = null, over = -1;
function size() { W = cv.clientWidth; D = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = Math.round(W * D); S = W / 2 * .96; if (reduce) still(); place(); }
function place() { // level with the row, or with its description
  if (cur < 0) return; const r = rows[cur], p = r.querySelector('p');
  const y = wide.matches ? clamp(r.offsetTop + r.offsetHeight / 2 - W / 2, 0, Math.max(0, svc.offsetHeight - W)) : r.offsetTop + p.offsetTop + p.offsetHeight / 2 - W / 2;
  cv.style.setProperty('--y', y.toFixed(1) + 'px');
}
function draw() {
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, W);
  for (let i = N - 1; i >= 0; i--) {
    if (R[i] * S < .18 || A[i] < .02) continue;
    let x = W / 2 + X[i] * S, y = W / 2 + Y[i] * S;
    if (ptr) { const dx = x - ptr[0], dy = y - ptr[1], d = Math.hypot(dx, dy) || 1, k = W * .075 * Math.exp(-(d * d) / (W * W * .028)); x += dx / d * k; y += dy / d * k; }
    const b = B[i]; g.beginPath(); g.arc(x, y, R[i] * S, 0, TAU); g.fillStyle = `rgba(${mix(18, 0, b) | 0},${mix(18, 47, b) | 0},${mix(20, 167, b) | 0},${A[i].toFixed(3)})`; g.fill();
  }
}
function still() { if (cur < 0) return; for (let i = 0; i < N; i++) [X[i], Y[i], R[i], A[i], B[i]] = scene[cur](i, 1.1); draw(); }
function frame(now) {
  raf = 0; if (!on) return;
  const dt = Math.min(.034, (now - (last || now)) / 1000) || .016; last = now; since += dt; const t = (now - t0) / 1000, f = scene[cur];
  for (let i = 0; i < N; i++) {
    const p = f(i, t);
    if (since > .9 && Math.hypot(p[0] - LX[i], p[1] - LY[i]) > .5 && i) { X[i] = p[0]; Y[i] = p[1]; VX[i] = VY[i] = 0; A[i] = 0; } // a ring that starts again from the middle
    LX[i] = p[0]; LY[i] = p[1];
    const k = since < 1.4 ? 46 + (i * 37 % 90) : 240, c = 2 * Math.sqrt(k) * .86; // a soft spring while the shape changes, a firm one once it is there
    VX[i] += ((p[0] - X[i]) * k - VX[i] * c) * dt; VY[i] += ((p[1] - Y[i]) * k - VY[i] * c) * dt; X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
    const e = 1 - Math.exp(-9 * dt); R[i] += (p[2] - R[i]) * e; A[i] += (p[3] - A[i]) * e; B[i] += (p[4] - B[i]) * e;
  }
  draw(); raf = requestAnimationFrame(frame);
}
const go = () => { if (on && !raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
function read(i) { if (i === cur || i < 0) return; cur = i; since = 0; LX.fill(9); rows.forEach((r, k) => r.classList.toggle('read', k === i)); place(); if (reduce) still(); }
function middle() { // nothing under the pointer: the row in the middle of the screen
  if (over >= 0) return; const m = innerHeight * .52; let best = 0, d = 1e9;
  rows.forEach((r, i) => { const q = r.getBoundingClientRect(), e = Math.abs(q.top + q.height / 2 - m); if (e < d) { d = e; best = i; } }); read(best);
}
rows.forEach((r, i) => {
  r.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { over = i; read(i); } });
  r.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') over = -1; });
  r.addEventListener('focusin', () => { over = i; read(i); }); r.addEventListener('focusout', () => { over = -1; });
});
A[0] = 1; B[0] = 1; R[0] = .13; // before anything, one dot
new IntersectionObserver(es => { const v = es[es.length - 1].isIntersecting; if (v === on) return; on = v; cv.classList.toggle('on', v); if (v) { if (!t0) t0 = performance.now(); middle(); go(); } }, { rootMargin: '-14% 0px -14% 0px' }).observe(svc);
let q = 0; addEventListener('scroll', () => { if (on && !q) q = requestAnimationFrame(() => { q = 0; middle(); }); }, { passive: true });
cv.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); ptr = e.pointerType === 'mouse' ? [e.clientX - b.left, e.clientY - b.top] : null; }, { passive: true });
cv.addEventListener('pointerleave', () => { ptr = null; });
new ResizeObserver(size).observe(cv); new ResizeObserver(place).observe(svc);
size();
})();
