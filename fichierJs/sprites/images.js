/* =========================================================================
   CHARGEMENT DES IMAGES (assets/)
   Tous les sprites sont des PNG rangés dans assets/ : un dossier par créature
   ou par personnage, une image par étape d'animation (marche1, marche2…).
   Ceux qu'on a dessinés en code ont leur générateur dans outils/sprites/
   (outils/sprites/exporter.html les réécrit en PNG).
   - image('monstres/joggeur/course3') : une image
   - images('monstres/joggeur/course', 12) : course1 … course12
   VERSION_IMAGES augmente à chaque image chargée : un décor mis en cache avant
   la fin du chargement (le camp du menu) sait qu'il doit se redessiner.
   ========================================================================= */
let VERSION_IMAGES = 0;

function image(chemin) {
    const i = new Image();
    i.onload = () => { VERSION_IMAGES++; };
    i.src = `./assets/${chemin}.png`;
    return i;
}

const images = (chemin, n) => Array.from({ length: n }, (_, k) => image(chemin + (k + 1)));
