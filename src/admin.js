/* Admin. What is seen is what is edited: each view has the layout of the page it changes. Nothing is online until « Publier ».
   A working copy (data) is compared with the last published one; what is not published is kept in this browser as a draft. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], root = document.documentElement;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const imgURL = id => id && (id[0] === '/' || id.startsWith('http')) ? id : '/img/' + encodeURIComponent(id);
const isVideo = id => /\.(mp4|webm)$/i.test(id || ''), isGif = id => /\.gif$/i.test(id || '');
const mo = n => (n / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Mo';
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const HEAD = { 'X-Moyo-Admin': '1' }, DRAFT = 'moyo-admin-brouillon', SEEN = 'moyo-admin-vus';
const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} } };
const dot = '<i class="dot">⁠<b></b></i>';

let me = {}, data = null, saved = '', savedImages = new Set(), msgs = null, lang = 'fr', route = [], offered = null;

/* ---------- server ---------- */
async function api(path, opt = {}) {
  let r; try { r = await fetch(path, { credentials: 'same-origin', ...opt, headers: { ...HEAD, ...(opt.headers || {}) } }); } catch (_) { throw new Error('Le serveur ne répond pas. Vérifiez la connexion.'); }
  let b = null; try { b = await r.json(); } catch (_) {}
  if (r.status === 401 && path !== '/api/login' && data) { showLogin('login', 'La session a expiré. Votre brouillon est gardé.'); throw new Error('401'); }
  if (!r.ok) throw new Error((b && b.message) || 'Erreur ' + r.status);
  return b;
}
const post = (path, body, method = 'POST') => api(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
/* upload with its progress */
const send = (body, type, progress) => new Promise((ok, no) => {
  const x = new XMLHttpRequest(); x.open('POST', '/api/images'); x.setRequestHeader('X-Moyo-Admin', '1'); x.setRequestHeader('Content-Type', type);
  if (progress) x.upload.onprogress = e => { if (e.lengthComputable) progress(Math.round(e.loaded / e.total * 100)); };
  x.onload = () => { let r = null; try { r = JSON.parse(x.responseText); } catch (_) {} if (x.status === 401) { showLogin('login', 'La session a expiré. Votre brouillon est gardé.'); return no(new Error('401')); } x.status < 300 && r?.id ? ok(r.id) : no(new Error(r?.message || 'Erreur ' + x.status)); };
  x.onerror = () => no(new Error('L’envoi a échoué. Vérifiez la connexion.')); x.send(body);
});

/* ---------- messages, questions ---------- */
let toastT;
function toast(text, bad) { const t = $('#toast'); t.innerHTML = `<p${bad ? ' class="err"' : ''}>${esc(text)}</p>`; clearTimeout(toastT); toastT = setTimeout(() => { t.textContent = ''; }, bad ? 7000 : 3400); }
const fail = e => { if (e.message !== '401') toast(e.message, true); };
function ask(title, text, yes, no = 'Garder', danger = true) {
  const d = $('#ask'); $('#askT').textContent = title; $('#askP').textContent = text || ''; $('#askY span').textContent = yes; $('#askN').textContent = no; $('#askY').className = 'btn' + (danger ? ' red' : '');
  return new Promise(done => { let r = false; const y = () => { r = true; d.close(); }, n = () => d.close(); $('#askY').onclick = y; $('#askN').onclick = n; d.onclick = e => { if (e.target === d && e.clientY < d.getBoundingClientRect().top) d.close(); }; d.onclose = () => done(r); d.showModal(); $('#askN').focus(); });
}

/* =====================================================================================================
   Password
   ===================================================================================================== */
const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
/* the password never leaves this page as it is: it is stretched first, and only the result is sent */
async function stretch(pw, salt, iter) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw.normalize('NFC')), 'PBKDF2', false, ['deriveBits']); return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(salt), iterations: iter }, k, 256)); }
const proofOf = async pw => me.salt ? { proof: await stretch(pw, me.salt, me.iter) } : { password: pw };
const newOne = async pw => { const salt = b64(crypto.getRandomValues(new Uint8Array(16))), iter = 600000; return { salt, iter, proof: await stretch(pw, salt, iter) }; };
const COMMON = ['motdepasse', 'motdepasse1', 'password', 'password1', 'azertyuiop', 'qwertyuiop', '1234567890', '0123456789', 'administrateur', 'moyostudio', 'moyomoyomoyo'];
const kinds = p => [/[a-zà-ÿ]/, /[A-ZÀ-Ý]/, /\d/, /[^\p{L}\d]/u].filter(r => r.test(p)).length;
const strength = p => [p.length >= 5, p.length >= 10, p.length >= 10 && (kinds(p) >= 3 || p.length >= 16), p.length >= 14 && kinds(p) >= 2].filter(Boolean).length;
const weak = p => p.length < 10 ? 'Dix caractères au minimum.' : COMMON.includes(p.toLowerCase().replace(/\s/g, '')) || /^(.)\1+$/.test(p) ? 'Celui-ci est trop connu.' : '';
const pwField = (id, label, auto, extra = '') => `<div class="fld"><label class="fl" for="${id}">${label}</label><div class="pwd"><input id="${id}" type="password" autocomplete="${auto}" autocapitalize="off" spellcheck="false" required aria-describedby="${id}E"><button type="button" class="tx" data-eye="${id}" aria-pressed="false">Afficher</button></div>${extra}<small class="f-err" id="${id}E"></small></div>`;
const meter = id => `<div class="str" data-str="${id}"><span class="f-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>Dix caractères au minimum. Une phrase se retient mieux qu’un code.</span></div>`;
const user = '<input type="text" name="username" autocomplete="username" value="moyo" class="sr" tabindex="-1" aria-hidden="true">';
const err = (id, t) => { const e = $('#' + id + 'E'), f = $('#' + id); if (e) e.textContent = t || ''; if (f) t ? f.setAttribute('aria-invalid', 'true') : f.removeAttribute('aria-invalid'); };
document.addEventListener('click', e => { const b = e.target.closest('[data-eye]'); if (!b) return; const f = $('#' + b.dataset.eye), on = f.type === 'password'; f.type = on ? 'text' : 'password'; b.textContent = on ? 'Masquer' : 'Afficher'; b.setAttribute('aria-pressed', String(on)); f.focus(); });
document.addEventListener('input', e => { const s = $(`[data-str="${e.target.id}"]`); if (s) { const n = strength(e.target.value); $$('i', s).forEach((i, k) => i.classList.toggle('ok', k < n)); } if (e.target.matches('.pwd input')) err(e.target.id, ''); });

