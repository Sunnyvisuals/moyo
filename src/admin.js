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

let me = {}, data = null, saved = '', savedImages = new Set(), msgs = null, lang = 'fr', route = [], offered = null, stored = null;

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
let toastT, undo = null;
function toast(text, bad, back) {
  const t = $('#toast'); undo = back || null; t.innerHTML = `<p${bad ? ' class="err"' : ''}><span>${esc(text)}</span>${back ? '<button type="button">Annuler</button>' : ''}</p>`; if (back) $('button', t).onclick = takeBack;
  clearTimeout(toastT); toastT = setTimeout(() => { t.textContent = ''; undo = null; }, back ? 8000 : bad ? 7000 : 3400);
}
function takeBack() { const f = undo; undo = null; if (f) { f(); toast('Annulé.'); } }
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && undo && !e.target.matches('textarea,[contenteditable],input:not([type=file]):not([type=radio]):not([type=checkbox])')) { e.preventDefault(); takeBack(); } });
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
  const go = () => { setData(d); $('#login').hidden = true; $('#app').hidden = false; render(); loadMsgs(); loadStored(); };
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
  const d = dirty(); $('#save').disabled = !d; $('#revert').hidden = !d; const s = $('#status'); s.classList.toggle('dirty', d); const n = d ? changes().length : 0; $('span', s).textContent = d ? (n ? plural(n, 'modification') : 'Modifications') + ' à publier' : 'Tout est publié';
  clearTimeout(draftT); draftT = setTimeout(keepDraft, 500);
  way();
}
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const freeId = (base, list, except) => { let id = base || 'sans-titre', n = 2; while (list.some(x => x.id === id && x !== except)) id = base.slice(0, 56) + '-' + n++; return id; };
const catName = id => data.categories.find(c => c.id === id)?.fr || '';
const blank = p => !p.cover && !(p.images || []).length && !['fr', 'en'].some(l => Object.values(p[l] || {}).some(v => v && v.trim()));
/* uploaded, then taken away before being published: removed from the storage now */
/* a change of pictures can be taken back for eight seconds (the message, or Ctrl Z): what it took away is removed from the storage only after that */
function changed(text, was, gone = []) { render(true); toast(text, false, () => { const now = imagesOf(data); data = JSON.parse(was); render(true); now.forEach(drop); }); const l = gone.filter(Boolean); if (l.length) setTimeout(() => data && l.forEach(drop), 9000); }
function drop(id) { if (!id || id[0] === '/' || savedImages.has(id) || imagesOf(data).has(id)) return; api('/api/images/' + encodeURIComponent(id), { method: 'DELETE' }).catch(() => {}); }
/* the object a field belongs to: data-o="project:<id>" | "team:<id>" | "method:<n>" | "cat:<id>" */
function objOf(el) { const b = el.closest('[data-o]'); if (!b) return null; const [k, v] = b.dataset.o.split(/:(.*)/); return k === 'project' ? data.projects.find(p => p.id === v) : k === 'team' ? data.team.find(p => p.id === v) : k === 'method' ? data.method[+v] : k === 'cat' ? data.categories.find(c => c.id === v) : null; }

async function publish() { // true when it is online, null when something is missing
  const p = data.projects.find(x => !x.fr.title.trim() && !blank(x)), m = data.method.findIndex(x => !x.fr.title.trim()), t = data.team.find(x => !(x.name || '').trim());
  data.projects = data.projects.filter(x => !blank(x) || x.fr.title.trim());
  const wrong = p ? ['projets/' + p.id, '.vt', 'Ce projet n’a pas de titre en français.'] : m >= 0 ? ['methode', `[data-o="method:${m}"] .a`, 'Chaque étape a besoin d’un titre en français.'] : t ? ['equipe/' + t.id, '[data-k="first"]', 'Ce profil n’a pas de nom.'] : null;
  if (wrong) { shutPreview(true); lang = 'fr'; location.hash = wrong[0]; setTimeout(() => { const f = $(wrong[1]); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); f.scrollIntoView({ block: 'center' }); } }, 120); toast(wrong[2], true); return null; }
  undo = null; $('#toast').textContent = ''; const s = $('#status'); $('#save').disabled = true; s.classList.add('busy'); $('span', s).textContent = 'Publication…';
  let done = false; try { const r = await post('/api/projects', data, 'PUT'); store.set(DRAFT, null); setData(r.data); render(true); toast('Publié. Le site est à jour.'); done = true; } catch (e) { fail(e); }
  s.classList.remove('busy'); if (data) touched(); return done;
}
$('#save').addEventListener('click', publish);
$('#revert').addEventListener('click', async () => { if (await ask('Revenir à la version en ligne ?', 'Ce qui n’est pas publié sera perdu.', 'Revenir', 'Garder mes modifications')) { const mine = imagesOf(data); data = JSON.parse(saved); store.set(DRAFT, null); mine.forEach(drop); render(); toast('Vous êtes revenu à la version en ligne.'); } });
$('#out').addEventListener('click', async () => { if (dirty() && !(await ask('Partir sans publier ?', 'Le brouillon reste dans ce navigateur : vous le retrouverez à la prochaine connexion.', 'Se déconnecter', 'Rester', false))) return; await api('/api/logout', { method: 'POST' }).catch(() => {}); me = await api('/api/me').catch(() => me); showLogin(firstMode(), 'À bientôt.'); });
addEventListener('beforeunload', e => { if (data && dirty()) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && data) { e.preventDefault(); if (!$('#save').disabled) publish(); } });
addEventListener('scroll', () => $('#ab').classList.toggle('on', scrollY > 8), { passive: true });

/* =====================================================================================================
   Preview: the real site, with what is not published yet (functions/_lib/preview.js), and what changes
   ===================================================================================================== */
