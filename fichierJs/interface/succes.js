/* =========================================================================
   SUCCÈS ET TITRES
   Chaque succès a une valeur à atteindre, rapporte des crânes et débloque
   un titre affiché dans le menu. Progression stockée dans la sauvegarde.
   ========================================================================= */
const SV = () => Sauvegarde.donnees;
const totalTues = () => Object.values(SV().stats.tues).reduce((s, n) => s + (Number(n) || 0), 0);
const meilleur = table => Math.max(0, ...Object.values(table).map(Number).filter(Number.isFinite));
// Missions de campagne d'un chapitre réussies dans l'une des difficultés données
const campagne_reussies = (chapitre, modes) => (typeof MISSIONS_CAMPAGNE === 'undefined' ? 0
    : MISSIONS_CAMPAGNE.filter(m => m.chapitre === chapitre && modes.some(mode => SV().campagne.missions[m.id] && SV().campagne.missions[m.id][mode])).length);

// (les descriptions des Vétérans et de Légende reçoivent leur nombre de missions dans missions.js)
const SUCCES = [
    { id: 'premier_sang', nom: 'Premier sang', desc: 'Tuer un zombie', titre: 'Bleu', recompense: 20, objectif: 1, valeur: totalTues },
    { id: 'centurion', nom: 'Centurion', desc: 'Tuer 100 zombies', titre: 'Centurion', recompense: 50, objectif: 100, valeur: totalTues },
    { id: 'exterminateur', nom: 'Exterminateur', desc: 'Tuer 1 000 zombies', titre: 'Exterminateur', recompense: 200, objectif: 1000, valeur: totalTues },
    { id: 'ouvre_boite', nom: 'Ouvre-boîte', desc: 'Tuer 25 tanks', titre: 'Ouvre-boîte', recompense: 80, objectif: 25, valeur: () => SV().stats.tues.tank || 0 },
    { id: 'chasseur_mg', nom: 'Désenchanteur', desc: 'Tuer 10 magical girls', titre: 'Chasseur de magical girls', recompense: 100, objectif: 10, valeur: () => SV().stats.tues.magicalgirl || 0 },
    { id: 'tueur_geant', nom: 'Tueur de géant', desc: 'Vaincre un boss', titre: 'Tueur de géant', recompense: 150, objectif: 1, valeur: () => SV().stats.bossTues },
    { id: 'fleau', nom: 'Fléau des boss', desc: 'Vaincre 5 boss', titre: 'Fléau des Mastodontes', recompense: 400, objectif: 5, valeur: () => SV().stats.bossTues },
    { id: 'survivant', nom: 'Survivant', desc: 'Survivre 5 minutes', titre: 'Survivant', recompense: 100, objectif: 300, unite: 's', valeur: () => meilleur(SV().stats.meilleurTemps) },
    { id: 'increvable', nom: 'Increvable', desc: 'Survivre 10 minutes en hardcore', titre: 'Increvable', recompense: 300, objectif: 600, unite: 's', valeur: () => SV().stats.meilleurTemps.hardcore || 0 },
    { id: 'machine', nom: 'Machine de guerre', desc: 'Gagner 5 000 points en une partie', titre: 'Machine de guerre', recompense: 200, objectif: 5000, valeur: () => meilleur(SV().stats.meilleurScore) },
    { id: 'polyvalent', nom: 'Polyvalent', desc: 'Jouer une partie avec chaque personnage', titre: 'Couteau suisse', recompense: 60, objectif: 4, valeur: () => SV().stats.persosJoues.length },
    { id: 'pigeon', nom: 'Pigeon', desc: 'Ouvrir 100 caisses', titre: 'Pigeon', recompense: 100, objectif: 100, valeur: () => SV().loot.ouvertes },
    { id: 'baleine', nom: 'Baleine', desc: 'Ouvrir 500 caisses', titre: 'Baleine', recompense: 500, objectif: 500, valeur: () => SV().loot.ouvertes },
    { id: 'geologue', nom: 'Géologue amateur', desc: 'Obtenir 10 cailloux', titre: 'Collectionneur de cailloux', recompense: 30, objectif: 10, valeur: () => SV().loot.dechets.caillou || 0 },
    { id: 'fashion', nom: 'Fashion victim', desc: 'Posséder 10 skins', titre: 'Fashion victim', recompense: 150, objectif: 10, valeur: () => SV().loot.possedes.length },
    { id: 'elu', nom: 'L\'Élu du RNG', desc: 'Obtenir un objet mythique', titre: 'Élu du RNG', recompense: 250, objectif: 1, valeur: () => SV().stats.mythiques },
    // Liés aux missions par personnage (missions.js)
    { id: 'veteran_soldat', nom: 'Vétéran : Soldat', desc: 'Réussir les {n} défis du Soldat', titre: 'Sergent', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('soldat')) },
    { id: 'veteran_brute', nom: 'Vétéran : Brutus', desc: 'Réussir les {n} défis de Brutus', titre: 'Boucher', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('brute')) },
    { id: 'veteran_mira', nom: 'Vétéran : Mira', desc: 'Réussir les {n} défis de Mira', titre: 'Artificière', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('grenadier')) },
    { id: 'veteran_lassie', nom: 'Vétéran : Lassie', desc: 'Réussir les {n} défis de Lassie', titre: 'Reine de la foudre', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('lassie')) },
    { id: 'legende', nom: 'Légende vivante', desc: 'Réussir les {n} défis', titre: 'Légende vivante', recompense: 1500, objectif: 40, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees()) },
    // Le Joggeur
    { id: 'premier_footing', nom: 'Fin du footing', desc: 'Tuer un Joggeur', titre: 'Coach sportif', recompense: 30, objectif: 1, valeur: () => SV().stats.tues.joggeur || 0 },
    { id: 'marathon', nom: 'Marathonien', desc: 'Tuer 50 Joggeurs', titre: 'Marathonien', recompense: 150, objectif: 50, valeur: () => SV().stats.tues.joggeur || 0 },
    { id: 'carton_rouge', nom: 'Carton rouge', desc: 'Abattre un Joggeur en plein sprint', titre: 'Arbitre', recompense: 80, objectif: 1, valeur: () => SV().stats.sprintsStoppes },
    { id: 'torero', nom: 'Torero', desc: 'Esquiver 10 charges de Joggeur', titre: 'Torero', recompense: 150, objectif: 10, valeur: () => SV().stats.esquives },
    // L'Anti-émeute
    { id: 'dispersion', nom: 'Dispersion', desc: 'Tuer un Anti-émeute', titre: 'Fauteur de troubles', recompense: 30, objectif: 1, valeur: () => SV().stats.tues.emeute || 0 },
    { id: 'casseur', nom: 'Casseur', desc: 'Briser 20 boucliers', titre: 'Casseur', recompense: 120, objectif: 20, valeur: () => SV().stats.bouclierBrises || 0 },
    { id: 'maintien_ordre', nom: 'Désordre public', desc: 'Tuer 30 Anti-émeutes', titre: 'Insurgé', recompense: 150, objectif: 30, valeur: () => SV().stats.tues.emeute || 0 },
    // Pouvoirs spéciaux
    { id: 'super_pouvoir', nom: 'Super-pouvoir', desc: 'Utiliser un pouvoir spécial', titre: 'Éveillé', recompense: 30, objectif: 1, valeur: () => SV().stats.pouvoirs || 0 },
    { id: 'ultime', nom: 'Ultime', desc: 'Utiliser 50 pouvoirs spéciaux', titre: 'Surpuissant', recompense: 200, objectif: 50, valeur: () => SV().stats.pouvoirs || 0 },
    // La Pondeuse, l'Infirmier, le Boxeur
    { id: 'desinsectisation', nom: 'Désinsectisation', desc: 'Tuer 100 larves', titre: 'Exterminateur d\'asticots', recompense: 120, objectif: 100, valeur: () => SV().stats.tues.larve || 0 },
    { id: 'pas_de_soin', nom: 'Faute professionnelle', desc: 'Tuer 25 Infirmiers', titre: 'Radié de l\'ordre', recompense: 120, objectif: 25, valeur: () => SV().stats.tues.infirmier || 0 },
    { id: 'ko', nom: 'K.-O.', desc: 'Tuer 20 Boxeurs (hardcore)', titre: 'Champion poids lourd', recompense: 200, objectif: 20, valeur: () => SV().stats.tues.boxeur || 0 },
    // Le Fossoyeur
    { id: 'fossoyeur', nom: 'Enterrement de première classe', desc: 'Vaincre le Fossoyeur', titre: 'Croque-mort', recompense: 200, objectif: 1, valeur: () => SV().stats.tues.fossoyeur || 0 },
    { id: 'profanateur', nom: 'Profanateur', desc: 'Détruire 30 tombes avant qu\'elles s\'ouvrent', titre: 'Pilleur de tombes', recompense: 150, objectif: 30, valeur: () => SV().stats.tues.tombe || 0 },
    // 1.1
    { id: 'recruteur', nom: 'Recruteur', desc: 'Débloquer tous les personnages', titre: 'Chef d\'escouade', recompense: 300, objectif: 4, valeur: () => SV().persosDebloques.length },
    { id: 'naturaliste', nom: 'Naturaliste', desc: 'Découvrir les 11 monstres du bestiaire', titre: 'Naturaliste', recompense: 200, objectif: 11, valeur: () => SV().bestiaire.length },
    { id: 'coeur_brise', nom: 'Cœur brisé', desc: 'Vaincre Alana (le Mastodonte) 3 fois', titre: 'Briseur de cœurs', recompense: 250, objectif: 3, valeur: () => SV().stats.tues.boss || 0 },
    { id: 'perpetuite', nom: 'Concession à perpétuité', desc: 'Vaincre 5 Fossoyeurs', titre: 'Gardien du cimetière', recompense: 400, objectif: 5, valeur: () => SV().stats.tues.fossoyeur || 0 },
    { id: 'naissances', nom: 'Contrôle des naissances', desc: 'Tuer 25 Pondeuses', titre: 'Planning familial', recompense: 120, objectif: 25, valeur: () => SV().stats.tues.pondeuse || 0 },
    { id: 'securite_sociale', nom: 'Sécurité sociale', desc: 'Laisser les Infirmiers soigner 50 zombies (bravo…)', titre: 'Bien assuré', recompense: 50, objectif: 50, valeur: () => SV().stats.soins || 0 },
    { id: 'sparring', nom: 'Sparring-partner', desc: 'Faire esquiver un Boxeur 25 fois', titre: 'Punching-ball', recompense: 100, objectif: 25, valeur: () => SV().stats.esquivesBoxeur || 0 },
    { id: 'inarretable', nom: 'Inarrêtable', desc: 'Survivre 15 minutes', titre: 'Inarrêtable', recompense: 300, objectif: 900, unite: 's', valeur: () => meilleur(SV().stats.meilleurTemps) },
    { id: 'rentier', nom: 'Rentier', desc: 'Avoir 5 000 crânes en poche', titre: 'Rentier', recompense: 0, objectif: 5000, valeur: () => SV().loot.cranes },
    { id: 'pouvoir_100', nom: 'Au-delà de 9000', desc: 'Utiliser 100 pouvoirs spéciaux', titre: 'Surhumain', recompense: 300, objectif: 100, valeur: () => SV().stats.pouvoirs || 0 },
    // Campagne (leurs objectifs, le nombre de missions du chapitre, sont fixés dans campagne.js)
    { id: 'campagne_c1', nom: 'La Recrue', desc: 'Terminer le chapitre 1 de la campagne', titre: 'Recrue confirmée', recompense: 300, objectif: 5,
        valeur: () => campagne_reussies(1, ['normal', 'hardcore']) },
    { id: 'campagne_c1_hc', nom: 'Forces spéciales', desc: 'Terminer le chapitre 1 de la campagne en hardcore', titre: 'Forces spéciales', recompense: 600, objectif: 5,
        valeur: () => campagne_reussies(1, ['hardcore']) },
    { id: 'nuit_blanche', nom: 'Nuit blanche', desc: 'Réussir « Couvre-feu » sans perdre une vie', titre: 'Insomniaque', recompense: 250, objectif: 1,
        valeur: () => (SV().campagne.parfaites && SV().campagne.parfaites.c1m2 ? 1 : 0) },
    // Chapitre 2 : l'histoire de Brutus
    { id: 'campagne_c2', nom: 'Le Cogneur', desc: 'Terminer le chapitre 2 de la campagne', titre: 'Déménageur', recompense: 400, objectif: 5,
        valeur: () => campagne_reussies(2, ['normal', 'hardcore']) },
    { id: 'campagne_c2_hc', nom: 'Chef Cigare', desc: 'Terminer le chapitre 2 de la campagne en hardcore', titre: 'Vétéran des Trois Collines', recompense: 700, objectif: 5,
        valeur: () => campagne_reussies(2, ['hardcore']) },
    { id: 'gege_intouchable', nom: 'Pas une égratignure', desc: 'Battre Gégé sans être touché', titre: 'Intouchable', recompense: 300, objectif: 1,
        valeur: () => ((SV().campagne.exploits || {}).gegeIntouchable ? 1 : 0) },
    { id: 'esquives_parfaites', nom: 'Danse avec le gorille', desc: 'Réussir 5 esquives parfaites dans un même combat contre Gégé', titre: 'Danseur de ring', recompense: 200, objectif: 5,
        valeur: () => (SV().campagne.exploits || {}).esquivesParfaites || 0 },
    { id: 'terminus_sans_soin', nom: 'Hôpital fermé', desc: 'Réussir « Terminus » sans qu\'un Infirmier ne soigne personne', titre: 'Chef de service', recompense: 250, objectif: 1,
        valeur: () => ((SV().campagne.exploits || {}).terminusSansSoin ? 1 : 0) },
    // Succès secret : caché dans la liste tant qu'on ne l'a pas trouvé
    { id: 'tir_ami', nom: 'Tir ami', desc: 'Trouver la fin secrète de « La Débandade »', titre: 'Gâchette facile', recompense: 150, objectif: 1, secret: true,
        valeur: () => (SV().campagne.secrets && SV().campagne.secrets.tirAmi ? 1 : 0) },
    // Mode Vagues
    { id: 'vague_10', nom: 'Brise-lames', desc: 'Terminer la vague 10', titre: 'Brise-lames', recompense: 200, objectif: 10, valeur: () => SV().stats.meilleureVague || 0 },
    { id: 'vague_25', nom: 'Raz-de-marée', desc: 'Terminer la vague 25', titre: 'Digue humaine', recompense: 500, objectif: 25, valeur: () => SV().stats.meilleureVague || 0 },
    { id: 'bestiaire', nom: 'Bestiaire complet', desc: 'Tuer au moins un monstre de chaque espèce', titre: 'Zoologiste', recompense: 250, objectif: 11,
        valeur: () => ['normal', 'tank', 'magicalgirl', 'joggeur', 'emeute', 'pondeuse', 'larve', 'infirmier', 'boxeur', 'boss', 'fossoyeur'].filter(t => (SV().stats.tues[t] || 0) > 0).length }
];

