/* =========================================================================
   LE BOXEUR (hardcore seulement)
   Quand un tir arrive sur sa ligne, il fait un pas de côté (vers le haut ou
   le bas, à l'opposé du tir). Une seule fois : ensuite il est essoufflé
   (gouttes de sueur) et ne peut plus esquiver pendant quelques secondes.
   Tirer une fois pour le faire bouger, puis l'abattre. Les armes « larges » (plombs en
   éventail, explosions, foudre qui saute d'un zombie à l'autre) le gênent
   bien plus que le fusil, et un tir très rapide peut l'atteindre en plein pas.
   Réglages : CONFIG.boxeur ; sprite : boxeur_sprite.js.
   ========================================================================= */
TYPES_ZOMBIE.boxeur = {
    config: CONFIG.boxeur,
    images: SPRITES_BOXEUR.marche,
    comportement: {
        creer(z) { z.boxe = { recharge: 0, esquive: 0, de: 0, vers: 0 }; },

        maj(z, dt) {
            const cfg = CONFIG.boxeur, b = z.boxe;
            b.recharge = Math.max(0, b.recharge - dt);
            if (b.esquive > 0) {
                b.esquive = Math.max(0, b.esquive - dt);
                z.y = b.de + (b.vers - b.de) * lisse(1 - b.esquive / cfg.dureeEsquive);
                return;
            }
            if (b.recharge > 0) return;

            // Un tir arrive-t-il sur lui ? (devant lui, à portée d'alerte, à sa hauteur)
            const h = hitbox_zombie(z);
            const tir = projectiles.find(p => p.vx > 0 && p.x + p.largeur <= h.x + 4
                && h.x - (p.x + p.largeur) < cfg.alerte * MONDE.echelleX
                && p.y + p.hauteur > h.y - 4 && p.y < h.y + h.hauteur + 4);
            if (!tir) return;

            // Pas de côté à l'opposé du tir, sans sortir du terrain
            const yMin = CONFIG.margeHaut, yMax = MONDE.hauteur - CONFIG.margeBas;
            let sens = tir.y + tir.hauteur / 2 < z.y + z.taille / 2 ? 1 : -1;
            if (z.y + sens * cfg.ecartEsquive < yMin || z.y + sens * cfg.ecartEsquive > yMax) sens = -sens;
            Object.assign(b, {
                de: z.y,
                vers: Math.max(yMin, Math.min(yMax, z.y + sens * cfg.ecartEsquive)),
                esquive: cfg.dureeEsquive,
                recharge: cfg.rechargeEsquive
            });
            z.etape = 0;
            Son.effet('esquive');
            if (typeof Succes !== 'undefined') Succes.compter('esquivesBoxeur');
        },

        images: z => (z.boxe.esquive > 0 ? SPRITES_BOXEUR.esquive : SPRITES_BOXEUR.marche),

        // Essoufflé après son esquive : des gouttes de sueur perlent (il ne peut plus esquiver)
        dessiner(ctx, z) {
            const imgs = this.images(z);
            ctx.drawImage(imgs[z.etape % imgs.length], z.x, z.y, z.taille, z.taille);
            if (z.boxe.esquive > 0 || z.boxe.recharge <= 0) return;
            ctx.save();
            ctx.fillStyle = '#9ad4f0';
            const t = performance.now() / 400;
            for (let k = 0; k < 2; k++) {
                const p = (t + k * 0.5) % 1;
                ctx.globalAlpha = 1 - p;
                ctx.fillRect(z.x + 30 + k * 8, z.y + 4 + p * 10, 2, 3);
            }
            ctx.restore();
        }
    }
};
