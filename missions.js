/* =========================================================================
   MISSIONS PAR PERSONNAGE
   10 missions par perso, chacune avec un objectif chiffré et une récompense
   en crânes. Elles se valident toutes seules pendant les parties jouées avec
   ce personnage. Terminer toutes celles d'un perso débloque un succès.
   Statistiques par perso : Sauvegarde.donnees.stats.persos[perso].
   ========================================================================= */
const statsPerso = perso => {
    const tous = Sauvegarde.donnees.stats.persos;
    const p = tous[perso] || (tous[perso] = {});
    // Champs complétés au besoin : une ancienne sauvegarde reste compatible
    p.tues ??= {}; p.total ??= 0; p.boss ??= 0; p.parties ??= 0;
    p.meilleurTemps ??= {}; p.meilleurScore ??= 0; p.sansDegat ??= 0; p.coupMax ??= 0; p.pouvoirs ??= 0;
    return p;
};

/* Records de chaque perso, par difficulté et par mode :
   stats.persos[perso].records['normal-classique'] = { temps, score },
   stats.persos[perso].records['hardcore-vagues'] = { vague, score }, etc.
   Une ancienne sauvegarde reprend le meilleur temps déjà connu du perso. */
const Records = {
    lire(perso, mode, variante) {
        const p = statsPerso(perso);
        p.records ??= {};
        const cle = mode + '-' + variante;
        p.records[cle] ??= variante === 'vagues' ? { vague: 0, score: 0 } : { temps: Number(p.meilleurTemps[mode]) || 0, score: 0 };
        return p.records[cle];
    },
    // Garde le meilleur de chaque valeur pour la partie en cours (pas pendant l'entraînement)
    maj(valeurs) {
        if (etat.tuto) return;
        const r = Records.lire(etat.perso, etat.mode, etat.variante);
        for (const [cle, v] of Object.entries(valeurs)) r[cle] = Math.max(r[cle] || 0, v);
    }
};

// Fabriques de missions courantes
const M = {
    tues: (n, nom, recompense) => ({ nom: T(nom), desc: T('Tuer {n} zombies', { n }), objectif: n, recompense, valeur: p => p.total }),
    type: (type, n, nom, desc, recompense) => ({ nom: T(nom), desc: T(desc), objectif: n, recompense, valeur: p => p.tues[type] || 0 }),
    survie: (sec, nom, recompense) => ({ nom: T(nom), desc: T('Survivre {n} min en une partie', { n: sec / 60 }), objectif: sec, unite: 's', recompense, valeur: p => Math.max(0, ...Object.values(p.meilleurTemps)) }),
    hardcore: (sec, nom, recompense) => ({ nom: T(nom), desc: T('Survivre {n} min en hardcore', { n: sec / 60 }), objectif: sec, unite: 's', recompense, valeur: p => p.meilleurTemps.hardcore || 0 }),
    intouchable: (sec, nom, recompense) => ({ nom: T(nom), desc: T('Tenir {n} s sans perdre de vie', { n: sec }), objectif: sec, unite: 's', recompense, valeur: p => p.sansDegat }),
    score: (n, nom, recompense) => ({ nom: T(nom), desc: T('Gagner {n} points en une partie', { n }), objectif: n, recompense, valeur: p => p.meilleurScore }),
    boss: (n, nom, recompense) => ({ nom: T(nom), desc: T('Vaincre {n} boss', { n }), objectif: n, recompense, valeur: p => p.boss }),
    coup: (n, nom, recompense) => ({ nom: T(nom), desc: T('Tuer {n} zombies d\'un seul coup', { n }), objectif: n, recompense, valeur: p => p.coupMax }),
    pouvoir: (pouvoir, n, nom, recompense) => ({ nom: T(nom), desc: T('Utiliser {n} fois {pouvoir}', { n, pouvoir: CONFIG.pouvoirs[pouvoir].nom }), objectif: n, recompense, valeur: p => p.pouvoirs })
};

