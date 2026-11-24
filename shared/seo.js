/* What the site says about itself to search engines, answer engines (ChatGPT, Perplexity, Gemini…) and to the applications that show a preview of a link.
   One place, two languages. Used by build.mjs (home, /projets, 404) and by the functions (projects, profiles, /en, sitemap.xml, llms.txt).
   Only facts that are on the site. Keep `export` on the last line only. */
const SITE = 'https://moyo-d0n.pages.dev';
const MAIL = 'contact.moyostudio@gmail.com';
const SHARE = { url: SITE + '/partage.png', w: 2400, h: 1260, alt: { fr: 'moyo, écrit en grand : les deux o sont des yeux qui regardent vers le haut', en: 'moyo, written large: the two o are eyes looking up' } };
const REGION = { fr: 'Provence-Alpes-Côte d’Azur', en: 'French Riviera' };

const HOME = {
  fr: { title: 'Moyo Studio · Studio créatif en Provence-Alpes-Côte d’Azur', desc: 'Moyo, studio créatif indépendant basé en Provence-Alpes-Côte d’Azur : identités, sites, films, données et campagnes, à partir d’une seule idée.', og: 'Studio créatif basé en Provence-Alpes-Côte d’Azur. Des images, des sites et des films à partir d’une seule idée.' },
  en: { title: 'Moyo Studio · Creative studio on the French Riviera', desc: 'Moyo is an independent creative studio based on the French Riviera: identities, websites, films, data and campaigns, from a single idea.', og: 'Creative studio based on the French Riviera. Images, websites and films from a single idea.' }
};
const LIST = {
  fr: { title: 'Projets · Moyo Studio', desc: 'Les projets de Moyo, studio créatif basé en Provence-Alpes-Côte d’Azur, rangés par catégorie : identités, sites, données, motion.' },
  en: { title: 'Projects · Moyo Studio', desc: 'The projects of Moyo, a creative studio based on the French Riviera, by category: identities, websites, data, motion.' }
};
const LOST = { fr: { title: 'Rien à voir · Moyo Studio', desc: '' }, en: { title: 'Nothing to see · Moyo Studio', desc: '' } };
/* the same words as the page (build.mjs checks it) */
const SERVICES = [
  ['s1', 'identite', { fr: ['Direction artistique', 'Une idée, un système typographique, une palette. Tout se décide avant le premier pixel.'], en: ['Art direction', 'One idea, a type system, a palette. Everything is decided before the first pixel.'] }],
  ['s4', 'motion', { fr: ['Identités en mouvement', 'Logos, grilles et animations pour les marques qui vivent sur écran.'], en: ['Moving identities', 'Logos, grids and animation for brands that live on screen.'] }],
  ['s2', 'site', { fr: ['Sites immersifs', 'Scroll narratif, WebGL quand il sert le sujet, lisibles sans souris ni animation.'], en: ['Immersive websites', 'Narrative scroll, WebGL only when it serves the subject, readable without a mouse or animation.'] }],
  ['s3', 'donnees', { fr: ['Visualisation de données', 'Des graphiques que l’on explore, avec leurs sources et une version en tableau.'], en: ['Data visualisation', 'Charts you can explore, with their sources and a table version.'] }],
  ['s5', 'audiovisuel', { fr: ['Audiovisuel', 'Films de marque, captation, montage et motion design, du storyboard à l’étalonnage.'], en: ['Audiovisual', 'Brand films, shooting, editing and motion design, from storyboard to grading.'] }],
  ['s6', 'communication', { fr: ['Communication', 'Stratégie, campagnes et réseaux sociaux : un message clair, tenu sur chaque support.'], en: ['Communication', 'Strategy, campaigns and social media: one clear message, held on every medium.'] }],
  ['s7', 'print', { fr: ['Édition & print', 'Affiches, catalogues, signalétique : la même rigueur sur le papier que sur l’écran.'], en: ['Print & publishing', 'Posters, catalogues, signage: the same rigour on paper as on screen.'] }]
];
const METHOD = [
  ['m1', { fr: ['Écouter', 'Un premier échange pour comprendre le lieu, le public, les contraintes et le calendrier.'], en: ['Listen', 'A first conversation to understand the place, the audience, the constraints and the timeline.'] }],
  ['m2', { fr: ['Choisir', 'Nous retenons une seule idée, et ce qu’elle exclut.'], en: ['Choose', 'We keep one idea, and what it rules out.'] }],
  ['m3', { fr: ['Construire', 'Grille, typographie, image et code : tout est dessiné, puis testé sur de vrais écrans.'], en: ['Build', 'Grid, type, image and code: everything is designed, then tested on real screens.'] }],
  ['m4', { fr: ['Accompagner', 'Nous restons là après le lancement : mesures, ajustements, nouveaux contenus.'], en: ['Support', 'We stay on after launch: measuring, adjusting, new content.'] }]
];

