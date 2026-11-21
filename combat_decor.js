/* =========================================================================
   DÉCOR DE LA ZONE DE COMBAT (désert et voies ferrées, en pixel art)
   Dessiné à l'échelle du monde (1 pixel du décor = 1 unité, comme les
   sprites), vu de dessus : sable aux tons chauds, deux voies ferrées
   (ballast, traverses, rails), une piste de sable plus clair en bas,
   rochers, buissons secs, fissures, rides de vent, cactus, crânes et os,
   virevoltants, fûts rouillés, poteaux télégraphiques, barbelés, traces
   de pneus et de pas, douilles, sacs de sable, taches de sang séché.
   Toujours le même (hasard à graine) ;
   recalculé seulement si la largeur demandée change. Sert aussi de fond à
   l'écran titre.
   ========================================================================= */
const decor_combat = (() => {
    const caches = new Map();

    function hasard(graine) {
        let s = graine >>> 0;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    }

    function construire(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const r = hasard(1985);
        const rect = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(l)), Math.max(1, Math.round(h))); };
        const choix = liste => liste[Math.floor(r() * liste.length)];

        // Sable : fond, grandes plaques plus rouges ou plus claires, grain
        rect(0, 0, W, H, '#c4956a');
        for (let i = 0; i < W * 0.05; i++) {
            const x = r() * W, y = r() * H, l = 20 + r() * 60, h = 6 + r() * 14;
            g.globalAlpha = 0.35;
            rect(x, y, l, h, choix(['#b07a52', '#d4a87c', '#a86c48']));
            g.globalAlpha = 1;
        }
        for (let i = 0; i < W * 3; i++) rect(r() * W, r() * H, 1 + r() * 2, 1, choix(['#b8885e', '#d2a57a', '#ad7c55', '#c99c70']));

        // Second tirage pour les détails : le placement d'origine ne bouge pas
        const r2 = hasard(4242);
        const ch = liste => liste[Math.floor(r2() * liste.length)];
        const px = (x, y, couleur) => rect(x, y, 1, 1, couleur);
        const ovale = (cx, cy, rx, ry, couleur) => {
            for (let dy = -ry; dy <= ry; dy++) {
                const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5)))));
                rect(cx - w, cy + dy, 2 * w + 1, 1, couleur);
            }
        };
        const ombre = fn => { g.globalAlpha = 0.3; fn(); g.globalAlpha = 1; };
        const SOMBRE = '#5a3420';

        // Rides de vent dans le sable (petites vagues claires soulignées de sombre)
        for (let i = 0; i < W * 0.14; i++) {
            const x0 = r2() * W, y0 = 6 + r2() * (H - 12), l = 8 + r2() * 16;
            for (let x = 0; x < l; x++) {
                const y = Math.round(y0 + Math.sin((x0 + x) / 3) * 1.2);
                px(x0 + x, y, '#d8b086');
                if (x % 2 === 0) px(x0 + x, y + 1, '#ad7c55');
            }
        }

        // Piste de sable clair en bas
        g.globalAlpha = 0.5;
        rect(0, 322, W, 26, '#dcb88c');
        g.globalAlpha = 1;
        for (let x = 0; x < W; x += 3) { rect(x, 321 + Math.round(Math.sin(x / 17) * 2), 2, 1, '#e4c49a'); rect(x, 348 + Math.round(Math.cos(x / 23) * 2), 2, 1, '#b8885e'); }

        // Fissures du sol (lignes brisées sombres)
        for (let i = 0; i < W * 0.02; i++) {
            let x = r() * W, y = 30 + r() * (H - 60);
            for (let k = 0; k < 6; k++) {
                const nx = x + 3 + r() * 5, ny = y + (r() - 0.5) * 6;
                g.strokeStyle = '#8a5c3c'; g.lineWidth = 1;
                g.beginPath(); g.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5); g.lineTo(Math.round(nx) + 0.5, Math.round(ny) + 0.5); g.stroke();
                x = nx; y = ny;
            }
        }

        // Deux voies ferrées : ballast, traverses, rails
        for (const yv of [118, 202]) {
            rect(0, yv - 2, W, 32, '#7c6a58');
            for (let i = 0; i < W * 1.2; i++) rect(r() * W, yv - 2 + r() * 32, 1 + r() * 2, 1 + r(), choix(['#5e5044', '#958272', '#6e5e50', '#a8957f']));
            // Ballast débordant sur le sable
            for (let i = 0; i < W * 0.5; i++) {
                const y = r2() < 0.5 ? yv - 2 - r2() * 4 : yv + 30 + r2() * 4;
                px(r2() * W, y, ch(['#6e5e50', '#958272', '#7c6a58']));
            }
            for (let x = 2; x < W; x += 9) {
                const casse = r2() < 0.06, decal = casse ? Math.round((r2() - 0.5) * 4) : 0;
                const bois = r2() < 0.25 ? ['#62422a', '#82583a', '#44291a'] : ['#5a3a24', '#7a5232', '#3e2614'];
                if (casse) {                                   // traverse fendue et décalée
                    rect(x + decal, yv + 1, 4, 12, bois[0]); rect(x + decal, yv + 1, 1, 12, bois[1]);
                    rect(x - decal, yv + 15, 4, 12, bois[0]); rect(x - decal + 3, yv + 15, 1, 12, bois[2]);
                } else {
                    rect(x, yv, 4, 28, bois[0]);
                    rect(x, yv, 1, 28, bois[1]);
                    rect(x + 3, yv, 1, 28, bois[2]);
                    if (r2() < 0.3) rect(x + 1, yv + 3 + r2() * 20, 1, 3 + r2() * 4, bois[2]);   // veine du bois
                }
                for (const yr of [yv + 6, yv + 20]) {          // selles et crampons
                    rect(x - 1, yr - 1, 6, 5, '#4e4a50');
                    px(x, yr - 1, '#2a2a2e'); px(x + 3, yr + 3, '#2a2a2e');
                }
            }
            for (const yr of [yv + 6, yv + 20]) {
                rect(0, yr, W, 3, '#3a3a40');
                rect(0, yr, W, 1, '#9a9aa4');
                rect(0, yr + 3, W, 1, '#2a1e14');
                for (let x = 0; x < W; x += 2) if (r2() < 0.12) {          // rouille
                    g.globalAlpha = 0.5; rect(x, yr + 1, 2 + r2() * 4, 2, ch(['#8a4a2a', '#7a3e22'])); g.globalAlpha = 1;
                }
            }
            for (let x = 30 + Math.floor(r2() * 40); x < W; x += 80) {     // éclisses aux joints
                for (const yr of [yv + 6, yv + 20]) {
                    rect(x - 3, yr - 1, 7, 5, '#55555c');
                    rect(x - 3, yr - 1, 7, 1, '#7a7a84');
                    px(x - 2, yr + 1, '#2a2a2e'); px(x + 2, yr + 1, '#2a2a2e');
                    rect(x, yr, 1, 3, '#1e1e22');
                }
            }
        }

        // Rochers (avec leur ombre) et buissons secs, hors des rails
        const horsRails = y => !((y > 110 && y < 156) || (y > 194 && y < 240));
        for (let i = 0; i < W * 0.03; i++) {
            const x = r() * W, y = 20 + r() * (H - 40);
            if (!horsRails(y)) continue;
            const l = 4 + Math.floor(r() * 7), h = 3 + Math.floor(r() * 4);
            rect(x + 2, y + h - 1, l, 2, '#8a5c3c');                   // ombre
            rect(x, y, l, h, '#b8a890');
            rect(x, y, l, 1, '#e0d4c0');
            rect(x + l - 2, y + 1, 2, h - 1, '#8e7e6a');
        }
        for (let i = 0; i < W * 0.025; i++) {
            const x = r() * W, y = 20 + r() * (H - 40);
            if (!horsRails(y)) continue;
            for (let k = 0; k < 9; k++) {
                const a = r() * Math.PI * 2, l = 2 + r() * 5;
                g.strokeStyle = choix(['#4a3a22', '#5e5030', '#3a2e1a']);
                g.beginPath(); g.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5); g.lineTo(Math.round(x + Math.cos(a) * l) + 0.5, Math.round(y + Math.sin(a) * l * 0.7) + 0.5); g.stroke();
            }
        }
        // --- Détails posés, sans se chevaucher ---
        const pris = [];
        const libre = (x, y, l, h) => {
            if (x < 2 || x + l > W - 2 || y < 2 || y + h > H - 2) return false;
            if (y + h > 110 && y < 152) return false;                       // voie du haut
            if (y + h > 194 && y < 236) return false;                       // voie du bas
            return !pris.some(p => x < p.x + p.l + 4 && x + l + 4 > p.x && y < p.y + p.h + 4 && y + h + 4 > p.y);
        };
        const poser = (nb, l, h, dessin, zone = {}) => {
            const x0 = zone.x0 ?? 0, x1 = zone.x1 ?? W, y0 = zone.y0 ?? 0, y1 = zone.y1 ?? H;
            for (let i = 0, essais = 0; i < nb && essais < nb * 40; essais++) {
                const x = Math.round(x0 + r2() * (x1 - x0)), y = Math.round(y0 + r2() * (y1 - y0));
                if (!libre(x, y, l, h)) continue;
                pris.push({ x, y, l, h }); dessin(x, y); i++;
            }
        };
        const parEcran = n => Math.max(1, Math.round(n * W / 800));

        // Traces de pneus sur la piste, et pas qui la traversent
        for (const yt of [326, 340]) for (let x = 0; x < W; x += 2) {
            const y = yt + Math.round(Math.sin(x / 40) * 1.5);
            g.globalAlpha = 0.35; rect(x, y, 1, 3, x % 4 ? '#9a6e48' : '#8a5c3c'); g.globalAlpha = 1;
        }
        for (let k = 0; k < parEcran(2); k++) {
            let x = 120 + r2() * (W - 240), y = 300, pas = 0;
            while (y < 372) {
                g.globalAlpha = 0.4;
                rect(x + (pas++ % 2 ? 3 : -3), y, 2, 3, '#8a5c3c');
                g.globalAlpha = 1;
                y += 9; x += (r2() - 0.5) * 3;
            }
        }

        // Taches de sang séché, avec une traînée
        poser(parEcran(5), 14, 10, (x, y) => {
            g.globalAlpha = 0.55;
            ovale(x + 5, y + 5, 3 + Math.floor(r2() * 2), 2, '#6a1e1a');
            for (let k = 0; k < 14; k++) px(x + r2() * 12, y + 1 + r2() * 8, ch(['#6a1e1a', '#4e1412', '#7e2a22']));
            const dir = r2() < 0.5 ? 1 : -1;
            for (let k = 0; k < 8; k++) px(x + 5 + dir * (4 + k * 1.5), y + 5 + Math.round(Math.sin(k)), '#5a1a16');
            g.globalAlpha = 1;
        }, { x0: 160 });

        // Rochers composés (gros blocs à facettes et cailloux autour)
        poser(parEcran(4), 16, 10, (x, y) => {
            ombre(() => ovale(x + 9, y + 7, 8, 3, SOMBRE));
            rect(x + 1, y + 2, 12, 6, '#a8977d'); rect(x + 3, y, 8, 3, '#bcad94');
            rect(x + 3, y, 8, 1, '#e0d4c0'); rect(x + 1, y + 2, 2, 1, '#d4c6ae');
            rect(x + 9, y + 3, 4, 5, '#857560'); rect(x + 5, y + 5, 1, 3, '#857560');
            rect(x + 12, y + 6, 4, 3, '#b8a890'); rect(x + 12, y + 6, 4, 1, '#e0d4c0');
            for (let k = 0; k < 4; k++) px(x - 2 + r2() * 20, y + 8 + r2() * 3, '#b8a890');
        });

        // Cactus tonneau (vus de dessus : côtes, épines, parfois une fleur)
        poser(parEcran(5), 11, 11, (x, y) => {
            const rr = 3 + Math.floor(r2() * 2), cx = x + 5, cy = y + 5;
            ombre(() => ovale(cx + 2, cy + 2, rr + 1, rr, SOMBRE));
            ovale(cx, cy, rr, rr, '#4e6a32');
            ovale(cx - 1, cy - 1, rr - 1, rr - 1, '#6a8a42');
            for (let a = 0; a < 8; a++) {
                const ang = a * Math.PI / 4;
                px(cx + Math.round(Math.cos(ang) * (rr - 1)), cy + Math.round(Math.sin(ang) * (rr - 1)), '#3a5226');
                px(cx + Math.round(Math.cos(ang) * (rr + 1)), cy + Math.round(Math.sin(ang) * (rr + 1)), '#e8dcb0');
            }
            if (r2() < 0.5) { px(cx, cy, ch(['#e05a8a', '#f0c040'])); px(cx - 1, cy, '#f8e8a0'); }
            else px(cx, cy, '#8aa85a');
        });

        // Cactus à bras (vus de dessus : tronc rond, bras qui partent sur les côtés)
        poser(parEcran(3), 18, 12, (x, y) => {
            const cx = x + 9, cy = y + 6;
            ombre(() => { ovale(cx + 3, cy + 3, 4, 3, SOMBRE); rect(cx - 6, cy + 2, 18, 3, SOMBRE); });
            for (const cote of [-1, 1]) if (r2() < 0.8 || cote === 1) {
                const bx = cote < 0 ? cx - 8 : cx + 3;
                rect(bx, cy - 1, 6, 3, '#4e6a32'); rect(bx, cy - 1, 6, 1, '#6a8a42');
                ovale(cx + cote * 8, cy, 2, 2, '#5a7a3a'); px(cx + cote * 8, cy - 1, '#8aa85a');
            }
            ovale(cx, cy, 4, 4, '#4e6a32'); ovale(cx - 1, cy - 1, 3, 3, '#6a8a42'); ovale(cx - 1, cy - 1, 1, 1, '#8aa85a');
            for (let a = 0; a < 6; a++) px(cx + Math.round(Math.cos(a) * 5), cy + Math.round(Math.sin(a) * 5), '#e8dcb0');
        });

        // Crânes de vache, cornes comprises, et os éparpillés
        poser(parEcran(2), 16, 9, (x, y) => {
            x += 1;
            ombre(() => ovale(x + 8, y + 6, 5, 3, SOMBRE));
            rect(x, y + 1, 3, 1, '#e8e0cc'); rect(x - 1, y, 2, 1, '#c8bca0');                 // corne gauche
            rect(x + 12, y + 1, 3, 1, '#e8e0cc'); rect(x + 14, y, 2, 1, '#c8bca0');           // corne droite
            rect(x + 3, y, 9, 4, '#efe8d6'); rect(x + 5, y + 4, 5, 4, '#e2d8c0');            // crâne, museau
            rect(x + 3, y, 9, 1, '#fffaf0');
            rect(x + 5, y + 2, 2, 2, '#3a2a20'); rect(x + 9, y + 2, 2, 2, '#3a2a20');        // orbites
            px(x + 6, y + 6, '#6a5a48'); px(x + 8, y + 6, '#6a5a48');                          // naseaux
            rect(x + 5, y + 7, 5, 1, '#b8ac94');
        });
        poser(parEcran(6), 7, 4, (x, y) => {
            if (r2() < 0.4) { rect(x + 2, y, 1, 4, '#e2d8c0'); rect(x + 1, y, 3, 1, '#efe8d6'); rect(x + 1, y + 3, 3, 1, '#c8bca0'); }
            else { rect(x + 1, y + 1, 5, 1, '#e2d8c0'); rect(x, y, 1, 3, '#efe8d6'); rect(x + 6, y, 1, 3, '#c8bca0'); }
        });

        // Virevoltants (boules de brindilles sèches)
        poser(parEcran(3), 12, 12, (x, y) => {
            const cx = x + 6, cy = y + 6, rr = 4 + Math.floor(r2() * 2);
            ombre(() => ovale(cx + 2, cy + 3, rr, rr - 2, SOMBRE));
            for (let k = 0; k < 70; k++) {
                const a = r2() * Math.PI * 2, d = rr * Math.sqrt(r2());
                px(cx + Math.cos(a) * d, cy + Math.sin(a) * d, ch(['#a08050', '#7a6038', '#b89a64', '#5e4a2a']));
            }
            for (let k = 0; k < 4; k++) { const a = r2() * Math.PI * 2; px(cx + Math.cos(a) * (rr + 1), cy + Math.sin(a) * (rr + 1), '#7a6038'); }
        });

        // Fûts rouillés : debout (cercles cerclés) ou couchés, avec une flaque d'huile
        poser(parEcran(3), 19, 11, (x, y) => {
            if (r2() < 0.5) {
                const cx = x + 5, cy = y + 5;
                ombre(() => ovale(cx + 3, cy + 3, 5, 4, SOMBRE));
                ovale(cx, cy, 5, 5, '#5e2a18'); ovale(cx, cy, 4, 4, '#8a3a22'); ovale(cx, cy, 2, 2, '#7a3220');
                px(cx - 2, cy - 3, '#c46a3a'); px(cx - 3, cy - 2, '#c46a3a'); rect(cx + 1, cy - 1, 2, 1, '#2a1a12');
                for (let k = 0; k < 5; k++) px(cx - 3 + r2() * 7, cy - 3 + r2() * 7, '#a85a2a');
            } else {
                ombre(() => rect(x + 2, y + 7, 12, 3, SOMBRE));
                rect(x, y + 1, 12, 7, '#8a3a22'); rect(x, y + 1, 12, 1, '#c46a3a'); rect(x, y + 7, 12, 1, '#5e2a18');
                for (const bx of [x + 3, x + 8]) rect(bx, y + 1, 1, 7, '#5e2a18');
                rect(x + 12, y + 2, 1, 5, '#4a2010');
                g.globalAlpha = 0.6; ovale(x + 15, y + 5, 3, 2, '#1e1a16'); g.globalAlpha = 1;
            }
        }, { y0: 250, y1: 380 });

        // Planches d'une caisse éventrée
        poser(parEcran(2), 14, 10, (x, y) => {
            for (let k = 0; k < 3; k++) {
                const dx = x + r2() * 4, dy = y + k * 3 + r2() * 2, l = 7 + r2() * 5;
                ombre(() => rect(dx + 1, dy + 2, l, 1, SOMBRE));
                rect(dx, dy, l, 2, '#9a6a3a'); rect(dx, dy, l, 1, '#b8844a'); px(dx + 1, dy + 1, '#3a2a20'); px(dx + l - 2, dy + 1, '#3a2a20');
            }
        });

        // Touffes d'herbe sèche plus vertes
        for (let i = 0; i < parEcran(30); i++) {
            const x = r2() * W, y = 6 + r2() * (H - 12);
            if (!libre(x, y, 4, 4)) continue;
            for (let k = 0; k < 5; k++) {
                const h = 2 + Math.floor(r2() * 3);
                rect(x + k, y + 4 - h, 1, h, ch(['#7a7a34', '#8e8a3e', '#5e6a2a', '#a89a50']));
            }
        }

        // Douilles de cuivre côté défense
        for (let i = 0; i < parEcran(26); i++) {
            const x = 10 + r2() * 140, y = 10 + r2() * (H - 20);
            if (!libre(x, y, 2, 1)) continue;
            rect(x, y, 2, 1, '#d4a53a'); px(x + 2, y, '#8a6a22');
        }

        // Sacs de sable au bord gauche
        for (const ys of [36, 278]) {
            for (let k = 0; k < 3; k++) {
                const sx = 2 + (k % 2) * 3, sy = ys + k * 7;
                ombre(() => rect(sx + 3, sy + 4, 12, 3, SOMBRE));
                rect(sx, sy, 12, 6, '#b9a578'); rect(sx, sy, 12, 1, '#d6c49a'); rect(sx, sy + 5, 12, 1, '#8a7a54');
                rect(sx + 5, sy + 1, 1, 4, '#9a8a60'); px(sx, sy, '#c4956a'); px(sx + 11, sy, '#c4956a');
            }
            pris.push({ x: 0, y: ys, l: 18, h: 22 });
        }

        // Poteaux télégraphiques le long des voies, leurs fils et leurs ombres
        const yp = 100;
        g.globalAlpha = 0.25;
        for (const dy of [-3, 3]) rect(0, yp + dy + 6, W, 1, SOMBRE);
        g.globalAlpha = 1;
        for (const dy of [-3, 3]) for (let x = 0; x < W; x++) if (x % 7) px(x, yp + dy, '#3a2e24');
        for (let x = 60 + Math.floor(r2() * 60); x < W; x += 150) {
            ombre(() => { for (let k = 0; k < 14; k++) rect(x + 2 + k, yp + 1 + Math.round(k * 0.6), 2, 2, SOMBRE); });
            rect(x - 1, yp - 5, 2, 11, '#4a3220'); rect(x - 1, yp - 5, 1, 11, '#6a4a2e');       // traverse
            rect(x - 2, yp - 2, 4, 4, '#5a3a24'); rect(x - 2, yp - 2, 4, 1, '#7a5232');         // tête du poteau
            for (const dy of [-4, 4]) px(x, yp + dy, '#7ab0b8');                                 // isolateurs
        }

        // Clôture de barbelés en bas
        const yb = 388;
        for (let x = 0; x < W; x++) {
            px(x, yb + (x % 6 === 0 ? -1 : 0), '#5a5a60');
            if (x % 6 === 0) { px(x, yb + 1, '#3a3a40'); px(x + 1, yb - 1, '#7a7a84'); }
            g.globalAlpha = 0.2; px(x + 2, yb + 4, SOMBRE); g.globalAlpha = 1;
        }
        for (let x = 10 + Math.floor(r2() * 20); x < W; x += 44 + Math.floor(r2() * 12)) {
            const penche = r2() < 0.2;
            ombre(() => rect(x + 2, yb + 1, 6, 2, SOMBRE));
            rect(x - 1, yb - 2 + (penche ? 1 : 0), 3, 3, '#6a4a2e'); px(x - 1, yb - 2, '#8a6a42'); px(x + 1, yb, '#3e2614');
        }
        return c;
    }

    // Le décor pour une largeur donnée (par défaut celle du monde), mis en cache
    return (largeur = MONDE.largeur, hauteur = MONDE.hauteur) => {
        const W = Math.round(largeur), cle = W + 'x' + hauteur;
        if (!caches.has(cle)) {
            if (caches.size > 4) caches.clear();
            caches.set(cle, construire(W, hauteur));
        }
        return caches.get(cle);
    };
})();
