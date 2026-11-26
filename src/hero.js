/* First screen: the sentence is as large as the screen allows, like a poster. Its size is found by trying, the lines balance themselves and no
   word is ever cut: the largest size that fits the height left under the facts and the width of the page. Again when the screen, the fonts or the
   language change. Without JavaScript, the styles give a size close to it. window.moyoFit() does it at once (load.js, before it measures). */
(() => {
'use strict';
const hero = document.getElementById('top'), title = hero && hero.querySelector('h1'), top = hero && hero.querySelector('.hero-top');
if (!title || !top) return;
const probe = document.createElement('i'); probe.setAttribute('aria-hidden', 'true'); probe.style.cssText = 'position:absolute;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
hero.style.position = 'relative'; hero.appendChild(probe);
const st = document.createElement('style'); st.textContent = '.hero h1.fitting,.hero h1.fitting *{transition:none!important}'; document.head.appendChild(st); // a transition would give the old size back while measuring (with reduced motion they are all very short, not absent)
let last = '';
function fit() {
  const room = probe.offsetHeight, cs = getComputedStyle(hero), H = room - top.offsetHeight - (parseFloat(cs.paddingBottom) || 0) - (parseFloat(getComputedStyle(title).marginTop) || 0);
  const key = innerWidth + 'x' + room + title.textContent; if (key === last) return; last = key;
  const small = innerWidth <= 820, W = title.clientWidth, most = Math.min(W * (small ? .2 : .16), H * .5); // never larger than a fifth of the width
  title.classList.add('fitting');
  const rg = document.createRange(); rg.selectNodeContents(title);
  /* the words, cut at the spaces (a non-breaking space keeps two words together) */
  const words = []; for (const n of [...title.querySelectorAll('span')].flatMap(s => [...s.childNodes]).filter(n => n.nodeType === 3)) { let i = 0; for (const w of n.data.split(' ')) { if (w.trim()) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length); words.push(r); } i += w.length + 1; } }
  const alone = f => { const tops = words.map(r => Math.round(r.getClientRects()[0]?.top ?? 0)), rows = []; tops.forEach(t => { const o = rows.find(q => Math.abs(q.t - t) < f * .3); if (o) o.n++; else rows.push({ t, n: 1 }); }); return rows.slice(0, -1).some(q => q.n < 2); }; // a word alone on a line, except the last one
  const fits = f => { title.style.setProperty('--fit', f.toFixed(2) + 'px'); if (title.offsetHeight > H) return false; const a = title.getBoundingClientRect(), b = rg.getBoundingClientRect(); return b.right <= a.right + 1 && !alone(f); }; // the letters themselves, not what decorates them
  let lo = 24, hi = Math.max(lo, most);
  if (fits(hi)) lo = hi; else for (let i = 0; i < 14 && hi - lo > .5; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  title.style.setProperty('--fit', Math.floor(lo * 4) / 4 + 'px'); title.offsetHeight; title.classList.remove('fitting');}
window.moyoFit = fit;
let t = 0; const later = () => { clearTimeout(t); t = setTimeout(fit, 80); };
addEventListener('resize', later); new MutationObserver(later).observe(title, { subtree: true, characterData: true, childList: true });
document.fonts.ready.then(() => { last = ''; fit(); });
fit();
})();
