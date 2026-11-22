// Simulation headless du combat de boxe (boxe.js) : un bot joue Brutus contre Gégé.
// Usage : node outils/simulation_boxe.js <mode> <parties> <erreur_s> <rate>
//   erreur_s : imprécision du moment de l'esquive (écart type, en secondes)
//   rate     : part des coups de Gégé que le bot ne voit pas venir (il n'esquive pas)
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const [mode = 'normal', parties = '40', erreur = '0.08', rate = '0.15'] = process.argv.slice(2);
const racine = path.join(__dirname, '..', 'fichierJs');

let fin = null;
const ctx = {
    console, Math,
    MONDE: { largeur: 800, hauteur: 400 },
    commandes: { haut: false, bas: false, tir: false, axe: 0 },
    Son: { effet() {}, vibrer() {} },
    T: (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k]) : s),
    secouer_ecran() {},
    Campagne: { fin_boxe: v => { fin = v; } },
    SPRITES_BOXE: { foule: { gens: [{}], dos: [{}] } }   // la foule n'a pas besoin d'images ici
};
vm.createContext(ctx);
const histoire = fs.readFileSync(path.join(racine, 'campagne', 'campagne_histoire.js'), 'utf8');
const debutMissions = histoire.indexOf('const MISSIONS_CAMPAGNE');
// On ne garde que les réglages du combat (le reste du fichier a besoin du jeu)
const reglages = vm.runInContext('(' + histoire.slice(histoire.indexOf('boxe: {', debutMissions) + 6, histoire.indexOf('        },\n        debut:', histoire.indexOf('boxe: {', debutMissions)) + 9).replace(/,\s*$/, '') + ')', ctx);
vm.runInContext(fs.readFileSync(path.join(racine, 'campagne', 'boxe.js'), 'utf8') + '\nthis.Boxe = Boxe;', ctx);

const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

let victoires = 0, durees = [], viesRestantes = [];
for (let p = 0; p < Number(parties); p++) {
    fin = null;
    ctx.Boxe.demarrer(reglages[mode]);
    ctx.Boxe.commencer();
    const dt = 1 / 60;
    let t = 0, cible = null, dernierArmer = null, ratee = false, relache = 0;
    while (fin === null && t < 400) {
        const c = ctx.Boxe.etat(), g = c.g, b = c.b, cmd = ctx.commandes;
        cmd.tir = false; cmd.haut = false;
        if (g.etat === 'armer' && dernierArmer !== g) {
            // Nouveau coup en préparation : le bot décide quand il esquivera
            dernierArmer = g;
        }
        if (g.etat === 'armer') {
            if (cible === null) { cible = g.duree - 0.12 + gauss() * Number(erreur); ratee = Math.random() < Number(rate); }
            if (!ratee && g.t >= cible) cmd.haut = true;
        } else { cible = null; }
        if ((g.etat === 'ouvert' || g.etat === 'rugir') && relache <= 0) { cmd.tir = true; relache = 0.09; }
        if (b.rage >= 100 && (g.etat === 'ouvert' || g.etat === 'garde')) ctx.Boxe.super();
        relache -= dt;
        // Garde : quelques jabs de temps en temps (ça ne sert à rien, comme un joueur impatient)
        if (g.etat === 'garde' && Math.random() < 0.02) cmd.tir = true;
        ctx.Boxe.maj(dt);
        t += dt;
    }
    const c = ctx.Boxe.etat();
    if (fin) { victoires++; viesRestantes.push(c.b.pv); }
    durees.push(Math.round(t));
}
const moy = a => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : '-');
console.log(JSON.stringify({ mode, erreur: Number(erreur), rate: Number(rate), victoires: victoires + '/' + parties, dureeMoyenne: moy(durees), pvBrutusMoyen: moy(viesRestantes) }));
