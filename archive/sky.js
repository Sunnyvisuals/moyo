/* The sky over the studio: the hour there, and what the sun is about to do (soramoyō, the look of the sky: it is in the name).
   The sun is computed here from the date and the place (the usual sunrise equation, a minute or two close); nothing is asked to anyone. */
(() => {
'use strict';
const box = document.getElementById('sky'); if (!box) return;
const LAT = 43.7, LON = 7.27, ZONE = 'Europe/Paris', DAY = 864e5, rad = Math.PI / 180, sin = d => Math.sin(d * rad), cos = d => Math.cos(d * rad);
/* sunrise and sunset of a day (its noon, UTC) */
function sun(noon) {
  const n = Math.round(noon / DAY + 2440587.5 - 2451545), j = n - LON / 360, m = (357.5291 + .98560028 * j) % 360, c = 1.9148 * sin(m) + .02 * sin(2 * m) + .0003 * sin(3 * m), l = (m + c + 282.9372) % 360;
  const top = 2451545 + j + .0053 * sin(m) - .0069 * sin(2 * l), d = Math.asin(sin(l) * sin(23.4397)) / rad, w = Math.acos((sin(-.833) - sin(LAT) * sin(d)) / (cos(LAT) * cos(d))) / rad, ms = x => (x - 2440587.5) * DAY;
  return [ms(top - w / 360), ms(top + w / 360)];
}
const day = t => { const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t).split('-').map(Number); return Date.UTC(y, m - 1, d, 12); };
const hour = (t, en) => { if (en) return new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit' }).format(t).toLowerCase(); const p = Object.fromEntries(new Intl.DateTimeFormat('fr-FR', { timeZone: ZONE, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).formatToParts(t).map(x => [x.type, x.value])); return `${+p.hour} h ${p.minute}`; };
const still = matchMedia('(prefers-reduced-motion: reduce)').matches, nb = x => x.replace(/(\d) (h|am|pm)/g, '$1 $2').replace(/(h) (\d)/g, '$1 $2');
let said = '', time = null;
/* the hour rolls when the minute changes, like the names of the team */
function roll(h) {
  const was = time.textContent; time.textContent = h; if (!was || still || document.hidden) return;
  const old = document.createElement('i'); old.textContent = was; old.setAttribute('aria-hidden', 'true'); old.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap'; const now = document.createElement('i'); now.style.display = 'inline-block'; now.textContent = h; time.textContent = ''; time.append(now, old);
  const o = { duration: 700, easing: 'cubic-bezier(.65,0,.15,1)', fill: 'both' }; now.animate([{ translate: '0 100%' }, { translate: '0 0' }], o); old.animate([{ translate: '0 0' }, { translate: '0 -100%' }], o).finished.then(() => { time.textContent = h; }).catch(() => {});
}
function say() {
  const en = document.documentElement.lang === 'en', t = Date.now(), noon = day(t), [up, down] = sun(noon), near = x => Math.abs(t - x) < 6e5;
  const s = near(up) ? (en ? 'The sun is rising' : 'Le soleil se lève') : near(down) ? (en ? 'The sun is setting' : 'Le soleil se couche') : t > up && t < down ? (en ? 'The sun sets at ' : 'Le soleil se couche à ') + hour(down, en) : (en ? 'The sun rises at ' : 'Le soleil se lève à ') + hour(t < up ? up : sun(noon + DAY)[0], en);
  const h = nb(hour(t, en)); if (said === h + s) return; said = h + s;
  if (!time) { box.innerHTML = '<time style="position:relative;display:inline-block;overflow:clip;vertical-align:top"></time><small></small>'; time = box.firstChild; }
  roll(h); box.lastChild.textContent = nb(s);
}
say(); setInterval(() => { if (!document.hidden) say(); }, 5000); document.addEventListener('visibilitychange', say);
new MutationObserver(say).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
