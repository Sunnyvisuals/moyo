/* Liquid glass for the top of the footer.
   - Refraction: an SVG displacement map used as a backdrop filter. Only Chromium can run an SVG filter on the backdrop;
     elsewhere the CSS keeps a light frost (see GLASS_CSS in shared/chrome.js).
   - The map is a thick convex slab: rays are bent with Snell's law along the top and the sides, then the whole is frosted.
   - Five wavelengths are bent by slightly different amounts: a hint of colour at the edges, no more.
   - The rim is a bevel: thickness, radius and light follow the scroll. */
(() => {
  const foot = document.getElementById('foot');
  if (!foot) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chromium = (navigator.userAgentData?.brands || []).some(b => b.brand === 'Chromium');

  /* ---------- refraction ---------- */
  // a continuous spectrum: wavelengths from red to violet, each bent a little more or less, weighted so that they add up to white
  const SPECTRUM = (() => {
    const N = 5, bell = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
    const l = Array.from({ length: N }, (_, i) => { const u = i / (N - 1); return { k: 1.09 - .18 * u, c: [bell(u, 0, .42), bell(u, .5, .34), bell(u, 1, .42)] }; });
    const sum = [0, 1, 2].map(j => l.reduce((a, b) => a + b.c[j], 0));
    return l.map(b => ({ k: b.k, c: b.c.map((v, j) => (v / sum[j]).toFixed(4)) }));
  })();
  if (chromium) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    document.body.appendChild(svg);
    const cv = document.createElement('canvas'), g = cv.getContext('2d');
    // how far a ray drifts, entering a convex slab at distance t (0 rim, 1 flat part): normalised to 1 at the rim
    const snell = t => {
      if (t >= 1) return 0;
      const u = 1 - t, slope = u ** 3 / (1 - u ** 4 + .12) ** .75; // squircle profile
      const a = Math.atan(slope), r = Math.asin(Math.sin(a) / 1.5);
      return Math.tan(a - r) * (1 - u ** 4 + .35) ** .25;
    };
    const peak = snell(0), N = 256, lut = Float32Array.from({ length: N + 1 }, (_, i) => snell(i / N) / peak);
    const lens = (dist, size, pull) => dist < size ? lut[Math.round(dist / size * N)] * pull : 0;
    let last = '', n = 0, t = 0;

    const build = () => {
      const W = foot.clientWidth, H = Math.ceil(parseFloat(getComputedStyle(foot, '::before').height)) || 0;
      if (!W || !H || last === W + 'x' + H) return;
      last = W + 'x' + H;
      const small = W < 821, TOP = small ? 70 : 120, PULL = small ? 32 : 52, SIDE = small ? 20 : 44, PULLX = small ? 8 : 18, K = 2;
      const SCALE = 2.08 * PULL;
      const w = Math.ceil(W / K), h = Math.ceil(H / K), im = g.createImageData(cv.width = w, cv.height = h), d = im.data;
      for (let py = 0, o = 0; py < h; py++) {
        const y = (py + .5) * K, top = lens(y, TOP, PULL);
        for (let px = 0; px < w; px++, o += 4) {
          const x = (px + .5) * K;
          const mx = (x < W / 2 ? lens(x, SIDE, PULLX) : -lens(W - x, SIDE, PULLX));
          // the map has 8 bits only: a little noise turns its steps into a soft grain
          d[o] = 127.5 + mx / SCALE * 255 + .2 + Math.random() * .6; d[o + 1] = 127.5 + top / SCALE * 255 + .2 + Math.random() * .6; d[o + 2] = 128; d[o + 3] = 255;
        }
      }
      g.putImageData(im, 0, 0);
      const id = 'liquid' + (++n);
      svg.innerHTML = `<filter id="${id}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feImage href="${cv.toDataURL()}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" result="map"/>
${SPECTRUM.map((b, i) => `<feDisplacementMap in="SourceGraphic" in2="map" scale="${SCALE * b.k}" xChannelSelector="R" yChannelSelector="G" result="d${i}"/><feColorMatrix in="d${i}" values="${b.c[0]} 0 0 0 0 0 ${b.c[1]} 0 0 0 0 0 ${b.c[2]} 0 0 0 0 0 1 0" result="c${i}"/>${i ? `<feComposite in="${i > 1 ? 's' + (i - 1) : 'c0'}" in2="c${i}" operator="arithmetic" k2="1" k3="1" result="s${i}"/>` : ''}`).join('')}
<feGaussianBlur in="s${SPECTRUM.length - 1}" stdDeviation="${small ? 3 : 4.5}"/></filter>`;
      foot.style.setProperty('--liquid', `url(#${id})`);
    };
    const later = () => { clearTimeout(t); t = setTimeout(build, 120); };
    new ResizeObserver(later).observe(foot); addEventListener('resize', later);
    build();
  }
  if (still) return;

  /* ---------- the edge: a bevel that lives with the scroll ----------
     --fr: how far the footer has risen (0 to 1), --fv: scroll speed (0 to 1), --lx: where the light hits the rim */
  let lx = 20, tx = 20, ptr = 0, fr = 0, fv = 0, ty = scrollY, raf = 0;
  const clamp = v => Math.min(1, Math.max(0, v));
  const set = (k, v) => foot.style.setProperty(k, v);
  const frame = () => {
    raf = 0;
    const top = foot.getBoundingClientRect().top, goal = clamp(1 - top / innerHeight);
    if (top > innerHeight || top < -innerHeight) return;
    fr += (goal - fr) * .16; fv *= .9; if (fv < .004) fv = 0;
    tx = 14 + fr * 72 + ptr * 14; lx += (tx - lx) * .12; // the light sweeps along the rim as it rises, the pointer nudges it
    set('--fr', fr.toFixed(3)); set('--fv', fv.toFixed(3)); set('--lx', lx.toFixed(2) + '%');
    if (Math.abs(goal - fr) > .002 || Math.abs(tx - lx) > .1 || fv) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', e => { ptr = e.clientX / innerWidth * 2 - 1; kick(); }, { passive: true });
  addEventListener('scroll', () => { const dy = Math.abs(scrollY - ty); ty = scrollY; fv = clamp(fv + dy / 260); kick(); }, { passive: true });
  kick();
})();
