/* =========================================================================
   SUCCÈS ET TITRES
   Chaque succès a une valeur à atteindre, rapporte des crânes et débloque
   un titre affiché dans le menu. Progression stockée dans la sauvegarde.
   ========================================================================= */
const SV = () => Sauvegarde.donnees;
const totalTues = () => Object.values(SV().stats.tues).reduce((s, n) => s + (Number(n) || 0), 0);
const meilleur = table => Math.max(0, ...Object.values(table).map(Number).filter(Number.isFinite));

const SUCCES = [
    { id: 'premier_sang', nom: 'Premier sang', desc: 'Tuer un zombie', titre: 'Bleu', recompense: 20, objectif: 1, valeur: totalTues },
    { id: 'centurion', nom: 'Centurion', desc: 'Tuer 100 zombies', titre: 'Centurion', recompense: 50, objectif: 100, valeur: totalTues },
    { id: 'exterminateur', nom: 'Exterminateur', desc: 'Tuer 1 000 zombies', titre: 'Exterminateur', recompense: 200, objectif: 1000, valeur: totalTues },
    { id: 'ouvre_boite', nom: 'Ouvre-boîte', desc: 'Tuer 25 tanks', titre: 'Ouvre-boîte', recompense: 80, objectif: 25, valeur: () => SV().stats.tues.tank || 0 },
    { id: 'chasseur_mg', nom: 'Désenchanteur', desc: 'Tuer 10 magical girls', titre: 'Chasseur de magical girls', recompense: 100, objectif: 10, valeur: () => SV().stats.tues.magicalgirl || 0 },
    { id: 'tueur_geant', nom: 'Tueur de géant', desc: 'Vaincre un Mastodonte', titre: 'Tueur de géant', recompense: 150, objectif: 1, valeur: () => SV().stats.bossTues },
    { id: 'fleau', nom: 'Fléau des Mastodontes', desc: 'Vaincre 5 Mastodontes', titre: 'Fléau des Mastodontes', recompense: 400, objectif: 5, valeur: () => SV().stats.bossTues },
    { id: 'survivant', nom: 'Survivant', desc: 'Survivre 5 minutes', titre: 'Survivant', recompense: 100, objectif: 300, unite: 's', valeur: () => meilleur(SV().stats.meilleurTemps) },
    { id: 'increvable', nom: 'Increvable', desc: 'Survivre 10 minutes en hardcore', titre: 'Increvable', recompense: 300, objectif: 600, unite: 's', valeur: () => SV().stats.meilleurTemps.hardcore || 0 },
    { id: 'machine', nom: 'Machine de guerre', desc: 'Gagner 5 000 points en une partie', titre: 'Machine de guerre', recompense: 200, objectif: 5000, valeur: () => meilleur(SV().stats.meilleurScore) },
    { id: 'polyvalent', nom: 'Polyvalent', desc: 'Jouer une partie avec chaque personnage', titre: 'Couteau suisse', recompense: 60, objectif: 3, valeur: () => SV().stats.persosJoues.length },
    { id: 'pigeon', nom: 'Pigeon', desc: 'Ouvrir 100 caisses', titre: 'Pigeon', recompense: 100, objectif: 100, valeur: () => SV().loot.ouvertes },
    { id: 'baleine', nom: 'Baleine', desc: 'Ouvrir 500 caisses', titre: 'Baleine', recompense: 500, objectif: 500, valeur: () => SV().loot.ouvertes },
    { id: 'geologue', nom: 'Géologue amateur', desc: 'Obtenir 10 cailloux', titre: 'Collectionneur de cailloux', recompense: 30, objectif: 10, valeur: () => SV().loot.dechets.caillou || 0 },
    { id: 'fashion', nom: 'Fashion victim', desc: 'Posséder 10 skins', titre: 'Fashion victim', recompense: 150, objectif: 10, valeur: () => SV().loot.possedes.length },
    { id: 'elu', nom: 'L\'Élu du RNG', desc: 'Obtenir un objet mythique', titre: 'Élu du RNG', recompense: 250, objectif: 1, valeur: () => SV().stats.mythiques },
    // Liés aux missions par personnage (missions.js)
    { id: 'veteran_soldat', nom: 'Vétéran : Soldat', desc: 'Terminer les 10 missions du Soldat', titre: 'Sergent', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('soldat')) },
    { id: 'veteran_brute', nom: 'Vétéran : Brutus', desc: 'Terminer les 10 missions de Brutus', titre: 'Boucher', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('brute')) },
    { id: 'veteran_mira', nom: 'Vétéran : Mira', desc: 'Terminer les 10 missions de Mira', titre: 'Artificière', recompense: 500, objectif: 10, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees('grenadier')) },
    { id: 'legende', nom: 'Légende vivante', desc: 'Terminer les 30 missions', titre: 'Légende vivante', recompense: 1500, objectif: 30, valeur: () => (typeof Missions === 'undefined' ? 0 : Missions.terminees()) }
];

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
            fileToasts.push(`🏆 Succès débloqué : ${s.nom} · +${s.recompense} 💀 · titre « ${s.titre} »`);
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
        if (type === 'boss') SV().stats.bossTues++;
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

    function apres_caisse(objet) {
        if (objet.rarete.id === 'mythique') SV().stats.mythiques++;
        verifier();
    }

    /* ---------- Titre ---------- */
    function titre_actuel() {
        const s = SUCCES.find(x => x.titre === SV().titre && SV().succes.includes(x.id));
        return s ? s.titre : '';
    }

    function maj_titre() {
        const t = titre_actuel();
        $s('titre-joueur').textContent = t ? `« ${t} »` : '';
    }

    /* ---------- Écran des succès ---------- */
    function remplir() {
        const debloques = SV().succes;
        $s('succes-compte').textContent = `${debloques.filter(id => SUCCES.some(s => s.id === id)).length} / ${SUCCES.length} succès · clique sur un succès débloqué pour porter son titre`;
        $s('succes-liste').replaceChildren(...SUCCES.map(s => {
            const ok = debloques.includes(s.id);
            const ligne = document.createElement('button');
            ligne.className = 'succes-ligne' + (ok ? ' ok' : '') + (ok && SV().titre === s.titre ? ' porte' : '');
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
            desc.textContent = `${s.desc} · ${ok ? 'fait' : `${v}${s.unite || ''} / ${s.objectif}${s.unite || ''}`} · +${s.recompense} 💀 · titre « ${s.titre} »`;
            texte.append(nom, desc);

            ligne.append(icone, texte);
            ligne.addEventListener('click', () => {
                SV().titre = SV().titre === s.titre ? '' : s.titre;   // re-cliquer retire le titre
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

    return { zombie_tue, seconde, fin_partie, apres_caisse, titre_actuel, notifier, verifier };
})();
