/* Section titles: Cursor Radius + Letter Scale.
   The letters near the pointer get heavier and slightly larger, with a smooth fall-off (cosine bell) as they get further away
   from it. The title is a variable font (Hanken Grotesk, wght axis), so the weight moves continuously.
   Rewritten for this site after the idea of the Framer component "Font Weight Hover" (modes: radius, falloff smooth, letter scale).
   - The title is split into letters only while the pointer is on it (and put back as it was afterwards), so reveals, gradients,
     language switch and the page transitions never see anything different.
   - Lines are locked while hovering: a heavier letter pushes its neighbours along the line, it never re-wraps the title.
   - Hover on fine pointers only. Nothing with reduced motion or on touch screens. The text stays whole for screen readers (aria-label). */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const TARGETS = 'h2.display:not(#introT),.head h1,.who h1';
  const HOVER_WEIGHT = 800, MAX_SCALE = 1.08, EASE = 'cubic-bezier(.16,1,.3,1)';
  const st = document.createElement('style');
  st.textContent = `[data-fw]{font-kerning:none}
.fw-ln{display:block;white-space:nowrap}
.fw-c{display:inline-block;transform-origin:50% 62%;transition:font-weight .25s ${EASE},font-variation-settings .25s ${EASE},transform .25s ${EASE};will-change:transform}
.fw-t.grad .fw-c{-webkit-text-fill-color:var(--g1)}`;
  document.head.appendChild(st);
  const bell = t => t >= 1 ? 0 : .5 * (1 + Math.cos(Math.PI * t)); // 1 at the pointer, 0 at the edge of the radius
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  document.querySelectorAll(TARGETS).forEach(el => {
    if (el.children.length) return; // plain text titles only
    el.setAttribute('data-fw', '');
    let orig = null, letters = [], pos = [], base = 300, radius = 180, dirty = true, raf = 0, ptr = null, hovering = false, undo = 0;

    const prepare = () => {
      if (orig !== null) return true;
      const text = el.textContent;
      if (!text.trim()) return false;
      const cs = getComputedStyle(el);
      base = parseFloat(cs.fontWeight) || 300; radius = Math.min(260, Math.max(110, parseFloat(cs.fontSize) * 2.6));
      orig = el.innerHTML;
      const h0 = el.getBoundingClientRect().height;
      el.innerHTML = text.split(' ').map(w => `<span class="fw-w" style="display:inline-block;white-space:nowrap">${[...w].map(c => `<span class="fw-c" aria-hidden="true">${esc(c)}</span>`).join('')}</span>`).join(' ');
      // lock the lines as they are laid out now
      const words = [...el.querySelectorAll('.fw-w')], lines = [];
      words.forEach(w => { const y = Math.round(w.offsetTop); const last = lines[lines.length - 1]; if (last && last.y === y) last.w.push(w); else lines.push({ y, w: [w] }); });
      el.innerHTML = lines.map(l => `<span class="fw-ln">${l.w.map(w => w.outerHTML).join(' ')}</span>`).join('');
      el.classList.add('fw-t'); el.setAttribute('aria-label', text);
      if (el.classList.contains('grad')) el.style.setProperty('background-image', 'none', 'important'); // the letters carry the solid colour themselves
      letters = [...el.querySelectorAll('.fw-c')]; dirty = true;
      return true;
    };
    const restore = () => {
      if (orig === null) return;
      el.innerHTML = orig; el.classList.remove('fw-t'); el.removeAttribute('aria-label'); el.style.removeProperty('background-image'); orig = null; letters = []; pos = [];
    };
    const measure = () => {
      const o = el.getBoundingClientRect();
      pos = letters.map(l => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top]; });
      dirty = false;
    };
    const paint = (cx, cy, on) => {
      for (let i = 0; i < letters.length; i++) {
        let f = 0;
        if (on && pos[i]) f = bell(Math.hypot(pos[i][0] - cx, pos[i][1] - cy) / radius);
        const w = Math.round(base + (HOVER_WEIGHT - base) * f), s = 1 + (MAX_SCALE - 1) * f, l = letters[i];
        l.style.fontWeight = w; l.style.fontVariationSettings = `'wght' ${w}`; l.style.transform = s > 1.0005 ? `scale(${s.toFixed(3)})` : 'none';
      }
    };
    const tick = () => {
      raf = 0;
      if (!hovering || !ptr || !letters.length) return;
      if (dirty) measure();
      const o = el.getBoundingClientRect();
      paint(ptr.x - o.left, ptr.y - o.top, true);
    };
    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(undo); hovering = true;
      if (!prepare()) return;
      dirty = true; ptr = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(tick);
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !hovering || orig === null) return;
      ptr = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      hovering = false; ptr = null; cancelAnimationFrame(raf); raf = 0;
      if (orig === null) return;
      paint(0, 0, false); clearTimeout(undo); undo = setTimeout(() => { if (!hovering) restore(); }, 420); // back to rest, then the original text again
    });
    new ResizeObserver(() => { dirty = true; }).observe(el);
    // a language switch rewrites the title with the new text: just forget our letters, never put the old text back
    new MutationObserver(() => { if (orig !== null && !el.querySelector('.fw-c')) { orig = null; letters = []; pos = []; el.classList.remove('fw-t'); el.style.removeProperty('background-image'); } }).observe(el, { childList: true });
    new MutationObserver(() => { if (orig !== null) { orig = null; letters = []; pos = []; el.classList.remove('fw-t'); el.removeAttribute('aria-label'); el.style.removeProperty('background-image'); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})();
