/* /llms.txt: the studio in plain facts, for answer engines (the convention of llmstxt.org). French first, then English. Always from the data of the moment. */
import seed from '../data/projects.json';
import { getData } from './_lib/store.js';
import { SITE, MAIL, HOME, SERVICES, METHOD, sample, waiting } from '../shared/seo.js';

export async function onRequestGet({ env }) {
  const d = await getData(env), team = d.team || [], real = (d.projects || []).filter(p => !sample(p, seed));
  const cat = (id, l) => { const c = (d.categories || []).find(x => x.id === id); return c ? c[l] || c.fr : ''; };
  const works = l => real.length ? `\n## ${l === 'en' ? 'Projects' : 'Projets'}\n\n` + real.map(p => { const t = { ...p.fr, ...(l === 'en' ? Object.fromEntries(Object.entries(p.en || {}).filter(([, v]) => v)) : {}) }; return `- [${t.title}](${SITE}${l === 'en' ? '/en' : ''}/projets/${p.id}) : ${[cat(p.category, l), t.type, t.place, p.year].filter(Boolean).join(', ')}. ${t.desc || ''}`; }).join('\n') + '\n' : '';
  const people = l => team.map(m => `- ${m.name}, ${((m[l] && m[l].role) || m.fr.role || '').toLowerCase()}${waiting(m) ? '' : ` (${SITE}${l === 'en' ? '/en' : ''}/equipe/${m.id})`}`).join('\n');
  const text = `# Moyo Studio

> ${HOME.fr.desc} Moyo Studio (« moyo ») travaille en français et en anglais.

## Faits

- Nom : Moyo Studio, aussi écrit « moyo » ou « Moyo »
- Nature : studio créatif indépendant
- Lieu : Provence-Alpes-Côte d’Azur, France
- Langues : français, anglais
- Contact : ${MAIL}, réponse sous 48 heures, formulaire : ${SITE}/#contact
- Principe : chaque projet part d’un motif, une idée simple qui relie tout, de la première page au dernier pixel
- Sens du nom : du japonais moyō, « le motif, le dessin » ; soramoyō, « l’allure du ciel »

## Fondateurs

${people('fr')}

## Services

${SERVICES.map(s => `- ${s[2].fr[0]} : ${s[2].fr[1]}`).join('\n')}

## Méthode

${METHOD.map((m, i) => `${i + 1}. ${m[1].fr[0]} : ${m[1].fr[1]}`).join('\n')}
${works('fr')}
## Pages

- [Accueil](${SITE}/) : le studio, ses services, sa méthode, son équipe, le contact
- [Projets](${SITE}/projets) : tous les projets, par catégorie
- [Site en anglais](${SITE}/en)
- [Plan du site](${SITE}/sitemap.xml)

---

# Moyo Studio (English)

> ${HOME.en.desc} Moyo Studio works in French and English.

## Facts

- Name: Moyo Studio, also written “moyo” or “Moyo”
- What it is: an independent creative studio
- Where: Provence-Alpes-Côte d’Azur (French Riviera), France
- Languages: French, English
- Contact: ${MAIL}, reply within 48 hours, form: ${SITE}/en#contact
- Principle: every project starts from a pattern, one simple idea that ties everything together, from the first page to the last pixel
- Meaning of the name: from the Japanese moyō, “pattern, design”; soramoyō, “the look of the sky”

## Founders

${people('en')}

## Services

${SERVICES.map(s => `- ${s[2].en[0]}: ${s[2].en[1]}`).join('\n')}

## Method

${METHOD.map((m, i) => `${i + 1}. ${m[1].en[0]}: ${m[1].en[1]}`).join('\n')}
${works('en')}
## Pages

- [Home](${SITE}/en): the studio, its services, its method, its team, the contact
- [Projects](${SITE}/en/projets): every project, by category
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
