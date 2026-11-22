/* =========================================================================
   BOSS « LE FOSSOYEUR » (alterne avec le Mastodonte, voir boss.js)
   - Il s'arrête vers la droite de l'écran et suit la ligne du joueur.
   - Pelletée : il jette une motte de terre là où se trouve le joueur ; un
     cercle au sol annonce l'impact, il faut en sortir.
   - Tombes : il creuse des tombes au milieu du terrain ; un zombie en sort
     au bout de quelques secondes, sauf si on détruit la tombe avant.
   - Colère : s'il est encore debout au bout d'un moment, il avance.
   Réglages : CONFIG.fossoyeur, CONFIG.tombe ; sprites : fossoyeur_sprite.js.
   ========================================================================= */
let pelletees = [];   // mottes de terre en vol : { x0, y0, x, y, chrono, duree }

TYPES_ZOMBIE.fossoyeur = {
    config: CONFIG.fossoyeur,
    images: SPRITES_FOSSOYEUR.marche,
    estBoss: true,
    mort: { style: 'colosse', couleurs: ['#5a4026', '#2f2b38', '#9aa6a0'], particules: 50 },
    comportement: {
        creer(z) {
            const cfg = CONFIG.fossoyeur;
            z.fossoyeur = { pelletee: cfg.delaiPelletee, tombes: cfg.delaiTombes / 2, lancer: 0, age: 0 };
        },

        maj(z, dt) {
            const cfg = CONFIG.fossoyeur, f = z.fossoyeur;
            f.age += dt;
            f.lancer = Math.max(0, f.lancer - dt);
            // Il suit doucement la ligne du joueur (centre du boss sur le centre du joueur)
            const cible = joueur.y + joueur.taille / 2 - z.taille / 2;
            const yMax = MONDE.hauteur - z.taille + 10;
            z.y = Math.max(-10, Math.min(yMax, z.y + Math.sign(cible - z.y) * Math.min(Math.abs(cible - z.y), cfg.suivi * dt)));

            // Pelletée sur la position actuelle du joueur
            f.pelletee -= dt;
            if (f.pelletee <= 0) {
                f.pelletee = cfg.delaiPelletee;
                f.lancer = 0.4;
                z.etape = 0;
                pelletees.push({ x0: z.x + 20, y0: z.y + 30, x: joueur.x + joueur.taille / 2, y: joueur.y + joueur.taille / 2, chrono: cfg.annoncePelletee, duree: cfg.annoncePelletee });
                Son.effet('pelletee');
            }

            // Tombes au milieu du terrain
            f.tombes -= dt;
            if (f.tombes <= 0) {
                f.tombes = cfg.delaiTombes;
                for (let k = 0; k < cfg.tombes; k++) {
                    const t = creer_zombie('tombe', MONDE.largeur, MONDE.hauteur);
                    t.x = MONDE.largeur * (0.32 + Math.random() * 0.25);
                    t.y = CONFIG.margeHaut + 16 + Math.random() * (MONDE.hauteur - CONFIG.margeHaut - CONFIG.margeBas);
                }
                Son.effet('tombe');
            }
        },

        // Il avance jusqu'à sa place, attend, puis avance pour de bon s'il est en colère
        vitesse(z) {
            const cfg = CONFIG.fossoyeur;
            if (z.fossoyeur.age >= cfg.colere) return cfg.vitesseColere;
            return z.x > MONDE.largeur * cfg.xArret ? z.vitesse : 0;
        },

        images: z => (z.fossoyeur.lancer > 0 ? SPRITES_FOSSOYEUR.lancer : SPRITES_FOSSOYEUR.marche),

        dessiner(ctx, z) {
            const imgs = this.images(z);
            // En colère : il rougeoie
            if (z.fossoyeur.age >= CONFIG.fossoyeur.colere) {
                ctx.save();
                ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 120);
                ctx.fillStyle = '#ff3a3a';
                ctx.beginPath();
                ctx.ellipse(z.x + z.taille / 2, z.y + z.taille * 0.55, z.taille * 0.35, z.taille * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.drawImage(imgs[z.etape % imgs.length], z.x, z.y, z.taille, z.taille);
        }
    }
};

// Tombe : immobile ; détruite à temps, rien n'en sort ; sinon un zombie en surgit
TYPES_ZOMBIE.tombe = {
    config: CONFIG.tombe,
    images: SPRITES_FOSSOYEUR.tombe,
    mort: { style: 'face', couleurs: ['#8a8c90', '#5a4026', '#5c5e62'], particules: 10 },
    comportement: {
        creer(z) { z.ouverture = CONFIG.fossoyeur.dureeTombe; },
        maj(z, dt) {
            z.ouverture -= dt;
            if (z.ouverture > 0) return;
            const sortant = creer_zombie('normal', MONDE.largeur, MONDE.hauteur);
            sortant.x = z.x - 16;
            sortant.y = z.y - 32;
            z.retirer = true;   // la tombe disparaît (zombie.js), sans compter comme une victime
        },
        vitesse: () => 0,
        // Fissurée quand elle est touchée, une main sort juste avant l'ouverture
        dessiner(ctx, z) {
            const etat = z.ouverture < 1 ? 2 : z.pv < z.pvMax ? 1 : 0;
            const tremble = z.ouverture < 1 ? (Math.random() - 0.5) * 2 : 0;
            ctx.drawImage(SPRITES_FOSSOYEUR.tombe[etat], z.x + tremble, z.y, z.taille, z.taille);
        }
    }
};

EXTENSIONS.push({
    reset() { pelletees = []; },
    maj(dt) {
        for (const p of pelletees) {
            p.chrono -= dt;
            if (p.chrono > 0) continue;
            // Impact : le joueur est-il dans le cercle ?
            const cx = joueur.x + joueur.taille / 2, cy = joueur.y + joueur.taille / 2;
            if (Math.hypot((cx - p.x) / MONDE.echelleX, cy - p.y) < CONFIG.fossoyeur.rayonPelletee + 14) perdre_vie();
            Son.effet('impactTerre');
        }
        pelletees = pelletees.filter(p => p.chrono > 0);
    },
    dessiner(ctx) {
        const r = CONFIG.fossoyeur.rayonPelletee;
        ctx.save();
        for (const p of pelletees) {
            const avance = 1 - p.chrono / p.duree;   // 0 -> 1
            // Cercle d'impact au sol, de plus en plus marqué
            ctx.globalAlpha = 0.35 + 0.45 * avance;
            ctx.strokeStyle = '#ff3a3a';
            ctx.fillStyle = 'rgba(90, 64, 38, 0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 18, r * MONDE.echelleX, r * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // La motte en cloche, du fossoyeur jusqu'au cercle
            ctx.globalAlpha = 1;
            const x = p.x0 + (p.x - p.x0) * avance;
            const y = p.y0 + (p.y - p.y0) * avance - Math.sin(avance * Math.PI) * 120;
            ctx.fillStyle = '#5a4026';
            ctx.strokeStyle = '#2a1a0c';
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
});
