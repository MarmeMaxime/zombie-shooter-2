# Zombie Shooter 2 — version 1.1

Jeu de tir en pixel art dans le navigateur : les zombies arrivent par la droite,
tu les retiens le plus longtemps possible. Deux modes (Normal et Hardcore),
jouables à l'infini, sur PC comme sur téléphone.

## Jouer

Ouvre `index.html` dans un navigateur récent (aucune installation, aucun serveur).
La progression est enregistrée dans le navigateur ; elle peut être téléchargée et
réimportée depuis le menu 💾.

| Action | Clavier | Tactile | Manette |
|---|---|---|---|
| Monter / descendre | ↑ ↓, Z / W, S | joystick | stick gauche, croix |
| Tirer | Espace | TIR (maintenu : tir auto) | A ou gâchette droite (maintenu : tir auto) |
| Pouvoir spécial | E ou Maj | ★ | X, LB ou RB |
| Acheter une vie | V | V | Y |
| Pause | Échap ou P | ⏸ | Start |

Dans les menus, à la manette : A pour jouer ou valider, B pour revenir.
Vibrations (téléphone Android et manette) : réglables dans le panneau 🔊.

## Personnages

| Perso | Arme | Pouvoir spécial |
|---|---|---|
| Soldat | Fusil : longue portée, une cible | Rafale : tir automatique pendant 3 s |
| Brutus | Fusil à pompe : 5 plombs en éventail | Onde de choc : repousse et étourdit |
| Mira | Lance-grenades : dégâts de zone | Tapis de bombes : 6 obus |
| Lassie | Fusil électrique : la foudre saute sur 3 zombies | Orage : frappe tous les zombies à l'écran |

## Ennemis

Zombie, Tank, Magical girl (hardcore, se téléporte), Joggeur (charge quand il est
aligné), Anti-émeute (3 PV, un seul par tir, arrête la foudre), Pondeuse (éclate en
larves), Infirmier (soigne les zombies autour de lui), Boxeur (hardcore, esquive un
tir puis s'essouffle) et le boss, le Mastodonte. Un ennemi spécial prend la place
d'un zombie normal, et leur nombre à l'écran est plafonné.

## Contenu

- Caisses de butin (parodie assumée, monnaie du jeu uniquement) : 20 tenues, skins
  universels, déchets.
- 10 missions par personnage, 31 succès avec titres.
- Sauvegarde versionnée avec historique et export / import.

## Outils

Le dossier `outils/` contient les scripts de génération des sprites (PowerShell)
et le simulateur d'équilibrage (`node outils/simulation.js`). Voir `outils/README.md`.
