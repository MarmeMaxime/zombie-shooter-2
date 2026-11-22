/* =========================================================================
   SPRITES DES CRÉATURES (PNG dans assets/monstres/, générateurs dans
   outils/sprites/). Les noms et les formes restent ceux qu'utilise le jeu.
   - SPRITES_BOSS : la Mastodonte, marche ×8 et charge ×8
   - SPRITES_JOGGEUR : marche ×12, course ×12, essouffle ×2
   - SPRITES_EMEUTE : l'Anti-émeute avec son bouclier (garde ×12), puis sans (sans ×12)
   - SPRITES_PONDEUSE : marche ×12 ; ses larves (assets/monstres/larve/) marche ×8
   - SPRITES_INFIRMIER : marche ×12, soin ×4
   - SPRITES_BOXEUR : marche ×12, esquive ×4
   - SPRITES_FOSSOYEUR : marche ×8, lancer ×4 ; ses tombes (assets/monstres/tombe/) ×3
   - SPRITES_ATTACHE : le zombie ficelé de l'entraînement (attache ×8) et le poteau resté seul
   ========================================================================= */
const SPRITES_BOSS = { marche: images('monstres/mastodonte/marche', 8), charge: images('monstres/mastodonte/charge', 8) };
const SPRITES_JOGGEUR = {
    marche: images('monstres/joggeur/marche', 12),
    course: images('monstres/joggeur/course', 12),
    essouffle: images('monstres/joggeur/essouffle', 2)
};
const SPRITES_EMEUTE = { garde: images('monstres/emeute/garde', 12), sans: images('monstres/emeute/sans', 12) };
const SPRITES_PONDEUSE = { marche: images('monstres/pondeuse/marche', 12), larve: images('monstres/larve/marche', 8) };
const SPRITES_INFIRMIER = { marche: images('monstres/infirmier/marche', 12), soin: images('monstres/infirmier/soin', 4) };
const SPRITES_BOXEUR = { marche: images('monstres/boxeur/marche', 12), esquive: images('monstres/boxeur/esquive', 4) };
const SPRITES_FOSSOYEUR = {
    marche: images('monstres/fossoyeur/marche', 8),
    lancer: images('monstres/fossoyeur/lancer', 4),
    tombe: images('monstres/tombe/tombe', 3)
};
const SPRITES_ATTACHE = { attache: images('monstres/zombie-attache/attache', 8), poteau: image('monstres/zombie-attache/poteau') };