const copy = x => JSON.parse(JSON.stringify(x)), eq = (x, y) => JSON.stringify(x ?? null) === JSON.stringify(y ?? null);
const FIELD = { title: 'titre', desc: 'description', type: 'type de projet', role: 'rôle', place: 'lieu', text: 'texte', bio: 'biographie' };
/* what differs from the published version, in words, and how to put it back */
function changes() {
  const a = JSON.parse(saved), out = [], T = (x, l, k) => (x[l] || {})[k] || '';
  const words = (x, y, role) => { const ks = l => [...new Set([...Object.keys(x[l] || {}), ...Object.keys(y[l] || {})])]; return [...ks('fr').filter(k => T(x, 'fr', k) !== T(y, 'fr', k)).map(k => (k === 'role' && role) || FIELD[k] || k), ...(ks('en').some(k => T(x, 'en', k) !== T(y, 'en', k)) ? ['anglais'] : [])]; };
  const list = (key, was, now, { name, diff, href, add, del, order, at }) => {
    const A = new Map(was.map(x => [x.id, x])), B = new Map(now.map(x => [x.id, x])), L = () => data[key], i = id => L().findIndex(x => x.id === id);
    now.forEach(y => { const x = A.get(y.id); if (!x) out.push({ t: name(y), d: add, href: href(y), back: () => L().splice(i(y.id), 1) }); else { const d = diff(x, y); if (d.length) out.push({ t: name(y), d: d.join(', '), href: href(y), back: () => { L()[i(y.id)] = copy(x); } }); } });
    was.forEach((x, k) => { if (!B.has(x.id)) out.push({ t: name(x), d: del, href: at, back: () => L().splice(Math.min(k, L().length), 0, copy(x)) }); });
    const oa = was.filter(x => B.has(x.id)).map(x => x.id), ob = now.filter(x => A.has(x.id)).map(x => x.id); if (!eq(oa, ob)) out.push({ t: order, d: 'ordre', href: at, back: () => { const n = new Map(was.map((x, k) => [x.id, k])); L().sort((x, y) => (n.get(x.id) ?? 1e9) - (n.get(y.id) ?? 1e9)); } });
  };
  list('projects', a.projects, data.projects.filter(p => !blank(p) || T(p, 'fr', 'title').trim()), { name: p => T(p, 'fr', 'title') || 'Projet sans titre', add: 'nouveau projet', del: 'retiré du site', order: 'Projets', at: '/projets', href: p => T(p, 'fr', 'title').trim() ? '/projets/' + p.id : '/projets',
    diff: (x, y) => [...words(x, y, 'rôle du studio'), x.category !== y.category && 'catégorie', (x.year || '') !== (y.year || '') && 'année', x.cover !== y.cover && 'image principale', !eq(x.images || [], y.images || []) && 'galerie', !!x.featured !== !!y.featured && (y.featured ? 'mis sur l’accueil' : 'retiré de l’accueil')].filter(Boolean) });
  (data.method || []).forEach((y, k) => { const x = (a.method || [])[k]; if (!x) return; const d = [...words(x, y), x.media !== y.media && (isVideo(y.media) ? 'vidéo' : 'image'), (x.fit || 'center') !== (y.fit || 'center') && 'cadrage', (x.align || 'left') !== (y.align || 'left') && 'alignement'].filter(Boolean); if (d.length) out.push({ t: `Méthode, étape ${k + 1}`, d: d.join(', '), href: '/#methode', step: k, back: () => { data.method[k] = copy(x); } }); });
  list('team', a.team || [], data.team || [], { name: m => m.name || 'Profil sans nom', add: 'nouveau profil', del: 'retiré de l’équipe', order: 'Équipe', at: '/#equipe', href: m => '/equipe/' + m.id, diff: (x, y) => [...words(x, y, 'titre'), (x.name || '') !== (y.name || '') && 'nom', x.photo !== y.photo && 'portrait'].filter(Boolean) });
  list('categories', a.categories, data.categories, { name: c => c.fr || 'Catégorie sans nom', add: 'nouvelle catégorie', del: 'catégorie supprimée', order: 'Catégories', at: '/projets', href: () => '/projets', diff: (x, y) => [x.fr !== y.fr && 'nom', x.en !== y.en && 'anglais'].filter(Boolean) });
  return out;
}
const P = $('#pv'), pf = $('#pvF'), pv = { w: 'full', lang: 'fr', live: false, warn: [], list: [] }, SCREENS = { tab: [820, 1180], tel: [390, 844] };
/* where to look first: the page that is being edited */
const placeOf = () => { const [a, b] = route, p = a === 'projets' && b && data.projects.find(x => x.id === b); return p ? (T0(p) ? '/projets/' + p.id : '/projets') : a === 'projets' || a === 'categories' ? '/projets' : a === 'methode' ? '/#methode' : a === 'equipe' ? (b ? '/equipe/' + b : '/#equipe') : '/'; }, T0 = p => (p.fr?.title || '').trim();
function addr(path) { const u = new URL((pv.lang === 'en' ? '/en' : '') + (pv.lang === 'en' && path.startsWith('/#') ? path.slice(1) : path) || '/', location.origin); if (pv.lang === 'fr') u.searchParams.set('lang', 'fr'); if (pv.live) u.searchParams.set('en-ligne', '1'); return u.href; }
/* the address in the frame, without the language and the version */
function here() { try { const l = pf.contentWindow.location; if (l.protocol === 'about:') return null; return { path: (l.pathname.replace(/^\/en(?=\/|$)/, '') || '/') + l.hash, y: pf.contentWindow.scrollY }; } catch (_) { return null; } }
let keepY = null;
function load(path, y = null) { keepY = y; P.classList.add('wait'); const u = addr(path); try { pf.contentWindow.location.replace(u); } catch (_) { pf.src = u; } clearTimeout(load.t); load.t = setTimeout(() => P.classList.remove('wait'), 9000); }
/* the draft goes to the server, then the page is asked again */
async function refresh(path, y) {
  pv.list = changes(); drawList(); P.classList.add('wait');
  try { const r = await post('/api/preview', { ...data, projects: data.projects.filter(x => !blank(x) || T0(x)) }); pv.warn = r.errors || []; drawList(); load(path, y); } catch (e) { P.classList.remove('wait'); fail(e); }
}
function drawList() {
  const n = pv.list.length, d = dirty(); $('#pvN').textContent = n ? plural(n, 'changement') : d ? 'Aucun changement visible' : 'Tout est publié'; $('#pvN').disabled = !n && !pv.warn.length; $('#pvP').disabled = !d;
  $('#pvL').innerHTML = `<p class="pv-h">Ce qui change sur le site</p>${n ? `<ul>${pv.list.map((c, i) => `<li><button type="button" class="pv-g" data-i="${i}"><b>${esc(c.t)}</b><span>${esc(c.d)}</span></button><button type="button" class="tx" data-back="${i}" aria-label="Rétablir : ${esc(c.t)}">Rétablir</button></li>`).join('')}</ul>` : '<p>Rien pour l’instant.</p>'}${pv.warn.length ? `<p class="pv-w">${pv.warn.map(esc).join('<br>')}</p>` : ''}`;
  if (!n && !pv.warn.length) openList(false);
}
function openList(v) { $('#pvL').hidden = !v; $('#pvN').setAttribute('aria-expanded', String(v)); }
function fitFrame() { const f = $('#pvW'), s = SCREENS[pv.w], S = f.parentElement; f.dataset.w = pv.w; f.style.cssText = s ? `width:${s[0]}px;height:${s[1]}px;scale:${Math.min(1, (S.clientHeight - 40) / s[1], (S.clientWidth - 32) / s[0]).toFixed(4)}` : ''; }
function press() { $$('[data-pv]', P).forEach(b => b.setAttribute('aria-pressed', String(String(pv[b.dataset.pv]) === b.dataset.v))); }
const mid = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
function openPreview() {
  if (P.open || !data) return; const from = $('#see'), [x, y] = mid(from), R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4;
  pv.live = false; pv.lang = lang; press(); openList(false); P.showModal(); P.append($('#toast')); fitFrame(); refresh(placeOf(), null);
  if (!reduce) P.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], { duration: 760, easing: 'cubic-bezier(.7,0,.2,1)' });
}
function shutPreview(now) {
  if (!P.open) return; const end = () => { P.close(); document.body.append($('#toast')); try { pf.contentWindow.location.replace('about:blank'); } catch (_) {} $('#see').focus({ preventScroll: true }); };
  if (reduce || now === true) return end(); const [x, y] = mid($('#see')), R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4;
  P.animate([{ clipPath: `circle(${R}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)' }).finished.then(end, end);
}
pf.addEventListener('load', () => {
  let w, d; try { w = pf.contentWindow; d = w.document; if (w.location.protocol === 'about:') return; } catch (_) { return; }
  const y = keepY; keepY = null; if (y !== null) { w.scrollTo(0, y); setTimeout(() => w.scrollTo(0, y), 320); }
  clearTimeout(load.t); P.classList.remove('wait');
  if (pv.live) d.addEventListener('click', e => { const a = e.target.closest?.('a[href]'); if (!a || a.origin !== location.origin || a.pathname === w.location.pathname) return; const u = new URL(a.href); u.searchParams.set('en-ligne', '1'); a.href = u.href; }, true); // the published version stays the published version
  w.addEventListener('keydown', e => { if (e.key === 'Escape' && !d.querySelector('dialog[open],#menu:popover-open')) shutPreview(); });
  w.addEventListener('pointerdown', () => openList(false));
});
$('#see').addEventListener('click', openPreview); $('#pvX').addEventListener('click', () => shutPreview());
P.addEventListener('cancel', e => { e.preventDefault(); $('#pvL').hidden ? shutPreview() : openList(false); });
$('#pvN').addEventListener('click', () => openList($('#pvL').hidden));
$('#pvP').addEventListener('click', async () => { $('#pvP').disabled = true; const r = await publish(); if (r === null) return; pv.live = false; press(); const h = here(); if (r) { await refresh(h ? h.path : '/', h ? h.y : null); openList(false); } else drawList(); });
P.addEventListener('click', e => {
  const b = e.target.closest('[data-pv],[data-i],[data-back]'); if (!b) return; const h = here() || { path: placeOf(), y: null };
  if (b.dataset.pv) { const k = b.dataset.pv, v = b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v; if (pv[k] === v) return; pv[k] = v; press(); if (k === 'w') fitFrame(); else load(h.path, k === 'live' ? h.y : null); }
  else if (b.dataset.i) { pv.live = false; press(); openList(false); const c = pv.list[+b.dataset.i]; load(c.href, null); if (c.step >= 0) keepStep = c.step; }
  else { const mine = imagesOf(data); pv.list[+b.dataset.back].back(); render(true); mine.forEach(drop); pv.live = false; press(); refresh(h.path, h.y); }
});
let keepStep = -1; /* a step of the method: the scroll goes to it once the page is there */
pf.addEventListener('load', () => { if (keepStep < 0) return; const k = keepStep; keepStep = -1; setTimeout(() => { try { const t = pf.contentDocument.querySelectorAll('.tab')[k]; t && t.click(); } catch (_) {} }, 700); });
addEventListener('resize', () => { if (P.open) fitFrame(); });

/* =====================================================================================================
   What a file is: its dimensions, its proportions, its weight, its format, and what to think of it where it is shown
   ===================================================================================================== */
const facts = new Map(); // id -> { w, h, size, time, from }
async function loadStored() { try { stored = (await api('/api/images')).images || {}; } catch (_) { stored = {}; } facts.forEach(f => { if (!f.size) f.done = false; }); tell(); }
const ko = n => n < 1048576 ? Math.max(1, Math.round(n / 1024)).toLocaleString('fr-FR') + ' Ko' : mo(n), sec = n => n < .95 ? Math.max(.1, n).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' s' : Math.round(n) + ' s';
const FORMAT = { webp: 'WebP', jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', avif: 'AVIF', gif: 'GIF', mp4: 'MP4', webm: 'WebM' }, extOf = id => (id.match(/\.(\w+)$/) || [])[1]?.toLowerCase();
const RATIOS = [[1, 1], [5, 4], [4, 3], [3, 2], [16, 10], [16, 9], [2, 1], [21, 9]];
const ratio = (w, h) => { const v = Math.max(w, h) / Math.min(w, h), m = RATIOS.find(([a, b]) => Math.abs(v * b / a - 1) < .012); return m ? (w >= h ? m : [m[1], m[0]]).join(':') : w >= h ? v.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ':1' : '1:' + v.toLocaleString('fr-FR', { maximumFractionDigits: 2 }); };
/* where it is shown, how many pixels it takes on the long side (on the width for a full screen), and from what weight it is slow */
const NEED = { cover: { min: 1200, good: 2000, heavy: .9, in: 'l’image principale' }, gallery: { min: 1200, good: 2000, heavy: .9, in: 'la galerie' }, photo: { min: 900, good: 1600, heavy: .7, in: 'un portrait' }, media: { min: 1920, good: 2560, heavy: 1.6, in: 'le plein écran' } };
function about(id) {
  let f = facts.get(id); if (!f) facts.set(id, f = {}); if (f.done) return f; if (f.wait) return f.wait;
  return f.wait = (async () => {
    const u = imgURL(id);
    if (!f.w) await new Promise(ok => {
      if (isVideo(id)) { const v = document.createElement('video'), end = () => { v.removeAttribute('src'); v.load(); ok(); }; v.preload = 'metadata'; v.muted = true; v.onloadedmetadata = () => { f.w = v.videoWidth; f.h = v.videoHeight; f.time = isFinite(v.duration) ? v.duration : 0; end(); }; v.onerror = end; v.src = u; }
      else { const i = new Image(); i.onload = () => { f.w = i.naturalWidth; f.h = i.naturalHeight; ok(); }; i.onerror = ok; i.src = u; }
    });
    if (!f.size && stored?.[id]?.size) f.size = stored[id].size;
    if (!f.size && id[0] === '/') try { const r = await fetch(u, { method: 'HEAD' }); f.size = r.ok ? +r.headers.get('Content-Length') || 0 : 0; } catch (_) {}
    if (!f.size) f.size = performance.getEntriesByName(new URL(u, location.href).href).reduce((m, e) => Math.max(m, e.encodedBodySize || 0), 0);
    f.done = !!f.size || !!stored; f.wait = null; return f;
  })();
}
function opinion(id, kind, f) {
  const n = NEED[kind], film = isVideo(id), gif = isGif(id), L = kind === 'media' ? f.w : Math.max(f.w, f.h), m = f.size / 1048576, say = [];
  if (L < n.min) say.push(`Petite pour ${n.in} : ${n.min} px au moins, ${n.good} px conseillés.`);
  if (kind === 'media' && f.h > f.w) say.push('En hauteur : elle sera recadrée sur un grand écran.');
  if (gif && m > 3) say.push('GIF lourd : en vidéo MP4, il pèserait environ dix fois moins.'); else if (film && m > 10) say.push('Vidéo lourde : visez moins de 10 Mo.'); else if (!film && !gif && m > n.heavy) say.push(`Lourde : visez moins de ${n.heavy < 1 ? n.heavy * 1000 + ' Ko' : mo(n.heavy * 1048576)}.`);
  return { state: L < n.min * .72 || m > (film ? 18 : gif ? 8 : n.heavy * 2.2) ? 'bad' : say.length || L < n.good ? 'mid' : 'ok', say: say.join(' ') || (L < n.good ? `Suffisante, ${n.good} px serait idéal.` : 'Bonne taille, bon poids.') };
}
const tec = (id, kind, mode = '') => id ? `<div class="tec ${mode}" data-tec="${esc(id)}" data-kind="${kind}"></div>` : '';
const total = ids => Promise.all(ids.map(about)).then(l => ko(l.reduce((s, f) => s + (f.size || 0), 0)));
function tell() {
  $$('#view [data-tec]').forEach(async p => { const id = p.dataset.tec, f = await about(id); if (!p.isConnected) return; const mini = p.classList.contains('mini'); if (!f.w) { p.textContent = mini ? '' : 'Fichier introuvable.'; return; }
    const o = opinion(id, p.dataset.kind, f), size = f.size ? ko(f.size) : '', dot = `<i class="${o.state}"></i>`, kind = FORMAT[extOf(id)] || '', t = f.size ? sec(f.size / 1250000) : ''; // 4G: about ten megabits per second
    const rows = [['Dimensions', `${f.w} × ${f.h} px`], ['Proportions', ratio(f.w, f.h)], ['Poids', size], ['Format', kind], ['Durée', f.time ? sec(f.time) : ''], ['Chargement en 4G', t], ['Fichier d’origine', f.from ? ko(f.from) : '']].filter(r => r[1]);
    p.innerHTML = mini ? `${dot}${f.w} × ${f.h}<span>${size}</span>` : p.classList.contains('full') ? `<dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p>${dot}${o.say}</p>` : `${dot}<b>${f.w} × ${f.h} px</b>${[rows[1][1], size, kind, f.time ? sec(f.time) : '', ...(p.dataset.kind === 'media' ? [t ? t + ' en 4G' : '', f.from ? ko(f.from) + ' à l’origine' : ''] : [])].filter(Boolean).map(x => `<span>${x}</span>`).join('')}${o.state === 'ok' ? '' : `<em>${o.say}</em>`}`;
    p.title = o.say; });
  const put = (sel, ids) => { const e = $(sel); if (e) total(ids).then(x => { if (e.isConnected) e.textContent = ids.length ? `${plural(ids.length, 'fichier')}, ${x}` : 'aucun fichier'; }); }, g = $('#galSum');
  if (g) put('#galSum', objOf(g)?.images || []); put('#mthSum', data.method.map(m => m.media).filter(Boolean)); put('#allSum', [...imagesOf(data)]);
}

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
  if (route[0] === 'categories') sortable($('.ct', V), (a, b) => moved(data.categories, a, b)); const g = $('.gal', V); if (g) { const p = objOf(g); sortable(g, (a, b) => moved(p.images, a, b), { sel: '.ed-p [data-drop="cover"]', put: i => toCover(p, i) }); }
  grow(V); $$('.rt[contenteditable]', V).forEach(richShow); touched(); tell(); if (keep) scrollTo(0, y); else if (!reduce) [...V.children].forEach((e, i) => e.animate([{ opacity: 0, translate: '0 22px' }, { opacity: 1, translate: '0 0' }], { duration: 760, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
}
const when = t => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(t));
/* a field as tall as its text, where the browser does not do it by itself */
function grow(scope) { if (CSS.supports('field-sizing', 'content')) return; $$('textarea', scope).forEach(t => { const f = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }; f(); t.addEventListener('input', f); }); }
const head = (title, act = '') => `<div class="vh"><h1 class="t-xl" tabindex="-1">${esc(title)}${dot}</h1>${act}</div>`;
const langs = () => `<div class="seg" role="group" aria-label="Langue des textes"><button type="button" data-act="lang" data-l="fr" aria-pressed="${lang === 'fr'}">Français</button><button type="button" data-act="lang" data-l="en" aria-pressed="${lang === 'en'}">English</button></div>`;
const crumbs = (href, name, here) => `<nav class="crumbs" aria-label="Vous êtes ici"><ol><li><a href="#${href}">${name}</a></li><li aria-current="page"><span>${esc(here)}</span></li></ol></nav>`;
const field = (label, k, v, { area, ph, w2, max = 200 } = {}) => `<label class="fld${w2 ? ' w2' : ''}"><span class="fl">${label}</span>${area ? `<textarea data-k="${k}" maxlength="${max}" placeholder="${esc(ph)}">${esc(v)}</textarea>` : `<input type="text" data-k="${k}" value="${esc(v)}" maxlength="${max}" placeholder="${esc(ph)}" autocomplete="off">`}</label>`;
const thumb = (id, v) => id ? (isVideo(id) ? `<video src="${imgURL(id)}"${v ? ` poster="${imgURL(v)}"` : ''} muted loop playsinline autoplay></video>` : `<img src="${imgURL(id)}" alt="" draggable="false">`) : '';
const ring = '<span class="up"><i></i></span>';
const zone = (act, id, label, accept = 'image/*', cls = 'plate', has = id) => `<label class="dz ${cls}${cls === 'plate' && !id ? ' plate--none' : ''}" data-drop="${act}" data-say="${has ? 'Remplacer' : 'Ajouter'}" data-to="${act === 'gallery' ? 'Ajouter à la galerie' : has ? 'Remplacer' : 'Ajouter'}">${thumb(id)}<input type="file" accept="${accept}" data-file="${act}" aria-label="${esc(label)}"${act === 'gallery' ? ' multiple' : ''}>${ring}</label>`;

/* =====================================================================================================
   Texts with a form: written as they are seen, kept as plain words (shared/rich.js). The browser does the work (execCommand): its shortcuts, its undo,
   its spelling in the language of the text, its dictation
   ===================================================================================================== */
__RICH__
const KLEIN = 'rgb(0, 47, 167)', JUSTIFY = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' };
/* the tools are signs, drawn with lines and the dot; their name is said on hover and to screen readers */
const sign = d => `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`, rows = L => sign(`<path d="${L.map(([x, w], i) => `M${x} ${3.5 + i * 4.35}h${w}`).join('')}"/>`);
const TOOLS = [['h', 'Intertitre', '', '<b>T</b>'], ['b', 'Gras', 'Ctrl B', '<b>B</b>'], ['k', 'Bleu', '', sign('<circle cx="10" cy="10" r="5.5" fill="#002FA7" stroke="none"/><circle class="o" cx="10" cy="10" r="9" stroke="#002FA7"/>')], ['a', 'Lien', 'Ctrl K', sign('<path d="M8.4 11.6l3.2-3.2M9.2 6.3l1.9-1.9a3.2 3.2 0 0 1 4.5 4.5l-1.9 1.9M10.8 13.7l-1.9 1.9a3.2 3.2 0 0 1-4.5-4.5l1.9-1.9"/>')], ['ul', 'Liste', '', sign('<path d="M8 4h10M8 10h10M8 16h10"/><g fill="currentColor" stroke="none"><circle cx="3" cy="4" r="1.7"/><circle cx="3" cy="10" r="1.7"/><circle cx="3" cy="16" r="1.7"/></g>')],
  ['left', 'À gauche', '', rows([[2, 16], [2, 9], [2, 14], [2, 7]])], ['center', 'Au centre', '', rows([[2, 16], [5.5, 9], [3, 14], [6.5, 7]])], ['right', 'À droite', '', rows([[2, 16], [9, 9], [4, 14], [11, 7]])], ['justify', 'Justifié', '', rows([[2, 16], [2, 16], [2, 16], [2, 16]])]];
const richField = (label, k, v, { ph, max }) => `<div class="fld rich w2"><div class="rt-h"><span class="fl" id="rt-${k}">${label}</span><div class="rt-b">${[['Mise en forme', TOOLS.slice(0, 5)], ['Alignement', TOOLS.slice(5)]].map(([g, l]) => `<div role="group" aria-label="${g}">${l.map(([t, n, key, d]) => `<button type="button" data-rt="${t}" aria-pressed="false" aria-label="${n}" title="${n}${key ? ` (${key})` : ''}">${d}</button>`).join('')}</div>`).join('')}</div></div>
  <div class="rt-l" hidden><input type="text" inputmode="url" autocomplete="url" autocapitalize="none" spellcheck="false" aria-label="Adresse du lien" placeholder="https:// ou une adresse e-mail"><button type="button" class="tx" data-ln="ok">Poser le lien</button><button type="button" class="tx red" data-ln="no">Retirer</button></div>
  <div class="rt" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="rt-${k}" data-k="${k}" data-max="${max}" data-ph="${esc(ph)}" lang="${lang}" spellcheck="true">${richHTML(v) || '<p><br></p>'}</div><small class="f-err"></small></div>`;
const edOf = el => el?.closest?.('.rich')?.querySelector('.rt'), BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|SECTION|ARTICLE|PRE|TABLE|TBODY|TR|TD|FIGURE)$/;
const joiner = '⁠', plainly = t => t.replace(/[​﻿⁠]/g, '').replace(/ /g, ' ').replace(/\*(?=\*)/g, '*' + joiner).replace(/=(?==)/g, '=' + joiner).replace(/\](?=\()/g, ']' + joiner); // what could be read as a form stays text
/* from what is seen to what is kept */
function richText(ed) {
  const out = [], kinds = [], mark = el => ({ center: '{c} ', right: '{r} ', end: '{r} ', justify: '{j} ' }[getComputedStyle(el).textAlign.replace(/^-(webkit|moz)-/, '')] || '');
  const words = (nodes, head) => { // the words of a block, with what they look like
    const R = []; (function walk(list, href) { for (const n of list) { if (n.nodeType === 3) { const c = getComputedStyle(n.parentElement); R.push({ t: n.data.replace(/[\n\t]/g, ' '), b: !head && +c.fontWeight >= 600, k: c.color === KLEIN, href }); } else if (n.nodeName === 'BR') R.push({ t: '\n', b: false, k: false, href: '' }); else if (n.nodeType === 1) walk(n.childNodes, n.nodeName === 'A' ? n.getAttribute('href') || '' : href); } })(nodes, '');
    const L = []; R.forEach(r => { const p = L[L.length - 1]; if (p && (r.t === '\n' || p.b === r.b && p.k === r.k && p.href === r.href)) p.t += r.t; else L.push({ ...r }); });
    return L.map(r => { const [, a, m, z] = /^(\s*)([^]*?)(\s*)$/.exec(plainly(r.t)); if (!m) return a + z; let x = m; if (r.k) x = `==${x}==`; if (r.b) x = `**${x}**`; if (r.href && richURL(r.href)) x = `[${x.replace(/\n/g, ' ').replace(/[[\]]/g, '')}](${r.href.replace(/[()\s]/g, c => '%' + c.charCodeAt(0).toString(16))})`; return a + x + z; }).join('').replace(/[ ]*\n[ ]*/g, '\n').replace(/[ ]{2,}/g, ' ').trim();
  };
  const add = (t, el, kind) => { if (!t) return; const a = mark(el); if (kind === 'ul' && kinds[out.length - 1] === 'ul' + a) return void (out[out.length - 1] += '\n' + t); (kind === 'ul' ? [t] : t.split(/\n{2,}/)).map(x => x.trim()).filter(Boolean).forEach(x => { if (kind === 'h') x = '# ' + x.replace(/\n/g, ' '); else if (kind === 'p' && (/^(# |\{[crj]\})/.test(x) || x.split('\n').every(l => /^- /.test(l)))) x = joiner + x; kinds[out.length] = kind + a; out.push(a + x); }); };
  (function block(el) {
    let run = []; const flush = () => { if (run.length) { const h = /^H[1-6]$/.test(el.nodeName); add(words(run, h), el, h ? 'h' : 'p'); run = []; } };
    for (const n of el.childNodes) {
      if (n.nodeType !== 1 || !BLOCK.test(n.nodeName) && !n.querySelector?.('p,div,ul,ol,h1,h2,h3')) { if (n.nodeType === 1 || n.nodeType === 3) run.push(n); continue; }
      flush(); if (/^(UL|OL)$/.test(n.nodeName)) { const li = [...n.querySelectorAll('li')]; add(li.map(l => words(l.childNodes).replace(/\n+/g, ' ').trim()).filter(Boolean).map(t => '- ' + t).join('\n'), li[0] || n, 'ul'); } else block(n);
    }
    flush();
  })(ed);
  return out.join('\n\n');
}
/* what the caret is in */
function richState(ed) {
  const s = getSelection(), n = s.rangeCount && ed.contains(s.focusNode) ? s.focusNode : null, el = n && (n.nodeType === 1 ? n.childNodes[Math.min(s.focusOffset, n.childNodes.length - 1)]?.nodeType === 1 ? n.childNodes[Math.min(s.focusOffset, n.childNodes.length - 1)] : n : n.parentElement);
  if (!el) return null; const up = q => { const e = el.closest(q); return e && ed.contains(e) && e !== ed ? e : null; }, bl = up('li,h1,h2,h3,h4,p,div') || ed, al = getComputedStyle(bl).textAlign, q = (f, c) => { try { return document[f](c); } catch (_) { return ''; } }, col = String(q('queryCommandValue', 'foreColor'));
  const h = !!up('h1,h2,h3,h4'); return { h, ul: !!up('ul,ol'), b: !h && !!q('queryCommandState', 'bold'), k: /^(#002fa7|rgb\(0, ?47, ?167\)|10956544)$/i.test(col), a: up('a'), at: /right|end/.test(al) ? 'right' : /center/.test(al) ? 'center' : al === 'justify' ? 'justify' : 'left' };
}
function richShow(ed) {
  const st = document.activeElement === ed || ed.parentElement.contains(document.activeElement) ? richState(ed) : null, t = ed.textContent.trim();
  ed.classList.toggle('empty', !t && !ed.querySelector('li')); $$('[data-rt]', ed.parentElement).forEach(b => { const k = b.dataset.rt; b.setAttribute('aria-pressed', String(!!st && (k in JUSTIFY ? st.at === k : !!st[k]))); b.disabled = !!st && st.h && k === 'b'; });
  const n = richText(ed).length - +ed.dataset.max, e = ed.nextElementSibling; e.textContent = n > 0 ? plural(n, 'caractère') + ' de trop.' : ''; n > 0 ? ed.setAttribute('aria-invalid', 'true') : ed.removeAttribute('aria-invalid');
}
const run = (c, v) => document.execCommand(c, false, v);
function richDo(ed, t) {
  if (document.activeElement !== ed) ed.focus(); run('styleWithCSS', false); const st = richState(ed) || {};
  if (t === 'a') return linkRow(ed, st.a);
  if (t === 'b') run('bold'); else if (t === 'k') run('foreColor', st.k ? '#121214' : '#002FA7'); else if (t === 'ul') run('insertUnorderedList'); else if (t === 'h') run('formatBlock', st.h ? 'p' : 'h2'); else run(JUSTIFY[t]);
  richShow(ed);
}
/* a link: its address, asked under the tools */
let kept = null;
function linkRow(ed, a) {
  const s = getSelection(), row = $('.rt-l', ed.parentElement), f = $('input', row); if (a) s.selectAllChildren(a); kept = s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
  row.hidden = false; $('[data-ln=no]', row).hidden = !a; f.value = a ? a.getAttribute('href').replace(/^mailto:/, '') : ''; f.removeAttribute('aria-invalid'); f.focus(); f.select();
}
function linkDo(row, what) {
  const ed = edOf(row), f = $('input', row); let u = f.value.trim();
  if (what === 'ok') { if (!u) return f.focus(); if (/^[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i.test(u)) u = 'mailto:' + u; else if (!richURL(u)) u = 'https://' + u.replace(/^\/+/, ''); if (/^https?:/i.test(u) && !URL.canParse?.(u) || /\s/.test(u)) { f.setAttribute('aria-invalid', 'true'); return f.focus(); } }
  row.hidden = true; ed.focus(); const s = getSelection(); if (kept) { s.removeAllRanges(); s.addRange(kept); }
  if (what === 'ok') { if (s.isCollapsed) run('insertHTML', `<a href="${esc(u)}">${esc(u.replace(/^(mailto:|https?:\/\/(www\.)?)/, '').replace(/\/$/, ''))}</a>`); else run('createLink', u); s.collapseToEnd(); } else if (what === 'no') run('unlink');
  richShow(ed);
}
run('defaultParagraphSeparator', 'p');
document.addEventListener('selectionchange', () => { const ed = document.activeElement?.closest?.('.rt[contenteditable]'); if (ed) richShow(ed); });
$('#view').addEventListener('mousedown', e => { if (e.target.closest('[data-rt]')) e.preventDefault(); }); // the selection stays in the text
$('#view').addEventListener('click', e => { const b = e.target.closest('[data-rt]'), l = e.target.closest('[data-ln]'); if (b) richDo(edOf(b), b.dataset.rt); else if (l) linkDo(l.closest('.rt-l'), l.dataset.ln); });
$('#view').addEventListener('focusout', e => { const ed = e.target.closest?.('.rt[contenteditable]'); if (ed) setTimeout(() => ed.isConnected && richShow(ed)); });
$('#view').addEventListener('keydown', e => {
  if (e.target.closest('.rt-l')) { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); linkDo(e.target.closest('.rt-l'), 'ok'); } else if (e.key === 'Escape') { e.preventDefault(); linkDo(e.target.closest('.rt-l'), 'stop'); } return; }
  const ed = e.target.closest?.('.rt[contenteditable]'); if (!ed || !(e.ctrlKey || e.metaKey) || e.altKey) return; const k = e.key.toLowerCase();
  if (k === 'k') { e.preventDefault(); richDo(ed, 'a'); } else if (k === 'b') { e.preventDefault(); if (!richState(ed)?.h) richDo(ed, 'b'); } else if (k === 'i' || k === 'u') e.preventDefault(); // neither slanted nor underlined letters here
});
$('#view').addEventListener('beforeinput', e => { if (e.target.closest?.('.rt[contenteditable]') && /^format(Italic|Underline|Strike|Super|Sub|FontName|Back|Indent|Outdent)/.test(e.inputType)) e.preventDefault(); });
/* what is pasted or dropped comes as words */
const words2html = t => t.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const putWords = t => /\n/.test(t.trim()) ? run('insertHTML', words2html(t)) : run('insertText', t.replace(/[\r\n]+/g, ' '));
$('#view').addEventListener('paste', e => { if (!e.target.closest?.('.rt[contenteditable]') || !e.clipboardData) return; const t = e.clipboardData.getData('text/plain'); if (!t && e.clipboardData.files.length) return; e.preventDefault(); putWords(t); });
$('#view').addEventListener('drop', e => { const ed = e.target.closest?.('.rt[contenteditable]'); if (!ed || !e.dataTransfer || e.dataTransfer.files.length) return; const t = e.dataTransfer.getData('text/plain'); if (!t) return; e.preventDefault(); const p = document.caretPositionFromPoint?.(e.clientX, e.clientY), r = p ? null : document.caretRangeFromPoint?.(e.clientX, e.clientY), s = getSelection(); ed.focus(); if (p) s.collapse(p.offsetNode, p.offset); else if (r) { s.removeAllRanges(); s.addRange(r); } putWords(t); });

/* ---------- projects ---------- */
function projectsView() {
  return head('Projets', '<button type="button" class="btn" data-act="newProject"><span>Nouveau projet</span><i class="ar add" aria-hidden="true"></i></button>') + (data.projects.length ? `<ul class="rw">${data.projects.map(p => `<li data-s data-o="project:${esc(p.id)}" data-drop="cover" data-to="${p.cover ? 'Changer l’image' : 'Ajouter une image'} de ${esc(p.fr.title || 'ce projet')}">
    <button type="button" class="grip" aria-label="Déplacer ${esc(p.fr.title || 'ce projet')}. Flèches haut et bas."></button>
    <a class="rw-o" href="#projets/${esc(p.id)}"><span class="plate${p.cover ? '' : ' plate--none'}">${thumb(p.cover)}${ring}</span><span style="flex:1;min-width:0"><span class="rw-t">${esc(p.fr.title || 'Sans titre')}</span><span class="rw-s">${esc([catName(p.category), p.year].filter(Boolean).join(', '))}</span></span></a>${tec(p.cover, 'cover', 'mini')}
    <label class="tg"><input type="checkbox" data-k="featured"${p.featured ? ' checked' : ''}><i aria-hidden="true"></i><span>Accueil</span></label><a class="rw-o" style="flex:none;padding:14px 6px" href="#projets/${esc(p.id)}" tabindex="-1" aria-hidden="true"><i class="rw-a"></i></a></li>`).join('')}</ul><p class="hint" style="margin-top:18px">L’ordre de la liste est celui du site. Le point bleu : le projet est sur l’accueil. Une image se dépose directement sur une ligne. En tout : <span id="allSum"></span>.</p>` : '<div class="none"><b></b><p>Aucun projet pour l’instant.</p></div>');
}
function projectView(p) {
  const L = lang, t = p[L] || (p[L] = {}), f = p.fr, ph = k => L === 'en' ? f[k] || '' : '', en = L === 'en' ? ' <span class="opt">(vide : le français est repris)</span>' : '';
  const live = JSON.parse(saved).projects.some(x => x.id === p.id);
  return `<div class="vb">${crumbs('projets', 'Projets', f.title || 'Nouveau projet')}${langs()}</div><div data-o="project:${esc(p.id)}"><h1 class="sr" tabindex="-1">${esc(f.title || 'Nouveau projet')}</h1>
  <textarea class="vt" rows="1" data-k="${L}.title" maxlength="200" aria-label="Titre du projet" placeholder="${esc(L === 'en' ? f.title || 'Title' : 'Titre du projet')}">${esc(t.title)}</textarea>
  <div class="m9"><div class="ed-p">${zone('cover', p.cover, 'Image principale')}<div class="pa">${p.cover ? '<button type="button" class="tx" data-act="pick">Remplacer</button><button type="button" class="tx red" data-act="rmCover">Retirer</button>' : '<button type="button" class="tx" data-act="pick">Ajouter une image</button>'}</div>${tec(p.cover, 'cover', 'full')}<p class="hint">${p.cover ? 'Déposez un fichier dessus pour la remplacer. Glissez-la sur une image de la galerie pour les échanger.' : 'Choisie, déposée ou collée. Sans image, le point est affiché.'}</p></div>
  <div class="ed-f ef">
    ${richField('Description' + en, L + '.desc', t.desc, { ph: richWords(ph('desc')), max: 6000 })}
    <fieldset class="chips w2"><legend class="fl">Catégorie</legend>${data.categories.map(c => `<label><input type="radio" name="cat" data-k="category" value="${esc(c.id)}"${c.id === p.category ? ' checked' : ''}><span><b>${esc(c.fr)}</b></span></label>`).join('')}</fieldset>
    ${field('Type de projet', L + '.type', t.type, { ph: ph('type') || 'Identité et site' })}${field('Rôle du studio', L + '.role', t.role, { ph: ph('role') })}
    ${field('Lieu', L + '.place', t.place, { ph: ph('place') })}${field('Année', 'year', p.year, { max: 12 })}
    <label class="tg w2"><input type="checkbox" data-k="featured"${p.featured ? ' checked' : ''}><i aria-hidden="true"></i><span>Sur la page d’accueil</span></label>
  </div></div>
  <section class="sct"><h2>Galerie<span class="sum" id="galSum"></span></h2><div class="gal">${(p.images || []).map((id, i) => `<div class="gi" data-s data-img="${i}"><label class="dz" data-drop="img" data-say="Remplacer" data-to="Remplacer"><img src="${imgURL(id)}" alt="Image ${i + 1}" loading="lazy" draggable="false"><input type="file" accept="image/*" data-file="img" aria-label="Remplacer l’image ${i + 1}">${ring}</label>${tec(id, 'gallery')}<div class="ga"><button type="button" class="grip" aria-label="Déplacer l’image ${i + 1}. Flèches."></button><button type="button" class="tx" data-act="toCover" aria-label="Mettre l’image ${i + 1} en image principale">Principale</button><button type="button" class="tx red" data-act="rmImg" aria-label="Retirer l’image ${i + 1}">Retirer</button></div></div>`).join('')}${zone('gallery', '', 'Ajouter des images à la galerie')}</div><p class="hint">Glissez une image pour la déplacer, ou sur l’image principale pour les échanger. Un fichier se dépose sur une image pour la remplacer, sur ses bords pour s’ajouter avant ou après.</p></section>
  <section class="sct"><h2>Adresse</h2><div class="ef">${field('moyo-d0n.pages.dev/projets/', 'id', p.id, { max: 60 })}</div><div class="pa" style="margin-top:22px;justify-content:space-between">${live ? `<a class="tx" href="/projets/${esc(p.id)}" target="_blank" rel="noopener">Voir la page en ligne ↗</a>` : '<span></span>'}<button type="button" class="tx red" data-act="rmProject">Supprimer ce projet</button></div></section></div>`;
}

/* ---------- method ---------- */
const FITS = [['center', 'Au centre'], ['top', 'En haut'], ['bottom', 'En bas'], ['contain', 'En entier']], SIDES = [['left', 'À gauche'], ['center', 'Au centre'], ['right', 'À droite']];
function methodView() {
  const L = lang;
  return head('Méthode', langs()) + `<p class="vn">Quatre étapes en plein écran sur l’accueil. Écrivez directement sur l’image. Une vidéo est jouée sans son, en boucle. Un format paysage d’au moins 2560 px convient le mieux. En tout : <span id="mthSum"></span>.</p>` + data.method.map((m, i) => { const t = m[L] || (m[L] = {}); return `<section data-o="method:${i}"><p class="mt-k">Étape ${i + 1}<span>${!m.media ? 'sans image : fond bleu et point' : isVideo(m.media) ? 'vidéo' : isGif(m.media) ? 'GIF' : 'image'}</span></p>
  <div class="mt${m.media ? ' has' : ''}" data-fit="${esc(m.fit || 'center')}" data-al="${esc(m.align || 'left')}">${zone('media', '', 'Image, vidéo ou GIF de l’étape ' + (i + 1), 'image/*,video/mp4,video/webm', '', m.media).replace('<input', thumb(m.media, m.poster) + '<input')}
  <div class="mt-w"><textarea class="a" rows="1" data-k="${L}.title" maxlength="60" aria-label="Titre de l’étape ${i + 1}" placeholder="${esc(L === 'en' ? m.fr.title || 'Title' : 'Titre')}">${esc(t.title)}</textarea><textarea class="b" rows="2" data-k="${L}.text" maxlength="400" aria-label="Texte de l’étape ${i + 1}" placeholder="${esc(L === 'en' ? m.fr.text || 'Text' : 'Texte')}">${esc(t.text)}</textarea></div></div>
  <div class="mt-c">${tec(m.media, 'media')}<div class="pa" style="margin:0"><button type="button" class="tx" data-act="pick">${m.media ? 'Remplacer' : 'Choisir une image, une vidéo ou un GIF'}</button>${m.media ? '<button type="button" class="tx red" data-act="rmMedia">Retirer</button>' : ''}</div><div class="mt-o"><fieldset class="chips"><legend class="fl">Image</legend>${FITS.map(([v, n]) => `<label><input type="radio" name="fit${i}" data-k="fit" value="${v}"${(m.fit || 'center') === v ? ' checked' : ''}><span><b>${n}</b></span></label>`).join('')}</fieldset><fieldset class="chips"><legend class="fl">Mots</legend>${SIDES.map(([v, n]) => `<label><input type="radio" name="al${i}" data-k="align" value="${v}"${(m.align || 'left') === v ? ' checked' : ''}><span><b>${n}</b></span></label>`).join('')}</fieldset></div></div></section>`; }).join('') + '<p class="hint">Un fichier se dépose directement sur une étape. Une image se glisse sur une autre étape pour les échanger. Image : réduite à 3840 px. GIF : 20 Mo au plus. Vidéo MP4 (H.264) ou WebM : 24 Mo au plus, quelques secondes suffisent.</p>';
}

/* ---------- team ---------- */
function teamView() {
  return head('Équipe', '<button type="button" class="btn" data-act="newPerson"><span>Ajouter une personne</span><i class="ar add" aria-hidden="true"></i></button>') + `<ul class="rw">${data.team.map(m => `<li data-s data-o="team:${esc(m.id)}" data-drop="photo" data-to="${m.photo ? 'Changer le portrait' : 'Ajouter un portrait'} de ${esc(m.name || 'ce profil')}"><button type="button" class="grip" aria-label="Déplacer ${esc(m.name || 'ce profil')}. Flèches haut et bas."></button><a class="rw-o" href="#equipe/${esc(m.id)}"><span class="plate${m.photo ? '' : ' plate--none'}">${thumb(m.photo)}${ring}</span><span style="flex:1;min-width:0"><span class="rw-t">${esc(m.name || 'Sans nom')}</span><span class="rw-s">${esc(m.fr?.role)}</span></span>${tec(m.photo, 'photo', 'mini')}<i class="rw-a" aria-hidden="true"></i></a></li>`).join('')}</ul>`;
}
function personView(m) {
  const L = lang, t = m[L] || (m[L] = {}), f = m.fr || (m.fr = {}), ph = k => L === 'en' ? f[k] || '' : '', live = JSON.parse(saved).team?.some(x => x.id === m.id);
  return `<div class="vb">${crumbs('equipe', 'Équipe', m.name || 'Nouveau profil')}${langs()}</div><div data-o="team:${esc(m.id)}"><div class="vh"><h1 class="t-xl" tabindex="-1"><span id="who">${esc(m.name || 'Nouveau profil')}</span>${dot}</h1></div>
  <div class="m9"><div class="ed-p">${zone('photo', m.photo, 'Portrait')}<div class="pa">${m.photo ? '<button type="button" class="tx" data-act="pick">Remplacer</button><button type="button" class="tx red" data-act="rmPhoto">Retirer</button>' : '<button type="button" class="tx" data-act="pick">Ajouter un portrait</button>'}</div>${tec(m.photo, 'photo', 'full')}</div>
  <div class="ed-f ef">${field('Prénom', 'first', m.first ?? (m.name || '').split(' ')[0], { max: 60 })}${field('Nom', 'last', m.last ?? (m.name || '').split(' ').slice(1).join(' '), { max: 60 })}${field('Titre', L + '.role', t.role, { ph: ph('role') || 'Cofondatrice', w2: 1, max: 120 })}${richField('Biographie' + (L === 'en' ? ' <span class="opt">(vide : le français est repris)</span>' : ''), L + '.bio', t.bio, { ph: richWords(ph('bio')), max: 4000 })}</div></div>
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
  const k = e.target.dataset.k, o = k && objOf(e.target); if (!o) return; e.target.removeAttribute('aria-invalid');
  const rich = e.target.isContentEditable, v = rich ? richText(e.target) : e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (rich) richShow(e.target);
  if (k === 'id') return; // on change
  const path = k.split('.'); if (path.length === 2) (o[path[0]] ||= {})[path[1]] = v; else o[k] = v;
  if (k === 'first' || k === 'last') { o.first ??= ''; o.last ??= ''; o.name = `${o.first} ${o.last}`.trim(); $('#who').textContent = o.name || 'Nouveau profil'; $('.crumbs [aria-current] span').textContent = o.name || 'Nouveau profil'; }
  if (k === 'fr.title' && e.target.matches('.vt')) $('.crumbs [aria-current] span').textContent = v || 'Nouveau projet';
  if (k === 'fit' || k === 'align') e.target.closest('section').querySelector('.mt').dataset[k === 'fit' ? 'fit' : 'al'] = v;
  touched();
});
V.addEventListener('change', e => {
  const t = e.target, o = objOf(t); if (!o) return;
  if (t.dataset.file) { take(t.dataset.file, t.files, t.closest('.dz'), o); t.value = ''; return; }
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
  else if (act === 'toCover') toCover(o, +b.closest('[data-img]').dataset.img);
  else if (act === 'rmCover' || act === 'rmPhoto') { const was = JSON.stringify(data), k = act === 'rmCover' ? 'cover' : 'photo', x = o[k]; o[k] = null; changed(k === 'cover' ? 'Image principale retirée.' : 'Portrait retiré.', was, [x]); }
  else if (act === 'rmMedia') { const was = JSON.stringify(data), x = [o.media, o.poster]; o.media = o.poster = null; changed('Étape sans image.', was, x); }
  else if (act === 'rmImg') { const was = JSON.stringify(data), x = o.images.splice(+b.closest('[data-img]').dataset.img, 1); changed('Image retirée de la galerie.', was, x); }
  else if (act === 'rmProject') { if (await ask(`Supprimer « ${o.fr.title || 'Sans titre'} » ?`, 'Le projet quittera le site à la prochaine publication.', 'Supprimer')) { data.projects.splice(data.projects.indexOf(o), 1); [o.cover, ...(o.images || [])].forEach(drop); location.hash = 'projets'; } }
  else if (act === 'rmPerson') { if (await ask(`Retirer ${o.name || 'ce profil'} de l’équipe ?`, 'Sa page quittera le site à la prochaine publication.', 'Retirer')) { data.team.splice(data.team.indexOf(o), 1); drop(o.photo); location.hash = 'equipe'; } }
  else if (act === 'rmCat') { data.categories.splice(data.categories.indexOf(o), 1); render(true); }
  else if (act === 'rmMsg') { const li = b.closest('li'); if (await ask('Supprimer ce message ?', 'Il ne pourra pas être récupéré.', 'Supprimer')) api('/api/messages/' + encodeURIComponent(li.dataset.id), { method: 'DELETE' }).then(() => { msgs = msgs.filter(m => m.id !== li.dataset.id); render(true); toast('Message supprimé.'); }).catch(fail); }
});

/* ---------- order: with the pointer or the arrows ---------- */
/* an image of the gallery and the main one change places (or the gallery gives it, when there was none) */
function toCover(o, i) { const was = JSON.stringify(data), x = o.images[i], y = o.cover; o.cover = x; if (y) o.images[i] = y; else o.images.splice(i, 1); changed(y ? 'Les deux images ont échangé leur place.' : 'C’est l’image principale.', was); }
const noClick = () => { const f = e => { e.preventDefault(); e.stopPropagation(); }; addEventListener('click', f, true); setTimeout(() => removeEventListener('click', f, true), 60); }; // the end of a move is not a click
function moved(list, a, b) { list.splice(b, 0, list.splice(a, 1)[0]); render(true); $$('#view [data-s] .grip')[b]?.focus({ preventScroll: true }); }
function sortable(box, done, onto) {
  if (!box) return; const items = () => [...box.children].filter(c => c.hasAttribute('data-s'));
  box.addEventListener('keydown', e => { const g = e.target.closest('.grip'), d = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key]; if (!g || !d) return; e.preventDefault(); const l = items(), a = l.indexOf(g.closest('[data-s]')), b = clamp(a + d, 0, l.length - 1); if (a !== b) done(a, b); });
  box.addEventListener('pointerdown', e => {
    const grip = e.target.closest('.grip'), g = grip || (onto && e.pointerType !== 'touch' && !e.target.closest('button') && e.target.closest('[data-img] .dz')); if (!g || e.button) return; if (grip) e.preventDefault(); // by its handle, or directly by the picture
    const l = items(), from = l.indexOf(g.closest('[data-s]')), me = l[from], S = l.map(i => { const r = i.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }), col = S.every(s => Math.abs(s.x - S[0].x) < 4), gap = col && S[1] ? S[1].y - S[0].y - S[0].h : 0;
    const sx = e.clientX, sy = e.clientY + scrollY; let to = from, px = e.clientX, py = e.clientY, raf = 0, on = false, main = null; const begin = () => { on = true; me.classList.add('drag'); box.classList.add('sorting'); root.classList.add('carry'); getSelection()?.removeAllRanges(); raf = requestAnimationFrame(edge); }; if (grip) try { g.setPointerCapture(e.pointerId); } catch (_) {}
    const place = () => { const o = l.map((_, i) => i).filter(i => i !== from); o.splice(to, 0, from); let y = S[0].y; o.forEach((i, k) => { const ty = col ? y : S[k].y, tx = col ? S[i].x : S[k].x; y += S[i].h + gap; if (i !== from) l[i].style.translate = `${tx - S[i].x}px ${ty - S[i].y}px`; }); };
    const step = () => { me.style.translate = `${col ? 0 : px - sx}px ${py + scrollY - sy}px`; const cx = S[from].x + S[from].w / 2 + (col ? 0 : px - sx), cy = S[from].y + S[from].h / 2 + py + scrollY - sy; let best = to, d = 1e9; S.forEach((s, k) => { const q = Math.hypot(s.x + s.w / 2 - cx, s.y + s.h / 2 - cy); if (q < d) { d = q; best = k; } }); const c = onto && document.elementFromPoint(px, py)?.closest(onto.sel); if (c !== main) { main?.classList.remove('over', 'in'); main = c || null; main?.classList.add('over', 'in'); me.classList.toggle('onto', !!main); } if (main) best = from; if (best !== to) { to = best; place(); } };
    const edge = () => { const v = py < 120 ? (py - 120) / 7 : py > innerHeight - 90 ? (py - innerHeight + 90) / 7 : 0; if (v) { scrollBy(0, v); step(); } raf = requestAnimationFrame(edge); };
    const mv = q => { px = q.clientX; py = q.clientY; if (!on) { if (Math.hypot(px - sx, py + scrollY - sy) < 7) return; begin(); } step(); };
    const end = () => { cancelAnimationFrame(raf); removeEventListener('pointermove', mv); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); if (!on) return; if (!grip) noClick(); root.classList.remove('carry'); main?.classList.remove('over', 'in'); me.classList.remove('onto'); l.forEach(i => { i.style.translate = ''; i.style.transition = 'none'; }); me.classList.remove('drag'); box.classList.remove('sorting'); requestAnimationFrame(() => l.forEach(i => { i.style.transition = ''; })); if (main) onto.put(from); else if (to !== from) done(from, to); };
    addEventListener('pointermove', mv); addEventListener('pointerup', end); addEventListener('pointercancel', end); if (grip) begin();
  });
}

