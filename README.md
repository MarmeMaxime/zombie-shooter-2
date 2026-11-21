# Zombie Shooter 2 — version 1.0

Jeu de tir en pixel art dans le navigateur : les zombies arrivent par la droite,
tu les retiens le plus longtemps possible. Deux modes (Normal et Hardcore),
jouables à l'infini, sur PC comme sur téléphone.

## Jouer

Ouvre `index.html` dans un navigateur récent (aucune installation, aucun serveur).
La progression est enregistrée dans le navigateur ; elle peut être téléchargée et
réimportée depuis le menu 💾.

| Action | Clavier | Tactile |
|---|---|---|
| Monter / descendre | ↑ ↓, Z / W, S | joystick |
| Tirer | Espace | TIR (maintenu : tir auto) |
| Pouvoir spécial | E ou Maj | ★ |
| Acheter une vie | V | V |
| Pause | Échap ou P | ⏸ |

## Personnages

| Perso | Arme | Pouvoir spécial |
|---|---|---|
| Soldat | Fusil : longue portée, une cible | Rafale : tir automatique pendant 3 s |
| Brutus | Fusil à pompe : 5 plombs en éventail | Onde de choc : repousse et étourdit |
| Mira | Lance-grenades : dégâts de zone | Tapis de bombes : 6 obus |
| Lassie | Fusil électrique : la foudre saute sur 3 zombies | Orage : frappe tous les zombies à l'écran |

## Ennemis

Zombie, Tank, Magical girl (hardcore, se téléporte), Joggeur (charge quand il est
aligné), Anti-émeute (3 PV, un seul par tir, arrête la foudre) et le boss, le Mastodonte.

## Contenu

- Caisses de butin (parodie assumée, monnaie du jeu uniquement) : 20 tenues, skins
  universels, déchets.
- 10 missions par personnage, 31 succès avec titres.
- Sauvegarde versionnée avec historique et export / import.

## Outils

Le dossier `outils/` contient les scripts de génération des sprites (PowerShell)
et le simulateur d'équilibrage (`node outils/simulation.js`). Voir `outils/README.md`.
