/* The way, on the home: one line and one dot in the margin, nothing else. The dot travels on the line as you read.
   Only a sheet of glass passes over it and covers it (the projects, the studio, the footer: stack.js); it is born again on the new one: the dot draws the
   line as it comes down. Going back up, it is found again under the sheet that leaves. Between two sheets it stays; over the film of the method, what
   is over the picture is white.
   Pointed at, or reached with the keyboard, the line opens: the names of the sections, and the dot goes to the one you point at.
   Small screens: the dot only, under the thumb; touched, it opens the names above it. Over the footer only the dot is left: it goes into the eye of the
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
nav.innerHTML = `<button type="button" class="path-b" aria-expanded="false" aria-controls="pathL"></button><ol id="pathL">${IDS.map((id, i) => `<li><a href="#${id}" style="--i:${i}"><span></span></a></li>`).join('')}</ol><span class="path-v"><i class="path-l"></i><i class="path-d"></i></span><span class="path-v w"><i class="path-l"></i><i class="path-d"></i></span>`; // in its colours, and in white over the film
const under = document.querySelector('.under'), layers = root.classList.contains('stack');
layers ? under.append(nav) : under.after(nav);
if (layers) els.forEach((e, i) => { e.style.zIndex = 2 * i + 1; }); // the sections are layers, one over the other: the way goes between two of them
const btn = nav.querySelector('.path-b'), links = [...nav.querySelectorAll('a')], foot = document.getElementById('foot');
function label() { const l = lang(); nav.setAttribute('aria-label', l === 'en' ? 'Where you are' : 'Où vous êtes'); btn.setAttribute('aria-label', l === 'en' ? 'Go to a section' : 'Aller à une section'); links.forEach((a, i) => { a.firstElementChild.textContent = NAME[l][i]; }); }

let cur = -1, tops = [], pos = 0, way = 0, raf = 0, over = -1, ready = false, leave = 0, gates = [], navTop = 0, navLeft = 0, navH = 0, navW = 0, at = -1, want = -1, inT = 0, outT = 0;
const G = els.map((e, i) => i).filter(i => !i || els[i].matches('.over')), END = G.length, FILM = G.findLastIndex(i => i <= IDS.indexOf('methode')); // what covers the way: the first screen, then the sheets; past the last one, the footer
function read() {
  const H = innerHeight, sy = scrollY, y = sy + H * .5 * clamp(sy / (H * .5)); // the reading line: from the top of the screen to its middle during the first scroll
  let i = 0; while (i < last && y >= tops[i + 1]) i++;
  const end = tops[i + 1] ?? Infinity;
  way = (i + (i < last ? clamp((y - tops[i]) / (end - tops[i])) : 0)) / last;
  nav.classList.toggle('end', ready && foot.getBoundingClientRect().top <= H * .5); // at the end of the way its dot becomes an eye (eyes.js)
  if (i !== cur) { cur = i; links.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  if (small.matches && nav.classList.contains('open') && Math.abs(sy - openY) > 30) shut();
  if (!ready) return;
  if (!layers) { nav.classList.toggle('on', !nav.classList.contains('end') && !(small.matches && !cur)); return kick(); }
  let g = 0; while (g < END && sy >= gates[g + 1]) g++; // the last sheet that has come up past the way
  settle(g); tint();
  nav.style.setProperty('--cv', g < END - 1 ? clamp((H - tops[G[g + 1]] + sy) / H).toFixed(3) : 0); // it fades as the next one comes
  kick();
}
/* the film goes under it: inside its edges, the way is white */
function tint() {
  const e = at === 0 && window.moyoEye ? moyoEye() : null; nav.classList.toggle('eyed', !!e);
  if (e) { // the eye of the first screen: white inside its circle, or everywhere when a picture is all around it
    const x = (e.x - navLeft).toFixed(1), y = (e.y - navTop).toFixed(1), r = e.r.toFixed(1), d = (e.r * 2).toFixed(1);
    nav.style.setProperty('--wc', e.back ? 'inset(-9999px)' : `circle(${r}px at ${x}px ${y}px)`);
    nav.style.setProperty('--ic', e.back ? 'inset(50%)' : `path(evenodd,"M-9999 -9999H9999V9999H-9999ZM${(e.x - navLeft - e.r).toFixed(1)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 -${d} 0Z")`);
    return nav.classList.toggle('film', e.back || Math.hypot(e.x - navLeft - navW / 2, e.y - navTop - navH / 2) < e.r);
  }
  const f = at === FILM && window.moyoFilm ? moyoFilm() : null, y = f ? Math.round(f.top - navTop) : 9999, x = f ? Math.round(f.right - navLeft) : 9999;
  nav.style.setProperty('--fy', Math.min(9999, y) + 'px'); nav.style.setProperty('--fx', x + 'px'); nav.classList.toggle('film', y < navH / 2 && x > navW / 2);
}
/* which sheet it is on: above its sections, under the next sheet */
function put(k) { at = k; nav.style.zIndex = 2 * (G[k + 1] ?? IDS.length); nav.dataset.at = IDS[G[k]]; tint(); }
function settle(k) {
  if (k === want) return; const first = want < 0; want = k; clearTimeout(inT); clearTimeout(outT);
  const down = k > at; nav.classList.remove('on', 'back', 'out');
  if (k === END || small.matches && !k) { if (!k) at = 0; return shut(); } // under the footer; on a small screen, the first sentence has its own point
  if (first || down) { put(k); inT = setTimeout(() => appear(true), first ? 0 : 130); } // it was covered: it is born again on this one
  else if (at === k) appear(false); // it was under the sheet that goes back
  else { nav.classList.add('out'); outT = setTimeout(() => { put(k); appear(false); }, 190); }
}
function appear(anew) { nav.classList.remove('out'); nav.classList.toggle('back', !anew); nav.classList.add('on'); pos = way; kick(); }
function move(t) {
  raf = 0; const dt = Math.min(.05, (t - (then || t)) / 1000) || .012; then = t;
  const goal = over >= 0 ? over / last : small.matches && nav.classList.contains('open') ? cur / last : way;
  pos += (goal - pos) * (reduce ? 1 : 1 - Math.exp(-dt * (over >= 0 ? 13 : 10))); if (Math.abs(goal - pos) < .0004) pos = goal;
  nav.style.setProperty('--p', pos.toFixed(4));
  if (pos !== goal) raf = requestAnimationFrame(move); else then = 0;
}
let then = 0;
function kick() { if (!raf) raf = requestAnimationFrame(move); }

