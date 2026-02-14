/* RÉCUPÉRATION DES ÉLÉMENTS HTML */
const ecran_tuto = document.getElementById('tutorial-overlay'); 
const btn_start = document.getElementById('btn-start');
const btn_ouvrir_tuto = document.getElementById('btn-tuto');  
const btn_fermer_tuto = document.getElementById('btn-close-tuto'); 
const btn_sound = document.getElementById('btn-sound');
const btn_normal = document.getElementById('btn-normal');
const btn_hardcore = document.getElementById('btn-hardcore');

/* CONFIGURATION AUDIO (MENU) */
const musique_menu = new Audio('./assets/son/menu_theme.mp3');
musique_menu.loop = true;   
musique_menu.volume = 0.02;

const son_bouton = new Audio('./assets/son/button_sound.mp3');
son_bouton.volume = 0.1;

// ÉTATS GLOBAUX
let sound_on = true;          
let difficulte_choisie = 'normal'; 
let isGameRunning = false;     


/* GESTION DE LA SÉLECTION DE DIFFICULTÉ */
btn_normal.addEventListener('click', () => {
    difficulte_choisie = 'normal';
    // On met le style "active" (rouge) sur Normal et on l'enlève de Hardcore
    btn_normal.classList.add('active');
    btn_hardcore.classList.remove('active');
});

btn_hardcore.addEventListener('click', () => {
    difficulte_choisie = 'hardcore';
    // On met le style "active" (rouge) sur Hardcore et on l'enlève de Normal
    btn_hardcore.classList.add('active');
    btn_normal.classList.remove('active');
});


/* DÉMARRAGE MUSIQUE MENU */
document.addEventListener('click', function() {
    // On ne lance la musique du menu QUE si le jeu n'a pas encore commencé
    if (sound_on && musique_menu.paused && !isGameRunning) {
        musique_menu.play().catch(e => console.log("Attente d'interaction..."));
    }
}, { once: true });


/* GESTION DU BOUTON SON (GLOBAL) */
btn_sound.addEventListener('click', (e) => {
    e.stopPropagation();
    btn_sound.blur(); 

    sound_on = !sound_on; 

    // A. MISE À JOUR VISUELLE
    if (sound_on) {
        btn_sound.textContent = "🔊";
        son_bouton.muted = false;
        son_bouton.currentTime = 0;
        son_bouton.play(); 
    } else {
        btn_sound.textContent = "🔇";
        son_bouton.muted = true;
    }

    // B. GESTION DES MUSIQUES
    if (isGameRunning) {
        if (typeof setGameMusicMute === "function") {
            setGameMusicMute(sound_on);
        }
    } else {
        if (sound_on) {
            musique_menu.play();
        } else {
            musique_menu.pause();
        }
    }
});


/* BRUITAGE DES BOUTONS */
const tous_Boutons = document.querySelectorAll('button');
tous_Boutons.forEach(bouton => {
    bouton.addEventListener('click', (e) => {
        if (bouton.id !== 'btn-sound' && sound_on) {
            son_bouton.currentTime = 0; 
            son_bouton.play();          
        }
    });
});


/* TUTORIEL */
btn_ouvrir_tuto.addEventListener('click', () => {
    ecran_tuto.classList.remove('hidden');
});
btn_fermer_tuto.addEventListener('click', () => {
    ecran_tuto.classList.add('hidden');
});


/* LANCEMENT DU JEU (START) */
btn_start.addEventListener('click', (e) => {
    e.stopPropagation();

    // 1. On signale que le jeu démarre (pour bloquer la musique du menu)
    isGameRunning = true;

    // 2. On coupe définitivement la musique du menu
    musique_menu.pause();
    musique_menu.currentTime = 0;    
    
    // 3. Changement d'écran
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');

    // 4. Lancement du moteur avec les paramètres (Difficulté + État du son)
    initGame(difficulte_choisie, sound_on);
});