/* =========================================================================
   CAMPAGNE : l'histoire du camp, chapitre par chapitre.
   Derrière le soldat se trouve un camp à protéger ; sous le camp, un labo où
   des chercheurs travaillent sur un remède. Le camp s'affiche dans le menu
   (camp_decor.js) et grandira au fil des chapitres.
   - Chaque mission a son intro : une scène dans le camp (de jour ou de nuit),
     avec les dialogues du Sergent, du Soldat (muet) ou de la voix du labo,
     dans la boîte de dialogue du tutoriel. Les personnages ne parlent que de
     l'histoire, jamais du jeu (pas de « hardcore », de touches…).
   - Mission : une partie avec ses propres apparitions et un objectif ; elle
     se joue en normal comme en hardcore (difficulté choisie dans le menu).
     Chaque mission se débloque en réussissant la précédente.
   Sauvegarde : Sauvegarde.donnees.campagne = { intros: { id: true }, missions: { id: { normal, hardcore } } }
   ========================================================================= */
const CHAPITRES = [
    { numero: 1, titre: 'La Recrue' }
];

/* apparition : intervalle entre deux zombies (de « depart » à « min » secondes,
   il raccourcit de « acceleration » par seconde), « groupe » : chance qu'un
   second arrive en même temps, « max » : zombies à l'écran au plus.
   nuit : la mission se joue dans le noir, à la lampe torche. */
const MISSIONS_CAMPAGNE = [
    {
        id: 'c1m1', chapitre: 1, numero: 1, titre: 'Premier contact', perso: 'soldat',
        // Que des zombies normaux, mais beaucoup, et de plus en plus vite
        objectif: { normal: 60, hardcore: 80 },
        apparition: {
            normal: { depart: 1.3, min: 0.8, acceleration: 0.008, groupe: 0.12 },
            hardcore: { depart: 1.2, min: 0.75, acceleration: 0.008, groupe: 0.15 }
        },
        debrief: {
            normal: 'Pas mal, Soldat. Premier jour, et personne n\'est mort. À part eux.',
            hardcore: 'Ils couraient plus vite que d\'habitude, et ils étaient enragés. Et tu as tenu. Je retire ce que j\'ai dit sur les forces spéciales. Enfin, une partie.'
        }
    },
    {
        id: 'c1m2', chapitre: 1, numero: 2, titre: 'Couvre-feu', perso: 'soldat', nuit: true,
        // De nuit : moins de zombies à la fois, mais autant à abattre, et on ne les voit pas venir
        objectif: { normal: 60, hardcore: 80 },
        apparition: {
            normal: { depart: 1.6, min: 1.0, acceleration: 0.008, groupe: 0.1, max: 4 },
            hardcore: { depart: 1.5, min: 0.9, acceleration: 0.008, groupe: 0.12, max: 5 }
        },
        debrief: {
            normal: 'Plus un bruit. Bien joué, Soldat. Maintenant, si tu permets, j\'ai un oreiller qui m\'attend.',
            hardcore: 'Ceux-là couraient dans le noir comme en plein jour. Et tu les as eus quand même. Bonne nuit, Soldat. Enfin, ce qu\'il en reste.'
        }
    }
];

/* Intros des missions : le décor de la scène et les répliques.
   qui : sergent, labo ou soldat ; action : un effet dans la scène (coup, sirene). */
