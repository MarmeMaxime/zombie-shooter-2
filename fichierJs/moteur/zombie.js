/* =========================================================================
   ZOMBIES : types, apparitions, collisions, dégâts, mise à jour et dessin.
   Tous les monstres sont dans la même liste « zombies ». Animations de mort :
   morts.js.

   Ici, seulement les monstres sans comportement propre (zombie, tank, magical
   girl). Chaque autre ennemi a son fichier dans ennemis/ (joggeur.js,
   emeute.js, pondeuse.js…) et s'ajoute lui-même à TYPES_ZOMBIE :
     TYPES_ZOMBIE.x = { config, images, mort, comportement }
   - mort : { style, couleurs, particules, images } pour son animation de mort
     (morts.js), ou une fonction z => {…} quand elle dépend de son état.
   - comportement (tout est facultatif) :
       creer(z)                 à l'apparition (son état à lui : z.joggeur…)
       maj(z, dt)               à chaque image, sauf s'il est étourdi
       vitesse(z)               vitesse du moment (sinon z.vitesse)
       rythme(z)                vitesse de l'animation de marche (sinon 1)
       images(z)                série d'images en cours (sinon config.images)
       degats(z, degats, tir)   dégâts réellement reçus ; null = tir ignoré
       blesse(z)                touché sans être tué
       mort(z)                  au moment de sa mort
       dessiner(ctx, z)         dessin propre (sinon l'image de marche)
   Leurs effets à l'écran passent par EXTENSIONS : { reset(), maj(dt), dessiner(ctx) }.
   ========================================================================= */
// Images de marche d'un monstre : assets/monstres/<dossier>/marche1..n.png
const imagesNumerotees = (dossier, nombre) =>
    Array.from({ length: nombre }, (_, i) => chargerImage(`./assets/monstres/${dossier}/marche${i + 1}.png`));

const TYPES_ZOMBIE = {
    normal: {
        config: CONFIG.zombie,
        images: imagesNumerotees('zombie', 6)
    },
    tank: {
        config: CONFIG.tank,
        images: imagesNumerotees('tank', 12),
        mort: { style: 'dos', particules: 18 }   // projeté en arrière
    },
    // Elle se téléporte (config.delaiTeleport : voir gerer_teleport)
    magicalgirl: {
        config: CONFIG.magicalgirl,
        images: imagesNumerotees('magicalgirl', 12),
        mort: { style: 'paillettes' }
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
// Les tombes laissées par un Fossoyeur vaincu ne comptent pas : elles ne doivent pas bloquer les autres spéciaux
const est_special = z => z.type !== 'normal' && z.type !== 'larve' && z !== boss && !(z.type === 'tombe' && !boss);

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
                // il prend la place d'un zombie normal (ou d'une partie)
                chronos.normal -= parMode(CONFIG.apparitions.remplacement) * intervalle_apparition('normal', tempsJeu);
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
    const comp = comportement(z);
    if (comp.degats) {
        degats = comp.degats(z, degats, tir);
        if (degats === null) return;   // tir sans effet sur lui
    }
    z.pv -= degats;
    if (z.pv > 0) {
        if (comp.blesse) comp.blesse(z);
        return;
    }
    zombies.splice(index, 1);
    if (etat.tues) etat.tues[z.type] = (etat.tues[z.type] || 0) + 1;   // bilan de fin de partie
    ajouter_cadavre(z);
    if (comp.mort) comp.mort(z);
    ajouter_score(TYPES_ZOMBIE[z.type].config.points);
    pouvoir_zombie_tue();
    Son.effet('mort');
    if (z === boss) {
        fin_boss();
        secouer_ecran(4);
        Son.effet('bossMort');
    }
    if (typeof Succes !== 'undefined' && !etat.tuto) Succes.zombie_tue(z.type);
    if (etat.variante === 'campagne' && typeof Campagne !== 'undefined') Campagne.tue(z);
}

/* ---------- Mise à jour ---------- */
/* Grognements : un de temps en temps, plus souvent quand ils sont nombreux
   (jamais plus d'un toutes les 1,5 s : la musique passe avant). */
let chronoGrognement = 2;
function grogner(dt) {
    chronoGrognement -= dt;
    if (chronoGrognement > 0 || !zombies.length) return;
    chronoGrognement = Math.max(1.5, (2.5 + Math.random() * 4) / Math.sqrt(zombies.length));
    const z = zombies[Math.floor(Math.random() * zombies.length)];
    if (!est_boss(z.type)) Son.effet(z.type === 'tank' ? 'grognementTank' : 'grognement');
}

// Qui fait venir les monstres : le mode Vagues, la mission de campagne, ou les apparitions classiques
function piloter_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    // Entraînement : seuls les zombies placés par le sergent ; pendant un boss, seules ses invocations
    if (etat.variante === 'vagues' && !etat.tuto) Vagues.maj(dt);
    else if (etat.variante === 'campagne' && !etat.tuto) Campagne.maj(dt);
    else if (!boss && !etat.tuto) gerer_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu);
    if (!etat.tuto) gerer_boss(dt, largeurCanvas, hauteurCanvas, tempsJeu);
}

