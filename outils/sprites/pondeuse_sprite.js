/* =========================================================================
   SPRITES DE « LA PONDEUSE » ET DE SES LARVES (pixel art généré au chargement)
   La Pondeuse : un zombie au ventre énorme, couvert de pustules, en robe de
   chambre déchirée. Elle se dandine : petits pas, le corps balance de gauche
   à droite, les mains tiennent le ventre. Grille 64×64.
   - marche : 12 images
   La larve : un gros asticot pâle qui avance en se contractant (comme une
   chenille). Grille 40×40, affichée en 40 : même taille de pixel que le reste.
   - larve : 8 images
   ========================================================================= */
const SPRITES_PONDEUSE = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#a9b07e', s: '#7b8458',     // peau verdâtre
        V: '#c8c28c', v: '#968e60',     // ventre tendu
        P: '#dbe35c', p: '#8fa03a',     // pustules
        U: '#6a4a78', u: '#44304e',     // robe de chambre
        L: '#ece4cc', l: '#b8ab88',     // larve
        E: '#e2b0a0', e: '#b07a6c',     // tête de la larve
        h: '#3a3028',                   // cheveux
        Y: '#fef3c0',                   // œil
        R: '#3b1725', r: '#6a2a2a',     // bouche, sang
        K: '#050403'
    };
    const PARTIES = {
        b: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },     // bras arrière
        q: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },     // jambe arrière
        D: { rang: 1, base: 'U', ombre: 'u', bande: 'fine' },     // robe (dos, épaules)
        T: { rang: 2, base: 'V', ombre: 'v', bande: 'large' },    // ventre
        J: { rang: 2, base: 'S', ombre: 's', bande: 'fine' },     // jambe avant
        H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // tête
        A: { rang: 4, base: 'S', ombre: 's', bande: 'fine' },     // bras avant
        G: { rang: 1, base: 'L', ombre: 'l', bande: 'large' },    // anneaux de la larve (deux rangs alternés :
        I: { rang: 1.5, base: 'L', ombre: 'l', bande: 'large' },  //  un trait sombre sépare chaque anneau)
        E: { rang: 2, base: 'E', ombre: 'e', bande: 'large' }     // tête de la larve
    };

    // Jambe courte et lourde : hanche -> genou -> pied
    function jambe(g, hx, hy, angle, leve, partie) {
        const gx = hx - Math.sin(angle) * 7, gy = hy + Math.cos(angle) * 7 - leve;
        const px = gx - Math.sin(angle * 0.5) * 7, py = gy + 7;
        membre(g, hx, hy, gx, gy, 7, partie);
        membre(g, gx, gy, px, py, 6, partie);
        rect(g, px - 4, py + 1, px + 2, py + 2, 'h');             // pantoufle
    }

    function dessiner(i) {
        const g = PixelArt.grille(64);
        const a = (i / 12) * Math.PI * 2;
        const balance = Math.round(Math.sin(a) * 1.5);            // le corps tangue d'un côté à l'autre
        const s = Math.cos(2 * a) < 0 ? 1 : 0;
        const hx = 33 + balance, hy = 46 + s;

        // Petits pas : une jambe se lève pendant que l'autre porte tout le poids
        jambe(g, hx + 3, hy, 0.25 * Math.sin(a + Math.PI), 2 * Math.max(0, Math.sin(a + Math.PI)), 'q');
        jambe(g, hx - 3, hy, 0.25 * Math.sin(a), 2 * Math.max(0, Math.sin(a)), 'J');

        // Bras arrière posé sur le haut du ventre
        membre(g, hx + 4, 24 + s, hx + 9, 31 + s, 5, 'b');
        membre(g, hx + 9, 31 + s, hx + 4, 36 + s, 4, 'b');

        // Robe de chambre : épaules et haut de la poitrine, bas déchiré sur le dos
        ellipse(g, hx, 26 + s, 8, 7, 'D', 0.08);
        for (let x = hx + 2; x <= hx + 8; x += 2) poser(g, x, 33 + s + (x % 2), 'D');

        // Le ventre énorme, devant
        ellipse(g, hx - 6, 36 + s, 15, 12.5, 'T', 0.05);
        // Pustules et veines
        for (const [dx, dy] of [[-12, -3], [-8, 4], [-3, -6], [1, 3], [-14, 3]]) {
            poser(g, hx + dx, 35 + s + dy, 'P'); poser(g, hx + dx, 36 + s + dy, 'p');
        }
        trait(g, hx - 10, 30 + s, hx - 6, 33 + s, 'v'); trait(g, hx - 6, 33 + s, hx - 7, 37 + s, 'v');
        poser(g, hx - 1, 37 + s, 'v');                            // nombril

        // Petite tête penchée en avant
        const tx = hx - 5, ty = 16 + s;
        ellipse(g, tx, ty, 5.5, 6, 'H', 0.06);
        rect(g, tx - 2, ty - 6, tx + 5, ty - 5, 'h'); poser(g, tx + 5, ty - 4, 'h'); poser(g, tx + 6, ty - 2, 'h');
        rect(g, tx - 3, ty - 1, tx - 2, ty, 'Y');
        rect(g, tx - 5, ty + 3, tx - 2, ty + 4, 'R');
        poser(g, tx - 3, ty + 5, 'r'); poser(g, tx - 3, ty + 6, 'r');   // bave

        // Bras avant : la main soutient le dessous du ventre
        membre(g, hx - 2, 23 + s, hx - 9, 29 + s, 5, 'A');
        membre(g, hx - 9, 29 + s, hx - 16, 41 + s, 4, 'A');
        return PixelArt.finir(g, PARTIES);
    }

    // Larve : 4 anneaux qui se resserrent puis s'étirent, le dos se bombe au milieu
    function larve(i) {
        const g = PixelArt.grille(40);
        const a = (i / 8) * Math.PI * 2;
        const etire = (1 + Math.cos(a)) / 2;                     // 1 = étirée, 0 = contractée
        const pas = 4 + etire * 2.5;
        const bosse = Math.round((1 - etire) * 4);
        for (let k = 3; k >= 0; k--) {
            const x = 10 + k * pas, y = 30 - (k === 1 || k === 2 ? bosse : 0);
            ellipse(g, x, y, k === 0 ? 5 : 4.6, k === 0 ? 4.6 : 4.2, k === 0 ? 'E' : k % 2 ? 'G' : 'I', 0.04);
        }
        poser(g, 8, 28, 'K'); poser(g, 8, 29, 'K');                     // œil
        poser(g, 5, 31, 'R'); poser(g, 6, 31, 'R'); poser(g, 7, 32, 'R'); // bouche
        return PixelArt.finir(g, PARTIES);
    }

    return {
        marche: Array.from({ length: 12 }, (_, i) => PixelArt.en_image(dessiner(i), COULEURS)),
        larve: Array.from({ length: 8 }, (_, i) => PixelArt.en_image(larve(i), COULEURS))
    };
})();
