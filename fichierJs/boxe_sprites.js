/* =========================================================================
   SPRITES DU COMBAT DE BOXE (« Le Ring ») : PNG dans assets/, générateur dans
   outils/sprites/boxe_sprites.js. Dessinés en 2,25× à l'écran par boxe.js.
   - Brutus boxeur, construit à partir de son vrai sprite : un jeu d'images par
     tenue (assets/persos/brutus/boxe/, assets/skins/brutus/<tenue>/boxe/),
     toile 80×80, son sprite posé avec 8 pixels de marge, pieds sur la ligne 71.
       garde ×4, jab ×2, direct ×2, uppercut ×3, esquive ×2, touche, victoire, ko
   - Gégé, le gorille (assets/campagne/gege/), toile 84×84, pieds sur la ligne 81 :
       garde ×4, parle, armer ×2, frappe ×2, ouvert ×2, touche, rugir ×2, ko,
       portrait (repos / parle) pour les dialogues
   - La foule de la bâtisse (assets/campagne/foule/) : 14 spectateurs (bras
     baissés / levés) et 5 du premier rang, vus de dos.
   ========================================================================= */
const BOXE_TOILE = 80, BOXE_MARGE = 8, BOXE_PIEDS = 71;
const GORILLE_TOILE = 84, GORILLE_PIEDS = 81;

const SPRITES_BOXE = (() => {
    function brutus_boxeur(dossier) {
        const d = dossier + '/boxe/';
        return {
            garde: images(d + 'garde', 4), jab: images(d + 'jab', 2), direct: images(d + 'direct', 2),
            uppercut: images(d + 'uppercut', 3), esquive: images(d + 'esquive', 2),
            touche: image(d + 'touche'), victoire: image(d + 'victoire'), ko: image(d + 'ko')
        };
    }
    // Brutus dans la tenue qu'il porte (une tenue dédiée a ses propres images ; sinon, la sienne)
    const cache = {};
    function brutus() {
        const id = typeof Loot !== 'undefined' ? Loot.equipe('brute') : null;
        const tenue = id && id.startsWith('brute_') ? id.slice('brute_'.length) : null;
        const dossier = tenue ? `skins/brutus/${tenue}` : 'persos/brutus';
        return cache[dossier] || (cache[dossier] = brutus_boxeur(dossier));
    }

    const G = 'campagne/gege/';
    const gorille = {
        garde: images(G + 'garde', 4), parle: image(G + 'parle'),
        armer: images(G + 'armer', 2), frappe: images(G + 'frappe', 2), ouvert: images(G + 'ouvert', 2),
        touche: image(G + 'touche'), rugir: images(G + 'rugir', 2), ko: image(G + 'ko'),
        portrait: [image(G + 'portrait-repos'), image(G + 'portrait-parle')]
    };
    const foule = {
        gens: Array.from({ length: 14 }, (_, k) => ({ bas: image(`campagne/foule/spectateur${k + 1}-bas`), haut: image(`campagne/foule/spectateur${k + 1}-haut`) })),
        dos: images('campagne/foule/dos', 5)
    };
    return { get brutus() { return brutus(); }, gorille, foule };
})();
