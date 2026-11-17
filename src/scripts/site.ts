import Lenis from 'lenis';
import { initHero, type HeroScene } from './hero-gl';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const desktop = matchMedia('(min-width: 861px)').matches;
const NATIVE: Record<string, 'dark' | 'light'> = { nocturne: 'dark', atelier: 'light', argent: 'dark' };

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

let hero: HeroScene | null = null;

/* ---------- Thème clair / sombre : révélation circulaire depuis le bouton ---------- */
function setTheme(next: 'light' | 'dark', from?: HTMLElement) {
  const apply = () => {
    root.dataset.theme = next;
    hero?.refresh();
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || reduced) return apply();
  if (from) {
    const r = from.getBoundingClientRect();
    root.style.setProperty('--tx', `${r.left + r.width / 2}px`);
    root.style.setProperty('--ty', `${r.top + r.height / 2}px`);
  }
  root.classList.add('vt-theme');
  doc.startViewTransition(apply).finished.finally(() => root.classList.remove('vt-theme'));
}
$$('[data-theme-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('moyo-theme', next);
    setTheme(next, b);
  }),
);

/* ---------- Sélecteur de piste DA (aperçu) ---------- */
const daButtons = $$<HTMLButtonElement>('[data-da-set]');
const syncDa = () => daButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.daSet === root.dataset.da)));
daButtons.forEach((b) =>
  b.addEventListener('click', () => {
    const da = b.dataset.daSet!;
    store.set('moyo-da', da);
    store.set('moyo-theme', NATIVE[da]);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const apply = () => { root.dataset.da = da; root.dataset.theme = NATIVE[da]; hero?.refresh(); syncDa(); };
    if (doc.startViewTransition && !reduced) { root.classList.add('vt-theme'); (doc.startViewTransition(apply) as any).finished.finally(() => root.classList.remove('vt-theme')); }
    else apply();
  }),
);
syncDa();
// Les liens internes gardent la piste choisie dans l'aperçu (le stockage local peut être bloqué)
if (daButtons.length) {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || a.target || !a.href || a.origin !== location.origin) return;
    const url = new URL(a.href);
    url.searchParams.set('da', root.dataset.da!);
    a.href = url.toString();
  }, true);
}

