/* =========================================================================
   SPRITES DE LA CAMPAGNE (pixel art généré au chargement, voir pixel_art.js)
   - SPRITES_SERGENT : le Sergent en pied, de face, bras croisés, cigare au
     bec. 0 : bouche fermée ; 1 : il parle. Grille 64×64.
   - SPRITES_LABO : le « portrait » de la personne du labo, qu'on ne montre
     pas : la porte du labo qui s'enfonce dans le sol, avec son haut-parleur.
     0 : voyant éteint ; 1 : voyant allumé (on parle). Grille 40×40, ×2.
   - OBJETS_CAMP : tente, tente de commandement, entrée du labo, jeep.
   ========================================================================= */
const SPRITES_SERGENT = (() => {
    const { poser, ellipse, rect, trait } = PixelArt;
    const COULEURS = {
        S: '#d8a477', s: '#a8744e',     // peau burinée
        H: '#b0985c', h: '#7e6a3a',     // chapeau
        U: '#5e6a3a', u: '#3e4826',     // chemise
        P: '#8a7a4a', p: '#5e5232',     // pantalon kaki
        N: '#2a1c14',                   // sourcils, moustache, bottes
        B: '#3a2618',                   // ruban, ceinture
        R: '#5a1a1a',                   // bouche ouverte
        C: '#7a4a2a', O: '#ff8a2a',     // cigare, braise
        F: '#b8b8b8',                   // fumée
        Y: '#e8c24a',                   // galons, boucle
        K: '#050403'
    };
    const PARTIES = {
        P: { rang: 0, base: 'P', ombre: 'p', bande: 'fine' },     // jambes
        U: { rang: 1, base: 'U', ombre: 'u', bande: 'large' },    // torse
        V: { rang: 2, base: 'S', ombre: 's', bande: 'large' },    // tête
        A: { rang: 3, base: 'U', ombre: 'u', bande: 'fine' },     // bras croisés
        X: { rang: 4, base: 'H', ombre: 'h', bande: 'fine' }      // chapeau
    };

    function dessiner(parle) {
        const g = PixelArt.grille(64);
        // Jambes écartées et bottes
        rect(g, 24, 40, 31, 57, 'P'); rect(g, 33, 40, 40, 57, 'P');
        rect(g, 23, 57, 31, 61, 'N'); rect(g, 33, 57, 41, 61, 'N');
        // Torse large, ceinture
        ellipse(g, 32, 30, 11.5, 11, 'U', 0.03);
        rect(g, 22, 30, 42, 39, 'U');
        rect(g, 22, 38, 42, 40, 'B'); rect(g, 31, 38, 33, 40, 'Y');
        trait(g, 32, 22, 32, 30, 'u');                              // boutonnière
        // Galons de sergent sur les manches
        for (const x of [21, 41]) { poser(g, x, 25, 'Y'); poser(g, x + 1, 26, 'Y'); poser(g, x, 27, 'Y'); }
        // Cou et tête à mâchoire carrée
        rect(g, 29, 17, 35, 21, 'V');
        ellipse(g, 32, 12, 6.2, 6.5, 'V', 0.03);
        rect(g, 26, 12, 38, 17, 'V');
        poser(g, 26, 17, null); poser(g, 38, 17, null);
        // Chapeau d'instructeur : large bord, calotte à creux, ruban
        ellipse(g, 32, 7, 11, 1.8, 'X', 0);
        rect(g, 27, 1, 37, 6, 'X');
        poser(g, 27, 1, null); poser(g, 37, 1, null); poser(g, 32, 1, null);
        rect(g, 27, 5, 37, 6, 'B');
        // Visage : sourcils froncés, yeux plissés, moustache en brosse
        trait(g, 28, 9, 30, 10, 'N'); trait(g, 36, 9, 34, 10, 'N');
        poser(g, 29, 11, 'N'); poser(g, 35, 11, 'N');
        rect(g, 29, 14, 35, 14, 'N'); poser(g, 28, 15, 'N'); poser(g, 36, 15, 'N');
        if (parle) rect(g, 30, 15, 34, 16, 'R'); else trait(g, 30, 16, 34, 16, 'N');
        // Bras croisés sur la poitrine, mains aux coudes
        rect(g, 21, 29, 43, 33, 'A');
        trait(g, 22, 31, 42, 31, 'u');
        rect(g, 20, 29, 22, 32, 'V'); rect(g, 42, 29, 44, 32, 'V');
        // Cigare au coin de la bouche, braise, fumée
        trait(g, 35, 16, 40, 15, 'C'); poser(g, 41, 15, 'O');
        poser(g, 42, 12, 'F'); poser(g, 43, 10, 'F'); poser(g, 42, 8, 'F');
        return PixelArt.finir(g, PARTIES);
    }
    return [dessiner(false), dessiner(true)].map(g => PixelArt.en_image(g, COULEURS));
})();

