/* Pages rendered on the server, one per project (/projets/<id>) and one per person (/equipe/<id>).
   Same template as the project sheet: the name on top, the picture on the first axis, the words on the third.
   French and English are both in the page; CSS shows the language of <html lang> (chosen on the site, stored as "hb-lang").
   Keep `export` on the last line only. */
import { escHTML as e, imgURL, focusStyle, txt, catLabel } from './render.js';
import { DESIGN_CSS, headCommon, scripts } from './design.js';
import { CHROME_CSS, chromeHead, FOOTER_CSS, GLASS_CSS, footerHTML } from './chrome.js';
import { metaTags, ldScript, breadcrumbLD, orgLD, personLD, projectLD } from './seo.js';

const para = t => String(t || '').split(/\n{2,}/).map(p => `<p>${e(p).replace(/\n/g, '<br>')}</p>`).join('');
/* the same words in both languages: <span data-l="fr">…</span><span data-l="en">…</span> (one span when they are equal) */
const both = (fr, en, tag = 'span') => (!en || en === fr) ? e(fr) : `<${tag} data-l="fr">${e(fr)}</${tag}><${tag} data-l="en">${e(en)}</${tag}>`;

const PAGE_CSS = `
main{min-height:100vh;min-height:100svh}
.bio{max-width:42ch;font-size:var(--fs-lead);line-height:1.5;letter-spacing:-.014em;text-wrap:pretty}
.bio p+p{margin-top:1.1em}
.role{margin-bottom:clamp(2rem,3.6vw,3.75rem)}
.links{display:flex;flex-wrap:wrap;gap:4px 28px;margin-top:clamp(2rem,3.6vw,3.75rem)}
[data-l]:is(span,div){display:none}
html[lang=fr] [data-l=fr]:is(span,div),html[lang=en] [data-l=en]:is(span,div){display:revert}`;

function shell({ meta, ld, start, crumbs, title, plate, body, after = '', next, team, en }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F5F4F0">
${meta}
${ld}
${headCommon}
<style>
${DESIGN_CSS}${CHROME_CSS}${FOOTER_CSS}${GLASS_CSS}${PAGE_CSS}
</style>
</head>
<body>
<a class="skip" href="#main" data-i="skip">Aller au contenu</a>
${chromeHead(start)}
<div class="under"><main class="sheet" id="main">
  <nav class="crumbs" aria-label="Vous êtes ici" data-ia="here"><ol>${crumbs.map(([label, href, key], i) => i === crumbs.length - 1 ? `<li aria-current="page"><span>${e(label)}</span></li>` : `<li><a href="${href}"${key ? ` data-i="${key}"` : ''}>${e(label)}</a></li>`).join('')}</ol></nav>
  <h1 class="t-hero sheet-t">${title}<i class="dot">&#8288;<b></b></i></h1>
  <div class="g sheet-g">
    ${plate}
    <div class="h2">${body}</div>
  </div>
  ${after}
  ${next ? `<a class="nm-link g next" href="${next.href}"><span class="nm">${e(next.name)}</span><span class="nm-role q4" data-i="${next.key || 'nextS'}">${e(next.label)}</span></a>` : ''}
</main></div>
${footerHTML(team)}
<script type="application/json" id="en">${JSON.stringify({ skip: 'Skip to content', here: 'You are here', home: 'Home', team: 'Team', projects: 'Projects', nextS: 'Next', nextP: 'Next project', ...en })}</script>
${scripts}
</body>
</html>`;
}

const plateOf = (src, alt, focus) => `<div class="plate c5${src ? '' : ' plate--none'}"${src ? '' : ' aria-hidden="true"'}>${src ? `<img src="${imgURL(src)}" alt="${e(alt)}"${focusStyle(focus)} fetchpriority="high">` : ''}</div>`;

function personPage(data, i) {
  const team = data.team || [], m = team[i], next = team.length > 1 ? team[(i + 1) % team.length] : null;
  const fr = m.fr || {}, en = { role: m.en?.role || fr.role, bio: m.en?.bio || fr.bio };
  const about = `${m.name}${fr.role ? ', ' + fr.role : ''} chez Moyo, agence créative basée en Provence-Alpes-Côte d’Azur. ${fr.bio || ''}`;
  const path = `/equipe/${encodeURIComponent(m.id)}`;
  const links = (m.links || []).filter(l => l.url);
  return shell({
    meta: metaTags({ title: `${m.name} · Moyo Studio`, desc: about, path, image: m.photo, imageAlt: m.name, type: 'profile' }),
    ld: ldScript(personLD(m, true), orgLD(data), breadcrumbLD([['Accueil', '/'], ['Équipe', '/#equipe'], [m.name, path]])),
    start: 4,
    crumbs: [['Accueil', '/', 'home'], ['Équipe', '/#equipe', 'team'], [m.name]],
    title: e(m.name),
    plate: plateOf(m.photo, `${m.name}${fr.role ? ', ' + fr.role : ''}`, m.focus),
    body: `${fr.role ? `<p class="t-m role">${both(fr.role, en.role)}</p>` : ''}
      <div class="bio"><div data-l="fr">${para(fr.bio)}</div><div data-l="en">${para(en.bio)}</div></div>
      ${links.length ? `<p class="links">${links.map(l => `<a class="lnk" href="${e(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener me"' : ''}>${e(l.label)}<i class="up" aria-hidden="true">↗</i></a>`).join('')}</p>` : ''}`,
    next: next && { href: `/equipe/${encodeURIComponent(next.id)}`, name: next.name, label: 'Suivant' },
    team
  });
}