/* ---------- En-tête & menu mobile ---------- */
const header = document.querySelector<HTMLElement>('[data-header]');
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu]');
const mobileNav = document.querySelector<HTMLElement>('[data-mobile-nav]');
const toggleMenu = (open: boolean) => {
  menuBtn?.setAttribute('aria-expanded', String(open));
  mobileNav?.classList.toggle('is-open', open);
  if (menuBtn) menuBtn.textContent = open ? (root.lang === 'fr' ? 'Fermer' : 'Close') : 'Menu';
  document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn?.addEventListener('click', () => toggleMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

/* ---------- Horloge locale ---------- */
const clocks = $$('[data-clock]');
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat(root.lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
  const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 15000);
}

/* ---------- Défilement doux (bureau uniquement) ---------- */
if (fine && !reduced && !root.classList.contains('is-bare')) {
  const lenis = new Lenis({ duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // ancre de service : on ouvre le panneau ciblé puis on y glisse
  window.addEventListener('moyo:scrollto', (e) => lenis.scrollTo((e as CustomEvent).detail, { offset: -100 }));
}

/* ---------- Hero : scène WebGL + mise au point ---------- */
const heroEl = document.querySelector<HTMLElement>('[data-hero]');
if (heroEl) {
  const canvas = heroEl.querySelector<HTMLCanvasElement>('[data-gl]');
  const baseFocus = Number(heroEl.dataset.heroFocus || 1);
  const coarse = matchMedia('(pointer: coarse)').matches;
  const allowGL = desktop && !coarse && canvas;
  const startGL = () => { if (allowGL) hero = initHero(canvas!, { reduced, baseFocus }); };
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(startGL, { timeout: 800 });
  else setTimeout(startGL, 200);
  const focusIn = () => requestAnimationFrame(() => {
    heroEl.dataset.focus = 'done';
    if (baseFocus < 1) heroEl.querySelector<HTMLElement>('.hero__mark')?.style.setProperty('--focus-blur', `${(1 - baseFocus) * 22}px`);
  });
  (document.fonts?.ready ?? Promise.resolve()).then(focusIn);
  setTimeout(focusIn, 1500);
}

/* ---------- Accueil : bande de projets WebGL ---------- */
const ribbonCanvas = document.querySelector<HTMLCanvasElement>('[data-ribbon-canvas]');
const ribbonList = document.querySelector<HTMLElement>('[data-ribbon]');
if (ribbonCanvas && ribbonList) {
  const startRibbon = () => import('./ribbon').then(({ initRibbon }) => {
    if (!initRibbon(ribbonCanvas, ribbonList, { reduced })) root.classList.add('no-ribbon');
  });
  const whenIdle = () => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(startRibbon, { timeout: 1200 }) : setTimeout(startRibbon, 300));
  if (document.readyState === 'complete') whenIdle(); else window.addEventListener('load', whenIdle, { once: true });
}

/* ---------- Boucle de défilement : manifeste, parallaxe, hero, en-tête ---------- */
const manifesto = document.querySelector<HTMLElement>('[data-manifesto]');
const words = manifesto ? $$('.w', manifesto) : [];
if (manifesto && desktop && !reduced) manifesto.setAttribute('data-scrub', '');
else words.forEach((w) => w.style.setProperty('--o', '1'));
const parallax = reduced ? [] : $$('[data-parallax]');
const mark = heroEl?.querySelector<HTMLElement>('.hero__mark');
let lastY = 0, ticking = false;

function onScroll() {
  const y = scrollY, vh = innerHeight;
  if (header) {
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > vh * 0.6 && y > lastY && !mobileNav?.classList.contains('is-open'));
  }
  lastY = y;
  if (heroEl && !reduced && y < vh * 1.2) {
    const f = 1 - clamp(y / (vh * 0.85));
    hero?.setFocus(0.25 + 0.75 * f);
    if (mark && heroEl.dataset.focus === 'done') {
      mark.style.transition = 'none';
      mark.style.setProperty('--mark-y', `${y * 0.35}px`);
      mark.style.setProperty('--focus-blur', `${(1 - f) * 14}px`);
    }
  }
  if (manifesto?.hasAttribute('data-scrub')) {
    const r = manifesto.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh));
    const n = words.length;
    words.forEach((w, i) => w.style.setProperty('--o', String(clamp(p * n * 1.2 - i, 0.4, 1))));
  }
  for (const img of parallax) {
    const r = img.parentElement!.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) continue;
    const p = clamp((vh - r.top) / (vh + r.height));
    img.style.setProperty('--py', `${-14 + p * 14}%`);
  }
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- Révélation des images ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
);
$$('[data-reveal]').forEach((el) => io.observe(el));

