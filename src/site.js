/* Page runtime, the same on every page: language, scroll and anchors, optical alignment of titles,
   project list + filters + sheet, services, contact form. The header, the menu and the footer have their own files (chrome.js, footer.js). */
(() => {
'use strict';
const root = document.documentElement;
root.classList.add('js');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* View Transitions, where they are safe: WebKit (Safari, every browser on iPhone) crashes on the second one of this page (seen on WebKit 27.2) and has a simple version instead */
const VT = !!document.startViewTransition && !reduce && !/Apple/.test(navigator.vendor || '');
const json = id => { try { return JSON.parse($('#' + id).textContent); } catch (_) { return null; } };
__RENDER__
const main = $('#main'), EN = json('en') || {};
let lang = root.lang === 'en' ? 'en' : 'fr';
/* French at /…, English at /en/… : the address and the links follow the language of the page */
const served = root.dataset.served === 'en' ? 'en' : 'fr', bare = p => p.replace(/^\/en(?=\/|$)/, '') || '/', local = (p, l = lang) => l === 'en' ? '/en' + (p === '/' ? '' : p) : p;
const TITLE = { fr: document.title, en: EN._title || document.title };
function place(l) {
  const here = location.pathname.replace(/(.)\/$/, '$1'), want = local(bare(here), l);
  if (want !== here) try { history.replaceState(history.state, '', want + location.search + location.hash); } catch (_) {}
  $$('a[href^="/"]').forEach(a => { const h = a.getAttribute('href'); if (/^\/(api|admin|proj|img)(\/|$)/.test(h)) return;
    const f = h.replace(/^\/en(?=[\/?#]|$)/, ''), p = f === '' || f[0] !== '/' ? '/' + f : f; const t = l === 'en' ? '/en' + (p === '/' ? '' : /^\/[#?]/.test(p) ? p.slice(1) : p) : p; if (t !== h) a.setAttribute('href', t); });
}

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
  if (!VT) { applyFilter(); if (!reduce) $$('#projects > li:not([hidden])').forEach((li, i) => li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: Math.min(i * 40, 240), fill: 'backwards', easing: 'ease' })); return; }
  const lis = $$('#projects > li');
  lis.forEach((li, i) => { li.style.viewTransitionName = 'p' + i; });
  const vt = document.startViewTransition(applyFilter);
  vt.ready.catch(() => {}); vt.finished.catch(() => {}).finally(() => lis.forEach(li => { li.style.viewTransitionName = ''; }));
});

/* a service that has projects leads to them, and says how many */
$$('.la[data-cat]').forEach(a => {
  const n = (DATA.projects || []).filter(p => p.category === a.dataset.cat).length;
  if (!n) return a.removeAttribute('href');
  a.setAttribute('href', local('/projets?cat=' + encodeURIComponent(a.dataset.cat)));
  const k = document.createElement('span'); k.className = 'n'; k.setAttribute('aria-hidden', 'true'); k.textContent = n; a.after(k);
});

/* ---------- Project sheet: opens from its card; previous and next stay inside the current filter. Each project has its own address (/projets/id,
   a real page for a shared link, a new tab or a reload): the Back button closes the sheet. ---------- */
const dlg = $('#proj');
let cur = 0, opener = null, pushed = false, openCard = null, plain = false;
const PAGE = bare(location.pathname), BEHIND = '.under,#foot,#path,.skip'; // the page the sheet opens over, and what can no longer be reached while it is open
function fill(i) {
  cur = i; const p = ALL[i], t = txt(p, lang);
  $('#pTitle').textContent = $('#pHere').textContent = t.title; $('#pDesc').textContent = t.desc;
  $('#pTag').textContent = [catLabel(DATA, p.category, lang), t.type].filter(Boolean).join(', ');
  $('#pRole').textContent = t.role; $('#pPlace').textContent = t.place; $('#pYear').textContent = p.year;
  $$('.facts > div', dlg).forEach(d => { d.hidden = !$('dd', d).textContent.trim(); });
  const pl = $('#pPlate'); pl.className = 'plate c5' + (p.cover ? '' : ' plate--none'); pl.style.removeProperty('--dx'); pl.style.removeProperty('--dy'); pl.innerHTML = plateInner(p, t.title);
  const im = $('img', pl), known = cardOf(i) && $('img', cardOf(i)); if (im) { im.loading = 'eager'; im.decoding = 'sync'; if (known && known.naturalWidth) { im.width = known.naturalWidth; im.height = known.naturalHeight; } }
  $('#pGallery').innerHTML = galleryHTML(p, t.title);
  const v = visible(), at = v.indexOf(i), nx = ALL[v[(at + 1) % v.length]];
  $('#pNextT').textContent = txt(nx, lang).title; $('#pNext2').hidden = v.length < 2;
  document.title = t.title + ' · Moyo Studio';
  [nx, ALL[v[(at - 1 + v.length) % v.length]]].forEach(q => { if (q.cover) new Image().src = imgURL(q.cover); }); // the next ones are ready
  dlg.scrollTop = 0; optical(dlg);
}
/* accordion (home, large screens): the card under the pointer or the focus opens. A finger opens it first, then opens the sheet. */
const wide = matchMedia('(min-width:821px)');
if (list && !filters) {
  const cards = $$('#projects > .case'); let on = 0, lock = 0;
  list.style.setProperty('--n', cards.length);
  const set = i => { on = i; cards.forEach((c, k) => c.classList.toggle('on', k === i)); lock = performance.now() + 220; };
  openCard = set; set(0);
  cards.forEach((c, i) => {
    const plate = $('.plate', c), img = $('img', c);
    plate.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !wide.matches) return;
      if (i !== on && (e.movementX || e.movementY) && performance.now() > lock && !list.querySelector('.dvc')) set(i); // a card that slides under a still pointer does not open
      if (img && !reduce) { const r = plate.getBoundingClientRect(); img.style.setProperty('--px', ((e.clientX - r.left) / r.width * -24 + 12).toFixed(1) + 'px'); }
    });
    plate.addEventListener('pointerleave', () => { if (img) img.style.setProperty('--px', '0px'); });
    $('.row', c).addEventListener('focus', () => { if (root.classList.contains('kbd')) set(i); });
    c.addEventListener('click', e => { if (wide.matches && i !== on && !matchMedia('(hover:hover)').matches) { e.preventDefault(); e.stopPropagation(); set(i); } }, true);
  });
}
const cardOf = i => list && $$('#projects > li')[i];
const asked = () => { const m = bare(location.pathname).match(/^\/projets\/([^/]+)\/?$/); return m ? ALL.findIndex(p => p.id === decodeURIComponent(m[1])) : -1; }; // the project of the address
const address = id => new URL(local('/projets/' + encodeURIComponent(id)), location.origin);
/* the picture of the card becomes the picture of the sheet, and goes back to it. Where the browser cannot, the sheet rises. */
function morph(open, i, update) {
  const plate = cardOf(i) && $('.plate', cardOf(i)), mine = $('#pPlate'), r = plate && plate.getBoundingClientRect();
  const can = VT && r && r.width > 24 && r.top < innerHeight - 60 && r.bottom > 60 && (open || dlg.scrollTop < innerHeight * .6);
  if (!can) return false;
  root.style.setProperty('--vt', `${Math.max(0, r.top).toFixed(0)}px ${Math.max(0, innerWidth - r.right).toFixed(0)}px ${Math.max(0, innerHeight - r.bottom).toFixed(0)}px ${Math.max(0, r.left).toFixed(0)}px`);
  if (window.moyoDivide && plate.classList.contains('dv')) moyoDivide(plate, 'end');
  root.style.setProperty('--vp', ALL[i].cover ? '50% 8%' : '50% 50%');
  root.classList.add('vt-sheet'); root.classList.toggle('vt-in', open);
  (open ? plate : mine).style.viewTransitionName = 'shot';
  const vt = document.startViewTransition(async () => {
    plate.style.viewTransitionName = mine.style.viewTransitionName = ''; update(); (open ? mine : plate).style.viewTransitionName = 'shot';
    const im = open && $('img', mine); if (im) await Promise.race([im.decode().catch(() => {}), new Promise(done => setTimeout(done, 400))]);
  });
  const skip = () => vt.skipTransition(); ['pointerdown', 'keydown'].forEach(n => addEventListener(n, skip)); // a second click does not wait
  vt.ready.catch(() => {});
  vt.finished.catch(() => {}).finally(() => { plate.style.viewTransitionName = mine.style.viewTransitionName = ''; root.classList.remove('vt-sheet', 'vt-in'); ['pointerdown', 'keydown'].forEach(n => removeEventListener(n, skip)); });
  return true;
}
function openSheet(i, push) {
  const show = () => { fill(i); dlg.show(); optical(dlg); root.classList.add('is-dialog'); $$(BEHIND).forEach(e => { e.inert = true; }); lenis?.stop(); $('.sheet-t', dlg).focus({ preventScroll: true }); dispatchEvent(new Event('moyo:sheet')); };
  if (push) { history.pushState({ projet: ALL[i].id }, '', address(ALL[i].id)); pushed = true; }
  opener = cardOf(i) && $('.row', cardOf(i));
  if (!push || !morph(true, i, show)) show();
}
let stepping = false;
function step(d) { // the words go one way and the next ones come from the other; the picture goes back to one dot, the next one is born from it
  const v = visible(), n = v[(v.indexOf(cur) + d + v.length) % v.length]; if (n === cur || stepping) return;
  const turn = () => { fill(n); history.replaceState(history.state, '', address(ALL[n].id)); };
  if (reduce) return turn();
  stepping = true;
  const pl = $('#pPlate'), far = dlg.scrollTop > innerHeight * .8, words = $$('.sheet-t,.sheet-g>:not(.plate)', dlg), divide = window.moyoDivide;
  const out = words.map((el, i) => el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${d * -26}px 0` }], { duration: 230, delay: i * 24, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
  if (divide && $('img', pl)) pl.classList.add('dv', 'born');
  const r = pl.getBoundingClientRect(), from = [r.left + r.width / 2, r.top + r.height / 2];
  Promise.all([...out.map(a => a.finished), divide && $('img', pl) && !far ? divide(pl, 'dot') : 0]).catch(() => {}).then(() => {
    turn(); stepping = false; out.forEach(a => a.cancel());
    if (divide && $('img', pl)) divide(pl, true, { p: 0, ms: 900, from: far ? undefined : from });
    words.forEach((el, i) => el.animate([{ opacity: 0, translate: `${d * 40}px 0` }, { opacity: 1, translate: '0 0' }], { duration: 760, delay: i * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  });
}
function hideSheet() { // really closes it: the address has already changed
  if (!dlg.open || dlg.dataset.leaving) return;
  opener = (cardOf(cur) && $('.row', cardOf(cur))) || opener;
  if (openCard && wide.matches) { list.classList.add('still'); openCard(cur); list.offsetWidth; }
  const end = () => { delete dlg.dataset.leaving; dlg.close(); };
  if (plain || !morph(false, cur, end)) { if (!window.hbOut) end(); else { dlg.dataset.leaving = '1'; window.hbOut(dlg, end); } }
  if (list) requestAnimationFrame(() => list.classList.remove('still'));
}
const closeSheet = () => { if (pushed) history.back(); else hideSheet(); };
function leaveSheet(then) { plain = true; dlg.addEventListener('close', () => { plain = false; setTimeout(then, 60); }, { once: true }); closeSheet(); } // to another place of the page
if (dlg && list) {
  list.addEventListener('click', e => { const b = e.target.closest('.row'); if (!b || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); openSheet(+b.dataset.p, true); }); // a new tab gets the page
  dlg.addEventListener('close', () => {
    root.classList.remove('is-dialog'); $$(BEHIND).forEach(e => { e.inert = false; }); lenis?.start(); document.title = TITLE[lang]; place(lang); dispatchEvent(new Event('moyo:sheet'));
    opener?.focus({ preventScroll: true });
  });
  addEventListener('keydown', e => { // Escape closes, the arrows go from one project to the next
    if (!dlg.open || $('#menu')?.matches(':popover-open') || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') closeSheet(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
  });
  $('#pNext2').addEventListener('click', () => step(1));
  addEventListener('popstate', () => { const i = asked(); if (i < 0) { pushed = false; hideSheet(); } else if (!dlg.open) { pushed = true; openSheet(i, false); } else if (i !== cur) fill(i); });
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
  if (document.hidden) { page = document.title; document.title = lang === 'en' ? 'And your idea?' : 'Et votre idée ?'; if (icon) icon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23FAFAF8'/%3E%3Crect x='8' y='15' width='16' height='3' rx='1.5' fill='%23002FA7'/%3E%3C/svg%3E"; }
  else { document.title = page; if (icon) icon.href = ICON; }
});

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
  if (filters) { renderFilters(); applyFilter(); }
  document.title = TITLE[l];
  if (dlg && dlg.open) fill(cur); else place(l); // the sheet has its own address
  optical();
}
function swapLang(l) {
  if (l === lang) return;
  try { localStorage.setItem('hb-lang', l); } catch (_) {}
  if (served === 'en' && l === 'fr') { location.href = bare(location.pathname) + location.search + location.hash; return; } // the French words are on the French page
  const run = () => applyLang(l);
  if (!VT) { if (reduce) return run(); const all = $$('.under,#foot,#menu .menu-in'); Promise.all(all.map(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease', fill: 'forwards' }).finished)).catch(() => {}).then(o => { run(); all.forEach(e => e.getAnimations().forEach(a => a.cancel())); all.forEach(e => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease' })); }); return; }
  let vt; try { vt = document.startViewTransition({ update: run, types: ['lang'] }); } catch (_) { vt = document.startViewTransition(run); }
  vt.ready.catch(() => {}); vt.finished.catch(() => {});
}
$$('.flang button').forEach(b => b.addEventListener('click', () => swapLang(b.dataset.l)));

/* ---------- Scroll: Lenis (MIT) for the mouse wheel, native on touch, none with reduced motion ---------- */
let lenis = null;
if (!reduce && typeof Lenis !== 'undefined') lenis = new Lenis({ lerp: .07, wheelMultiplier: .85, smoothWheel: true, autoRaf: true });
window.moyoScroll = y => { if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4), force: true }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
function goTo(id) {
  const el = id === 'top' || id === 'main' || !id ? null : document.getElementById(id);
  // a sheet that passes over a screen is read once its glass edge has gone up: the title sits just under the header
  const pad = el ? parseFloat(getComputedStyle(el).paddingTop) || 0 : 0, glass = el && root.classList.contains('stack') && el.matches('.over') ? (el.querySelector('.mist') || 0).offsetHeight || 0 : 0;
  const y = el ? Math.max(0, Math.round(moyoTop(el) + (el.matches('.mth.live') ? pad : glass ? glass - (innerWidth > 820 ? 96 : 64) : pad * .42))) : 0;
  const done = () => { if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } try { history.replaceState(null, '', el ? '#' + id : location.pathname + location.search); } catch (_) {} };
  if (lenis) lenis.scrollTo(y, { duration: clamp(1 + Math.abs(y - scrollY) / 3200, 1.2, 2.8), easing: t => 1 - Math.pow(1 - t, 4), force: true, onComplete: done });
  else { scrollTo(0, y); done(); }
}
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.target === '_blank' || a.classList.contains('skip')) return;
  const sheet = dlg && dlg.open;
  if (sheet && a.matches('[data-close]')) { e.preventDefault(); return closeSheet(); } // back to where one comes from
  let u; try { u = new URL(a.href, location.href); } catch (_) { return; }
  if (u.origin !== location.origin || u.pathname.replace(/\/$/, '') !== (sheet ? local(PAGE) : location.pathname).replace(/\/$/, '')) return;
  const id = decodeURIComponent(u.hash.slice(1));
  if (id && !document.getElementById(id)) return;
  e.preventDefault();
  const menu = $('#menu'), go = () => sheet ? leaveSheet(() => goTo(id)) : goTo(id);
  if (menu && menu.matches(':popover-open')) { menu.hidePopover(); setTimeout(go, 120); } else go();
});

/* the menu opens on the section being read (home) */
const SECTIONS = { projets: 1, services: 2, methode: 2, studio: 3, equipe: 4, contact: 5 }; // in the order of the page: the last one on screen is the one on top
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
  // what is wrong is said next to its field, when the field is left or the form is sent, and taken back as soon as it is right
  const ERR = { name: ['Indiquez votre nom.', 'Please enter your name.'], email: ['Indiquez une adresse complète, par exemple nom@domaine.fr.', 'Please enter a full address, for example name@domain.com.'], message: ['Encore quelques mots : dix caractères au minimum.', 'A few more words: ten characters at least.'] };
  const OK = { name: f => !!f.value.trim(), email: need[1][1], message: need[2][1] };
  const mark = (k, bad) => { const f = form.elements[k]; if (bad) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); $('#e-' + k).textContent = bad ? ERR[k][lang === 'en' ? 1 : 0] : ''; };
  form.addEventListener('input', e => { fillDots(); const k = e.target.name; if (OK[k] && e.target.hasAttribute('aria-invalid') && OK[k](e.target)) { mark(k, false); say3(''); } });
  form.addEventListener('focusout', e => { const k = e.target.name; if (OK[k] && e.target.value.trim() && !OK[k](e.target)) mark(k, true); });
  new MutationObserver(() => Object.keys(OK).forEach(k => { if (form.elements[k]?.hasAttribute('aria-invalid')) mark(k, true); })).observe(root, { attributes: true, attributeFilter: ['lang'] });
  // what is being written survives a reload or a visit to another page: kept in this tab only, forgotten once sent
  const values = () => { const fd = new FormData(form), o = {}; for (const k of new Set(fd.keys())) if (k !== 'website') { const x = fd.getAll(k).filter(Boolean); if (x.length) o[k] = k === 'type' ? x : x[0]; } return o; };
  const DRAFT = 'moyo-brouillon', read = () => { try { return JSON.parse(sessionStorage.getItem(DRAFT)) || {}; } catch (_) { return {}; } };
  const keepDraft = () => { try { sessionStorage.setItem(DRAFT, JSON.stringify(values())); } catch (_) {} };
  Object.entries(read()).forEach(([k, x]) => $$(`[name="${k}"]`, form).forEach(f => { if (/radio|checkbox/.test(f.type)) f.checked = [].concat(x).includes(f.value); else if (!f.value && typeof x === 'string') f.value = x; }));
  ['input', 'change'].forEach(n => form.addEventListener(n, keepDraft)); fillDots();
  // the budget: pressed again it is taken back, and the point can be dragged along its line
  const scale = $('#scale'), stops = $$('label:not(.tbd) input', scale);
  let was = null, held = null;
  const set = r => { if (!r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } };
  scale.addEventListener('pointerdown', e => { const r = e.target.closest('label')?.querySelector('input'); was = r && r.checked ? r : null; held = e.pointerType !== 'touch' && e.button === 0 && r && stops.includes(r) ? { x: e.clientX, y: e.clientY, on: false } : null; });
  scale.addEventListener('click', e => { const r = e.target; if (r.type === 'radio' && was === r) { r.checked = false; was = null; keepDraft(); } });
  addEventListener('pointermove', e => {
    if (!held) return;
    if (!held.on && Math.hypot(e.clientX - held.x, e.clientY - held.y) < 8) return;
    held.on = true; was = null;
    const near = stops.map(r => { const b = r.getBoundingClientRect(); return [Math.abs(e.clientX - b.left) + (innerWidth > 620 ? 0 : Math.abs(e.clientY - b.top - b.height / 2) * 4), r]; }).sort((p, q) => p[0] - q[0])[0][1];
    set(near); near.focus({ preventScroll: true });
  }, { passive: true });
  ['pointerup', 'pointercancel'].forEach(n => addEventListener(n, () => { held = null; }));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const en = lang === 'en', wrong = Object.keys(OK).filter(k => { const bad = !OK[k](form.elements[k]); mark(k, bad); return bad; });
    if (wrong.length) { form.elements[wrong[0]].focus(); return say3(en ? (wrong.length > 1 ? `${wrong.length} fields to check.` : 'One field to check.') : (wrong.length > 1 ? `${wrong.length} champs à vérifier.` : 'Un champ à vérifier.'), true); }
    const btn = $('.send', form), label = $('.nm', btn), was = ($('.r1', label) || label).textContent; btn.disabled = true; btn.classList.add('busy'); label.textContent = en ? 'Sending' : 'Envoi'; say3('');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values(), website: form.elements.website.value, lang }) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.message || '');
      try { sessionStorage.removeItem(DRAFT); } catch (_) {}
      // the word leaves, the thanks take its place
      btn.classList.remove('busy'); btn.classList.add('sent'); say3(''); await new Promise(f => setTimeout(f, reduce ? 0 : 480));
      form.innerHTML = `<div class="f-done" tabindex="-1"><h3 class="t-xl">${en ? 'Thank you' : 'Merci'}<i class="dot">&#8288;<b></b></i></h3><p>${en ? 'Your message has arrived. We will get back to you within 48 hours, at the address you gave.' : 'Votre message est bien arrivé. Nous vous répondons sous 48 heures, à l’adresse indiquée.'}</p></div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => $('.f-done .dot', form)?.classList.add('in')));
      $('.f-done', form).focus({ preventScroll: true });
    } catch (err) {
      btn.disabled = false; btn.classList.remove('busy'); label.textContent = was;
      say3(err.message || (en ? 'Sending failed. Write to contact.moyostudio@gmail.com.' : 'L’envoi a échoué. Écrivez à contact.moyostudio@gmail.com.'), true);
    }
  });
}

/* the pictures of the accordion are decoded once the page is quiet, not during the first scroll */
if (list && !filters) addEventListener('load', () => (window.requestIdleCallback || (f => setTimeout(f, 600)))(() => $$('#projects img').forEach(i => { i.loading = 'eager'; i.decode?.().catch(() => {}); })), { once: true });

/* ---------- Start ---------- */
applyLang(lang);
document.fonts?.ready.then(() => optical());
let rt = 0;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(optical, 120); });
})();
