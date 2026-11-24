/* The way, on the home: a line in the margin, one stop per section, the dot travels on it as you read.
   Hover or keyboard: the names of the stops. Small screens: a pill with the current section, which opens the list.
   Over the footer only the dot is left: it goes into the eye of the wordmark (eyes.js). The other pages have a breadcrumb (.crumbs) and a next stop (.next). */
(() => {
'use strict';
const IDS = ['top', 'projets', 'services', 'methode', 'studio', 'equipe', 'contact'];
const els = IDS.map(id => document.getElementById(id));
if (els.some(e => !e)) return;
const NAME = { fr: ['Accueil', 'Projets', 'Services', 'Méthode', 'Studio', 'Équipe', 'Contact'], en: ['Home', 'Projects', 'Services', 'Method', 'Studio', 'Team', 'Contact'] };
const root = document.documentElement, lang = () => root.lang === 'en' ? 'en' : 'fr';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const nav = document.createElement('nav');
nav.className = 'path'; nav.id = 'path';
nav.innerHTML = `<i class="path-l"></i><button type="button" class="path-b" aria-expanded="false" aria-controls="pathList"></button>
<ol id="pathList">${IDS.map((id, i) => `<li><a href="#${id}" style="--i:${i}"><span></span></a></li>`).join('')}</ol><i class="path-d"></i><span class="path-h" aria-hidden="true"></span>`;
document.querySelector('.under').after(nav);
const links = [...nav.querySelectorAll('a')], here = nav.querySelector('.path-h'), btn = nav.querySelector('.path-b'), foot = document.getElementById('foot');
function label() {
  const l = lang(); nav.setAttribute('aria-label', l === 'en' ? 'Where you are' : 'Où vous êtes');
  links.forEach((a, i) => { a.firstElementChild.textContent = NAME[l][i]; });
  if (cur >= 0) { here.textContent = cur ? NAME[l][cur] : ''; btn.textContent = NAME[l][cur]; }
}
let ready = false; (window.moyoReady || Promise.resolve()).then(() => { ready = true; read(); });
let cur = -1, tops = [], pos = 0, goal = 0, raf = 0, h = 0, swap = 0;
function measure() { tops = els.map(moyoTop); h = nav.clientHeight; read(); }
function read() {
  const H = innerHeight, y = scrollY + H * .5 * clamp(scrollY / (H * .5)), n = els.length; // the reading line: from the top of the screen to its middle during the first scroll
  let i = 0; while (i < n - 1 && y >= tops[i + 1]) i++;
  const end = tops[i + 1] ?? Infinity, f = i < n - 1 ? clamp((y - tops[i]) / (end - tops[i])) : 0;
  goal = (i + f) / (n - 1);
  const ft = foot.getBoundingClientRect().top;
  nav.classList.toggle('on', ready && ft > H * .5 && (innerWidth > 820 || scrollY > H * .55)); nav.classList.toggle('end', ready && ft <= H * .5); // at the end of the way only the dot is left (eyes.js takes it)
  if (ft <= H * .5) nav.classList.remove('open');
  if (i !== cur) {
    cur = i;
    links.forEach((a, k) => { a.classList.toggle('past', k <= i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    nav.style.setProperty('--ho', '0'); clearTimeout(swap); swap = setTimeout(() => { label(); nav.style.setProperty('--ho', '1'); }, reduce ? 0 : 220);
    btn.textContent = NAME[lang()][i];
  }
  if (!raf) raf = requestAnimationFrame(move);
}
function move() {
  raf = 0;
  pos += (goal - pos) * (reduce ? 1 : .16); if (Math.abs(goal - pos) < .0004) pos = goal;
  nav.style.setProperty('--py', (pos * h).toFixed(2) + 'px'); nav.style.setProperty('--pp', pos.toFixed(4));
  if (pos !== goal) raf = requestAnimationFrame(move);
}
btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
const shut = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
nav.addEventListener('click', e => { if (e.target.closest('a')) shut(); });
document.addEventListener('pointerdown', e => { if (!nav.contains(e.target)) shut(); });
addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
addEventListener('scroll', read, { passive: true });
addEventListener('resize', measure);
new ResizeObserver(measure).observe(document.querySelector('.under'));
new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['lang'] });
measure(); label();
})();
