/* =========================================================================
   OUTILS DE PIXEL ART (sprites générés au chargement : boss, Joggeur…)
   On dessine des formes simples dans une grille de lettres (une lettre =
   une couleur ou une « partie » du corps), puis finir() calcule les ombres
   à deux tons, les traits entre les parties et le contour, dans le style
   des sprites du jeu. en_image() transforme la grille en image.
   ========================================================================= */
const PixelArt = (() => {
    const grille = n => Array.from({ length: n }, () => Array(n).fill(null));
    const taille = g => g.length;

    function poser(g, x, y, c) {
        x = Math.round(x); y = Math.round(y);
        if (x >= 0 && y >= 0 && x < taille(g) && y < taille(g)) g[y][x] = c;
    }

    // Ellipse aux bords légèrement irréguliers (chair bosselée plutôt que forme parfaite)
    function ellipse(g, cx, cy, rx, ry, c, bosses = 0.07) {
        const n = taille(g);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
            const angle = Math.atan2(dy, dx);
            const bord = 1 + bosses * Math.sin(angle * 5 + cx) + bosses * 0.5 * Math.sin(angle * 9 + cy);
            if (dx * dx + dy * dy <= bord * bord) g[y][x] = c;
        }
    }

    function rect(g, x0, y0, x1, y1, c) {
        for (let y = Math.round(y0); y <= y1; y++) for (let x = Math.round(x0); x <= x1; x++) poser(g, x, y, c);
    }

    // Trait d'un pixel entre deux points (plis, muscles)
    function trait(g, x0, y0, x1, y1, c) {
        const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
        for (let k = 0; k <= n; k++) poser(g, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c);
    }

    // Segment épais (membres) : une suite de disques le long du trait
    function membre(g, x0, y0, x1, y1, epaisseur, c) {
        const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * 2));
        for (let k = 0; k <= n; k++) {
            ellipse(g, x0 + (x1 - x0) * k / n + 0.5, y0 + (y1 - y0) * k / n + 0.5, epaisseur / 2, epaisseur / 2, c, 0);
        }
    }

    /* Finitions. « parties » décrit chaque lettre qui est une partie du corps :
         { lettre: { rang, base, ombre, bande } }
       - rang : plus il est haut, plus la partie est devant ; une partie qui
         touche une partie de devant reçoit un trait sombre à la jonction
       - base / ombre : les deux tons de la partie (lumière en haut à gauche)
       - bande : 'large' (peau, comme les zombies) ou 'fine' (vêtements)
       Les autres lettres gardent leur couleur. Contour extérieur : K. */
    function finir(g, parties) {
        const n = taille(g);
        const vide = (x, y) => x < 0 || y < 0 || x >= n || y >= n || !g[y][x];
        const rang = (x, y) => (vide(x, y) || !parties[g[y][x]] ? -1 : parties[g[y][x]].rang);
        const res = g.map(l => l.slice());
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const p = parties[g[y][x]];
            if (!p) continue;
            if (p.rang >= 0 && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([vx, vy]) => rang(vx, vy) > p.rang)) {
                res[y][x] = 'K';
                continue;
            }
            const ombre = p.bande === 'large'
                ? vide(x + 4, y + 2) || vide(x + 2, y + 3) || vide(x + 3, y) || vide(x + 1, y + 3) || rang(x + 3, y + 1) > p.rang || rang(x + 1, y + 3) > p.rang
                : vide(x + 2, y + 1) || vide(x + 1, y + 2) || (p.rang >= 0 && rang(x + 2, y + 1) > p.rang);
            res[y][x] = ombre ? p.ombre : p.base;
        }
        const contour = res.map(l => l.slice());
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            if (res[y][x]) continue;
            if (!vide(x - 1, y) || !vide(x + 1, y) || !vide(x, y - 1) || !vide(x, y + 1)) contour[y][x] = 'K';
        }
        return contour;
    }

    function en_image(g, couleurs, zoom = 1) {
        const n = taille(g);
        const toile = document.createElement('canvas');
        toile.width = toile.height = n * zoom;
        const c = toile.getContext('2d');
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            if (!g[y][x]) continue;
            c.fillStyle = couleurs[g[y][x]];
            c.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
        return toile;
    }

    return { grille, poser, ellipse, rect, trait, membre, finir, en_image };
})();
