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

const touches = { haut: false, bas: false };

/* =========================================================================
   LOGIQUE
   ========================================================================= */
function set_player_speed(mode) {
    joueur.vitesse = (mode === 'hardcore') ? 1.7 : 2;
}

// Mise à jour frame par frame
function update_joueur(canvasHeight) {
    if (joueur.estEnTrainDeTirer) {
        joueur.timerTir--; 
        if (joueur.timerTir <= 0) joueur.estEnTrainDeTirer = false;
    }

    // Déplacement
    let bouge = false;
    if (touches.haut) { joueur.y -= joueur.vitesse; bouge = true; }
    if (touches.bas)  { joueur.y += joueur.vitesse; bouge = true; }

    // Limites écran
    if (joueur.y < 20) joueur.y = 20; 
    if (joueur.y > canvasHeight - 80) joueur.y = canvasHeight - 80;

    // Gestion de l'image
    if (joueur.estEnTrainDeTirer) {
        joueur.imgActuelle = img_joueur_tir;
    } else if (bouge) {
        joueur.frameTimer++;
        if (joueur.frameTimer >= joueur.frameInterval) {
            joueur.frameTimer = 0;
            joueur.marcheStep = (joueur.marcheStep + 1) % 4; 
            joueur.imgActuelle = animMarche[joueur.marcheStep];
        }
    } else {
        joueur.imgActuelle = img_joueur_arret;
        joueur.frameTimer = 0;
    }
}

function draw_joueur(ctx) {
    ctx.drawImage(joueur.imgActuelle, joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
}

/* =========================================================================
   INPUTS
   ========================================================================= */
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') touches.haut = true;
    if (e.key === 'ArrowDown') touches.bas = true;
    
    // Tir
    if (e.code === 'Space') {
        if (joueur.peutTirer && !joueur.estEnTrainDeTirer) {
            joueur.estEnTrainDeTirer = true;
            joueur.timerTir = 60; 
            joueur.peutTirer = false; 
            executer_tir(); 
        }
    }

    // Achat Vie (V)
    if (e.key === 'v' || e.key === 'V') {
        acheter_vie();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') touches.haut = false;
    if (e.key === 'ArrowDown') touches.bas = false;
    if (e.code === 'Space') joueur.peutTirer = true;
});


/* =========================================================================
   COMMANDES TACTILES (ÉCRANS MOBILES)
   ========================================================================= */
const btn_touch_up = document.getElementById('btn-touch-up');
const btn_touch_down = document.getElementById('btn-touch-down');
const btn_touch_shoot = document.getElementById('btn-touch-shoot');
const btn_touch_buy = document.getElementById('btn-touch-buy');

function lier_bouton_tactile(bouton, actionAppui, actionRelache) {
    if (!bouton) return;
    
    bouton.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        actionAppui(); 
    }, { passive: false });
    
    bouton.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        actionRelache(); 
    }, { passive: false });

    bouton.addEventListener('touchcancel', (e) => { 
        e.preventDefault(); 
        actionRelache(); 
    }, { passive: false });
}

// déplacement
lier_bouton_tactile(btn_touch_up, 
    () => touches.haut = true, 
    () => touches.haut = false
);

lier_bouton_tactile(btn_touch_down, 
    () => touches.bas = true, 
    () => touches.bas = false
);

// tir
lier_bouton_tactile(btn_touch_shoot, 
    () => {
        if (joueur.peutTirer && !joueur.estEnTrainDeTirer) {
            joueur.estEnTrainDeTirer = true;
            joueur.timerTir = 60; 
            joueur.peutTirer = false; 
            executer_tir(); 
        }
    }, 
    () => { joueur.peutTirer = true; }
);

// achat de vie
if (btn_touch_buy) {
    btn_touch_buy.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        acheter_vie(); 
    }, { passive: false });
}