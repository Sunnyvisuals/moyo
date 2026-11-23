/* Buttons and links-as-buttons appear and leave cleanly with the scroll.
   Arriving: the box is drawn from left to right (a clip wipe) while the label fades in a beat later.
   Leaving (scrolled past, or below again): it keeps its direction and wipes out, so the movement never reverses.
   Works from the elements' own classes: nothing to add in the markup. Skipped with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const SEL = '.link,.send,.sub-btn,.links a,.dlg-actions button';
  const els = [...document.querySelectorAll(SEL)].filter(e => !e.closest('dialog,#menu'));
  if (!els.length) return;
  const st = document.createElement('style');
  st.textContent = `.rv{transition-property:var(--rvp);transition-duration:var(--rvd);transition-timing-function:var(--rvf);transition-delay:var(--rvl)}
.rv[data-rv=pre]{clip-path:inset(-10px 100% -10px -10px);opacity:0}
.rv[data-rv=in]{clip-path:inset(-10px);opacity:1}
.rv[data-rv=post]{clip-path:inset(-10px -10px -10px 100%);opacity:0}
.rv[data-rv] span,.rv[data-rv]>svg{transition:opacity .5s ease .22s}.rv[data-rv=pre] span,.rv[data-rv=post] span,.rv[data-rv=pre]>svg,.rv[data-rv=post]>svg{opacity:0;transition-delay:0s}`;
  document.head.appendChild(st);
  const EASE = 'cubic-bezier(.76,0,.24,1)';
  els.forEach(e => {
    // keep the element's own transitions (hover colour, gap...) and add ours
    const c = getComputedStyle(e), has = c.transitionProperty !== 'all' && c.transitionDuration !== '0s';
    const props = has ? c.transitionProperty.split(', ') : [], durs = has ? c.transitionDuration.split(', ') : [], fns = has ? c.transitionTimingFunction.split(/,(?![^(]*\))/).map(x => x.trim()) : [], dels = has ? c.transitionDelay.split(', ') : [];
    e.style.setProperty('--rvp', [...props, 'clip-path', 'opacity'].join(','));
    e.style.setProperty('--rvd', [...durs, '.85s', '.55s'].join(','));
    e.style.setProperty('--rvf', [...fns, EASE, 'ease'].join(','));
    e.style.setProperty('--rvl', [...dels, '0s', '0s'].join(','));
    e.classList.add('rv'); e.dataset.rv = 'pre';
  });
  const io = new IntersectionObserver(es => es.forEach(en => {
    const r = en.boundingClientRect;
    en.target.dataset.rv = en.isIntersecting ? 'in' : (r.top < 0 ? 'post' : 'pre');
  }), { threshold: [0, .6], rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
})();
