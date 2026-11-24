/* The wordmark looks back. The two o of "moyo" are eyes, their pupils are the dot.
   What they do is what people do:
   - they look at you (Simmel: the mutual glance is the purest reciprocity, you cannot look without being seen),
   - they look away if you stare (Goffman: civil inattention), then steal a glance,
   - left alone, they look at "On se voit ?": we follow other people's eyes without deciding to,
   - they dilate in front of what interests them, wink for each founder, fall asleep when nobody moves, go round with joy on sign-up.
   Hold an eye: it dilates until the whole footer is a blue monochrome, with one sustained chord (after Yves Klein's
   Monotone-Silence Symphony, a D major chord then silence). Let go: silence.
   Nothing is stored or sent: the time spent together lives in memory only. With reduced motion the eyes stay still. */
(() => {
'use strict';
const foot = document.getElementById('foot'), mono = foot && foot.querySelector('.monument');
if (!mono) return;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const en = () => document.documentElement.lang === 'en';
const eyes = $$('.eye', mono).map((el, i) => ({ el, i, pu: $('.pu', el), hit: $('.hit', el), gx: 0, gy: 0, lid: 1, pd: 1, x: 0, y: 0 }));
const cta = $('.foot-cta', foot), mail = $('#subMail', foot);

/* ---------- geometry, measured on the font itself ---------- */
let RX = 0, RY = 0, PR = 0, R = 100, FS = 100; // inner radii of the eye, radius of the pupil and of the whole letter, in px
function ring(weight, family) { // the o, in em: centre (from the origin of the letter, above the baseline), outer radius, inner radii
  const S = 400, cv = document.createElement('canvas'), W = cv.width = S * 1.3, H = cv.height = S * 1.4, g = cv.getContext('2d', { willReadFrequently: true });
  g.font = `${weight} ${S}px ${family}`; g.fillText('o', S * .3, S);
  const d = g.getImageData(0, 0, W, H).data, on = (x, y) => d[((y | 0) * W + (x | 0)) * 4 + 3] > 110;
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (on(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return null;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let rx = 0, ry = 0; while (rx < S && !on(cx + rx, cy)) rx++; while (ry < S && !on(cx, cy + ry)) ry++;
  return { cx: (cx - S * .3) / S, cy: (S - cy) / S, r: Math.max(x1 - x0, y1 - y0) / 2 / S, rx: rx / S, ry: ry / S };
}
/* the dot of the question mark is the dot: a disc over the square one of the typeface */
function question(w, f) {
  const q = cta && $('.q', cta); if (!q) return;
  const S = 400, cv = document.createElement('canvas'), W = cv.width = S * 1.2, H = cv.height = S * 1.4, g = cv.getContext('2d', { willReadFrequently: true });
  g.font = `${w} ${S}px ${f}`; g.fillText('?', S * .2, S);
  const d = g.getImageData(0, 0, W, H).data, row = y => { let a = -1, b = -1; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 110) { if (a < 0) a = x; b = x; } return a < 0 ? null : [a, b]; };
  let y1 = H - 1; while (y1 > 0 && !row(y1)) y1--; let y0 = y1; while (y0 > 0 && row(y0)) y0--; if (y0 <= 0) return;
  const [a, b] = row((y0 + y1) >> 1), adv = g.measureText('?').width;
  let m = $('.qd', q); if (!m) { m = document.createElement('b'); m.className = 'qd'; q.appendChild(m); }
  const probe = document.createElement('i'); probe.style.cssText = 'display:inline-block;width:0;height:0'; q.appendChild(probe);
  const pr = probe.getBoundingClientRect(), qr = q.getBoundingClientRect(), size = parseFloat(getComputedStyle(q).fontSize), ls = parseFloat(getComputedStyle(q).letterSpacing) || 0; probe.remove();
  m.style.left = ((pr.left - qr.left - ls) / size - (adv - ((a + b) / 2 - S * .2)) / S).toFixed(4) + 'em';
  m.style.top = ((pr.bottom - qr.top) / size - (S - (y0 + y1) / 2) / S).toFixed(4) + 'em';
  m.style.setProperty('--qd', (Math.max(b - a, y1 - y0) / S * 1.36).toFixed(4) + 'em');
}
function fit() {
  if (!window.moyoInk) return;
  const c = getComputedStyle(mono), w = c.fontWeight, f = c.fontFamily, set = (k, v) => mono.style.setProperty(k, v);
  const m = moyoInk('m', w, f), o = moyoInk('o', w, f), y = moyoInk('y', w, f);
  const ink = m[2] + o[2] * 2 + y[2] - 3 * .055 - m[0] - o[1]; // from the stem of the m to the edge of the last o, in em (three gaps of -.055em)
  if (ink > 1) { set('--mono-k', (1 / ink).toFixed(5)); set('--mono-l', (-m[0]).toFixed(4)); }
  const r = ring(w, f); if (!r) return;
  FS = parseFloat(getComputedStyle(mono).fontSize);
  const e = eyes[0].el, lid = e.style.getPropertyValue('--lid'); e.style.setProperty('--lid', '1');
  const probe = document.createElement('i'); probe.style.cssText = 'display:inline-block;width:0;height:0'; e.appendChild(probe);
  const base = (probe.getBoundingClientRect().bottom - e.getBoundingClientRect().top) / FS; probe.remove(); e.style.setProperty('--lid', lid || '1');
  const pr = Math.min(r.rx, r.ry) * .58;
  set('--ecx', r.cx.toFixed(4)); set('--ecy', (base - r.cy).toFixed(4)); set('--ecr', r.r.toFixed(4)); set('--epr', pr.toFixed(4));
  RX = r.rx * FS; RY = r.ry * FS; PR = pr * FS; R = r.r * FS;
  question(w, f);
}

/* ---------- life ---------- */
let seen = false, dropT = 0, ptr = null, ptrT = -1e9, act = performance.now(), asleep = false, stare = 0, wander = [0, 0], wanderT = 0, wanderN = 0, blink = -1e9, nextBlink = 3000, wink = -1, joy = -1e9, hot = false, raf = 0, last = 0;
const alive = () => { act = performance.now(); if (asleep) { asleep = false; blink = act + 240; } };
addEventListener('pointermove', e => { ptr = [e.clientX, e.clientY]; ptrT = performance.now(); alive(); }, { passive: true });
addEventListener('pointerdown', e => { ptr = [e.clientX, e.clientY]; ptrT = performance.now(); alive(); }, { passive: true });
addEventListener('scroll', alive, { passive: true }); addEventListener('keydown', alive);
addEventListener('moyo:joy', () => { joy = performance.now(); });
cta && ['pointerenter', 'focus'].forEach(t => cta.addEventListener(t, () => { hot = true; })), cta && ['pointerleave', 'blur'].forEach(t => cta.addEventListener(t, () => { hot = false; }));
$$('.fby li', foot).slice(0, 2).forEach((li, i) => { const on = () => { wink = i; }, off = () => { wink = -1; }; li.addEventListener('pointerenter', on); li.addEventListener('pointerleave', off); li.addEventListener('focusin', on); li.addEventListener('focusout', off); });

const bounce = t => { const n = 7.5625, d = 2.75; return t < 1 / d ? n * t * t : t < 2 / d ? n * (t -= 1.5 / d) * t + .75 : t < 2.5 / d ? n * (t -= 2.25 / d) * t + .9375 : n * (t -= 2.625 / d) * t + .984375; };
function target(t, mx, my) { // where they look, in the window
  if (document.activeElement === mail && mail.matches(':focus')) { const r = mail.getBoundingClientRect(); return [r.left + Math.min(r.width, mail.value.length * 10), r.top + r.height / 2]; }
  const fresh = ptr && t - ptrT < 4200;
  if (fresh) {
    const near = eyes.some(e => Math.hypot(ptr[0] - e.x, ptr[1] - e.y) < R);
    if (!near || dir > 0) stare = 0; else if (!stare) stare = t;
    if (stare && t - stare > 1000 && (t - stare - 1000) % 2700 < 2200) return [mx + (ptr[0] < mx ? 1600 : -1600), my - 900]; // civil inattention, with a stolen glance now and then
    return ptr;
  }
  stare = 0;
  if (t > wanderT) { // nobody: mostly the invitation, sometimes elsewhere
    const n = wanderN++ % 4, r = cta.getBoundingClientRect();
    wander = n % 2 === 0 ? [r.left + r.width * .6, r.top + r.height / 2] : [mx + (Math.random() - .5) * 2200, my - 100 - Math.random() * 700];
    wanderT = t + 1300 + Math.random() * 1500; if (Math.random() < .5) blink = t;
  }
  return wander;
}
function frame(t) {
  raf = 0; if (!seen) return;
  const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
  eyes.forEach(e => { const r = e.hit.getBoundingClientRect(); e.x = r.left + r.width / 2; e.y = r.top + r.height / 2; });
  const mx = (eyes[0].x + eyes[1].x) / 2, my = eyes[0].y, look = target(t, mx, my);
  if (t - act > 16000 && !asleep && dir === 0) asleep = true;
  if (t > nextBlink) { blink = t; nextBlink = t + 2600 + Math.random() * 4200; }
  const b = (t - blink) / 190, shut = b > 0 && b < 1 ? Math.sin(b * Math.PI) : 0, j = (t - joy) / 1700;
  eyes.forEach((e, i) => {
    // lids
    const open = asleep ? .07 + .025 * Math.sin(t / 900) : wink === i ? .07 : 1 - .93 * shut;
    e.lid += (open - e.lid) * (1 - Math.exp(-(asleep ? 2.2 : 34) * dt));
    // gaze: more and more off centre as the target gets farther, inside the ellipse of the letter
    let gx, gy; const ax = Math.max(0, RX - PR * e.pd) * .88, ay = Math.max(0, RY - PR * e.pd) * .88;
    if (j > 0 && j < 1) { const a = j * Math.PI * 4 - Math.PI / 2; gx = Math.cos(a) * ax; gy = Math.sin(a) * ay; }
    else { const vx = look[0] - e.x, vy = look[1] - e.y, d = Math.hypot(vx, vy) || 1, k = d / Math.hypot(d, R * 1.15); gx = vx / d * k * ax; gy = vy / d * k * ay; }
    const f = 1 - Math.exp(-(stare ? 16 : 11) * dt); e.gx += (gx - e.gx) * f; e.gy += (gy - e.gy) * f;
    const pd = (hot ? 1.28 : 1) * (dir > 0 ? 1.25 : 1) * (j > 0 && j < 1 ? 1.15 : 1); e.pd += (pd - e.pd) * (1 - Math.exp(-7 * dt));
    // arrival: the dots fall into the letters
    const u = clamp((t - dropT - i * 150) / 1150), fall = u < 1 ? (1 - bounce(u)) * -1.5 * FS : 0;
    e.el.style.setProperty('--lid', e.lid.toFixed(3));
    e.pu.style.setProperty('--gx', e.gx.toFixed(2) + 'px'); e.pu.style.setProperty('--gy', (e.gy * (u >= 1 ? 1 : 0) + fall).toFixed(2) + 'px'); e.pu.style.setProperty('--pd', e.pd.toFixed(3));
  });
  raf = requestAnimationFrame(frame);
}
const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
if (!reduce) {
  eyes.forEach(e => e.pu.style.setProperty('--gy', '-200vh')); // above, waiting
  new IntersectionObserver(es => es.forEach(x => {
    if (!seen && x.intersectionRatio > .34) { seen = true; const t = performance.now(); dropT = t; act = t; asleep = false; wanderT = 0; blink = t + 1750; nextBlink = t + 4200; setTimeout(() => { blink = performance.now(); }, 2150); start(); }
    else if (seen && x.intersectionRatio < .04) { seen = false; eyes.forEach(e => e.pu.style.setProperty('--gy', '-200vh')); }
  }), { threshold: [0, .04, .34, .6] }).observe(mono.parentElement);
}
fit(); document.fonts?.ready.then(fit); new MutationObserver(() => setTimeout(fit, 80)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); addEventListener('resize', () => { clearTimeout(fit.t); fit.t = setTimeout(fit, 120); });

/* ---------- hold: monochrome and one chord ---------- */
let layer = null, p = 0, dir = 0, fx = 0, fy = 0, r0 = 40, RM = 2000, fraf = 0, flast = 0;
function build() {
  if (!layer) { layer = document.createElement('div'); layer.className = 'flood'; layer.setAttribute('aria-hidden', 'true'); layer.inert = true; }
  layer.remove(); layer.textContent = '';
  const ins = $$('input', foot).map(i => i.value);
  [...foot.children].forEach(ch => layer.appendChild(ch.cloneNode(true)));
  $$('[id]', layer).forEach(e => e.removeAttribute('id')); $$('input', layer).forEach((e, i) => { e.value = ins[i]; e.removeAttribute('name'); });
  const note = $('.foot-note p', layer), hold = $('.hold', layer);
  if (note) note.textContent = en() ? 'Monotone-Silence Symphony, after Yves Klein.' : 'Symphonie Monotone-Silence, d’après Yves Klein.';
  if (hold) hold.textContent = en() ? 'Let go' : 'Relâchez';
  foot.appendChild(layer);
}
function paint() {
  const k = Math.pow(p, 2.3);
  layer.style.clipPath = `circle(${(r0 + (RM - r0) * k).toFixed(1)}px at ${fx.toFixed(1)}px ${fy.toFixed(1)}px)`;
  document.documentElement.classList.toggle('mono', p > .45);
  chord.level(p);
}
function tick(t) {
  fraf = 0; const dt = Math.min(.05, (t - (flast || t)) / 1000); flast = t;
  p = clamp(p + (dir > 0 ? dt / 1.6 : -dt / 1.05)); paint();
  if (dir < 0 && p <= 0) { dir = 0; layer.remove(); document.documentElement.classList.remove('mono'); chord.stop(); return; }
  if (dir > 0 && p >= 1) { chord.level(1); return; }
  fraf = requestAnimationFrame(tick);
}
function press(i) {
  if (dir > 0) return; alive();
  const e = eyes[i] || eyes[0], f = foot.getBoundingClientRect(), r = e.pu.getBoundingClientRect(), h = e.hit.getBoundingClientRect();
  if (!dir) {
    build(); r0 = Math.max(4, r.width / 2);
    fx = (reduce ? h.left + h.width / 2 : r.left + r.width / 2) - f.left; fy = (reduce ? h.top + h.height / 2 : r.top + r.height / 2) - f.top;
    RM = Math.hypot(Math.max(fx, f.width - fx), Math.max(fy, f.height - fy)) + 8; p = 0;
  }
  dir = 1; chord.start(); document.documentElement.classList.add('holding');
  if (reduce) { p = 1; paint(); return; }
  flast = 0; if (!fraf) fraf = requestAnimationFrame(tick);
}
function release() {
  if (dir <= 0) return; dir = -1; alive(); document.documentElement.classList.remove('holding');
  if (reduce) { p = 0; dir = 0; layer.remove(); document.documentElement.classList.remove('mono'); chord.stop(); return; }
  flast = 0; if (!fraf) fraf = requestAnimationFrame(tick);
}
eyes.forEach((e, i) => {
  e.hit.addEventListener('pointerdown', ev => { if (ev.button) return; ev.preventDefault(); try { e.hit.setPointerCapture(ev.pointerId); } catch (_) {} press(i); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => e.hit.addEventListener(n, release));
  e.hit.addEventListener('contextmenu', ev => ev.preventDefault());
});
const hold = $('#hold', foot);
if (hold) {
  hold.addEventListener('pointerdown', ev => { if (ev.button) return; ev.preventDefault(); try { hold.setPointerCapture(ev.pointerId); } catch (_) {} press(1); });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(n => hold.addEventListener(n, release));
  hold.addEventListener('contextmenu', ev => ev.preventDefault());
  hold.addEventListener('keydown', ev => { if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat) { ev.preventDefault(); press(1); } });
  hold.addEventListener('keyup', ev => { if (ev.key === ' ' || ev.key === 'Enter') release(); });
}
addEventListener('blur', release); document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
addEventListener('keydown', e => { if (e.key === 'Escape') release(); });

/* one chord of D major, held: strings (detuned saws) behind a filter that opens with the pupil, in a large room */
const chord = (() => {
  let ac = null, out, lp, osc = [], off = 0;
  const make = () => {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const len = ac.sampleRate * 3.2, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const room = ac.createConvolver(); room.buffer = ir;
    const wet = ac.createGain(), dry = ac.createGain(), comp = ac.createDynamicsCompressor();
    out = ac.createGain(); out.gain.value = 0; lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = .4;
    wet.gain.value = .55; dry.gain.value = .6;
    lp.connect(out); out.connect(dry); out.connect(room); room.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(ac.destination);
  };
  return {
    start() {
      try {
        clearTimeout(off); if (!ac) make(); ac.resume(); if (osc.length) return;
        [73.42, 110, 146.83, 185, 220, 293.66, 369.99, 440].forEach((f, i) => [-6, 5].forEach(det => {
          const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det + (Math.random() - .5) * 3;
          g.gain.value = .085 / (1 + i * .45); o.connect(g); g.connect(lp); o.start(); osc.push(o);
        }));
      } catch (_) {}
    },
    level(v) { if (!ac || !osc.length) return; const t = ac.currentTime; out.gain.setTargetAtTime(.3 * Math.pow(v, 1.4), t, .16); lp.frequency.setTargetAtTime(260 + 1250 * v * v, t, .25); },
    stop() { if (!ac) return; const t = ac.currentTime; out.gain.setTargetAtTime(0, t, .25); const all = osc; osc = []; all.forEach(o => { try { o.stop(t + 1.6); } catch (_) {} }); off = setTimeout(() => { if (!osc.length) ac.suspend(); }, 5200); }
  };
})();

/* ---------- the time spent together: in memory only ---------- */
const line = $('#together'), secs = $$('main section[id]').filter(s => s.id !== 'top' && $('h2', s)), spent = new Map();
let total = 0;
const fmt = s => s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
setInterval(() => {
  if (document.hidden) return;
  total += 1;
  const at = secs.find(s => { const r = s.getBoundingClientRect(); return r.top < innerHeight * .5 && r.bottom > innerHeight * .5; });
  if (at && foot.getBoundingClientRect().top > innerHeight * .5) spent.set(at, (spent.get(at) || 0) + 1);
  if (line && foot.getBoundingClientRect().top < innerHeight) {
    const best = [...spent].sort((a, b) => b[1] - a[1])[0], name = best && best[1] > 4 ? $('h2', best[0]).textContent.replace(/⁠/g, '').trim() : '';
    line.textContent = en() ? `${fmt(total)} together${name ? ', mostly on ' + name : ''}. Nothing is recorded.` : `${fmt(total)} ensemble${name ? ', surtout sur ' + name : ''}. Rien n’est enregistré.`;
  }
}, 1000);
})();
