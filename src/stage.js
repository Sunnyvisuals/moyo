/* Staging: every page builds itself in front of the reader. Texts, lists, fields, columns, photos appear one by one.
   Two ways, so that the page does not always move the same way:
   - "seq" (arrival): when a piece reaches the lower part of the screen it rises and fades in; pieces that arrive together
     follow each other (110 ms apart). It leaves with a short fade upwards and is ready to play again after it has gone below.
   - "scrub" (scroll): the piece is composed and undone by the scroll itself, both ways, so the page adapts to the reading speed.
   Which way a section uses is set in MODES. Photos are drawn with a wipe. Headings keep their own reveals.
   Nothing here changes the layout (only opacity, translate and clip-path). Skipped with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  const MODES = { '#approche': 'seq', '#services': 'scrub', '#studio': 'seq', '#equipe': 'scrub', '#contact': 'seq', '#foot': 'seq', '.projects-main': 'seq', '.who-main': 'seq' };
  const TARGETS = '.idx,.lead,.ct-lead,.ct-alt,.small,p,dl,.list li,.steps li,.fld,.chips,.f-foot,.figs>div,.beliefs li,.fcol,.foot-sub,.foot-base,.head>*,.filters,.projects>li,.photo,.ttl,h1,.bio p,.entry-d>*';
  const SKIP = '.scr,#menu,dialog,.bar,.blocks,.acc,.loader,.stage,.sunui,.win,.display,.lines,.shut,.grad,.words,.par,.hint,.scroll-cue,.dots,.skip,#tip,.sr,.hp,.mono-wrap,.proj-more,.studio-cta';
  const st = document.createElement('style');
  st.textContent = `.stg{opacity:0;translate:0 var(--sy,20px)}
.stg.in{opacity:1;translate:0 0;transition:opacity .9s ease var(--sd,0ms),translate 1s cubic-bezier(.22,1,.36,1) var(--sd,0ms)}
.stg.out{opacity:0;translate:0 -14px;transition:opacity .45s ease,translate .5s cubic-bezier(.64,0,.78,0)}
.stg.clip{opacity:1;translate:none;clip-path:inset(0 0 100% 0)}
.stg.clip.in{clip-path:inset(0);transition:clip-path 1.15s cubic-bezier(.76,0,.24,1) var(--sd,0ms)}
.stg.clip.out{opacity:1;translate:none;clip-path:inset(100% 0 0 0);transition:clip-path .6s cubic-bezier(.64,0,.78,0)}
.stg.sc{transition:none!important}`;
  document.head.appendChild(st);

  // the pages carry their own mode name when they are not a home section
  const main = document.getElementById('main');
  if (main && document.getElementById('filters')) main.classList.add('projects-main');
  if (main && main.querySelector('.who')) main.classList.add('who-main');

  const containers = [...document.querySelectorAll('#approche,#services,#studio,#equipe,#contact,#foot,.projects-main,.who-main')];
  const used = new Set(), seqEls = [], scrubEls = [];
  containers.forEach(c => {
    const key = c.id ? '#' + c.id : c.classList.contains('projects-main') ? '.projects-main' : '.who-main';
    const mode = MODES[key] || 'seq';
    const all = [...c.querySelectorAll(TARGETS)].filter(e => !used.has(e) && !e.matches(SKIP) && !e.closest(SKIP)), set = new Set(all);
    // outermost pieces only: a piece whose parent is already staged is not animated twice
    const found = all.filter(e => { for (let p = e.parentElement; p && p !== c; p = p.parentElement) if (set.has(p)) return false; return true; });
    found.forEach(e => {
      used.add(e);
      e.classList.add('stg');
      if (e.matches('.photo')) e.classList.add('clip');
      if (mode === 'scrub' && !e.matches('.photo')) { e.classList.add('sc'); scrubEls.push(e); } else seqEls.push(e);
    });
  });
  if (!used.size) return;

  /* ----- seq: pieces that arrive together follow each other ----- */
  const state = new WeakMap(); // 'in' | 'out' | undefined
  const io = new IntersectionObserver(entries => {
    const arriving = entries.filter(en => en.isIntersecting && state.get(en.target) !== 'in').sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    arriving.forEach((en, i) => {
      const e = en.target;
      e.style.setProperty('--sd', Math.min(i * 110, 770) + 'ms');
      e.classList.remove('out'); e.classList.add('in'); state.set(e, 'in');
    });
    entries.filter(en => !en.isIntersecting && state.get(en.target) === 'in').forEach(en => {
      const e = en.target;
      if (en.boundingClientRect.top < 0) { e.style.removeProperty('--sd'); e.classList.remove('in'); e.classList.add('out'); state.set(e, 'out'); } // went up: leaves
      else { e.style.removeProperty('--sd'); e.classList.remove('in', 'out'); state.delete(e); } // went below again: ready to play again
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

  /* ----- scrub: composed and undone by the scroll, both ways ----- */
  const clamp = v => Math.min(1, Math.max(0, v));
  let raf = 0;
  const frame = () => {
    raf = 0;
    const H = innerHeight;
    for (const e of scrubEls) {
      const r = e.getBoundingClientRect();
      if (r.bottom < -H * .5 || r.top > H * 1.5) { if (e.style.opacity !== (r.top > 0 ? '0' : '0')) e.style.opacity = '0'; continue; }
      const p = clamp((H * .94 - r.top) / (H * .3)), q = clamp((H * .08 - r.top) / (H * .22));
      const o = p * (1 - q), y = (1 - p) * 34 - q * 22;
      e.style.opacity = o.toFixed(3); e.style.translate = '0 ' + y.toFixed(1) + 'px';
    }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* ----- start: after the opening loader, and a little later when a page change is still sliding in ----- */
  const go = () => { seqEls.forEach(e => io.observe(e)); frame(); addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); };
  const sameSite = (() => { try { return !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (_) { return false; } })();
  const begin = () => setTimeout(go, sameSite ? 450 : 80);
  frame(); // composed state from the first frame, no flash
  if (root.classList.contains('loading')) {
    const mo = new MutationObserver(() => { if (!root.classList.contains('loading')) { mo.disconnect(); setTimeout(go, 500); } });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  } else begin();
})();
