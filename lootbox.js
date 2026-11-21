/* =========================================================================
   LOOTBOX : « Caisse de ravitaillement douteuse »
   Parodie assumée. Uniquement des cosmétiques, uniquement de la monnaie
   gagnée en jouant (les crânes). Aucun argent réel, jamais.
   ========================================================================= */
const LOOT = {
    prix: 50,                   // crânes par caisse
    pointsParCrane: 10,         // 1 crâne gagné tous les 10 points de score
    compensationDoublon: 10,    // crânes rendus pour un skin déjà possédé
    garantie: 30,               // légendaire (ou mieux) garanti au bout de N caisses sans

    raretes: [
        { id: 'commun', nom: 'Commun', couleur: '#9a9a9a', poids: 62 },
        { id: 'rare', nom: 'Rare', couleur: '#3a8dff', poids: 25 },
        { id: 'epique', nom: 'Épique', couleur: '#b04aff', poids: 9 },
        { id: 'legendaire', nom: 'Légendaire', couleur: '#ff9a1a', poids: 3.5 },
        { id: 'mythique', nom: 'Mythique', couleur: '#ff2e4d', poids: 0.5 }
    ],

    // Skins = filtres de couleur appliqués au sprite (même syntaxe en CSS et sur le canvas)
    skins: {
        delave: { nom: 'Délavé', rarete: 'commun', filtre: 'saturate(0.35)' },
        poussiere: { nom: 'Poussiéreux', rarete: 'commun', filtre: 'sepia(0.6)' },
        nuit: { nom: 'Opération Nuit', rarete: 'rare', filtre: 'brightness(0.55) contrast(1.3)' },
        desert: { nom: 'Tempête du désert', rarete: 'rare', filtre: 'sepia(0.9) saturate(1.6)' },
        hiver: { nom: 'Hiver nucléaire', rarete: 'rare', filtre: 'hue-rotate(180deg) saturate(0.7) brightness(1.15)' },
        neon: { nom: 'Néon 2077', rarete: 'epique', filtre: 'hue-rotate(90deg) saturate(3)' },
        toxique: { nom: 'Déchet toxique', rarete: 'epique', filtre: 'hue-rotate(50deg) saturate(4) brightness(1.1)' },
        negatif: { nom: 'Négatif', rarete: 'epique', filtre: 'invert(1)' },
        or: { nom: 'Or massif', rarete: 'legendaire', filtre: 'sepia(1) saturate(5) brightness(1.1)' },
        fantome: { nom: 'Fantôme', rarete: 'legendaire', filtre: 'grayscale(1) brightness(1.8) opacity(0.55)' },
        arcenciel: { nom: 'Arc-en-ciel RGB', rarete: 'mythique', anime: true }
    },

    // Les objets « déchets » des caisses communes. Ils ne servent à rien. C'est le principe.
    dechets: {
        rien: { nom: 'Rien', emoji: '∅', texte: 'Merci de votre soutien.' },
        caillou: { nom: 'Un caillou', emoji: '🪨', texte: 'Il ne fait rien. Il est juste là.' },
        chaussette: { nom: 'Chaussette orpheline', emoji: '🧦', texte: 'Sa jumelle est dans une autre caisse. Peut-être.' },
        ticket: { nom: 'Ticket « Retentez votre chance »', emoji: '🎟️', texte: 'Valable sur une autre caisse. Que vous devez payer.' },
        pigeon: { nom: 'Le pigeon', emoji: '🐦', texte: 'C\'est vous.' }
    }
};

