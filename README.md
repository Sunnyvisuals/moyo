# moyo

Site du studio **moyo** (Zahia Bougouffa, Yacine Bouabdallah) : une seule page, en français et en anglais, sans framework ni dépendance au runtime.

Contact : contact.moyostudio@gmail.com

## Direction artistique

- Deux couleurs : bleu Klein `#002FA7` et blanc de chaux `#F1F3F2`.
- Une famille typographique : Hanken Grotesk (variable), intégrée dans la page.
- Idée centrale : un mur blanc de chaux, une fenêtre bleue qui s'ouvre au scroll, et **le soleil réel de Nice, calculé dans le navigateur**. Il pilote l'ombre de la fenêtre, l'ombre de la barre de navigation, le poids du titre, l'heure affichée et la journée qui défile avec le scroll.
- Aucune ville dans le titre, le contact ni les métadonnées. La section « Lumière » reste calculée pour Nice.
- Mouvement lent : scroll fluide (Lenis), parallax, volets sur les titres, boutons à store.

## Aperçu

![Hero : la fenêtre fermée, le soleil du jour et la barre de navigation](docs/screens/01-hero.jpg)

| | |
| --- | --- |
| ![Projets](docs/screens/02-projets.jpg) | ![Studio](docs/screens/03-studio.jpg) |
| ![Lumière](docs/screens/04-lumiere.jpg) | ![Pied de page](docs/screens/05-pied-de-page.jpg) |

Captures prises en bureau 1440 px le 22 novembre 2026 ; les heures du soleil changent chaque jour.

## Contenu de la page

| Section | Contenu |
| --- | --- |
| Hero | La fenêtre qui s'ouvre, le soleil du jour, l'heure réglable |
| Approche | Une phrase, un lien vers les projets |
| Projets | 5 projets d'exemple (plaques abstraites), ouverture en dialogue avec View Transitions |
| Services | Quatre services, la méthode en quatre étapes |
| Studio | Le sens de « moyo », trois principes, l'équipe (noms seulement) |
| Lumière | Lever, midi solaire, coucher, direction du soleil, heure dorée, ombre à midi, écart avec la veille, heures de soleil par mois, durée du jour sur l'année, prochain solstice |
| Contact et pied de page | E-mail, plan du site, lumière du moment, infos sur le site |

Les projets se gèrent depuis `/admin`. Les 5 projets de départ sont des exemples à remplacer.

## En ligne (Cloudflare Pages)

Site : https://moyo-77s.pages.dev

| Adresse | Contenu |
| --- | --- |
| `/` | La page d'accueil. La section Projets montre les projets marqués « accueil » (★) |
| `/projets` | Tous les projets, filtrés par catégorie (`/projets?cat=identite`) |
| `/admin` | Mode admin, protégé par mot de passe : ajouter, modifier, ordonner, supprimer des projets, gérer les catégories, envoyer la photo de couverture et la galerie |

Les projets et les images sont stockés dans Cloudflare KV (espace `MOYO`). Les pages sont rendues côté serveur avec les données à jour (`functions/_middleware.js`), donc elles restent complètes sans JavaScript et lisibles par les moteurs de recherche. Tant que rien n'a été publié depuis l'admin, c'est `data/projects.json` qui sert.

### Structure

```
src/index.src.html     page d'accueil (gabarit)
src/projets.src.html   page « Tous les projets »
src/admin.html         mode admin
shared/render.js       rendu des projets, partagé par le build, le serveur et les pages
data/projects.json     projets de départ (les 5 exemples)
functions/             API Cloudflare : /api/projects, /api/login, /api/logout, /api/me, /api/images, /img/<id>
build.mjs              construit dist/
wrangler.toml          configuration Cloudflare (projet « moyo », KV « MOYO »)
```

### Mot de passe admin