// Noms, descriptions et titres dans la langue du joueur (l'original reste dans _fr)
Langue.traduire_objets(SUCCES, ['nom', 'desc', 'titre']);

/* Ordre d'affichage : progression d'un joueur, du premier zombie aux défis
   de fin (le code au-dessus reste rangé par thème). Un succès absent de la
   liste s'affiche à la fin. */
const ORDRE_SUCCES = [
    'premier_sang', 'super_pouvoir', 'premier_footing', 'dispersion', 'centurion', 'geologue', 'survivant',
    'ouvre_boite', 'campagne_c1', 'campagne_c2', 'carton_rouge', 'tueur_geant', 'fossoyeur', 'polyvalent', 'securite_sociale', 'desinsectisation',
    'casseur', 'naissances', 'pas_de_soin', 'fashion', 'torero', 'recruteur', 'machine', 'chasseur_mg',
    'maintien_ordre', 'ultime', 'profanateur', 'pigeon', 'increvable', 'coeur_brise', 'marathon', 'fleau',
    'sparring', 'ko', 'exterminateur', 'elu', 'rentier', 'inarretable', 'naturaliste', 'bestiaire', 'perpetuite',
    'pouvoir_100', 'nuit_blanche', 'esquives_parfaites', 'terminus_sans_soin', 'vague_10', 'baleine', 'vague_25', 'gege_intouchable', 'campagne_c1_hc', 'campagne_c2_hc', 'veteran_soldat', 'veteran_brute', 'veteran_mira', 'veteran_lassie', 'legende', 'tir_ami'
];
SUCCES.sort((a, b) => {
    const rang = s => { const i = ORDRE_SUCCES.indexOf(s.id); return i < 0 ? ORDRE_SUCCES.length : i; };
    return rang(a) - rang(b);
});

