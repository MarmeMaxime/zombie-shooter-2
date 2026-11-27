/* =========================================================================
   DÉCOR DU PONT (chapitre 3, « Mèche courte »), vu de dessus comme la zone
   de combat. Un pont routier enjambe une rivière : on joue sur le tablier,
   entre ses deux parapets (trottoirs, chaussée en asphalte, joints de
   dilatation en acier, fissures, taches, objets abandonnés par ceux qui ont
   fui) ; la rivière coule dessous, et on la voit au-dessus et en dessous du
   pont, plus sombre dans son ombre. À gauche, la rive où Mira est tombée en
   panne (la piste, des roseaux, un panneau) ; à droite, la rive d'où vient la
   horde (la route continue).
   PONT : la géométrie, partagée avec campagne.js (charges sur la chaussée,
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
        const alpha = (a, fn) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const rond = (x, y, rx, ry, couleur) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = couleur; g.fill(); };
        const xG = PONT.riveG, xD = W - PONT.riveD, { haut: yH, bas: yB, parapet: P } = PONT;
        const x0 = xG - 20, x1 = xD + 20;                 // le tablier, culées comprises
        const TROT = 18;                                   // largeur des trottoirs
        const cH = yH + P + TROT, cB = yB - P - TROT;      // la chaussée

        /* ---------- La rivière ---------- */
        rect(0, 0, W, H, '#2c5e6e');
        // Le courant : de longs filets clairs et sombres qui filent vers la droite
        // (le courant lui-même, qui bouge, est dessiné par-dessus : dessiner_eau dans campagne.js)
        for (let i = 0; i < W * 0.4; i++) rect(r() * W, r() * H, 8 + r() * 26, 1, choix(['#336a7a', '#2a5866', '#3a7080']));
        // L'ombre du pont sur l'eau, juste au bord des parapets
        alpha(0.4, () => { rect(x0, yH - 6, x1 - x0, 6, '#0e2630'); rect(x0, yB, x1 - x0, 7, '#0e2630'); });
        // De l'écume qui tourbillonne contre les piles (on devine les piles sous le tablier)
        for (let x = xG + 70; x < xD - 30; x += 150) for (const y of [yH - 10, yB + 9]) {
            for (let k = 0; k < 7; k++) alpha(0.7, () => rect(x - 8 + r() * 16 + k * 3, y + (r() - 0.5) * 4, 3 + r() * 4, 1, '#e8f4f4'));
        }

        /* ---------- Les rives ---------- */
        const rive = (xa, xb, versEau) => {
            rect(xa, 0, xb - xa, H, '#b48e5a');
            for (let i = 0; i < (xb - xa) * 4; i++) rect(xa + r() * (xb - xa), r() * H, 1 + Math.round(r()), 1, choix(['#a47e4c', '#c49e6a', '#9e7846', '#bc9662']));
            // Touffes d'herbe sèche, cailloux
            for (let i = 0; i < (xb - xa) * 0.35; i++) {
                const x = xa + 4 + r() * (xb - xa - 14), y = r() * H;
                if (r() < 0.6) { for (let k = 0; k < 5; k++) rect(x + k * 2 - 2, y - (k % 2) * 2 - 2, 1, 3 + (k % 3), choix(['#7a8a3e', '#8e9c48', '#6a7834'])); }
                else { alpha(0.35, () => rond(x + 2, y + 2, 4, 2.5, '#3a2a1a')); rond(x, y, 3.5, 2.5, choix(['#8e8a80', '#a29e94', '#7a766c'])); rect(x - 2, y - 2, 2, 1, '#c8c4ba'); }
            }
            // La berge : sable mouillé plus sombre, roseaux, puis l'eau qui lèche le bord
            const bord = versEau > 0 ? xb : xa;
            for (let y = 0; y < H; y++) {
                const l = 10 + Math.round(Math.sin(y / 11) * 3 + Math.sin(y / 4.3) * 1.5);
                rect(versEau > 0 ? bord - l : bord, y, l, 1, '#8a6a42');
                rect(versEau > 0 ? bord - 3 : bord, y, 3, 1, '#6e5434');
            }
            for (let y = 6; y < H; y += 9 + r() * 14) {
                if (y > yH - 14 && y < yB + 10) continue;                // pas de roseaux sous le pont
                const x = versEau > 0 ? bord - 6 - r() * 8 : bord + 2 + r() * 8;
                for (let k = 0; k < 4; k++) { rect(x + k * 2, y - 6 - (k % 2) * 3, 1, 7 + (k % 2) * 3, choix(['#5e7a34', '#6e8a3c'])); }
                rect(x + 2, y - 10, 2, 3, '#6a4a2a');                    // un épi de massette
            }
        };
        rive(0, xG, 1);
        rive(xD, W, -1);
        // La piste qui arrive au pont par la gauche (ornières), la route qui repart à droite
        rect(0, 150, xG - 14, 112, '#a0805a');
        for (let i = 0; i < xG * 3; i++) rect(r() * (xG - 14), 150 + r() * 112, 2, 1, choix(['#8e6e46', '#b0906a', '#967650']));
        for (const y of [172, 236]) for (let x = 0; x < xG - 14; x += 2) rect(x, y + Math.round(Math.sin(x / 9) * 1.5), 2, 4, '#7e5e38');
        rect(xD + 14, cH, W - xD - 14, cB - cH, '#4a4c52');
        for (let i = 0; i < (W - xD) * 6; i++) rect(xD + 14 + r() * (W - xD - 14), cH + r() * (cB - cH), 1, 1, choix(['#55575d', '#3e4046', '#5c5e64']));
        for (let x = xD + 20; x < W; x += 46) rect(x, Math.round((cH + cB) / 2) - 1, 24, 3, '#d8d4c8');
        // Un panneau « rivière » à l'entrée du pont (bleu, vagues blanches)
        rect(xG - 46, yH + 22, 2, 22, '#4a4038');
        rect(xG - 56, yH + 6, 22, 18, '#ece8de'); rect(xG - 55, yH + 7, 20, 16, '#2a5aa0');
        for (const y of [yH + 11, yH + 15, yH + 19]) for (let x = 0; x < 16; x++) rect(xG - 53 + x, y + Math.round(Math.sin(x / 2) * 1), 1, 1, '#e8f0f8');

        /* ---------- Le tablier ---------- */
        // Les culées : les deux bouts du pont, gros blocs de béton posés sur les rives
        for (const x of [x0 - 6, x1 - 14]) { alpha(0.35, () => rect(x + 4, yH - 2, 20, yB - yH + 12, '#1e1a14')); rect(x, yH - 8, 20, yB - yH + 16, '#a8a49a'); rect(x, yH - 8, 20, 2, '#cac6bc'); rect(x + 18, yH - 8, 2, yB - yH + 16, '#7a766e'); for (let y = yH; y < yB; y += 16) rect(x + 2, y, 16, 1, '#949086'); }
        // La chaussée : asphalte sombre, son grain, des plaques rapiécées
        rect(x0, cH, x1 - x0, cB - cH, '#4a4c52');
        for (let i = 0; i < (x1 - x0) * (cB - cH) * 0.06; i++) rect(x0 + r() * (x1 - x0), cH + r() * (cB - cH), 1, 1, choix(['#55575d', '#3e4046', '#5c5e64', '#44464c']));
        for (let i = 0; i < W * 0.02; i++) alpha(0.5, () => rect(xG + r() * (xD - xG - 60), cH + 10 + r() * (cB - cH - 40), 26 + r() * 40, 10 + r() * 16, choix(['#54565c', '#424448'])));
        // Les trottoirs : dalles de béton clair, bordure
        for (const [y0, y1, bordure] of [[yH + P, cH, cH - 2], [cB, yB - P, cB]]) {
            rect(x0, y0, x1 - x0, y1 - y0, '#a6a29a');
            for (let i = 0; i < (x1 - x0) * 1.2; i++) rect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 1, 1, choix(['#9a968e', '#b2aea6', '#a09c94']));
            for (let x = x0; x < x1; x += 24) rect(x, y0, 1, y1 - y0, '#8e8a82');
            rect(x0, bordure, x1 - x0, 2, '#c8c4ba');
        }
        // Marquage : ligne médiane discontinue, lignes de rive continues
        const milieu = Math.round((cH + cB) / 2);
        for (let x = x0 + 10; x < x1; x += 46) if (r() > 0.1) { rect(x, milieu - 1, 26, 3, '#d8d4c8'); alpha(0.5, () => rect(x + 3 + r() * 18, milieu - 1, 3, 3, '#4a4c52')); }   // usée par endroits
        for (const y of [cH + 6, cB - 8]) for (let x = x0; x < x1; x += 2) if (r() > 0.05) rect(x, y, 2, 2, '#d8d4c8');
        // Joints de dilatation : des peignes d'acier boulonnés en travers du tablier
        for (let x = xG + 90; x < xD - 40; x += 190) {
            rect(x, yH + P, 6, yB - yH - 2 * P, '#6e7278');
            rect(x, yH + P, 1, yB - yH - 2 * P, '#a6aab0'); rect(x + 5, yH + P, 1, yB - yH - 2 * P, '#3e4248');
            for (let y = yH + P + 2; y < yB - P; y += 4) { rect(x + 2, y, 2, 2, '#2e3236'); }
            for (let y = yH + P + 6; y < yB - P; y += 30) { rect(x - 2, y, 2, 2, '#9a9ea4'); rect(x + 6, y, 2, 2, '#9a9ea4'); }
        }
        // Fissures : de petits traits qui zigzaguent dans l'asphalte
        for (let i = 0; i < W * 0.02; i++) {
            let x = xG + r() * (xD - xG), y = cH + 12 + r() * (cB - cH - 24);
            for (let k = 0; k < 8 + r() * 10; k++) { rect(x, y, 1, 1, '#2e3034'); x += 1; y += Math.round((r() - 0.5) * 2.4); if (r() < 0.12) rect(x, y + 1, 1, 2, '#2e3034'); }
        }
        // Taches : huile (auréoles sombres) et sang (éclaboussures, traînées vers la gauche : ils ont fui par là)
        for (let i = 0; i < W * 0.012; i++) alpha(0.35, () => rond(xG + r() * (xD - xG), cH + 20 + r() * (cB - cH - 40), 8 + r() * 12, 4 + r() * 6, '#1e2024'));
        for (let i = 0; i < W * 0.008; i++) {
            const x = xG + 30 + r() * (xD - xG - 60), y = cH + 20 + r() * (cB - cH - 40);
            alpha(0.85, () => { rond(x, y, 4 + r() * 3, 3 + r() * 2, '#5e1010'); for (let k = 0; k < 5; k++) rond(x + (r() - 0.5) * 16, y + (r() - 0.5) * 10, 1 + r() * 1.5, 1 + r(), '#6e1414'); });
            if (r() < 0.5) alpha(0.5, () => rect(x - 26 - r() * 20, y - 1, 26, 2, '#5a1010'));
        }
        // Ce qu'ont laissé ceux qui ont traversé en courant : plots, une valise ouverte, une chaussure, une poussette
        const plot = (x, y) => { alpha(0.35, () => rond(x + 2, y + 2, 5, 5, '#1a1a1a')); rond(x, y, 5, 5, '#e86a1a'); rond(x, y, 3, 3, '#f0f0e8'); rond(x, y, 1.5, 1.5, '#e86a1a'); };
        plot(xG + 40, cH + 16); plot(xG + 58, cH + 28); plot(xD - 60, cB - 20);
        const valise = (x, y) => {
            alpha(0.35, () => rect(x + 3, y + 3, 26, 16, '#1a1a1a'));
            rect(x, y, 12, 16, '#7a3a2a'); rect(x + 12, y, 12, 16, '#8a4a36'); rect(x + 1, y + 1, 10, 14, '#c8c0b0');
            rect(x + 2, y + 3, 7, 3, '#4a6ab0'); rect(x + 3, y + 8, 6, 4, '#d8d0b8'); rect(x + 24, y + 6, 3, 4, '#3a2a1a');
            rect(x + 32, y + 10, 6, 3, '#d8d0c0'); rect(x + 44, y - 6, 8, 2, '#c8a0d8');   // des vêtements éparpillés
        };
        valise(Math.round(xG + (xD - xG) * 0.52), cH + 40);
        const chaussure = (x, y) => { rect(x, y, 7, 3, '#2a2a2a'); rect(x + 5, y - 1, 2, 2, '#2a2a2a'); rect(x + 1, y, 3, 1, '#5a5a5a'); };
        chaussure(Math.round(xG + (xD - xG) * 0.34), cB - 44);
        const poussette = (x, y) => {
            alpha(0.35, () => rect(x + 3, y + 3, 22, 14, '#1a1a1a'));
            rect(x, y, 22, 14, '#3a5a8a'); rect(x, y, 22, 2, '#5a7aaa'); rect(x + 14, y + 2, 8, 10, '#2a4a7a');
            for (const [a, b] of [[x - 2, y - 2], [x + 18, y - 2], [x - 2, y + 13], [x + 18, y + 13]]) rect(a, b, 5, 3, '#1a1a1a');
            rect(x - 6, y + 4, 6, 2, '#9a9aa0');
        };
        poussette(Math.round(xG + (xD - xG) * 0.8), cB - 34);
        // La carcasse d'une voiture qui a brûlé (vue de dessus), poussée contre le trottoir du haut
        const vx = Math.round(xG + (xD - xG) * 0.66), vy = cH + 2;
        alpha(0.4, () => rect(vx + 4, vy + 4, 56, 28, '#101010'));
        rect(vx, vy, 56, 28, '#3a3230'); rect(vx + 2, vy + 2, 52, 24, '#2a2422');
        rect(vx + 14, vy + 4, 26, 20, '#1a1614'); rect(vx + 16, vy + 6, 22, 16, '#4a3a30');   // l'habitacle, sans toit
        for (let k = 0; k < 14; k++) rect(vx + 4 + r() * 48, vy + 2 + r() * 24, 2, 2, choix(['#8a4a2a', '#6a3a22', '#5a5048']));   // rouille
        for (const [a, b] of [[vx + 6, vy - 2], [vx + 42, vy - 2], [vx + 6, vy + 26], [vx + 42, vy + 26]]) rect(a, b, 8, 4, '#141414');

        // Les parapets : murets de béton à piliers, une glissière d'acier, l'ombre portée sur le trottoir
        for (const [y, sens] of [[yH, 1], [yB - P, -1]]) {
            alpha(0.35, () => rect(x0, sens > 0 ? y + P : y - 4, x1 - x0, 4, '#1e1c18'));
            rect(x0, y, x1 - x0, P, '#b8b4aa');
            rect(x0, sens > 0 ? y : y + P - 1, x1 - x0, 1, '#d8d4ca');
            rect(x0, sens > 0 ? y + P - 1 : y, x1 - x0, 1, '#6e6a62');
            rect(x0, y + 3, x1 - x0, 1, '#8a9096');                                         // la glissière
            for (let x = xG; x < xD; x += 36) { rect(x, y - 1, 5, P + 2, '#a29e94'); rect(x, y - 1, 5, 1, '#e0dcd2'); rect(x + 4, y - 1, 1, P + 2, '#7e7a72'); }
            // Lampadaires tous les 160 (vus de dessus : la crosse et sa lampe au-dessus de la chaussée)
            for (let x = xG + 80; x < xD - 40; x += 160) {
                const yl = sens > 0 ? y + P : y - 7;
                rect(x, sens > 0 ? y - 2 : y + P - 2, 4, 4, '#3a3e44');
                rect(x + 1, yl, 2, 7, '#4a4e54');
                rect(x - 3, sens > 0 ? yl + 7 : yl - 3, 10, 4, '#5a5e64'); rect(x - 1, sens > 0 ? yl + 8 : yl - 2, 6, 2, '#f0e8b0');
            }
        }
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