/* Porte du labo : une trappe en acier inclinée, dans un cadre de béton qui
   s'enfonce dans le sable, bandes jaunes et noires, haut-parleur et voyant. */
const PORTE_LABO = (() => {
    const COULEURS = {
        G: '#9a958a', g: '#6e6a60', L: '#c4bfb2',   // béton
        D: '#5a6470', d: '#3c444e', E: '#7e8a96',   // acier des battants
        Y: '#f0c030', N: '#1a1a1a',                 // bandes de danger
        V: '#40ff70', v: '#1e5a2a',                 // voyant allumé / éteint
        H: '#4a4a52', h: '#2a2a30',                 // haut-parleur
        A: '#c8a070', a: '#a87e50',                 // sable autour
        K: '#050403'
    };
    // Trapèze rempli ligne par ligne : bord arrière (y0, xa..xb), bord avant (y1, xc..xd)
    function trapeze(g, y0, y1, xa, xb, xc, xd, c) {
        for (let y = y0; y <= y1; y++) {
            const t = (y - y0) / Math.max(1, y1 - y0);
            PixelArt.rect(g, Math.round(xa + (xc - xa) * t), y, Math.round(xb + (xd - xb) * t), y, c);
        }
    }
    // n : taille de la grille ; voyant : allumé ou non
    function dessiner(n, voyant) {
        const g = PixelArt.grille(n), k = n / 40;
        const { rect, trait, poser } = PixelArt;
        const Y = v => Math.round(v * k), X = v => Math.round(v * k);
        // Petit monticule de sable autour (pour qu'on voie que ça s'enfonce)
        trapeze(g, Y(15), Y(36), X(6), X(34), X(1), X(39), 'A');
        trait(g, X(1), Y(36), X(39), Y(36), 'a');
        // Cadre de béton incliné
        trapeze(g, Y(12), Y(33), X(10), X(30), X(4), X(36), 'G');
        trapeze(g, Y(12), Y(13), X(10), X(30), X(9), X(31), 'L');
        // Les deux battants d'acier
        trapeze(g, Y(15), Y(30), X(12), X(28), X(7), X(33), 'D');
        trait(g, X(20), Y(15), X(20), Y(30), 'd');
        for (let y = Y(17); y <= Y(29); y += Math.max(2, Y(3))) {
            const t = (y - Y(15)) / (Y(30) - Y(15));
            trait(g, Math.round(X(12) + (X(7) - X(12)) * t) + 1, y, Math.round(X(28) + (X(33) - X(28)) * t) - 1, y, 'E');
        }
        rect(g, X(17), Y(23), X(18), Y(24), 'N'); rect(g, X(22), Y(23), X(23), Y(24), 'N');   // poignées
        // Bande jaune et noire sur le bord avant
        for (let x = X(4); x <= X(36); x++) for (let y = Y(31); y <= Y(33); y++) poser(g, x, y, Math.floor((x + y) / Math.max(2, X(2))) % 2 ? 'Y' : 'N');
        // Haut-parleur sur un piquet, et son voyant
        rect(g, X(36), Y(4), X(36), Y(30), 'h');
        rect(g, X(33), Y(2), X(38), Y(6), 'H');
        for (let x = X(34); x <= X(37); x += 2) poser(g, x, Y(4), 'h');
        rect(g, X(35), Y(8), X(36), Y(9), voyant ? 'V' : 'v');
        return g;
    }
    return {
        portrait: [false, true].map(v => PixelArt.en_image(dessiner(40, v), COULEURS, 2)),
        camp: PixelArt.en_image(dessiner(64, false), COULEURS),
        campAllume: PixelArt.en_image(dessiner(64, true), COULEURS)
    };
})();

