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
const SPRITES_COMMANDANT = Object.assign(paire('commandant', 'repos', 'parle'), { portrait: paire('commandant', 'portrait-repos', 'portrait-parle') });
const OBJETS_CAMP = {
    tente: image('campagne/objets/tente'),
    tenteCommandement: image('campagne/objets/tente-commandement'),
    tenteBrutus: image('campagne/objets/tente-brutus'),
    jeep: image('campagne/objets/jeep'),
    camion: image('campagne/objets/camion')
};
