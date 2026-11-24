/* Method, in four scenes. The section stays on screen while its four steps pass with the scroll; one field of dots is the only actor:
   it listens (waves), it chooses (one among many), it builds (the dots write the name, the blue one is its final point), it stays (an orbit).
   The dots step aside under the pointer. Without JavaScript or with reduced motion the section is a plain list of four steps. */
(() => {
'use strict';
const sec = document.getElementById('methode'), cv = sec && sec.querySelector('.mth-c');
if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const steps = [...sec.querySelectorAll('.step')], tabs = [...sec.querySelectorAll('.tab')], g = cv.getContext('2d');
sec.classList.add('live');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), smooth = t => t * t * t * (t * (t * 6 - 15) + 10), TAU = Math.PI * 2, N = 130;

/* where each dot is in each scene: [x, y, radius, alpha], in a square from -1 to 1. Dot 0 is the blue one. */
const ringOf = (() => { const a = [[0, 0]]; for (let k = 1; k <= 6; k++) for (let j = 0; j < 6 * k; j++) a.push([k, j / (6 * k) * TAU + k * .21]); while (a.length < N) a.push([0, 0]); return a; })();
const cells = (() => { const a = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 13; c++) a.push([(c - 6) * .152, (r - 4.5) * .152]); const i = 4 * 13 + 8; [a[0], a[i]] = [a[i], a[0]]; return a; })();
const word = (() => {
  const G = { m: ['11110', '10101', '10101', '10101', '10101'], o: ['0110', '1001', '1001', '1001', '0110'], y: ['1001', '1001', '1001', '1001', '0111', '0001', '0110'] }, a = []; let x = 0;
  for (const ch of 'moyo') { G[ch].forEach((row, r) => [...row].forEach((v, c) => { if (v === '1') a.push([x + c, r]); })); x += G[ch][0].length + 1; }
  const s = 1.92 / (x + .2), w = x - 1; return { dots: a.map(([c, r]) => [(c - w / 2 - .6) * s, (r - 2.6) * s]), end: [(w - w / 2 - .6 + .35) * s, (4 - 2.6) * s], s };
})();
const SCENES = [
  (i, t) => { const [k, a] = ringOf[i]; if (!i) return [0, 0, .062 + .006 * Math.sin(t * 2.2), 1]; const w = Math.sin(t * 2.1 - k * .95), r = k * .152 * (1 + .03 * w); return [Math.cos(a) * r, Math.sin(a) * r, k ? .0125 + .0055 * w : 0, 1 - k * .13]; },
  (i, t) => { const [x, y] = cells[i]; return i ? [x, y, .0125 + .012 * Math.pow(Math.max(0, Math.sin(t * 1.1 + i * 2.399)), 14), .34] : [x, y, .062, 1]; },
  (i) => { if (!i) return [word.end[0], word.end[1], word.s * .46, 1]; const [x, y] = word.dots[(i - 1) % word.dots.length]; return [x, y, word.s * .4, 1]; },
  (i, t) => { const a = t * .62 - i / N * TAU, q = 1 - i / N; return [Math.cos(a) * .76, Math.sin(a) * .76, i ? .004 + .03 * Math.pow(q, 1.5) : .062, i ? .06 + .94 * q : 1]; }
];

let W = 0, H = 0, S = 1, D = 1, p = 0, ptr = null, on = false, raf = 0, cur = -1;
const px = new Float32Array(N), py = new Float32Array(N);
function size() { const r = cv.getBoundingClientRect(); D = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * D); cv.height = Math.round(H * D); S = Math.min(W, H) / 2 * .98; }
function read() {
  const r = sec.getBoundingClientRect(), len = r.height - innerHeight;
  p = clamp(-r.top / Math.max(1, len)) * 4;
  const k = Math.min(3, Math.floor(Math.min(p, 3.999) + .16));
  if (k !== cur) { cur = k; steps.forEach((s, i) => { s.classList.toggle('now', i === k); s.classList.toggle('was', i < k); }); tabs.forEach((s, i) => s.classList.toggle('now', i === k)); }
  tabs.forEach((s, i) => s.style.setProperty('--f', clamp(p - i).toFixed(3)));
}
function frame(now) {
  raf = 0; if (!on) return;
  const t = now / 1000, f = Math.min(p, 3.999), a = Math.floor(f), m = clamp((f - a - .56) / .44), b = Math.min(3, a + 1);
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  for (let n = N - 1; n >= 0; n--) {
    const A = SCENES[a](n, t); let [x, y, r, al] = A;
    if (m > 0 && b !== a) { const B = SCENES[b](n, t), u = smooth(clamp(m * 1.45 - n / N * .45)), arc = Math.sin(u * Math.PI) * .13 * (n % 2 ? 1 : -1), dx = B[0] - x, dy = B[1] - y; x += dx * u - dy * arc; y += dy * u + dx * arc; r += (B[2] - r) * u; al += (B[3] - al) * u; }
    let X = cx + x * S, Y = cy + y * S, ox = 0, oy = 0;
    if (ptr) { const dx = X - ptr[0], dy = Y - ptr[1], d = Math.hypot(dx, dy) || 1, k = 34 * Math.exp(-(d * d) / 5200); ox = dx / d * k; oy = dy / d * k; }
    px[n] += (ox - px[n]) * .14; py[n] += (oy - py[n]) * .14;
    if (r <= 0) continue;
    g.beginPath(); g.arc(X + px[n], Y + py[n], Math.max(.4, r * S), 0, TAU);
    g.fillStyle = n ? `rgba(18,18,20,${al.toFixed(3)})` : '#002FA7'; g.fill();
  }
  raf = requestAnimationFrame(frame);
}
const go = () => { if (on && !raf) raf = requestAnimationFrame(frame); };
new IntersectionObserver(es => { on = es[es.length - 1].isIntersecting; if (on) { read(); go(); } }).observe(sec);
addEventListener('scroll', () => { if (on) read(); }, { passive: true });
addEventListener('resize', () => { size(); read(); }); new ResizeObserver(size).observe(cv);
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); ptr = e.pointerType === 'mouse' ? [e.clientX - r.left, e.clientY - r.top] : null; }, { passive: true });
cv.addEventListener('pointerleave', () => { ptr = null; });
/* a tab goes to its scene (site.js owns the smooth scroll) */
tabs.forEach((b, i) => b.addEventListener('click', () => { const r = sec.getBoundingClientRect(), y = scrollY + r.top + (r.height - innerHeight) * (i + .3) / 4; (window.moyoScroll || (v => scrollTo(0, v)))(y); }));
size(); read();
})();