/* ---------- a picture is taken directly, and exchanged with the one it is put on: main image and gallery, steps of the method ---------- */
V.addEventListener('mousedown', e => { if (!e.button && e.target.closest('.dz')) e.preventDefault(); }); // no text is selected on the way
V.addEventListener('pointerdown', e => {
  const z = e.target.closest('.ed-p .dz[data-drop="cover"],.mt .dz[data-drop="media"]'), o = z && objOf(z), what = z?.dataset.drop; if (!z || e.button || e.pointerType === 'touch' || !o[what] || z.classList.contains('busy')) return;
  const sel = what === 'cover' ? '.gal .dz[data-drop="img"]' : '.mt .dz[data-drop="media"]', x0 = e.clientX, y0 = e.clientY; let g = null, at = null, px = x0, py = y0, raf = 0;
  const look = () => { g.style.translate = `${px}px ${py}px`; const d = document.elementFromPoint(px, py)?.closest(sel), t = d && d !== z ? d : null; if (t !== at) { at?.classList.remove('over', 'in'); at = t; at?.classList.add('over', 'in'); } };
  const edge = () => { const v = py < 110 ? (py - 110) / 7 : py > innerHeight - 90 ? (py - innerHeight + 90) / 7 : 0; if (v) { scrollBy(0, v); look(); } raf = requestAnimationFrame(edge); };
  const mv = q => {
    px = q.clientX; py = q.clientY;
    if (!g) { if (Math.hypot(px - x0, py - y0) < 7) return; const p = z.querySelector('img,video'), r = p.getBoundingClientRect(), c = p.cloneNode(); g = document.createElement('div'); g.className = 'ghost'; g.style.aspectRatio = `${r.width}/${r.height}`; c.removeAttribute('autoplay'); g.append(c); document.body.append(g); z.classList.add('lift'); root.classList.add('carry'); $$(sel).forEach(d => { if (d !== z) { d.classList.add('can'); d.dataset.was = d.dataset.to; d.dataset.to = 'Échanger'; } }); raf = requestAnimationFrame(edge); }
    look();
  };
  const end = q => {
    removeEventListener('pointermove', mv); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); if (!g) return; cancelAnimationFrame(raf); noClick(); g.remove(); z.classList.remove('lift'); root.classList.remove('carry'); $$('.can').forEach(d => { d.classList.remove('can', 'over', 'in'); d.dataset.to = d.dataset.was; });
    if (!at || q.type === 'pointercancel') return;
    if (what === 'cover') toCover(o, +at.closest('[data-img]').dataset.img);
    else { const was = JSON.stringify(data), b = objOf(at); ['media', 'poster', 'fit'].forEach(k => { [o[k], b[k]] = [b[k] ?? null, o[k] ?? null]; }); [o, b].forEach(m => { m.fit ||= 'center'; }); changed('Les deux étapes ont échangé leur image.', was); }
  };
  addEventListener('pointermove', mv); addEventListener('pointerup', end); addEventListener('pointercancel', end);
});
addEventListener('dragstart', e => { if (e.target.closest?.('#view') && !e.target.matches('input,textarea')) e.preventDefault(); }); // the browser does not take the pictures away

