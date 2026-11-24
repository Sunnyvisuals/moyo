# moyo

Site du studio **moyo** (Zahia Bougouffa, Yacine Bouabdallah) : une seule page, en français et en anglais, sans framework ni dépendance au runtime.

Contact : contact.moyostudio@gmail.com

## Direction artistique

Le système est décrit et défini dans un seul fichier, `shared/design.js`, utilisé par toutes les pages.

- **Couleur** : blanc cassé `#FAFAF8`, encre `#121214`, un gris `#65656B`. Le bleu Klein `#002FA7` est la seule couleur et il a toujours un sens : l'idée, l'action, la fin de page.
- **Le point Klein** : l'idée unique. Il charge la page, termine les titres (celui d'une page se prend en main et se lance), est le curseur (une partie reste sous la main, l’autre va ponctuer ce qu’on pointe), montre le chemin, fait les sept métiers des services, regarde depuis les cases sans photo ; à la fin il quitte le chemin et devient la pupille des deux o du pied de page. Sources et choix : `docs/references.md`.
- **Typographie** : une famille, Hanken Grotesk (variable), trois graisses (400, 600, 700). Les titres sont coupés à la hauteur des capitales (`text-box`) et leur première lettre est calée sur l'axe au pixel (`optical()` dans `src/site.js`).
- **Grille** : 12 colonnes, quatre axes (1, 4, 7, 10). Chaque bloc de chaque page commence sur l'un d'eux.
- **Blancs** : ce qui va ensemble est proche, les groupes sont séparés, les sections sont très éloignées.
- **Mouvement** : une seule courbe. Les éléments apparaissent un par un et repartent de la même façon ; les titres ne bougent pas, seul leur point tombe. Trois passages seulement se font l'un sur l'autre, avec le bord de verre : les projets sur la première phrase, le studio sur la méthode, le pied de page sur le contact (classe `.over`, `src/stack.js`). Une image naît d'un seul point, qui se divise jusqu'à la former (`src/divide.js`) ; celle d'une carte devient celle de la fiche (View Transitions). « Moins de mouvement », en bas de page, coupe tout.
- **Dégradé** : le haut du pied de page et des feuilles est une seule image, calculée au chargement (`src/glass-rt.js`) : du papier dont l’horizon n’est pas une ligne droite, et derrière lui une lueur Klein là où l’horizon est le plus bas. Le noir passe au blanc par le bleu, jamais par le gris. Un grain est ajouté avant l’arrondi à 8 bits, pour qu’aucune marche ne se voie. `--kl` règle la lueur (1 sur le film, moins sur le papier).
- **Boutons** : un mot et son point, comme un titre. Le point porte la flèche ; pointé, il s’étire jusqu’à contenir le mot (`.btn`). Celui du formulaire (`.send`) est sa dernière ligne : les trois points des champs remplis y roulent, il couvre la ligne au survol, et redevient le point de « Merci. » une fois le message parti.
- **Chemin** : une ligne et un point dans la marge, qui s'ouvre sur les noms au survol ou au clavier (accueil), un fil d'Ariane et une étape suivante (autres pages), une page 404.

## Contenu

| Section | Contenu |
| --- | --- |
| Ouverture | Une phrase |
| Projets | Un accordéon d'images, la légende sur la grille. Ouverture en fiche ; chaque fiche a son adresse (`/projets/<id>`, une vraie page), le bouton Retour la ferme |
| Services | Sept services, une ligne chacun, et le point au travail sur le quatrième axe (`src/trades.js`). Une ligne qui a des projets y mène |
| Méthode | Une scène épinglée en plein écran, quatre étapes ; pour chacune une image, une vidéo ou un GIF, choisis dans l'admin, et les mots en blanc par-dessus |
| Studio | La phrase s'encre d'une vague Klein avec le scroll, puis le sens de « moyo » |
| Équipe | Les noms, vers `/equipe/<id>` |
| Contact et pied de page | Formulaire (les choix sont des lignes et des anneaux où le point tombe ; le budget, une ligne où il roule), e-mail, plan du site, inscription, langue ; le logo vous regarde, maintenir un œil ouvre un monochrome |

