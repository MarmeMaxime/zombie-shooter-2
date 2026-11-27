/* =========================================================================
   LA CASERNE DU GÉNIE (chapitre 3 : l'intro de Mira), vue comme le camp dans
   les scènes : un sol vu de dessus, des personnages de face. Un hangar :
   mur du fond en tôle (poutrelles, néons, grande porte entrouverte sur le
   jour), étagères chargées de tout ce qui explose (caisses de TNT, caisses de
   munitions, mines, bobines de cordeau), le fanion du génie (une flamme
   noire et rouge, casque et cuirasse dorés) et un tableau des mines ; au sol, du béton taché, des piles de caisses, des fûts.
   Le bureau du Commandant (avec la radio) est dessiné à part, devant lui
   (dessiner_bureau) ; la bombe de Mira aussi (dessiner_bombe), parce
   qu'elle bouge.
   CASERNE : les places de chacun dans la scène.
   ========================================================================= */
const CASERNE = {
    commandant: { x: 64, y: 150 },        // debout derrière son bureau (64×64)
    bureau: { x: 40, y: 196 },            // le bureau, devant lui (112×40)
    mira: { droite: 170, y: 262 }         // assise sur une caisse, à « droite » pixels du bord droit (sous la boîte de dialogue)
};

const decor_caserne = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(2718);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const alpha = (a, fn) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const rond = (x, y, rx, ry, couleur) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = couleur; g.fill(); };
        const texte = (t, x, y, couleur, taille = 6) => { g.fillStyle = couleur; g.font = `bold ${taille}px monospace`; g.textAlign = 'center'; g.fillText(t, x, y); };
        const MUR = 150;   // bas du mur du fond

        /* ---------- Ce qu'on range sur les étagères ---------- */
        // Caisse de TNT : bois clair, planches, bande rouge et pochoir
        const tnt = (x, y, l, h) => {
            rect(x, y, l, h, '#9a7646'); for (let k = 3; k < h - 2; k += 5) rect(x + 1, y + k, l - 2, 1, '#866438');
            rect(x, y, l, 1, '#b89262'); rect(x, y + h - 1, l, 1, '#5e4628'); rect(x + l - 1, y, 1, h, '#6e5230');
            rect(x + 1, y + Math.round(h / 2) - 3, l - 2, 6, '#b8342a'); rect(x + 1, y + Math.round(h / 2) - 3, l - 2, 1, '#d8544a');
            if (l >= 18) texte('TNT', x + l / 2, y + Math.round(h / 2) + 2, '#f4e4c4');
        };
        // Caisse de munitions : métal vert olive, poignée, inscriptions jaunes
        const munitions = (x, y, l, h) => {
            rect(x, y, l, h, '#56603a'); rect(x, y, l, 2, '#727c4e'); rect(x, y + h - 1, l, 1, '#363c22'); rect(x + l - 1, y, 1, h, '#3e4628');
            rect(x + Math.round(l / 2) - 3, y - 1, 6, 2, '#2a2e1a');
            for (let k = 0; k < 3; k++) rect(x + 3, y + 5 + k * 3, l - 8 - k * 4, 1, '#d8c040');
        };
        // Mine antichar : galette grise, vue un peu de dessus
        const mine = (x, y) => { rond(x + 7, y + 6, 7, 4, '#5a5e58'); rond(x + 7, y + 5, 6, 3, '#7a7e76'); rect(x + 5, y + 3, 4, 2, '#3a3e38'); rect(x + 6, y + 3, 2, 1, '#b8342a'); };
        // Bobine de cordeau détonant (rouge)
        const bobine = (x, y) => { rond(x + 6, y + 6, 6, 6, '#7a5a3a'); rond(x + 6, y + 6, 5, 5, '#c8402a'); for (let k = 0; k < 3; k++) rect(x + 2, y + 3 + k * 3, 8, 1, '#a02a1a'); rond(x + 6, y + 6, 1.5, 1.5, '#3a2a1a'); };

        /* ---------- Le mur du fond ---------- */
        rect(0, 0, W, MUR, '#5a666c');
        for (let x = 0; x < W; x += 6) { rect(x, 0, 2, MUR, '#6a767c'); rect(x + 4, 0, 1, MUR, '#4a5459'); }
        // Rouille qui coule des rivets, poutrelle au plafond, néons et leur halo
        for (let i = 0; i < W * 0.05; i++) { const x = r() * W; alpha(0.5, () => rect(x, 46, 1, 6 + r() * 18, '#8a5a3a')); }
        rect(0, 36, W, 10, '#33383b'); rect(0, 36, W, 1, '#565c60'); rect(0, 45, W, 1, '#22262a');
        for (let x = 4; x < W; x += 24) rect(x, 39, 2, 2, '#565c60');
        for (let x = 44; x < W - 60; x += 170) { alpha(0.12, () => rond(x + 28, 70, 60, 26, '#f4f8e8')); rect(x, 46, 56, 4, '#e8f0e0'); rect(x, 50, 56, 1, '#9aa09a'); }
        // Deux rangées d'étagères : montants, planches, et un rangement un peu au hasard
        const ETAGERES = [[72, 22], [110, 24]], finEtageres = W - 150;
        for (const [y, h] of ETAGERES) {
            rect(6, y + h, finEtageres, 3, '#3e2e1e'); rect(6, y + h, finEtageres, 1, '#5e4a32');
            for (let x = 6; x <= finEtageres; x += 120) rect(x, 56, 3, y + h - 50, '#3e2e1e');
            for (let x = 12 + r() * 8; x < finEtageres - 20;) {
                const t = r();
                if (t < 0.42) { const l = 22 + Math.round(r() * 6); tnt(x, y + (24 - h), l, h); x += l + 2 + r() * 6; }
                else if (t < 0.65) { munitions(x, y + h - 14, 20, 14); if (r() < 0.5) munitions(x + 2, y + h - 26, 16, 12); x += 24 + r() * 6; }
                else if (t < 0.8) { mine(x, y + h - 10); mine(x + 2, y + h - 14); x += 18; }
                else if (t < 0.92) { bobine(x, y + h - 12); x += 15; }
                else x += 14 + r() * 10;   // un trou : quelqu'un s'est servi
            }
        }
        // Le fanion du génie : une flamme triangulaire noire et rouge, casque et cuirasse dorés, franges
        const F = Math.round(W * 0.42);
        rect(F, 52, 2, 52, '#4a3a2a'); rect(F - 1, 50, 4, 3, '#c8a040');
        for (let y = 0; y < 34; y++) {
            const l = Math.round(44 * (1 - y / 34));
            rect(F + 2, 54 + y, l, 1, y < 17 ? '#1a1a1e' : '#a81e1e');
            if (l > 0) rect(F + 2 + l, 54 + y, 1, 1, '#c8a040');      // la frange dorée
        }
        rect(F + 2, 54, 44, 1, '#c8a040');
        // Le pot-en-tête (casque rond à crête) au-dessus de la cuirasse
        rect(F + 9, 60, 8, 4, '#d8b848'); rect(F + 8, 63, 10, 2, '#d8b848'); rect(F + 12, 58, 2, 2, '#d8b848'); rect(F + 10, 61, 2, 1, '#a88828');
        rect(F + 9, 66, 8, 6, '#d8b848'); rect(F + 8, 66, 1, 3, '#d8b848'); rect(F + 17, 66, 1, 3, '#d8b848'); rect(F + 12, 67, 2, 4, '#a88828');
        // Le tableau des mines (punaisé, avec des fiches)
        const T = finEtageres + 18;
        rect(T, 58, 74, 50, '#d8d0b6'); rect(T, 58, 74, 2, '#f0e8d0'); rect(T + 72, 58, 2, 50, '#a89e88'); rect(T, 106, 74, 2, '#a89e88');
        texte('MINES', T + 37, 66, '#3a3a30', 6);
        for (let k = 0; k < 6; k++) {
            const x = T + 8 + (k % 3) * 22, y = 72 + Math.floor(k / 3) * 17;
            rond(x + 5, y + 5, 5, 4, choix(['#4a4e44', '#5a5a48'])); rect(x + 3, y + 1, 4, 2, '#8a8a7a');
            rect(x + 12, y + 3, 6, 1, '#7a7060'); rect(x + 12, y + 6, 4, 1, '#7a7060'); rect(x + 4, y - 2, 2, 2, '#c83030');   // la punaise
        }
        // La grande porte du hangar, entrouverte : une bande de jour qui entre et s'étale au sol
        const P = W - 40;
        rect(P - 8, 52, 48, MUR - 52, '#4a5459'); rect(P - 8, 52, 48, 3, '#3a4247');
        rect(P + 6, 55, 10, MUR - 55, '#f4e8c8'); rect(P + 6, 55, 2, MUR - 55, '#fff8e0');
        for (let y = 60; y < MUR; y += 12) rect(P - 6, y, 12, 1, '#3e484c');
        rect(P + 16, 55, 22, MUR - 55, '#55606a'); for (let y = 58; y < MUR; y += 8) rect(P + 16, y, 22, 1, '#47525a');
        rect(P + 18, 96, 6, 3, '#d8b030');

        /* ---------- Le sol ---------- */
        rect(0, MUR, W, H - MUR, '#8c8a84');
        for (let i = 0; i < W * 4; i++) rect(r() * W, MUR + r() * (H - MUR), 1, 1, choix(['#807e78', '#98968f', '#84827c']));
        for (let x = 0; x < W; x += 60) rect(x, MUR, 1, H - MUR, '#76746e');
        for (let y = MUR + 60; y < H; y += 60) rect(0, y, W, 1, '#76746e');
        // Plinthe au pied du mur, et la ligne de sécurité qui longe les étagères (au ras du mur)
        rect(0, MUR, W, 4, '#4a4844'); rect(0, MUR + 4, W, 1, '#5e5c56');
        for (let x = 0; x < finEtageres; x += 10) { rect(x, MUR + 6, 6, 2, '#d8b030'); rect(x + 6, MUR + 6, 4, 2, '#2a2a2a'); }
        // Le jour qui entre par la porte
        alpha(0.18, () => { g.beginPath(); g.moveTo(P + 6, MUR); g.lineTo(P + 16, MUR); g.lineTo(P - 10, H); g.lineTo(P - 60, H); g.closePath(); g.fillStyle = '#fff4d0'; g.fill(); });
        // Taches d'huile
        for (let i = 0; i < W * 0.018; i++) alpha(0.3, () => rond(r() * W, MUR + 30 + r() * (H - MUR - 40), 8 + r() * 16, 4 + r() * 7, '#34302a'));

        // Des piles de caisses et des fûts dans les coins (avec leur ombre)
        const pile = (x, y, liste) => { for (const [dx, dy, l, h, f] of liste) { alpha(0.3, () => rect(x + dx + 3, y + dy + 3, l, h, '#1e1c18')); f(x + dx, y + dy, l, h); } };
        pile(6, 290, [[0, 22, 26, 22, tnt], [28, 22, 26, 22, tnt], [12, 0, 26, 22, tnt]]);
        pile(W - 70, 320, [[0, 18, 22, 16, munitions], [24, 18, 22, 16, munitions], [6, 2, 24, 16, munitions]]);
        const fut = (x, y, couleur) => { alpha(0.3, () => rond(x + 9, y + 26, 9, 3, '#1e1c18')); rect(x, y, 14, 24, couleur); rect(x, y, 14, 2, '#d8d0c0'); rect(x, y + 8, 14, 1, '#00000040'); rect(x, y + 16, 14, 1, '#00000040'); rect(x + 2, y + 2, 2, 20, '#ffffff30'); };
        fut(Math.round(W * 0.4), 328, '#a03a2a'); fut(Math.round(W * 0.4) + 16, 330, '#3a5a8a');
        return c;
    }

    return (largeur, hauteur = 400) => {
        const W = Math.round(largeur), cle = W + 'x' + hauteur;
        if (!caches.has(cle)) {
            if (caches.size > 3) caches.clear();
            caches.set(cle, construire(W, hauteur));
        }
        return caches.get(cle);
    };
})();

