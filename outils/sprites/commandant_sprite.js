/* =========================================================================
   LE COMMANDANT (chapitre 3 : la caserne du génie, le supérieur de Mira)
   Pixel art généré au chargement (pixel_art.js). Un vieil officier fatigué :
   képi à bandeau doré, lunettes rondes, moustache grise tombante, cernes,
   veste vert bouteille (col noir passepoilé de rouge, couleurs du génie),
   boutons dorés, rangée de médailles, ceinturon.
   - SPRITES_COMMANDANT : en pied, de face, mains dans le dos. Grille 64×64.
     0 : bouche fermée ; 1 : il parle.
   - SPRITES_COMMANDANT.portrait : son portrait dans la boîte de dialogue.
     Grille 40×40, ×2. 0 : bouche fermée ; 1 : il parle.
   ========================================================================= */
const SPRITES_COMMANDANT = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#e0b48e', s: '#b48462',     // peau
        G: '#30503a', g: '#1e3426',     // veste vert bouteille
        A: '#30503a', a: '#1e3426',     // manches
        P: '#28402e', p: '#18281c',     // pantalon
        H: '#1e2a44', h: '#121a2c',     // képi bleu nuit
        Y: '#e8c24a', y: '#a8862a',     // dorures (bandeau, boutons, galons)
        M: '#d0d0c8', m: '#9a9a92',     // moustache et tempes grises
        L: '#e8eef0',                   // reflet des lunettes
        N: '#1a1612',                   // yeux, monture, chaussures
        Q: '#2a2a2a',                   // col noir
        D: '#c83030', B: '#3a6ac8',     // rubans des médailles, passepoil rouge
        C: '#a87a62',                   // cernes
        R: '#5a1a1a', W: '#ece6da',     // bouche ouverte, dents
        T: '#3a2818',                   // ceinturon
        K: '#050403'
    };
    const PARTIES = {
        P: { rang: 0, base: 'P', ombre: 'p', bande: 'fine' },     // jambes
        G: { rang: 1, base: 'G', ombre: 'g', bande: 'large' },    // veste
        A: { rang: 2, base: 'A', ombre: 'a', bande: 'fine' },     // bras (le long du corps, mains dans le dos)
        V: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // tête
        X: { rang: 4, base: 'H', ombre: 'h', bande: 'fine' }      // képi
    };

    // Le visage du portrait (grand : lunettes rondes dessinées en cercle)
    function visage_portrait(g, parle) {
        // Sourcils gris, relevés au milieu (l'air las)
        trait(g, 11, 15, 16, 14, 'M'); trait(g, 29, 15, 24, 14, 'M');
        // Lunettes rondes : deux cercles de monture, verres légèrement bleutés, un reflet
        for (const cx of [14, 26]) {
            for (let a = 0; a < 24; a++) poser(g, cx + Math.round(Math.cos(a / 24 * Math.PI * 2) * 3.2), 19 + Math.round(Math.sin(a / 24 * Math.PI * 2) * 3), 'N');
            poser(g, cx, 19, 'N'); poser(g, cx + 1, 19, 'N');
            poser(g, cx - 1, 18, 'L'); poser(g, cx - 2, 17, 'L');
        }
        trait(g, 17, 18, 23, 18, 'N');                              // pont
        trait(g, 10, 18, 8, 17, 'N'); trait(g, 30, 18, 32, 17, 'N'); // branches
        trait(g, 11, 23, 16, 23, 'C'); trait(g, 24, 23, 29, 23, 'C'); // cernes
        trait(g, 20, 20, 20, 25, 's'); poser(g, 19, 25, 's'); poser(g, 21, 25, 's');   // nez
        // Moustache grise tombante, épaisse
        rect(g, 14, 26, 26, 27, 'M');
        trait(g, 14, 27, 12, 31, 'M'); trait(g, 15, 27, 13, 31, 'M');
        trait(g, 26, 27, 28, 31, 'M'); trait(g, 25, 27, 27, 31, 'M');
        trait(g, 15, 27, 25, 27, 'm');
        if (parle) { rect(g, 16, 28, 24, 30, 'R'); trait(g, 16, 28, 24, 28, 'W'); }
        else trait(g, 16, 29, 24, 29, 'N');
        trait(g, 17, 32, 23, 32, 's');                              // le menton
    }

    function en_pied(parle) {
        const g = PixelArt.grille(64);
        // Jambes droites, plis du pantalon, chaussures cirées
        rect(g, 25, 41, 31, 58, 'P'); rect(g, 33, 41, 39, 58, 'P');
        // Veste longue à épaules un peu tombantes
        ellipse(g, 32, 29, 10.5, 10, 'G', 0.03);
        rect(g, 22, 29, 42, 44, 'G');
        // Les bras le long du corps, qui partent vers le dos (mains jointes derrière)
        membre(g, 22, 22, 21, 36, 5, 'A'); membre(g, 42, 22, 43, 36, 5, 'A');
        // Cou, tête ronde
        rect(g, 29, 16, 35, 20, 'V');
        ellipse(g, 32, 12, 6, 6.5, 'V', 0.03);
        rect(g, 27, 12, 37, 16, 'V');
        // Képi : calotte droite
        rect(g, 26, 1, 38, 7, 'X');
        const res = PixelArt.finir(g, PARTIES);
        // Détails posés après les finitions (ils gardent leur couleur exacte)
        rect(res, 26, 5, 38, 6, 'Y'); rect(res, 26, 4, 38, 4, 'y');      // bandeau doré
        rect(res, 25, 7, 39, 7, 'N'); rect(res, 27, 8, 37, 8, 'K');      // visière et son ombre
        poser(res, 32, 2, 'Y'); poser(res, 31, 3, 'y'); poser(res, 33, 3, 'y');   // insigne
        // Tempes grises, sourcils, lunettes (deux carreaux de monture et un reflet), moustache
        for (const x of [27, 37]) { poser(res, x, 10, 'M'); poser(res, x, 11, 'M'); poser(res, x, 12, 'm'); }
        trait(res, 28, 9, 30, 9, 'M'); trait(res, 34, 9, 36, 9, 'M');
        for (const x of [28, 33]) { rect(res, x, 10, x + 3, 12, 'N'); rect(res, x + 1, 11, x + 2, 11, 'S'); poser(res, x + 1, 11, 'L'); }
        trait(res, 32, 11, 32, 11, 'N');
        trait(res, 29, 13, 30, 13, 'C'); trait(res, 34, 13, 35, 13, 'C');
        rect(res, 29, 15, 35, 15, 'M'); poser(res, 28, 16, 'M'); poser(res, 36, 16, 'M'); poser(res, 28, 17, 'm'); poser(res, 36, 17, 'm');
        if (parle) { rect(res, 30, 16, 34, 17, 'R'); trait(res, 30, 16, 34, 16, 'W'); } else trait(res, 30, 17, 34, 17, 'N');
        // Col noir passepoilé de rouge, boutons dorés, médailles, galons d'épaule
        rect(res, 28, 20, 36, 21, 'Q'); trait(res, 28, 22, 31, 22, 'D'); trait(res, 33, 22, 36, 22, 'D');
        trait(res, 32, 22, 32, 43, 'g');
        for (let y = 25; y <= 41; y += 4) poser(res, 33, y, 'Y');
        for (const [x, c] of [[25, 'D'], [27, 'B'], [29, 'D']]) { poser(res, x, 25, c); poser(res, x, 26, c); poser(res, x, 27, 'Y'); }
        rect(res, 21, 21, 25, 21, 'Y'); rect(res, 39, 21, 43, 21, 'Y'); rect(res, 21, 20, 25, 20, 'y'); rect(res, 39, 20, 43, 20, 'y');
        // Ceinturon et sa boucle
        rect(res, 23, 37, 41, 38, 'T'); rect(res, 31, 37, 33, 38, 'Y');
        // Bas de la veste, plis du pantalon, chaussures
        rect(res, 23, 43, 41, 44, 'g');
        trait(res, 28, 45, 28, 57, 'p'); trait(res, 36, 45, 36, 57, 'p');
        rect(res, 24, 58, 31, 61, 'N'); rect(res, 33, 58, 40, 61, 'N'); poser(res, 26, 59, 'm'); poser(res, 35, 59, 'm');
        return res;
    }

    function portrait(parle) {
        const g = PixelArt.grille(40);
        // Épaules et veste
        ellipse(g, 20, 40, 17, 8, 'G', 0.03);
        rect(g, 17, 30, 23, 34, 'V');                               // cou
        // Visage rond et fatigué
        ellipse(g, 20, 21, 9, 10.5, 'V', 0.03);
        rect(g, 12, 20, 28, 28, 'V');
        // Oreilles
        rect(g, 10, 19, 11, 23, 'V'); rect(g, 29, 19, 30, 23, 'V');
        // Képi
        rect(g, 11, 2, 29, 12, 'X');
        const res = PixelArt.finir(g, PARTIES);
        visage_portrait(res, parle);
        rect(res, 11, 8, 29, 10, 'Y'); rect(res, 11, 7, 29, 7, 'y');       // bandeau doré
        rect(res, 10, 11, 30, 12, 'N'); rect(res, 12, 13, 28, 13, 'K');    // visière et son ombre
        rect(res, 19, 3, 21, 5, 'Y'); poser(res, 20, 2, 'Y');              // insigne
        for (const x of [11, 29]) { poser(res, x, 14, 'M'); poser(res, x, 15, 'M'); poser(res, x, 16, 'm'); }   // tempes grises
        // Col noir passepoilé de rouge, galons, médailles
        rect(res, 14, 33, 26, 35, 'Q'); trait(res, 14, 36, 19, 36, 'D'); trait(res, 21, 36, 26, 36, 'D');
        for (const x of [5, 32]) { trait(res, x, 36, x + 3, 35, 'Y'); trait(res, x, 38, x + 3, 37, 'Y'); }
        for (const [x, c] of [[11, 'D'], [13, 'B'], [15, 'D']]) { poser(res, x, 38, c); poser(res, x, 39, 'Y'); }
        poser(res, 20, 38, 'Y');
        return res;
    }

    const sprites = [en_pied(false), en_pied(true)].map(g => PixelArt.en_image(g, COULEURS));
    sprites.portrait = [portrait(false), portrait(true)].map(g => PixelArt.en_image(g, COULEURS, 2));
    return sprites;
})();
