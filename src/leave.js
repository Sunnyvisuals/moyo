/* Exit animations. Elements appear when a page arrives; they now also leave before it changes.
   - Links to another page of the site: what is on screen lifts and fades, from the top of the screen down, then the page changes
     (the page transition that follows then starts from a calm page). Back and forward buttons get the same final state instantly.
   - The project window: its content leaves before it closes (window.hbOut).
   Nothing is intercepted for new tabs, modifier keys, downloads, other sites, mailto, links to the same page, or reduced motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const EASE = 'cubic-bezier(.5,0,.75,0)'; // accelerates away, the opposite of the entrance
  let live = [], leaving = false;

  /* what is worth animating: the visible pieces of content, not the containers */
  const PIECES = '.hero-copy,.win,.sunui,.idx,h1,h2,h3,.lead,.statement,.display,.entry-w,.entry-d,.list li,.steps li,.names li,.proj-more,.studio-cta,.ct-side>*,.ct-form>*,' +
    '.head>*,.filters,.projects>li,.acard,.photo,.who>*,.fcol,.foot-sub,.foot-base,.mono-wrap,.blocks,.small,p';
  function pieces(scope) {
    const H = innerHeight, out = [];
    (scope || document).querySelectorAll(PIECES).forEach(el => {
      if (el.closest('.scr,#menu,dialog,.bar,[hidden]') || (el.parentElement && el.parentElement.closest(PIECES) && !el.matches('.hero-copy,.win,.photo,.who>*,.blocks'))) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H || !r.width || !r.height) return;
      out.push([r.top, el]);
    });
    return out.sort((a, b) => a[0] - b[0]).map(x => x[1]);
  }
  function out(els, { dur = 320, step = 26, max = 200, lift = 18 } = {}) {
    let end = 0;
    els.forEach((el, i) => {
      const delay = Math.min(i * step, max);
      live.push(el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 -${lift}px` }], { duration: dur, delay, easing: EASE, fill: 'forwards' }));
      end = Math.max(end, delay + dur);
    });
    return end;
  }
  const clear = () => { live.forEach(a => { try { a.cancel(); } catch (_) {} }); live = []; leaving = false; root.classList.remove('leaving'); };

  /* ----- leaving the page by a link ----- */
  function go(href) {
    if (leaving) return; leaving = true; root.classList.add('leaving');
    const menu = document.getElementById('menu');
    const els = pieces(); const bar = document.getElementById('bar');
    let end = out(els);
    if (bar) live.push(bar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }));
    if (menu && menu.matches(':popover-open')) live.push(menu.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'forwards' })), end = Math.max(end, 320);
    setTimeout(() => { location.href = href; }, Math.min(end, 520) + 30);
  }
  document.addEventListener('click', e => {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    let u; try { u = new URL(a.href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(u.protocol) || u.origin !== location.origin) return;
    if (u.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '') && u.search === location.search) return; // same page: anchors scroll
    e.preventDefault(); go(u.href);
  });

  /* back / forward / any other change of page: the old page is photographed already empty, like after a click */
  addEventListener('pageswap', () => { if (!reduce && !leaving) { out(pieces(), { dur: 0, step: 0, max: 0, lift: 18 }); const b = document.getElementById('bar'); if (b) live.push(b.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 0, fill: 'forwards' })); } });
  addEventListener('pageshow', e => { if (e.persisted) clear(); }); // coming back from the back/forward cache

  /* ----- the project window ----- */
  window.hbOut = (scope, done) => {
    if (reduce) return done();
    const els = [...scope.querySelectorAll('.dlg-in>*,.dlg-actions>*')].filter(e => e.offsetParent !== null);
    const a = els.map((el, i) => el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -14px' }], { duration: 260, delay: Math.min(i * 22, 130), easing: EASE, fill: 'forwards' }));
    const end = 260 + Math.min(els.length * 22, 130) + 20;
    setTimeout(() => { done(); a.forEach(x => { try { x.cancel(); } catch (_) {} }); }, end);
  };
})();
