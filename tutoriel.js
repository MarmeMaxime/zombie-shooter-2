/* =========================================================================
   TUTORIEL : le Sergent (portrait : instructeur_sprite.js)
   - Instructeur : quand il parle, la partie se fige et son message s'affiche
     au milieu de l'écran ; on l'accepte (bouton, Entrée, Espace ou A à la
     manette), puis on joue. Il disparaît pendant qu'on joue.
   - Entraînement : une partie scriptée avec le Soldat, étape par étape. On
     ne peut pas y mourir et rien n'y est compté (succès, missions, stats).
     Proposé à la première partie, rejouable depuis l'écran « ? ».
   - Conseils : en vraie partie, une phrase à la première rencontre de chaque
     monstre, au premier pouvoir prêt et au premier score vert (désactivables).
   ========================================================================= */
const Instructeur = (() => {
    const $i = id => document.getElementById(id);
    const boite = $i('instructeur'), texte = $i('instructeur-texte'), boutons = $i('instructeur-boutons');
    let parleJusque = 0, animation = null, suite = null, aFige = false;

    // Visage dessiné dans un canvas (bouche ouverte ou fermée)
    function visage(canvas, ouvert) {
        const g = canvas.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(SPRITES_INSTRUCTEUR[ouvert ? 1 : 0], 0, 0, canvas.width, canvas.height);
    }

    // Le sergent parle : la partie se fige jusqu'à ce qu'on accepte (ensuite() est alors appelée)
    function parler(message, bouton, ensuite) {
        aFige = etat.enCours && !etat.pause;
        if (aFige) mettre_en_pause(true, false);   // pause sans l'écran « PAUSE »
        suite = ensuite || null;
        boite.classList.remove('hidden');
        texte.textContent = message;
        const b = document.createElement('button');
        b.textContent = bouton || T('Compris, sergent !');
        b.addEventListener('click', () => { Son.bouton(); valider(); });
        boutons.replaceChildren(b);
        // La bouche bouge le temps de « dire » la phrase
        parleJusque = performance.now() + Math.min(2600, 400 + message.length * 30);
        clearInterval(animation);
        let ouvert = false;
        animation = setInterval(() => {
            ouvert = performance.now() < parleJusque && !ouvert;
            visage($i('instructeur-visage'), ouvert);
            if (performance.now() >= parleJusque) clearInterval(animation);
        }, 130);
    }

    function valider() {
        if (!ouvert()) return;
        const ensuite = suite;
        cacher();
        if (aFige) mettre_en_pause(false);
        aFige = false;
        if (ensuite) ensuite();
    }

    function cacher() {
        clearInterval(animation);
        boite.classList.add('hidden');
        suite = null;
    }

    const ouvert = () => !boite.classList.contains('hidden');

    // Entrée ou Espace pour accepter, avant les autres raccourcis du jeu
    window.addEventListener('keydown', e => {
        if (!ouvert() || e.repeat || (e.code !== 'Enter' && e.code !== 'Space' && e.code !== 'NumpadEnter')) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        valider();
    }, true);

    visage($i('instructeur-visage'), false);
    visage($i('proposition-visage'), false);
    return { parler, valider, cacher, ouvert, visage };
})();

// Nom d'une commande pour les consignes : la touche choisie, ou le bouton tactile
const tactile = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
function commande(action) {
    if (tactile()) return T({ haut: 'le joystick', bas: 'le joystick', tir: 'le bouton TIR', pouvoir: 'le bouton ★', vie: 'le bouton V' }[action]);
    return `[${Touches.libelle(action)}]`;
}

/* ---------- Le zombie attaché (cible de l'étape 2, voir attache_sprite.js) ----------
   Il se débat au poteau ; abattu, son corps tombe et le poteau reste debout. */
