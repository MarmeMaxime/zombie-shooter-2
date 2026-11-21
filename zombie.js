/* =========================================================================
   ZOMBIES : normaux, tanks, magical girls, joggeurs (et le boss) dans une
   seule liste
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
    },
    // Sprite dessiné dans joggeur_sprite.js (marche, course, essoufflé)
    joggeur: {
        config: CONFIG.joggeur,
        images: SPRITES_JOGGEUR.marche
    }
};

let zombies = [];
let effets = [];        // étincelles de téléportation
let difficulte = 'normal';
const chronos = {};     // temps écoulé depuis la dernière apparition, par type

function reset_zombies(mode) {
    zombies = [];
    effets = [];
    cadavres = [];
    reset_boss();
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
    if (type === 'joggeur') z.joggeur = { etat: 'marche', chrono: 0, recharge: 0 };
    zombies.push(z);
}

function intervalle_apparition(type, tempsJeu) {
    const cfg = TYPES_ZOMBIE[type].config;
    if (type !== 'normal') return cfg.intervalle;
    return Math.max(parMode(cfg.intervalleMin), cfg.intervalleDepart - tempsJeu * cfg.accelerationParSeconde);
}

function gerer_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    for (const type in TYPES_ZOMBIE) {
        if (type === 'boss') continue;   // le boss a sa propre logique
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

/* ---------- Boss : Le Mastodonte ---------- */
// Sprite dessiné en pixel art dans boss_sprite.js (marche sur 4 images + gueule ouverte)
TYPES_ZOMBIE.boss = {
    config: CONFIG.boss,
    images: SPRITES_BOSS.marche,
    imagesCharge: SPRITES_BOSS.charge
};

let boss = null;
let prochainBoss = CONFIG.boss.intervalle;
let bossApparus = 0;
let crachats = [];
const ui_boss = { barre: document.getElementById('boss-barre'), vie: document.getElementById('boss-vie') };

function reset_boss() {
    boss = null;
    prochainBoss = CONFIG.boss.intervalle;
    bossApparus = 0;
    crachats = [];
    ui_boss.barre.classList.add('hidden');
}

function faire_apparaitre_boss(largeurCanvas, hauteurCanvas) {
    const cfg = CONFIG.boss;
    const pv = Math.min(cfg.pvMax, cfg.pvBase + cfg.pvParBoss * bossApparus);
    bossApparus++;
    boss = {
        type: 'boss', x: largeurCanvas, y: (hauteurCanvas - cfg.taille) / 2, taille: cfg.taille,
        vitesse: cfg.vitesse, pv, pvMax: pv, tempsImage: 0, etape: 0,
        chronoCrachat: cfg.delaiCrachat, chronoInvocation: cfg.delaiInvocation / 2, charge: false
    };
    zombies.push(boss);
    ui_boss.barre.classList.remove('hidden');
    Son.effet('bossArrive');
    secouer_ecran(2);
}

function fin_boss() {
    boss = null;
    prochainBoss = etat.temps + CONFIG.boss.intervalle;
    ui_boss.barre.classList.add('hidden');
}

// Même tremblement que celui des lootbox (lootbox.js)
const secouer_ecran = niveau => EffetsLoot.trembler(niveau);

function gerer_boss(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    if (!boss) {
        if (tempsJeu >= prochainBoss) faire_apparaitre_boss(largeurCanvas, hauteurCanvas);
        return;
    }
    const cfg = CONFIG.boss;
    ui_boss.vie.style.width = `${(100 * boss.pv) / boss.pvMax}%`;

    // Crachat d'acide sur la ligne où se trouve le joueur (annoncé : il rougit et gonfle)
    boss.chronoCrachat -= dt;
    boss.charge = boss.chronoCrachat <= cfg.annonceCrachat;
    if (boss.chronoCrachat <= 0) {
        boss.chronoCrachat = cfg.delaiCrachat;
        crachats.push({ x: boss.x + 10, y: joueur.y + joueur.taille / 2 - 8, taille: 16 });
        Son.effet('crachat');
    }

    // Invocation de deux zombies à ses côtés
    boss.chronoInvocation -= dt;
    if (boss.chronoInvocation <= 0) {
        boss.chronoInvocation = cfg.delaiInvocation;
        for (const decalage of [-40, boss.taille - 24]) {
            creer_zombie('normal', largeurCanvas, hauteurCanvas);
            const z = zombies[zombies.length - 1];
            z.x = boss.x + 30;
            z.y = Math.max(CONFIG.margeHaut, Math.min(hauteurCanvas - CONFIG.margeBas, boss.y + decalage));
        }
    }
}

function update_crachats(dt) {
    const zoneJoueur = hitbox(joueur.x, joueur.y, joueur.taille);
    crachats = crachats.filter(c => {
        c.x -= CONFIG.boss.vitesseCrachat * MONDE.echelleX * dt;
        if (collision(zoneJoueur, { x: c.x, y: c.y, largeur: c.taille, hauteur: c.taille })) {
            perdre_vie();
            return false;
        }
        return c.x + c.taille > 0;
    });
}

