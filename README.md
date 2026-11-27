# moyo

Site du studio **moyo** (Zahia Bougouffa, Yacine Bouabdallah) : une seule page, en français et en anglais, sans framework ni dépendance au runtime.

Contact : contact.moyostudio@gmail.com

## Direction artistique

Le système est décrit et défini dans un seul fichier, `shared/design.js`, utilisé par toutes les pages.

- **Couleur** : blanc cassé `#FAFAF8`, encre `#121214`, un gris `#65656B`. Le bleu Klein `#002FA7` est la seule couleur et il a toujours un sens : l'idée, l'action, la fin de page.
- **Le point Klein** : l'idée unique. Il charge la page, termine les titres (celui d'une page se prend en main et se lance), ouvre la première page (la caméra sort de lui), est le curseur (une partie reste sous la main, l’autre va ponctuer ce qu’on pointe), montre le chemin, fait les sept métiers des services, regarde depuis les cases sans photo ; à la fin il quitte le chemin et devient la pupille des deux o du pied de page. Sources et choix : `docs/references.md`.
- **Typographie** : une famille, Hanken Grotesk (variable), trois graisses (400, 600, 700). Les titres sont coupés à la hauteur des capitales (`text-box`) et leur première lettre est calée sur l'axe au pixel (`optical()` dans `src/site.js`).
- **Grille** : 12 colonnes, quatre axes (1, 4, 7, 10). Chaque bloc de chaque page commence sur l'un d'eux.
- **Blancs** : ce qui va ensemble est proche, les groupes sont séparés, les sections sont très éloignées.
- **Mouvement** : une seule courbe. Les éléments apparaissent un par un et repartent de la même façon ; les titres ne bougent pas, seul leur point tombe. Trois passages seulement se font l'un sur l'autre, avec le bord de verre : les projets sur la première phrase, le studio sur la méthode, le pied de page sur le contact (classe `.over`, `src/stack.js`). Une image naît d'un seul point, qui se divise jusqu'à la former (`src/divide.js`) ; celle d'une carte devient celle de la fiche (View Transitions). « Moins de mouvement », en bas de page, coupe tout.
- **Dégradé** : le haut du pied de page et des feuilles est une seule image, calculée au chargement (`src/glass-rt.js`) : du papier dont l’horizon n’est pas une ligne droite, et derrière lui une lueur Klein là où l’horizon est le plus bas. Le noir passe au blanc par le bleu, jamais par le gris. Un grain est ajouté avant l’arrondi à 8 bits, pour qu’aucune marche ne se voie. `--kl` règle la lueur (1 sur le film, moins sur le papier).
- **Boutons** : des mots, comme tout le reste. Le petit est un lien en gras avec son point final (`.btn`). Le grand est une ligne, comme les noms : le mot roule et passe au Klein. Celui du formulaire (`.send`) finit sa phrase : trois points de suspension, un par champ rempli, qui se rejoignent en un point final ; « Envoi… » pendant l’envoi, « Merci. » à l’arrivée.
- **Chemin** : sur l'accueil, une ligne et un point dans la marge, qui s'ouvrent sur les noms au survol ou au clavier. Seuls les bords de verre passent dessus et le cachent (projets, studio, pied de page) ; il renaît sur la nouvelle feuille, et on le retrouve dessous en remontant (`src/path.js`). Entre deux feuilles il reste, et devient blanc là où le film passe. Sur téléphone, pas de ligne, on la prendrait pour une barre de défilement : le point attend sous le pouce, et touché il monte parmi les noms. Sur les autres pages, un fil d'Ariane et une étape suivante ; une page 404.

## Contenu

