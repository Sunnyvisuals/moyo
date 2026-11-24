/* Page runtime, the same on every page: language, scroll and anchors, optical alignment of titles, the agency statement,
   project list + filters + sheet, contact form. The header, the menu and the footer have their own files (chrome.js, footer.js). */
(() => {
'use strict';
const root = document.documentElement;
root.classList.add('js');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const json = id => { try { return JSON.parse($('#' + id).textContent); } catch (_) { return null; } };
__RENDER__
const main = $('#main'), EN = json('en') || {};
let lang = root.lang === 'en' ? 'en' : 'fr';

/* ---------- Projects ---------- */
const DATA = json('moyo-data') || { categories: [], projects: [] };
const list = $('#projects'), filters = $('#filters');
const ALL = list ? (filters ? DATA.projects || [] : featuredOf(DATA)) : [];
let cat = filters ? new URLSearchParams(location.search).get('cat') || 'all' : 'all';
if (cat !== 'all' && !DATA.categories.some(c => c.id === cat)) cat = 'all';
const visible = () => ALL.map((p, i) => i).filter(i => cat === 'all' || ALL[i].category === cat);

function renderFilters() {
  const btn = (id, label, n) => `<button type="button" data-cat="${escHTML(id)}" aria-pressed="${id === cat}"${n ? '' : ' disabled'}>${escHTML(label)}<span class="n">${n}</span></button>`;
  filters.innerHTML = btn('all', lang === 'en' ? 'All' : 'Tous', ALL.length) +
    DATA.categories.map(c => btn(c.id, catLabel(DATA, c.id, lang), ALL.filter(p => p.category === c.id).length)).join('');
}
function applyFilter() {
  const vis = new Set(visible()), n = vis.size;
  $$('#projects > li').forEach((li, i) => { li.hidden = !vis.has(i); });
  $$('button', filters).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  $('#empty').hidden = n > 0;
  $('#count').textContent = (lang === 'en' ? `${n} project${n > 1 ? 's' : ''}` : `${n} projet${n > 1 ? 's' : ''}`) + (cat === 'all' ? '' : ', ' + catLabel(DATA, cat, lang));
}
if (filters) filters.addEventListener('click', e => {
  const b = e.target.closest('button[data-cat]');
  if (!b || b.dataset.cat === cat) return;
  cat = b.dataset.cat;
  const u = new URL(location.href); if (cat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', cat);
  history.replaceState(null, '', u);
  if (!document.startViewTransition || reduce) return applyFilter();
  const lis = $$('#projects > li');
  lis.forEach((li, i) => { li.style.viewTransitionName = 'p' + i; });
  const vt = document.startViewTransition(applyFilter);
  vt.ready.catch(() => {}); vt.finished.catch(() => {}).finally(() => lis.forEach(li => { li.style.viewTransitionName = ''; }));
});

/* ---------- Project sheet: rises over the page; previous and next stay inside the current filter ---------- */
const dlg = $('#proj');
let cur = 0, opener = null;
function fill(i) {
  cur = i; const p = ALL[i], t = txt(p, lang);
  $('#pTitle').textContent = t.title; $('#pDesc').textContent = t.desc;
  $('#pTag').textContent = [catLabel(DATA, p.category, lang), t.type].filter(Boolean).join(', ');
  $('#pRole').textContent = t.role; $('#pPlace').textContent = t.place; $('#pYear').textContent = p.year;
  $$('.facts > div', dlg).forEach(d => { d.hidden = !$('dd', d).textContent.trim(); });
  const pl = $('#pPlate'); pl.innerHTML = plateInner(p); pl.classList.toggle('plate--none', !p.cover);
  $('#pGallery').innerHTML = (p.images || []).map(id => `<img src="${imgURL(id)}" alt="" loading="lazy" decoding="async">`).join('');
  const v = visible(), at = v.indexOf(i), nx = ALL[v[(at + 1) % v.length]];
  $('#pPos').textContent = `${at + 1}/${v.length}`; $('#pNextT').textContent = txt(nx, lang).title; $('#pNext2').hidden = v.length < 2;
  dlg.scrollTop = 0; optical(dlg);
}
/* accordion (home, large screens): the card under the pointer or the focus opens. A finger opens it first, then opens the sheet. */
const wide = matchMedia('(min-width:821px)');
let armed = null;
if (list && !filters) {
  const cards = $$('#projects > .case'); let on = 0, lock = 0;
  list.style.setProperty('--n', cards.length);
  const set = i => { on = i; cards.forEach((c, k) => c.classList.toggle('on', k === i)); lock = performance.now() + 220; };
  set(0);
  cards.forEach((c, i) => {
    const plate = $('.plate', c), img = $('img', c);
    plate.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !wide.matches) return;
      if (i !== on && (e.movementX || e.movementY) && performance.now() > lock) set(i); // a card that slides under a still pointer does not open
      if (img && !reduce) { const r = plate.getBoundingClientRect(); img.style.setProperty('--px', ((e.clientX - r.left) / r.width * -24 + 12).toFixed(1) + 'px'); }
    });
    plate.addEventListener('pointerleave', () => { if (img) img.style.setProperty('--px', '0px'); });
    $('.row', c).addEventListener('focus', () => { if (root.classList.contains('kbd')) set(i); });
    c.addEventListener('click', e => { if (wide.matches && i !== on && !matchMedia('(hover:hover)').matches) { e.stopPropagation(); set(i); } }, true);
  });
}
function step(d) { const v = visible(), k = v.indexOf(cur); fill(v[(k + d + v.length) % v.length]); }
function closeSheet() {
  if (!window.hbOut || dlg.dataset.leaving) return dlg.close();
  dlg.dataset.leaving = '1';
  window.hbOut(dlg, () => { delete dlg.dataset.leaving; dlg.close(); });
}
if (dlg && list) {
  list.addEventListener('click', e => {
    const b = e.target.closest('.row'); if (!b) return;
    opener = b; fill(+b.dataset.p); dlg.showModal(); optical(dlg); root.classList.add('is-dialog'); lenis?.stop(); $('#pClose').focus({ preventScroll: true });
  });
  dlg.addEventListener('close', () => { root.classList.remove('is-dialog'); lenis?.start(); opener?.focus({ preventScroll: true }); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });
  $('#pClose').addEventListener('click', closeSheet);
  $('#pNext').addEventListener('click', () => step(1)); $('#pNext2').addEventListener('click', () => step(1));
  $('#pPrev').addEventListener('click', () => step(-1));
}

