/* =========================================================================
   PORTRAIT DU SERGENT (l'instructeur du tutoriel)
   Pixel art généré au chargement (pixel_art.js), vu de face : chapeau
   d'instructeur à quatre creux, mâchoire carrée, sourcils froncés, grosse
   moustache, cicatrice, cigare et chemise kaki à galons. Grille 40×40.
   - 0 : bouche fermée ; 1 : bouche ouverte (il aboie ses ordres)
   - .pyjama : la même chose en tenue de nuit (bonnet de nuit, pyjama rayé)
   ========================================================================= */
const SPRITES_INSTRUCTEUR = (() => {
    const { poser, ellipse, rect, trait } = PixelArt;
    const COULEURS = {
        S: '#d8a477', s: '#a8744e',     // peau burinée
        H: '#b0985c', h: '#7e6a3a',     // chapeau
        U: '#5e6a3a', u: '#3e4826',     // chemise
        N: '#2a1c14',                   // sourcils, moustache, yeux
        B: '#3a2618',                   // ruban du chapeau
        R: '#5a1a1a', W: '#ece6da',     // bouche, dents
        C: '#7a4a2a', O: '#ff8a2a',     // cigare, braise
        F: '#b0b0b0',                   // fumée
        Q: '#c46a5a',                   // cicatrice
        Y: '#e8c24a',                   // galons
        K: '#050403'
    };
    const PARTIES = {
        U: { rang: 0, base: 'U', ombre: 'u', bande: 'fine' },
        V: { rang: 1, base: 'S', ombre: 's', bande: 'large' },   // visage
        X: { rang: 2, base: 'H', ombre: 'h', bande: 'fine' }     // chapeau
    };

    function dessiner(parle, pyjama = false) {
        const g = PixelArt.grille(40);
        // Épaules et col de chemise, galons de sergent (pas en pyjama)
        ellipse(g, 20, 40, 17, 8, 'U', 0.03);
        trait(g, 16, 33, 20, 37, 'u'); trait(g, 24, 33, 20, 37, 'u');
        if (!pyjama) for (const x of [7, 31]) { trait(g, x, 36, x + 2, 35, 'Y'); trait(g, x, 38, x + 2, 37, 'Y'); }
        rect(g, 17, 30, 23, 33, 'V');                               // cou
        // Visage à mâchoire carrée
        ellipse(g, 20, 20, 9, 10, 'V', 0.03);
        rect(g, 12, 20, 28, 28, 'V');
        rect(g, 13, 29, 27, 30, 'V');
        poser(g, 12, 28, null); poser(g, 28, 28, null);
        if (pyjama) {
            // Bonnet de nuit : bord roulé, pointe qui retombe sur le côté
            rect(g, 11, 9, 29, 12, 'X');
            for (let k = 0; k <= 12; k++) rect(g, 13 + k, 8 - Math.round(k * 0.45), 28, 8 - Math.round(k * 0.45), 'X');
            for (let k = 0; k <= 6; k++) rect(g, 28 + k, 2 + k, 30 + k, 4 + k, 'X');
        } else {
            // Chapeau d'instructeur : large bord, calotte à creux
            ellipse(g, 20, 11, 18, 2.6, 'X', 0);
            rect(g, 13, 4, 27, 10, 'X');
            poser(g, 13, 4, null); poser(g, 27, 4, null); poser(g, 20, 4, null); poser(g, 16, 4, null); poser(g, 24, 4, null);
            trait(g, 20, 5, 20, 8, 'h');                                // creux du sommet
            rect(g, 13, 9, 27, 10, 'B');                                // ruban
        }
        // Sourcils froncés, yeux plissés
        trait(g, 13, 15, 17, 17, 'N'); trait(g, 27, 15, 23, 17, 'N');
        trait(g, 14, 18, 16, 18, 'N'); trait(g, 24, 18, 26, 18, 'N');
        // Nez, cicatrice
        trait(g, 20, 18, 20, 22, 's'); poser(g, 19, 22, 's'); poser(g, 21, 22, 's');
        trait(g, 12, 16, 15, 22, 'Q');
        // Moustache en brosse
        rect(g, 14, 24, 26, 25, 'N');
        poser(g, 13, 25, 'N'); poser(g, 27, 25, 'N'); poser(g, 13, 26, 'N'); poser(g, 27, 26, 'N');
        // Bouche
        if (parle) {
            rect(g, 16, 26, 23, 28, 'R');
            trait(g, 16, 26, 23, 26, 'W');
        } else {
            trait(g, 16, 27, 23, 27, 'N');
        }
        // Cigare au coin de la bouche, braise et fumée
        trait(g, 24, 27, 31, 26, 'C'); trait(g, 24, 28, 31, 27, 'C');
        poser(g, 32, 26, 'O'); poser(g, 32, 27, 'O');
        poser(g, 33, 23, 'F'); poser(g, 34, 21, 'F'); poser(g, 33, 19, 'F');
        const res = PixelArt.finir(g, PARTIES);
        if (pyjama) {
            // Rayures du pyjama et pompon blanc au bout du bonnet
            for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (x % 3 === 0 && 'Uu'.includes(res[y][x])) res[y][x] = 'W';
            for (const [x, y] of [[35, 9], [36, 9], [35, 10], [36, 10], [36, 8], [34, 10]]) res[y][x] = 'W';
        }
        return res;
    }

    const portraits = [dessiner(false), dessiner(true)].map(g => PixelArt.en_image(g, COULEURS, 2));
    const PYJAMA = { ...COULEURS, U: '#8fb4d8', u: '#5f84a8', H: '#c83a3a', h: '#8a2020', W: '#eef4fa' };
    portraits.pyjama = [dessiner(false, true), dessiner(true, true)].map(g => PixelArt.en_image(g, PYJAMA, 2));
    return portraits;
})();
