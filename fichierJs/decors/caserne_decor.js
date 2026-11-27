/* =========================================================================
   LA CASERNE DU GÉNIE (chapitre 3 : l'intro de Mira), vue comme le camp dans
   les scènes : un sol vu de dessus, des personnages de face. Un hangar :
   mur du fond en tôle avec des étagères de caisses d'explosifs, le fanion du
   génie (noir et rouge), un tableau de mines ; au sol, du béton taché, des
   caisses empilées, des bidons. Le bureau du Commandant (avec la radio) est
   dessiné à part, devant lui (dessiner_bureau) ; la bombe de Mira aussi
   (dessiner_bombe), parce qu'elle bouge.
   CASERNE : les places de chacun dans la scène.
   ========================================================================= */
const CASERNE = {
    commandant: { x: 64, y: 150 },        // debout derrière son bureau (64×64)
    bureau: { x: 40, y: 196 },            // le bureau, devant lui (112×40)
    mira: { droite: 150, y: 214 }         // assise sur une caisse, à « droite » pixels du bord droit
};

const decor_caserne = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    // Une caisse d'explosifs vue de face : bois, bande rouge, « TNT » au pochoir
    function caisse(g, rect, x, y, l, h) {
        rect(x, y, l, h, '#8a6a3e'); rect(x, y, l, 2, '#a8865a'); rect(x, y + h - 2, l, 2, '#5e4628');
        rect(x + 1, y + Math.round(h / 2) - 3, l - 2, 6, '#b83a2a');
        g.fillStyle = '#f0e0c0'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
        if (l >= 18) g.fillText('TNT', x + l / 2, y + Math.round(h / 2) + 2);
        for (const cx of [x + 2, x + l - 4]) rect(cx, y + 3, 2, h - 6, '#6e5230');
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(2718);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];
        const ombre = (fn, a = 0.3) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
        const MUR = 150;   // bas du mur du fond

        // Mur du fond en tôle ondulée, poutre et néons au plafond
        rect(0, 0, W, MUR, '#5e6a6e');
        for (let x = 0; x < W; x += 6) { rect(x, 0, 2, MUR, '#6e7a7e'); rect(x + 4, 0, 1, MUR, '#4e585c'); }
        rect(0, 40, W, 8, '#3a3e40'); rect(0, 40, W, 1, '#5a5e60');
        for (let x = 40; x < W; x += 150) { rect(x, 50, 60, 4, '#e8f0e0'); ombre(() => rect(x - 10, 54, 80, 14, '#e8f0e0'), 0.12); }
        // Étagères de caisses d'explosifs le long du mur
        for (const y of [76, 112]) {
            rect(0, y + 22, W, 3, '#3a2a1a');
            for (let x = 6 + r() * 10; x < W - 30; x += 28 + r() * 12) caisse(g, rect, x, y, 24, 22);
        }
        // Le fanion du génie (noir et rouge, cuirasse et pot en tête), et un tableau des mines
        const F = Math.round(W * 0.5) - 20;
        rect(F, 58, 2, 40, '#3a3028');
        rect(F + 2, 60, 34, 12, '#1a1a1a'); rect(F + 2, 72, 34, 12, '#b02020');
        rect(F + 14, 64, 10, 14, '#d8c060'); rect(F + 16, 62, 6, 3, '#d8c060');
        const T = W - 120;
        rect(T, 60, 70, 46, '#d8d0b8'); rect(T, 60, 70, 2, '#f0e8d0'); rect(T, 104, 70, 2, '#a89e88');
        for (let k = 0; k < 6; k++) { const x = T + 8 + (k % 3) * 22, y = 68 + Math.floor(k / 3) * 18; rect(x, y, 10, 10, choix(['#4a4a40', '#5a5a48'])); rect(x + 3, y - 2, 4, 2, '#8a8a7a'); rect(x + 12, y + 3, 6, 1, '#7a7060'); }

        // Le sol : béton taché d'huile, joints, traces de chariot
        rect(0, MUR, W, H - MUR, '#8a8882');
        for (let i = 0; i < W * 4; i++) rect(r() * W, MUR + r() * (H - MUR), 1, 1, choix(['#7e7c76', '#96948e', '#82807a']));
        for (let x = 0; x < W; x += 60) rect(x, MUR, 1, H - MUR, '#74726c');
        for (let y = MUR + 60; y < H; y += 60) rect(0, y, W, 1, '#74726c');
        for (let i = 0; i < W * 0.02; i++) ombre(() => { g.beginPath(); g.ellipse(r() * W, MUR + 30 + r() * (H - MUR - 40), 10 + r() * 18, 5 + r() * 8, 0, 0, Math.PI * 2); g.fillStyle = '#3a3630'; g.fill(); }, 0.35);
        rect(0, MUR, W, 3, '#5a5852');
        // Ligne jaune de sécurité au sol, et « ZONE EXPLOSIFS » devant les étagères
        for (let x = 0; x < W; x += 12) rect(x, MUR + 12, 8, 3, '#d8b030');

        // Caisses empilées et bidons dans les coins
        for (const [x, y] of [[8, 300], [34, 300], [20, 278], [W - 60, 330], [W - 34, 330], [W - 48, 308]]) { ombre(() => rect(x + 3, y + 3, 24, 22, '#2a2824')); caisse(g, rect, x, y, 24, 22); }
        for (const x of [W * 0.42, W * 0.42 + 16]) { ombre(() => rect(x + 3, 330, 13, 20, '#2a2824')); rect(x, 326, 13, 22, '#a03a2a'); rect(x, 326, 13, 2, '#c85a4a'); rect(x + 2, 334, 9, 2, '#7a2a1e'); }

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