/* ---------- Optical alignment: the ink of the first letter sits on the axis, not its invisible side bearing ----------
   The letter is drawn once on a canvas and its empty columns are counted (the browser's own glyph boxes are too coarse).
   Also used by footer.js for the wordmark. */
const inkBox = window.moyoInk = (() => {
  const S = 400, cv = document.createElement('canvas'); cv.width = S * 2; cv.height = S * 2;
  const g = cv.getContext('2d', { willReadFrequently: true }), cache = new Map();
  return (ch, weight, family) => { // [left bearing, right bearing, advance], in em
    const key = weight + ch;
    if (cache.has(key)) return cache.get(key);
    g.clearRect(0, 0, S * 2, S * 2); g.font = `${weight} ${S}px ${family}`; g.textBaseline = 'alphabetic'; g.fillStyle = '#000';
    const x0 = S * .4; g.fillText(ch, x0, S * 1.4);
    const d = g.getImageData(0, 0, S * 2, S * 2).data, adv = g.measureText(ch).width;
    let a = -1, b = -1;
    for (let x = 0; x < S * 2; x++) { let on = false; for (let y = 0; y < S * 2 && !on; y++) on = d[(y * S * 2 + x) * 4 + 3] > 110; if (on) { if (a < 0) a = x; b = x + 1; } }
    const r = a < 0 ? [0, 0, adv / S] : [(a - x0) / S, (x0 + adv - b) / S, adv / S];
    if (document.fonts.check(`${weight} 20px ${family}`)) cache.set(key, r);
    return r;
  };
})();
function optical(scope) {
  $$('.t-hero,.t-xl,.t-l,.t-m,.nm,.r-title,.bn,.fh2', scope || document).forEach(el => {
    const ch = (el.textContent.trim().match(/\S/) || [''])[0]; if (!ch) return;
    const c = getComputedStyle(el), size = parseFloat(c.fontSize); if (size < 20) return;
    const bear = inkBox(ch, c.fontWeight, c.fontFamily)[0] * size;
    el.style.marginLeft = bear > .2 ? (-bear).toFixed(2) + 'px' : '';
  });
}

/* ---------- Leaving the tab: the dot closes its eye, and waits ---------- */
const icon = $('link[rel=icon]'), ICON = icon && icon.href; let page = document.title;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { page = document.title; document.title = lang === 'en' ? 'See you soon?' : 'On se voit ?'; if (icon) icon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23F5F4F0'/%3E%3Crect x='8' y='15' width='16' height='3' rx='1.5' fill='%23002FA7'/%3E%3C/svg%3E"; }
  else { document.title = page; if (icon) icon.href = ICON; }
});

