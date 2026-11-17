/**
 * Scène WebGL du hero — une seule passe plein écran, sans librairie.
 * Mode selon la piste de DA :
 *   0 · Nocturne : lumières de port de nuit, mise au point cinéma (rack focus)
 *   1 · Atelier  : lumière de persiennes sur un mur de chaux
 *   2 · Argent   : métal liquide
 */
const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform vec2 uMouse;
uniform float uTime, uFocus, uMode, uLight;
uniform vec3 uBg, uA, uB, uC;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash2(vec2 p){ float n = hash(p); return vec2(n, hash(p + n)); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }

/* ---------- 0 · lumières de port ---------- */
vec3 bokehLayer(vec2 uv, float scale, float depth, float t, float extraBlur){
  vec3 col = vec3(0.0);
  vec2 p = uv * scale + vec2(t * 0.012 * (0.4 + depth), 0.0) + (uMouse - 0.5) * depth * 0.6;
  vec2 id = floor(p), f = fract(p);
  float baseBlur = 0.04 + 0.5 * abs(depth - 0.45);
  float blur = clamp(mix(0.9, baseBlur, uFocus) + extraBlur, 0.02, 1.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 o = vec2(float(x), float(y));
    vec2 cid = id + o;
    vec2 r = hash2(cid + depth * 17.0);
    if (r.x < 0.55) continue;
    vec2 c = o + 0.5 + 0.35 * sin(t * 0.09 * (r + 0.3) + r * 6.2831) - f;
    float rad = mix(0.07, 0.24, r.y * r.y) * (1.0 + blur * 0.9);
    float d = length(c);
    float edge = rad * blur * 0.9 + 0.012;
    float disc = 1.0 - smoothstep(rad - edge, rad + edge, d);
    float rim = exp(-pow((d - rad * 0.92) / (edge * 0.6 + 0.01), 2.0)) * 0.35 * (1.0 - blur);
    float tw = 0.75 + 0.25 * sin(t * (0.6 + r.y) + r.x * 40.0);
    float k = hash(cid + 3.1);
    vec3 lc = k < 0.55 ? uA : (k < 0.85 ? uB : uC);
    col += lc * (disc * 0.7 + rim) * tw * (0.35 + 0.65 * r.x) / (1.0 + blur * 2.6);
  }
  return col;
}

vec3 harbour(vec2 uv, float t, float extraBlur){
  float horizon = 0.5;
  float band = exp(-pow((uv.y - horizon - 0.035) / 0.12, 2.0)) * smoothstep(horizon - 0.01, horizon + 0.02, uv.y);
  vec3 l = bokehLayer(uv, 7.0, 0.15, t, extraBlur) * 0.8
         + bokehLayer(uv + 3.7, 11.0, 0.45, t, extraBlur)
         + bokehLayer(uv + 9.1, 18.0, 0.8, t, extraBlur) * 0.7;
  return l * band;
}

vec3 scene0(vec2 uv, float aspect, float t){
  vec2 a = vec2(uv.x * aspect, uv.y);
  float horizon = 0.5;
  vec3 bg = uBg;
  float glow = exp(-pow((uv.y - horizon) / 0.22, 2.0));
  bg += (uB * 0.06 + uA * 0.03) * glow * (1.0 - uLight);
  vec3 lights;
  lights = harbour(a, t, 0.0);
  if (uv.y < horizon + 0.02) {
    float dy = max(horizon - uv.y, 0.0);
    // reflets étirés verticalement, légèrement troublés
    vec2 m = vec2(a.x + sin(uv.y * 60.0 + t * 0.5) * 0.0025 * (1.0 + dy * 10.0), horizon + 0.03 + dy * 0.22);
    lights += harbour(m, t, 0.18) * 0.38 * smoothstep(0.45, 0.0, dy) * smoothstep(horizon + 0.02, horizon - 0.01, uv.y);
  }
  if (uLight > 0.5) return bg * (1.0 - clamp(lights, 0.0, 1.0) * 0.28) + lights * 0.04;
  return bg + lights;
}

/* ---------- 1 · persiennes ---------- */
vec3 scene1(vec2 q, float t){
  float ang = -0.52;
  vec2 dir = vec2(cos(ang), sin(ang));
  float u = dot(q, dir) * mix(16.0, 26.0, q.x + 0.5) + t * 0.025;
  float s = 0.5 + 0.5 * sin(u * 6.2831);
  float soft = mix(0.5, 0.05, uFocus);
  float stripes = smoothstep(0.42 - soft, 0.42 + soft, s);
  vec2 c = q - vec2(0.32 + 0.04 * sin(t * 0.04), 0.06 + 0.02 * cos(t * 0.03));
  c.x += c.y * 0.45; // projection oblique de la fenêtre
  vec2 w = c / vec2(0.42, 0.34);
  float edgeSoft = mix(0.6, 0.06, uFocus);
  float win = 1.0 - smoothstep(1.0 - edgeSoft, 1.0 + edgeSoft, max(abs(w.x), abs(w.y)));
  float leaves = smoothstep(0.48, 0.62, fbm(q * 3.2 + vec2(t * 0.03, t * 0.012) + (uMouse - 0.5) * 0.3));
  float light = stripes * win * (1.0 - leaves * 0.55);
  vec3 wall = uBg * (0.93 + 0.07 * fbm(q * 9.0));
  wall *= 1.0 - 0.06 * (1.0 - win);
  vec3 col = mix(wall, uA, light * (uLight > 0.5 ? 0.85 : 0.32));
  col = mix(col, uB, smoothstep(0.985, 1.0, s) * win * 0.05);
  return col;
}

