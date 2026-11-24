/* Project markup, shared by three places:
   - build.mjs renders the seed (data/projects.json) into the static pages,
   - functions/_middleware.js re-renders them from KV on every request,
   - the pages' own script (src/site.js) updates them on language change and fills the project sheet.
   Keep it dependency-free, and keep `export` on the last line only: build.mjs strips that line to inline the file. */

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

/* where a picture is centred when it is cropped ("50% 30%"), set in the admin by clicking on the picture */
const FOCUS = /^\d{1,3}(\.\d)?% \d{1,3}(\.\d)?%$/;
const focusStyle = f => (typeof f === 'string' && FOCUS.test(f) ? ` style="object-position:${f}"` : '');

function plateInner(p, alt) {
  return p.cover ? `<img src="${imgURL(p.cover)}" alt="${escHTML(alt || '')}"${focusStyle(p.focus)} loading="lazy" decoding="async">` : ''; // no cover: the plate draws the dot
}

/* the page of a project: crawlable, shareable; on the home and /projets a click opens it as a sheet instead */
const projURL = p => '/projets/' + encodeURIComponent(p.id);

const metaText = (p, t) => [t.place, p.year].filter(Boolean).join(', ');

/* One project. The same markup on the home (one per row, with its description) and on /projets (contact sheet). */
function rowHTML(p, i, lang) {
  const t = txt(p, lang);
  return `<li class="case" data-cat="${escHTML(p.category)}"><a class="row" href="${projURL(p)}" data-p="${i}" data-id="${escHTML(p.id)}">` +
    `<span class="plate${p.cover ? '' : ' plate--none'}" aria-hidden="true">${plateInner(p)}</span>` +
    `<span class="cap"><span class="r-title">${escHTML(t.title)}</span><span class="r-desc">${escHTML(t.desc)}</span>` +
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

/* JSON that can sit inside <script type="application/json"> without closing it. Only what the pages use. */
function dataJSON(data) {
  const projects = (data.projects || []).map(({ plate, ...p }) => p); // old hand-drawn plates are not shown any more
  return JSON.stringify({ categories: data.categories || [], projects }).replace(/</g, '\\u003c');
}

export { escHTML, imgURL, focusStyle, projURL, catLabel, txt, plateInner, metaText, rowHTML, featuredOf, rowsHTML, dataJSON };
