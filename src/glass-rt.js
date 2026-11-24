/* Liquid glass at the top of the footer (styles: GLASS_CSS in shared/chrome.js).
   - Refraction (Chromium only, the other browsers keep a light frost): an SVG displacement map used as a backdrop filter.
     The map is a thick convex slab, flat in the middle and curved along the top and the sides, where it pulls the page inwards.
   - The rim is a bevel whose thickness, radius and light follow the scroll. */
(() => {
  const foot = document.getElementById('foot');
  if (!foot) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ---------- the frost and the fog (GLASS_CSS): between the glass and its content ----------
     The fog is one picture per glass, stretched over it: paper with a horizon that is not a straight line, and a light behind it (Klein) where the
     horizon is lowest. Both are mixed here with decimals, and a grain is added before they are rounded to 8 bits: this is what keeps such a slow
     fade clean, where gradients laid over each other show their steps. u: 0 to 1 across the glass, v: 0 at its rim, 1 where the page starts. */
  const G = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
  const curve = (a, b) => { const N = 4096, t = new Float32Array(N + 1); for (let i = 0; i <= N; i++) { const x = i / N; t[i] = x ** a / (x ** a + (1 - x) ** b); } return x => x <= 0 ? 0 : x >= 1 ? 1 : t[x * N | 0]; };
  const fog = curve(2.35, 1.9), glow = curve(2, 1.5), OUT = .07; // the picture is a little wider than the glass: it slides with the scroll
  const horizon = u => .725 - .27 * G(u, 0, .33) - .1 * G(u, 1.04, .2) - .03 * G(u, .4, .13) + .006 * Math.sin(10.6 * u + 1.2); // where paper is half there: a high dune, a valley, a low one
  const soft = u => .57 + .17 * G(u, 0, .36) + .06 * G(u, 1, .2); // over how much it fades
  const paint = (c, kl) => {
    const W = c.width = Math.round(Math.min(2048, Math.max(720, innerWidth * (devicePixelRatio || 1) * .6))), H = c.height = 300, k = c.getContext('2d'), im = k.createImageData(W, H), d = im.data;
    for (let x = 0; x < W; x++) {
      const u = (x + .5) / W * (1 + 2 * OUT) - OUT, w = soft(u), h = horizon(u), light = kl * .95 * (.17 + .83 * G(u, .64, .27));
      for (let y = 0, o = x * 4; y < H; y++, o += W * 4) {
        const v = (y + .5) / H, A = fog((v - h) / w + .56), L = light * glow((v - h + .57) / .64) * (1 - A), n = A > .998 ? .5 : Math.random() + Math.random() - .5, q = Math.min(255, (A + L) * 255 + n | 0);
        if (q) { const s = 255 / q; d[o] = (A * 250 + n | 0) * s; d[o + 1] = (A * 250 + L * 47 + n | 0) * s; d[o + 2] = (A * 248 + L * 167 + n | 0) * s; d[o + 3] = q; }
      }
    }
    k.putImageData(im, 0, 0);
  };
  /* how much paper there is at a place of a sheet or of the footer (0 to 1), for the cursor; null if it is not glass at all */
  window.moyoFog = (el, x, y) => { const m = el.querySelector(':scope>.mist'); if (!m) return null; const r = m.getBoundingClientRect(), v = (y - r.top) / r.height, b = m.lastElementChild.getBoundingClientRect(), u = (x - b.left) / b.width * (1 + 2 * OUT) - OUT; return v >= 1 ? 1 : fog((v - horizon(u)) / soft(u) + .56); };
  const soon = window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 900 }) : f => setTimeout(f, 60);
  [foot, ...document.querySelectorAll('html.stack main>.over')].forEach(el => {
    const m = document.createElement('div'), c = document.createElement('canvas'); m.className = 'mist'; m.setAttribute('aria-hidden', 'true'); m.innerHTML = '<i></i><i></i><i></i>'; m.append(c); el.prepend(m);
    if (el === foot) { const fl = document.createElement('div'); fl.className = 'floor'; el.prepend(fl); el.classList.add('clear'); } // what is seen through the glass can still be clicked; the paper below is solid
    const kl = parseFloat(getComputedStyle(el).getPropertyValue('--kl')) || 1, r = el.getBoundingClientRect();
    r.top < innerHeight && r.bottom > 0 ? paint(c, kl) : soon(() => paint(c, kl));
  });

  /* ---------- refraction ---------- */
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
      const id = 'liquid' + (++n);
      pane.box.innerHTML = `<filter id="${id}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feImage href="${cv.toDataURL()}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" result="m"/><feGaussianBlur in="m" stdDeviation="2" result="map"/>
<feDisplacementMap in="SourceGraphic" in2="map" scale="${SCALE}" xChannelSelector="R" yChannelSelector="G" result="o"/><feGaussianBlur in="o" stdDeviation=".7"/></filter>`;
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