const MISSIONS = {
    soldat: [
        M.tues(50, 'Recrue', 40),
        M.tues(300, 'Tireur', 100),
        M.tues(1000, 'Tireur d\'élite', 300),
        M.type('tank', 15, 'Perce-blindage', 'Tuer 15 tanks', 100),
        M.type('magicalgirl', 10, 'Anti-magie', 'Tuer 10 magical girls', 120),
        M.survie(300, 'Tenir la ligne', 100),
        M.intouchable(90, 'Intouchable', 150),
        M.score(3000, 'Feu nourri', 150),
        M.boss(2, 'Chasseur de géants', 200),
        M.hardcore(480, 'Dernier rempart', 300),
        // 1.1 : pouvoirs, nouveaux ennemis, Fossoyeur
        M.pouvoir('rafale', 10, 'Pluie de plomb', 120),
        M.type('infirmier', 10, 'Pas de quartier', 'Tuer 10 Infirmiers', 120),
        M.type('larve', 40, 'Chasse aux asticots', 'Tuer 40 larves', 120),
        M.type('fossoyeur', 1, 'Mise en terre', 'Vaincre le Fossoyeur', 250),
        M.survie(600, 'Sentinelle', 300)
    ],
    brute: [
        M.tues(50, 'Bagarreur', 40),
        M.tues(300, 'Cogneur', 100),
        M.tues(1000, 'Broyeur', 300),
        M.coup(2, 'Doublé', 80),
        M.score(3000, 'Carnage', 150),
        M.type('tank', 25, 'Démolisseur', 'Tuer 25 tanks', 150),
        M.intouchable(90, 'Peau de cuir', 150),
        M.survie(300, 'Vieux de la vieille', 100),
        M.boss(2, 'Poids lourd', 200),
        M.hardcore(480, 'Increvable', 300),
        M.pouvoir('onde', 15, 'Tremblement de terre', 120),
        M.type('pondeuse', 15, 'Crève-ventre', 'Tuer 15 Pondeuses', 120),
        M.type('emeute', 15, 'Briseur de lignes', 'Tuer 15 Anti-émeutes', 150),
        M.type('larve', 40, 'Écrase-larves', 'Tuer 40 larves', 120),
        M.type('fossoyeur', 1, 'Fossoyé', 'Vaincre le Fossoyeur', 250)
    ],
    grenadier: [
        M.tues(50, 'Apprentie', 40),
        M.tues(300, 'Artificière', 100),
        M.tues(1000, 'Pluie de feu', 300),
        M.coup(2, 'Explosion groupée', 80),
        M.coup(3, 'Feu d\'artifice', 200),
        M.type('magicalgirl', 10, 'Duel de magiciennes', 'Tuer 10 magical girls', 120),
        M.survie(300, 'Sang-froid', 100),
        M.intouchable(120, 'Insaisissable', 180),
        M.boss(2, 'Démolition', 200),
        M.hardcore(480, 'Reine du chaos', 300),
        M.pouvoir('artillerie', 10, 'Bombardement', 120),
        M.type('larve', 60, 'Nid d\'asticots', 'Tuer 60 larves', 120),
        M.type('tombe', 15, 'Pelleteuse', 'Détruire 15 tombes', 150),
        M.coup(4, 'Bouquet final', 250),
        M.type('fossoyeur', 1, 'Mise à feu', 'Vaincre le Fossoyeur', 250)
    ],
    lassie: [
        M.tues(50, 'Étincelle', 40),
        M.tues(300, 'Survoltée', 100),
        M.tues(1000, 'Orage', 300),
        M.coup(2, 'Court-circuit', 80),
        M.coup(3, 'Réaction en chaîne', 200),
        M.type('magicalgirl', 10, 'Paratonnerre', 'Tuer 10 magical girls', 120),
        M.type('joggeur', 15, 'Coupe-circuit', 'Tuer 15 Joggeurs', 120),
        M.intouchable(90, 'Mise à la terre', 150),
        M.boss(2, 'Haute tension', 200),
        M.hardcore(480, 'Tempête', 300),
        M.pouvoir('orage', 10, 'Avis de tempête', 120),
        M.coup(5, 'Orage parfait', 250),
        M.type('infirmier', 10, 'Électrochoc', 'Tuer 10 Infirmiers', 120),
        M.type('boxeur', 10, 'Ne bouge plus', 'Tuer 10 Boxeurs (hardcore)', 200),
        M.type('fossoyeur', 1, 'Foudroyé', 'Vaincre le Fossoyeur', 250)
    ]
};
// Identifiant unique de chaque mission : <perso>_<numéro>
// (on ajoute toujours à la fin d'une liste : les missions déjà terminées gardent leur identifiant)
for (const [perso, liste] of Object.entries(MISSIONS)) liste.forEach((m, i) => { m.id = `${perso}_${i + 1}`; m.perso = perso; });

