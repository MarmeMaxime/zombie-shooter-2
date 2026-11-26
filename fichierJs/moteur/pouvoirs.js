/* =========================================================================
   POUVOIRS SPÉCIAUX
   Chaque personnage a un pouvoir lié à son arme (CONFIG.pouvoirs) :
   - Soldat, Rafale : tir automatique très rapide pendant quelques secondes
   - Brutus, Onde de choc : il frappe le sol, la terre se fend jusqu'au bout de l'écran ;
     chaque zombie traversé perd un PV et reste étourdi
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
    eclair: 0,          // flash blanc de l'orage
    reduction: 1        // multiplicateur des victimes à faire (boutique des vagues)
};

const cfg_pouvoir = () => CONFIG.pouvoirs[pouvoir.id];
// Victimes nécessaires pour remplir la jauge (moins avec la boutique des vagues)
const kills_requis = () => Math.max(5, Math.round(cfg_pouvoir().kills * pouvoir.reduction));
const pouvoir_pret = () => pouvoir.charge >= kills_requis();

function reset_pouvoir(perso) {
    Object.assign(pouvoir, { id: CONFIG.personnages[perso].pouvoir, charge: 0, rafale: 0, obus: [], ondes: [], eclair: 0, reduction: 1 });
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
    if (typeof Boxe !== 'undefined' && Boxe.actif()) { if (partie_en_cours()) Boxe.super(); return; }   // l'uppercut de Brutus
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

    // L'onde part de Brutus et file vers la droite (update_pouvoir la fait avancer et frapper)
    onde() {
        const ox = joueur.x + joueur.taille / 2, oy = joueur.y + joueur.taille * 0.8;
        pouvoir.ondes.push({ x: ox, y: oy, age: 0, front: ox, touches: new Set(), cailloux: [] });
        secouer_ecran(4);
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
    // Onde de choc : le front avance ; chaque zombie qu'il dépasse est frappé une fois
    const onde = CONFIG.pouvoirs.onde;
    for (const o of pouvoir.ondes) {
        o.age += dt;
        o.front = o.x + onde.vitesse * MONDE.echelleX * o.age;
        for (const z of zombies.slice()) {
            if (o.touches.has(z)) continue;
            const c = centre_zombie(z);
            if (c.x < o.x - z.taille * 0.3 || c.x > o.front) continue;
            o.touches.add(z);
            z.etourdi = onde.etourdissement * (z === boss ? 0.4 : 1);
            compteurTirs++;   // chaque zombie est un coup à part (l'Anti-émeute perd un PV)
            toucher_zombie(z, onde.degats, compteurTirs);
        }
        // Des pierres jaillissent le long de la fissure
        if (o.front < MONDE.largeur) for (let k = 0; k < 3; k++) o.cailloux.push({ x: o.front + (Math.random() - 0.5) * 10, y: 20 + Math.random() * (MONDE.hauteur - 40), age: 0 });
        for (const p of o.cailloux) p.age += dt;
        o.cailloux = o.cailloux.filter(p => p.age < 0.45);
    }
    pouvoir.ondes = pouvoir.ondes.filter(o => o.front < MONDE.largeur + 40 || o.cailloux.length);
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
    // Onde de choc : le choc au pied de Brutus, puis la fissure qui file jusqu'au bout de l'écran
    for (const o of pouvoir.ondes) {
        if (o.age < 0.35) {
            const p = o.age / 0.35;
            ctx.globalAlpha = 1 - p;
            ctx.strokeStyle = '#e8d2a0';
            ctx.lineWidth = 8 * (1 - p) + 2;
            ctx.beginPath();
            ctx.ellipse(o.x, o.y, 90 * MONDE.echelleX * p + 10, 40 * p + 5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        const x = Math.min(o.front, MONDE.largeur + 20);
        // La poussière soulevée derrière le front
        const trace = ctx.createLinearGradient(Math.max(o.x, x - 220), 0, x, 0);
        trace.addColorStop(0, 'rgba(232, 210, 160, 0)'); trace.addColorStop(1, 'rgba(232, 210, 160, 0.35)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = trace;
        ctx.fillRect(Math.max(o.x, x - 220), 0, Math.min(220, x - o.x), MONDE.hauteur);
        // La fissure : une ligne brisée sombre, bordée de terre claire
        if (o.front < MONDE.largeur + 20) {
            ctx.beginPath();
            for (let y = 0; y <= MONDE.hauteur; y += 12) ctx.lineTo(x + Math.sin(y * 0.7 + o.x) * 6, y);
            ctx.strokeStyle = '#e8d2a0'; ctx.lineWidth = 8; ctx.globalAlpha = 0.8; ctx.stroke();
            ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ctx.globalAlpha = 1; ctx.stroke();
        }
        // Les pierres qui jaillissent puis retombent
        for (const p of o.cailloux) {
            const h = Math.sin(p.age / 0.45 * Math.PI) * 18;
            ctx.globalAlpha = 1 - p.age / 0.45;
            ctx.fillStyle = '#6a5a48'; ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y - h) - 3, 6, 5);
            ctx.fillStyle = '#9a8a70'; ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y - h) - 3, 6, 2);
        }
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
