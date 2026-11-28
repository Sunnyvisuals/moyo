/* What opens a page (the class was chosen in the <head>):
   - html.load: first visit or reload. A number counts up where the title will be, followed by the dot. At 100 the number leaves and the dot
     draws the title, line after line, then stays as its final point.
   - html.enter: coming from a link of the site. The screen is blue (the dot opened on the click, see leave.js) and closes on the final point of the title.
   - On the home, "Tout part d’un point." (drop()): the point falls from the sky onto the page, where the final point of the sentence is, or the blue of
     the link closes on it. Where it lands one wave leaves it, and the sentence appears behind the wave, bent as it passes, like a word under water.
   window.moyoReady resolves when the stage is free (stage.js waits for it), window.moyoDrawn when the title is there. Any key, click or scroll jumps to the end,
   except on the home, which is seen whole: the page does not scroll until it is over, and only Escape ends it. Nothing with reduced motion. */
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
  root.classList.remove('load', 'enter'); hold(false);
  if (layer) layer.remove();
  if (title) { title.style.clipPath = ''; title.style.color = ''; }
  if (mark) mark.style.visibility = '';
  SKIP.forEach(n => removeEventListener(n, skip)); removeEventListener('scroll', away);
  free(); drawn();
}
/* any key, click or scroll jumps to the end; while the home opens (held), the page does not scroll and only Escape ends it, so that it is seen whole */
let held = false;
const skip = e => { if (held && !(e.type === 'keydown' && e.key === 'Escape')) return; hurry = true; }, SKIP = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
const away = () => { if (scrollY >= 24) skip({ type: 'scroll' }); }; // the scroll bar, a script
SKIP.forEach(n => addEventListener(n, skip, { passive: true })); addEventListener('scroll', away, { passive: true });
const block = e => { if (e.type === 'keydown' && !/^( |Spacebar|PageUp|PageDown|Home|End|ArrowUp|ArrowDown)$/.test(e.key)) return; e.preventDefault(); e.stopImmediatePropagation(); };
function hold(on) { if (held === on) return; held = on; root.classList.toggle('hold', on); for (const n of ['wheel', 'touchmove', 'keydown']) on ? addEventListener(n, block, { capture: true, passive: false }) : removeEventListener(n, block, { capture: true }); }

/* the final point of the title on screen: the one of the h1, or of the section the link leads to */
const onScreen = r => r.bottom > 0 && r.top < innerHeight;
function findMark() { return [...document.querySelectorAll('h1 .dot b,main h2 .dot b')].find(b => onScreen(b.getBoundingClientRect())) || null; }

