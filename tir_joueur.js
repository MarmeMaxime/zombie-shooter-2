const son_tir_america = new Audio('./assets/son/america.mp3');
son_tir_america.volume = 0.4; 

const img_bullet = new Image();
img_bullet.src = './assets/bullet.jpg'; 

let balles = [];

function resetBalles() {
    balles = [];
}

function executerTir() {
    if (typeof isSoundEnabled !== 'undefined' && isSoundEnabled) {
        const bruit = son_tir_america.cloneNode();
        bruit.volume = 0.4;
        bruit.play();
    }

    balles.push({
        x: joueur.x + 50,  
        y: joueur.y + 28,  
        largeur: 25,       
        hauteur: 10,       
        vitesse: 20        
    });
}

function updateBalles(ctx, canvasWidth) {
    for (let i = balles.length - 1; i >= 0; i--) {
        let b = balles[i];
        b.x += b.vitesse;
        ctx.drawImage(img_bullet, b.x, b.y, b.largeur, b.hauteur);

        let aTouche = false;

        // Collision Zombies Normaux
        if (typeof zombies !== 'undefined') {
            for (let j = zombies.length - 1; j >= 0; j--) {
                let z = zombies[j];
                if (b.x < z.x + z.largeur && b.x + b.largeur > z.x &&
                    b.y < z.y + z.hauteur && b.y + b.hauteur > z.y) {
                    
                    zombies.splice(j, 1); 
                    aTouche = true; 
                    
                    if (typeof score !== 'undefined') {
                        score += 10;
                        const ui = document.getElementById('score');
                        if(ui) ui.innerText = score;
                        if (typeof verifierCouleurScore === "function") verifierCouleurScore();
                    }
                    break; 
                }
            }
        }

        // Collision Zombies Tanks
        if (!aTouche && typeof zombiesTank !== 'undefined') {
            for (let j = zombiesTank.length - 1; j >= 0; j--) {
                let z = zombiesTank[j];
                if (b.x < z.x + z.largeur && b.x + b.largeur > z.x &&
                    b.y < z.y + z.hauteur && b.y + b.hauteur > z.y) {
                    
                    aTouche = true; 
                    z.pv--; 

                    if (z.pv <= 0) {
                        zombiesTank.splice(j, 1);
                        if (typeof score !== 'undefined') {
                            score += 50; 
                            const ui = document.getElementById('score');
                            if(ui) ui.innerText = score;
                            if (typeof verifierCouleurScore === "function") verifierCouleurScore();
                        }
                    }
                    break; 
                }
            }
        }

        if (aTouche || b.x > canvasWidth) {
            balles.splice(i, 1);
        }
    }
}