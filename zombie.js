/* =========================================================================
   1. CHARGEMENT DES ASSETS ZOMBIE
   ========================================================================= */
const img_zombie1 = new Image(); img_zombie1.src = './assets/zombie_marche.png';
const img_zombie2 = new Image(); img_zombie2.src = './assets/zombie_marche2.png';
const img_zombie3 = new Image(); img_zombie3.src = './assets/zombie_marche3.png';
const img_zombie4 = new Image(); img_zombie4.src = './assets/zombie_marche4.png';
const img_zombie5 = new Image(); img_zombie5.src = './assets/zombie_marche5.png';
const img_zombie6 = new Image(); img_zombie6.src = './assets/zombie_marche6.png';
const animZombie = [img_zombie1, img_zombie2, img_zombie3, img_zombie4, img_zombie5, img_zombie6];


/* =========================================================================
   2. GESTION DES ZOMBIES
   ========================================================================= */
let zombies = []; 
let spawnTimer = 0;
let currentDifficulty = 'normal'; 


function resetZombies(mode) {
    zombies = [];
    spawnTimer = 0;
    currentDifficulty = mode;
}

function updateZombies(ctx, canvasWidth, canvasHeight) {
    spawnTimer++;
    let frequenceApparition =  100;

    if (spawnTimer > frequenceApparition) {
        spawnTimer = 0;
        zombies.push({
            x: canvasWidth, 
            y: Math.random() * (canvasHeight - 100) + 20, 
            vitesse: (currentDifficulty === 'hardcore') ? (Math.random() * 1 + 3) : (Math.random() * 1 + 2), 
            largeur: 64,
            hauteur: 64,

            frameTimer: 0,
            frameInterval: 16,
            animStep: 0
        });
    }

    for (let i = zombies.length - 1; i >= 0; i--) {
        let z = zombies[i];

        z.x -= z.vitesse;

        z.frameTimer++;
        if (z.frameTimer >= z.frameInterval) {
            z.frameTimer = 0;
            z.animStep = (z.animStep + 1) % 6; 
        }

        let imgActuelle = animZombie[z.animStep];
        ctx.drawImage(imgActuelle, z.x, z.y, z.largeur, z.hauteur);


        if (z.x + z.largeur < 0) {
            zombies.splice(i, 1); 
            perdreVie();         
        }
    }
}