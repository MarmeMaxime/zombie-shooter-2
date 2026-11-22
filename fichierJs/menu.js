/* =========================================================================
   MENU, TUTORIEL ET SON
   ========================================================================= */
const $ = id => document.getElementById(id);

const ecrans = {
    menu: $('main-menu'),
    jeu: $('game-view'),
    tuto: $('tutorial-overlay'),
    perso: $('perso-overlay'),
    gameOver: $('game-over-overlay')
};

const btn_normal = $('btn-normal');
const btn_hardcore = $('btn-hardcore');

let difficulte_choisie = 'normal';
let perso_choisi = 'soldat';

const afficher = (ecran, visible) => ecran.classList.toggle('hidden', !visible);

/* ---------- Choix du personnage ----------
   Les cartes sont générées depuis CONFIG.personnages : ajouter un perso
   dans la config suffit pour qu'il apparaisse ici. */
const liste_persos = $('liste-persos');

function choisir_perso(id) {
    perso_choisi = id;
    $('nom-perso').textContent = CONFIG.personnages[id].nom;
    for (const carte of liste_persos.children) carte.classList.toggle('active', carte.dataset.perso === id);
    Sauvegarde.donnees.perso = id;
    Sauvegarde.sauver();
}

for (const [id, perso] of Object.entries(CONFIG.personnages)) {
    const carte = document.createElement('button');
    carte.className = 'carte-perso';
    carte.dataset.perso = id;

    const img = document.createElement('img');
    img.src = SPRITES_PERSO[id].arret.src;
    img.alt = '';

    const ligne = (classe, texte) => {
        const el = document.createElement('span');
        el.className = classe;
        el.textContent = texte;
        return el;
    };

    carte.append(img, ligne('nom', perso.nom), ligne('arme', CONFIG.armes[perso.arme].nom), ligne('description', perso.description),
        ligne('pouvoir', '★ ' + CONFIG.pouvoirs[perso.pouvoir].nom + ' : ' + CONFIG.pouvoirs[perso.pouvoir].description));
    carte.append(ligne('verrou', ''));   // condition de déblocage (masquée une fois le perso débloqué)
    carte.addEventListener('click', () => { if (Deblocage.est_debloque(id)) choisir_perso(id); });
    liste_persos.appendChild(carte);
}

// Les cartes montrent le skin équipé (l'arc-en-ciel animé passe par une classe CSS)
function rafraichir_cartes_persos() {
    for (const carte of liste_persos.children) {
        const img = carte.querySelector('img');
        const skin = LOOT.skins[Loot.equipe(carte.dataset.perso)];
        img.src = Loot.sprites(carte.dataset.perso).arret.src;
        img.classList.toggle('arcenciel', Boolean(skin && skin.anime));
        img.style.filter = skin && skin.filtre ? skin.filtre : '';
        // Perso verrouillé : carte grisée et ce qu'il reste à faire pour le débloquer
        const id = carte.dataset.perso, verrouille = !Deblocage.est_debloque(id);
        carte.classList.toggle('verrouille', verrouille);
        carte.disabled = verrouille;
        const c = Deblocage.condition(id);
        carte.querySelector('.verrou').textContent = verrouille && c
            ? T('🔒 Terminer {n} missions avec {perso} ({f}/{n})', { n: c.requis, perso: CONFIG.personnages[c.precedent].nom, f: c.faites }) : '';
    }
}
rafraichir_cartes_persos();

// Un perso retiré par une mise à jour, ou pas encore débloqué ? On retombe sur le soldat.
choisir_perso(CONFIG.personnages[Sauvegarde.donnees.perso] && Deblocage.est_debloque(Sauvegarde.donnees.perso) ? Sauvegarde.donnees.perso : 'soldat');

/* ---------- Boutons (son de clic + perte du focus) ---------- */
document.querySelectorAll('button').forEach(bouton => {
    bouton.addEventListener('click', () => {
        Son.bouton();
        // Sans ça, la barre ESPACE "recliquerait" le dernier bouton pendant la partie
        bouton.blur();
    });
});

/* ---------- Difficulté ---------- */
function choisir_difficulte(mode) {
    difficulte_choisie = mode;
    btn_normal.classList.toggle('active', mode === 'normal');
    btn_hardcore.classList.toggle('active', mode === 'hardcore');
}

btn_normal.addEventListener('click', () => choisir_difficulte('normal'));
btn_hardcore.addEventListener('click', () => choisir_difficulte('hardcore'));

/* ---------- Navigation ---------- */
$('btn-tuto').addEventListener('click', () => afficher(ecrans.tuto, true));
$('btn-close-tuto').addEventListener('click', () => afficher(ecrans.tuto, false));
$('btn-perso').addEventListener('click', () => { rafraichir_cartes_persos(); afficher(ecrans.perso, true); });
$('btn-close-perso').addEventListener('click', () => afficher(ecrans.perso, false));

$('btn-start').addEventListener('click', () => {
    // Toute première partie : le sergent propose son entraînement
    if (typeof proposer_entrainement === 'function' && proposer_entrainement()) return;
    afficher_records_variantes();
    $('choix-variante').classList.remove('hidden');   // Classique ou Vagues ?
});

