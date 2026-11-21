/* =========================================================================
   RÉGLAGES DU JEU
   Toutes les vitesses sont en pixels PAR SECONDE et les durées en SECONDES :
   le jeu tourne donc à la même vitesse sur un écran 60 Hz, 144 Hz ou 240 Hz.
   ========================================================================= */
const CONFIG = {
    viesDepart: 3,
    prixVieDepart: 100,
    multiplicateurPrixVie: 1.5,
    // Plafond du prix : les vies restent achetables même après des heures de jeu
    prixVieMax: 400,

    // Zone jouable verticale (même zone pour le joueur et l'apparition des zombies)
    margeHaut: 20,
    margeBas: 80,

    joueur: {
        x: 50,
        taille: 64,
        // En dessous de 120 en hardcore, les zombies rapides deviennent impossibles à suivre
        vitesse: { normal: 120, hardcore: 120 },
        dureeAnimTir: 0.3,        // durée d'affichage du sprite de tir
        dureeImageMarche: 0.27
    },

    // Position du canon par rapport au coin haut-gauche du joueur
    canon: { x: 50, y: 28 },

    /* ---------- Personnages jouables ----------
       Pour en ajouter un : une entrée ici (sprites = préfixe des images
       <prefixe>_arret.png, _tir.png, _marche1..4.png) + une arme ci-dessous. */
    /* Pouvoirs spéciaux (pouvoirs.js) : la jauge se remplit en tuant des zombies
       (« kills » éliminations pour la remplir), puis touche E ou bouton ★. */
    pouvoirs: {
        rafale: { nom: 'Rafale', kills: 28, duree: 3, cadence: 0.1,
            description: 'Tir automatique très rapide pendant 3 s : balayez les lignes.' },
        onde: { nom: 'Onde de choc', kills: 15, portee: 320, porteeDegats: 140, recul: 150, etourdissement: 2,
            description: 'Frappe le sol : blesse les zombies collés à lui, repousse et étourdit ceux autour.' },
        artillerie: { nom: 'Tapis de bombes', kills: 30, obus: 6, delai: 0.7, intervalle: 0.12,
            description: '6 obus tombent sur les zombies les plus proches.' },
        orage: { nom: 'Orage', kills: 26, degats: 1, degatsBoss: 3,
            description: 'La foudre frappe chaque zombie à l\'écran une fois.' }
    },

    personnages: {
        soldat: {
            nom: 'Soldat',
            arme: 'fusil',
            pouvoir: 'rafale',
            vitesse: 1.25,      // plus rapide que les autres : compense son arme à une seule cible
            description: 'Le plus rapide. Balle à longue portée, une seule cible : il faut bien viser.'
        },
        brute: {
            nom: 'Brutus',
            arme: 'pompe',
            pouvoir: 'onde',
            sprites: 'brute',
            description: '5 plombs en éventail : pas besoin de viser juste, mais portée limitée.'
        },
        grenadier: {
            nom: 'Mira',
            arme: 'grenade',
            pouvoir: 'artillerie',
            sprites: 'grenadier',
            description: 'Explose au contact et blesse tout autour. Idéal contre les groupes.'
        },
        // Sprites dérivés de ceux de Mira (outils/generer_lassie.ps1)
        lassie: {
            nom: 'Lassie',
            arme: 'foudre',
            pouvoir: 'orage',
            sprites: 'lassie',
            vitesse: 1.25,   // équilibrée par simulation avec une cadence de 0,6 s
            description: 'Foxgirl électrique : la foudre saute d\'un zombie à l\'autre, jusqu\'à 3. Agile, mais tire moins vite que le fusil.'
        }
    },

    armes: {
        fusil: { nom: 'Fusil', delai: 0.5, vitesse: 1200, degats: 1 },
        // Équilibrées par simulation : les 3 armes tiennent indéfiniment dans les 2 modes
        pompe: { nom: 'Fusil à pompe', delai: 0.7, vitesse: 900, degats: 1, plombs: 5, ecartDegres: 10, portee: 460 },
        grenade: { nom: 'Lance-grenades', delai: 0.7, vitesse: 750, degats: 2, rayon: 95, portee: 650 },
        // L'éclair touche un zombie, puis saute vers le plus proche dans le rayon (2 sauts = 3 zombies)
        foudre: { nom: 'Fusil électrique', delai: 0.6, vitesse: 1600, degats: 1, sauts: 2, rayonSaut: 110 }
    },

    zombie: {
        taille: 64,
        points: 10,
        vitesseMin: { normal: 120, hardcore: 180 },
        vitesseAleatoire: 60,
        dureeImage: 0.27,
        // Apparition : l'intervalle diminue avec le temps jusqu'à un plancher.
        // Le plancher est choisi pour qu'une partie reste tenable indéfiniment
        // (vérifié par simulation avec un joueur bot).
        intervalleDepart: 2.5,
        intervalleMin: { normal: 1.5, hardcore: 1.8 },
        accelerationParSeconde: 0.005
    },

    tank: {
        taille: 64,
        points: 50,
        pv: 3,
        vitesseMin: 30,
        vitesseAleatoire: 30,
        dureeImage: 0.2,
        intervalle: 13
    },

    // Mode hardcore uniquement : elle se téléporte sur une autre ligne.
    // Un cercle magique annonce la destination juste avant.
    magicalgirl: {
        modes: ['hardcore'],
        taille: 64,
        points: 40,
        pv: 2,
        vitesseMin: 70,
        vitesseAleatoire: 30,
        dureeImage: 0.15,
        intervalle: 10,
        premiereApparition: 20,   // laisse le temps de s'échauffer
        delaiTeleport: 2.0,
        dureeAnnonce: 0.6,
        distanceTeleportMin: 80,
        xMinTeleport: 300         // ne se téléporte plus quand elle est trop proche du joueur
    },

    // Le Joggeur (normal et hardcore) : quand il se retrouve sur la ligne du joueur,
    // il crie, sprinte, puis s'arrête essoufflé (c'est le moment de l'abattre).
    joggeur: {
        taille: 64,
        points: 30,
        pv: 1,
        vitesseMin: { normal: 75, hardcore: 95 },
        vitesseAleatoire: 20,
        vitesseSprint: { normal: 300, hardcore: 360 },
        dureeImage: 0.08,          // 12 images par pas (joggeur_sprite.js)
        intervalle: 12,
        premiereApparition: 25,
        alignement: 16,            // écart vertical max avec le joueur pour déclencher la charge
        distanceMin: 140,          // ne charge pas s'il est déjà collé au joueur
        dureeCri: 0.5,             // le « ! » au-dessus de sa tête : le temps de réagir
        dureeSprint: 1.0,
        dureeEssoufflement: 1.6,
        recharge: 2.5              // délai avant de pouvoir recharger
    },

    // L'Anti-émeute (normal et hardcore) : 3 PV, mais il ne perd qu'un PV par tir
    // quelle que soit l'arme (salve de pompe, grenade…) et la foudre s'arrête sur lui.
    // 1er tir : bouclier fendu ; 2e : bouclier brisé, il fonce ; 3e : mort.
    emeute: {
        taille: 64,
        points: 35,
        pv: 3,
        vitesseMin: { normal: 42, hardcore: 46 },
        vitesseAleatoire: 10,
        vitesseSansBouclier: { normal: 95, hardcore: 115 },
        dureeImage: 0.1,           // 12 images par pas (emeute_sprite.js)
        intervalle: { normal: 18, hardcore: 40 },   // en hardcore il bouche une ligne : plus rare
        premiereApparition: { normal: 40, hardcore: 180 }
    },

    // Boss « Le Mastodonte » : arrive toutes les 3 minutes, plus résistant à chaque fois.
    // Pendant le combat, les apparitions normales sont suspendues (il invoque ses propres zombies).
    boss: {
        nom: 'LE MASTODONTE',
        intervalle: 180,
        taille: 128,
        // Plafonné : même le Soldat (2 dégâts/s) doit pouvoir le tuer pendant sa traversée
        pvBase: 24,
        pvParBoss: 4,
        pvMax: 36,
        vitesse: 20,
        dureeImage: 0.15,         // 8 images par pas (boss_sprite.js)
        points: 500,
        // Équilibré par simulation : les 3 persos battent tous les boss sur 45 min
        delaiCrachat: 3.5,        // crache de l'acide sur la ligne du joueur
        annonceCrachat: 0.6,      // il gonfle et rougit avant de cracher
        vitesseCrachat: 240,
        delaiInvocation: 8,
        degatsSiPasse: 3          // vies perdues s'il traverse l'écran
    },

    // Les sprites ont des bords transparents : on réduit la hitbox pour
    // que les collisions correspondent à ce que le joueur voit.
    reductionHitbox: 12,

    // Évite un "saut" énorme après un changement d'onglet ou un lag
    dtMax: 0.05
};
