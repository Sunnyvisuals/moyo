/* The layout of a project, made in the admin: a list of blocks, each on one or more of the four axes of the page (at: [first axis, how many], 0 to 3),
   or from edge to edge (wide: 'full'), or on the whole screen (wide: 'screen'). Blocks that fit side by side share a row.
     image   src, sm (a smaller one), iw, ih, ratio, fit, caption
     video   src, poster, iw, ih, ratio, fit, mode ('loop': silent, in a loop; 'player': with its controls and its sound), caption
     text    fr.text, en.text (shared/rich.js), size ('', 'large', 'title')
     info    fr.rows, en.rows: [{ k, v }], look ('list', 'figures')
     embed   url (a page of another service), ratio, poster, caption. Nothing is asked to that service before the visitor says so
   Shared by the server (which checks and draws them) and the admin. `import` and `export` each on their own line: build.mjs strips them to inline the file. */
import { richHTML } from './rich.js';

const BK_TYPES = ['image', 'video', 'text', 'info', 'embed'], BK_RATIOS = ['21:9', '16:9', '3:2', '4:3', '1:1', '4:5', '3:4', '9:16'], BK_MAX = 120;
const bkEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bkImg = id => (id && (id[0] === '/' || id.startsWith('http'))) ? id : '/img/' + encodeURIComponent(id);