function projectPage(data, i) {
  const list = data.projects || [], p = list[i], next = list.length > 1 ? list[(i + 1) % list.length] : null;
  const fr = txt(p, 'fr'), en = txt(p, 'en'), path = `/projets/${encodeURIComponent(p.id)}`;
  const cat = [catLabel(data, p.category, 'fr'), fr.type].filter(Boolean).join(', '), catEn = [catLabel(data, p.category, 'en'), en.type].filter(Boolean).join(', ');
  const fact = (k, label, a, b) => a ? `<div><dt data-i="${k}">${label}</dt><dd>${both(a, b)}</dd></div>` : '';
  const gallery = (p.images || []).map((id, k) => `<img src="${imgURL(id)}" alt="${e(fr.title)}, image ${k + 2}" loading="lazy" decoding="async">`).join('');
  return shell({
    meta: metaTags({ title: `${fr.title} · Moyo Studio`, desc: fr.desc || `${fr.title}, un projet de Moyo, agence créative basée en Provence-Alpes-Côte d’Azur.`, path, image: p.cover, imageAlt: fr.alt || fr.title, type: 'article' }),
    ld: ldScript(projectLD(p, data), orgLD(data), breadcrumbLD([['Accueil', '/'], ['Projets', '/projets'], [fr.title, path]])),
    start: 1,
    crumbs: [['Accueil', '/', 'home'], ['Projets', '/projets', 'projects'], [fr.title]],
    title: both(fr.title, en.title),
    plate: plateOf(p.cover, fr.alt || fr.title, p.focus),
    body: `<p class="t-lead">${both(fr.desc, en.desc)}</p>
      <dl class="facts">${fact('fClient', 'Client', fr.client, en.client)}${fact('fCat', 'Catégorie', cat, catEn)}${fact('fRole', 'Rôle', fr.role, en.role)}${fact('fPlace', 'Lieu', fr.place, en.place)}${fact('fYear', 'Année', p.year)}</dl>
      ${p.link ? `<p class="p-link"><a class="lnk" href="${e(p.link)}" target="_blank" rel="noopener"><span data-i="fVisit">Voir le projet en ligne</span><i class="up" aria-hidden="true">↗</i></a></p>` : ''}`,
    after: gallery ? `<div class="gallery">${gallery}</div>` : '',
    next: next && { href: `/projets/${encodeURIComponent(next.id)}`, name: txt(next, 'fr').title, label: 'Projet suivant', key: 'nextP' },
    team: data.team,
    en: { fClient: 'Client', fCat: 'Category', fRole: 'Role', fPlace: 'Place', fYear: 'Year', fVisit: 'See the project online' }
  });
}

export { personPage, projectPage };
