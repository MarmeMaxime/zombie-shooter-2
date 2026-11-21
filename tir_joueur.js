/* =========================================================================
   ARMES ET PROJECTILES
   Chaque arme a sa fonction de tir. Tous les projectiles vivent dans la
   même liste et partagent la même logique de collision.
   ========================================================================= */
const img_balle = chargerImage('./assets/bullet.jpg');

let projectiles = [];
let explosions = [];
let arcs = [];          // arcs électriques de la foudre en chaîne

function reset_balles() {
    projectiles = [];
    explosions = [];
    arcs = [];
}

let compteurTirs = 0;
function creer_projectile(tireur, arme, props) {
    projectiles.push({
        x: tireur.x + CONFIG.canon.x,
        y: tireur.y + CONFIG.canon.y,
        vx: arme.vitesse,
        vy: 0,
        largeur: 25,
        hauteur: 10,
        degats: arme.degats,
        portee: arme.portee || Infinity,  // distance restante avant disparition
        tir: compteurTirs,                // les plombs d'une même salve partagent ce numéro
        ...props
    });
}

const TIRS = {
    // Une balle droite et rapide
    fusil(tireur, arme) {
        creer_projectile(tireur, arme, { type: 'balle' });
    },

    // Plusieurs plombs en éventail, de portée limitée
    pompe(tireur, arme) {
        const milieu = (arme.plombs - 1) / 2;
        for (let i = 0; i < arme.plombs; i++) {
            const angle = (i - milieu) * arme.ecartDegres * Math.PI / 180;
            creer_projectile(tireur, arme, {
                type: 'plomb',
                vx: Math.cos(angle) * arme.vitesse,
                vy: Math.sin(angle) * arme.vitesse,
                largeur: 7,
                hauteur: 4
            });
        }
    },

    // Une grenade qui explose au premier contact ou en fin de portée
    grenade(tireur, arme) {
        creer_projectile(tireur, arme, { type: 'grenade', largeur: 10, hauteur: 10, rotation: 0, rayon: arme.rayon });
    },

    // Un éclair rapide ; au contact, la foudre saute de zombie en zombie (voir foudroyer)
    foudre(tireur, arme) {
        creer_projectile(tireur, arme, { type: 'eclair', largeur: 22, hauteur: 6, sauts: arme.sauts, rayonSaut: arme.rayonSaut });
    }
};

/* ---------- Foudre en chaîne ----------
   Le zombie touché est foudroyé, puis la foudre saute vers le zombie le plus
   proche de LUI (dans le rayon), puis depuis celui-là, etc. Jamais deux fois
   le même zombie ; elle s'arrête sur un Anti-émeute. Les dégâts tombent tout de suite ; l'arc se dessine saut
   par saut. */
function foudroyer(p, premier) {
    const centre = z => ({ x: z.x + z.taille / 2, y: z.y + z.taille / 2 });
    const touches = [premier];
    for (let k = 0; k < p.sauts; k++) {
        if (touches[touches.length - 1].emeute) break;   // l'Anti-émeute arrête la foudre
        const de = centre(touches[touches.length - 1]);
        let suivant = null, meilleure = Infinity;
        for (const z of zombies) {
            if (touches.includes(z)) continue;
            const c = centre(z);
            // Distance comptée en unités de référence (même portée de saut sur tout écran)
            const d = Math.hypot((c.x - de.x) / MONDE.echelleX, c.y - de.y);
            if (d <= p.rayonSaut && d < meilleure) { meilleure = d; suivant = z; }
        }
        if (!suivant) break;
        touches.push(suivant);
    }
    arcs.push({ points: [{ x: p.x, y: p.y + p.hauteur / 2 }, ...touches.map(centre)], age: 0 });
    for (const z of touches) {
        z.foudroye = true;                 // pour son animation de mort « électrocuté »
        toucher_zombie(z, p.degats, p.tir);
    }
    Son.effet('foudreImpact');
}

function tirer(tireur) {
    const arme = tireur.arme;
    Son.effet(CONFIG.personnages[tireur.perso].arme);   // chaque arme a son propre son
    compteurTirs++;
    TIRS[CONFIG.personnages[tireur.perso].arme](tireur, arme);
}

/* ---------- Explosion de grenade ---------- */
function exploser(p) {
    const cx = p.x + p.largeur / 2;
    const cy = p.y + p.hauteur / 2;
    const rayon = p.rayon;

    // On copie la liste : toucher_zombie peut retirer des zombies pendant la boucle
    for (const z of zombies.slice()) {
        const h = hitbox_zombie(z);
        // Distance entre le centre de l'explosion et le point le plus proche de la hitbox
        const dx = Math.max(h.x - cx, 0, cx - (h.x + h.largeur));
        const dy = Math.max(h.y - cy, 0, cy - (h.y + h.hauteur));
        if (dx * dx + dy * dy <= rayon * rayon) toucher_zombie(z, p.degats, p.tir);
    }
    explosions.push({ x: cx, y: cy, rayon, age: 0 });
    Son.effet('explosion');
}