async function enter() {
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (home() && scrollY < 20 && location.hash.length < 2) return drop(true);
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
  if (home()) return drop(false);
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

/* ---------- the home: tout part d\u2019un point ----------
   The point falls from the top of the screen as a drop, pointed at first and round as it comes down, or the blue of the link closes on it. On the
   line it flattens and wobbles before it settles as the point, and one ring leaves it and crosses the screen: behind the ring the sentence is there,
   bent as the ring passes like a word under water, then still. The facts above come once the ring has passed them. The page holds still meanwhile.
   WebGL draws the time of the wave, each letter where the page puts it, and the page takes over at the end, exactly in place. Without WebGL the
   ring simply uncovers the sentence. */
const home = () => !!(title || (title = document.querySelector('h1.t-hero'))) && !!title.closest('#top');
async function drop(blue) {
  if (window.moyoFit) moyoFit();
  title = document.querySelector('#top h1.t-hero'); mark = title && title.querySelector('.dot b'); if (!mark) return end();
  const W = innerWidth, H = innerHeight, m = mark.getBoundingClientRect(), P = [m.left + m.width / 2, m.top + m.height / 2], r0 = m.width / 2;
  const C = getComputedStyle(title), fs = parseFloat(C.fontSize), font = `${C.fontWeight} ${fs}px ${C.fontFamily}`, ink = C.color, g0 = document.createElement('canvas').getContext('2d');
  g0.font = `${C.fontWeight} 100px ${C.fontFamily}`; const A = g0.measureText('M').fontBoundingBoxAscent / 100;
  const KL = getComputedStyle(root).getPropertyValue('--klein').trim() || '#002FA7';
  const tone = c => { g0.fillStyle = '#000'; g0.fillStyle = c; const h = String(g0.fillStyle); return h[0] === '#' ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) : (h.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(v => v / 255); };
  const list = [], rg = document.createRange(), tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) for (let i = 0; i < n.length; i++) { const ch = n.data[i]; if (/[\s\u2060]/.test(ch)) continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getClientRects()[0]; if (r) list.push([ch, r.left, r.top + A * fs]); }
  const far = Math.hypot(Math.max(P[0], W - P[0]), Math.max(P[1], H - P[1])), Rmax = far + fs * 1.2;
  const reach = Math.max(0, ...[...document.querySelectorAll('#top .hero-top>*')].map(e => { const r = e.getBoundingClientRect(); return Math.hypot(Math.max(P[0] - r.left, r.right - P[0]), Math.max(P[1] - r.top, r.bottom - P[1])); })) || far * .8;
  layer = document.createElement('div'); layer.className = 'ld'; layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer);
  const paint = water(layer, list, font, ink, W, H, P, tone(ink), tone(KL));
  let ring = null, box = null;
  if (paint) title.style.color = 'transparent';
  else { box = title.getBoundingClientRect(); title.style.clipPath = 'circle(0px at 0px 0px)'; ring = document.createElement('i'); ring.style.cssText = `position:absolute;left:0;top:0;border:1.5px solid ${KL};border-radius:50%`; layer.appendChild(ring); }
  mark.style.visibility = 'hidden'; hold(true); setTimeout(() => hold(false), 10000); // never held for good, whatever happens
  const drip = goutte(layer, P, r0, KL, getComputedStyle(root).getPropertyValue('--bg').trim() || '#FAFAF8');
  if (blue) { // coming from a link: the screen is blue, and it closes on the point, which then lands
    drip.still(); const kl = document.createElement('div'); kl.className = 'kl'; layer.appendChild(kl); root.classList.remove('enter');
    await tween(900, t => 1 - Math.pow(1 - t, 3.2), u => { kl.style.clipPath = `circle(${(r0 + (far + 4 - r0) * (1 - u)).toFixed(1)}px at ${P[0].toFixed(1)}px ${P[1].toFixed(1)}px)`; });
    kl.remove();
  } else { // a drop gathers under the top of the screen, lets go and falls
    drip.fall(0); root.classList.remove('load');
    await tween(drip.T, t => t, u => drip.fall(u * drip.T));
  }
  // on the line it flattens, holds, jumps back and settles round: the point. The wave leaves it at the same moment
  let freed = false;
  await tween(2600, t => t, u => {
    const ms = u * 2600, e = 1 - Math.pow(1 - u, 2.6), R = r0 + (Rmax - r0) * e;
    if (blue) drip.land(ms, .4, 0, 0); else drip.land(ms, .85, 85, 1);
    if (paint) paint(R, fs * .08 * Math.pow(1 - u, 1.4) * Math.min(1, u * 30), fs * (.4 + .3 * e), .85 * Math.pow(1 - u, 1.3) * Math.min(1, u * 40)); // a wide, soft lens: never more than 1.7 times larger, never folded
    else { title.style.clipPath = `circle(${R.toFixed(1)}px at ${(P[0] - box.left).toFixed(1)}px ${(P[1] - box.top).toFixed(1)}px)`; ring.style.width = ring.style.height = 2 * R + 'px'; ring.style.translate = `${(P[0] - R).toFixed(1)}px ${(P[1] - R).toFixed(1)}px`; ring.style.opacity = (.85 * Math.pow(1 - u, 1.3)).toFixed(3); }
    if (!freed && R > reach) { freed = true; free(); }
  });
  end();
}

/* The drop, drawn the way animators draw one. It gathers under the top of the screen and swells, slowly; its neck thins and snaps (fast, as water
   does), the rest springs back up and the tail goes into the drop, which wobbles once free: all of it on twos, each drawing held for two frames of
   film. Then it rounds up and is drawn out by its speed; one smear just before the line. On the line it flattens hard and holds, on twos again,
   jumps back up drawn out the other way, and settles round, losing its shine: it is the point. Shapes in a "goo" filter (blur, then a hard edge on the alpha) merge like water when they touch and part with a neck. */
