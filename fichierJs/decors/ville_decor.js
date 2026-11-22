/* =========================================================================
   DÉCOR DE LA VILLE (chapitre 2, l'histoire de Brutus), vu de dessus comme
   la zone de combat : toits d'immeubles en haut et en bas, trottoirs
   dallés, une grande avenue (lignes, passage piéton, plaques d'égout,
   nids-de-poule, taches), voitures abandonnées, un bus, lampadaires,
   arbres, bouche d'incendie, poubelles… et, sur le trottoir, un piano droit
   et des cartons de déménagement.
   Tout est à l'échelle des personnages (64 de haut) : une voiture fait
   presque une fois et demie Brutus.
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
        const TOIT_H = 30, TROTTOIR_H = 74, ROUTE_H = 77, ROUTE_B = 341, TROTTOIR_B = 378;

        // Asphalte, avec son grain et des plaques plus claires (rapiéçages)
        rect(0, ROUTE_H, W, ROUTE_B - ROUTE_H, '#4a4a50');
        for (let i = 0; i < W * 0.04; i++) ombre(() => rect(r() * W, ROUTE_H + r() * (ROUTE_B - ROUTE_H - 20), 30 + r() * 70, 12 + r() * 20, choix(['#56565c', '#424248', '#5a5a5e'])), 0.5);
        for (let i = 0; i < W * 4; i++) rect(r() * W, ROUTE_H + r() * (ROUTE_B - ROUTE_H), 1, 1, choix(['#55555b', '#3e3e44', '#606066', '#46464c']));

        // Marquage : double ligne jaune au milieu, pointillés blancs des voies
        const MILIEU = Math.round((ROUTE_H + ROUTE_B) / 2);
        for (const y of [MILIEU - 4, MILIEU + 2]) for (let x = 0; x < W; x += 2) if (r() > 0.06) rect(x, y, 2, 2, '#d8b838');
        for (const y of [Math.round((ROUTE_H + MILIEU) / 2), Math.round((MILIEU + ROUTE_B) / 2)])
            for (let x = 6; x < W; x += 50) if (r() > 0.1) rect(x, y, 26, 3, '#d8d8d0');

        // Passage piéton (vers la gauche de l'écran), larges bandes
        const PX = Math.round(W * 0.2);
        for (let y = ROUTE_H + 6; y < ROUTE_B - 10; y += 22) { rect(PX, y, 48, 11, '#d8d8d0'); for (let k = 0; k < 14; k++) rect(PX + r() * 48, y + r() * 11, 2, 1, '#9a9a98'); }

        // Trottoirs dallés (grandes dalles), bordures
        for (const [y0, y1] of [[TOIT_H, TROTTOIR_H], [ROUTE_B, TROTTOIR_B]]) {
            rect(0, y0, W, y1 - y0, '#a8a49c');
            for (let i = 0; i < W * 0.8; i++) rect(r() * W, y0 + r() * (y1 - y0), 1, 1, choix(['#9c988f', '#b4b0a8', '#a09c94']));
            for (let x = 0; x < W; x += 20) rect(x, y0, 1, y1 - y0, '#928e86');
            for (let y = y0 + 20; y < y1; y += 20) rect(0, y, W, 1, '#928e86');
        }
        rect(0, TROTTOIR_H, W, 3, '#cfcbc2'); rect(0, TROTTOIR_H + 3, W, 1, '#2e2e32');
        rect(0, ROUTE_B - 3, W, 3, '#cfcbc2'); rect(0, ROUTE_B - 4, W, 1, '#2e2e32');

        // Toits des immeubles (en haut et en bas), avec corniches, climatiseurs et cheminées d'aération
        const toits = (y0, h, versBas) => {
            let x = -r() * 40;
            while (x < W) {
                const l = 90 + r() * 120, couleur = choix(['#7a6a5a', '#8a5a4a', '#5e6470', '#6e6a62', '#7e5e50']);
                rect(x, y0, l, h, couleur);
                rect(x, versBas ? y0 : y0 + h - 3, l, 3, '#bab2a4');           // corniche côté rue
                rect(x, y0, 3, h, '#3e3a36');                                   // séparation entre immeubles
                for (let k = 0; k < 1 + r() * 2; k++) {
                    const ax = x + 10 + r() * (l - 40), ay = y0 + (versBas ? 5 : 2) + r() * Math.max(1, h - 24);
                    if (r() > 0.4) { ombre(() => rect(ax + 3, ay + 3, 22, 15, '#2a2624')); rect(ax, ay, 22, 15, '#b8bcc0'); rect(ax, ay, 22, 2, '#d8dce0'); rect(ax + 4, ay + 4, 10, 7, '#6a6e72'); for (let v = 0; v < 3; v++) rect(ax + 5, ay + 5 + v * 2, 8, 1, '#3e4246'); }
                    else { rect(ax, ay, 12, 12, '#3a3a3e'); rect(ax + 2, ay + 2, 8, 8, '#1e1e22'); }
                }
                x += l;
            }
            ombre(() => rect(0, versBas ? y0 - 6 : y0 + h, W, 6, '#1e1e22'), 0.35);   // ombre portée sur le trottoir
        };
        toits(0, TOIT_H, false);
        toits(TROTTOIR_B, H - TROTTOIR_B, true);

        // Plaques d'égout, nids-de-poule, fissures, taches d'huile, sang séché, papiers
        for (let i = 0; i < W / 180; i++) {
            const x = 60 + r() * (W - 120), y = ROUTE_H + 30 + r() * (ROUTE_B - ROUTE_H - 60);
            rond(x, y, 14, 9, '#2e2e32'); rond(x, y, 12, 8, '#3a3a40');
            for (let k = -9; k <= 9; k += 3) rect(x + k, y - 5, 1, 10, '#2a2a2e');
        }
        for (let i = 0; i < W / 80; i++) { const x = r() * W, y = ROUTE_H + 10 + r() * (ROUTE_B - ROUTE_H - 20); rond(x, y, 7 + r() * 8, 4 + r() * 4, '#2c2c30'); rond(x - 2, y - 1, 3, 2, '#38383c'); }
        for (let i = 0; i < W / 40; i++) { let x = r() * W, y = ROUTE_H + r() * (ROUTE_B - ROUTE_H); for (let k = 0; k < 14; k++) { rect(x, y, 1, 1, '#2a2a2e'); x += 1; y += Math.round(r() * 2 - 1); } }
        for (let i = 0; i < W / 90; i++) ombre(() => rond(r() * W, ROUTE_H + 14 + r() * (ROUTE_B - ROUTE_H - 28), 10 + r() * 12, 5 + r() * 6, '#1a1a20'), 0.45);
        for (let i = 0; i < W / 110; i++) ombre(() => rond(r() * W, ROUTE_H + 14 + r() * (ROUTE_B - ROUTE_H - 28), 5 + r() * 9, 3 + r() * 5, '#5a1a18'), 0.6);
        for (let i = 0; i < W / 25; i++) rect(r() * W, ROUTE_H + r() * (ROUTE_B - ROUTE_H), 5, 4, choix(['#d8d4c8', '#c8c0a8', '#e0dcd0']));

        /* Voiture vue de dessus, tournée vers la droite : 84 × 40 */
        const voiture = (x, y, couleur, fonce, angle, portiere) => {
            g.save(); g.translate(x, y); g.rotate(angle);
            ombre(() => rect(-38, -16, 84, 40, '#141418'), 0.4);
            rect(-36, -21, 12, 4, '#18181a'); rect(20, -21, 12, 4, '#18181a');          // pneus qui dépassent
            rect(-36, 17, 12, 4, '#18181a'); rect(20, 17, 12, 4, '#18181a');
            rect(-42, -18, 84, 36, couleur);                                              // carrosserie
            ombre(() => rect(-42, -18, 84, 2, '#ffffff'), 0.25);
            rect(-42, 15, 84, 3, fonce);
            rect(-42, -18, 2, 36, fonce); rect(40, -18, 2, 36, fonce);
            rect(12, -15, 2, 30, fonce); rect(-26, -15, 2, 30, fonce);                    // capot / coffre
            rect(4, -14, 9, 28, '#2a3440'); rect(5, -13, 3, 10, '#5a6a7a');               // pare-brise (et reflet)
            rect(-24, -13, 6, 26, '#2a3440');                                             // lunette arrière
            rect(-18, -13, 22, 26, couleur); ombre(() => rect(-18, -13, 22, 3, '#ffffff'), 0.2);   // toit
            rect(6, -21, 4, 3, fonce); rect(6, 18, 4, 3, fonce);                          // rétroviseurs
            rect(39, -15, 3, 6, '#f0e0a0'); rect(39, 9, 3, 6, '#f0e0a0');                 // phares
            rect(-42, -15, 2, 6, '#c02020'); rect(-42, 9, 2, 6, '#c02020');               // feux arrière
            if (portiere) { rect(-6, 18, 16, 12, couleur); rect(-6, 18, 16, 2, fonce); rect(-4, 21, 10, 6, '#2a3440'); }
            g.restore();
        };
        const COULEURS_AUTOS = [['#a83a32', '#7a2420'], ['#3a5a8a', '#24405e'], ['#d8d0c0', '#a8a090'], ['#3a6a4a', '#244832'], ['#c8a030', '#8a6a18'], ['#5a5a62', '#3a3a42']];
        const places = W > 500 ? [[W * 0.74, ROUTE_H + 52, 150]] : [];   // la place du bus (dessiné plus bas)
        const voulues = places.length + Math.max(3, Math.round(W / 220));
        for (let essai = 0; essai < 40 && places.length < voulues; essai++) {
            const x = 200 + r() * (W - 250), y = ROUTE_H + 36 + r() * (ROUTE_B - ROUTE_H - 72);
            if (places.some(([px, py, dx = 100]) => Math.abs(px - x) < dx && Math.abs(py - y) < 56)) continue;
            places.push([x, y]);
            const [cl, fc] = choix(COULEURS_AUTOS);
            voiture(Math.round(x), Math.round(y), cl, fc, (r() - 0.5) * 0.6, r() > 0.5);
        }
        // Un bus en travers de la voie du haut, plus loin
        if (W > 500) {
            g.save(); g.translate(Math.round(W * 0.74), ROUTE_H + 52); g.rotate(0.1);
            ombre(() => rect(-92, -20, 190, 50, '#141418'), 0.4);
            rect(-95, -24, 190, 48, '#d8a020'); rect(-95, -24, 190, 3, '#f0c040'); rect(-95, 21, 190, 3, '#a87810');
            for (let k = -80; k < 80; k += 22) { rect(k, -16, 14, 32, '#e8b830'); rect(k + 4, -10, 6, 20, '#c89018'); }   // aérations du toit
            rect(88, -20, 7, 40, '#2a3440'); rect(-95, -20, 4, 40, '#2a3440');
            rect(92, -22, 3, 6, '#f0e0a0'); rect(92, 16, 3, 6, '#f0e0a0');
            g.restore();
        }

        // Lampadaires (le pied sur le trottoir, la tête au-dessus de la route), arbres en bac
        for (const [y0, y1, haut] of [[TOIT_H, TROTTOIR_H, true], [ROUTE_B, TROTTOIR_B, false]]) {
            for (let x = 40 + r() * 30; x < W; x += 140 + r() * 40) {
                const py = haut ? TROTTOIR_H - 8 : ROUTE_B + 4, dir = haut ? 1 : -1;
                ombre(() => rect(x + 4, py + 4, 8, 8, '#1e1e22'));
                rect(x, py, 8, 8, '#3a3e44'); rect(x + 2, py + 2, 4, 4, '#6a6e74');
                for (let k = 0; k < 18; k++) rect(x + 3, py + 4 + dir * k, 3, 1, '#3a3e44');
                const ty = py + 4 + dir * 18;
                rect(x - 3, ty - 3, 14, 7, '#2a2e34'); rect(x - 1, ty - 1, 10, 3, '#e8e0b0');
            }
            for (let x = 110 + r() * 40; x < W; x += 170 + r() * 70) {
                const cy = (y0 + y1) / 2;
                rect(x - 14, cy - 14, 28, 28, '#7a6e60'); rect(x - 12, cy - 12, 24, 24, '#4a3a2a');
                ombre(() => rond(x + 5, cy + 5, 25, 22, '#1e2418'));
                rond(x, cy, 25, 22, '#3a6a32'); rond(x - 7, cy - 6, 14, 12, '#4a8040'); rond(x + 8, cy + 4, 9, 7, '#2e5a2a'); rond(x + 6, cy - 9, 6, 5, '#5a9048');
            }
        }
        const bouche = (x, y) => { ombre(() => rect(x + 3, y + 3, 12, 12, '#1e1e22')); rect(x, y, 12, 12, '#c83030'); rect(x + 2, y + 2, 8, 8, '#e85048'); rect(x + 4, y + 4, 4, 4, '#a02020'); rect(x - 3, y + 4, 18, 4, '#a02020'); };
        const poubelle = (x, y) => { ombre(() => rect(x + 3, y + 3, 18, 18, '#1e1e22')); rect(x, y, 18, 18, '#3a5a3a'); rect(x + 2, y + 2, 14, 14, '#2a4a2a'); rect(x + 6, y + 6, 6, 6, '#1a2a1a'); rect(x, y, 18, 2, '#4a6e4a'); };
        bouche(Math.round(W * 0.45), ROUTE_B + 12); poubelle(Math.round(W * 0.6), TOIT_H + 10); poubelle(Math.round(W * 0.6) + 21, TOIT_H + 14);
        if (W > 600) { bouche(Math.round(W * 0.88), TOIT_H + 18); poubelle(Math.round(W * 0.92), ROUTE_B + 10); }

        // Le piano droit de Brutus sur le trottoir (vu de dessus, 72 × 30), sanglé, et les cartons du déménagement
        const PIANO_X = 70, PIANO_Y = TOIT_H + 7;
        ombre(() => rect(PIANO_X + 4, PIANO_Y + 4, 72, 30, '#1e1e22'), 0.45);
        rect(PIANO_X, PIANO_Y, 72, 30, '#3a2418'); rect(PIANO_X, PIANO_Y, 72, 3, '#5a3a26'); rect(PIANO_X, PIANO_Y + 27, 72, 3, '#24160e');
        rect(PIANO_X + 3, PIANO_Y + 4, 66, 14, '#4a2e1e'); ombre(() => rect(PIANO_X + 6, PIANO_Y + 6, 20, 2, '#ffffff'), 0.2);   // couvercle verni
        rect(PIANO_X + 4, PIANO_Y + 20, 64, 7, '#ece6da');                                    // le clavier
        for (let k = 0; k < 21; k++) if (k % 7 !== 2 && k % 7 !== 6) rect(PIANO_X + 6 + k * 3, PIANO_Y + 20, 2, 4, '#1a1a1a');
        for (const sx of [PIANO_X + 16, PIANO_X + 52]) { rect(sx, PIANO_Y - 1, 4, 32, '#c8a030'); rect(sx, PIANO_Y + 12, 4, 3, '#8a6a18'); }   // sangles et boucles
        const carton = (x, y, l, h) => {
            ombre(() => rect(x + 3, y + 3, l, h, '#1e1e22'));
            rect(x, y, l, h, '#c49a62'); rect(x, y, l, 2, '#d8b480'); rect(x, y + Math.round(h / 2), l, 1, '#a07a48');
            rect(x + Math.round(l / 2) - 2, y, 4, h, '#d8c8a0');                                // scotch
            rect(x + 3, y + h - 6, 7, 3, '#3a2a1a');                                            // « FRAGILE », illisible
        };
        carton(PIANO_X + 80, PIANO_Y, 24, 18); carton(PIANO_X + 86, PIANO_Y + 20, 20, 14); carton(PIANO_X - 28, PIANO_Y + 6, 22, 22);
        // Le diable (chariot) renversé à côté
        rect(PIANO_X + 114, PIANO_Y + 6, 4, 28, '#5a5e64'); rect(PIANO_X + 114, PIANO_Y + 30, 14, 4, '#5a5e64');
        rect(PIANO_X + 110, PIANO_Y + 31, 6, 6, '#1a1a1a'); rect(PIANO_X + 110, PIANO_Y + 4, 12, 3, '#5a5e64');

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
