/* =========================================================================
   SPRITES DU COMBAT DE BOXE (chapitre 2, « Le Ring »), pixel art généré au
   chargement (voir pixel_art.js). Dessinés en 2× à l'écran par boxe.js.
   - SPRITES_BOXE.brutus (grille 64, tourné vers la droite) : construit à
     partir de son vrai sprite (ou de sa tenue), sans le fusil qu'on lui a volé,
     avec des bras de boxeur.
       garde ×4, jab ×2 (bras du fond), direct ×2 (bras proche), uppercut ×3,
       esquive ×2 (il recule en se baissant), touche, victoire (il gonfle les
       biceps), ko (couché)
   - SPRITES_BOXE.gorille (grille 96, tourné vers la gauche) : Gégé, ancien
     déménageur qui a muté en gorille. Fourrure sombre, torse gris, short en
     jean déchiré, grosse chaîne en or : le roi de la bâtisse.
       garde ×4, armer ×2 (il arme son coup), frappe ×2, ouvert ×2 (il a
       frappé dans le vide et part en avant), touche, rugir ×2 (il se tape
       la poitrine), et la version « bouche ouverte » de garde pour parler.
   ========================================================================= */
// Toile des sprites de boxe de Brutus : 80×80, son sprite posé avec 8 pixels de marge, pieds sur la ligne 71
const BOXE_TOILE = 80, BOXE_MARGE = 8, BOXE_PIEDS = 71;
const SPRITES_BOXE = (() => {
    const { poser, ellipse, rect, trait, membre } = PixelArt;

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

    // Les sprites de boxe de Brutus, dans sa tenue du moment (construits au premier besoin)
    function sprites_brutus() {
        const img = typeof Loot !== 'undefined' ? Loot.sprites('brute').arret : SPRITES_PERSO.brute.arret;
        if (!cacheBrutus.has(img)) cacheBrutus.set(img, brutus_depuis(img));
        return cacheBrutus.get(img);
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

    return {
        get brutus() { return sprites_brutus(); },
        // Pour une image donnée (une tenue) : sert aussi à vérifier chaque tenue
        brutus_pour: img => { if (!cacheBrutus.has(img)) cacheBrutus.set(img, brutus_depuis(img)); return cacheBrutus.get(img); },
        gorille: gg
    };
})();
