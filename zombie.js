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

/* ---------- Animations de mort ----------
   Le corps est ARTICULÉ : on dessine séparément le haut du corps (tête, buste,
   bras) et les jambes, reliés à la hanche. Une mort se joue par phases :
   recul à l'impact -> titube (il continue quelques pas) -> les genoux plient
   -> le buste bascule d'un côté pendant que les jambes se couchent de l'autre
   -> rebond au sol -> dernier spasme -> il reste allongé, puis disparaît.
   - face (zombie normal, Joggeur) : tombe en avant, face contre terre
   - dos (tank) : projetée en arrière, tombe sur le dos
   - glissade (Joggeur en plein sprint) : s'écrase et glisse sur le ventre
   - electro (foudre de Lassie) : tremble et clignote avant de tomber
   - colosse (boss) : titube longtemps, tombe à genoux, s'écroule (séisme)
   - paillettes (magical girl) : tourne sur elle-même et se dissout en étoiles
   sens : -1 = tombe vers la gauche (en avant), +1 = vers la droite (en arrière)
   hanche : hauteur de la hanche dans le sprite (fraction depuis le haut) */
const MORTS = {
    face: { duree: 2.6, titube: 0.4, genoux: [0.1, 0.45], chute: [0.45, 0.78], sens: -1, recul: 4, hanche: 0.6, flaque: '#5a0808' },
    dos: { duree: 2.6, titube: 0.15, genoux: [0.12, 0.32], chute: [0.32, 0.62], sens: 1, recul: 12, hanche: 0.6, flaque: '#5a0808' },
    glissade: { duree: 2.6, titube: 0, genoux: [0, 0.05], chute: [0.05, 0.28], sens: -1, recul: 0, hanche: 0.6, flaque: '#5a0808', glisse: 70 },
    electro: { duree: 2.6, titube: 0, genoux: [0.6, 0.78], chute: [0.78, 1.08], sens: -1, recul: 0, hanche: 0.6, flaque: '#5a0808', electro: 0.6 },
    colosse: { duree: 3.8, titube: 0.8, genoux: [0.8, 1.3], chute: [1.3, 1.9], sens: -1, recul: 0, hanche: 0.66, flaque: '#4a6a1a', tremble: true },
    paillettes: { duree: 1.5 }
};
let cadavres = [];

const entre = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));   // progression 0 -> 1 entre a et b
const lisse = t => t * t * (3 - 2 * t);                                     // départ et arrivée en douceur

function ajouter_cadavre(z) {
    const style = z.type === 'boss' ? 'colosse'
        : z.type === 'magicalgirl' ? 'paillettes'
        : z.type === 'tank' ? 'dos'
        : z.type === 'joggeur' && z.joggeur && z.joggeur.etat === 'course' ? 'glissade'
        : z.foudroye ? 'electro'
        : 'face';
    const couleurs = style === 'paillettes' ? ['#ff6ec7', '#ffe14d', '#ffffff']
        : style === 'electro' ? ['#5ae6ff', '#c8f8ff', '#2ab8ff']
        : style === 'colosse' ? ['#6a8a2a', '#8fa83e', '#3a5a1a'] : ['#8a0f0f', '#b01818', '#5a0808'];
    const nombre = style === 'colosse' ? 60 : z.type === 'tank' ? 18 : 12;
    const sens = MORTS[style].sens || 1;
    const particules = Array.from({ length: nombre }, () => ({
        x: z.x + z.taille / 2, y: z.y + z.taille * 0.4,
        vx: (30 + Math.random() * 140) * (sens < 0 ? 0.6 : 1), vy: -60 - Math.random() * 140,
        taille: 2 + Math.random() * 3,
        couleur: couleurs[Math.floor(Math.random() * couleurs.length)]
    }));
    // Images de marche (celles de la course pour un joggeur en plein sprint)
    const images = z.joggeur && z.joggeur.etat === 'course' ? SPRITES_JOGGEUR.course : TYPES_ZOMBIE[z.type].images;
    cadavres.push({
        style, images, etape: z.etape % images.length, x: z.x, y: z.y, taille: z.taille,
        age: 0, particules, poussiere: [], impact: false, etoiles: style === 'paillettes'
    });
}