function goutte(layer, P, r0, KL, BG) {
  const NS = 'http://www.w3.org/2000/svg', rb = r0 * 1.12, gy = P[1] + r0, x0 = P[0], X = x0 - rb * 7, Wc = rb * 14, Hc = gy + rb * 7;
  const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', `${X.toFixed(2)} 0 ${Wc.toFixed(2)} ${Hc.toFixed(2)}`); layer.appendChild(sv); // a column around the drop, on its own layer: the wave under it is not painted again
  sv.style.cssText = `position:absolute;left:${X.toFixed(2)}px;top:0;width:${Wc.toFixed(2)}px;height:${Hc.toFixed(2)}px;overflow:visible;will-change:transform`;
  const mk = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || sv).appendChild(e); return e; };
  const id = 'goo' + Math.random().toString(36).slice(2, 8), f = mk('filter', { id, filterUnits: 'userSpaceOnUse', x: X, y: -rb * 3, width: Wc, height: Hc + rb * 3, 'color-interpolation-filters': 'sRGB' }, mk('defs', {}));
  mk('feGaussianBlur', { stdDeviation: (rb * .3).toFixed(2) }, f); mk('feColorMatrix', { type: 'matrix', values: '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -9' }, f);
  const g = mk('g', { filter: `url(#${id})`, fill: KL }), M = mk('ellipse', { cx: x0 }, g), N = mk('ellipse', { cx: x0 }, g), B = mk('ellipse', { cx: x0 }, g);
  const S = mk('ellipse', { fill: BG, opacity: 0 }), O = mk('circle', { cx: x0, cy: P[1], r: r0, fill: KL, visibility: 'hidden' });
  const el = (e, cy, rx, ry) => { e.setAttribute('cy', cy.toFixed(2)); e.setAttribute('rx', Math.max(0, rx).toFixed(2)); e.setAttribute('ry', Math.max(0, ry).toFixed(2)); };
  const shine = (cy, r, sx, sy, a) => { S.setAttribute('opacity', Math.max(0, a).toFixed(3)); S.setAttribute('rx', (r * .25 * Math.min(sx, 1.3)).toFixed(2)); S.setAttribute('ry', (r * .14 * Math.min(sy, 1.3)).toFixed(2)); S.setAttribute('transform', `translate(${(x0 - r * .36 * sx).toFixed(2)} ${(cy - r * .38 * sy).toFixed(2)}) rotate(-38)`); };
  const cl = x => Math.min(1, Math.max(0, x)), io = x => .5 - .5 * Math.cos(Math.PI * cl(x)), out = x => 1 - Math.pow(1 - cl(x), 3);
  const T1 = 850, T2 = 1130, T = 1830; // gathered, let go, on the line
  let yR = 0, done = false;
  const gloss = (sy, a) => a * cl((sy - .62) / .2) * cl((1.6 - sy) / .25); // no shine when it is flat or a streak
  const zone = (y0, y1) => { f.setAttribute('y', y0.toFixed(1)); f.setAttribute('height', Math.max(1, y1 - y0).toFixed(1)); }; // the filter only works where the drop is
  return {
    T,
    still() { el(M, 0, 0, 0); el(N, 0, 0, 0); el(B, P[1], r0, r0); zone(gy - rb * 6, gy + rb * 3); },
    fall(t) {
      if (t < T2 + 240) t = Math.floor(t / 83) * 83; // on twos, like the landing, until it is free of the top
      if (t < T2) { // hanging: a thin film spreads under the top, the drop swells under it, swaying a little; then it sinks, its neck draws out and thins, (t - tc)^2/3, and snaps
        const p = cl(t / T1), q = cl((t - T1) / (T2 - T1)), r = rb * (.3 + .7 * io(p)), y = rb * (.45 + .95 * Math.pow(p, 1.4)) + rb * Math.pow(q, 1.6);
        const w = 1 + .05 * Math.sin(p * 13.8) * p, sy = (1 + .16 * q) / w, sx = 1 / sy, top = rb * .2, bot = y - r * sy * .3;
        el(M, 0, rb * (.3 + 1 * out(p / .5)), rb * (.15 + .32 * out(p / .5) + .1 * q)); el(N, (top + bot) / 2, rb * (.42 - .08 * p) * Math.pow(1 - q, .67), (bot - top) / 2); el(B, y, r * sx, r * sy);
        shine(y, r, sx, sy, gloss(sy, .85 * io((p - .35) / .4))); zone(-rb * 3, y + rb * 4); yR = y; return;
      }
      // free: the rest springs back into the top, the tail goes into the drop, it wobbles and rounds up, then its speed draws it out
      const ms = t - T2, s = cl(ms / (T - T2)), yI = gy - rb, back = cl(1 - ms / 240), tail = 1 - out(ms / 200);
      const osc = .13 * Math.exp(-ms / 200) * Math.cos(2 * Math.PI * ms / 190), k = .4 * s * s * s, smear = s > .955;
      let sy = smear ? 2.1 : (1 + k) / (1 + osc), sx = 1 / sy, y = yR + (yI - yR) * (.18 * s + .82 * s * s);
      if (smear) y -= rb * (sy - 1) * .55; // the one drawing where it is a streak
      el(M, 0, rb * 1.3 * back, rb * .57 * back * back); el(N, y - rb * sy * .85 - rb * .45 * tail, rb * .26 * tail, rb * (.45 * tail + .1) * (tail > 0)); el(B, y, rb * sx, rb * sy);
      shine(y, rb, sx, sy, gloss(sy, .85)); zone(back > 0 ? -rb * 3 : y - rb * (sy + 3), y + rb * 4);
    },
    land(tp, A, hold, sh) { // tp: since it touched the line
      if (tp >= 900) { if (!done) { done = true; g.setAttribute('visibility', 'hidden'); S.setAttribute('visibility', 'hidden'); O.setAttribute('visibility', 'visible'); } return; }
      const tau = Math.max(0, tp - hold), q = tau < 332 ? Math.floor(tau / 83) * 83 : tau; // the first drawings on twos
      const k = A * Math.exp(-q / 150) * Math.cos(2 * Math.PI * q / 330), sx = 1 + k, sy = 1 / sx, r = rb + (r0 - rb) * out(tau / 400);
      const lift = q < 300 ? rb * .75 * (A / .85) * Math.sin(Math.PI * q / 300) * Math.exp(-q / 220) : 0, cy = gy - r * sy - lift;
      el(M, 0, 0, 0); el(N, 0, 0, 0); el(B, cy, r * sx, r * sy); shine(cy, r, sx, sy, gloss(sy, sh * .85 * (1 - io((tp - 250) / 400)))); zone(gy - rb * 6, gy + rb * 3);
    }
  };
}

