/* Buttons and links-as-buttons appear and leave with the scroll, with the same gesture both ways.
   Arriving: the box is drawn slowly from left to right (a clip wipe), the label follows a beat later.
   Leaving: it keeps its direction and wipes out the same way, a little shorter, so the movement never reverses.
   It leaves when it scrolls off screen, and also when the next section slides over it (the sections stack on the home).
   Works from the elements' own classes: nothing to add in the markup. Skipped with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const SEL = '.btn,.lnk,.sub-btn';
  const els = [...document.querySelectorAll(SEL)].filter(e => !e.closest('dialog,#menu'));
  if (!els.length) return;
  const st = document.createElement('style');
  // arriving (data-rv=in): .9s, slow and soft. Leaving (pre / post): .65s, the same curve
  st.textContent = `.rv{transition-property:var(--rvp);transition-duration:var(--rvdo);transition-timing-function:var(--rvfo);transition-delay:var(--rvl)}
.rv[data-rv=in]{transition-duration:var(--rvd);transition-timing-function:var(--rvf)}
.rv[data-rv=pre]{clip-path:inset(-10px 100% -10px -10px);opacity:0}
.rv[data-rv=in]{clip-path:inset(-10px);opacity:1}
.rv[data-rv=post]{clip-path:inset(-10px -10px -10px 100%);opacity:0}
.rv[data-rv] span,.rv[data-rv]>svg{transition:opacity .6s ease .3s}.rv[data-rv=pre] span,.rv[data-rv=post] span,.rv[data-rv=pre]>svg,.rv[data-rv=post]>svg{opacity:0;transition-duration:.3s;transition-delay:0s}`;
  document.head.appendChild(st);
  const IN = 'cubic-bezier(.65,0,.35,1)', OUT = 'cubic-bezier(.65,0,.35,1)';
  els.forEach(e => {
    // keep the element's own transitions (hover colour, gap...) and add ours
    const c = getComputedStyle(e), has = c.transitionProperty !== 'all' && c.transitionDuration !== '0s';
    const props = has ? c.transitionProperty.split(', ') : [], durs = has ? c.transitionDuration.split(', ') : [], fns = has ? c.transitionTimingFunction.split(/,(?![^(]*\))/).map(x => x.trim()) : [], dels = has ? c.transitionDelay.split(', ') : [];
    e.style.setProperty('--rvp', [...props, 'clip-path', 'opacity'].join(','));
    e.style.setProperty('--rvd', [...durs, '.9s', '.6s'].join(','));
    e.style.setProperty('--rvdo', [...durs, '.65s', '.4s'].join(','));
    e.style.setProperty('--rvf', [...fns, IN, 'ease'].join(','));
    e.style.setProperty('--rvfo', [...fns, OUT, 'ease'].join(','));
    e.style.setProperty('--rvl', [...dels, '0s', '0s'].join(','));
    e.classList.add('rv'); e.dataset.rv = 'pre';
  });

  /* on screen = intersecting, and not covered by another section */
  const inView = new Set();
  const covered = e => {
    const r = e.getBoundingClientRect(), x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const t = document.elementFromPoint(x, y);
    if (!t || e.contains(t) || t.contains(e)) return false;
    const mine = e.closest('.sec,footer,main'), other = t.closest('.sec,footer,main');
    return !!other && other !== mine && !other.contains(e) && !t.closest('.bar,.scr');
  };
  const set = (e, v) => { if (e.dataset.rv !== v) e.dataset.rv = v; };
  const io = new IntersectionObserver(es => es.forEach(en => {
    const e = en.target, r = en.boundingClientRect;
    if (en.isIntersecting) { inView.add(e); set(e, covered(e) ? 'post' : 'in'); }
    else { inView.delete(e); set(e, r.top < 0 ? 'post' : 'pre'); }
  }), { threshold: [0, .6], rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  let raf = 0;
  const check = () => { raf = 0; inView.forEach(e => set(e, covered(e) ? 'post' : 'in')); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(check); });
})();
