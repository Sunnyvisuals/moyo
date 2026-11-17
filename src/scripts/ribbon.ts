/**
 * Bande de projets incurvée (WebGL, sans librairie).
 * Les projets sont posés sur l'intérieur d'un cylindre : plus petits au centre, plus grands sur les bords.
 * Molette, glisser, flèches du clavier. La vitesse décale les canaux rouge et bleu.
 * La liste HTML [data-ribbon] reste la source (liens, images, accessibilité) et sert de repli sans WebGL.
 */
const VERT = `
attribute vec2 a;
uniform float uU0, uW, uH, uR, uD, uF, uAspect, uBend;
varying vec2 vUv;
varying float vShade;
void main(){
  float u = uU0 + a.x * uW;
  float R = uR / max(uBend, 0.0001);
  float th = u / R;
  float x = R * sin(th);
  float z = -uD + R * (1.0 - cos(th));
  float y = (a.y - 0.5) * uH;
  vUv = a;
  vShade = cos(th);
  gl_Position = vec4(x * uF / uAspect, y * uF, 0.0, -z);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
varying float vShade;
uniform sampler2D uTex;
uniform vec4 uCrop;
uniform float uVel, uAlpha, uHover, uReady;
uniform vec3 uBg, uAccent;
void main(){
  vec2 uv = vUv * uCrop.xy + uCrop.zw;
  // flou de mouvement horizontal, en niveaux de gris
  float s = clamp(uVel, -1.0, 1.0) * 0.03;
  vec3 c = vec3(0.0);
  for (int i = 0; i < 7; i++) {
    float k = float(i) / 6.0 - 0.5;
    c += texture2D(uTex, uv + vec2(s * k, 0.0)).rgb;
  }
  c /= 7.0;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  // au survol : l'image quitte le noir et blanc pour un bichromie bleu Klein
  vec3 mono = vec3(lum);
  vec3 duo = mix(uAccent * 0.6, vec3(1.0), lum);
  c = mix(mono, duo, uHover);
  c = mix(uBg, c, uReady);
  gl_FragColor = vec4(c, uAlpha);
}`;

interface Panel { img: HTMLImageElement; tex: WebGLTexture | null; ready: number; aspect: number; link: HTMLAnchorElement }

