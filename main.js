/* =========================================================================
   1. SETUP DU CANVAS & UI
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
   2. SYSTÈME AUDIO GLOBAL
   ========================================================================= */
const music_normal = new Audio('./assets/son/background_sound.mp3');
music_normal.loop = true; music_normal.volume = 0.05;

const music_hardcore = new Audio('./assets/son/hardcore_gamer2.mp3');
music_hardcore.loop = true; music_hardcore.volume = 0.05;

let current_music_track = null;

function setGameMusicMute(isSoundOn) {
    if (current_music_track) {
        if (isSoundOn) current_music_track.play();
        else current_music_track.pause();
    }
}

/* =========================================================================
   3. ÉTAT DU JEU
   ========================================================================= */
let jeu_lance = false;
var score = 0; 
var vies = 3;
var temps = 0;
let timerInterval = null;
let gameMode = 'normal';   
let isSoundEnabled = true;

var coutVie = 100; 

/* =========================================================================
   4. LOGIQUE D'ACHAT DE VIE
   ========================================================================= */
function verifierCouleurScore() {
    // DEBUG : Regarde la console (F12) pour voir si cette ligne s'affiche
    // console.log("Check Couleur. Score:", score, "Cout:", coutVie);

    if (score >= coutVie) {
        if (!ui_score.classList.contains('score-ready')) {
            console.log(">>> VERT ACTIVÉ ! <<<");
            ui_score.classList.add('score-ready');
        }
    } else {
        ui_score.classList.remove('score-ready');
    }
}

function acheterVie() {
    if (!jeu_lance) return;

    if (score >= coutVie) {
        score -= coutVie;
        vies++;
        coutVie = Math.floor(coutVie * 1.5);
        
        ui_score.innerText = score;
        ui_vies.innerText = vies;
        
        verifierCouleurScore();
        console.log("Vie achetée !");
    }
}

/* =========================================================================
   5. BOUCLE DE JEU
   ========================================================================= */
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
    }
    ui_final_score.innerText = score;
    ui_final_time.innerText = temps;
    ecran_game_over.classList.remove('hidden');
}

function animate() {
    if (!jeu_lance) return; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background_img, 0, 0, canvas.width, canvas.height);
    updateZombies(ctx, canvas.width, canvas.height);
    updateJoueur(canvas.height);
    drawJoueur(ctx);
    requestAnimationFrame(animate);
}

/* =========================================================================
   6. INIT
   ========================================================================= */
btn_retry.addEventListener('click', () => {
    ecran_game_over.classList.add('hidden');
    initGame(gameMode, isSoundEnabled);
});

btn_menu.addEventListener('click', () => {
    window.location.reload(); 
});

function initGame(mode, isSoundOn) {
    console.log("--- START GAME ---");
    jeu_lance = true;
    gameMode = mode;
    isSoundEnabled = isSoundOn;

    vies = 3;
    score = 0;
    temps = 0;
    coutVie = 100;

    ui_vies.innerText = vies;
    ui_score.innerText = score;
    ui_temps.innerText = temps;
    
    verifierCouleurScore(); // Reset couleur

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (jeu_lance) {
            temps++;
            ui_temps.innerText = temps;
        }
    }, 1000);

    joueur.y = 200; 
    joueur.estEnTrainDeTirer = false;
    joueur.peutTirer = true;
    
    resetZombies(mode); 

    if (typeof setPlayerSpeed === "function") setPlayerSpeed(mode);

    if (mode === 'hardcore') current_music_track = music_hardcore;
    else current_music_track = music_normal;

    if (isSoundEnabled) {
        current_music_track.currentTime = 0;
        current_music_track.play();
    }

    animate();
}