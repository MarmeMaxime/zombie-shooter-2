/* =========================================================================
   OPTIONS : son, touches du clavier, langue (bouton ⚙️)
   - Touches : chaque action a une liste de touches (codes physiques du
     clavier, KeyboardEvent.code). Le joueur peut en choisir une autre ; la
     touche est alors retirée des autres actions. « Par défaut » remet tout.
     Réglages gardés dans Sauvegarde.donnees.options.touches.
   - Les noms affichés suivent la disposition du clavier quand le navigateur
     la connaît (AZERTY : la touche « KeyW » s'affiche Z).
   ========================================================================= */
const TOUCHES_DEFAUT = {
    haut: ['ArrowUp', 'KeyW', 'KeyZ'],
    bas: ['ArrowDown', 'KeyS'],
    tir: ['Space'],
    pouvoir: ['KeyE', 'ShiftLeft', 'ShiftRight'],
    vie: ['KeyV'],
    pause: ['Escape', 'KeyP']
};
const ACTIONS_TOUCHES = [['haut', 'Monter'], ['bas', 'Descendre'], ['tir', 'Tirer'], ['pouvoir', 'Pouvoir spécial'], ['vie', 'Acheter une vie'], ['pause', 'Pause']];

const Touches = (() => {
    const choix = Sauvegarde.donnees.options.touches;   // action -> codes choisis (absent = par défaut)
    let disposition = null;                             // code -> caractère du clavier réel

    // Touches choisies explicitement pour les autres actions que « action »
    const prises = action => Object.keys(choix).filter(b => b !== action && Array.isArray(choix[b])).flatMap(b => choix[b]);
    // Sans choix (ou une liste vide d'une ancienne sauvegarde) : les touches par défaut,
    // moins celles qu'une autre action a prises (une touche ne fait jamais deux choses)
    const liste = action => (Array.isArray(choix[action]) && choix[action].length ? choix[action]
        : TOUCHES_DEFAUT[action].filter(c => !prises(action).includes(c)));
    function action(code) {
        for (const a in TOUCHES_DEFAUT) if (liste(a).includes(code)) return a;
        return null;
    }

    function nom(code) {
        const speciaux = {
            Space: T('Espace'), Escape: T('Échap'), ShiftLeft: T('Maj'), ShiftRight: T('Maj'), Enter: T('Entrée'),
            Backspace: T('Retour arrière'), Delete: T('Suppr'), Tab: 'Tab', ControlLeft: 'Ctrl', ControlRight: 'Ctrl',
            AltLeft: 'Alt', AltRight: 'Alt Gr', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→'
        };
        if (speciaux[code]) return speciaux[code];
        if (disposition && disposition.get(code)) return disposition.get(code).toUpperCase();
        if (/^Key[A-Z]$/.test(code)) return code.slice(3);
        if (/^Digit\d$/.test(code)) return code.slice(5);
        if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
        return code;
    }
    // Libellé court d'une action (sa première touche), ou toutes ses touches
    const libelle = (a, toutes = false) => (liste(a).length ? (toutes ? [...new Set(liste(a).map(nom))].join(' / ') : nom(liste(a)[0])) : '—');   // Maj gauche et droite : un seul « Maj »

    function changer(a, code) {
        const anciennes = liste(a).filter(c => c !== code);
        for (const b in TOUCHES_DEFAUT) {
            if (b === a || !liste(b).includes(code)) continue;   // seule l'action qui avait cette touche change
            const reste = liste(b).filter(c => c !== code);   // la touche quitte les autres actions
            // … mais aucune action ne reste sans touche : elle prend alors l'ancienne touche de « a » (échange)
            choix[b] = reste.length ? reste : (anciennes.length ? anciennes.slice(0, 1) : TOUCHES_DEFAUT[b].filter(c => c !== code && !prises(b).includes(c)));
        }
        choix[a] = [code];
        Sauvegarde.sauver();
        maj_affichages();
    }
    function par_defaut() {
        for (const a in choix) delete choix[a];
        Sauvegarde.sauver();
        maj_affichages();
    }

    // Partout où une touche est écrite : HUD, tutoriel, bouton du pouvoir
    function maj_affichages() {
        for (const el of document.querySelectorAll('[data-touche]')) el.textContent = libelle(el.dataset.touche);
        for (const el of document.querySelectorAll('[data-touches]')) {
            el.replaceChildren(...el.dataset.touches.split(',').flatMap(a => liste(a).slice(0, 2)).map(code => {
                const k = document.createElement('div');
                k.className = 'key' + (code === 'Space' ? ' key-space' : '');
                k.textContent = nom(code);
                return k;
            }));
        }
        if (typeof maj_hud_pouvoir === 'function') maj_hud_pouvoir();
        if (typeof Options !== 'undefined') Options.remplir_touches();
    }

    // Disposition réelle du clavier (Chrome, Edge) : AZERTY, QWERTZ…
    if (typeof navigator !== 'undefined' && navigator.keyboard && navigator.keyboard.getLayoutMap) {
        navigator.keyboard.getLayoutMap().then(carte => { disposition = carte; maj_affichages(); }).catch(() => {});
    }

    return { action, libelle, liste, nom, changer, par_defaut, maj_affichages };
})();

