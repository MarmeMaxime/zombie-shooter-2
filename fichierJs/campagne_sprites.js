/* =========================================================================
   SPRITES DE LA CAMPAGNE (PNG dans assets/campagne/, générateurs dans
   outils/sprites/). Pour les paires : [0] au repos, [1] quand il parle (ou
   le voyant allumé).
   - SPRITES_SERGENT : le Sergent en pied (et .pyjama, sa tenue de nuit)
   - SPRITES_INSTRUCTEUR : ses portraits dans la boîte de dialogue (et .pyjama)
   - PORTE_LABO : le « portrait » du labo (sa porte), et la porte dans le camp
   - SPRITES_RADIO : le talkie-walkie de l'éclaireur
   - SPRITES_CHERCHEUR : la personne du labo, sortie dans l'ombre
   - OBJETS_CAMP : tentes (dont celle de Brutus), jeep, camion
   ========================================================================= */
const paire = (dossier, a, b) => [image(`campagne/${dossier}/${a}`), image(`campagne/${dossier}/${b}`)];

const SPRITES_SERGENT = Object.assign(paire('sergent', 'repos', 'parle'), { pyjama: paire('sergent-pyjama', 'repos', 'parle') });
const SPRITES_INSTRUCTEUR = Object.assign(paire('portraits', 'sergent-repos', 'sergent-parle'), { pyjama: paire('portraits', 'sergent-pyjama-repos', 'sergent-pyjama-parle') });
const PORTE_LABO = {
    portrait: paire('portraits', 'labo-eteint', 'labo-allume'),
    camp: image('campagne/labo/porte'),
    campAllume: image('campagne/labo/porte-allumee')
};
const SPRITES_RADIO = paire('portraits', 'radio-eteinte', 'radio-allumee');
const SPRITES_CHERCHEUR = paire('chercheur', 'repos', 'parle');
const OBJETS_CAMP = {
    tente: image('campagne/objets/tente'),
    tenteCommandement: image('campagne/objets/tente-commandement'),
    tenteBrutus: image('campagne/objets/tente-brutus'),
    jeep: image('campagne/objets/jeep'),
    camion: image('campagne/objets/camion')
};