const Loot = (() => {
    // La progression vit dans la sauvegarde (sauvegarde.js). On la relit à chaque
    // accès : après une restauration ou un import, c'est toujours la bonne.
    const L = () => Sauvegarde.donnees.loot;
    const sauver = () => Sauvegarde.sauver();
    // Un skin retiré par une future mise à jour reste dans la sauvegarde, mais n'est pas proposé
    const connu = skin => Object.prototype.hasOwnProperty.call(LOOT.skins, skin);

    const hasard = tableau => tableau[Math.floor(Math.random() * tableau.length)];
    const rarete = id => LOOT.raretes.find(r => r.id === id);

    function tirer_rarete(garanti) {
        const pool = garanti ? LOOT.raretes.filter(r => r.id === 'legendaire' || r.id === 'mythique') : LOOT.raretes;
        let t = Math.random() * pool.reduce((s, r) => s + r.poids, 0);
        for (const r of pool) { if ((t -= r.poids) < 0) return r; }
        return pool[pool.length - 1];
    }

    // Tire un objet (sans rien modifier) : sert aussi à remplir la roulette
    function tirer_objet(garanti = false) {
        const r = tirer_rarete(garanti);
        if (r.id === 'commun' && Math.random() < 0.5) {
            const id = hasard(Object.keys(LOOT.dechets));
            return { ...LOOT.dechets[id], type: 'dechet', id, rarete: r };
        }
        const skinId = hasard(Object.keys(LOOT.skins).filter(id => LOOT.skins[id].rarete === r.id));
        const perso = hasard(Object.keys(CONFIG.personnages));
        // Le spread d'abord : sa propriété « rarete » (texte) ne doit pas écraser l'objet rareté
        return { ...LOOT.skins[skinId], type: 'skin', id: `${perso}:${skinId}`, perso, skin: skinId, rarete: r };
    }

    function ouvrir() {
        if (L().cranes < LOOT.prix) return null;
        L().cranes -= LOOT.prix;
        L().ouvertes++;

        const garanti = L().depuisLegendaire >= LOOT.garantie - 1;
        const objet = tirer_objet(garanti);
        const haut = objet.rarete.id === 'legendaire' || objet.rarete.id === 'mythique';
        L().depuisLegendaire = haut ? 0 : L().depuisLegendaire + 1;

        let doublon = false;
        if (objet.type === 'skin') {
            doublon = L().possedes.includes(objet.id);
            if (doublon) L().cranes += LOOT.compensationDoublon;
            else L().possedes.push(objet.id);
        } else {
            L().dechets[objet.id] = (L().dechets[objet.id] || 0) + 1;
        }
        sauver();
        return { objet, doublon, garanti };
    }

    function gagner(score) {
        const gain = Math.floor(score / LOOT.pointsParCrane);
        L().cranes += gain;
        sauver();
        return gain;
    }

    function equiper(perso, skin) {
        if (skin && !L().possedes.includes(`${perso}:${skin}`)) return;
        if (skin) L().equipes[perso] = skin;
        else delete L().equipes[perso];
        sauver();
    }

    // Filtre à appliquer au sprite du perso (t en secondes, pour l'arc-en-ciel animé)
    function filtre(perso, t = 0) {
        const skin = LOOT.skins[L().equipes[perso]];
        if (!skin) return '';
        if (skin.anime) return `hue-rotate(${Math.round((t * 120) % 360)}deg) saturate(1.8)`;
        return skin.filtre;
    }

    return {
        ouvrir, gagner, equiper, filtre, tirer_objet, rarete,
        solde: () => L().cranes,
        equipe: perso => (connu(L().equipes[perso]) ? L().equipes[perso] : null),
        skinsDe: perso => L().possedes.filter(id => typeof id === 'string' && id.startsWith(perso + ':'))
            .map(id => id.split(':')[1]).filter(connu),
        dechets: () => Object.fromEntries(Object.entries(L().dechets).filter(([id]) => LOOT.dechets[id])),
        stats: () => ({ ouvertes: L().ouvertes, avantGarantie: LOOT.garantie - L().depuisLegendaire })
    };
})();

/* =========================================================================
   INTERFACE : écran des caisses (roulette) et vestiaire
   ========================================================================= */