const Succes = (() => {
    const $s = id => document.getElementById(id);
    let secondes = 0;

    // Bandeau « Succès débloqué » en haut de l'écran
    const toast = document.createElement('div');
    toast.id = 'toast-succes';
    toast.className = 'hidden';
    document.getElementById('game-container').appendChild(toast);
    let fileToasts = [], toastActif = false;

    // Bandeau partagé par les succès et les missions (missions.js)
    function notifier(texte) {
        fileToasts.push(texte);
        afficher_toast();
    }

    function afficher_toast() {
        if (toastActif || !fileToasts.length) return;
        toastActif = true;
        toast.textContent = fileToasts.shift();
        toast.classList.remove('hidden');
        Son.effet('succes');
        setTimeout(() => { toast.classList.add('hidden'); toastActif = false; setTimeout(afficher_toast, 300); }, 3200);
    }

    function verifier() {
        let nouveau = false;
        for (const s of SUCCES) {
            if (SV().succes.includes(s.id) || s.valeur() < s.objectif) continue;
            SV().succes.push(s.id);
            SV().loot.cranes += s.recompense;
            fileToasts.push(T('🏆 Succès débloqué : {nom} · +{n} 💀 · titre « {titre} »', { nom: s.nom, n: s.recompense, titre: s.titre }));
            if (typeof etat !== 'undefined' && etat.succes) etat.succes.push(s.nom);   // bilan de fin de partie
            nouveau = true;
        }
        if (nouveau) {
            Sauvegarde.sauver();
            afficher_toast();
            if (typeof LootUI !== 'undefined') LootUI.maj_soldes();
        }
    }

    function zombie_tue(type) {
        const t = SV().stats.tues;
        t[type] = (Number(t[type]) || 0) + 1;
        if (est_boss(type)) SV().stats.bossTues++;
        if (typeof Missions !== 'undefined') Missions.zombie_tue(type);
        verifier();
    }

    // Appelé une fois par seconde pendant la partie
    function seconde() {
        const st = SV().stats;
        st.meilleurTemps[etat.mode] = Math.max(Number(st.meilleurTemps[etat.mode]) || 0, Math.floor(etat.temps));
        st.meilleurScore[etat.mode] = Math.max(Number(st.meilleurScore[etat.mode]) || 0, etat.gagnes);
        if (typeof Missions !== 'undefined') Missions.seconde();
        verifier();
        if (++secondes % 10 === 0) Sauvegarde.sauver();   // les compteurs ne sont pas perdus en cas de fermeture
    }

    function fin_partie() {
        const st = SV().stats;
        st.parties++;
        if (!st.persosJoues.includes(etat.perso)) st.persosJoues.push(etat.perso);
        if (typeof Missions !== 'undefined') Missions.fin_partie();
        seconde();
        Sauvegarde.sauver();
    }

    // Compteur générique de la sauvegarde (esquives, sprints stoppés…)
    function compter(stat, combien = 1) {
        SV().stats[stat] = (Number(SV().stats[stat]) || 0) + combien;
        verifier();
    }

    function apres_caisse(objet) {
        if (objet.rarete.id === 'mythique') SV().stats.mythiques++;
        if (objet.rarete.id === 'unique') SV().stats.uniques = (SV().stats.uniques || 0) + 1;
        verifier();
    }

    /* ---------- Titre ---------- */
    // Le titre porté est gardé par identifiant de succès (il ne dépend pas de la langue).
    // Ancienne sauvegarde : le titre était gardé en texte français, on retrouve son succès.
    {
        const ancien = SUCCES.find(x => x.id !== SV().titre && x._fr && x._fr.titre === SV().titre);
        if (SV().titre && !SUCCES.some(x => x.id === SV().titre)) SV().titre = ancien ? ancien.id : '';
    }
    function titre_actuel() {
        const s = SUCCES.find(x => x.id === SV().titre && SV().succes.includes(x.id));
        return s ? s.titre : '';
    }

    function maj_titre() {
        const t = titre_actuel();
        $s('titre-joueur').textContent = t ? `« ${t} »` : '';
    }

    /* ---------- Écran des succès ---------- */
    function remplir() {
        const debloques = SV().succes;
        $s('succes-compte').textContent = T('{a} / {b} succès · clique sur un succès débloqué pour porter son titre', { a: debloques.filter(id => SUCCES.some(s => s.id === id)).length, b: SUCCES.length });
        $s('succes-liste').replaceChildren(...SUCCES.map(s => {
            const ok = debloques.includes(s.id);
            const ligne = document.createElement('button');
            ligne.className = 'succes-ligne' + (ok ? ' ok' : '') + (ok && SV().titre === s.id ? ' porte' : '');
            ligne.disabled = !ok;

            const icone = document.createElement('span');
            icone.className = 'succes-icone';
            icone.textContent = ok ? '🏆' : '🔒';

            const texte = document.createElement('span');
            texte.className = 'succes-texte';
            const nom = document.createElement('strong');
            nom.textContent = s.nom;
            const desc = document.createElement('small');
            const v = Math.min(s.valeur(), s.objectif);
            desc.textContent = `${s.desc} · ${ok ? T('fait') : `${v}${s.unite || ''} / ${s.objectif}${s.unite || ''}`} · +${s.recompense} 💀 · ${T('titre « {titre} »', { titre: s.titre })}`;
            // Succès secret pas encore trouvé : on ne dévoile rien
            if (s.secret && !ok) { nom.textContent = '???'; desc.textContent = T('Succès secret. Certains disent qu{q}on le trouve en désobéissant.', { q: "'" }); }
            texte.append(nom, desc);

            ligne.append(icone, texte);
            ligne.addEventListener('click', () => {
                SV().titre = SV().titre === s.id ? '' : s.id;   // re-cliquer retire le titre
                Sauvegarde.sauver();
                maj_titre();
                remplir();
            });
            return ligne;
        }));
    }

    $s('btn-succes').addEventListener('click', () => { remplir(); $s('succes-overlay').classList.remove('hidden'); });
    $s('btn-close-succes').addEventListener('click', () => $s('succes-overlay').classList.add('hidden'));

    maj_titre();
    verifier();   // succès déjà mérités avec une ancienne sauvegarde (caisses, skins…)

    return { zombie_tue, seconde, fin_partie, apres_caisse, titre_actuel, notifier, verifier, compter };
})();
