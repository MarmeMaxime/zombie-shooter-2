/* =========================================================================
   COMBAT DE BOXE (chapitre 2, « Le Ring » : Brutus contre Gégé, le gorille)
   Une mécanique à part, qui remplace le tir le temps d'une mission :
   - TIR : coup de poing (jab et direct en alternance). Sur la garde de
     Gégé, ça ne fait rien ; pendant qu'il arme son coup, ça le touche ;
     quand il est déséquilibré, c'est un CONTRE, qui fait très mal.
   - HAUT ou BAS : esquive. Gégé prévient avant de frapper (« ! » au-dessus
     de lui). Esquiver au bon moment le fait frapper dans le vide : il part
     en avant, la garde ouverte, et c'est le moment de contrer. Esquiver au
     tout dernier moment (PARFAIT) le laisse ouvert plus longtemps.
   - POUVOIR (★) : quand la rage est pleine (esquives et contres la
     remplissent), un uppercut que rien n'arrête.
   Gégé change de rythme à 2/3 et 1/3 de sa vie : il rugit (il se tape la
   poitrine : il est ouvert), puis enchaîne deux, trois coups, plus vite ;
   en hardcore, il fait aussi des feintes (il arme… puis se remet en garde).
   Les réglages viennent de la mission (campagne_histoire.js, « boxe »).
   La foule de la bâtisse s'agite selon le combat.
   ========================================================================= */
