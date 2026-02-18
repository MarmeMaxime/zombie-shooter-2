/* =========================================================================
   SETUP & DOM
   ========================================================================= */
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d'); 

const ui_score = document.getElementById('score');
const ui_vies = document.getElementById('vies');
const ui_temps = document.getElementById('temps');

const ecran_game_over = document.getElementById('game-over-overlay');
const ui_final_score = document.getElementById('final-score'); 
const ui_final_time = document.getElementById('final-time');   
const btn_retry = document.getElementById('btn-retry');
const btn_menu = document.getElementById('btn-return-menu');

const background_img = new Image();
background_img.src = './assets/FOND.jpg';

/* =========================================================================
   SYSTÈME AUDIO
   ========================================================================= */
const music_normal = new Audio('./assets/son/background_sound.mp3');
music_normal.loop = true; 
music_normal.volume = 0.1;

const playlist_hardcore = [
    new Audio('./assets/son/hardcore_gamer_music.mp3'),
    new Audio('./assets/son/hardcore_gamer2.mp3')
];
playlist_hardcore.forEach(t => { t.volume = 0.05; t.loop = false; });

let current_music_track = null;
let hardcoreIndex = 0;

function jouerSuivanteHardcore() {
    if (!isSoundEnabled || !jeu_lance) return;
    hardcoreIndex = (hardcoreIndex + 1) % playlist_hardcore.length;
    current_music_track = playlist_hardcore[hardcoreIndex];
    current_music_track.currentTime = 0;
    current_music_track.play();
    current_music_track.addEventListener('ended', jouerSuivanteHardcore, { once: true });
}

function setGameMusicMute(isSoundOn) {
    isSoundEnabled = isSoundOn; 
    if (current_music_track) {
        isSoundOn ? (jeu_lance && current_music_track.play()) : current_music_track.pause();
    }
}

/* =========================================================================
   LOGIQUE DE JEU (GAME LOOP)
   ========================================================================= */
let jeu_lance = false;
var score = 0; 
var vies = 3;
var temps = 0;
let timerInterval = null;
let gameMode = 'normal';   
let isSoundEnabled = true;
var coutVie = 100; 

let lastTime = 0;

function verifierCouleurScore() {
    if (score >= coutVie) ui_score.classList.add('score-ready');
    else ui_score.classList.remove('score-ready');
}

function acheterVie() {
    if (!jeu_lance || score < coutVie) return;
    score -= coutVie;
    vies++;
    coutVie = Math.floor(coutVie * 1.5);
    ui_score.innerText = score;
    ui_vies.innerText = vies;
    verifierCouleurScore();
}

function perdreVie() {
    if (!jeu_lance) return;
    vies--;
    ui_vies.innerText = vies;
    if (vies <= 0) gameOver();
}

function gameOver() {
    jeu_lance = false; 
    if (timerInterval) clearInterval(timerInterval);
    if (current_music_track) {
        current_music_track.pause();
        current_music_track.currentTime = 0;
        current_music_track.removeEventListener('ended', jouerSuivanteHardcore);
    }
    ui_final_score.innerText = score;
    ui_final_time.innerText = temps;
    ecran_game_over.classList.remove('hidden');
}

// Boucle d'animation avec DELTA TIME
function animate(timestamp) {
    if (!jeu_lance) return; 
    
    if (!timestamp) timestamp = performance.now();
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (deltaTime > 100) deltaTime = 100; 
    let timeScale = deltaTime / (1000 / 144);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background_img, 0, 0, canvas.width, canvas.height);
    
    // On transmet le multiplicateur temporel à toutes nos unités
    if (typeof updateZombies === 'function') updateZombies(ctx, canvas.width, canvas.height, timeScale);
    if (typeof updateZombiesTank === 'function') updateZombiesTank(ctx, canvas.width, canvas.height, timeScale);
    if (typeof updateJoueur === 'function') updateJoueur(canvas.height, timeScale);
    if (typeof updateBalles === 'function') updateBalles(ctx, canvas.width, timeScale);
    if (typeof drawJoueur === 'function') drawJoueur(ctx);

    requestAnimationFrame(animate);
}

/* =========================================================================
   INITIALISATION
   ========================================================================= */
btn_retry.addEventListener('click', () => {
    ecran_game_over.classList.add('hidden');
    initGame(gameMode, isSoundEnabled);
});

btn_menu.addEventListener('click', () => {
    jeu_lance = false;
    if (timerInterval) clearInterval(timerInterval);
    if (current_music_track) {
        current_music_track.pause();
        current_music_track.currentTime = 0;
        current_music_track.removeEventListener('ended', jouerSuivanteHardcore);
    }
    if (typeof window.retourMenuPrincipal === "function") {
        window.retourMenuPrincipal();
    } else {
        window.location.reload(); 
    }
});

function initGame(mode, isSoundOn) {
    jeu_lance = true;
    gameMode = mode;
    isSoundEnabled = isSoundOn;

    vies = 3; score = 0; temps = 0; coutVie = 100;
    ui_vies.innerText = vies;
    ui_score.innerText = score;
    ui_temps.innerText = temps;
    verifierCouleurScore(); 

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (jeu_lance) { temps++; ui_temps.innerText = temps; }
    }, 1000);

    joueur.y = 200; 
    joueur.estEnTrainDeTirer = false;
    joueur.peutTirer = true;
    
    if (typeof resetZombies === 'function') resetZombies(mode); 
    if (typeof resetBalles === 'function') resetBalles();
    if (typeof setPlayerSpeed === "function") setPlayerSpeed(mode);

    if (current_music_track) {
        current_music_track.pause();
        current_music_track.removeEventListener('ended', jouerSuivanteHardcore);
    }

    if (mode === 'hardcore') {
        hardcoreIndex = Math.floor(Math.random() * playlist_hardcore.length);
        current_music_track = playlist_hardcore[hardcoreIndex];
        current_music_track.addEventListener('ended', jouerSuivanteHardcore, { once: true });
    } else {
        current_music_track = music_normal;
    }

    if (isSoundEnabled) {
        current_music_track.currentTime = 0;
        current_music_track.play();
    }

    // Réinitialisation de l'horloge au départ
    lastTime = performance.now();
    requestAnimationFrame(animate);
}