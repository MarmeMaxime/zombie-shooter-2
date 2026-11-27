/* =========================================================================
   DÉCOR DU PONT (chapitre 3, « Mèche courte »), vu de dessus comme la zone
   de combat. Une large route en béton enjambe une rivière : on joue sur le
   tablier, entre ses deux parapets ; la rivière coule dessous, et on la voit
   au-dessus et en dessous du pont. À gauche, la rive où Mira est tombée en
   panne (sa jeep, la piste) ; à droite, la rive d'où vient la horde.
   PONT : la géométrie, partagée avec campagne.js (charges sur les parapets,
   effondrement du tablier entre les deux culées).
   Toujours le même (hasard à graine) ; recalculé si la largeur change.
   ========================================================================= */
const PONT = {
    riveG: 150,        // fin de la rive gauche (la culée du pont commence là)
    riveD: 84,         // largeur de la rive droite
    haut: 20,          // haut du tablier (au-dessus : la rivière)
    bas: 384,          // bas du tablier (en dessous : la rivière)
    parapet: 7         // épaisseur des parapets
};

const decor_pont = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(3141);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const ombre = (fn, a = 0.3) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const xG = PONT.riveG, xD = W - PONT.riveD, { haut: yH, bas: yB, parapet: P } = PONT;

        // La rivière : bleu-vert profond, reflets et vaguelettes qui filent vers le bas
        rect(0, 0, W, H, '#2a5a6a');
        for (let i = 0; i < W * 0.6; i++) rect(r() * W, r() * H, 6 + r() * 18, 1, choix(['#3a7282', '#24505e', '#4a8696']));
        for (let i = 0; i < W * 0.08; i++) ombre(() => rect(r() * W, r() * H, 2 + r() * 6, 1, '#d8eef0'), 0.5);

        // Les rives : terre sèche et herbes, avec une berge plus sombre au bord de l'eau
        const rive = (x0, x1, versEau) => {
            rect(x0, 0, x1 - x0, H, '#b08a58');
            for (let i = 0; i < (x1 - x0) * 3; i++) rect(x0 + r() * (x1 - x0), r() * H, 1, 1, choix(['#a07a4a', '#c09a66', '#9a7444']));
            for (let i = 0; i < (x1 - x0) * 0.25; i++) { const x = x0 + r() * (x1 - x0), y = r() * H; rect(x, y, 2, 4, '#6a7a3a'); rect(x + 2, y + 1, 1, 3, '#7e8e44'); }
            // Berge : de la boue, puis l'eau qui lèche le bord
            const bx = versEau > 0 ? x1 - 8 : x0;
            rect(bx, 0, 8, H, '#7a5a38');
            for (let y = 0; y < H; y += 3) rect(versEau > 0 ? x1 - 2 - r() * 4 : x0 + r() * 4 - 2, y, 4, 3, '#2a5a6a');
        };
        rive(0, xG, 1);
        rive(xD, W, -1);

        // Le tablier : béton clair, joints de dilatation, nids-de-poule, traces de pneus
        rect(xG - 20, yH, xD - xG + 40, yB - yH, '#8e8a82');
        for (let i = 0; i < W * 3; i++) rect(xG - 20 + r() * (xD - xG + 40), yH + r() * (yB - yH), 1, 1, choix(['#827e76', '#9a968e', '#86827a']));
        for (let i = 0; i < W * 0.03; i++) ombre(() => rect(xG + r() * (xD - xG), yH + 20 + r() * (yB - yH - 40), 30 + r() * 60, 8 + r() * 14, choix(['#7a766e', '#9e9a92'])), 0.5);
        for (let x = xG + 60; x < xD - 20; x += 120) { rect(x, yH + P, 3, yB - yH - 2 * P, '#5e5a54'); rect(x + 3, yH + P, 1, yB - yH - 2 * P, '#a6a29a'); }
        for (let i = 0; i < W * 0.012; i++) { const x = xG + 20 + r() * (xD - xG - 40), y = yH + 30 + r() * (yB - yH - 60); ombre(() => g.fillRect(x + 2, y + 2, 10, 6), 0.4); rect(x, y, 10, 6, '#5a5650'); rect(x + 2, y + 1, 6, 2, '#4a4640'); }
        // Marquage au sol : ligne blanche discontinue au milieu, bandes de rive
        const milieu = Math.round((yH + yB) / 2);
        for (let x = xG; x < xD; x += 46) if (r() > 0.12) rect(x, milieu - 1, 26, 3, '#d8d4c8');
        for (const y of [yH + P + 8, yB - P - 10]) for (let x = xG; x < xD; x += 2) if (r() > 0.08) rect(x, y, 2, 2, '#d8d4c8');
        // Taches de sang et traînées : la horde est déjà passée par ici
        for (let i = 0; i < W * 0.01; i++) ombre(() => rect(xG + r() * (xD - xG), yH + 20 + r() * (yB - yH - 40), 6 + r() * 14, 3 + r() * 6, '#6a1414'), 0.6);

        // Les parapets : murets de béton avec leurs piliers, et l'ombre portée sur le tablier
        for (const [y, sens] of [[yH, 1], [yB - P, -1]]) {
            ombre(() => rect(xG - 20, sens > 0 ? y + P : y - 4, xD - xG + 40, 4, '#2a2824'), 0.35);
            rect(xG - 20, y, xD - xG + 40, P, '#b4b0a6');
            rect(xG - 20, sens > 0 ? y : y + P - 1, xD - xG + 40, 1, '#d4d0c6');
            rect(xG - 20, sens > 0 ? y + P - 1 : y, xD - xG + 40, 1, '#6e6a62');
            for (let x = xG; x < xD; x += 40) { rect(x, y - 1, 6, P + 2, '#9e9a90'); rect(x, y - 1, 6, 1, '#dcd8ce'); }
            // Lampadaires tous les 160 (vus de dessus : le mât et sa tête)
            for (let x = xG + 80; x < xD - 40; x += 160) { rect(x, y + (sens > 0 ? -6 : P), 3, 6, '#3a3e44'); rect(x - 4, y + (sens > 0 ? -9 : P + 5), 11, 4, '#4a4e54'); rect(x - 2, y + (sens > 0 ? -8 : P + 6), 7, 2, '#e8e0a0'); }
        }
        // Les culées : les deux bouts du pont posés sur les rives (gros blocs de béton)
        for (const x of [xG - 24, xD + 4]) { rect(x, yH - 6, 20, yB - yH + 12, '#a6a298'); rect(x, yH - 6, 20, 2, '#c8c4ba'); rect(x + 18, yH - 6, 2, yB - yH + 12, '#7a766e'); }
        // Panneau à l'entrée du pont (à gauche, sur la rive)
        rect(xG - 50, yH + 6, 3, 22, '#4a4038');
        rect(xG - 64, yH + 2, 30, 14, '#2a5aa0'); rect(xG - 63, yH + 3, 28, 1, '#5a8ad0');
        for (let k = 0; k < 4; k++) rect(xG - 60 + k * 6, yH + 8, 4, 2, '#e8e8e0');

        // La piste qui arrive au pont par la gauche, et la jeep de Mira, en panne sur le bas-côté
        rect(0, 150, xG - 20, 110, '#9a7a4e');
        for (let i = 0; i < xG * 2; i++) rect(r() * (xG - 20), 150 + r() * 110, 2, 1, choix(['#8a6a40', '#a8885a']));
        for (const y of [175, 230]) for (let x = 0; x < xG - 20; x += 3) rect(x, y + Math.round(Math.sin(x / 9) * 1.5), 2, 3, '#7a5a34');   // ornières

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
