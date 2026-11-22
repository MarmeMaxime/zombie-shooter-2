/* =========================================================================
   DÉCOR DU MÉTRO (chapitre 2, « Terminus » : Brutus quitte la ville par les
   tunnels), vu de dessus comme la zone de combat : un quai en haut et un en
   bas (carrelage, bande jaune d'éveil, piliers, bancs, le panneau
   « TERMINUS »), deux voies (ballast, traverses, rails, rail d'alimentation
   sous son capot jaune), une rame abandonnée, et un brancard renversé :
   l'hôpital n'est pas loin. Le tout se joue dans le noir (campagne.js).
   À l'échelle des personnages (64 de haut).
   Toujours le même (hasard à graine) ; recalculé si la largeur change.
   ========================================================================= */
const decor_metro = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(2077);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const ombre = (fn, a = 0.3) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const rond = (x, y, rx, ry, couleur) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = couleur; g.fill(); };

        const MUR_H = 14, QUAI_H = 70, QUAI_B = 330, MUR_B = H - 14;

        // Ballast des voies : gravier sombre
        rect(0, QUAI_H, W, QUAI_B - QUAI_H, '#34302c');
        for (let i = 0; i < W * 6; i++) rect(r() * W, QUAI_H + r() * (QUAI_B - QUAI_H), 2, 2, choix(['#3e3a34', '#2a2622', '#48433c', '#302c28']));

        // Deux voies : traverses en béton, rails, rail d'alimentation sous capot jaune
        for (const yv of [138, 262]) {
            for (let x = -4; x < W; x += 24) { ombre(() => rect(x + 3, yv - 28, 12, 60, '#141210'), 0.4); rect(x, yv - 30, 12, 60, '#6a6660'); rect(x, yv - 30, 12, 2, '#86827a'); }
            for (const dy of [-18, 14]) { rect(0, yv + dy, W, 4, '#8a8a92'); rect(0, yv + dy, W, 1, '#c8c8d0'); rect(0, yv + dy + 4, W, 1, '#1a1a1c'); }
            const yr = yv + (yv < 200 ? 40 : -46);
            rect(0, yr, W, 6, '#c8a030'); rect(0, yr, W, 2, '#e8c050'); rect(0, yr + 6, W, 1, '#1a1a1c');
            for (let x = 10; x < W; x += 60) rect(x, yr + (yv < 200 ? -6 : 6), 4, 6, '#5a5650');
        }
        // Caniveau au milieu, flaques, papiers, sang
        rect(0, 199, W, 3, '#1e1c1a');
        for (let i = 0; i < W / 70; i++) { const x = r() * W, y = QUAI_H + 16 + r() * (QUAI_B - QUAI_H - 32); rond(x, y, 10 + r() * 14, 4 + r() * 5, '#22262c'); ombre(() => rond(x - 3, y - 1, 5, 2, '#6a7a8a'), 0.5); }
        for (let i = 0; i < W / 30; i++) rect(r() * W, QUAI_H + r() * (QUAI_B - QUAI_H), 5, 4, choix(['#c8c0a8', '#d8d4c8', '#a8a090']));
        for (let i = 0; i < W / 120; i++) ombre(() => rond(r() * W, QUAI_H + 14 + r() * (QUAI_B - QUAI_H - 28), 5 + r() * 9, 3 + r() * 5, '#5a1a18'), 0.6);

        // Quais : carrelage, bande jaune à picots au bord, ligne blanche
        for (const [y0, y1, bordHaut] of [[MUR_H, QUAI_H, false], [QUAI_B, MUR_B, true]]) {
            rect(0, y0, W, y1 - y0, '#b4ac9c');
            for (let i = 0; i < W * 0.8; i++) rect(r() * W, y0 + r() * (y1 - y0), 1, 1, choix(['#a8a090', '#c0b8a8', '#9c9484']));
            for (let x = 0; x < W; x += 18) rect(x, y0, 1, y1 - y0, '#9a9282');
            for (let y = y0 + 18; y < y1; y += 18) rect(0, y, W, 1, '#9a9282');
            const yb = bordHaut ? y0 : y1 - 10;
            rect(0, yb, W, 10, '#d8b030');
            for (let x = 2; x < W; x += 5) for (let k = 2; k < 9; k += 4) rect(x, yb + k, 2, 2, '#b89020');
            rect(0, bordHaut ? y0 - 2 : y1, W, 2, '#ece6da');
            ombre(() => rect(0, bordHaut ? y0 - 6 : y1 + 2, W, 4, '#000000'), 0.4);   // ombre du quai sur les voies
        }
        // Murs carrelés de blanc, en haut et en bas, avec le nom de la station
        for (const [y0, h] of [[0, MUR_H], [MUR_B, H - MUR_B]]) {
            rect(0, y0, W, h, '#d8d8d0');
            for (let x = 0; x < W; x += 8) rect(x, y0, 1, h, '#b8b8b0');
            rect(0, y0 + Math.floor(h / 2), W, 1, '#b8b8b0');
            rect(0, y0 === 0 ? h - 2 : y0, W, 2, '#6a6a66');
        }
        g.font = 'bold 9px monospace';
        g.textBaseline = 'middle';
        for (let x = 40; x < W; x += 260) {
            rect(x, 1, 76, 12, '#1e3a7a'); rect(x + 1, 2, 74, 10, '#2a4e9a');
            g.fillStyle = '#ffffff'; g.fillText('TERMINUS', x + 14, 7.5);
        }

        // Piliers du quai, bancs, poubelles
        for (const [y0, y1] of [[MUR_H, QUAI_H - 12], [QUAI_B + 12, MUR_B]]) {
            const cy = Math.round((y0 + y1) / 2);
            for (let x = 120 + r() * 20; x < W; x += 200) {
                ombre(() => rect(x + 4, cy - 10, 24, 24, '#1e1e22'), 0.4);
                rect(x, cy - 14, 24, 24, '#e8e4dc'); rect(x, cy - 14, 24, 3, '#ffffff'); rect(x + 21, cy - 14, 3, 24, '#a8a49c');
                rect(x + 6, cy - 8, 12, 12, '#2a4e9a');                                     // le carreau bleu de la ligne
            }
            for (let x = 40 + r() * 30; x < W; x += 200) {
                if (x > 60 && x < 210 && y0 < 100) continue;                                // place du brancard
                ombre(() => rect(x + 3, cy - 4, 48, 12, '#1e1e22'), 0.35);
                rect(x, cy - 7, 48, 12, '#4a4a50');
                for (let k = 0; k < 4; k++) { rect(x + 2 + k * 12, cy - 6, 10, 10, '#d86a2a'); rect(x + 2 + k * 12, cy - 6, 10, 2, '#f08a40'); }
            }
        }

        // Le brancard de l'hôpital, renversé sur le quai (drap taché, une roulette en l'air)
        const BX = 96, BY = MUR_H + 12;
        ombre(() => rect(BX + 4, BY + 4, 64, 26, '#1e1e22'), 0.45);
        rect(BX, BY, 64, 26, '#8a9098'); rect(BX + 3, BY + 3, 58, 20, '#e8ecee'); rect(BX + 3, BY + 3, 58, 3, '#ffffff');
        rond(BX + 40, BY + 14, 8, 5, '#9a2a24'); rond(BX + 46, BY + 17, 4, 3, '#7a1c18');
        rect(BX + 6, BY + 8, 14, 10, '#f4f4f0');                                               // l'oreiller
        for (const [x, y] of [[BX - 3, BY - 3], [BX + 61, BY - 3], [BX - 3, BY + 23], [BX + 64, BY + 26]]) { rect(x, y, 6, 6, '#1a1a1a'); rect(x + 2, y + 2, 2, 2, '#6a6a70'); }
        rect(BX + 70, BY + 6, 4, 4, '#c83030'); rect(BX + 69, BY + 7, 6, 2, '#c83030'); rect(BX + 71, BY + 5, 2, 6, '#c83030');   // la croix rouge tombée

        // Une rame abandonnée sur la voie du haut, vers la droite (vue du toit)
        if (W > 520) {
            const RX = Math.round(W * 0.62), RY = 138;
            ombre(() => rect(RX + 6, RY - 22, 320, 52, '#0e0e10'), 0.5);
            for (let v = 0; v < 2; v++) {
                const vx = RX + v * 164;
                rect(vx, RY - 26, 158, 52, '#c8ccd0'); rect(vx, RY - 26, 158, 3, '#e8ecee'); rect(vx, RY + 22, 158, 4, '#8a8e94');
                rect(vx, RY + 8, 158, 6, '#2a4e9a');                                         // bande bleue
                for (let k = 16; k < 150; k += 46) { rect(vx + k, RY - 18, 24, 14, '#9a9ea4'); rect(vx + k + 3, RY - 15, 18, 8, '#6a6e74'); }   // ventilations
                rect(vx, RY - 26, 3, 52, '#6a6e74'); rect(vx + 155, RY - 26, 3, 52, '#6a6e74');
            }
            rect(RX + 158, RY - 10, 6, 20, '#3a3a3e');                                       // soufflet entre les voitures
            rect(RX - 4, RY - 20, 4, 40, '#2a3440'); rect(RX - 4, RY - 18, 4, 5, '#f0e0a0'); rect(RX - 4, RY + 13, 4, 5, '#f0e0a0');   // la cabine, phares éteints
        }
        // Tout au fond à droite, la bouche du tunnel : de plus en plus noir
        const fond = g.createLinearGradient(W - 90, 0, W, 0);
        fond.addColorStop(0, 'rgba(0,0,0,0)'); fond.addColorStop(1, 'rgba(0,0,0,0.75)');
        g.fillStyle = fond; g.fillRect(W - 90, QUAI_H, 90, QUAI_B - QUAI_H);
        return c;
    }

    return (largeur = MONDE.largeur, hauteur = MONDE.hauteur) => {
        const W = Math.round(largeur), cle = W + 'x' + hauteur;
        if (!caches.has(cle)) {
            if (caches.size > 3) caches.clear();
            caches.set(cle, construire(W, hauteur));
        }
        return caches.get(cle);
    };
})();