/* Ordre d'affichage : de la première partie aux défis de fin (ennemis dans
   l'ordre où on les croise, puis difficulté). Les numéros sont ceux des
   identifiants (<perso>_<numéro>) : ils ne changent pas, la sauvegarde reste valable. */
const ORDRE_MISSIONS = {
    soldat:    [1, 4, 6, 2, 11, 13, 7, 12, 8, 14, 9, 15, 5, 3, 10],
    brute:     [1, 4, 8, 2, 11, 6, 14, 12, 13, 7, 5, 15, 9, 3, 10],
    grenadier: [1, 4, 7, 2, 5, 11, 12, 8, 15, 13, 9, 14, 6, 3, 10],
    lassie:    [1, 4, 7, 2, 5, 11, 8, 13, 15, 12, 9, 6, 14, 3, 10]
};
for (const [perso, ordre] of Object.entries(ORDRE_MISSIONS)) {
    const rang = m => { const i = ordre.indexOf(Number(m.id.split('_').pop())); return i < 0 ? ordre.length : i; };
    MISSIONS[perso].sort((a, b) => rang(a) - rang(b));
}

// Les succès « Vétéran » et « Légende » suivent le nombre de missions
{
    const textes = { soldat: 'Terminer les {n} missions du Soldat', brute: 'Terminer les {n} missions de Brutus', grenadier: 'Terminer les {n} missions de Mira', lassie: 'Terminer les {n} missions de Lassie' };
    for (const [perso, liste] of Object.entries(MISSIONS)) {
        const s = SUCCES.find(x => x.id === `veteran_${perso === 'grenadier' ? 'mira' : perso}`);
        if (s) { s.objectif = liste.length; s.desc = T(textes[perso], { n: liste.length }); }
    }
    const total = Object.values(MISSIONS).flat().length;
    const legende = SUCCES.find(x => x.id === 'legende');
    legende.objectif = total;
    legende.desc = T('Terminer les {n} missions', { n: total });
}

const Missions = (() => {
    const faites = () => Sauvegarde.donnees.missions;
    let killsImage = 0, debutSansDegat = 0;

    function verifier() {
        const p = statsPerso(etat.perso);
        let nouvelle = false;
        for (const m of MISSIONS[etat.perso] || []) {
            if (faites().includes(m.id) || m.valeur(p) < m.objectif) continue;
            faites().push(m.id);
            Sauvegarde.donnees.loot.cranes += m.recompense;
            Succes.notifier(T('📋 Mission accomplie ({perso}) : {nom} · +{n} 💀', { perso: CONFIG.personnages[m.perso].nom, nom: m.nom, n: m.recompense }));
            if (etat.missions) etat.missions.push(m.nom);   // bilan de fin de partie
            nouvelle = true;
        }
        if (nouvelle) {
            Sauvegarde.sauver();
            LootUI.maj_soldes();
            Succes.verifier();     // les succès « Vétéran » dépendent des missions
            Deblocage.verifier();  // 3 missions avec un perso débloquent le suivant
        }
    }

    // Appelé à chaque zombie tué pendant une partie
    function zombie_tue(type) {
        const p = statsPerso(etat.perso);
        p.tues[type] = (p.tues[type] || 0) + 1;
        p.total++;
        if (est_boss(type)) p.boss++;
        killsImage++;
        verifier();
    }

    // Fin de chaque image : combien de zombies sont morts « d'un seul coup » (même tir, même explosion)
    function fin_image() {
        if (killsImage > 1) {
            const p = statsPerso(etat.perso);
            if (killsImage > p.coupMax) { p.coupMax = killsImage; verifier(); }
        }
        killsImage = 0;
    }

    function degat() { debutSansDegat = etat.temps; }
    function debut_partie() { debutSansDegat = 0; killsImage = 0; }

    function seconde() {
        const p = statsPerso(etat.perso);
        p.meilleurTemps[etat.mode] = Math.max(p.meilleurTemps[etat.mode] || 0, Math.floor(etat.temps));
        p.meilleurScore = Math.max(p.meilleurScore, etat.gagnes);
        p.sansDegat = Math.max(p.sansDegat, Math.floor(etat.temps - debutSansDegat));
        Records.maj(etat.variante === 'vagues' ? { score: etat.gagnes } : { temps: Math.floor(etat.temps), score: etat.gagnes });
        verifier();
    }

    function fin_partie() {
        statsPerso(etat.perso).parties++;
        seconde();
    }

    const terminees = perso => faites().filter(id => perso ? id.startsWith(perso + '_') : true)
        .filter(id => Object.values(MISSIONS).flat().some(m => m.id === id)).length;

    /* ---------- Écran des missions ---------- */
    const $m = id => document.getElementById(id);
    let onglet = 'soldat';

    function remplir() {
        $m('missions-onglets').replaceChildren(...Object.keys(MISSIONS).map(perso => {
            const b = document.createElement('button');
            b.className = 'missions-onglet' + (perso === onglet ? ' active' : '');
            b.textContent = `${CONFIG.personnages[perso].nom} · ${terminees(perso)}/${MISSIONS[perso].length}`;
            b.addEventListener('click', () => { onglet = perso; remplir(); });
            return b;
        }));
        const p = statsPerso(onglet);
        $m('missions-liste').replaceChildren(...MISSIONS[onglet].map(m => {
            const ok = faites().includes(m.id);
            const v = Math.min(m.valeur(p), m.objectif);
            const ligne = document.createElement('div');
            ligne.className = 'mission-ligne' + (ok ? ' ok' : '');

            const icone = document.createElement('span');
            icone.className = 'succes-icone';
            icone.textContent = ok ? '✅' : '📋';

            const texte = document.createElement('span');
            texte.className = 'succes-texte';
            const nom = document.createElement('strong');
            nom.textContent = m.nom;
            const desc = document.createElement('small');
            desc.textContent = `${m.desc} · ${ok ? T('fait') : `${v}${m.unite || ''} / ${m.objectif}${m.unite || ''}`} · +${m.recompense} 💀`;
            const barre = document.createElement('span');
            barre.className = 'mission-barre';
            const plein = document.createElement('span');
            plein.style.width = `${(100 * v) / m.objectif}%`;
            barre.appendChild(plein);
            texte.append(nom, desc, barre);

            ligne.append(icone, texte);
            return ligne;
        }));
    }

    $m('btn-missions').addEventListener('click', () => {
        onglet = typeof perso_choisi !== 'undefined' ? perso_choisi : 'soldat';
        remplir();
        $m('missions-overlay').classList.remove('hidden');
    });
    $m('btn-close-missions').addEventListener('click', () => $m('missions-overlay').classList.add('hidden'));

    return { zombie_tue, fin_image, degat, debut_partie, seconde, fin_partie, terminees };
})();