Les projets se gèrent depuis `/admin`. Les 5 projets de départ sont des exemples à remplacer.

## En ligne (Cloudflare Pages)

Site : https://moyo-d0n.pages.dev

| Adresse | Contenu |
| --- | --- |
| `/` | La page d'accueil. La section Projets montre les projets marqués « accueil » (★) |
| `/projets` | Tous les projets, filtrés par catégorie (`/projets?cat=identite`) |
| `/projets/<id>` | Un projet. Depuis l'accueil ou la liste, il s'ouvre en fiche par-dessus la page ; partagé, rechargé ou ouvert dans un onglet, c'est cette page |
| `/equipe/<id>` | Un profil |
| `/en`, `/en/projets`… | Les mêmes pages en anglais, rendues par le serveur (`functions/en`) |
| `/sitemap.xml`, `/llms.txt`, `/robots.txt` | Pour les moteurs de recherche et les moteurs de réponse (IA) |
| `/admin` | Mode admin, protégé par mot de passe : ajouter, modifier, ordonner, supprimer des projets, gérer les catégories, envoyer la photo de couverture et la galerie ; la méthode (image, vidéo ou GIF, titre et texte de chaque étape) ; l'équipe ; les messages |

Les projets et les images sont stockés dans Cloudflare KV (espace `MOYO`). Les pages sont rendues côté serveur avec les données à jour (`functions/_middleware.js`), donc elles restent complètes sans JavaScript et lisibles par les moteurs de recherche. Tant que rien n'a été publié depuis l'admin, c'est `data/projects.json` qui sert.

### Structure

```
src/index.src.html     page d'accueil (gabarit)
src/projets.src.html   page « Projets »
src/admin.html         admin : la page et son style, sur le système de design du site
src/admin.js           admin : connexion, projets, méthode, équipe, catégories, messages, mot de passe
src/site.js            langue, scroll, projets, fiche, formulaire (toutes les pages)
src/*.js               un fichier par comportement : menu, pied de page, yeux, verre, passages, métiers, méthode, encre, apparitions, point lancé, sorties, curseur
shared/design.js       système de design : couleurs, typographie, grille, composants, fiche projet
shared/chrome.js       en-tête, menu, pied de page
shared/i18n.js         mots de l'en-tête, du menu et du pied de page, en deux langues
shared/seo.js          titres, descriptions, aperçus de lien, données structurées
shared/render.js       rendu des projets, partagé par le build, le serveur et les pages
functions/equipe/      page de profil, rendue par le serveur
functions/projets/     page de projet, rendue par le serveur
archive/               anciennes versions (accueil v8, phrases manuscrites, effets de titres)
data/projects.json     projets de départ (les 5 exemples)
functions/             API Cloudflare : /api/projects, /api/login, /api/logout, /api/me, /api/images, /img/<id>
build.mjs              construit dist/
wrangler.toml          configuration Cloudflare (projet « moyo », KV « MOYO »)
```

### Référencement (SEO et GEO)

Tout est dans `shared/seo.js`, en deux langues ; `build.mjs` vérifie que les services et la méthode y sont mot pour mot ceux de la page.