const LootUI = (() => {
    const $l = id => document.getElementById(id);
    const LARGEUR_CASE = 72;      // largeur d'une case + marge, en px
    const INDEX_GAGNANT = 34;
    let enCours = false;

    // Aperçu d'un objet : sprite filtré pour un skin, emoji pour un déchet
    function apercu(objet) {
        if (objet.type === 'dechet') {
            const span = document.createElement('span');
            span.className = 'loot-emoji';
            span.textContent = objet.emoji;
            return span;
        }
        const img = document.createElement('img');
        img.src = SPRITES_PERSO[objet.perso].arret.src;
        img.alt = '';
        if (objet.anime) img.classList.add('arcenciel');
        else img.style.filter = objet.filtre;
        return img;
    }

    function case_roulette(objet) {
        const div = document.createElement('div');
        div.className = 'loot-case';
        div.style.borderColor = objet.rarete.couleur;
        div.style.background = `linear-gradient(to top, ${objet.rarete.couleur}55, #151515 70%)`;
        div.appendChild(apercu(objet));
        return div;
    }

    function maj_soldes() {
        const s = Loot.solde();
        $l('solde-menu').textContent = s;
        $l('solde-loot').textContent = s;
        const st = Loot.stats();
        $l('loot-stats').textContent = `Caisses ouvertes : ${st.ouvertes} · Légendaire garanti dans ${st.avantGarantie} caisse${st.avantGarantie > 1 ? 's' : ''} (on vous aime)`;
        $l('btn-ouvrir').disabled = enCours || s < LOOT.prix;
    }

    function afficher_resultat(res) {
        const o = res.objet;
        const zone = $l('loot-resultat');
        zone.replaceChildren();
        zone.style.color = o.rarete.couleur;

        const titre = document.createElement('strong');
        titre.textContent = `${o.rarete.nom.toUpperCase()} : ${o.nom}`;
        const detail = document.createElement('span');
        if (o.type === 'skin') {
            const nomPerso = CONFIG.personnages[o.perso].nom;
            detail.textContent = res.doublon
                ? `Skin pour ${nomPerso}… que vous aviez déjà. Compensation : ${LOOT.compensationDoublon} 💀. Quelle générosité.`
                : `Nouveau skin pour ${nomPerso} ! Équipez-le dans le vestiaire.`;
        } else {
            detail.textContent = o.texte;
        }
        zone.append(titre, detail);

        if (o.rarete.id === 'legendaire' || o.rarete.id === 'mythique') {
            const fenetre = $l('loot-fenetre');
            fenetre.classList.remove('loot-jackpot');
            void fenetre.offsetWidth; // relance l'animation
            fenetre.classList.add('loot-jackpot');
        }
    }

    function ouvrir_caisse() {
        if (enCours) return;
        const res = Loot.ouvrir();
        if (!res) return;
        enCours = true;
        maj_soldes();
        $l('loot-resultat').replaceChildren();

        // Bande de faux objets, avec le vrai à l'index gagnant
        const bande = $l('loot-bande');
        bande.style.transition = 'none';
        bande.style.transform = 'translateX(0)';
        const cases = [];
        for (let i = 0; i < INDEX_GAGNANT + 6; i++) {
            // Quelques légendaires « presque gagnés » juste à côté, comme dans les vrais jeux
            const faux = (i === INDEX_GAGNANT + 1 || i === INDEX_GAGNANT - 1) && Math.random() < 0.6
                ? Loot.tirer_objet(true) : Loot.tirer_objet();
            cases.push(case_roulette(i === INDEX_GAGNANT ? res.objet : faux));
        }
        bande.replaceChildren(...cases);

        const decalage = Math.random() * (LARGEUR_CASE - 20) - (LARGEUR_CASE - 20) / 2;

        requestAnimationFrame(() => requestAnimationFrame(() => {
            // Mesuré ici, une fois l'écran affiché et mis en page
            const largeurFenetre = $l('loot-fenetre').clientWidth || 600;
            const cible = INDEX_GAGNANT * LARGEUR_CASE - largeurFenetre / 2 + LARGEUR_CASE / 2 + 4 + decalage;
            bande.style.transition = 'transform 4.2s cubic-bezier(0.08, 0.6, 0.12, 1)';
            bande.style.transform = `translateX(${-cible}px)`;
        }));

        setTimeout(() => {
            try {
                Son.bouton();
                afficher_resultat(res);
                if (typeof rafraichir_cartes_persos === 'function') rafraichir_cartes_persos();
            } finally {
                enCours = false;   // quoi qu'il arrive, on ne bloque pas le bouton
                maj_soldes();
            }
        }, 4300);
    }

    /* ---------- Vestiaire ---------- */
    function remplir_vestiaire() {
        const liste = $l('vestiaire-liste');
        liste.replaceChildren();

        for (const [perso, info] of Object.entries(CONFIG.personnages)) {
            const ligne = document.createElement('div');
            ligne.className = 'vestiaire-ligne';
            const nom = document.createElement('span');
            nom.className = 'vestiaire-nom';
            nom.textContent = info.nom;
            ligne.appendChild(nom);

            const choix = [null, ...Loot.skinsDe(perso)];
            for (const skin of choix) {
                const b = document.createElement('button');
                b.className = 'vestiaire-skin';
                const def = skin ? LOOT.skins[skin] : null;
                b.textContent = def ? def.nom : 'Par défaut';
                if (def) b.style.borderColor = Loot.rarete(def.rarete).couleur;
                if (Loot.equipe(perso) === skin) b.classList.add('active');
                b.addEventListener('click', () => {
                    Loot.equiper(perso, skin);
                    remplir_vestiaire();
                    if (typeof rafraichir_cartes_persos === 'function') rafraichir_cartes_persos();
                });
                ligne.appendChild(b);
            }
            liste.appendChild(ligne);
        }

        const d = Loot.dechets();
        const inutile = Object.keys(d).map(id => `${LOOT.dechets[id].emoji} ×${d[id]}`).join('   ');
        $l('vestiaire-dechets').textContent = inutile ? `Collection inutile : ${inutile}` : 'Collection inutile : vide (pour l\'instant)';
    }

    /* ---------- Branchements ---------- */
    $l('btn-caisses').addEventListener('click', () => { maj_soldes(); $l('loot-overlay').classList.remove('hidden'); });
    $l('btn-close-loot').addEventListener('click', () => {
        if (enCours) return;
        $l('loot-overlay').classList.add('hidden');
        Sauvegarde.point_de_restauration('Après les caisses');
    });
    $l('btn-ouvrir').addEventListener('click', ouvrir_caisse);
    $l('btn-vestiaire').addEventListener('click', () => { remplir_vestiaire(); $l('vestiaire-overlay').classList.remove('hidden'); });
    $l('btn-close-vestiaire').addEventListener('click', () => $l('vestiaire-overlay').classList.add('hidden'));
    $l('btn-payer').addEventListener('click', () => {
        const zone = $l('loot-resultat');
        zone.style.color = '#ff3333';
        zone.textContent = 'Paiement refusé : ce jeu est gratuit. Retourne tuer des zombies pour gagner des 💀.';
    });

    // Taux affichés en tout petit, par souci de « transparence »
    $l('loot-taux').textContent = 'Taux : ' + LOOT.raretes.map(r => `${r.nom} ${String(r.poids).replace('.', ',')} %`).join(' · ')
        + ' · Les objets Communs ont 50 % de chances d\'être un déchet.';

    maj_soldes();
    return { maj_soldes };
})();