/* =========================================================================
   DÉBLOCAGE DES PERSONNAGES
   Ordre et nombre de missions : CONFIG.deblocage. Les persos débloqués sont
   gardés dans la sauvegarde (persosDebloques). Une sauvegarde d'avant ce
   système garde les persos déjà joués ou qui ont des missions terminées.
   ========================================================================= */
const Deblocage = (() => {
    const ordre = CONFIG.deblocage.ordre;
    const liste = () => Sauvegarde.donnees.persosDebloques;
    const est_debloque = id => !ordre.includes(id) || liste().includes(id);

    // Ce qu'il manque pour débloquer ce perso : { precedent, faites, requis } (ou null)
    function condition(id) {
        const i = ordre.indexOf(id);
        if (i <= 0) return null;
        const precedent = ordre[i - 1];
        return { precedent, faites: Math.min(Missions.terminees(precedent), CONFIG.deblocage.missions), requis: CONFIG.deblocage.missions };
    }

    // Débloque tout ce qui peut l'être ; true si au moins un nouveau perso
    function verifier(annoncer = true) {
        let nouveau = false;
        for (const id of ordre) {
            if (est_debloque(id)) continue;
            const c = condition(id);
            if (!c || !est_debloque(c.precedent) || c.faites < c.requis) break;   // dans l'ordre : on s'arrête au premier verrou
            liste().push(id);
            nouveau = true;
            if (annoncer) Succes.notifier(T('🔓 Nouveau personnage débloqué : {nom} !', { nom: CONFIG.personnages[id].nom }));
        }
        if (nouveau) {
            Sauvegarde.sauver();
            if (typeof rafraichir_cartes_persos === 'function') rafraichir_cartes_persos();
        }
        return nouveau;
    }

    // Sauvegarde d'avant le déblocage : on ne retire rien au joueur
    const st = Sauvegarde.donnees.stats;
    for (const id of ordre) {
        if (!liste().includes(id) && (id === ordre[0] || st.persosJoues.includes(id) || Missions.terminees(id) > 0)) liste().push(id);
    }
    verifier(false);

    return { est_debloque, condition, verifier };
})();
