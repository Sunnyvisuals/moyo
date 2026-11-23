/* Hidden handwriting: phrases scribbled in the background of each section, almost invisible, to be found.
   Each letter takes one of five handwritings, all at the same size, with the same draw as the Framer component
   "Bad handwriting" (fixed seed, same result on every visit),
   and lights up when the pointer passes near it. On touch screens the letters light up as they cross the middle of the screen.
   Decorative only (aria-hidden, behind the content). Phrases: edit LINES, size: edit --hs. Fonts: SIL OFL 1.1, self-hosted in /fonts/hand. */
(() => {
  // host selector: [left %, top %, (unused), tilt (deg), French, English]
  const LINES = {
    '#approche': [[-3, 66, 7.5, -7, 'la lumière d’abord', 'light comes first'], [62, 10, 2.4, 9, 'regarder encore', 'look again'], [74, 80, 3.4, -13, 'presque rien', 'almost nothing']],
    '#services': [[34, 2.5, 4.4, -9, 'une idée, une seule', 'one idea, only one'], [38, 44, 3, 78, 'recommencer', 'start over'], [-2, 88, 8, 4, 'à la main', 'by hand'], [66, 92, 2.6, -11, 'écouter le lieu', 'listen to the place']],
    '#studio': [[52, 5, 5.4, 8, 'l’allure du ciel', 'the look of the sky'], [-4, 46, 3.6, -80, 'moyō, le motif', 'moyō, the pattern'], [38, 84, 2.8, -6, 'ce qui se répète', 'what comes back']],
    '#equipe': [[48, 8, 6.4, -8, 'deux regards', 'two pairs of eyes'], [58, 66, 2.8, 12, 'on se comprend', 'we understand each other'], [-3, 84, 4, -4, 'quatre mains', 'four hands']],
    '#contact': [[42, 3, 3.6, -10, 'dites-nous tout', 'tell us everything'], [-4, 70, 8.4, 6, 'et si on essayait', 'what if we tried'], [30, 52, 2.4, 72, 'demain matin', 'tomorrow morning']],
    '#foot': [[46, 44, 5.6, -7, 'jusqu’au dernier rayon', 'until the last ray'], [70, 58, 2.4, 10, 'à bientôt', 'see you soon']],
    '.projects-page': [[44, 14, 4.6, -5, 'tout commence par un motif', 'it all starts with a pattern'], [-3, 48, 3.2, -82, 'midi, plein soleil', 'noon, full sun'], [60, 86, 6, 6, 'et après', 'and then']],
    '.who-page': [[46, 14, 7, -9, 'quelqu’un, quelque part', 'someone, somewhere'], [72, 48, 2.6, 11, 'la main avant l’outil', 'the hand before the tool']]
  };
  const FONTS = ['Caveat', 'Indie Flower', 'Nothing You Could Do', 'Reenie Beanie', 'Shadows Into Light'];
  const AVOID = { l: [2] }; // Nothing You Could Do draws an unreadable l
  const st = document.createElement('style');
  st.textContent = FONTS.map(f => `@font-face{font-family:"${f}";src:url(/fonts/hand/${f.toLowerCase().replace(/ /g, '-')}.woff2) format("woff2");font-weight:400;font-display:swap}`).join('') +
    `.scr{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;user-select:none;color:inherit}
.scr p{position:absolute;margin:0;max-width:none;white-space:nowrap;line-height:1.2;font-weight:400;letter-spacing:0;transform-origin:0 50%;rotate:var(--r);font-size:var(--hs)}
.scr i{font-style:normal;opacity:calc(var(--o0) + var(--o,0) * .5);transition:opacity .7s cubic-bezier(.25,1,.5,1)}
.scr{--o0:.06;--hs:72px}
@media (max-width:820px){.scr{--hs:48px}}
@media (prefers-reduced-motion:reduce){.scr{--o0:.14}}
` + FONTS.map((f, n) => `.scr .h${n}{font-family:"${f}",cursive}`).join('');
  document.head.appendChild(st);

  const main = document.getElementById('main');
  if (main && document.getElementById('filters')) main.classList.add('projects-page');
  if (main && main.querySelector('.who')) main.classList.add('who-page');
  const rnd = s => { const x = Math.sin(s) * 1e4; return x - Math.floor(x); };
  const esc = c => c.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let letters = [];
  function scribble(text, seed) {
    const used = {}; let out = '';
    for (const ch of text) {
      if (ch === ' ') { out += ' '; seed++; continue; }
      const k = ch.toLowerCase(), pool = [0, 1, 2, 3, 4].filter(f => !(AVOID[k] || []).includes(f) && f !== used[k]);
      const f = used[k] = pool[Math.floor(rnd(seed++) * pool.length)];
      out += `<i class="h${f}">${esc(ch)}</i>`;
    }
    return out;
  }
  function build() {
    document.querySelectorAll('.scr').forEach(e => e.remove());
    const en = document.documentElement.lang === 'en';
    Object.entries(LINES).forEach(([sel, lines], h) => {
      const host = document.querySelector(sel); if (!host) return;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.style.isolation = 'isolate';
      const d = document.createElement('div'); d.className = 'scr'; d.setAttribute('aria-hidden', 'true');
      d.innerHTML = lines.map(([x, y, , r, fr, e], i) => `<p style="left:${x}%;top:${y}%;--r:${r}deg">${scribble(en ? e : fr, 12)}</p>`).join('');
      host.appendChild(d);
    });
    letters = [...document.querySelectorAll('.scr i[class]')];
  }
  build();
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------- light ---------- */
  const fine = matchMedia('(pointer: fine)').matches;
  let mx = -9999, my = -9999, raf = 0;
  const frame = () => {
    raf = 0;
    const H = innerHeight, R = Math.max(220, innerWidth * .15);
    const pos = letters.map(l => { const r = l.parentNode.getBoundingClientRect(); if (r.bottom < -80 || r.top > H + 80) return null; const b = l.getBoundingClientRect(); return [(b.left + b.right) / 2, (b.top + b.bottom) / 2]; });
    letters.forEach((l, i) => {
      const p = pos[i]; if (!p) return;
      const k = fine ? 1 - Math.hypot(p[0] - mx, p[1] - my) / R : 1 - Math.abs(p[1] - H / 2) / (H * .3);
      const v = Math.max(0, k).toFixed(2);
      if (l.dataset.v !== v) { l.dataset.v = v; l.style.setProperty('--o', v); }
    });
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; kick(); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { mx = my = -9999; kick(); });
  addEventListener('scroll', kick, { passive: true });
  kick();
})();
