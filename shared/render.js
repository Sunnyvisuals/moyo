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

function plateInner(p, alt) {
  return p.cover ? `<img src="${imgURL(p.cover)}" alt="${escHTML(alt || '')}" loading="lazy" decoding="async">` : ''; // no cover: the plate draws the dot
}

const metaText = (p, t) => [t.place, p.year].filter(Boolean).join(', ');

/* One project. The same markup on the home (one per row, with its description) and on /projets (contact sheet). */
function rowHTML(p, i, lang) {
  const t = txt(p, lang);
  return `<li class="case" data-cat="${escHTML(p.category)}"><button class="row" type="button" data-p="${i}" data-id="${escHTML(p.id)}">` +
    `<span class="plate${p.cover ? '' : ' plate--none'}" aria-hidden="true">${plateInner(p)}</span>` +
    `<span class="cap"><span class="r-title">${escHTML(t.title)}</span><span class="r-desc">${escHTML(t.desc)}</span>` +
    `<span class="r-type">${escHTML(t.type)}</span><span class="r-meta">${escHTML(metaText(p, t))}</span></span></button></li>`;
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

/* JSON that can sit inside <script type="application/json"> without closing it. */
function dataJSON(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export { escHTML, imgURL, catLabel, txt, plateInner, metaText, rowHTML, featuredOf, rowsHTML, dataJSON };
