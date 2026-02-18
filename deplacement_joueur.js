/* =========================================================================
   ASSETS JOUEUR
   ========================================================================= */
const img_joueur_arret = new Image(); img_joueur_arret.src = './assets/joueur_arrêt.png';
const img_joueur_tir = new Image();   img_joueur_tir.src = './assets/joueur_tir.png';

const animMarche = [
    new Image(), new Image(), new Image(), new Image()
];
animMarche[0].src = './assets/joueur_marche1.png';
animMarche[1].src = './assets/joueur_marche2.png';
animMarche[2].src = './assets/joueur_marche3.png';
animMarche[3].src = './assets/joueur_marche4.png';

/* =========================================================================
   OBJET JOUEUR & ÉTAT
   ========================================================================= */
const joueur = {
    x: 50,
    y: 200,
    vitesse: 2.5, 
    largeur: 64,
    hauteur: 64,
    
    frameTimer: 0,
    frameInterval: 16, 
    marcheStep: 0,
    
    estEnTrainDeTirer: false, 
    timerTir: 0,              
    peutTirer: true,          
    
    imgActuelle: img_joueur_arret
};

const touches = { haut: false, bas: false };

function setPlayerSpeed(mode) {
    joueur.vitesse = (mode === 'hardcore') ? 2 : 2.5;
}

// INTÉGRATION DU TIMESCALE
function updateJoueur(canvasHeight, timeScale = 1) {
    // Timer Animation Tir
    if (joueur.estEnTrainDeTirer) {
        joueur.timerTir -= timeScale; 
        if (joueur.timerTir <= 0) joueur.estEnTrainDeTirer = false;
    }

    // Déplacement compensé par le temps
    let bouge = false;
    if (touches.haut) { joueur.y -= (joueur.vitesse * timeScale); bouge = true; }
    if (touches.bas)  { joueur.y += (joueur.vitesse * timeScale); bouge = true; }

    // Limites écran
    if (joueur.y < 20) joueur.y = 20; 
    if (joueur.y > canvasHeight - 80) joueur.y = canvasHeight - 80;

    // Gestion de l'image
    if (joueur.estEnTrainDeTirer) {
        joueur.imgActuelle = img_joueur_tir;
    } else if (bouge) {
        joueur.frameTimer += timeScale; 
        if (joueur.frameTimer >= joueur.frameInterval) {
            joueur.frameTimer -= joueur.frameInterval;
            joueur.marcheStep = (joueur.marcheStep + 1) % 4; 
            joueur.imgActuelle = animMarche[joueur.marcheStep];
        }
    } else {
        joueur.imgActuelle = img_joueur_arret;
        joueur.frameTimer = 0;
    }
}

function drawJoueur(ctx) {
    ctx.drawImage(joueur.imgActuelle, joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
}

/* =========================================================================
   INPUTS
   ========================================================================= */
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') touches.haut = true;
    if (e.key === 'ArrowDown') touches.bas = true;
    
    if (e.code === 'Space') {
        if (joueur.peutTirer && !joueur.estEnTrainDeTirer) {
            joueur.estEnTrainDeTirer = true;
            joueur.timerTir = 60; 
            joueur.peutTirer = false; 
            if (typeof executerTir === "function") executerTir();
        }
    }

    if ((e.key === 'v' || e.key === 'V') && typeof acheterVie === "function") {
        acheterVie();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') touches.haut = false;
    if (e.key === 'ArrowDown') touches.bas = false;
    if (e.code === 'Space') joueur.peutTirer = true;
});