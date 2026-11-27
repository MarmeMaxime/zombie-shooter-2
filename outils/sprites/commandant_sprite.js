/* =========================================================================
   LE COMMANDANT (chapitre 3 : la caserne du génie, le supérieur de Mira)
   Pixel art généré au chargement (pixel_art.js). Un vieil officier fatigué :
   képi à bandeau doré, lunettes rondes, moustache grise tombante, cernes,
   veste vert bouteille à boutons dorés et rangée de médailles.
   - SPRITES_COMMANDANT : en pied, de face, mains dans le dos. Grille 64×64.
     0 : bouche fermée ; 1 : il parle.
   - SPRITES_COMMANDANT.portrait : son portrait dans la boîte de dialogue.
     Grille 40×40, ×2. 0 : bouche fermée ; 1 : il parle.
   ========================================================================= */
const SPRITES_COMMANDANT = (() => {
    const { poser, ellipse, rect, trait } = PixelArt;
    const COULEURS = {
        S: '#e0b48e', s: '#b48462',     // peau
        G: '#2c4632', g: '#1c2e20',     // veste vert bouteille
        P: '#2c4632', p: '#1c2e20',     // pantalon
        H: '#1e2a44', h: '#121a2c',     // képi bleu nuit
        Y: '#e8c24a', y: '#a8862a',     // dorures (bandeau, boutons, galons)
        M: '#c8c8c0',                   // moustache et tempes grises
        L: '#e8eef0',                   // reflet des lunettes
        N: '#1a1612',                   // yeux, monture, chaussures
        C: '#8a6a5a',                   // cernes
        R: '#5a1a1a', W: '#ece6da',     // bouche ouverte, dents
        D: '#c83030', B: '#3a6ac8',     // rubans des médailles
        K: '#050403'
    };
    const PARTIES = {
        P: { rang: 0, base: 'P', ombre: 'p', bande: 'fine' },     // jambes
        G: { rang: 1, base: 'G', ombre: 'g', bande: 'large' },    // veste
        V: { rang: 2, base: 'S', ombre: 's', bande: 'large' },    // tête
        X: { rang: 3, base: 'H', ombre: 'h', bande: 'fine' }      // képi
    };

    // Le visage, commun au sprite en pied et au portrait (cx : milieu, y0 : haut des sourcils, k : échelle)
    function visage(g, cx, y0, k, parle) {
        const X = v => Math.round(cx + v * k), Y = v => Math.round(y0 + v * k);
        // Sourcils gris, un peu relevés au milieu (l'air las)
        trait(g, X(-5), Y(1), X(-2), Y(0), 'M'); trait(g, X(5), Y(1), X(2), Y(0), 'M');
        // Lunettes rondes : deux cercles de monture, un reflet
        for (const dx of [-3, 3]) {
            const r = Math.max(1, Math.round(1.6 * k));
            for (let a = 0; a < 16; a++) poser(g, X(dx) + Math.round(Math.cos(a / 16 * Math.PI * 2) * r), Y(3) + Math.round(Math.sin(a / 16 * Math.PI * 2) * r), 'N');
            poser(g, X(dx), Y(3), 'N');
            poser(g, X(dx) - 1, Y(3) - 1, 'L');
        }
        trait(g, X(-1), Y(3), X(1), Y(3), 'N');                     // pont des lunettes
        trait(g, X(-4), Y(5), X(-2), Y(5), 'C'); trait(g, X(2), Y(5), X(4), Y(5), 'C');   // cernes
        trait(g, X(0), Y(4), X(0), Y(6), 's');                      // nez
        // Moustache grise tombante
        rect(g, X(-3), Y(7), X(3), Y(7), 'M');
        trait(g, X(-3), Y(7), X(-4), Y(9), 'M'); trait(g, X(3), Y(7), X(4), Y(9), 'M');
        if (parle) { rect(g, X(-2), Y(8), X(2), Y(9), 'R'); trait(g, X(-2), Y(8), X(2), Y(8), 'W'); }
        else trait(g, X(-2), Y(9), X(2), Y(9), 'N');
    }

    function en_pied(parle) {
        const g = PixelArt.grille(64);
        // Jambes droites, chaussures cirées
        rect(g, 25, 40, 31, 58, 'P'); rect(g, 33, 40, 39, 58, 'P');
        rect(g, 24, 58, 31, 61, 'N'); rect(g, 33, 58, 40, 61, 'N');
        // Veste longue, épaules un peu tombantes (mains dans le dos : pas de bras devant)
        ellipse(g, 32, 29, 10.5, 10, 'G', 0.03);
        rect(g, 22, 29, 42, 43, 'G');
        // Cou, tête ronde, tempes grises
        rect(g, 29, 16, 35, 20, 'V');
        ellipse(g, 32, 12, 6, 6.5, 'V', 0.03);
        rect(g, 27, 12, 37, 16, 'V');
        // Képi : calotte droite, bandeau doré, visière noire
        rect(g, 26, 1, 38, 7, 'X');
        visage(g, 32, 8, 1, parle);
        const res = PixelArt.finir(g, PARTIES);
        // Détails posés après les finitions (ils gardent leur couleur exacte)
        rect(res, 26, 5, 38, 6, 'Y');                               // bandeau doré
        rect(res, 25, 7, 39, 7, 'N');                               // visière
        poser(res, 32, 3, 'Y');                                     // insigne
        poser(res, 26, 12, 'M'); poser(res, 38, 12, 'M');           // tempes grises
        for (let y = 23; y <= 41; y += 4) poser(res, 32, y, 'Y');   // boutons dorés
        trait(res, 32, 21, 32, 42, 'g');
        // Médailles sur la poitrine (ruban, puis la médaille)
        for (const [x, c] of [[25, 'D'], [27, 'B'], [29, 'D']]) { poser(res, x, 24, c); poser(res, x, 25, c); poser(res, x, 26, 'Y'); }
        // Galons d'épaule
        rect(res, 22, 21, 25, 21, 'Y'); rect(res, 39, 21, 42, 21, 'Y');
        rect(res, 22, 42, 42, 43, 'g');                             // bas de la veste
        return res;
    }

    function portrait(parle) {
        const g = PixelArt.grille(40);
        // Épaules, col de la veste, galons
        ellipse(g, 20, 40, 17, 8, 'G', 0.03);
        rect(g, 17, 30, 23, 33, 'V');                               // cou
        // Visage rond et fatigué
        ellipse(g, 20, 20, 9, 10, 'V', 0.03);
        rect(g, 12, 19, 28, 27, 'V');
        // Képi
        rect(g, 11, 2, 29, 11, 'X');
        visage(g, 20, 13, 1.8, parle);
        const res = PixelArt.finir(g, PARTIES);
        rect(res, 11, 8, 29, 10, 'Y');                              // bandeau doré
        rect(res, 10, 11, 30, 12, 'N');                             // visière
        rect(res, 19, 4, 21, 6, 'Y');                               // insigne
        for (const x of [12, 28]) { poser(res, x, 14, 'M'); poser(res, x, 15, 'M'); poser(res, x, 16, 'M'); }   // tempes grises
        for (const x of [5, 32]) { trait(res, x, 36, x + 3, 35, 'Y'); trait(res, x, 38, x + 3, 37, 'Y'); }      // galons
        trait(res, 16, 33, 20, 37, 'g'); trait(res, 24, 33, 20, 37, 'g');                                        // col
        for (const [x, c] of [[13, 'D'], [15, 'B'], [17, 'D']]) { poser(res, x, 37, c); poser(res, x, 38, 'Y'); }
        return res;
    }

    const sprites = [en_pied(false), en_pied(true)].map(g => PixelArt.en_image(g, COULEURS));
    sprites.portrait = [portrait(false), portrait(true)].map(g => PixelArt.en_image(g, COULEURS, 2));
    return sprites;
})();
