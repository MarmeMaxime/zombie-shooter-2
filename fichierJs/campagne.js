/* =========================================================================
   CAMPAGNE : l'histoire du camp, chapitre par chapitre.
   Derrière le soldat se trouve un camp à protéger ; sous le camp, un labo où
   des chercheurs travaillent sur un remède. Le camp s'affiche dans le menu
   (camp_decor.js) et grandira au fil des chapitres.
   - Intro d'un chapitre : une scène dans le camp, avec les dialogues du
     Sergent (et de la voix du labo) dans la boîte de dialogue du tutoriel.
   - Mission : une partie avec ses propres apparitions et un objectif ; elle
     se joue en normal comme en hardcore (difficulté choisie dans le menu).
   Sauvegarde : Sauvegarde.donnees.campagne = { introVue, missions: { id: { normal, hardcore } } }
   ========================================================================= */
const CHAPITRES = [
    { numero: 1, titre: 'La Recrue' }
];

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
    }
];

/* L'intro du chapitre 1. qui : sergent, labo ou soldat ; action : un effet dans la scène. */
const INTRO_CHAPITRE_1 = [
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
];

const Campagne = (() => {
    const $c = id => document.getElementById(id);
    const S = () => Sauvegarde.donnees.campagne;
    const mission = id => MISSIONS_CAMPAGNE.find(m => m.id === id);

    /* ---------- Progression ---------- */
    const reussie = (id, mode) => Boolean(S().missions[id] && S().missions[id][mode]);
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
        chrono = Math.max(a.min, a.depart - etat.temps * a.acceleration);
        creer_zombie('normal', MONDE.largeur, MONDE.hauteur);
        if (Math.random() < a.groupe) creer_zombie('normal', MONDE.largeur, MONDE.hauteur);   // ils arrivent parfois par deux
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

    /* ---------- Lancer une mission ---------- */
    function lancer(id) {
        const mi = mission(id);
        cacher_ecrans();
        afficher(ecrans.menu, false);
        afficher(ecrans.jeu, true);
        init_game(difficulte_choisie, mi.perso, false, 'campagne', id);
    }

    function cacher_ecrans() {
        for (const e of ['choix-variante', 'campagne-overlay']) $c(e).classList.add('hidden');
    }

    /* ---------- Scène d'intro, dans le camp ---------- */
    let scene = null;

    function intro(ensuite) {
        cacher_ecrans();
        afficher(ecrans.menu, false);
        afficher(ecrans.jeu, true);
        $c('scene-campagne').classList.remove('hidden');
        $c('btn-passer-intro').classList.remove('hidden');
        $c('instructeur').classList.add('dans-scene');
        scene = { debut: performance.now(), ligne: -1, secousse: 0, sirene: 0, ensuite, fini: false };
        requestAnimationFrame(dessiner_scene);
        // La jeep arrive, puis on parle
        setTimeout(() => { if (scene) dire(0); }, 2600);
    }

    function dire(i) {
        if (!scene) return;
        const l = INTRO_CHAPITRE_1[i];
        if (!l) return terminer_intro();
        scene.ligne = i;
        if (l.action === 'coup') { scene.secousse = performance.now(); Son.effet('impactTerre'); }
        if (l.action === 'sirene') { scene.sirene = performance.now(); sirene(); }
        Instructeur.parler(T(l.texte), T(l.bouton || 'Suite ▶'), () => dire(i + 1), l.qui);
    }

    function terminer_intro() {
        if (!scene) return;
        const ensuite = scene.ensuite;
        scene = null;
        Instructeur.cacher();
        $c('scene-campagne').classList.add('hidden');
        $c('btn-passer-intro').classList.add('hidden');
        $c('instructeur').classList.remove('dans-scene');
        S().introVue = true;
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
        // Caméra : on se rapproche du camp (on voit le monde de y = 40 à 340)
        const echelle = toile.height / 300, L = toile.width / echelle;
        const t = (instant - scene.debut) / 1000;
        let sx = 0, sy = 0;
        if (scene.secousse && instant - scene.secousse < 350) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
        c.setTransform(echelle, 0, 0, echelle, sx * echelle, (sy - 40) * echelle);
        c.imageSmoothingEnabled = false;
        c.drawImage(decor_camp(Math.max(L, CAMP.bord + 40), 400, 0), 0, 0);
        dessiner_feu(c, t);

        // La jeep arrive par la gauche et se gare
        const arrivee = Math.min(1, t / 2.4), ease = 1 - Math.pow(1 - arrivee, 3);
        const jx = -110 + (CAMP.jeep.x + 110) * ease;
        c.drawImage(OBJETS_CAMP.jeep, Math.round(jx), CAMP.jeep.y + (arrivee < 1 ? Math.round(Math.sin(t * 30)) : 0));
        // Le Sergent attend devant le labo ; il bouge la bouche quand il parle
        const ligne = INTRO_CHAPITRE_1[scene.ligne];
        const parle = ligne && ligne.qui === 'sergent' && Instructeur.parleEncore() && Math.floor(instant / 130) % 2;
        c.drawImage(SPRITES_SERGENT[parle ? 1 : 0], CAMP.sergent.x, CAMP.sergent.y);
        // Le voyant du labo s'allume quand le labo parle
        if (ligne && ligne.qui === 'labo' && Math.floor(instant / 200) % 2) c.drawImage(PORTE_LABO.campAllume, CAMP.labo.x, CAMP.labo.y);
        // Le Soldat descend de la jeep
        if (t > 2.4) {
            const sprites = Loot.sprites('soldat');
            c.save();
            const filtre = Loot.filtre('soldat', t);
            if (filtre) c.filter = filtre;
            c.drawImage(sprites.arret, CAMP.jeep.x + 92, CAMP.jeep.y + 14, 64, 64);
            c.restore();
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
        if (!S().introVue) return intro(() => lancer('c1m1'));
        remplir_ecran();
        $c('campagne-overlay').classList.remove('hidden');
    }

    function remplir_ecran() {
        const liste = $c('campagne-liste');
        const el = (tag, classe, texte) => { const e = document.createElement(tag); if (classe) e.className = classe; if (texte !== undefined) e.textContent = texte; return e; };
        const lignes = [];
        for (const ch of CHAPITRES) {
            lignes.push(el('p', 'campagne-chapitre', T('Chapitre {n} — {titre}', { n: ch.numero, titre: T(ch.titre) })));
            const intro_ = el('div', 'campagne-ligne');
            const b = el('button', '', T('REVOIR'));
            b.addEventListener('click', () => { Son.bouton(); intro(() => { afficher(ecrans.jeu, false); afficher(ecrans.menu, true); ouvrir(); }); });
            intro_.append(el('span', '', T('🎬 Intro')), b);
            lignes.push(intro_);
            for (const mi of MISSIONS_CAMPAGNE.filter(x => x.chapitre === ch.numero)) {
                const ligne = el('div', 'campagne-ligne');
                const texte = el('span');
                const coche = mode => (reussie(mi.id, mode) ? '✔ ' : '✗ ') + T(mode === 'normal' ? 'Normal' : 'Hardcore');
                texte.append(el('strong', '', T('Mission {n} — {titre}', { n: mi.numero, titre: T(mi.titre) })),
                    el('small', '', T('Repousser {n} zombies', { n: mi.objectif[difficulte_choisie] }) + ' · ' + coche('normal') + ' · ' + coche('hardcore')));
                const jouer = el('button', 'campagne-jouer', T('JOUER') + ' (' + T(difficulte_choisie === 'normal' ? 'Normal' : 'Hardcore') + ')');
                jouer.addEventListener('click', () => { Son.bouton(); lancer(mi.id); });
                ligne.append(texte, jouer);
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

    return { demarrer, arreter, maj, tue, fin, lancer, ouvrir, etape, enIntro: () => Boolean(scene), reussie };
})();
