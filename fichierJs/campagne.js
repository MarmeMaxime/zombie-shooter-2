/* =========================================================================
   CAMPAGNE : le moteur (l'histoire elle-même est dans campagne_histoire.js).
   Derrière le soldat se trouve un camp à protéger ; sous le camp, un labo où
   des chercheurs travaillent sur un remède. Le camp s'affiche dans le menu
   (camp_decor.js) et grandit avec la campagne (etape()).
   - Intro de chaque mission : une scène dans le camp (de jour, de nuit au coin
     du feu, avec la brèche…), avec les dialogues du Sergent, du Soldat (muet),
     du labo, de l'éclaireur, de Brutus ou de Gégé, dans la boîte de dialogue du
     tutoriel. Depuis l'écran de la campagne, on peut revoir l'intro d'une
     mission déjà vue, et l'outro (débriefing, épilogue) d'une mission réussie.
   - Mission : une partie avec ses propres apparitions et un objectif parmi
     « objectif » (zombies à repousser), « camion » (escorte), « chantier »
     (couvrir une réparation), « boss » (une horde, puis le boss) ou « boxe »
     (un combat de boxe, boxe.js). Elle peut avoir son décor (ville, métro,
     arène), se jouer de nuit ou en miroir, et être racontée par Brutus (le
     chapitre 2 est son histoire). Elle se joue en normal comme en hardcore et
     se débloque avec la précédente. La dernière d'un chapitre a un épilogue.
   Sauvegarde : Sauvegarde.donnees.campagne = { intros: { id: true }, missions: { id: { normal, hardcore } },
                meilleurs: { id: { normal: { temps, vies } } },   (meilleur temps et le plus de vies restantes)
                parfaites, chapitres: { n: true }, secrets: { tirAmi } }
   ========================================================================= */

