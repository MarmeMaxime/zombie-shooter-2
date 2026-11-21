/* =========================================================================
   BOUCLE DE JEU, SCORE, VIES ET FIN DE PARTIE
   ========================================================================= */
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');


/* ---------- Monde de jeu et plein écran ----------
   Le canvas couvre toute la page et est dessiné à la résolution réelle de
   l'écran (net, pas d'image étirée). Le monde garde une hauteur de référence
   de 400 unités ; sa largeur suit la forme de l'écran.
   echelleX = largeur du monde / 800 (largeur de référence) : les vitesses et
   portées horizontales sont multipliées par ce facteur, donc un zombie met le
   même temps à traverser l'écran quelle que soit sa taille. L'équilibrage
   (vérifié par simulation sur 800×400) reste valable. */
const REFERENCE = { largeur: 800, hauteur: 400, largeurMin: 600 };
const MONDE = { largeur: 800, hauteur: 400, echelleX: 1, echelle: 1, decalageY: 0 };

function redimensionner() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;   // canvas caché (menu) : on garde les dernières dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Écran trop étroit (portrait) : bandes noires en haut et en bas plutôt qu'un monde écrasé
    MONDE.echelle = Math.min(canvas.height / REFERENCE.hauteur, canvas.width / REFERENCE.largeurMin);
    MONDE.largeur = canvas.width / MONDE.echelle;
    MONDE.decalageY = (canvas.height - REFERENCE.hauteur * MONDE.echelle) / 2;
    MONDE.echelleX = MONDE.largeur / REFERENCE.largeur;
    if (etat.enCours) dessiner();
}
// Échelle de l'interface (menus, HUD, boutons) : 1 pour un écran de 800×400
function maj_echelle_ui() {
    const ui = Math.max(0.8, Math.min(window.innerHeight / 400, window.innerWidth / 800, 2.6));
    document.documentElement.style.setProperty('--ui', ui.toFixed(3));
}
maj_echelle_ui();
window.addEventListener('resize', () => { maj_echelle_ui(); redimensionner(); });