/* ---------- Agency statement: each word is inked as it is read ---------- */
const say = $('#say');
let words = [];
function splitSay() {
  if (!say || reduce) return;
  const t = say.textContent.trim();
  say.innerHTML = `<span class="sr">${escHTML(t)}</span><span aria-hidden="true">${t.split(/\s+/).map(w => `<span class="w">${escHTML(w)}</span>`).join(' ')}</span>`;
  words = $$('.w', say); ink();
}
function ink() {
  if (!words.length) return;
  const r = say.getBoundingClientRect(), H = innerHeight;
  if (r.bottom < -H || r.top > H * 2) return;
  // it starts when the first line is well on screen and ends when the last one is
  const p = clamp((H * .84 - r.top) / (H * .16 + r.height)), n = words.length, reach = 7; // 7 words are being inked at a time
  words.forEach((w, i) => { const o = clamp((p * (n + reach) - i) / reach); w.style.setProperty('--o', (.16 + .84 * o).toFixed(3)); });
}

/* ---------- Language: French is in the page, English in #en. The choice is kept under "hb-lang". ---------- */
const store = new WeakMap();
const keep = (el, get) => { if (!store.has(el)) store.set(el, get()); return store.get(el); };
const own = el => !el.closest('#bar,#menu,#foot'); // those label themselves
function applyLang(l) {
  lang = l; if (root.lang !== l) root.lang = l;
  $$('[data-i]').filter(own).forEach(el => { const fr = keep(el, () => el.textContent), k = el.dataset.i; el.textContent = l === 'en' && EN[k] ? EN[k] : fr; });
  $$('[data-ia]').filter(own).forEach(el => { const fr = keep(el, () => el.getAttribute('aria-label')), k = el.dataset.ia; el.setAttribute('aria-label', l === 'en' && EN[k] ? EN[k] : fr); });
  $$('[data-fr][data-en]').forEach(el => { el.textContent = el.dataset[l] || el.dataset.fr; });
  if (list) $$('#projects > li').forEach((li, i) => { const p = ALL[i]; if (!p) return; const t = txt(p, l);
    $('.r-title', li).textContent = t.title; $('.r-desc', li).textContent = t.desc || ''; $('.r-type', li).textContent = t.type || ''; $('.r-meta', li).textContent = metaText(p, t); });
  if (filters) { renderFilters(); applyFilter(); document.title = (l === 'en' ? 'Projects' : 'Projets') + ' · Moyo Studio'; }
  if (dlg && dlg.open) fill(cur);
  splitSay(); optical();
  try { localStorage.setItem('hb-lang', l); } catch (_) {}
}
function swapLang(l) {
  if (l === lang) return;
  const run = () => applyLang(l);
  if (!document.startViewTransition || reduce) return run();
  let vt; try { vt = document.startViewTransition({ update: run, types: ['lang'] }); } catch (_) { vt = document.startViewTransition(run); }
  vt.ready.catch(() => {}); vt.finished.catch(() => {});
}
$$('.flang button').forEach(b => b.addEventListener('click', () => swapLang(b.dataset.l)));

/* ---------- Scroll: Lenis (MIT) for the mouse wheel, native on touch, none with reduced motion ---------- */
let lenis = null;
if (!reduce && typeof Lenis !== 'undefined') lenis = new Lenis({ lerp: .07, wheelMultiplier: .85, smoothWheel: true, autoRaf: true });
/* where a block really is in the page (the content is sticky under the footer, so its rectangle cannot be trusted there) */
function natural(el) { let y = 0, e = el; while (e && !e.classList.contains('under')) { y += e.offsetTop; e = e.offsetParent; } return y; }
window.moyoScroll = y => { if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4), force: true }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
function goTo(id) {
  const el = id === 'top' || id === 'main' || !id ? null : document.getElementById(id);
  const y = el ? Math.max(0, Math.round(natural(el) + (parseFloat(getComputedStyle(el).paddingTop) || 0) * .42)) : 0;
  const done = () => { if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } try { history.replaceState(null, '', el ? '#' + id : location.pathname + location.search); } catch (_) {} };
  if (lenis) lenis.scrollTo(y, { duration: clamp(1 + Math.abs(y - scrollY) / 3200, 1.2, 2.8), easing: t => 1 - Math.pow(1 - t, 4), force: true, onComplete: done });
  else { scrollTo(0, y); done(); }
}
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.target === '_blank' || a.classList.contains('skip')) return;
  let u; try { u = new URL(a.href, location.href); } catch (_) { return; }
  if (u.origin !== location.origin || u.pathname.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '')) return;
  const id = decodeURIComponent(u.hash.slice(1));
  if (id && !document.getElementById(id)) return;
  e.preventDefault();
  const menu = $('#menu');
  if (menu && menu.matches(':popover-open')) { menu.hidePopover(); setTimeout(() => goTo(id), 120); } else goTo(id);
});

