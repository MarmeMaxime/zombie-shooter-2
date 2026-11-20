/* =========================================================================
   BALLES
   ========================================================================= */
const img_balle = new Image();
img_balle.src = './assets/bullet.jpg';

let balles = [];

function reset_balles() {
    balles = [];
}

function tirer(tireur) {
    Son.tir();
    balles.push({
        x: tireur.x + CONFIG.balle.decalageX,
        y: tireur.y + CONFIG.balle.decalageY,
        largeur: CONFIG.balle.largeur,
        hauteur: CONFIG.balle.hauteur
    });
}

function update_balles(dt, largeurCanvas) {
    const deplacement = CONFIG.balle.vitesse * dt;

    // On garde uniquement les balles qui n'ont rien touché et sont encore à l'écran
    balles = balles.filter(b => {
        // Test sur toute la trajectoire de la frame pour ne jamais "traverser" un zombie
        const trajet = { x: b.x, y: b.y, largeur: b.largeur + deplacement, hauteur: b.hauteur };
        b.x += deplacement;

        const cible = trouver_cible(trajet);
        if (cible) {
            toucher_zombie(cible);
            return false;
        }
        return b.x < largeurCanvas;
    });
}

function draw_balles(ctx) {
    for (const b of balles) {
        ctx.drawImage(img_balle, b.x, b.y, b.largeur, b.hauteur);
    }
}