/* open and shut */
let openY = 0;
function open() { clearTimeout(leave); openY = scrollY; nav.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); kick(); }
function shut() { clearTimeout(leave); over = -1; nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); kick(); }
btn.addEventListener('click', () => nav.classList.contains('open') ? shut() : open());
nav.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !small.matches) open(); });
nav.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !small.matches) { over = -1; kick(); clearTimeout(leave); leave = setTimeout(shut, 160); } });
nav.addEventListener('pointerdown', e => { if (!small.matches && e.pointerType !== 'mouse' && !e.target.closest('a')) nav.classList.contains('open') ? shut() : open(); });
nav.addEventListener('click', e => { if (small.matches && e.target === nav) shut(); }); // a touch beside the names closes them, and opens nothing under them
nav.addEventListener('focusin', () => { if (root.classList.contains('kbd')) { nav.classList.add('top'); if (!small.matches) open(); } }); // reached with the keyboard, it is above everything
nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget)) { nav.classList.remove('top'); if (!nav.matches(':hover')) shut(); } });
links.forEach((a, i) => {
  a.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { over = i; kick(); } });
  a.addEventListener('focus', () => { if (root.classList.contains('kbd')) { over = i; kick(); } });
  a.addEventListener('click', () => { over = -1; if (small.matches || !nav.matches(':hover')) shut(); kick(); });
});
document.addEventListener('pointerdown', e => { if (!nav.contains(e.target)) shut(); });
addEventListener('keydown', e => { if (e.key !== 'Escape' || !nav.classList.contains('open')) return; if (small.matches && nav.contains(document.activeElement)) btn.focus(); shut(); });

function measure() {
  const r = nav.getBoundingClientRect(); tops = els.map(moyoTop); navTop = r.top; navLeft = r.left; navH = r.height; navW = r.width;
  /* the scroll from which a sheet has passed the way: once its glass has */
  const line = navTop - 24, fog = e => e.querySelector('.mist')?.offsetHeight || 0;
  gates = G.map((i, k) => !k ? -1e9 : tops[i] + fog(els[i]) - line);
  gates.push(foot.getBoundingClientRect().top + scrollY + fog(foot) - line); read();
}
(window.moyoReady || Promise.resolve()).then(() => { ready = true; measure(); });
addEventListener('load', measure);
addEventListener('scroll', read, { passive: true });
addEventListener('moyo:eye', () => { if (ready && at === 0) tint(); });
addEventListener('resize', measure);
new ResizeObserver(measure).observe(under);
new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['lang'] });
measure(); label();
})();
