/* =========================================================================
   LA LISTE DES SPRITES À EXPORTER EN PNG (outils/sprites/exporter.html)
   Pour chaque image générée par les générateurs de ce dossier : son chemin dans
   assets/ (sans « .png »). Le jeu charge ensuite ces PNG (fichierJs/sprites/).
   Rangement : comme le reste d'assets/ — un dossier par créature ou par
   personnage, une image par étape d'animation (marche1, marche2…).
   ========================================================================= */
async function liste_sprites() {
    const A = (typeof window !== 'undefined' && window.RACINE_ASSETS) || '../../assets/';   // où sont les PNG d'origine
    const charger = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error(src)); i.src = src; });
    const L = [];
    const serie = (dossier, nom, images) => images.forEach((c, i) => L.push([`${dossier}/${nom}${i + 1}`, c]));
    const une = (chemin, c) => L.push([chemin, c]);

    // ---- Les créatures (assets/monstres/)
    serie('monstres/mastodonte', 'marche', SPRITES_BOSS.marche);
    serie('monstres/mastodonte', 'charge', SPRITES_BOSS.charge);
    serie('monstres/joggeur', 'marche', SPRITES_JOGGEUR.marche);
    serie('monstres/joggeur', 'course', SPRITES_JOGGEUR.course);
    serie('monstres/joggeur', 'essouffle', SPRITES_JOGGEUR.essouffle);
    serie('monstres/emeute', 'garde', SPRITES_EMEUTE.garde);
    serie('monstres/emeute', 'sans', SPRITES_EMEUTE.sans);
    serie('monstres/pondeuse', 'marche', SPRITES_PONDEUSE.marche);
    serie('monstres/larve', 'marche', SPRITES_PONDEUSE.larve);
    serie('monstres/infirmier', 'marche', SPRITES_INFIRMIER.marche);
    serie('monstres/infirmier', 'soin', SPRITES_INFIRMIER.soin);
    serie('monstres/boxeur', 'marche', SPRITES_BOXEUR.marche);
    serie('monstres/boxeur', 'esquive', SPRITES_BOXEUR.esquive);
    serie('monstres/fossoyeur', 'marche', SPRITES_FOSSOYEUR.marche);
    serie('monstres/fossoyeur', 'lancer', SPRITES_FOSSOYEUR.lancer);
    serie('monstres/tombe', 'tombe', SPRITES_FOSSOYEUR.tombe);
    // Le zombie attaché de l'entraînement : le zombie de base (3e image de marche), ficelé
    const zombie = await charger(A + 'monstres/zombie/marche3.png');
    const ATTACHE = [[0, 0], [-1, -1], [-1, -2], [-1, -1], [0, 0], [1, 1], [0, 0], [0, -2]];
    serie('monstres/zombie-attache', 'attache', ATTACHE.map(([torse, tete]) => SPRITES_ATTACHE.lier(zombie, torse, tete)));
    une('monstres/zombie-attache/poteau', SPRITES_ATTACHE.poteau);

    // ---- La campagne (assets/campagne/)
    une('campagne/sergent/repos', SPRITES_SERGENT[0]); une('campagne/sergent/parle', SPRITES_SERGENT[1]);
    une('campagne/sergent-pyjama/repos', SPRITES_SERGENT.pyjama[0]); une('campagne/sergent-pyjama/parle', SPRITES_SERGENT.pyjama[1]);
    une('campagne/sergent/portrait-repos', SPRITES_INSTRUCTEUR[0]); une('campagne/sergent/portrait-parle', SPRITES_INSTRUCTEUR[1]);
    une('campagne/sergent-pyjama/portrait-repos', SPRITES_INSTRUCTEUR.pyjama[0]); une('campagne/sergent-pyjama/portrait-parle', SPRITES_INSTRUCTEUR.pyjama[1]);
    une('campagne/labo/portrait-eteint', PORTE_LABO.portrait[0]); une('campagne/labo/portrait-allume', PORTE_LABO.portrait[1]);
    une('campagne/radio/portrait-eteinte', SPRITES_RADIO[0]); une('campagne/radio/portrait-allumee', SPRITES_RADIO[1]);
    une('campagne/labo/porte', PORTE_LABO.camp); une('campagne/labo/porte-allumee', PORTE_LABO.campAllume);
    for (const [nom, c] of [['tente', OBJETS_CAMP.tente], ['tente-commandement', OBJETS_CAMP.tenteCommandement], ['tente-brutus', OBJETS_CAMP.tenteBrutus], ['jeep', OBJETS_CAMP.jeep], ['camion', OBJETS_CAMP.camion]]) une('campagne/objets/' + nom, c);
    une('campagne/chercheur/repos', SPRITES_CHERCHEUR[0]); une('campagne/chercheur/parle', SPRITES_CHERCHEUR[1]);

    // ---- Le combat de boxe : Gégé, la foule, Brutus dans chaque tenue
    const G = SPRITES_BOXE.gorille;
    serie('campagne/gege', 'garde', G.garde); une('campagne/gege/parle', G.parle);
    serie('campagne/gege', 'armer', G.armer); serie('campagne/gege', 'frappe', G.frappe);
    serie('campagne/gege', 'ouvert', G.ouvert); une('campagne/gege/touche', G.touche);
    serie('campagne/gege', 'rugir', G.rugir); une('campagne/gege/ko', G.ko);
    une('campagne/gege/portrait-repos', G.portrait[0]); une('campagne/gege/portrait-parle', G.portrait[1]);
    SPRITES_BOXE.foule.gens.forEach((s, i) => { une(`campagne/foule/spectateur${i + 1}-bas`, s.bas); une(`campagne/foule/spectateur${i + 1}-haut`, s.haut); });
    serie('campagne/foule', 'dos', SPRITES_BOXE.foule.dos);
    const boxe = (dossier, B) => {
        serie(dossier, 'garde', B.garde); serie(dossier, 'jab', B.jab); serie(dossier, 'direct', B.direct);
        serie(dossier, 'uppercut', B.uppercut); serie(dossier, 'esquive', B.esquive);
        une(dossier + '/touche', B.touche); une(dossier + '/victoire', B.victoire); une(dossier + '/ko', B.ko);
    };
    boxe('persos/brutus/boxe', SPRITES_BOXE.brutus_pour(await charger(A + 'persos/brutus/arret.png')));
    for (const tenue of ['marcel', 'fonce', 'hawai', 'noel', 'catch', 'veteran'])
        boxe(`skins/brutus/${tenue}/boxe`, SPRITES_BOXE.brutus_pour(await charger(A + `skins/brutus/${tenue}/arret.png`)));
    return L;
}

// Envoie chaque image au petit serveur d'export (outils/exporter_sprites.js), qui l'écrit dans assets/
async function exporter_sprites(port = 8767) {
    const L = await liste_sprites();
    for (const [chemin, c] of L) {
        const base64 = c.toDataURL('image/png').split(',')[1];
        const r = await fetch(`http://localhost:${port}/`, { method: 'POST', body: JSON.stringify({ chemin, base64 }) });
        if (!r.ok) throw new Error(chemin + ' : ' + await r.text());
    }
    return L.length;
}