const Campagne = (() => {
    const $c = id => document.getElementById(id);
    const S = () => Sauvegarde.donnees.campagne;
    const mission = id => MISSIONS_CAMPAGNE.find(m => m.id === id);

    /* ---------- Progression ---------- */
    const reussie = (id, mode) => Boolean(S().missions[id] && S().missions[id][mode]);
    const reussieUneFois = id => reussie(id, 'normal') || reussie(id, 'hardcore');
    // Une mission se débloque en réussissant la précédente (dans n'importe quelle difficulté)
    const debloquee = id => { const i = MISSIONS_CAMPAGNE.findIndex(m => m.id === id); return i <= 0 || reussieUneFois(MISSIONS_CAMPAGNE[i - 1].id); };
    // Ancienne sauvegarde : « introVue » valait pour l'intro de la première mission
    const introVue = id => Boolean((S().intros && S().intros[id]) || (id === 'c1m1' && S().introVue));
    // Étape du camp : il grandit avec la campagne (1 : palissade et tour de guet, après « La Brèche » ;
    // 2 : la tente de Brutus, après « La Débandade »)
    const etape = () => (reussieUneFois('c2m1') ? 2 : reussieUneFois('c1m4') ? 1 : 0);

    /* ---------- Mission en cours ----------
       Les objectifs : « objectif » (nombre de zombies à repousser), « camion »
       (un camion à escorter jusqu'au camp), « chantier » (tenir pendant une
       réparation, qui s'arrête quand un zombie est trop près), « boss » (une
       horde, puis le boss) ; « boxe » remplace toute la partie (boxe.js). */
    let m = null, chrono = 0, tues = 0, fini = false, camion = null, chantier = null, phaseBoss = false, moteurCamion = null;
    let dits = 0, finale = null;   // répliques déjà dites pendant la vague ; arrivée de Brutus (fin de « La Débandade »)

    // Camion : sa caisse dans le sprite 128×128 (x 6..122, y 54..120), et l'arrière où les zombies s'agrippent
    const CAISSE = { x: 6, y: 54, l: 116, h: 66 }, ARRIERE = 96;

    function demarrer() {
        m = mission(etat.mission);
        chrono = 1.5;          // un court répit avant le premier zombie
        tues = 0;
        fini = false;
        etat.victoire = false;
        camion = null;
        chantier = m.chantier ? { avance: 0, arret: false } : null;
        phaseBoss = false;
        dits = 0;
        finale = null;
        if (m.camion) {
            const c = m.camion;
            camion = { x: MONDE.largeur + 30, y: c.y, pv: c.pv[etat.mode], pvMax: c.pv[etat.mode], vitesse: (MONDE.largeur + 170) / c.duree[etat.mode], depart: c.depart, detruit: false };
            moteurCamion = Son.moteur();   // on l'entend arriver avant de le voir
        }
        $c('hud-mission').classList.remove('hidden');
        maj_hud_mission();
        // Un combat de boxe (boxe.js) : pas d'objectif à afficher, la vie des deux boxeurs suffit
        if (m.boxe) { $c('hud-mission').classList.add('hidden'); Boxe.demarrer(m.boxe[etat.mode]); }
        // Deux lignes : le numéro, puis le titre (un long titre tient même sur un petit téléphone)
        bandeau(T('MISSION {n}', { n: m.numero }) + '\n' + T(m.titre).toUpperCase());
        // Une mission racontée (un souvenir) : le narrateur pose le décor, après le bandeau
        const mi = m;
        // (pour un combat de boxe : la présentation, puis la cloche)
        const go = () => { if (mi.boxe && m === mi) Boxe.commencer(); };
        if (m.debut) setTimeout(() => { if (m === mi && etat.enCours && !fini) dire_epilogue(mi.debut, 0, go); }, 1700);
        else if (m.boxe) setTimeout(go, 1700);
    }

    // Bandeau animé au centre de l'écran (le même que pour les vagues, en plus petit)
    function bandeau(texte) {
        const b = $c('bandeau-vague');
        b.textContent = texte;
        b.classList.remove('hidden', 'anime');
        b.classList.add('bandeau-mission');
        void b.offsetWidth;   // relance l'animation
        b.classList.add('anime');
    }

    function arreter() {
        m = null;
        if (typeof Boxe !== 'undefined') Boxe.arreter();
        camion = null;
        if (moteurCamion) { moteurCamion.arreter(); moteurCamion = null; }
        chantier = null;
        $c('hud-mission').classList.add('hidden');
        $c('bandeau-vague').classList.remove('bandeau-mission');
    }

    const objectif = () => (m.boss ? m.boss.avant[etat.mode] : m.objectif[etat.mode]);
    function maj_hud_mission() {
        if (!m) return;
        if (camion) {
            // Camion : son état et le chemin parcouru jusqu'au camp
            const parcours = Math.round(100 * Math.min(1, Math.max(0, (MONDE.largeur + 30 - camion.x) / (MONDE.largeur + 170))));
            $c('hud-mission').textContent = T('🚚 {pv} % · ➜ {n} %', { pv: Math.max(0, Math.ceil(100 * camion.pv / camion.pvMax)), n: parcours });
            return;
        }
        if (m.boss) {
            // Pendant le combat, sa barre de vie en haut de l'écran suffit (et la barre du haut ne déborde pas)
            $c('hud-mission').classList.toggle('hidden', phaseBoss);
            $c('hud-mission').textContent = '🎯 ' + Math.min(tues, m.boss.avant[etat.mode]) + ' / ' + m.boss.avant[etat.mode];
            return;
        }
        if (chantier) {
            $c('hud-mission').textContent = T('🔨 Mur : {n} %', { n: Math.floor(100 * chantier.avance) }) + (chantier.arret ? ' ' + T('⏸ à l\'abri !') : '');
            return;
        }
        $c('hud-mission').textContent = '🎯 ' + Math.min(tues, objectif()) + ' / ' + objectif();
    }

    // Appelée à chaque image à la place des apparitions du mode classique (zombie.js)
    function maj(dt) {
        if (!m || fini) return;
        if (finale) return maj_finale(dt);   // la vague est finie : Brutus arrive, plus personne n'apparaît
        if (camion) maj_camion(dt);
        if (chantier) maj_chantier(dt);
        // Elle a traversé l'écran sans tomber : elle est dans le camp
        if (phaseBoss && !boss) return terminer(false);
        if (fini) return;
        const a = m.apparition[etat.mode];
        chrono -= phaseBoss ? dt / m.boss.ralenti[etat.mode] : dt;
        if (chrono > 0) return;
        if (a.max && zombies.length >= a.max) return;   // il attend qu'une place se libère
        chrono = Math.max(a.min, a.depart - etat.temps * a.acceleration);
        apparaitre(a);
        // Ils arrivent parfois par deux
        if (Math.random() < a.groupe && (!a.max || zombies.length < a.max)) apparaitre(a);
    }

    // Un zombie, ou une espèce selon sa part (« a.tank », « a.joggeur »…) ; pendant une escorte, certains visent le camion
    function apparaitre(a) {
        const r = Math.random();
        // Les types spéciaux (part de chaque apparition), sinon un zombie normal
        let cumul = 0, type = 'normal';
        for (const t of ['tank', 'joggeur', 'infirmier', 'emeute', 'pondeuse']) { cumul += a[t] || 0; if (r < cumul) { type = t; break; } }
        const z = creer_zombie(type, MONDE.largeur, MONDE.hauteur);
        if (a.panique) z.vitesse *= a.panique;   // ils fuient quelque chose : ils courent plus vite
        if (!camion) return;
        // Jamais directement sur le camion (quand il entre par la droite) : on le fait apparaître au-dessus
        const by = camion.y + CAISSE.y;
        if (z.x < camion.x + CAISSE.x + CAISSE.l + 40 && z.y + 60 > by && z.y + 20 < by + CAISSE.h) z.y = Math.max(CONFIG.margeHaut, by - 70);
        if (z.type === 'tank' || Math.random() < (a.versCamion || 0)) z.versCamion = true;
    }

    /* Le camion roule vers le camp. Les zombies qui l'attrapent s'agrippent à
       l'arrière et l'abîment tant qu'on ne les abat pas ; ceux qui le visent
       glissent vers sa voie. */
    function maj_camion(dt) {
        if (etat.temps >= camion.depart) camion.x -= camion.vitesse * dt;
        const bx = camion.x + CAISSE.x, by = camion.y + CAISSE.y;
        const voie = camion.y + CAISSE.y + CAISSE.h / 2 - 40;   // y d'un zombie qui marche contre le camion
        for (const z of zombies) {
            if (z.versCamion && !z.surCamion && z.x > camion.x + ARRIERE) z.y += Math.sign(voie - z.y) * Math.min(Math.abs(voie - z.y), 45 * dt);
            const touche = z.x + 16 < bx + CAISSE.l && z.x + 48 > bx && z.y + 20 < by + CAISSE.h && z.y + 60 > by;
            if (touche) z.surCamion = true;
            if (z.surCamion) {
                z.x = camion.x + ARRIERE;                  // agrippé à l'arrière, il suit le camion (sans trembler)
                camion.pv -= (z.type === 'tank' ? m.camion.degatsTank : m.camion.degats) * dt;
            }
        }
        maj_hud_mission();
        if (camion.pv <= 0) {
            camion.detruit = true;
            if (moteurCamion) { moteurCamion.arreter(0.1); moteurCamion = null; }
            Son.effet('explosion');
            secouer_ecran(4);
            return terminer(false);
        }
        if (camion.x + CAISSE.x + CAISSE.l < 0) return terminer(true);   // arrivé au camp
    }

    /* Le chantier avance tant qu'aucun zombie n'est près du mur ; sinon les
       réparateurs se mettent à l'abri et tout s'arrête. */
    function maj_chantier(dt) {
        const seuil = m.chantier.seuil * MONDE.echelleX;
        const arret = zombies.some(z => z.x < seuil);
        if (arret !== chantier.arret) { chantier.arret = arret; maj_hud_mission(); }
        if (arret) return;
        const avant = Math.floor(100 * chantier.avance);
        chantier.avance = Math.min(1, chantier.avance + dt / m.chantier.duree[etat.mode]);
        if (Math.floor(100 * chantier.avance) !== avant) maj_hud_mission();
        if (chantier.avance >= 1) terminer(true);
    }

    // Un zombie est tombé : objectif atteint ?
    function tue(z) {
        if (!m || fini || camion || chantier) return;
        if (m.boss) {
            if (phaseBoss) { if (z && est_boss(z.type)) terminer(true); return; }
            tues++;
            maj_hud_mission();
            dire_pendant();
            if (tues >= m.boss.avant[etat.mode]) {
                // La horde est repoussée… et elle arrive
                phaseBoss = true;
                faire_apparaitre_boss(MONDE.largeur, MONDE.hauteur, m.boss.type);
                bandeau(T(m.boss.bandeau || 'ELLE ARRIVE…'));
                maj_hud_mission();
            }
            return;
        }
        if (finale) return;
        tues++;
        maj_hud_mission();
        dire_pendant();
        if (tues < objectif()) return;
        if (m.brutus) lancer_finale(); else terminer(true);
    }

    // Ce qu'on entend pendant la vague (à une fraction de l'objectif, ou de la horde avant le boss)
    function dire_pendant() {
        const pendant = m.pendant || [];
        if (dits < pendant.length && tues >= pendant[dits].a * objectif() && typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) {
            const l = pendant[dits++];
            Instructeur.parler(T(l.texte), T('Compris !'), null, l.qui);
        }
    }

    /* Fin de « La Débandade » : Brutus sort de la poussière, du côté d'où venait
       la horde, et cogne les derniers zombies au passage. Quand il arrive près du
       Soldat (ou qu'il n'y a plus personne devant lui), les retrouvailles. */
    function lancer_finale() {
        finale = { x: MONDE.largeur + 30, y: Math.max(CONFIG.margeHaut, Math.min(MONDE.hauteur - CONFIG.margeBas, joueur.y)), image: 0, chrono: 0, coup: 0, parle: false,
            averti: false, touches: 0, cri: '', criT: 0, secoue: 0, mort: false };   // tir ami (fin secrète)
        $c('hud-mission').classList.add('hidden');
        bandeau(T('QUELQUE CHOSE ARRIVE…'));
        Son.effet('grognementTank');
    }
    function maj_finale(dt) {
        const f = finale;
        f.criT = Math.max(0, f.criT - dt);
        f.secoue = Math.max(0, f.secoue - dt);
        if (f.parle) return;
        f.x -= (f.averti ? 35 : 70) * MONDE.echelleX * dt;   // touché une fois, il avance prudemment
        f.chrono += dt;
        if (f.chrono > 0.16) { f.chrono = 0; f.image = (f.image + 1) % 4; }
        f.coup = Math.max(0, f.coup - dt);
        // Il cogne ceux qu'il rattrape
        for (const z of zombies.slice()) if (z.x > f.x - 40 && z.x < f.x + 40 && !est_boss(z.type)) {
            toucher_zombie(z, 99);
            f.coup = 0.2;
            Son.effet('impactTerre');
            secouer_ecran(1);
        }
        // Il marche toujours jusqu'au milieu : ça laisse quelques secondes pour le voir arriver… et pour le tir ami
        const arrive = f.x < MONDE.largeur * 0.5;
        if (!arrive) return;
        f.parle = true;
        zombies.length = 0;
        // S'il a pris des balles (après l'avertissement), il le fait remarquer
        let lignes = m.brutus;
        if (f.averti && m.tirAmi) {
            const n = f.touches + 1;
            const touche = m.tirAmi.touche.map(l => ({ ...l, vars: { n } }));
            lignes = [...lignes.slice(0, 5), ...touche, ...lignes.slice(5)];   // après « Ne m'appelle pas comme ça. »
        }
        if (typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) dire_epilogue(lignes, 0, () => terminer(true));
        else terminer(true);
    }

    /* Tir ami : une balle du Soldat touche Brutus pendant qu'il arrive. La
       première déclenche l'avertissement (le jeu se fige, on lâche forcément la
       détente) ; ensuite, 5 balles de plus et c'est la fin secrète. */
    function balle_sur_brutus(r) {
        const f = finale;
        if (!f || f.parle || f.mort || !m || !m.tirAmi) return false;
        const touche = r.x < f.x + 48 && r.x + r.largeur > f.x + 16 && r.y < f.y + 60 && r.y + r.hauteur > f.y + 8;
        if (!touche) return false;
        f.secoue = 0.15;
        Son.effet('degat');
        if (!f.averti) {
            f.averti = true;
            if (typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) dire_epilogue(m.tirAmi.avertissement, 0, () => {});
            return true;
        }
        f.touches++;
        f.cri = m.tirAmi.cris[Math.min(f.touches, m.tirAmi.cris.length) - 1];
        f.criT = 1.4;
        if (f.touches >= 5) fin_secrete();
        return true;
    }
    function fin_secrete() {
        const f = finale;
        f.mort = true;
        f.parle = true;
        f.cri = '';
        zombies.length = 0;
        Son.effet('mort');
        secouer_ecran(3);
        const conclure = () => {
            fini = true;
            etat.victoire = false;
            etat.finSecrete = true;
            S().secrets = { ...(S().secrets || {}), tirAmi: true };
            Sauvegarde.sauver();
            if (typeof Succes !== 'undefined') Succes.verifier();   // succès secret
            game_over();
        };
        if (typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) setTimeout(() => dire_epilogue(m.tirAmi.fin, 0, conclure), 900);
        else conclure();
    }
    // Brutus, tourné vers le Soldat (le dessin est retourné), qui marche ou qui cogne
    function dessiner_brutus(ctx) {
        if (!finale) return;
        const sprites = Loot.sprites('brute');
        const img = finale.coup > 0 ? sprites.tir : finale.parle ? sprites.arret : sprites.marche[finale.image];
        const sx = finale.secoue > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
        ctx.save();
        ctx.translate(Math.round(finale.x) + 64 + sx, Math.round(finale.y));
        ctx.scale(-1, 1);
        if (finale.mort) { ctx.translate(32, 64); ctx.rotate(-Math.PI / 2); ctx.translate(-32, -64); }   // il tombe en arrière
        ctx.drawImage(img, 0, 0, 64, 64);
        ctx.restore();
        if (finale.criT > 0 && finale.cri) {
            // Le cri au-dessus de sa tête, écrit à l'endroit même quand l'écran est en miroir
            const e = MONDE.echelle, cx = (finale.x + 32) * e;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = 'bold ' + Math.round(11 * e) + 'px monospace';
            ctx.textAlign = 'center';
            ctx.lineWidth = Math.max(2, 3 * e);
            ctx.strokeStyle = '#000';
            ctx.fillStyle = '#fff';
            const demi = ctx.measureText(T(finale.cri)).width / 2 + 4;   // le cri reste dans l'écran
            const x = Math.max(demi, Math.min(ctx.canvas.width - demi, m && m.miroir ? ctx.canvas.width - cx : cx)), y = MONDE.decalageY + (finale.y - 6) * e;
            ctx.strokeText(T(finale.cri), x, y);
            ctx.fillText(T(finale.cri), x, y);
            ctx.restore();
        }
    }

    // Fin de mission : les zombies restants s'enfuient (victoire), le Sergent fait le point
    function terminer(victoire) {
        fini = true;
        etat.victoire = victoire;
        if (victoire) {
            Son.effet('fanfare');
            zombies.length = 0;
            if (typeof dessiner === 'function') dessiner();   // l'image figée montre le terrain dégagé
        }
        const fin = () => game_over();
        const texte = victoire ? m.debrief[etat.mode] : m.echec;
        // Dernière mission d'un chapitre, réussie pour la première fois : l'épilogue suit le débriefing
        const epilogue = victoire && !chapitre_fini(m.chapitre) && derniere_du_chapitre(m) ? EPILOGUES[m.chapitre] : null;
        etat.finChapitre = Boolean(epilogue);
        const suite = epilogue ? () => dire_epilogue(epilogue, 0, fin) : fin;
        if (texte && typeof Instructeur !== 'undefined' && document.getElementById('instructeur'))
            Instructeur.parler(T(texte), T(victoire ? 'Mission accomplie !' : (m.echecBouton || 'Compris, sergent…')), suite, m.debriefQui || 'sergent', 1000);   // impossible à passer pendant 1 s
        else fin();
    }

    // Les répliques de l'épilogue, une par une, sur le terrain figé
    function dire_epilogue(lignes, i, ensuite) {
        const l = lignes[i];
        if (!l) return ensuite();
        Instructeur.parler(T(l.texte, l.vars), T(l.bouton || 'Suite ▶'), () => dire_epilogue(lignes, i + 1, ensuite), l.qui);
    }
    const chapitre_fini = n => Boolean(S().chapitres && S().chapitres[n]);
    function derniere_du_chapitre(mi) {
        const du_chapitre = MISSIONS_CAMPAGNE.filter(x => x.chapitre === mi.chapitre);
        return du_chapitre[du_chapitre.length - 1] === mi;
    }

    // Le camion et sa barre de vie (dessinés sous les zombies)
    function dessiner_sol(ctx) {
        dessiner_brutus(ctx);
        if (!camion || camion.detruit) return;
        const x = Math.round(camion.x), y = Math.round(camion.y);
        ctx.drawImage(OBJETS_CAMP.camion, x, y + (Math.floor(etat.temps * 8) % 2));   // le moteur fait vibrer la caisse
        const part = Math.max(0, camion.pv / camion.pvMax);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x + 30, y + 44, 70, 6);
        ctx.fillStyle = part > 0.5 ? '#4ad060' : part > 0.25 ? '#e8c24a' : '#e83a3a';
        ctx.fillRect(x + 31, y + 45, Math.round(68 * part), 4);
    }

    /* La nuit pendant une mission : tout est noir sauf le faisceau de la lampe
       du Soldat et un halo autour de lui ; chaque tir éclaire le terrain un
       instant. Les yeux des zombies brillent dans le noir. */
    function dessiner_nuit(ctx) {
        if (!m || !m.nuit) return;
        const x = joueur.x + CONFIG.canon.x, y = joueur.y + CONFIG.canon.y;
        const lumieres = [
            { cone: true, x, y, longueur: MONDE.largeur * 0.62, angle: 0.34, force: 1 },
            { x: joueur.x + 32, y: joueur.y + 34, r: 70, force: 0.85 }
        ];
        if (joueur.animTir > 0) lumieres.push({ x: x + 30, y, r: 260, force: 0.55 });   // éclair du coup de feu
        // Les néons du quai qui grésillent encore (mission dans le métro)
        if (m.neons) {
            const t = etat.temps;
            m.neons.forEach(([fx, ny], i) => {
                const panne = Math.sin(t * (3 + i) + i * 7) + Math.sin(t * 11.3 + i * 2) > 1.5;   // il saute de temps en temps
                if (!panne) lumieres.push({ x: fx * MONDE.largeur, y: ny, r: 58, force: 0.55 });
            });
        }
        // Un Infirmier qui soigne : la lueur de ses soins le trahit
        for (const z of zombies) if (z.type === 'infirmier' && z.soin && z.soin.anim > 0) lumieres.push({ x: z.x + z.taille / 2, y: z.y + z.taille / 2, r: 90, force: 0.7 });
        // Nuit noire : hors de la lampe, on ne voit que les yeux
        nuit(ctx, MONDE.largeur, MONDE.hauteur, lumieres, 0.985);
        ctx.fillStyle = '#ffe070';
        for (const z of zombies) for (const [ex, ey] of yeux(z)) ctx.fillRect(Math.round(z.x + ex), Math.round(z.y + ey), 2, 2);
        // La croix rouge de l'Infirmier (sur sa coiffe) se voit dans le noir : on sait qui viser en premier
        ctx.fillStyle = '#ff4040';
        for (const z of zombies) if (z.type === 'infirmier') {
            const cx = Math.round(z.x + 28), cy = Math.round(z.y + 5);
            ctx.fillRect(cx - 1, cy - 3, 2, 6); ctx.fillRect(cx - 3, cy - 1, 6, 2);
        }
        ctx.fillStyle = '#ffe070';
    }

    /* Où briller dans le noir : les yeux de chaque sprite (en pixels du sprite, coin haut
       gauche). Le zombie et le Tank sont de face (deux yeux) ; les sprites générés sont de
       profil, tournés vers la gauche (un seul œil, là où leur sprite le dessine). */
    function yeux(z) {
        const t = z.taille;
        switch (z.type) {
            case 'joggeur': {
                const e = z.joggeur && z.joggeur.etat;
                return e === 'course' || e === 'cri' ? [[17, 14]] : e === 'essouffle' ? [[16, 29]] : [[23, 12]];
            }
            case 'infirmier': return [[24, 11]];
            case 'emeute': return [[25, 14]];
            case 'pondeuse': return [[25, 15]];
            case 'larve': return [[7, 28]];
            default: return [[t * 0.42, t * 0.08], [t * 0.42 + 4, t * 0.08]];
        }
    }

    // Meilleur temps (le plus court) et le plus de vies restantes, par mission et par difficulté.
    // Renvoie ce qui a été battu (rien la toute première fois : il n'y avait pas de record à battre).
    const duree = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    function noter_record(id) {
        S().meilleurs ??= {};
        const tous = S().meilleurs[id] ??= {};
        const avant = tous[etat.mode], temps = Math.floor(etat.temps), vies = etat.vies, battus = [];
        if (avant && temps < avant.temps) battus.push(T('temps (avant : {n})', { n: duree(avant.temps) }));
        if (avant && vies > avant.vies) battus.push(T('vies (avant : {n})', { n: avant.vies }));
        tous[etat.mode] = { temps: avant ? Math.min(avant.temps, temps) : temps, vies: avant ? Math.max(avant.vies, vies) : vies };
        return battus;
    }

    // Écran de fin d'une mission (appelé par game_over) : victoire ou échec, et sauvegarde
    function fin() {
        const id = etat.mission, mi = mission(id);
        let records = [];
        if (etat.victoire) {
            S().missions[id] = { ...(S().missions[id] || {}), [etat.mode]: true };
            if (!etat.viesPerdues) S().parfaites = { ...(S().parfaites || {}), [id]: true };   // sans perdre une vie
            if (etat.finChapitre) S().chapitres = { ...(S().chapitres || {}), [mi.chapitre]: true };
            records = noter_record(id);
            Sauvegarde.sauver();
            if (typeof Succes !== 'undefined') Succes.verifier();   // succès de campagne
        }
        $c('bilan-records').textContent = records.length ? T('🏅 Record de la mission : {liste} !', { liste: records.join(T(' et ')) }) : '';
        const carte = document.querySelector('#game-over-overlay .mission-card');
        carte.querySelector('h2').textContent = etat.finChapitre ? T('CHAPITRE {n} TERMINÉ', { n: mi.chapitre })
            : etat.victoire ? T('MISSION ACCOMPLIE') : T('MISSION ÉCHOUÉE');
        carte.querySelector('.game-over-text').textContent = etat.finChapitre
            ? T('Fin du chapitre {n}. La suite de l\'histoire arrive bientôt…', { n: mi.chapitre })
            : mi.texteFin
            ? T(etat.victoire ? mi.texteFin.victoire : mi.texteFin.echec)      // une mission qui ne se passe pas au camp
            : etat.victoire
            ? T('Le camp tient. Le labo aussi. Pour l\'instant.')
            : (mi.camion && etat.vies > 0)
                ? T('Le camion n\'est jamais arrivé. Le labo attendra ses échantillons. Le Sergent, son café.')
                : (mi.boss && etat.vies > 0)
                    ? T('Elle est entrée dans le camp. Elle te cherche toujours. Le Sergent s\'est caché dans la jeep.')
                    : T('Le camp est tombé. Le labo avec. Le Sergent va être de très mauvaise humeur.');
        carte.classList.toggle('victoire', etat.victoire);
        carte.classList.toggle('secrete', Boolean(etat.finSecrete));
        if (etat.finSecrete) {
            carte.querySelector('h2').textContent = T('FIN SECRÈTE : TIR AMI');
            carte.querySelector('.game-over-text').textContent = T('Ça ne compte pas : Brutus va bien. Enfin, il ira bien.');
        }
        $c('btn-retry').firstChild.textContent = etat.victoire ? T('REJOUER') + ' ' : T('RÉESSAYER') + ' ';
        // Victoire : on enchaîne directement sur la mission suivante (avec son intro la première fois)
        const suivante = MISSIONS_CAMPAGNE[MISSIONS_CAMPAGNE.findIndex(x => x.id === id) + 1];
        $c('btn-mission-suivante').classList.toggle('hidden', !(etat.victoire && suivante));
        $c('btn-mission-suivante').dataset.mission = suivante ? suivante.id : '';
        $c('btn-retour-campagne').classList.remove('hidden');   // retour direct à la liste des missions
    }

    /* ---------- Lancer une mission (avec son intro la première fois) ---------- */
    function lancer(id) {
        const mi = mission(id);
        cacher_ecrans();
        if (!introVue(id) && SCENES_CAMPAGNE[id]) return intro(id, () => lancer(id));
        afficher(ecrans.menu, false);
        afficher(ecrans.jeu, true);
        init_game(difficulte_choisie, mi.perso, false, 'campagne', id);
    }

    function cacher_ecrans() {
        for (const e of ['choix-variante', 'campagne-overlay']) $c(e).classList.add('hidden');
    }

    /* ---------- Scène d'intro, dans le camp ---------- */
    let scene = null;

    // lignes : d'autres répliques que celles de l'intro, dans le même décor (l'outro)
    function intro(id, ensuite, lignes = null) {
        cacher_ecrans();
        afficher(ecrans.menu, false);
        afficher(ecrans.jeu, true);
        $c('scene-campagne').classList.remove('hidden');
        $c('btn-passer-intro').textContent = T(lignes ? 'Passer ▶' : 'Passer l\'intro ▶');
        $c('btn-passer-intro').classList.remove('hidden');
        Son.jouerAmbiance('menu');   // la musique du camp, même en enchaînant depuis l'écran de fin
        $c('instructeur').classList.add('dans-scene');
        $c('game-container').classList.add('en-scene');   // pas de commandes de jeu pendant l'intro
        const cfg = lignes ? { ...SCENES_CAMPAGNE[id], lignes } : SCENES_CAMPAGNE[id];
        scene = { id, cfg, debut: performance.now(), ligne: -1, secousse: 0, sirene: 0, ensuite };
        // La jeep qui arrive : on entend son moteur, qui s'arrête quand elle se gare
        if (cfg.jeep) { scene.moteur = Son.moteur(0.8); setTimeout(() => { if (scene && scene.moteur) scene.moteur.arreter(0.6); }, 2300); }
        requestAnimationFrame(dessiner_scene);
        setTimeout(() => { if (scene && scene.id === id) dire(0); }, cfg.attente);
    }

    function dire(i) {
        if (!scene) return;
        const l = scene.cfg.lignes[i];
        if (!l) return terminer_intro();
        scene.ligne = i;
        if (l.action === 'coup') { scene.secousse = performance.now(); Son.effet('impactTerre'); }
        if (l.action === 'sirene') { scene.sirene = performance.now(); sirene(); }
        const qui = l.qui === 'sergent' && scene.cfg.sergent.pyjama ? 'sergentPyjama' : l.qui;
        Instructeur.parler(T(l.texte), T(l.bouton || 'Suite ▶'), () => dire(i + 1), qui);
    }

    function terminer_intro() {
        if (!scene) return;
        const { ensuite, id } = scene;
        if (scene.moteur) scene.moteur.arreter(0.2);
        scene = null;
        Instructeur.cacher();
        $c('scene-campagne').classList.add('hidden');
        $c('btn-passer-intro').classList.add('hidden');
        $c('instructeur').classList.remove('dans-scene');
        $c('game-container').classList.remove('en-scene');
        S().intros = { ...(S().intros || {}), [id]: true };
        Sauvegarde.sauver();
        if (ensuite) ensuite();
    }

    // Sirène d'alerte : trois montées et descentes
    function sirene() {
        for (let k = 0; k < 3; k++) {
            Son.ton(520, k * 1.4, 0.7, { type: 'sawtooth', vol: 0.05, f2: 900 });
            Son.ton(900, k * 1.4 + 0.7, 0.7, { type: 'sawtooth', vol: 0.05, f2: 520 });
        }
    }

    /* La brèche : le mur éventré là où le camion est passé, des sacs éparpillés,
       et le camion garé de travers… sur le feu de camp. */
    function dessiner_breche(c) {
        const B = CAMP.bord, sacs = [[B - 40, 300], [B - 52, 318], [B + 18, 296], [B + 24, 330], [B - 30, 342], [B + 6, 352]];
        c.fillStyle = '#b28456'; c.fillRect(B - 18, 286, 34, 74);
        c.fillStyle = 'rgba(126, 86, 52, 0.5)';
        for (let y = 290; y < 356; y += 6) c.fillRect(B - 16 + (y % 12), y, 3, 2);
        for (const [x, y] of sacs) {
            c.fillStyle = 'rgba(90, 52, 32, 0.3)'; c.fillRect(x + 3, y + 4, 12, 3);
            c.fillStyle = '#b9a578'; c.fillRect(x, y, 12, 6);
            c.fillStyle = '#d6c49a'; c.fillRect(x, y, 12, 1);
            c.fillStyle = '#8a7a54'; c.fillRect(x, y + 5, 12, 1);
        }
        c.save();
        c.translate(CAMP.feu.x - 70, CAMP.feu.y - 92);
        c.rotate(-0.06);
        c.drawImage(OBJETS_CAMP.camion, 0, 0);
        c.restore();
        // Un filet de fumée : le feu n'a pas apprécié
        c.fillStyle = 'rgba(160, 160, 160, 0.5)';
        const t = performance.now() / 1000;
        for (let k = 0; k < 4; k++) c.fillRect(Math.round(CAMP.feu.x + 30 + Math.sin(t * 2 + k) * 3), Math.round(CAMP.feu.y - 30 - ((t * 12 + k * 9) % 36)), 3, 3);
    }

    function dessiner_scene(instant) {
        if (!scene) return;
        requestAnimationFrame(dessiner_scene);   // en premier : une image ratée n'arrête pas la scène
        const toile = $c('scene-toile'), c = toile.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        if (toile.width !== Math.round(toile.clientWidth * dpr)) { toile.width = Math.round(toile.clientWidth * dpr); toile.height = Math.round(toile.clientHeight * dpr); }
        if (!toile.width || !toile.height) return;   // fenêtre réduite ou cachée
        const cfg = scene.cfg;
        // Caméra : on se rapproche du camp (on voit 300 de haut, à partir de y = cfg.camera ou 40).
        // Écran en hauteur (téléphone) : le camp entier tient dans la largeur, en haut de l'écran,
        // et la boîte de dialogue se met en dessous.
        const portrait = toile.height > toile.width;
        const echelle = portrait ? toile.width / (CAMP.bord + 30) : toile.height / 300;
        const L = Math.max(toile.width / echelle, CAMP.bord + 40), haut = portrait ? (cfg.camera ?? 40) - 10 : cfg.camera ?? 40;
        const t = (instant - scene.debut) / 1000;
        let sx = 0, sy = 0;
        if (scene.secousse && instant - scene.secousse < 350) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.fillStyle = '#000';
        c.fillRect(0, 0, toile.width, toile.height);   // sous le monde (écran en hauteur) : du noir
        c.setTransform(echelle, 0, 0, echelle, sx * echelle, (sy - haut) * echelle);
        c.imageSmoothingEnabled = false;
        c.drawImage(decor_camp(L, 400, etape()), 0, 0);
        if (cfg.breche) dessiner_breche(c);
        else dessiner_feu(c, t);

        // La jeep : elle arrive par la gauche et se gare (chapitre 1), ou elle est déjà là
        if (cfg.jeep) {
            const arrivee = Math.min(1, t / 2.4), ease = 1 - Math.pow(1 - arrivee, 3);
            const jx = -110 + (CAMP.jeep.x + 110) * ease;
            c.drawImage(OBJETS_CAMP.jeep, Math.round(jx), CAMP.jeep.y + (arrivee < 1 ? Math.round(Math.sin(t * 30)) : 0));
        } else c.drawImage(OBJETS_CAMP.jeep, CAMP.jeep.x, CAMP.jeep.y);

        // Le Sergent (il bouge la bouche quand il parle ; il peut sortir de sa tente)
        const ligne = cfg.lignes[scene.ligne];
        const parle = ligne && ligne.qui === 'sergent' && Instructeur.parleEncore() && Math.floor(instant / 130) % 2;
        const sg = cfg.sergent, images = sg.pyjama ? SPRITES_SERGENT.pyjama : SPRITES_SERGENT;
        const sortie = sg.sortDe !== undefined ? Math.min(1, t / 1.2) : 1;
        const sgx = sg.sortDe !== undefined ? Math.round(sg.sortDe + (sg.x - sg.sortDe) * sortie) : sg.x;
        // Il trottine en sortant de sa tente ; sinon il respire et fume (camp_decor.js)
        if (sortie < 1) c.drawImage(images[parle ? 1 : 0], sgx, sg.y + Math.round(Math.abs(Math.sin(t * 12))));
        else dessiner_sergent(c, sgx, sg.y, t, images, parle);
        // Le voyant du labo s'allume quand le labo parle
        if (ligne && ligne.qui === 'labo' && Math.floor(instant / 200) % 2) c.drawImage(PORTE_LABO.campAllume, CAMP.labo.x, CAMP.labo.y);
        // Le Soldat (avec sa tenue équipée)
        if (t > (cfg.soldat.apparait || 0)) {
            c.save();
            const filtre = Loot.filtre('soldat', t);
            if (filtre) c.filter = filtre;
            // Il change d'appui de temps en temps (un pixel), à un autre rythme que le Sergent
            const appui = Math.sin(t * 0.9) > 0.6 ? 1 : 0;
            c.drawImage(Loot.sprites('soldat').arret, cfg.soldat.x + appui, cfg.soldat.y + Math.round((Math.sin(t * 1.7 + 1) + 1) / 2), 64, 64);
            c.restore();
        }
        // Brutus au coin du feu, tourné vers les autres (il parle avec les mains : il se balance)
        if (cfg.brutus) {
            const parleB = ligne && ligne.qui === 'brutus' && Instructeur.parleEncore();
            c.save();
            c.translate(cfg.brutus.x + 64, cfg.brutus.y + (parleB ? Math.round(Math.abs(Math.sin(t * 8))) : Math.round((Math.sin(t * 1.3) + 1) / 2)));
            c.scale(-1, 1);
            c.drawImage(Loot.sprites('brute').arret, 0, 0, 64, 64);
            c.restore();
        }
        // La personne du labo, sortie pour l'occasion (le reflet du feu dans ses lunettes)
        if (cfg.chercheur) {
            const parleC = ligne && ligne.qui === 'chercheur' && Instructeur.parleEncore() && Math.floor(instant / 160) % 2;
            c.drawImage(SPRITES_CHERCHEUR[parleC ? 1 : 0], cfg.chercheur.x, cfg.chercheur.y + Math.round((Math.sin(t * 1.1 + 2) + 1) / 2));
        }
        // La nuit : seul le feu éclaire (il vacille), et un peu le voyant du labo
        // Une lanterne devant la tente de Brutus (sinon on ne la verrait pas, la nuit)
        if (cfg.lanterne) {
            const { x, y } = cfg.lanterne;
            c.fillStyle = '#2a2a2a'; c.fillRect(x, y - 6, 1, 3); c.fillRect(x - 2, y - 3, 5, 1);
            c.fillStyle = Math.sin(t * 9) > -0.8 ? '#ffd060' : '#e0a040'; c.fillRect(x - 1, y - 2, 3, 4);
            c.fillStyle = '#2a2a2a'; c.fillRect(x - 2, y + 2, 5, 1);
        }
        if (cfg.nuit) {
            const vacille = 1 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13) * 0.03;
            const lumieres = [
                { x: CAMP.feu.x, y: CAMP.feu.y - 6, r: 110 * vacille, force: 0.95 },
                { x: CAMP.labo.x + 58, y: CAMP.labo.y + 6, r: 14, force: 0.6 }
            ];
            if (cfg.lanterne) lumieres.push({ x: cfg.lanterne.x, y: cfg.lanterne.y, r: 46 * vacille, force: 0.8 });
            nuit(c, L, 400, lumieres, 0.86);
        }
        // Sirène : l'écran clignote en rouge
        if (scene.sirene) {
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.fillStyle = `rgba(200, 0, 0, ${0.12 + 0.12 * Math.sin((instant - scene.sirene) / 120)})`;
            c.fillRect(0, 0, toile.width, toile.height);
        }
    }

    /* ---------- Écran de la campagne ---------- */
    function ouvrir() {
        cacher_ecrans();
        if (!introVue('c1m1')) return lancer('c1m1');   // toute première fois : on plonge dans l'histoire
        remplir_ecran();
        $c('campagne-overlay').classList.remove('hidden');
    }

    function revenir_ecran() { afficher(ecrans.jeu, false); afficher(ecrans.menu, true); ouvrir(); }

    /* L'outro d'une mission réussie, à revoir depuis l'écran de la campagne : les
       retrouvailles (« La Débandade »), le débriefing (dans une difficulté déjà réussie,
       celle choisie de préférence), et l'épilogue si c'est la fin d'un chapitre. */
    function lignes_outro(mi) {
        const mode = reussie(mi.id, difficulte_choisie) ? difficulte_choisie : reussie(mi.id, 'normal') ? 'normal' : 'hardcore';
        const lignes = [...(mi.brutus || [])];
        if (mi.debrief) lignes.push({ qui: mi.debriefQui || 'sergent', texte: mi.debrief[mode] });
        if (derniere_du_chapitre(mi) && EPILOGUES[mi.chapitre]) lignes.push(...EPILOGUES[mi.chapitre]);
        const fin = lignes[lignes.length - 1];
        lignes[lignes.length - 1] = { ...fin, bouton: fin.bouton || 'Fin ▶' };
        return lignes;
    }

    function remplir_ecran() {
        const liste = $c('campagne-liste');
        const el = (tag, classe, texte) => { const e = document.createElement(tag); if (classe) e.className = classe; if (texte !== undefined) e.textContent = texte; return e; };
        // La difficulté une seule fois, en haut (les boutons restent courts)
        const lignes = [el('p', 'campagne-difficulte', T('Difficulté : {d}', { d: T(difficulte_choisie === 'normal' ? 'Normal' : 'Hardcore') }))];
        let derniere = null;
        for (const ch of CHAPITRES) {
            lignes.push(el('p', 'campagne-chapitre', T('Chapitre {n} — {titre}', { n: ch.numero, titre: T(ch.titre) })));
            for (const mi of MISSIONS_CAMPAGNE.filter(x => x.chapitre === ch.numero)) {
                const ouverte = debloquee(mi.id);
                const ligne = el('div', 'campagne-ligne' + (ouverte ? '' : ' verrouillee'));
                const texte = el('span');
                const coche = mode => (reussie(mi.id, mode) ? '✔ ' : '✗ ') + T(mode === 'normal' ? 'Normal' : 'Hardcore');
                texte.append(el('strong', '', (mi.nuit ? '🌙 ' : '') + T('Mission {n} — {titre}', { n: mi.numero, titre: T(mi.titre) })),
                    el('small', '', ouverte
                        ? (mi.camion ? T('Escorter le camion jusqu\'au camp') : mi.chantier ? T('Couvrir la réparation du mur') : mi.boss ? T('Repousser la horde, puis l\'abattre') : T('Repousser {n} zombies', { n: mi.objectif[difficulte_choisie] })) + ' · ' + coche('normal') + ' · ' + coche('hardcore')
                        : T('🔒 Réussis la mission précédente pour la débloquer')));
                const record = S().meilleurs && S().meilleurs[mi.id] && S().meilleurs[mi.id][difficulte_choisie];
                if (record) texte.append(el('small', 'campagne-record', T('🏅 {temps} · ❤ {vies}', { temps: duree(record.temps), vies: record.vies })));
                ligne.append(texte);
                const boutons = el('span', 'campagne-boutons');
                if (ouverte && introVue(mi.id)) {
                    const revoir = el('button', '', '🎬');
                    revoir.title = T('Revoir l\'intro');
                    revoir.addEventListener('click', () => { Son.bouton(); intro(mi.id, revenir_ecran); });
                    boutons.append(revoir);
                }
                if (ouverte && reussieUneFois(mi.id)) {
                    const outro = el('button', '', '🏁');
                    outro.title = T('Revoir l\'outro');
                    outro.addEventListener('click', () => { Son.bouton(); intro(mi.id, revenir_ecran, lignes_outro(mi)); });
                    boutons.append(outro);
                }
                const jouer = el('button', ouverte ? 'campagne-jouer' : '', T('JOUER'));
                jouer.disabled = !ouverte;
                if (ouverte) jouer.addEventListener('click', () => { Son.bouton(); lancer(mi.id); });
                // La manette joue la dernière mission débloquée
                if (ouverte) { liste.dataset.derniere = mi.id; derniere = ligne; }
                boutons.append(jouer);
                ligne.append(boutons);
                lignes.push(ligne);
            }
        }
        liste.replaceChildren(...lignes);
        // La liste défile : on l'ouvre sur la dernière mission débloquée
        requestAnimationFrame(() => { if (derniere) liste.scrollTop = Math.max(0, derniere.offsetTop - liste.offsetTop - liste.clientHeight + derniere.offsetHeight + 8); });
    }

    // Objectif des succès de campagne : le nombre de missions du chapitre
    if (typeof SUCCES !== 'undefined') {
        const n1 = MISSIONS_CAMPAGNE.filter(x => x.chapitre === 1).length;
        for (const s of SUCCES) if (s.id === 'campagne_c1' || s.id === 'campagne_c1_hc') s.objectif = n1;
    }

    // Boutons (absents du simulateur : on vérifie qu'ils existent)
    if ($c('btn-campagne') && $c('btn-campagne').addEventListener) {
        $c('btn-campagne').addEventListener('click', () => { Son.bouton(); ouvrir(); });
        $c('btn-close-campagne').addEventListener('click', () => { Son.bouton(); $c('campagne-overlay').classList.add('hidden'); });
        $c('btn-passer-intro').addEventListener('click', () => { Son.bouton(); terminer_intro(); });
        $c('btn-retour-campagne').addEventListener('click', () => {
            Son.bouton();
            quitter_partie();
            retour_menu_principal();
            ouvrir();
        });
        $c('btn-mission-suivante').addEventListener('click', () => {
            Son.bouton();
            ui.gameOver.classList.add('hidden');
            lancer($c('btn-mission-suivante').dataset.mission);
        });
    }

    return { demarrer, arreter, maj, tue, fin, lancer, ouvrir, etape, dessiner_nuit, dessiner_sol, balle_sur_brutus, miroir: () => Boolean(m && m.miroir),
        decor: () => (!m || !m.decor ? null : m.decor === 'ville' ? decor_ville() : m.decor === 'metro' ? decor_metro() : m.decor === 'arene' ? decor_arene() : null),
        // Fin d'un combat de boxe (boxe.js) : comme la fin d'une vague
        fin_boxe: victoire => { if (m && !fini) terminer(victoire); } };
})();
