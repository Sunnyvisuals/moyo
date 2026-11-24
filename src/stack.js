/* Home: the sections pass over each other, like the footer over the page. Each one stays in place once its end is reached (CSS sticky),
   the next one slides over it behind its glass edge, while the one underneath drifts up more slowly and fades (--cv: how much it is covered).
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
if (secs.length < 3 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
root.classList.add('stack');
const under = secs.slice(0, -1);
under.forEach(s => { const v = document.createElement('i'); v.className = 'veil'; v.setAttribute('aria-hidden', 'true'); s.appendChild(v); });
const fit = () => { secs.forEach(s => { const h = s.offsetHeight + 'px'; if (s.style.getPropertyValue('--h') !== h) s.style.setProperty('--h', h); }); cover(); };
let raf = 0;
function cover() {
  raf = 0;
  const H = innerHeight;
  under.forEach((s, i) => {
    const t = secs[i + 1].getBoundingClientRect().top, cv = Math.min(1, Math.max(0, (H - t) / H)), v = cv.toFixed(4);
    if (s.__cv !== v) { s.__cv = v; s.style.setProperty('--cv', v); }
  });
}
const kick = () => { if (!raf) raf = requestAnimationFrame(cover); };
const ro = new ResizeObserver(fit); secs.forEach(s => ro.observe(s));
addEventListener('scroll', kick, { passive: true }); addEventListener('resize', fit);
fit();

/* keyboard: a focused element hidden under the next section is brought back into view */
document.addEventListener('focusin', e => {
  const s = secs.find(x => x.contains(e.target)); if (!s || !root.classList.contains('kbd')) return;
  requestAnimationFrame(() => {
    const r = e.target.getBoundingClientRect(), x = Math.min(innerWidth - 2, Math.max(1, r.left + r.width / 2)), y = r.top + Math.min(r.height / 2, 40);
    const t = y > 0 && y < innerHeight && document.elementFromPoint(x, y);
    if (!t || !s.contains(t)) { const go = Math.max(0, moyoTop(e.target) - innerHeight * .4); window.moyoScroll ? moyoScroll(go) : scrollTo(0, go); }
  });
});
})();
