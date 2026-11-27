/* =========================================================================
   JOUEUR : sprites, état, déplacement et animation
   ========================================================================= */
function chargerImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Images d'un perso ou d'une tenue : un dossier avec arret.png, tir.png, marche1..4.png
function charger_sprites(dossier) {
    return {
        arret: chargerImage(`./assets/${dossier}/arret.png`),
        tir: chargerImage(`./assets/${dossier}/tir.png`),
        marche: [1, 2, 3, 4].map(n => chargerImage(`./assets/${dossier}/marche${n}.png`))
    };
}

const SPRITES_PERSO = {};
for (const id in CONFIG.personnages) SPRITES_PERSO[id] = charger_sprites('persos/' + CONFIG.personnages[id].sprites);

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
    joueur.multCadence = 1;
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
        joueur.rechargeTir = joueur.arme.delai * joueur.multCadence;   // boutique des vagues : tir plus rapide
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
    joueur.touche = Math.max(0, (joueur.touche || 0) - dt);
}

// Appelée quand le joueur perd une vie : il clignote en rouge et recule un peu
function joueur_touche() { joueur.touche = 0.5; }

/* ---------- Dessin animé du joueur ----------
   En plus des images (arrêt, tir, 4 de marche), le corps est animé en deux
   parties, buste et jambes, coupées à la hanche :
   - arrêt : il respire (le buste monte et descend d'un pixel)
   - marche : le buste rebondit à chaque demi-pas (8 positions au lieu de 4)
   - tir : recul de l'arme et du buste
   - perte d'une vie : clignote en rouge et recule
   Ça marche pour tous les personnages et toutes les tenues, sans images en plus. */
const HANCHE_JOUEUR = 0.62;      // hauteur de la hanche dans le sprite (fraction depuis le haut)

function draw_joueur(ctx) {
    let img = joueur.sprites.arret;
    if (joueur.animTir > 0) img = joueur.sprites.tir;
    else if (joueur.bouge) img = joueur.sprites.marche[joueur.etapeMarche];

    const t = joueur.taille, px = t / 64;                   // un pixel du sprite
    const temps = performance.now() / 1000;
    let busteY = 0, dx = 0;
    if (joueur.animTir > 0) {
        // Recul : tout le corps part en arrière au moment du coup, puis revient
        const r = joueur.animTir / CONFIG.joueur.dureeAnimTir;
        dx = -2 * px * Math.max(0, r * 2 - 1);
        busteY = r > 0.6 ? px : 0;
    } else if (joueur.bouge) {
        busteY = joueur.tempsImage > CONFIG.joueur.dureeImageMarche / 2 ? px : 0;   // rebond à mi-pas
    } else {
        busteY = Math.sin(temps * Math.PI * 1.2) > 0.2 ? px : 0;                  // respiration
    }
    if (joueur.touche > 0) dx -= 3 * px * (joueur.touche / 0.5);

    // Filtre : clignotement rouge quand il est touché, sinon le skin équipé
    const clignote = joueur.touche > 0 && Math.floor(joueur.touche * 16) % 2 === 0;
    const filtre = clignote ? 'brightness(1.4) sepia(1) hue-rotate(-50deg) saturate(6)' : Loot.filtre(joueur.perso, temps);

    const nw = img.naturalWidth || img.width || 64, nh = img.naturalHeight || img.height || 64;
    const x = joueur.x + dx, y = joueur.y;
    ctx.save();
    if (filtre) ctx.filter = filtre;
    // Jambes (fixes), puis buste décalé verticalement
    ctx.drawImage(img, 0, nh * HANCHE_JOUEUR, nw, nh * (1 - HANCHE_JOUEUR), x, y + t * HANCHE_JOUEUR, t, t * (1 - HANCHE_JOUEUR));
    ctx.drawImage(img, 0, 0, nw, nh * HANCHE_JOUEUR, x, y + busteY, t, t * HANCHE_JOUEUR);
    ctx.restore();
    const skin = Loot.skin_equipe(joueur.perso);
    if (skin && skin.etoiles && !clignote) draw_etoiles(ctx, img, skin.etoiles, x, y, t, busteY, temps);
}

// Skin « Renarde céleste » : des étoiles qui scintillent dans le pelage.
// Les pixels du pelage sont repérés une fois par image (par leur couleur) ; si le navigateur
// refuse de lire l'image (jeu ouvert sans serveur), on garde seulement les étoiles fixes du sprite.
const PELAGE = new Map();
function pixels_pelage(img, couleurs) {
    if (PELAGE.has(img)) return PELAGE.get(img);
    if (!img.complete || !img.naturalWidth) return null;
    let liste = [];
    try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const voulues = new Set(couleurs.map(h => parseInt(h, 16)));
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] > 200 && voulues.has((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])) liste.push([(i / 4) % c.width, Math.floor(i / 4 / c.width)]);
        }
    } catch (e) { liste = []; }
    const res = { liste, nw: img.naturalWidth, nh: img.naturalHeight };
    PELAGE.set(img, res);
    return res;
}
function draw_etoiles(ctx, img, couleurs, x, y, t, busteY, temps) {
    const p = pixels_pelage(img, couleurs);
    if (!p || !p.liste.length) return;
    const sx = t / p.nw, sy = t / p.nh;
    ctx.save();
    // 6 étoiles à la fois, chacune vit 0,8 s à une place tirée au sort (de façon stable)
    for (let k = 0; k < 6; k++) {
        const cycle = temps / 0.8 + k / 6, n = Math.floor(cycle), vie = cycle - n;
        const h = Math.abs(Math.sin((n * 7 + k * 13) * 12.9898) * 43758.5453) % 1;
        const [px, py] = p.liste[Math.floor(h * p.liste.length)];
        const ex = x + (px + 0.5) * sx, ey = y + (py + 0.5) * sy + (py < p.nh * HANCHE_JOUEUR ? busteY : 0);
        const a = Math.sin(vie * Math.PI), r = sx * (0.6 + 1.4 * a);
        ctx.globalAlpha = a;
        ctx.fillStyle = k % 3 ? '#ffffff' : '#ffe14d';
        ctx.fillRect(ex - sx / 2, ey - r, sx, r * 2);
        ctx.fillRect(ex - r, ey - sx / 2, r * 2, sx);
    }
    ctx.restore();
}

/* =========================================================================
   CLAVIER
   ========================================================================= */
// Les touches sont réglables (options.js) : Touches.action(code) dit à quoi sert une touche
function gerer_touche(e, appui) {
    if (!partie_en_cours()) return;

    const action = Touches.action(e.code);
    if (action === 'haut' || action === 'bas' || action === 'tir') {
        // Empêche le défilement de la page et l'activation du bouton qui a le focus
        e.preventDefault();
        commandes[action] = appui;
    } else if (appui && action === 'vie' && !e.repeat) {
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
// Doigt posé sur TIR : une pause (ou une réplique du Sergent) relâche les commandes,
// mais si le doigt est toujours là à la reprise, le tir automatique repart tout seul
let doigtSurTir = false;
{
    const btnTir = document.getElementById('btn-touch-shoot');
    btnTir.addEventListener('pointerdown', () => { commandes.tirAuto = true; doigtSurTir = true; });
    // Au relâchement, le clavier retrouve son mode « un tir par appui »
    for (const evt of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        btnTir.addEventListener(evt, () => { commandes.tirAuto = false; doigtSurTir = false; });
    }
}
function reprendre_tir_tactile() {
    if (doigtSurTir) commandes.tir = commandes.tirAuto = true;
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