// Record du perso choisi (pour la difficulté choisie) sous chaque mode
function afficher_records_variantes() {
    const perso = CONFIG.personnages[perso_choisi].nom;
    const c = Records.lire(perso_choisi, difficulte_choisie, 'classique');
    const v = Records.lire(perso_choisi, difficulte_choisie, 'vagues');
    $('record-classique').textContent = c.temps > 0
        ? T(c.score > 0 ? '🏅 Record de {perso} : {m} min {s} · {score} pts' : '🏅 Record de {perso} : {m} min {s}', { perso, m: Math.floor(c.temps / 60), s: String(c.temps % 60).padStart(2, '0'), score: c.score })
        : T('Pas encore de record pour {perso}', { perso });
    $('record-vagues').textContent = v.vague > 0
        ? T('🏅 Record de {perso} : vague {n} · {score} pts', { perso, n: v.vague, score: v.score })
        : T('Pas encore de record pour {perso}', { perso });
}

function lancer_combat(variante) {
    $('choix-variante').classList.add('hidden');
    afficher(ecrans.menu, false);
    afficher(ecrans.jeu, true);
    init_game(difficulte_choisie, perso_choisi, false, variante);
}
$('btn-classique').addEventListener('click', () => lancer_combat('classique'));
$('btn-vagues').addEventListener('click', () => lancer_combat('vagues'));
$('btn-close-variante').addEventListener('click', () => $('choix-variante').classList.add('hidden'));

function retour_menu_principal() {
    afficher(ecrans.jeu, false);
    afficher(ecrans.gameOver, false);
    afficher(ecrans.menu, true);
    Son.jouerAmbiance('menu');
}

/* ---------- Sauvegarde : téléchargement, import, historique ---------- */
const ecran_save = $('save-overlay');
const message_save = $('save-message');

function resume(donnees) {
    const l = donnees.loot || {};
    const skins = Array.isArray(l.possedes) ? l.possedes.length : 0;
    return T('{c} 💀 · {s} skin(s) · {o} caisse(s) ouverte(s)', { c: l.cranes || 0, s: skins, o: l.ouvertes || 0 });
}

function remplir_ecran_save() {
    $('save-resume').textContent = T('Actuellement : {r}', { r: resume(Sauvegarde.donnees) });
    const liste = $('save-historique');
    const h = Sauvegarde.historique();
    if (!h.length) {
        liste.textContent = T('Aucun point de restauration pour l\'instant. Il s\'en crée un après chaque partie.');
        return;
    }
    liste.replaceChildren(...h.map((entree, i) => {
        const ligne = document.createElement('div');
        ligne.className = 'save-ligne';
        const texte = document.createElement('span');
        const date = new Date(entree.date);
        texte.textContent = `${date.toLocaleDateString(Langue.locale)} ${date.toLocaleTimeString(Langue.locale, { hour: '2-digit', minute: '2-digit' })} — ${entree.raison} — ${resume(entree.donnees || {})}`;
        const bouton = document.createElement('button');
        bouton.textContent = T('Restaurer');
        bouton.addEventListener('click', () => {
            if (!confirm(T('Revenir à ce point ? L\'état actuel sera lui-même gardé dans l\'historique.'))) return;
            if (Sauvegarde.restaurer(i)) location.reload();
        });
        ligne.append(texte, bouton);
        return ligne;
    }));
}

$('btn-sauvegarde').addEventListener('click', () => {
    message_save.textContent = '';
    remplir_ecran_save();
    afficher(ecran_save, true);
});
$('btn-close-save').addEventListener('click', () => afficher(ecran_save, false));

$('btn-telecharger').addEventListener('click', () => {
    Sauvegarde.telecharger();
    message_save.style.color = '#3cff7a';
    message_save.textContent = T('Fichier téléchargé. Garde-le précieusement (ou envoie-le à tes amis pour les narguer).');
});

$('btn-importer').addEventListener('click', () => $('input-import').click());
$('input-import').addEventListener('change', async e => {
    const fichier = e.target.files[0];
    e.target.value = '';           // permet de réimporter le même fichier
    if (!fichier) return;

    const analyse = Sauvegarde.analyser(await fichier.text());
    if (!analyse.ok) {
        message_save.style.color = '#ff3333';
        message_save.textContent = analyse.message;
        return;
    }
    const question = analyse.retouche
        ? T('Ce fichier a été modifié à la main ou est abîmé (empreinte invalide). L\'importer quand même ?')
        : T('Importer cette sauvegarde ({r}) ? L\'état actuel sera gardé dans l\'historique.', { r: resume(analyse.obj.donnees) });
    if (!confirm(question)) return;
    Sauvegarde.importer(analyse.obj);
    location.reload();
});

/* ---------- Démarrage ---------- */
Sauvegarde.point_de_restauration(T('Lancement du jeu'));
Son.jouerAmbiance('menu'); // ne joue réellement qu'une fois le son activé
