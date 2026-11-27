/* =========================================================================
   BOSS : apparition toutes les 3 minutes, en alternance le Mastodonte et le
   Fossoyeur (fossoyeur.js), barre de vie en haut de l'écran.
   LE MASTODONTE : crachats d'acide, invocations.
   Réglages : CONFIG.boss ; sprite : assets/monstres/mastodonte/ ; il fait partie de la liste
   « zombies » (zombie.js) pour les tirs et les collisions.
   ========================================================================= */
// Sprite (assets/monstres/mastodonte/) : 8 images de marche + 8 de charge (gueule ouverte)
TYPES_ZOMBIE.boss = {
    config: CONFIG.boss,
    images: SPRITES_BOSS.marche,
    imagesCharge: SPRITES_BOSS.charge,
    estBoss: true
};
const est_boss = type => Boolean(TYPES_ZOMBIE[type] && TYPES_ZOMBIE[type].estBoss);

let boss = null;
let prochainBoss = CONFIG.boss.intervalle;
let bossApparus = 0;
let crachats = [];
const ui_boss = { barre: document.getElementById('boss-barre'), vie: document.getElementById('boss-vie'), nom: document.getElementById('boss-nom') };

function reset_boss() {
    boss = null;
    prochainBoss = CONFIG.boss.intervalle;
    bossApparus = 0;
    crachats = [];
    ui_boss.barre.classList.add('hidden');
}

function faire_apparaitre_boss(largeurCanvas, hauteurCanvas, typeImpose = null) {
    // Un boss sur deux : Mastodonte, Fossoyeur, Mastodonte… (une mission de la campagne peut imposer le sien)
    const type = typeImpose || (bossApparus % 2 === 0 ? 'boss' : 'fossoyeur');
    const cfg = TYPES_ZOMBIE[type].config;
    const pv = Math.min(cfg.pvMax, cfg.pvBase + cfg.pvParBoss * bossApparus);   // chaque boss est plus résistant que le précédent
    bossApparus++;
    boss = {
        type, x: largeurCanvas, y: (hauteurCanvas - cfg.taille) / 2, taille: cfg.taille,
        vitesse: cfg.vitesse || cfg.vitesseMin, pv, pvMax: pv, tempsImage: 0, etape: 0,
        chronoCrachat: cfg.delaiCrachat, chronoInvocation: cfg.delaiInvocation / 2, charge: false
    };
    if (comportement(boss).creer) comportement(boss).creer(boss);
    zombies.push(boss);
    ui_boss.nom.textContent = cfg.nom;   // déjà traduit (i18n.js)
    ui_boss.barre.classList.remove('hidden');
    placer_barre_boss();
    Son.effet('bossArrive');
    secouer_ecran(2);
}

/* La barre du boss se place juste sous la barre d'infos, qui peut passer sur
   deux lignes (écran étroit, mission en cours…) : elle ne la chevauche jamais. */
function placer_barre_boss() {
    const info = document.getElementById('info'), parent = ui_boss.barre.offsetParent;
    if (!parent || !info.getBoundingClientRect || ui_boss.barre.classList.contains('hidden')) return;
    const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1;
    const bas = info.getBoundingClientRect().bottom - parent.getBoundingClientRect().top;
    ui_boss.barre.style.top = Math.round(bas / zoom + 4) + 'px';   // la barre du boss est agrandie par --ui
}
window.addEventListener('resize', placer_barre_boss);

function fin_boss() {
    boss = null;
    // Le Fossoyeur vaincu : sa terre encore en vol retombe sans effet (sinon une pelletée
    // coûtait une vie après sa mort). Ses tombes restent : elles s'ouvriront quand même.
    pelletees = [];
    prochainBoss = etat.temps + CONFIG.boss.intervalle;
    ui_boss.barre.classList.add('hidden');
}

// Même tremblement que celui des lootbox (lootbox.js)
const secouer_ecran = niveau => EffetsLoot.trembler(niveau);

function gerer_boss(dt, largeurCanvas, hauteurCanvas, tempsJeu) {
    if (!boss) {
        // En mode Vagues, c'est la vague qui fait venir le boss (vagues.js)
        if (etat.variante !== 'vagues' && etat.variante !== 'campagne' && tempsJeu >= prochainBoss) faire_apparaitre_boss(largeurCanvas, hauteurCanvas);
        return;
    }
    const cfg = CONFIG.boss;
    ui_boss.vie.style.width = `${(100 * boss.pv) / boss.pvMax}%`;
    if (boss.type !== 'boss') return;   // le Fossoyeur a son propre comportement (fossoyeur.js)

    // Crachat d'acide sur la ligne où se trouve le joueur (annoncé : il rougit et gonfle)
    boss.chronoCrachat -= dt;
    boss.charge = boss.chronoCrachat <= cfg.annonceCrachat;
    if (boss.chronoCrachat <= 0) {
        boss.chronoCrachat = cfg.delaiCrachat;
        crachats.push({ x: boss.x + 10, y: joueur.y + joueur.taille / 2 - 8, taille: 16 });
        Son.effet('crachat');
    }

    // Invocation de deux zombies à ses côtés
    boss.chronoInvocation -= dt;
    if (boss.chronoInvocation <= 0) {
        boss.chronoInvocation = cfg.delaiInvocation;
        for (const decalage of [-40, boss.taille - 24]) {
            creer_zombie('normal', largeurCanvas, hauteurCanvas);
            const z = zombies[zombies.length - 1];
            z.x = boss.x + 30;
            z.y = Math.max(CONFIG.margeHaut, Math.min(hauteurCanvas - CONFIG.margeBas, boss.y + decalage));
        }
    }
}

function update_crachats(dt) {
    const zoneJoueur = hitbox(joueur.x, joueur.y, joueur.taille);
    crachats = crachats.filter(c => {
        c.x -= CONFIG.boss.vitesseCrachat * MONDE.echelleX * dt;
        if (collision(zoneJoueur, { x: c.x, y: c.y, largeur: c.taille, hauteur: c.taille })) {
            perdre_vie();
            return false;
        }
        return c.x + c.taille > 0;
    });
}

function draw_crachats(ctx) {
    for (const c of crachats) {
        ctx.fillStyle = '#7dff3a';
        ctx.strokeStyle = '#1f5a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(c.x + 8, c.y + 8, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(125, 255, 58, 0.4)';
        ctx.fillRect(c.x + 14, c.y + 5, 14, 6);   // traînée
    }
}
