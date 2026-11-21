/* =========================================================================
   SPRITE DU BOSS « LE MASTODONTE » (pixel art généré au chargement)
   Même style que les autres sprites du jeu : grille 64×64 affichée ×2,
   peau à deux tons, contour et traits internes presque noirs, couleurs
   ternes reprises des zombies existants. Il regarde vers la gauche.
   Les formes (ellipses, rectangles, pointes) sont dans dessiner_corps() ;
   le contour et les ombres sont calculés automatiquement.
   ========================================================================= */
const SPRITES_BOSS = (() => {
    const N = 64, ZOOM = 2, IMAGES = 8;
    const COULEURS = {
        G: '#a8a684',   // peau (chair grise et malade, de la famille des zombies C7B08B)
        g: '#7c7a5c',   // peau dans l'ombre
        T: '#4f342f',   // pantalon (même brun que le short du zombie)
        t: '#271f1b',   // pantalon dans l'ombre
        B: '#ddcebf',   // os
        b: '#a08662',   // os dans l'ombre
        P: '#8fa83e',   // pustules d'acide (ternes)
        p: '#d2ec6a',   // pustules allumées (avant le crachat)
        Y: '#fef3c0',   // œil (même lueur que les zombies)
        R: '#3b1725',   // intérieur de la gueule
        r: '#5b3138',   // gencives, plaies
        W: '#ddcebf',   // dents
        K: '#050403'    // contour
    };
    // Parties du corps : plus le rang est haut, plus la partie est devant
    const PEAU = { G: 0, H: 1, A: 2 };          // torse, tête, bras-massue
    const TISSU = { T: 0 };

    const grille = () => Array.from({ length: N }, () => Array(N).fill(null));
    const poser = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
    // Ellipse aux bords légèrement irréguliers (chair bosselée plutôt que forme parfaite)
    function ellipse(g, cx, cy, rx, ry, c, bosses = 0.07) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
            const angle = Math.atan2(dy, dx);
            const bord = 1 + bosses * Math.sin(angle * 5 + cx) + bosses * 0.5 * Math.sin(angle * 9 + cy);
            if (dx * dx + dy * dy <= bord * bord) g[y][x] = c;
        }
    }
    // Trait d'un pixel entre deux points (plis de chair, muscles)
    function trait(g, x0, y0, x1, y1, c) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) poser(g, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c);
    }
    function rect(g, x0, y0, x1, y1, c) { for (let y = Math.round(y0); y <= y1; y++) for (let x = Math.round(x0); x <= x1; x++) poser(g, x, y, c); }
    function pointe(g, x, base, hauteur, largeur) {     // pointe d'os qui s'affine vers le haut
        for (let i = 0; i < hauteur; i++) {
            const l = Math.max(1, Math.round(largeur * (1 - i / hauteur)));
            for (let j = 0; j < l; j++) poser(g, x + j, base - i, j === l - 1 && l > 1 ? 'b' : 'B');
        }
    }

    // i : 0..7 (position dans le cycle de marche) ; charge : gueule ouverte, pustules allumées
    function dessiner_corps(i, charge) {
        const g = grille();
        const a = (i / IMAGES) * Math.PI * 2;
        const balance = Math.round(3 * Math.sin(a));             // jambes qui avancent / reculent
        const bras = Math.round(3 * Math.sin(a + Math.PI));      // le bras va à l'opposé de la jambe avant
        const s = Math.cos(2 * a) < 0 ? 1 : 0;                   // le corps monte et descend
        const leveAvant = Math.cos(a) > 0.6 ? 2 : 0;             // le pied qui passe devant se soulève
        const leveArriere = Math.cos(a) < -0.6 ? 2 : 0;

        // Jambe arrière (dans l'ombre), puis jambe avant
        rect(g, 38 - balance, 44, 44 - balance, 58 - leveArriere, 't');
        rect(g, 36 - balance, 59 - leveArriere, 45 - balance, 62 - leveArriere, 'g');
        rect(g, 23 + balance, 44, 30 + balance, 58 - leveAvant, 'T');
        rect(g, 20 + balance, 59 - leveAvant, 30 + balance, 62 - leveAvant, 'G');

        // Bassin, pantalon déchiré
        rect(g, 20, 38 + s, 48, 46, 'T');
        for (let x = 22; x <= 46; x += 4) { poser(g, x, 47, 'T'); poser(g, x + 1, 47, 'T'); }

        // Bras arrière, dans l'ombre
        ellipse(g, 51, 34 + s, 5, 9, 'g');

        // Torse et énorme bosse
        ellipse(g, 36, 24 + s, 19, 16, 'G');
        ellipse(g, 34, 34 + s, 15, 9, 'G');

        // Pointes d'os qui percent la bosse
        for (const [x, h] of [[24, 9], [31, 12], [38, 11], [44, 9], [49, 6]]) pointe(g, x, 12 + s + (x > 40 ? 2 : 0), h, 3);

        // Plis et muscles du torse (traits d'ombre)
        trait(g, 25, 27 + s, 31, 29 + s, 'g'); trait(g, 31, 29 + s, 38, 28 + s, 'g');   // pectoraux
        trait(g, 23, 40 + s, 32, 42 + s, 'g'); trait(g, 32, 42 + s, 41, 41 + s, 'g');   // pli du ventre
        trait(g, 40, 14 + s, 46, 20 + s, 'g');                                         // creux de la bosse

        // Tête basse, enfoncée dans les épaules : crâne rond, mâchoire prognathe
        ellipse(g, 16, 21 + s, 8, 7.5, 'H', 0.05);
        ellipse(g, 13, 28 + s, 8.5, 4.2, 'H', 0.04);

        // Bras-massue devant : épaule énorme, avant-bras qui s'affine, main à griffes
        ellipse(g, 21, 32 + s, 7, 8.5, 'A');
        for (let y = 36; y <= 47; y++) {
            const l = 10 - Math.round((y - 36) * 0.3);           // l'avant-bras s'affine vers le poignet
            rect(g, 11 + bras + (10 - l) / 2, y + s * (y < 42 ? 1 : 0), 11 + bras + (10 - l) / 2 + l - 1, y, 'A');
        }
        ellipse(g, 14 + bras, 50, 5.5, 4, 'A', 0.03);           // paume
        for (const fx of [9, 13, 17]) {                          // trois doigts griffus
            rect(g, fx + bras, 52, fx + bras + 1, 56, 'A');
            poser(g, fx + bras, 57, 'B'); poser(g, fx + bras + 1, 57, 'b');
        }
        trait(g, 17, 29 + s, 23, 37 + s, 'g');                   // biceps

        // Côtes apparentes, plaies
        for (const y of [30, 33, 36]) for (let x = 28; x <= 37; x++) poser(g, x, y + s, x % 3 === 0 ? 'b' : 'B');
        for (const [x, y] of [[41, 29], [42, 30], [43, 31], [44, 32], [30, 19], [31, 20]]) poser(g, x, y + s, 'r');

        // Pustules d'acide : elles palpitent en marchant et clignotent avant le crachat
        [[42, 18], [46, 24], [33, 16], [50, 30], [26, 40], [39, 22], [45, 38]].forEach(([x, y], k) => {
            const allumee = charge ? (i + k) % 2 === 0 : (i + k) % 4 === 0;
            const c = allumee ? 'p' : 'P';
            poser(g, x, y + s, c); poser(g, x + 1, y + s, c); poser(g, x, y + s + 1, c);
        });

        // Gueule : fermée en marchant, s'ouvre et se referme en grondant avant le crachat
        if (charge) {
            const o = i % 2 ? 2 : 0;
            rect(g, 4, 24 + s, 17, 32 + s + o, 'R');
            for (let x = 5; x <= 16; x += 3) { poser(g, x, 24 + s, 'W'); poser(g, x, 25 + s, 'W'); poser(g, x + 1, 32 + s + o, 'W'); poser(g, x + 1, 31 + s + o, 'W'); }
            rect(g, 4, 28 + s, 5, 29 + s, 'r');                 // langue
            poser(g, 2, 30 + s, 'P'); poser(g, 1, 32 + s + o, 'P'); poser(g, 1, 34 + s + o, 'p');   // bave acide
        } else {
            rect(g, 8, 27 + s, 17, 28 + s, 'R');
            for (let x = 9; x <= 17; x += 3) poser(g, x, 27 + s, 'W');
        }
        // Œil pâle au fond d'une orbite creuse, sous une arcade épaisse ; narines
        rect(g, 9, 18 + s, 14, 21 + s, 'g');
        rect(g, 10, 19 + s, 12, 20 + s, 'Y');
        trait(g, 8, 17 + s, 16, 16 + s, 'K');
        poser(g, 7, 23 + s, 'K'); poser(g, 9, 23 + s, 'K');

        return finir(g);
    }

    // Contours internes, ombres à deux tons (lumière en haut à gauche), contour extérieur
    function finir(g) {
        const vide = (x, y) => x < 0 || y < 0 || x >= N || y >= N || !g[y][x];
        const rangPeau = (x, y) => (vide(x, y) ? -1 : (PEAU[g[y][x]] ?? -1));
        const res = g.map(l => l.slice());
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const c = g[y][x];
            if (c in PEAU) {
                const r = PEAU[c];
                if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([vx, vy]) => rangPeau(vx, vy) > r)) { res[y][x] = 'K'; continue; }
                // Côté ombre : une bande de 3-4 pixels sur le bord bas/droit, comme sur les zombies
                const ombre = vide(x + 4, y + 2) || vide(x + 2, y + 3) || vide(x + 3, y) || vide(x + 1, y + 3)
                    || rangPeau(x + 3, y + 1) > r || rangPeau(x + 1, y + 3) > r;
                res[y][x] = ombre ? 'g' : 'G';
            } else if (c in TISSU) {
                res[y][x] = vide(x + 2, y + 1) || vide(x + 1, y + 2) ? 't' : 'T';
            }
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
        marche: Array.from({ length: IMAGES }, (_, i) => en_image(dessiner_corps(i, false))),
        charge: Array.from({ length: IMAGES }, (_, i) => en_image(dessiner_corps(i, true)))
    };
})();
