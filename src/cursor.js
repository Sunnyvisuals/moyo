/* The cursor is the dot. It punctuates what you point at:
   - over a word that can be clicked, it leaves the pointer and goes to sit at the end of it, as its final point,
   - over a picture it opens and says what will happen,
   - over a pill or an icon it is a thin ring, over a text field it gives way to the caret of the system,
   - between two things it stretches with its own speed.
   It reads the colour really under it: blue on paper, paper on blue. It lives in the top layer, so it is the same over the menu and the project sheet.
   Mouse and trackpad only. */
(() => {
  /* focus ring for keyboard users only: never after a click (menu closing gives the focus back to its button) */
  const kb = document.documentElement, fs = document.createElement('style');
  fs.textContent = 'html:not(.kbd) :focus-visible{outline:none!important}*{-webkit-tap-highlight-color:transparent}';
  document.head.appendChild(fs);
  addEventListener('keydown', e => { if (/^(Tab|Arrow|Enter| )/.test(e.key) && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.key === 'Tab') kb.classList.add('kbd'); }, true);
  addEventListener('pointerdown', () => kb.classList.remove('kbd'), true);
})();
(() => {
  if (!matchMedia('(pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement;
  const TEXT = 'input:not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button]),textarea,select,[contenteditable]';
  const st = document.createElement('style');
  st.textContent = `html.has-cur,html.has-cur *{cursor:none!important}
html.has-cur :is(${TEXT}){cursor:text!important}
.cur{position:fixed;inset:auto;left:0;top:0;width:0;height:0;margin:0;padding:0;border:0;overflow:visible;background:none;pointer-events:none;opacity:0;transition:opacity .25s;z-index:2147483000;--c:#002FA7;--t:#F5F4F0}
.cur.on{opacity:1}
.cur.inv{--c:#F5F4F0;--t:#002FA7}
.cur i{position:absolute;left:0;top:0;border-radius:50%;background:var(--c);transition:background .25s,box-shadow .25s}
.cur.ring i{background:transparent;box-shadow:inset 0 0 0 1.5px var(--c)}
.cur span{position:absolute;left:0;top:0;translate:-50% -50%;font:600 15px/1 var(--sans);letter-spacing:-.01em;color:var(--t);white-space:nowrap;opacity:0;scale:.7;transition:opacity .2s,scale .4s cubic-bezier(.16,1,.3,1)}
.cur.say span{opacity:1;scale:1;transition-delay:.08s}`;
  document.head.appendChild(st);

  /* luminance (0 dark, 1 light) of what is painted under the pointer */
  const px = document.createElement('canvas'); px.width = px.height = 1;
  const g = px.getContext('2d', { willReadFrequently: true }), colors = new Map();
  const lum = (r, v, b) => (.2126 * r + .7152 * v + .0722 * b) / 255;
  const colorOf = css => { let o = colors.get(css); if (!o) { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; o = [lum(d[0], d[1], d[2]), d[3] / 255]; colors.set(css, o); } return o; };
  const imgLum = (im, mx, my) => {
    const r = im.getBoundingClientRect(), k = Math.max(r.width / im.naturalWidth, r.height / im.naturalHeight), s = 24 / k, sx = (mx - r.left - r.width / 2) / k + im.naturalWidth / 2 - s / 2, sy = (my - r.top - r.height / 2) / k + im.naturalHeight / 2 - s / 2;
    g.clearRect(0, 0, 1, 1); g.drawImage(im, sx, sy, s, s, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return d[3] ? lum(d[0], d[1], d[2]) : null;
  };
  const under = (mx, my) => {
    for (const el of document.elementsFromPoint(mx, my)) {
      if (el.tagName === 'IMG' && el.naturalWidth) { try { const l = imgLum(el, mx, my); if (l !== null) return l; } catch (_) {} }
      if (el.matches('.plate--none')) { const r = el.getBoundingClientRect(), R = Math.min(r.width, r.height) * .13; return Math.hypot(mx - r.left - r.width / 2, my - r.top - r.height / 2) < R ? .05 : .8; }
      const c = colorOf(getComputedStyle(el).backgroundColor);
      if (c[1] > .5) return c[0];
    }
    return 1;
  };

  const c = document.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<i></i><span></span>';
  const disc = c.firstChild, say = c.lastChild;
  const BASE = Math.min(22, Math.max(12, innerWidth * .0085)), clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const WORD = { see: ['Voir', 'View'], go: ['Aller', 'Go'], hold: ['Maintenir', 'Hold'] };
  const word = k => WORD[k][root.lang === 'en' ? 1 : 0];
  const asc = (() => { const m = new Map(); return (w, f) => { const k = w + f; if (!m.has(k)) { const x = document.createElement('canvas').getContext('2d'); x.font = `${w} 100px ${f}`; const q = x.measureText('M'); m.set(k, [q.fontBoundingBoxAscent / 100, q.fontBoundingBoxDescent / 100]); } return m.get(k); }; })();

  /* what the dot should be over this element */
  function pick(t) {
    if (!t || root.classList.contains('holding')) return { m: 'free' };
    if (t.closest(TEXT)) return { m: 'text' };
    if (t.closest('.eye .hit')) return { m: 'say', w: 'hold' };
    if (t.closest('.pv-frame')) return { m: 'say', w: 'go' };
    if (t.closest('.row .plate')) return { m: 'say', w: 'see' };
    if (t.closest('.btn,.chips label,.sub-btn,#menuBtn,.menu-close,.path a,.path-b,.path')) return { m: t.closest('a,button,label') ? 'ring' : 'free' };
    if (t.closest('.foot-cta')) return { m: 'dot', el: t.closest('.foot-cta').querySelector('.qd') };
    const row = t.closest('.row'); if (row) return { m: 'dock', el: row.querySelector('.r-title') };
    const nm = t.closest('.nm-link'); if (nm) return { m: 'dock', el: nm.querySelector('.nm') };
    const a = t.closest('a,button,[role=button]');
    if (a && !a.disabled) return a.closest('.menu-list.arc') ? { m: 'free' } : { m: 'dock', el: a };
    return { m: 'free' };
  }
  /* the end of the last line of a word: where its final point would be */
  const rg = document.createRange();
  function dockOf(el) {
    let best = null;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const p = n.parentElement; if (!n.textContent.trim() || p.closest('.sr,.r2')) continue;
      const cs = getComputedStyle(p), size = parseFloat(cs.fontSize); rg.selectNodeContents(n); const rs = rg.getClientRects(), r = rs[rs.length - 1]; if (!r || !r.width) continue;
      if (!best || size >= best.size - .5) best = { size, r, cs, p };
    }
    if (!best) { // the wordmark is drawn by the stylesheet
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el), size = parseFloat(cs.fontSize), [A, D] = asc(cs.fontWeight, cs.fontFamily), s = clamp(size * .155, 7, 26);
      return r.width ? { x: r.right + s * .55 + size * .03, y: r.top + r.height / 2 + (A - D) / 2 * size - s / 2, s } : null;
    }
    const [A, D] = asc(best.cs.fontWeight, best.cs.fontFamily); let base = best.r.top + A * best.size, right = best.r.right;
    const name = el.classList.contains('nm') && el.querySelector('.rl'); // its two copies roll on hover: the line itself does not move
    if (name) { const b = name.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight); base = b.bottom - .2 * best.size - (lh - (A + D) * best.size) / 2 - D * best.size; }
    else if (!el.matches('.r-title,.nm')) right = Math.max(right, el.getBoundingClientRect().right);
    const s = clamp(best.size * .155, 7, 26);
    return { x: right + s * .55 + best.size * .05, y: base - s / 2, s };
  }

  let x = -100, y = -100, cx = x, cy = y, s = BASE, vx = 0, vy = 0, mode = { m: 'free' }, raf = 0, last = 0, queued = 0, downK = 1;
  const apply = () => { c.classList.toggle('ring', mode.m === 'ring'); c.classList.toggle('say', mode.m === 'say'); if (mode.m === 'say') { const w = word(mode.w); if (say.textContent !== w) say.textContent = w; } c.classList.toggle('on', mode.m !== 'text' && x > -50); };
  const frame = t => {
    raf = 0; const dt = Math.min(.05, (t - (last || t)) / 1000) || .016; last = t;
    let tx = x, ty = y, ts = BASE, k = 26;
    if (mode.m === 'dot' && mode.el) { const r = mode.el.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; ts = r.width * 1.18; k = 13; }
    else if (mode.m === 'dock') { const d = dockOf(mode.el); if (d) { tx = d.x; ty = d.y; ts = d.s; k = 13; } }
    else if (mode.m === 'say') { ts = 92; k = 18; } else if (mode.m === 'ring') ts = 46;
    ts *= downK;
    const f = reduce ? 1 : 1 - Math.exp(-k * dt), fs = reduce ? 1 : 1 - Math.exp(-14 * dt), ox = cx, oy = cy;
    cx += (tx - cx) * f; cy += (ty - cy) * f; s += (ts - s) * fs;
    vx += ((cx - ox) / dt - vx) * .3; vy += ((cy - oy) / dt - vy) * .3;
    const sp = Math.hypot(vx, vy), e = reduce || mode.m === 'say' || mode.m === 'ring' ? 0 : clamp(sp / 4200, 0, .55), a = Math.atan2(vy, vx);
    disc.style.width = disc.style.height = s.toFixed(2) + 'px'; disc.style.margin = `${(-s / 2).toFixed(2)}px 0 0 ${(-s / 2).toFixed(2)}px`;
    disc.style.transform = e > .01 ? `rotate(${a.toFixed(3)}rad) scale(${(1 + e).toFixed(3)},${(1 / (1 + e)).toFixed(3)})` : '';
    c.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
    if (mode.m === 'dock' || mode.m === 'dot' || Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(ts - s) > .12 || sp > 4) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const tone = () => { if (x < 0) return; const t = document.elementFromPoint(x, y); mode = pick(t); apply(); const l = under(x, y); if (mode.m === 'say') c.classList.remove('inv'); if (mode.m !== 'say' || root.classList.contains('mono') || t.closest('#menu')) c.classList.toggle('inv', c.classList.contains('inv') ? l < .58 : l < .46); kick(); };
  const top = () => { try { if (c.matches(':popover-open')) c.hidePopover(); c.showPopover(); } catch (_) {} };
  const start = () => {
    c.setAttribute('popover', 'manual'); document.body.appendChild(c); top(); root.classList.add('has-cur');
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const first = x < -50; x = e.clientX; y = e.clientY; if (first) { cx = x; cy = y; } tone(); }, { passive: true });
    addEventListener('scroll', () => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; tone(); }); }, { passive: true, capture: true });
    setInterval(() => { if (!document.hidden && c.classList.contains('on')) tone(); }, 140); // something can change under a still pointer
    addEventListener('pointerdown', () => { downK = .8; kick(); }, { passive: true }); addEventListener('pointerup', () => { downK = 1; kick(); }, { passive: true });
    root.addEventListener('mouseleave', () => { x = y = -100; c.classList.remove('on'); });
    // stay above the menu and the project sheet
    const menu = document.getElementById('menu'), dlg = document.getElementById('proj');
    if (menu) menu.addEventListener('toggle', top);
    if (dlg) new MutationObserver(top).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