/* the sentence under water: painted once at the size of the screen, then bent by the wave on the graphics card. The crest of the ring is a lens:
   what is under it swells, then settles. Returns null where WebGL is not there. */
function water(layer, list, font, color, W, H, P, ink, kl) {
  const cv = document.createElement('canvas'); let gl = null;
  try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }); } catch (_) {}
  if (!gl) return null;
  const D = Math.min(2, devicePixelRatio || 1, (gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096) / Math.max(W, H));
  cv.width = Math.round(W * D); cv.height = Math.round(H * D); cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
  const pic = document.createElement('canvas'); pic.width = cv.width; pic.height = cv.height;
  const g = pic.getContext('2d'); g.setTransform(D, 0, 0, D, 0, 0); g.font = font; g.fillStyle = color; for (const [ch, x, y] of list) g.fillText(ch, x, y);
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
  const fs = sh(gl.FRAGMENT_SHADER, `precision highp float;
uniform sampler2D T;uniform vec2 S,C;uniform float D,R,A,B,K;uniform vec3 I,L;
void main(){
  vec2 p=vec2(gl_FragCoord.x,S.y*D-gl_FragCoord.y)/D,d=p-C;
  float r=length(d),x=r-R,y=x+B*.45,s=A*-2.*y/B*exp(-y*y/(B*B));
  float a=texture2D(T,(p+(r>.5?d/r:vec2(0.))*s)/S).a*(1.-smoothstep(-1.,1.,x));
  float k=K*(1.-smoothstep(.6,.6+1.3/D,abs(x)));
  gl_FragColor=vec4(L*k+I*a*(1.-k),k+a*(1.-k));
}`);
  if (!vs || !fs) return null;
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
  const u = n => gl.getUniformLocation(pr, n);
  gl.uniform1i(u('T'), 0); gl.uniform2f(u('S'), W, H); gl.uniform2f(u('C'), P[0], P[1]); gl.uniform1f(u('D'), D); gl.uniform3fv(u('I'), ink); gl.uniform3fv(u('L'), kl);
  const uR = u('R'), uA = u('A'), uB = u('B'), uK = u('K');
  gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0);
  const paint = (R, amp, band, ring) => { gl.uniform1f(uR, R); gl.uniform1f(uA, amp); gl.uniform1f(uB, Math.max(1, band)); gl.uniform1f(uK, ring); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  paint(0, 0, 1, 0);
  if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) return null;
  layer.appendChild(cv);
  return paint;
}

// a deferred script runs while the page is already "interactive", before the others: wait for all of them (hero.js gives the sentence its size)
const dcl = new Promise(r => { if (document.readyState === 'complete') return r(); addEventListener('DOMContentLoaded', r, { once: true }); setTimeout(r, 3000); });
Promise.all([dcl, Promise.race([document.fonts.ready, wait(1500)])]).then(() => new Promise(r => requestAnimationFrame(r))).then(mode === 'load' ? load : enter).catch(end);
})();
