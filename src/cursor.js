/* The cursor is the dot, and like the pictures (divide.js) it divides. One part stays under the hand, exactly where the pointer is, always.
   The other goes to punctuate what is pointed at:
   - a word that can be clicked: it goes to sit at the end of it, as its final point,
   - an empty place (the choices of the form), the dot of a question: it goes into it.
   Over the way there is one dot, its own, which goes to the name that is pointed at: the cursor melts, and comes back as the hand leaves.
   Over a picture the dot opens and says what will happen; over a button, an icon or the point of a title (which can be picked up, play.js) it is a
   thin ring; over a text field it gives way to the caret of the system.
   It reads the colour that is really under it: blue on paper, paper on blue and on pictures, and it keeps a fine edge, so it is never lost.
   It lives in the top layer, so it is the same over the menu, the project sheet and the dialogs. Mouse, trackpad and pen only. Until it knows where the
   pointer is, the system cursor stays. */
(() => {
  /* focus ring for keyboard users only: never after a click (menu closing gives the focus back to its button) */
  const kb = document.documentElement, fs = document.createElement('style');
  fs.textContent = 'html:not(.kbd) :focus-visible{outline:none!important}*{-webkit-tap-highlight-color:transparent}';
  document.head.appendChild(fs);
  addEventListener('keydown', e => { if (/^(Tab|Arrow|Enter| )/.test(e.key) && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.key === 'Tab') kb.classList.add('kbd'); }, true);
  addEventListener('pointerdown', () => kb.classList.remove('kbd'), true);
})();
(() => {
  if (!matchMedia('(pointer: fine)').matches || !HTMLElement.prototype.showPopover) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement;
  const TEXT = 'input:not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button]):not([type=file]),textarea,select,[contenteditable]';
  const st = document.createElement('style');
  st.textContent = `html.has-cur,html.has-cur *{cursor:none!important}
html.has-cur :is(${TEXT}){cursor:text!important}
.cur{view-transition-name:cur;position:fixed;inset:auto;left:0;top:0;width:128px;height:128px;margin:-64px 0 0 -64px;padding:0;border:0;overflow:visible;background:none;pointer-events:none;opacity:0;transition:opacity .2s;z-index:2147483000;--c:#002FA7;--t:#FAFAF8;--e:#FAFAF8}
.cur.on{opacity:1}
.cur.inv{--c:#FAFAF8;--t:#002FA7;--e:rgb(18 18 20 / .5)}.cur.sea{--e:#002FA7}
.cur i,.cur b{position:absolute;left:64px;top:64px;border-radius:50%;background:var(--c);will-change:transform}
.cur i{box-shadow:0 0 0 2px var(--e);transition:background .25s,box-shadow .25s}
.cur b{--c:#002FA7;transition:background .25s;width:0;height:0}
.cur b.inv{--c:#FAFAF8}
.cur.ring i{background:transparent;box-shadow:inset 0 0 0 1.5px var(--c)}
.cur span{position:absolute;left:64px;top:64px;translate:-50% -50%;font:600 15px/1 var(--sans);letter-spacing:-.01em;color:var(--t);white-space:nowrap;opacity:0;scale:.7;transition:opacity .12s,scale .4s cubic-bezier(.16,1,.3,1)}
.cur.say span{opacity:1;scale:1;transition:opacity .2s .08s,scale .4s cubic-bezier(.16,1,.3,1) .08s}`;
  document.head.appendChild(st);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- the colour under a place: its luminance, 0 dark, 1 light ---------- */
  const px = document.createElement('canvas'), N = 24; px.width = px.height = N;
  const g = px.getContext('2d', { willReadFrequently: true }), colors = new Map(), small = new WeakMap();
  const lum = (r, v, b) => (.2126 * r + .7152 * v + .0722 * b) / 255;
  const colorOf = css => { let o = colors.get(css); if (!o) { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; o = [lum(d[0], d[1], d[2]), d[3] / 255]; colors.set(css, o); } return o; };
  /* a picture is read once, very small, away from the page; a film twice a second */
  function pixels(el) {
    const film = el.tagName === 'VIDEO', now = performance.now(); let o = small.get(el);
    if (!o || o.src !== el.currentSrc || film && now - o.at > 500) {
      o = { src: el.currentSrc, at: now, d: o && o.src === el.currentSrc ? o.d : null }; small.set(el, o);
      createImageBitmap(el, { resizeWidth: N, resizeHeight: N, resizeQuality: 'low' }).then(b => { g.clearRect(0, 0, N, N); g.drawImage(b, 0, 0); o.d = g.getImageData(0, 0, N, N).data; b.close(); kick(); }).catch(() => {});
    }
    return o.d;
  }
  function picture(el, mx, my) {
    const d = pixels(el); if (!d) return null;
    const W = el.naturalWidth || el.videoWidth, H = el.naturalHeight || el.videoHeight, r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    let kx = r.width / W, ky = r.height / H; if (cs.objectFit === 'cover') kx = ky = Math.max(kx, ky); else if (cs.objectFit === 'contain') kx = ky = Math.min(kx, ky);
    const [ox, oy] = cs.objectPosition.split(' ').map(v => v.endsWith('%') ? parseFloat(v) / 100 : .5);
    const u = (mx - r.left - (r.width - W * kx) * ox) / (W * kx), v = (my - r.top - (r.height - H * ky) * oy) / (H * ky);
    if (!(u >= 0 && u <= 1 && v >= 0 && v <= 1)) return null;
    const k = (Math.min(N - 1, v * N | 0) * N + Math.min(N - 1, u * N | 0)) * 4; return d[k + 3] > 90 ? lum(d[k], d[k + 1], d[k + 2]) : null;
  }
  function under(mx, my) {
    if (root.classList.contains('mono') || root.classList.contains('holding')) return .2;
    for (const el of document.elementsFromPoint(mx, my)) {
      if (el.closest('.mth-media')) return .1; // the film has its own shade
      if (el.matches('.over,#foot,.floor')) { const a = window.moyoFog ? moyoFog(el.matches('.floor') ? el.parentElement : el, mx, my) : 1; if (a !== null) { if (a > .5) return 1; continue; } } // a sheet is glass at its top, paper below
      if (el.naturalWidth || el.videoWidth) { const l = picture(el, mx, my); if (l !== null) return l; }
      if (el.matches('.plate--none')) { const r = el.getBoundingClientRect(), R = Math.min(r.width, r.height) * .13; return Math.hypot(mx - r.left - r.width / 2 - (parseFloat(el.style.getPropertyValue('--dx')) || 0), my - r.top - r.height / 2 - (parseFloat(el.style.getPropertyValue('--dy')) || 0)) < R ? .05 : .8; }
      const c = colorOf(getComputedStyle(el).backgroundColor);
      if (c[1] > .5) return c[0];
    }
    return 1;
  }

  /* ---------- what is pointed at ---------- */
  const c = document.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<b></b><i></i><span></span>';
  const part = c.children[0], disc = c.children[1], say = c.children[2]; // the part that goes away, the part under the hand, the word it says
  let BASE = 18; const fit = () => { BASE = clamp(innerWidth * .0085, 14, 22); };
  const WORD = { see: ['Voir', 'View'], go: ['Aller', 'Go'], hold: ['Maintenir', 'Hold'] };
  const word = k => WORD[k][root.lang === 'en' ? 1 : 0];
  const asc = (() => { const m = new Map(); return (w, f) => { const k = w + f; if (!m.has(k)) { const x = document.createElement('canvas').getContext('2d'); x.font = `${w} 100px ${f}`; const q = x.measureText('M'); m.set(k, [q.fontBoundingBoxAscent / 100, q.fontBoundingBoxDescent / 100]); } return m.get(k); }; })();
  const middle = (el, k = 1.18) => () => { const r = el.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width * k, c: getComputedStyle(el).backgroundColor } : null; }; // it takes the colour of the dot it joins
  const place = l => () => { const p = l.querySelector('span'), a = getComputedStyle(p, '::after'), r = l.getBoundingClientRect(), w = parseFloat(a.width); return w ? { x: r.left + parseFloat(a.left) + w / 2, y: r.top + parseFloat(a.top) + w / 2, s: w * .5, c: '#002FA7' } : null; }; // the empty place of a choice: a pupil in its ring

  function pick(t) {
    if (!t || root.matches('.holding,.carry')) return { m: 'free' };
    if (t.closest(TEXT)) return { m: 'text' };
    if (t.closest('h1 .dot b,.ball')) return { m: 'ring', blue: true };
    if (t.closest('.eye .hit')) return { m: 'say', w: 'hold' };
    if (t.closest('.pv-frame')) return { m: 'say', w: 'go' };
    if (t.closest('.row .plate')) return { m: 'say', w: 'see' };
    const ch = t.closest('.chips label,.scale label'); if (ch) return { m: 'word', el: ch, at: place(ch) };
    if (t.closest('.path')) return { m: 'none' }; // the dot of the way is enough
    const bt = t.closest('.btn'), sd = t.closest('.send'), pt = bt ? bt.querySelector('i.ar') : sd && sd.querySelector('.f-dots i'); if (bt || sd) return { m: (bt || sd).disabled ? 'free' : 'word', el: bt || sd, at: pt && middle(pt) }; // it joins the final point
    if (t.closest('.sub-btn,#menuBtn,.menu-close,.grip,.tg,.gal .x,.pwd .tx,.rt-b button')) return { m: t.closest('a,button,label') ? 'ring' : 'free' };
    const cta = t.closest('.foot-cta'); if (cta) { const q = cta.querySelector('.qd'); return { m: 'word', el: cta, at: q ? middle(q) : null }; }
    const row = t.closest('.row'), nm = t.closest('.nm-link'), a = t.closest('a,button,[role=button]');
    const el = row ? row.querySelector('.r-title') : nm ? nm.querySelector('.nm') : a && !a.disabled && (a.tagName !== 'A' || a.hasAttribute('href')) && !a.closest('.menu-list.arc') ? a : null;
    return el ? { m: 'word', el, at: () => end(el) } : { m: 'free' };
  }
  /* the end of the last line of a word: where its final point would be */
  const rg = document.createRange();
  function end(el) {
    let best = null;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const p = n.parentElement; if (!n.textContent.trim() || p.closest('.sr,.r2')) continue;
      const cs = getComputedStyle(p), size = parseFloat(cs.fontSize); rg.selectNodeContents(n); const rs = rg.getClientRects(), r = rs[rs.length - 1]; if (!r || !r.width) continue;
      if (!best || size >= best.size - .5) best = { size, r, cs, right: Math.max(r.right, best && Math.abs(best.r.top - r.top) < size * .6 ? best.right : 0) };
    }
    if (!best) { // the wordmark is drawn by the stylesheet
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el), size = parseFloat(cs.fontSize), [A, D] = asc(cs.fontWeight, cs.fontFamily), s = clamp(size * .155, 7, 26);
      return r.width ? { x: r.right + s * .55 + size * .03, y: r.top + r.height / 2 + (A - D) / 2 * size - s / 2, s } : null;
    }
    const [A, D] = asc(best.cs.fontWeight, best.cs.fontFamily); let base = best.r.top + A * best.size, right = best.right;
    const name = el.classList.contains('nm') && el.querySelector('.rl'); // its two copies roll on hover: the line itself does not move
    if (name) { const b = name.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight); base = b.bottom - .2 * best.size - (lh - (A + D) * best.size) / 2 - D * best.size; }
    else el.querySelectorAll('i,svg,sup').forEach(x => { const r = x.getBoundingClientRect(); if (r.width && r.width < best.size * 2 && Math.abs(r.top + r.height / 2 - best.r.top - best.r.height / 2) < best.size) right = Math.max(right, r.right); }); // after its arrow
    const s = clamp(best.size * .155, 7, 26);
    return { x: right + s * .55 + best.size * .05, y: base - s / 2, s };
  }

  /* ---------- motion ---------- */
  let x = -100, y = -100, lx = x, ly = y, s = BASE, vx = 0, vy = 0, bx = x, by = y, bs = 0, bvx = 0, bvy = 0, mode = { m: 'free' }, raf = 0, last = 0, queued = 0, downK = 1, seen = 0;
  const known = () => x > -50;
  function frame(t) {
    raf = 0; const dt = clamp((t - (last || t)) / 1000 || .016, .004, .05); last = t;
    /* under the hand: exactly where it is; only its size and its shape are eased */
    let to = mode.at && known() ? mode.at() : null; if (to && (to.x < 4 || to.y < 4 || to.x > innerWidth - 4 || to.y > innerHeight - 4)) to = null;
    const ts = (mode.m === 'none' ? 0 : mode.m === 'say' ? 92 : mode.m === 'ring' ? 46 : to ? BASE * .62 : BASE) * downK;
    s += (ts - s) * (reduce ? 1 : 1 - Math.exp(-16 * dt));
    vx += ((x - lx) / dt - vx) * (1 - Math.exp(-22 * dt)); vy += ((y - ly) / dt - vy) * (1 - Math.exp(-22 * dt)); lx = x; ly = y;
    const sp = Math.hypot(vx, vy), e = reduce || mode.m === 'say' || mode.m === 'ring' ? 0 : clamp((sp - 500) / 9000, 0, .32);
    disc.style.width = disc.style.height = s.toFixed(2) + 'px';
    disc.style.transform = `translate(${(-s / 2).toFixed(2)}px,${(-s / 2).toFixed(2)}px)` + (e > .01 ? ` rotate(${Math.atan2(vy, vx).toFixed(3)}rad) scale(${(1 + e).toFixed(3)},${(1 / (1 + e)).toFixed(3)})` : '');
    c.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    /* the part that goes to the word, and comes back */
    const ox = bx, oy = by, gx = to ? to.x : x, gy = to ? to.y : y, gs = to ? to.s : 0;
    if (!to && bs < .6) { bx = x; by = y; bs = 0; bvx = bvy = 0; }
    else { const f = reduce ? 1 : 1 - Math.exp(-(to ? 13 : 20) * dt); bx += (gx - bx) * f; by += (gy - by) * f; bs += (gs - bs) * (reduce ? 1 : 1 - Math.exp(-(to ? 12 : 18) * dt)); bvx += ((bx - ox) / dt - bvx) * .3; bvy += ((by - oy) / dt - bvy) * .3; }
    const bv = Math.hypot(bvx, bvy), be = reduce ? 0 : clamp(bv / 4200, 0, .55);
    part.style.width = part.style.height = bs.toFixed(2) + 'px';
    part.style.transform = `translate(${(bx - x - bs / 2).toFixed(2)}px,${(by - y - bs / 2).toFixed(2)}px)` + (be > .01 ? ` rotate(${Math.atan2(bvy, bvx).toFixed(3)}rad) scale(${(1 + be).toFixed(3)},${(1 / (1 + be)).toFixed(3)})` : '');
    if (to && t - seen > 120) { seen = t; part.style.background = to.c || ''; part.classList.toggle('inv', !to.c && under(to.x, to.y) < .5); }
    if (to || bs > 0 || Math.abs(ts - s) > .1 || sp > 6) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function tone() {
    if (!known()) return;
    const t = document.elementFromPoint(x, y), now = pick(t);
    if (now.m !== mode.m || now.el !== mode.el || now.w !== mode.w) seen = 0;
    mode = now;
    c.classList.toggle('ring', mode.m === 'ring'); c.classList.toggle('say', mode.m === 'say'); c.classList.toggle('on', mode.m !== 'text' && mode.m !== 'none');
    c.classList.toggle('sea', root.classList.contains('mono') || !!(t && t.closest('#menu'))); // on blue, the edge is blue
    if (mode.m === 'say') { const w = word(mode.w); if (say.textContent !== w) say.textContent = w; }
    if (mode.blue || mode.m === 'say' && !(t && t.closest('#menu'))) c.classList.remove('inv');
    else { const l = under(x, y); c.classList.toggle('inv', c.classList.contains('inv') ? l < .58 : l < .46); }
    kick();
  }
  function hide() { x = y = -100; mode = { m: 'free' }; c.classList.remove('on'); }
  const top = () => { try { if (c.matches(':popover-open')) c.hidePopover(); c.showPopover(); } catch (_) {} }; // above everything that opens
  function come(mx, my) { const first = !known(); x = mx; y = my; if (first) { lx = bx = x; ly = by = y; vx = vy = 0; root.classList.add('has-cur'); } tone(); }
  function start() {
    fit(); s = BASE; c.setAttribute('popover', 'manual'); document.body.appendChild(c); top();
    addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; come(e.clientX, e.clientY); }, { passive: true });
    addEventListener('scroll', () => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; tone(); }); }, { passive: true, capture: true });
    addEventListener('resize', fit);
    setInterval(() => { if (!document.hidden && known()) tone(); }, 140); // something can change under a still pointer
    addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return hide(); downK = .8; kick(); }, { passive: true });
    ['pointerup', 'pointercancel', 'blur', 'dragend'].forEach(n => addEventListener(n, () => { downK = 1; kick(); }, { passive: true }));
    root.addEventListener('mouseleave', hide);
    document.addEventListener('pointerover', e => { if (e.target.tagName === 'IFRAME') hide(); }); // a frame has its own
    /* whatever opens in the top layer (menu, dialogs), the cursor goes back over it */
    document.addEventListener('toggle', e => { if (e.target !== c) top(); }, true);
    new MutationObserver(m => { if (m.some(r => r.target.tagName === 'DIALOG')) top(); }).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
    /* from a page to the next it does not disappear */
    const kept = 'moyo-cur' + (window.top !== window.self ? '-frame' : ''); // a frame does not take the place of the page around it
    addEventListener('pagehide', () => { try { known() ? sessionStorage.setItem(kept, [x, y, Date.now()]) : sessionStorage.removeItem(kept); } catch (_) {} });
    try { const p = (sessionStorage.getItem(kept) || '').split(',').map(Number); if (p.length === 3 && Date.now() - p[2] < 8000 && p[0] > 0 && p[1] > 0 && p[0] < innerWidth && p[1] < innerHeight) come(p[0], p[1]); } catch (_) {}
  }
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
