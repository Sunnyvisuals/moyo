/* Liquid glass at the top of the footer (styles: GLASS_CSS in shared/chrome.js).
   - Refraction (Chromium only, the other browsers keep a light frost): an SVG displacement map used as a backdrop filter.
     The map is a thick convex slab, flat in the middle and curved along the top and the sides, where it pulls the page inwards.
   - Dispersion: red, green and blue are bent by slightly different amounts, so edges open into a hint of colour.
   - The rim is a bevel whose thickness, radius and light follow the scroll. */
(() => {
  const foot = document.getElementById('foot');
  if (!foot) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- refraction ---------- */
  const K = [1.005, 1, .995]; // red, green, blue: just enough to feel like glass on a black and white page
  if ((navigator.userAgentData?.brands || []).some(b => b.brand === 'Chromium')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    document.body.appendChild(svg);
    const cv = document.createElement('canvas'), g = cv.getContext('2d');
    const snell = t => { if (t >= 1) return 0; const u = 1 - t, a = Math.atan(u ** 3 / (1 - u ** 4 + .12) ** .75), r = Math.asin(Math.sin(a) / 1.5); return Math.tan(a - r) * (1 - u ** 4 + .35) ** .25; };
    const peak = snell(0), N = 256, lut = Float32Array.from({ length: N + 1 }, (_, i) => snell(i / N) / peak);
    const lens = (d, size, pull) => d < size ? lut[Math.round(d / size * N)] * pull : 0;
    let n = 0, t0 = 0;
    /* one filter per size of glass: the footer, and the top edge of the sheets that pass over a screen (home) */
    const sec = document.querySelector('html.stack main>.over');
    const PANES = [[foot, v => foot.style.setProperty('--liquid', v)], [sec, v => document.documentElement.style.setProperty('--liquid-s', v)]].filter(p => p[0])
      .map(([el, set]) => ({ el, set, last: '', box: svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g')) }));
    const build = () => PANES.forEach(pane => {
      const W = pane.el.clientWidth, H = Math.ceil(parseFloat(getComputedStyle(pane.el, '::before').height)) || 0;
      if (!W || !H || pane.last === W + 'x' + H) return; pane.last = W + 'x' + H;
      const small = W < 821, TOP = small ? 70 : 110, PULL = small ? 20 : 34, SIDE = small ? 20 : 50, PULLX = small ? 8 : 16, Q = 2, SCALE = 2.1 * PULL;
      const w = Math.ceil(W / Q), h = Math.ceil(H / Q), im = g.createImageData(cv.width = w, cv.height = h), d = im.data;
      for (let py = 0, o = 0; py < h; py++) { const my = lens((py + .5) * Q, TOP, PULL);
        for (let px = 0; px < w; px++, o += 4) { const x = (px + .5) * Q, mx = x < W / 2 ? lens(x, SIDE, PULLX) : -lens(W - x, SIDE, PULLX);
          d[o] = 127.5 + mx / SCALE * 255 + Math.random(); d[o + 1] = 127.5 + my / SCALE * 255 + Math.random(); d[o + 2] = 128; d[o + 3] = 255; } }
      g.putImageData(im, 0, 0);
      const id = 'liquid' + (++n), ch = ['1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'];
      pane.box.innerHTML = `<filter id="${id}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feImage href="${cv.toDataURL()}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" result="m"/><feGaussianBlur in="m" stdDeviation="2" result="map"/>
${ch.map((m, i) => `<feDisplacementMap in="SourceGraphic" in2="map" scale="${SCALE * K[i]}" xChannelSelector="R" yChannelSelector="G" result="d${i}"/><feColorMatrix in="d${i}" values="${m}" result="c${i}"/>`).join('')}
<feBlend in="c0" in2="c1" mode="screen" result="rg"/><feBlend in="rg" in2="c2" mode="screen" result="o"/><feGaussianBlur in="o" stdDeviation=".7"/></filter>`;
      pane.set(`url(#${id})`);
    });
    const later = () => { clearTimeout(t0); t0 = setTimeout(build, 120); };
    PANES.forEach(p => new ResizeObserver(later).observe(p.el)); addEventListener('resize', later); build();
  }

  if (still) return;
  /* ---------- the edge: a bevel that lives with the scroll ----------
     --fr: how far the footer has risen (0 to 1), --fv: scroll speed (0 to 1), --lx: where the light hits the rim */
  let lx = 20, tx = 20, ptr = 0, fr = 0, fv = 0, ty = scrollY, raf = 0;
  const clamp = v => Math.min(1, Math.max(0, v));
  const set = (k, v) => foot.style.setProperty(k, v);
  let t0 = 0;
  const frame = now => {
    raf = 0;
    const top = foot.getBoundingClientRect().top, goal = clamp(1 - top / innerHeight);
    if (top > innerHeight * 1.05) return; // out of sight: stop (the next scroll starts it again)
    fr += (goal - fr) * .16; fv *= .92; if (fv < .004) fv = 0;
    // the light travels slowly along the rim by itself, the scroll sweeps it and the pointer nudges it
    tx = 50 + 34 * Math.sin(now / 2600) + (fr - .5) * 40 + ptr * 14; lx += (tx - lx) * .08;
    set('--fr', fr.toFixed(3)); set('--fv', fv.toFixed(3)); set('--lx', lx.toFixed(2) + '%');
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', e => { ptr = e.clientX / innerWidth * 2 - 1; kick(); }, { passive: true });
  addEventListener('scroll', () => { const dy = Math.abs(scrollY - ty); ty = scrollY; fv = clamp(fv + dy / 140); kick(); }, { passive: true });
  kick();
})();
