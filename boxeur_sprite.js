/* =========================================================================
   SPRITE DU « BOXEUR » (pixel art généré au chargement, voir pixel_art.js)
   Un boxeur zombifié : torse nu décharné, short rouge à ceinture blanche,
   gros gants rouges, bandeau, chaussures montantes. Il sautille sur la pointe
   des pieds, genoux fléchis, la garde haute devant le visage. Grille 64×64.
   - marche : 12 images (petits pas sautillés)
   - esquive : 4 images (il se baisse et plonge sous ses gants)
   ========================================================================= */
const SPRITES_BOXEUR = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#a8a48c', s: '#7a7660',     // peau grise
        O: '#c82a2a', o: '#861414',     // short
        R: '#e0302e', r: '#981a1a',     // gants
        W: '#ece6da',                   // ceinture, bandeau, chaussettes
        N: '#1a1a1a',                   // chaussures
        Y: '#fef3c0',
        M: '#3b1725', m: '#6a2a2a',     // bouche, sang
        h: '#2a221c',
        K: '#050403'
    };
    const PARTIES = {
        b: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },     // bras arrière
        q: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },     // jambe arrière
        T: { rang: 1, base: 'S', ombre: 's', bande: 'large' },    // torse
        C: { rang: 1.5, base: 'O', ombre: 'o', bande: 'fine' },   // short
        J: { rang: 2, base: 'S', ombre: 's', bande: 'fine' },     // jambe avant
        H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // tête
        A: { rang: 4, base: 'S', ombre: 's', bande: 'fine' },     // bras avant
        G: { rang: 5, base: 'R', ombre: 'r', bande: 'fine' },     // gant avant
        g: { rang: 0.5, base: 'R', ombre: 'r', bande: 'fine' }    // gant arrière
    };

    // Jambe toujours fléchie, sur la pointe du pied
    function jambe(g, hx, hy, angle, plie, partie) {
        const gx = hx - Math.sin(angle) * 9, gy = hy + Math.cos(angle) * 9;
        const tibia = angle - plie;
        const px = gx - Math.sin(tibia) * 9, py = gy + Math.cos(tibia) * 9;
        membre(g, hx, hy, gx, gy, 6, partie);
        membre(g, gx, gy, px, py, 5, partie);
        rect(g, px - 2, py - 3, px + 2, py - 2, 'W');            // chaussettes
        rect(g, px - 3, py - 1, px + 2, py + 1, 'N');            // chaussures
    }

    function tete(g, x, y) {
        ellipse(g, x, y, 6, 6.5, 'H', 0.05);
        rect(g, x - 6, y - 4, x + 6, y - 3, 'W');                 // bandeau
        poser(g, x + 7, y - 3, 'W'); poser(g, x + 8, y - 2, 'W');
        rect(g, x - 3, y - 7, x + 4, y - 6, 'h');
        rect(g, x - 4, y - 1, x - 3, y, 'Y');
        trait(g, x - 5, y - 2, x - 2, y - 2, 'N');
        rect(g, x - 6, y + 3, x - 3, y + 4, 'M');
        poser(g, x - 5, y + 3, 'W');                              // protège-dents
        poser(g, x - 2, y + 5, 'm');
    }

    function torse(g, x, y) {
        ellipse(g, x, y, 7, 9, 'T', 0.05);
        for (let k = 0; k < 3; k++) trait(g, x - 3, y - 2 + k * 3, x + 2, y - 1 + k * 3, 's');   // côtes
        rect(g, x - 7, y + 7, x + 7, y + 14, 'C');                // short
        trait(g, x - 7, y + 7, x + 7, y + 7, 'W');                // ceinture
        poser(g, x + 3, y + 1, 'm'); poser(g, x + 4, y + 2, 'm'); // morsure
    }

    function gant(g, x, y, partie) {
        ellipse(g, x, y, 4.2, 3.8, partie, 0);
        poser(g, x + 2, y + 3, 'W');                              // lacet
    }

    function dessiner(mode, i) {
        const g = PixelArt.grille(64);
        const esquive = mode === 'esquive';
        const a = (i / (esquive ? 4 : 12)) * Math.PI * 2;
        // Il sautille : deux petits bonds par cycle de pas
        const saut = esquive ? 0 : Math.round(Math.abs(Math.sin(a)) * 2);
        const baisse = esquive ? [3, 6, 6, 3][i] : 0;             // il se baisse puis se relève
        const penche = esquive ? [2, 4, 4, 2][i] : 0;
        const hx = 33, hy = 38 - saut + baisse;

        jambe(g, hx + 2, hy, esquive ? -0.35 : 0.3 * Math.sin(a + Math.PI) - 0.1, 0.55 + (esquive ? 0.4 : 0), 'q');
        jambe(g, hx - 2, hy, esquive ? 0.35 : 0.3 * Math.sin(a) + 0.1, 0.55 + (esquive ? 0.4 : 0), 'J');

        const ty = 27 - saut + baisse, ex = hx - 1 - penche, ey = 21 - saut + baisse;
        // Garde : gant arrière au menton, gant avant devant le visage (il « pompe » un peu)
        const pompe = esquive ? 0 : Math.round(Math.sin(a * 2));
        membre(g, ex + 3, ey, ex - 2, ey + 6, 5, 'b');
        membre(g, ex - 2, ey + 6, ex - 6, ey - 1, 4, 'b');
        gant(g, ex - 7, ey - 3, 'g');

        torse(g, hx - penche / 2, ty);
        tete(g, hx - 5 - penche * 1.5, 13 - saut + baisse + penche);

        membre(g, ex, ey + 1, ex - 7, ey + 7, 5, 'A');
        membre(g, ex - 7, ey + 7, ex - 12 + pompe, ey + 1, 4, 'A');
        gant(g, ex - 14 + pompe, ey - 1, 'G');
        return PixelArt.finir(g, PARTIES);
    }

    const serie = (mode, n) => Array.from({ length: n }, (_, i) => PixelArt.en_image(dessiner(mode, i), COULEURS));
    return { marche: serie('marche', 12), esquive: serie('esquive', 4) };
})();
