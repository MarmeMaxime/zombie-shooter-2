/* =========================================================================
   BOUCLE DE JEU, SCORE, VIES ET FIN DE PARTIE
   ========================================================================= */
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');

const img_fond = chargerImage('./assets/FOND.jpg');

const ui = {
    score: document.getElementById('score'),
    vies: document.getElementById('vies'),
    temps: document.getElementById('temps'),
    prixVie: document.getElementById('prix-vie'),
    gameOver: document.getElementById('game-over-overlay'),
    scoreFinal: document.getElementById('final-score'),
    tempsFinal: document.getElementById('final-time')
};

const etat = {
    enCours: false,
    mode: 'normal',
    score: 0,
    vies: CONFIG.viesDepart,
    temps: 0,            // secondes écoulées (calculé avec le delta time, pas setInterval)
    prixVie: CONFIG.prixVieDepart
};

let idAnimation = null;
let dernierInstant = 0;

const partie_en_cours = () => etat.enCours;

/* ---------- HUD ---------- */
function maj_hud() {
    ui.score.textContent = etat.score;
    ui.vies.textContent = etat.vies;
    ui.temps.textContent = Math.floor(etat.temps);
    ui.prixVie.textContent = etat.prixVie;
    ui.score.classList.toggle('score-ready', etat.score >= etat.prixVie);
}

function ajouter_score(points) {
    etat.score += points;
    maj_hud();
}

function acheter_vie() {
    if (!etat.enCours || etat.score < etat.prixVie) return;
    etat.score -= etat.prixVie;
    etat.vies++;
    etat.prixVie = Math.floor(etat.prixVie * CONFIG.multiplicateurPrixVie);
    maj_hud();
}

function perdre_vie() {
    if (!etat.enCours) return;
    etat.vies--;
    maj_hud();
    if (etat.vies <= 0) game_over();
}

/* ---------- Boucle principale ---------- */
function boucle(instant) {
    if (!etat.enCours) return;

    const dt = Math.min((instant - dernierInstant) / 1000, CONFIG.dtMax);
    dernierInstant = instant;

    const secondesAvant = Math.floor(etat.temps);
    etat.temps += dt;
    if (Math.floor(etat.temps) !== secondesAvant) ui.temps.textContent = Math.floor(etat.temps);

    // Mise à jour
    update_joueur(dt, canvas.height);
    update_balles(dt, canvas.width);
    update_zombies(dt, canvas.width, canvas.height, etat.temps);

    // Dessin
    ctx.drawImage(img_fond, 0, 0, canvas.width, canvas.height);
    draw_zombies(ctx);
    draw_balles(ctx);
    draw_joueur(ctx);

    if (etat.enCours) idAnimation = requestAnimationFrame(boucle);
}

function arreter_boucle() {
    etat.enCours = false;
    if (idAnimation !== null) cancelAnimationFrame(idAnimation);
    idAnimation = null;
}

/* ---------- Début / fin de partie ---------- */
function init_game(mode) {
    arreter_boucle(); // garantit qu'une seule boucle tourne à la fois

    Object.assign(etat, {
        enCours: true,
        mode,
        score: 0,
        vies: CONFIG.viesDepart,
        temps: 0,
        prixVie: CONFIG.prixVieDepart
    });
    maj_hud();

    reset_joueur(mode);
    reset_zombies(mode);
    reset_balles();

    ui.gameOver.classList.add('hidden');
    Son.jouerAmbiance(mode);

    dernierInstant = performance.now();
    idAnimation = requestAnimationFrame(boucle);
}

function quitter_partie() {
    arreter_boucle();
    relacher_commandes();
    Son.arreterMusique();
}

function game_over() {
    quitter_partie();

    ui.scoreFinal.textContent = etat.score;
    ui.tempsFinal.textContent = Math.floor(etat.temps);

    ui.gameOver.classList.remove('hidden');
}

document.getElementById('btn-retry').addEventListener('click', () => init_game(etat.mode));
document.getElementById('btn-return-menu').addEventListener('click', () => {
    quitter_partie();
    retour_menu_principal();
});
