/* =========================================================================
   POUVOIRS SPÉCIAUX
   Chaque personnage a un pouvoir lié à son arme (CONFIG.pouvoirs) :
   - Soldat, Rafale : tir automatique très rapide pendant quelques secondes
   - Brutus, Onde de choc : blesse les zombies collés à lui, repousse et étourdit les autres
   - Mira, Tapis de bombes : des obus tombent sur les zombies les plus proches
   - Lassie, Orage : la foudre frappe chaque zombie à l'écran
   La jauge se remplit en tuant des zombies ; touche E (ou Maj) ou bouton ★.
   ========================================================================= */
const pouvoir = {
    id: 'rafale',
    charge: 0,          // nombre de zombies tués depuis le dernier pouvoir
    rafale: 0,          // temps restant de rafale
    obus: [],           // obus du tapis de bombes : { x, y, chrono }
    ondes: [],          // anneaux de l'onde de choc : { x, y, age }
    eclair: 0           // flash blanc de l'orage
};

const cfg_pouvoir = () => CONFIG.pouvoirs[pouvoir.id];
// Victimes nécessaires pour remplir la jauge (moins avec la boutique des vagues)
const kills_requis = () => Math.max(5, Math.round(cfg_pouvoir().kills * (pouvoir.reduction || 1)));
const pouvoir_pret = () => pouvoir.charge >= kills_requis();

function reset_pouvoir(perso) {
    Object.assign(pouvoir, { id: CONFIG.personnages[perso].pouvoir, charge: 0, rafale: 0, obus: [], ondes: [], eclair: 0 });
    maj_hud_pouvoir();
}

// Appelée par toucher_zombie à chaque zombie tué (y compris par un pouvoir)
function pouvoir_zombie_tue() {
    const avant = pouvoir_pret();
    pouvoir.charge = Math.min(kills_requis(), pouvoir.charge + 1);
    if (!avant && pouvoir_pret()) {
        Son.effet('pouvoirPret');
        if (typeof Conseils !== 'undefined') Conseils.pouvoir_pret();
    }
    maj_hud_pouvoir();
}

function activer_pouvoir() {
    if (!partie_en_cours() || !pouvoir_pret()) return;
    pouvoir.charge = 0;
    maj_hud_pouvoir();
    POUVOIRS[pouvoir.id](cfg_pouvoir());
    Son.vibrer(0.6, 120);
    if (typeof Succes !== 'undefined' && !etat.tuto) Succes.compter('pouvoirs');
    if (typeof statsPerso !== 'undefined' && !etat.tuto) statsPerso(etat.perso).pouvoirs++;   // missions « utiliser N fois »
}

const centre_zombie = z => ({ x: z.x + z.taille / 2, y: z.y + z.taille / 2 });
const zombies_visibles = () => zombies.filter(z => z.x < MONDE.largeur - z.taille * 0.3 && z.x + z.taille > 0);

const POUVOIRS = {
    rafale(cfg) {
        pouvoir.rafale = cfg.duree;
        Son.effet('rafale');
    },

    onde(cfg) {
        const ox = joueur.x + joueur.taille / 2, oy = joueur.y + joueur.taille * 0.8;
        pouvoir.ondes.push({ x: ox, y: oy, age: 0 });
        compteurTirs++;
        for (const z of zombies.slice()) {
            const c = centre_zombie(z);
            const d = Math.hypot((c.x - ox) / MONDE.echelleX, c.y - oy);
            if (d > cfg.portee) continue;
            const force = 1 - 0.5 * d / cfg.portee;            // plus fort de près
            const lourd = z === boss ? 0.3 : 1;                 // le boss bouge à peine
            z.x = Math.min(MONDE.largeur - z.taille * 0.5, z.x + cfg.recul * force * lourd * MONDE.echelleX);
            z.etourdi = cfg.etourdissement * (z === boss ? 0.5 : 1);
            if (d <= cfg.porteeDegats) toucher_zombie(z, 1, compteurTirs);
        }
        secouer_ecran(3);
        Son.effet('onde');
    },

    artillerie(cfg) {
        // Cibles : les zombies les plus proches du joueur ; s'il en manque, au hasard devant lui
        const cibles = zombies_visibles().sort((a, b) => a.x - b.x).slice(0, cfg.obus);
        for (let k = 0; k < cfg.obus; k++) {
            const z = cibles[k];
            const c = z ? centre_zombie(z) : { x: MONDE.largeur * (0.35 + Math.random() * 0.5), y: y_aleatoire(MONDE.hauteur) + 30 };
            pouvoir.obus.push({ x: c.x, y: c.y, chrono: cfg.delai + k * cfg.intervalle, suit: z || null });
        }
        Son.effet('sifflement');
    },

    orage(cfg) {
        for (const z of zombies_visibles()) {
            const c = centre_zombie(z);
            arcs.push({ points: [{ x: c.x + (Math.random() - 0.5) * 60, y: -20 }, { x: c.x + (Math.random() - 0.5) * 30, y: c.y / 2 }, c], age: 0 });
            z.foudroye = true;
            compteurTirs++;   // chaque éclair est un coup à part (l'Anti-émeute perd un PV)
            toucher_zombie(z, z === boss ? cfg.degatsBoss : cfg.degats, compteurTirs);
        }
        pouvoir.eclair = 0.25;
        secouer_ecran(2);
        Son.effet('orage');
    }
};

