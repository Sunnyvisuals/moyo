/* Minimal cursor: a small solid disc (it scales with very wide screens). Over anything clickable it opens into a thin empty ring.
   It reads the colour really under it (background or photo): light on dark, blue on light. The system caret in text fields.
   Mouse and trackpad only (pointer: fine). Inside the menu and dialogs (top layer) the system cursor comes back. */
(() => {
  if (!matchMedia('(pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = `
html.has-cur,html.has-cur *{cursor:none}
html.has-cur input:not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button]):not([type=reset]):not([type=range]):not([type=file]):not([type=color]):not([type=image]),html.has-cur textarea,html.has-cur select{cursor:text}
html.cur-off,html.cur-off *{cursor:auto}
html.cur-off a,html.cur-off button,html.cur-off label,html.cur-off a *,html.cur-off button *,html.cur-off label *{cursor:pointer}
.cur{position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;opacity:0;transition:opacity .3s}
.cur.on{opacity:1}
.cur{--c:#002FA7}
.cur.inv{--c:#F1F3F2}
.cur::before{content:"";position:absolute;left:0;top:0;width:clamp(13px,.8vw,24px);aspect-ratio:1;translate:-50% -50%;box-sizing:border-box;border-radius:50%;background:var(--c);border:1.5px solid var(--c);
  transition:width .45s cubic-bezier(.2,.9,.2,1),background .25s,border-color .18s,scale .25s}
.cur.hot::before{width:clamp(44px,2.8vw,84px);background:transparent}
.cur.down::before{scale:.78}`;
  /* luminance (0 dark, 1 light) of what is painted under the pointer */
  const px = document.createElement('canvas'); px.width = px.height = 1;
  const g = px.getContext('2d', { willReadFrequently: true });
  const lum = (r, v, b) => (.2126 * r + .7152 * v + .0722 * b) / 255;
  const colors = new Map();
  const colorOf = css => { // [luminance, alpha] of any CSS colour, resolved by the canvas
    let o = colors.get(css);
    if (!o) { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; o = [lum(d[0], d[1], d[2]), d[3] / 255]; colors.set(css, o); }
    return o;
  };
  const imgLum = (im, mx, my) => {
    const r = im.getBoundingClientRect(), k = Math.max(r.width / im.naturalWidth, r.height / im.naturalHeight); // object-fit: cover
    const s = 24 / k, sx = (mx - r.left - r.width / 2) / k + im.naturalWidth / 2 - s / 2, sy = (my - r.top - r.height / 2) / k + im.naturalHeight / 2 - s / 2;
    g.clearRect(0, 0, 1, 1); g.drawImage(im, sx, sy, s, s, 0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data; return d[3] ? lum(d[0], d[1], d[2]) : null;
  };
  const under = (mx, my) => {
    for (const el of document.elementsFromPoint(mx, my)) {
      const card = el.classList.contains('acard') ? el : null;
      const im = el.tagName === 'IMG' ? el : card && card.querySelector('img');
      let dim = 1;
      const ac = el.closest('.acard');
      if (ac) { const r = ac.getBoundingClientRect(), f = (my - r.top) / r.height; dim = 1 - (f < .5 ? .05 + f * .3 : .2 + (f - .5) * 1.3); } // its dark veil
      if (im && im.naturalWidth) { try { const l = imgLum(im, mx, my); if (l !== null) return l * dim; } catch (_) {} }
      if (el.classList.contains('acard-grad')) continue;
      // outlined buttons fill up through ::before on hover: read that layer
      if (el.matches('.link:hover,.menu-list a:hover')) { const f = colorOf(getComputedStyle(el, '::before').backgroundColor); if (f[1] > .5) return f[0]; }
      if (el.id === 'foot' && my - el.getBoundingClientRect().top > 80) return 0; // solid blue under its glass top
      const c = colorOf(getComputedStyle(el).backgroundColor);
      if (c[1] > .5) return c[0] * dim;
    }
    return 1;
  };
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const c = document.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true');
  const root = document.documentElement;
  let x = -100, y = -100, cx = x, cy = y, raf = 0;
  const loop = () => {
    const k = reduce ? 1 : .32;
    cx += (x - cx) * k; cy += (y - cy) * k;
    c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    raf = (Math.abs(x - cx) + Math.abs(y - cy) > .2) ? requestAnimationFrame(loop) : 0;
  };
  // two thresholds, so the colour does not flicker over mid greys
  let queued = 0;
  const tone = () => { if (x < 0) return; const t = document.elementFromPoint(x, y); c.classList.toggle('hot', !!(t && t.closest('a,button,label,summary,.row,[role=button]'))); const l = under(x, y); c.classList.toggle('inv', l < (c.classList.contains('inv') ? .5 : .4)); };
  const start = () => {
    addEventListener('scroll', () => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; tone(); }); }, { passive: true, capture: true });
    document.body.appendChild(c); root.classList.add('has-cur');
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      const top = t && t.closest('dialog,[popover]');
      root.classList.toggle('cur-off', !!top);
      const text = t && t.closest('input:not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button]):not([type=reset]):not([type=range]):not([type=file]):not([type=color]):not([type=image]),textarea,select,[contenteditable]');
      c.classList.toggle('on', !top && !text);
      tone();
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    // a button can change colour under a still pointer (hover fade, selected choice): look again
    setInterval(() => { if (!document.hidden && c.classList.contains('on')) tone(); }, 120);
    addEventListener('pointerdown', () => c.classList.add('down'), { passive: true });
    addEventListener('pointerup', () => c.classList.remove('down'), { passive: true });
    root.addEventListener('mouseleave', () => c.classList.remove('on'));
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
