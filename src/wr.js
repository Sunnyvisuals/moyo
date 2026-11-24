/* Titles: word reveal and word disappear (after the "Layer in view" text reveal).
   Each line of the title is a mask; its words rise one after another from under the mask, out of a light blur, when the title
   comes into view. When the title leaves by the top, the words go on up and out, in the same order; when it leaves by the bottom
   they sink back. Replaces the roller blind / shutters on these titles (the parallax of the title is kept).
   - Gradient titles: every word paints its own slice of the same gradient, so the colour fill driven by the scroll is unchanged.
   - Text stays whole for screen readers (aria-label); skipped with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  const TARGETS = 'h2.shut,.head h1,.who h1';
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const st = document.createElement('style');
  st.textContent = `.wr.shut{animation:none;clip-path:none}
.wr.shut.par{animation:par linear both;animation-timeline:--v;animation-range:cover 0% cover 100%}
.wr-ln{display:block;overflow:hidden;padding:.12em .08em .17em;margin:-.12em -.08em -.17em}
.wr-w{display:inline-block;transform:translateY(118%);opacity:0;filter:blur(7px);
  transition:transform 1.1s ${EASE} calc(var(--k) * 70ms),opacity .9s ease calc(var(--k) * 70ms),filter 1s ease calc(var(--k) * 70ms)}
.wr.in .wr-w{transform:none;opacity:1;filter:blur(0);
  transition:transform 1.7s ${EASE} calc(var(--k) * 130ms),opacity 1.3s ease calc(var(--k) * 130ms),filter 1.4s ease calc(var(--k) * 130ms)}
.wr.grad{background:none!important;-webkit-text-fill-color:currentColor}
.wr.grad .wr-w{background-image:radial-gradient(circle at 50% 50%,var(--dot) .7px,#0000 1.1px),linear-gradient(90deg,var(--g1) 0%,var(--g1) 38%,var(--g2) 56%,var(--g3) 78%,var(--g3) 100%);
  background-size:4px 4px,calc(var(--W) * 2.6) 100%;background-position:0 0,calc(var(--ox) * -1 - var(--W) * 1.6 * (1 - var(--g))) 0;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}`;
  document.head.appendChild(st);
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const state = new WeakMap();
  let started = false;

  const split = el => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    el._wrText = text; el._wrBusy = true;
    el.innerHTML = text.split(' ').map(w => `<span class="wr-w">${esc(w)}</span>`).join(' ');
    const ws = [...el.querySelectorAll('.wr-w')], rows = [];
    let top = null;
    ws.forEach(w => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { rows.push([]); top = t; } rows[rows.length - 1].push(w); });
    let k = 0;
    el.innerHTML = rows.map(r => `<span class="wr-ln">${r.map(w => `<span class="wr-w" style="--k:${k++}">${esc(w.textContent)}</span>`).join(' ')}</span>`).join('');
    el.setAttribute('aria-label', text);
    if (el.classList.contains('grad')) {
      const o = el.getBoundingClientRect(), W = Math.round(o.width);
      el.style.setProperty('--W', W + 'px');
      el.querySelectorAll('.wr-w').forEach(w => w.style.setProperty('--ox', Math.round(w.getBoundingClientRect().left - o.left) + 'px'));
    }
    requestAnimationFrame(() => { el._wrBusy = false; });
  };

  // in when the title is well inside the screen; out (the same animation played back) as it goes up under the header or down again
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    const el = en.target;
    if (en.isIntersecting) { if (state.get(el) !== 'in') { el.classList.add('in'); state.set(el, 'in'); } }
    else if (state.get(el) === 'in') { el.classList.remove('in'); state.delete(el); }
  }), { threshold: 0, rootMargin: '-14% 0px -34% 0px' });

  const els = [...document.querySelectorAll(TARGETS)].filter(e => !e.children.length || e.querySelector('.ln,.c,.w') === null);
  els.forEach(el => {
    if (!el.textContent.trim()) return;
    el.classList.add('wr'); split(el);
    // a language switch rewrites the title: split the new text again
    new MutationObserver(() => { if (!el._wrBusy && !el.querySelector('.wr-ln') && !el.querySelector('.fw-c')) { split(el); } }).observe(el, { childList: true });
  });
  const live = els.filter(e => e.classList.contains('wr'));
  if (!live.length) return;
  const go = () => { if (started) return; started = true; live.forEach(e => io.observe(e)); };
  let rt = 0, lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(() => live.forEach(e => { if (!e.querySelector('.fw-c')) split(e); }), 200); });
  const sameSite = (() => { try { return !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (_) { return false; } })();
  if (root.classList.contains('loading')) {
    const mo = new MutationObserver(() => { if (!root.classList.contains('loading')) { mo.disconnect(); setTimeout(go, 450); } });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  } else setTimeout(go, sameSite ? 450 : 80);
})();
