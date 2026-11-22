/* =========================================================================
   CAMPAGNE : le moteur (l'histoire elle-même est dans campagne_histoire.js).
   Derrière le soldat se trouve un camp à protéger ; sous le camp, un labo où
   des chercheurs travaillent sur un remède. Le camp s'affiche dans le menu
   (camp_decor.js) et grandit avec la campagne (etape()).
   - Intro de chaque mission : une scène dans le camp (de jour, de nuit, avec
     la brèche…), avec les dialogues du Sergent, du Soldat (muet), du labo ou
     de l'éclaireur, dans la boîte de dialogue du tutoriel.
   - Mission : une partie avec ses propres apparitions et un objectif parmi
     « objectif » (zombies à repousser), « camion » (escorte), « chantier »
     (couvrir une réparation) ou « boss » (une horde, puis le boss). Elle se
     joue en normal comme en hardcore et se débloque avec la précédente.
   Sauvegarde : Sauvegarde.donnees.campagne = { intros: { id: true }, missions: { id: { normal, hardcore } },
                meilleurs: { id: { normal: { temps, vies } } } }   (meilleur temps et le plus de vies restantes)
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
    // Étape du camp : il grandit avec la campagne (1 : mur renforcé et tour de guet, après « La Brèche »)
    const etape = () => (reussieUneFois('c1m4') ? 1 : 0);

    /* ---------- Mission en cours ----------
       Trois sortes d'objectifs : « objectif » (nombre de zombies à repousser),
       « camion » (un camion à escorter jusqu'au camp) ou « chantier » (tenir
       pendant une réparation, qui s'arrête quand un zombie est trop près). */
    let m = null, chrono = 0, tues = 0, fini = false, camion = null, chantier = null, phaseBoss = false;

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
        if (m.camion) {
            const c = m.camion;
            camion = { x: MONDE.largeur + 30, y: c.y, pv: c.pv[etat.mode], pvMax: c.pv[etat.mode], vitesse: (MONDE.largeur + 170) / c.duree[etat.mode], depart: c.depart, detruit: false };
        }
        $c('hud-mission').classList.remove('hidden');
        maj_hud_mission();
        bandeau(T('MISSION {n} · {titre}', { n: m.numero, titre: T(m.titre) }).toUpperCase());
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
        camion = null;
        chantier = null;
        $c('hud-mission').classList.add('hidden');
        $c('bandeau-vague').classList.remove('bandeau-mission');
    }

    const objectif = () => m.objectif[etat.mode];
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

    // Un zombie, un Tank (« a.tank ») ou un Joggeur (« a.joggeur ») ; pendant une escorte, certains visent le camion
    function apparaitre(a) {
        const r = Math.random();
        const type = r < (a.tank || 0) ? 'tank' : r < (a.tank || 0) + (a.joggeur || 0) ? 'joggeur' : 'normal';
        const z = creer_zombie(type, MONDE.largeur, MONDE.hauteur);
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
            if (tues >= m.boss.avant[etat.mode]) {
                // La horde est repoussée… et elle arrive
                phaseBoss = true;
                faire_apparaitre_boss(MONDE.largeur, MONDE.hauteur);
                bandeau(T('ELLE ARRIVE…'));
                maj_hud_mission();
            }
            return;
        }
        tues++;
        maj_hud_mission();
        if (tues >= objectif()) terminer(true);
    }

    // Fin de mission : les zombies restants s'enfuient (victoire), le Sergent fait le point
    function terminer(victoire) {
        fini = true;
        etat.victoire = victoire;
        if (victoire) {
            zombies.length = 0;
            if (typeof dessiner === 'function') dessiner();   // l'image figée montre le terrain dégagé
        }
        const fin = () => game_over();
        const texte = victoire ? m.debrief[etat.mode] : m.echec;
        if (texte && typeof Instructeur !== 'undefined' && document.getElementById('instructeur'))
            Instructeur.parler(T(texte), T(victoire ? 'Mission accomplie !' : 'Compris, sergent…'), fin, 'sergent', 1000);   // impossible à passer pendant 1 s
        else fin();
    }

    // Le camion et sa barre de vie (dessinés sous les zombies)
    function dessiner_sol(ctx) {
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
        // Nuit noire : hors de la lampe, on ne voit que les yeux
        nuit(ctx, MONDE.largeur, MONDE.hauteur, lumieres, 0.985);
        ctx.fillStyle = '#ffe070';
        for (const z of zombies) {
            const t = z.taille, ex = Math.round(z.x + t * 0.42), ey = Math.round(z.y + t * 0.08);
            ctx.fillRect(ex, ey, 2, 2);
            ctx.fillRect(ex + 4, ey, 2, 2);
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
            records = noter_record(id);
            Sauvegarde.sauver();
        }
        $c('bilan-records').textContent = records.length ? T('🏅 Record de la mission : {liste} !', { liste: records.join(T(' et ')) }) : '';
        const carte = document.querySelector('#game-over-overlay .mission-card');
        carte.querySelector('h2').textContent = etat.victoire ? T('MISSION ACCOMPLIE') : T('MISSION ÉCHOUÉE');
        carte.querySelector('.game-over-text').textContent = etat.victoire
            ? T('Le camp tient. Le labo aussi. Pour l\'instant.')
            : (mi.camion && etat.vies > 0)
                ? T('Le camion n\'est jamais arrivé. Le labo attendra ses échantillons. Le Sergent, son café.')
                : (mi.boss && etat.vies > 0)
                    ? T('Elle est entrée dans le camp. Elle te cherche toujours. Le Sergent s\'est caché dans la jeep.')
                    : T('Le camp est tombé. Le labo avec. Le Sergent va être de très mauvaise humeur.');
        carte.classList.toggle('victoire', etat.victoire);
        $c('btn-retry').firstChild.textContent = etat.victoire ? T('REJOUER') + ' ' : T('RÉESSAYER') + ' ';
        // Victoire : on enchaîne directement sur la mission suivante (avec son intro la première fois)
        const suivante = MISSIONS_CAMPAGNE[MISSIONS_CAMPAGNE.findIndex(x => x.id === id) + 1];
        $c('btn-mission-suivante').classList.toggle('hidden', !(etat.victoire && suivante));
        $c('btn-mission-suivante').dataset.mission = suivante ? suivante.id : '';
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

    function intro(id, ensuite) {
        cacher_ecrans();
        afficher(ecrans.menu, false);
        afficher(ecrans.jeu, true);
        $c('scene-campagne').classList.remove('hidden');
        $c('btn-passer-intro').classList.remove('hidden');
        $c('instructeur').classList.add('dans-scene');
        $c('game-container').classList.add('en-scene');   // pas de commandes de jeu pendant l'intro
        const cfg = SCENES_CAMPAGNE[id];
        scene = { id, cfg, debut: performance.now(), ligne: -1, secousse: 0, sirene: 0, ensuite };
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
        // Il respire (un pixel de haut en bas), ou il trottine en sortant de sa tente
        const sgy = sg.y + (sortie < 1 ? Math.round(Math.abs(Math.sin(t * 12))) : Math.round((Math.sin(t * 2.6) + 1) / 2));
        c.drawImage(images[parle ? 1 : 0], sgx, sgy);
        // La fumée du cigare monte en volutes et s'efface
        c.fillStyle = '#c8c8c8';
        for (let k = 0; k < 4; k++) {
            const age = (t * 0.6 + k / 4) % 1;
            c.globalAlpha = 0.7 * (1 - age);
            c.fillRect(Math.round(sgx + 42 + Math.sin(t * 2 + k * 1.7) * 2 + age * 4), Math.round(sgy + 12 - age * 22), age > 0.5 ? 2 : 1, age > 0.5 ? 2 : 1);
        }
        c.globalAlpha = 1;
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
        // La nuit : seul le feu éclaire (il vacille), et un peu le voyant du labo
        if (cfg.nuit) {
            const vacille = 1 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13) * 0.03;
            nuit(c, L, 400, [
                { x: CAMP.feu.x, y: CAMP.feu.y - 6, r: 110 * vacille, force: 0.95 },
                { x: CAMP.labo.x + 58, y: CAMP.labo.y + 6, r: 14, force: 0.6 }
            ], 0.86);
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

    // Boutons (absents du simulateur : on vérifie qu'ils existent)
    if ($c('btn-campagne') && $c('btn-campagne').addEventListener) {
        $c('btn-campagne').addEventListener('click', () => { Son.bouton(); ouvrir(); });
        $c('btn-close-campagne').addEventListener('click', () => { Son.bouton(); $c('campagne-overlay').classList.add('hidden'); });
        $c('btn-passer-intro').addEventListener('click', () => { Son.bouton(); terminer_intro(); });
        $c('btn-mission-suivante').addEventListener('click', () => {
            Son.bouton();
            ui.gameOver.classList.add('hidden');
            lancer($c('btn-mission-suivante').dataset.mission);
        });
    }

    return { demarrer, arreter, maj, tue, fin, lancer, ouvrir, etape, dessiner_nuit, dessiner_sol };
})();
