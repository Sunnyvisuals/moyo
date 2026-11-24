/* Sentences are inked as they are read: each letter goes from pale to Klein blue, then to its own colour, in a wave that follows the scroll
   (after the idea of the Framer component "Gradient Text Reveal": pale, middle colour, final colour; written for this site).
   Only for the sentences that speak: the statement of the studio, the four of the method, the invitation of the contact. Never titles.
   - data-ink="scroll": the wave follows the place of the text on screen. data-ink="step": method.js drives it (window.moyoWave).
   - Real text: a hidden copy for screen readers, the letters are only drawn. A language switch rewrites the text and it is split again.
   - Nothing with reduced motion or without JavaScript: the text is simply there. */
(() => {
'use strict';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), smooth = t => t * t * (3 - 2 * t);
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const KLEIN = [0, 47, 167], PAPER = [250, 250, 248], mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = css => (css.match(/[\d.]+/g) || [18, 18, 20]).slice(0, 3).map(Number);
let vel = 0, ly = scrollY, lt = 0; // how fast the page is being scrolled, in px per second
const st = document.createElement('style'); st.textContent = '.wd{white-space:nowrap}'; document.head.appendChild(st);

const hosts = [...document.querySelectorAll('[data-ink]')].filter(el => el.dataset.ink !== 'step' || el.closest('.live'))
  .map(el => ({ el, own: el.dataset.ink !== 'step', chars: [], p: 0, goal: 0, near: false, raf: 0, last: 0 }));

function split(h) {
  const boxes = [h.el, ...h.el.querySelectorAll('*')].filter(e => !e.closest('.ink,.sr') && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  boxes.forEach(c => { const t = c.textContent.replace(/[ \n\t]+/g, ' ').trim();
    c.innerHTML = `<span class="sr">${esc(t)}</span><span class="ink" aria-hidden="true">${t.split(' ').map(w => `<span class="wd">${[...w].map(x => `<span class="ch">${esc(x)}</span>`).join('')}</span>`).join(' ')}</span>`; });
  h.chars = [...h.el.querySelectorAll('.ch')].map(s => ({ s, end: rgb(getComputedStyle(s.parentElement).color), t: -1 }));
  h.chars.forEach(c => { c.start = mix(PAPER, c.end, .2); c.light = c.end[0] > 180; });
  h.time = h.own ? clamp(h.chars.length / 46, 3.2, 4.8) : clamp(h.chars.length / 30, 2.4, 4); // seconds the wave takes to cross the sentence, however fast the scroll is
  paint(h);
}
function paint(h) {
  const n = h.chars.length, reach = clamp(n * .34, 20, 62);
  for (let i = 0; i < n; i++) {
    const c = h.chars[i], t = Math.round(clamp((h.p * (n + reach) - i) / reach) * 60) / 60;
    if (t === c.t) continue; c.t = t;
    if (c.light) { c.s.style.color = t >= 1 ? '' : `rgb(${c.end[0]},${c.end[1]},${c.end[2]},${(.3 + .7 * smooth(t)).toFixed(3)})`; continue; } // white over a picture: from faint to full
    const k = t < .5 ? mix(c.start, KLEIN, smooth(t * 2)) : mix(KLEIN, c.end, smooth((t - .5) * 2));
    c.s.style.color = t >= 1 ? '' : `rgb(${k[0] | 0},${k[1] | 0},${k[2] | 0})`;
  }
}
function frame(h, now) {
  h.raf = 0; const dt = Math.min(.05, (now - (h.last || now)) / 1000) || .016; h.last = now;
  const fast = now - lt > 140 ? 0 : clamp((vel - 60) / 420), most = dt / h.time * (1 + 7 * (h.rush || 0) * fast), aim = h.goal >= 1 ? 1.12 : h.goal; h.p = clamp(h.p + clamp((aim - h.p) * (1 - Math.exp(-3.4 * dt)), -most, most)); if (Math.abs(h.goal - h.p) < .0008) h.p = h.goal; // slow: it glides after the scroll, and never runs
  paint(h);
  if (h.p !== h.goal) h.raf = requestAnimationFrame(t => frame(h, t)); else h.last = 0;
}
const kick = h => { if (!h.raf) h.raf = requestAnimationFrame(t => frame(h, t)); };
function read(h) { // starts when the first line comes in, ends when the last one is a little under the middle of the screen
  const r = h.el.getBoundingClientRect(), H = innerHeight;
  h.rush = clamp((H * .5 - (r.top + r.bottom) / 2) / (H * .35)); // slow when one stops to read; a sentence that leaves by the top without a stop is finished in time
  const g = clamp((H * .95 - r.top) / (H * .29 + r.height)); if (g !== h.goal) { h.goal = g; kick(h); }
}
window.moyoWave = (el, g) => { const h = hosts.find(x => x.el === el); if (h && h.goal !== g) { h.goal = g; kick(h); } };

hosts.forEach(h => {
  split(h);
  new MutationObserver(() => { if (!h.el.querySelector('.ink') || [...h.el.querySelectorAll('[data-i]')].some(e => !e.querySelector('.ink'))) split(h); }).observe(h.el, { childList: true, subtree: true });
  if (h.own) new IntersectionObserver(es => { h.near = es[es.length - 1].isIntersecting; if (h.near) read(h); }, { rootMargin: '20% 0px' }).observe(h.el);
});
const own = hosts.filter(h => h.own); let q = 0;
addEventListener('scroll', () => { const t = performance.now(); vel = vel * .6 + Math.abs(scrollY - ly) / Math.max(8, t - lt) * 400; ly = scrollY; lt = t; if (!q) q = requestAnimationFrame(() => { q = 0; own.forEach(h => { if (h.near) read(h); }); }); }, { passive: true });
dispatchEvent(new Event('scroll'));
})();