/* ---------- pages of other services: what is pasted (an address, or the <iframe> they give) becomes the address of their player ---------- */
function bkEmbed(text) {
  const t = String(text || '').trim(), raw = (/<iframe[^>]+src=["']([^"']+)["']/i.exec(t) || [, t])[1].replace(/&amp;/g, '&');
  let u; try { u = new URL(/^\/\//.test(raw) ? 'https:' + raw : /^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (_) { return null; }
  if (!/^https?:$/.test(u.protocol) || !/\.[a-z]{2,}$/i.test(u.hostname) || u.username) return null; u.protocol = 'https:';
  const h = u.hostname.replace(/^(www|m|player|open|w|geo|embed|e)\./, ''), p = u.pathname, q = k => u.searchParams.get(k) || '', m = r => (r.exec(p) || [])[1];
  const film = (name, src, ratio = '16:9') => ({ name, kind: 'film', src, ratio });
  if (h === 'youtube.com' || h === 'youtu.be' || h === 'youtube-nocookie.com') { const id = h === 'youtu.be' ? m(/^\/([\w-]{6,20})/) : q('v') || m(/^\/(?:embed|shorts|live|v)\/([\w-]{6,20})/); return /^[\w-]{6,20}$/.test(id || '') ? film('YouTube', `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`, /\/shorts\//.test(p) ? '9:16' : '16:9') : null; }
  if (h === 'vimeo.com') { const id = m(/^\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{5,})/), k = q('h') || m(/^\/\d{5,}\/([\da-f]{6,})/); return id ? film('Vimeo', `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1${k ? '&h=' + encodeURIComponent(k) : ''}`) : null; }
  if (h === 'dailymotion.com' || h === 'dai.ly') { const id = m(/^\/(?:video\/|embed\/video\/)?([a-z0-9]{5,12})/i) || q('video'); return id ? film('Dailymotion', `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(id)}`) : null; }
  if (h === 'loom.com') { const id = m(/^\/(?:share|embed)\/([\da-f]{20,})/); return id ? film('Loom', `https://www.loom.com/embed/${id}?autoplay=1`) : null; }
  if (h === 'tiktok.com') { const id = m(/\/video\/(\d{8,})/); return id ? film('TikTok', `https://www.tiktok.com/embed/v2/${id}`, '9:16') : null; }
  if (h === 'instagram.com') { const id = m(/^\/(?:[\w.]+\/)?((?:p|reel|tv)\/[\w-]+)/); return id ? { name: 'Instagram', kind: 'page', src: `https://www.instagram.com/${id.replace(/^tv/, 'p')}/embed`, ratio: '4:5' } : null; }
  if (h === 'figma.com') return { name: 'Figma', kind: 'page', src: 'https://www.figma.com/embed?embed_host=moyo&url=' + encodeURIComponent('https://www.figma.com' + p + u.search), ratio: '16:9' };
  if (h === 'spotify.com') { const id = m(/^\/(?:intl-\w+\/|embed\/)?((?:track|album|playlist|episode|show|artist)\/\w+)/); return id ? { name: 'Spotify', kind: 'sound', src: 'https://open.spotify.com/embed/' + id, height: 352 } : null; }
  if (h === 'soundcloud.com') return { name: 'SoundCloud', kind: 'sound', src: (u.hostname.startsWith('w.') ? u.href : 'https://w.soundcloud.com/player/?color=%23002fa7&visual=false&url=' + encodeURIComponent('https://soundcloud.com' + p)), height: 166 };
  if (h === 'codepen.io') { const r = /^\/([\w-]+)\/(?:pen|embed|full|details)\/([\w-]+)/.exec(p); return r ? { name: 'CodePen', kind: 'page', src: `https://codepen.io/${r[1]}/embed/${r[2]}?default-tab=result`, ratio: '16:9' } : null; }
  if (h === 'sketchfab.com') { const id = m(/([\da-f]{32})/); return id ? { name: 'Sketchfab', kind: 'page', src: `https://sketchfab.com/models/${id}/embed?autostart=1`, ratio: '16:9' } : null; }
  if (h === 'behance.net') { const id = m(/(?:gallery|project)\/(\d+)/); return id ? { name: 'Behance', kind: 'page', src: `https://www.behance.net/embed/project/${id}?ilo0=1`, ratio: '4:3' } : null; }
  if (h === 'google.com' && /^\/maps/.test(p)) { const a = /@(-?[\d.]+),(-?[\d.]+)/.exec(p); return { name: 'Google Maps', kind: 'page', src: /^\/maps\/embed/.test(p) ? u.href : `https://www.google.com/maps?q=${encodeURIComponent(a ? a[1] + ',' + a[2] : decodeURIComponent((/\/place\/([^/]+)/.exec(p) || [, q('q')])[1]).replace(/\+/g, ' '))}&z=15&output=embed`, ratio: '16:9' }; }
  return { name: u.hostname.replace(/^www\./, ''), kind: 'page', src: u.href, ratio: '16:9', other: true };
}

/* ---------- what the server keeps ---------- */
function bkClean(list, isPicture, isFilm) {
  const str = (v, m) => typeof v === 'string' ? v.trim().slice(0, m) : '', pick = (v, l, d = '') => l.includes(v) ? v : d, int = (v, a, b, d) => Number.isInteger(v) ? Math.min(b, Math.max(a, v)) : d, px = v => int(v, 0, 20000, 0);
  const out = [], seen = new Set();
  for (const b of Array.isArray(list) ? list.slice(0, BK_MAX) : []) {
    if (!b || typeof b !== 'object' || !BK_TYPES.includes(b.t)) continue;
    let id = /^[a-z0-9]{3,16}$/.test(b.id) ? b.id : ''; while (!id || seen.has(id)) id = 'b' + Math.random().toString(36).slice(2, 9); seen.add(id);
    const s = int(Array.isArray(b.at) ? b.at[0] : 0, 0, 3, 0), n = int(Array.isArray(b.at) ? b.at[1] : 4, 1, 4 - s, 4 - s), o = { id, t: b.t, at: [s, n], gap: pick(b.gap, ['tight', 'large']), br: !!b.br };
    const both = f => { o.fr = f(b.fr || {}); o.en = f(b.en || {}); };
    if (b.t === 'text') { both(x => ({ text: str(x.text, 6000) })); o.size = pick(b.size, ['large', 'title']); }
    else if (b.t === 'info') { both(x => ({ rows: (Array.isArray(x.rows) ? x.rows : []).slice(0, 16).map(r => ({ k: str(r && r.k, 120), v: str(r && r.v, 240) })) })); o.look = pick(b.look, ['figures'], 'list'); }
    else {
      o.wide = pick(b.wide, b.t === 'embed' ? ['full'] : ['full', 'screen']); o.ratio = pick(b.ratio, BK_RATIOS); both(x => ({ cap: str(x.cap, 300) }));
      if (b.t !== 'embed') { o.fit = pick(b.fit, ['top', 'bottom', 'contain']); o.iw = px(b.iw); o.ih = px(b.ih); }
      if (b.t === 'image') { o.src = isPicture(b.src) ? b.src : null; o.sm = o.src && isPicture(b.sm) ? b.sm : null; }
      if (b.t === 'video') { o.src = isFilm(b.src) ? b.src : null; o.poster = isPicture(b.poster) ? b.poster : null; o.mode = pick(b.mode, ['player'], 'loop'); }
      if (b.t === 'embed') { const url = str(b.url, 2000); o.url = url && bkEmbed(url) ? url : ''; o.poster = isPicture(b.poster) ? b.poster : null; }
    }
    out.push(o);
  }
  return out;
}
/* the files a layout uses */
const bkFiles = list => (Array.isArray(list) ? list : []).flatMap(b => [b.src, b.sm, b.poster]).filter(Boolean);
/* nothing to show yet: an image without a picture, a text without words */
const bkEmpty = b => b.t === 'text' ? !(b.fr && b.fr.text) : b.t === 'info' ? !(b.fr && b.fr.rows || []).some(r => r.k || r.v) : b.t === 'embed' ? !b.url : !b.src;

/* the rows: a block shares the row of the one before when it begins after its end (br: never) */
function bkRows(list) {
  const rows = []; let end = 9;
  for (const b of list) { const [s, n] = b.at || [0, 4], alone = !!b.wide; if (alone || b.br || s < end || end > 3) rows.push([]); rows[rows.length - 1].push(b); end = alone ? 9 : s + n; }
  return rows;
}
/* ---------- how they are drawn. title: what the pictures show, when they have no caption ---------- */
function bkHTML(list, title = '') {
  const L = (Array.isArray(list) ? list : []).filter(b => !bkEmpty(b)); if (!L.length) return '';
  const langs = (b, k, f) => { const a = f((b.fr || {})[k]), e = f((b.en || {})[k]) || a; return [a, e]; };
  const cap = b => { const [a, e] = langs(b, 'cap', bkEsc); return a ? `<figcaption><span data-l="fr">${a}</span><span data-l="en">${e}</span></figcaption>` : ''; };
  const box = (b, w, h) => { const r = b.ratio ? b.ratio.split(':').join('/') : w && h ? `${w}/${h}` : ''; return r ? ` style="aspect-ratio:${r}"` : ''; };
  const one = (b, row) => {
    const [s, n] = b.at || [0, 4], wide = b.wide || '', alt = bkEsc((b.fr && b.fr.cap) || title), col = wide ? '1/-1' : `${s * 3 + 1}/span ${n * 3}`;
    const attr = k => `class="b b-${k}${wide ? ' b-' + wide : ''}${n === 1 && row.filter(x => x.at[1] === 1).length > 1 ? ' q' : ''}" style="grid-column:${col};--n:${wide ? 4 : n}"`;
    const cut = `fr${b.ratio || wide === 'screen' ? ' cut' : ''}${b.fit ? ' f-' + b.fit : ''}`;
    if (b.t === 'image') return `<figure ${attr('img')}><div class="${cut}"${box(b, b.iw, b.ih)}><img src="${bkImg(b.src)}"${b.sm ? ` srcset="${bkImg(b.sm)} 1200w, ${bkImg(b.src)} ${Math.max(1300, b.iw || 2800)}w" sizes="(max-width:820px) 100vw, ${wide ? 100 : Math.round(n * 25)}vw"` : ''} alt="${alt}"${b.iw && b.ih ? ` width="${b.iw}" height="${b.ih}"` : ''} loading="lazy" decoding="async"></div>${cap(b)}</figure>`;
    if (b.t === 'video') return `<figure ${attr('vid')}><div class="${cut}"${box(b, b.iw, b.ih)}><video data-src="${bkImg(b.src)}" data-mode="${b.mode === 'player' ? 'player' : 'loop'}"${b.poster ? ` poster="${bkImg(b.poster)}"` : ''}${b.mode === 'player' ? ' controls' : ' muted loop'} playsinline preload="none" aria-label="${alt}"></video></div>${cap(b)}</figure>`;
    if (b.t === 'text') { const [a, e] = langs(b, 'text', x => richHTML(x)); return `<div ${attr('txt' + (b.size ? ' z-' + b.size : ''))}><div class="rt" data-l="fr">${a}</div><div class="rt" data-l="en">${e}</div></div>`; }
    if (b.t === 'info') { const rows = x => (x || []).filter(r => r.k || r.v).map(r => b.look === 'figures' ? `<div><dd>${bkEsc(r.v)}</dd><dt>${bkEsc(r.k)}</dt></div>` : `<div><dt>${bkEsc(r.k)}</dt><dd>${bkEsc(r.v)}</dd></div>`).join(''), [a, e] = langs(b, 'rows', rows), dl = (h, l) => `<div data-l="${l}"><dl class="${b.look === 'figures' ? 'figs' : 'facts'}">${h}</dl></div>`; return `<div ${attr('inf')}>${dl(a, 'fr')}${dl(e, 'en')}</div>`; }
    const m = bkEmbed(b.url); if (!m) return '';
    const size = m.height && !b.ratio ? ` style="height:${m.height}px"` : ` style="aspect-ratio:${(b.ratio || m.ratio || '16:9').replace(':', '/')}"`;
    const go = { film: ['Lire la vidéo', 'Play the video'], sound: ['Écouter', 'Listen'], page: ['Ouvrir ici', 'Open it here'] }[m.kind], from = [`Le contenu vient de ${m.name}. Rien ne lui est demandé avant le clic.`, `The content comes from ${m.name}. Nothing is asked to it before you click.`];
    return `<figure ${attr('emb')}><div class="fr emb"${size} data-embed="${bkEsc(m.src)}" data-name="${bkEsc(m.name)}"${m.other ? ' data-other' : ''}>${b.poster ? `<img src="${bkImg(b.poster)}" alt="" loading="lazy" decoding="async">` : ''}<button type="button" class="emb-b"><span class="btn"><span data-l="fr">${go[0]}</span><span data-l="en">${go[1]}</span><i class="ar" aria-hidden="true"></i></span><small data-l="fr">${bkEsc(from[0])}</small><small data-l="en">${bkEsc(from[1])}</small></button><noscript><a href="${bkEsc(m.src)}">${bkEsc(m.name)}</a></noscript></div>${cap(b)}</figure>`;
  };
  const words = r => r.some(b => b.t === 'text' || b.t === 'info'), rows = bkRows(L);
  return `<div class="bk">${rows.map((r, i) => { const g = (r.find(b => b.gap) || {}).gap || ''; return `<div class="bk-r${words(r) || i && words(rows[i - 1]) ? ' r-words' : ''}${g ? ' r-' + g : ''}">${r.map(b => one(b, r)).join('')}</div>`; }).join('')}</div>`;
}

export { BK_TYPES, BK_RATIOS, BK_MAX, bkEmbed, bkClean, bkFiles, bkEmpty, bkRows, bkHTML };