const at = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* /projets in French, /en/projets in English */
const local = (path, lang) => lang === 'en' ? '/en' + (path === '/' ? '' : path) : path;
const full = (path, lang) => SITE + local(path, lang);

/* ---------- structured data: one graph, the same identifiers on every page ---------- */
const ORG = SITE + '/#studio', WEB = SITE + '/#site';
const person = (m, lang) => ({ '@type': 'Person', '@id': `${SITE}/equipe/${m.id}#personne`, name: m.name, jobTitle: (m[lang] && m[lang].role) || (m.fr && m.fr.role) || undefined, url: full('/equipe/' + m.id, lang), worksFor: { '@id': ORG } });
const studio = (team, lang) => ({
  '@type': ['Organization', 'ProfessionalService'], '@id': ORG, name: 'Moyo Studio', alternateName: ['moyo', 'Moyo'], url: SITE + '/', email: MAIL,
  description: HOME[lang].desc, slogan: lang === 'en' ? 'Images, websites and films from a single idea' : 'Des images, des sites et des films à partir d’une seule idée',
  logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png', width: 512, height: 512 }, image: SHARE.url,
  address: { '@type': 'PostalAddress', addressRegion: REGION.fr, addressCountry: 'FR' },
  areaServed: { '@type': 'AdministrativeArea', name: REGION.fr },
  knowsLanguage: ['fr', 'en'], knowsAbout: SERVICES.map(s => s[2][lang][0]),
  founder: (team || []).map(m => ({ '@id': `${SITE}/equipe/${m.id}#personne` })),
  contactPoint: { '@type': 'ContactPoint', contactType: lang === 'en' ? 'new projects' : 'nouveaux projets', email: MAIL, availableLanguage: ['fr', 'en'], url: full('/', lang) + '#contact' },
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s[2][lang][0], description: s[2][lang][1], provider: { '@id': ORG }, areaServed: REGION.fr } })) }
});
const website = { '@type': 'WebSite', '@id': WEB, url: SITE + '/', name: 'Moyo Studio', alternateName: 'moyo', inLanguage: ['fr', 'en'], publisher: { '@id': ORG } };
const trail = (lang, ...steps) => ({ '@type': 'BreadcrumbList', itemListElement: [[lang === 'en' ? 'Home' : 'Accueil', '/'], ...steps].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: full(path, lang) })) });
const ldHome = (team, lang = 'fr') => ({ '@context': 'https://schema.org', '@graph': [studio(team, lang), ...(team || []).map(m => person(m, lang)), website,
  { '@type': 'WebPage', '@id': full('/', lang) + '#page', url: full('/', lang), name: HOME[lang].title, description: HOME[lang].desc, inLanguage: lang, isPartOf: { '@id': WEB }, about: { '@id': ORG }, primaryImageOfPage: { '@type': 'ImageObject', url: SHARE.url, width: SHARE.w, height: SHARE.h } }] });
const ldList = (projects, lang = 'fr') => ({ '@context': 'https://schema.org', '@graph': [website, trail(lang, [lang === 'en' ? 'Projects' : 'Projets', '/projets']),
  { '@type': 'CollectionPage', '@id': full('/projets', lang) + '#page', url: full('/projets', lang), name: LIST[lang].title, description: LIST[lang].desc, inLanguage: lang, isPartOf: { '@id': WEB }, about: { '@id': ORG },
    ...((projects || []).length ? { mainEntity: { '@type': 'ItemList', itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: (p[lang] && p[lang].title) || p.fr.title, url: full('/projets/' + p.id, lang) })) } } : {}) }] });
