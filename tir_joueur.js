/* =========================================================================
   1. CHARGEMENT AUDIO
   ========================================================================= */
const son_tir_america = new Audio('./assets/son/america.mp3');
son_tir_america.volume = 0.4; 


/* =========================================================================
   2. LOGIQUE DE TIR (HITSCAN CIBLÉ)
   ========================================================================= */
function executerTir() {
    // A. JOUER LE SON
    if (typeof isSoundEnabled !== 'undefined' && isSoundEnabled) {
        const bruit = son_tir_america.cloneNode();
        bruit.volume = 0.4;
        bruit.play();
    }

    // B. RECHERCHE DU ZOMBIE LE PLUS PROCHE
    let margeY = 65; 
    // Adaptation Hardcore
    if (typeof gameMode !== 'undefined' && gameMode === 'hardcore') {
        margeY = 50;
    }
    
    let indexDuZombieLePlusProche = -1;
    let plusPetiteDistance = Infinity;

    for (let i = 0; i < zombies.length; i++) {
        let z = zombies[i];

        if (z.x > joueur.x && Math.abs(z.y - joueur.y) < margeY) {
            let distance = z.x - joueur.x;
            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                indexDuZombieLePlusProche = i;
            }
        }
    }

    // C. APPLICATION DES DÉGÂTS
    if (indexDuZombieLePlusProche !== -1) {
        zombies.splice(indexDuZombieLePlusProche, 1);

        if (typeof score !== 'undefined') {
            score += 10;
            const ui_score = document.getElementById('score');
            if (ui_score) ui_score.innerText = score;
            
            // On vérifie la couleur À CHAQUE FOIS qu'on marque des points
            if (typeof verifierCouleurScore === "function") {
                verifierCouleurScore();
            }
        }
    }
}