// Un monstre avance d'une image. Renvoie false s'il doit disparaître (tombe ouverte…).
function maj_zombie(z, dt, hauteurCanvas) {
    const cfg = TYPES_ZOMBIE[z.type].config;
    const comp = comportement(z);
    // Étourdi (onde de choc de Brutus) : immobile, il ne charge ni ne se téléporte
    z.etourdi = Math.max(0, (z.etourdi || 0) - dt);
    const etourdi = z.etourdi > 0;
    // Première apparition de ce monstre : il entre au bestiaire
    if (!z.vu && !etat.tuto) {
        z.vu = true;
        if (typeof Bestiaire !== 'undefined') Bestiaire.rencontre(z.type);
        if (typeof Conseils !== 'undefined') Conseils.monstre(z.type);   // le sergent présente le nouveau venu
    }
    if (comp.maj && !etourdi) comp.maj(z, dt);
    if (z.retirer) return false;
    z.vitesseActuelle = etourdi ? 0 : comp.vitesse ? comp.vitesse(z) : z.vitesse;
    // même temps de traversée sur tout écran ; agrippé au camion (campagne.js), c'est le camion qui l'emmène
    if (!z.surCamion) z.x -= z.vitesseActuelle * MONDE.echelleX * dt;
    if (z.teleport && !etourdi) gerer_teleport(z, dt, hauteurCanvas);

    if (!etourdi) z.tempsImage += dt * (comp.rythme ? comp.rythme(z) : 1);
    if (z.tempsImage >= cfg.dureeImage) {
        z.tempsImage -= cfg.dureeImage;
        z.etape = (z.etape + 1) % images_zombie(z).length;
    }
    return true;
}

// Un monstre a atteint le joueur ou est sorti de l'écran : ça coûte une vie
function zombie_passe(z) {
    if (z !== boss) { perdre_vie(); return; }
    // Le boss passe : grosse perte, mais la partie continue
    fin_boss();
    secouer_ecran(3);
    // (en campagne, c'est la mission qui échoue : campagne.js s'en charge)
    if (etat.variante !== 'campagne') for (let k = 0; k < CONFIG.boss.degatsSiPasse; k++) perdre_vie();
}

function update_zombies(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    grogner(dt);
    piloter_apparitions(dt, largeurCanvas, hauteurCanvas, tempsJeu);
    update_crachats(dt);

    const zoneJoueur = hitbox(joueur.x, joueur.y, joueur.taille);
    // À l'envers : on peut retirer un monstre sans sauter le suivant (les nouveaux arrivent en fin de liste)
    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        if (!maj_zombie(z, dt, hauteurCanvas)) { zombies.splice(i, 1); continue; }
        if (collision(zoneJoueur, hitbox_zombie(z)) || z.x + z.taille < 0) {
            zombies.splice(i, 1);
            zombie_passe(z);
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

        if (comportement(z).dessiner) comportement(z).dessiner(ctx, z);
        else ctx.drawImage(images_zombie(z)[z.etape % images_zombie(z).length], z.x, z.y, z.taille, z.taille);

        if (z.etourdi > 0) dessiner_etourdi(ctx, z);
        if (z === boss) continue;   // la barre de vie d'un boss est en haut de l'écran

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
