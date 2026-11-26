/* The arrival. The point that has just written the sentence leaves its place, grows, and opens: it is an eye of glass, and what it sees is the work
   of the studio (the covers of the projects put forward in the admin, in black and white). The letters it passes over turn white and bend in its edge.
   Scrolling, the eye takes the whole screen and the sentence is read in it: images, sites, films, each one a disc that opens from its own word.
   At the end the eye closes, shrinks, and is again the final point of the sentence: the page goes on as before.
   On the first screen it blinks now and then and looks at something else; pointing at a word of the sentence shows it.
   Everything follows the scroll, both ways. Nothing is drawn while it is off screen. With reduced motion: the eye, still, beside the sentence.
   Without WebGL or without a cover: the sentence and its point. */
(() => {
'use strict';
const hero = document.getElementById('top'), box = hero && hero.querySelector('.hero-s'), cv = box && box.querySelector('.hero-eye');
if (!cv) return;
const title = hero.querySelector('h1'), topEl = hero.querySelector('.hero-top'), mark = title.querySelector('.dot b'), words = [...title.querySelectorAll('[data-w]')], root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = matchMedia('(max-width:820px)');
const srcs = [...new Set([...document.querySelectorAll('#projects .plate img')].map(i => i.getAttribute('src')))].slice(0, 4);
let gl = null; try { gl = srcs.length && cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }); } catch (_) {}
if (!gl) return;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t;
const io3 = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out3 = t => 1 - Math.pow(1 - t, 3), smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

