/* Project markup, shared by three places:
   - build.mjs renders the seed (data/projects.json) into the static pages,
   - functions/_middleware.js re-renders them from KV on every request,
   - the pages' own script (src/site.js) updates them on language change and fills the project sheet.
   Only shared/rich.js is imported, and `export` stays on the last line: build.mjs strips both lines to inline the files. */
import { richWords } from './rich.js';

const escHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const imgURL = id => (id && (id[0] === '/' || id.startsWith('http'))) ? id : '/img/' + encodeURIComponent(id);

function catLabel(data, id, lang) {
  const c = (data.categories || []).find(c => c.id === id);
  return c ? (c[lang] || c.fr || c.id) : '';
}

/* texts of a project in a language, French where a translation is missing; in French no line starts with : ; ? or ! */
function txt(p, lang) {
  const t = { ...(p.fr || {}), ...Object.fromEntries(Object.entries(p[lang] || {}).filter(([, v]) => v)) };
  return lang === 'fr' ? Object.fromEntries(Object.entries(t).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/ ([:;?!])/g, '\u00a0$1') : v])) : t;
}

function plateInner(p, alt) {
  return p.cover ? `<img src="${imgURL(p.cover)}" alt="${escHTML(alt || '')}" loading="lazy" decoding="async">` : ''; // no cover: the plate draws the dot
}

const metaText = (p, t) => [t.place, p.year].filter(Boolean).join(', ');

/* One project. The same markup on the home (one per row, with its description) and on /projets (contact sheet). */
function rowHTML(p, i, lang) {
  const t = txt(p, lang);
  return `<li class="case" data-cat="${escHTML(p.category)}"><a class="row" href="${lang === 'en' ? '/en' : ''}/projets/${encodeURIComponent(p.id)}" data-p="${i}" data-id="${escHTML(p.id)}">` +
    `<span class="plate${p.cover ? '' : ' plate--none'}" aria-hidden="true">${plateInner(p, [t.title, t.type].filter(Boolean).join(', '))}</span>` +
    `<span class="cap"><span class="r-title">${escHTML(t.title)}</span><span class="r-desc">${escHTML(richWords(t.desc))}</span>` +
    `<span class="r-type">${escHTML(t.type)}</span><span class="r-meta">${escHTML(metaText(p, t))}</span></span></a></li>`;
}

/* projects of the home page */
function featuredOf(data) {
  const all = data.projects || [];
  const f = all.filter(p => p.featured);
  return f.length ? f : all.slice(0, 6);
}

function rowsHTML(list, lang) {
  return list.map((p, i) => rowHTML(p, i, lang)).join('');
}

/* Method: the four steps (home). A picture, a video or a GIF for each, from the admin; without one, the dot. A video is silent and loops;
   method.js fetches it when the section is near, plays it when its step is on screen, and takes its controls away (they stay with reduced motion). */
const isVideo = id => /\.(mp4|webm)$/i.test(id || '');
const bi = (fr, en) => `data-fr="${escHTML(fr)}" data-en="${escHTML(en || fr)}">${escHTML(fr)}`;
function mediaHTML(s) {
  const t = escHTML((s.fr && s.fr.title) || ''), fit = ['top', 'bottom', 'contain'].includes(s.fit) ? s.fit : 'center';
  const inner = !s.media ? '' : isVideo(s.media)
    ? `<video data-src="${imgURL(s.media)}"${s.poster ? ` poster="${imgURL(s.poster)}"` : ''} muted loop playsinline controls preload="none" aria-label="${t}"></video>`
    : `<img src="${imgURL(s.media)}" alt="${t}" loading="lazy" decoding="async">`;
  return `<figure class="mth-m${s.media ? '' : ' plate--none'}" data-fit="${fit}">${inner}</figure>`;
}
const stepsHTML = steps => (steps || []).slice(0, 4).map((s, i) => `<li class="step q${i + 1}"${['center', 'right'].includes(s.align) ? ` data-al="${s.align}"` : ''}>${mediaHTML(s)}<h3 class="t-m" ${bi(s.fr.title, s.en && s.en.title)}</h3><p class="mute" data-ink="step" ${bi(s.fr.text, s.en && s.en.text)}</p></li>`).join('');
const tabsHTML = steps => (steps || []).slice(0, 4).map((s, i) => `<button type="button" tabindex="-1" class="tab q${i + 1}"><span ${bi(s.fr.title, s.en && s.en.title)}</span></button>`).join('');

/* JSON that can sit inside <script type="application/json"> without closing it. */
function dataJSON(data) {
  return JSON.stringify(data, (k, v) => k === 'blocks' ? undefined : v).replace(/</g, '\\u003c');
}

export { escHTML, imgURL, catLabel, txt, plateInner, metaText, rowHTML, featuredOf, rowsHTML, stepsHTML, tabsHTML, isVideo, dataJSON };
