# moyo — site du studio

Site vitrine multilingue (FR/EN) de **moyo**, studio de création sur la Côte d'Azur.
Astro (statique) · Sveltia CMS (compatible Decap) · Cloudflare Pages · GitHub.

```
Vous modifiez dans /admin  →  commit sur GitHub  →  Cloudflare Pages reconstruit  →  en ligne (~1 min)
```

## Démarrer en local

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # build de production dans dist/
npm run build:preview  # build d'aperçu (sélecteur de pistes DA, liens relatifs) dans dist-preview/
```

## Mise en ligne (une seule fois)

1. **GitHub** — créer un dépôt `moyo-site` (privé) et pousser ce dossier :
   ```bash
   git init && git add . && git commit -m "moyo : première version"
   git branch -M main && git remote add origin git@github.com:VOTRE-COMPTE/moyo-site.git && git push -u origin main
   ```
2. **Cloudflare Pages** — Workers & Pages → Create → Pages → *Connect to Git* → choisir le dépôt.
   - Framework preset : **Astro** · Build command : `npm run build` · Output : `dist`
   - Variables : voir `.env.example` (`SITE_URL`, `PUBLIC_TURNSTILE_SITE_KEY`, puis en *secrets* `TURNSTILE_SECRET`, `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`).
3. **Domaine** — Pages → Custom domains → ajouter le domaine final, puis remplacer `moyo.example` dans `public/robots.txt`, `public/admin/config.yml` (`site_url`) et `src/content/settings/site.yaml` (e-mail).
4. **Turnstile** — Cloudflare → Turnstile → Add site → récupérer clé publique + secrète.
5. **Resend** — créer un compte, vérifier le domaine d'envoi, créer une clé API.

## L'admin (`/admin`)

- Remplacer `VOTRE-COMPTE/moyo-site` dans `public/admin/config.yml`.
- Connexion : **« Sign in with Token »** avec un *fine-grained personal access token* GitHub limité au dépôt (droit *Contents: Read and write*). Aucun serveur d'authentification à héberger.
- On y gère : projets (avec études de cas en blocs : texte, image, deux images, vidéo, citation), services (ajout illimité), secteurs et leur ambiance visuelle, équipe, clients & réseau, coordonnées, showreel, SEO et tous les textes de pages.
- Les vidéos ne vont pas dans Git : les héberger sur Cloudflare R2 ou Stream, puis coller l'URL MP4.
- `scripts/cms-page-fields.py` régénère les champs « Textes des pages » si vous ajoutez des clés aux fichiers `src/content/pages/*.yaml`.

## Contenus d'exemple

Projets, clients, équipe et visuels sont **fictifs** et marqués `placeholder: true` (mention « Exemple » sur le site).
Avant la mise en ligne : remplacer ou supprimer chaque entrée, puis décocher « Projet d'exemple ».
Les visuels d'exemple sont générés par `scripts/generate-placeholders.py`.

Les mentions légales et la politique de confidentialité sont des **brouillons à faire valider** (champs entre crochets).

## Direction artistique

- Monochrome noir & blanc, mode clair par défaut et mode sombre : `src/styles/tokens.css`.
- Typographie : Neue Montreal Medium partout (interface en petites capitales). Logotype « moyo » toujours en minuscules, SVG dans `public/brand/`.
  ⚠️ L'usage commercial de Neue Montreal demande une licence Pangram Pangram.
- Accueil plein écran : bande de projets incurvée en WebGL (`src/scripts/ribbon.ts`), molette / glisser / flèches, décalage RVB selon la vitesse. Sans GPU : carrousel HTML. Mouvement réduit : bande fixe, sans effet.

## Qualité

Lighthouse (desktop et mobile) : 100 / 100 / 100 / 100 sur l'accueil, axe-core WCAG 2 AA sans violation sur les 3 pistes × 2 modes.
Aucun cookie, polices auto-hébergées, aucun appel à un CDN tiers (hors Turnstile sur la page contact).
