/* =========================================================================
   ZOMBIES : normaux, tanks et magical girls dans une seule liste
   ========================================================================= */
const imagesNumerotees = (prefixe, nombre) =>
    Array.from({ length: nombre }, (_, i) => chargerImage(`./assets/${prefixe}${i + 1}.png`));

const TYPES_ZOMBIE = {
    normal: {
        config: CONFIG.zombie,
        images: [1, 2, 3, 4, 5, 6].map(n =>
            chargerImage(n === 1 ? './assets/zombie_marche.png' : `./assets/zombie_marche${n}.png`))
    },
    tank: {
        config: CONFIG.tank,
        images: imagesNumerotees('marche_tank', 12)
    },
    magicalgirl: {
        config: CONFIG.magicalgirl,
        images: imagesNumerotees('marche_magicalgirl', 12)
    }
};

let zombies = [];
let effets = [];        // étincelles de téléportation
let difficulte = 'normal';
const chronos = {};     // temps écoulé depuis la dernière apparition, par type

function reset_zombies(mode) {
    zombies = [];
    effets = [];
    difficulte = mode;
    for (const type in TYPES_ZOMBIE) chronos[type] = 0;
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
const parMode = valeur => (typeof valeur === 'object' ? valeur[difficulte] : valeur);

function y_aleatoire(hauteurCanvas) {
    const yMin = CONFIG.margeHaut;
    const yMax = hauteurCanvas - CONFIG.margeBas;
    return yMin + Math.random() * (yMax - yMin);
}

function creer_zombie(type, largeurCanvas, hauteurCanvas) {
    const cfg = TYPES_ZOMBIE[type].config;
    const z = {
        type,
        x: largeurCanvas,
        y: y_aleatoire(hauteurCanvas),
        taille: cfg.taille,
        vitesse: parMode(cfg.vitesseMin) + Math.random() * cfg.vitesseAleatoire,
        pv: cfg.pv || 1,
        pvMax: cfg.pv || 1,
        tempsImage: 0,
        etape: 0
    };
    if (cfg.delaiTeleport) z.teleport = { chrono: cfg.delaiTeleport, annonce: false, y: z.y };
    zombies.push(z);
}

function intervalle_apparition(type, tempsJeu) {
    const cfg = TYPES_ZOMBIE[type].config;
    if (type !== 'normal') return cfg.intervalle;
    return Math.max(parMode(cfg.intervalleMin), cfg.intervalleDepart - tempsJeu * cfg.accelerationParSeconde);
}

function gerer_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    for (const type in TYPES_ZOMBIE) {
        const cfg = TYPES_ZOMBIE[type].config;
        if (cfg.modes && !cfg.modes.includes(difficulte)) continue;
        if (tempsJeu < (cfg.premiereApparition || 0)) continue;

        chronos[type] += dt;
        if (chronos[type] >= intervalle_apparition(type, tempsJeu)) {
            chronos[type] = 0;
            creer_zombie(type, largeurCanvas, hauteurCanvas);
        }
    }
}

/* ---------- Téléportation (magical girl) ---------- */
function gerer_teleport(z, dt, hauteurCanvas) {
    const cfg = TYPES_ZOMBIE[z.type].config;
    const t = z.teleport;

    // Trop proche du joueur : elle arrête de se téléporter (sinon ce serait injuste)
    if (z.x < cfg.xMinTeleport) {
        t.annonce = false;
        return;
    }

    t.chrono -= dt;

    // Annonce : on choisit la destination et on affiche le cercle magique
    if (!t.annonce && t.chrono <= cfg.dureeAnnonce) {
        do { t.y = y_aleatoire(hauteurCanvas); } while (Math.abs(t.y - z.y) < cfg.distanceTeleportMin);
        t.annonce = true;
    }

    if (t.chrono <= 0) {
        ajouter_effet(z.x, z.y);
        z.y = t.y;
        ajouter_effet(z.x, z.y);
        t.annonce = false;
        t.chrono = cfg.delaiTeleport;
    }
}

function ajouter_effet(x, y) {
    effets.push({ x: x + 32, y: y + 32, age: 0 });
}

/* ---------- Dégâts ---------- */
function toucher_zombie(z, degats = 1) {
    z.pv -= degats;
    if (z.pv > 0) return;
    zombies.splice(zombies.indexOf(z), 1);
    ajouter_score(TYPES_ZOMBIE[z.type].config.points);
}

/* ---------- Mise à jour ---------- */
function update_zombies(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    gerer_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu);

    const zoneJoueur = hitbox(joueur.x, joueur.y, joueur.taille);

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        const type = TYPES_ZOMBIE[z.type];
        z.x -= z.vitesse * dt;
        if (z.teleport) gerer_teleport(z, dt, hauteurCanvas);

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

    for (const e of effets) e.age += dt;
    effets = effets.filter(e => e.age < 0.35);
}

/* ---------- Dessin ---------- */
function dessiner_etoile(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.3, y - r * 0.3);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r * 0.3, y + r * 0.3);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.3, y + r * 0.3);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x - r * 0.3, y - r * 0.3);
    ctx.closePath();
    ctx.fill();
}

// Cercle magique à l'endroit où la magical girl va apparaître
function dessiner_annonce(ctx, z) {
    const cfg = TYPES_ZOMBIE[z.type].config;
    const progression = 1 - Math.max(0, z.teleport.chrono) / cfg.dureeAnnonce; // 0 -> 1
    const cx = z.x + z.taille / 2;
    const cy = z.teleport.y + z.taille - 6;

    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * progression;
    ctx.fillStyle = 'rgba(255, 110, 199, 0.35)';
    ctx.strokeStyle = '#ff6ec7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe14d';
    for (let k = 0; k < 4; k++) {
        const angle = progression * Math.PI * 2 + k * Math.PI / 2;
        dessiner_etoile(ctx, cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 9 - 6, 5);
    }
    ctx.restore();
}

function dessiner_effets(ctx) {
    ctx.save();
    ctx.fillStyle = '#ff9ad5';
    for (const e of effets) {
        const r = 6 + e.age * 80;
        ctx.globalAlpha = 1 - e.age / 0.35;
        for (let k = 0; k < 6; k++) {
            const angle = k * Math.PI / 3;
            dessiner_etoile(ctx, e.x + Math.cos(angle) * r, e.y + Math.sin(angle) * r, 4);
        }
    }
    ctx.restore();
}

function draw_zombies(ctx) {
    for (const z of zombies) {
        if (z.teleport && z.teleport.annonce) dessiner_annonce(ctx, z);

        ctx.drawImage(TYPES_ZOMBIE[z.type].images[z.etape], z.x, z.y, z.taille, z.taille);

        // Barre de vie des zombies blessés
        if (z.pv < z.pvMax) {
            const largeur = z.taille - 16;
            ctx.fillStyle = '#400';
            ctx.fillRect(z.x + 8, z.y - 6, largeur, 4);
            ctx.fillStyle = '#f33';
            ctx.fillRect(z.x + 8, z.y - 6, largeur * z.pv / z.pvMax, 4);
        }
    }
    dessiner_effets(ctx);
}
