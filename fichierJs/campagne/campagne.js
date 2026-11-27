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
     (couvrir une réparation), « boss » (une horde, puis le boss), « boxe »
     (un combat de boxe, boxe.js) ou « charges » (le spécial pose des charges
     sur un pont, puis il saute). Elle peut avoir son décor (ville, métro,
     arène, pont), se jouer de nuit ou en miroir, et être racontée par Brutus
     (le chapitre 2 est son histoire). Le chapitre 3 est celui de Mira : son
     intro se passe loin du camp, à la caserne du génie. Elle se joue en normal comme en hardcore et
     se débloque avec la précédente. La dernière d'un chapitre a un épilogue.
   Sauvegarde : Sauvegarde.donnees.campagne = { intros: { id: true }, missions: { id: { normal, hardcore } },
                meilleurs: { id: { normal: { temps, vies } } },   (meilleur temps et le plus de vies restantes)
                parfaites, chapitres: { n: true }, secrets: { tirAmi } }
   ========================================================================= */

const Campagne = (() => {
    // Chaque réplique de la campagne reste à l'écran au moins 1 s avant de pouvoir être passée :
    // on tire avec Espace, on ne doit pas zapper un texte sans l'avoir vu
    const LECTURE = 1000;
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
    let soins = 0;                 // soins des Infirmiers pendant la mission (succès « Hôpital fermé »)
    let charges = null;            // « Mèche courte » : charges posées, en vol, compte à rebours, effondrement du pont
    let sousTitre = null;          // ce que dit un perso sans arrêter le jeu : { qui, texte, t }
    let partie = 0;                // numéro de la partie lancée : un minuteur d'une partie quittée ne joue pas dans la suivante
    const toujours = p => p === partie && m && etat.enCours;

    // Camion : sa caisse dans le sprite 128×128 (x 6..122, y 54..120), et l'arrière où les zombies s'agrippent
    const CAISSE = { x: 6, y: 54, l: 116, h: 66 }, ARRIERE = 96;

    function demarrer() {
        m = mission(etat.mission);
        partie++;
        chrono = 1.5;          // un court répit avant le premier zombie
        tues = 0;
        fini = false;
        etat.victoire = false;
        camion = null;
        chantier = m.chantier ? { avance: 0, arret: false } : null;
        phaseBoss = false;
        dits = 0;
        soins = 0;
        finale = null;
        charges = m.charges ? { posees: 0, vols: [], compte: null, effondre: 0, dit: false, eclats: [] } : null;
        sousTitre = null;
        if (m.camion) {
            const c = m.camion;
            camion = { x: MONDE.largeur + 30, y: c.y, pv: c.pv[etat.mode], pvMax: c.pv[etat.mode], vitesse: (MONDE.largeur + 170) / c.duree[etat.mode], depart: c.depart, detruit: false };
            moteurCamion = Son.moteur();   // on l'entend arriver avant de le voir
        }
        $c('hud-mission').classList.remove('hidden');
        maj_hud_mission();
        if (typeof maj_hud_pouvoir === 'function') maj_hud_pouvoir();   // la jauge suit la mission (charges)
        // Un combat de boxe (boxe.js) : pas d'objectif à afficher, la vie des deux boxeurs suffit
        if (m.boxe) { $c('hud-mission').classList.add('hidden'); Boxe.demarrer(m.boxe[etat.mode]); }
        // Deux lignes : le numéro, puis le titre (un long titre tient même sur un petit téléphone)
        bandeau(T('MISSION {n}', { n: m.numero }) + '\n' + T(m.titre).toUpperCase());
        // Une mission racontée (un souvenir) : le narrateur pose le décor, après le bandeau
        const mi = m, p = partie;
        // (pour un combat de boxe : la présentation, puis la cloche)
        const go = () => { if (mi.boxe && toujours(p)) Boxe.commencer(); };
        if (m.debut) setTimeout(() => { if (toujours(p) && !fini) dire_epilogue(mi.debut, 0, go); }, 1700);
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
        charges = null;
        sousTitre = null;
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
        if (charges) {
            $c('hud-mission').textContent = T('💣 Charges : {n} / {total}', { n: charges.posees, total: m.charges.nombre });
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
        if (sousTitre && (sousTitre.t += dt) > 4.5) sousTitre = null;
        if (charges && maj_charges(dt)) return;   // compte à rebours, puis le pont saute : plus personne n'apparaît
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

    /* ---------- « Mèche courte » : les charges sur le pont ----------
       Le spécial de Mira ne lance pas le Tapis de bombes : sa jauge (plus courte,
       m.charges.kills) envoie une charge qui vole jusqu'au parapet et s'y colle.
       À la dernière, le compte à rebours ; puis le pont saute, avec la horde. */
    function place_charge(i) {
        const [f, cote] = m.charges.places[i];
        const xG = PONT.riveG, xD = MONDE.largeur - PONT.riveD;
        // Sur la chaussée, au-dessus d'une pile (pas contre les parapets : la barre du haut et les sous-titres les cacheraient)
        return { x: xG + (xD - xG) * f, y: cote === 'haut' ? 112 : 292 };
    }
    // Pour pouvoirs.js : la jauge et l'effet du spécial pendant cette mission
    function pouvoir_mission() {
        if (!m || !m.charges) return null;
        return {
            kills: m.charges.kills[etat.mode],
            peut: () => Boolean(charges && !fini && charges.compte === null && charges.posees + charges.vols.length < m.charges.nombre),
            activer: () => {
                const i = charges.posees + charges.vols.length, cible = place_charge(i);
                charges.vols.push({ i, x0: joueur.x + CONFIG.canon.x, y0: joueur.y + CONFIG.canon.y, ...cible, t: 0, duree: 0.7 });
                joueur.animTir = CONFIG.joueur.dureeAnimTir;
                Son.effet('grenade');
            }
        };
    }
    // Renvoie true quand plus personne ne doit apparaître (compte à rebours, explosion)
    function maj_charges(dt) {
        for (const v of charges.vols) v.t += dt;
        for (const v of charges.vols.filter(v => v.t >= v.duree)) {
            charges.posees++;
            Son.effet('coupBloque');   // elle se colle au béton
            sousTitre = { qui: 'mira', texte: m.charges.repliques[v.i], t: 0 };
            maj_hud_mission();
            if (charges.posees >= m.charges.nombre) { charges.compte = 0; $c('hud-mission').textContent = T('💣 Charges : {n} / {total}', { n: charges.posees, total: m.charges.nombre }) + ' · ' + T('ÇA VA SAUTER !'); }
        }
        charges.vols = charges.vols.filter(v => v.t < v.duree);
        if (charges.compte === null) return false;
        // Le compte à rebours : les voyants clignotent, et ça bipe de plus en plus vite
        const avant = charges.compte;
        charges.compte += dt;
        const bip = c => Math.floor(c * (2 + c * 3));
        if (!charges.effondre && bip(charges.compte) !== bip(avant)) Son.ton(1400, 0, 0.05, { type: 'square', vol: 0.05 });
        if (!charges.effondre && charges.compte >= m.charges.compte) faire_sauter();
        if (charges.effondre) {
            charges.effondre += dt;
            for (const e of charges.eclats) { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 300 * dt; e.age += dt; }
            charges.eclats = charges.eclats.filter(e => e.age < e.duree);
            // Le pont est tombé, la poussière retombe : Mira commente, puis le débriefing
            if (charges.effondre > 2 && !charges.dit) {
                charges.dit = true;
                sousTitre = null;
                if (typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) dire_epilogue(m.charges.boum, 0, () => terminer(true));
                else terminer(true);
            }
        }
        return true;
    }
    function faire_sauter() {
        charges.effondre = 0.001;
        Son.effet('explosion');
        Son.effet('eclatement');
        secouer_ecran(6);
        Son.vibrer(1, 400);
        // Des éclats de béton et des gerbes d'eau partout sur le pont ; la horde tombe à l'eau
        for (let i = 0; i < m.charges.nombre; i++) {
            const p = place_charge(i);
            for (let k = 0; k < 18; k++) charges.eclats.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 260, vy: -60 - Math.random() * 200, age: 0, duree: 0.8 + Math.random() * 0.6, eau: k % 3 === 0 });
        }
        for (const z of zombies) for (let k = 0; k < 4; k++) charges.eclats.push({ x: z.x + z.taille / 2, y: z.y + z.taille * 0.7, vx: (Math.random() - 0.5) * 80, vy: -80 - Math.random() * 120, age: 0, duree: 0.7, eau: true });
        zombies.length = 0;
        if (boss) fin_boss();
        sousTitre = null;
    }

    // Un zombie est tombé : objectif atteint ?
    function tue(z) {
        if (!m || fini || camion || chantier || charges) return;
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

    // Les exploits d'une mission (succès de la campagne), gardés dans la sauvegarde
    function exploit(nom, valeur = true) { S().exploits = { ...(S().exploits || {}), [nom]: valeur }; }

    // Fin d'un combat de boxe (boxe.js) : comme la fin d'une vague ; les exploits du combat
    // (gagné sans être touché, esquives parfaites) sont notés avant
    function fin_boxe(victoire) {
        if (!m || fini) return;
        const combat = typeof Boxe !== 'undefined' ? Boxe.etat() : null;
        if (combat) {
            if (combat.parfaits > ((S().exploits || {}).esquivesParfaites || 0)) exploit('esquivesParfaites', combat.parfaits);
            if (victoire && combat.b.pv >= 100) exploit('gegeIntouchable');
            Sauvegarde.sauver();
            if (typeof Succes !== 'undefined') Succes.verifier();
        }
        terminer(victoire);
    }

    // Ce qu'on entend pendant la vague (à une fraction de l'objectif, ou de la horde avant le boss)
    function dire_pendant() {
        const pendant = m.pendant || [];
        if (dits < pendant.length && tues >= pendant[dits].a * objectif() && typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) {
            const l = pendant[dits++];
            Instructeur.parler(T(l.texte), T('Compris !'), null, l.qui, LECTURE);
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
        const mi = m, p = partie;   // on a pu quitter la mission pendant la courte attente
        if (typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) setTimeout(() => { if (toujours(p)) dire_epilogue(mi.tirAmi.fin, 0, conclure); }, 900);
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
            Instructeur.parler(T(texte), T(victoire ? 'Mission accomplie !' : (m.echecBouton || 'Compris, sergent…')), suite, m.debriefQui || 'sergent', LECTURE);
        else fin();
    }

    // Les répliques de l'épilogue, une par une, sur le terrain figé
    function dire_epilogue(lignes, i, ensuite) {
        const l = lignes[i];
        if (!l) return ensuite();
        Instructeur.parler(T(l.texte, l.vars), T(l.bouton || 'Suite ▶'), () => dire_epilogue(lignes, i + 1, ensuite), l.qui, LECTURE);
    }
    const chapitre_fini = n => Boolean(S().chapitres && S().chapitres[n]);
    function derniere_du_chapitre(mi) {
        const du_chapitre = MISSIONS_CAMPAGNE.filter(x => x.chapitre === mi.chapitre);
        return du_chapitre[du_chapitre.length - 1] === mi;
    }

    // Le camion et sa barre de vie (dessinés sous les zombies)
    function dessiner_sol(ctx) {
        dessiner_brutus(ctx);
        if (m && m.decor === 'pont') dessiner_pont(ctx);
        if (!camion || camion.detruit) return;
        const x = Math.round(camion.x), y = Math.round(camion.y);
        ctx.drawImage(OBJETS_CAMP.camion, x, y + (Math.floor(etat.temps * 8) % 2));   // le moteur fait vibrer la caisse
        const part = Math.max(0, camion.pv / camion.pvMax);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x + 30, y + 44, 70, 6);
        ctx.fillStyle = part > 0.5 ? '#4ad060' : part > 0.25 ? '#e8c24a' : '#e83a3a';
        ctx.fillRect(x + 31, y + 45, Math.round(68 * part), 4);
    }

    /* Le pont de « Mèche courte » : la jeep en panne qui fume, les charges collées aux
       parapets (leur voyant clignote, de plus en plus vite pendant le compte à rebours),
       puis l'effondrement du tablier dans la rivière. */
    function dessiner_pont(ctx) {
        const t = etat.temps, rect = (x, y, l, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), l, h); };
        ctx.drawImage(OBJETS_CAMP.jeep, -8, 300);
        for (let k = 0; k < 4; k++) { const a = (t * 0.7 + k / 4) % 1; ctx.globalAlpha = 0.5 * (1 - a); rect(62 + Math.sin(t * 2 + k) * 3 + a * 6, 330 - a * 34, 3 + a * 4, 3 + a * 4, '#9a9a9a'); }
        ctx.globalAlpha = 1;
        if (!charges) return;
        const xG = PONT.riveG, xD = MONDE.largeur - PONT.riveD;
        const e = charges.effondre;
        if (e > 0) {
            // Le tablier s'effondre par blocs, qui s'enfoncent et s'assombrissent ; l'eau reprend sa place
            const p = Math.min(1, e / 1.3);
            const blocs = 8, l = (xD - xG + 40) / blocs;
            ctx.save();
            ctx.globalAlpha = Math.min(1, e * 3);
            rect(xG - 20, PONT.haut - 2, xD - xG + 40, PONT.bas - PONT.haut + 4, '#2c5e6e');
            // Le courant qui file vers la droite
            for (let k = 0; k < 40; k++) {
                const y = PONT.haut + 4 + ((k * 53) % (PONT.bas - PONT.haut - 8)), lx = 10 + (k * 7) % 22;
                rect(xG - 20 + ((k * 131 + t * (30 + (k % 5) * 8)) % (xD - xG + 40 - lx)), y, lx, 1, k % 3 ? '#3a7484' : '#cfe6ea');
            }
            ctx.restore();
            // Les bouts du tablier restés accrochés aux culées, cassés en dents de scie
            const fond = decor_pont(), h = 6;
            for (let y = PONT.haut - 2; y < PONT.bas + 2; y += h) {
                const lG = 14 + Math.round(8 + Math.sin(y * 0.37) * 6 + Math.sin(y * 1.3) * 3), lD = 14 + Math.round(8 + Math.sin(y * 0.29 + 2) * 6 + Math.sin(y * 1.7) * 3);
                ctx.drawImage(fond, xG - 20, y, lG, h, xG - 20, y, lG, h);
                ctx.drawImage(fond, xD + 20 - lD, y, lD, h, xD + 20 - lD, y, lD, h);
                rect(xG - 20 + lG, y, 1, h, '#3a3a3e'); rect(xD + 19 - lD, y, 1, h, '#3a3a3e');   // la cassure, plus sombre
            }
            // Des débris qui dérivent : morceaux d'asphalte et un plot orange
            if (e > 0.8) for (let k = 0; k < 7; k++) {
                const dx = (e - 0.8) * (8 + k * 3), x = xG + 40 + k * (xD - xG - 80) / 7 + dx, y = PONT.haut + 40 + ((k * 89) % (PONT.bas - PONT.haut - 80)) + Math.sin(t * 2 + k) * 1.5;
                if (k === 3) { rect(x, y, 6, 6, '#e86a1a'); rect(x + 2, y + 2, 2, 2, '#f0f0e8'); continue; }
                rect(x, y, 10 + (k % 3) * 4, 5 + (k % 2) * 3, k % 2 ? '#4a4c52' : '#8e8a82');
                rect(x - 2, y + 6 + (k % 2) * 3, 14 + (k % 3) * 4, 1, '#cfe6ea');   // l'écume autour
            }
            for (let b = 0; b < blocs; b++) {
                const pb = Math.min(1, Math.max(0, p * 1.4 - (b % 3) * 0.15));
                if (pb >= 1) continue;
                const x = xG - 20 + b * l, ech = 1 - pb * 0.5;
                ctx.save();
                ctx.translate(x + l / 2, (PONT.haut + PONT.bas) / 2 + pb * 20);
                ctx.rotate((b % 2 ? 1 : -1) * pb * 0.25);
                ctx.scale(ech, ech);
                ctx.globalAlpha = 1 - pb;
                rect(-l / 2 + 2, -(PONT.bas - PONT.haut) / 2, l - 4, PONT.bas - PONT.haut, pb > 0.4 ? '#5e5a54' : '#8e8a82');
                ctx.restore();
            }
            // Le souffle des quatre charges
            if (e < 0.6) for (let i = 0; i < m.charges.nombre; i++) {
                const c = place_charge(i), r = 20 + e * 160;
                ctx.globalAlpha = 1 - e / 0.6;
                ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.6, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            for (const c of charges.eclats) { ctx.globalAlpha = 1 - c.age / c.duree; rect(c.x, c.y, 3, 3, c.eau ? '#d8eef0' : '#8e8a82'); }
            ctx.globalAlpha = Math.min(1, Math.max(0, (e - 1) * 2));
            // Ce qui reste : le haut des piles qui dépasse de l'eau, avec un peu d'écume autour
            for (let i = 0; i < m.charges.nombre; i++) {
                const c = place_charge(i), x = Math.round(c.x) - 9, y = Math.round(c.y) - 6;
                rect(x - 3, y + 12, 24, 2, '#d8eef0');
                rect(x, y, 18, 12, '#6e6a62'); rect(x, y, 18, 2, '#9e9a90'); rect(x + 4, y - 3, 4, 3, '#6e6a62'); rect(x + 12, y - 2, 3, 2, '#6e6a62');
            }
            ctx.globalAlpha = 1;
            return;
        }
        // Les charges posées : une bombe ronde (comme Ginette), voyant rouge qui clignote
        const vitesse = charges.compte === null ? 2 : 4 + charges.compte * 8;
        for (let i = 0; i < charges.posees; i++) dessiner_charge(ctx, place_charge(i), Math.floor(t * vitesse + i) % 2 === 0);
    }
    function dessiner_charge(ctx, p, allume) {
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y));
        // Un halo rouge quand le voyant s'allume : on les repère de loin, même au milieu de la horde
        if (allume) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#ff3a2a'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.scale(1.2, 1.2);
        dessiner_bombe(ctx, 0, 0, etat.temps, false);
        ctx.fillStyle = allume ? '#ff3a2a' : '#5a1a14';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
    }

    // Par-dessus tout le reste : les charges en vol, et ce que dit un perso sans arrêter le jeu
    function dessiner_dessus(ctx) {
        if (charges) for (const v of charges.vols) {
            const k = Math.min(1, v.t / v.duree);
            const x = v.x0 + (v.x - v.x0) * k, y = v.y0 + (v.y - v.y0) * k - Math.sin(k * Math.PI) * 60;   // en cloche
            dessiner_charge(ctx, { x, y }, true);
        }
        if (!sousTitre) return;
        // Sous-titre en bas de l'écran : « Mira : … », sur deux lignes au plus
        const e = MONDE.echelle, W = ctx.canvas.width;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.font = 'bold ' + Math.max(11, Math.round(12 * e)) + 'px monospace';
        // Espaces insécables de la typographie française : « », ! ? : ; ne restent jamais seuls en début de ligne
        const texte = (T(ORATEUR_NOMS[sousTitre.qui] || sousTitre.qui) + ' : « ' + T(sousTitre.texte) + ' »').replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
        const maxL = Math.min(W - 40, 760 * e), mots = texte.split(' '), lignes = [''];
        for (const mot of mots) { const l = lignes[lignes.length - 1]; if (ctx.measureText(l + ' ' + mot).width > maxL && l) lignes.push(mot); else lignes[lignes.length - 1] = l ? l + ' ' + mot : mot; }
        const h = Math.max(14, Math.round(16 * e)), y0 = ctx.canvas.height - MONDE.decalageY - (lignes.length * h + 16 * e);
        const alpha = Math.min(1, sousTitre.t * 4, (4.5 - sousTitre.t) * 2);
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = '#000';
        ctx.fillRect(W / 2 - maxL / 2 - 10, y0 - 6, maxL + 20, lignes.length * h + 12);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffe8f4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        lignes.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * h));
        ctx.restore();
    }
    const ORATEUR_NOMS = { mira: 'Mira' };

    // Mission de nuit : à la lampe (nuit.js), avec les néons du quai dans le métro
    function dessiner_nuit(ctx) {
        if (m && m.nuit) dessiner_lampe(ctx, m.neons, 1);
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
            if (id === 'c2m3' && !soins) exploit('terminusSansSoin');                          // aucun Infirmier n'a soigné
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
            ? (CHAPITRES.some(c => c.numero > mi.chapitre)
                ? T('Fin du chapitre {n}. Le chapitre {s} t\'attend dans la campagne.', { n: mi.chapitre, s: mi.chapitre + 1 })
                : T('Fin du chapitre {n}. La suite de l\'histoire arrive bientôt…', { n: mi.chapitre }))
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
        const qui = l.qui === 'sergent' && scene.cfg.sergent && scene.cfg.sergent.pyjama ? 'sergentPyjama' : l.qui;
        Instructeur.parler(T(l.texte), T(l.bouton || 'Suite ▶'), () => dire(i + 1), qui, LECTURE);
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
        if (cfg.lieu === 'caserne') return dessiner_caserne(c, L, t, instant);
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

    /* La caserne du génie (intro du chapitre 3) : le Commandant derrière son bureau,
       la radio qui grésille quand le Sergent parle, et Mira au fond, assise sur une
       caisse, qui astique Ginette (caserne_decor.js). */
    function dessiner_caserne(c, L, t, instant) {
        const ligne = scene.cfg.lignes[scene.ligne];
        const parle = qui => ligne && ligne.qui === qui && Instructeur.parleEncore();
        c.drawImage(decor_caserne(L, 400), 0, 0);
        const C = CASERNE.commandant;
        c.drawImage(SPRITES_COMMANDANT[parle('commandant') && Math.floor(instant / 140) % 2 ? 1 : 0], C.x, C.y + Math.round((Math.sin(t * 1.2) + 1) / 2));
        dessiner_bureau(c, parle('sergentRadio') && Math.floor(instant / 120) % 2);
        // Mira, assise sur une caisse, tournée vers sa bombe ; elle sautille quand elle parle
        const mx = L - CASERNE.mira.droite, my = CASERNE.mira.y;
        c.fillStyle = 'rgba(26, 24, 20, 0.3)'; c.fillRect(mx + 8, my + 60, 60, 6);
        c.fillStyle = '#8a6a3e'; c.fillRect(mx + 14, my + 44, 36, 20); c.fillStyle = '#b83a2a'; c.fillRect(mx + 15, my + 51, 34, 5);
        const saut = parle('mira') ? Math.round(Math.abs(Math.sin(t * 10)) * 2) : Math.round((Math.sin(t * 1.5) + 1) / 2);
        c.save();
        const filtre = Loot.filtre('grenadier', t);
        if (filtre) c.filter = filtre;
        c.drawImage(Loot.sprites('grenadier').arret, mx, my - 12 - saut, 64, 64);
        c.restore();
        dessiner_bombe(c, mx + 76, my + 52, t, !parle('mira'));
        // Un petit cœur au-dessus de Ginette quand Mira lui parle
        if (ligne && ligne.qui === 'mira' && scene.ligne === 2) {
            const y = my + 30 - ((t * 20) % 20);
            c.fillStyle = '#f07ab0';
            c.fillRect(mx + 72, y, 2, 2); c.fillRect(mx + 76, y, 2, 2); c.fillRect(mx + 72, y + 2, 6, 2); c.fillRect(mx + 74, y + 4, 2, 2);
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
                        ? (mi.charges ? T('Poser {n} charges sur le pont, puis le faire sauter', { n: mi.charges.nombre }) : mi.camion ? T('Escorter le camion jusqu\'au camp') : mi.chantier ? T('Couvrir la réparation du mur') : mi.boss ? T('Repousser la horde, puis l\'abattre') : T('Repousser {n} zombies', { n: mi.objectif[difficulte_choisie] })) + ' · ' + coche('normal') + ' · ' + coche('hardcore')
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
        for (const s of SUCCES) {
            const ch = /^campagne_c(\d+)/.exec(s.id);
            if (ch) s.objectif = MISSIONS_CAMPAGNE.filter(x => x.chapitre === Number(ch[1])).length;
        }
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

    return { demarrer, arreter, maj, tue, fin, lancer, ouvrir, etape, dessiner_nuit, dessiner_sol, dessiner_dessus, balle_sur_brutus, miroir: () => Boolean(m && m.miroir),
        decor: () => (!m || !m.decor ? null : ({ ville: decor_ville, metro: decor_metro, arene: decor_arene, pont: decor_pont }[m.decor] || (() => null))()),
        pouvoir: pouvoir_mission,
        // Fin d'un combat de boxe (boxe.js) : comme la fin d'une vague
        fin_boxe,
        soin: () => { soins++; } };
})();