| Section | Contenu |
| --- | --- |
| Ouverture | La phrase seule, aussi grande que l'écran le permet, comme une affiche : `src/hero.js` trouve la taille (les lignes s'équilibrent, jamais un mot seul sur une ligne sauf la dernière). En haut, le studio et le chemin vers les projets. À l'arrivée, le compteur, puis son point s'ouvre jusqu'à remplir l'écran de bleu ; la caméra recule depuis l'intérieur du point final et la phrase, d'abord énorme, se pose autour de lui (`src/load.js`, dessiné sur un canvas le temps du mouvement pour que les lettres restent nettes à toutes les tailles). En venant d'une autre page, le bleu du clic enchaîne sur le même recul. Le point se prend en main et se lance. Mouvement réduit : la phrase, sans mouvement |
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
src/confidentialite.src.html  page « Confidentialité » (RGPD), liée en pied de page
src/mentions-legales.src.html page « Mentions légales » ; les informations du studio sont dans data/mentions.json
src/admin.html         admin : la page et son style, sur le système de design du site
src/admin.js           admin : connexion, projets, méthode, équipe, catégories, messages, mot de passe
src/site.js            langue, scroll, projets, fiche, formulaire (toutes les pages)
src/*.js               un fichier par comportement : menu, pied de page, yeux, verre, passages, métiers, méthode, encre, apparitions, point lancé, sorties, curseur
shared/design.js       système de design : couleurs, typographie, grille, composants, fiche projet
shared/chrome.js       en-tête, menu, pied de page
shared/i18n.js         mots de l'en-tête, du menu et du pied de page, en deux langues
shared/seo.js          titres, descriptions, aperçus de lien, données structurées
shared/render.js       rendu des projets, partagé par le build, le serveur et les pages
shared/blocks.js       mise en page des projets : blocs, intégrations, rendu
shared/rich.js         textes mis en forme (biographies, descriptions), partagé par les pages, le serveur et l'admin
functions/equipe/      page de profil, rendue par le serveur
functions/projets/     page de projet, rendue par le serveur
archive/proj-675/      les images de départ en petit (700 px), avant agrandissement
data/projects.json     projets de départ (les 5 exemples)
functions/             API Cloudflare : /api/projects, /api/login, /api/logout, /api/me, /api/images, /api/preview, /img/<id>
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
- **Marque** : logo, photos de profil, bannières (LinkedIn, X, Facebook, YouTube) et modèles Instagram dans `marque/`, avec leur planche (`marque/planche.png`). Ils sont dessinés depuis la police, les couleurs et l'œil du site par `scripts/marque.mjs` (Playwright). Le site ne les sert pas.
- **Icône** : l'œil, le « o » de moyo avec le point pour pupille, qui regarde la page ; tous ses bords tombent sur les pixels d'un onglet de 16 px, et dans un onglet sombre l'anneau devient le blanc de l'œil. Pour en changer, changer le numéro de `iconLinks` (`shared/design.js`) : les navigateurs gardent l'ancienne pendant des semaines.
- **À faire avec le compte du studio** : déclarer le site et `sitemap.xml` dans Google Search Console et Bing Webmaster Tools, créer la fiche Google Business Profile. Si le site change de domaine, changer `SITE` dans `shared/seo.js`.

### Aperçu avant publication

- **Textes** : la biographie et la description d'un projet se mettent en forme dans l'admin (intertitre, liste, gras, bleu, lien ; gauche, centre, droite, justifié), tels qu'ils seront vus. Ils sont gardés en mots simples (`{c}`, `{r}`, `{j}`, `# `, `- `, `**gras**`, `==bleu==`, `[mots](adresse)`, voir `shared/rich.js`) : jamais de HTML, et les cartes, les moteurs et les aperçus de lien n'en prennent que les mots. Dans la méthode, les mots de chaque étape se mettent à gauche, au centre ou à droite de l'image.
- **Mise en page d'un projet** : dans l'admin, la page du projet se compose de blocs (image, vidéo, texte, infos, chiffres, intégration) posés sur les quatre axes, bord à bord ou en plein écran. On part d'une maquette (étude de cas, galerie, film, site, récit, affiche) ou de la page blanche ; plusieurs images déposées ensemble prennent leur place selon leur forme (`arrange`), un bloc se porte à côté d'un autre (ils partagent la rangée) ou entre deux rangées, la réglette dit où il commence et finit. Une image est envoyée deux fois (grande, et 1200 px). `shared/blocks.js` contrôle et dessine les blocs côté serveur ; la fiche les prend de la page du projet ; `src/blocks-rt.js` joue les films à l'écran. Une intégration (YouTube, Vimeo, Figma, Spotify, SoundCloud, CodePen, Sketchfab, Instagram, TikTok, Behance, Google Maps, ou n'importe quelle page) n'est demandée qu'au clic du visiteur.
- **Ce que le navigateur fait déjà** : langue du visiteur par défaut, noms et adresses enregistrés proposés, bon clavier, orthographe dans la langue du texte, partage du système pour les projets, et un e-mail prêt à partir si le formulaire ne passe pas.
- « Aperçu », en haut de l’admin, montre le vrai site avec ce qui n’est pas publié, sur la page en cours : ordinateur, tablette ou téléphone, français ou anglais, brouillon ou version en ligne.
- La liste des changements dit ce qui va changer, y mène, et permet de rétablir un seul élément. On peut publier de là.
- Le brouillon part au serveur (`/api/preview`, KV `preview:<hasard>`, une heure) et n’est servi qu’à l’admin connecté, dans un cadre du site (`functions/_lib/preview.js` : cookie de session, cookie `moyo_apercu`, en-tête `Sec-Fetch-Dest: iframe`). Partout ailleurs, le site reste celui qui est publié. Rien n’est envoyé depuis l’aperçu.

### Images dans l’admin

- **Déposer** : un fichier se dépose directement sur une image (elle est remplacée), sur les bords d’une image de la galerie (il s’ajoute avant ou après), sur une ligne de la liste des projets ou de l’équipe, sur une étape de la méthode. À côté des images, il va dans la galerie. Coller (Ctrl V) vise l’image sous la souris.
- **Déplacer** : une image de la galerie se prend directement ; posée sur l’image principale, elle l’échange. Deux étapes de la méthode s’échangent de la même façon. Au clavier et au doigt : la poignée à six points, « Principale », « Retirer ».
- **Annuler** : pendant huit secondes, dans le message du bas, ou Ctrl Z.
- **Fiche technique** : dimensions, proportions, poids, format, durée d’une vidéo, temps de chargement en 4G, poids du fichier d’origine, et un avis (point plein : bon ; anneau : suffisant ou lourd ; rouge : à changer). Les seuils sont dans `NEED` (`src/admin.js`).
- **Envoi** : les images sont réduites dans le navigateur (2800 px, 3840 px pour la méthode), en WebP, sans les données de l’appareil photo (lieu, date).

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

## Sécurité

| Protection | Comment |
| --- | --- |
| HTTPS | Imposé : toute adresse en `http` est renvoyée en `https`, et le navigateur s'en souvient un an (`functions/_middleware.js`). |
| Mot de passe | Jamais envoyé ni gardé tel quel : étiré dans le navigateur (PBKDF2-SHA256, 600 000 tours, la recommandation de l'OWASP pour cet algorithme ; bcrypt et Argon2 ne tiennent pas dans le temps de calcul des Functions Cloudflare), puis seule son empreinte est gardée. |
| Essais | Cinq erreurs par adresse (par réseau en IPv6), puis un quart d'heure d'attente. |
| Double vérification | Dans l'admin, onglet « Sécurité » : un code à six chiffres d'une application (Google ou Microsoft Authenticator, 1Password…), huit codes de secours à usage unique. Le lien reçu par e-mail change alors le mot de passe sans ouvrir l'admin. Téléphone et codes perdus : supprimer la clé `auth` du stockage KV « MOYO » dans Cloudflare, puis redemander un lien. |
| Requêtes forgées (CSRF) | Cookie `HttpOnly; Secure; SameSite=Strict`, en-tête propre au site obligatoire, et origine annoncée par le navigateur vérifiée, sur l'admin comme sur les formulaires. |
| Messages d'erreur | Une seule phrase pour un mauvais mot de passe ; il n'y a pas d'identifiant à deviner. |
| Envois et textes | Type, contenu réel et poids des fichiers vérifiés ; rien n'est lu comme du HTML dans les textes. |
| En-têtes | Politique de contenu (rien ne s'exécute depuis ailleurs, l'admin ne s'affiche dans aucune autre page), caméra, micro et position refusés. |
| Formulaires | Champ piège, cinq messages par heure et par adresse. |
| Sauvegardes | Chaque publication garde la version d'avant et ses images (les dix dernières), à reprendre dans l'onglet « Sécurité » ; « Tout télécharger » donne les textes, les versions, les messages et les inscriptions (sans les images). |
| Secrets | Dans les secrets Cloudflare, jamais dans le dépôt. |

**RGPD** : la page `/confidentialite` (et `/en/confidentialite`) dit ce qui est recueilli et pourquoi. Les messages et les inscriptions s'effacent seuls au bout de trois ans. Effacez aussi les e-mails reçus et les sauvegardes téléchargées à la même échéance, et mettez la page à jour si un prestataire ou un usage change.

**Ce qui se règle dans Cloudflare, pas dans le code** : la protection anti-DDoS de Cloudflare couvre déjà le site. Un pare-feu applicatif (règles WAF, limitation de débit, Turnstile) demande un nom de domaine à vous, ajouté à Cloudflare. Pensez aussi à activer la double vérification de vos comptes Cloudflare, GitHub et de la boîte mail du studio : ils ouvrent tout le reste.

Dépendances : `npm audit` et `npm outdated` de temps en temps.

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

Les versions précédentes, les anciens scripts et les anciens tests sont dans l'historique Git : le dossier `archive/` les contenait encore au commit `95da2a0`.

## Crédits et licences

- [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk), licence SIL OFL 1.1 : `fonts/LICENSE-hanken-grotesk.txt`.
- [Lenis](https://github.com/darkroomengineering/lenis), licence MIT : `vendor/LICENSE-lenis.txt`.
- Heures de soleil par mois : moyennes 1991 à 2020, [Climats et Voyages](https://www.climatsetvoyages.com/climat/france/nice).
