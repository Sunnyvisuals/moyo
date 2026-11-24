/* Search engines and AI answers (SEO / GEO), shared by build.mjs and the Functions:
   - the meta tags of a page (title, description, canonical, Open Graph, Twitter),
   - structured data (schema.org JSON-LD): the agency, its people, its projects, the breadcrumb.
   Keep it dependency-free, and keep `export` on the last line only. */

const SITE = 'https://moyo-d0n.pages.dev';
const EMAIL = 'contact.moyostudio@gmail.com';
const ORG_ID = SITE + '/#agence';
const REGION = 'Provence-Alpes-Côte d’Azur';
const SERVICES = ['Direction artistique', 'Identité visuelle', 'Identités en mouvement', 'Sites immersifs', 'Visualisation de données', 'Audiovisuel', 'Communication', 'Édition et print'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = u => (!u ? '' : /^https?:/.test(u) ? u : SITE + (u[0] === '/' ? u : '/img/' + encodeURIComponent(u)));
/* a description for a snippet: one paragraph, cut on a word, about 160 characters */
const snippet = (s, n = 158) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 20)).replace(/[\s,;:.–-]+$/, '') + '…'; };

/* <head> tags of a page. `path` is the canonical path ("/projets/soleil"). */
function metaTags({ title, desc, path = '/', image, imageAlt, type = 'website', noindex = false }) {
  const url = SITE + path, img = image ? abs(image) : SITE + '/og.png';
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(snippet(desc))}">`,
    noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`,
    '<meta property="og:site_name" content="Moyo Studio">',
    '<meta property="og:locale" content="fr_FR"><meta property="og:locale:alternate" content="en_GB">',
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(snippet(desc))}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    image ? '' : '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(imageAlt || 'moyo')}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${esc(img)}">`
  ].filter(Boolean).join('\n');
}

/* ---------- schema.org ---------- */
const personId = m => `${SITE}/equipe/${encodeURIComponent(m.id)}#personne`;
function personLD(m, full = false) {
  const o = { '@type': 'Person', '@id': personId(m), name: m.name, url: `${SITE}/equipe/${encodeURIComponent(m.id)}` };
  if (m.fr?.role) o.jobTitle = m.fr.role;
  if (!full) return o;
  o.worksFor = { '@id': ORG_ID };
  if (m.photo) o.image = abs(m.photo);
  if (m.fr?.bio) o.description = snippet(m.fr.bio, 300);
  const same = (m.links || []).map(l => l.url).filter(u => /^https?:/.test(u));
  if (same.length) o.sameAs = same;
  return o;
}

function orgLD(data = {}) {
  const team = data.team || [];
  return {
    '@type': ['ProfessionalService', 'Organization'], '@id': ORG_ID,
    name: 'Moyo', alternateName: 'Moyo Studio', url: SITE + '/', email: EMAIL, logo: SITE + '/og.png', image: SITE + '/og.png',
    description: `Agence créative indépendante basée en ${REGION} : direction artistique, identités, sites immersifs, visualisation de données, audiovisuel, communication et print.`,
    address: { '@type': 'PostalAddress', addressRegion: REGION, addressCountry: 'FR' },
    areaServed: [{ '@type': 'AdministrativeArea', name: REGION }, { '@type': 'Country', name: 'France' }],
    knowsAbout: SERVICES, knowsLanguage: ['fr', 'en'],
    founder: team.map(m => personLD(m)),
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: EMAIL, availableLanguage: ['French', 'English'] },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })) }
  };
}

function projectLD(p, data = {}) {
  const t = p.fr || {}, cat = (data.categories || []).find(c => c.id === p.category);
  const o = { '@type': 'CreativeWork', '@id': `${SITE}/projets/${encodeURIComponent(p.id)}#projet`, name: t.title, url: `${SITE}/projets/${encodeURIComponent(p.id)}`, inLanguage: 'fr', creator: { '@id': ORG_ID } };
  if (t.desc) o.description = t.desc;
  if (p.year) o.dateCreated = p.year;
  if (cat || t.type) o.genre = [cat?.fr, t.type].filter(Boolean).join(', ');
  if (t.place) o.locationCreated = { '@type': 'Place', name: t.place };
  if (t.client) o.sourceOrganization = { '@type': 'Organization', name: t.client };
  const imgs = [p.cover, ...(p.images || [])].filter(Boolean).map(abs);
  if (imgs.length) o.image = imgs;
  if (p.link) o.sameAs = p.link;
  return o;
}

const breadcrumbLD = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) });

const websiteLD = () => ({ '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'Moyo Studio', inLanguage: ['fr', 'en'], publisher: { '@id': ORG_ID } });

/* one <script> with a @graph; `<` is escaped so the JSON cannot close the tag */
const ldScript = (...nodes) => `<script type="application/ld+json" id="ld">${JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.flat() }).replace(/</g, '\\u003c')}</script>`;

/* the JSON-LD of the home: the site, the agency and its people, the projects shown */
const homeLD = (data, list) => ldScript(websiteLD(), orgLD(data), (data.team || []).map(m => personLD(m, true)),
  { '@type': 'ItemList', name: 'Projets', itemListElement: (list || []).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/projets/${encodeURIComponent(p.id)}`, name: p.fr?.title })) });

export { SITE, EMAIL, REGION, esc, abs, snippet, metaTags, orgLD, personLD, projectLD, breadcrumbLD, websiteLD, ldScript, homeLD };
