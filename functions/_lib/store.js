/* Projects live in KV (binding MOYO) under the key "projects". Until the admin saves once, the seed file is served. */
import seed from '../../data/projects.json';

export const IMAGE_ID = /^[a-f0-9-]{36}\.(webp|jpg|png|avif|gif)$/;
const STATIC_IMAGE = /^\/proj\/[\w-]+\.(jpe?g|webp|png|avif)$/; // pictures shipped with the site (the examples)

export async function getData(env) {
  const stored = env.MOYO ? await env.MOYO.get('projects', 'json') : null;
  if (!stored) return seed;
  // documents saved before profiles existed: start from the seed team
  if (!Array.isArray(stored.team)) stored.team = seed.team || [];
  return stored;
}

export async function hasStored(env) {
  return !!(env.MOYO && (await env.MOYO.get('projects')));
}

export async function saveData(env, data) {
  await env.MOYO.put('projects', JSON.stringify(data));
}

export function imagesOf(data) {
  const s = new Set();
  for (const p of data.projects || []) {
    if (p.cover) s.add(p.cover);
    for (const i of p.images || []) s.add(i);
  }
  for (const m of data.team || []) if (m.photo) s.add(m.photo);
  return s;
}

/* ---------- Validation: keep only known fields, with limits ---------- */
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
const FOCUS = /^\d{1,3}(\.\d)?% \d{1,3}(\.\d)?%$/; // where a cropped picture is centred, e.g. "50% 30%"
const focus = v => (typeof v === 'string' && FOCUS.test(v) ? v : '');
const image = v => (typeof v === 'string' && (IMAGE_ID.test(v) || STATIC_IMAGE.test(v)) ? v : null);

function text(t = {}) {
  return {
    title: str(t.title, 200),
    type: str(t.type, 120),
    role: str(t.role, 200),
    place: str(t.place, 120),
    desc: str(t.desc, 6000),
    client: str(t.client, 120),
    alt: str(t.alt, 200)
  };
}

export function validate(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return { errors: ['Document invalide.'] };

  const categories = [];
  for (const c of Array.isArray(input.categories) ? input.categories.slice(0, 40) : []) {
    const id = str(c?.id, 60);
    if (!SLUG.test(id)) { errors.push(`Catégorie : identifiant invalide « ${id} ».`); continue; }
    if (categories.some(x => x.id === id)) { errors.push(`Catégorie en double : ${id}.`); continue; }
    const fr = str(c.fr, 60);
    if (!fr) { errors.push(`Catégorie ${id} : nom français manquant.`); continue; }
    categories.push({ id, fr, en: str(c.en, 60) || fr });
  }

  const projects = [];
  for (const p of Array.isArray(input.projects) ? input.projects.slice(0, 500) : []) {
    const id = str(p?.id, 60);
    const label = str(p?.fr?.title, 80) || id || '(sans titre)';
    if (!SLUG.test(id)) { errors.push(`Projet « ${label} » : identifiant invalide.`); continue; }
    if (projects.some(x => x.id === id)) { errors.push(`Projet en double : ${id}.`); continue; }
    const fr = text(p.fr), en = text(p.en);
    if (!fr.title) { errors.push(`Projet ${id} : titre français manquant.`); continue; }
    const category = str(p.category, 60);
    if (category && !categories.some(c => c.id === category)) { errors.push(`Projet « ${label} » : catégorie inconnue « ${category} ».`); continue; }
    projects.push({
      id,
      year: str(p.year, 12),
      category,
      featured: !!p.featured,
      cover: image(p.cover),
      focus: focus(p.focus),
      images: (Array.isArray(p.images) ? p.images : []).map(image).filter(Boolean).slice(0, 40),
      link: /^https?:\/\//i.test(str(p.link, 300)) ? str(p.link, 300) : '',
      fr,
      en
    });
  }
  // Team: one profile page each (/equipe/<id>)
  const team = [];
  for (const m of Array.isArray(input.team) ? input.team.slice(0, 12) : []) {
    const id = str(m?.id, 60);
    const first = str(m?.first, 60), last = str(m?.last, 60);
    const name = first || last ? `${first} ${last}`.trim() : str(m?.name, 80);
    if (!SLUG.test(id) || !name) { errors.push(`Équipe : profil « ${name || id} » incomplet (nom et identifiant).`); continue; }
    if (team.some(x => x.id === id)) { errors.push(`Équipe : identifiant en double ${id}.`); continue; }
    const links = (Array.isArray(m.links) ? m.links : []).slice(0, 6)
      .map(l => ({ label: str(l?.label, 40), url: str(l?.url, 300) }))
      .filter(l => l.label && /^(https?:\/\/|mailto:)/i.test(l.url));
    team.push({
      id, name, first, last,
      photo: image(m.photo),
      focus: focus(m.focus),
      fr: { role: str(m.fr?.role, 120), bio: str(m.fr?.bio, 4000) },
      en: { role: str(m.en?.role, 120), bio: str(m.en?.bio, 4000) },
      links
    });
  }
  return { errors, data: { version: 1, categories, projects, team } };
}