/* ---------- Curseur ---------- */
const cursor = document.querySelector<HTMLElement>('.cursor');
if (cursor && fine) {
  root.classList.add('has-cursor');
  const label = cursor.querySelector<HTMLElement>('.cursor__label')!;
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; cursor.classList.add('is-visible'); }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const lab = t.closest<HTMLElement>('[data-cursor]');
    const link = t.closest('a, button, summary, label, [role="button"]');
    cursor.classList.toggle('is-label', !!lab);
    cursor.classList.toggle('is-link', !lab && !!link);
    label.textContent = lab?.dataset.cursor ?? '';
  });
  const k = reduced ? 1 : 0.2;
  const loop = () => {
    cx += (x - cx) * k; cy += (y - cy) * k;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------- Filtres projets ---------- */
const filters = document.querySelector<HTMLElement>('[data-filters]');
if (filters) {
  const cards = $$<HTMLElement>('[data-card]', filters);
  const chips = $$<HTMLButtonElement>('[data-filter]', filters);
  const status = filters.querySelector<HTMLElement>('[data-status]')!;
  const empty = filters.querySelector<HTMLElement>('[data-empty]')!;
  const count = document.querySelector<HTMLElement>('[data-count]');
  const tpl = filters.dataset.statusTemplate || '{n}';
  const params = new URLSearchParams(location.search);
  const state = { d: params.get('d') || '', s: params.get('s') || '' };
  const valid = (k: 'd' | 's', v: string) => chips.some((c) => c.dataset.filter === k && c.dataset.value === v);
  if (!valid('d', state.d)) state.d = '';
  if (!valid('s', state.s)) state.s = '';

  const apply = (animate: boolean) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(state[c.dataset.filter as 'd' | 's'] === c.dataset.value)));
    let n = 0;
    cards.forEach((card) => {
      const ok = (!state.d || card.dataset.disciplines!.split(' ').includes(state.d)) && (!state.s || card.dataset.sectors!.split(' ').includes(state.s));
      if (ok) n++;
      if (!animate || reduced) { card.hidden = !ok; return; }
      if (ok && card.hidden) {
        card.classList.add('is-leaving');
        card.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-leaving')));
      } else if (!ok && !card.hidden) {
        card.classList.add('is-leaving');
        setTimeout(() => { card.hidden = true; card.classList.remove('is-leaving'); }, 600);
      }
    });
    empty.hidden = n > 0;
    status.textContent = tpl.replace('{n}', String(n));
    if (count) count.textContent = String(n);
    try {
      const q = new URLSearchParams();
      if (state.d) q.set('d', state.d);
      if (state.s) q.set('s', state.s);
      if (root.dataset.da && daButtons.length) q.set('da', root.dataset.da);
      history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
    } catch { /* cadre restreint */ }
  };
  chips.forEach((c) => c.addEventListener('click', () => { state[c.dataset.filter as 'd' | 's'] = c.dataset.value || ''; apply(true); }));
  apply(false);
}

/* ---------- Services : ouvrir le panneau ciblé par l'ancre ---------- */
const openTarget = () => {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id && document.getElementById(id);
  if (el instanceof HTMLDetailsElement) {
    el.open = true;
    setTimeout(() => window.dispatchEvent(new CustomEvent('moyo:scrollto', { detail: el })), 50);
  }
};
openTarget();
window.addEventListener('hashchange', openTarget);

/* ---------- Formulaire de contact ---------- */
const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
if (form) {
  const msg = (k: string) => form.dataset[`msg${k}`] || '';
  const statusEl = form.querySelector<HTMLElement>('[data-status]')!;
  const started = form.querySelector<HTMLInputElement>('[data-started]');
  if (started) started.value = String(Date.now());
  const setError = (name: string, text: string) => {
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    const err = form.querySelector<HTMLElement>(`#e-${name}`);
    input?.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (err) err.textContent = text;
  };
  const validate = () => {
    const data = new FormData(form);
    let first: string | null = null;
    const check = (name: string, ok: boolean, text: string) => { setError(name, ok ? '' : text); if (!ok && !first) first = name; };
    check('name', String(data.get('name') || '').trim().length > 1, msg('Required'));
    const email = String(data.get('email') || '').trim();
    check('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), email ? msg('Email') : msg('Required'));
    check('message', String(data.get('message') || '').trim().length > 9, msg('Required'));
    check('consent', data.get('consent') === '1', msg('Consent'));
    if (first) (form.elements.namedItem(first) as HTMLElement)?.focus();
    return !first;
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (form.dataset.preview) { statusEl.dataset.state = ''; statusEl.textContent = msg('Preview'); return; }
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    btn.disabled = true;
    statusEl.dataset.state = '';
    statusEl.textContent = msg('Sending');
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || res.statusText);
      form.reset();
      statusEl.dataset.state = 'ok';
      statusEl.textContent = msg('Sent');
    } catch {
      statusEl.dataset.state = 'error';
      statusEl.textContent = msg('Failed');
      (window as any).turnstile?.reset?.();
    } finally {
      btn.disabled = false;
    }
  });
}
