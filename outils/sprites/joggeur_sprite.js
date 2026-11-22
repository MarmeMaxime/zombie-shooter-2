/* =========================================================================
   SPRITE DU « JOGGEUR » (pixel art généré au chargement, voir pixel_art.js)
   Un zombie mort en plein footing : survêtement rouge à bandes blanches,
   bandeau, baskets. Grille 64×64 affichée en 64 (comme les zombies).
   - marche : 12 images (bras tendus, démarche de zombie)
   - course : 12 images (penché en avant, grandes enjambées, bras qui battent)
   - essouffle : 2 images (plié en deux, mains sur les genoux)
   ========================================================================= */
const SPRITES_JOGGEUR = (() => {
    const N = 64, IMAGES = 12;
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#b9b08f', s: '#8a7f64',     // peau de zombie
        V: '#8a2a2a', v: '#5a1818',     // survêtement
        W: '#ece6da', w: '#a89e8c',     // bandes, bandeau, baskets
        h: '#2a221c',                   // cheveux
        Y: '#fef3c0',                   // œil
        R: '#3b1725', r: '#6a2a2a',     // bouche, sang
        K: '#050403'
    };
    // Plus le rang est haut, plus la partie est devant
    const PARTIES = {
        b: { rang: 0, base: 'V', ombre: 'v', bande: 'fine' },   // bras arrière
        q: { rang: 0, base: 'V', ombre: 'v', bande: 'fine' },   // jambe arrière
        T: { rang: 1, base: 'V', ombre: 'v', bande: 'fine' },   // torse
        J: { rang: 2, base: 'V', ombre: 'v', bande: 'fine' },   // jambe avant
        H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },  // tête
        A: { rang: 4, base: 'V', ombre: 'v', bande: 'fine' },   // bras avant
        M: { rang: 4, base: 'S', ombre: 's', bande: 'fine' }    // mains
    };

    // Jambe : hanche -> genou -> pied, avec la basket au bout
    function jambe(g, hx, hy, angle, plie, partie) {
        const gx = hx - Math.sin(angle) * 11, gy = hy + Math.cos(angle) * 11;
        const tibia = angle - plie;
        const px = gx - Math.sin(tibia) * 11, py = gy + Math.cos(tibia) * 11;
        membre(g, hx, hy, gx, gy, 6, partie);
        membre(g, gx, gy, px, py, 5, partie);
        rect(g, px - 4, py, px + 2, py + 2, 'W');             // basket
        poser(g, px + 2, py + 2, 'w'); poser(g, px - 4, py + 2, 'w');
    }

    function tete(g, x, y) {
        ellipse(g, x, y, 6.5, 7, 'H', 0.05);
        rect(g, x - 6, y - 5, x + 6, y - 4, 'W');             // bandeau
        rect(g, x - 3, y - 8, x + 5, y - 7, 'h');              // cheveux
        poser(g, x + 6, y - 6, 'h'); poser(g, x + 6, y - 3, 'h');
        rect(g, x - 4, y - 1, x - 3, y, 'Y');                  // œil
        trait(g, x - 5, y - 2, x - 2, y - 2, 'K');            // sourcil
        rect(g, x - 6, y + 3, x - 3, y + 4, 'R');             // bouche ouverte
        poser(g, x - 2, y + 5, 'r'); poser(g, x - 1, y + 6, 'r');   // filet de sang
    }

    function torse(g, x, y, rx, ry) {
        ellipse(g, x, y, rx, ry, 'T', 0.04);
        trait(g, x - 2, y - ry + 2, x - 2, y + ry - 2, 'W');   // fermeture éclair
        poser(g, x + 3, y + 2, 'r'); poser(g, x + 4, y + 3, 'r'); poser(g, x + 3, y + 4, 'r');   // tache de sang
    }

    // Bras : épaule -> coude -> main (manche avec bande blanche, main nue)
    function bras(g, ex, ey, cx, cy, mx, my, partie) {
        membre(g, ex, ey, cx, cy, 5, partie);
        membre(g, cx, cy, mx, my, 4, partie);
        trait(g, ex, ey - 2, cx, cy - 2, 'W');
        membre(g, mx, my, mx - 3, my + 1, 3, 'M');
    }

    function dessiner(mode, i) {
        const g = PixelArt.grille(N);
        const a = (i / IMAGES) * Math.PI * 2;
        const s = Math.cos(2 * a) < 0 ? 1 : 0;                 // le corps monte et descend

        if (mode === 'essouffle') {
            // Plié en deux, mains sur les genoux, il halète (2 images)
            const h = i % 2;
            jambe(g, 34, 40, -0.15, 0.25, 'q');
            jambe(g, 31, 40, 0.15, 0.3, 'J');
            torse(g, 30, 34 + h, 10, 7);
            bras(g, 30, 32 + h, 26, 40, 24, 47, 'A');
            tete(g, 20, 30 + h);
            return PixelArt.finir(g, PARTIES);
        }

        const course = mode === 'course';
        const amplitude = course ? 0.85 : 0.45;
        const penche = course ? 4 : 0;                          // en course il se penche en avant
        const hx = 32, hy = 38 + s;

        // Jambe arrière (opposée), puis jambe avant
        jambe(g, hx + 1, hy, amplitude * Math.sin(a + Math.PI), (course ? 0.9 : 0.5) * Math.max(0, Math.cos(a + Math.PI)), 'q');
        jambe(g, hx - 1, hy, amplitude * Math.sin(a), (course ? 0.9 : 0.5) * Math.max(0, Math.cos(a)), 'J');

        // Bras arrière
        const ex = hx - 1 - penche, ey = 22 + s;
        if (course) {
            const b = 1.1 * Math.sin(a);
            bras(g, ex + 3, ey, ex + 3 + Math.sin(b) * 7, ey + 7, ex + Math.sin(b) * 12 - 2, ey + 4, 'b');
        } else {
            bras(g, ex + 3, ey - 1, ex - 6, ey + 1, ex - 14, ey + 1 + s, 'b');
        }

        torse(g, hx - penche / 2, 28 + s, 7, 10);
        tete(g, hx - 5 - penche * 1.5, 13 + s + (course ? 2 : 0));

        // Bras avant
        if (course) {
            const b = 1.1 * Math.sin(a + Math.PI);
            bras(g, ex, ey + 1, ex + Math.sin(b) * 7, ey + 8, ex + Math.sin(b) * 12 - 3, ey + 5, 'A');
        } else {
            bras(g, ex, ey + 1, ex - 8, ey + 3, ex - 16, ey + 3 - s, 'A');   // bras tendus, comme un zombie
        }
        return PixelArt.finir(g, PARTIES);
    }

    const image = (mode, i) => PixelArt.en_image(dessiner(mode, i), COULEURS);
    return {
        marche: Array.from({ length: IMAGES }, (_, i) => image('marche', i)),
        course: Array.from({ length: IMAGES }, (_, i) => image('course', i)),
        essouffle: [0, 1].map(i => image('essouffle', i))
    };
})();