let poteaux = [];
TYPES_ZOMBIE.attache = {
    config: { invoque: true, taille: 64, points: 10, pv: 1, vitesseMin: 0, vitesseAleatoire: 0, dureeImage: 0.16 },
    // Le zombie de base dans une seule pose (debout, bras le long du corps) : il ne peut
    // que tirer un peu sur ses liens [décalage du torse, de la tête], et tendre la tête pour mordre
    images: [[0, 0], [-1, -1], [-1, -2], [-1, -1], [0, 0], [1, 1], [0, 0], [0, -2]]
        .map(([torse, tete]) => SPRITES_ATTACHE.lier(TYPES_ZOMBIE.normal.images[2], torse, tete)),
    imagesMort: TYPES_ZOMBIE.normal.images,   // il tombe comme un zombie normal
    comportement: { mort(z) { poteaux.push({ x: z.x, y: z.y }); } }
};
EXTENSIONS.push({
    reset() { poteaux = []; },
    maj() {},
    dessiner(ctx) { for (const p of poteaux) ctx.drawImage(SPRITES_ATTACHE.poteau, p.x, p.y, 64, 64); }
});

/* ---------- Entraînement ---------- */
const Tutoriel = (() => {
    let etape = -1, suivi = {};

    function zombie(fractionX, y, vitesse, type = 'normal') {
        const z = creer_zombie(type, MONDE.largeur, MONDE.hauteur);
        z.x = MONDE.largeur * fractionX;
        z.y = y;
        z.vitesse = vitesse;
        return z;
    }
    const vivants = liste => liste.filter(z => zombies.includes(z));
    // Les cibles ne doivent pas atteindre la recrue : on les renvoie au fond
    const repousser = liste => { for (const z of vivants(liste)) if (z.x < joueur.x + joueur.taille + 20) z.x = MONDE.largeur * 0.82; };

    const ETAPES = [
        {   // 1. Se déplacer
            texte: () => T('Recrue ! Bienvenue au camp d\'entraînement. Je suis ton sergent et tu es en retard. Monte avec {haut}, descends avec {bas}. Exécution !', { haut: commande('haut'), bas: commande('bas') }),
            debut() { suivi.yMin = suivi.yMax = joueur.y; },
            fini() {
                suivi.yMin = Math.min(suivi.yMin, joueur.y);
                suivi.yMax = Math.max(suivi.yMax, joueur.y);
                return suivi.yMax - suivi.yMin > 120;
            }
        },
        {   // 2. Tirer sur une cible immobile
            texte: () => T('Ce zombie est attaché : il ne bougera pas. Il est plus discipliné que toi. Aligne-toi et tire avec {tir} !', { tir: commande('tir') }),
            debut() { suivi.cibles = [zombie(0.6, joueur.y < 200 ? 260 : 110, 0, 'attache')]; },
            fini: () => !vivants(suivi.cibles).length
        },
        {   // 3. Changer de ligne
            texte: () => T('Trois zombies, trois lignes. Tu t\'alignes, tu tires, tu recommences. C\'est tout le métier.'),
            debut() { suivi.cibles = [80, 180, 280].map((y, i) => zombie(0.72 + i * 0.07, y, 22)); },
            maj() { repousser(suivi.cibles); },
            fini: () => !vivants(suivi.cibles).length
        },
        {   // 4. Acheter une vie
            texte: () => T('Ton score est vert : achète une vie avec {vie}. Profites-en, c\'est le seul cadeau que je te ferai.', { vie: commande('vie') }),
            debut() { etat.score = Math.max(etat.score, etat.prixVie); maj_hud(); suivi.vies = etat.vies; },
            fini: () => etat.vies > suivi.vies
        },
        {   // 5. Pouvoir spécial
            texte: () => T('Ta jauge ★ est pleine. Lance ta {pouvoir} avec {touche} et nettoie-moi ce troupeau !', { pouvoir: CONFIG.pouvoirs.rafale.nom, touche: commande('pouvoir') }),
            debut() { suivi.cibles = []; suivi.lance = false; },
            maj() {
                if (pouvoir.rafale > 0) suivi.lance = true;
                if (!suivi.lance && !pouvoir_pret()) { pouvoir.charge = kills_requis(); maj_hud_pouvoir(); }
                // Un troupeau à balayer (il revient tant que le pouvoir n'a pas servi)
                if (!vivants(suivi.cibles).length && !suivi.lance) suivi.cibles = [60, 110, 160, 210, 260, 310].map((y, i) => zombie(0.68 + (i % 2) * 0.06, y, 18));
                repousser(suivi.cibles);
            },
            fini: () => suivi.lance && !vivants(suivi.cibles).length
        },
        {   // 6. Les vies (explication seulement)
            texte: () => T('Écoute bien : si un zombie te touche ou passe derrière toi, tu perds une vie. À zéro, c\'est fini. Ici je suis gentil. Dehors, non.')
        },
        {   // 7. Fin
            texte: () => T('Entraînement terminé. Tu n\'es pas prêt : personne ne l\'est. Les monstres bizarres, je te les présenterai sur le terrain. Rompez !'),
            bouton: 'Au combat !',
            fin: true
        }
    ];

    // Le sergent donne la consigne (partie figée) ; l'étape se joue une fois la consigne acceptée
    function suivant() {
        const reussie = etape >= 0;
        etape++;
        suivi = {};
        const e = ETAPES[etape];
        const message = (reussie && etape < ETAPES.length - 1 ? T('Bien.') + ' ' : '') + e.texte();
        Instructeur.parler(message, e.bouton ? T(e.bouton) : null, () => {
            if (e.fin) return terminer();
            if (!e.fini) return suivant();   // simple explication : on passe à la suite
            if (e.debut) e.debut();
            suivi.enCours = true;
        });
    }

    function demarrer() {
        afficher(ecrans.menu, false);
        afficher(ecrans.tuto, false);
        afficher(ecrans.jeu, true);
        init_game('normal', 'soldat', true);   // décor du camp et marche militaire dès la première image
        etape = -1;
        document.getElementById('btn-passer-tuto').classList.remove('hidden');
        suivant();
    }

    // Appelée à chaque image de la partie (main.js)
    function maj(dt) {
        if (!etat.tuto || etape < 0 || !suivi.enCours) return;
        const e = ETAPES[etape];
        if (e.maj) e.maj(dt);
        if (!e.fini || !e.fini()) return;
        // Étape réussie : un court instant, puis la consigne suivante
        suivi.bravo = (suivi.bravo || 0) + dt;
        if (suivi.bravo > 0.6) suivant();
    }

    function terminer() {
        arreter();
        quitter_partie();
        retour_menu_principal();
    }
    function arreter() {
        etape = -1;
        Instructeur.cacher();
        document.getElementById('btn-passer-tuto').classList.add('hidden');
    }

    document.getElementById('btn-passer-tuto').addEventListener('click', () => { Son.bouton(); terminer(); });
    return { demarrer, maj, arreter };
})();

