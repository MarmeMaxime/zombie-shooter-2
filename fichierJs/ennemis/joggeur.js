/* =========================================================================
   LE JOGGEUR
   Sa charge : marche -> cri (« ! ») -> sprint -> essoufflé -> marche.
   Réglages : CONFIG.joggeur ; sprite : assets/monstres/joggeur/.
   ========================================================================= */
/* ---------- Charge du Joggeur ----------
   marche -> (aligné avec le joueur) cri -> course -> essoufflé -> marche */
function gerer_joggeur(z, dt) {
    const cfg = CONFIG.joggeur;
    const j = z.joggeur;
    j.recharge = Math.max(0, j.recharge - dt);
    j.chrono -= dt;

    if (j.etat === 'marche') {
        const aligne = Math.abs(z.y - joueur.y) < cfg.alignement;
        const loin = z.x - (joueur.x + joueur.taille) > cfg.distanceMin * MONDE.echelleX;
        if (aligne && loin && j.recharge === 0 && z.x < MONDE.largeur - 20) {
            j.etat = 'cri';
            j.chrono = cfg.dureeCri;
            Son.effet('cri');
        }
    } else if (j.chrono <= 0) {
        if (j.etat === 'cri') {
            j.etat = 'course';
            j.chrono = cfg.dureeSprint;
        } else if (j.etat === 'course') {
            // Fin du sprint sans avoir touché le joueur : charge esquivée
            j.etat = 'essouffle';
            j.chrono = cfg.dureeEssoufflement;
            if (typeof Succes !== 'undefined') Succes.compter('esquives');
        } else if (j.etat === 'essouffle') {
            j.etat = 'marche';
            j.recharge = cfg.recharge;
        }
    }
}

function vitesse_joggeur(z) {
    switch (z.joggeur.etat) {
        case 'course': return parMode(CONFIG.joggeur.vitesseSprint);
        case 'marche': return z.vitesse;
        default: return 0;   // il crie ou reprend son souffle : immobile
    }
}

function dessiner_joggeur(ctx, z) {
    const j = z.joggeur;
    const images = j.etat === 'course' ? SPRITES_JOGGEUR.course
        : j.etat === 'essouffle' ? SPRITES_JOGGEUR.essouffle : SPRITES_JOGGEUR.marche;
    const img = images[z.etape % images.length];

    if (j.etat === 'course') {
        // Traînée derrière lui (il fonce vers la gauche)
        ctx.save();
        for (const [decalage, alpha] of [[22, 0.15], [11, 0.3]]) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, z.x + decalage, z.y, z.taille, z.taille);
        }
        ctx.restore();
    }
    // Il tremble en criant
    const tremble = j.etat === 'cri' ? (Math.random() - 0.5) * 3 : 0;
    ctx.drawImage(img, z.x + tremble, z.y, z.taille, z.taille);

    if (j.etat === 'cri') {
        // Le « ! » d'alerte au-dessus de sa tête
        ctx.save();
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#ff3333';
        ctx.strokeText('!', z.x + 26, z.y - 2);
        ctx.fillText('!', z.x + 26, z.y - 2);
        ctx.restore();
    } else if (j.etat === 'essouffle') {
        // Petits nuages de souffle
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        const t = performance.now() / 300;
        for (let k = 0; k < 2; k++) {
            ctx.beginPath();
            ctx.arc(z.x + 10 - ((t + k * 0.5) % 1) * 12, z.y + 30 - k * 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