function update_cadavres(dt) {
    for (const c of cadavres) {
        c.age += dt;
        const m = MORTS[c.style];
        for (const p of c.particules) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; }
        for (const p of c.poussiere) { p.age += dt; p.x += p.vx * dt; p.y -= 8 * dt; }
        c.poussiere = c.poussiere.filter(p => p.age < 0.7);

        // Moment où le corps touche le sol : poussière (et séisme pour le boss)
        if (m.chute && !c.impact && c.age >= m.chute[1]) {
            c.impact = true;
            const nb = c.style === 'colosse' ? 14 : 5;
            for (let k = 0; k < nb; k++) {
                c.poussiere.push({ x: c.x + c.taille * (0.1 + Math.random() * 0.8) + m.sens * c.taille * 0.3, y: c.y + c.taille - 4, vx: (Math.random() - 0.5) * 60, age: 0, r: c.style === 'colosse' ? 10 : 5 });
            }
            if (c.style === 'colosse') { secouer_ecran(3); Son.effet('explosion'); }
        }
        // Le joggeur glisse sur le ventre avec son élan
        if (m.glisse && c.age > m.chute[0]) c.x -= m.glisse * Math.exp(-3 * (c.age - m.chute[0])) * dt * 3;
        // La magical girl lâche des étoiles en se dissolvant
        if (c.style === 'paillettes' && c.age > 0.5 && c.age < 1.3 && Math.random() < 0.7) {
            const coupe = c.y + c.taille * entre(c.age, 0.5, 1.3);
            c.particules.push({ x: c.x + 16 + Math.random() * 32, y: coupe, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, taille: 2 + Math.random() * 2, couleur: ['#ff6ec7', '#ffe14d', '#ffffff'][Math.floor(Math.random() * 3)] });
        }
    }
    cadavres = cadavres.filter(c => c.age < MORTS[c.style].duree);
}

// Pose du corps articulé à l'instant c.age : rotation du buste, des jambes, pliage des genoux
function pose_articulee(c) {
    const m = MORTS[c.style], a = c.age, s = m.sens;
    const genoux = lisse(entre(a, m.genoux[0], m.genoux[1]));
    const chute = entre(a, m.chute[0], m.chute[1]);
    const chuteG = chute * chute;                          // accélère comme sous la gravité
    const p = { dx: 0, buste: 0, jambes: 0, plie: 1, filtre: null, flash: a < 0.08 };

    // Recul à l'impact : le buste est rejeté en arrière puis revient (ou part directement, pour « dos »)
    if (s > 0) { p.dx = m.recul * lisse(entre(a, 0, 0.25)); p.buste += 0.25 * entre(a, 0, 0.15); }
    else { p.dx = m.recul * Math.sin(entre(a, 0, 0.14) * Math.PI); p.buste += 0.22 * Math.sin(entre(a, 0, 0.16) * Math.PI); }

    // Titube : petits balancements pendant qu'il fait encore quelques pas
    if (a < m.titube) p.buste += 0.08 * Math.sin(a * 18) * (1 - a / m.titube);
    if (m.tremble && a < m.titube) p.dx += (Math.random() - 0.5) * 6;

    // Électrocuté : il tremble et clignote en bleu (on voit presque son squelette)
    if (m.electro && a < m.electro) {
        p.dx += (Math.random() - 0.5) * 5;
        p.buste += (Math.random() - 0.5) * 0.15;
        p.filtre = Math.floor(a / 0.05) % 2 ? 'brightness(2.4) sepia(1) hue-rotate(160deg) saturate(5)' : 'invert(1) brightness(1.4)';
    }

    // Les genoux plient : les jambes se tassent, le buste s'affaisse vers le côté de la chute
    p.plie = 1 - 0.4 * genoux;
    p.buste += s * 0.35 * genoux;

    // Chute : le buste bascule jusqu'au sol, les jambes se couchent de l'autre côté
    p.buste += s * (Math.PI / 2 - 0.35 * genoux) * chuteG;
    p.jambes = s * (Math.PI / 2) * chuteG;
    p.plie += (0.9 - p.plie) * chuteG;                    // une fois couchées, les jambes se détendent

    // Rebond au sol, puis dernier spasme
    const rebond = entre(a, m.chute[1], m.chute[1] + 0.18);
    if (rebond > 0 && rebond < 1) p.buste -= s * 0.14 * Math.sin(rebond * Math.PI);
    const spasme = entre(a, m.chute[1] + 0.6, m.chute[1] + 0.9);
    if (spasme > 0 && spasme < 1) { p.buste -= s * 0.05 * Math.sin(spasme * Math.PI * 6); p.jambes += s * 0.04 * Math.sin(spasme * Math.PI * 4); }

    // Image affichée : il continue de marcher en titubant, puis se fige dans sa chute
    const pas = Math.floor(Math.min(a, m.titube) / 0.12);
    p.image = c.images[(c.etape + pas) % c.images.length];
    return p;
}

