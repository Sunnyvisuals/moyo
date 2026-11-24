/* The way, on the home: one line and one dot in the margin, nothing else. The dot travels on the line as you read.
   Pointed at, or reached with the keyboard, the line opens: the names of the sections, and the dot goes to the one you point at.
   Small screens: the line and its dot only (the menu has the names). Over the footer only the dot is left: it goes into the eye of the
   wordmark (eyes.js). The other pages have a breadcrumb (.crumbs) and a next stop (.next). */
(() => {
'use strict';
const IDS = ['top', 'projets', 'services', 'methode', 'studio', 'equipe', 'contact'];
const els = IDS.map(id => document.getElementById(id));
if (els.some(e => !e)) return;
const NAME = { fr: ['Accueil', 'Projets', 'Services', 'Méthode', 'Studio', 'Équipe', 'Contact'], en: ['Home', 'Projects', 'Services', 'Method', 'Studio', 'Team', 'Contact'] };
const root = document.documentElement, lang = () => root.lang === 'en' ? 'en' : 'fr';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = matchMedia('(max-width:820px)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), last = IDS.length - 1;

const nav = document.createElement('nav');
nav.className = 'path'; nav.id = 'path';
nav.innerHTML = `<ol>${IDS.map((id, i) => `<li><a href="#${id}" style="--i:${i}"><span></span></a></li>`).join('')}</ol><i class="path-l"></i><i class="path-d"></i>`;
document.querySelector('.under').after(nav);
const links = [...nav.querySelectorAll('a')], foot = document.getElementById('foot');
function label() { const l = lang(); nav.setAttribute('aria-label', l === 'en' ? 'Where you are' : 'Où vous êtes'); links.forEach((a, i) => { a.firstElementChild.textContent = NAME[l][i]; }); }

let cur = -1, tops = [], pos = 0, way = 0, raf = 0, over = -1, ready = false, leave = 0;
function read() {
  const H = innerHeight, y = scrollY + H * .5 * clamp(scrollY / (H * .5)); // the reading line: from the top of the screen to its middle during the first scroll
  let i = 0; while (i < last && y >= tops[i + 1]) i++;
  const end = tops[i + 1] ?? Infinity;
  way = (i + (i < last ? clamp((y - tops[i]) / (end - tops[i])) : 0)) / last;
  const on = ready && foot.getBoundingClientRect().top > H * .5;
  nav.classList.toggle('on', on); nav.classList.toggle('end', ready && !on); // at the end of the way only the dot is left (eyes.js takes it)
  if (!on && nav.classList.contains('open')) shut();
  if (i !== cur) { cur = i; links.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  kick();
}
function move() {
  raf = 0;
  const goal = over >= 0 ? over / last : way;
  pos += (goal - pos) * (reduce ? 1 : over >= 0 ? .2 : .16); if (Math.abs(goal - pos) < .0004) pos = goal;
  nav.style.setProperty('--p', pos.toFixed(4));
  if (pos !== goal) raf = requestAnimationFrame(move);
}
function kick() { if (!raf) raf = requestAnimationFrame(move); }

/* open and shut */
function open() { clearTimeout(leave); if (!small.matches) nav.classList.add('open'); }
function shut() { clearTimeout(leave); over = -1; nav.classList.remove('open'); kick(); }
nav.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') open(); });
nav.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { over = -1; kick(); clearTimeout(leave); leave = setTimeout(shut, 160); } });
nav.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && !e.target.closest('a')) nav.classList.contains('open') ? shut() : open(); });
nav.addEventListener('focusin', () => { if (root.classList.contains('kbd')) open(); });
nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget) && !nav.matches(':hover')) shut(); });
links.forEach((a, i) => {
  a.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { over = i; kick(); } });
  a.addEventListener('focus', () => { if (root.classList.contains('kbd')) { over = i; kick(); } });
  a.addEventListener('click', () => { over = -1; if (!nav.matches(':hover')) shut(); kick(); });
});
document.addEventListener('pointerdown', e => { if (!nav.contains(e.target)) shut(); });
addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });

function measure() { tops = els.map(moyoTop); if (small.matches) nav.setAttribute('aria-hidden', 'true'); else nav.removeAttribute('aria-hidden'); read(); }
(window.moyoReady || Promise.resolve()).then(() => { ready = true; read(); });
addEventListener('scroll', read, { passive: true });
addEventListener('resize', measure);
new ResizeObserver(measure).observe(document.querySelector('.under'));
new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['lang'] });
measure(); label();
})();
