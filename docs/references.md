# Références et choix

Ce qui a été lu avant de dessiner, et ce que chaque lecture a donné sur le site.

## L'idée

Une seule idée pour tout le site : **le point Klein**. Il ouvre le site (il tombe, et son onde écrit la phrase), charge les autres pages (il dessine leur titre), termine les titres, devient le curseur, voyage sur le chemin, fait les sept métiers, et finit dans le pied de page : il quitte le chemin, entre dans le dernier o, saute dans le premier. C'était un œil.

## Créativité

- Margaret Boden : une idée créative est nouvelle, surprenante **et** utile. Trois voies : combiner, explorer, transformer. [IJCAI](https://ijcai.org/proceedings/1997/229)
- Arthur Koestler, la « bisociation » : faire se croiser deux cadres qui ne se rencontrent jamais. Ici, un logo et un visage ; un pied de page et un monochrome.

## Sociologie et perception

| Lecture | Sur le site |
| --- | --- |
| Georg Simmel, [sociologie des sens](https://cuny.manifoldapp.org/read/georg-simmel-some-collected-works/section/8895b310-16c0-4ef8-8b27-de3e4988526d) : le regard échangé est une réciprocité, on ne peut pas regarder sans être vu | Le logo du pied de page vous regarde |
| Erving Goffman, [l'inattention civile](https://en.wikipedia.org/wiki/Civil_inattention) : on ne fixe pas un inconnu | Si on fixe un œil, il se détourne, puis revient en douce |
| Friesen et Kingstone, 1998, [suivre le regard](https://doi.org/10.3758/BF03208827) : l'attention va là où des yeux regardent | Sans mouvement, les yeux regardent « Quelle est votre idée ? » |
| [Effet Zeigarnik](https://lawsofux.com/zeigarnik-effect/) : ce qui est commencé veut être fini (effet discuté) | Le chemin et ses arrêts, les trois points du formulaire |
| Coprésence | « 2 min 14 s ensemble, surtout sur Services. Rien n'est enregistré. » Le compte reste en mémoire, rien n'est envoyé |

## Art

- Yves Klein, les [monochromes](https://en.wikipedia.org/wiki/Yves_Klein). Maintenir un œil : le pied de page devient un monochrome. Relâcher : il se referme. Sans son.

## Mouvement

- [Scroll Slides](https://scrollslides.framer.website/) : une scène épinglée et quatre temps. Repris pour la méthode : une étape à la fois, et son image, sa vidéo ou son GIF, choisis dans l'admin.
- [Accordion Cards Pro](https://www.framer.com/marketplace/components/accordion-cards-pro/) : la carte regardée s'ouvre. Repris pour les projets, la légende restant sur la grille.
- [Gradient Text Reveal](https://www.framer.com/marketplace/components/gradient-text-reveal/) : chaque lettre passe par trois couleurs avec le scroll. Repris avec une vague Klein, seulement pour les phrases qui parlent : studio, méthode, contact.
- [Font Weight Hover](https://www.framer.com/marketplace/components/font-weight-hover/) : la graisse suit le pointeur. Repris pour les services.

## Détails à trouver

- Le point du titre se prend en main et se lance : il rebondit sur les lignes de la phrase, puis rentre.
- De 23 h à 6 h, les paupières sont lourdes (battements lents, sommeil plus tôt) et les yeux donnent l'heure. La lettre ne change jamais de forme : la paupière descend dedans.
- Sur la page introuvable, « Rien à voir » : les yeux sont fermés.
- Le mot « moyo » tapé au clavier : un monochrome, une seconde.
- Une case sans photo est un point qui regarde le pointeur.
- Une image naît d'un point : il se divise en deux, quatre, huit, jusqu'à être l'image. D'un projet à l'autre, l'image redevient un point, puis la suivante en naît.

## Règles d'interface

- [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) : relues une à une. Elles ont donné les pages projet, le bouton « Moins de mouvement », le brouillon gardé, les messages d'erreur qui disent quoi faire, le retour au toucher, les marges des écrans à encoche.

## L'ouverture : tout part d'un point

« Tout part d'un point. » Quatre mots, et leur point final est le point Klein : en français, le même mot dit la ponctuation, la forme et le départ. Un seul geste le montre. Le point tombe du ciel sur la page (grand et flou de près, net en arrivant) ; là où il touche, une seule onde part. Derrière elle la phrase est là, courbée au passage comme un mot sous l'eau, puis immobile. Les faits viennent quand l'onde les a dépassés. En venant d'une autre page, l'écran bleu se referme sur le point, et l'onde part de lui.
- La région : Yves Klein était niçois, et son récit fondateur (en partie légendaire, daté de 1947 ou 1948 selon les sources) le montre sur une plage de Nice, prenant le ciel pour œuvre. D'où la légende sur le quatrième axe : « Ce point est bleu Klein, tombé du ciel de Nice. » [Centre Pompidou, chronologie](https://www.centrepompidou.fr/fileadmin/user_upload/dossierressources-yves_klein-chronologie.pdf)
- Les sites du jour Awwwards de 2026 : un chargement qui est déjà l'identité, une grille sans tolérance, une phrase seule. [Neutomni](https://www.awwwards.com/sites/neutomni), [unanim.studio](https://www.awwwards.com/sites/unanim-studio-1)
- Les ondes sur du texte existent en composants ([Ripple Surface](https://www.framer.com/marketplace/components/ripple-surface/), [Liquid Glass Ripple](https://www.framer.com/community/marketplace/components/liquid-glass-ripple/)) : une eau continue, qu'on règle. Ici une seule onde, une seule fois, qui fait apparaître la page au lieu de la troubler.
- La phrase est peinte une fois sur une texture à la taille de l'écran ; WebGL la courbe le temps de l'onde (la crête est une loupe, jamais repliée), puis la page reprend exactement à la même place. Sans WebGL, l'anneau découvre la phrase.

Ouverture précédente : la caméra sortait du point final (*Powers of Ten*, les keynotes d'Apple). Jugée trop proche d'un dézoom ; elle est dans l'historique Git, comme l'œil de verre essayé avant elle.

## Techniques

View Transitions, API Popover et couche supérieure (menu, curseur, voile), `@starting-style`, `text-box`, unités de conteneur, `:has()`, easing `linear()`, police variable, `feDisplacementMap` pour le verre, WebGL pour l'onde de l'ouverture. Chaque effet a un repli : sans JavaScript et en mouvement réduit, la page est complète.

## Grille Awwwards

[Critères officiels](https://www.awwwards.com/about-evaluation/) : design 40 %, utilisabilité 30 %, créativité 20 %, contenu 10 %. Mention honorable à partir de 6,5.

Ce qui manque encore pour le contenu : de vraies photos de projets (celles d'aujourd'hui faisaient 700 px de large ; elles sont agrandies deux fois, originaux dans `archive/proj-675`), les portraits, les biographies (texte d'attente), de vrais projets.
