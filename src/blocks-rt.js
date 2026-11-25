/* The layout of a project (shared/blocks.js), on the page: a silent film plays while it is seen, one with sound waits for a hand and stops the others,
   and a page of another service is only asked for once the visitor says so: the dot opens on it. */
(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const near = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const v = e.target; near.unobserve(v); if (!v.src) { v.src = v.dataset.src; if (v.dataset.mode === 'player') v.preload = 'metadata'; } }), { rootMargin: '60% 0px' });
const seen = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause(); }), { threshold: .2 });
window.moyoBlocks = scope => scope.querySelectorAll('video[data-src]').forEach(v => {
  if (v.dataset.on) return; v.dataset.on = '1'; near.observe(v);
  if (v.dataset.mode === 'player') v.addEventListener('play', () => document.querySelectorAll('video[data-mode=player]').forEach(o => { if (o !== v) o.pause(); }));
  else if (reduce) v.controls = true; else seen.observe(v);
});
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.emb-b'), box = b && b.parentElement; if (!b || document.documentElement.dataset.apercu !== undefined && !box.dataset.embed) return;
  const f = document.createElement('iframe'), en = document.documentElement.lang === 'en'; f.title = box.dataset.name; f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; web-share; xr-spatial-tracking'; f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin';
  if (box.hasAttribute('data-other')) f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation');
  f.src = box.dataset.embed; f.tabIndex = 0;
  const open = () => { b.remove(); box.querySelector('img')?.remove(); box.append(f); f.focus({ preventScroll: true }); };
  if (reduce) return open();
  const r = box.getBoundingClientRect(), x = e.clientX ? e.clientX - r.left : r.width / 2, y = e.clientY ? e.clientY - r.top : r.height / 2, R = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 4, k = document.createElement('i'); k.className = 'kl2'; box.append(k);
  const c = n => `circle(${n}px at ${x}px ${y}px)`; k.animate([{ clipPath: c(0) }, { clipPath: c(R) }], { duration: 620, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished.then(() => {
    open(); let done = false; const away = () => { if (done) return; done = true; k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease', fill: 'forwards' }).finished.then(() => k.remove()); }; f.addEventListener('load', away); setTimeout(away, 3500);
  });
});
moyoBlocks(document);
})();
