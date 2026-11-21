/* =========================================================================
   SPRITE DE « LASSIE », LA FOXGIRL (pixel art généré, voir pixel_art.js)
   Silhouette élancée, longs cheveux roux, oreilles et grosse queue de renard
   au bout blanc, tenue sombre à éclair jaune, gants et bottes, pistolet
   électrique à bobine bleue. Grille 64×64 tournée vers la droite, comme les
   autres personnages : arret, tir, marche (4 images).
   Les images sont converties en <img> pour servir partout (menu, caisses…).
   ========================================================================= */
const SPRITES_LASSIE = (() => {
    const N = 64;
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#f0c8a8', s: '#c99a7a',     // peau
        O: '#d8742e', o: '#a04e1c',     // cheveux et fourrure rousse
        W: '#f4ece0', w: '#c8bca8',     // bout de la queue, intérieur des oreilles
        V: '#2a2f45', v: '#1a1d2c',     // tenue
        Y: '#ffd23c',                   // éclair jaune
        N: '#1c1c22', n: '#ffd23c',     // gants, bottes, semelles
        E: '#3ad06a', e: '#ffffff',     // œil vert, reflet
        r: '#c05060', p: '#eea0a0',     // bouche, joues
        M: '#6a7080', m: '#3a3f4a',     // pistolet
        Z: '#5ae6ff', z: '#c8f8ff',     // bobine et étincelle électriques
        K: '#050403'
    };
    // Plus le rang est haut, plus la partie est devant
    const PARTIES = {
        Q: { rang: 0, base: 'O', ombre: 'o', bande: 'fine' },   // queue
        R: { rang: 0, base: 'O', ombre: 'o', bande: 'fine' },   // cheveux dans le dos
        q: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },   // jambe arrière
        b: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },   // bras arrière
        T: { rang: 1, base: 'V', ombre: 'v', bande: 'fine' },   // haut
        C: { rang: 1, base: 'V', ombre: 'v', bande: 'fine' },   // short
        J: { rang: 2, base: 'S', ombre: 's', bande: 'fine' },   // jambe avant
        H: { rang: 3, base: 'S', ombre: 's', bande: 'fine' },   // tête
        F: { rang: 4, base: 'O', ombre: 'o', bande: 'fine' },   // frange
        X: { rang: 4, base: 'O', ombre: 'o', bande: 'fine' },   // oreilles de renard
        A: { rang: 5, base: 'S', ombre: 's', bande: 'fine' }    // bras avant
    };

    // Jambe : hanche -> genou -> cheville, puis la botte (elle regarde vers la droite)
    function jambe(g, hx, hy, angle, plie, partie) {
        const gx = hx + Math.sin(angle) * 11, gy = hy + Math.cos(angle) * 11;
        const tibia = angle - plie;
        const cx = gx + Math.sin(tibia) * 10, cy = gy + Math.cos(tibia) * 10;
        membre(g, hx, hy, gx, gy, 5, partie);
        membre(g, gx, gy, cx, cy, 4, partie);
        rect(g, cx - 2, cy - 4, cx + 1, cy, 'N');            // tige de la botte
        rect(g, cx - 2, cy + 1, cx + 3, cy + 2, 'N');        // pied
        rect(g, cx - 2, cy + 3, cx + 3, cy + 3, 'n');        // semelle jaune
    }

    // Grosse queue touffue, qui ondule ; bout blanc
    function queue(g, ondule) {
        ellipse(g, 15, 43, 4, 3.2, 'Q', 0.1);
        ellipse(g, 10 + ondule * 0.5, 39, 5, 4.2, 'Q', 0.12);
        ellipse(g, 7 + ondule, 33, 5, 5, 'Q', 0.12);
        ellipse(g, 8 + ondule, 26, 4.2, 4.5, 'W', 0.1);
        poser(g, 9 + ondule, 23, 'w'); poser(g, 6 + ondule, 27, 'w');
    }

    function tete(g, s) {
        // Cheveux longs dans le dos (derrière le corps)
        for (let y = 9; y <= 33; y++) {
            const l = y < 26 ? 5 : 4 - Math.floor((y - 26) / 3);
            rect(g, 17 - (y > 20 ? 1 : 0), y + s, 17 + l, y + s, 'R');
        }
        ellipse(g, 25.5, 13.5 + s, 6.3, 7, 'H', 0.02);
        // Oreilles de renard, pointues, intérieur clair
        for (const ox of [20, 27]) {
            for (let k = 0; k < 7; k++) rect(g, ox + Math.floor(k / 3), 7 - k + s, ox + 4 - Math.floor(k / 2), 7 - k + s, 'X');
            trait(g, ox + 2, 6 + s, ox + 2, 3 + s, 'W');
        }
        // Frange courte sur le front, cheveux sur l'arrière de la tête
        rect(g, 19, 7 + s, 31, 8 + s, 'F');
        poser(g, 25, 9 + s, 'F'); poser(g, 28, 9 + s, 'F'); poser(g, 31, 9 + s, 'F');
        rect(g, 19, 9 + s, 21, 15 + s, 'F');
        // Visage : grand œil vert avec reflet, cils, joue rose, petite bouche
        rect(g, 27, 12 + s, 28, 14 + s, 'E'); poser(g, 28, 12 + s, 'e');
        trait(g, 26, 11 + s, 29, 11 + s, 'K'); poser(g, 29, 12 + s, 'K');
        poser(g, 29, 15 + s, 'p'); poser(g, 28, 15 + s, 'p');
        trait(g, 29, 17 + s, 30, 17 + s, 'r');
    }

    function corps(g, s) {
        ellipse(g, 24.5, 30 + s, 5.2, 8.5, 'T', 0.03);           // haut
        trait(g, 22, 25 + s, 26, 29 + s, 'Y'); trait(g, 26, 29 + s, 23, 30 + s, 'Y'); trait(g, 23, 30 + s, 27, 34 + s, 'Y');   // éclair
        rect(g, 19, 37 + s, 29, 41 + s, 'C');                    // short
        rect(g, 19, 37 + s, 29, 37 + s, 'n');                    // ceinture
        rect(g, 20, 38 + s, 21, 39 + s, 'm'); poser(g, 21, 38 + s, 'Z');   // petite pile électrique à la ceinture
    }

    // Bras avant : épaule -> coude -> main gantée, qui tient le pistolet
    function bras_arme(g, s, tir) {
        const ex = 26, ey = 22 + s;
        const cx = tir ? 34 : 30, cy = tir ? 24 + s : 29 + s;
        const mx = tir ? 41 : 36, my = tir ? 26 + s : 29 + s;
        membre(g, ex, ey, cx, cy, 4, 'A');
        membre(g, cx, cy, mx, my, 3, 'A');
        rect(g, mx - 1, my - 1, mx + 1, my + 1, 'N');            // gant
        // Pistolet électrique : canon, bobine bleue, crosse
        rect(g, mx, my - 2, mx + 9, my, 'M');
        rect(g, mx, my + 1, mx + 1, my + 3, 'm');
        rect(g, mx + 3, my - 3, mx + 6, my - 3, 'Z');
        rect(g, mx + 4, my + 1, mx + 5, my + 1, 'Z');
        poser(g, mx + 9, my - 1, 'm');
        if (tir) {                                               // étincelle au bout du canon
            const bx = mx + 11, by = my - 1;
            for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [1, -1], [1, 1], [3, -2], [3, 2], [4, 0]]) poser(g, bx + dx, by + dy, dx < 2 ? 'z' : 'Z');
        }
    }

    function dessiner(mode, i) {
        const g = PixelArt.grille(N);
        const a = (i / 4) * Math.PI * 2;
        const marche = mode === 'marche';
        const s = marche && i % 2 === 1 ? 1 : 0;                 // petit rebond en marchant
        const amplitude = marche ? 0.4 : 0;

        queue(g, marche ? Math.round(Math.sin(a)) : 0);
        tete(g, s);
        // Bras arrière, le long du corps
        membre(g, 22, 22 + s, 20 + (marche ? Math.round(2 * Math.sin(a)) : 0), 33 + s, 3, 'b');
        jambe(g, 23, 41 + s, -amplitude * Math.sin(a) - (marche ? 0 : 0.08), marche ? 0.4 * Math.max(0, Math.cos(a + Math.PI)) : 0.05, 'q');
        corps(g, s);
        jambe(g, 26, 41 + s, amplitude * Math.sin(a) + (marche ? 0 : 0.08), marche ? 0.4 * Math.max(0, Math.cos(a)) : 0.05, 'J');
        bras_arme(g, s, mode === 'tir');
        return PixelArt.finir(g, PARTIES);
    }

    function en_img(mode, i) {
        const img = new Image();
        img.src = PixelArt.en_image(dessiner(mode, i), COULEURS).toDataURL();
        return img;
    }

    return {
        arret: en_img('arret', 0),
        tir: en_img('tir', 0),
        marche: [0, 1, 2, 3].map(i => en_img('marche', i))
    };
})();
