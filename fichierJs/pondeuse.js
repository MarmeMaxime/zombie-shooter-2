/* =========================================================================
   LA PONDEUSE ET SES LARVES
   Très lente, 1 PV. Au premier tir, elle éclate et libère des larves rapides sur sa
   ligne et les lignes voisines : tuée de loin, on a le temps de les abattre ;
   tuée au contact, elles arrivent tout de suite sur le joueur.
   Réglages : CONFIG.pondeuse, CONFIG.larve ; sprites : assets/monstres/pondeuse/ et larve/.
   ========================================================================= */
let eclaboussures = [];   // flaques et gouttes jaunâtres quand elle éclate

TYPES_ZOMBIE.pondeuse = {
    config: CONFIG.pondeuse,
    images: SPRITES_PONDEUSE.marche,
    mort: { style: 'dos', couleurs: ['#dbe35c', '#c8c28c', '#8fa03a'], particules: 26 },
    comportement: {
        mort(z) {
            const cfg = CONFIG.pondeuse;
            const t = CONFIG.larve.taille, centre = (z.taille - t) / 2;   // centre de la larve sur celui de la Pondeuse
            const yMin = CONFIG.margeHaut + centre, yMax = MONDE.hauteur - CONFIG.margeBas + centre;
            for (let k = 0; k < cfg.larves; k++) {
                const larve = creer_zombie('larve', MONDE.largeur, MONDE.hauteur);
                // En éventail vertical autour de la ligne de la Pondeuse
                larve.x = z.x + centre + k * 6;
                larve.y = Math.max(yMin, Math.min(yMax, z.y + centre + (k - (cfg.larves - 1) / 2) * cfg.ecartLarves));
                larve.etape = k * 2;
            }
            eclaboussures.push({ x: z.x + 26, y: z.y + 40, age: 0 });
            Son.effet('eclatement');
        }
    }
};

TYPES_ZOMBIE.larve = {
    config: CONFIG.larve,
    images: SPRITES_PONDEUSE.larve,
    mort: { style: 'face', couleurs: ['#ece4cc', '#dbe35c', '#b8ab88'], particules: 6 }
};

EXTENSIONS.push({
    reset() { eclaboussures = []; },
    maj(dt) {
        for (const e of eclaboussures) e.age += dt;
        eclaboussures = eclaboussures.filter(e => e.age < 0.6);
    },
    // Une gerbe qui s'étale puis s'efface
    dessiner(ctx) {
        ctx.save();
        for (const e of eclaboussures) {
            const p = e.age / 0.6;
            ctx.globalAlpha = 0.8 * (1 - p);
            ctx.fillStyle = '#c8d24a';
            for (let k = 0; k < 8; k++) {
                const a = k * Math.PI / 4 + 0.3;
                const r = 6 + 34 * p;
                ctx.beginPath();
                ctx.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.5, 4 * (1 - p) + 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
});
