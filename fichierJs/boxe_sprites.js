/* =========================================================================
   SPRITES DU COMBAT DE BOXE (chapitre 2, « Le Ring »), pixel art généré au
   chargement (voir pixel_art.js). Dessinés en 2× à l'écran par boxe.js.
   - SPRITES_BOXE.brutus (grille 64, tourné vers la droite) : Brutus sans
     son fusil (on le lui a volé), poings bandés.
       garde ×4 (il sautille), jab ×2 (bras avant), direct ×2 (bras arrière),
       uppercut ×3, esquive ×2 (il plonge en arrière), touche, victoire
   - SPRITES_BOXE.gorille (grille 96, tourné vers la gauche) : Gégé, ancien
     déménageur qui a muté en gorille. Fourrure sombre, torse gris, short en
     jean déchiré, grosse chaîne en or : le roi de la bâtisse.
       garde ×4, armer ×2 (il arme son coup), frappe ×2, ouvert ×2 (il a
       frappé dans le vide et part en avant), touche, rugir ×2 (il se tape
       la poitrine), et la version « bouche ouverte » de garde pour parler.
   ========================================================================= */
const SPRITES_BOXE = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;

    /* ---------- Brutus ---------- */
    const COULEURS_B = {
        S: '#c68a5e', s: '#9e6640', L: '#dda27a',   // peau
        U: '#5e6e34', u: '#3e4a22',                 // débardeur
        P: '#4a5a2a', p: '#28331a',                 // pantalon
        N: '#1e1a18',                               // rangers
        B: '#2d1b1e',                               // barbe, sourcils
        W: '#e6dccb', w: '#b8ac98',                 // bandages des poings
        R: '#8a3a2a',                               // bouche
        Y: '#fef3c0',                               // œil
        K: '#050403'
    };
    const PARTIES_B = {
        b: { rang: 0, base: 'S', ombre: 's', bande: 'fine' },     // bras arrière
        g: { rang: 0.5, base: 'W', ombre: 'w', bande: 'fine' },   // poing arrière
        q: { rang: 0, base: 'P', ombre: 'p', bande: 'fine' },     // jambe arrière
        T: { rang: 1, base: 'U', ombre: 'u', bande: 'large' },    // torse
        J: { rang: 2, base: 'P', ombre: 'p', bande: 'fine' },     // jambe avant
        H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // tête
        A: { rang: 4, base: 'S', ombre: 's', bande: 'fine' },     // bras avant
        G: { rang: 5, base: 'W', ombre: 'w', bande: 'fine' }      // poing avant
    };

    // pose : { bas (accroupi), penche (torse en avant +), tete: [dx, dy], avant: [coude, poing], arriere: [coude, poing], bouche }
    function brutus(pose) {
        const g = PixelArt.grille(64);
        const bas = pose.bas || 0, pe = pose.penche || 0;
        const hx = 30, hy = 40 + bas;
        // Jambes : appui large, genoux fléchis
        const jambe = (x0, genou, pied, partie) => {
            membre(g, x0, hy, genou[0], genou[1] + bas * 0.5, 8, partie);
            membre(g, genou[0], genou[1] + bas * 0.5, pied[0], pied[1], 7, partie);
            rect(g, pied[0] - 4, 58, pied[0] + 5, 61, 'N');
            rect(g, pied[0] - 3, 56, pied[0] + 3, 57, 'N');
        };
        jambe(hx - 3, [22, 50], [19, 56], 'q');
        // Bras arrière (derrière le torse)
        const epaule = [27 + pe, 24 + bas], epauleAv = [37 + pe, 24 + bas];
        const bras = (ep, [coude, poing], partieBras, partiePoing) => {
            membre(g, ep[0], ep[1], coude[0] + pe, coude[1] + bas, 7, partieBras);
            membre(g, coude[0] + pe, coude[1] + bas, poing[0] + pe, poing[1] + bas, 6, partieBras);
            ellipse(g, poing[0] + pe, poing[1] + bas, 4, 3.6, partiePoing, 0);
        };
        bras(epaule, pose.arriere, 'b', 'g');
        // Torse massif (débardeur), épaules nues
        ellipse(g, 32 + pe, 30 + bas, 10, 11, 'T', 0.04);
        rect(g, 23 + pe, 30 + bas, 41 + pe, 41 + bas, 'T');
        ellipse(g, 26 + pe, 23 + bas, 4, 3.5, 'b', 0); ellipse(g, 38 + pe, 23 + bas, 4, 3.5, 'A', 0);
        jambe(hx + 4, [40, 50], [42, 56], 'J');
        rect(g, 23 + pe, 39 + bas, 41 + pe, 42 + bas, 'J');                                   // ceinture du pantalon
        // Tête : crâne rasé, barbe, nuque épaisse
        const [tx, ty] = pose.tete || [0, 0];
        const cx = 36 + pe + tx, cy = 14 + bas + ty;
        rect(g, cx - 4, cy + 4, cx + 2, cy + 9, 'H');
        ellipse(g, cx, cy, 6.5, 7, 'H', 0.04);
        bras(epauleAv, pose.avant, 'A', 'G');
        const res = PixelArt.finir(g, PARTIES_B);
        // Détails du visage (après les finitions) : barbe, sourcil, œil, oreille, bouche
        const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (res[y] && res[y][x] && res[y][x] !== 'K') res[y][x] = c; };
        // Barbe de quelques jours : le long de la mâchoire, piquetée sur la peau
        for (let y = cy + 3; y <= cy + 7; y++) for (let x = cx - 1; x <= cx + 6; x++)
            if ((x - cx - 2) ** 2 / 20 + (y - cy - 4) ** 2 / 10 <= 1) set(x, y, (x + y) % 2 || y >= cy + 6 ? 'B' : 's');
        for (let x = cx + 1; x <= cx + 5; x++) set(x, cy - 2, 'B');
        set(cx + 3, cy - 1, 'Y'); set(cx + 4, cy - 1, 'K');
        set(cx - 3, cy, 's'); set(cx - 3, cy + 1, 's');
        if (pose.bouche) { set(cx + 4, cy + 4, 'R'); set(cx + 5, cy + 4, 'R'); set(cx + 4, cy + 5, 'R'); }
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (res[y][x] === 'S' && (x + y) % 9 === 0 && y > 20 && y < 40) res[y][x] = 'L';   // reflets sur les muscles
        return PixelArt.en_image(res, COULEURS_B);
    }

    const GARDE_AV = [[44, 30], [47, 16]], GARDE_AR = [[33, 33], [41, 19]];
    const b = {
        garde: [0, 1, 2, 1].map(k => brutus({ bas: k, avant: [[44, 30 - k * 0.3], [47, 16]], arriere: GARDE_AR })),
        jab: [
            brutus({ penche: 2, avant: [[50, 22], [57, 19]], arriere: GARDE_AR }),
            brutus({ penche: 3, avant: [[52, 20], [61, 18]], arriere: GARDE_AR, bouche: true })
        ],
        direct: [
            brutus({ penche: 3, avant: GARDE_AV, arriere: [[44, 26], [55, 19]] }),
            brutus({ penche: 5, avant: [[42, 30], [44, 20]], arriere: [[48, 22], [60, 18]], bouche: true })
        ],
        uppercut: [
            brutus({ bas: 6, penche: -1, avant: GARDE_AV, arriere: [[30, 38], [38, 40]] }),
            brutus({ bas: 2, penche: 3, avant: GARDE_AV, arriere: [[44, 30], [50, 16]], bouche: true }),
            brutus({ bas: -1, penche: 4, tete: [-1, -1], avant: [[42, 30], [44, 22]], arriere: [[46, 14], [50, 3]], bouche: true })
        ],
        esquive: [
            brutus({ bas: 6, penche: -5, tete: [-2, 2], avant: [[42, 30], [43, 17]], arriere: [[32, 33], [38, 19]] }),
            brutus({ bas: 9, penche: -7, tete: [-3, 3], avant: [[40, 32], [42, 19]], arriere: [[30, 35], [37, 21]] })
        ],
        touche: brutus({ penche: -6, tete: [-3, 1], avant: [[42, 34], [48, 38]], arriere: [[24, 30], [20, 22]], bouche: true }),
        victoire: brutus({ tete: [0, -1], avant: [[42, 12], [44, 1]], arriere: [[26, 14], [24, 2]], bouche: true }),
        ko: brutus_ko()
    };

    // Brutus K.O. : sur le dos, la tête vers la gauche (il est tombé en arrière)
    function brutus_ko() {
        const g = PixelArt.grille(64);
        membre(g, 38, 56, 48, 47, 7, 'q'); membre(g, 48, 47, 58, 55, 6, 'q'); rect(g, 56, 52, 61, 57, 'N');   // jambe repliée
        membre(g, 22, 52, 16, 44, 6, 'b'); ellipse(g, 15, 42, 3.6, 3.4, 'g', 0);                            // bras en l'air
        ellipse(g, 30, 55, 11, 6, 'T', 0.04);
        membre(g, 38, 58, 52, 59, 7, 'J'); membre(g, 52, 59, 60, 60, 6, 'J'); rect(g, 58, 56, 62, 61, 'N');   // jambe tendue
        ellipse(g, 14, 55, 6.5, 6, 'H', 0.04);
        membre(g, 28, 56, 36, 61, 6, 'A'); ellipse(g, 39, 61, 3.6, 3, 'G', 0);                              // bras au sol
        const res = PixelArt.finir(g, PARTIES_B);
        const set = (x, y, c) => { if (res[y] && res[y][x] && res[y][x] !== 'K') res[y][x] = c; };
        for (let x = 10; x <= 18; x++) if ((x + 1) % 2) set(x, 59, 'B');          // barbe (vers le haut : il est sur le dos)
        for (const [x, y] of [[12, 52], [14, 54], [14, 52], [12, 54], [16, 52], [18, 54], [18, 52], [16, 54]]) set(x, y, 'K');   // les yeux en croix
        return PixelArt.en_image(res, COULEURS_B);
    }

    /* ---------- Gégé, le Gorille ---------- */
    const COULEURS_G = {
        F: '#3e383a', f: '#262022', H: '#5a5254',   // fourrure (et reflets)
        C: '#8a7e76', c: '#6a5e58',                 // torse et visage gris
        J: '#3a5a8a', j: '#24406a', D: '#8aa4c8',   // short en jean déchiré
        Y: '#e8c24a', y: '#a8842a',                 // chaîne en or
        E: '#ffd060', N: '#141010',                 // œil, narines
        R: '#8a2a2a', W: '#ece6da',                 // gueule, dents
        K: '#050403'
    };
    const PARTIES_G = {
        b: { rang: 0, base: 'F', ombre: 'f', bande: 'fine' },
        q: { rang: 0, base: 'F', ombre: 'f', bande: 'fine' },
        T: { rang: 1, base: 'F', ombre: 'f', bande: 'large' },
        S: { rang: 1.5, base: 'J', ombre: 'j', bande: 'fine' },   // short
        J: { rang: 2, base: 'F', ombre: 'f', bande: 'fine' },
        H: { rang: 3, base: 'F', ombre: 'f', bande: 'large' },
        V: { rang: 3.5, base: 'C', ombre: 'c', bande: 'large' },  // museau
        A: { rang: 4, base: 'F', ombre: 'f', bande: 'fine' },
        M: { rang: 5, base: 'C', ombre: 'c', bande: 'fine' },     // poing avant
        m: { rang: 0.5, base: 'C', ombre: 'c', bande: 'fine' }    // poing arrière
    };

    // pose : { penche (+ = vers l'avant, donc vers la gauche), bas, tete: [dx, dy], avant: [coude, poing], arriere: [coude, poing], gueule }
    function gorille(pose) {
        const g = PixelArt.grille(96);
        const pe = pose.penche || 0, bas = pose.bas || 0;
        // Jambes courtes et arquées
        membre(g, 58, 66 + bas, 66, 80, 11, 'q'); membre(g, 66, 80, 64, 90, 10, 'q');
        rect(g, 58, 89, 72, 92, 'q');
        const bras = ([sx, sy], [coude, poing], pb, pp) => {
            membre(g, sx - pe, sy + bas, coude[0] - pe, coude[1] + bas, 12, pb);
            membre(g, coude[0] - pe, coude[1] + bas, poing[0] - pe, poing[1] + bas, 11, pb);
            ellipse(g, poing[0] - pe, poing[1] + bas, 7, 6.5, pp, 0);
        };
        bras([60, 32], pose.arriere, 'b', 'm');
        // Torse en tonneau, voûté
        ellipse(g, 52 - pe, 44 + bas, 19, 18, 'T', 0.05);
        ellipse(g, 46 - pe, 30 + bas, 13, 9, 'T', 0.05);                                      // épaules voûtées
        rect(g, 38 - pe * 0.7, 56 + bas, 66 - pe * 0.5, 68 + bas, 'S');                       // short
        membre(g, 44 - pe * 0.6, 66 + bas, 36, 80, 11, 'J'); membre(g, 36, 80, 38, 90, 10, 'J');
        rect(g, 28, 89, 44, 92, 'J');
        // Tête basse et en avant
        const [tx, ty] = pose.tete || [0, 0];
        const hx = 32 - pe + tx, hy = 28 + bas + ty;
        ellipse(g, hx + 2, hy - 2, 11, 10, 'H', 0.06);
        ellipse(g, hx - 5, hy + 4, 7.5, 6, 'V', 0.03);                                       // museau
        bras([40, 34], pose.avant, 'A', 'M');
        const res = PixelArt.finir(g, PARTIES_G);
        const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (res[y] && res[y][x] && res[y][x] !== 'K') res[y][x] = c; };
        // Torse gris (poitrail sans poils)
        for (let y = 36; y <= 56; y++) for (let x = 30; x <= 60; x++) {
            const px = x + pe, py = y - bas;
            if ((px - 46) ** 2 / 110 + (py - 46) ** 2 / 90 <= 1 && 'Ff'.includes(res[y][x])) set(x, y, (px > 50 || py > 52) ? 'c' : 'C');
        }
        // Visage : arcade sourcilière, œil, narines, gueule
        for (let x = hx - 9; x <= hx + 1; x++) set(x, hy - 4, 'f');
        set(hx - 6, hy - 2, 'E'); set(hx - 5, hy - 2, 'N');
        set(hx - 11, hy + 3, 'N'); set(hx - 9, hy + 3, 'N');
        if (pose.gueule) { for (let x = hx - 11; x <= hx - 3; x++) { set(x, hy + 6, 'R'); set(x, hy + 7, 'R'); set(x, hy + 8, 'R'); } set(hx - 10, hy + 6, 'W'); set(hx - 5, hy + 6, 'W'); }
        else for (let x = hx - 10; x <= hx - 3; x++) set(x, hy + 7, 'N');
        // Chaîne en or au cou
        for (let k = 0; k <= 16; k++) { const x = hx + 2 + k, y = hy + 9 + Math.round(Math.sin(k / 16 * Math.PI) * 4); set(x, y, k % 2 ? 'Y' : 'y'); }
        // Reflets dans la fourrure, short déchiré
        for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
            if (res[y][x] === 'F' && (x * 7 + y * 3) % 23 === 0) res[y][x] = 'H';
            if (res[y][x] === 'J' && (x + y * 5) % 17 === 0) res[y][x] = 'D';
        }
        return PixelArt.en_image(res, COULEURS_G);
    }

    const G_AV = [[28, 52], [18, 40]], G_AR = [[44, 48], [30, 34]];
    const gg = {
        garde: [0, 1, 2, 1].map(k => gorille({ bas: k, avant: [[28, 52 - k * 0.5], [18, 40]], arriere: G_AR })),
        parle: gorille({ bas: 1, avant: G_AV, arriere: G_AR, gueule: true }),
        armer: [
            gorille({ penche: -3, avant: G_AV, arriere: [[70, 22], [80, 14]] }),
            gorille({ penche: -6, bas: 2, tete: [2, 0], avant: [[30, 54], [22, 44]], arriere: [[74, 16], [84, 6]], gueule: true })
        ],
        frappe: [
            gorille({ penche: 6, avant: [[32, 56], [26, 48]], arriere: [[36, 32], [12, 32]], gueule: true }),
            gorille({ penche: 10, bas: 2, avant: [[36, 58], [30, 52]], arriere: [[30, 38], [8, 44]], gueule: true })
        ],
        ouvert: [
            gorille({ penche: 9, bas: 5, tete: [0, 3], avant: [[32, 66], [28, 78]], arriere: [[48, 64], [44, 80]], gueule: true }),
            gorille({ penche: 8, bas: 6, tete: [1, 4], avant: [[34, 68], [30, 80]], arriere: [[50, 66], [46, 82]], gueule: true })
        ],
        touche: gorille({ penche: -7, tete: [5, -2], avant: [[34, 50], [30, 60]], arriere: [[62, 46], [70, 54]], gueule: true }),
        rugir: [
            gorille({ penche: -4, tete: [3, -4], avant: [[34, 50], [42, 42]], arriere: [[56, 52], [52, 46]], gueule: true }),
            gorille({ penche: -4, tete: [3, -5], avant: [[32, 54], [36, 50]], arriere: [[58, 48], [48, 40]], gueule: true })
        ],
        ko: gorille_ko()
    };

    // Gégé K.O. : étalé sur le dos, la tête vers la droite, la langue pendante
    function gorille_ko() {
        const g = PixelArt.grille(96);
        membre(g, 34, 82, 22, 70, 11, 'q'); membre(g, 22, 70, 10, 84, 10, 'q');                     // jambe repliée
        membre(g, 56, 76, 50, 60, 11, 'b'); membre(g, 50, 60, 40, 56, 10, 'b'); ellipse(g, 36, 55, 7, 6.5, 'm', 0);   // bras levé
        ellipse(g, 52, 81, 23, 11, 'T', 0.05);
        rect(g, 26, 76, 40, 91, 'S');                                                               // short
        membre(g, 32, 86, 18, 90, 11, 'J'); membre(g, 18, 90, 6, 90, 10, 'J');                      // jambe tendue
        ellipse(g, 80, 80, 11, 10, 'H', 0.06);
        ellipse(g, 86, 76, 6.5, 6, 'V', 0.03);                                                      // museau vers le ciel
        membre(g, 60, 86, 74, 91, 11, 'A'); ellipse(g, 78, 91, 7, 5, 'M', 0);                       // bras au sol
        const res = PixelArt.finir(g, PARTIES_G);
        const set = (x, y, c) => { if (res[y] && res[y][x] && res[y][x] !== 'K') res[y][x] = c; };
        for (let y = 72; y <= 90; y++) for (let x = 36; x <= 70; x++) if ((x - 54) ** 2 / 200 + (y - 80) ** 2 / 50 <= 1 && 'Ff'.includes(res[y][x])) set(x, y, y > 84 ? 'c' : 'C');   // poitrail
        for (const [x, y] of [[80, 72], [82, 74], [82, 72], [80, 74], [85, 70], [87, 72], [87, 70], [85, 72]]) set(x, y, 'N');   // yeux en croix
        set(90, 78, 'R'); set(91, 79, 'R'); set(91, 80, 'R'); set(92, 81, 'R');                     // la langue
        for (let k = 0; k <= 12; k++) set(68 + k, 70 + Math.round(Math.sin(k / 12 * Math.PI) * 3), k % 2 ? 'Y' : 'y');   // la chaîne
        return PixelArt.en_image(res, COULEURS_G);
    }

    return { brutus: b, gorille: gg };
})();
