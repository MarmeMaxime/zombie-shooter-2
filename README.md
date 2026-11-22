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
  une horde qui fuit quelque chose… et la rencontre avec Brutus. Puis « Déménagement
  express » : au coin du feu, Brutus raconte comment il est arrivé, et on joue son
  histoire avec lui, en ville, le jour où tout a commencé. Puis « Terminus » : il quitte
  la ville par le métro, dans le noir, et croise les Infirmiers de l'hôpital. Puis
  « Le Ring » : on lui a volé son fusil, et il doit le regagner à la boxe contre Gégé,
  un ancien collègue qui a muté en gorille. Un vrai combat, sans tir : Tir pour frapper,
  Haut ou Bas pour esquiver quand Gégé prévient (« ! »), une esquive au dernier moment
  le laisse ouvert pour un contre, et ★ lance l'uppercut quand la rage est pleine.
  (`outils/simulation_boxe.js` fait jouer un bot pour régler la difficulté.)
  Enfin « La Longue Marche » : des mois dans le désert vers l'ouest, les monstres croisés
  en route, puis le Fossoyeur. Le lendemain, Brutus voit le mur du camp : la boucle se
  referme sur « La Débandade », et l'épilogue clôt le chapitre au coin du feu.

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
- `fichierJs/` : tout le code du jeu, rangé par sujet :
  - `moteur/` : la boucle de jeu, le joueur, le tir, les zombies, les pouvoirs, le son, la manette, le mode Vagues ;
  - `ennemis/` : le comportement de chaque créature spéciale (Joggeur, Fossoyeur…) ;
  - `campagne/` : le moteur de la campagne, son histoire, le combat de boxe, l'entraînement ;
  - `decors/` : les décors dessinés à la largeur de l'écran (désert, camp, ville, métro…) ;
  - `interface/` : menus, options, bestiaire, succès, missions, lootbox, écran titre ;
  - `donnees/` : réglages, sauvegarde, traductions ;
  - `sprites/` : le chargement des PNG d'`assets/`.
- `assets/persos/<perso>/` : les images d'un perso (`arret`, `tir`, `marche1` à `marche4`) ;
  `assets/persos/brutus/boxe/` : Brutus boxeur (« Le Ring ») ; `assets/persos/soldat/soldat-sans-casque/`.
- `assets/skins/<perso>/<tenue>/` : les mêmes images pour chaque tenue (et `boxe/` pour Brutus).
- `assets/monstres/<monstre>/` : les images des monstres, une par étape d'animation
  (`marche1`…, `course1`…, `charge1`…).
- `assets/campagne/` : un dossier par personnage de l'histoire (le Sergent, le labo,
  la radio de l'éclaireur, la personne du labo, Gégé), avec son portrait de dialogue
  (`portrait-…`), plus les objets du camp et la foule de la bâtisse.
- `assets/son/` : sons et playlist du mode hardcore.
- `outils/` : scripts de génération des sprites et simulateurs d'équilibrage
  (`node outils/simulation.js`, `node outils/simulation_boxe.js`). Voir `outils/README.md`.
  Les sprites dessinés en code ont leur générateur dans `outils/sprites/` : pour les
  réécrire en PNG, lancer `node outils/exporter_sprites.js` puis ouvrir
  `outils/sprites/exporter.html` depuis le serveur du jeu.
- `ancien/` : fichiers que le jeu n'utilise plus, gardés pour mémoire.
