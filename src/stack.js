/* Home: three times a sheet of paper passes over the screen before it, like the footer over the page: the projects over the first sentence,
   the studio over the method (the footer does it by itself). The screen underneath stays in place once its end is reached (CSS sticky), drifts up
   more slowly and fades (--cv: how much it is covered). Which sections pass over: the class .over in the page. The others simply follow.
   Off with reduced motion and without JavaScript. Also gives window.moyoTop(el): where an element really is in the page, since a sticky
   section moves its own rectangle. */
(() => {
'use strict';
const root = document.documentElement, main = document.getElementById('main');
const secs = main ? [...main.children].filter(e => e.matches('.hero,.sec')) : [];
window.moyoTop = el => {
  const s = secs.find(x => x === el || x.contains(el));
  if (!s) { let y = 0, e = el; while (e && !e.classList.contains('under')) { y += e.offsetTop; e = e.offsetParent; } return y; }
  let y = 0;
  for (const x of secs) { const c = getComputedStyle(x); y += parseFloat(c.marginTop) || 0; if (x === s) break; y += x.offsetHeight + (parseFloat(c.marginBottom) || 0); }
  return el === s ? y : y + el.getBoundingClientRect().top - s.getBoundingClientRect().top;
};
const pairs = secs.filter(s => s.matches('.over')).map(over => ({ over, under: over.previousElementSibling, cv: '' })).filter(p => p.under);
if (!pairs.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
root.classList.add('stack');
pairs.forEach(p => { p.under.classList.add('pin'); const v = document.createElement('i'); v.className = 'veil'; v.setAttribute('aria-hidden', 'true'); p.under.appendChild(v); });
const fit = () => { pairs.forEach(({ under }) => { const h = under.offsetHeight + 'px'; if (under.style.getPropertyValue('--h') !== h) under.style.setProperty('--h', h); }); cover(); };
let raf = 0;
function cover() {
  raf = 0;
  const H = innerHeight;
  pairs.forEach(p => { const v = Math.min(1, Math.max(0, (H - p.over.getBoundingClientRect().top) / H)).toFixed(4); if (p.cv !== v) { p.cv = v; p.under.style.setProperty('--cv', v); p.over.style.setProperty('--ov', Math.min(1, v * 7).toFixed(3)); } });
}
const kick = () => { if (!raf) raf = requestAnimationFrame(cover); };
const ro = new ResizeObserver(fit); pairs.forEach(p => ro.observe(p.under));
addEventListener('scroll', kick, { passive: true }); addEventListener('resize', fit);
fit();

/* keyboard: a focused element hidden under a sheet is brought back into view */
document.addEventListener('focusin', e => {
  const s = secs.find(x => x.contains(e.target)); if (!s || !root.classList.contains('kbd') || root.classList.contains('vt-sheet')) return;
  requestAnimationFrame(() => {
    const r = e.target.getBoundingClientRect(), x = Math.min(innerWidth - 2, Math.max(1, r.left + r.width / 2)), y = r.top + Math.min(r.height / 2, 40);
    const t = y > 0 && y < innerHeight && document.elementFromPoint(x, y);
    if (!t || !s.contains(t)) { const go = Math.max(0, moyoTop(e.target) - innerHeight * .4); window.moyoScroll ? moyoScroll(go) : scrollTo(0, go); }
  });
});
})();
