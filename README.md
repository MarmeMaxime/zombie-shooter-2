# Zombie Shooter 2 — version 1.3.1

Jeu de tir en pixel art dans le navigateur : les zombies arrivent par la droite,
tu les retiens le plus longtemps possible. Deux difficultés (Normal et Hardcore),
trois façons de jouer (Classique, Vagues et Campagne), sur PC, téléphone ou à la manette.

## Jouer

Ouvre `index.html` dans un navigateur récent (aucune installation, aucun serveur).
La progression est enregistrée dans le navigateur ; elle peut être téléchargée et
réimportée depuis le menu 💾.

Au lancement d'un combat, on choisit le mode :

- **♾ Classique** : les zombies arrivent sans fin, de plus en plus nombreux. Les
  points achètent des vies en cours de partie (touche V).
- **🌊 Vagues** : une vague à la fois, une boutique entre chaque vague (vie,
  cadence de tir, vitesse, recharge du pouvoir), un boss toutes les 5 vagues.
- **📖 Campagne** : l'histoire du camp que le soldat protège, avec sous terre un
  labo qui cherche un remède. Chapitre 1, « La Recrue », en cinq missions, chacune
  avec son intro dans le camp et jouable en normal comme en hardcore :
  1. « Premier contact » : repousser la première attaque.
  2. « Couvre-feu » : de nuit, à la lampe torche.
  3. « La Livraison » : escorter un camion jusqu'au camp (premiers Tanks).
  4. « La Brèche » : couvrir la réparation du mur (premiers Joggeurs).
  5. « Coup de foudre » : une horde, puis la Mastodonte, échantillon du labo qui a muté.

  Chapitre 2, « Le Cogneur » : « La Débandade », à l'ouest (l'écran est en miroir),
  une horde qui fuit quelque chose… et la rencontre avec Brutus.

  Chaque mission garde son meilleur temps et ses vies restantes ; le chapitre se
  termine sur un épilogue. Le camp s'affiche derrière le menu et grandit avec la
  campagne (palissade et tour de guet après « La Brèche »).

À la toute première partie, le Sergent propose un **entraînement** (on peut le
refaire à tout moment depuis l'aide-mémoire « ? »).

| Action | Clavier | Tactile | Manette |
|---|---|---|---|
| Monter / descendre | ↑ ↓, Z / W, S | joystick | stick gauche, croix |
| Tirer | Espace | TIR (maintenu : tir auto) | A ou gâchette droite (maintenu : tir auto) |
| Pouvoir spécial | E ou Maj | ★ | X, LB ou RB |
| Acheter une vie (Classique) | V | V | Y |
| Pause | Échap ou P | ⏸ | Start |
| Écran de fin : réessayer / menu | Entrée / Échap | boutons | A / B |

Dans les menus, à la manette : A pour jouer ou valider, B pour revenir.
Les touches du clavier se changent dans les **Options ⚙️**, qui règlent aussi le
son (musique, bruitages), les vibrations (téléphone Android et manette) et la
langue : français, anglais, espagnol… et zombie.

## Personnages

On commence avec le Soldat ; chaque personnage suivant se débloque en réussissant
3 défis avec le précédent.

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
tir puis s'essouffle), et deux boss : le Mastodonte et le Fossoyeur. Un ennemi
spécial prend la place d'un zombie normal, et leur nombre à l'écran est plafonné.
Chaque monstre rencontré rejoint le **bestiaire 📖**, avec sa fiche.

## Contenu

- Caisses de butin (parodie assumée, monnaie du jeu uniquement) : 20 tenues,
  3 skins universels, déchets.
- 15 défis par personnage, 51 succès avec titres.
- Bilan à la fin de chaque partie : victimes par espèce, records, défis et
  succès obtenus.
- Musiques du menu, du mode normal et de l'entraînement générées par le jeu
  (Web Audio) ; le mode hardcore garde sa playlist.
- Bruitages générés eux aussi : voix des dialogues, radio de l'éclaireur, moteurs,
  grognements de zombies, fanfare de victoire, toujours sous la musique.
- Sauvegarde versionnée avec historique et export / import.

## Dossiers

- `index.html`, `styles.css` : la page du jeu.
- `fichierJs/` : tout le code du jeu.
- `assets/persos/<perso>/` : les images d'un perso (`arret`, `tir`, `marche1` à `marche4`).
- `assets/skins/<perso>/<tenue>/` : les mêmes images pour chaque tenue.
- `assets/monstres/<monstre>/` : les images de marche des monstres dessinés à la main
  (les autres sont générés par le code, dans `fichierJs/*_sprite.js`).
- `assets/son/` : sons et playlist du mode hardcore.
- `outils/` : scripts de génération des sprites (PowerShell) et simulateur
  d'équilibrage (`node outils/simulation.js`). Voir `outils/README.md`.
- `ancien/` : fichiers que le jeu n'utilise plus, gardés pour mémoire.
