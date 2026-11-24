/* /llms.txt: the site in plain words for AI assistants and answer engines (https://llmstxt.org), from the published data. */
import { getData } from './_lib/store.js';
import { SITE, EMAIL, REGION } from '../shared/seo.js';
import { txt, catLabel } from '../shared/render.js';

export async function onRequestGet({ env }) {
  const data = await getData(env);
  const line = s => String(s || '').replace(/\s+/g, ' ').trim();
  const body = `# Moyo Studio

> Moyo est une agence créative indépendante basée en ${REGION} (France). Elle conçoit des images, des sites, des films et des campagnes à partir d’une seule idée, en français et en anglais.

- Site : ${SITE}/
- Contact : ${EMAIL} (réponse sous 48 heures)
- Zone : ${REGION}, France ; projets à distance partout
- Langues : français, anglais

## Services

- Direction artistique : une idée, un système typographique, une palette.
- Identités en mouvement : logos, grilles et animations pour les marques qui vivent sur écran.
- Sites immersifs : scroll narratif, WebGL quand il sert le sujet, accessibles sans souris ni animation.
- Visualisation de données : graphiques explorables, avec leurs sources et une version en tableau.
- Audiovisuel : films de marque, captation, montage et motion design.
- Communication : stratégie, campagnes et réseaux sociaux.
- Édition et print : affiches, catalogues, signalétique.

## Méthode

1. Écouter : comprendre le lieu, le public, les contraintes et le calendrier.
2. Choisir : retenir une seule idée, et ce qu’elle exclut.
3. Construire : grille, typographie, image et code, testés sur de vrais écrans.
4. Accompagner : mesures, ajustements et nouveaux contenus après le lancement.

## Projets

${(data.projects || []).map(p => { const t = txt(p, 'fr'); return `- [${line(t.title)}](${SITE}/projets/${encodeURIComponent(p.id)}) : ${[catLabel(data, p.category, 'fr'), t.type, t.place, p.year].filter(Boolean).join(', ')}. ${line(t.desc)}`; }).join('\n')}

## Équipe

${(data.team || []).map(m => `- [${line(m.name)}](${SITE}/equipe/${encodeURIComponent(m.id)})${m.fr?.role ? ' : ' + line(m.fr.role) : ''}`).join('\n')}

## Pages

- [Accueil](${SITE}/)
- [Tous les projets](${SITE}/projets)
- [Plan du site](${SITE}/sitemap.xml)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
