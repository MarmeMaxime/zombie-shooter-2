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
        delaiEntreTirs: 0.5,      // cadence de tir
        dureeAnimTir: 0.3,        // durée d'affichage du sprite de tir
        dureeImageMarche: 0.27
    },

    balle: {
        vitesse: 1200,
        largeur: 25,
        hauteur: 10,
        decalageX: 50,            // position du canon par rapport au joueur
        decalageY: 28
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

    // Les sprites ont des bords transparents : on réduit la hitbox pour
    // que les collisions correspondent à ce que le joueur voit.
    reductionHitbox: 12,

    // Évite un "saut" énorme après un changement d'onglet ou un lag
    dtMax: 0.05
};