function draw_crachats(ctx) {
    for (const c of crachats) {
        ctx.fillStyle = '#7dff3a';
        ctx.strokeStyle = '#1f5a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(c.x + 8, c.y + 8, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(125, 255, 58, 0.4)';
        ctx.fillRect(c.x + 14, c.y + 5, 14, 6);   // traînée
    }
}

/* ---------- Charge du Joggeur ----------
   marche -> (aligné avec le joueur) cri -> course -> essoufflé -> marche */
function gerer_joggeur(z, dt) {
    const cfg = CONFIG.joggeur;
    const j = z.joggeur;
    j.recharge = Math.max(0, j.recharge - dt);
    j.chrono -= dt;

    if (j.etat === 'marche') {
        const aligne = Math.abs(z.y - joueur.y) < cfg.alignement;
        const loin = z.x - (joueur.x + joueur.taille) > cfg.distanceMin * MONDE.echelleX;
        if (aligne && loin && j.recharge === 0 && z.x < MONDE.largeur - 20) {
            j.etat = 'cri';
            j.chrono = cfg.dureeCri;
            Son.effet('cri');
        }
    } else if (j.chrono <= 0) {
        if (j.etat === 'cri') {
            j.etat = 'course';
            j.chrono = cfg.dureeSprint;
        } else if (j.etat === 'course') {
            // Fin du sprint sans avoir touché le joueur : charge esquivée
            j.etat = 'essouffle';
            j.chrono = cfg.dureeEssoufflement;
            if (typeof Succes !== 'undefined') Succes.compter('esquives');
        } else if (j.etat === 'essouffle') {
            j.etat = 'marche';
            j.recharge = cfg.recharge;
        }
    }
}

function vitesse_joggeur(z) {
    switch (z.joggeur.etat) {
        case 'course': return parMode(CONFIG.joggeur.vitesseSprint);
        case 'marche': return z.vitesse;
        default: return 0;   // il crie ou reprend son souffle : immobile
    }
}