export function initRibbon(canvas: HTMLCanvasElement, list: HTMLElement, opts: { reduced: boolean }) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
  if (!gl) return false;
  // Sans GPU (rendu logiciel) : le carrousel HTML prend le relais.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer) && !location.search.includes('glshot')) return false;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  } catch (e) {
    console.warn('[moyo] ribbon', e);
    return false;
  }
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // grille fine en x pour que la courbure soit lisse
  const SEG = 48;
  const verts: number[] = [];
  for (let i = 0; i < SEG; i++) {
    const x0 = i / SEG, x1 = (i + 1) / SEG;
    verts.push(x0, 0, x1, 0, x0, 1, x0, 1, x1, 0, x1, 1);
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uU0', 'uW', 'uH', 'uR', 'uD', 'uF', 'uAspect', 'uBend', 'uTex', 'uCrop', 'uVel', 'uAlpha', 'uHover', 'uReady', 'uBg', 'uAccent']) U[n] = gl.getUniformLocation(prog, n);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('a'));
  const panels: Panel[] = links.map((link) => {
    const src = link.querySelector('img')!;
    const img = new Image();
    const p: Panel = { img, tex: null, ready: 0, aspect: 1.6, link };
    img.decoding = 'async';
    img.onload = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      p.tex = t;
      p.aspect = img.naturalWidth / img.naturalHeight;
    };
    img.src = src.currentSrc || src.src;
    return p;
  });
  const N = panels.length;

  // géométrie (unités monde)
  const D = 3.2, R = 1.05, GAP = 0.045, PANEL_ASPECT = 1.6;
  let F = 3.4, H = 0.8, W = H * PANEL_ASPECT, STEP = W + GAP, L = N * STEP, aspect = 1;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = w / h;
    // en portrait, un projet occupe ~78 % de la largeur
    H = aspect < 1 ? Math.min(0.8, (aspect * 1.5 * D) / (PANEL_ASPECT * F)) : 0.74;
    W = H * PANEL_ASPECT;
    STEP = W + GAP;
    L = N * STEP;
    // demi-hauteur de la bande au centre, en pixels : sert à placer les légendes
    canvas.parentElement?.style.setProperty('--band', `${(H / 2) * (F / D) * (h / 2)}px`);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // projection d'un angle vers l'écran (NDC x), pour retrouver le projet sous le pointeur
  const project = (th: number, R_: number) => {
    const x = R_ * Math.sin(th), z = -D + R_ * (1 - Math.cos(th));
    return { x: (x * F) / -z / aspect, k: F / -z };
  };
  const pick = (ndcX: number, ndcY: number) => {
    const R_ = R / Math.max(bend, 1e-4);
    let lo = -Math.PI / 2, hi = Math.PI / 2;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (project(mid, R_).x < ndcX) lo = mid; else hi = mid;
    }
    const th = (lo + hi) / 2;
    const { k } = project(th, R_);
    if (Math.abs(ndcY) > (H / 2) * k) return -1;
    const u = th * R_ + scroll;
    const local = ((u % L) + L) % L;
    const idx = Math.floor(local / STEP);
    return local - idx * STEP <= W ? idx % N : -1;
  };

  // état
  let target = W / 2, scroll = opts.reduced ? target : target - L * 0.35, prev = scroll, vel = 0;
  let bend = opts.reduced ? 1 : 0;
  const start = performance.now();
  let hover = -1, dragging = false, downX = 0, lastX = 0, moved = 0;
  let idle = 0;
  const caption = document.querySelector<HTMLElement>('[data-caption-title]');
  const captionMeta = document.querySelector<HTMLElement>('[data-caption-meta]');
  const cursor = document.querySelector<HTMLElement>('.cursor');
  const cursorLabel = cursor?.querySelector<HTMLElement>('.cursor__label');
  const viewLabel = list.dataset.view || '';
  let shownIdx = -1;

  const hexColor = (name: string) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  let bg = hexColor('--bg');
  let accent = hexColor('--accent');
  new MutationObserver(() => { bg = hexColor('--bg'); accent = hexColor('--accent'); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // entrées
  const nudge = () => (idle = 0);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    target += (e.deltaY + e.deltaX) * 0.0022;
    nudge();
  }, { passive: false });
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; downX = lastX = e.clientX; moved = 0;
    canvas.setPointerCapture(e.pointerId);
    nudge();
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved = Math.max(moved, Math.abs(e.clientX - downX));
      target -= (dx / r.width) * 3.2;
    }
    hover = pick(nx, ny);
    canvas.style.cursor = hover >= 0 ? 'pointer' : dragging ? 'grabbing' : 'grab';
    if (cursor && cursorLabel) {
      cursor.classList.toggle('is-label', hover >= 0);
      cursorLabel.textContent = hover >= 0 ? viewLabel : '';
    }
    caption?.closest('.stage')?.classList.toggle('is-hovering', hover >= 0);
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', (e) => {
    up();
    if (moved < 6 && hover >= 0) panels[hover].link.click();
    void e;
  });
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => {
    hover = -1;
    cursor?.classList.remove('is-label');
    caption?.closest('.stage')?.classList.remove('is-hovering');
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { target = (Math.round(target / STEP) + 1) * STEP; nudge(); }
    if (e.key === 'ArrowLeft') { target = (Math.round(target / STEP) - 1) * STEP; nudge(); }
  });
  // la liste reste navigable au clavier : le focus amène le projet au centre
  links.forEach((a, i) => a.addEventListener('focus', () => {
    const base = Math.round(target / L) * L;
    target = base + i * STEP + W / 2;
    nudge();
  }));

  const centerIndex = () => {
    const local = (((scroll) % L) + L) % L;
    return Math.round((local - W / 2) / STEP + N) % N;
  };

  function frame(now: number) {
    const t = (now - start) / 1000;
    if (!opts.reduced) {
      const k = Math.min(1, t / 2.2);
      bend = 1 - Math.pow(1 - k, 4);
      idle += 1 / 60;
      if (!dragging && idle > 4) target += 0.0012; // dérive lente au repos
    }
    scroll += (target - scroll) * (opts.reduced ? 1 : 0.075);
    const v = scroll - prev;
    prev = scroll;
    vel += ((opts.reduced ? 0 : v * 9) - vel) * 0.2;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uW, W); gl.uniform1f(U.uH, H); gl.uniform1f(U.uR, R); gl.uniform1f(U.uD, D);
    gl.uniform1f(U.uF, F); gl.uniform1f(U.uAspect, aspect); gl.uniform1f(U.uBend, bend);
    gl.uniform1f(U.uVel, vel); gl.uniform3fv(U.uBg, bg); gl.uniform3fv(U.uAccent, accent);
    const R_ = R / Math.max(bend, 1e-4);
    const maxU = Math.min(R_ * 1.5, L / 2);
    for (let i = 0; i < N; i++) {
      const p = panels[i];
      let u0 = i * STEP - scroll;
      u0 = ((u0 + L / 2) % L + L) % L - L / 2;
      if (u0 + W < -maxU || u0 > maxU) continue;
      p.ready += ((p.tex ? 1 : 0) - p.ready) * 0.08;
      if (p.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, p.tex); }
      gl.uniform1i(U.uTex, 0);
      // recadrage « cover »
      const pa = W / H, ia = p.aspect;
      if (ia > pa) gl.uniform4f(U.uCrop, pa / ia, 1, (1 - pa / ia) / 2, 0);
      else gl.uniform4f(U.uCrop, 1, ia / pa, 0, (1 - ia / pa) / 2);
      gl.uniform1f(U.uU0, u0);
      gl.uniform1f(U.uAlpha, Math.min(1, bend * 1.5 + (opts.reduced ? 1 : 0)));
      gl.uniform1f(U.uHover, hover === i ? 1 : 0);
      gl.uniform1f(U.uReady, p.ready);
      gl.drawArrays(gl.TRIANGLES, 0, SEG * 6);
    }
    const ci = centerIndex();
    if (ci !== shownIdx && caption) {
      shownIdx = ci;
      caption.textContent = links[ci].dataset.title || '';
      if (captionMeta) captionMeta.textContent = links[ci].dataset.meta || '';
    }
    if (!document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);
  document.documentElement.classList.add('has-ribbon');
  return true;
}