const ldWork = (p, t, image, lang = 'fr') => ({ '@context': 'https://schema.org', '@graph': [website, trail(lang, [lang === 'en' ? 'Projects' : 'Projets', '/projets'], [t.title, '/projets/' + p.id]),
  { '@type': 'CreativeWork', '@id': `${SITE}/projets/${p.id}#projet`, url: full('/projets/' + p.id, lang), name: t.title, description: t.desc, genre: t.type || undefined, dateCreated: p.year || undefined, locationCreated: t.place ? { '@type': 'Place', name: t.place } : undefined, image: image || undefined, inLanguage: lang, creator: { '@type': 'Organization', '@id': ORG, name: 'Moyo Studio', url: SITE + '/' }, isPartOf: { '@id': WEB } }] });
const ldPerson = (m, lang = 'fr', image) => ({ '@context': 'https://schema.org', '@graph': [website, trail(lang, [m.name, '/equipe/' + m.id]),
  { '@type': 'ProfilePage', '@id': full('/equipe/' + m.id, lang) + '#page', url: full('/equipe/' + m.id, lang), inLanguage: lang, isPartOf: { '@id': WEB }, mainEntity: { ...person(m, lang), image: image || undefined, worksFor: { '@type': 'Organization', '@id': ORG, name: 'Moyo Studio', url: SITE + '/' } } }] });

/* ---------- the <head> of a page: title, description, languages, preview, place, structured data ---------- */
const ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
function head({ path, lang = 'fr', title, desc, og, ogTitle, type = 'website', image, robots, ld, alternates = true }) {
  const im = image || { ...SHARE, alt: SHARE.alt[lang] }, url = full(path, lang), T = ogTitle || title, D = og || desc;
  return [
    `<title>${at(title)}</title>`,
    desc && `<meta name="description" content="${at(desc)}">`,
    `<meta name="robots" content="${robots || ROBOTS}">`,
    alternates && `<link rel="canonical" href="${at(url)}">`,
    alternates && `<link rel="alternate" hreflang="fr" href="${at(full(path, 'fr'))}">\n<link rel="alternate" hreflang="en" href="${at(full(path, 'en'))}">\n<link rel="alternate" hreflang="x-default" href="${at(full(path, 'fr'))}">`,
    path !== '/' && '<meta property="og:site_name" content="Moyo Studio">',
    `<meta property="og:title" content="${at(T)}">`,
    D && `<meta property="og:description" content="${at(D)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${at(url)}">`,
    `<meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'fr_FR'}">\n<meta property="og:locale:alternate" content="${lang === 'en' ? 'fr_FR' : 'en_GB'}">`,
    `<meta property="og:image" content="${at(im.url)}">`,
    im.w && `<meta property="og:image:width" content="${im.w}">\n<meta property="og:image:height" content="${im.h}">`,
    im.alt && `<meta property="og:image:alt" content="${at(im.alt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${at(T)}">`,
    D && `<meta name="twitter:description" content="${at(D)}">`,
    `<meta name="twitter:image" content="${at(im.url)}">`,
    `<meta name="author" content="Moyo Studio">\n<meta name="geo.region" content="FR-PAC">\n<meta name="geo.placename" content="${REGION.fr}">`,
    ld && `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
  ].filter(Boolean).join('\n');
}
/* A project that is still one of the examples of the start, or a biography still in lorem ipsum: shown to visitors, not given to search engines. */
const sample = (p, seed) => { const s = ((seed && seed.projects) || []).find(x => x.id === p.id); return !!s && s.fr.title === (p.fr && p.fr.title) && s.fr.desc === (p.fr && p.fr.desc); };
const waiting = m => /lorem ipsum/i.test((m.fr && m.fr.bio) || '') || /lorem ipsum/i.test((m.en && m.en.bio) || '');

export { SITE, MAIL, SHARE, REGION, HOME, LIST, LOST, SERVICES, METHOD, ROBOTS, local, full, ldHome, ldList, ldWork, ldPerson, head, sample, waiting };
