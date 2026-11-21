/* =========================================================================
   SPRITES DU ZOMBIE ATTACHÉ (cible de l'entraînement, voir tutoriel.js)
   Un zombie ficelé à un poteau de bois : cordes autour du torse et des
   jambes, mains liées derrière le poteau. Il se débat : il tire sur ses
   liens, se balance, claque des mâchoires vers la recrue et donne des coups
   de pied. Grille 64×64, regard vers la gauche (comme les autres zombies).
   - lutte : 8 images (attaché au poteau)
   - libre : 8 images (le même zombie sans poteau ni cordes, pour sa chute)
   - poteau : 1 image (le poteau resté debout, cordes coupées qui pendent)
   ========================================================================= */
const SPRITES_ATTACHE = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#b9b08f', s: '#8a7f64',     // peau de zombie
        C: '#5a6470', c: '#3a424c',     // chemise déchirée
        Q: '#4f342f', q: '#2f1f1b',     // pantalon
        P: '#7a5232', p: '#4e3420',     // poteau de bois
        R: '#d8c08a', r: '#a08a5a',     // corde
        D: '#5a4026',                   // terre
        h: '#2a221c', Y: '#fef3c0',
        M: '#3b1725', m: '#6a2a2a',     // bouche, sang
        W: '#ece6da',                   // dents
        K: '#050403'
    };
    const PARTIES = {
        O: { rang: 0, base: 'P', ombre: 'p', bande: 'fine' },     // poteau (derrière)
        q: { rang: 1, base: 'Q', ombre: 'q', bande: 'fine' },     // jambe arrière
        T: { rang: 2, base: 'C', ombre: 'c', bande: 'fine' },     // torse
        J: { rang: 3, base: 'Q', ombre: 'q', bande: 'fine' },     // jambe avant
        H: { rang: 4, base: 'S', ombre: 's', bande: 'large' }     // tête
    };

    function poteau(g) {
        ellipse(g, 37, 61, 10, 2.5, 'D', 0.2);
        rect(g, 34, 6, 39, 61, 'O');
        rect(g, 33, 5, 40, 6, 'O');                               // tête du poteau
        trait(g, 36, 12, 36, 58, 'p');                            // veine du bois
    }

    // mode : 'lutte' (attaché), 'libre' (sans poteau ni cordes), i : image 0..7
    function dessiner(mode, i) {
        const g = PixelArt.grille(64);
        const attache = mode === 'lutte';
        const a = (i / 8) * Math.PI * 2;
        const tire = Math.round(Math.sin(a) * 2);                 // il tire sur ses liens, vers l'avant
        const mord = i % 2 === 0;                                 // claque des mâchoires
        if (attache) poteau(g);

        // Jambes : la jambe avant donne des coups de pied
        const hx = 32 + Math.round(tire / 2), hy = 40;
        membre(g, hx + 1, hy, hx + 2, hy + 11, 6, 'q');
        membre(g, hx + 2, hy + 11, hx + 2, hy + 21, 5, 'q');
        const coup = attache ? Math.max(0, Math.sin(a * 2)) * 5 : 0;
        membre(g, hx - 1, hy, hx - 2 - coup, hy + 11, 6, 'J');
        membre(g, hx - 2 - coup, hy + 11, hx - 3 - coup * 1.4, hy + 21 - coup / 2, 5, 'J');
        rect(g, hx - 1, hy + 21, hx + 4, hy + 22, 'h');
        rect(g, hx - 7 - coup * 1.4, hy + 21 - coup / 2, hx - 2 - coup * 1.4, hy + 22 - coup / 2, 'h');

        // Torse (chemise déchirée), penché vers la recrue quand il tire
        const tx = 31 + tire, ty = 29;
        ellipse(g, tx, ty, 7, 10, 'T', 0.06);
        for (let x = tx - 6; x <= tx + 6; x += 3) poser(g, x, ty + 10, 'T');
        poser(g, tx - 2, ty + 2, 'm'); poser(g, tx - 1, ty + 3, 'm'); poser(g, tx + 3, ty - 3, 'S'); poser(g, tx + 4, ty - 2, 'S');

        // Tête : il tend le cou et mord dans le vide
        const tex = 25 + tire * 1.5 - (mord ? 1 : 0), tey = 13 + (mord ? 1 : 0);
        ellipse(g, tex, tey, 6.5, 7, 'H', 0.05);
        rect(g, tex - 3, tey - 7, tex + 5, tey - 6, 'h'); poser(g, tex + 6, tey - 4, 'h');
        rect(g, tex - 4, tey - 2, tex - 3, tey - 1, 'Y');
        trait(g, tex - 5, tey - 3, tex - 2, tey - 3, 'K');       // sourcil furieux
        if (mord) { rect(g, tex - 6, tey + 2, tex - 3, tey + 5, 'M'); trait(g, tex - 6, tey + 2, tex - 3, tey + 2, 'W'); }
        else trait(g, tex - 6, tey + 3, tex - 3, tey + 3, 'M');
        poser(g, tex - 4, tey + 6, 'm');                          // bave

        if (attache) {
            // Mains liées derrière le poteau
            ellipse(g, 41, 31, 2, 2, 'S', 0); poser(g, 42, 33, 's');
            // Cordes : deux tours autour du torse, un autour des jambes (elles suivent le corps)
            for (const [y, de] of [[24, tx - 7], [33, tx - 7], [50, hx - 4]]) {
                trait(g, de, y, 40, y, 'R');
                trait(g, de, y + 1, 40, y + 1, 'r');
                poser(g, de + 3, y, 'r'); poser(g, de + 8, y, 'r');   // torons
            }
            poser(g, 41, 24, 'R'); poser(g, 41, 33, 'R');            // nœuds
        }
        return PixelArt.finir(g, PARTIES);
    }

    // Le poteau seul, cordes tranchées qui pendent
    function poteau_seul() {
        const g = PixelArt.grille(64);
        poteau(g);
        for (const y of [24, 33, 50]) {
            trait(g, 33, y, 33, y + 5, 'R');
            trait(g, 40, y, 41, y + 4, 'R');
            poser(g, 32, y + 6, 'r');
        }
        return PixelArt.finir(g, PARTIES);
    }

    const serie = mode => Array.from({ length: 8 }, (_, i) => PixelArt.en_image(dessiner(mode, i), COULEURS));
    return { lutte: serie('lutte'), libre: serie('libre'), poteau: PixelArt.en_image(poteau_seul(), COULEURS) };
})();
