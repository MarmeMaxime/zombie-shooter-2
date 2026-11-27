/* =========================================================================
   LA NUIT, À LA LAMPE
   - dessiner_lampe() : tout est noir sauf le faisceau de la lampe du perso et
     un halo autour de lui ; chaque tir éclaire le terrain un instant ; les yeux
     des zombies brillent dans le noir. Utilisée par les missions de nuit de la
     campagne (campagne.js) et par l'événement « nuit » ci-dessous.
   - Nuit : l'événement des modes Classique et Vagues.
       Classique : de temps en temps, la nuit tombe pour un moment, puis le jour
       revient (le premier soir arrive après quelques minutes).
       Vagues : certaines vagues se jouent de nuit (jamais une vague de boss).
     Les victimes faites de nuit rapportent plus de points.
   Réglages : CONFIG.nuit ; le voile lui-même : nuit() dans camp_decor.js.
   ========================================================================= */

// Les néons du quai du métro (fraction de la largeur, hauteur) : ils grésillent dans le noir
const NEONS_METRO = [[0.12, 40], [0.38, 40], [0.64, 40], [0.9, 40], [0.25, 362], [0.51, 362], [0.77, 362]];

/* Où briller dans le noir : les yeux de chaque sprite (en pixels du sprite, coin haut
   gauche). Le zombie et le Tank sont de face (deux yeux) ; les sprites générés sont de
   profil, tournés vers la gauche (un seul œil, là où leur sprite le dessine). */
function yeux(z) {
    const t = z.taille;
    switch (z.type) {
        case 'joggeur': {
            const e = z.joggeur && z.joggeur.etat;
            return e === 'course' || e === 'cri' ? [[17, 14]] : e === 'essouffle' ? [[16, 29]] : [[23, 12]];
        }
        case 'infirmier': return [[24, 11]];
        case 'emeute': return [[25, 14]];
        case 'pondeuse': return [[25, 15]];
        case 'larve': return [[7, 28]];
        default: return [[t * 0.42, t * 0.08], [t * 0.42 + 4, t * 0.08]];
    }
}

// intensite : de 0 (plein jour) à 1 (nuit noire), pour que la nuit tombe en douceur
function dessiner_lampe(ctx, neons, intensite = 1) {
    if (intensite <= 0) return;
    const x = joueur.x + CONFIG.canon.x, y = joueur.y + CONFIG.canon.y;
    const lumieres = [
        { cone: true, x, y, longueur: MONDE.largeur * 0.62, angle: 0.34, force: 1 },
        { x: joueur.x + 32, y: joueur.y + 34, r: 70, force: 0.85 }
    ];
    if (joueur.animTir > 0) lumieres.push({ x: x + 30, y, r: 260, force: 0.55 });   // éclair du coup de feu
    // Les néons du quai qui grésillent encore (métro)
    if (neons) {
        const t = etat.temps;
        neons.forEach(([fx, ny], i) => {
            const panne = Math.sin(t * (3 + i) + i * 7) + Math.sin(t * 11.3 + i * 2) > 1.5;   // il saute de temps en temps
            if (!panne) lumieres.push({ x: fx * MONDE.largeur, y: ny, r: 58, force: 0.55 });
        });
    }
    // Un Infirmier qui soigne : la lueur de ses soins le trahit
    for (const z of zombies) if (z.type === 'infirmier' && z.soin && z.soin.anim > 0) lumieres.push({ x: z.x + z.taille / 2, y: z.y + z.taille / 2, r: 90, force: 0.7 });
    // Nuit noire : hors de la lampe, on ne voit que les yeux
    nuit(ctx, MONDE.largeur, MONDE.hauteur, lumieres, 0.985 * intensite);
    ctx.save();
    ctx.globalAlpha = intensite;
    ctx.fillStyle = '#ffe070';
    for (const z of zombies) for (const [ex, ey] of yeux(z)) ctx.fillRect(Math.round(z.x + ex), Math.round(z.y + ey), 2, 2);
    // La croix rouge de l'Infirmier (sur sa coiffe) se voit dans le noir : on sait qui viser en premier
    ctx.fillStyle = '#ff4040';
    for (const z of zombies) if (z.type === 'infirmier') {
        const cx = Math.round(z.x + 28), cy = Math.round(z.y + 5);
        ctx.fillRect(cx - 1, cy - 3, 2, 6); ctx.fillRect(cx - 3, cy - 1, 6, 2);
    }
    ctx.restore();
}

const Nuit = (() => {
    let niveau = 0;        // obscurité affichée, de 0 à 1 (suit « cible » en douceur)
    let cible = 0;         // 1 : il fait nuit ; 0 : il fait jour
    let prochaine = 0;     // Classique : secondes avant le prochain soir
    let restant = 0;       // Classique : secondes de nuit qui restent
    let neons = null;      // néons du décor (métro)

    const entre = ([a, b]) => a + Math.random() * (b - a);
    const actif = () => etat.enCours && !etat.tuto && (etat.variante === 'classique' || etat.variante === 'vagues');

    function bandeau(texte) {
        const b = document.getElementById('bandeau-vague');
        b.textContent = texte;
        b.classList.remove('hidden', 'anime', 'bandeau-mission');
        void b.offsetWidth;   // relance l'animation
        b.classList.add('anime');
    }

    function demarrer() {
        niveau = cible = 0;
        restant = 0;
        neons = null;
        prochaine = actif() && etat.variante === 'classique' ? entre(CONFIG.nuit.premiere) : 0;
    }

    function tomber(annonce = true) {
        cible = 1;
        restant = CONFIG.nuit.duree;
        if (annonce) bandeau(T('🌙 LA NUIT TOMBE'));
        Son.effet('grognementTank');   // un grognement au loin
    }
    function lever(annonce = true) {
        cible = 0;
        prochaine = entre(CONFIG.nuit.entre);
        if (annonce) bandeau(T('☀ LE JOUR SE LÈVE'));
    }

    function maj(dt) {
        if (!actif()) return;
        // Classique : la nuit vient et repart toute seule ; en Vagues, c'est la vague qui décide (regler)
        if (etat.variante === 'classique') {
            if (cible === 0) {
                prochaine -= dt;
                if (prochaine <= 0 && !boss) tomber();   // pas pendant un combat de boss : il est assez dur comme ça
            } else {
                restant -= dt;
                if (restant <= 0) lever();
            }
        }
        const pas = dt / CONFIG.nuit.transition;
        niveau = cible > niveau ? Math.min(cible, niveau + pas) : Math.max(cible, niveau - pas);
    }

    // Mode Vagues : la vague qui commence se joue de jour ou de nuit, dans ce décor
    function regler(deNuit, neonsDecor) {
        neons = neonsDecor || null;
        if (deNuit && cible === 0) tomber(false);
        else if (!deNuit && cible === 1) lever(false);
    }

    return {
        demarrer, maj, regler,
        dessiner: ctx => { if (actif()) dessiner_lampe(ctx, neons, niveau); },
        // Bonus de points des victimes faites de nuit (une fois la nuit vraiment tombée)
        bonus: () => (actif() && niveau >= 0.5 ? CONFIG.nuit.bonusPoints : 1),
        active: () => actif() && cible === 1
    };
})();