/* The wordmark of the login page: the two o look at the pointer, shut while a hidden password is being written, look at it when it is shown, and say no */
const eyes = (() => {
  const mono = $('#look'), els = $$('.eye', mono).map(el => ({ el, pu: $('.pu', el), x: 0, y: 0, lid: 1 }));
  let RX = 0, RY = 0, PR = 0, ptr = null, raf = 0, last = 0, no = -1e9, blink = 0, next = 2600;
  function fit() {
    const S = 400, cv = document.createElement('canvas'), W = cv.width = S * 4, H = cv.height = S * 2, g = cv.getContext('2d', { willReadFrequently: true }), X0 = S * .3, Y0 = S * 1.2;
    const C = getComputedStyle(mono), font = `700 ${S}px ${C.fontFamily}`, scan = t => { g.clearRect(0, 0, W, H); g.font = font; g.fillText(t, X0, Y0); return g.getImageData(0, 0, W, H).data; }, on = (d, x, y) => d[((y | 0) * W + (x | 0)) * 4 + 3] > 110;
    if ('fontKerning' in g) g.fontKerning = 'none'; if ('letterSpacing' in g) g.letterSpacing = (-.055 * S) + 'px'; // each letter is on its own in the page
    let d = scan('moyo'), a = W, b = 0; for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x++) if (on(d, x, y)) { if (x < a) a = x; if (x > b) b = x; }
    if (b > a) { mono.style.setProperty('--mono-k', (S / (b - a)).toFixed(5)); mono.style.setProperty('--mono-l', (-(a - X0) / S).toFixed(4)); }
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    d = scan('o'); let x0 = W, x1 = 0, y0 = H, y1 = 0; for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (on(d, x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; let rx = 0, ry = 0; while (rx < S && !on(d, cx + rx, cy)) rx++; while (ry < S && !on(d, cx, cy + ry)) ry++;
    const FS = parseFloat(getComputedStyle(mono).fontSize), e = els[0].el, probe = document.createElement('i'); probe.style.cssText = 'display:inline-block;width:0;height:0'; e.appendChild(probe);
    const base = (probe.getBoundingClientRect().bottom - e.getBoundingClientRect().top) / FS; probe.remove();
    const pr = Math.min(rx, ry) / S * .58, set = (k, v) => mono.style.setProperty(k, v); set('--ecx', ((cx - X0) / S).toFixed(4)); set('--ecy', (base - (Y0 - cy) / S).toFixed(4)); set('--ecr', (Math.max(x1 - x0, y1 - y0) / 2 / S).toFixed(4)); set('--epr', pr.toFixed(4)); set('--erx', (rx / S).toFixed(4)); set('--ery', (ry / S).toFixed(4));
    RX = rx / S * FS; RY = ry / S * FS; PR = pr * FS;
  }
  function frame(t) {
    raf = 0; if ($('#login').hidden) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    const f = document.activeElement, pw = f && f.matches('.pwd input'), hiddenPw = pw && f.type === 'password' && f.value.length > 0, r = f && f.matches('input:not([type=checkbox]):not(.sr)') ? f.getBoundingClientRect() : null;
    if (t > next) { blink = t; next = t + 2600 + Math.random() * 4000; }
    const b = (t - blink) / 190, shut = b > 0 && b < 1 ? Math.sin(b * Math.PI) : 0, n = (t - no) / 700;
    els.forEach(e => {
      const q = e.el.getBoundingClientRect(), ex = q.left + q.width * .5, ey = q.top + q.height * .5, tx = r ? r.left + Math.min(r.width, 12 + f.value.length * 11) : ptr ? ptr[0] : innerWidth * .6, ty = r ? r.top + r.height / 2 : ptr ? ptr[1] : 0;
      const vx = tx - ex, vy = ty - ey, d = Math.hypot(vx, vy) || 1, k = d / Math.hypot(d, 260); let gx = vx / d * k * (RX - PR) * .88, gy = vy / d * k * (RY - PR) * .88;
      if (n > 0 && n < 1) { gx = Math.sin(n * Math.PI * 5) * (RX - PR) * .9; gy = 0; } // no
      const s = 1 - Math.exp(-(n > 0 && n < 1 ? 40 : 11) * dt); e.x += (gx - e.x) * s; e.y += (gy - e.y) * s;
      const lid = hiddenPw && !(n > 0 && n < 1) ? .07 : 1 - .93 * shut; e.lid += (lid - e.lid) * (1 - Math.exp(-26 * dt));
      e.el.style.setProperty('--lid', e.lid.toFixed(3)); e.pu.style.setProperty('--gx', e.x.toFixed(2) + 'px'); e.pu.style.setProperty('--gy', e.y.toFixed(2) + 'px');
    });
    raf = requestAnimationFrame(frame);
  }
  addEventListener('pointermove', e => { ptr = [e.clientX, e.clientY]; }, { passive: true }); addEventListener('resize', () => { if (!$('#login').hidden) fit(); });
  return { wake() { fit(); document.fonts?.ready.then(fit); if (!reduce && !raf) { last = 0; raf = requestAnimationFrame(frame); } }, no() { no = performance.now(); } };
})();

/* the four states of the login page */
let token = '';
function showLogin(mode, note) {
  data = null; $('#app').hidden = true; $('#login').hidden = false; document.title = 'Admin · Moyo Studio';
  const F = $('#lgF'), T = { login: 'Bonjour', first: 'Bienvenue', sent: 'Regardez vos mails', create: 'Votre mot de passe' }[mode];
  $('#lgT span').textContent = T; F.dataset.mode = mode;
  $('#lgP').textContent = note || { login: 'L’admin du site. Entrez le mot de passe du studio.', first: 'L’admin n’a pas encore de mot de passe. Choisissez-le : un lien arrive dans la boîte mail du studio.', sent: `Un lien vient de partir vers ${me.to || me.mail}. Il est valable 30 minutes et ne sert qu’une fois.`, create: 'Choisissez celui qui ouvrira l’admin. Il n’est connu que de vous.' }[mode];
  const remember = '<label class="tg"><input type="checkbox" id="stay"><i aria-hidden="true"></i><span>Rester connecté 7 jours sur cet appareil</span></label>';
  F.innerHTML = {
    login: `${user}${pwField('pw', 'Mot de passe', 'current-password')}${remember}<div class="lg-a"><button class="btn" type="submit"><span>Entrer</span><i class="ar" aria-hidden="true"></i></button>${me.mail ? '<button type="button" class="tx" data-lg="forgot">Mot de passe oublié ?</button>' : ''}</div>`,
    first: `${me.mail ? `<div class="lg-a"><button class="btn" type="button" data-lg="forgot"><span>Recevoir le lien</span><i class="ar" aria-hidden="true"></i></button><span class="lg-n">Envoyé à ${esc(me.mail)}</span></div>` : ''}<p class="lg-n">${me.mail ? 'Rien reçu ? Regardez dans les indésirables.' : 'Le lien ne peut pas encore partir : l’adresse du studio n’est pas réglée. La marche à suivre est dans le README du projet.'}</p>`,
    sent: `<div class="lg-a"><button class="btn" type="button" data-lg="back"><span>Retour</span><i class="ar back" aria-hidden="true"></i></button><button type="button" class="tx" data-lg="forgot">Renvoyer le lien</button></div><p class="lg-n">Rien reçu après quelques minutes ? Regardez dans les indésirables, puis renvoyez le lien.</p>`,
    create: `${user}${pwField('n1', 'Nouveau mot de passe', 'new-password', meter('n1'))}${pwField('n2', 'Encore une fois', 'new-password')}${remember}<div class="lg-a"><button class="btn" type="submit"><span>Enregistrer</span><i class="ar" aria-hidden="true"></i></button></div>`
  }[mode];
  eyes.wake(); $('#lgT .dot b').animate?.([{ scale: 1.9 }, { scale: 1 }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
  const f = $('input:not(.sr)', F); if (f && matchMedia('(pointer:fine)').matches) f.focus({ preventScroll: true }); else $('#lgT').focus({ preventScroll: true });
}
const firstMode = () => me.configured ? 'login' : 'first';
$('#lgF').addEventListener('click', async e => {
  const b = e.target.closest('[data-lg]'); if (!b) return;
  if (b.dataset.lg === 'back') return showLogin(firstMode());
  b.disabled = true;
  try { const r = await post('/api/forgot', {}); me.to = r.to; showLogin('sent'); } catch (x) { b.disabled = false; toast(x.message, true); }
});
$('#lgF').addEventListener('submit', async e => {
  e.preventDefault();
  const F = e.currentTarget, mode = F.dataset.mode, btn = $('.btn', F), stay = !!$('#stay')?.checked;
  if (mode === 'login') {
    const v = $('#pw').value; if (!v) { err('pw', 'Entrez le mot de passe.'); return $('#pw').focus(); }
    btn.disabled = true;
    try { await post('/api/login', { ...(await proofOf(v)), remember: stay }); await enter(btn); }
    catch (x) { btn.disabled = false; err('pw', x.message); eyes.no(); $('#pw').select(); }
  } else if (mode === 'create') {
    const a = $('#n1').value, w = weak(a); if (w) { err('n1', w); eyes.no(); return $('#n1').focus(); }
    if (a !== $('#n2').value) { err('n2', 'Les deux ne sont pas identiques.'); eyes.no(); return $('#n2').focus(); }
    btn.disabled = true;
    try { await post('/api/password', { token, next: await newOne(a), remember: stay }); token = ''; history.replaceState(null, '', location.pathname); me = await api('/api/me'); await enter(btn); toast('Mot de passe enregistré.'); }
    catch (x) { btn.disabled = false; toast(x.message, true); if (/expiré/.test(x.message)) { history.replaceState(null, '', location.pathname); showLogin(firstMode()); } }
  }
});

/* ---------- from the login page to the app: the dot opens from the button and closes on the point of the title ---------- */
async function enter(from) {
  const d = await api('/api/projects');
  const go = () => { setData(d); $('#login').hidden = true; $('#app').hidden = false; render(); loadMsgs(); };
  if (reduce || !from) return go();
  const k = document.createElement('div'); k.className = 'kl'; k.style.zIndex = 200; document.body.appendChild(k);
  const q = from.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, far = (a, b) => Math.hypot(Math.max(a, innerWidth - a), Math.max(b, innerHeight - b)) + 4, c = (r, a, b) => `circle(${r.toFixed(0)}px at ${a.toFixed(0)}px ${b.toFixed(0)}px)`;
  await k.animate([{ clipPath: c(0, x, y) }, { clipPath: c(far(x, y), x, y) }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
  go(); scrollTo(0, 0);
  const m = $('#view .dot b')?.getBoundingClientRect(), ex = m ? m.left + m.width / 2 : innerWidth / 2, ey = m ? m.top + m.height / 2 : innerHeight / 2;
  await k.animate([{ clipPath: c(far(ex, ey), ex, ey) }, { clipPath: c(m ? m.width / 2 : 0, ex, ey) }], { duration: 860, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished; k.remove();
}

/* =====================================================================================================
   Data
   ===================================================================================================== */
const imagesOf = d => { const s = new Set(); for (const p of d.projects) { if (p.cover) s.add(p.cover); (p.images || []).forEach(i => s.add(i)); } for (const m of d.team || []) if (m.photo) s.add(m.photo); for (const m of d.method || []) { if (m.media) s.add(m.media); if (m.poster) s.add(m.poster); } return s; };
function setData(d) { data = d; saved = JSON.stringify(d); savedImages = imagesOf(d); offered = null; const f = store.get(DRAFT); if (f) try { const x = JSON.parse(f); if (x && x.data && JSON.stringify(x.data) !== saved) offered = x; else store.set(DRAFT, null); } catch (_) { store.set(DRAFT, null); } }
const dirty = () => !!data && JSON.stringify(data) !== saved;
let draftT;
function keepDraft() { if (!data) return; if (dirty()) { store.set(DRAFT, JSON.stringify({ at: Date.now(), data })); offered = null; $('.df')?.remove(); } else if (!offered) store.set(DRAFT, null); }
addEventListener('pagehide', keepDraft);
function touched() { // something changed: the status, and the draft
  const d = dirty(); $('#save').disabled = !d; $('#revert').hidden = !d; const s = $('#status'); s.classList.toggle('dirty', d); $('span', s).textContent = d ? 'Modifications à publier' : 'Tout est publié';
  clearTimeout(draftT); draftT = setTimeout(keepDraft, 500);
  way();
}
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const freeId = (base, list, except) => { let id = base || 'sans-titre', n = 2; while (list.some(x => x.id === id && x !== except)) id = base.slice(0, 56) + '-' + n++; return id; };
const catName = id => data.categories.find(c => c.id === id)?.fr || '';
const blank = p => !p.cover && !(p.images || []).length && !['fr', 'en'].some(l => Object.values(p[l] || {}).some(v => v && v.trim()));
/* uploaded, then taken away before being published: removed from the storage now */
function drop(id) { if (!id || id[0] === '/' || savedImages.has(id) || imagesOf(data).has(id)) return; api('/api/images/' + encodeURIComponent(id), { method: 'DELETE' }).catch(() => {}); }
/* the object a field belongs to: data-o="project:<id>" | "team:<id>" | "method:<n>" | "cat:<id>" */
function objOf(el) { const b = el.closest('[data-o]'); if (!b) return null; const [k, v] = b.dataset.o.split(/:(.*)/); return k === 'project' ? data.projects.find(p => p.id === v) : k === 'team' ? data.team.find(p => p.id === v) : k === 'method' ? data.method[+v] : k === 'cat' ? data.categories.find(c => c.id === v) : null; }

async function publish() {
  for (const x of data.team) x.links = (x.links || []).filter(l => (l.url || '').trim()).map(l => ({ url: l.url.trim(), label: (l.label || '').trim() || labelOf(l.url.trim()) })); // an empty line is nothing
  const bad = data.team.find(x => x.links.some(l => !linkOK(l.url)));
  if (bad) { lang = 'fr'; location.hash = 'equipe/' + bad.id; setTimeout(() => { const f = $$('#view [data-link="url"]').find(i => !linkOK(i.value)); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); f.scrollIntoView({ block: 'center' }); } }, 120); return toast(`Un lien de ${bad.name || 'ce profil'} n’est pas valide.`, true); }
  const p = data.projects.find(x => !x.fr.title.trim() && !blank(x)), m = data.method.findIndex(x => !x.fr.title.trim()), t = data.team.find(x => !(x.name || '').trim());
  data.projects = data.projects.filter(x => !blank(x) || x.fr.title.trim());
  const wrong = p ? ['projets/' + p.id, '.vt', 'Ce projet n’a pas de titre en français.'] : m >= 0 ? ['methode', `[data-o="method:${m}"] .a`, 'Chaque étape a besoin d’un titre en français.'] : t ? ['equipe/' + t.id, '[data-k="first"]', 'Ce profil n’a pas de nom.'] : null;
  if (wrong) { lang = 'fr'; location.hash = wrong[0]; setTimeout(() => { const f = $(wrong[1]); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); f.scrollIntoView({ block: 'center' }); } }, 120); return toast(wrong[2], true); }
  const s = $('#status'); $('#save').disabled = true; s.classList.add('busy'); $('span', s).textContent = 'Publication…';
  try { const r = await post('/api/projects', data, 'PUT'); store.set(DRAFT, null); setData(r.data); render(true); toast('Publié. Le site est à jour.'); } catch (e) { fail(e); }
  s.classList.remove('busy'); if (data) touched();
}
$('#save').addEventListener('click', publish);
$('#revert').addEventListener('click', async () => { if (await ask('Revenir à la version en ligne ?', 'Ce qui n’est pas publié sera perdu.', 'Revenir', 'Garder mes modifications')) { const mine = imagesOf(data); data = JSON.parse(saved); store.set(DRAFT, null); mine.forEach(drop); render(); toast('Vous êtes revenu à la version en ligne.'); } });
$('#out').addEventListener('click', async () => { if (dirty() && !(await ask('Partir sans publier ?', 'Le brouillon reste dans ce navigateur : vous le retrouverez à la prochaine connexion.', 'Se déconnecter', 'Rester', false))) return; await api('/api/logout', { method: 'POST' }).catch(() => {}); me = await api('/api/me').catch(() => me); showLogin(firstMode(), 'À bientôt.'); });
addEventListener('beforeunload', e => { if (data && dirty()) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && data) { e.preventDefault(); if (!$('#save').disabled) publish(); } });
addEventListener('scroll', () => $('#ab').classList.toggle('on', scrollY > 8), { passive: true });

/* =====================================================================================================
   Places
   ===================================================================================================== */
const PLACES = [['projets', 'Projets'], ['methode', 'Méthode'], ['equipe', 'Équipe'], ['categories', 'Catégories'], ['messages', 'Messages'], ['mot-de-passe', 'Mot de passe']];
const isNew = m => m.id > (store.get(SEEN) || '');
function way() {
  if (!data) return; const at = Math.max(0, PLACES.findIndex(p => p[0] === route[0])), news = (msgs || []).filter(isNew).length, n = { projets: data.projects.length, equipe: data.team.length, categories: data.categories.length, messages: msgs ? msgs.length : '' };
  const W = $('#way'); W.style.setProperty('--at', at); // the list is drawn once: the dot travels
  if (!W.firstChild) W.innerHTML = '<i class="aw-l" aria-hidden="true"></i><i class="aw-d" aria-hidden="true"></i>' + PLACES.map(([id, t]) => `<li><a href="#${id}">${t}<sup></sup></a></li>`).join('');
  $$('a', W).forEach((a, i) => { const id = PLACES[i][0]; i === at ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); $('sup', a).textContent = n[id] || ''; a.parentElement.classList.toggle('new', id === 'messages' && news > 0); });
  const nav = W.parentElement, on = $('[aria-current]', W); if (on && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' }); // small screens: the current place is in sight
}
const parse = () => { const [a, b] = decodeURIComponent(location.hash.slice(1)).split('/'); return [PLACES.some(p => p[0] === a) ? a : 'projets', b || '']; };
addEventListener('hashchange', () => {
  if (/^#creer=/.test(location.hash)) return start(); if (!data) return;
  const was = route; if (was[0] === 'projets' && was[1]) { const p = data.projects.find(x => x.id === was[1]); if (p && blank(p)) { data.projects.splice(data.projects.indexOf(p), 1); } } // left empty: it never existed
  if (was[0] === 'messages' && msgs?.length) store.set(SEEN, msgs[0].id);
  render(); scrollTo(0, 0); const p = route[0] === 'projets' && data.projects.find(x => x.id === route[1]); $(p && blank(p) ? '#view .vt' : '#view h1')?.focus({ preventScroll: true });
});
const VIEWS = { projets: () => { const p = route[1] && data.projects.find(x => x.id === route[1]); return p ? projectView(p) : projectsView(); }, methode: methodView, equipe: () => { const m = route[1] && data.team.find(x => x.id === route[1]); return m ? personView(m) : teamView(); }, categories: catsView, messages: msgsView, 'mot-de-passe': passView };
function render(keep) {
  route = parse(); const V = $('#view'), y = scrollY;
  V.innerHTML = (offered ? `<div class="df"><p>Un brouillon du ${esc(when(offered.at))} n’a pas été publié.</p><button type="button" class="tx" data-act="draftYes">Le reprendre</button><button type="button" class="tx red" data-act="draftNo">L’oublier</button></div>` : '') + VIEWS[route[0]]();
  if (route[0] === 'projets' && !route[1]) sortable($('.rw', V), (a, b) => moved(data.projects, a, b)); if (route[0] === 'equipe' && !route[1]) sortable($('.rw', V), (a, b) => moved(data.team, a, b));
  if (route[0] === 'categories') sortable($('.ct', V), (a, b) => moved(data.categories, a, b)); const g = $('.gal', V); if (g) { const p = objOf(g); sortable(g, (a, b) => moved(p.images, a, b)); }
  grow(V); touched(); if (keep) scrollTo(0, y); else if (!reduce) [...V.children].forEach((e, i) => e.animate([{ opacity: 0, translate: '0 22px' }, { opacity: 1, translate: '0 0' }], { duration: 760, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
}
const when = t => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(t));
/* a field as tall as its text, where the browser does not do it by itself */
function grow(scope) { if (CSS.supports('field-sizing', 'content')) return; $$('textarea', scope).forEach(t => { const f = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }; f(); t.addEventListener('input', f); }); }
const head = (title, act = '') => `<div class="vh"><h1 class="t-xl" tabindex="-1">${esc(title)}${dot}</h1>${act}</div>`;
const langs = () => `<div class="seg" role="group" aria-label="Langue des textes"><button type="button" data-act="lang" data-l="fr" aria-pressed="${lang === 'fr'}">Français</button><button type="button" data-act="lang" data-l="en" aria-pressed="${lang === 'en'}">English</button></div>`;
const crumbs = (href, name, here) => `<nav class="crumbs" aria-label="Vous êtes ici"><ol><li><a href="#${href}">${name}</a></li><li aria-current="page"><span>${esc(here)}</span></li></ol></nav>`;
const field = (label, k, v, { area, ph, w2, max = 200 } = {}) => `<label class="fld${w2 ? ' w2' : ''}"><span class="fl">${label}</span>${area ? `<textarea data-k="${k}" maxlength="${max}" placeholder="${esc(ph)}">${esc(v)}</textarea>` : `<input type="text" data-k="${k}" value="${esc(v)}" maxlength="${max}" placeholder="${esc(ph)}" autocomplete="off">`}</label>`;
const POS = { top: '50% 15%', bottom: '50% 85%', left: '20% 50%', right: '80% 50%' }; // as shared/render.js FOCUS
const thumb = (id, v, f) => id ? (isVideo(id) ? `<video src="${imgURL(id)}"${v ? ` poster="${imgURL(v)}"` : ''} muted loop playsinline autoplay></video>` : `<img src="${imgURL(id)}" alt=""${POS[f] ? ` style="object-position:${POS[f]}"` : ''}>`) : '';
/* framing of a cover or a portrait: which part stays in sight when the frame of the site cuts it */
const FOCI = [['', 'Centre'], ['top', 'Haut'], ['bottom', 'Bas'], ['left', 'Gauche'], ['right', 'Droite']];
const framing = o => o.cover || o.photo ? `<fieldset class="chips fr5"><legend class="fl">Cadrage : la partie de l’image qui reste visible</legend>${FOCI.map(([v, n]) => `<label><input type="radio" name="focus" data-k="focus" value="${v}"${(o.focus || '') === v ? ' checked' : ''}><span><b>${n}</b></span></label>`).join('')}</fieldset>` : '';
/* links of a profile: the label is guessed from the address */
const KNOWN = [[/linkedin\./, 'LinkedIn'], [/instagram\./, 'Instagram'], [/behance\./, 'Behance'], [/dribbble\./, 'Dribbble'], [/(^|\.)(x|twitter)\.com$/, 'X'], [/github\./, 'GitHub'], [/vimeo\./, 'Vimeo'], [/youtube\.|youtu\.be/, 'YouTube'], [/tiktok\./, 'TikTok'], [/facebook\./, 'Facebook'], [/threads\./, 'Threads'], [/bsky\./, 'Bluesky']];
const fixURL = u => { u = String(u || '').trim(); if (!u) return ''; if (/^[^\s@\/]+@[^\s@\/]+\.[a-z]{2,}$/i.test(u)) return 'mailto:' + u; if (/^(https?:\/\/|mailto:)/i.test(u)) return u; if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u)) return 'https://' + u; return u; };
const labelOf = u => { if (/^mailto:/i.test(u)) return 'E-mail'; let h = ''; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return ''; } const k = KNOWN.find(([r]) => r.test(h)); return k ? k[1] : h; };
const linkOK = u => /^(https?:\/\/[^\s\/]+\.[^\s\/]+\S*|mailto:[^\s@]+@[^\s@]+\.[a-z]{2,})$/i.test(u);
const ring = '<span class="up"><i></i></span>';
const zone = (act, id, label, accept = 'image/*', cls = 'plate', f) => `<label class="dz ${cls}${cls === 'plate' && !id ? ' plate--none' : ''}" data-drop="${act}" data-say="${id ? 'Remplacer' : 'Ajouter'}">${thumb(id, null, f)}<input type="file" accept="${accept}" data-file="${act}" aria-label="${esc(label)}"${act === 'gallery' ? ' multiple' : ''}>${ring}</label>`;

/* ---------- projects ---------- */
function projectsView() {
  return head('Projets', '<button type="button" class="btn" data-act="newProject"><span>Nouveau projet</span><i class="ar add" aria-hidden="true"></i></button>') + (data.projects.length ? `<ul class="rw">${data.projects.map(p => `<li data-s data-o="project:${esc(p.id)}">
    <button type="button" class="grip" aria-label="Déplacer ${esc(p.fr.title || 'ce projet')}. Flèches haut et bas."></button>
    <a class="rw-o" href="#projets/${esc(p.id)}"><span class="plate${p.cover ? '' : ' plate--none'}">${thumb(p.cover)}</span><span style="flex:1;min-width:0"><span class="rw-t">${esc(p.fr.title || 'Sans titre')}</span><span class="rw-s">${esc([catName(p.category), p.year].filter(Boolean).join(', '))}</span></span></a>
    <label class="tg"><input type="checkbox" data-k="featured"${p.featured ? ' checked' : ''}><i aria-hidden="true"></i><span>Accueil</span></label><a class="rw-o" style="flex:none;padding:14px 6px" href="#projets/${esc(p.id)}" tabindex="-1" aria-hidden="true"><i class="rw-a"></i></a></li>`).join('')}</ul><p class="hint" style="margin-top:18px">L’ordre de la liste est celui du site. Le point bleu : le projet est sur l’accueil.</p>` : '<div class="none"><b></b><p>Aucun projet pour l’instant.</p></div>');
}
function projectView(p) {
  const L = lang, t = p[L] || (p[L] = {}), f = p.fr, ph = k => L === 'en' ? f[k] || '' : '', en = L === 'en' ? ' <span class="opt">(vide : le français est repris)</span>' : '';
  const live = JSON.parse(saved).projects.some(x => x.id === p.id);
  return `<div class="vb">${crumbs('projets', 'Projets', f.title || 'Nouveau projet')}${langs()}</div><div data-o="project:${esc(p.id)}"><h1 class="sr" tabindex="-1">${esc(f.title || 'Nouveau projet')}</h1>
  <textarea class="vt" rows="1" data-k="${L}.title" maxlength="200" aria-label="Titre du projet" placeholder="${esc(L === 'en' ? f.title || 'Title' : 'Titre du projet')}">${esc(t.title)}</textarea>
  <div class="m9"><div class="ed-p">${zone('cover', p.cover, 'Image principale', 'image/*', 'plate', p.focus)}<div class="pa">${p.cover ? '<button type="button" class="tx" data-act="pick">Remplacer</button><button type="button" class="tx red" data-act="rmCover">Retirer</button>' : '<button type="button" class="tx" data-act="pick">Ajouter une image</button>'}</div>${framing(p)}<p class="hint">Choisie, glissée ou collée. JPG, PNG ou WebP, réduite à 2400 px. Sans image, le point est affiché.</p></div>
  <div class="ed-f ef">
    ${field('Description' + en, L + '.desc', t.desc, { area: 1, w2: 1, ph: ph('desc'), max: 6000 })}
    <fieldset class="chips w2"><legend class="fl">Catégorie</legend>${data.categories.map(c => `<label><input type="radio" name="cat" data-k="category" value="${esc(c.id)}"${c.id === p.category ? ' checked' : ''}><span><b>${esc(c.fr)}</b></span></label>`).join('')}</fieldset>
    ${field('Type de projet', L + '.type', t.type, { ph: ph('type') || 'Identité et site' })}${field('Rôle du studio', L + '.role', t.role, { ph: ph('role') })}
    ${field('Lieu', L + '.place', t.place, { ph: ph('place') })}${field('Année', 'year', p.year, { max: 12 })}
    <label class="tg w2"><input type="checkbox" data-k="featured"${p.featured ? ' checked' : ''}><i aria-hidden="true"></i><span>Sur la page d’accueil</span></label>
  </div></div>
  <section class="sct"><h2>Galerie</h2><div class="gal">${(p.images || []).map((id, i) => `<div data-s data-img="${i}"><img src="${imgURL(id)}" alt="Image ${i + 1}" loading="lazy"><button type="button" class="grip" aria-label="Déplacer l’image ${i + 1}. Flèches."></button><button type="button" class="x" data-act="rmImg" aria-label="Retirer l’image ${i + 1}">×</button></div>`).join('')}${zone('gallery', '', 'Ajouter des images à la galerie')}</div><p class="hint">Plusieurs images à la fois. Elles sont réduites à 2400 px.</p></section>
  <section class="sct"><h2>Adresse</h2><div class="ef">${field('moyo-d0n.pages.dev/projets/', 'id', p.id, { max: 60 })}</div><div class="pa" style="margin-top:22px;justify-content:space-between">${live ? `<a class="tx" href="/projets/${esc(p.id)}" target="_blank" rel="noopener">Voir la page en ligne ↗</a>` : '<span></span>'}<button type="button" class="tx red" data-act="rmProject">Supprimer ce projet</button></div></section></div>`;
}

/* ---------- method ---------- */
const FITS = [['center', 'Au centre'], ['top', 'En haut'], ['bottom', 'En bas'], ['contain', 'En entier']];
function methodView() {
  const L = lang;
  return head('Méthode', langs()) + `<p class="vn">Quatre étapes en plein écran sur l’accueil. Écrivez directement sur l’image. Une vidéo est jouée sans son, en boucle. Un format paysage d’au moins 1920 px convient le mieux.</p>` + data.method.map((m, i) => { const t = m[L] || (m[L] = {}); return `<section data-o="method:${i}"><p class="mt-k">Étape ${i + 1}<span>${!m.media ? 'sans image : fond bleu et point' : isVideo(m.media) ? 'vidéo' : isGif(m.media) ? 'GIF' : 'image'}</span></p>
  <div class="mt${m.media ? ' has' : ''}" data-fit="${esc(m.fit || 'center')}">${zone('media', '', 'Image, vidéo ou GIF de l’étape ' + (i + 1), 'image/*,video/mp4,video/webm', '').replace('<input', thumb(m.media, m.poster) + '<input')}
  <div class="mt-w"><textarea class="a" rows="1" data-k="${L}.title" maxlength="60" aria-label="Titre de l’étape ${i + 1}" placeholder="${esc(L === 'en' ? m.fr.title || 'Title' : 'Titre')}">${esc(t.title)}</textarea><textarea class="b" rows="2" data-k="${L}.text" maxlength="400" aria-label="Texte de l’étape ${i + 1}" placeholder="${esc(L === 'en' ? m.fr.text || 'Text' : 'Texte')}">${esc(t.text)}</textarea></div></div>
  <div class="mt-c"><div class="pa" style="margin:0"><button type="button" class="tx" data-act="pick">${m.media ? 'Remplacer' : 'Choisir une image, une vidéo ou un GIF'}</button>${m.media ? '<button type="button" class="tx red" data-act="rmMedia">Retirer</button>' : ''}</div><fieldset class="chips" aria-label="Cadrage">${FITS.map(([v, n]) => `<label><input type="radio" name="fit${i}" data-k="fit" value="${v}"${(m.fit || 'center') === v ? ' checked' : ''}><span><b>${n}</b></span></label>`).join('')}</fieldset></div></section>`; }).join('') + '<p class="hint">Image : réduite à 2400 px. GIF : 20 Mo au plus. Vidéo MP4 (H.264) ou WebM : 24 Mo au plus, quelques secondes suffisent.</p>';
}

/* ---------- team ---------- */
function teamView() {
  return head('Équipe', '<button type="button" class="btn" data-act="newPerson"><span>Ajouter une personne</span><i class="ar add" aria-hidden="true"></i></button>') + `<ul class="rw">${data.team.map(m => `<li data-s data-o="team:${esc(m.id)}"><button type="button" class="grip" aria-label="Déplacer ${esc(m.name || 'ce profil')}. Flèches haut et bas."></button><a class="rw-o" href="#equipe/${esc(m.id)}"><span class="plate${m.photo ? '' : ' plate--none'}">${thumb(m.photo)}</span><span style="flex:1;min-width:0"><span class="rw-t">${esc(m.name || 'Sans nom')}</span><span class="rw-s">${esc(m.fr?.role)}</span></span><i class="rw-a" aria-hidden="true"></i></a></li>`).join('')}</ul>`;
}
function personView(m) {
  const L = lang, t = m[L] || (m[L] = {}), f = m.fr || (m.fr = {}), ph = k => L === 'en' ? f[k] || '' : '', live = JSON.parse(saved).team?.some(x => x.id === m.id);
  return `<div class="vb">${crumbs('equipe', 'Équipe', m.name || 'Nouveau profil')}${langs()}</div><div data-o="team:${esc(m.id)}"><div class="vh"><h1 class="t-xl" tabindex="-1"><span id="who">${esc(m.name || 'Nouveau profil')}</span>${dot}</h1></div>
  <div class="m9"><div class="ed-p">${zone('photo', m.photo, 'Portrait', 'image/*', 'plate', m.focus)}<div class="pa">${m.photo ? '<button type="button" class="tx" data-act="pick">Remplacer</button><button type="button" class="tx red" data-act="rmPhoto">Retirer</button>' : '<button type="button" class="tx" data-act="pick">Ajouter un portrait</button>'}</div>${framing(m)}<p class="hint">Choisi, glissé ou collé. Un portrait vertical convient le mieux.</p></div>
  <div class="ed-f ef">${field('Prénom', 'first', m.first ?? (m.name || '').split(' ')[0], { max: 60 })}${field('Nom', 'last', m.last ?? (m.name || '').split(' ').slice(1).join(' '), { max: 60 })}${field('Titre', L + '.role', t.role, { ph: ph('role') || 'Cofondatrice', w2: 1, max: 120 })}${field('Sous-titre <span class="opt">(une phrase courte, sous le titre)</span>', L + '.phrase', t.phrase, { ph: ph('phrase') || 'imaginer ensemble', w2: 1, max: 80 })}${field('Biographie' + (L === 'en' ? ' <span class="opt">(vide : le français est repris)</span>' : ''), L + '.bio', t.bio, { area: 1, w2: 1, ph: ph('bio'), max: 4000 })}</div></div>
  <section class="sct"><h2>Liens</h2><p class="vn">LinkedIn, Instagram, portfolio, e-mail… Collez l’adresse : le nom se remplit tout seul. Ils sont affichés sous la biographie et aident les moteurs de recherche à reconnaître la personne.</p><ul class="lk">${(m.links || []).map((l, i) => `<li data-li="${i}"><label class="fld"><span class="fl">Adresse</span><input type="text" inputmode="url" data-link="url" value="${esc(l.url)}" maxlength="300" placeholder="linkedin.com/in/…" autocomplete="off"${l.url && !linkOK(l.url) ? ' aria-invalid="true"' : ''}></label><label class="fld"><span class="fl">Nom affiché</span><input type="text" data-link="label" value="${esc(l.label)}" maxlength="40" placeholder="LinkedIn" autocomplete="off"></label><button type="button" class="tx red" data-act="rmLink" aria-label="Retirer le lien ${i + 1}">Retirer</button></li>`).join('')}</ul>${(m.links || []).length < 6 ? '<div class="pa"><button type="button" class="tx" data-act="addLink">Ajouter un lien</button></div>' : ''}</section>
  <section class="sct"><h2>Adresse</h2><div class="ef">${field('moyo-d0n.pages.dev/equipe/', 'id', m.id, { max: 60 })}</div><div class="pa" style="margin-top:22px;justify-content:space-between">${live ? `<a class="tx" href="/equipe/${esc(m.id)}" target="_blank" rel="noopener">Voir la page en ligne ↗</a>` : '<span></span>'}<button type="button" class="tx red" data-act="rmPerson">Retirer de l’équipe</button></div></section></div>`;
}

/* ---------- categories ---------- */
function catsView() {
  const n = id => data.projects.filter(p => p.category === id).length;
  return head('Catégories') + `<p class="vn">Elles rangent les projets. Sur le site, une catégorie sans projet est affichée en clair, sans lien.</p><ul class="ct">${data.categories.map(c => `<li data-s data-o="cat:${esc(c.id)}"><button type="button" class="grip" aria-label="Déplacer ${esc(c.fr)}. Flèches haut et bas."></button>${field('Français', 'fr', c.fr, { max: 60 })}${field('English', 'en', c.en, { max: 60, ph: c.fr })}<span class="n">${plural(n(c.id), 'projet')}</span><button type="button" class="tx red" data-act="rmCat"${n(c.id) ? ' disabled title="Retirez d’abord cette catégorie de ses projets"' : ''}>Supprimer</button></li>`).join('')}</ul>
  <form class="sct" id="catAdd"><h2>Nouvelle catégorie</h2><div class="ef"><label class="fld"><span class="fl">Français</span><input type="text" id="cFr" maxlength="60" required></label><label class="fld"><span class="fl">English</span><input type="text" id="cEn" maxlength="60"></label><div class="w2"><button class="btn" type="submit"><span>Ajouter</span><i class="ar add" aria-hidden="true"></i></button></div></div></form>`;
}

/* ---------- messages ---------- */
const TYPES = { identite: 'Identité', site: 'Site', donnees: 'Données', motion: 'Motion', audiovisuel: 'Audiovisuel', communication: 'Communication', autre: 'Autre' }, BUDGETS = { lt5: 'Moins de 5 000 €', '5-15': 'De 5 000 à 15 000 €', '15-40': 'De 15 000 à 40 000 €', gt40: 'Plus de 40 000 €', tbd: 'Budget non défini' };
async function loadMsgs() { try { msgs = (await api('/api/messages')).messages; } catch (_) { msgs = msgs || []; } if (!data) return; way(); if (route[0] === 'messages') render(true); }
function msgsView() {
  if (!msgs) return head('Messages') + '<p class="vn">Chargement…</p>';
  return head('Messages') + (msgs.length ? `<ul class="ms">${msgs.map(m => `<li data-id="${esc(m.id)}"${isNew(m) ? ' class="new"' : ''}><h2>${esc(m.name)}</h2><p class="who"><a href="mailto:${esc(m.email)}">${esc(m.email)}</a><span>${esc(when(m.at))}</span>${m.type ? `<span>${esc(m.type.split(',').map(t => TYPES[t] || t).join(', '))}</span>` : ''}${m.budget ? `<span>${esc(BUDGETS[m.budget] || m.budget)}</span>` : ''}${m.lang === 'en' ? '<span>En anglais</span>' : ''}</p><p class="txt">${esc(m.message)}</p><div class="pa" style="margin:0;justify-content:space-between"><a class="tx" href="mailto:${esc(m.email)}?subject=${encodeURIComponent(m.lang === 'en' ? 'moyo, your message' : 'moyo, votre message')}">Répondre ↗</a><button type="button" class="tx red" data-act="rmMsg">Supprimer</button></div></li>`).join('')}</ul>` : '<div class="none"><b></b><p>Aucun message pour l’instant.<br>Ils arrivent ici depuis le formulaire du site.</p></div>');
}

/* ---------- password ---------- */
function passView() { return head('Mot de passe') + `<p class="vn">Les autres appareils connectés seront déconnectés.</p><form id="passF" class="ef" novalidate>${user}<div class="w2" style="max-width:34em">${pwField('p0', 'Mot de passe actuel', 'current-password')}</div><div class="w2" style="max-width:34em">${pwField('p1', 'Nouveau mot de passe', 'new-password', meter('p1'))}</div><div class="w2" style="max-width:34em">${pwField('p2', 'Encore une fois', 'new-password')}</div><div class="w2"><button class="btn" type="submit"><span>Changer le mot de passe</span><i class="ar" aria-hidden="true"></i></button></div></form>`; }
async function changePass(F) {
  const [a, b, c] = ['p0', 'p1', 'p2'].map(i => $('#' + i).value), w = weak(b), bad = !a ? ['p0', 'Entrez le mot de passe actuel.'] : w ? ['p1', w] : b === a ? ['p1', 'C’est le même que l’actuel.'] : b !== c ? ['p2', 'Les deux ne sont pas identiques.'] : null;
  if (bad) { err(...bad); return $('#' + bad[0]).focus(); }
  const btn = $('.btn', F); btn.disabled = true;
  try { await post('/api/password', { current: await proofOf(a), next: await newOne(b), remember: false }, 'PUT'); me = await api('/api/me'); render(); toast('Mot de passe changé.'); }
  catch (e) { btn.disabled = false; if (/actuel/.test(e.message)) { err('p0', e.message); $('#p0').focus(); } else fail(e); }
}

/* =====================================================================================================
   What is done in a view
   ===================================================================================================== */
const V = $('#view');
V.addEventListener('input', e => {
  const lk = e.target.dataset.link; if (lk) { const o = objOf(e.target), l = o?.links?.[+e.target.closest('[data-li]').dataset.li]; if (!l) return; l[lk] = e.target.value; e.target.removeAttribute('aria-invalid'); return touched(); }
  const k = e.target.dataset.k, o = k && objOf(e.target); if (!o) return; e.target.removeAttribute('aria-invalid');
  const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (k === 'id') return; // on change
  const path = k.split('.'); if (path.length === 2) (o[path[0]] ||= {})[path[1]] = v; else o[k] = v;
  if (k === 'first' || k === 'last') { o.first ??= ''; o.last ??= ''; o.name = `${o.first} ${o.last}`.trim(); $('#who').textContent = o.name || 'Nouveau profil'; $('.crumbs [aria-current] span').textContent = o.name || 'Nouveau profil'; }
  if (k === 'fr.title' && e.target.matches('.vt')) $('.crumbs [aria-current] span').textContent = v || 'Nouveau projet';
  if (k === 'fit') e.target.closest('section').querySelector('.mt').dataset.fit = v;
  if (k === 'focus') { const i = $('.ed-p .dz img', V); if (i) i.style.objectPosition = POS[v] || ''; }
  touched();
});
V.addEventListener('change', e => {
  const t = e.target, o = objOf(t); if (!o) return;
  if (t.dataset.file) { take(t.dataset.file, t.files, t.closest('.dz'), o); t.value = ''; return; }
  if (t.dataset.link === 'url') { const l = o.links[+t.closest('[data-li]').dataset.li], u = fixURL(t.value), n = t.closest('li').querySelector('[data-link="label"]'); l.url = t.value = u; if (u && !(l.label || '').trim()) l.label = n.value = labelOf(u); if (u && !linkOK(u)) { t.setAttribute('aria-invalid', 'true'); toast('Cette adresse ne semble pas valide. Exemple : linkedin.com/in/prenom-nom', true); } touched(); return; }
  if (t.dataset.k === 'id') { const list = route[0] === 'equipe' ? data.team : data.projects, id = freeId(slug(t.value) || o.id, list, o); o.id = id; t.value = id; history.replaceState(null, '', `#${route[0]}/${id}`); route[1] = id; t.closest('[data-o]').dataset.o = (route[0] === 'equipe' ? 'team:' : 'project:') + id; touched(); }
  if (t.matches('.vt') && t.dataset.k === 'fr.title' && /^nouveau-projet/.test(o.id) && t.value.trim()) { const id = freeId(slug(t.value), data.projects, o); o.id = id; history.replaceState(null, '', '#projets/' + id); route[1] = id; t.closest('[data-o]').dataset.o = 'project:' + id; const f = $('[data-k="id"]'); if (f) f.value = id; touched(); } // the address follows the title, once
});
V.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.vt,.mt-w .a')) { e.preventDefault(); e.target.blur(); } });
V.addEventListener('submit', e => {
  e.preventDefault(); if (e.target.id === 'passF') return changePass(e.target);
  if (e.target.id === 'catAdd') { const fr = $('#cFr').value.trim(); if (!fr) return $('#cFr').focus(); data.categories.push({ id: freeId(slug(fr) || 'categorie', data.categories), fr, en: $('#cEn').value.trim() || fr }); render(true); $('#cFr').focus(); }
});
V.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const act = b.dataset.act, o = objOf(b);
  if (act === 'lang') { lang = b.dataset.l; render(true); $(`[data-act="lang"][data-l="${lang}"]`)?.focus(); }
  else if (act === 'pick') (b.closest('section,[class^="ed-p"]') || V).querySelector('.dz input').click();
  else if (act === 'draftYes') { data = offered.data; offered = null; data.method ||= JSON.parse(saved).method; render(); toast('Brouillon repris.'); }
  else if (act === 'draftNo') { offered = null; store.set(DRAFT, null); render(true); }
  else if (act === 'newProject') { const id = freeId('nouveau-projet', data.projects); data.projects.unshift({ id, year: String(new Date().getFullYear()), category: data.categories[0]?.id || '', featured: false, tone: 'klein', cover: null, images: [], plate: '', fr: { title: '', type: '', role: '', place: '', desc: '' }, en: { title: '', type: '', role: '', place: '', desc: '' } }); lang = 'fr'; location.hash = 'projets/' + id; }
  else if (act === 'newPerson') { const id = freeId('profil', data.team); data.team.push({ id, name: '', first: '', last: '', photo: null, fr: { role: '', bio: '', phrase: '' }, en: { role: '', bio: '', phrase: '' }, links: [] }); lang = 'fr'; location.hash = 'equipe/' + id; }
  else if (act === 'addLink') { (o.links ||= []).push({ label: '', url: '' }); render(true); $$('#view .lk [data-link="url"]').pop()?.focus(); }
  else if (act === 'rmLink') { o.links.splice(+b.closest('[data-li]').dataset.li, 1); render(true); }
  else if (act === 'rmCover') { const x = o.cover; o.cover = null; o.focus = ''; drop(x); render(true); }
  else if (act === 'rmPhoto') { const x = o.photo; o.photo = null; o.focus = ''; drop(x); render(true); }
  else if (act === 'rmMedia') { const x = [o.media, o.poster]; o.media = o.poster = null; x.forEach(drop); render(true); }
  else if (act === 'rmImg') { const [x] = o.images.splice(+b.closest('[data-img]').dataset.img, 1); drop(x); render(true); }
  else if (act === 'rmProject') { if (await ask(`Supprimer « ${o.fr.title || 'Sans titre'} » ?`, 'Le projet quittera le site à la prochaine publication.', 'Supprimer')) { data.projects.splice(data.projects.indexOf(o), 1); [o.cover, ...(o.images || [])].forEach(drop); location.hash = 'projets'; } }
  else if (act === 'rmPerson') { if (await ask(`Retirer ${o.name || 'ce profil'} de l’équipe ?`, 'Sa page quittera le site à la prochaine publication.', 'Retirer')) { data.team.splice(data.team.indexOf(o), 1); drop(o.photo); location.hash = 'equipe'; } }
  else if (act === 'rmCat') { data.categories.splice(data.categories.indexOf(o), 1); render(true); }
  else if (act === 'rmMsg') { const li = b.closest('li'); if (await ask('Supprimer ce message ?', 'Il ne pourra pas être récupéré.', 'Supprimer')) api('/api/messages/' + encodeURIComponent(li.dataset.id), { method: 'DELETE' }).then(() => { msgs = msgs.filter(m => m.id !== li.dataset.id); render(true); toast('Message supprimé.'); }).catch(fail); }
});