- **Chaque page** a son titre, sa description, son adresse canonique, ses liens `hreflang` (français, anglais), son aperçu de lien et ses données structurées (studio, fondateurs, services, projets, profils, fil d'Ariane).
- **Anglais** : `/en/…`, de vraies pages. Sur le site, changer de langue change l'adresse.
- **Moteurs de réponse** : `robots.txt` les accueille, `/llms.txt` donne les faits en clair, toujours à jour avec l'admin.
- **Attente** : les cinq projets d'exemple et les profils encore en lorem ipsum sont visibles mais en `noindex`, hors du plan du site et de `/llms.txt`. Ils y entrent dès qu'ils sont remplacés dans l'admin.
- **Image de partage** : `assets/partage-2.png`, dessinée par `scripts/og.mjs`. Pour en changer, donner un nouveau nom de fichier (Discord garde l'ancienne image). Icônes et aperçus des projets : `scripts/icons.mjs`.
- **À faire avec le compte du studio** : déclarer le site et `sitemap.xml` dans Google Search Console et Bing Webmaster Tools, créer la fiche Google Business Profile. Si le site change de domaine, changer `SITE` dans `shared/seo.js`.

### Mot de passe admin

Personne d'autre que le studio ne le choisit, et il n'est jamais dans le code.

- **Première fois, ou mot de passe oublié** : sur `/admin`, un lien à usage unique (30 minutes) part vers la boîte mail du studio (`TO_EMAIL`, par défaut contact.moyostudio@gmail.com). Il faut le secret `RESEND_API_KEY`.
- **Le changer** : dans l'admin, « Mot de passe ». Les autres appareils sont déconnectés.
- **Sans mail** : définir le secret Cloudflare `ADMIN_PASSWORD`, puis redéployer. Il sert tant qu'aucun mot de passe n'a été choisi dans l'admin :

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name moyo
npm run deploy
```

- **Tout oublier** (le secret reprend la main) : `npx wrangler kv key delete auth --namespace-id de946356b5934cbfa13b6e0ac49d3052 --remote`

Le mot de passe est étiré dans le navigateur (PBKDF2, 600 000 tours) : seul le résultat est envoyé, et seule une empreinte est gardée. La session dure jusqu'à la fermeture du navigateur, ou 7 jours si on le demande. Après 10 essais ratés, une adresse IP est bloquée 15 minutes.

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

- **Léger** : accueil d'environ 90 Ko (HTML et CSS, 21 Ko compressés), police et scripts en fichiers partagés par toutes les pages. Pas de traceur, aucune requête vers un autre domaine.
- **CSS 2026** : `subgrid`, `text-box`, View Transitions entre documents, API Popover pour le menu, `@starting-style`, `text-wrap`.
- **Accessibilité** : contenu visible sans JavaScript, état « animations réduites » conçu à part, bouton « Moins de mouvement », contraste d'au moins 4,5:1, cibles d'au moins 40 px, navigation au clavier, brouillon du formulaire gardé dans l'onglet, FR/EN (`?lang=en`).

## Construire

`build.mjs` (Node) écrit `dist/` : il injecte le système de design, l'en-tête, le pied de page et les projets dans les gabarits, et copie les scripts.

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

Ces scripts ont été écrits pour l'accueil v8 : leurs sélecteurs sont à adapter à la version actuelle.

## Estimation Awwwards (auto-évaluation, pas un jury)

| Critère | Poids | Note |
| --- | --- | --- |
| Design | 40 % | 9,3 |
| Utilisabilité | 30 % | 9,6 |
| Créativité | 20 % | 9,8 |
| Contenu | 10 % | 6,0 |
| **Total pondéré** | | **environ 9,1** |

Le point faible est le contenu : projets d'exemple, pas de photos ni de cas clients.

## Reste à faire

- Remplacer les projets d'exemple par de vrais projets, depuis `/admin`.
- Remplacer les biographies (texte d'attente) et ajouter les portraits.
- Essayer sur de vrais téléphones (Chrome, Firefox 159 et WebKit 27 de test sont passés ; WebKit garde une version simple des View Transitions, voir `VT` dans `src/site.js`).
- Ajouter d'autres moyens de contact si besoin (réseaux, téléphone).

## Historique

Le dossier `archive/` garde les versions précédentes, les scripts de modification et les anciens tests. Voir `archive/README.md`.

## Crédits et licences

- [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk), licence SIL OFL 1.1 : `fonts/LICENSE-hanken-grotesk.txt`.
- [Lenis](https://github.com/darkroomengineering/lenis), licence MIT : `vendor/LICENSE-lenis.txt`.
- Heures de soleil par mois : moyennes 1991 à 2020, [Climats et Voyages](https://www.climatsetvoyages.com/climat/france/nice).