function dessiner_joggeur(ctx, z) {
    const j = z.joggeur;
    const images = j.etat === 'course' ? SPRITES_JOGGEUR.course
        : j.etat === 'essouffle' ? SPRITES_JOGGEUR.essouffle : SPRITES_JOGGEUR.marche;
    const img = images[z.etape % images.length];

    if (j.etat === 'course') {
        // Traînée derrière lui (il fonce vers la gauche)
        ctx.save();
        for (const [decalage, alpha] of [[22, 0.15], [11, 0.3]]) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, z.x + decalage, z.y, z.taille, z.taille);
        }
        ctx.restore();
    }
    // Il tremble en criant
    const tremble = j.etat === 'cri' ? (Math.random() - 0.5) * 3 : 0;
    ctx.drawImage(img, z.x + tremble, z.y, z.taille, z.taille);

    if (j.etat === 'cri') {
        // Le « ! » d'alerte au-dessus de sa tête
        ctx.save();
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#ff3333';
        ctx.strokeText('!', z.x + 26, z.y - 2);
        ctx.fillText('!', z.x + 26, z.y - 2);
        ctx.restore();
    } else if (j.etat === 'essouffle') {
        // Petits nuages de souffle
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        const t = performance.now() / 300;
        for (let k = 0; k < 2; k++) {
            ctx.beginPath();
            ctx.arc(z.x + 10 - ((t + k * 0.5) % 1) * 12, z.y + 30 - k * 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

/* ---------- Téléportation (magical girl) ---------- */
function gerer_teleport(z, dt, hauteurCanvas) {
    const cfg = TYPES_ZOMBIE[z.type].config;
    const t = z.teleport;

    // Trop proche du joueur : elle arrête de se téléporter (sinon ce serait injuste)
    if (z.x < cfg.xMinTeleport * MONDE.echelleX) {
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
    const index = zombies.indexOf(z);
    if (index < 0) return;   // déjà mort (sinon splice(-1) retirerait le dernier zombie de la liste)
    z.pv -= degats;
    if (z.pv > 0) return;
    zombies.splice(index, 1);
    ajouter_cadavre(z);
    ajouter_score(TYPES_ZOMBIE[z.type].config.points);
    if (z.joggeur && z.joggeur.etat === 'course' && typeof Succes !== 'undefined') Succes.compter('sprintsStoppes');
    Son.effet('mort');
    if (z === boss) {
        fin_boss();
        secouer_ecran(4);
        Son.effet('bossMort');
    }
    if (typeof Succes !== 'undefined') Succes.zombie_tue(z.type);
}

/* ---------- Animation de mort ----------
   Le zombie tué flashe en blanc, bascule en arrière, s'effondre et disparaît
   dans une gerbe de sang (ou d'étoiles roses pour la magical girl). */
const DUREE_MORT = 0.9;
let cadavres = [];

function ajouter_cadavre(z) {
    const couleurs = z.type === 'magicalgirl' ? ['#ff6ec7', '#ffe14d', '#ffffff'] : ['#8a0f0f', '#b01818', '#5a0808'];
    const nombre = z.type === 'boss' ? 60 : z.type === 'tank' ? 18 : 12;
    const particules = Array.from({ length: nombre }, () => ({
        x: z.x + z.taille / 2, y: z.y + z.taille * 0.4,
        vx: 40 + Math.random() * 160, vy: -60 - Math.random() * 140,
        taille: 2 + Math.random() * 3,
        couleur: couleurs[Math.floor(Math.random() * couleurs.length)]
    }));
    cadavres.push({ image: TYPES_ZOMBIE[z.type].images[z.etape], x: z.x, y: z.y, taille: z.taille, age: 0, particules, etoiles: z.type === 'magicalgirl' });
}

function update_cadavres(dt) {
    for (const c of cadavres) {
        c.age += dt;
        c.x += 25 * dt;   // l'impact les repousse un peu en arrière
        for (const p of c.particules) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; }
    }
    cadavres = cadavres.filter(c => c.age < DUREE_MORT);
}

function draw_cadavres(ctx) {
    for (const c of cadavres) {
        const t = c.age / DUREE_MORT;                      // 0 -> 1
        const chute = Math.min(1, c.age / 0.35);           // bascule pendant 0,35 s
        ctx.save();
        ctx.globalAlpha = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
        // Pivot aux pieds : il tombe en arrière (vers la droite)
        ctx.translate(c.x + c.taille / 2, c.y + c.taille);
        ctx.rotate(chute * chute * Math.PI / 2);
        if (c.age < 0.08) ctx.filter = 'brightness(3)';     // flash blanc à l'impact
        ctx.drawImage(c.image, -c.taille / 2, -c.taille, c.taille, c.taille);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t * 1.2);
        for (const p of c.particules) {
            ctx.fillStyle = p.couleur;
            if (c.etoiles) dessiner_etoile(ctx, p.x, p.y, p.taille + 1);
            else ctx.fillRect(p.x, p.y, p.taille, p.taille);
        }
        ctx.restore();
    }
}

/* ---------- Mise à jour ---------- */
function update_zombies(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    // Pendant le combat de boss, seuls ses invocations arrivent
    if (!boss) gerer_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu);
    gerer_boss(dt, largeurCanvas, hauteurCanvas, tempsJeu);
    update_crachats(dt);

    const zoneJoueur = hitbox(joueur.x, joueur.y, joueur.taille);

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        const type = TYPES_ZOMBIE[z.type];
        if (z.joggeur) gerer_joggeur(z, dt);
        z.vitesseActuelle = z.joggeur ? vitesse_joggeur(z) : z.vitesse;
        z.x -= z.vitesseActuelle * MONDE.echelleX * dt;   // même temps de traversée sur tout écran
        if (z.teleport) gerer_teleport(z, dt, hauteurCanvas);

        // En course, ses jambes vont deux fois et demie plus vite
        z.tempsImage += dt * (z.joggeur && z.joggeur.etat === 'course' ? 2.5 : 1);
        if (z.tempsImage >= type.config.dureeImage) {
            z.tempsImage -= type.config.dureeImage;
            z.etape = (z.etape + 1) % type.images.length;
        }

        // Un zombie qui atteint le joueur ou qui sort de l'écran coûte une vie
        if (collision(zoneJoueur, hitbox_zombie(z)) || z.x + z.taille < 0) {
            zombies.splice(i, 1);
            if (z === boss) {
                // Le boss passe : grosse perte, mais la partie continue
                fin_boss();
                secouer_ecran(3);
                for (let k = 0; k < CONFIG.boss.degatsSiPasse; k++) perdre_vie();
            } else {
                perdre_vie();
            }
        }
    }

    for (const e of effets) e.age += dt;
    effets = effets.filter(e => e.age < 0.35);
    update_cadavres(dt);
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
    draw_cadavres(ctx);
    draw_crachats(ctx);
    for (const z of zombies) {
        if (z.teleport && z.teleport.annonce) dessiner_annonce(ctx, z);

        if (z === boss) {
            // Avant de cracher : gueule ouverte, pustules allumées, il gonfle et tremble
            const charge = z.charge;
            const gonfle = charge ? 1 + 0.05 * Math.sin(performance.now() / 40) : 1;
            const t = z.taille * gonfle;
            const img = (charge ? TYPES_ZOMBIE.boss.imagesCharge : TYPES_ZOMBIE.boss.images)[z.etape];
            if (charge) {
                // halo d'acide autour de la gueule
                ctx.save();
                ctx.globalAlpha = 0.35 + 0.2 * Math.sin(performance.now() / 60);
                ctx.fillStyle = '#b8ff4a';
                ctx.beginPath();
                ctx.ellipse(z.x + z.taille * 0.14, z.y + z.taille * 0.45, 22, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.drawImage(img, z.x - (t - z.taille) / 2, z.y - (t - z.taille), t, t);
            continue;   // sa barre de vie est en haut de l'écran
        }
        if (z.joggeur) dessiner_joggeur(ctx, z);
        else ctx.drawImage(TYPES_ZOMBIE[z.type].images[z.etape], z.x, z.y, z.taille, z.taille);

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