/* ---------- order: with the pointer or the arrows ---------- */
function moved(list, a, b) { list.splice(b, 0, list.splice(a, 1)[0]); render(true); $$('#view [data-s] .grip')[b]?.focus({ preventScroll: true }); }
function sortable(box, done) {
  if (!box) return; const items = () => [...box.children].filter(c => c.hasAttribute('data-s'));
  box.addEventListener('keydown', e => { const g = e.target.closest('.grip'), d = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key]; if (!g || !d) return; e.preventDefault(); const l = items(), a = l.indexOf(g.closest('[data-s]')), b = clamp(a + d, 0, l.length - 1); if (a !== b) done(a, b); });
  box.addEventListener('pointerdown', e => {
    const g = e.target.closest('.grip'); if (!g || e.button) return; e.preventDefault();
    const l = items(), from = l.indexOf(g.closest('[data-s]')), me = l[from], S = l.map(i => { const r = i.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }), col = S.every(s => Math.abs(s.x - S[0].x) < 4), gap = col && S[1] ? S[1].y - S[0].y - S[0].h : 0;
    const sx = e.clientX, sy = e.clientY + scrollY; let to = from, px = e.clientX, py = e.clientY, raf = 0; me.classList.add('drag'); box.classList.add('sorting'); try { g.setPointerCapture(e.pointerId); } catch (_) {}
    const place = () => { const o = l.map((_, i) => i).filter(i => i !== from); o.splice(to, 0, from); let y = S[0].y; o.forEach((i, k) => { const ty = col ? y : S[k].y, tx = col ? S[i].x : S[k].x; y += S[i].h + gap; if (i !== from) l[i].style.translate = `${tx - S[i].x}px ${ty - S[i].y}px`; }); };
    const step = () => { me.style.translate = `${col ? 0 : px - sx}px ${py + scrollY - sy}px`; const cx = S[from].x + S[from].w / 2 + (col ? 0 : px - sx), cy = S[from].y + S[from].h / 2 + py + scrollY - sy; let best = to, d = 1e9; S.forEach((s, k) => { const q = Math.hypot(s.x + s.w / 2 - cx, s.y + s.h / 2 - cy); if (q < d) { d = q; best = k; } }); if (best !== to) { to = best; place(); } };
    const edge = () => { const v = py < 120 ? (py - 120) / 7 : py > innerHeight - 90 ? (py - innerHeight + 90) / 7 : 0; if (v) { scrollBy(0, v); step(); } raf = requestAnimationFrame(edge); };
    const mv = q => { px = q.clientX; py = q.clientY; step(); };
    const end = () => { cancelAnimationFrame(raf); removeEventListener('pointermove', mv); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); l.forEach(i => { i.style.translate = ''; i.style.transition = 'none'; }); me.classList.remove('drag'); box.classList.remove('sorting'); requestAnimationFrame(() => l.forEach(i => { i.style.transition = ''; })); if (to !== from) done(from, to); };
    addEventListener('pointermove', mv); addEventListener('pointerup', end); addEventListener('pointercancel', end); raf = requestAnimationFrame(edge);
  });
}