/* ---------- Mise à jour ---------- */
function update_balles(dt, largeurCanvas, hauteurCanvas) {
    projectiles = projectiles.filter(p => {
        // Vitesse horizontale à l'échelle de la largeur du monde (voir MONDE dans main.js)
        const k = MONDE.echelleX;
        const dx = p.vx * k * dt;
        const dy = p.vy * dt;

        // Test sur toute la trajectoire de la frame pour ne jamais "traverser" un zombie
        const trajet = {
            x: p.x, y: Math.min(p.y, p.y + dy),
            largeur: p.largeur + dx, hauteur: p.hauteur + Math.abs(dy)
        };
        p.x += dx;
        p.y += dy;
        p.portee -= Math.hypot(dx / k, dy);   // portée comptée en unités de référence
        if (p.rotation !== undefined) p.rotation += dt * 12;

        const cible = trouver_cible(trajet);
        if (cible) {
            if (p.type === 'grenade') exploser(p);
            else if (p.type === 'eclair') foudroyer(p, cible);
            else toucher_zombie(cible, p.degats, p.tir);
            return false;
        }
        if (p.portee <= 0) {
            if (p.type === 'grenade') exploser(p);
            return false;
        }
        return p.x < largeurCanvas && p.y > -20 && p.y < hauteurCanvas + 20;
    });

    for (const e of explosions) e.age += dt;
    explosions = explosions.filter(e => e.age < 0.4);
    for (const a of arcs) a.age += dt;
    arcs = arcs.filter(a => a.age < DUREE_ARC);
}

/* ---------- Arcs électriques ---------- */
const DUREE_ARC = 0.35, DELAI_SAUT = 0.05;   // chaque saut apparaît un peu après le précédent

// Ligne brisée entre deux points, redessinée à chaque image pour qu'elle grésille
function zigzag(ctx, a, b) {
    const n = Math.max(3, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 12));
    ctx.moveTo(a.x, a.y);
    for (let k = 1; k < n; k++) {
        const t = k / n;
        ctx.lineTo(a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 10, a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 10);
    }
    ctx.lineTo(b.x, b.y);
}

function draw_arcs(ctx) {
    for (const arc of arcs) {
        const visible = Math.min(arc.points.length - 1, Math.floor(arc.age / DELAI_SAUT) + 1);
        const alpha = 1 - arc.age / DUREE_ARC;
        ctx.save();
        ctx.lineJoin = 'round';
        for (const [largeur, couleur, a] of [[7, '#2ab8ff', 0.35], [3, '#5ae6ff', 0.9], [1.5, '#ffffff', 1]]) {
            ctx.globalAlpha = alpha * a;
            ctx.strokeStyle = couleur;
            ctx.lineWidth = largeur;
            ctx.beginPath();
            for (let k = 0; k < visible; k++) zigzag(ctx, arc.points[k], arc.points[k + 1]);
            ctx.stroke();
        }
        // Éclat sur chaque zombie atteint
        ctx.fillStyle = '#c8f8ff';
        for (let k = 1; k <= visible; k++) {
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(arc.points[k].x, arc.points[k].y, 6 + 4 * Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

/* ---------- Dessin ---------- */
function draw_balles(ctx) {
    for (const p of projectiles) {
        if (p.type === 'balle') {
            ctx.drawImage(img_balle, p.x, p.y, p.largeur, p.hauteur);
        } else if (p.type === 'plomb') {
            ctx.fillStyle = '#ffd541';
            ctx.fillRect(p.x, p.y, p.largeur, p.hauteur);
        } else if (p.type === 'eclair') {
            // Trait d'énergie bleu avec un halo
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#2ab8ff';
            ctx.fillRect(p.x - 6, p.y - 2, p.largeur + 6, p.hauteur + 4);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#c8f8ff';
            ctx.fillRect(p.x, p.y + 1, p.largeur, p.hauteur - 2);
            ctx.restore();
        } else {
            // Grenade : boule vert sombre qui tourne, avec une mèche
            ctx.save();
            ctx.translate(p.x + 5, p.y + 5);
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#3d4a22';
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#f9a31b';
            ctx.fillRect(-2, -9, 4, 4);
            ctx.restore();
        }
    }

    draw_arcs(ctx);

    for (const e of explosions) {
        const progression = e.age / 0.4;
        ctx.save();
        ctx.globalAlpha = 1 - progression;
        ctx.fillStyle = '#ff7a1a';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.rayon * (0.4 + 0.6 * progression), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe14d';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.rayon * 0.5 * (1 - progression), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