// Le bureau du Commandant (devant lui) : plateau en bois verni, dossiers, tasse, lampe, et la radio de campagne
function dessiner_bureau(c, radioAllumee) {
    const { x, y } = CASERNE.bureau;
    const rect = (a, b, l, h, couleur) => { c.fillStyle = couleur; c.fillRect(Math.round(a), Math.round(b), l, h); };
    c.globalAlpha = 0.3; rect(x + 4, y + 36, 112, 6, '#1a1814'); c.globalAlpha = 1;
    // Plateau et caisson, veinures du bois, poignées de laiton
    rect(x, y, 112, 10, '#7e5634'); rect(x, y, 112, 2, '#a07854'); rect(x, y + 9, 112, 1, '#4e3420');
    for (let k = 0; k < 6; k++) rect(x + 6 + k * 18, y + 4 + (k % 2), 10, 1, '#6e4a2a');
    rect(x + 2, y + 10, 108, 28, '#5e3e22'); rect(x + 2, y + 10, 108, 1, '#3a2614');
    for (const dx of [6, 60]) { rect(x + dx, y + 14, 46, 20, '#6e4a2a'); rect(x + dx, y + 14, 46, 1, '#8a6040'); rect(x + dx + 45, y + 14, 1, 20, '#4a3018'); rect(x + dx + 20, y + 22, 6, 2, '#d8b060'); rect(x + dx + 20, y + 24, 6, 1, '#8a6a30'); }
    // Dossiers « CONFIDENTIEL » (tampon rouge), une tasse de café
    rect(x + 6, y - 4, 24, 5, '#d8c890'); rect(x + 8, y - 7, 22, 4, '#e4d6a0'); rect(x + 10, y - 9, 20, 3, '#cfc088');
    rect(x + 12, y - 6, 9, 2, '#b02020'); rect(x + 6, y, 24, 1, '#a8986a');
    rect(x + 34, y - 7, 7, 7, '#e8e4dc'); rect(x + 41, y - 5, 2, 3, '#e8e4dc'); rect(x + 35, y - 7, 5, 1, '#4a2a1a'); rect(x + 34, y - 1, 7, 1, '#a8a49c');
    // Lampe de bureau (bras articulé), son halo sur les papiers
    rect(x + 48, y - 2, 8, 2, '#3a4a3a'); rect(x + 51, y - 14, 2, 12, '#3a4a3a'); rect(x + 46, y - 18, 10, 5, '#4a5e4a'); rect(x + 47, y - 13, 8, 1, '#f0e8a8');
    // La radio de campagne : caisse olive, cadran de fréquence, boutons, grille du haut-parleur, combiné et antenne
    const R = x + 64;
    rect(R, y - 26, 42, 26, '#4e5a3a'); rect(R, y - 26, 42, 2, '#6a7650'); rect(R + 41, y - 26, 1, 26, '#343e26'); rect(R, y - 1, 42, 1, '#343e26');
    rect(R + 3, y - 22, 16, 7, '#1a2018'); rect(R + 4, y - 21, 14, 5, radioAllumee ? '#5aff7a' : '#2a4a2e');                 // le cadran
    for (let k = 0; k < 4; k++) rect(R + 5 + k * 3, y - 20 + (k % 2), 1, 3, radioAllumee ? '#1a4a22' : '#1a2a1c');
    for (let k = 0; k < 3; k++) { rect(R + 4 + k * 6, y - 11, 4, 4, '#2a2a2a'); rect(R + 5 + k * 6, y - 11, 1, 2, '#9a9a9a'); }   // trois boutons
    for (let k = 0; k < 5; k++) rect(R + 23, y - 22 + k * 3, 15, 1, '#2e3626');                                               // grille du haut-parleur
    rect(R + 22, y - 7, 4, 4, radioAllumee ? '#ff4a3a' : '#5a1a14');                                                           // voyant d'émission
    rect(R + 28, y - 8, 12, 5, '#1e1e1e'); rect(R + 29, y - 9, 3, 2, '#1e1e1e'); rect(R + 36, y - 9, 3, 2, '#1e1e1e');           // le combiné
    for (let k = 0; k < 5; k++) rect(R + 41 + k, y - 4 + (k % 2), 1, 1, '#1e1e1e');                                            // son fil
    rect(R + 38, y - 52, 1, 26, '#2a2a2a'); rect(R + 37, y - 53, 3, 2, '#5a5a5a');                                             // antenne
}

