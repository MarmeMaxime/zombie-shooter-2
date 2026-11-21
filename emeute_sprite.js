/* =========================================================================
   SPRITE DE « L'ANTI-ÉMEUTE » (pixel art généré au chargement, voir pixel_art.js)
   Un policier anti-émeute zombifié : casque à visière, gilet, bouclier en
   polycarbonate. Grille 64×64 affichée en 64 (comme les zombies).
   - garde : 12 images (bouclier levé devant lui, il avance prudemment)
   - sans : 12 images (bouclier brisé au 2e tir : bras tendus, il accélère)
   ========================================================================= */
const SPRITES_EMEUTE = (() => {
    const N = 64, IMAGES = 12;
    const { poser, ellipse, rect, trait, membre } = PixelArt;
    const COULEURS = {
        S: '#b9b08f', s: '#8a7f64',     // peau de zombie
        U: '#2f3b58', u: '#1c2538',     // uniforme
        G: '#34363a', g: '#1e2023',     // gilet pare-balles
        D: '#3c455c', d: '#262c3c',     // casque
        E: '#bccbd6', e: '#8396a6',     // bouclier
        Z: '#9ad4f0',                   // visière
        W: '#ece6da',                   // bandes réfléchissantes
        N: '#141414',                   // rangers
        Y: '#fef3c0',                   // œil
        R: '#3b1725', r: '#6a2a2a',     // bouche, sang
        K: '#050403'
    };
    // Plus le rang est haut, plus la partie est devant
    const PARTIES = {
        b: { rang: 0, base: 'U', ombre: 'u', bande: 'fine' },     // bras arrière
        q: { rang: 0, base: 'U', ombre: 'u', bande: 'fine' },     // jambe arrière
        T: { rang: 1, base: 'G', ombre: 'g', bande: 'fine' },     // gilet
        J: { rang: 2, base: 'U', ombre: 'u', bande: 'fine' },     // jambe avant
        H: { rang: 3, base: 'S', ombre: 's', bande: 'large' },    // tête
        C: { rang: 3.5, base: 'D', ombre: 'd', bande: 'fine' },   // casque
        A: { rang: 4, base: 'U', ombre: 'u', bande: 'fine' },     // bras avant
        M: { rang: 4, base: 'S', ombre: 's', bande: 'fine' },     // mains
        P: { rang: 5, base: 'E', ombre: 'e', bande: 'fine' }      // bouclier
    };

    // Jambe : hanche -> genou -> pied, avec la ranger au bout
    function jambe(g, hx, hy, angle, plie, partie) {
        const gx = hx - Math.sin(angle) * 11, gy = hy + Math.cos(angle) * 11;
        const tibia = angle - plie;
        const px = gx - Math.sin(tibia) * 11, py = gy + Math.cos(tibia) * 11;
        membre(g, hx, hy, gx, gy, 6, partie);
        membre(g, gx, gy, px, py, 5, partie);
        rect(g, px - 4, py - 2, px + 2, py + 2, 'N');           // ranger montante
    }

    function tete(g, x, y) {
        ellipse(g, x, y, 6.5, 7, 'H', 0.05);
        rect(g, x - 6, y - 8, x + 8, y - 2, 'C');                 // casque, carré
        rect(g, x - 4, y - 9, x + 6, y - 9, 'C');
        rect(g, x + 3, y - 2, x + 8, y + 3, 'C');                 // couvre-nuque
        trait(g, x - 8, y - 4, x - 3, y - 4, 'Z');               // visière relevée
        trait(g, x - 7, y - 3, x - 4, y - 3, 'Z');
        rect(g, x - 4, y + 1, x - 3, y + 1, 'Y');                // œil
        rect(g, x - 6, y + 4, x - 3, y + 5, 'R');                // bouche ouverte
        poser(g, x - 2, y + 6, 'r');                              // filet de sang
        trait(g, x + 1, y + 1, x - 1, y + 6, 'K');               // jugulaire
    }

    // Gilet pare-balles : un bloc carré, épaulière et ceinturon
    function gilet(g, x, y) {
        rect(g, x - 7, y - 9, x + 7, y + 9, 'T');
        poser(g, x - 7, y - 9, null); poser(g, x + 7, y - 9, null);
        rect(g, x - 9, y - 10, x - 3, y - 6, 'T');                // épaulière
        rect(g, x - 7, y + 8, x + 7, y + 10, 'N');                // ceinturon
        poser(g, x - 2, y + 9, 'W');                              // boucle
        trait(g, x - 6, y + 3, x + 6, y + 3, 'W');               // bande réfléchissante
        rect(g, x - 5, y - 3, x - 2, y - 1, 'g');                 // poches
        rect(g, x + 1, y - 3, x + 4, y - 1, 'g');
        poser(g, x + 3, y + 6, 'r'); poser(g, x + 4, y + 7, 'r');  // sang
    }

    // Bras : épaule -> coude -> main
    function bras(g, ex, ey, cx, cy, mx, my, partie) {
        membre(g, ex, ey, cx, cy, 5, partie);
        membre(g, cx, cy, mx, my, 4, partie);
        membre(g, mx, my, mx - 3, my + 1, 3, 'M');
    }

    // Bouclier levé (vu de profil : une plaque haute devant lui)
    function bouclier_leve(g, x, y) {
        rect(g, x, y, x + 6, y + 40, 'P');
        poser(g, x, y, null); poser(g, x + 6, y, null);         // coins arrondis
        poser(g, x, y + 40, null); poser(g, x + 6, y + 40, null);
        rect(g, x + 1, y + 3, x + 5, y + 10, 'Z');               // hublot
        trait(g, x + 1, y + 16, x + 5, y + 16, 'W');             // bande
        trait(g, x + 1, y + 18, x + 5, y + 18, 'W');
    }

    function dessiner(mode, i) {
        const g = PixelArt.grille(N);
        const a = (i / IMAGES) * Math.PI * 2;
        const s = Math.cos(2 * a) < 0 ? 1 : 0;                   // le corps monte et descend
        const sans = mode === 'sans';
        const amplitude = sans ? 0.6 : 0.35;                      // pas courts derrière le bouclier
        const hx = 33, hy = 38 + s;

        jambe(g, hx + 1, hy, amplitude * Math.sin(a + Math.PI), 0.5 * Math.max(0, Math.cos(a + Math.PI)), 'q');
        jambe(g, hx - 1, hy, amplitude * Math.sin(a), 0.5 * Math.max(0, Math.cos(a)), 'J');

        const ex = hx - 1, ey = 22 + s;
        // Bras arrière : tendu comme un zombie quand il n'a plus de bouclier, sinon le long du corps
        if (sans) bras(g, ex + 3, ey - 1, ex - 6, ey + 1, ex - 14, ey + 1 + s, 'b');
        else bras(g, ex + 3, ey, ex + 4 + Math.sin(a) * 2, ey + 8, ex + 2 + Math.sin(a) * 3, ey + 14, 'b');

        gilet(g, hx, 28 + s);
        tete(g, hx - 4, 13 + s);

        if (mode === 'garde') {
            bras(g, ex, ey + 1, ex - 6, ey + 7, ex - 12, ey + 5, 'A');
            bouclier_leve(g, 12, 9 + s);
        } else {
            bras(g, ex, ey + 1, ex - 8, ey + 3, ex - 16, ey + 3 - s, 'A');   // bras tendus
        }
        return PixelArt.finir(g, PARTIES);
    }

    const image = (mode, i) => PixelArt.en_image(dessiner(mode, i), COULEURS);
    const serie = mode => Array.from({ length: IMAGES }, (_, i) => image(mode, i));
    return { garde: serie('garde'), sans: serie('sans') };
})();
