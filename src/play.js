/* The idea in your hand: the final point of a page title can be picked up and thrown. It bounces on the lines of the title and on the edges
   of the screen, then hops back to its place. A click or a tap makes it jump. Nobody has to know: on the first screen, if nothing happens
   for a while, it only makes a small hop. The title itself never moves. Nothing with reduced motion. */
(() => {
'use strict';
const title = document.querySelector('h1.t-hero'), mark = title && title.querySelector('.dot b'), root = document.documentElement;
if (!mark || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const st = document.createElement('style');
st.textContent = `h1 .dot b{position:relative;cursor:grab;touch-action:none;transition:scale .5s cubic-bezier(.16,1,.3,1)}
h1 .dot b::after{content:"";position:absolute;inset:-16px;border-radius:50%}
@media (hover:hover){h1 .dot b:hover{scale:1.25}}
.ball{position:fixed;left:0;top:0;z-index:95;border-radius:50%;background:var(--klein);cursor:grab;touch-action:none;will-change:transform}
html.grab,html.grab *{cursor:grabbing!important;user-select:none;-webkit-user-select:none}
html.grab .cur{opacity:0!important}`;
document.head.appendChild(st);

let ball = null, b = null, walls = [], raf = 0, last = 0, held = false, ptr = [0, 0], trail = [], born = 0, calm = 0, home = null, moved = 0;
const centre = () => { const r = mark.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width / 2]; };
/* the lines of the title, from the top of the capitals to the baseline: what the ball bounces on */
function lines() {
  const C = getComputedStyle(title), fs = parseFloat(C.fontSize), g = document.createElement('canvas').getContext('2d'); g.font = `${C.fontWeight} 100px ${C.fontFamily}`;
  const m = g.measureText('H'), asc = m.fontBoundingBoxAscent / 100 * fs, cap = m.actualBoundingBoxAscent / 100 * fs, rg = document.createRange(), rows = [], tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (!n.textContent.replace(/[\s⁠]/g, '') || n.parentElement.closest('.sr,.r2')) continue; rg.selectNodeContents(n);
    for (const q of rg.getClientRects()) { if (q.width < 2) continue; const o = rows.find(k => Math.abs(k.y - q.top) < fs * .4); if (o) { o.l = Math.min(o.l, q.left); o.r = Math.max(o.r, q.right); } else rows.push({ y: q.top, l: q.left, r: q.right }); } }
  return rows.map(o => ({ l: o.l, r: o.r, t: o.y + asc - cap, b: o.y + asc }));
}
function take(e) {
  if (e.button || home) return; e.preventDefault(); e.stopPropagation();
  const [x, y, r] = ball ? [b.x, b.y, b.r] : centre();
  if (!ball) { ball = document.createElement('div'); ball.className = 'ball'; ball.setAttribute('aria-hidden', 'true'); ball.style.width = ball.style.height = r * 2 + 'px'; document.body.appendChild(ball); ball.addEventListener('pointerdown', take); b = { x, y, r, vx: 0, vy: 0 }; mark.style.opacity = '0'; mark.style.pointerEvents = 'none'; }
  walls = lines(); held = true; moved = 0; ptr = [e.clientX, e.clientY]; trail = [[performance.now(), ...ptr]]; root.classList.add('grab');
  addEventListener('pointermove', drag, { passive: true }); addEventListener('pointerup', drop); addEventListener('pointercancel', drop);
  put(); kick();
}
function drag(e) { moved += Math.hypot(e.clientX - ptr[0], e.clientY - ptr[1]); ptr = [e.clientX, e.clientY]; const t = performance.now(); trail.push([t, ...ptr]); while (trail.length > 2 && t - trail[0][0] > 90) trail.shift(); }
function drop() {
  removeEventListener('pointermove', drag); removeEventListener('pointerup', drop); removeEventListener('pointercancel', drop);
  held = false; root.classList.remove('grab'); born = performance.now(); calm = 0;
  if (moved < 5) { b.vx = (Math.random() - .5) * 420; b.vy = -Math.min(1500, 700 + innerHeight * .6); return; } // a click: it jumps
  const a = trail[0], z = trail[trail.length - 1], dt = Math.max(.016, (performance.now() - a[0]) / 1000);
  b.vx = clamp((z[1] - a[1]) / dt, -3400, 3400); b.vy = clamp((z[2] - a[2]) / dt, -3400, 3400);
}
const put = () => { ball.style.transform = `translate3d(${(b.x - b.r).toFixed(2)}px,${(b.y - b.r).toFixed(2)}px,0)`; };
function hit(nx, ny, depth, k = .64) { b.x += nx * depth; b.y += ny * depth; const v = b.vx * nx + b.vy * ny; if (v < 0) { const e = v > -90 ? 0 : k; b.vx -= (1 + e) * v * nx; b.vy -= (1 + e) * v * ny; } }
function move(dt) {
  b.vy += 2600 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.x < b.r) hit(1, 0, b.r - b.x); if (b.x > innerWidth - b.r) hit(-1, 0, b.x - innerWidth + b.r);
  let ground = false;
  if (b.y > innerHeight - b.r) { hit(0, -1, b.y - innerHeight + b.r); ground = true; }
  for (const w of walls) {
    const qx = clamp(b.x, w.l, w.r), qy = clamp(b.y, w.t, w.b), dx = b.x - qx, dy = b.y - qy, d = Math.hypot(dx, dy);
    if (d >= b.r) continue;
    if (d > .01) { hit(dx / d, dy / d, b.r - d); if (dy / d < -.7) ground = true; }
    else { const up = b.y - w.t, dn = w.b - b.y, lf = b.x - w.l, rt = w.r - b.x, m = Math.min(up, dn, lf, rt); if (m === up) { hit(0, -1, up + b.r); ground = true; } else if (m === dn) hit(0, 1, dn + b.r); else if (m === lf) hit(-1, 0, lf + b.r); else hit(1, 0, rt + b.r); }
  }
  if (ground) b.vx *= Math.exp(-1.1 * dt);
  return ground;
}
function frame(now) {
  raf = 0; if (!ball) return;
  const dt = Math.min(.033, (now - (last || now)) / 1000) || .016; last = now;
  if (home) { // it goes back to its place
    const u = Math.min(1, (now - home.t) / home.ms), k = io(u), [x, y] = centre();
    b.x = home.x + (x - home.x) * k; b.y = home.y + (y - home.y) * k - Math.sin(k * Math.PI) * home.up; put();
    if (u >= 1) { ball.remove(); ball = home = null; mark.style.opacity = mark.style.pointerEvents = ''; mark.animate([{ scale: 1.8 }, { scale: 1 }], { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)' }); return; }
  } else if (held) { const f = 1 - Math.exp(-34 * dt); b.x += (ptr[0] - b.x) * f; b.y += (ptr[1] - b.y) * f; put(); }
  else {
    let g = false; for (let i = 0; i < 5; i++) g = move(dt / 5) || g; put();
    calm = g && Math.hypot(b.vx, b.vy) < 60 ? calm + dt : 0;
    if (calm > .3 || now - born > 7000) back();
  }
  kick();
}
const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
function back(quick) { if (!ball || home) return; const [x, y] = centre(), d = Math.hypot(x - b.x, y - b.y); home = { x: b.x, y: b.y, t: performance.now(), ms: quick ? 320 : clamp(420 + d * .32, 480, 900), up: quick ? 0 : clamp(d * .22, 30, 150) }; kick(); }
mark.addEventListener('pointerdown', take);
mark.addEventListener('dragstart', e => e.preventDefault());
addEventListener('scroll', () => { if (ball && !held) back(true); }, { passive: true });
addEventListener('resize', () => { if (ball && !held) back(true); });

/* the first screen of the home: if nobody does anything, a small hop */
if (document.getElementById('top')) {
  let tries = 0, timer = 0;
  const hop = () => { if (document.hidden || ball || tries++ > 2) return; mark.animate([{ translate: '0 0', easing: 'cubic-bezier(.2,.7,.3,1)' }, { translate: '0 -.55em', offset: .34, easing: 'cubic-bezier(.7,0,.8,.3)' }, { translate: '0 0', offset: .62, easing: 'cubic-bezier(.2,.7,.3,1)' }, { translate: '0 -.15em', offset: .8, easing: 'cubic-bezier(.7,0,.8,.3)' }, { translate: '0 0' }], { duration: 900 }); timer = setTimeout(hop, 9000); };
  const stop = () => { clearTimeout(timer); ['scroll', 'pointerdown', 'keydown'].forEach(n => removeEventListener(n, stop)); tries = 9; };
  (window.moyoDrawn || Promise.resolve()).then(() => { timer = setTimeout(hop, 5200); ['scroll', 'pointerdown', 'keydown'].forEach(n => addEventListener(n, stop, { passive: true })); });
}
})();
