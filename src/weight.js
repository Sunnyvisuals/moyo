/* Services: the letters near the pointer get heavier, with a smooth fall-off (after the Framer component "Font Weight Hover").
   Hanken Grotesk is a variable font: the weight moves continuously. A name is split into letters only while the pointer is on its row,
   and put back as it was afterwards, so the language switch and screen readers never see anything different.
   Mouse only; nothing with reduced motion. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const LIGHT = 380, HEAVY = 900;
  const st = document.createElement('style');
  st.textContent = `.fw{white-space:nowrap}.fw-c{display:inline-block;white-space:pre;transition:font-variation-settings .35s cubic-bezier(.16,1,.3,1)}`;
  document.head.appendChild(st);
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  document.querySelectorAll('.line').forEach(row => {
    const el = row.querySelector('h3'); if (!el) return;
    let text = null, letters = [], raf = 0, ptr = null, base = 600, undo = 0;
    const split = () => { if (text !== null) return; text = el.textContent; base = parseFloat(getComputedStyle(el).fontWeight) || 600; el.setAttribute('aria-label', text);
      el.innerHTML = `<span class="fw" aria-hidden="true">${[...text].map(c => `<span class="fw-c" style="font-variation-settings:'wght' ${base}">${esc(c)}</span>`).join('')}</span>`; letters = [...el.querySelectorAll('.fw-c')]; };
    const join = () => { if (text === null) return; if (el.querySelector('.fw')) el.textContent = text; el.removeAttribute('aria-label'); text = null; letters = []; };
    const paint = () => { raf = 0; if (!ptr || !letters.length) return;
      const size = parseFloat(getComputedStyle(el).fontSize), rad = size * 4.2;
      const mid = letters.map(l => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; }); // read everything, then write everything
      letters.forEach((l, i) => { const d = Math.abs(mid[i] - ptr) / rad, f = d >= 1 ? 0 : .5 * (1 + Math.cos(Math.PI * d)); l.style.fontVariationSettings = `'wght' ${Math.round(LIGHT + (HEAVY - LIGHT) * f)}`; }); };
    row.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(undo); split(); ptr = e.clientX; if (!raf) raf = requestAnimationFrame(paint); });
    row.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || text === null) return; ptr = e.clientX; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    row.addEventListener('pointerleave', () => { ptr = null; letters.forEach(l => { l.style.fontVariationSettings = `'wght' ${base}`; }); clearTimeout(undo); undo = setTimeout(join, 420); });
    // a language switch rewrites the name: forget our letters, never put the old text back
    new MutationObserver(() => { if (text !== null && !el.querySelector('.fw')) { text = null; letters = []; el.removeAttribute('aria-label'); } }).observe(el, { childList: true });
  });
})();
