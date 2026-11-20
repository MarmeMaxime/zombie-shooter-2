/* =========================================================================
   ZOMBIES (normaux et tanks dans une seule liste)
   ========================================================================= */
const TYPES_ZOMBIE = {
    normal: {
        config: CONFIG.zombie,
        images: [1, 2, 3, 4, 5, 6].map(n =>
            chargerImage(n === 1 ? './assets/zombie_marche.png' : `./assets/zombie_marche${n}.png`))
    },
    tank: {
        config: CONFIG.tank,
        images: Array.from({ length: 12 }, (_, i) => chargerImage(`./assets/marche_tank${i + 1}.png`))
    }
};

let zombies = [];
let difficulte = 'normal';
let chronoZombie = 0;
let chronoTank = 0;

function reset_zombies(mode) {
    zombies = [];
    difficulte = mode;
    chronoZombie = 0;
    chronoTank = 0;
}

/* ---------- Collisions ---------- */
function collision(a, b) {
    return a.x < b.x + b.largeur && a.x + a.largeur > b.x &&
           a.y < b.y + b.hauteur && a.y + a.hauteur > b.y;
}

function hitbox(x, y, taille) {
    const r = CONFIG.reductionHitbox;
    return { x: x + r, y: y + r, largeur: taille - 2 * r, hauteur: taille - 2 * r };
}

const hitbox_zombie = z => hitbox(z.x, z.y, z.taille);

// Zombie touché le plus proche du joueur (le plus à gauche)
function trouver_cible(zone) {
    let cible = null;
    for (const z of zombies) {
        if (collision(zone, hitbox_zombie(z)) && (!cible || z.x < cible.x)) cible = z;
    }
    return cible;
}

/* ---------- Apparition ---------- */
function creer_zombie(type, largeurCanvas, hauteurCanvas) {
    const cfg = TYPES_ZOMBIE[type].config;
    const vitesseMin = typeof cfg.vitesseMin === 'object' ? cfg.vitesseMin[difficulte] : cfg.vitesseMin;
    const yMin = CONFIG.margeHaut;
    const yMax = hauteurCanvas - CONFIG.margeBas;

    zombies.push({
        type,
        x: largeurCanvas,
        y: yMin + Math.random() * (yMax - yMin),
        taille: cfg.taille,
        vitesse: vitesseMin + Math.random() * cfg.vitesseAleatoire,
        pv: cfg.pv || 1,
        pvMax: cfg.pv || 1,
        tempsImage: 0,
        etape: 0
    });
}

function intervalle_zombie(tempsJeu) {
    const z = CONFIG.zombie;
    return Math.max(z.intervalleMin, z.intervalleDepart - tempsJeu * z.accelerationParSeconde);
}

/* ---------- Dégâts ---------- */
function toucher_zombie(z) {
    z.pv--;
    if (z.pv > 0) return;
    zombies.splice(zombies.indexOf(z), 1);
    ajouter_score(TYPES_ZOMBIE[z.type].config.points);
}

/* ---------- Mise à jour ---------- */
function update_zombies(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    chronoZombie += dt;
    if (chronoZombie >= intervalle_zombie(tempsJeu)) {
        chronoZombie = 0;
        creer_zombie('normal', largeurCanvas, hauteurCanvas);
    }

    chronoTank += dt;
    if (chronoTank >= CONFIG.tank.intervalle) {
        chronoTank = 0;
        creer_zombie('tank', largeurCanvas, hauteurCanvas);
    }

    const zoneJoueur = hitbox(joueur.x, joueur.y, joueur.taille);

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        const type = TYPES_ZOMBIE[z.type];
        z.x -= z.vitesse * dt;

        z.tempsImage += dt;
        if (z.tempsImage >= type.config.dureeImage) {
            z.tempsImage -= type.config.dureeImage;
            z.etape = (z.etape + 1) % type.images.length;
        }

        // Un zombie qui atteint le joueur ou qui sort de l'écran coûte une vie
        if (collision(zoneJoueur, hitbox_zombie(z)) || z.x + z.taille < 0) {
            zombies.splice(i, 1);
            perdre_vie();
        }
    }
}

function draw_zombies(ctx) {
    for (const z of zombies) {
        ctx.drawImage(TYPES_ZOMBIE[z.type].images[z.etape], z.x, z.y, z.taille, z.taille);

        // Barre de vie des tanks blessés
        if (z.pv < z.pvMax) {
            const largeur = z.taille - 16;
            ctx.fillStyle = '#400';
            ctx.fillRect(z.x + 8, z.y - 6, largeur, 4);
            ctx.fillStyle = '#f33';
            ctx.fillRect(z.x + 8, z.y - 6, largeur * z.pv / z.pvMax, 4);
        }
    }
}