// Le bureau du Commandant (devant lui) : plateau en bois, dossiers, tasse, et la radio de campagne
function dessiner_bureau(c, radioAllumee) {
    const { x, y } = CASERNE.bureau;
    const rect = (a, b, l, h, couleur) => { c.fillStyle = couleur; c.fillRect(a, b, l, h); };
    c.globalAlpha = 0.3; rect(x + 4, y + 36, 112, 6, '#1a1814'); c.globalAlpha = 1;
    rect(x, y, 112, 10, '#7a5432'); rect(x, y, 112, 2, '#9a7452');        // plateau
    rect(x + 2, y + 10, 108, 28, '#5e3e22'); rect(x + 6, y + 14, 46, 20, '#6e4a2a'); rect(x + 60, y + 14, 46, 20, '#6e4a2a');
    rect(x + 27, y + 22, 6, 2, '#c8a050'); rect(x + 81, y + 22, 6, 2, '#c8a050');     // poignées
    // Dossiers « CONFIDENTIEL », une tasse
    rect(x + 8, y - 5, 22, 6, '#d8c890'); rect(x + 10, y - 8, 20, 4, '#c8b880'); rect(x + 14, y - 4, 8, 1, '#b02020');
    rect(x + 36, y - 7, 7, 7, '#e8e4dc'); rect(x + 43, y - 5, 2, 3, '#e8e4dc'); rect(x + 37, y - 7, 5, 1, '#4a2a1a');
    // La radio de campagne : caisse verte, cadrans, combiné, antenne ; le voyant s'allume quand on parle
    rect(x + 68, y - 22, 38, 22, '#4a5a3a'); rect(x + 68, y - 22, 38, 2, '#6a7a52');
    rect(x + 72, y - 17, 10, 10, '#1e2418'); rect(x + 76, y - 14, 2, 4, '#e8e0a0');
    rect(x + 86, y - 17, 6, 6, '#2a2a2a'); rect(x + 95, y - 17, 6, 6, '#2a2a2a');
    rect(x + 87, y - 8, 14, 3, '#1a1a1a');
    rect(x + 100, y - 46, 1, 24, '#2a2a2a');
    rect(x + 88, y - 4, 3, 3, radioAllumee ? '#ff4a3a' : '#5a1a14');
}

// La bombe de Mira, Ginette : ronde, noire et lustrée, mèche, et un ruban rose (c'est sa préférée)
function dessiner_bombe(c, x, y, t, astique) {
    const rect = (a, b, l, h, couleur) => { c.fillStyle = couleur; c.fillRect(Math.round(a), Math.round(b), l, h); };
    c.fillStyle = '#1a1a1e'; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a3a44'; c.beginPath(); c.arc(x - 3, y - 3, 4, 0, Math.PI * 2); c.fill();
    rect(x - 4, y - 5, 2, 2, '#c8c8d8');                                       // reflet (elle brille)
    rect(x - 2, y - 12, 4, 3, '#5a5a60');                                      // goulot
    for (let k = 0; k < 5; k++) rect(x + 1 + k, y - 13 - Math.round(Math.sin(k) * 1.5), 1, 1, '#c8a060');   // mèche
    rect(x + 5, y - 3, 5, 3, '#f07ab0'); rect(x + 9, y - 5, 3, 2, '#f07ab0'); rect(x + 9, y - 1, 3, 2, '#f07ab0');   // ruban
    // Le chiffon qui astique, et une étincelle de propreté de temps en temps
    if (astique) rect(x - 8 + Math.round(Math.sin(t * 9) * 4), y - 2 + Math.round(Math.cos(t * 9) * 2), 5, 4, '#e8e4dc');
    if (Math.sin(t * 2.3) > 0.92) { rect(x - 6, y - 9, 1, 3, '#ffffff'); rect(x - 7, y - 8, 3, 1, '#ffffff'); }
}
