/* =========================================================================
   SPRITES DU COMBAT DE BOXE (chapitre 2, « Le Ring »), pixel art généré au
   chargement (voir pixel_art.js). Dessinés en 2,25× à l'écran par boxe.js.
   - SPRITES_BOXE.brutus (grille 64, tourné vers la droite) : construit à
     partir de son vrai sprite (ou de sa tenue), sans le fusil qu'on lui a volé,
     avec des bras de boxeur.
       garde ×4, jab ×2 (bras du fond), direct ×2 (bras proche), uppercut ×3,
       esquive ×2 (il recule en se baissant), touche, victoire (il gonfle les
       biceps), ko (couché)
   - SPRITES_BOXE.gorille (grille 84, tourné vers la gauche) : Gégé, ancien
     déménageur qui a muté en gorille. Fourrure sombre et hirsute, poitrail gris,
     short en jean effiloché, chaîne en or et médaillon, une dent en or : le roi
     de la bâtisse.
       garde ×4, armer ×2 (il arme son coup), frappe ×2, ouvert ×2 (il a
       frappé dans le vide et part en avant), touche, rugir ×2 (il se tape
       la poitrine), ko, et la version « bouche ouverte » de garde pour parler.
   - SPRITES_BOXE.foule : les spectateurs (bras baissés / levés) et le premier
     rang vu de dos.
   ========================================================================= */
