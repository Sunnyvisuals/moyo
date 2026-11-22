/* Projects live in KV (binding MOYO) under the key "projects". Until the admin saves once, the seed file is served. */
import seed from '../../data/projects.json';

export const IMAGE_ID = /^[a-f0-9-]{36}\.(webp|jpg|png|avif|gif)$/;

export async function getData(env) {
  const stored = env.MOYO ? await env.MOYO.get('projects', 'json') : null;
  return stored || seed;
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
    const cover = typeof p.cover === 'string' && IMAGE_ID.test(p.cover) ? p.cover : null;
    const images = (Array.isArray(p.images) ? p.images : []).filter(i => typeof i === 'string' && IMAGE_ID.test(i)).slice(0, 40);
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
  return { errors, data: { version: 1, categories, projects } };
}
