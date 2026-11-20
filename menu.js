/* =========================================================================
   MENU, TUTORIEL ET SON
   ========================================================================= */
const $ = id => document.getElementById(id);

const ecrans = {
    menu: $('main-menu'),
    jeu: $('game-view'),
    tuto: $('tutorial-overlay'),
    perso: $('perso-overlay'),
    gameOver: $('game-over-overlay')
};

const btn_sound = $('btn-sound');
const btn_normal = $('btn-normal');
const btn_hardcore = $('btn-hardcore');

let difficulte_choisie = 'normal';
let perso_choisi = 'soldat';

const afficher = (ecran, visible) => ecran.classList.toggle('hidden', !visible);

/* ---------- Choix du personnage ----------
   Les cartes sont générées depuis CONFIG.personnages : ajouter un perso
   dans la config suffit pour qu'il apparaisse ici. */
const liste_persos = $('liste-persos');

function choisir_perso(id) {
    perso_choisi = id;
    $('nom-perso').textContent = CONFIG.personnages[id].nom;
    for (const carte of liste_persos.children) carte.classList.toggle('active', carte.dataset.perso === id);
    try { localStorage.setItem('perso', id); } catch { /* stockage indisponible */ }
}

for (const [id, perso] of Object.entries(CONFIG.personnages)) {
    const carte = document.createElement('button');
    carte.className = 'carte-perso';
    carte.dataset.perso = id;

    const img = document.createElement('img');
    img.src = SPRITES_PERSO[id].arret.src;
    img.alt = '';

    const ligne = (classe, texte) => {
        const el = document.createElement('span');
        el.className = classe;
        el.textContent = texte;
        return el;
    };

    carte.append(img, ligne('nom', perso.nom), ligne('arme', CONFIG.armes[perso.arme].nom), ligne('description', perso.description));
    carte.addEventListener('click', () => choisir_perso(id));
    liste_persos.appendChild(carte);
}

let perso_memorise = null;
try { perso_memorise = localStorage.getItem('perso'); } catch { /* stockage indisponible */ }
choisir_perso(CONFIG.personnages[perso_memorise] ? perso_memorise : 'soldat');

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
$('btn-perso').addEventListener('click', () => afficher(ecrans.perso, true));
$('btn-close-perso').addEventListener('click', () => afficher(ecrans.perso, false));

$('btn-start').addEventListener('click', () => {
    afficher(ecrans.menu, false);
    afficher(ecrans.jeu, true);
    init_game(difficulte_choisie, perso_choisi);
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
