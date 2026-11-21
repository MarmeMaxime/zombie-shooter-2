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

const btn_sound = $('btn-sound');
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

    carte.append(img, ligne('nom', perso.nom), ligne('arme', CONFIG.armes[perso.arme].nom), ligne('description', perso.description));
    carte.addEventListener('click', () => choisir_perso(id));
    liste_persos.appendChild(carte);
}

// Les cartes montrent le skin équipé (l'arc-en-ciel animé passe par une classe CSS)
function rafraichir_cartes_persos() {
    for (const carte of liste_persos.children) {
        const img = carte.querySelector('img');
        const skin = LOOT.skins[Loot.equipe(carte.dataset.perso)];
        img.classList.toggle('arcenciel', Boolean(skin && skin.anime));
        img.style.filter = skin && !skin.anime ? skin.filtre : '';
    }
}
rafraichir_cartes_persos();

// Un perso retiré par une mise à jour ? On retombe sur le soldat.
choisir_perso(CONFIG.personnages[Sauvegarde.donnees.perso] ? Sauvegarde.donnees.perso : 'soldat');

/* ---------- Boutons (son de clic + perte du focus) ---------- */
document.querySelectorAll('button').forEach(bouton => {
    bouton.addEventListener('click', () => {
        if (bouton !== btn_sound) Son.bouton();
        // Sans ça, la barre ESPACE "recliquerait" le dernier bouton pendant la partie
        bouton.blur();
    });
});

/* ---------- Son ---------- */
function maj_bouton_son() {
    btn_sound.textContent = Son.estActif() ? '🔊' : '🔇';
}

btn_sound.addEventListener('click', () => {
    Son.setActif(!Son.estActif());
    maj_bouton_son();
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
$('btn-perso').addEventListener('click', () => afficher(ecrans.perso, true));
$('btn-close-perso').addEventListener('click', () => afficher(ecrans.perso, false));

$('btn-start').addEventListener('click', () => {
    afficher(ecrans.menu, false);
    afficher(ecrans.jeu, true);
    init_game(difficulte_choisie, perso_choisi);
});

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
    return `${l.cranes || 0} 💀 · ${skins} skin${skins > 1 ? 's' : ''} · ${l.ouvertes || 0} caisse${(l.ouvertes || 0) > 1 ? 's' : ''} ouverte${(l.ouvertes || 0) > 1 ? 's' : ''}`;
}

function remplir_ecran_save() {
    $('save-resume').textContent = `Actuellement : ${resume(Sauvegarde.donnees)}`;
    const liste = $('save-historique');
    const h = Sauvegarde.historique();
    if (!h.length) {
        liste.textContent = 'Aucun point de restauration pour l\'instant. Il s\'en crée un après chaque partie.';
        return;
    }
    liste.replaceChildren(...h.map((entree, i) => {
        const ligne = document.createElement('div');
        ligne.className = 'save-ligne';
        const texte = document.createElement('span');
        const date = new Date(entree.date);
        texte.textContent = `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — ${entree.raison} — ${resume(entree.donnees || {})}`;
        const bouton = document.createElement('button');
        bouton.textContent = 'Restaurer';
        bouton.addEventListener('click', () => {
            if (!confirm('Revenir à ce point ? L\'état actuel sera lui-même gardé dans l\'historique.')) return;
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
    message_save.textContent = 'Fichier téléchargé. Garde-le précieusement (ou envoie-le à tes amis pour les narguer).';
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
        ? 'Ce fichier a été modifié à la main ou est abîmé (empreinte invalide). L\'importer quand même ?'
        : `Importer cette sauvegarde (${resume(analyse.obj.donnees)}) ? L'état actuel sera gardé dans l'historique.`;
    if (!confirm(question)) return;
    Sauvegarde.importer(analyse.obj);
    location.reload();
});

/* ---------- Démarrage ---------- */
Sauvegarde.point_de_restauration('Lancement du jeu');
maj_bouton_son();
Son.jouerAmbiance('menu'); // ne joue réellement qu'une fois le son activé