const SCENES_CAMPAGNE = {
    c1m1: {
        jeep: true,                                  // la jeep arrive, le Soldat en descend
        sergent: { x: CAMP.sergent.x, y: CAMP.sergent.y },
        soldat: { x: CAMP.jeep.x + 92, y: CAMP.jeep.y + 14, apparait: 2.4 },
        attente: 2600,
        lignes: [
            { qui: 'sergent', texte: 'Alors c\'est toi, le renfort qu\'on m\'a promis. Un seul. J\'avais demandé une section.' },
            { qui: 'sergent', texte: 'Ton dossier dit « forces spéciales ». Le reste est raturé au marqueur noir. Ton nom aussi.' },
            { qui: 'sergent', texte: 'Donc pour moi, tu t\'appelles Soldat. Ça te va ? Ça te va.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: 'Bavard, en plus. On va bien s\'entendre.' },
            { qui: 'sergent', texte: 'Tu te demandes ce qu\'on garde en plein désert ? Là-dessous, il y a un labo. Avec des chercheurs : des blouses blanches qui n\'ont pas vu le soleil depuis trois mois.', action: 'coup' },
            { qui: 'sergent', texte: 'Ils cherchent un remède. Un vrai. Pas une prière, pas un vaccin miracle de la télé. Un remède.' },
            { qui: 'sergent', texte: 'Et d\'après eux, ils sont proches. Ça fait trois mois qu\'ils sont « proches ».' },
            { qui: 'labo', texte: 'Sergent ? Les nouveaux échantillons sont arrivés ? Certains sujets réagissent… bizarrement. Ils ne se transforment pas complètement.' },
            { qui: 'sergent', texte: 'Je ne fais pas les livraisons ! … Là-dessous, ils croient tous que je suis facteur.' },
            { qui: 'sergent', texte: 'Ta mission est simple. Les zombies arrivent toujours par l\'est. Entre eux et cette trappe, il y a toi. Rien ne passe.' },
            { qui: 'sergent', texte: 'Forces spéciales ou pas, ici tu es une recrue. Alors avant de jouer les héros, tu vas me montrer que tu sais tirer.' },
            { qui: 'sergent', texte: '… Ou on saute l\'entraînement. Ils arrivent. À ton poste, Soldat !', action: 'sirene', bouton: 'À mon poste !' }
        ]
    },
    c1m2: {
        nuit: true,                                  // le camp de nuit, éclairé par le feu
        camera: 100,                                 // on cadre plus bas : autour du feu
        sergent: { x: 92, y: 262, pyjama: true, sortDe: 30 },   // il sort de sa tente, en pyjama
        soldat: { x: 196, y: 254 },                  // le Soldat près du feu, déjà en armure
        attente: 1600,
        lignes: [
            { qui: 'sergent', texte: 'Soldat ! Debout ! … Ah. Tu es déjà debout.' },
            { qui: 'sergent', texte: 'Tu dors en armure, toi ? … Remarque, ça fait gagner du temps. Je devrais essayer.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: 'Ne regarde pas le pyjama. C\'est un pyjama réglementaire. Il l\'était en tout cas, en 1987.' },
            { qui: 'labo', texte: 'Sergent ? Il y a du bruit là-haut. On peut dormir tranquilles ?' },
            { qui: 'sergent', texte: 'Personne ne dort tranquille ici. Surtout pas moi, visiblement.' },
            { qui: 'sergent', texte: 'Les guetteurs ont entendu grogner à l\'est. Ils arrivent par petits groupes. Moins nombreux, mais on ne les voit pas venir.' },
            { qui: 'sergent', texte: 'Allume ta lampe. Tire sur tout ce qui grogne. Et si ça grogne en pyjama, c\'est moi : tu ne tires pas.' },
            { qui: 'sergent', texte: 'Tiens jusqu\'à ce qu\'on n\'en entende plus un seul. Moi, je surveille. D\'ici. Allongé.', action: 'sirene', bouton: 'À mon poste !' }
        ]
    }
};

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
    // Étape du camp : il grandira à chaque chapitre terminé (première version pour l'instant)
    const etape = () => 0;

    /* ---------- Mission en cours ---------- */
    let m = null, chrono = 0, tues = 0, fini = false;

    function demarrer() {
        m = mission(etat.mission);
        chrono = 1.5;          // un court répit avant le premier zombie
        tues = 0;
        fini = false;
        etat.victoire = false;
        $c('hud-mission').classList.remove('hidden');
        maj_hud_mission();
        const b = $c('bandeau-vague');
        b.textContent = T('MISSION {n} · {titre}', { n: m.numero, titre: T(m.titre) }).toUpperCase();
        b.classList.remove('hidden', 'anime');
        b.classList.add('bandeau-mission');
        void b.offsetWidth;
        b.classList.add('anime');
    }

    function arreter() {
        m = null;
        $c('hud-mission').classList.add('hidden');
        $c('bandeau-vague').classList.remove('bandeau-mission');
    }

    const objectif = () => m.objectif[etat.mode];
    function maj_hud_mission() {
        if (!m) return;
        $c('mission-compte').textContent = Math.min(tues, objectif());
        $c('mission-objectif').textContent = objectif();
    }

    // Appelée à chaque image à la place des apparitions du mode classique (zombie.js)
    function maj(dt) {
        if (!m || fini) return;
        const a = m.apparition[etat.mode];
        chrono -= dt;
        if (chrono > 0) return;
        if (a.max && zombies.length >= a.max) return;   // il attend qu'une place se libère
        chrono = Math.max(a.min, a.depart - etat.temps * a.acceleration);
        creer_zombie('normal', MONDE.largeur, MONDE.hauteur);
        // Ils arrivent parfois par deux
        if (Math.random() < a.groupe && (!a.max || zombies.length < a.max)) creer_zombie('normal', MONDE.largeur, MONDE.hauteur);
    }

    // Un zombie est tombé : objectif atteint ?
    function tue() {
        if (!m || fini) return;
        tues++;
        maj_hud_mission();
        if (tues < objectif()) return;
        fini = true;
        etat.victoire = true;
        // Les zombies restants s'enfuient : la mission est gagnée
        zombies.length = 0;
        if (typeof dessiner === 'function') dessiner();   // l'image figée montre le terrain dégagé
        const fin = () => game_over();
        if (typeof Instructeur !== 'undefined' && document.getElementById('instructeur')) Instructeur.parler(T(m.debrief[etat.mode]), T('Mission accomplie !'), fin);
        else fin();
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

    // Écran de fin d'une mission (appelé par game_over) : victoire ou échec, et sauvegarde
    function fin() {
        const id = etat.mission;
        if (etat.victoire) {
            S().missions[id] = { ...(S().missions[id] || {}), [etat.mode]: true };
            Sauvegarde.sauver();
        }
        const carte = document.querySelector('#game-over-overlay .mission-card');
        carte.querySelector('h2').textContent = etat.victoire ? T('MISSION ACCOMPLIE') : T('MISSION ÉCHOUÉE');
        carte.querySelector('.game-over-text').textContent = etat.victoire
            ? T('Le camp tient. Le labo aussi. Pour l\'instant.')
            : T('Le camp est tombé. Le labo avec. Le Sergent va être de très mauvaise humeur.');
        carte.classList.toggle('victoire', etat.victoire);
        $c('btn-retry').firstChild.textContent = etat.victoire ? T('REJOUER') + ' ' : T('RÉESSAYER') + ' ';
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

    function dessiner_scene(instant) {
        if (!scene) return;
        requestAnimationFrame(dessiner_scene);   // en premier : une image ratée n'arrête pas la scène
        const toile = $c('scene-toile'), c = toile.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        if (toile.width !== Math.round(toile.clientWidth * dpr)) { toile.width = Math.round(toile.clientWidth * dpr); toile.height = Math.round(toile.clientHeight * dpr); }
        if (!toile.width || !toile.height) return;   // fenêtre réduite ou cachée
        const cfg = scene.cfg;
        // Caméra : on se rapproche du camp (on voit 300 de haut, à partir de y = cfg.camera ou 40)
        const echelle = toile.height / 300, L = Math.max(toile.width / echelle, CAMP.bord + 40), haut = cfg.camera ?? 40;
        const t = (instant - scene.debut) / 1000;
        let sx = 0, sy = 0;
        if (scene.secousse && instant - scene.secousse < 350) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
        c.setTransform(echelle, 0, 0, echelle, sx * echelle, (sy - haut) * echelle);
        c.imageSmoothingEnabled = false;
        c.drawImage(decor_camp(L, 400, 0), 0, 0);
        dessiner_feu(c, t);

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
        c.drawImage(images[parle ? 1 : 0], sgx, sg.y + (sortie < 1 ? Math.round(Math.abs(Math.sin(t * 12))) : 0));
        // Le voyant du labo s'allume quand le labo parle
        if (ligne && ligne.qui === 'labo' && Math.floor(instant / 200) % 2) c.drawImage(PORTE_LABO.campAllume, CAMP.labo.x, CAMP.labo.y);
        // Le Soldat (avec sa tenue équipée)
        if (t > (cfg.soldat.apparait || 0)) {
            c.save();
            const filtre = Loot.filtre('soldat', t);
            if (filtre) c.filter = filtre;
            c.drawImage(Loot.sprites('soldat').arret, cfg.soldat.x, cfg.soldat.y, 64, 64);
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
        const lignes = [];
        for (const ch of CHAPITRES) {
            lignes.push(el('p', 'campagne-chapitre', T('Chapitre {n} — {titre}', { n: ch.numero, titre: T(ch.titre) })));
            for (const mi of MISSIONS_CAMPAGNE.filter(x => x.chapitre === ch.numero)) {
                const ouverte = debloquee(mi.id);
                const ligne = el('div', 'campagne-ligne' + (ouverte ? '' : ' verrouillee'));
                const texte = el('span');
                const coche = mode => (reussie(mi.id, mode) ? '✔ ' : '✗ ') + T(mode === 'normal' ? 'Normal' : 'Hardcore');
                texte.append(el('strong', '', (mi.nuit ? '🌙 ' : '') + T('Mission {n} — {titre}', { n: mi.numero, titre: T(mi.titre) })),
                    el('small', '', ouverte
                        ? T('Repousser {n} zombies', { n: mi.objectif[difficulte_choisie] }) + ' · ' + coche('normal') + ' · ' + coche('hardcore')
                        : T('🔒 Réussis la mission précédente pour la débloquer')));
                ligne.append(texte);
                const boutons = el('span', 'campagne-boutons');
                if (ouverte && introVue(mi.id)) {
                    const revoir = el('button', '', '🎬');
                    revoir.title = T('Revoir l\'intro');
                    revoir.addEventListener('click', () => { Son.bouton(); intro(mi.id, revenir_ecran); });
                    boutons.append(revoir);
                }
                const jouer = el('button', ouverte ? 'campagne-jouer' : '', T('JOUER') + ' (' + T(difficulte_choisie === 'normal' ? 'Normal' : 'Hardcore') + ')');
                jouer.disabled = !ouverte;
                if (ouverte) jouer.addEventListener('click', () => { Son.bouton(); lancer(mi.id); });
                // La manette joue la dernière mission débloquée
                if (ouverte) liste.dataset.derniere = mi.id;
                boutons.append(jouer);
                ligne.append(boutons);
                lignes.push(ligne);
            }
        }
        liste.replaceChildren(...lignes);
    }

    // Boutons (absents du simulateur : on vérifie qu'ils existent)
    if ($c('btn-campagne') && $c('btn-campagne').addEventListener) {
        $c('btn-campagne').addEventListener('click', () => { Son.bouton(); ouvrir(); });
        $c('btn-close-campagne').addEventListener('click', () => { Son.bouton(); $c('campagne-overlay').classList.add('hidden'); });
        $c('btn-passer-intro').addEventListener('click', () => { Son.bouton(); terminer_intro(); });
    }

    return { demarrer, arreter, maj, tue, fin, lancer, ouvrir, etape, dessiner_nuit, enIntro: () => Boolean(scene), reussie, debloquee };
})();
