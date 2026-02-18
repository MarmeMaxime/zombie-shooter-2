/* =========================================================================
   ÉLÉMENTS DU MENU
   ========================================================================= */
const ecran_tuto = document.getElementById('tutorial-overlay'); 
const btn_start = document.getElementById('btn-start');
const btn_ouvrir_tuto = document.getElementById('btn-tuto');  
const btn_fermer_tuto = document.getElementById('btn-close-tuto'); 
const btn_sound = document.getElementById('btn-sound');
const btn_normal = document.getElementById('btn-normal');
const btn_hardcore = document.getElementById('btn-hardcore');

const div_menu = document.getElementById('main-menu');
const div_game = document.getElementById('game-view');
const div_game_over = document.getElementById('game-over-overlay');

/* =========================================================================
   AUDIO DU MENU
   ========================================================================= */
const musique_menu = new Audio('./assets/son/menu_theme.mp3');
musique_menu.loop = true;   
musique_menu.volume = 0.1;

const son_bouton = new Audio('./assets/son/button_sound.mp3');
son_bouton.volume = 0.5;

// Variables globales partagées
window.sound_on = true;          
let difficulte_choisie = 'normal'; 
let isGameRunning = false;     

/* =========================================================================
   INTERACTIONS
   ========================================================================= */

// 1. Choix Difficulté
btn_normal.addEventListener('click', () => {
    difficulte_choisie = 'normal';
    btn_normal.classList.add('active');
    btn_hardcore.classList.remove('active');
});

btn_hardcore.addEventListener('click', () => {
    difficulte_choisie = 'hardcore';
    btn_hardcore.classList.add('active');
    btn_normal.classList.remove('active');
});

// 2. Gestion Son (Global)
btn_sound.textContent = "🔊";
btn_sound.addEventListener('click', () => {
    window.sound_on = !window.sound_on;

    if (window.sound_on) {
        btn_sound.textContent = "🔊";
        son_bouton.muted = false;
        if (!isGameRunning) musique_menu.play();
    } else {
        btn_sound.textContent = "🔇";
        son_bouton.muted = true;
        if (!isGameRunning) musique_menu.pause();
    }

    // Informe le jeu si une partie est en cours
    if (isGameRunning && typeof setGameMusicMute === "function") {
        setGameMusicMute(window.sound_on);
    }
});

// 3. Bruitage Boutons
document.querySelectorAll('button').forEach(bouton => {
    bouton.addEventListener('click', () => {
        if (bouton.id !== 'btn-sound' && window.sound_on) {
            son_bouton.currentTime = 0; 
            son_bouton.play();          
        }
    });
});

// 4. Tutoriel
btn_ouvrir_tuto.addEventListener('click', () => ecran_tuto.classList.remove('hidden'));
btn_fermer_tuto.addEventListener('click', () => ecran_tuto.classList.add('hidden'));

// 5. Lancer le jeu
btn_start.addEventListener('click', () => {
    musique_menu.pause();
    musique_menu.currentTime = 0;

    div_menu.classList.add('hidden');
    div_game.classList.remove('hidden');

    isGameRunning = true;
    if (typeof initGame === "function") {
        initGame(difficulte_choisie, window.sound_on);
    }
});

// 6. Fonction de retour 
window.retourMenuPrincipal = function() {
    isGameRunning = false;
    div_game.classList.add('hidden');
    div_game_over.classList.add('hidden');
    div_menu.classList.remove('hidden');

    if (window.sound_on) {
        musique_menu.currentTime = 0;
        musique_menu.play().catch(e => {}); 
    }
};