/* the menu opens on the section being read (home) */
const SECTIONS = { services: 2, methode: 2, studio: 3, equipe: 4, contact: 5, projets: 1 };
const menuEl = $('#menu');
if (menuEl && $('#services')) menuEl.addEventListener('beforetoggle', e => {
  if (e.newState !== 'open') return;
  let k = 0; for (const id in SECTIONS) { const el = document.getElementById(id); if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= innerHeight * .5 && r.bottom > innerHeight * .5) k = SECTIONS[id]; }
  menuEl.dataset.start = k;
});

/* ---------- Contact ---------- */
const copy = $('#copy');
if (copy) copy.addEventListener('click', async () => {
  const en = lang === 'en', label = copy.textContent;
  const say2 = t => { copy.textContent = t; $('#copyMsg').textContent = t; setTimeout(() => { copy.textContent = lang === 'en' ? EN.copy : store.get(copy) || label; }, 2200); };
  try { await navigator.clipboard.writeText('contact.moyostudio@gmail.com'); say2(en ? 'Address copied' : 'Adresse copiée'); }
  catch (_) { say2(en ? 'Copy failed, select the address' : 'Copie impossible, sélectionnez l’adresse'); }
});
/* sent with fetch; without JavaScript the form posts normally and comes back with ?envoye=1 */
const form = $('#ctForm');
if (form) {
  const st = $('#ctStatus'), say3 = (t, err) => { st.textContent = t; st.classList.toggle('err', !!err); };
  const q = new URLSearchParams(location.search);
  if (q.has('envoye')) say3(lang === 'en' ? 'Message sent. Thank you!' : 'Message envoyé. Merci !');
  if (q.has('erreur')) say3(lang === 'en' ? 'The message could not be sent. Check the fields and try again.' : 'Le message n’a pas pu partir. Vérifiez les champs et réessayez.', true);
  // three dots, one per required field: what is started wants to be finished
  const dots = $('.f-dots', form), need = [['name', f => f.value.trim().length > 1], ['email', f => !!f.value && f.validity.valid && /\.[a-z]{2,}$/i.test(f.value.trim())], ['message', f => f.value.trim().length >= 10]];
  const fillDots = () => { let n = 0; need.forEach(([k, ok], i) => { const y = ok(form.elements[k]); n += y; dots.children[i].classList.toggle('ok', y); }); dots.classList.toggle('full', n === 3); };
  form.addEventListener('input', fillDots);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const en = lang === 'en', f = form.elements;
    [f.name, f.email, f.message].forEach(x => x.removeAttribute('aria-invalid'));
    const bad = !f.name.value.trim() ? f.name : !f.email.value || !f.email.validity.valid ? f.email : f.message.value.trim().length < 10 ? f.message : null;
    if (bad) {
      bad.setAttribute('aria-invalid', 'true'); bad.focus();
      return say3(bad === f.name ? (en ? 'Please enter your name.' : 'Indiquez votre nom.') : bad === f.email ? (en ? 'Please enter a valid email address.' : 'Indiquez une adresse e-mail valide.') : (en ? 'Your message is a little short.' : 'Votre message est un peu court.'), true);
    }
    const btn = $('.btn', form); btn.disabled = true; say3(en ? 'Sending…' : 'Envoi…');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), lang }) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.message || '');
      form.innerHTML = `<div class="f-done" tabindex="-1"><h3 class="t-m">${en ? 'Thank you. Message received.' : 'Merci. Message bien reçu.'}</h3><p>${en ? 'We will get back to you within 48 hours, at the address you gave.' : 'Nous vous répondons sous 48 heures, à l’adresse indiquée.'}</p></div>`;
      $('.f-done', form).focus({ preventScroll: true });
    } catch (err) {
      btn.disabled = false;
      say3(err.message || (en ? 'Sending failed. Write to contact.moyostudio@gmail.com.' : 'L’envoi a échoué. Écrivez à contact.moyostudio@gmail.com.'), true);
    }
  });
}

/* ---------- Start ---------- */
applyLang(lang);
document.fonts?.ready.then(() => optical());
let rt = 0, q2 = 0;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { optical(); ink(); }, 120); });
addEventListener('scroll', () => { if (!q2) q2 = requestAnimationFrame(() => { q2 = 0; ink(); }); }, { passive: true });
})();
