/* =========================================================================
   DÉCOR DE L'ARÈNE (chapitre 2, « Le Ring ») : l'intérieur de la grande
   bâtisse où vit Gégé. Une vieille usine : mur de tôle ondulée et de
   briques, hautes fenêtres cassées, poutrelles, la banderole « CHEZ GÉGÉ »,
   un sol de béton taché, des fûts où brûle un feu, des caisses (celles que
   Gégé fait porter), et le ring au milieu : le tapis, son tablier, les
   marches. Les cordes, la foule et les combattants sont dessinés par
   boxe.js, par-dessus. Recalculé si la largeur change.
   ========================================================================= */
const decor_arene = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(1987);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const ombre = (fn, a = 0.3) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const cx = W / 2;

        // Mur du fond : briques en bas, tôle ondulée en haut, hautes fenêtres cassées
        rect(0, 0, W, 140, '#4a3a34');
        for (let y = 60; y < 140; y += 8) for (let x = (y / 8) % 2 ? -10 : 0; x < W; x += 20) { rect(x, y, 19, 7, choix(['#7a4a3a', '#6a3e30', '#844e3c', '#5e382c'])); }
        rect(0, 0, W, 60, '#5e6a72');
        for (let x = 0; x < W; x += 8) { rect(x, 0, 3, 60, '#6e7a82'); rect(x + 5, 0, 1, 60, '#4a545c'); }
        for (let i = 0; i < W / 40; i++) ombre(() => rect(r() * W, r() * 50, 6 + r() * 20, 10 + r() * 30, '#8a5a3a'), 0.4);   // rouille
        for (let x = 40; x < W; x += 150) {
            rect(x, 8, 80, 40, '#2a3038');
            for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) {
                const casse = r() < 0.35;
                rect(x + 3 + k * 19, 11 + j * 18, 17, 16, casse ? '#141820' : '#8aa4b8');
                if (!casse) { ombre(() => rect(x + 5 + k * 19, 13 + j * 18, 5, 12, '#ffffff'), 0.3); }
            }
        }
        // Poutrelles, chaînes qui pendent
        rect(0, 56, W, 6, '#3a3a40'); rect(0, 56, W, 1, '#6a6a70');
        for (let x = 30; x < W; x += 120) { for (let y = 62; y < 62 + 20 + (x % 3) * 8; y += 3) rect(x, y, 2, 2, '#8a8a90'); }
        // La banderole
        const lb = Math.min(260, W * 0.4);
        rect(cx - lb / 2, 70, lb, 34, '#d8d0b8'); rect(cx - lb / 2, 70, lb, 2, '#ece6da'); rect(cx - lb / 2, 102, lb, 2, '#a8a088');
        rect(cx - lb / 2 - 4, 66, 4, 42, '#3a2a1a'); rect(cx + lb / 2, 66, 4, 42, '#3a2a1a');
        g.font = 'bold 20px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#9a2a24'; g.fillText('CHEZ GÉGÉ', cx, 88);
        ombre(() => { g.fillStyle = '#000'; g.fillText('CHEZ GÉGÉ', cx + 1, 89); }, 0.2);

        // Sol de béton
        rect(0, 140, W, H - 140, '#5a5652');
        for (let i = 0; i < W * 4; i++) rect(r() * W, 140 + r() * (H - 140), 2, 1, choix(['#625e5a', '#524e4a', '#6a6662']));
        for (let y = 180; y < H; y += 60) rect(0, y, W, 1, '#4a4642');
        for (let i = 0; i < W / 60; i++) ombre(() => { g.beginPath(); g.ellipse(r() * W, 150 + r() * (H - 160), 10 + r() * 20, 4 + r() * 6, 0, 0, Math.PI * 2); g.fillStyle = '#2a2826'; g.fill(); }, 0.4);

        // Caisses empilées et fûts (de chaque côté)
        const caisse = (x, y, l = 30, h = 24) => { ombre(() => rect(x + 4, y + 4, l, h, '#1a1816'), 0.4); rect(x, y, l, h, '#9a7448'); rect(x, y, l, 2, '#b89060'); rect(x, y + h / 2, l, 1, '#6a4a2a'); rect(x + 2, y + 2, 2, h - 4, '#6a4a2a'); rect(x + l - 4, y + 2, 2, h - 4, '#6a4a2a'); };
        const fut = (x, y) => { ombre(() => rect(x + 3, y + 3, 20, 28, '#1a1816'), 0.4); rect(x, y, 20, 28, '#4a5a6a'); rect(x, y + 6, 20, 2, '#3a4a5a'); rect(x, y + 20, 20, 2, '#3a4a5a'); rect(x + 2, y, 16, 3, '#2a2a2e'); };
        for (const x of [12, W - 52]) { caisse(x, 150); caisse(x + 6, 128, 26, 22); fut(x + 6, 300); }
        if (W > 700) { caisse(70, 160, 34, 26); caisse(W - 110, 162, 34, 26); }

        // Le ring : tablier rouge sur le devant, tapis bleu-gris, marches
        const R = { g: cx - 270, d: cx + 270, haut: 222, bas: 350 };
        ombre(() => rect(R.g - 4, R.bas + 2, R.d - R.g + 16, 30, '#000000'), 0.4);
        rect(R.g - 14, R.bas, R.d - R.g + 28, 26, '#8a2420');                                 // tablier
        rect(R.g - 14, R.bas, R.d - R.g + 28, 3, '#b03028');
        for (let x = R.g; x < R.d; x += 46) rect(x, R.bas + 8, 22, 4, '#6a1a18');
        rect(R.g - 14, R.haut, R.d - R.g + 28, R.bas - R.haut, '#3a5068');                    // tapis
        for (let i = 0; i < (R.d - R.g) * 2; i++) rect(R.g - 14 + r() * (R.d - R.g + 28), R.haut + r() * (R.bas - R.haut), 2, 1, choix(['#42586e', '#344a60', '#4a6078']));
        rect(R.g - 14, R.haut, R.d - R.g + 28, 2, '#5a7088');
        g.globalAlpha = 0.22; g.beginPath(); g.ellipse(cx, (R.haut + R.bas) / 2, 70, 26, 0, 0, Math.PI * 2); g.fillStyle = '#d8d0b8'; g.fill(); g.globalAlpha = 1;   // le cercle au centre
        ombre(() => { g.beginPath(); g.ellipse(cx - 30, R.bas - 30, 14, 5, 0, 0, Math.PI * 2); g.fillStyle = '#5a1a18'; g.fill(); }, 0.4);   // une vieille tache
        // Les marches, sur le côté gauche
        for (let k = 0; k < 3; k++) rect(R.g - 40 + k * 8, R.bas + 18 - k * 9, 30, 9, k % 2 ? '#6a6a70' : '#7a7a80');
        // Lumière au-dessus du ring : un cône pâle, et les bords de la salle dans l'ombre
        const lumiere = g.createRadialGradient(cx, 270, 30, cx, 270, W * 0.55);
        lumiere.addColorStop(0, 'rgba(255, 240, 200, 0.12)'); lumiere.addColorStop(0.6, 'rgba(0,0,0,0)'); lumiere.addColorStop(1, 'rgba(0,0,0,0.45)');
        g.fillStyle = lumiere; g.fillRect(0, 0, W, H);
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
