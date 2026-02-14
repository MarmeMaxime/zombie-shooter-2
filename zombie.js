/* =========================================================================
   1. CHARGEMENT DES ASSETS ZOMBIE
   Attention : tes fichiers sont nommés zombie_marche.png, puis zombie_marche2.png...
   ========================================================================= */
const img_zombie1 = new Image(); img_zombie1.src = './assets/zombie_marche.png';
const img_zombie2 = new Image(); img_zombie2.src = './assets/zombie_marche2.png';
const img_zombie3 = new Image(); img_zombie3.src = './assets/zombie_marche3.png';
const img_zombie4 = new Image(); img_zombie4.src = './assets/zombie_marche4.png';
const img_zombie5 = new Image(); img_zombie5.src = './assets/zombie_marche5.png';
const img_zombie6 = new Image(); img_zombie6.src = './assets/zombie_marche6.png';

// Séquence d'animation (6 frames)
const animZombie = [img_zombie1, img_zombie2, img_zombie3, img_zombie4, img_zombie5, img_zombie6];


/* =========================================================================
   2. GESTION DES ZOMBIES
   ========================================================================= */
let zombies = []; // Liste des zombies présents à l'écran
let spawnTimer = 0;
let currentDifficulty = 'normal'; 

// Fonction appelée au début d'une partie pour tout nettoyer
function resetZombies(mode) {
    zombies = [];
    spawnTimer = 0;
    currentDifficulty = mode;
}

// Fonction principale appelée 60 fois par seconde par le main.js
function updateZombies(ctx, canvasWidth, canvasHeight) {
    
    // A. APPARITION (SPAWN)
    spawnTimer++;
    
    // Vitesse d'apparition : Plus rapide en hardcore
    // Normal : ~1.6 secondes (100 frames) | Hardcore : ~0.8 seconde (50 frames)
    let frequenceApparition =  100;
    
    if (spawnTimer > frequenceApparition) {
        spawnTimer = 0;
        
        // Création d'un nouveau zombie
        zombies.push({
            x: canvasWidth, // Apparait tout à droite (hors écran)
            y: Math.random() * (canvasHeight - 100) + 20, // Position Y aléatoire sur la route
            vitesse: (currentDifficulty === 'hardcore') ? (Math.random() * 1 + 3) : (Math.random() * 1 + 2), // Vitesse variable
            largeur: 64,
            hauteur: 64,
            
            // Animation
            frameTimer: 0,
            frameInterval: 16,
            animStep: 0
        });
    }

    // B. MISE À JOUR ET DESSIN
    // On parcourt le tableau à l'envers (i--) pour pouvoir supprimer des éléments sans casser la boucle
    for (let i = zombies.length - 1; i >= 0; i--) {
        let z = zombies[i];

        // 1. Déplacement vers la gauche
        z.x -= z.vitesse;

        // 2. Animation
        z.frameTimer++;
        if (z.frameTimer >= z.frameInterval) {
            z.frameTimer = 0;
            z.animStep = (z.animStep + 1) % 6; // Boucle sur les 6 images
        }

        // 3. Dessin
        let imgActuelle = animZombie[z.animStep];
        ctx.drawImage(imgActuelle, z.x, z.y, z.largeur, z.hauteur);

        // 4. Vérification Sortie d'écran (CONDITION DE DÉFAITE)
        // Si le côté droit du zombie (x + largeur) dépasse le côté gauche de l'écran (0)
        if (z.x + z.largeur < 0) {
            zombies.splice(i, 1); 
            perdreVie();         
        }
    }
}