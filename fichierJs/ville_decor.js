/* =========================================================================
   DÉCOR DE LA VILLE (chapitre 2, l'histoire de Brutus), vu de dessus comme
   la zone de combat : toits d'immeubles en haut et en bas, trottoirs
   dallés, une grande avenue (lignes, passage piéton, plaques d'égout,
   nids-de-poule, taches), voitures abandonnées, lampadaires, arbres,
   bouche d'incendie, poubelles… et, sur le trottoir, un piano droit et des
   cartons de déménagement.
   Toujours le même (hasard à graine) ; recalculé si la largeur change.
   ========================================================================= */
const decor_ville = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(1312);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const ombre = (fn, a = 0.3) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const rond = (x, y, rx, ry, couleur) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = couleur; g.fill(); };

        // Les bandes de la rue, de haut en bas
        const TOIT_H = 34, TROTTOIR_H = 70, ROUTE_H = 73, ROUTE_B = 345, TROTTOIR_B = 372;

        // Asphalte, avec son grain et des plaques plus claires (rapiéçages)
        rect(0, ROUTE_H, W, ROUTE_B - ROUTE_H, '#4a4a50');
        for (let i = 0; i < W * 0.04; i++) ombre(() => rect(r() * W, ROUTE_H + r() * (ROUTE_B - ROUTE_H - 20), 20 + r() * 50, 8 + r() * 16, choix(['#56565c', '#424248', '#5a5a5e'])), 0.5);
        for (let i = 0; i < W * 4; i++) rect(r() * W, ROUTE_H + r() * (ROUTE_B - ROUTE_H), 1, 1, choix(['#55555b', '#3e3e44', '#606066', '#46464c']));

        // Marquage : double ligne jaune au milieu, pointillés blancs des voies
        const MILIEU = Math.round((ROUTE_H + ROUTE_B) / 2);
        for (const y of [MILIEU - 3, MILIEU + 2]) for (let x = 0; x < W; x += 2) if (r() > 0.06) rect(x, y, 2, 1, '#d8b838');
        for (const y of [Math.round((ROUTE_H + MILIEU) / 2), Math.round((MILIEU + ROUTE_B) / 2)])
            for (let x = 6; x < W; x += 36) if (r() > 0.1) rect(x, y, 16, 2, '#d8d8d0');

        // Passage piéton (vers la gauche de l'écran)
        const PX = Math.round(W * 0.2);
        for (let y = ROUTE_H + 4; y < ROUTE_B - 4; y += 12) { rect(PX, y, 30, 6, '#d8d8d0'); for (let k = 0; k < 8; k++) rect(PX + r() * 30, y + r() * 6, 2, 1, '#9a9a98'); }

        // Trottoirs dallés, bordures
        for (const [y0, y1] of [[TOIT_H, TROTTOIR_H], [ROUTE_B, TROTTOIR_B]]) {
            rect(0, y0, W, y1 - y0, '#a8a49c');
            for (let i = 0; i < W * 0.6; i++) rect(r() * W, y0 + r() * (y1 - y0), 1, 1, choix(['#9c988f', '#b4b0a8', '#a09c94']));
            for (let x = 0; x < W; x += 12) rect(x, y0, 1, y1 - y0, '#928e86');
            for (let y = y0 + 12; y < y1; y += 12) rect(0, y, W, 1, '#928e86');
        }
        rect(0, TROTTOIR_H, W, 3, '#cfcbc2'); rect(0, TROTTOIR_H + 3, W, 1, '#2e2e32');
        rect(0, ROUTE_B - 3, W, 3, '#cfcbc2'); rect(0, ROUTE_B - 4, W, 1, '#2e2e32');

        // Toits des immeubles (en haut et en bas), avec leurs bords, aérations et climatiseurs
        const toits = (y0, h, versBas) => {
            let x = -r() * 30;
            while (x < W) {
                const l = 50 + r() * 90, couleur = choix(['#7a6a5a', '#8a5a4a', '#5e6470', '#6e6a62', '#7e5e50']);
                rect(x, y0, l, h, couleur);
                rect(x, versBas ? y0 : y0 + h - 2, l, 2, '#bab2a4');           // corniche côté rue
                rect(x, y0, 2, h, '#3e3a36');                                   // séparation entre immeubles
                for (let k = 0; k < 2 + r() * 3; k++) {
                    const ax = x + 6 + r() * (l - 20), ay = y0 + 4 + r() * (h - 14);
                    if (r() > 0.5) { ombre(() => rect(ax + 2, ay + 2, 10, 7, '#2a2624')); rect(ax, ay, 10, 7, '#b8bcc0'); rect(ax + 2, ay + 2, 6, 3, '#6a6e72'); }
                    else { rect(ax, ay, 5, 5, '#3a3a3e'); rect(ax + 1, ay + 1, 3, 3, '#1e1e22'); }
                }
                x += l;
            }
            ombre(() => rect(0, versBas ? y0 - 4 : y0 + h, W, 4, '#1e1e22'), 0.35);   // ombre portée sur le trottoir
        };
        toits(0, TOIT_H, false);
        toits(TROTTOIR_B, H - TROTTOIR_B, true);

        // Plaques d'égout, nids-de-poule, fissures, taches d'huile, sang séché, papiers
        for (let i = 0; i < W / 160; i++) { const x = 40 + r() * (W - 80), y = ROUTE_H + 20 + r() * (ROUTE_B - ROUTE_H - 40); rond(x, y, 7, 5, '#2e2e32'); rond(x, y, 6, 4, '#3a3a40'); for (let k = -4; k <= 4; k += 2) rect(x + k, y - 1, 1, 3, '#2a2a2e'); }
        for (let i = 0; i < W / 70; i++) { const x = r() * W, y = ROUTE_H + 8 + r() * (ROUTE_B - ROUTE_H - 16); rond(x, y, 4 + r() * 5, 2 + r() * 3, '#2c2c30'); rond(x - 1, y - 1, 2, 1, '#38383c'); }
        for (let i = 0; i < W / 40; i++) { let x = r() * W, y = ROUTE_H + r() * (ROUTE_B - ROUTE_H); for (let k = 0; k < 8; k++) { rect(x, y, 1, 1, '#2a2a2e'); x += 1; y += Math.round(r() * 2 - 1); } }
        for (let i = 0; i < W / 90; i++) ombre(() => rond(r() * W, ROUTE_H + 10 + r() * (ROUTE_B - ROUTE_H - 20), 6 + r() * 8, 3 + r() * 4, '#1a1a20'), 0.45);
        for (let i = 0; i < W / 110; i++) ombre(() => rond(r() * W, ROUTE_H + 10 + r() * (ROUTE_B - ROUTE_H - 20), 3 + r() * 6, 2 + r() * 3, '#5a1a18'), 0.6);
        for (let i = 0; i < W / 25; i++) rect(r() * W, ROUTE_H + r() * (ROUTE_B - ROUTE_H), 3, 2, choix(['#d8d4c8', '#c8c0a8', '#e0dcd0']));

        // Voitures abandonnées (vues de dessus), pas trop près de la gauche : on y tient la rue
        const voiture = (x, y, couleur, angle) => {
            g.save(); g.translate(x, y); g.rotate(angle);
            ombre(() => rect(-17, -7, 38, 18, '#141418'), 0.4);
            rect(-19, -9, 38, 18, couleur);
            ombre(() => rect(-19, -9, 38, 1, '#ffffff'));                                     // reflet sur la carrosserie
            rect(-9, -7, 18, 14, '#2a2e36');                                                   // habitacle (vitres)
            rect(-6, -6, 12, 12, couleur);                                                      // toit
            rect(-19, -9, 3, 18, '#1e1e22'); rect(16, -9, 3, 18, '#1e1e22');                  // pare-chocs
            rect(17, -8, 2, 3, '#f0e0a0'); rect(17, 5, 2, 3, '#f0e0a0');                       // phares
            rect(-19, -8, 2, 3, '#a02020'); rect(-19, 5, 2, 3, '#a02020');                     // feux arrière
            if (r() > 0.5) rect(-2, 9, 10, 5, couleur);                                         // portière ouverte
            g.restore();
        };
        for (let i = 0; i < Math.max(2, W / 170); i++) {
            const x = 170 + r() * (W - 200), y = ROUTE_H + 22 + r() * (ROUTE_B - ROUTE_H - 44);
            voiture(Math.round(x), Math.round(y), choix(['#a83a32', '#3a5a8a', '#d8d0c0', '#3a6a4a', '#c8a030', '#5a5a62']), (r() - 0.5) * 0.7);
        }
        // Un bus en travers, plus loin
        if (W > 500) {
            g.save(); g.translate(Math.round(W * 0.72), ROUTE_H + 44); g.rotate(0.12);
            ombre(() => rect(-38, -9, 80, 22, '#141418'), 0.4);
            rect(-40, -11, 80, 22, '#d8a020'); rect(-40, -11, 80, 2, '#f0c040');
            for (let k = -34; k < 34; k += 10) rect(k, -8, 7, 16, '#2a2e36');
            rect(-40, -11, 3, 22, '#2a2a2e'); rect(37, -11, 3, 22, '#2a2a2e');
            g.restore();
        }

        // Lampadaires, arbres en bac, bouche d'incendie, poubelles sur les trottoirs
        for (const [y0, y1, bord] of [[TOIT_H, TROTTOIR_H, TROTTOIR_H - 3], [ROUTE_B, TROTTOIR_B, ROUTE_B + 2]]) {
            for (let x = 30 + r() * 20; x < W; x += 90 + r() * 30) {
                ombre(() => rect(x + 3, bord + 2, 3, 3, '#1e1e22'));
                rect(x, bord, 4, 4, '#3a3e44'); rect(x + 1, bord + 1, 2, 2, '#6a6e74');
                rect(x + 1, bord - (bord === TROTTOIR_H - 3 ? -4 : 6), 2, 6, '#3a3e44');
            }
            for (let x = 70 + r() * 30; x < W; x += 120 + r() * 60) {
                const cy = (y0 + y1) / 2;
                rect(x - 9, cy - 9, 18, 18, '#7a6e60'); rect(x - 8, cy - 8, 16, 16, '#4a3a2a');
                ombre(() => rond(x + 3, cy + 3, 12, 11, '#1e2418'));
                rond(x, cy, 12, 11, '#3a6a32'); rond(x - 3, cy - 3, 7, 6, '#4a8040'); rond(x + 4, cy + 2, 4, 3, '#2e5a2a');
            }
        }
        const bouche = (x, y) => { ombre(() => rect(x + 2, y + 2, 6, 6, '#1e1e22')); rect(x, y, 6, 6, '#c83030'); rect(x + 1, y + 1, 4, 4, '#e85048'); rect(x - 1, y + 2, 8, 2, '#a02020'); };
        const poubelle = (x, y) => { ombre(() => rect(x + 2, y + 2, 9, 9, '#1e1e22')); rect(x, y, 9, 9, '#3a5a3a'); rect(x + 1, y + 1, 7, 7, '#2a4a2a'); rect(x + 3, y + 3, 3, 3, '#1a2a1a'); };
        bouche(Math.round(W * 0.45), ROUTE_B + 8); poubelle(Math.round(W * 0.6), TOIT_H + 12); poubelle(Math.round(W * 0.6) + 11, TOIT_H + 14);
        if (W > 600) { bouche(Math.round(W * 0.85), TOIT_H + 20); poubelle(Math.round(W * 0.9), ROUTE_B + 12); }

        // Le piano droit de Brutus sur le trottoir (vu de dessus), sanglé, et les cartons du déménagement
        const PIANO_X = 64, PIANO_Y = TOIT_H + 10;
        ombre(() => rect(PIANO_X + 3, PIANO_Y + 3, 34, 16, '#1e1e22'), 0.45);
        rect(PIANO_X, PIANO_Y, 34, 16, '#3a2418'); rect(PIANO_X, PIANO_Y, 34, 2, '#5a3a26');
        rect(PIANO_X + 2, PIANO_Y + 12, 30, 4, '#ece6da');                                     // le clavier
        for (let k = PIANO_X + 3; k < PIANO_X + 32; k += 3) if ((k / 3) % 7 !== 2 && (k / 3) % 7 !== 6) rect(k, PIANO_Y + 12, 1, 2, '#1a1a1a');
        for (const sx of [PIANO_X + 8, PIANO_X + 24]) rect(sx, PIANO_Y, 2, 12, '#c8a030');     // sangles
        const carton = (x, y, l, h) => { ombre(() => rect(x + 2, y + 2, l, h, '#1e1e22')); rect(x, y, l, h, '#c49a62'); rect(x, y + Math.round(h / 2), l, 1, '#a07a48'); rect(x + Math.round(l / 2) - 1, y, 2, h, '#d8c8a0'); };
        carton(PIANO_X + 40, PIANO_Y + 2, 12, 10); carton(PIANO_X + 44, PIANO_Y + 13, 10, 8); carton(PIANO_X - 14, PIANO_Y + 6, 11, 11);
        // Un diable (chariot) renversé à côté
        rect(PIANO_X + 58, PIANO_Y + 6, 2, 14, '#5a5e64'); rect(PIANO_X + 58, PIANO_Y + 18, 7, 2, '#5a5e64'); rect(PIANO_X + 56, PIANO_Y + 19, 3, 3, '#1a1a1a');

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
