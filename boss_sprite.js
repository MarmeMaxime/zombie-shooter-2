/* =========================================================================
   SPRITE DU BOSS « LE MASTODONTE » (pixel art généré au chargement)
   Dessiné sur une grille de 32×32 pixels à partir de formes simples
   (ellipses, rectangles, pointes), puis contour et ombrages automatiques,
   et agrandi ×4 sans flou. Il regarde vers la gauche.
   Pour le retoucher : modifier les formes dans dessiner_corps().
   ========================================================================= */
const SPRITES_BOSS = (() => {
    const N = 32, ZOOM = 4;
    const COULEURS = {
        G: '#5f8a3a',   // peau vert toxique
        g: '#3e5e24',   // peau dans l'ombre
        L: '#8ab85a',   // peau éclairée
        P: '#b8ff4a',   // pustules
        p: '#e8ff9a',   // pustules allumées (avant le crachat)
        B: '#e8e0c8',   // os
        b: '#a89e84',   // os ombré
        Y: '#ffe14d',   // œil
        R: '#5a0808',   // intérieur de la gueule
        W: '#f0f0e0',   // dents
        T: '#4a3a5a',   // pantalon déchiré
        t: '#2e2438',   // pantalon dans l'ombre
        S: '#8a1a1a',   // cicatrices, sang
        K: '#141410'    // contour
    };

    // Grille de lettres (null = vide)
    const grille = () => Array.from({ length: N }, () => Array(N).fill(null));
    const poser = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
    function ellipse(g, cx, cy, rx, ry, c) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) g[y][x] = c;
        }
    }
    function rect(g, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) poser(g, x, y, c); }
    function pointe(g, x, base, hauteur, c) {   // pointe d'os verticale
        for (let i = 0; i < hauteur; i++) { poser(g, x, base - i, c); if (i < hauteur / 2) poser(g, x + 1, base - i, c === 'B' ? 'b' : c); }
    }

    // pas : 0..3 (cycle de marche) ; charge : gueule ouverte et pustules allumées
    function dessiner_corps(pas, charge) {
        const g = grille();
        const balance = [0, 1, 0, -1][pas];                 // jambes qui alternent
        const souffle = pas % 2 === 1 ? 1 : 0;              // le corps monte et descend

        // Jambes et pieds (la jambe arrière est dessinée en premier, plus sombre)
        rect(g, 19 - balance, 23, 22 - balance, 29, 't');
        rect(g, 18 - balance, 30, 23 - balance, 31, 'g');
        rect(g, 11 + balance, 23, 15 + balance, 29, 'T');
        rect(g, 9 + balance, 30, 15 + balance, 31, 'G');
        rect(g, 10, 20 + souffle, 25, 23, 'T');            // bassin, pantalon
        for (let x = 11; x <= 24; x += 3) poser(g, x, 24, null);   // bas déchiré

        // Bras arrière (petit, dans l'ombre)
        ellipse(g, 26, 18 + souffle, 2.6, 4.2, 'g');

        // Torse et énorme bosse
        ellipse(g, 18, 13 + souffle, 10, 8, 'G');
        ellipse(g, 17, 18 + souffle, 8, 4.5, 'G');

        // Pointes d'os sur la bosse
        for (const [x, h] of [[13, 5], [17, 6], [21, 5], [24, 4]]) pointe(g, x, 6 + souffle + (x > 20 ? 1 : 0), h, 'B');

        // Tête basse, enfoncée dans les épaules (partie « H », devant le torse)
        ellipse(g, 8, 11 + souffle, 4.6, 4.1, 'H');
        rect(g, 4, 13 + souffle, 10, 15 + souffle, 'H');    // mâchoire massive

        // Bras-massue devant, qui se balance (partie « A », devant tout le reste)
        ellipse(g, 10, 16 + souffle, 3.4, 4.2, 'A');        // épaule
        rect(g, 5 - balance, 18 + souffle, 10 - balance, 24, 'A');
        ellipse(g, 6.5 - balance, 25.5, 4.2, 3.4, 'A');     // poing énorme
        poser(g, 3 - balance, 24, 'B'); poser(g, 3 - balance, 26, 'B');   // os des phalanges

        // Côtes apparentes et cicatrices
        for (const y of [15, 17]) for (let x = 14; x <= 18; x++) poser(g, x, y + souffle, x % 2 ? 'B' : 'b');
        poser(g, 20, 16 + souffle, 'S'); poser(g, 21, 17 + souffle, 'S'); poser(g, 22, 18 + souffle, 'S');

        // Pustules d'acide (elles s'allument avant le crachat)
        for (const [x, y] of [[21, 9], [23, 12], [16, 10], [25, 15], [12, 19], [19, 11]]) poser(g, x, y + souffle, charge ? 'p' : 'P');

        // Visage : œil jaune, gueule (grande ouverte en charge)
        if (charge) {
            rect(g, 2, 12 + souffle, 8, 16 + souffle, 'R');
            for (let x = 2; x <= 8; x += 2) { poser(g, x, 12 + souffle, 'W'); poser(g, x + 1, 16 + souffle, 'W'); }
            poser(g, 1, 14 + souffle, 'P'); poser(g, 0, 15 + souffle, 'P');   // bave acide
        } else {
            rect(g, 4, 13 + souffle, 8, 13 + souffle, 'R');
            for (let x = 4; x <= 8; x += 2) poser(g, x, 13 + souffle, 'W');
        }
        // Œil jaune luisant sous une arcade sourcilière épaisse
        rect(g, 5, 10 + souffle, 7, 10 + souffle, 'Y'); poser(g, 6, 11 + souffle, 'Y');
        rect(g, 4, 9 + souffle, 8, 9 + souffle, 'K');

        return ombrer(g);
    }

    // 1) Contours internes : la peau d'une partie de derrière qui touche une partie
    //    de devant devient un trait sombre (torse < tête < bras)
    // 2) Lumière venant d'en haut à gauche : bords éclairés, bords ombrés
    // 3) Contour extérieur
    const RANG = { G: 0, H: 1, A: 2 };
    function ombrer(g) {
        const vide = (x, y) => x < 0 || y < 0 || x >= N || y >= N || !g[y][x];
        const rang = (x, y) => (vide(x, y) ? -1 : (RANG[g[y][x]] ?? -1));
        const res = g.map(l => l.slice());
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const r = RANG[g[y][x]];
            if (r === undefined) continue;
            const voisins = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
            if (voisins.some(([vx, vy]) => rang(vx, vy) > r)) { res[y][x] = 'K'; continue; }
            if (vide(x, y - 1) || vide(x - 1, y)) res[y][x] = 'L';
            else if (vide(x, y + 1) || vide(x + 1, y) || vide(x + 1, y + 1)) res[y][x] = 'g';
            else res[y][x] = 'G';
        }
        const contour = res.map(l => l.slice());
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            if (res[y][x]) continue;
            if (!vide(x - 1, y) || !vide(x + 1, y) || !vide(x, y - 1) || !vide(x, y + 1)) contour[y][x] = 'K';
        }
        return contour;
    }

    function en_image(g) {
        const toile = document.createElement('canvas');
        toile.width = toile.height = N * ZOOM;
        const c = toile.getContext('2d');
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            if (!g[y][x]) continue;
            c.fillStyle = COULEURS[g[y][x]];
            c.fillRect(x * ZOOM, y * ZOOM, ZOOM, ZOOM);
        }
        return toile;
    }

    return {
        marche: [0, 1, 2, 3].map(pas => en_image(dessiner_corps(pas, false))),
        charge: [0, 1, 2, 3].map(pas => en_image(dessiner_corps(pas, true)))
    };
})();
