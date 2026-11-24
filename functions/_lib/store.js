/* Projects live in KV (binding MOYO) under the key "projects". Until the admin saves once, the seed file is served. */
import seed from '../../data/projects.json';

export const IMAGE_ID = /^[a-f0-9-]{36}\.(webp|jpg|png|avif|gif|mp4|webm)$/; // anything uploaded: pictures, GIFs, videos
// an uploaded picture, or one of the pictures that come with the site (/proj/…)
const MEDIA = /^([a-f0-9-]{36}\.(webp|jpg|png|avif|gif|mp4|webm)|\/proj\/[\w-]{1,60}\.(webp|jpg|jpeg|png|avif))$/; // … or a video
const PICTURE = /^([a-f0-9-]{36}\.(webp|jpg|png|avif|gif)|\/proj\/[\w-]{1,60}\.(webp|jpg|jpeg|png|avif))$/;

export async function getData(env) {
  const stored = env.MOYO ? await env.MOYO.get('projects', 'json') : null;
  if (!stored) return seed;
  // documents saved before profiles existed: start from the seed team
  if (!Array.isArray(stored.team)) stored.team = seed.team || [];
  if (!Array.isArray(stored.method) || stored.method.length !== 4) stored.method = seed.method || []; // … or before the method could be edited
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
  for (const m of data.method || []) { if (m.media) s.add(m.media); if (m.poster) s.add(m.poster); }
  return s;
}

/* ---------- Validation: keep only known fields, with limits ---------- */
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
// Plates are hand-made SVG drawings. Only the admin can write them, but refuse anything that could run code anyway.
const UNSAFE_SVG = /<script|<foreignobject|<iframe|<image|<use|\son[a-z]+\s*=|javascript:|href\s*=|url\s*\(\s*['"]?\s*(?!#)/i;

function text(t = {}) {
  return {
    title: str(t.title, 200),
    type: str(t.type, 120),
    role: str(t.role, 200),
    place: str(t.place, 120),
    desc: str(t.desc, 6000)
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
    const cover = typeof p.cover === 'string' && PICTURE.test(p.cover) ? p.cover : null;
    const images = (Array.isArray(p.images) ? p.images : []).filter(i => typeof i === 'string' && PICTURE.test(i)).slice(0, 40);
    let plate = typeof p.plate === 'string' ? p.plate.trim() : '';
    if (plate && (plate.length > 20000 || !/^<svg[\s>][\s\S]*<\/svg>$/i.test(plate) || UNSAFE_SVG.test(plate))) {
      errors.push(`Projet « ${label} » : motif SVG refusé.`); plate = '';
    }
    projects.push({
      id,
      year: str(p.year, 12),
      category,
      featured: !!p.featured,
      tone: p.tone === 'wash' ? 'wash' : 'klein',
      cover,
      images,
      plate,
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
      photo: typeof m.photo === 'string' && PICTURE.test(m.photo) ? m.photo : null,
      fr: { role: str(m.fr?.role, 120), bio: str(m.fr?.bio, 4000), phrase: str(m.fr?.phrase, 80) },
      en: { role: str(m.en?.role, 120), bio: str(m.en?.bio, 4000), phrase: str(m.en?.phrase, 80) },
      links
    });
  }
  // Method: always four steps, in order, each with a picture, a video or a GIF
  const method = (seed.method || []).map((d, i) => {
    const m = (Array.isArray(input.method) ? input.method[i] : null) || d, fr = { title: str(m.fr?.title, 60), text: str(m.fr?.text, 400) };
    if (!fr.title) errors.push(`Méthode, étape ${i + 1} : titre français manquant.`);
    return { id: d.id, media: typeof m.media === 'string' && MEDIA.test(m.media) ? m.media : null, poster: typeof m.poster === 'string' && PICTURE.test(m.poster) ? m.poster : null,
      fit: ['center', 'top', 'bottom', 'contain'].includes(m.fit) ? m.fit : 'center', fr, en: { title: str(m.en?.title, 60), text: str(m.en?.text, 400) } };
  });
  return { errors, data: { version: 1, categories, projects, team, method } };
}
