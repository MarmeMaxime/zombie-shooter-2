/* CHARGEMENT DES ASSETS DU JOUEUR */
const img_joueur_arret = new Image();
img_joueur_arret.src = './assets/joueur_arrêt.png';

const img_marche1 = new Image(); img_marche1.src = './assets/joueur_marche1.png';
const img_marche2 = new Image(); img_marche2.src = './assets/joueur_marche2.png';
const img_marche3 = new Image(); img_marche3.src = './assets/joueur_marche3.png';
const img_marche4 = new Image(); img_marche4.src = './assets/joueur_marche4.png';

// Séquence d'animation
const animMarche = [img_marche1, img_marche2, img_marche3, img_marche4];

const img_joueur_tir = new Image();
img_joueur_tir.src = './assets/joueur_tir.png';


/* OBJET JOUEUR */
const joueur = {
    x: 50,
    y: 200,
    vitesse: 2.5, 
    largeur: 64,
    hauteur: 64,
    
    // Animation
    frameTimer: 0,
    frameInterval: 16, 
    marcheStep: 0,
    
    // Tir
    estEnTrainDeTirer: false, 
    timerTir: 0,              
    peutTirer: true,          
    
    imgActuelle: img_joueur_arret
};

// Inputs Clavier
const touches = {
    haut: false,
    bas: false
};


function setPlayerSpeed(mode) {
    if (mode === 'hardcore') {
        joueur.vitesse = 2; 
    } else {
        // En normal, il est agile
        joueur.vitesse = 2.5; 
    }
}

/* GESTION DES ENTRÉES (LISTENERS) */
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') touches.haut = true;
    if (e.key === 'ArrowDown') touches.bas = true;
    
    // GESTION DU TIR
    if (e.code === 'Space') {
        if (joueur.peutTirer && !joueur.estEnTrainDeTirer) {
            joueur.estEnTrainDeTirer = true;
            joueur.timerTir = 60; 
            joueur.peutTirer = false; 
            if (typeof executerTir === "function") {
                executerTir();
            }
        }
    }

    // NOUVEAU : GESTION ACHAT VIE (TOUCHE B)
    if (e.key === 'b' || e.key === 'B') {
        // On appelle la fonction définie dans main.js
        if (typeof acheterVie === "function") {
            acheterVie();
        }
    }
});

/* ... (Suite du fichier identique) ... */

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') touches.haut = false;
    if (e.key === 'ArrowDown') touches.bas = false;
    
    if (e.code === 'Space') {
        joueur.peutTirer = true;
    }
});

// On passe la hauteur du canvas en paramètre pour gérer les limites
function updateJoueur(canvasHeight) {
    
    // A. Timer Tir
    if (joueur.estEnTrainDeTirer) {
        joueur.timerTir--; 
        if (joueur.timerTir <= 0) {
            joueur.estEnTrainDeTirer = false;
        }
    }

    // B. Déplacement
    let bouge = false;
    if (touches.haut) {
        joueur.y -= joueur.vitesse;
        bouge = true;
    }
    if (touches.bas) {
        joueur.y += joueur.vitesse;
        bouge = true;
    }

    // C. Limites (Clamping)
    if (joueur.y < 20) joueur.y = 20; 
    if (joueur.y > canvasHeight - 80) joueur.y = canvasHeight - 80;

    // D. Choix de l'image (Tir > Marche > Arrêt)
    if (joueur.estEnTrainDeTirer) {
        joueur.imgActuelle = img_joueur_tir;
    }
    else if (bouge) {
        joueur.frameTimer++;
        if (joueur.frameTimer >= joueur.frameInterval) {
            joueur.frameTimer = 0;
            joueur.marcheStep = (joueur.marcheStep + 1) % 4; 
            joueur.imgActuelle = animMarche[joueur.marcheStep];
        }
    }
    else {
        joueur.imgActuelle = img_joueur_arret;
        joueur.frameTimer = 0;
    }
}



/* FONCTION DE DESSIN (DRAW) */

function drawJoueur(ctx) {
    ctx.drawImage(joueur.imgActuelle, joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
}