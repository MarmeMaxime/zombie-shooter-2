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
    personnages: {
        soldat: {
            nom: 'Soldat',
            arme: 'fusil',
            description: 'Balle rapide à longue portée. Une balle, une cible : il faut bien viser.'
        },
        brute: {
            nom: 'Brutus',
            arme: 'pompe',
            sprites: 'brute',
            description: '5 plombs en éventail : pas besoin de viser juste, mais portée limitée.'
        },
        grenadier: {
            nom: 'Mira',
            arme: 'grenade',
            sprites: 'grenadier',
            description: 'Explose au contact et blesse tout autour. Idéal contre les groupes.'
        }
    },

    armes: {
        fusil: { nom: 'Fusil', delai: 0.5, vitesse: 1200, degats: 1 },
        // Équilibrées par simulation : les 3 armes tiennent indéfiniment dans les 2 modes
        pompe: { nom: 'Fusil à pompe', delai: 0.7, vitesse: 900, degats: 1, plombs: 5, ecartDegres: 10, portee: 460 },
        grenade: { nom: 'Lance-grenades', delai: 0.7, vitesse: 750, degats: 2, rayon: 95, portee: 650 }
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
        dureeImage: 0.3,
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
