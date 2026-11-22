/* =========================================================================
   SPRITE DE « L'INFIRMIER » (pixel art généré au chargement, voir pixel_art.js)
   Un infirmier zombifié : blouse blanche tachée, brassard à croix rouge,
   calot et masque chirurgical, seringue verte dans une main, trousse dans
   l'autre. Il boite : sa jambe avant reste raide et le corps plonge quand
   il pose le pied. Grille 64×64.
   - marche : 12 images
   - soin : 4 images (il lève la seringue, qui brille)
   ========================================================================= */
const SPRITES_INFIRMIER = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#b9b08f', s: '#8a7f64',     // peau de zombie
        W: '#e6e6de', w: '#aeb0a6',     // blouse
        B: '#5a8ac0', b: '#3a6090',     // pantalon de bloc
        C: '#6ab0a0', c: '#3f7e70',     // calot et masque
        X: '#7aff9a', x: '#2ac860',     // produit de la seringue
        G: '#c4ccd4',                   // métal
        T: '#7a4a2a', t: '#4e2e18',     // trousse
        Q: '#d42a2a',                   // croix rouge
        Y: '#fef3c0',
        R: '#3b1725', r: '#6a2a2a',
        N: '#1a1a1a',
        K: '#050403'
    };
    const PARTIES = {
        b: { rang: 0, base: 'W', ombre: 'w', bande: 'fine' },     // bras arrière (manche)
        q: { rang: 0, base: 'B', ombre: 'b', bande: 'fine' },     // jambe arrière
        O: { rang: 0.5, base: 'T', ombre: 't', bande: 'fine' },   // trousse
        J: { rang: 1, base: 'B', ombre: 'b', bande: 'fine' },     // jambe avant (raide)
        V: { rang: 2, base: 'W', ombre: 'w', bande: 'fine' },     // blouse
        H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // tête
        M: { rang: 3.5, base: 'C', ombre: 'c', bande: 'fine' },   // calot, masque
        A: { rang: 4, base: 'W', ombre: 'w', bande: 'fine' },     // bras avant (manche)
        P: { rang: 4, base: 'S', ombre: 's', bande: 'fine' }      // mains
    };

    function jambe(g, hx, hy, angle, plie, partie) {
        const gx = hx - Math.sin(angle) * 11, gy = hy + Math.cos(angle) * 11;
        const tibia = angle - plie;
        const px = gx - Math.sin(tibia) * 10, py = gy + Math.cos(tibia) * 10;
        membre(g, hx, hy, gx, gy, 6, partie);
        membre(g, gx, gy, px, py, 5, partie);
        rect(g, px - 4, py + 1, px + 2, py + 2, 'N');            // sabots
    }

    function tete(g, x, y) {
        ellipse(g, x, y, 6, 6.5, 'H', 0.05);
        rect(g, x - 5, y - 7, x + 6, y - 4, 'M');                 // calot
        rect(g, x - 7, y + 1, x - 1, y + 5, 'M');                 // masque sur la bouche
        trait(g, x - 1, y + 2, x + 4, y - 1, 'c');               // élastique
        rect(g, x - 4, y - 2, x - 3, y - 1, 'Y');                 // œil
        trait(g, x - 5, y - 3, x - 2, y - 3, 'N');               // sourcil
        poser(g, x - 6, y + 6, 'r');                              // sang qui coule sous le masque
    }

    function blouse(g, x, y) {
        ellipse(g, x, y, 8, 10, 'V', 0.04);
        rect(g, x - 6, y + 6, x + 8, y + 16, 'V');                // pans de la blouse
        for (let k = x - 6; k <= x + 8; k += 3) poser(g, k, y + 17, 'V');
        trait(g, x - 2, y - 7, x - 2, y + 16, 'w');               // fermeture
        rect(g, x - 6, y + 2, x - 4, y + 4, 'w');                 // poche
        poser(g, x - 5, y + 1, 'Q'); poser(g, x - 4, y + 1, 'B'); // stylos
        poser(g, x + 3, y + 5, 'r'); poser(g, x + 4, y + 6, 'r'); poser(g, x + 2, y + 10, 'r');   // taches
    }

    // Seringue tenue à la main (x, y) et pointée dans la direction (dx, dy)
    function seringue(g, x, y, dx, dy, brille) {
        trait(g, x, y, x + dx * 6, y + dy * 6, 'X');
        trait(g, x - dy, y + dx, x + dx * 6 - dy, y + dy * 6 + dx, brille ? 'X' : 'x');
        trait(g, x + dx * 7, y + dy * 7, x + dx * 10, y + dy * 10, 'G');   // aiguille
        poser(g, x - dx * 2, y - dy * 2, 'G');                              // piston
    }

    function dessiner(mode, i) {
        const g = PixelArt.grille(64);
        const soin = mode === 'soin';
        const a = (i / (soin ? 4 : 12)) * Math.PI * 2;
        // Boiterie : la jambe avant ne plie jamais ; le corps plonge quand elle se pose
        const plonge = soin ? 0 : Math.round(Math.max(0, -Math.sin(a)) * 2);
        const hx = 32, hy = 37 + plonge;

        jambe(g, hx + 1, hy, soin ? -0.1 : 0.5 * Math.sin(a + Math.PI), soin ? 0.2 : 0.6 * Math.max(0, Math.cos(a + Math.PI)), 'q');
        jambe(g, hx - 1, hy, soin ? 0.15 : 0.3 * Math.sin(a), 0, 'J');

        // Bras arrière : la trousse pend au bout
        const ey = 22 + plonge;
        membre(g, hx + 3, ey, hx + 8, ey + 7, 5, 'b');
        membre(g, hx + 8, ey + 7, hx + 12, ey + 12, 4, 'b');
        rect(g, hx + 9, ey + 13, hx + 18, ey + 19, 'O');
        trait(g, hx + 11, ey + 12, hx + 15, ey + 12, 't');
        const cx = hx + 14, cy = ey + 16;
        poser(g, cx, cy, 'Q'); poser(g, cx - 1, cy, 'Q'); poser(g, cx + 1, cy, 'Q'); poser(g, cx, cy - 1, 'Q'); poser(g, cx, cy + 1, 'Q');

        blouse(g, hx, 28 + plonge);
        const lève = soin ? Math.round(Math.sin(a) * 2) : 0;
        tete(g, hx - 4, 13 + plonge);

        // Bras avant : brassard à croix rouge ; seringue tendue (ou levée pour soigner)
        if (soin) {
            membre(g, hx - 1, ey + 1, hx - 7, ey - 4, 5, 'A');
            membre(g, hx - 7, ey - 4, hx - 9, ey - 12 + lève, 4, 'A');
            membre(g, hx - 9, ey - 12 + lève, hx - 10, ey - 15 + lève, 3, 'P');
            seringue(g, hx - 10, ey - 16 + lève, 0, -1, true);
        } else {
            membre(g, hx - 1, ey + 1, hx - 8, ey + 4, 5, 'A');
            membre(g, hx - 8, ey + 4, hx - 15, ey + 4 + plonge, 4, 'A');
            membre(g, hx - 15, ey + 4 + plonge, hx - 18, ey + 5 + plonge, 3, 'P');
            seringue(g, hx - 19, ey + 4 + plonge, -1, 0, false);
        }
        rect(g, hx - 4, ey + 1, hx - 2, ey + 3, 'G');             // brassard
        poser(g, hx - 3, ey + 1, 'Q'); poser(g, hx - 3, ey + 2, 'Q'); poser(g, hx - 3, ey + 3, 'Q'); poser(g, hx - 4, ey + 2, 'Q'); poser(g, hx - 2, ey + 2, 'Q');
        return PixelArt.finir(g, PARTIES);
    }

    const serie = (mode, n) => Array.from({ length: n }, (_, i) => PixelArt.en_image(dessiner(mode, i), COULEURS));
    return { marche: serie('marche', 12), soin: serie('soin', 4) };
})();
