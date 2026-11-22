/* =========================================================================
   L'INFIRMIER
   Il avance lentement en boitant. À intervalles réguliers, s'il y a des
   zombies blessés autour de lui, il s'arrête, lève sa seringue et leur rend
   des PV (jamais au-delà de leur maximum, jamais au boss). Il ne se soigne
   pas lui-même : l'abattre en premier évite de devoir tout recommencer.
   Réglages : CONFIG.infirmier ; sprite : assets/monstres/infirmier/.
   ========================================================================= */
let soins = [];   // ondes vertes et croix qui montent au-dessus des zombies soignés

TYPES_ZOMBIE.infirmier = {
    config: CONFIG.infirmier,
    images: SPRITES_INFIRMIER.marche,
    comportement: {
        creer(z) { z.soin = { chrono: CONFIG.infirmier.delaiSoin, anim: 0 }; },

        maj(z, dt) {
            const cfg = CONFIG.infirmier, s = z.soin;
            s.anim = Math.max(0, s.anim - dt);
            s.chrono -= dt;
            if (s.chrono > 0) return;
            const cx = z.x + z.taille / 2, cy = z.y + z.taille / 2;
            const blesses = zombies.filter(o => o !== z && o !== boss && o.pv < o.pvMax
                && Math.hypot((o.x + o.taille / 2 - cx) / MONDE.echelleX, o.y + o.taille / 2 - cy) <= cfg.rayonSoin);
            if (!blesses.length) { s.chrono = 0.3; return; }   // personne à soigner : il réessaie bientôt
            for (const o of blesses) {
                o.pv = Math.min(o.pvMax, o.pv + cfg.soin);
                soins.push({ type: 'croix', x: o.x + o.taille / 2, y: o.y, age: 0 });
            }
            soins.push({ type: 'onde', x: cx, y: cy, age: 0 });
            s.anim = cfg.dureeAnimSoin;
            s.chrono = cfg.delaiSoin;
            z.etape = 0;
            Son.effet('soin');
            if (typeof Succes !== 'undefined') Succes.compter('soins', blesses.length);
        },

        // Il s'arrête le temps de soigner
        vitesse: z => (z.soin.anim > 0 ? 0 : z.vitesse),
        images: z => (z.soin.anim > 0 ? SPRITES_INFIRMIER.soin : SPRITES_INFIRMIER.marche)
    }
};

EXTENSIONS.push({
    reset() { soins = []; },
    maj(dt) {
        for (const s of soins) s.age += dt;
        soins = soins.filter(s => s.age < 0.8);
    },
    dessiner(ctx) {
        ctx.save();
        for (const s of soins) {
            const p = s.age / 0.8;
            ctx.globalAlpha = 1 - p;
            if (s.type === 'onde') {
                // Anneau vert qui s'élargit jusqu'à la portée du soin
                ctx.strokeStyle = '#7aff9a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(s.x, s.y, CONFIG.infirmier.rayonSoin * MONDE.echelleX * p, CONFIG.infirmier.rayonSoin * p, 0, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Petite croix verte qui monte au-dessus du zombie soigné
                const y = s.y - 6 - 18 * p;
                ctx.fillStyle = '#7aff9a';
                ctx.fillRect(s.x - 1.5, y - 5, 3, 10);
                ctx.fillRect(s.x - 5, y - 1.5, 10, 3);
            }
        }
        ctx.restore();
    }
});
