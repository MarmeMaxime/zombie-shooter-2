/* =========================================================================
   MIRA ASSISE (chapitre 3 : l'intro à la caserne)
   Assise sur une caisse, de profil vers la droite, Ginette sur les genoux,
   qu'elle astique au chiffon. Fabriquée à partir de son sprite debout
   (arret.png) : la tête, le buste et les cheveux sont recopiés tels quels,
   le short devient les hanches, les jambes sont repliées (cuisses à
   l'horizontale, tibias et bottes recopiés sous les genoux), et le ventre
   caché par le lance-grenades est redessiné avec les couleurs de sa peau.
   Comme les tenues sont des recolorations du même sprite (pixel pour pixel),
   la même recette marche pour chacune : on l'exporte pour le perso et pour
   chaque tenue (outils/sprites/liste.js).
   - MIRA_ASSISE.depuis(arret) -> { corps, bras: [a, b] }
     corps : 64×64, sans l'avant-bras qui astique ;
     bras : l'avant-bras et le chiffon, à poser par-dessus la bombe (deux
     positions, en alternance). La bombe se pose en (BOMBE.x, BOMBE.y).
   ========================================================================= */
const MIRA_ASSISE = (() => {
    const BOMBE = { x: 31, y: 33, echelle: 0.7 };   // où poser Ginette, dans le sprite (sur les cuisses), et sa taille

    function depuis(arret) {
        const L = 64;
        const src = document.createElement('canvas'); src.width = src.height = L;
        const sg = src.getContext('2d'); sg.drawImage(arret, 0, 0);
        const S = sg.getImageData(0, 0, L, L).data;
        const lire = (x, y) => { const i = (y * L + x) * 4; return [S[i], S[i + 1], S[i + 2], S[i + 3]]; };
        const couleur = (x, y) => { const [r, g, b] = lire(x, y); return `rgb(${r},${g},${b})`; };
        // Les couleurs de cette tenue, lues aux mêmes endroits du sprite
        const PEAU = couleur(13, 8), PEAU_OMBRE = couleur(13, 10), CONTOUR = couleur(12, 10);

        // Une toile de travail, pixel par pixel
        const toile = () => { const c = document.createElement('canvas'); c.width = c.height = L; return c; };
        const copier = (g, x0, y0, l, h, dx, dy) => {
            for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
                const p = lire(x0 + x, y0 + y);
                if (!p[3]) continue;
                g.fillStyle = `rgba(${p[0]},${p[1]},${p[2]},${p[3] / 255})`;
                g.fillRect(x0 + x + dx, y0 + y + dy, 1, 1);
            }
        };
        const px = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
        const bloc = (g, x0, y0, x1, y1, c) => { g.fillStyle = c; g.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1); };
        // Contour d'un pixel autour de tout ce qui est dessiné (comme les sprites du jeu)
        function contour(c) {
            const g = c.getContext('2d'), d = g.getImageData(0, 0, L, L).data;
            const plein = (x, y) => x >= 0 && y >= 0 && x < L && y < L && d[(y * L + x) * 4 + 3] > 0;
            const bords = [];
            for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (!plein(x, y) && (plein(x - 1, y) || plein(x + 1, y) || plein(x, y - 1) || plein(x, y + 1))) bords.push([x, y]);
            for (const [x, y] of bords) px(g, x, y, CONTOUR);
        }

        /* ---------- Le corps ---------- */
        const corps = toile(), g = corps.getContext('2d');
        const DY = 7;   // assise, elle est plus basse : tout descend
        // La jambe de derrière (la gauche du sprite), repliée sous la caisse, un peu en retrait
        copier(g, 3, 47, 10, 17, 18, -6);
        // Les cuisses à l'horizontale : peau, genou arrondi
        bloc(g, 22, 36, 33, 41, PEAU); bloc(g, 22, 40, 33, 41, PEAU_OMBRE); bloc(g, 34, 37, 35, 41, PEAU); px(g, 35, 41, PEAU_OMBRE);
        // La jambe de devant : le tibia et la botte, sous le genou
        copier(g, 18, 47, 11, 17, 11, -5);
        // Le short : les hanches et le haut des cuisses
        copier(g, 5, 34, 20, 8, 0, 1);
        // Le ventre (caché par l'arme sur le sprite debout), redessiné avec sa peau
        bloc(g, 9, 29, 20, 35, PEAU); bloc(g, 18, 29, 20, 35, PEAU_OMBRE); px(g, 14, 32, PEAU_OMBRE);
        // La tête, le buste, le bras de derrière et les cheveux : recopiés tels quels
        copier(g, 0, 0, 30, 23, 0, DY);
        copier(g, 0, 23, 8, 8, 0, DY);
        // Le haut du bras de devant descend le long du buste jusqu'au coude
        bloc(g, 20, 30, 23, 33, PEAU); bloc(g, 22, 30, 23, 33, PEAU_OMBRE);
        contour(corps);

        /* ---------- L'avant-bras qui astique, et le chiffon ---------- */
        const bras = [[0, 0], [3, 2]].map(([mx, my]) => {
            const c = toile(), b = c.getContext('2d');
            const main = { x: BOMBE.x - 2 + mx, y: BOMBE.y - 4 + my };
            // Du coude (22, 33) à la main, trois pixels d'épaisseur
            const n = 12;
            for (let k = 0; k <= n; k++) {
                const x = Math.round(22 + (main.x - 22) * k / n), y = Math.round(33 + (main.y - 33) * k / n);
                bloc(b, x - 1, y - 1, x + 1, y + 1, PEAU);
                px(b, x, y + 1, PEAU_OMBRE);
            }
            // Le chiffon blanc froissé dans la main
            bloc(b, main.x - 2, main.y - 2, main.x + 3, main.y + 2, '#ece8de');
            px(b, main.x - 2, main.y + 2, '#b8b4aa'); px(b, main.x + 3, main.y - 2, '#b8b4aa'); px(b, main.x, main.y, '#c8c4ba');
            contour(c);
            return c;
        });
        return { corps, bras };
    }

    return { depuis, BOMBE };
})();