/* ---------- the drawing ---------- */
const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uS; uniform float uD,uT,uGo;      // the screen (css px), pixels per css px, time, scroll (in screens)
uniform vec3 uL; uniform float uB,uP;          // the lens: x, y, r; the width of its edge; how far the edge bends
uniform float uOpen,uBack,uGlow;               // the lids; 1: a picture outside too; the light in the glass
uniform ivec2 uM; uniform vec4 uF0,uF1;        // what is seen outside and inside, and the frame of each: centre, size
uniform sampler2D uX; uniform vec4 uXR,uW;     // the letters: their mask, its place, the strength of each group of words
uniform sampler2D uI0,uI1,uI2,uI3; uniform vec4 uA; uniform float uN,uSN;
const vec3 KL=vec3(0.,.1843,.6549),INK=vec3(.035,.035,.04),PAP=vec3(.98,.98,.973);
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
float h2(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ar(int i){return i==0?uA.x:i==1?uA.y:i==2?uA.z:uA.w;}
float px(int i,vec2 uv,vec2 dx,vec2 dy){uv=clamp(uv,.001,.999);vec3 c=i==0?textureGrad(uI0,uv,dx,dy).rgb:i==1?textureGrad(uI1,uv,dx,dy).rgb:i==2?textureGrad(uI2,uv,dx,dy).rgb:textureGrad(uI3,uv,dx,dy).rgb;return dot(c,vec3(.299,.587,.114));}
float cover(int i,vec2 p,vec4 f,float zoom,vec2 look){ // a picture that covers a frame, looking at a point of it
  float a=ar(i),s=max(f.z/a,f.w)*zoom;vec2 d=vec2(s*a,s),slack=max(vec2(0.),1.-f.zw/d),uv=.5+(p-f.xy)/d+(look-.5)*slack,g=1./(d*uD);
  return px(i,uv,vec2(g.x,0.),vec2(0.,g.y));}
float image(vec2 p,vec4 f){float t=uT*.09;return cover(0,p,f,1.1+.05*sin(t*1.3),vec2(.5+.4*sin(t),.42+.22*cos(t*.7)));} // one image, looked at slowly
float site(vec2 p){ // columns, on the axes, that answer the scroll
  float n=uS.x>820.?4.:2.,gap=max(6.,uS.x*.006),cw=(uS.x+gap)/n,w=cw-gap,ch=w*1.25+gap,ci=floor(p.x/cw),x=p.x-ci*cw,dir=mod(ci,2.)<.5?1.:-1.;
  float y=p.y+dir*(uT*24.+uGo*uS.y*.6)+ci*ch*.37,ri=floor(y/ch);y-=ri*ch;
  if(x>w||y>ch-gap)return .015;
  int i=int(mod(ri+ci*3.+400.,uN));float a=ar(i),h=ch-gap,s=max(w/a,h)*1.04;vec2 d=vec2(s*a,s),uv=.5+vec2(x-w*.5,y-h*.5)/d,g=1./(d*uD);
  return px(i,uv,vec2(g.x,0.),vec2(0.,g.y))*.9;}
float film(vec2 p,vec4 f){ // shots, a camera that moves, the gate of a projector
  float t=uT/1.6,k=floor(t),u=fract(t),r=h1(k),z=r<.5?mix(1.12,1.32,u):mix(1.38,1.14,u),j=floor(uT*12.);p+=vec2(h1(j)-.5,h1(j+7.)-.5)*1.4;
  vec2 a=vec2(cos(r*40.),sin(r*40.));
  return cover(int(mod(k+2.,uN)),p,f,z,mix(vec2(.5)+.42*a,vec2(.5)-.38*a,u))*(1.-.05*h1(j+3.));}
float look(int m,vec2 p,vec4 f){return m==0?image(p,f):m==1?site(p):film(p,f);}
vec3 tone(float l,vec2 p){l=mix(l,smoothstep(0.,1.,l),.4)+(h2(p*uD+fract(uT*.7)*61.)-.5)*.05;return mix(INK,PAP,clamp(l,0.,1.)*.93);}
float shade(vec2 p){return 1.-.6*smoothstep(.2,.9,p.y/uS.y);}
float letters(vec2 p){vec2 uv=(p-uXR.xy)/uXR.zw;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return 0.;return clamp(dot(texture(uX,uv),uW),0.,1.);}
float snell(float t){float u=1.-t,u4=u*u*u*u,a=atan(u*u*u/pow(1.-u4+.12,.75)),r=asin(sin(a)/1.5);return tan(a-r)*pow(1.-u4+.35,.25);}
void main(){
  vec2 p=vec2(gl_FragCoord.x,uS.y*uD-gl_FragCoord.y)/uD,q=p-uL.xy;float l=length(q),d=uL.z-l;vec2 n=q/max(l,.001);
  float inside=clamp(d*uD+.5,0.,1.);vec4 c=vec4(0.);
  if(inside<1.){
    if(uBack>.5){vec3 v=tone(look(uM.x,p,uF0),p)*shade(p);c=vec4(mix(v,PAP,letters(p)),1.);}
    else{float g=exp(-pow(max(0.,length(q-uL.z*vec2(.1,.14))-uL.z*.9)/(uL.z*.13),2.))*uGlow*.1;c=vec4(KL,1.)*g;} // its light, on the paper
  }
  if(inside>0.){
    float t=clamp(d/uB,0.,1.),m=t<1.?snell(t)/uSN:0.;vec2 r=p-n*m*uP; // the edge: what is under it comes from further in
    vec3 v=tone(look(uM.y,r,uF1),r)*shade(p);
    vec2 e=q/uL.z;float s=sqrt(max(0.,1.-e.x*e.x)),up=-mix(-.17,1.04,uOpen)*s,lo=mix(.11,1.04,uOpen)*s,w=1.5/(uL.z*uD); // the lids
    float vis=smoothstep(-w,w,e.y-up)*smoothstep(-w,w,lo-e.y);
    v*=mix(1.,.5+.5*smoothstep(0.,.28,e.y-up),1.-smoothstep(.75,1.,uOpen));
    v=mix(KL,v,vis);
    float dn=max(0.,dot(n,normalize(vec2(.45,.89)))),un=max(0.,dot(n,normalize(vec2(-.6,-.8))));
    float g=pow(1.-t,2.6)*(.08+.92*pow(dn,1.8))*uGlow*vis;
    v=1.-(1.-v)*(1.-KL*1.1*g);
    v=mix(v,PAP,letters(r));
    v=mix(v,PAP,smoothstep(2.2,0.,abs(d-1.2))*(.06+.6*pow(un,3.))*uGlow);
    c=mix(c,vec4(v,1.),inside);
  }
  o=c;
}`;
const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : (console.error(gl.getShaderInfoLog(s)), null); };
const vs = mk(gl.VERTEX_SHADER, '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'), fs = mk(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.bindAttribLocation(pr, 0, 'a'); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const U = {}; for (let i = 0, k = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS); i < k; i++) { const a = gl.getActiveUniform(pr, i).name; U[a] = gl.getUniformLocation(pr, a); }
const tex = (unit, mip) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 12, 255])); };
{ const u = 1, a = Math.atan(1 / Math.pow(.12, .75)), r = Math.asin(Math.sin(a) / 1.5); gl.uniform1f(U.uSN, Math.tan(a - r) * Math.pow(.35, .25) * u); } // the strongest bend, at the very edge
tex(0); gl.uniform1i(U.uX, 0); [0, 1, 2, 3].forEach(i => { tex(i + 1, true); gl.uniform1i(U['uI' + i], i + 1); });
/* the covers, fetched once the first screen is there; the eye opens on the first one */
const AR = [1, 1, 1, 1]; let count = 0, seen = false;
const MAX = small.matches ? 1400 : 2200; // a picture larger than that is made smaller first: the memory of a phone is counted
const fetchAll = () => srcs.forEach((s, i) => { const im = new Image(); im.decoding = 'async'; im.onload = () => {
  const w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, MAX / Math.max(w, h)); let src = im;
  if (k < 1) { src = document.createElement('canvas'); src.width = Math.round(w * k); src.height = Math.round(h * k); src.getContext('2d').drawImage(im, 0, 0, src.width, src.height); }
  gl.activeTexture(gl.TEXTURE1 + i); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D); AR[i] = w / h; count = Math.max(count, i + 1); if (!i) seen = true; kick(); }; im.src = s; });

/* ---------- the places (css px, in the box that stays on screen) ---------- */
let Q = 1, W = 0, H = 0, D = 1, E = { x: 0, y: 0, r: 1 }, M = { x: 0, y: 0, r: 1 }, XR = [0, 0, 1, 1], WC = [], L = 1, sized = false;
function size() {
  const b = box.getBoundingClientRect(); if (!b.width || !title.offsetWidth) return; W = b.width; H = b.height;
  const VH = Math.min(H, innerHeight), edge = parseFloat(getComputedStyle(box).paddingLeft) || 0;
  D = Math.min(2.5, devicePixelRatio || 1, Math.sqrt(8.4e6 / (W * H))) * Q; // up to a 4K screen, sharp
  cv.width = Math.round(W * D); cv.height = Math.round(H * D); gl.viewport(0, 0, cv.width, cv.height);
  const at = e => { const r = e.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2, r: r.width / 2, t: r.top - b.top, b: r.bottom - b.top }; };
  M = at(mark); WC = words.map(at); L = Math.max(1, hero.offsetHeight - H);
  const h = at(title), top = topEl.getBoundingClientRect().bottom - b.top;
  if (small.matches) { const lh = parseFloat(getComputedStyle(title).fontSize), low = h.t + lh * 1.5, r = Math.max(40, Math.min(W * .47, (low - top - 40) / 2)); E = { x: W - edge - r, y: low - r, r }; } // above the sentence, over its first lines
  else { const r = Math.min(VH * .41, W * .27); E = { x: W - edge - r - Math.max(0, 36 - edge * .5), y: VH * .46, r }; }
  ink(b); sized = true; if (raf) cancelAnimationFrame(raf); raf = 0; drawnAt = 0; frame(performance.now()); // drawn at once: a canvas that changes size is blank until then
}
/* the letters, drawn where the page puts them; the words that light up apart (images, sites, films) each have their channel */
function ink(b) {
  const t = title.getBoundingClientRect(), C = getComputedStyle(title), f = parseFloat(C.fontSize), pad = f * .3;
  const x0 = Math.floor((t.left - b.left - pad) * D) / D, y0 = Math.floor((t.top - b.top - pad) * D) / D, w = Math.ceil((t.width + pad * 2) * D), h = Math.ceil((t.height + pad * 2) * D);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true });
  g.font = `${C.fontWeight} 100px ${C.fontFamily}`; const A = g.measureText('M').fontBoundingBoxAscent / 100;
  const buf = new Uint8Array(w * h * 4), rg = document.createRange();
  for (let k = 0; k < 4; k++) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(D, 0, 0, D, -x0 * D, -y0 * D); g.font = `${C.fontWeight} ${f}px ${C.fontFamily}`; g.fillStyle = '#fff';
    const tw = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    for (let nd; (nd = tw.nextNode());) { const gw = nd.parentElement.dataset.w; if ((gw == null ? 3 : +gw) !== k) continue;
      for (let i = 0; i < nd.length; i++) { if (/[\s\u2060]/.test(nd.data[i])) continue; rg.setStart(nd, i); rg.setEnd(nd, i + 1); const r = rg.getClientRects()[0]; if (r) g.fillText(nd.data[i], r.left - b.left, r.top - b.top + A * f); } }
    const d = g.getImageData(0, 0, w, h).data; for (let i = k, j = 3; j < d.length; i += 4, j += 4) buf[i] = d[j];
  }
  gl.activeTexture(gl.TEXTURE0); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  XR = [x0, y0, w / D, h / D];
}

/* ---------- the story, in screens of scroll: the eye takes the screen, two discs open from their words, the eye closes into the point ---------- */
const S = { g0: [0, .58], g1: [.72, 1.2], g2: [1.34, 1.82], z: [1.98, 2.6] }, END = 2.6; // as long as .hero.live in the page: 2.6 screens
const part = (s, [a, b]) => clamp((s - a) / (b - a));
const scroll = () => reduce ? 0 : scrollY / L * END;
function story(s, a) {
  const full = Math.hypot(W, H) / 2 + Math.min(W, H) * .2, k0 = io3(part(s, S.g0)), k1 = io3(part(s, S.g1)), k2 = io3(part(s, S.g2)), kz = part(s, S.z);
  const grow = (x, y, r, k) => ({ x: mix(x, W / 2, k), y: mix(y, H / 2, k), r: r + (full - r) * k });
  const o = { back: 0, m0: 0, m1: -1, f1: [W / 2, H / 2, W, H], lids: null, glow: 1, scene: -1, top: 1 };
  if (kz > 0) { const k = io3(kz); o.lens = { x: mix(W / 2, M.x, smooth(k * 1.08)), y: mix(H / 2, M.y, smooth(k * 1.08)), r: Math.exp(mix(Math.log(full), Math.log(M.r), k)) }; o.m1 = 2; o.lids = 1 - smooth(kz * 1.6); o.scene = 3; o.top = smooth(kz * 2.4 - 1.4); }
  else if (k2 > 0) { o.lens = grow(WC[2].x, WC[2].y, 0, k2); o.m0 = 1; o.m1 = 2; o.back = 1; o.scene = k2 > .5 ? 2 : 1; o.top = 0; }
  else if (s >= S.g0[1]) { o.lens = { x: W / 2, y: H / 2, r: full }; o.m1 = 0; if (k1 > 0) { o.lens = grow(WC[1].x, WC[1].y, 0, k1); o.m1 = 1; o.back = 1; } o.scene = k1 > .5 ? 1 : 0; o.top = 0; }
  else { // the leap from the point, then the first growth
    const e = io3(a), r = Math.exp(mix(Math.log(Math.max(.5, M.r)), Math.log(E.r), e)), br = reduce ? 0 : Math.sin(performance.now() / 1900) * E.r * .006 * e;
    o.lens = grow(mix(M.x, E.x, e), mix(M.y, E.y, e) - Math.sin(e * Math.PI) * E.r * .22, r + br, k0); o.f1 = [mix(E.x, W / 2, k0), mix(E.y, H / 2, k0), mix(E.r * 2.1, W, k0), mix(E.r * 2.1, H, k0)];
    o.glow = smooth((o.lens.r - 24) / 140); o.scene = k0 > .5 ? 0 : -1; o.top = 1 - clamp(k0 * 3);
  }
  return o;
}

/* ---------- time: the leap, the waking, the blinks ---------- */
let drawnAt = 0, slow = 0, a = reduce ? 1 : 0, open = reduce ? 1 : 0, idle = 0, blink = null, born = 0, calm = 0, last = 0, raf = 0, on = true, ready = false, cur = null, sent = '';
const lit = [1, 1, 1, 1], t0 = performance.now();
function lids(now, s) {
  if (a < 1 || !seen) return 0;
  if (!blink && open < 1) { if (s > .02) { open = 1; calm = now; return 1; } blink = { t: now, wake: true }; } // arriving further down: it is already open
  if (!blink && open >= 1 && !reduce && s < .01 && now - calm > 5200) blink = { t: now, to: (idle + 1) % 3 };
  if (!blink && s > .02 && idle) { if (s < .12) blink = { t: now, to: 0, quick: true }; else idle = 0; } // the story starts with the images
  if (!blink) return 1;
  const u = now - blink.t;
  if (blink.wake) { if (u > 1700 || s > .06) { open = 1; blink = null; calm = now; return 1; } return Math.max(smooth(s / .06), u < 420 ? .26 * out3(u / 420) : u < 620 ? .26 * (1 - smooth((u - 420) / 200)) : out3(clamp((u - 620) / 1080))); } // scrolling opens it
  const sh = blink.quick ? 150 : 230, gap = 50, op = blink.quick ? 280 : 430;
  if (u > sh && blink.to != null) { idle = blink.to; blink.to = null; }
  if (u > sh + gap + op) { blink = null; calm = now; return 1; }
  return u < sh ? 1 - smooth(u / sh) : smooth((u - sh - gap) / op);
}
function frame(now) {
  raf = 0; if (!sized) return; const dt = Math.min(.05, (now - (last || now)) / 1000) || .016; last = now;
  const s = scroll();
  if (born && a < 1) a = Math.min(1, Math.max(a + (s > .01 ? dt * 3 : 0), (now - born) / 1500));
  const o = story(s, a), op = o.lids ?? lids(now, s), lens = o.lens;
  for (let i = 0; i < 4; i++) lit[i] += ((o.scene < 0 || o.scene === 3 || o.scene === i ? 1 : .3) - lit[i]) * (1 - Math.exp(-dt * 6));
  const home = !ready || a <= 0 || s >= END, m1 = o.m1 < 0 ? idle : o.m1; // until the sentence is written, the point is the one of load.js
  /* at rest it is drawn 30 times a second, and only where the eye is; a machine that cannot keep up gets fewer pixels */
  const lazy = s < .005 && !blink && a >= 1 && !o.back, draw = home ? cv.style.visibility !== 'hidden' : !lazy || now - drawnAt > 31;
  if (draw) { gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  if (!lazy && !home && open >= 1 && now - calm > 300) { slow = slow * .96 + (dt > 1 / 38 ? .04 : 0); if (slow > .7 && Q > .5) { Q = Math.max(.5, Q * .8); slow = 0; size(); } }
  if (draw && !home) {
    drawnAt = now;
    if (!o.back) { const m = lens.r * 1.18 + 8, x0 = Math.max(0, Math.floor((lens.x - m) * D)), y0 = Math.max(0, Math.floor((H - lens.y - m) * D)), x1 = Math.min(cv.width, Math.ceil((lens.x + m) * D)), y1 = Math.min(cv.height, Math.ceil((H - lens.y + m) * D)); gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)); }
    const bev = Math.min(lens.r * .14, 110, Math.min(W, H) * .12);
    gl.uniform2f(U.uS, W, H); gl.uniform1f(U.uD, D); gl.uniform1f(U.uT, reduce ? 4 : (now - t0) / 1000); gl.uniform1f(U.uGo, s);
    gl.uniform3f(U.uL, lens.x, lens.y, lens.r); gl.uniform1f(U.uB, Math.max(1, bev)); gl.uniform1f(U.uP, bev * .34);
    gl.uniform1f(U.uOpen, op); gl.uniform1f(U.uBack, o.back); gl.uniform1f(U.uGlow, o.glow); gl.uniform2i(U.uM, o.m0, m1);
    gl.uniform4f(U.uF0, W / 2, H / 2, W, H); gl.uniform4f(U.uF1, ...o.f1); gl.uniform4f(U.uXR, ...XR); gl.uniform4f(U.uW, ...lit); gl.uniform4f(U.uA, ...AR); gl.uniform1f(U.uN, Math.max(1, count));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  if (!reduce) { if (ready) mark.style.visibility = home ? '' : 'hidden'; cv.style.visibility = home ? 'hidden' : ''; }
  hero.style.setProperty('--hk', (1 - o.top).toFixed(3)); topEl.style.visibility = o.top < .02 ? 'hidden' : ''; // what is not seen cannot be reached
  cur = home ? null : { x: lens.x, y: lens.y, r: lens.r, back: o.back };
  const k = cur ? [cur.x, cur.y, cur.r, cur.back].map(v => Math.round(v)).join() : ''; if (k !== sent) { sent = k; dispatchEvent(new Event('moyo:eye')); } // the way and the cursor read it
  if (!reduce && on && !home && !document.hidden || a < 1 && born || blink) kick();
}
function kick() { if (!raf && !dead) raf = requestAnimationFrame(frame); }
let dead = false; cv.addEventListener('webglcontextlost', () => { dead = true; cur = null; mark.style.visibility = ''; cv.style.visibility = 'hidden'; hero.style.setProperty('--hk', 0); topEl.style.visibility = ''; dispatchEvent(new Event('moyo:eye')); });
/* where the eye is on the screen, and what is dark there (the way, the cursor) */
window.moyoEye = () => { if (!cur) return null; const b = box.getBoundingClientRect(); return { x: b.left + cur.x, y: b.top + cur.y, r: cur.r, back: !!cur.back }; };

/* a click or a tap on the eye, at rest: it blinks and looks at something else */
box.addEventListener('click', e => { const q = window.moyoEye && moyoEye(); if (!q || q.back || open < 1 || scroll() > .01 || blink || e.target.closest('a,button')) return; if (Math.hypot(e.clientX - q.x, e.clientY - q.y) < q.r) { blink = { t: performance.now(), to: (idle + 1) % 3 }; kick(); } });
/* pointing at a word of the sentence: the eye looks at it */
words.forEach((w, i) => w.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && open >= 1 && scroll() < .01 && idle !== i) { blink = { t: performance.now(), to: i, quick: true }; kick(); } }));

new IntersectionObserver(es => { on = es[es.length - 1].isIntersecting; if (on) kick(); }).observe(box);
addEventListener('scroll', kick, { passive: true });
let rt = 0; const later = () => { clearTimeout(rt); rt = setTimeout(size, 90); };
addEventListener('resize', later); new ResizeObserver(later).observe(title); new MutationObserver(later).observe(title, { subtree: true, characterData: true, childList: true });
document.addEventListener('visibilitychange', kick);
if (!reduce) hero.classList.add('live');
document.fonts.ready.then(size);
(window.moyoReady || Promise.resolve()).then(() => setTimeout(fetchAll, 30));
(window.moyoDrawn || Promise.resolve()).then(() => { ready = true; size(); if (scroll() > .01) a = 1; setTimeout(() => { born = performance.now(); kick(); }, 520); });
size();
})();
