/* Frosted top of the footer: the rim is a bevel whose thickness, radius and light follow the scroll (styles: GLASS_CSS in shared/chrome.js). */
(() => {
  const foot = document.getElementById('foot');
  if (!foot || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------- the edge: a bevel that lives with the scroll ----------
     --fr: how far the footer has risen (0 to 1), --fv: scroll speed (0 to 1), --lx: where the light hits the rim */
  let lx = 20, tx = 20, ptr = 0, fr = 0, fv = 0, ty = scrollY, raf = 0;
  const clamp = v => Math.min(1, Math.max(0, v));
  const set = (k, v) => foot.style.setProperty(k, v);
  const frame = () => {
    raf = 0;
    const top = foot.getBoundingClientRect().top, goal = clamp(1 - top / innerHeight);
    if (top > innerHeight || top < -innerHeight) return;
    fr += (goal - fr) * .16; fv *= .9; if (fv < .004) fv = 0;
    tx = 14 + fr * 72 + ptr * 14; lx += (tx - lx) * .12; // the light sweeps along the rim as it rises, the pointer nudges it
    set('--fr', fr.toFixed(3)); set('--fv', fv.toFixed(3)); set('--lx', lx.toFixed(2) + '%');
    if (Math.abs(goal - fr) > .002 || Math.abs(tx - lx) > .1 || fv) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', e => { ptr = e.clientX / innerWidth * 2 - 1; kick(); }, { passive: true });
  addEventListener('scroll', () => { const dy = Math.abs(scrollY - ty); ty = scrollY; fv = clamp(fv + dy / 260); kick(); }, { passive: true });
  kick();
})();
