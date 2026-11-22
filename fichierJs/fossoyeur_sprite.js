/* =========================================================================
   SPRITES DU BOSS « LE FOSSOYEUR » ET DE SES TOMBES (pixel art généré au chargement)
   Un fossoyeur géant et décharné : haut-de-forme, redingote noire en lambeaux,
   peau grise, yeux verdâtres, sourire cousu. Une grande pelle dans la main
   avant, une lanterne dans la main arrière. Il marche à grandes enjambées
   raides. Grille 64×64 affichée ×2 (comme le Mastodonte), il regarde à gauche.
   - marche : 8 images
   - lancer : 4 images (il lève la pelle puis jette sa pelletée)
   La tombe : grille 32×32 ; intacte, fissurée, puis une main qui sort.
   ========================================================================= */
const SPRITES_FOSSOYEUR = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#9aa6a0', s: '#6c7872',     // peau grise
        C: '#2f2b38', c: '#1b1822',     // redingote
        Q: '#3a3440', q: '#24202a',     // pantalon
        H: '#1c1b20', h: '#0e0d12',     // haut-de-forme
        R: '#6a2a2a',                   // ruban du chapeau, coutures
        W: '#7a5a3a', w: '#4e3622',     // manche de la pelle
        M: '#a0a6ae', m: '#5e646c',     // fer de la pelle
        L: '#ffd23c', l: '#c89a1a',     // lanterne
        D: '#5a4026', d: '#3a2816',     // terre
        G: '#8a8c90', g: '#5c5e62',     // pierre tombale
        Y: '#cfff6a',                   // yeux
        N: '#141414',
        K: '#050403'
    };
    const PARTIES = {
        q: { rang: 0, base: 'Q', ombre: 'q', bande: 'fine' },     // jambe arrière
        b: { rang: 0, base: 'C', ombre: 'c', bande: 'fine' },     // bras arrière
        T: { rang: 1, base: 'C', ombre: 'c', bande: 'fine' },     // redingote
        J: { rang: 2, base: 'Q', ombre: 'q', bande: 'fine' },     // jambe avant
        F: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // visage
        X: { rang: 3.5, base: 'H', ombre: 'h', bande: 'fine' },   // chapeau
        A: { rang: 4, base: 'C', ombre: 'c', bande: 'fine' },     // bras avant
        P: { rang: 5, base: 'M', ombre: 'm', bande: 'fine' },     // fer de la pelle
        O: { rang: 1, base: 'G', ombre: 'g', bande: 'large' }     // pierre tombale
    };

    function jambe(g, hx, hy, angle, plie, partie) {
        const gx = hx - Math.sin(angle) * 9, gy = hy + Math.cos(angle) * 9;
        const tibia = angle - plie;
        const px = gx - Math.sin(tibia) * 9, py = gy + Math.cos(tibia) * 9;
        membre(g, hx, hy, gx, gy, 4, partie);
        membre(g, gx, gy, px, py, 4, partie);
        rect(g, px - 4, py + 1, px + 1, py + 2, 'N');              // bottes pointues
    }

    function tete(g, x, y) {
        ellipse(g, x, y, 4.5, 6, 'F', 0.05);                      // visage long et creux
        rect(g, x - 5, y - 6, x + 5, y - 5, 'X');                  // bord du chapeau
        rect(g, x - 3, y - 14, x + 3, y - 7, 'X');                 // haut-de-forme
        trait(g, x - 3, y - 8, x + 3, y - 8, 'R');                // ruban
        rect(g, x - 3, y - 2, x - 2, y - 1, 'Y');                  // œil
        trait(g, x - 4, y + 3, x, y + 3, 'N');                    // sourire cousu
        poser(g, x - 3, y + 2, 'R'); poser(g, x - 1, y + 4, 'R');
        poser(g, x + 2, y + 1, 's'); poser(g, x + 2, y + 2, 's');   // joue creuse
    }

    function redingote(g, x, y, balance) {
        ellipse(g, x, y, 7.5, 10, 'T', 0.04);
        // Pans en lambeaux qui flottent derrière lui
        for (let k = 0; k < 6; k++) {
            const bas = y + 9 + (k % 2) * 3 + (k === 5 ? 2 : 0);
            trait(g, x - 3 + k * 2, y + 4, x - 2 + k * 2 + balance, bas, 'T');
        }
        trait(g, x - 1, y - 7, x - 1, y + 6, 'c');                 // boutonnière
        poser(g, x - 2, y - 3, 'L'); poser(g, x - 2, y + 1, 'L');  // boutons de laiton
    }

    // La pelle : manche du poing (x, y) dans la direction (dx, dy), fer au bout
    function pelle(g, x, y, dx, dy, longueur) {
        const fx = x + dx * longueur, fy = y + dy * longueur;
        trait(g, x - dx * 3, y - dy * 3, fx, fy, 'W');
        trait(g, x - dx * 3 + 1, y - dy * 3, fx + 1, fy, 'w');
        ellipse(g, fx + dx * 3, fy + dy * 3, 3.2, 3.2, 'P', 0);
        poser(g, fx + dx * 4, fy + dy * 4, 'D');                   // un peu de terre sur le fer
    }

    function dessiner(mode, i) {
        const g = PixelArt.grille(64);
        const lancer = mode === 'lancer';
        const a = (i / (lancer ? 4 : 8)) * Math.PI * 2;
        const s = lancer ? 0 : (Math.cos(2 * a) < 0 ? 1 : 0);
        const hx = 33, hy = 40 + s;

        // Grandes enjambées raides (genoux presque tendus)
        jambe(g, hx + 1, hy, lancer ? -0.3 : 0.45 * Math.sin(a + Math.PI), 0.2 * Math.max(0, Math.cos(a + Math.PI)), 'q');
        jambe(g, hx - 1, hy, lancer ? 0.35 : 0.45 * Math.sin(a), 0.2 * Math.max(0, Math.cos(a)), 'J');

        // Bras arrière et sa lanterne qui se balance
        const ey = 23 + s;
        const bal = Math.round(Math.sin(a) * 2);
        membre(g, hx + 3, ey, hx + 7, ey + 7, 4, 'b');
        membre(g, hx + 7, ey + 7, hx + 8 + bal, ey + 12, 3, 'b');
        trait(g, hx + 8 + bal, ey + 13, hx + 8 + bal, ey + 14, 'N');
        rect(g, hx + 6 + bal, ey + 15, hx + 10 + bal, ey + 19, 'L');
        rect(g, hx + 7 + bal, ey + 16, hx + 9 + bal, ey + 18, 'l');
        trait(g, hx + 6 + bal, ey + 15, hx + 10 + bal, ey + 15, 'N');

        redingote(g, hx, 30 + s, bal);
        tete(g, hx - 3, 16 + s);

        if (lancer) {
            // Il lève la pelle au-dessus de sa tête (0, 1), puis la ramène vers l'avant (2, 3)
            const haut = i < 2;
            const mx = haut ? hx - 4 : hx - 14, my = haut ? ey - 10 - i * 2 : ey + 2 + (i - 2) * 2;
            membre(g, hx - 1, ey + 1, hx - 6, ey + (haut ? -3 : 4), 4, 'A');
            membre(g, hx - 6, ey + (haut ? -3 : 4), mx, my, 3, 'A');
            pelle(g, mx, my, haut ? 0.5 : -0.9, haut ? -0.85 : 0.45, 12);
            if (i === 3) { ellipse(g, mx - 18, my + 2, 3, 2.5, 'D', 0.2); poser(g, mx - 22, my, 'd'); }   // la terre part
        } else {
            // La pelle sert de canne : le fer racle le sol devant lui
            membre(g, hx - 1, ey + 1, hx - 7, ey + 7, 4, 'A');
            membre(g, hx - 7, ey + 7, hx - 12, ey + 10 + s, 3, 'A');
            pelle(g, hx - 12, ey + 10 + s, -0.25, 0.97, 16);
        }
        return PixelArt.finir(g, PARTIES);
    }

    // Tombe : 0 intacte, 1 fissurée, 2 une main sort de la terre
    function tombe(etat) {
        const g = PixelArt.grille(32);
        ellipse(g, 16, 28, 11, 3.5, 'D', 0.15);                   // terre retournée
        rect(g, 9, 9, 22, 27, 'O');
        ellipse(g, 15.5, 10, 6.5, 4, 'O', 0);                     // haut arrondi
        rect(g, 15, 12, 16, 21, 'g'); rect(g, 12, 15, 19, 16, 'g'); // croix gravée
        if (etat >= 1) { trait(g, 11, 11, 14, 17, 'N'); trait(g, 14, 17, 12, 22, 'N'); trait(g, 19, 19, 21, 24, 'N'); }
        if (etat >= 2) {
            membre(g, 26, 29, 27, 23, 3, 'F');                    // une main griffue sort de la terre
            poser(g, 26, 21, 'S'); poser(g, 28, 21, 'S'); poser(g, 27, 20, 'S');
        }
        return PixelArt.finir(g, PARTIES);
    }

    const serie = (mode, n) => Array.from({ length: n }, (_, i) => PixelArt.en_image(dessiner(mode, i), COULEURS, 2));
    return {
        marche: serie('marche', 8),
        lancer: serie('lancer', 4),
        tombe: [0, 1, 2].map(e => PixelArt.en_image(tombe(e), COULEURS))
    };
})();
