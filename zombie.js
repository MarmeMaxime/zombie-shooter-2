const animZombie = [
    new Image(), new Image(), new Image(), new Image(), new Image(), new Image()
];
const sources = [
    './assets/zombie_marche.png', './assets/zombie_marche2.png',
    './assets/zombie_marche3.png', './assets/zombie_marche4.png',
    './assets/zombie_marche5.png', './assets/zombie_marche6.png'
];
animZombie.forEach((img, i) => img.src = sources[i]);

const animZombieTank = [
    new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), 
    new Image(), new Image(), new Image(), new Image(), new Image(), new Image()
];
const sourcesTank = [
    './assets/marche_tank1.png', './assets/marche_tank2.png',
    './assets/marche_tank3.png', './assets/marche_tank4.png',
    './assets/marche_tank5.png', './assets/marche_tank6.png',
    './assets/marche_tank7.png', './assets/marche_tank8.png',
    './assets/marche_tank9.png', './assets/marche_tank10.png',
    './assets/marche_tank11.png', './assets/marche_tank12.png'
];
animZombieTank.forEach((img, i) => img.src = sourcesTank[i]);

let zombies = []; 
let zombiesTank = []; 
let spawnTimer = 0;
let spawnTimerTank = 0; 
let currentDifficulty = 'normal'; 

function reset_zombies(mode) {
    zombies = [];
    zombiesTank = [];
    spawnTimer = 0;
    spawnTimerTank = 0;
    currentDifficulty = mode;
}

function update_zombies(ctx, canvasWidth, canvasHeight) {
    spawnTimer++;
    const frequence = 150;

    if (spawnTimer > frequence) {
        spawnTimer = 0;
        zombies.push({
            x: canvasWidth, 
            y: Math.random() * (canvasHeight - 100) + 20, 
            vitesse: (currentDifficulty === 'hardcore') ? (Math.random() + 3) : (Math.random() + 2), 
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

        ctx.drawImage(animZombie[z.animStep], z.x, z.y, z.largeur, z.hauteur);

        if (z.x + z.largeur < 0) {
            zombies.splice(i, 1); 
            perdre_vie();         
        }
    }
}

function update_zombies_tank(ctx, canvasWidth, canvasHeight) {
    spawnTimerTank++;
    const frequenceTank =  800;

    if (spawnTimerTank > frequenceTank) {
        spawnTimerTank = 0;
        zombiesTank.push({
            x: canvasWidth, 
            y: Math.random() * (canvasHeight - 100) + 20, 
            vitesse: (Math.random() * 0.5 + 0.5), 
            largeur: 64,
            hauteur: 64,
            frameTimer: 0,
            frameInterval: 12, 
            animStep: 0,
            pv: 3 
        });
    }

    for (let i = zombiesTank.length - 1; i >= 0; i--) {
        let z = zombiesTank[i];
        z.x -= z.vitesse;

        z.frameTimer++;
        if (z.frameTimer >= z.frameInterval) {
            z.frameTimer = 0;
            z.animStep = (z.animStep + 1) % 12; 
        }

        ctx.drawImage(animZombieTank[z.animStep], z.x, z.y, z.largeur, z.hauteur);

        if (z.x + z.largeur < 0) {
            zombiesTank.splice(i, 1); 
            perdre_vie();         
        }
    }
}