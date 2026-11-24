/* Method: four steps. The section stays on screen while they pass with the scroll. The picture, the video or the GIF of the step (chosen in the
   admin) takes the whole screen, the next one rises over it, and the words are in white over them. A video is fetched when the section is near
   and plays only while its step is on screen. Without JavaScript or with reduced motion: a plain list of four steps, each with its picture. */
(() => {
'use strict';
const sec = document.getElementById('methode'), box = sec && sec.querySelector('.mth-s'), root = document.documentElement;
if (!box) return;
const steps = [...sec.querySelectorAll('.step')], films = steps.map(s => s.querySelector('video'));
if (!steps.length) return;
const fetchFilms = () => films.forEach(v => { if (v && !v.src && v.dataset.src) v.src = v.dataset.src; });
new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); document.readyState === 'complete' ? fetchFilms() : addEventListener('load', fetchFilms, { once: true }); } }, { rootMargin: '150% 0px' }).observe(sec);
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

const says = steps.map(s => s.querySelector('p')), tabs = [...sec.querySelectorAll('.tab')], pics = steps.map(s => s.querySelector('.mth-m'));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), n = steps.length, next = sec.nextElementSibling;
sec.classList.add('live');
const media = document.createElement('div'); media.className = 'mth-media'; box.prepend(media);
pics.forEach(f => { if (f) media.append(f); });
films.forEach(v => { if (v) { v.controls = false; v.muted = true; v.setAttribute('aria-hidden', 'true'); } });

let p = 0, on = false, cur = -2;
function read() {
  const H = innerHeight, r = sec.getBoundingClientRect(), pad = parseFloat(getComputedStyle(sec).paddingTop) || 0, top = r.top + pad, len = r.height - pad - H;
  p = clamp(-top / Math.max(1, len)) * n;
  const e = clamp(1 - top / (H * .62)); sec.style.setProperty('--e', (1 - Math.pow(1 - e, 2)).toFixed(4)); // the scene opens as it comes
  root.classList.toggle('on-film', top < H * .4 && (!next || next.getBoundingClientRect().top > H * .5)); // what is fixed over the picture turns white
  const k = Math.min(n - 1, Math.floor(Math.min(p, n - .001) + .16)), here = top < H * .3;
  const now = here ? k : -1;
  if (now !== cur) { cur = now;
    steps.forEach((s, i) => { s.classList.toggle('now', i === now); s.classList.toggle('was', i < now); });
    tabs.forEach((s, i) => s.classList.toggle('now', i === now));
    pics.forEach((f, i) => { if (f) { f.classList.toggle('in', i <= Math.max(0, now)); f.classList.toggle('was', i < now); } }); // the first one is there from the start
    play(); }
  tabs.forEach((s, i) => s.style.setProperty('--f', clamp(p - i).toFixed(3)));
  if (window.moyoWave) says.forEach((e, i) => moyoWave(e, i <= now ? 1 : 0)); // the sentence of the step is inked once it is there, slowly (ink.js)
}
/* the film of the step plays, the one before ends its way out, the others wait; the next one is fetched ahead */
function play() {
  const at = Math.max(0, cur);
  films.forEach((v, i) => { if (!v) return;
    if (on && i === at) { fetchFilms(); v.preload = 'auto'; v.play().catch(() => {}); }
    else if (!on || Math.abs(i - at) > 1) v.pause(); else { if (i === at + 1) v.preload = 'auto'; setTimeout(() => { if (i !== Math.max(0, cur)) v.pause(); }, 1700); } });
}
new IntersectionObserver(es => { on = es[es.length - 1].isIntersecting; read(); play(); if (!on) root.classList.remove('on-film'); }, { rootMargin: '10% 0px' }).observe(sec);
document.addEventListener('visibilitychange', () => { if (document.hidden) films.forEach(v => v && v.pause()); else play(); });
addEventListener('scroll', () => { if (on) read(); }, { passive: true });
addEventListener('resize', read);
/* a tab goes to its step (site.js owns the smooth scroll) */
tabs.forEach((b, i) => b.addEventListener('click', () => { const pad = parseFloat(getComputedStyle(sec).paddingTop) || 0, y = moyoTop(sec) + pad + (sec.offsetHeight - pad - innerHeight) * (i + .3) / n; (window.moyoScroll || (v => scrollTo(0, v)))(y); }));
read(); dispatchEvent(new Event('resize')); // the title is smaller now: its optical margin is measured again (site.js)
})();
