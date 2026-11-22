/* =========================================================================
   LE CAMP (derrière le soldat, à gauche de l'écran)
   Dessiné par-dessus le désert de combat_decor.js, dans le même pixel art :
   terre battue, fin des voies ferrées (heurtoirs), mur de sacs de sable,
   tentes, entrée du labo, groupe électrogène, caisses, bidons, bois.
   decor_camp(largeur, hauteur, etape) : etape = avancement de la campagne
   (0 pour l'instant ; les prochains chapitres ajouteront des constructions).
   Le feu de camp est animé à part : dessiner_feu(ctx, t).
   ========================================================================= */
const CAMP = {
    bord: 236,                       // x du mur de sacs de sable (le soldat se tient devant)
    feu: { x: 172, y: 318 },         // feu de camp
    labo: { x: 84, y: 142 },         // coin haut-gauche de l'entrée du labo (64×64)
    sergent: { x: 150, y: 120 },     // place du Sergent devant le labo (64×64)
    jeep: { x: 26, y: 214 }          // jeep garée (96×96)
};

const decor_camp = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H, etape) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(decor_combat(W, H), 0, 0);
        const r = hasard(7);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const ombre = fn => { g.globalAlpha = 0.3; fn(); g.globalAlpha = 1; };
        const B = CAMP.bord;

        // Terre battue du camp (elle recouvre la fin des rails), grain et traces de pas
        rect(0, 0, B, H, '#b28456');
        for (let i = 0; i < B * H * 0.012; i++) rect(r() * B, r() * H, 1 + r() * 2, 1, choix(['#a27448', '#c0946a', '#9a6c42', '#b88c60']));
        for (let i = 0; i < 40; i++) { g.globalAlpha = 0.35; rect(r() * (B - 10), r() * H, 2, 3, '#7e5634'); g.globalAlpha = 1; }
        // Traces de pneus de la jeep jusqu'au mur
        for (const yt of [262, 274]) for (let x = 0; x < B; x += 2) { g.globalAlpha = 0.3; rect(x, yt + Math.round(Math.sin(x / 30) * 2), 1, 3, '#7e5634'); g.globalAlpha = 1; }

        // Fin des voies : heurtoirs rouges et blancs juste devant le mur
        for (const yv of [118, 202]) {
            ombre(() => rect(B + 17, yv + 2, 8, 28, '#5a3420'));
            rect(B + 14, yv, 6, 28, '#6a4a2e');
            for (let y = yv; y < yv + 28; y += 4) rect(B + 14, y, 6, 2, Math.floor((y - yv) / 4) % 2 ? '#ece6da' : '#c83030');
            rect(B + 14, yv, 6, 1, '#f0e8dc');
        }

        // Mur de sacs de sable (deux rangées décalées), avec une entrée pour la jeep
        for (let y = 4; y < H - 6; y += 7) {
            if (y > 250 && y < 290) continue;
            for (const dx of [-16, -4]) {
                const x = B + dx + ((y / 7) % 2 ? 3 : 0);
                ombre(() => rect(x + 3, y + 4, 12, 3, '#5a3420'));
                rect(x, y, 12, 6, '#b9a578'); rect(x, y, 12, 1, '#d6c49a'); rect(x, y + 5, 12, 1, '#8a7a54');
                rect(x + 5, y + 1, 1, 4, '#9a8a60');
            }
        }
        // Chevaux de frise en bois dans l'entrée
        for (const y of [254, 282]) { rect(B - 18, y, 22, 2, '#6a4a2e'); for (let k = 0; k < 4; k++) rect(B - 16 + k * 6, y - 3, 2, 8, '#5a3a24'); }

        // Objets, du fond vers le devant
        const poser = (img, x, y, ombreL = 0) => {
            if (ombreL) ombre(() => { g.beginPath(); g.ellipse(x + img.width / 2 + 4, y + img.height - 3, ombreL, 4, 0, 0, Math.PI * 2); g.fillStyle = '#5a3420'; g.fill(); });
            g.drawImage(img, Math.round(x), Math.round(y));
        };
        poser(OBJETS_CAMP.tente, 6, 8, 26);
        poser(OBJETS_CAMP.tente, 96, 22, 26);
        // Caisses de munitions et bidons près des tentes
        const caisse = (x, y) => { ombre(() => rect(x + 3, y + 3, 14, 10, '#5a3420')); rect(x, y, 14, 10, '#6a7040'); rect(x, y, 14, 1, '#8a9258'); rect(x, y + 4, 14, 1, '#4a5030'); rect(x + 5, y + 6, 4, 2, '#e8c24a'); };
        const bidon = (x, y) => { ombre(() => rect(x + 2, y + 2, 7, 11, '#5a3420')); rect(x, y, 7, 11, '#4e5a30'); rect(x + 1, y + 1, 5, 1, '#6e7a44'); rect(x + 4, y - 2, 2, 2, '#2a2a2a'); };
        caisse(70, 70); caisse(74, 60); bidon(188, 82); bidon(197, 86);

        // Entrée du labo, câble du groupe électrogène, groupe électrogène
        poser(PORTE_LABO.camp, CAMP.labo.x, CAMP.labo.y, 30);
        for (let x = CAMP.labo.x + 56; x < 190; x += 2) rect(x, 196 + Math.round(Math.sin(x / 9) * 2), 2, 1, '#1a1a1a');
        ombre(() => rect(193, 192, 26, 14, '#5a3420'));
        rect(188, 186, 24, 16, '#c8a030'); rect(188, 186, 24, 2, '#e8c050'); rect(190, 190, 8, 8, '#3a3a3a'); rect(200, 190, 9, 2, '#3a3a3a'); rect(200, 194, 9, 2, '#3a3a3a');
        rect(209, 180, 2, 6, '#2a2a2a');

        // Tente de commandement du Sergent, avec son fanion
        poser(OBJETS_CAMP.tenteCommandement, 8, 286, 30);
        caisse(80, 348); caisse(82, 338);

        // Feu de camp : cercle de pierres, bûches (les flammes sont animées à part)
        const { x: fx, y: fy } = CAMP.feu;
        ombre(() => { g.beginPath(); g.ellipse(fx + 2, fy + 4, 15, 6, 0, 0, Math.PI * 2); g.fillStyle = '#3a2010'; g.fill(); });
        for (let a = 0; a < 10; a++) {
            const x = fx + Math.cos(a / 10 * Math.PI * 2) * 12, y = fy + Math.sin(a / 10 * Math.PI * 2) * 5;
            rect(x - 2, y - 2, 4, 3, '#8a8478'); rect(x - 2, y - 2, 4, 1, '#b4aea0');
        }
        rect(fx - 8, fy - 2, 16, 3, '#5a3a24'); rect(fx - 3, fy - 5, 3, 9, '#4a2e1c'); rect(fx - 6, fy, 12, 2, '#2a1a10');
        // Bûches de réserve et rondins pour s'asseoir
        for (let k = 0; k < 3; k++) { rect(fx + 24, fy - 6 + k * 4, 14, 3, '#6a4a2e'); rect(fx + 24, fy - 6 + k * 4, 2, 3, '#c8a070'); }
        rect(fx - 30, fy + 6, 16, 5, '#6a4a2e'); rect(fx - 30, fy + 6, 3, 5, '#c8a070');

        void etape;   // les prochains chapitres feront grandir le camp ici
        return c;
    }

    return (largeur = MONDE.largeur, hauteur = MONDE.hauteur, etape = 0) => {
        const W = Math.round(largeur), cle = W + 'x' + hauteur + ':' + etape;
        if (!caches.has(cle)) {
            if (caches.size > 4) caches.clear();
            caches.set(cle, construire(W, hauteur, etape));
        }
        return caches.get(cle);
    };
})();

// Flammes du feu de camp (t en secondes) : quelques langues de feu qui dansent, et des braises
function dessiner_feu(ctx, t) {
    const { x, y } = CAMP.feu;
    const couleurs = ['#ff5a1a', '#ff8a2a', '#ffc040', '#fff0a0'];
    for (let k = 0; k < 4; k++) {
        const h = 9 - k * 2 + Math.round(Math.sin(t * 9 + k * 1.7) * 2);
        const l = 10 - k * 2.5;
        ctx.fillStyle = couleurs[k];
        ctx.fillRect(Math.round(x - l / 2 + Math.sin(t * 7 + k) * 1.5), Math.round(y - 3 - h), Math.round(l), h);
    }
    ctx.fillStyle = '#ffb040';
    for (let k = 0; k < 3; k++) {
        const age = (t * 0.8 + k / 3) % 1;
        ctx.globalAlpha = 1 - age;
        ctx.fillRect(Math.round(x - 2 + Math.sin(t * 3 + k * 2) * 4), Math.round(y - 12 - age * 18), 1, 1);
    }
    ctx.globalAlpha = 1;
}
