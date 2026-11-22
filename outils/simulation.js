// Simulation headless : charge les vrais scripts du jeu et fait jouer un bot.
// Usage : node sim.js <dossier_jeu> <mode> <minutes> [reaction_s] [graine]
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const [dir, mode = 'normal', minutes = '30', reaction = '0.2', graine = '1', patch = '{}'] = process.argv.slice(2);

// --- Aléatoire reproductible ---
let s = Number(graine) >>> 0 || 1;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// --- Faux DOM minimal ---
const el = () => ({
    textContent: '', className: '', disabled: false, value: '',
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {}, children: [], style: { setProperty() {} }, offsetWidth: 0, querySelector: () => null, addEventListener() {}, setPointerCapture() {}, blur() {}, replaceChildren() {}, appendChild() {}, append() {}
});
const elements = {};
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => (t[k] = v, true) });
const document = {
    getElementById: id => elements[id] || (elements[id] = Object.assign(el(), id === 'jeu' ? { width: 800, height: 400, getContext: () => ctx2d } : {})),
    querySelectorAll: () => [], documentElement: { style: { setProperty() {} } },
    addEventListener() {}, createElement: () => Object.assign(el(), { getContext: () => ctx2d, toDataURL: () => '' })
};
class Media { constructor() { this.volume = 1; } play() { return Promise.resolve(); } pause() {} cloneNode() { return new Media(); } addEventListener() {} }
const ctx = vm.createContext({
    setTimeout: () => 0, setInterval: () => 0, clearInterval() {}, clearTimeout() {},
    document, window: { addEventListener() {}, innerWidth: 800, innerHeight: 400 }, Image: class { }, Audio: Media,
    performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    Math: Object.assign(Object.create(Math), { random: rand }), console, localStorage: { getItem() {}, setItem() {} }
});
for (const f of ['config.js', 'sauvegarde.js', 'traductions.js', 'i18n.js', 'audio.js', 'options.js', 'pixel_art.js', 'instructeur_sprite.js', 'combat_decor.js', 'campagne_sprites.js', 'camp_decor.js', 'boss_sprite.js', 'joggeur_sprite.js', 'emeute_sprite.js', 'pondeuse_sprite.js', 'infirmier_sprite.js', 'boxeur_sprite.js', 'fossoyeur_sprite.js', 'deplacement_joueur.js', 'tir_joueur.js', 'zombie.js', 'boss.js', 'joggeur.js', 'emeute.js', 'morts.js', 'pondeuse.js', 'infirmier.js', 'boxeur.js', 'fossoyeur.js', 'pouvoirs.js', 'main.js', 'lootbox.js', 'succes.js', 'missions.js', 'vagues.js', 'menu.js', 'campagne.js']) {
    vm.runInContext(fs.readFileSync(path.join(dir, 'fichierJs', f), 'utf8'), ctx, { filename: f });
}

// Surcharge de réglages pour les essais
vm.runInContext('(p => { const fusion = (a, b) => { for (const k in b) (typeof b[k] === "object" && !Array.isArray(b[k])) ? fusion(a[k], b[k]) : (a[k] = b[k]); }; fusion(CONFIG, p); })', ctx)(JSON.parse(patch));

if (process.env.LARGEUR) vm.runInContext('MONDE.largeur = ' + process.env.LARGEUR + '; MONDE.echelleX = MONDE.largeur / 800;', ctx);

