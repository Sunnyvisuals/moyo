/* Header and full-screen menu, the same on every page. Reads the language from <html lang> and re-renders when the page changes it.
   No dependency on the page's own script. */
(() => {
'use strict';
const menu = document.getElementById('menu');
if (!menu) return;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(2, '0');
const setT = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const getLang = () => document.documentElement.lang === 'en' ? 'en' : 'fr';
let lang = getLang();

/* The chrome owns its own labels so it works on any page, whatever that page's own language system. */
const I18N = __CHROME__, ARIA = __CHROME_ARIA__; // shared/i18n.js
const bar = document.getElementById('bar');
function applyChromeLang(l){
  [bar, menu].forEach(root => { if (!root) return;
    root.querySelectorAll('[data-i]').forEach(el => { const k = el.dataset.i; if (I18N[l][k] != null) el.textContent = I18N[l][k]; });
    root.querySelectorAll('.flang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.l === l)));
    root.querySelectorAll('[data-ia]').forEach(el => { const k = el.dataset.ia; if (ARIA[l][k] != null) el.setAttribute('aria-label', ARIA[l][k]); });
  });
}

/* letter-roll split for each menu label */
function splitRoll(el){
  const text = el.textContent.trim(); if (!text) return;
  const chars = [...text].map((ch, i) => '<span class="c" style="--i:' + i + '">' + (ch === ' ' ? ' ' : esc(ch)) + '</span>').join('');
  el.innerHTML = '<span class="sr">' + esc(text) + '</span><span class="roll" aria-hidden="true"><span class="r1">' + chars + '</span><span class="r2">' + chars + '</span></span>';
}

/* ---------- Menu arc carousel ---------- */
const arcList = $('.menu-list.arc'), arcMQ = matchMedia('(min-width:821px)');
const arcReal = $$('.menu-list.arc li'), arcN = arcReal.length, arcM = arcN * 3;
applyChromeLang(lang);
arcReal.forEach(li => $('.mn', li) && splitRoll($('.mn', li)));
const arcClone = li => { const c = li.cloneNode(true); c.classList.add('arc-clone'); c.setAttribute('aria-hidden', 'true');
  const a = c.querySelector('a'); a.tabIndex = -1; a.addEventListener('click', () => menu.hidePopover?.()); return c; };
arcReal.forEach(li => arcList.insertBefore(arcClone(li), arcReal[0]));
arcReal.forEach(li => arcList.appendChild(arcClone(li)));
const arcItems = $$('.menu-list.arc li');
const ARC_DESC = {
  fr: ['Des images, des sites, des films. Une seule idée.', 'Tous les projets, par catégorie.', 'Direction artistique, sites, données, audiovisuel, communication.', 'Le studio, et le sens de son nom.', 'Zahia et Yacine.', 'Parlons de votre projet.'],
  en: ['Images, websites, films. A single idea.', 'Every project, by category.', 'Art direction, websites, data, audiovisual, communication.', 'The studio, and the meaning of its name.', 'Zahia and Yacine.', 'Let’s talk about your project.']
};
const ARC = { curve: 60, spacing: 1.08, edgeFade: 16, wRest: 280, wFocus: 720, spread: 1, omega: (3 + 50 * .09) * 1.5, waveDur: .7, wheelTau: 80 };
const A = { pos: 0, target: 0, av: 0, pv: 0, lastPos: 0, lean: 0, lensC: 0, lensV: 0, lensAmp: 1, hoverK: null, focusK: null, moving: false,
  wOn: false, wFrom: 0, wRaw: 0, wR: 0, wLast: 0, wCount: 0, wheelT: -1e9, waves: new Map, waveRel: new Map, waveK: null, waveCand: null, waveCandT: 0,
  introT: -1e9, raf: 0, last: 0, shown: -1, chars: [], stp: 0, stv: 0, sdir: 1, pin: false, mx: 0, my: 0, cx: 0, cy: 0, cvx: 0, cvy: 0 };
/* one picture per entry; the entries without one show the dot */
const ARC_IMG = ['/proj/2.jpg', '/proj/1.jpg', '/proj/3.jpg', '/proj/4.jpg'];
const pvA = $('#pvA'), pvB = $('#pvB'), pvFrame = $('#pvLink'), pvPanel = $('.menu-pv'), pvCS = $('#pvCS'), pvNS = $('#pvNS');
const pvCI = [...pvCS.children], pvNI = [...pvNS.children];
const arcWrap = x => x - arcM * Math.round(x / arcM);
const arcMod = (x, n) => ((x % n) + n) % n;
function arcChars(){ A.chars = arcItems.map(li => [...li.querySelectorAll('.r1 .c')]); }
function arcClearWaves(){ A.chars.forEach(cs => cs.forEach(ch => ch.style.fontWeight = '')); A.waves.clear(); A.waveRel.clear(); A.waveK = A.waveCand = null; }
function arcNormalize(){
  if (A.wOn || A.waves.size) return;
  const q = Math.floor((Math.round(A.pos) - arcN) / arcN); if (!q) return;
  const d = q * arcN; A.pos -= d; A.target -= d; A.lastPos -= d; A.lensC -= d; A.wFrom -= d; A.stp -= d;
  if (A.hoverK != null) A.hoverK -= d; if (A.focusK != null) A.focusK -= d;
}
function arcWheelStep(t){
  const n = t - A.wLast, r = Math.abs(A.wRaw), sg = Math.sign(A.wRaw);
  const a = r >= .08 ? Math.max(1, Math.ceil(r - .3)) : +(r > .001 && A.wCount <= 2 && n > 110);
  const o = A.wFrom + sg * a, s = A.wFrom + A.wRaw;
  if (n > 260) { A.target = o; A.wOn = false; return; }
  const c = A.wR * Math.exp(-Math.max(0, n) / ARC.wheelTau) / (ARC.wheelTau / 1e3);
  const l = Math.max(clamp(1 - c / 3), clamp((n - 40) / 200));
  A.target = s + (o - s) * l * l * (3 - 2 * l);
}
function arcCard(dt){
  const c = A.focusK ?? A.pos;
  if (reduce) { A.stp = c; A.stv = 0; }
  else { const K = A.moving ? 480 : 120, D = 2 * Math.sqrt(K), k = Math.ceil(dt / (1 / 120)), h = dt / k;
    for (let i = 0; i < k; i++) { A.stv += (K * (c - A.stp) - D * A.stv) * h; A.stp += A.stv * h; } }
  if (Math.abs(c - A.stp) < 4e-4 && Math.abs(A.stv) < .02) { A.stp = c; A.stv = 0; }
  if (Math.abs(A.stv) > .25) A.sdir += ((A.stv > 0 ? 1 : -1) - A.sdir) * (1 - Math.exp(-10 * dt));
  const amt = reduce ? 0 : .6, v = clamp(A.stv * .16, -1.6, 1.6) * amt, st = 1 + Math.abs(v) * .07;
  let tx = 0, ty = 0;
  if (A.pin && !reduce) { const r = pvPanel.getBoundingClientRect(), fh = pvFrame.clientHeight;
    tx = clamp((A.mx - (r.left - A.cx + r.width / 2)) * .03, -18, 18); ty = clamp((A.my - innerHeight / 2) * .05, -fh * .08, fh * .08); }
  if (reduce) { A.cx = tx; A.cy = ty; A.cvx = A.cvy = 0; }
  else { const K = 120, D = 2 * Math.sqrt(K) * .9, k = Math.ceil(dt / (1 / 120)), h = dt / k;
    for (let i = 0; i < k; i++) { A.cvx += (K * (tx - A.cx) - D * A.cvx) * h; A.cvy += (K * (ty - A.cy) - D * A.cvy) * h; A.cx += A.cvx * h; A.cy += A.cvy * h; } }
  const followBusy = Math.abs(tx - A.cx) > .05 || Math.abs(ty - A.cy) > .05 || Math.abs(A.cvx) > .05 || Math.abs(A.cvy) > .05;
  if (!followBusy) { A.cx = tx; A.cy = ty; A.cvx = A.cvy = 0; }
  const ry = clamp(A.cvx * .02, -6, 6), rx = clamp(-A.cvy * .02, -6, 6) + clamp(clamp(A.stv, -12, 12) * .2, -2.5, 2.5);
  pvPanel.style.transform = (A.cx || A.cy || rx || ry) ? 'translate3d(' + A.cx.toFixed(2) + 'px,' + A.cy.toFixed(2) + 'px,0) perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)' : '';
  const y = Math.floor(A.stp + 1e-6); let fr = A.stp - y; if (fr < 4e-4) fr = 0;
  const ia = arcMod(y, arcN), ib = arcMod(y + 1, arcN);
  const W = pvFrame.clientWidth, H = pvFrame.clientHeight, off = H * .12, N = 18;
  const sy = (q, x) => (((q - .5) * st + .5 + v * .042 * Math.sin(x * Math.PI)) * H + off);
  const sn = Math.sin(fr * Math.PI), t = performance.now() / 1e3;
  const yb = x => 1 - fr - sn * (.09 * Math.sin(x * Math.PI) + .035 * Math.sin(x * 7 + fr * 9 + t * 1.9)) * (.35 + amt) * -A.sdir;
  const top = [], mid = [], bot = [];
  for (let j = 0; j <= N; j++) { const x = j / N, px = (x * W).toFixed(1);
    top.push(px + 'px ' + sy(0, x).toFixed(1) + 'px'); bot.push(px + 'px ' + sy(1, x).toFixed(1) + 'px');
    mid.push(px + 'px ' + sy(clamp(yb(x), 0, 1), x).toFixed(1) + 'px'); }
  const rev = a => a.slice().reverse();
  pvA.style.clipPath = 'polygon(' + top.concat(rev(mid)).join(',') + ')';
  pvB.style.clipPath = fr > 0 ? 'polygon(' + mid.concat(rev(bot)).join(',') + ')' : 'inset(100% 0 0 0)';
  pvA.style.filter = fr > 0 ? 'brightness(' + (1 - .42 * fr).toFixed(3) + ')' : '';
  pvA.style.setProperty('--py', (50 - fr * 22).toFixed(1) + '%'); pvB.style.setProperty('--py', (50 + (1 - fr) * 22).toFixed(1) + '%');
  const img = i => ARC_IMG[i] ? 'url("' + ARC_IMG[i] + '")' : 'radial-gradient(circle,#002FA7 0 13%,#FAFAF8 13.3%)';
  if (pvA.dataset.i !== String(ia)) { pvA.dataset.i = ia; pvA.style.setProperty('--img', img(ia)); }
  if (pvB.dataset.i !== String(ib)) { pvB.dataset.i = ib; pvB.style.setProperty('--img', img(ib)); }
  const key = ia + '|' + ib + '|' + lang;
  if (pvCS.dataset.k !== key) { pvCS.dataset.k = key;
    [ib, ia].forEach((it, j) => { const ps = pvCI[j].children; ps[0].textContent = ARC_DESC[lang][it] || '';
      ps[1].textContent = arcReal[it].querySelector('.sr')?.textContent || arcReal[it].textContent.trim(); pvNI[j].textContent = pad(it + 1); });
    setT('pvTot', '/' + pad(arcN)); }
  pvCS.style.transform = 'translate3d(0,' + ((fr - 1) * pvCI[0].offsetHeight).toFixed(2) + 'px,0)';
  pvNS.style.transform = 'translate3d(0,' + ((fr - 1) * pvNI[0].offsetHeight).toFixed(2) + 'px,0)';
  return A.stp !== c || A.stv !== 0 || followBusy;
}
function arcFrame(t){
  A.raf = 0;
  if (!menu.matches(':popover-open') || !arcMQ.matches) return;
  const dt = clamp((t - (A.last || t)) / 1e3, 1 / 240, 1 / 20); A.last = t;
  if (A.wOn) arcWheelStep(t);
  if (reduce) { A.pos += (A.target - A.pos) * (1 - Math.exp(-60 * dt)); A.av = 0; }
  else { const P = ARC.omega, k = Math.ceil(dt / (1 / 240)), h = dt / k;
    for (let i = 0; i < k; i++) { A.av += (P * P * (A.target - A.pos) - 2 * P * A.av) * h; A.pos += A.av * h; } }
  if (Math.abs(A.target - A.pos) < 5e-4 && Math.abs(A.av) < .02) { A.pos = A.target; A.av = 0; }
  const v = (A.pos - A.lastPos) / dt; A.lastPos = A.pos; A.pv += (v - A.pv) * (1 - Math.exp(-14 * dt));
  const leanT = reduce ? 0 : clamp(-A.pv * 1.6, -8, 8); A.lean += (leanT - A.lean) * (1 - Math.exp(-10 * dt));
  if (Math.abs(leanT - A.lean) < .02 && Math.abs(leanT) < .02) A.lean = 0;
  if (A.lensAmp < 1) { const g = t - A.introT > 120 ? 1 - Math.exp(-(reduce ? 60 : 3.2) * dt) : 0; A.lensAmp += (1 - A.lensAmp) * g; if (1 - A.lensAmp < .002) A.lensAmp = 1; }
  A.moving = A.wOn || Math.abs(A.target - A.pos) > .004 || Math.abs(A.av) > .05 || t - A.wheelT < 160;
  A.focusK = A.moving ? null : A.hoverK;
  const lt = A.focusK ?? A.pos;
  if (reduce) { A.lensC = lt; A.lensV = 0; }
  else { const K = A.focusK == null && A.moving ? 320 : 140, D = 2 * Math.sqrt(K), k = Math.ceil(dt / (1 / 120)), h = dt / k;
    for (let i = 0; i < k; i++) { A.lensV += (K * (lt - A.lensC) - D * A.lensV) * h; A.lensC += A.lensV * h; }
    if (Math.abs(lt - A.lensC) < 5e-4 && Math.abs(A.lensV) < .01) { A.lensC = lt; A.lensV = 0; } }
  const fk = A.focusK == null ? null : arcMod(Math.round(A.focusK), arcM);
  if (!reduce && !A.moving) {
    if (fk == null) A.waveK = null;
    if (fk === A.waveCand) { if (fk != null && fk !== A.waveK && t - A.waveCandT > 110) { A.waveK = fk; A.waves.set(fk, t); A.waveRel.delete(fk); } }
    else { A.waveCand = fk; A.waveCandT = t; }
  }
  arcRender(t, fk);
  const cardBusy = arcCard(dt);
  if (!A.moving && !cardBusy) arcNormalize();
  const busy = cardBusy || A.moving || A.lensC !== lt || A.lensAmp < 1 || A.lean !== 0 || A.waves.size > 0 || t - A.introT < 450 || A.waveCand !== A.waveK;
  if (busy) A.raf = requestAnimationFrame(arcFrame); else A.last = 0;
}
function arcRender(t, fk){
  const H = arcList.clientHeight, size = parseFloat(getComputedStyle(arcItems[0].querySelector('.mn')).fontSize);
  const lineH = size * 1.08, sp = size * ARC.spacing, R = H * (3.2 - ARC.curve / 100 * 2.5), cy = H / 2, pivotX = -R;
  const intro = clamp((t - A.introT) / 320), skew = Math.abs(A.lean) > .05 ? ' skewX(' + A.lean.toFixed(2) + 'deg)' : '';
  const steps = Math.abs(A.lensV) > .8 || A.lensAmp < 1 ? 64 : 192;
  arcItems.forEach((li, i) => {
    const l = arcWrap(i - A.pos) * sp / R, vis = Math.abs(l) < 1.45;
    li.style.visibility = vis ? 'visible' : 'hidden'; if (!vis) return;
    li.style.transform = 'translate3d(' + pivotX.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) rotate(' + (l * 180 / Math.PI).toFixed(3) + 'deg) translate3d(' + R.toFixed(1) + 'px,0,0)' + skew + ' translate3d(0,' + (-lineH / 2).toFixed(1) + 'px,0)';
    const p = Math.abs(Math.sin(l) * R);
    const op = clamp((H / 2 - p - lineH * .6) / (H * (ARC.edgeFade / 100))) * intro;
    const hh = arcWrap(i - A.lensC) / ARC.spread, g = Math.round(A.lensAmp * Math.exp(-hh * hh) * steps) / steps;
    const mn = li.querySelector('.mn'), a = li.firstElementChild;
    const w = Math.round(ARC.wRest + (ARC.wFocus - ARC.wRest) * g), c = Math.round(g ** 1.25 * 100);
    mn.style.fontWeight = String(w);
    a.style.transform = 'scaleX(' + ((78 + 40 * g) / 118).toFixed(3) + ')';
    a.style.color = c >= 100 ? 'var(--arc-on)' : c <= 0 ? 'var(--arc-off)' : 'color-mix(in srgb,var(--arc-on) ' + c + '%,var(--arc-off))';
    a.style.pointerEvents = op > .3 ? 'auto' : 'none';
    li.style.opacity = op.toFixed(3);
    const e = clamp((g - .55) / .4), sm = e * e * (3 - 2 * e); li.style.setProperty('--arw', sm.toFixed(3));
    const t0 = A.waves.get(i);
    if (t0 != null) {
      const cs = A.chars[i] || [], n = cs.length, ld = Math.min(.045, .4 / Math.max(1, n)), d = (t - t0) / 1e3;
      let rel = A.waveRel.get(i); if (rel == null && i !== fk) { rel = t; A.waveRel.set(i, t); }
      const pr = rel == null ? 1 : Math.max(0, 1 - (t - rel) / 120) ** 2;
      if (d > (n - 1) * ld + ARC.waveDur || pr <= 0) { cs.forEach(ch => ch.style.fontWeight = ''); A.waves.delete(i); A.waveRel.delete(i); }
      else { const room = Math.max(0, Math.min(90, 1e3 - w)), amp = g * pr;
        cs.forEach((ch, r) => { const x = (d - r * ld) / ARC.waveDur, b = x <= 0 || x >= 1 ? 0 : .5 - .5 * Math.cos(x * Math.PI * 2), q = Math.round(b * amp * 8) / 8;
          ch.style.fontWeight = q <= 0 ? '' : String(Math.round((w + room * q) / 4) * 4); }); }
    }
  });
  const k = arcMod(Math.round(A.focusK ?? A.pos), arcN);
  if (k !== A.shown) { A.shown = k; pvFrame.setAttribute('href', arcReal[k].querySelector('a').getAttribute('href')); }
}
function arcKick(){ if (!A.raf) A.raf = requestAnimationFrame(arcFrame); }
function arcTo(row){ A.target = Math.round(row); A.wOn = false; arcKick(); }
function arcNearest(idx){ const cur = arcMod(Math.round(A.target), arcN); let d = idx - cur; if (d > arcN / 2) d -= arcN; if (d < -arcN / 2) d += arcN; return Math.round(A.target) + d; }
function arcReset(){ arcClearWaves(); arcItems.forEach(li => { li.style.cssText = ''; li.firstElementChild.style.cssText = ''; li.querySelector('.mn').style.fontWeight = ''; }); }
pvFrame.addEventListener('click', () => menu.hidePopover?.());
menu.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !arcMQ.matches) return; A.mx = e.clientX; A.my = e.clientY; A.pin = true; arcKick(); });
menu.addEventListener('pointerleave', () => { A.pin = false; arcKick(); });
arcList.addEventListener('pointermove', e => {
  if (!arcMQ.matches || e.pointerType !== 'mouse' || !(e.movementX || e.movementY)) return;
  const li = e.target.closest('li'); const r = li ? arcItems.indexOf(li) : -1;
  A.hoverK = r < 0 ? null : A.pos + arcWrap(r - A.pos); arcKick();
});
arcList.addEventListener('pointerleave', () => { A.hoverK = null; arcKick(); });
arcReal.forEach((li, i) => li.addEventListener('focusin', () => { if (arcMQ.matches && !li.matches(':hover')) arcTo(arcNearest(i)); }));
menu.addEventListener('wheel', e => {
  if (!arcMQ.matches) return;
  const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX; if (!d) return;
  e.preventDefault();
  const now = performance.now(), size = parseFloat(getComputedStyle(arcItems[0].querySelector('.mn')).fontSize);
  if (!A.wOn) { A.wOn = true; A.wFrom = Math.round(A.target); A.wRaw = 0; A.wR = 0; A.wCount = 0; }
  const i = e.deltaMode === 1 ? d / 3 : e.deltaMode === 2 ? Math.sign(d) : d / Math.max(90, size * ARC.spacing * 1.6);
  A.wR = A.wR * Math.exp(-(now - A.wLast) / ARC.wheelTau) + Math.abs(i);
  A.wRaw += i; A.wLast = now; A.wCount++; A.wheelT = now; A.hoverK = null;
  arcKick();
}, { passive: false });
menu.addEventListener('keydown', e => {
  if (!arcMQ.matches || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  e.preventDefault(); arcTo(Math.round(A.target) + (e.key === 'ArrowDown' ? 1 : -1));
  arcReal[arcMod(A.target, arcN)].firstElementChild.focus({ preventScroll: true });
});

/* ---------- Open / close ---------- */
const main = $('#main'), foot = $('#foot'), menuBtn = $('#menuBtn');
menu.addEventListener('beforetoggle', e => {
  const open = e.newState === 'open';
  document.documentElement.classList.toggle('menu-lock', open);
  if (main) main.inert = open; if (foot) foot.inert = open;
  menuBtn.setAttribute('aria-expanded', String(open));
  if (!open) { menuBtn.classList.remove('unx'); void menuBtn.offsetWidth; menuBtn.classList.add('unx'); clearTimeout(menuBtn._ux); menuBtn._ux = setTimeout(() => menuBtn.classList.remove('unx'), 700); }
});
menu.addEventListener('toggle', e => {
  if (e.newState !== 'open') { cancelAnimationFrame(A.raf); A.raf = 0; A.last = 0; return; }
  if (!arcMQ.matches) { arcReset(); $$('.menu-list a')[0]?.focus({ preventScroll: true }); return; }
  arcChars(); arcClearWaves();
  const k = clamp(+(menu.dataset.start || 0) || 0, 0, arcN - 1), row = arcN + k;
  A.target = row; A.pos = A.lastPos = reduce ? row : row - 1.6; A.av = 0; A.pv = 0; A.lean = 0; A.hoverK = A.focusK = null; A.wOn = false;
  A.lensC = A.pos; A.lensV = 0; A.lensAmp = reduce ? 1 : 0; A.stp = A.pos; A.stv = 0; A.cx = A.cy = A.cvx = A.cvy = 0; A.pin = false;
  A.introT = performance.now() + (reduce ? -1e4 : 80); A.shown = -1; A.last = 0;
  arcReal[k].firstElementChild.focus({ preventScroll: true });
  arcKick();
});
arcMQ.addEventListener?.('change', () => { if (!arcMQ.matches) arcReset(); else if (menu.matches(':popover-open')) { arcChars(); A.shown = -1; arcKick(); } });
addEventListener('resize', () => { if (!arcMQ.matches) arcReset(); else if (menu.matches(':popover-open')) { if (!arcItems[0].style.transform) { arcChars(); A.shown = -1; } arcKick(); } });

/* language: the page toggles <html lang>; re-split the labels and refresh the panel */
arcChars();
new MutationObserver(() => {
  const l = getLang(); if (l === lang) return; lang = l;
  applyChromeLang(l);
  arcItems.forEach(li => { const mn = $('.mn', li); if (mn) splitRoll(mn); });
  arcChars(); A.shown = -1; pvCS.dataset.k = '';
  if (menu.matches(':popover-open')) arcKick();
}).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

/* header: away on the first screen of the home (data-land), hides while reading down, returns on the way up, and goes away by itself after a few
   seconds. It comes back on the way up, when the pointer goes to the top of the screen, on a touch, or with the keyboard. */
if (bar) {
  const root = document.documentElement, land = bar.hasAttribute('data-land'), REST = 2600;
  let last = scrollY, upAt = scrollY, q = 0, t = 0;
  const first = () => land && scrollY < innerHeight * .85;
  const busy = () => (root.classList.contains('kbd') && bar.contains(document.activeElement)) || menu.matches(':popover-open') || !!bar.querySelector(':hover');
  const hide = () => bar.classList.add('away');
  const rest = () => { clearTimeout(t); if (!reduce) t = setTimeout(() => busy() ? rest() : hide(), REST); };
  const show = () => { if (first()) return; bar.classList.remove('away'); rest(); };
  const upd = () => { q = 0; const y = scrollY, dy = y - last; last = y; if (dy < -2) upAt = y;
    if (busy()) return;
    if (first()) return hide();
    if (reduce) return bar.classList.remove('away');
    if (dy < -2 || y <= 80 && dy) show(); else if (dy > 0 && y > 80 && y - upAt > 80) hide();
  };
  addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(upd); }, { passive: true });
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.clientY < 110 && bar.classList.contains('away')) show(); }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && e.clientY < innerHeight * .4) show(); }, { passive: true });
  bar.addEventListener('focusin', () => { bar.classList.remove('away'); rest(); });
  menu.addEventListener('toggle', e => { if (e.newState === 'closed') { if (first()) hide(); else rest(); } });
  if (first()) hide(); else { bar.classList.remove('away'); (window.moyoReady || Promise.resolve()).then(rest); }
}
})();
