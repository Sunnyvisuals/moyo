/* Staging: every page builds itself in front of the reader. Pieces fade and rise as they arrive, one after the other (90 ms apart),
   pictures are born from one dot (divide.js). They leave the same way when they go off screen, up or down, and play again next time.
   Titles (h1, h2) never move. Nothing changes the layout (opacity, translate, clip-path). Skipped with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return document.querySelectorAll('.sec .dot').forEach(d => d.classList.add('in'));
  const TARGETS = '.hero-top>*,.sec-h>.all,.all-m,.case .plate,.case .cap>*,.line>*,.mth:not(.live) .step,.defs>*,.names>li,.next,.crumbs,.ct-l>:not([data-ink]),.ct-form>*,.filters,main .sheet-g>*,main .bk .b,.fcol,.foot-base>*,.foot-note';
  const EASE = 'cubic-bezier(.16,1,.3,1)', TOP = .03, BOTTOM = .09; // margins of the stage, in screens
  const st = document.createElement('style');
  st.textContent = `.stg{opacity:0;translate:0 26px;transition:opacity .5s ease,translate .6s ease}
.stg.in{opacity:1;translate:none;transition:opacity 1.1s ease var(--sd,0ms),translate 1.3s ${EASE} var(--sd,0ms)}
.stg.up{translate:0 -22px}
.stg.clip{opacity:1;translate:none;clip-path:inset(0 0 100% 0);transition:clip-path .7s cubic-bezier(.64,0,.78,0)}
.stg.clip.in{clip-path:inset(0);transition:clip-path 1.5s cubic-bezier(.76,0,.24,1) var(--sd,0ms)}
.stg.clip.up{clip-path:inset(100% 0 0 0)}
.stg.dv{opacity:1;translate:none;transition:none}
.stg.pop{opacity:1;translate:none;background-color:rgb(239 239 236 / 0);transition:background-color .5s ease}
.stg.pop.in{background-color:var(--tint);transition:background-color 1s ease calc(var(--sd,0ms) + .3s)}
.stg.pop::after{scale:0;transition:scale .45s cubic-bezier(.64,0,.78,0),translate .55s cubic-bezier(.22,1,.36,1)}
.stg.pop.in::after{scale:1;transition:scale 1.1s cubic-bezier(.16,1,.3,1) var(--sd,0ms),translate .55s cubic-bezier(.22,1,.36,1)}`;
  document.head.appendChild(st);

  /* the final point of each section title falls when the title is there */
  const dots = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { rootMargin: '-4% 0px -16% 0px' });
  (window.moyoReady || Promise.resolve()).then(() => document.querySelectorAll('.sec .dot').forEach(d => dots.observe(d)));

  const els = [...document.querySelectorAll(TARGETS)].filter(e => !e.closest('dialog,#menu,.bar,[hidden]') && !(e.parentElement && e.parentElement.closest('.stg')) && !e.matches('script,.sr,.hp') && !(innerWidth > 820 && e.matches('.cases .cap>*'))); // the accordion shows its own captions
  if (!els.length) return;
  els.forEach(e => { e.style.transition = 'none'; e.classList.add('stg'); if (e.matches('.plate')) { if (e.matches('.plate--none')) e.classList.add('pop'); else if (window.moyoDivide) moyoDivide(e, 'hide'); else e.classList.add('clip'); } }); // put away at once, without playing the exit
  requestAnimationFrame(() => requestAnimationFrame(() => els.forEach(e => { e.style.transition = ''; })));

  const on = new WeakSet();
  const show = list => list.sort((a, b) => a[1].top - b[1].top || a[1].left - b[1].left)
    .forEach(([e], i) => { on.add(e); e.style.setProperty('--sd', Math.min(i * 90, 630) + 'ms'); e.classList.remove('up'); e.classList.add('in'); if (e.classList.contains('dv')) moyoDivide(e, true, { delay: Math.min(i * 90, 630) }); });
  const hide = (e, up) => { on.delete(e); e.style.removeProperty('--sd'); e.classList.remove('in'); e.classList.toggle('up', up); if (e.classList.contains('dv')) moyoDivide(e, false); };

  const io = new IntersectionObserver(entries => {
    show(entries.filter(en => en.isIntersecting && !on.has(en.target)).map(en => [en.target, en.boundingClientRect]));
    entries.forEach(en => { if (!en.isIntersecting && on.has(en.target)) hide(en.target, en.boundingClientRect.top < 0); });
  }, { threshold: 0, rootMargin: `${-TOP * 100}% 0px ${-BOTTOM * 100}% 0px` });

  /* pictures: an observer would see their clip (nothing) instead of their place, so their place is read on scroll */
  const pics = els.filter(e => e.matches('.plate'));
  let raf = 0;
  const look = () => {
    raf = 0;
    const H = innerHeight, arrive = [];
    pics.forEach(e => {
      const r = e.getBoundingClientRect(), inside = r.height > 0 && r.top < H * (1 - BOTTOM) && r.bottom > H * TOP;
      if (inside && !on.has(e)) arrive.push([e, r]); else if (!inside && on.has(e)) hide(e, r.top < 0);
    });
    if (arrive.length) show(arrive);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(look); };

  /* once the opening is over (load.js) */
  (window.moyoReady || Promise.resolve()).then(() => setTimeout(() => {
    els.forEach(e => { if (!e.matches('.plate')) io.observe(e); });
    if (pics.length) { look(); addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); new ResizeObserver(kick).observe(document.body); }
  }, 60));
})();
