/* Minimal cursor: a small Klein-blue square that follows the pointer with a little inertia.
   Lime white over blue areas, an outlined square over anything clickable, the system caret in text fields.
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
.cur::before{content:"";position:absolute;left:-4px;top:-4px;width:8px;height:8px;background:#002FA7;border:1px solid transparent;box-sizing:border-box;
  transition:left .45s cubic-bezier(.25,1,.5,1),top .45s cubic-bezier(.25,1,.5,1),width .45s cubic-bezier(.25,1,.5,1),height .45s cubic-bezier(.25,1,.5,1),background .3s,border-color .3s,scale .2s}
.cur.inv::before{background:#F1F3F2}
.cur.hot::before{left:-18px;top:-18px;width:36px;height:36px;background:transparent;border-color:#002FA7}
.cur.inv.hot::before{border-color:#F1F3F2}
.cur.down::before{scale:.8}`;
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
  const start = () => {
    document.body.appendChild(c); root.classList.add('has-cur');
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      const top = t && t.closest('dialog,[popover]');
      root.classList.toggle('cur-off', !!top);
      const text = t && t.closest('input:not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button]):not([type=reset]):not([type=range]):not([type=file]):not([type=color]):not([type=image]),textarea,select,[contenteditable]');
      c.classList.toggle('on', !top && !text);
      c.classList.toggle('hot', !!(t && t.closest('a,button,label,summary,.row,[role=button]')));
      c.classList.toggle('inv', !!(t && t.closest('.blue,.foot,.bar[data-tone="paper"],.cta,.send,.plate:not([data-t="wash"]),.win')));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    addEventListener('pointerdown', () => c.classList.add('down'), { passive: true });
    addEventListener('pointerup', () => c.classList.remove('down'), { passive: true });
    root.addEventListener('mouseleave', () => c.classList.remove('on'));
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