/* ---------- files: chosen, dropped directly on the pictures, or pasted ---------- */
const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
let aim = null; // the picture under the file, and which part of it: the middle replaces, the edges add before or after
function aimAt(d, e) {
  let side = 'in'; if (d?.dataset.drop === 'img') { const r = d.getBoundingClientRect(), k = (e.clientX - r.left) / r.width, many = e.dataTransfer.items?.length > 1; side = k < (many ? .5 : .26) ? 'before' : k > (many ? .5 : .74) ? 'after' : 'in'; }
  if (aim && (aim.d !== d || aim.side !== side)) aim.d.classList.remove('over', 'before', 'after', 'in');
  aim = d ? { d, side } : null; if (d) d.classList.add('over', side);
}
/* beside the pictures, a file still has a place: the main image of the project if it has none, its gallery, the portrait */
const spare = () => $('#view [data-drop]:hover') || (!data || !route[1] ? null : route[0] === 'projets' && $('#view .gal') ? $(objOf($('#view .gal')).cover ? '#view [data-drop="gallery"]' : '#view [data-drop="cover"]') : route[0] === 'equipe' ? $('#view [data-drop="photo"]') : null);
let awayT; const away = () => { clearTimeout(awayT); root.classList.remove('files'); aimAt(null); };
addEventListener('dragover', e => { e.preventDefault(); if (!data || !hasFiles(e)) return; clearTimeout(awayT); root.classList.add('files'); const d = V.contains(e.target) ? e.target.closest('[data-drop]') : null; aimAt(d, e); e.dataTransfer.dropEffect = d || spare() ? 'copy' : 'none'; });
addEventListener('dragleave', e => { if (!e.relatedTarget) { clearTimeout(awayT); awayT = setTimeout(away, 120); } }); addEventListener('dragend', away);
addEventListener('drop', e => {
  e.preventDefault(); const at = aim, f = e.dataTransfer?.files, t = [...(e.dataTransfer?.types || [])]; away(); if (!data) return;
  if (!f?.length) { if (t.includes('text/uri-list') || t.includes('text/html')) toast('Cette image vient d’une page web. Enregistrez-la d’abord sur l’ordinateur, puis déposez le fichier.', true); return; }
  const z = at?.d || spare(); if (!z) return toast('Déposez le fichier sur une image.', true);
  take(z.dataset.drop, f, z, objOf(z), at?.side);
});
addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].filter(x => x.type.startsWith('image/')), z = f.length && spare(); if (z) { e.preventDefault(); take(z.dataset.drop, f, z, objOf(z)); } });
/* what was sent, in one line */
const gain = ids => { const l = ids.map(i => facts.get(i)).filter(Boolean), now = l.reduce((s, f) => s + (f.size || 0), 0), was = l.reduce((s, f) => s + (f.from || f.size || 0), 0); return `${l.length === 1 && l[0].w ? `${l[0].w} × ${l[0].h} px, ` : ''}${ko(now)}${was > now * 1.08 ? ` (${ko(was)} au départ)` : ''}`; };
async function take(what, files, z, o, side = 'in') {
  const list = [...files]; if (!list.length || !o) return; const say = p => z.style.setProperty('--u', p); z.classList.add('busy'); say(4);
  const here = route.join('/'), was = JSON.stringify(data), end = (text, gone) => { if (route.join('/') === here) changed(text, was, gone); else { touched(); toast(text); } };
  const many = async l => { const got = []; for (let n = 0; n < l.length; n++) got.push(await picture(l[n], p => say(Math.round((n + p / 100) / l.length * 100)))); return got; };
  try {
    if (what === 'gallery' || what === 'img') {
      const l = list.filter(f => f.type.startsWith('image/')); if (!l.length) throw new Error('Choisissez des images.'); o.images ||= [];
      const i = what === 'img' ? +z.closest('[data-img]').dataset.img : 0, swap = what === 'img' && side === 'in' && l.length === 1;
      if (!swap && o.images.length + l.length > 40) throw new Error('40 images au plus par projet.');
      const got = await many(l); const x = swap ? o.images.splice(i, 1, got[0]) : []; if (!swap) o.images.splice(what === 'img' ? i + (side === 'before' ? 0 : 1) : o.images.length, 0, ...got);
      end(`${swap ? 'Image remplacée' : got.length > 1 ? got.length + ' images ajoutées' : 'Image ajoutée'} : ${gain(got)}.`, x);
    }
    else if (what === 'media') { const r = await film(list[0], say), x = [o.media, o.poster]; o.media = r.id; o.poster = r.poster; await about(r.id); end(`${isVideo(r.id) ? 'Vidéo' : isGif(r.id) ? 'GIF' : 'Image'} : ${gain([r.id])}.`, x); }
    else { const id = await picture(list[0], say), x = o[what]; o[what] = id; const more = what === 'cover' ? list.slice(1).filter(f => f.type.startsWith('image/')) : []; if (more.length) (o.images ||= []).push(...await many(more.slice(0, 40 - (o.images || []).length))); end(`${what === 'photo' ? 'Portrait' : 'Image principale'} : ${gain([id])}.${more.length ? ' Les autres sont dans la galerie.' : ''}`, [x]); }
  } catch (e) { z.classList.remove('busy'); fail(e); }
}
/* reduced in the browser before it is sent: 2800 px on the long side (3840 for a full screen), WebP (JPEG where WebP is not available). A GIF is sent as it is. */
const WEB = ['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif'];
async function picture(f, say, max = 2800) {
  if (!f.type.startsWith('image/')) throw new Error('Choisissez une image.');
  let blob = f, w = 0, h = 0;
  try { const b = await createImageBitmap(f); w = b.width; h = b.height;
    if (f.type !== 'image/gif') { const s = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas'); c.width = w = Math.round(w * s); c.height = h = Math.round(h * s); const k = c.getContext('2d'); k.imageSmoothingQuality = 'high'; k.drawImage(b, 0, 0, w, h); const goal = (max > 3000 ? 1.4 : .8) * 1048576; for (const q of [.86, .8, .74]) { const to = t => new Promise(r => c.toBlob(r, t, q)); blob = await to('image/webp'); if (!blob || blob.type !== 'image/webp') blob = await to('image/jpeg'); if (blob.size <= goal) break; } } // as fine as it can be under that weight
    b.close?.();
  } catch (_) { if (!WEB.includes(f.type)) throw new Error(`Le format ${(f.type.split('/')[1] || '').replace('svg+xml', 'SVG').toUpperCase() || 'de ce fichier'} n’est pas lu par les navigateurs. Exportez l’image en JPEG, PNG ou WebP.`); blob = f; }
  const top = blob.type === 'image/gif' ? 20 : 10; if (blob.size > top * 1048576) throw new Error(`${blob.type === 'image/gif' ? 'GIF trop lourd' : 'Image trop lourde'} (${mo(blob.size)}, ${top} Mo au plus).`);
  const id = await send(blob, blob.type, say); facts.set(id, { w, h, size: blob.size, from: blob === f ? 0 : f.size, done: !!w }); return id;
}
async function film(f, say) {
  if (f.type.startsWith('image/')) { if (f.type === 'image/gif' && f.size > 20 * 1048576) throw new Error(`GIF trop lourd (${mo(f.size)}, 20 Mo au plus). Une vidéo MP4 serait dix fois plus légère.`); return { id: await picture(f, say, 3840), poster: null }; }
  if (!f.type.startsWith('video/')) throw new Error('Choisissez une image, une vidéo MP4 ou WebM, ou un GIF.');
  if (!['video/mp4', 'video/webm'].includes(f.type)) throw new Error('Ce format de vidéo n’est pas lu par tous les navigateurs. Exportez-la en MP4 (H.264).');
  if (f.size > 24 * 1048576) throw new Error(`Vidéo trop lourde (${mo(f.size)}, 24 Mo au plus). Raccourcissez-la ou baissez sa qualité.`);
  const poster = await first(f), id = await send(f, f.type, say); facts.set(id, { size: f.size }); return { id, poster };
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
