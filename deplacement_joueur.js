/* =========================================================================
   JOUEUR : sprites, état, déplacement et animation
   ========================================================================= */
function chargerImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Sprites de chaque personnage (le soldat garde les noms de fichiers d'origine)
function charger_sprites(prefixe) {
    if (!prefixe) {
        return {
            arret: chargerImage('./assets/joueur_arrêt.png'),
            tir: chargerImage('./assets/joueur_tir.png'),
            marche: [1, 2, 3, 4].map(n => chargerImage(`./assets/joueur_marche${n}.png`))
        };
    }
    return {
        arret: chargerImage(`./assets/${prefixe}_arret.png`),
        tir: chargerImage(`./assets/${prefixe}_tir.png`),
        marche: [1, 2, 3, 4].map(n => chargerImage(`./assets/${prefixe}_marche${n}.png`))
    };
}

const SPRITES_PERSO = {};
for (const id in CONFIG.personnages) SPRITES_PERSO[id] = charger_sprites(CONFIG.personnages[id].sprites);

const joueur = {
    x: CONFIG.joueur.x,
    y: 200,
    taille: CONFIG.joueur.taille,
    vitesse: CONFIG.joueur.vitesse.normal,
    perso: 'soldat',
    arme: CONFIG.armes.fusil,
    sprites: SPRITES_PERSO.soldat,

    tempsImage: 0,
    etapeMarche: 0,
    bouge: false,

    rechargeTir: 0,      // temps restant avant de pouvoir retirer
    animTir: 0,          // temps restant d'affichage du sprite de tir
    gachetteRelachee: true
};

// État des commandes (clavier et tactile écrivent au même endroit)
const commandes = { haut: false, bas: false, tir: false };

function reset_joueur(mode, perso) {
    joueur.perso = perso;
    joueur.arme = CONFIG.armes[CONFIG.personnages[perso].arme];
    joueur.sprites = Loot.sprites(perso);   // tenue équipée (lootbox) ou sprites de base
    joueur.y = 200;
    // Vitesse de base du mode, multipliée par celle du personnage (le Soldat est le plus mobile)
    joueur.vitesse = CONFIG.joueur.vitesse[mode] * (CONFIG.personnages[perso].vitesse || 1);
    joueur.tempsImage = 0;
    joueur.etapeMarche = 0;
    joueur.rechargeTir = 0;
    joueur.animTir = 0;
    joueur.gachetteRelachee = true;
    relacher_commandes();
}

function relacher_commandes() {
    commandes.haut = commandes.bas = commandes.tir = commandes.tirAuto = false;
    commandes.axe = 0;
    if (typeof Joystick !== 'undefined') Joystick.recentrer();
}

function update_joueur(dt, hauteurCanvas) {
    // Déplacement : joystick analogique (-1 à 1) s'il est utilisé, sinon le clavier
    // (haut + bas en même temps = immobile)
    const direction = commandes.axe || ((commandes.bas ? 1 : 0) - (commandes.haut ? 1 : 0));
    joueur.bouge = direction !== 0;
    joueur.y += direction * joueur.vitesse * dt;
    joueur.y = Math.max(CONFIG.margeHaut, Math.min(hauteurCanvas - CONFIG.margeBas, joueur.y));

    // Tir : un tir par appui au clavier, limité par la cadence.
    // Le bouton TIR tactile maintenu (tirAuto) tire en continu à la cadence de l'arme.
    joueur.rechargeTir = Math.max(0, joueur.rechargeTir - dt);
    joueur.animTir = Math.max(0, joueur.animTir - dt);

    if (!commandes.tir || commandes.tirAuto) joueur.gachetteRelachee = true;
    if (commandes.tir && joueur.gachetteRelachee && joueur.rechargeTir === 0) {
        joueur.gachetteRelachee = false;
        joueur.rechargeTir = joueur.arme.delai;
        joueur.animTir = CONFIG.joueur.dureeAnimTir;
        tirer(joueur);
    }

    // Animation de marche
    if (joueur.bouge) {
        joueur.tempsImage += dt;
        if (joueur.tempsImage >= CONFIG.joueur.dureeImageMarche) {
            joueur.tempsImage -= CONFIG.joueur.dureeImageMarche;
            joueur.etapeMarche = (joueur.etapeMarche + 1) % joueur.sprites.marche.length;
        }
    } else {
        joueur.tempsImage = 0;
    }
}

function draw_joueur(ctx) {
    let img = joueur.sprites.arret;
    if (joueur.animTir > 0) img = joueur.sprites.tir;
    else if (joueur.bouge) img = joueur.sprites.marche[joueur.etapeMarche];

    // Skin équipé (gagné dans les caisses) = filtre de couleur sur le sprite
    const filtre = Loot.filtre(joueur.perso, performance.now() / 1000);
    if (filtre) {
        ctx.save();
        ctx.filter = filtre;
        ctx.drawImage(img, joueur.x, joueur.y, joueur.taille, joueur.taille);
        ctx.restore();
    } else {
        ctx.drawImage(img, joueur.x, joueur.y, joueur.taille, joueur.taille);
    }
}

/* =========================================================================
   CLAVIER
   ========================================================================= */
const TOUCHES = {
    ArrowUp: 'haut', KeyW: 'haut', KeyZ: 'haut',
    ArrowDown: 'bas', KeyS: 'bas',
    Space: 'tir'
};

function gerer_touche(e, appui) {
    if (!partie_en_cours()) return;

    const action = TOUCHES[e.code];
    if (action) {
        // Empêche le défilement de la page et l'activation du bouton qui a le focus
        e.preventDefault();
        commandes[action] = appui;
    } else if (appui && e.code === 'KeyV' && !e.repeat) {
        acheter_vie();
    }
}

document.addEventListener('keydown', e => gerer_touche(e, true));
document.addEventListener('keyup', e => gerer_touche(e, false));

// Si la fenêtre perd le focus, on relâche tout (sinon le joueur continue de bouger)
window.addEventListener('blur', relacher_commandes);

/* =========================================================================
   COMMANDES TACTILES (pointer events : fonctionne au doigt et à la souris)
   ========================================================================= */
function lier_bouton_maintenu(id, action) {
    const bouton = document.getElementById(id);
    const relacher = () => { commandes[action] = false; };

    bouton.addEventListener('pointerdown', e => {
        e.preventDefault();
        try { bouton.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
        commandes[action] = true;
    });
    bouton.addEventListener('pointerup', relacher);
    bouton.addEventListener('pointercancel', relacher);
    bouton.addEventListener('lostpointercapture', relacher);
}

lier_bouton_maintenu('btn-touch-shoot', 'tir');
{
    const btnTir = document.getElementById('btn-touch-shoot');
    btnTir.addEventListener('pointerdown', () => { commandes.tirAuto = true; });
    // Au relâchement, le clavier retrouve son mode « un tir par appui »
    for (const evt of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        btnTir.addEventListener(evt, () => { commandes.tirAuto = false; });
    }
}

/* ---------- Joystick virtuel ----------
   On pose le doigt n'importe où dans sa zone, puis on glisse vers le haut ou
   le bas : la vitesse dépend de la distance au centre (analogique). */
const Joystick = (() => {
    const zone = document.getElementById('joystick');
    const bouton = document.getElementById('joystick-bouton');
    const ZONE_MORTE = 0.15;
    // Mesures en pixels d'écran ; « facteur » convertit vers les pixels CSS de la zone
    // (l'interface est agrandie avec zoom, voir --ui dans styles.css)
    let doigt = null, centreY = 0, rayon = 1, facteur = 1;

    function deplacer(e) {
        const dy = Math.max(-rayon, Math.min(rayon, e.clientY - centreY));
        bouton.style.transform = `translate(-50%, calc(-50% + ${dy / facteur}px))`;
        const axe = dy / rayon;
        commandes.axe = Math.abs(axe) < ZONE_MORTE ? 0 : axe;
    }

    function recentrer() {
        doigt = null;
        commandes.axe = 0;
        bouton.style.transform = 'translate(-50%, -50%)';
        zone.classList.remove('actif');
    }

    zone.addEventListener('pointerdown', e => {
        e.preventDefault();
        doigt = e.pointerId;
        try { zone.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
        const r = zone.getBoundingClientRect();
        centreY = r.top + r.height / 2;
        rayon = r.height / 2;
        facteur = r.height / (zone.offsetHeight || r.height);
        zone.classList.add('actif');
        deplacer(e);
    });
    zone.addEventListener('pointermove', e => { if (e.pointerId === doigt) deplacer(e); });
    zone.addEventListener('pointerup', recentrer);
    zone.addEventListener('pointercancel', recentrer);
    zone.addEventListener('lostpointercapture', recentrer);

    return { recentrer };
})();

document.getElementById('btn-touch-buy').addEventListener('pointerdown', e => {
    e.preventDefault();
    acheter_vie();
});