const OBJETS_CAMP = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        T: '#6e7a44', t: '#4a5430', W: '#8a9658',   // toile de tente
        E: '#2a2618',                               // entrée sombre
        r: '#c8b890',                               // cordes
        J: '#5a6638', j: '#3c4426', Q: '#76844a',   // carrosserie de la jeep
        N: '#1c1c1e', n: '#3a3a40', M: '#8a8a90',   // pneus, jantes
        Z: '#ece6da',                               // étoile blanche
        Y: '#f0d060',                               // phare
        B: '#4a3220', R: '#c83030',                 // mât, fanion
        K: '#050403'
    };
    const PARTIES = {
        T: { rang: 1, base: 'T', ombre: 't', bande: 'large' },
        J: { rang: 1, base: 'J', ombre: 'j', bande: 'fine' },
        P: { rang: 2, base: 'N', ombre: 'N', bande: 'fine' }
    };

    // Tente canadienne vue de face : toile triangulaire, entrée ouverte, cordes
    function tente(commandement) {
        const g = PixelArt.grille(64);
        const sommet = commandement ? 10 : 18;
        for (let y = sommet; y <= 54; y++) {
            const demi = Math.round((y - sommet) * (commandement ? 0.72 : 0.68));
            rect(g, 32 - demi, y, 32 + demi, y, 'T');
        }
        // Entrée : rabat ouvert sur la gauche
        for (let y = sommet + 12; y <= 54; y++) {
            const demi = Math.round((y - sommet - 12) * 0.4);
            rect(g, 32 - demi, y, 32 + demi, y, 'E');
            if (demi > 1) poser(g, 32 - demi - 1, y, 'W');
        }
        trait(g, 32, sommet, 32, sommet + 11, 't');
        let res = PixelArt.finir(g, PARTIES);
        // Cordes et piquets (après les finitions : fins traits sans contour)
        const corde = (x0, y0, x1, y1) => { for (let k = 0; k <= 20; k++) { const x = Math.round(x0 + (x1 - x0) * k / 20), y = Math.round(y0 + (y1 - y0) * k / 20); if (!res[y][x]) res[y][x] = 'r'; } };
        corde(32 - 8, sommet + 10, 2, 56); corde(32 + 8, sommet + 10, 62, 56);
        res[57][2] = 'B'; res[57][62] = 'B';
        if (commandement) {
            // Mât et fanion rouge au sommet
            for (let y = 0; y < sommet; y++) res[y][32] = 'B';
            for (let y = 1; y <= 4; y++) for (let x = 33; x <= 33 + (5 - y); x++) res[y][x] = 'R';
        }
        return res;
    }

    // Jeep militaire de profil, tournée vers la droite
    function jeep() {
        const g = PixelArt.grille(96);
        rect(g, 12, 50, 86, 66, 'J');                    // caisse
        rect(g, 58, 44, 88, 52, 'J');                    // capot
        rect(g, 12, 44, 30, 50, 'J');                    // arrière
        trait(g, 14, 58, 84, 58, 'j');
        ellipse(g, 8, 54, 5, 9, 'P', 0);                 // roue de secours
        for (const x of [26, 72]) ellipse(g, x, 68, 10, 10, 'P', 0);
        let res = PixelArt.finir(g, PARTIES);
        // Jantes, pare-brise, volant, étoile, phare
        for (const x of [26, 72]) { for (let y = 64; y <= 72; y++) for (let k = x - 4; k <= x + 4; k++) if ((k - x) ** 2 + (y - 68) ** 2 <= 16) res[y][k] = 'M'; res[68][x] = 'n'; }
        for (let k = 0; k <= 18; k++) { res[44 - k][56 - Math.round(k / 4)] = 'K'; }
        for (let x = 52; x <= 56; x++) res[26][x] = 'K';
        for (let k = 0; k <= 5; k++) { res[44 - k][46 + Math.round(k / 2)] = 'n'; }
        for (const [x, y] of [[40, 54], [39, 55], [41, 55], [40, 56], [38, 54], [42, 54], [39, 57], [41, 57]]) res[y][x] = 'Z';
        res[46][88] = 'Y'; res[47][88] = 'Y'; res[46][87] = 'Y';
        return res;
    }

    const img = g => PixelArt.en_image(g, COULEURS);
    return { tente: img(tente(false)), tenteCommandement: img(tente(true)), jeep: img(jeep()) };
})();