function dessiner() {
    // Décor en pixel art : la zone de combat (combat_decor.js), ou le camp d'entraînement pendant le tutoriel
    const fond = etat.tuto && typeof decor_entrainement === 'function' ? decor_entrainement() : decor_combat();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (MONDE.decalageY > 0) {
        // Écran plus haut que le monde : le décor remplit aussi les bandes, assombri
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.setTransform(MONDE.echelle, 0, 0, MONDE.echelle, 0, MONDE.decalageY);

    ctx.imageSmoothingEnabled = false;    // tout est en pixel art : net, sans flou
    ctx.drawImage(fond, 0, 0, MONDE.largeur, MONDE.hauteur);
    draw_zombies(ctx);
    draw_balles(ctx);
    draw_pouvoir(ctx);
    draw_joueur(ctx);
    draw_flash_pouvoir(ctx);
}

const ui = {
    score: document.getElementById('score'),
    vies: document.getElementById('vies'),
    temps: document.getElementById('temps'),
    prixVie: document.getElementById('prix-vie'),
    gameOver: document.getElementById('game-over-overlay'),
    scoreFinal: document.getElementById('final-score'),
    tempsFinal: document.getElementById('final-time'),
    cranesGagnes: document.getElementById('final-cranes')
};

const etat = {
    enCours: false,
    mode: 'normal',
    perso: 'soldat',
    score: 0,
    vies: CONFIG.viesDepart,
    temps: 0,            // secondes écoulées (calculé avec le delta time, pas setInterval)
    prixVie: CONFIG.prixVieDepart
};

let idAnimation = null;
let dernierInstant = 0;

const partie_en_cours = () => etat.enCours && !etat.pause;

/* ---------- Pause ---------- */
const ecran_pause = document.getElementById('pause-overlay');

// ecran = false : pause sans l'écran « PAUSE » (quand le sergent parle)
function mettre_en_pause(valeur, ecran = true) {
    if (!etat.enCours || etat.pause === valeur) return;
    etat.pause = valeur;
    ecran_pause.classList.toggle('hidden', !(valeur && ecran));
    relacher_commandes();
    if (valeur) {
        if (idAnimation !== null) cancelAnimationFrame(idAnimation);
        idAnimation = null;
        if (ecran) Son.suspendreMusique();   // quand le Sergent parle, la musique continue
    } else {
        Son.reprendreMusique();
        dernierInstant = performance.now();   // pas de « saut » de temps à la reprise
        idAnimation = requestAnimationFrame(boucle);
    }
}

document.addEventListener('keydown', e => {
    if (typeof Instructeur !== 'undefined' && Instructeur.ouvert()) return;   // le sergent attend une réponse
    if (Touches.action(e.code) === 'pause' && etat.enCours && !e.repeat) {
        e.preventDefault();
        mettre_en_pause(!etat.pause);
    }
});
// Changer d'onglet ou de fenêtre met le jeu en pause automatiquement
window.addEventListener('blur', () => mettre_en_pause(true));
document.getElementById('btn-pause').addEventListener('click', () => mettre_en_pause(true));
document.getElementById('btn-reprendre').addEventListener('click', () => mettre_en_pause(false));
document.getElementById('btn-pause-menu').addEventListener('click', () => {
    mettre_en_pause(false);
    quitter_partie();
    retour_menu_principal();
});

/* ---------- HUD ---------- */
function maj_hud() {
    ui.score.textContent = etat.score;
    ui.vies.textContent = etat.vies;
    ui.temps.textContent = Math.floor(etat.temps);
    ui.prixVie.textContent = etat.prixVie;
    ui.score.classList.toggle('score-ready', etat.score >= etat.prixVie);
    if (etat.score >= etat.prixVie && typeof Conseils !== 'undefined') Conseils.score_vert();
}

function ajouter_score(points) {
    etat.score += points;
    etat.gagnes += points;   // total gagné dans la partie (les vies achetées ne le diminuent pas)
    maj_hud();
}

function acheter_vie() {
    if (!etat.enCours || etat.score < etat.prixVie) return;
    etat.score -= etat.prixVie;
    etat.vies++;
    etat.prixVie = Math.min(CONFIG.prixVieMax, Math.floor(etat.prixVie * CONFIG.multiplicateurPrixVie));
    maj_hud();
}

function perdre_vie() {
    if (!etat.enCours) return;
    if (etat.tuto) {   // entraînement : on montre le coup, sans retirer de vie
        Son.effet('degat');
        joueur_touche();
        return;
    }
    etat.vies--;
    maj_hud();
    Son.effet('degat');
    Son.vibrer(1, 200);
    Missions.degat();
    joueur_touche();
    if (etat.vies <= 0) game_over();
}

/* ---------- Boucle principale ---------- */
function boucle(instant) {
    if (!etat.enCours || etat.pause) return;

    // Le 1er horodatage de requestAnimationFrame peut précéder performance.now() : on borne à 0
    const dt = Math.max(0, Math.min((instant - dernierInstant) / 1000, CONFIG.dtMax));
    dernierInstant = instant;

    const secondesAvant = Math.floor(etat.temps);
    etat.temps += dt;
    if (Math.floor(etat.temps) !== secondesAvant) {
        ui.temps.textContent = Math.floor(etat.temps);
        if (!etat.tuto) Succes.seconde();   // l'entraînement ne compte pas
    }

    // Mise à jour
    update_joueur(dt, MONDE.hauteur);
    update_pouvoir(dt);
    update_balles(dt, MONDE.largeur, MONDE.hauteur);
    update_zombies(dt, MONDE.largeur, MONDE.hauteur, etat.temps);
    Missions.fin_image();   // zombies tués « d'un seul coup » pendant cette image
    if (typeof Tutoriel !== 'undefined') Tutoriel.maj(dt);

    dessiner();

    if (etat.enCours) idAnimation = requestAnimationFrame(boucle);
}

function arreter_boucle() {
    etat.enCours = false;
    if (idAnimation !== null) cancelAnimationFrame(idAnimation);
    idAnimation = null;
}

/* ---------- Début / fin de partie ---------- */
// tuto = true : entraînement (tutoriel.js), connu dès le départ pour que la toute
// première image montre déjà le camp et que la marche démarre directement
function init_game(mode, perso, tuto = false) {
    arreter_boucle(); // garantit qu'une seule boucle tourne à la fois

    Object.assign(etat, {
        enCours: true,
        pause: false,
        mode,
        perso,
        score: 0,
        gagnes: 0,
        tuto,                // entraînement (tutoriel.js)
        vies: CONFIG.viesDepart,
        temps: 0,
        prixVie: CONFIG.prixVieDepart,
        // Bilan de la partie (écran de fin) : victimes par espèce, missions et succès obtenus,
        // records d'avant la partie pour savoir s'ils sont battus
        tues: {},
        missions: [],
        succes: [],
        recordAvant: {
            temps: Number(Sauvegarde.donnees.stats.meilleurTemps[mode]) || 0,
            score: Number(Sauvegarde.donnees.stats.meilleurScore[mode]) || 0
        }
    });
    maj_hud();

    reset_joueur(mode, perso);
    reset_pouvoir(perso);
    Missions.debut_partie();
    reset_zombies(mode);
    reset_balles();

    ui.gameOver.classList.add('hidden');
    ecran_pause.classList.add('hidden');
    Son.reprendreMusique();
    Son.jouerAmbiance(tuto ? 'entrainement' : mode);

    redimensionner();   // le canvas vient de s'afficher : on prend la taille de l'écran
    dernierInstant = performance.now();
    idAnimation = requestAnimationFrame(boucle);
}

function quitter_partie() {
    arreter_boucle();
    if (typeof Tutoriel !== 'undefined') Tutoriel.arreter();
    if (typeof Instructeur !== 'undefined') Instructeur.cacher();
    relacher_commandes();
    Son.arreterMusique();
}

function game_over() {
    quitter_partie();

    ui.scoreFinal.textContent = etat.score;
    ui.tempsFinal.textContent = Math.floor(etat.temps);
    ui.cranesGagnes.textContent = Loot.gagner(etat.score);
    Succes.fin_partie();
    LootUI.maj_soldes();
    Sauvegarde.point_de_restauration(T('Fin de partie ({perso}, score {s})', { perso: CONFIG.personnages[etat.perso].nom, s: etat.score }));

    remplir_bilan();
    ui.gameOver.classList.remove('hidden');
}

/* ---------- Bilan de la partie (écran de fin) ---------- */
function remplir_bilan() {
    const $b = id => document.getElementById(id);
    const el = (tag, classe, texte) => { const e = document.createElement(tag); if (classe) e.className = classe; if (texte !== undefined) e.textContent = texte; return e; };

    // Records battus (seulement s'il y avait déjà un record à battre)
    const records = [];
    if (etat.recordAvant.temps > 0 && Math.floor(etat.temps) > etat.recordAvant.temps) records.push(T('temps (avant : {n} s)', { n: etat.recordAvant.temps }));
    if (etat.recordAvant.score > 0 && etat.gagnes > etat.recordAvant.score) records.push(T('score (avant : {n})', { n: etat.recordAvant.score }));
    $b('bilan-records').textContent = records.length ? T('🏅 Nouveau record : {liste} !', { liste: records.join(T(' et ')) }) : '';

    // Victimes par espèce, avec la vignette du monstre (boss en premier, puis les plus nombreux)
    const especes = Object.entries(etat.tues).filter(([type]) => TYPES_ZOMBIE[type])
        .sort(([a, na], [b, nb]) => (est_boss(b) - est_boss(a)) || nb - na);
    $b('bilan-tues').replaceChildren(...especes.map(([type, n]) => {
        const case_ = el('span', 'bilan-espece' + (est_boss(type) ? ' boss' : ''));
        const c = el('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(TYPES_ZOMBIE[type].images[0], 0, 0, 32, 32);
        const fiche = typeof FICHES !== 'undefined' && FICHES.find(f => f.type === type);
        case_.title = fiche ? fiche.nom : type;
        case_.append(c, el('span', '', `×${n}`));
        return case_;
    }));
    $b('bilan-tues-titre').textContent = especes.length ? T('Victimes : {n}', { n: especes.reduce((s, [, n]) => s + n, 0) }) : T('Aucune victime… les zombies te remercient.');

    // Missions et succès obtenus pendant la partie
    const liste = (titre, noms) => (noms.length ? `${titre} (${noms.length}) : ${noms.join(', ')}` : '');
    $b('bilan-missions').textContent = liste(T('📋 Missions accomplies'), etat.missions);
    $b('bilan-succes').textContent = liste(T('🏆 Succès débloqués'), etat.succes);
}

document.getElementById('btn-retry').addEventListener('click', () => init_game(etat.mode, etat.perso));
document.getElementById('btn-return-menu').addEventListener('click', () => {
    quitter_partie();
    retour_menu_principal();
});