Le mot de passe est un secret Cloudflare, jamais dans le code :

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name moyo
npm run deploy
```

Le changer déconnecte toutes les sessions. Après 10 essais ratés, une adresse IP est bloquée 15 minutes.

### Déployer

```bash
npm install
npm run deploy      # node build.mjs puis wrangler pages deploy
```

### Développer en local

Créez `.dev.vars` avec `ADMIN_PASSWORD=un-mot-de-passe-de-test`, puis :

```bash
npm run dev         # http://localhost:8788
```

Sous Windows, si le dossier du projet a un chemin très long (plus de 260 caractères avec `node_modules`), `wrangler pages dev` échoue avec `spawn ... workerd.exe ENOENT` ou `SQLITE_CANTOPEN`. Le plus simple est de placer le projet dans un dossier court (par exemple `C:\dev\moyo`).

## Technique

- **Page d'accueil autonome** : `dist/index.html` (environ 160 Ko) contient le CSS, le JavaScript, la police et Lenis. Pas de traceur, aucune requête vers un autre domaine. Le seul cookie est celui de la session admin.
- **CSS 2026** : `@property`, `animation-timeline: view()`, View Transitions entre document et `<dialog>`, API Popover pour le menu, `linear()` pour les ressorts, `@starting-style`, `text-wrap`, masques CSS.
- **Soleil** : formules d'éphéméride simplifiées (type NOAA), latitude 43,7102, longitude 7,2620, heure de Paris.
- **Accessibilité** : contenu visible sans JavaScript, état « animations réduites » conçu à part, contraste d'au moins 4,5:1, cibles tactiles d'au moins 24 px, navigation au clavier, FR/EN.

## Construire

`build.mjs` (Node) écrit `dist/`. Dans `src/index.src.html`, il remplace `__FONT__` et `__LENIS__` (police en base64, `vendor/lenis.min.js`), `__RENDER__` (`shared/render.js`), `__ROWS__` et `__DATA__` (projets de `data/projects.json`).

```bash
npm run build
```

Le site a besoin des Functions Cloudflare pour l'admin et les données à jour. GitHub Pages ne sert plus que la version statique de départ.

## Tester

Les tests utilisent Playwright (Python) et Google Chrome.

```bash
npm install                  # installe axe-core
pip install playwright
python3 tests/qa.py          # axe-core sur 20 états : bureau 1440 px (FR) et mobile 390 px (EN)
python3 tests/modes.py       # sans JavaScript, animations réduites
python3 tests/rm2.py         # animations réduites : aucune animation active
python3 tests/scroll.py      # scroll Lenis, menu, ancres, dialogue
python3 tests/foot.py 1440 900   # le grand « moyo » est collé au bas de la page
```

Les captures sont écrites dans `tests/out/`. Dernier résultat : 0 violation sur 20 états, aucune erreur console.

## Estimation Awwwards (auto-évaluation, pas un jury)

| Critère | Poids | Note |
| --- | --- | --- |
| Design | 40 % | 7,6 |
| Usabilité | 30 % | 8,0 |
| Créativité | 20 % | 7,3 |
| Contenu | 10 % | 5,5 |
| **Total pondéré** | | **environ 7,4** |

Le point faible est le contenu : projets d'exemple, pas de photos ni de cas clients.

## Reste à faire

- Remplacer les projets d'exemple par de vrais projets, depuis `/admin`.
- Valider la phrase qui relie le mot « moyo » (cœur, vie, courage) au studio : elle est de ma plume.
- Mesurer la fluidité sur un vrai GPU : l'environnement de test n'en a pas.
- Ajouter d'autres moyens de contact si besoin (réseaux, téléphone).

## Historique

Le dossier `archive/` garde les versions précédentes, les scripts de modification et les anciens tests. Voir `archive/README.md`.

## Crédits et licences

- [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk), licence SIL OFL 1.1 : `fonts/LICENSE-hanken-grotesk.txt`.
- [Lenis](https://github.com/darkroomengineering/lenis), licence MIT : `vendor/LICENSE-lenis.txt`.
- Heures de soleil par mois : moyennes 1991 à 2020, [Climats et Voyages](https://www.climatsetvoyages.com/climat/france/nice).
