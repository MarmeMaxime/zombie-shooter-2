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
    p.meilleurTemps ??= {}; p.meilleurScore ??= 0; p.sansDegat ??= 0; p.coupMax ??= 0;
    return p;
};

// Fabriques de missions courantes
const M = {
    tues: (n, nom, recompense) => ({ nom, desc: `Tuer ${n} zombies`, objectif: n, recompense, valeur: p => p.total }),
    type: (type, n, nom, desc, recompense) => ({ nom, desc, objectif: n, recompense, valeur: p => p.tues[type] || 0 }),
    survie: (sec, nom, recompense) => ({ nom, desc: `Survivre ${sec / 60} min en une partie`, objectif: sec, unite: 's', recompense, valeur: p => Math.max(0, ...Object.values(p.meilleurTemps)) }),
    hardcore: (sec, nom, recompense) => ({ nom, desc: `Survivre ${sec / 60} min en hardcore`, objectif: sec, unite: 's', recompense, valeur: p => p.meilleurTemps.hardcore || 0 }),
    intouchable: (sec, nom, recompense) => ({ nom, desc: `Tenir ${sec} s sans perdre de vie`, objectif: sec, unite: 's', recompense, valeur: p => p.sansDegat }),
    score: (n, nom, recompense) => ({ nom, desc: `Gagner ${n} points en une partie`, objectif: n, recompense, valeur: p => p.meilleurScore }),
    boss: (n, nom, recompense) => ({ nom, desc: `Vaincre ${n} Mastodonte${n > 1 ? 's' : ''}`, objectif: n, recompense, valeur: p => p.boss }),
    coup: (n, nom, recompense) => ({ nom, desc: `Tuer ${n} zombies d'un seul coup`, objectif: n, recompense, valeur: p => p.coupMax })
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
        M.hardcore(480, 'Dernier rempart', 300)
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
        M.hardcore(480, 'Increvable', 300)
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
        M.hardcore(480, 'Reine du chaos', 300)
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
        M.hardcore(480, 'Tempête', 300)
    ]
};
// Identifiant unique de chaque mission : <perso>_<numéro>
for (const [perso, liste] of Object.entries(MISSIONS)) liste.forEach((m, i) => { m.id = `${perso}_${i + 1}`; m.perso = perso; });

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
            Succes.notifier(`📋 Mission accomplie (${CONFIG.personnages[m.perso].nom}) : ${m.nom} · +${m.recompense} 💀`);
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
        if (type === 'boss') p.boss++;
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
            desc.textContent = `${m.desc} · ${ok ? 'fait' : `${v}${m.unite || ''} / ${m.objectif}${m.unite || ''}`} · +${m.recompense} 💀`;
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
            if (annoncer) Succes.notifier(`🔓 Nouveau personnage débloqué : ${CONFIG.personnages[id].nom} !`);
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