/* ---------- 2 · métal liquide ---------- */
vec2 warp(vec2 p, float t){ return 1.4 * vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t)); }
vec3 scene2(vec2 q, float t){
  vec2 p = q * 1.05 + (uMouse - 0.5) * 0.3;
  float tt = t * 0.035;
  float e = 0.012;
  vec2 w = warp(p, tt);
  float h = fbm(p + w);
  float hx = fbm(p + w + vec2(e, 0.0)) - h;
  float hy = fbm(p + w + vec2(0.0, e)) - h;
  vec3 n = normalize(vec3(-hx / e, -hy / e, mix(1.6, 2.6, 1.0 - uFocus)));
  float bands = 0.5 + 0.5 * sin(n.x * 2.6 + n.y * 1.8 + h * 4.5);
  vec3 env = mix(uB * 0.6, uA * 0.95, smoothstep(0.0, 1.0, bands));
  env += pow(max(n.y, 0.0), 8.0) * uA * 0.5;
  env = mix(env, uC, 0.06 * smoothstep(0.6, 1.0, bands));
  float r = length(q * vec2(0.85, 1.25)) + (h - 0.5) * 0.25;
  float mask = smoothstep(0.62, 0.48, r);
  float halo = smoothstep(0.9, 0.45, r) * 0.08;
  return mix(uBg + uA * halo, env, mask * (0.6 + 0.4 * uFocus));
}

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 q = (vUv - 0.5) * vec2(aspect, 1.0);
  vec3 col;
  if (uMode < 0.5) col = scene0(vUv, aspect, uTime);
  else if (uMode < 1.5) col = scene1(q, uTime);
  else col = scene2(q, uTime);
  float vig = 1.0 - 0.35 * dot(q * 0.9, q * 0.9);
  col *= mix(vig, 1.0, uLight * 0.7);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}`;

const MODES: Record<string, number> = { nocturne: 0, atelier: 1, argent: 2 };

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface HeroScene {
  setFocus(f: number): void;
  refresh(): void;
}

export function initHero(canvas: HTMLCanvasElement, opts: { reduced: boolean; baseFocus: number }): HeroScene | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: location.search.includes('glshot') });
  if (!gl) return null;
  // Pas de GPU (rendu logiciel) : on garde l'affiche statique, plus sobre pour la machine.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer) && !location.search.includes('glshot')) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  } catch (e) {
    console.warn('[moyo] hero shader', e);
    return null;
  }
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), mouse: U('uMouse'), time: U('uTime'), focus: U('uFocus'), mode: U('uMode'), light: U('uLight'), bg: U('uBg'), a: U('uA'), b: U('uB'), c: U('uC') };

  const root = document.documentElement;
  const refresh = () => {
    const cs = getComputedStyle(root);
    gl.uniform3fv(u.bg, hexToRgb(cs.getPropertyValue('--gl-bg')));
    gl.uniform3fv(u.a, hexToRgb(cs.getPropertyValue('--gl-a')));
    gl.uniform3fv(u.b, hexToRgb(cs.getPropertyValue('--gl-b')));
    gl.uniform3fv(u.c, hexToRgb(cs.getPropertyValue('--gl-c')));
    gl.uniform1f(u.mode, MODES[root.dataset.da || 'nocturne'] ?? 0);
    gl.uniform1f(u.light, root.dataset.theme === 'light' ? 1 : 0);
    if (opts.reduced) draw(performance.now());
  };

  let quality = 0.6;
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
    }
  };

  let mouse = [0.5, 0.5], target = [0.5, 0.5];
  let introFocus = opts.reduced ? 1 : 0;
  let scrollFocus = 1;
  const start = performance.now();
  const timeOffset = Math.random() * 100;
  if (!opts.reduced) {
    window.addEventListener('pointermove', (e) => { target = [e.clientX / innerWidth, 1 - e.clientY / innerHeight]; }, { passive: true });
  }

  function draw(now: number) {
    resize();
    const elapsed = (now - start) / 1000;
    if (!opts.reduced) introFocus = Math.min(1, 1 - Math.pow(1 - Math.min(elapsed / 3.6, 1), 3));
    mouse = [mouse[0] + (target[0] - mouse[0]) * 0.04, mouse[1] + (target[1] - mouse[1]) * 0.04];
    gl.uniform1f(u.time, opts.reduced ? 12 + timeOffset : elapsed + timeOffset);
    gl.uniform1f(u.focus, introFocus * scrollFocus * opts.baseFocus);
    gl.uniform2f(u.mouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let visible = true, raf = 0, frames = 0, last = 0, slow = 0;
  const loop = (now: number) => {
    draw(now);
    // Garde-fou : si les images coûtent trop cher, on baisse la résolution, puis on fige.
    if (last && frames < 90) {
      if (now - last > 34) slow++;
      if (frames === 30 && slow > 15) { quality = 0.35; slow = 0; }
      if (frames === 89 && slow > 40) { pause(); return; }
    }
    last = now; frames++;
    raf = requestAnimationFrame(loop);
  };
  const play = () => { if (!raf && visible && !document.hidden && !opts.reduced) raf = requestAnimationFrame(loop); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  window.addEventListener('resize', () => opts.reduced && draw(performance.now()));

  refresh();
  draw(performance.now());
  canvas.parentElement?.classList.add('is-live');
  play();

  return {
    setFocus(f: number) { scrollFocus = f; },
    refresh,
  };
}
