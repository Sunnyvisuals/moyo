/* Handwriting in the background of the sections: each phrase writes itself letter by letter as it enters the screen,
   in the full ink of its section, and erases itself as it leaves (driven by the scroll, both ways).
   Each letter takes one of five handwritings, all at the same size, with the same draw as the Framer component
   "Bad handwriting" (fixed seed, same result on every visit). Decorative only (aria-hidden, behind the content).
   Phrases: edit LINES, size: edit --hs. Fonts: SIL OFL 1.1, self-hosted in /fonts/hand. */
(() => {
  // host selector: [wished left %, wished top %, tilt (deg), French, English]
  const LINES = {
    '.win': [[6, 10, -7, 'agence créative', 'creative agency'], [34, 76, 5, 'dessiner la lumière', 'drawing light']],
    '#approche': [[56, 30, -7, 'une idée avant tout', 'an idea above all'], [3, 60, -6, 'direction artistique', 'art direction'], [50, 73, -8, 'mesurer, puis créer', 'measure, then create']],
    '#services': [[34, 2.5, -7, 'une idée, une seule', 'one idea, only one'], [2, 92, 4, 'du croquis à l’écran', 'from sketch to screen']],
    '#studio': [[74, 34, 8, 'deux regards', 'two pairs of eyes'], [40, 88, 4, 'sites, films, campagnes', 'websites, films, campaigns']],
    '#equipe': [[50, 8, -7, 'une agence, quatre mains', 'one agency, four hands'], [56, 66, 8, 'on se comprend', 'we understand each other']],
    '#contact': [[46, 4, -6, 'parlons de votre marque', 'let’s talk about your brand'], [3, 72, 6, 'tout commence ici', 'it all starts here'], [33, 92, -4, 'et si on créait ensemble', 'what if we made it together']],
    '#foot': [[46, 43, -6, 'créer, filmer, raconter', 'create, film, tell'], [68, 57, 8, 'à bientôt chez moyo', 'see you soon at moyo']],
    '.projects-page': [[44, 14, -5, 'chaque projet a son motif', 'every project has its pattern'], [58, 88, 5, 'et le vôtre', 'and yours']],
    '.who-page': [[66, 46, 7, 'imaginer ensemble', 'imagine together'], [40, 14, -8, 'la main avant l’outil', 'the hand before the tool']]
  };
  // the team pages carry their own phrase (set in the admin)
  const pm = document.getElementById('main');
  if (pm && pm.dataset.phraseFr) LINES['.who-page'] = [[58, 7, -3, pm.dataset.phraseFr, pm.dataset.phraseEn || pm.dataset.phraseFr]];
  const FONTS = ['Caveat', 'Indie Flower', 'Nothing You Could Do', 'Reenie Beanie', 'Shadows Into Light'];
  const AVOID = { l: [2] }; // Nothing You Could Do draws an unreadable l
  const st = document.createElement('style');
  st.textContent = FONTS.map(f => `@font-face{font-family:"${f}";src:url(/fonts/hand/${f.toLowerCase().replace(/ /g, '-')}.woff2) format("woff2");font-weight:400;font-display:swap}`).join('') +
    `.scr{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;user-select:none;--ink:#002FA7;--bg:#F1F3F2}
.blue>.scr,.win>.scr,.foot>.scr{--ink:#F1F3F2;--bg:#002FA7}
.contact>.scr{--bg:color-mix(in oklab,#002FA7 50%,#000614)}
.scr p{position:absolute;margin:0;max-width:none;white-space:nowrap;line-height:1.2;font-weight:400;letter-spacing:0;transform-origin:50% 50%;rotate:var(--r);font-size:var(--hs)}
.scr p[hidden]{display:none}
html.js .scr i,.scr i{color:var(--ink);opacity:0;transition:opacity .3s ease}
.scr i.on{opacity:1}
.scr p{transition:opacity .9s ease}.scr p.gone{opacity:0}
.scr{--hs:72px}
@media (max-width:820px){.scr{--hs:48px}}
@media (prefers-reduced-motion:reduce){.scr i{opacity:1;transition:none}}
` + FONTS.map((f, n) => `.scr .h${n}{font-family:"${f}",cursive}`).join('');
  document.head.appendChild(st);

  const main = document.getElementById('main');
  if (main && document.getElementById('filters')) main.classList.add('projects-page');
  if (main && main.querySelector('.who')) main.classList.add('who-page');
  /* Placement: a phrase goes to the free spot nearest to the wished one, never over a text, an image, a line or a control.
     It gets smaller when there is no room, and is left out when there is none at all. */
  const SOLID = 'img,svg,button,input,textarea,select,.link,.plate,.photo,.blocks,.acc,.filters,.idx,.mono-wrap,.sub-row,.foot-base,.ct-form,.entry-w,.cap,.projects';
  function obstacles(host, H) {
    const out = [], add = (r, p) => { if (r.width > 1 && r.height > 0) out.push([r.left - H.left - p, r.top - H.top - p, r.right - H.left + p, r.bottom - H.top + p]); };
    const pad = innerWidth < 821 ? 16 : 30; // a margin around every text
    host.querySelectorAll(SOLID).forEach(e => { if (!e.closest('.scr,.win')) add(e.getBoundingClientRect(), pad); });
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT), rg = document.createRange(); let n;
    while ((n = w.nextNode())) { if (!n.data.trim() || n.parentElement.closest('.scr,.sr,script,style,dialog')) continue; rg.selectNodeContents(n); for (const r of rg.getClientRects()) add(r, pad); }
    host.querySelectorAll('li,.sec-head,.names,dl,.head,.foot-base').forEach(e => { if (e.closest('.scr')) return; const c = getComputedStyle(e), r = e.getBoundingClientRect();
      if (parseFloat(c.borderTopWidth)) add({ left: r.left, right: r.right, top: r.top, bottom: r.top + 1, width: r.width, height: 1 }, 8);
      if (parseFloat(c.borderBottomWidth)) add({ left: r.left, right: r.right, top: r.bottom - 1, bottom: r.bottom, width: r.width, height: 1 }, 8); });
    // blocks that drift with the scroll on wide screens: keep a vertical margin around their whole box
    if (innerWidth > 1000) host.querySelectorAll('.intro .cols,.statement,.entry-d,.names,.contact h2,.sec-head').forEach(e => { const r = e.getBoundingClientRect(); add({ left: r.left, right: r.right, top: r.top - 90, bottom: r.bottom + 90, width: r.width, height: r.height + 180 }, 0); });
    if (host.matches('.projects-page,.who-page')) out.push([0, 0, H.width, 96]); // the header is fixed above the top of these pages
    if (host.matches('.win')) for (const f of [1 / 3, 2 / 3]) out.push([0, H.height * f - 14, H.width, H.height * f + 14]);
    if (host.matches('.sec') && innerWidth > 1180) out.push([H.width - 64, 0, H.width, H.height]); // section marks
    return out;
  }
  // measure the real layout: no parallax, reveal or scroll animation moving the texts around
  const frz = document.createElement('style'); frz.textContent = 'html.scr-m *,html.scr-m *::before,html.scr-m *::after{translate:none!important;transform:none!important;animation:none!important;transition:none!important}html.scr-m .lm-in,html.scr-m .lm{opacity:1!important}';
  document.head.appendChild(frz);
  function place() {
    document.documentElement.classList.add('scr-m');
    try { placeAll(); } finally { document.documentElement.classList.remove('scr-m'); }
  }
  function placeAll() {
    document.querySelectorAll('.scr').forEach(d => {
      const host = d.parentElement, H = host.getBoundingClientRect(), obs = obstacles(host, H), m = innerWidth < 821 ? 18 : 36, k0 = H.width / (host.offsetWidth || 1);
      const base = innerWidth < 821 ? 48 : 72;
      const cap = innerWidth < 821 ? 2 : 3; let shown = 0;
      for (const q of d.children) {
        q.hidden = false; let done = false;
        if (shown >= cap) { q.hidden = true; continue; }
        for (const size of [base, base * .84, base * .7, base * .58, 30, 24]) {
          q.style.fontSize = size + 'px';
          const a = +q.dataset.r * Math.PI / 180, w0 = q.offsetWidth, h0 = q.offsetHeight, w = w0 * Math.cos(a) + h0 * Math.abs(Math.sin(a)), h = w0 * Math.abs(Math.sin(a)) + h0 * Math.cos(a);
          const X = H.width / k0 - m - w, Y = H.height - m - h; if (X < m || Y < m) continue;
          const wx = H.width * q.dataset.x / 100, wy = H.height * q.dataset.y / 100; let best = null, bd = 1e12;
          for (let y = m; y <= Y; y += 20) for (let x = m; x <= X; x += 20) {
            const dd = (x - wx) ** 2 + (y - wy) ** 2; if (dd >= bd) continue;
            if (obs.some(o => x < o[2] && x + w > o[0] && y < o[3] && y + h > o[1])) continue;
            bd = dd; best = [x, y];
          }
          if (!best) continue;
          q.style.left = ((best[0] + (w - w0) / 2) / H.width * 100).toFixed(2) + '%'; q.style.top = ((best[1] + (h - h0) / 2) / H.height * 100).toFixed(2) + '%';
          obs.push([best[0] - 60, best[1] - 60, best[0] + w + 60, best[1] + h + 60]); done = true; break;
        }
        q.hidden = !done; if (done) shown++;
      }
    });
  }
  const rnd = s => { const x = Math.sin(s) * 1e4; return x - Math.floor(x); };
  const esc = c => c.replace(/&/g, '&amp;').replace(/</g, '&lt;');
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
    Object.entries(LINES).forEach(([sel, lines]) => {
      const host = document.querySelector(sel); if (!host) return;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.style.isolation = 'isolate';
      const d = document.createElement('div'); d.className = 'scr'; d.setAttribute('aria-hidden', 'true');
      d.innerHTML = lines.map(([x, y, r, fr, e]) => `<p hidden data-x="${x}" data-y="${y}" data-r="${r}" style="--r:${r}deg">${scribble(en ? e : fr, 12)}</p>`).join('');
      host.appendChild(d);
    });
    place();
  }
  build();
  let pt = 0; const again = ms => { clearTimeout(pt); pt = setTimeout(place, ms); };
  document.fonts?.ready.then(() => again(60)); addEventListener('load', () => setTimeout(place, 1600)); addEventListener('resize', () => again(250));
  Promise.all(FONTS.map(f => document.fonts.load('72px "' + f + '"'))).then(() => again(60)).catch(() => {});
  new MutationObserver(() => { build(); again(900); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------- writing driven by the scroll ----------
     Entering: the letters switch on one after the other as the phrase climbs from the foot of the screen to about three quarters of its height.
     Leaving: once it has crossed the upper part of the screen, the whole phrase simply fades out (and comes back on the way up). */
  let raf = 0;
  const frame = () => {
    raf = 0;
    const H = innerHeight;
    document.querySelectorAll('.scr p:not([hidden])').forEach(q => {
      const r = q.getBoundingClientRect(), L = q.children, n = L.length;
      const c = (r.top + r.bottom) / 2, vis = r.bottom > 0 && r.top < H;
      const t = vis ? Math.max(0, Math.min(1, (H * .98 - c) / (H * .27))) : 0; // written in full once it has climbed to about 70% of the screen
      for (let k = 0; k < n; k++) { const on = t > 0 && t > (k + .5) / (n + 1) * .95 + .02; if (L[k].classList.contains('on') !== on) L[k].classList.toggle('on', on); }
      q.classList.toggle('gone', !vis || (scrollY > 60 && c < H * .3));
    });
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick);
  new MutationObserver(kick).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  kick(); setTimeout(kick, 2200);
})();