// Toile des sprites de boxe de Brutus : 80×80, son sprite posé avec 8 pixels de marge, pieds sur la ligne 71
const BOXE_TOILE = 80, BOXE_MARGE = 8, BOXE_PIEDS = 71;
// Gégé : une grille de 84, affichée comme Brutus (mêmes pixels à l'écran), pieds sur la ligne 81
const GORILLE_TOILE = 84, GORILLE_PIEDS = 81;
const SPRITES_BOXE = (() => {
    const { poser, ellipse, rect, membre } = PixelArt;

    /* ---------- Brutus : construit à partir de son VRAI sprite ----------
       On part de assets/persos/brutus/arret.png (ou de la tenue équipée, qui a la
       même forme) : la tête, le gilet, le pantalon et les rangers sont repris pixel
       pour pixel. On retire le fusil et les deux bras, on redessine le bas du gilet
       et la ceinture que le fusil cachait, puis on lui remet des bras de boxeur,
       ombrés comme les siens (reflet à gauche, ombre à droite, contour noir), avec
       les couleurs lues sur le sprite. Construit au premier combat (l'image doit
       être chargée), et gardé en cache pour chaque tenue. */
    const cacheBrutus = new Map();
    const N = 64;

    function brutus_depuis(img) {
        const toile = document.createElement('canvas'); toile.width = toile.height = N;
        const tg = toile.getContext('2d'); tg.drawImage(img, 0, 0, N, N);
        const d = tg.getImageData(0, 0, N, N).data;
        const px = (x, y) => { const i = (y * N + x) * 4; return d[i + 3] < 128 ? null : `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`; };
        const ou = (c, def) => c || def;
        // Les couleurs de Brutus, lues sur son sprite (une tenue garde les siennes)
        const C = {
            A: ou(px(3, 21), '#050403'),            // contour
            J: ou(px(4, 21), '#dda27a'),            // peau : reflet
            S: ou(px(5, 21), '#c68a5e'),            // peau
            G: ou(px(8, 21), '#9e6640'),            // peau : ombre
            K: ou(px(17, 18), '#5e6e34'),           // gilet
            M: ou(px(15, 18), '#3e4a22'),           // gilet : ombre
            X: ou(px(9, 37), '#6e7e3c'),            // pantalon : reflet
            Y: ou(px(12, 37), '#4a5a2a'),           // pantalon
            Z: ou(px(17, 37), '#28331a'),           // pantalon : ombre
            B: '#4f342f', b: '#2d1b1e', F: '#c8a040'   // ceinture, boucle
        };

        // 1. Le corps sans bras ni fusil
        const corps = Array.from({ length: N }, () => Array(N).fill(null));
        const copier = (y, x0, x1) => { for (let x = x0; x <= x1; x++) corps[y][x] = px(x, y); };
        for (let y = 0; y <= 12; y++) copier(y, 0, 40);          // la tête, les trapèzes
        for (let y = 13; y <= 14; y++) copier(y, 10, 26);        // les épaules du gilet
        for (let y = 15; y <= 19; y++) copier(y, 13, 26);        // le gilet et le col en V
        // Le bas du gilet (caché par le fusil) : ombre à gauche, couture, reflet, contour
        for (let y = 20; y <= 31; y++) {
            const g = 12, dr = y >= 25 ? 27 : 26;                  // un peu de ventre
            // Le tissu du sprite lui-même (lignes 19-20, x 16 à 23), répété : une chemise à motifs garde ses motifs
            for (let x = g; x <= dr; x++) corps[y][x] = px(16 + (x - g) % 8, 19 + (y % 2)) || C.K;
            corps[y][g] = C.A; corps[y][dr] = C.A;
            corps[y][g + 1] = C.M; corps[y][g + 2] = C.M;
            if (y >= 30) for (let x = g + 1; x < dr; x++) if ((x + y) % 2) corps[y][x] = C.M;   // le pli du ventre
        }
        // La ceinture, sa boucle, et une poche de cuir sur la hanche
        for (let y = 32; y <= 33; y++) { for (let x = 11; x <= 27; x++) corps[y][x] = y === 32 ? C.B : C.b; corps[y][10] = C.A; corps[y][28] = C.A; }
        for (let y = 31; y <= 34; y++) for (let x = 18; x <= 20; x++) corps[y][x] = (x === 19 && (y === 32 || y === 33)) ? C.b : C.F;
        for (let y = 30; y <= 36; y++) for (let x = 12; x <= 15; x++) corps[y][x] = (x === 12 || y === 36) ? C.A : y === 30 ? C.B : C.b;
        // Le haut du pantalon
        for (let y = 34; y <= 35; y++) {
            for (let x = 10; x <= 27; x++) corps[y][x] = C.Y;
            corps[y][9] = C.A; corps[y][28] = C.A; corps[y][10] = C.X;
            corps[y][18] = C.Z; corps[y][19] = C.Z; corps[y][20] = C.A; corps[y][21] = C.Z;
        }
        copier(36, 9, 40); corps[36][8] = C.A;
        for (let y = 37; y < N; y++) copier(y, 0, 40);          // les jambes et les rangers

        /* 2. Un bras de boxeur. Même ombrage que le bras de son sprite, en travers du
           membre : reflet sur deux pixels (côté lumière, en haut à gauche), peau,
           ombre, puis le trait sombre entre biceps et triceps, et un liseré de peau
           avant le contour (« jjccgg·cc » sur son sprite). Le poing : reflet en haut,
           ombre en bas, les doigts repliés marqués, le pouce. */
        function bras(epaule, coude, poing) {
            const forme = new Map(), cle = (x, y) => x + ',' + y;   // pixel → { morceau, s (−1 ombre … +1 lumière) }
            const membre = (a, b, r0, r1, morceau) => {
                const ux = b[0] - a[0], uy = b[1] - a[1], l = Math.hypot(ux, uy) || 1;
                let nx = -uy / l, ny = ux / l;
                if (nx * -1 + ny * -1 < 0) { nx = -nx; ny = -ny; }      // la normale regarde la lumière (en haut à gauche)
                const rmax = Math.max(r0, r1);
                for (let y = Math.floor(Math.min(a[1], b[1]) - rmax - 1); y <= Math.ceil(Math.max(a[1], b[1]) + rmax + 1); y++)
                    for (let x = Math.floor(Math.min(a[0], b[0]) - rmax - 1); x <= Math.ceil(Math.max(a[0], b[0]) + rmax + 1); x++) {
                        const t = Math.max(0, Math.min(1, ((x - a[0]) * ux + (y - a[1]) * uy) / (l * l)));
                        const px0 = a[0] + ux * t, py0 = a[1] + uy * t, r = r0 + (r1 - r0) * t;
                        const ddx = x - px0, ddy = y - py0;
                        if (ddx * ddx + ddy * ddy > r * r) continue;
                        const s = (ddx * nx + ddy * ny) / r;
                        const avant = forme.get(cle(x, y));
                        if (!avant || avant.morceau !== 'poing') forme.set(cle(x, y), { morceau, s, t });
                    }
            };
            membre(epaule, coude, 4.4, 3.4, 'biceps');               // le biceps : épais, comme sur son sprite
            membre([epaule[0] - 0.5, epaule[1]], [epaule[0] + 0.5, epaule[1] + 1], 4.6, 4.6, 'biceps');   // l'épaule
            membre(coude, poing, 3.3, 2.9, 'avantbras');            // l'avant-bras
            // Le poing
            const fx = poing[0] - coude[0], fy = poing[1] - coude[1], fl = Math.hypot(fx, fy) || 1, vx = fx / fl, vy = fy / fl;
            const R = 3.8;
            for (let y = Math.floor(poing[1] - R); y <= Math.ceil(poing[1] + R); y++) for (let x = Math.floor(poing[0] - R); x <= Math.ceil(poing[0] + R); x++) {
                const ox = x - poing[0], oy = y - poing[1];
                if (ox * ox + oy * oy <= R * R) forme.set(cle(x, y), { morceau: 'poing', f: ox * vx + oy * vy, l: -ox * vy + oy * vx, s: (-ox - oy) / (R * 1.4) });
            }
            const dans = (x, y) => forme.has(cle(x, y));
            const calque = new Map();
            for (const [k, p] of forme) {
                let c;
                if (p.morceau === 'poing') {
                    c = p.s > 0.35 ? C.J : p.s < -0.4 ? C.G : C.S;
                    // Les doigts repliés : des plis sombres à l'avant du poing, tous les deux pixels
                    if (p.f > 0.8 && Math.abs(p.l) < 3.1 && Math.round(p.l + 10) % 2 === 0) c = C.G;
                    if (p.f > 1.9 && Math.abs(p.l) < 3.1 && Math.round(p.l + 10) % 2 === 0) c = C.A;
                } else if (p.morceau === 'biceps') {
                    c = p.s > 0.45 ? C.J : p.s > -0.15 ? C.S : p.s > -0.5 ? C.G : p.s > -0.68 ? C.A : C.S;
                } else {
                    c = p.s > 0.45 ? C.J : p.s > -0.3 ? C.S : C.G;
                }
                calque.set(k, c);
            }
            // Le creux du coude : une petite ombre
            const cx = Math.round(coude[0]), cy = Math.round(coude[1]);
            for (const [x, y] of [[cx, cy], [cx + 1, cy]]) if (dans(x, y)) calque.set(cle(x, y), C.G);
            // Le poignet : un trait sombre sépare le poing de l'avant-bras
            for (const [k, p] of forme) if (p.morceau === 'poing' && p.f < -2.8) calque.set(k, C.A);
            // Le contour noir
            for (const k of forme.keys()) {
                const [x, y] = k.split(',').map(Number);
                for (const [vx, vy] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (!dans(vx, vy)) calque.set(cle(vx, vy), calque.get(cle(vx, vy)) || C.A);
            }
            return calque;
        }

        // 3. Une pose : le haut du corps se déplace (dx, dy), la tête peut partir en arrière,
        // le bras du fond est dessiné derrière le corps, le bras proche par-dessus.
        // La toile fait 80×80 : son sprite (64×64) est posé avec 8 pixels de marge
        // (les poings levés, l'esquive en arrière ne sont jamais coupés) ; les pieds
        // sont sur la ligne 71 (BOXE_PIEDS), les 8 dernières lignes restent vides.
        const T = BOXE_TOILE, MG = 8;
        function pose({ dx = 0, dy = 0, tete = [0, 0], proche, loin }) {
            const grille = Array.from({ length: T }, () => Array(T).fill(null));
            const poserCalque = (calque, ox, oy) => { for (const [k, c] of calque) { const [x, y] = k.split(',').map(Number); const X = x + ox + MG, Y = y + oy + MG; if (X >= 0 && Y >= 0 && X < T && Y < T && c) grille[Y][X] = c; } };
            // Le bras du fond, derrière
            poserCalque(bras(...loin), dx, dy);
            // Le corps : les jambes restent plantées, le haut bouge
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                const c = corps[y][x];
                if (!c) continue;
                const haut = y < 36, ox = haut ? dx + (y <= 12 ? tete[0] : 0) : 0, oy = haut ? dy + (y <= 12 ? tete[1] : 0) : 0;
                const X = x + ox + MG, Y = y + oy + MG;
                if (X >= 0 && Y >= 0 && X < T && Y < T) grille[Y][X] = c;
            }
            // Le bras proche, devant
            poserCalque(bras(...proche), dx, dy);
            return grille;
        }

        const en_image = grille => {
            const t = document.createElement('canvas'); t.width = t.height = T;
            const c = t.getContext('2d');
            for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (grille[y][x]) { c.fillStyle = grille[y][x]; c.fillRect(x, y, 1, 1); }
            return t;
        };
        // K.O. : la pose « touché », tournée d'un quart de tour (la tête vers la gauche), posée au sol (ligne des pieds)
        const couche = grille => {
            const r = Array.from({ length: T }, () => Array(T).fill(null));
            for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (grille[y][x]) r[T - 1 - x][y] = grille[y][x];
            let bas = 0, gauche = T; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (r[y][x]) { bas = y; gauche = Math.min(gauche, x); }
            const dy = BOXE_PIEDS - bas, dx = 2 - gauche, res = Array.from({ length: T }, () => Array(T).fill(null));
            for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (r[y][x] && y + dy >= 0 && y + dy < T && x + dx >= 0 && x + dx < T) res[y + dy][x + dx] = r[y][x];
            return res;
        };

        // Épaules : la proche (à gauche, énorme, devant le gilet), la lointaine (à droite, derrière)
        const EP = [9, 16], EL = [26, 15];
        const GARDE_P = [EP, [12, 27], [21, 18]], GARDE_L = [EL, [33, 24], [34, 13]];
        const touche = pose({ dx: -3, dy: 1, tete: [-1, 0], proche: [EP, [6, 26], [5, 33]], loin: [EL, [33, 24], [38, 30]] });
        const f = (o) => en_image(pose(o));
        return {
            garde: [0, 1, 1, 0].map(k => f({ dy: k, proche: GARDE_P, loin: [EL, [33, 24], [34, 13 + k]] })),
            jab: [
                f({ dx: 1, proche: GARDE_P, loin: [EL, [36, 17], [43, 14]] }),
                f({ dx: 2, proche: GARDE_P, loin: [EL, [38, 15], [50, 13]] })
            ],
            direct: [
                f({ dx: 2, proche: [EP, [17, 22], [30, 16]], loin: [EL, [31, 24], [30, 13]] }),
                f({ dx: 3, proche: [EP, [22, 17], [42, 14]], loin: [EL, [31, 24], [29, 14]] })
            ],
            uppercut: [
                f({ dx: -1, dy: 3, proche: [EP, [10, 28], [18, 34]], loin: GARDE_L }),
                f({ dx: 1, dy: 1, proche: [EP, [18, 26], [28, 18]], loin: GARDE_L }),
                f({ dx: 2, proche: [EP, [22, 13], [30, 3]], loin: [EL, [33, 24], [33, 15]] })
            ],
            esquive: [
                f({ dx: -2, dy: 3, proche: [EP, [12, 27], [19, 17]], loin: [EL, [30, 25], [30, 14]] }),
                f({ dx: -4, dy: 5, tete: [-1, 0], proche: [EP, [12, 27], [18, 16]], loin: [EL, [29, 25], [29, 14]] })
            ],
            touche: en_image(touche),
            // Victoire : il gonfle les deux biceps
            victoire: f({ proche: [EP, [2, 15], [5, 5]], loin: [EL, [35, 15], [33, 5]] }),
            ko: en_image(couche(touche))
        };
    }

    // Les sprites de boxe de Brutus pour une image (une tenue), construits au premier besoin
    function brutus_pour(img) {
        if (!cacheBrutus.has(img)) cacheBrutus.set(img, brutus_depuis(img));
        return cacheBrutus.get(img);
    }
    // …et dans la tenue qu'il porte en ce moment
    const sprites_brutus = () => brutus_pour(typeof Loot !== 'undefined' ? Loot.sprites('brute').arret : SPRITES_PERSO.brute.arret);

    /* ---------- Gégé, le Gorille ----------
       Dessiné pour aller avec le sprite de Brutus : à l'écran, ses pixels ont la
       même taille (grille de 84, affichée comme Brutus), quatre tons par matière
       (reflet, base, ombre, creux) calculés selon la lumière (en haut à gauche),
       des traits noirs entre les parties, une fourrure à mèches et à la silhouette
       hirsute, et des détails : arcade sourcilière, œil, cicatrice, narines, dent
       en or, pectoraux, abdos, chaîne et médaillon, jean effiloché, doigts, orteils.
       Les poses sont décrites sur 96 et réduites (× 0,875). */
    const SG = 0.875, GN = GORILLE_TOILE, NOIR = '#050403';
    const TONS = {
        fourrure: ['#7a6c62', '#4e423c', '#352b29', '#211a1a'],
        peau: ['#b6a294', '#8e7a6c', '#6a5a50', '#4a3e38'],
        jean: ['#88a6ca', '#5476a2', '#3a5a84', '#263e60']
    };
    const MATIERE = { q: 'fourrure', b: 'fourrure', T: 'fourrure', J: 'fourrure', H: 'fourrure', A: 'fourrure', m: 'peau', M: 'peau', P: 'peau', V: 'peau', f: 'peau', g: 'peau', S: 'jean' };
    const RANG = { b: 0, q: 0, m: 0.5, g: 0.6, T: 1, P: 1.2, S: 1.5, J: 2, f: 2.2, H: 3, V: 3.5, A: 4, M: 5 };
    const G = v => Math.round(v * SG);

    // Les formes (lettres = parties), sur la grille de 84
    function forme_gorille(p) {
        const g = PixelArt.grille(GN);
        const pe = p.penche || 0, bas = p.bas || 0;
        const M_ = (x0, y0, x1, y1, w, c) => membre(g, x0 * SG, y0 * SG, x1 * SG, y1 * SG, w * SG, c);
        const E_ = (x, y, rx, ry, c, b = 0.05) => ellipse(g, x * SG, y * SG, rx * SG, ry * SG, c, b);
        const R_ = (x0, y0, x1, y1, c) => rect(g, G(x0), G(y0), G(x1), G(y1), c);
        // Jambe arrière, pied arrière
        M_(58, 66 + bas, 66, 80, 11, 'q'); M_(66, 80, 64, 88, 10, 'q');
        E_(62, 90.5, 9, 3.4, 'g', 0);
        const bras = ([sx, sy], [coude, poing], pb, pp) => {
            M_(sx - pe, sy + bas, coude[0] - pe, coude[1] + bas, 13, pb);
            M_(coude[0] - pe, coude[1] + bas, poing[0] - pe, poing[1] + bas, 11, pb);
            E_(poing[0] - pe, poing[1] + bas, 7.4, 6.8, pp, 0);
        };
        bras([60, 32], p.arriere, 'b', 'm');
        // Torse en tonneau, épaules voûtées, poitrail nu
        E_(52 - pe, 44 + bas, 19, 18, 'T'); E_(46 - pe, 30 + bas, 13, 9, 'T');
        E_(44 - pe, 47 + bas, 11, 10, 'P', 0.03);
        // Short en jean
        R_(38 - pe * 0.7, 56 + bas, 66 - pe * 0.5, 68 + bas, 'S');
        // Jambe avant, pied avant
        M_(44 - pe * 0.6, 66 + bas, 36, 80, 11, 'J'); M_(36, 80, 38, 88, 10, 'J');
        E_(33, 90.5, 9, 3.4, 'f', 0);
        // Tête basse, museau
        const [tx, ty] = p.tete || [0, 0];
        const hx = 32 - pe + tx, hy = 28 + bas + ty;
        E_(hx + 2, hy - 2, 11, 10, 'H', 0.06);
        E_(hx - 5, hy + 4, 7.5, 6, 'V', 0.03);
        bras([40, 34], p.avant, 'A', 'M');
        touffes(g);
        return { g, hx, hy, pe, bas, poings: [[p.avant[1][0] - pe, p.avant[1][1] + bas, 'M'], [p.arriere[1][0] - pe, p.arriere[1][1] + bas, 'm']] };
    }

    // Une fourrure hirsute : des mèches dépassent sur le dessus et à l'avant de la silhouette
    function touffes(g) {
        const n = g.length, ajouts = [];
        for (let y = 2; y < n; y++) for (let x = 2; x < n; x++) {
            const c = g[y][x];
            if (!c || MATIERE[c] !== 'fourrure' || c === 'q' || c === 'J') continue;
            if (!g[y - 1][x] && (x * 7 + y * 3) % 4 === 0) { ajouts.push([x, y - 1, c]); if (x % 3 === 0 && !g[y - 2][x]) ajouts.push([x, y - 2, c]); }
            if (!g[y][x - 1] && (y * 5 + x) % 5 === 0) ajouts.push([x - 1, y, c]);
        }
        for (const [x, y, c] of ajouts) g[y][x] = c;
    }

    // Le rendu : tons selon la lumière, traits entre les parties, mèches, contour
    function rendu_gorille(g) {
        const n = g.length, at = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? null : g[y][x]);
        const res = Array.from({ length: n }, () => Array(n).fill(null));
        const SONDES = [[-1, -1], [-2, -2], [-3, -2], [-1, 0], [-2, 0], [0, -1], [0, -2], [-3, -3]];
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const c = g[y][x];
            if (!c) continue;
            const devant = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].map(([a, b]) => at(a, b)).find(v => v && RANG[v] > RANG[c]);
            if (devant) { res[y][x] = c === 'T' && devant === 'P' ? TONS.fourrure[3] : NOIR; continue; }
            let L = 0;
            for (const [dx, dy] of SONDES) { if (at(x + dx, y + dy) !== c) L++; if (at(x - dx, y - dy) !== c) L--; }
            let k = L >= 3 ? 0 : L >= -1 ? 1 : L >= -4 ? 2 : 3;
            if (MATIERE[c] === 'fourrure') {
                // Les mèches : de petits traits verticaux plus sombres ou plus clairs
                const h = (x * 7 + Math.floor((y + (x % 3)) / 2) * 13) % 11;
                if (h === 0) k = Math.min(3, k + 1); else if (h === 5 && k > 0) k--;
            }
            res[y][x] = TONS[MATIERE[c]][k];
        }
        // Le contour noir, comme sur les sprites du jeu
        const final = res.map(l => l.slice());
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            if (res[y][x]) continue;
            if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && res[b][a])) final[y][x] = NOIR;
        }
        return final;
    }

    // Les détails, posés sur le rendu
    function details_gorille(res, f, gueule) {
        const { g, hx, hy, pe, bas, poings } = f;
        const set = (x, y, c) => { if (res[y] && res[y][x] && res[y][x] !== NOIR) res[y][x] = c; };
        const P = TONS.peau, F = TONS.fourrure;
        const HX = G(hx), HY = G(hy), MX = G(hx - 5), MY = G(hy + 4);
        // Arcade sourcilière, œil (le reflet du ring dedans), cicatrice, oreille
        for (let x = G(hx - 10); x <= G(hx + 1); x++) { set(x, HY - 5, F[3]); set(x, HY - 4, F[2]); }
        set(G(hx - 6), HY - 2, '#e0a030'); set(G(hx - 5), HY - 2, NOIR); set(G(hx - 6), HY - 3, '#fff6d0');
        set(G(hx - 7), HY - 2, P[3]); set(G(hx - 4), HY - 2, P[3]);
        for (let k = 0; k < 3; k++) set(G(hx - 1) + k, HY - 7 + k, P[0]);
        set(G(hx + 9), HY, P[1]); set(G(hx + 9), HY + 1, P[3]); set(G(hx + 10), HY, P[2]); set(G(hx + 10), HY + 1, P[2]);
        // Narines, bouche
        set(MX - 4, MY - 1, '#2a201c'); set(MX - 2, MY - 1, '#2a201c'); set(MX - 3, MY - 2, P[0]);
        if (gueule) {
            for (let x = MX - 6; x <= MX; x++) { set(x, MY + 2, '#ece6da'); set(x, MY + 3, '#3a1414'); set(x, MY + 4, '#3a1414'); }
            set(MX - 3, MY + 2, '#f0c040');                                   // la dent en or
            set(MX - 4, MY + 4, '#b04040'); set(MX - 3, MY + 4, '#b04040');   // la langue
        } else {
            for (let x = MX - 6; x <= MX + 1; x++) set(x, MY + 3, NOIR);
            for (let x = MX - 5; x <= MX; x++) set(x, MY + 2, P[0]);
        }
        // Pectoraux, abdos, nombril (seulement sur le poitrail)
        const CX = G(44 - pe), CY = G(47 + bas);
        const surP = (x, y) => g[y] && g[y][x] === 'P';
        const marque = (x, y, c) => { if (surP(x, y)) set(x, y, c); };
        for (let dx = -6; dx <= 5; dx++) marque(CX + dx, CY + Math.round(Math.abs(dx) * 0.3) - 1, P[3]);
        for (let y = CY - 6; y <= CY - 1; y++) marque(CX, y, P[2]);
        for (const y of [CY + 2, CY + 4]) for (const x of [CX - 3, CX - 2, CX + 2, CX + 3]) marque(x, y, P[2]);
        marque(CX, CY + 6, P[3]);
        for (let dx = -5; dx <= 4; dx += 3) marque(CX + dx, CY - 4, P[0]);
        // La chaîne en or et son médaillon « G »
        const cx0 = G(hx + 1), cy0 = G(hy + 9), lg = 14;
        let bas_ = [0, 0];
        for (let k = 0; k <= lg; k++) { const y = cy0 + Math.round(Math.sin(k / lg * Math.PI) * 3); set(cx0 + k, y, k % 2 ? '#f0d060' : '#a8842a'); if (k === Math.round(lg / 2)) bas_ = [cx0 + k, y]; }
        for (let y = 1; y <= 4; y++) for (let x = -1; x <= 1; x++) set(bas_[0] + x, bas_[1] + y, (x === 0 && (y === 2 || y === 3)) ? '#a8842a' : '#f0d060');
        // Le jean : coutures claires, bas effiloché, un accroc
        let sxMin = GN, sxMax = 0, syMax = 0;
        for (let y = 0; y < GN; y++) for (let x = 0; x < GN; x++) if (g[y][x] === 'S') { sxMin = Math.min(sxMin, x); sxMax = Math.max(sxMax, x); syMax = Math.max(syMax, y); }
        for (let y = 0; y < GN; y++) for (let x = 0; x < GN; x++) {
            if (g[y][x] !== 'S') continue;
            if (x === Math.round((sxMin + sxMax) / 2) && y % 2) set(x, y, TONS.jean[0]);
            if (y === syMax && x % 2) set(x, y, '#c8d8ea');                     // les fils qui pendent
            if (y === syMax - 1 && x % 3 === 0) set(x, y, TONS.jean[0]);
        }
        const ax = sxMin + 4, ay = syMax - 4;
        if (g[ay] && g[ay][ax] === 'S') { set(ax, ay, P[1]); set(ax + 1, ay, P[1]); set(ax, ay + 1, P[2]); }
        // Les doigts repliés sur l'avant des poings (à gauche : il frappe vers la gauche)
        for (const [px, py, lettre] of poings) {
            const fx = G(px), fy = G(py);
            for (let y = fy - 4; y <= fy + 4; y++) for (let x = fx - 6; x <= fx - 2; x++) if (g[y] && g[y][x] === lettre && (y - fy) % 2 === 0) set(x, y, x <= fx - 4 ? NOIR : P[3]);
            set(fx, fy - 3, P[0]); set(fx + 1, fy - 3, P[0]);
        }
        // Les orteils
        for (let y = 0; y < GN; y++) for (let x = 0; x < GN; x++) if ((g[y][x] === 'f' || g[y][x] === 'g') && (!g[y][x - 1] || g[y][x - 2] !== g[y][x]) && y % 2 === 0) set(x + 1, y, P[3]);
    }

    function gorille(p) {
        const f = forme_gorille(p);
        const res = rendu_gorille(f.g);
        details_gorille(res, f, p.gueule);
        return en_toile(res);
    }
    function en_toile(res) {
        const t = document.createElement('canvas'); t.width = t.height = res.length;
        const c = t.getContext('2d');
        for (let y = 0; y < res.length; y++) for (let x = 0; x < res.length; x++) if (res[y][x]) { c.fillStyle = res[y][x]; c.fillRect(x, y, 1, 1); }
        return t;
    }

    const G_AV = [[28, 52], [18, 40]], G_AR = [[44, 48], [30, 34]];
    const gg = {
        garde: [0, 1, 2, 1].map(k => gorille({ bas: k, avant: [[28, 52 - k * 0.5], [18, 40]], arriere: G_AR })),
        parle: gorille({ bas: 1, avant: G_AV, arriere: G_AR, gueule: true }),
        // Pour le portrait des dialogues : les bras baissés, on voit sa tête et sa chaîne
        portrait: [false, true].map(gueule => gorille({ bas: 1, avant: [[30, 58], [28, 70]], arriere: [[50, 56], [48, 70]], gueule })),
        armer: [
            gorille({ penche: -3, avant: G_AV, arriere: [[70, 22], [80, 14]] }),
            gorille({ penche: -6, bas: 2, tete: [2, 0], avant: [[30, 54], [22, 44]], arriere: [[74, 16], [84, 7]], gueule: true })
        ],
        frappe: [
            gorille({ penche: 6, avant: [[32, 56], [26, 48]], arriere: [[36, 32], [12, 32]], gueule: true }),
            gorille({ penche: 10, bas: 2, avant: [[36, 58], [30, 52]], arriere: [[30, 38], [9, 44]], gueule: true })
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
        const g = PixelArt.grille(GN);
        const M_ = (x0, y0, x1, y1, w, c) => membre(g, x0 * SG, y0 * SG, x1 * SG, y1 * SG, w * SG, c);
        const E_ = (x, y, rx, ry, c, b = 0.05) => ellipse(g, x * SG, y * SG, rx * SG, ry * SG, c, b);
        M_(34, 82, 22, 70, 11, 'q'); M_(22, 70, 12, 84, 10, 'q'); E_(10, 88, 4, 6, 'g', 0);   // jambe repliée
        M_(56, 76, 50, 60, 12, 'b'); M_(50, 60, 40, 56, 11, 'b'); E_(36, 55, 7, 6.5, 'm', 0);   // bras levé
        E_(52, 81, 23, 11, 'T');
        E_(54, 79, 13, 7, 'P', 0.03);                                                         // poitrail
        rect(g, G(26), G(76), G(40), G(91), 'S');                                             // short
        M_(32, 86, 18, 90, 11, 'J'); M_(18, 90, 8, 90, 10, 'J'); E_(5, 88, 3.4, 5, 'f', 0);    // jambe tendue
        E_(80, 80, 11, 10, 'H', 0.06);
        E_(86, 76, 6.5, 6, 'V', 0.03);                                                        // museau vers le ciel
        M_(60, 86, 74, 91, 11, 'A'); E_(78, 91, 7, 5, 'M', 0);                                // bras au sol
        touffes(g);
        const res = rendu_gorille(g);
        const set = (x, y, c) => { if (res[y] && res[y][x] && res[y][x] !== NOIR) res[y][x] = c; };
        // Les yeux en croix, la langue, la dent en or, la chaîne
        for (const [ex, ey] of [[G(80), G(72)], [G(86), G(70)]]) for (const [a, b] of [[0, 0], [2, 2], [2, 0], [0, 2], [1, 1]]) set(ex + a, ey + b, NOIR);
        for (const [x, y] of [[G(91), G(78)], [G(92), G(79)], [G(92), G(80)], [G(93), G(81)]]) set(x, y, '#b04040');
        set(G(89), G(77), '#f0c040');
        for (let k = 0; k <= 11; k++) set(G(68) + k, G(70) + Math.round(Math.sin(k / 11 * Math.PI) * 3), k % 2 ? '#f0d060' : '#a8842a');
        return en_toile(res);
    }

    /* ---------- La foule de la bâtisse ----------
       De petits spectateurs dans le style des sprites du jeu (deux tons, contour
       noir) : coupes de cheveux, casquettes, bonnets, barbes, peaux et habits
       variés ; bras le long du corps ou levés. Ceux du premier rang sont vus de dos. */
    function spectateur(v, leve, dos) {
        const g = PixelArt.grille(24);
        const PARTIES_F = {
            T: { rang: 1, base: 'U', ombre: 'u', bande: 'large' },
            A: { rang: 2, base: 'U', ombre: 'u', bande: 'fine' },
            H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },
            X: { rang: 4, base: 'C', ombre: 'c', bande: 'fine' },
            h: { rang: 5, base: 'S', ombre: 's', bande: 'fine' }
        };
        ellipse(g, 11.5, 13.5, 5.5, 2.6, 'T', 0); rect(g, 7, 14, 16, 23, 'T');
        if (leve) {
            membre(g, 8, 14, 5, 6, 3.2, 'A'); membre(g, 15, 14, 18, 6, 3.2, 'A');
            ellipse(g, 5, 4.5, 1.8, 1.8, 'h', 0); ellipse(g, 18, 4.5, 1.8, 1.8, 'h', 0);
        } else {
            membre(g, 7.5, 14, 6.5, 21, 3.2, 'A'); membre(g, 15.5, 14, 16.5, 21, 3.2, 'A');
            ellipse(g, 6.5, 22, 1.6, 1.6, 'h', 0); ellipse(g, 16.5, 22, 1.6, 1.6, 'h', 0);
        }
        ellipse(g, 11.5, 8, 3.6, 4.2, 'H', 0.02);
        const coupe = dos ? (v.coupe === 3 ? 0 : v.coupe) : v.coupe;
        if (coupe === 0) { ellipse(g, 11.5, 6, 3.9, 2.8, 'X', 0.05); }                                 // cheveux courts
        else if (coupe === 1) { ellipse(g, 11.5, 6, 4, 3, 'X', 0.05); rect(g, 7, 6, 8, 13, 'X'); rect(g, 15, 6, 16, 13, 'X'); }   // cheveux longs
        else if (coupe === 2) { rect(g, 8, 3, 15, 5, 'X'); rect(g, dos ? 6 : 14, 5, dos ? 9 : 18, 6, 'X'); }   // casquette
        else if (coupe === 4) { ellipse(g, 11.5, 5.5, 4, 3, 'X', 0); poser(g, 11, 1, 'X'); poser(g, 12, 1, 'X'); }   // bonnet à pompon
        if (dos) ellipse(g, 11.5, 8, 3.7, 4, 'X', 0.03);                                          // de dos : la nuque, les cheveux
        const res = PixelArt.finir(g, PARTIES_F);
        if (!dos) {
            res[8][10] = 'K'; res[8][13] = 'K';                                                  // les yeux
            res[10][11] = leve ? 'M' : 's'; res[10][12] = leve ? 'M' : 's';                     // la bouche (grande ouverte quand il crie)
            if (leve) res[11][11] = 'M';
            if (v.barbe) for (let x = 9; x <= 14; x++) if (res[11][x] && res[11][x] !== 'K') res[11][x] = 'c';
            if (v.motif) for (let y = 15; y < 23; y += 3) for (let x = 9; x <= 14; x += 2) if (res[y][x] === 'U') res[y][x] = 'W';   // t-shirt rayé
        }
        const couleurs = { S: v.peau[0], s: v.peau[1], U: v.habit[0], u: v.habit[1], C: v.cheveux[0], c: v.cheveux[1], W: '#ece6da', M: '#3a1414', K: NOIR };
        if (dos) { for (const k of ['S', 's', 'U', 'u', 'C', 'c']) couleurs[k] = { S: '#3a2c26', s: '#2a201c', U: '#2a2830', u: '#1c1a20', C: '#1c1614', c: '#140f0e' }[k]; }
        return PixelArt.en_image(res, couleurs);
    }
    function creer_foule() {
        const peaux = [['#e0b08a', '#b8865e'], ['#c68a5e', '#9e6640'], ['#8a5a3a', '#6a4028'], ['#f0c8a0', '#c89c78'], ['#5a3a2a', '#40281c']];
        const habits = [['#a8443e', '#7a2a24'], ['#4a6a9a', '#324a72'], ['#5e6e34', '#3e4a22'], ['#7a7a82', '#56565e'], ['#c8a040', '#94742a'], ['#6a4a7a', '#4a3258'], ['#3a6a6a', '#264a4a'], ['#d8d0c0', '#a8a090']];
        const cheveux = [['#2d1b1e', '#1a1012'], ['#6a4a2a', '#4a321c'], ['#c8a060', '#9a7840'], ['#8a8a8a', '#5a5a5a'], ['#a83a2a', '#7a2a1c']];
        const r = (() => { let s = 4242; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
        const pioche = l => l[Math.floor(r() * l.length)];
        const gens = [];
        for (let i = 0; i < 14; i++) {
            const v = { peau: pioche(peaux), habit: pioche(habits), cheveux: pioche(cheveux), coupe: Math.floor(r() * 5), barbe: r() < 0.3, motif: r() < 0.2 };
            gens.push({ bas: spectateur(v, false, false), haut: spectateur(v, true, false) });
        }
        const dos = [];
        for (let i = 0; i < 5; i++) { const v = { peau: peaux[0], habit: habits[0], cheveux: cheveux[0], coupe: i % 5 }; dos.push(spectateur(v, false, true)); }
        return { gens, dos };
    }
    const foule = creer_foule();

    return {
        get brutus() { return sprites_brutus(); },
        brutus_pour,   // pour une tenue donnée (sert aussi à vérifier chaque tenue)
        gorille: gg,
        foule
    };
})();
