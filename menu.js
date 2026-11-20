/* =========================================================================
   MENU, TUTORIEL ET SON
   ========================================================================= */
const $ = id => document.getElementById(id);

const ecrans = {
    menu: $('main-menu'),
    jeu: $('game-view'),
    tuto: $('tutorial-overlay'),
    gameOver: $('game-over-overlay')
};

const btn_sound = $('btn-sound');
const btn_normal = $('btn-normal');
const btn_hardcore = $('btn-hardcore');

let difficulte_choisie = 'normal';

const afficher = (ecran, visible) => ecran.classList.toggle('hidden', !visible);

/* ---------- Boutons (son de clic + perte du focus) ---------- */
document.querySelectorAll('button').forEach(bouton => {
    bouton.addEventListener('click', () => {
        if (bouton !== btn_sound) Son.bouton();
        // Sans ça, la barre ESPACE "recliquerait" le dernier bouton pendant la partie
        bouton.blur();
    });
});

/* ---------- Son ---------- */
function maj_bouton_son() {
    btn_sound.textContent = Son.estActif() ? '🔊' : '🔇';
}

btn_sound.addEventListener('click', () => {
    Son.setActif(!Son.estActif());
    maj_bouton_son();
});

/* ---------- Difficulté ---------- */
function choisir_difficulte(mode) {
    difficulte_choisie = mode;
    btn_normal.classList.toggle('active', mode === 'normal');
    btn_hardcore.classList.toggle('active', mode === 'hardcore');
}

btn_normal.addEventListener('click', () => choisir_difficulte('normal'));
btn_hardcore.addEventListener('click', () => choisir_difficulte('hardcore'));

/* ---------- Navigation ---------- */
$('btn-tuto').addEventListener('click', () => afficher(ecrans.tuto, true));
$('btn-close-tuto').addEventListener('click', () => afficher(ecrans.tuto, false));

$('btn-start').addEventListener('click', () => {
    afficher(ecrans.menu, false);
    afficher(ecrans.jeu, true);
    init_game(difficulte_choisie);
});

function retour_menu_principal() {
    afficher(ecrans.jeu, false);
    afficher(ecrans.gameOver, false);
    afficher(ecrans.menu, true);
    Son.jouerAmbiance('menu');
}

/* ---------- Démarrage ---------- */
maj_bouton_son();
Son.jouerAmbiance('menu'); // ne joue réellement qu'une fois le son activé
