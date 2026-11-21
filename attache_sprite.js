/* =========================================================================
   ZOMBIE ATTACHÉ (cible de l'entraînement, voir tutoriel.js)
   C'est le zombie de base (ses images de marche, assets/zombie_marche*.png),
   ficelé à un poteau de bois : le poteau est dessiné derrière lui, les cordes
   par-dessus son corps seulement. Ses bras tendus et ses jambes qui
   gesticulent font la lutte. Abattu, il tombe et le poteau reste debout.
   - lier(image, decalage) : une image « attachée » faite à partir d'une image
     du zombie de base (dessinée dès que l'image est chargée)
   - poteau : le poteau resté seul, cordes coupées qui pendent
   ========================================================================= */
const SPRITES_ATTACHE = (() => {
    const { poser, ellipse, rect, trait } = PixelArt;
    const COULEURS = { P: '#7a5232', p: '#4e3420', R: '#d8c08a', r: '#a08a5a', D: '#5a4026', K: '#050403' };
    const PARTIES = { O: { rang: 0, base: 'P', ombre: 'p', bande: 'fine' } };
    const CORDES = [23, 30, 50];   // hauteur des tours de corde (torse, taille, jambes)

    // Poteau de bois derrière le zombie (il regarde à gauche : le poteau est dans son dos)
    function poteau(g) {
        ellipse(g, 41, 62, 9, 2, 'D', 0.2);
        rect(g, 39, 6, 44, 62, 'O');
        rect(g, 38, 5, 45, 6, 'O');
        trait(g, 41, 12, 41, 59, 'p');                            // veine du bois
    }
    const grille_poteau = coupees => {
        const g = PixelArt.grille(64);
        poteau(g);
        if (coupees) {
            for (const y of CORDES) {   // bouts de corde tranchés qui pendent
                trait(g, 38, y, 38, y + 5, 'R');
                trait(g, 45, y, 46, y + 4, 'R');
                poser(g, 37, y + 6, 'r');
            }
        }
        return PixelArt.finir(g, PARTIES);
    };
    const poteauDebout = PixelArt.en_image(grille_poteau(false), COULEURS);
    const poteauCoupe = PixelArt.en_image(grille_poteau(true), COULEURS);

    function lier(image, decalage) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        function dessiner() {
            const g = c.getContext('2d');
            g.imageSmoothingEnabled = false;
            g.clearRect(0, 0, 64, 64);
            g.drawImage(image, decalage, 0, 64, 64);
            // Cordes sur le corps seulement (« source-atop » : là où le zombie est dessiné)
            g.globalCompositeOperation = 'source-atop';
            for (const y of CORDES) {
                g.fillStyle = COULEURS.R; g.fillRect(0, y, 64, 1);
                g.fillStyle = COULEURS.r; g.fillRect(0, y + 1, 64, 1);
                g.fillStyle = COULEURS.K; g.fillRect(0, y + 2, 64, 1);
            }
            // Le poteau, derrière lui
            g.globalCompositeOperation = 'destination-over';
            g.drawImage(poteauDebout, 0, 0);
            // Les cordes font aussi le tour du poteau, avec un nœud
            g.globalCompositeOperation = 'source-over';
            for (const y of CORDES) {
                g.fillStyle = COULEURS.R; g.fillRect(39, y, 6, 1);
                g.fillStyle = COULEURS.r; g.fillRect(39, y + 1, 6, 1);
                g.fillStyle = COULEURS.R; g.fillRect(45, y - 1, 2, 3);
            }
        }
        if (image.complete && image.naturalWidth) dessiner(); else image.addEventListener('load', dessiner, { once: true });
        return c;
    }

    return { lier, poteau: poteauCoupe };
})();
