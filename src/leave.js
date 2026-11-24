/* Exits.
   - A link to another page of the site: the dot opens from the click until the screen is blue, then the page changes; the next page
     opens by closing on the final point of its title (load.js).
   - The project sheet, where the browser cannot morph it: its content leaves before it closes (window.hbOut).
   Nothing is intercepted for new tabs, modifier keys, downloads, other sites, mailto, links to the same page, or reduced motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.5,0,.75,0)'; // accelerates away, the opposite of the entrance
  let veil = null;

  function go(href, x, y) {
    if (veil) return;
    veil = document.createElement('div'); veil.className = 'kl'; veil.setAttribute('popover', 'manual'); document.body.appendChild(veil);
    try { veil.showPopover(); } catch (_) { veil.removeAttribute('popover'); } // above the menu
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4, at = `at ${x.toFixed(0)}px ${y.toFixed(0)}px`;
    veil.animate([{ clipPath: `circle(0px ${at})` }, { clipPath: `circle(${R.toFixed(0)}px ${at})` }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    setTimeout(() => { try { sessionStorage.setItem('moyo-in', String(Date.now())); } catch (_) {} location.href = href; }, 570);
  }
  document.addEventListener('click', e => {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    let u; try { u = new URL(a.href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(u.protocol) || u.origin !== location.origin) return;
    if (u.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '') && u.search === location.search) return; // same page: anchors scroll
    e.preventDefault();
    let x = e.clientX, y = e.clientY; if (!x && !y) { const r = a.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; } // keyboard
    go(u.href, x, y);
  });
  addEventListener('pageshow', e => { if (e.persisted && veil) { veil.remove(); veil = null; } }); // coming back from the back/forward cache

  /* ----- the name typed on the keyboard: a monochrome, for a second ----- */
  let typed = '', px = innerWidth / 2, py = innerHeight / 2;
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });
  addEventListener('keydown', e => {
    if (reduce || veil || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    typed = (typed + e.key.toLowerCase()).slice(-4); if (typed !== 'moyo') return; typed = '';
    const v = document.createElement('div'); v.className = 'kl'; v.setAttribute('popover', 'manual'); v.setAttribute('aria-hidden', 'true'); document.body.appendChild(v); try { v.showPopover(); } catch (_) { v.removeAttribute('popover'); }
    const d = [...document.querySelectorAll('h1 .dot b,main h2 .dot b')].map(b => b.getBoundingClientRect()).find(r => r.width && r.top > 0 && r.bottom < innerHeight), ex = d ? d.left + d.width / 2 : innerWidth / 2, ey = d ? d.top + d.height / 2 : innerHeight / 2;
    const far = (x, y) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4, c = (r, x, y) => `circle(${r.toFixed(0)}px at ${x.toFixed(0)}px ${y.toFixed(0)}px)`;
    v.animate([{ clipPath: c(0, px, py) }, { clipPath: c(far(px, py), px, py) }], { duration: 620, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished
      .then(() => v.animate([{ clipPath: c(far(ex, ey), ex, ey) }, { clipPath: c(0, ex, ey) }], { duration: 900, delay: 260, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }).finished).finally(() => v.remove());
  });

  /* ----- the project sheet ----- */
  window.hbOut = (scope, done) => {
    if (reduce) return done();
    const els = [...scope.querySelectorAll('.crumbs,.sheet-t,.sheet-g>*,.gallery,.next')].filter(e => e.offsetParent !== null);
    const a = els.map((el, i) => el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -14px' }], { duration: 260, delay: Math.min(i * 22, 130), easing: EASE, fill: 'forwards' }));
    const end = 260 + Math.min(els.length * 22, 130) + 20;
    setTimeout(() => { done(); a.forEach(x => { try { x.cancel(); } catch (_) {} }); }, end);
  };
})();
