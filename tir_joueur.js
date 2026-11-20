/* =========================================================================
   ARMES ET PROJECTILES
   Chaque arme a sa fonction de tir. Tous les projectiles vivent dans la
   même liste et partagent la même logique de collision.
   ========================================================================= */
const img_balle = chargerImage('./assets/bullet.jpg');

let projectiles = [];
let explosions = [];

function reset_balles() {
    projectiles = [];
    explosions = [];
}

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
    }
};

function tirer(tireur) {
    const arme = tireur.arme;
    Son.tir(arme.son);
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
        if (dx * dx + dy * dy <= rayon * rayon) toucher_zombie(z, p.degats);
    }
    explosions.push({ x: cx, y: cy, rayon, age: 0 });
}

/* ---------- Mise à jour ---------- */
function update_balles(dt, largeurCanvas, hauteurCanvas) {
    projectiles = projectiles.filter(p => {
        const dx = p.vx * dt;
        const dy = p.vy * dt;

        // Test sur toute la trajectoire de la frame pour ne jamais "traverser" un zombie
        const trajet = {
            x: p.x, y: Math.min(p.y, p.y + dy),
            largeur: p.largeur + dx, hauteur: p.hauteur + Math.abs(dy)
        };
        p.x += dx;
        p.y += dy;
        p.portee -= Math.hypot(dx, dy);
        if (p.rotation !== undefined) p.rotation += dt * 12;

        const cible = trouver_cible(trajet);
        if (cible) {
            if (p.type === 'grenade') exploser(p);
            else toucher_zombie(cible, p.degats);
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
}

/* ---------- Dessin ---------- */
function draw_balles(ctx) {
    for (const p of projectiles) {
        if (p.type === 'balle') {
            ctx.drawImage(img_balle, p.x, p.y, p.largeur, p.hauteur);
        } else if (p.type === 'plomb') {
            ctx.fillStyle = '#ffd541';
            ctx.fillRect(p.x, p.y, p.largeur, p.hauteur);
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