// Position de la hanche : les pieds restent au sol, la hanche suit les jambes qui basculent,
// sans descendre sous l'épaisseur du corps allongé
function position_hanche(c, p) {
    const m = MORTS[c.style];
    const longueur = c.taille * (1 - m.hanche) * p.plie;
    const sol = c.y + c.taille;
    return {
        hx: c.x + c.taille / 2 + p.dx + Math.sin(p.jambes) * longueur,
        hy: Math.min(sol - Math.cos(p.jambes) * longueur, sol - c.taille * 0.14)
    };
}

// Haut du corps et jambes dessinés séparément autour de la hanche
function dessiner_corps_articule(ctx, c, p) {
    const m = MORTS[c.style];
    const t = c.taille, img = p.image;
    const nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
    const { hx, hy } = position_hanche(c, p);

    if (p.filtre) ctx.filter = p.filtre;
    else if (p.flash) ctx.filter = 'brightness(3)';        // flash blanc à l'impact

    ctx.save();                                            // jambes
    ctx.translate(hx, hy);
    ctx.rotate(p.jambes);
    ctx.scale(1, p.plie);
    ctx.drawImage(img, 0, nh * m.hanche, nw, nh * (1 - m.hanche), -t / 2, 0, t, t * (1 - m.hanche));
    ctx.restore();
    ctx.save();                                            // haut du corps
    ctx.translate(hx, hy);
    ctx.rotate(p.buste);
    ctx.drawImage(img, 0, 0, nw, nh * m.hanche, -t / 2, -t * m.hanche, t, t * m.hanche);
    ctx.restore();
}

function draw_cadavres(ctx) {
    for (const c of cadavres) {
        const m = MORTS[c.style];
        const fin = m.duree - 0.5;
        const alpha = c.age < fin ? 1 : 1 - entre(c.age, fin, m.duree);

        if (c.style === 'paillettes') {
            // Magical girl : tourne sur elle-même en s'élevant, puis se dissout de haut en bas
            const coupe = c.taille * entre(c.age, 0.5, 1.3);
            ctx.save();
            ctx.translate(c.x + c.taille / 2, c.y + c.taille - 8 * entre(c.age, 0.1, 0.6));
            ctx.scale(Math.cos(entre(c.age, 0.1, 0.9) * Math.PI * 4), 1);
            if (c.age < 0.08) ctx.filter = 'brightness(3)';
            ctx.beginPath();
            ctx.rect(-c.taille, -c.taille + coupe, c.taille * 2, c.taille);
            ctx.clip();
            ctx.drawImage(c.images[c.etape], -c.taille / 2, -c.taille, c.taille, c.taille);
            ctx.restore();
        } else {
            const p = pose_articulee(c);
            // Flaque qui s'étend sous le buste une fois au sol
            const f = entre(c.age, m.chute[1], m.chute[1] + 1.2);
            if (f > 0) {
                const { hx } = position_hanche(c, p);
                ctx.save();
                ctx.globalAlpha = 0.75 * alpha;
                ctx.fillStyle = m.flaque;
                ctx.beginPath();
                ctx.ellipse(hx + m.sens * c.taille * 0.3, c.y + c.taille - 3, c.taille * 0.42 * f, c.taille * 0.1 * f, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.save();
            ctx.globalAlpha = alpha;
            dessiner_corps_articule(ctx, c, p);
            ctx.restore();
        }

        // Poussière soulevée par la chute
        ctx.save();
        ctx.fillStyle = '#c8a878';
        for (const d of c.poussiere) {
            ctx.globalAlpha = 0.5 * (1 - d.age / 0.7);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * (1 + d.age * 2), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Gerbe de sang (ou d'étoiles)
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - c.age * 0.9);
        for (const q of c.particules) {
            ctx.fillStyle = q.couleur;
            if (c.etoiles) dessiner_etoile(ctx, q.x, q.y, q.taille + 1);
            else ctx.fillRect(q.x, q.y, q.taille, q.taille);
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