/* ---------- files: chosen, dropped or pasted ---------- */
const dzOf = e => e.target.closest?.('[data-drop]');
V.addEventListener('dragover', e => { const d = dzOf(e); if (d) { e.preventDefault(); d.classList.add('over'); } });
V.addEventListener('dragleave', e => { const d = dzOf(e); if (d && !d.contains(e.relatedTarget)) d.classList.remove('over'); });
V.addEventListener('drop', e => { const d = dzOf(e); if (!d) return; e.preventDefault(); d.classList.remove('over'); take(d.dataset.drop, e.dataTransfer.files, d, objOf(d)); });
addEventListener('dragover', e => e.preventDefault()); addEventListener('drop', e => e.preventDefault()); // a file dropped beside does not replace the page
addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].filter(x => x.type.startsWith('image/')); if (!f.length || !data || !route[1]) return; const z = route[0] === 'projets' ? $(objOf($('#view [data-drop]')).cover ? '[data-drop="gallery"]' : '[data-drop="cover"]') : route[0] === 'equipe' ? $('[data-drop="photo"]') : null; if (z) { e.preventDefault(); take(z.dataset.drop, f, z, objOf(z)); } });
async function take(what, files, z, o) {
  const list = [...files]; if (!list.length || !o) return; const say = p => z.style.setProperty('--u', p); z.classList.add('busy'); say(4);
  const here = route.join('/');
  try {
    if (what === 'gallery') { let n = 0; for (const f of list) { if (!f.type.startsWith('image/')) continue; say(Math.round(n / list.length * 100)); (o.images ||= []).push(await picture(f)); n++; } if (!n) throw new Error('Choisissez des images.'); toast(n > 1 ? `${n} images ajoutées.` : 'Image ajoutée.'); }
    else if (what === 'media') { const r = await film(list[0], say), x = [o.media, o.poster]; o.media = r.id; o.poster = r.poster; x.forEach(drop); }
    else { const id = await picture(list[0], say), x = o[what]; o[what] = id; drop(x); }
    if (route.join('/') === here) render(true); else touched();
  } catch (e) { z.classList.remove('busy'); fail(e); }
}
/* reduced in the browser before it is sent: 2400 px on the long side, WebP (JPEG where WebP is not available). A GIF is sent as it is. */
async function picture(f, say) {
  if (!f.type.startsWith('image/')) throw new Error('Choisissez une image.');
  let blob = f;
  if (f.type !== 'image/gif') try { const b = await createImageBitmap(f), s = Math.min(1, 2400 / Math.max(b.width, b.height)), c = document.createElement('canvas'); c.width = Math.round(b.width * s); c.height = Math.round(b.height * s); c.getContext('2d').drawImage(b, 0, 0, c.width, c.height); blob = await new Promise(r => c.toBlob(r, 'image/webp', .86)); if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .88)); } catch (_) { blob = f; }
  const max = blob.type === 'image/gif' ? 20 : 10; if (blob.size > max * 1048576) throw new Error(`${blob.type === 'image/gif' ? 'GIF trop lourd' : 'Image trop lourde'} (${mo(blob.size)}, ${max} Mo au plus).`);
  return send(blob, blob.type, say);
}
async function film(f, say) {
  if (f.type.startsWith('image/')) { if (f.type === 'image/gif' && f.size > 20 * 1048576) throw new Error(`GIF trop lourd (${mo(f.size)}, 20 Mo au plus). Une vidéo MP4 serait dix fois plus légère.`); return { id: await picture(f, say), poster: null }; }
  if (!f.type.startsWith('video/')) throw new Error('Choisissez une image, une vidéo MP4 ou WebM, ou un GIF.');
  if (!['video/mp4', 'video/webm'].includes(f.type)) throw new Error('Ce format de vidéo n’est pas lu par tous les navigateurs. Exportez-la en MP4 (H.264).');
  if (f.size > 24 * 1048576) throw new Error(`Vidéo trop lourde (${mo(f.size)}, 24 Mo au plus). Raccourcissez-la ou baissez sa qualité.`);
  const poster = await first(f); return { id: await send(f, f.type, say), poster };
}
/* the first picture of a video, shown while it loads */
const first = f => new Promise(done => {
  const v = document.createElement('video'), u = URL.createObjectURL(f), end = r => { clearTimeout(t); URL.revokeObjectURL(u); v.removeAttribute('src'); done(r); }, t = setTimeout(() => end(null), 12000);
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.onerror = () => end(null); v.onloadeddata = () => { v.currentTime = Math.min(.1, (v.duration || 1) / 2); };
  v.onseeked = async () => { try { const s = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); let b = await new Promise(r => c.toBlob(r, 'image/webp', .82)); if (!b || b.type !== 'image/webp') b = await new Promise(r => c.toBlob(r, 'image/jpeg', .85)); end(b ? await send(b, b.type) : null); } catch (_) { end(null); } };
  v.src = u;
});

/* ---------- start ---------- */
async function start() {
  const m = location.hash.match(/^#creer=([\w-]{43})$/);
  try { me = await api('/api/me'); } catch (e) { me = { configured: true }; showLogin('login', e.message); return; }
  if (m) { token = m[1]; return showLogin('create'); }
  if (me.admin) return enter().catch(e => { showLogin('login'); fail(e); });
  showLogin(firstMode());
}
start();
})();