// La bombe de Mira, Ginette : ronde, noire et lustrée, mèche, et un ruban rose (c'est sa préférée)
function dessiner_bombe(c, x, y, t, astique) {
    const rect = (a, b, l, h, couleur) => { c.fillStyle = couleur; c.fillRect(Math.round(a), Math.round(b), l, h); };
    const disque = (a, b, rr, couleur) => { c.fillStyle = couleur; c.beginPath(); c.arc(a, b, rr, 0, Math.PI * 2); c.fill(); };
    disque(x, y, 9.5, '#050505');                                              // contour
    disque(x, y, 8.5, '#1e1e24');
    disque(x - 1.5, y - 1.5, 6, '#2e2e38');
    disque(x - 3, y - 3, 3, '#45455a');
    rect(x - 5, y - 5, 2, 2, '#d8d8e8'); rect(x - 3, y - 6, 1, 1, '#a8a8c0');  // reflet (elle brille)
    rect(x - 3, y - 12, 6, 4, '#050505'); rect(x - 2, y - 12, 4, 3, '#6a6a72'); rect(x - 2, y - 12, 4, 1, '#9a9aa2');   // goulot
    for (let k = 0; k < 6; k++) rect(x + k * 1.2, y - 13 - Math.round(Math.sin(k * 0.9) * 1.5), 1, 1, k % 2 ? '#a88040' : '#d8b060');   // mèche tressée
    // Le nœud rose : deux boucles et le nœud au milieu
    rect(x + 6, y - 4, 3, 3, '#e05a98'); rect(x + 9, y - 7, 4, 3, '#f07ab0'); rect(x + 9, y - 1, 4, 3, '#f07ab0'); rect(x + 10, y - 6, 2, 1, '#ffb0d8');
    // Le chiffon qui astique, et une étincelle de propreté de temps en temps
    if (astique) { const ax = x - 9 + Math.round(Math.sin(t * 9) * 4), ay = y - 2 + Math.round(Math.cos(t * 9) * 2); rect(ax, ay, 6, 4, '#e8e4dc'); rect(ax, ay + 3, 6, 1, '#b8b4ac'); }
    if (Math.sin(t * 2.3) > 0.9) { rect(x - 6, y - 10, 1, 4, '#ffffff'); rect(x - 8, y - 8, 5, 1, '#ffffff'); }
}
