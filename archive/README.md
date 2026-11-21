# Archive

Tout ce qui a mené à la v7. Rien ici n'est nécessaire pour construire ou publier le site : le gabarit actuel est `src/index.src.html`.

## `versions/`

Les fichiers `*.src.html` sont des gabarits avec les marqueurs `__FONT__` et `__LENIS__` : pour les ouvrir, copiez-en un à la place de `src/index.src.html` et lancez `python3 build.py`. Les deux premiers fichiers sont des pages complètes.

| Fichier | Contenu |
| --- | --- |
| `00-prototype-riviera.html` | Premier prototype, alors nommé « Heure Bleue Studio », page complète |
| `01-heure-bleue-studio.html` | Deuxième itération sous le même nom, page complète |
| `v2.src.html` à `v4.src.html` | Gabarits suivants : la fenêtre, le soleil calculé, le rythme. Le nom « moyo » apparaît à partir de la v3 |
| `v5-caustics.src.html` | Scroll fluide, parallax, volets, avec la lumière dans l'eau (caustics) |
| `v5.1-sans-caustics.src.html` | La même version sans caustics |
| `v6-recouvrement-bandeaux.src.html` | Blocs bleus qui se recouvrent, bandeaux défilants, header store banne, réactions au survol. Retirée à la demande |
| `v6b-sans-recouvrement.src.html` | La v6 sans le recouvrement ni le halo de souris, jamais publiée |
| `v7-avant-barre-fenetre.src.html` | La v5.1 avec le nouveau pied de page et la section Lumière enrichie, avant la barre « fenêtre » |

## `patches/`

Les scripts Python qui ont transformé la source d'une version à l'autre (`patch1.py` à `patch8.py`). Ils s'appliquent à la source de leur époque, pas à la source actuelle.

## `tests/`

Les scripts de mesure et de capture utilisés pendant le travail (performance, jointures, fantômes de texte, états, recouvrement de la v6). Ils contiennent des chemins absolus de l'environnement d'origine (`/home/claude/v2`). Les tests à jour sont dans `../tests/`.
