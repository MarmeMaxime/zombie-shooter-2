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

// Éléments du Tableau d'Honneur
const ecran_leaderboard = document.getElementById('leaderboard-overlay');
const btn_leaderboard = document.getElementById('btn-leaderboard');
const btn_fermer_leaderboard = document.getElementById('btn-close-leaderboard');
const leaderboard_body = document.getElementById('leaderboard-body');

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
window.sound_on = false;      
let difficulte_choisie = 'normal'; 
let isGameRunning = false;     

/* =========================================================================
   INTERACTIONS
   ========================================================================= */

// Nouvelle fonction de vérification de l'état du son
function verifier_etat_son() {
    if (window.sound_on) {
        btn_sound.textContent = "🔊";
        son_bouton.muted = false;
        if (!isGameRunning) musique_menu.play().catch(() => {});
    } else {
        btn_sound.textContent = "🔇";
        son_bouton.muted = true;
        if (!isGameRunning) musique_menu.pause();
    }

    // Informe le jeu si une partie est en cours
    if (isGameRunning) {
        set_game_music_mute(window.sound_on);
    }
}

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
verifier_etat_son();

btn_sound.addEventListener('click', () => {
    window.sound_on = !window.sound_on;
    verifier_etat_son();
});

// Bruitage Boutons
document.querySelectorAll('button').forEach(bouton => {
    bouton.addEventListener('click', () => {
        if (bouton.id !== 'btn-sound' && window.sound_on) {
            son_bouton.currentTime = 0; 
            son_bouton.play();          
        }
    });
});

// Tutoriel
btn_ouvrir_tuto.addEventListener('click', () => ecran_tuto.classList.remove('hidden'));
btn_fermer_tuto.addEventListener('click', () => ecran_tuto.classList.add('hidden'));

// Lancer le jeu
btn_start.addEventListener('click', () => {
    musique_menu.pause();
    musique_menu.currentTime = 0;

    div_menu.classList.add('hidden');
    div_game.classList.remove('hidden');

    isGameRunning = true; 
    init_game(difficulte_choisie, window.sound_on);
});

// Fonction de retour 
window.retour_menu_principal = () => {
    isGameRunning = false;
    div_game.classList.add('hidden');
    div_game_over.classList.add('hidden');
    div_menu.classList.remove('hidden');

    musique_menu.currentTime = 0;
    verifier_etat_son();
};

/* =========================================================================
   ARCHIVES (CLASSEMENT)
   ========================================================================= */
btn_leaderboard.addEventListener('click', () => {
    ecran_leaderboard.classList.remove('hidden');
    charger_classement();
});

btn_fermer_leaderboard.addEventListener('click', () => {
    ecran_leaderboard.classList.add('hidden');
});

function charger_classement() {
    leaderboard_body.innerHTML = '<tr><td colspan="5">Réception des transmissions...</td></tr>';
    
    fetch('serveur_classement.php?action=top10')
        .then(response => response.json())
        .then(data => {
            leaderboard_body.innerHTML = '';
            
            if (data.length === 0) {
                leaderboard_body.innerHTML = '<tr><td colspan="5">Aucune archive disponible.</td></tr>';
                return;
            }
            
            data.forEach((joueur, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${index + 1}</td>
                    <td>${joueur.pseudo}</td>
                    <td>${joueur.score}</td>
                    <td>${joueur.temps}s</td>
                    <td>${joueur.difficulte.toUpperCase()}</td>
                `;
                leaderboard_body.appendChild(tr);
            });
        })
        .catch(erreur => {
            leaderboard_body.innerHTML = '<tr><td colspan="5" style="color:#ff3333;">Erreur de transmission radio.</td></tr>';
            console.error("Erreur classement :", erreur);
        });
}