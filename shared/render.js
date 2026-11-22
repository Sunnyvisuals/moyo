/* Project markup, shared by three places:
   - build.mjs renders the seed (data/projects.json) into the static pages,
   - functions/_middleware.js re-renders them from KV on every request,
   - the pages' own script re-renders on language change.
   Keep it dependency-free, and keep `export` on the last line only: build.mjs strips that line to inline the file. */

const escHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Fallback drawing for a project with neither image nor plate: three horizontal slats, like the window. */
const FALLBACK_PLATE = '<svg class="f" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet"><g fill="currentColor"><rect x="110" y="70" width="280" height="76"/><rect x="110" y="162" width="280" height="76"/><rect x="110" y="254" width="280" height="76"/></g></svg>';

const imgURL = id => '/img/' + encodeURIComponent(id);

function catLabel(data, id, lang) {
  const c = (data.categories || []).find(c => c.id === id);
  return c ? (c[lang] || c.fr || c.id) : '';
}

function txt(p, lang) {
  return { ...(p.fr || {}), ...Object.fromEntries(Object.entries(p[lang] || {}).filter(([, v]) => v)) };
}

function plateInner(p, alt) {
  if (p.cover) return `<img src="${imgURL(p.cover)}" alt="${escHTML(alt || '')}" loading="lazy" decoding="async">`;
  return p.plate || FALLBACK_PLATE;
}

function plateAttrs(p) {
  return (!p.cover && p.tone === 'wash') ? ' data-t="wash"' : '';
}

function rowHTML(p, i, lang) {
  const t = txt(p, lang);
  return `<li data-cat="${escHTML(p.category)}"><button class="row" type="button" data-p="${i}" data-id="${escHTML(p.id)}">` +
    `<span class="plate row-bg"${plateAttrs(p)} aria-hidden="true">${plateInner(p)}</span>` +
    `<span class="cap"><span class="r-year">${escHTML(p.year)}</span><span class="r-title">${escHTML(t.title)}</span>` +
    `<span class="r-place">${escHTML(t.place)}</span><span class="r-type">${escHTML(t.type)}</span></span></button></li>`;
}

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

export { escHTML, FALLBACK_PLATE, imgURL, catLabel, txt, plateInner, plateAttrs, rowHTML, featuredOf, rowsHTML, dataJSON };
