/* =========================================================================
   DÉCOR DU CAMP D'ENTRAÎNEMENT (remplace la photo du désert pendant le tutoriel)
   Pixel art dessiné à l'échelle du monde (1 pixel du décor = 1 unité, comme
   les sprites), vu de dessus comme la photo : terre battue, couloirs de tir
   tracés à la craie, sacs de sable derrière la recrue, clôtures, drapeau,
   panneau, cibles et bottes de paille au fond, quelques pneus et bidons.
   Recalculé seulement quand la largeur du monde change (forme de l'écran).
   ========================================================================= */
const decor_entrainement = (() => {
    let cache = null, largeurCache = 0;

    // Hasard reproductible : le décor est identique à chaque fois
    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(1942);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.round(l), Math.round(h)); };

        // Terre battue, avec des taches et des touffes d'herbe
        rect(0, 0, W, H, '#8c7c54');
        for (let i = 0; i < W * 2.2; i++) rect(r() * W, r() * H, 2 + r() * 3, 1 + r() * 2, ['#7f6f49', '#978862', '#86774f', '#9a8a60'][Math.floor(r() * 4)]);
        for (let i = 0; i < W * 0.12; i++) {
            const x = r() * W, y = r() < 0.5 ? 18 + r() * 30 : H - 60 + r() * 40;
            for (const [dx, dy] of [[0, 0], [1, -1], [2, 0], [-1, -1]]) rect(x + dx, y + dy, 1, 2, '#5f6e34');
        }

        // Couloirs de tir : bandes un peu plus claires et lignes de craie en pointillés
        const xCouloir = 70;
        for (let y = 52, k = 0; y < H - 40; y += 60, k++) {
            if (k % 2 === 0) { g.globalAlpha = 0.18; rect(xCouloir, y, W - xCouloir - 60, 60, '#c8b88a'); g.globalAlpha = 1; }
            for (let x = xCouloir; x < W - 60; x += 14) rect(x, y, 8, 1, '#ddd4b8');
        }
        for (let y = 52; y < H - 40; y += 2) rect(xCouloir, y, 1, 1, '#ddd4b8');   // ligne de tir

        // Clôtures de bois en haut et en bas (rails et poteaux, vues de dessus)
        for (const yc of [6, H - 8]) {
            rect(0, yc, W, 2, '#6a4a2a');
            rect(0, yc + 2, W, 1, '#3e2a16');
            for (let x = 4; x < W; x += 36) { rect(x, yc - 3, 5, 7, '#7a5634'); rect(x, yc + 4, 5, 1, '#3e2a16'); }
        }

        // Sacs de sable derrière la recrue (le long du bord gauche)
        for (let y = 16, rang = 0; y < H - 14; y += 9, rang++) {
            for (let x = rang % 2 ? 0 : -6; x < 22; x += 12) {
                rect(x, y, 11, 8, '#3e3222');
                rect(x + 1, y + 1, 9, 6, '#c2ae7a');
                rect(x + 1, y + 5, 9, 2, '#9c8a5c');
                rect(x + 5, y + 1, 1, 2, '#9c8a5c');
            }
        }

        // Drapeau du camp (en haut, au milieu) et panneau d'entrée (en haut à gauche)
        const xd = Math.round(W * 0.45);
        rect(xd, 0, 2, 22, '#4a4a4a');
        rect(xd + 2, 1, 20, 11, '#2a1c10');
        rect(xd + 3, 2, 18, 9, '#4a6a32');
        rect(xd + 11, 5, 2, 3, '#e8c24a'); rect(xd + 10, 6, 4, 1, '#e8c24a');   // étoile
        rect(32, 12, 2, 12, '#5a3a20'); rect(126, 12, 2, 12, '#5a3a20');        // pieds du panneau
        rect(26, 1, 108, 14, '#3e2a16');
        rect(27, 2, 106, 12, '#a87c4a');
        rect(27, 7, 106, 1, '#8e6638');
        g.fillStyle = '#2a1a0c';
        g.font = 'bold 8px "Courier New", monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(T('CAMP D\'ENTRAÎNEMENT'), 80, 8.5, 102);

        // Au fond à droite : bottes de paille et cibles de tir sur leurs pieds
        const xf = W - 46;
        for (let y = 40; y < H - 40; y += 22) {
            rect(xf + 18, y, 26, 18, '#4a3a1a');
            rect(xf + 19, y + 1, 24, 16, '#d6b85a');
            for (let k = 0; k < 4; k++) rect(xf + 20 + k * 6, y + 2, 1, 14, '#b8983e');
        }
        for (const yc of [70, 170, 270]) {
            rect(xf + 3, yc + 12, 2, 16, '#5a3a20');
            for (const [rayon, couleur] of [[12, '#3a2a1a'], [11, '#f2ece0'], [8, '#c82a2a'], [5, '#f2ece0'], [2, '#c82a2a']]) {
                g.fillStyle = couleur;
                g.beginPath(); g.ellipse(xf + 4, yc, rayon * 0.45, rayon, 0, 0, Math.PI * 2); g.fill();
            }
        }

        // Pneus et bidons sur les bords (hors des couloirs)
        for (const [x, y] of [[90, 22], [120, 24], [W * 0.62, 22], [W * 0.3, H - 30], [W * 0.7, H - 28]]) {
            g.fillStyle = '#1e1e1e'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#7a6a48'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
        }
        for (const [x, y] of [[W * 0.36, 20], [W * 0.82, H - 30]]) {
            rect(x, y - 7, 10, 14, '#2a3a22'); rect(x + 1, y - 6, 8, 12, '#4a6a3a'); rect(x + 1, y - 2, 8, 1, '#2a3a22'); rect(x + 1, y + 2, 8, 1, '#2a3a22');
        }
        return c;
    }

    // Le décor à la largeur actuelle du monde (mis en cache)
    return () => {
        const W = Math.round(MONDE.largeur);
        if (!cache || largeurCache !== W) { cache = construire(W, MONDE.hauteur); largeurCache = W; }
        return cache;
    };
})();
