/* =========================================================================
   DÉCOR DE LA ZONE DE COMBAT (désert et voies ferrées, en pixel art)
   Dessiné à l'échelle du monde (1 pixel du décor = 1 unité, comme les
   sprites), vu de dessus : sable aux tons chauds, deux voies ferrées
   (ballast, traverses, rails), une piste de sable plus clair en bas,
   rochers, buissons secs, fissures. Toujours le même (hasard à graine) ;
   recalculé seulement si la largeur demandée change. Sert aussi de fond à
   l'écran titre.
   ========================================================================= */
const decor_combat = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(1985);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];

        // Sable : fond, grandes plaques plus rouges ou plus claires, grain
        rect(0, 0, W, H, '#c4956a');
        for (let i = 0; i < W * 0.05; i++) {
            const x = r() * W, y = r() * H, l = 20 + r() * 60, h = 6 + r() * 14;
            g.globalAlpha = 0.35;
            rect(x, y, l, h, choix(['#b07a52', '#d4a87c', '#a86c48']));
            g.globalAlpha = 1;
        }
        for (let i = 0; i < W * 3; i++) rect(r() * W, r() * H, 1 + r() * 2, 1, choix(['#b8885e', '#d2a57a', '#ad7c55', '#c99c70']));

        // Piste de sable clair en bas
        g.globalAlpha = 0.5;
        rect(0, 322, W, 26, '#dcb88c');
        g.globalAlpha = 1;
        for (let x = 0; x < W; x += 3) { rect(x, 321 + Math.round(Math.sin(x / 17) * 2), 2, 1, '#e4c49a'); rect(x, 348 + Math.round(Math.cos(x / 23) * 2), 2, 1, '#b8885e'); }

        // Fissures du sol (lignes brisées sombres)
        for (let i = 0; i < W * 0.02; i++) {
            let x = r() * W, y = 30 + r() * (H - 60);
            for (let k = 0; k < 6; k++) {
                const nx = x + 3 + r() * 5, ny = y + (r() - 0.5) * 6;
                g.strokeStyle = '#8a5c3c'; g.lineWidth = 1;
                g.beginPath(); g.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5); g.lineTo(Math.round(nx) + 0.5, Math.round(ny) + 0.5); g.stroke();
                x = nx; y = ny;
            }
        }

        // Deux voies ferrées : ballast, traverses, rails
        for (const yv of [118, 202]) {
            rect(0, yv - 2, W, 32, '#7c6a58');
            for (let i = 0; i < W * 1.2; i++) rect(r() * W, yv - 2 + r() * 32, 1 + r() * 2, 1 + r(), choix(['#5e5044', '#958272', '#6e5e50', '#a8957f']));
            for (let x = 2; x < W; x += 9) {
                rect(x, yv, 4, 28, '#5a3a24');
                rect(x, yv, 1, 28, '#7a5232');
                rect(x + 3, yv, 1, 28, '#3e2614');
            }
            for (const yr of [yv + 6, yv + 20]) {
                rect(0, yr, W, 3, '#3a3a40');
                rect(0, yr, W, 1, '#9a9aa4');
                rect(0, yr + 3, W, 1, '#2a1e14');
            }
        }

        // Rochers (avec leur ombre) et buissons secs, hors des rails
        const horsRails = y => !((y > 110 && y < 156) || (y > 194 && y < 240));
        for (let i = 0; i < W * 0.03; i++) {
            const x = r() * W, y = 20 + r() * (H - 40);
            if (!horsRails(y)) continue;
            const l = 4 + Math.floor(r() * 7), h = 3 + Math.floor(r() * 4);
            rect(x + 2, y + h - 1, l, 2, '#8a5c3c');                   // ombre
            rect(x, y, l, h, '#b8a890');
            rect(x, y, l, 1, '#e0d4c0');
            rect(x + l - 2, y + 1, 2, h - 1, '#8e7e6a');
        }
        for (let i = 0; i < W * 0.025; i++) {
            const x = r() * W, y = 20 + r() * (H - 40);
            if (!horsRails(y)) continue;
            for (let k = 0; k < 9; k++) {
                const a = r() * Math.PI * 2, l = 2 + r() * 5;
                g.strokeStyle = choix(['#4a3a22', '#5e5030', '#3a2e1a']);
                g.beginPath(); g.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5); g.lineTo(Math.round(x + Math.cos(a) * l) + 0.5, Math.round(y + Math.sin(a) * l * 0.7) + 0.5); g.stroke();
            }
        }
        return c;
    }

    // Le décor pour une largeur donnée (par défaut celle du monde), mis en cache
    return (largeur = MONDE.largeur, hauteur = MONDE.hauteur) => {
        const W = Math.round(largeur), cle = W + 'x' + hauteur;
        if (!caches.has(cle)) {
            if (caches.size > 4) caches.clear();
            caches.set(cle, construire(W, hauteur));
        }
        return caches.get(cle);
    };
})();
