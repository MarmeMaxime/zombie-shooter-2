/* =========================================================================
   ZOMBIES : types, apparitions, collisions, dégâts, mise à jour et dessin.
   Tous les monstres sont dans la même liste « zombies ». Mécaniques à part :
   boss.js, joggeur.js, emeute.js ; animations de mort : morts.js.
   Les ennemis plus récents (pondeuse.js, infirmier.js, boxeur.js) s'ajoutent
   eux-mêmes à TYPES_ZOMBIE avec un « comportement » (voir comportement()) :
   creer(z), maj(z, dt), vitesse(z), images(z), dessiner(ctx, z), mort(z).
   Leurs effets à l'écran passent par EXTENSIONS : { reset(), maj(dt), dessiner(ctx) }.
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
    },
    // Sprite dessiné dans emeute_sprite.js (bouclier levé, puis brisé)
    emeute: {
        config: CONFIG.emeute,
        images: SPRITES_EMEUTE.garde
    }
};

// Effets propres à certains ennemis (soins, éclaboussures…), ajoutés par leur fichier
const EXTENSIONS = [];
const comportement = z => TYPES_ZOMBIE[z.type].comportement || {};
// Images de l'animation en cours (certains ennemis en ont plusieurs séries)
const images_zombie = z => (comportement(z).images ? comportement(z).images(z) : TYPES_ZOMBIE[z.type].images);

let zombies = [];
let effets = [];        // étincelles de téléportation
let difficulte = 'normal';
const chronos = {};     // temps écoulé depuis la dernière apparition, par type

function reset_zombies(mode) {
    zombies = [];
    effets = [];
    cadavres = [];
    eclats = [];
    reset_boss();
    for (const e of EXTENSIONS) e.reset();
    difficulte = mode;
    for (const type in TYPES_ZOMBIE) chronos[type] = 0;
}

/* ---------- Collisions ---------- */
function collision(a, b) {
    return a.x < b.x + b.largeur && a.x + a.largeur > b.x &&
           a.y < b.y + b.hauteur && a.y + a.hauteur > b.y;
}

function hitbox(x, y, taille) {
    const r = CONFIG.reductionHitbox * Math.min(1, taille / 64);   // les petits (larves) gardent une hitbox utile
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
    if (type === 'emeute') z.emeute = nouvel_emeute();
    if (comportement(z).creer) comportement(z).creer(z);
    zombies.push(z);
    return z;
}

function intervalle_apparition(type, tempsJeu) {
    const cfg = TYPES_ZOMBIE[type].config;
    if (type !== 'normal') return parMode(cfg.intervalle);
    return Math.max(parMode(cfg.intervalleMin), cfg.intervalleDepart - tempsJeu * cfg.accelerationParSeconde);
}

/* Un ennemi spécial remplace un zombie normal (le prochain normal est repoussé
   d'autant) et leur nombre à l'écran est plafonné : quand le plafond est atteint,
   le suivant attend qu'une place se libère. Les larves ne comptent pas. */
const est_special = z => z.type !== 'normal' && z.type !== 'larve' && z !== boss;

function gerer_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    let speciaux = zombies.filter(est_special).length;
    for (const type in TYPES_ZOMBIE) {
        if (type === 'boss') continue;   // le boss a sa propre logique
        const cfg = TYPES_ZOMBIE[type].config;
        if (cfg.invoque) continue;         // n'apparaît jamais seul (larves de la Pondeuse)
        if (cfg.modes && !cfg.modes.includes(difficulte)) continue;
        if (tempsJeu < (parMode(cfg.premiereApparition) || 0)) continue;

        chronos[type] += dt;
        if (chronos[type] >= intervalle_apparition(type, tempsJeu)) {
            const special = type !== 'normal';
            if (special && speciaux >= parMode(CONFIG.apparitions.maxSpeciaux)) continue;   // il attend une place
            chronos[type] = 0;
            creer_zombie(type, largeurCanvas, hauteurCanvas);
            if (special) {
                speciaux++;
                chronos.normal -= intervalle_apparition('normal', tempsJeu);   // il prend la place d'un zombie normal
            }
        }
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
function toucher_zombie(z, degats = 1, tir) {
    const index = zombies.indexOf(z);
    if (index < 0) return;   // déjà mort (sinon splice(-1) retirerait le dernier zombie de la liste)
    if (z.emeute) {
        // Un seul PV par tir, quelle que soit l'arme (une salve de plombs = un tir)
        if (tir !== undefined && z.emeute.dernierTir === tir) return;
        z.emeute.dernierTir = tir;
        degats = 1;
    }
    z.pv -= degats;
    if (z.pv > 0) {
        if (z.emeute) emeute_blesse(z);
        return;
    }
    zombies.splice(index, 1);
    ajouter_cadavre(z);
    if (comportement(z).mort) comportement(z).mort(z);
    ajouter_score(TYPES_ZOMBIE[z.type].config.points);
    pouvoir_zombie_tue();
    if (z.joggeur && z.joggeur.etat === 'course' && typeof Succes !== 'undefined') Succes.compter('sprintsStoppes');
    Son.effet('mort');
    if (z === boss) {
        fin_boss();
        secouer_ecran(4);
        Son.effet('bossMort');
    }
    if (typeof Succes !== 'undefined') Succes.zombie_tue(z.type);
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
        // Étourdi (onde de choc de Brutus) : immobile, il ne charge ni ne se téléporte
        z.etourdi = Math.max(0, (z.etourdi || 0) - dt);
        const etourdi = z.etourdi > 0;
        const comp = comportement(z);
        if (z.joggeur && !etourdi) gerer_joggeur(z, dt);
        if (comp.maj && !etourdi) comp.maj(z, dt);
        z.vitesseActuelle = etourdi ? 0 : z.joggeur ? vitesse_joggeur(z) : z.emeute ? vitesse_emeute(z) : comp.vitesse ? comp.vitesse(z) : z.vitesse;
        z.x -= z.vitesseActuelle * MONDE.echelleX * dt;   // même temps de traversée sur tout écran
        if (z.teleport && !etourdi) gerer_teleport(z, dt, hauteurCanvas);

        // En course, ses jambes vont deux fois et demie plus vite
        if (!etourdi) z.tempsImage += dt * (z.joggeur && z.joggeur.etat === 'course' ? 2.5 : 1);
        if (z.tempsImage >= type.config.dureeImage) {
            z.tempsImage -= type.config.dureeImage;
            z.etape = (z.etape + 1) % images_zombie(z).length;
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
    update_eclats(dt);
    for (const e of EXTENSIONS) e.maj(dt);
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

// Petites étoiles qui tournent au-dessus d'un zombie étourdi
function dessiner_etourdi(ctx, z) {
    ctx.save();
    ctx.fillStyle = '#ffe14d';
    const t = performance.now() / 250;
    for (let k = 0; k < 3; k++) {
        const a = t + k * Math.PI * 2 / 3;
        dessiner_etoile(ctx, z.x + z.taille / 2 + Math.cos(a) * 14, z.y + 4 + Math.sin(a) * 4, 4);
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
        else if (z.emeute) dessiner_emeute(ctx, z);
        else if (comportement(z).dessiner) comportement(z).dessiner(ctx, z);
        else ctx.drawImage(images_zombie(z)[z.etape % images_zombie(z).length], z.x, z.y, z.taille, z.taille);

        if (z.etourdi > 0) dessiner_etourdi(ctx, z);

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
    draw_eclats(ctx);
    for (const e of EXTENSIONS) e.dessiner(ctx);
}