// --- Bot ---
const resultat = vm.runInContext(`
(function (mode, dureeMax, reaction, perso, variante, idMission) {
    const DT = 1 / 60;
    init_game(mode, perso, false, variante, idMission);
    const arme = joueur.arme, typeArme = CONFIG.personnages[perso].arme;
    let pertes = 0, achats = 0; const causes = {};
    let pouvoirsUtilises = 0, crachatsRecus = 0, bossPasses = 0, dureesBoss = [], debutBoss = null;
    const uc = update_crachats; update_crachats = dt => { const v = etat.vies; uc(dt); crachatsRecus += Math.max(0, v - etat.vies); };
    const fb = fin_boss; fin_boss = () => { if (boss && boss.pv > 0) bossPasses++; if (debutBoss !== null) dureesBoss.push(Math.round(etat.temps - debutBoss)); debutBoss = null; fb(); };
    const fab = faire_apparaitre_boss; faire_apparaitre_boss = (a, b) => { debutBoss = etat.temps; fab(a, b); };
    const perdreOrig = perdre_vie;
    perdre_vie = () => { pertes++; perdreOrig(); };
    let instant = 0, cible = null, prochaineDecision = 0, aligneDepuis = 0;
    const pertesParMinute = [];
    let pertesMinute = 0;

    const yVise = z => {
        if (est_boss(z.type)) {
            // Le boss est grand : rester où on est si on le touche déjà, sinon rejoindre le bord le plus proche
            const h = hitbox_zombie(z), y0 = joueur.y + CONFIG.canon.y;
            if (y0 + 10 > h.y + 6 && y0 < h.y + h.hauteur - 6) return joueur.y;
            return Math.max(h.y + 8, Math.min(h.y + h.hauteur - 18, y0)) - CONFIG.canon.y;
        }
        return (z.teleport && z.teleport.annonce ? z.teleport.y : z.y) - 6;
    }; // centre de la fenêtre de tir
    const avant = joueur.x + joueur.taille;

    function urgence(z) { const v = z.joggeur ? Math.max(z.vitesse, z.vitesseActuelle || 0) : z.vitesse; return (z.x - avant) / (v * MONDE.echelleX); }

    function choisir() {
        let meilleur = null, meilleurScore = Infinity;
        for (const z of zombies) {
            if (z.x + z.taille < joueur.x) continue;
            const t = urgence(z);
            const tAlign = Math.abs(yVise(z) - joueur.y) / joueur.vitesse;
            const degatsParTir = typeArme === 'pompe' ? 2 : arme.degats;
            const tTir = (Math.ceil(z.pv / degatsParTir) - 1) * arme.delai + 0.1 + (typeArme === 'grenade' ? (z.x - avant) / (arme.vitesse * MONDE.echelleX) : 0);
            const faisable = tAlign + tTir + reaction < t;
            const score = (faisable ? 0 : 1000) + t - (z.surCamion ? 500 : 0);   // escorte : ceux agrippés au camion d'abord
            if (score < meilleurScore) { meilleurScore = score; meilleur = z; }
        }
        return meilleur;
    }

    while (etat.temps < dureeMax) {
        if (etat.temps >= prochaineDecision || (cible && !zombies.includes(cible))) {
            cible = choisir();
            prochaineDecision = etat.temps + reaction;
        }
        commandes.haut = commandes.bas = false;
        let pret = false;
        if (cible && zombies.includes(cible)) {
            const dy = yVise(cible) - joueur.y;
            if (Math.abs(dy) > 4) { commandes.haut = dy < 0; commandes.bas = dy > 0; }
            const h = hitbox_zombie(cible);
            const y0 = joueur.y + CONFIG.canon.y;
            if (typeArme === 'pompe') {
                const d = (h.x - (joueur.x + CONFIG.canon.x)) / MONDE.echelleX;   // en unités de référence
                const milieu = (arme.plombs - 1) / 2;
                let touches = 0;
                for (let i = 0; i < arme.plombs; i++) {
                    const yp = y0 + d * Math.tan((i - milieu) * arme.ecartDegres * Math.PI / 180);
                    if (yp + 4 > h.y && yp < h.y + h.hauteur) touches++;
                }
                pret = d < arme.portee * 0.9 && touches >= Math.min(2, cible.pv);
            } else {
                pret = y0 + 10 > h.y && y0 < h.y + h.hauteur;
            }
        }
        // Esquive : ne pas foncer dans un zombie proche, s'écarter s'il arrive dessus
        const proches = zombies.filter(z => z.x < avant + 80 && z.x + z.taille > joueur.x);
        const danger = y => {
            const hb = hitbox(joueur.x, y, joueur.taille);
            return proches.some(z => collision(hb, hitbox(z.x - (z.vitesseActuelle || z.vitesse) * 0.25, z.y, z.taille)))
                || zombies.some(z => z.joggeur && z.joggeur.etat !== 'marche' && z.joggeur.etat !== 'essouffle' && collision(hb, { x: 0, y: z.y + 10, largeur: 2000, hauteur: z.taille - 20 }))
                || pelletees.some(p => Math.hypot((joueur.x + joueur.taille / 2 - p.x) / MONDE.echelleX, y + joueur.taille / 2 - p.y) < CONFIG.fossoyeur.rayonPelletee + 22)
                || crachats.some(c => c.x > joueur.x && c.x - joueur.x < 700 && collision(hb, { x: c.x - 700, y: c.y - 4, largeur: c.taille + 700, hauteur: c.taille + 8 }));
        };
        const dir = commandes.bas ? 1 : commandes.haut ? -1 : 0;
        if (danger(joueur.y) && !(pret && joueur.rechargeTir === 0)) {
            // Cherche une issue de plus en plus loin (un perso lent a besoin de plusieurs pas
            // pour sortir d'un grand danger, comme le cercle d'une pelletée)
            for (const duree of [0.4, 0.7, 1.0]) {
                const pas = joueur.vitesse * duree;
                const hautOk = !danger(joueur.y - pas) && joueur.y - pas >= CONFIG.margeHaut;
                const basOk = !danger(joueur.y + pas) && joueur.y + pas <= 400 - CONFIG.margeBas;
                if (hautOk || basOk) { commandes.haut = hautOk && (!basOk || dir <= 0); commandes.bas = !commandes.haut; pret = false; break; }
            }
        } else if (dir && danger(joueur.y + dir * joueur.vitesse * 0.15)) {
            commandes.haut = commandes.bas = false;
        }
        // Pouvoir spécial : dès qu'il y a du monde ou une urgence
        if (pouvoir_pret() && (zombies_visibles().length >= 5 || zombies.some(z => urgence(z) < 1.5))) { activer_pouvoir(); pouvoirsUtilises++; }
        aligneDepuis = pret ? aligneDepuis + DT : 0;
        commandes.tir = !commandes.tir && aligneDepuis > 0.05 && joueur.rechargeTir === 0;

        // Mode Vagues : la boutique est ouverte, le bot fait ses achats et relance
        if (typeof Vagues !== 'undefined' && Vagues.enBoutique()) { Vagues.achats_automatiques(); Vagues.vague_suivante(); }
        if (etat.variante !== 'vagues' && etat.score >= etat.prixVie) { acheter_vie(); achats++; }
        instant += DT * 1000;
        const avantListe = zombies.slice();
        boucle(instant);
        for (const z of avantListe) if (!zombies.includes(z) && z.pv > 0) { const k = z.type + (z.x + z.taille < 5 ? ':sortie' : ':contact'); causes[k] = (causes[k] || 0) + 1; }
        if (!etat.enCours) break;

        if (Math.floor(etat.temps / 60) > pertesParMinute.length) {
            pertesParMinute.push(pertes - pertesMinute);
            pertesMinute = pertes;
        }
    }
    return { victoire: etat.victoire, vague: etat.vague, tues: Sauvegarde.donnees.stats.tues, pouvoirsUtilises, joggeurs: (Sauvegarde.donnees.stats.tues.joggeur || 0) + ' tués, ' + Sauvegarde.donnees.stats.esquives + ' esquives, ' + Sauvegarde.donnees.stats.sprintsStoppes + ' sprints stoppés', missionsRatees: MISSIONS[perso].filter(m => !Sauvegarde.donnees.missions.includes(m.id)).map(m => m.nom + ' ' + m.valeur(statsPerso(perso)) + '/' + m.objectif).join(' | '), coupMax: statsPerso(perso).coupMax, crachatsRecus, bossPasses, dureesBoss: dureesBoss.join(','), boss: Sauvegarde.donnees.stats.bossTues, bossApparus, causes, survie: Math.round(etat.temps), vivant: etat.enCours, vies: etat.vies, pertes, achats, pertesParMinute: pertesParMinute.join('') };
})`, ctx)(mode, Number(minutes) * 60, Number(reaction), process.env.PERSO || 'soldat', process.env.VARIANTE || 'classique', process.env.MISSION || null);

console.log(JSON.stringify({ perso: process.env.PERSO || 'soldat', mode, reaction: Number(reaction), ...resultat }));