/* ---------- Écran des options ---------- */
const Options = (() => {
    const $o = id => document.getElementById(id);
    const ecran = $o('options-overlay');
    const curseurs = { musique: $o('vol-musique'), effets: $o('vol-effets') };
    let attente = null;   // action dont on attend la nouvelle touche

    function maj_son() {
        const muet = !Son.estActif() || (Son.volume('musique') === 0 && Son.volume('effets') === 0);
        $o('btn-options').classList.toggle('muet', muet);
        $o('btn-son-actif').textContent = Son.estActif() ? T('Son : activé') : T('Son : coupé');
        $o('btn-vibrations').textContent = Son.vibrations() ? T('Vibrations : activées') : T('Vibrations : coupées');
        $o('btn-conseils').textContent = Sauvegarde.donnees.options.conseils ? T('Conseils du sergent : activés') : T('Conseils du sergent : coupés');
        for (const quoi in curseurs) curseurs[quoi].value = Math.round(Son.volume(quoi) * 100);
    }

    function remplir_touches() {
        $o('liste-touches').replaceChildren(...ACTIONS_TOUCHES.map(([a, nom]) => {
            const ligne = document.createElement('button');
            ligne.className = 'ligne-touche' + (attente === a ? ' attente' : '');
            const n = document.createElement('span');
            n.textContent = T(nom);
            const k = document.createElement('span');
            k.className = 'key';
            k.textContent = attente === a ? T('Appuie sur une touche… (Échap pour annuler)') : Touches.libelle(a, true);
            ligne.append(n, k);
            ligne.addEventListener('click', () => { attente = a; remplir_touches(); });
            return ligne;
        }));
    }

    function remplir_langues() {
        $o('liste-langues').replaceChildren(...Object.entries(LANGUES).map(([code, l]) => {
            const b = document.createElement('button');
            b.className = 'bouton-langue' + (code === Langue.code ? ' active' : '');
            b.textContent = l.nom;
            b.addEventListener('click', () => Langue.choisir(code));
            return b;
        }));
    }

    function ouvrir() {
        if (typeof etat !== 'undefined' && etat.enCours && !etat.pause) mettre_en_pause(true);   // on ne joue pas pendant les réglages
        attente = null;
        maj_son();
        remplir_touches();
        remplir_langues();
        ecran.classList.remove('hidden');
    }
    function fermer() { attente = null; ecran.classList.add('hidden'); }

    // Capture de la nouvelle touche, avant tous les autres raccourcis (pause, tir…)
    window.addEventListener('keydown', e => {
        if (!attente) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.code !== 'Escape') Touches.changer(attente, e.code);
        attente = null;
        remplir_touches();
    }, true);

    $o('btn-options').addEventListener('click', ouvrir);
    $o('btn-close-options').addEventListener('click', fermer);
    $o('btn-touches-defaut').addEventListener('click', () => { attente = null; Touches.par_defaut(); });
    $o('btn-son-actif').addEventListener('click', () => { Son.setActif(!Son.estActif()); maj_son(); });
    $o('btn-conseils').addEventListener('click', () => {
        const o = Sauvegarde.donnees.options;
        o.conseils = !o.conseils;
        Sauvegarde.sauver();
        maj_son();
    });
    $o('btn-vibrations').addEventListener('click', () => { Son.setVibrations(!Son.vibrations()); maj_son(); Son.vibrer(0.5, 120); });
    for (const [quoi, curseur] of Object.entries(curseurs)) {
        curseur.addEventListener('input', () => { Son.setVolume(quoi, curseur.value / 100); maj_son(); });
        // Un petit son pour entendre le nouveau volume des effets ; puis on rend le clavier au jeu
        curseur.addEventListener('change', () => { if (quoi === 'effets') Son.bouton(); curseur.blur(); });
    }

    maj_son();
    return { ouvrir, fermer, remplir_touches };
})();