function update_pouvoir(dt) {
    // Rafale : le soldat tire tout seul, à la cadence du pouvoir
    if (pouvoir.rafale > 0) {
        pouvoir.rafale = Math.max(0, pouvoir.rafale - dt);
        if (joueur.rechargeTir === 0) {
            joueur.rechargeTir = cfg_pouvoir().cadence;
            joueur.animTir = CONFIG.joueur.dureeAnimTir;
            tirer(joueur);
        }
    }
    // Obus : ils suivent leur cible jusqu'à l'impact
    for (const o of pouvoir.obus) {
        o.chrono -= dt;
        if (o.suit && zombies.includes(o.suit)) Object.assign(o, centre_zombie(o.suit));
        if (o.chrono <= 0) {
            exploser({ x: o.x - 5, y: o.y - 5, largeur: 10, hauteur: 10, rayon: CONFIG.armes.grenade.rayon, degats: CONFIG.armes.grenade.degats, tir: ++compteurTirs });
        }
    }
    pouvoir.obus = pouvoir.obus.filter(o => o.chrono > 0);
    for (const o of pouvoir.ondes) o.age += dt;
    pouvoir.ondes = pouvoir.ondes.filter(o => o.age < 0.5);
    pouvoir.eclair = Math.max(0, pouvoir.eclair - dt);
}

/* ---------- Dessin ---------- */
function draw_pouvoir(ctx) {
    ctx.save();
    // Rafale : halo doré autour du soldat
    if (pouvoir.rafale > 0) {
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 50);
        ctx.fillStyle = '#ffd23c';
        ctx.beginPath();
        ctx.ellipse(joueur.x + joueur.taille / 2, joueur.y + joueur.taille / 2, joueur.taille * 0.6, joueur.taille * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // Onde de choc : un anneau de poussière qui s'élargit
    for (const o of pouvoir.ondes) {
        const p = o.age / 0.5;
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = '#e8d2a0';
        ctx.lineWidth = 10 * (1 - p) + 2;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, CONFIG.pouvoirs.onde.portee * MONDE.echelleX * p, CONFIG.pouvoirs.onde.portee * 0.45 * p, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Obus : viseur au sol, puis l'obus qui tombe
    for (const o of pouvoir.obus) {
        const p = Math.max(0, 1 - o.chrono / CONFIG.pouvoirs.artillerie.delai);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ff3a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y + 22, 16, 6, 0, 0, Math.PI * 2);
        ctx.moveTo(o.x - 20, o.y + 22); ctx.lineTo(o.x + 20, o.y + 22);
        ctx.stroke();
        if (p > 0) {
            const y = o.y - 300 * (1 - p);
            ctx.fillStyle = '#3a4a2a';
            ctx.fillRect(o.x - 3, y - 10, 6, 12);
            ctx.fillStyle = '#c8a040';
            ctx.fillRect(o.x - 3, y + 2, 6, 3);
        }
    }
    ctx.restore();
}

// Flash blanc de l'orage, par-dessus tout le reste
function draw_flash_pouvoir(ctx) {
    if (pouvoir.eclair <= 0) return;
    ctx.save();
    ctx.globalAlpha = pouvoir.eclair * 2;
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(0, 0, MONDE.largeur, MONDE.hauteur);
    ctx.restore();
}

/* ---------- Interface : bouton ★ (rempli selon la charge) et touche E ---------- */
const bouton_pouvoir = document.getElementById('btn-pouvoir');
const texte_pouvoir = document.getElementById('pouvoir-hud');

function maj_hud_pouvoir() {
    const p = Math.min(1, pouvoir.charge / kills_requis());
    bouton_pouvoir.style.setProperty('--charge', (p * 100).toFixed(0) + '%');
    bouton_pouvoir.classList.toggle('pret', p >= 1);
    texte_pouvoir.textContent = p >= 1 ? T('★ PRÊT') : `★ ${Math.floor(p * 100)}%`;   // court : la barre doit tenir entre les boutons
    texte_pouvoir.classList.toggle('pret', p >= 1);
    bouton_pouvoir.title = `${cfg_pouvoir().nom} (${Touches.libelle('pouvoir')}) : ${pouvoir.charge}/${kills_requis()}`;
}

bouton_pouvoir.addEventListener('pointerdown', e => { e.preventDefault(); activer_pouvoir(); });
document.addEventListener('keydown', e => {
    if (Touches.action(e.code) === 'pouvoir' && !e.repeat && partie_en_cours()) {
        e.preventDefault();
        activer_pouvoir();
    }
});