/* ---------- Conseils en vraie partie (une seule fois chacun) ---------- */
const Conseils = (() => {
    const options = Sauvegarde.donnees.options;
    function dire(cle, message) {
        if (!options.conseils || etat.tuto || !etat.enCours || options.conseilsVus.includes(cle)) return;
        options.conseilsVus.push(cle);
        Sauvegarde.sauver();
        Instructeur.parler(message);   // la partie attend qu'on ait lu
    }
    return {
        monstre(type) {
            const f = FICHES.find(x => x.type === type);
            if (f && type !== 'normal') dire('monstre_' + type, T('{nom} en approche ! {conseil}', { nom: f.nom, conseil: f.conseil }));
        },
        pouvoir_pret: () => dire('pouvoir', T('Ta jauge ★ est pleine ! Lance ton pouvoir avec {touche}.', { touche: commande('pouvoir') })),
        score_vert: () => dire('vie', T('Ton score est vert : {touche} pour acheter une vie.', { touche: commande('vie') }))
    };
})();

/* ---------- Proposition à la première partie, bouton de l'écran « ? » ---------- */
(() => {
    const $p = id => document.getElementById(id);
    const options = Sauvegarde.donnees.options;
    // Renvoie true si la proposition s'affiche (la partie attend la réponse)
    window.proposer_entrainement = () => {
        if (options.tutoPropose) return false;
        options.tutoPropose = true;
        Sauvegarde.sauver();
        $p('tuto-proposition').classList.remove('hidden');
        return true;
    };
    $p('btn-proposition-oui').addEventListener('click', () => { $p('tuto-proposition').classList.add('hidden'); Tutoriel.demarrer(); });
    $p('btn-proposition-non').addEventListener('click', () => { $p('tuto-proposition').classList.add('hidden'); $p('btn-start').click(); });
    $p('btn-entrainement').addEventListener('click', () => Tutoriel.demarrer());
})();
