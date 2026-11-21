/* =========================================================================
   MANETTE (Gamepad API, PC)
   En partie : stick gauche ou croix pour monter/descendre (analogique, comme
   le joystick tactile), A ou gâchette droite pour tirer (maintenu = tir
   automatique), X / LB / RB pour le pouvoir spécial, Y pour acheter une vie,
   Start pour la pause. Dans les écrans : A pour valider (jouer, rejouer,
   reprendre), B pour revenir (fermer un écran, retour au menu).
   Vibrations de la manette : Son.vibrer (audio.js).
   ========================================================================= */
const Manette = (() => {
    const ZONE_MORTE = 0.3;
    // Boutons « standard » (Xbox / PlayStation) : numéros de la Gamepad API
    const BOUTONS = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, rt: 7, start: 9, haut: 12, bas: 13 };
    // Écrans qu'on referme avec B (dans cet ordre de priorité) et leur bouton « fermer »
    const ECRANS = [
        ['vestiaire-overlay', 'btn-close-vestiaire'], ['loot-overlay', 'btn-close-loot'], ['perso-overlay', 'btn-close-perso'],
        ['missions-overlay', 'btn-close-missions'], ['bestiaire-overlay', 'btn-close-bestiaire'], ['succes-overlay', 'btn-close-succes'],
        ['save-overlay', 'btn-close-save'], ['tutorial-overlay', 'btn-close-tuto'], ['options-overlay', 'btn-close-options'], ['tuto-proposition', 'btn-proposition-non']
    ];
    const visible = id => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); };
    const cliquer = id => document.getElementById(id).click();

    let avant = {};          // boutons enfoncés à l'image précédente (pour détecter les appuis)
    let axeManette = false;  // c'est la manette qui a réglé commandes.axe
    let tirManette = false;
    let boucleLancee = false;

    function lire(gp) {
        const b = {};
        for (const [nom, i] of Object.entries(BOUTONS)) b[nom] = Boolean(gp.buttons[i] && gp.buttons[i].pressed);
        b.axe = Math.abs(gp.axes[1] || 0) > ZONE_MORTE ? gp.axes[1] : (b.bas ? 1 : 0) - (b.haut ? 1 : 0);
        return b;
    }

    function en_partie(b, appui) {
        // Déplacement : la manette ne reprend la main que quand on la touche
        if (b.axe !== 0) { commandes.axe = b.axe; axeManette = true; } else if (axeManette) { commandes.axe = 0; axeManette = false; }
        // Tir : maintenu = tir automatique, comme le bouton TIR tactile
        if (b.a || b.rt) { commandes.tir = commandes.tirAuto = true; tirManette = true; } else if (tirManette) { commandes.tir = commandes.tirAuto = false; tirManette = false; }
        if (appui('x') || appui('lb') || appui('rb')) activer_pouvoir();
        if (appui('y')) acheter_vie();
        if (appui('start')) mettre_en_pause(true);
    }

    function dans_les_ecrans(b, appui) {
        if (tirManette || axeManette) { relacher_commandes(); tirManette = axeManette = false; }
        if (visible('ecran-titre') && !document.getElementById('ecran-titre').classList.contains('sortie')) {
            // « Appuie sur une touche » : n'importe quel bouton de la manette
            if (Object.keys(BOUTONS).some(appui)) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
            return;
        }
        if (etat.enCours && etat.pause) {
            if (appui('start') || appui('a')) mettre_en_pause(false);
            else if (appui('b')) cliquer('btn-pause-menu');
            return;
        }
        if (visible('game-over-overlay')) {
            if (appui('a') || appui('start')) cliquer('btn-retry');
            else if (appui('b')) cliquer('btn-return-menu');
            return;
        }
        const ouvert = ECRANS.find(([ecran]) => visible(ecran));
        if (ouvert) { if (appui('b')) cliquer(ouvert[1]); return; }
        if (visible('main-menu') && (appui('a') || appui('start'))) cliquer('btn-start');
    }

    function boucle() {
        const gp = [...navigator.getGamepads()].find(g => g && g.connected);
        if (gp) {
            const b = lire(gp);
            const appui = nom => b[nom] && !avant[nom];
            if (partie_en_cours()) en_partie(b, appui); else dans_les_ecrans(b, appui);
            avant = b;
        }
        requestAnimationFrame(boucle);
    }

    window.addEventListener('gamepadconnected', e => {
        Succes.notifier(T('🎮 Manette connectée : A tirer · X pouvoir · Y acheter une vie · Start pause'));
        Son.vibrer(0.4, 150);
        avant = {};
        if (!boucleLancee) { boucleLancee = true; requestAnimationFrame(boucle); }
    });
    window.addEventListener('gamepaddisconnected', () => { relacher_commandes(); axeManette = tirManette = false; });

    return {};
})();
