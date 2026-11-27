/* =========================================================================
   SPRITES DE LA CAMPAGNE (PNG dans assets/campagne/, générateurs dans
   outils/sprites/). Pour les paires : [0] au repos, [1] quand il parle (ou
   le voyant allumé).
   - SPRITES_SERGENT : le Sergent en pied (et .pyjama, sa tenue de nuit)
   - SPRITES_INSTRUCTEUR : ses portraits dans la boîte de dialogue (et .pyjama)
   - PORTE_LABO : le « portrait » du labo (sa porte), et la porte dans le camp
   - SPRITES_RADIO : le talkie-walkie de l'éclaireur (son portrait)
   Chaque portrait est rangé dans le dossier de son personnage (portrait-…).
   - SPRITES_CHERCHEUR : la personne du labo, sortie dans l'ombre
   - SPRITES_COMMANDANT : le supérieur de Mira, à la caserne (et .portrait)
   - sprites_mira_assise() : Mira assise à la caserne, dans sa tenue équipée
     ({ corps, bras: [a, b] } ; Ginette se pose en MIRA_BOMBE, sur ses genoux)
   - OBJETS_CAMP : tentes (dont celle de Brutus), jeep, camion
   ========================================================================= */
const paire = (dossier, a, b) => [image(`campagne/${dossier}/${a}`), image(`campagne/${dossier}/${b}`)];

const SPRITES_SERGENT = Object.assign(paire('sergent', 'repos', 'parle'), { pyjama: paire('sergent-pyjama', 'repos', 'parle') });
const SPRITES_INSTRUCTEUR = Object.assign(paire('sergent', 'portrait-repos', 'portrait-parle'), { pyjama: paire('sergent-pyjama', 'portrait-repos', 'portrait-parle') });
const PORTE_LABO = {
    portrait: paire('labo', 'portrait-eteint', 'portrait-allume'),
    camp: image('campagne/labo/porte'),
    campAllume: image('campagne/labo/porte-allumee')
};
const SPRITES_RADIO = paire('radio', 'portrait-eteinte', 'portrait-allumee');
const SPRITES_CHERCHEUR = paire('chercheur', 'repos', 'parle');
// Mira assise : une série par tenue dédiée (générée depuis son sprite debout, outils/sprites/mira_assise_sprite.js)
const MIRA_BOMBE = { x: 31, y: 33, echelle: 0.7 };
const sprites_mira_assise = (() => {
    const cache = {};
    return () => {
        const id = typeof Loot !== 'undefined' ? Loot.equipe('grenadier') : null;
        const skin = id && LOOT.skins[id];
        const dossier = skin && skin.perso ? 'skins/mira/' + id.slice(id.indexOf('_') + 1) : 'persos/mira';
        return cache[dossier] || (cache[dossier] = { corps: image(dossier + '/assise'), bras: [image(dossier + '/assise-bras1'), image(dossier + '/assise-bras2')] });
    };
})();
const SPRITES_COMMANDANT = Object.assign(paire('commandant', 'repos', 'parle'), { portrait: paire('commandant', 'portrait-repos', 'portrait-parle') });
const OBJETS_CAMP = {
    tente: image('campagne/objets/tente'),
    tenteCommandement: image('campagne/objets/tente-commandement'),
    tenteBrutus: image('campagne/objets/tente-brutus'),
    jeep: image('campagne/objets/jeep'),
    camion: image('campagne/objets/camion')
};
