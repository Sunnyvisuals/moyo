/* Projects live in KV (binding MOYO) under the key "projects". Until the admin saves once, the seed file is served. */
import seed from '../../data/projects.json';
import { bkClean, bkFiles } from '../../shared/blocks.js';

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

/* ---------- publishing, and the versions kept ----------
   Each publication keeps the one before, under "backup:<time>", the last KEEP of them. A picture is deleted only when neither the site nor a kept
   version shows it any more. */
const KEEP = 10;
export const VERSION_ID = /^\d{15}$/;

/* the ids of the versions kept, newest first */
export async function versions(env) {
  const r = await env.MOYO.list({ prefix: 'backup:' });
  return r.keys.map(k => k.name.slice(7)).filter(i => VERSION_ID.test(i)).sort().reverse();
}
const version = (env, id) => env.MOYO.get('backup:' + id, 'json');

/* every picture that the site or a kept version shows */
export async function heldImages(env) {
  const s = imagesOf(await getData(env));
  for (const doc of await Promise.all((await versions(env)).map(i => version(env, i)))) if (doc) imagesOf(doc).forEach(i => s.add(i));
  return s;
}

/* saves a new document; returns how many pictures were deleted */
export async function publish(env, data) {
  const had = await hasStored(env), before = await getData(env);
  let list = await versions(env), fresh = null;
  if (had && JSON.stringify(before) !== JSON.stringify(data)) {
    fresh = String(Date.now()).padStart(15, '0');
    await env.MOYO.put('backup:' + fresh, JSON.stringify(before));
    list = [fresh, ...list.filter(i => i !== fresh)]; // a version just written is not always listed yet
  }
  await env.MOYO.put('projects', JSON.stringify(data));
  const kept = list.slice(0, KEEP), old = list.slice(KEEP), read = i => i === fresh ? before : version(env, i);
  const shown = imagesOf(data), may = new Set();
  for (const doc of await Promise.all(kept.map(read))) if (doc) imagesOf(doc).forEach(i => shown.add(i));
  for (const doc of await Promise.all(old.map(read))) if (doc) imagesOf(doc).forEach(i => may.add(i));
  const gone = [...may].filter(i => !shown.has(i) && IMAGE_ID.test(i));
  await Promise.all([...gone.map(i => env.MOYO.delete('img:' + i)), ...old.map(i => env.MOYO.delete('backup:' + i))]);
  return gone.length;
}

export function imagesOf(data) {
  const s = new Set();
  for (const p of data.projects || []) {
    if (p.cover) s.add(p.cover);
    for (const i of p.images || []) s.add(i);
    for (const i of bkFiles(p.blocks)) s.add(i);
  }
  for (const m of data.team || []) if (m.photo) s.add(m.photo);
  for (const m of data.method || []) { if (m.media) s.add(m.media); if (m.poster) s.add(m.poster); }
  return s;
}

/* ---------- Validation: keep only known fields, with limits ---------- */
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
const FRAMES = ['top', 'bottom', 'left', 'right']; // framing of a cover or a portrait (shared/render.js POS); the centre is the default
function text(v) {
  const t = v || {};
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
    projects.push({
      id,
      year: str(p.year, 12),
      category,
      featured: !!p.featured,
      cover,
      ...(FRAMES.includes(p.pos) ? { pos: p.pos } : {}),
      images,
      blocks: bkClean(p.blocks, v => typeof v === 'string' && PICTURE.test(v), v => typeof v === 'string' && /\.(mp4|webm)$/.test(v) && MEDIA.test(v)),
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
      .filter(l => l.label && /^(https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+)$/i.test(l.url));
    team.push({
      id, name, first, last,
      photo: typeof m.photo === 'string' && PICTURE.test(m.photo) ? m.photo : null,
      ...(FRAMES.includes(m.pos) ? { pos: m.pos } : {}),
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
      fit: ['center', 'top', 'bottom', 'contain'].includes(m.fit) ? m.fit : 'center', align: ['center', 'right'].includes(m.align) ? m.align : 'left', fr, en: { title: str(m.en?.title, 60), text: str(m.en?.text, 400) } };
  });
  return { errors, data: { version: 1, categories, projects, team, method } };
}