const Boxe = (() => {
    let c = null;
    const ECH = 2;                 // Gégé est dessiné en 2×
    const ECH_B = 2.25;            // Brutus un peu plus (son sprite est plus fin)
    const SOL = 334;               // ligne des pieds sur le ring (unités du monde)

    const alea = (a, b) => a + Math.random() * (b - a);

    function demarrer(reglages) {
        c = {
            r: reglages, lance: false, t: 0, fin: 0,
            b: { pv: 100, etat: 'garde', t: 0, duree: 0, cool: 0, alterne: 0, rage: 0, debutEsq: -9, frappe: false },
            g: { pv: reglages.pv, pvMax: reglages.pv, etat: 'attente', t: 0, duree: 0, serie: 0, rate: false, parfait: false,
                feinte: false, phase: 1, combo: 0, flash: 0, bloques: 0, cri: '', criT: 0, rugir: false },
            textes: [], eclats: [], ferveur: 0.3, prec: { tir: true, esq: true },
            foule: creer_foule()
        };
        maj_hud_rage();
    }
    function arreter() { c = null; }
    const actif = () => Boolean(c);

    // Après la présentation (les répliques d'avant-combat) : la cloche sonne
    function commencer() {
        if (!c || c.lance) return;
        c.lance = true;
        c.debut = c.t;
        c.g.etat = 'garde'; c.g.t = 0; c.g.duree = 1.2;
        Son.effet('cloche');
        texte(T('COMBAT !'), MONDE.largeur / 2, 150, '#ffd060', 26, 1.4);
    }

    /* ---------- La foule ---------- */
    function creer_foule() {
        const gens = [];
        const W = MONDE.largeur;
        const teintes = ['#c68a5e', '#e0b08a', '#8a5a3a', '#d8a07a', '#5a3a2a'];
        const habits = ['#8a3a2a', '#3a5a8a', '#5e6e34', '#6a6a72', '#a88a3a', '#4a3a5a', '#2a4a4a', '#8a6a4a'];
        for (let rang = 0; rang < 3; rang++) for (let x = -6 + rang * 9; x < W + 10; x += 20 + Math.random() * 8) {
            if (rang === 2 && Math.abs(x - W / 2) < 40) continue;
            gens.push({ x, y: 150 + rang * 16, peau: teintes[Math.floor(Math.random() * teintes.length)], habit: habits[Math.floor(Math.random() * habits.length)], phase: Math.random() * 6, h: 18 + Math.random() * 6 });
        }
        // Premier rang, devant le ring : on les voit de dos, dans l'ombre
        for (let x = 8; x < W; x += 34 + Math.random() * 14) gens.push({ x, y: 384, peau: '#2a2220', habit: '#141214', phase: Math.random() * 6, h: 26, dos: true });
        return gens;
    }

    function dessiner_foule(ctx, devant) {
        const t = c.t, f = c.ferveur;
        for (const p of c.foule) {
            if (Boolean(p.dos) !== devant) continue;
            const saut = Math.max(0, Math.sin(t * (4 + f * 6) + p.phase)) * (1 + f * 4);
            const y = Math.round(p.y - saut);
            ctx.fillStyle = p.habit; ctx.fillRect(Math.round(p.x) - 6, y - p.h + 8, 12, p.h);
            ctx.fillStyle = p.peau; ctx.fillRect(Math.round(p.x) - 4, y - p.h, 8, 8);
            if (!p.dos) { ctx.fillStyle = '#1a1210'; ctx.fillRect(Math.round(p.x) - 4, y - p.h, 8, 2); }
            // Les bras levés quand ça chauffe
            if (f > 0.45 && Math.sin(t * 3 + p.phase * 2) > 0.1) {
                ctx.fillStyle = p.habit;
                ctx.fillRect(Math.round(p.x) - 9, y - p.h - 6, 3, 12); ctx.fillRect(Math.round(p.x) + 6, y - p.h - 6, 3, 12);
                ctx.fillStyle = p.peau; ctx.fillRect(Math.round(p.x) - 9, y - p.h - 8, 3, 3); ctx.fillRect(Math.round(p.x) + 6, y - p.h - 8, 3, 3);
            }
        }
    }

    /* ---------- Le ring (cordes et poteaux : derrière, puis devant les combattants) ---------- */
    const RING = () => ({ g: MONDE.largeur / 2 - 270, d: MONDE.largeur / 2 + 270, haut: 222, bas: 350 });
    function cordes(ctx, devant) {
        const R = RING(), couleurs = ['#c83030', '#ece6da', '#2a4e9a'];
        const yBase = devant ? R.bas : R.haut;
        for (const x of [R.g, R.d]) {
            ctx.fillStyle = '#1a1a1e'; ctx.fillRect(x - 4, yBase - 64, 8, 66);
            ctx.fillStyle = devant ? '#c83030' : '#2a4e9a'; ctx.fillRect(x - 5, yBase - 66, 10, 8);
        }
        couleurs.forEach((col, i) => {
            const y = yBase - 56 + i * 16;
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.g, y + 3, R.d - R.g, 3);
            ctx.fillStyle = col; ctx.fillRect(R.g, y, R.d - R.g, 3);
        });
        if (!devant) {
            // Les cordes de côté, en perspective
            for (const [x0, x1] of [[R.g, R.g - 14], [R.d, R.d + 14]]) couleurs.forEach((col, i) => {
                ctx.strokeStyle = col; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(x0, R.haut - 56 + i * 16); ctx.lineTo(x1, R.bas - 56 + i * 16); ctx.stroke();
            });
        }
    }

    /* ---------- Textes et éclats ---------- */
    function texte(s, x, y, couleur = '#ffffff', taille = 14, duree = 0.9) { c.textes.push({ s, x, y, couleur, taille, age: 0, duree }); }
    function eclat(x, y, gros) { c.eclats.push({ x, y, age: 0, gros }); }

    /* ---------- Rage (le ★) : on réutilise la jauge du pouvoir ---------- */
    function maj_hud_rage() {
        if (typeof pouvoir === 'undefined' || typeof maj_hud_pouvoir !== 'function' || !c) return;
        pouvoir.charge = Math.round(Math.min(100, c.b.rage) / 100 * kills_requis());
        maj_hud_pouvoir();
    }
    function rage(n) { if (!c) return; c.b.rage = Math.min(100, c.b.rage + n); maj_hud_rage(); }

    /* ---------- Brutus ---------- */
    function changer_b(etat, duree) { Object.assign(c.b, { etat, t: 0, duree, frappe: false }); }

    function super_coup() {
        if (!c || !c.lance || c.b.rage < 100 || !['garde', 'jab', 'direct'].includes(c.b.etat) || c.g.etat === 'ko') return;
        c.b.rage = 0; maj_hud_rage();
        changer_b('uppercut', 0.55);
    }

    function entrees() {
        const esq = commandes.haut || commandes.bas || Math.abs(commandes.axe || 0) > 0.5;
        const tir = commandes.tir;
        const appuiTir = tir && !c.prec.tir, appuiEsq = esq && !c.prec.esq;
        c.prec.tir = tir; c.prec.esq = esq;
        return { appuiTir, appuiEsq };
    }

    function maj_brutus(dt, { appuiTir, appuiEsq }) {
        const b = c.b;
        b.t += dt; b.cool = Math.max(0, b.cool - dt);
        if (b.etat === 'ko' || b.etat === 'victoire') return;
        const libre = b.etat === 'garde' || ((b.etat === 'jab' || b.etat === 'direct') && b.t > 0.12);
        if (c.lance && appuiEsq && libre && b.cool <= 0) {
            changer_b('esquive', 0.4);
            b.debutEsq = c.t;
            Son.effet('esquive');
        } else if (c.lance && appuiTir && b.etat === 'garde' && b.cool <= 0) {
            changer_b(b.alterne ? 'direct' : 'jab', 0.24);
            b.alterne = 1 - b.alterne;
        }
        // Le coup part : il touche à la 2e image
        if ((b.etat === 'jab' || b.etat === 'direct') && !b.frappe && b.t >= 0.08) { b.frappe = true; coup_brutus(false); }
        if (b.etat === 'uppercut' && !b.frappe && b.t >= 0.26) { b.frappe = true; coup_brutus(true); }
        if (b.etat === 'victoire') return;   // ce coup-là vient de mettre Gégé K.O.
        if (b.etat !== 'garde' && b.t >= b.duree) {
            if (b.etat === 'esquive') b.cool = 0.12;
            else if (b.etat === 'jab' || b.etat === 'direct') b.cool = 0.06;
            changer_b('garde', 0);
        }
    }

    // Le coup de Brutus arrive sur Gégé
    function coup_brutus(uppercut) {
        const g = c.g, r = c.r, gx = MONDE.largeur / 2 - 4, gy = SOL - 150;
        if (g.etat === 'ko' || g.etat === 'attente') return;
        if (uppercut) {
            blesser(r.super, '#ffb040', T('UPPERCUT !'), true);
            secouer_ecran(4);
            if (g.pv > 0) changer_g('ouvert', 1.1);
            return;
        }
        if (g.etat === 'garde' || g.etat === 'frappe' || g.etat === 'recup') {
            // Sur la garde : bloqué. À force de taper dans ses gants, il riposte tout de suite
            Son.effet('coupBloque');
            texte(T('BLOQUÉ'), gx + alea(-10, 10), gy, '#b8b8c0', 11, 0.6);
            g.flash = 0.06;
            if (g.etat === 'garde' && ++g.bloques >= 3) { g.bloques = 0; g.duree = Math.min(g.duree, g.t + 0.15); }
            return;
        }
        if (g.etat === 'ouvert' || g.etat === 'rugir') {
            g.combo++;
            blesser(r.contre + (g.combo - 1) * 2, '#ffd060', g.combo === 1 ? T('CONTRE !') : T('CONTRE ×{n}', { n: g.combo }), g.combo >= 3);
            rage(7);
            return;
        }
        // Il armait son coup : touché, mais il ne s'arrête pas
        blesser(r.jab, '#ffffff', '', false);
    }

    function blesser(n, couleur, mot, gros) {
        const g = c.g, gx = MONDE.largeur / 2 - 4, gy = SOL - 150;
        g.pv = Math.max(0, g.pv - n);
        g.flash = 0.14;
        Son.effet(gros ? 'coupFort' : 'coupPoing');
        eclat(gx - 10 + alea(-6, 6), gy + alea(-10, 10), gros);
        texte('-' + n, gx + alea(-14, 14), gy - 18, couleur, gros ? 16 : 12);
        if (mot) texte(mot, gx, gy - 40, couleur, 15, 1);
        c.ferveur = Math.min(1, c.ferveur + (gros ? 0.25 : 0.08));
        if (gros) Son.effet('foule');
        if (g.pv <= 0) ko_gorille();
    }

    /* ---------- Gégé ---------- */
    function changer_g(etat, duree) { Object.assign(c.g, { etat, t: 0, duree }); }

    function phase_g() { const p = c.g.pv / c.g.pvMax; return p > 0.66 ? 1 : p > 0.33 ? 2 : 3; }

    function lancer_serie() {
        const g = c.g, ph = g.phase;
        g.serie = ph === 1 ? 1 : ph === 2 ? (Math.random() < 0.5 ? 1 : 2) : (Math.random() < 0.5 ? 2 : 3);
        g.premier = true;
        armer();
    }
    function armer() {
        const g = c.g, r = c.r;
        // Les coups suivants d'une série arrivent plus vite, mais on a toujours le temps de ré-esquiver
        let d = g.premier ? r.armer * (g.phase === 3 ? 0.88 : 1) : Math.max(0.46, r.armer * 0.7);
        g.feinte = Boolean(r.feintes) && g.phase >= 2 && g.premier && Math.random() < r.feintes;
        g.rate = false; g.parfait = false;
        changer_g('armer', d);
    }

    function maj_gorille(dt) {
        const g = c.g, b = c.b, r = c.r;
        g.t += dt; g.flash = Math.max(0, g.flash - dt); g.criT = Math.max(0, g.criT - dt);
        if (g.etat === 'attente' || g.etat === 'ko') return;
        // Changement de phase : il rugira à la fin de sa garde
        const ph = phase_g();
        if (ph > g.phase) { g.phase = ph; g.rugir = true; }

        if (g.etat === 'armer' && g.feinte && g.t >= g.duree * 0.7) {
            // Feinte : il se remet en garde… et attaque vraiment peu après
            texte('?', MONDE.largeur / 2 + 30, SOL - 196, '#ffd060', 16, 0.6);
            g.feinte = false;
            changer_g('garde', 0.35);
            return;
        }
        if (g.t < g.duree) return;
        switch (g.etat) {
            case 'garde':
            case 'recup':
                g.bloques = 0;
                if (g.rugir) { g.rugir = false; rugir(); }
                else lancer_serie();
                break;
            case 'armer': {
                // L'impact
                changer_g('frappe', 0.2);
                Son.effet('esquive');
                if (b.etat === 'esquive') {
                    g.rate = true;
                    g.parfait = c.t - b.debutEsq <= r.parfait;   // esquive lancée au tout dernier moment
                    texte(g.parfait ? T('PARFAIT !') : T('ESQUIVÉ !'), MONDE.largeur / 2 - 150, SOL - 150, g.parfait ? '#7aff9a' : '#c8e8ff', g.parfait ? 16 : 13, 0.8);
                    rage(g.parfait ? 15 : 8);
                    c.ferveur = Math.min(1, c.ferveur + 0.1);
                } else if (b.etat !== 'ko') {
                    touche_brutus();
                }
                break;
            }
            case 'frappe':
                g.premier = false;
                if (--g.serie > 0 && c.b.etat !== 'ko') armer();
                else if (g.rate) { g.combo = 0; changer_g('ouvert', r.ouvert * (g.parfait ? 1.45 : 1)); }
                else changer_g('recup', 0.5);
                break;
            case 'ouvert':
            case 'rugir':
                g.combo = 0;
                changer_g('garde', alea(r.garde[0], r.garde[1]) * (g.phase === 3 ? 0.7 : 1));
                break;
        }
    }

    function rugir() {
        const g = c.g;
        changer_g('rugir', 1.6);
        g.combo = 0;
        g.cri = g.phase === 2 ? T('Tu frappes comme tu portes : de travers !') : T('Je vais te faire monter le piano… avec les dents !');
        g.criT = 2.2;
        Son.effet('rugissement');
        c.ferveur = 1;
    }

    function touche_brutus() {
        const b = c.b;
        b.pv = Math.max(0, b.pv - c.r.degats);
        changer_b('sonne', 0.5);
        Son.effet('coupFort');
        secouer_ecran(3);
        if (typeof Son.vibrer === 'function') Son.vibrer(1, 150);
        eclat(MONDE.largeur / 2 - 92, SOL - 104, true);
        texte('-' + c.r.degats, MONDE.largeur / 2 - 110, SOL - 140, '#ff5a4a', 15);
        rage(4);
        c.ferveur = Math.min(1, c.ferveur + 0.15);
        if (b.pv <= 0) {
            changer_b('ko', 0);
            changer_g('recup', 99);
            c.fin = 2.2; c.issue = false;
            Son.effet('cloche');
            texte('K.O.', MONDE.largeur / 2, 180, '#ff5a4a', 30, 2);
        }
    }

    function ko_gorille() {
        changer_g('ko', 0);
        changer_b('victoire', 0);
        c.fin = 2.6; c.issue = true;
        c.ferveur = 1;
        Son.effet('cloche');
        Son.effet('foule');
        secouer_ecran(5);
        texte('K.O. !', MONDE.largeur / 2, 180, '#ffd060', 30, 2.2);
    }

    /* ---------- Mise à jour ---------- */
    function maj(dt) {
        if (!c) return;
        c.t += dt;
        const e = entrees();
        maj_brutus(dt, e);
        maj_gorille(dt);
        c.ferveur = Math.max(0.25, c.ferveur - dt * 0.12);
        for (const x of c.textes) x.age += dt;
        c.textes = c.textes.filter(x => x.age < x.duree);
        for (const x of c.eclats) x.age += dt;
        c.eclats = c.eclats.filter(x => x.age < 0.3);
        if (c.fin > 0) {
            c.fin -= dt;
            if (c.fin <= 0) { const issue = c.issue; c.fin = -1; Campagne.fin_boxe(issue); }
        }
    }

    /* ---------- Dessin ---------- */
    function image_b() {
        const S = SPRITES_BOXE.brutus, b = c.b, k = b.duree ? b.t / b.duree : 0;
        switch (b.etat) {
            case 'jab': return S.jab[b.t < 0.08 ? 0 : 1];
            case 'direct': return S.direct[b.t < 0.08 ? 0 : 1];
            case 'uppercut': return S.uppercut[Math.min(2, Math.floor(k * 3.2))];
            case 'esquive': return S.esquive[k < 0.25 || k > 0.8 ? 0 : 1];
            case 'sonne': return S.touche;
            case 'ko': return S.ko;
            case 'victoire': return S.victoire;
            default: return S.garde[Math.floor(c.t * 6) % 4];
        }
    }
    function image_g() {
        const S = SPRITES_BOXE.gorille, g = c.g, k = g.duree ? g.t / g.duree : 0;
        if (g.flash > 0 && g.etat !== 'ko') return S.touche;
        switch (g.etat) {
            case 'armer': return S.armer[k < 0.45 ? 0 : 1];
            case 'frappe': return S.frappe[g.t < 0.08 ? 0 : 1];
            case 'ouvert': return S.ouvert[Math.floor(c.t * 4) % 2];
            case 'rugir': return S.rugir[Math.floor(c.t * 8) % 2];
            case 'ko': return S.ko;
            case 'attente': return typeof Instructeur !== 'undefined' && Instructeur.ouvert() && Instructeur.parleEncore() && Math.floor(c.t * 8) % 2 ? S.parle : S.garde[Math.floor(c.t * 4) % 4];
            default: return S.garde[Math.floor(c.t * 5) % 4];
        }
    }

    // Un combattant (couché s'il est K.O. : son sprite « ko » est déjà allongé)
    const poser = (ctx, img, x, y, taille) => ctx.drawImage(img, Math.round(x), Math.round(y), taille, taille);

    function dessiner(ctx) {
        if (!c) return;
        const W = MONDE.largeur, cx = W / 2, b = c.b, g = c.g;
        dessiner_foule(ctx, false);
        cordes(ctx, false);
        // Ombres au sol
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(cx - 86, SOL - 2, 38, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 40, SOL - 2, 62, 9, 0, 0, Math.PI * 2); ctx.fill();

        // Gégé (derrière Brutus) : il avance quand il frappe, recule quand il est touché
        const dxg = g.etat === 'frappe' ? -16 : g.etat === 'armer' ? 6 : g.etat === 'ouvert' ? -10 : g.flash > 0 ? 8 : 0;
        poser(ctx, image_g(), cx - 60 + (g.etat === 'ko' ? 20 : dxg), SOL - 92 * ECH + 4, 96 * ECH);
        // Brutus : il recule quand il esquive ou qu'il est sonné
        const dxb = b.etat === 'esquive' ? -14 : b.etat === 'sonne' ? -18 * (1 - b.t / 0.5) : (b.etat === 'jab' || b.etat === 'direct') ? 6 : b.etat === 'uppercut' ? 10 : 0;
        // (son vrai sprite : les pieds sur la dernière ligne, le corps vers la gauche de l'image)
        poser(ctx, image_b(), cx - 140 + (b.etat === 'ko' ? -24 : dxb), SOL - 63 * ECH_B, 64 * ECH_B);

        cordes(ctx, true);
        dessiner_foule(ctx, true);

        // Le « ! » : Gégé arme son coup (il rougit quand l'impact approche)
        if (g.etat === 'armer') {
            const k = g.t / g.duree, gros = 1 + Math.sin(c.t * 30) * 0.08;
            ctx.save();
            ctx.translate(cx + 30, SOL - 196);
            ctx.scale(gros, gros);
            ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
            ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText('!', 0, 0);
            ctx.fillStyle = k > 0.65 ? '#ff4a3a' : '#ffd060'; ctx.fillText('!', 0, 0);
            ctx.restore();
        }
        // Les étoiles : il est sonné (ouvert) ou K.O.
        if (g.etat === 'ouvert' || g.etat === 'ko') for (let k = 0; k < 4; k++) {
            const a = c.t * 5 + k * Math.PI / 2;
            ctx.fillStyle = k % 2 ? '#ffd060' : '#ffffff';
            // (au-dessus de sa tête : debout, ou couché la tête à droite)
            const ko = g.etat === 'ko';
            const sx = Math.round((ko ? cx + 128 : cx - 10 + dxg) + Math.cos(a) * 22), sy = Math.round(SOL - (ko ? 46 : 140) + Math.sin(a) * 6);
            ctx.fillRect(sx - 1, sy - 3, 2, 6); ctx.fillRect(sx - 3, sy - 1, 6, 2);
        }
        // Éclats des coups
        for (const e of c.eclats) {
            const rr = (e.gros ? 18 : 11) * (0.5 + e.age / 0.3);
            ctx.globalAlpha = 1 - e.age / 0.3;
            ctx.fillStyle = '#fff6c0';
            for (let k = 0; k < 8; k++) {
                const a = k * Math.PI / 4;
                ctx.fillRect(Math.round(e.x + Math.cos(a) * rr) - 2, Math.round(e.y + Math.sin(a) * rr) - 2, 4, 4);
            }
            ctx.globalAlpha = 1;
        }
        // La bulle de Gégé quand il rugit
        if (g.criT > 0 && g.cri) bulle(ctx, g.cri, cx + 20, SOL - 222);
        // Textes qui montent
        ctx.textAlign = 'center';
        for (const x of c.textes) {
            const y = x.y - x.age * 30;
            ctx.globalAlpha = Math.min(1, (x.duree - x.age) / 0.25);
            ctx.font = `bold ${x.taille}px monospace`;
            ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(x.s, x.x, y);
            ctx.fillStyle = x.couleur; ctx.fillText(x.s, x.x, y);
        }
        ctx.globalAlpha = 1;
        hud(ctx);
    }

    function bulle(ctx, s, x, y) {
        ctx.font = 'bold 11px monospace';
        const l = Math.min(MONDE.largeur - 20, ctx.measureText(s).width + 16);
        const bx = Math.max(10, Math.min(MONDE.largeur - 10 - l, x - l / 2));
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(bx), y - 14, Math.round(l), 20);
        ctx.fillRect(Math.round(x) - 3, y + 6, 6, 5);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(Math.round(bx), y - 14, Math.round(l), 20);
        ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.fillText(s, bx + l / 2, y);
    }

    // Les deux barres de vie, en haut, et la rage de Brutus
    function hud(ctx) {
        const W = MONDE.largeur, l = Math.min(260, W * 0.36), y = 124;   // sous la banderole, loin du HUD du haut
        const barre = (x, part, couleur, nom, droite) => {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 2, y - 2, l + 4, 14);
            ctx.fillStyle = '#3a1010'; ctx.fillRect(x, y, l, 10);
            ctx.fillStyle = couleur; ctx.fillRect(droite ? x + l * (1 - part) : x, y, l * part, 10);
            ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(droite ? x + l * (1 - part) : x, y, l * part, 2);
            ctx.font = 'bold 12px monospace'; ctx.textAlign = droite ? 'right' : 'left';
            ctx.lineWidth = 3; ctx.strokeStyle = '#000';
            ctx.strokeText(nom, droite ? x + l : x, y - 6); ctx.fillStyle = '#ffffff'; ctx.fillText(nom, droite ? x + l : x, y - 6);
        };
        barre(16, c.b.pv / 100, c.b.pv > 35 ? '#4ad060' : '#e83a3a', 'BRUTUS', false);
        barre(W - 16 - l, c.g.pv / c.g.pvMax, '#e8a030', 'GÉGÉ', true);
        // Rage
        const pr = c.b.rage / 100;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(14, y + 14, l * 0.6 + 4, 8);
        ctx.fillStyle = pr >= 1 && Math.floor(c.t * 6) % 2 ? '#fff0a0' : '#ff8a2a'; ctx.fillRect(16, y + 16, l * 0.6 * pr, 4);
        if (pr >= 1) {
            ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
            ctx.lineWidth = 3; ctx.strokeStyle = '#000';
            const s = T('★ UPPERCUT PRÊT ({touche})', { touche: Touches.libelle('pouvoir') });
            ctx.strokeText(s, 16 + l * 0.6 + 10, y + 22); ctx.fillStyle = '#ffd060'; ctx.fillText(s, 16 + l * 0.6 + 10, y + 22);
        }
        // Les commandes, le temps des premiers échanges (ce n'est pas un combat de tir)
        const depuis = c.t - (c.debut ?? Infinity);
        if (depuis >= 0 && depuis < 10) {
            const s = T('{tir} : frapper · {haut}/{bas} : esquiver au « ! » · {pouvoir} : uppercut', {
                tir: Touches.libelle('tir'), haut: Touches.libelle('haut'), bas: Touches.libelle('bas'), pouvoir: Touches.libelle('pouvoir')
            });
            ctx.globalAlpha = Math.min(1, (10 - depuis) / 1.5);
            ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
            const lt = Math.min(W - 12, ctx.measureText(s).width + 20);
            ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(W / 2 - lt / 2, 372, lt, 20);
            ctx.fillStyle = '#ffffff'; ctx.fillText(s, W / 2, 386, W - 20);
            ctx.globalAlpha = 1;
        }
    }

    return { demarrer, arreter, actif, commencer, maj, dessiner, super: super_coup, etat: () => c };
})();
