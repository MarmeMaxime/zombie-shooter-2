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

    /* Skins
       - Tenues dédiées à un perso (« perso ») : de vrais sprites redessinés,
         fichiers assets/skin_<id>_arret.png, _tir.png, _marche1..4.png
       - Skins universels (sans « perso ») : un filtre de couleur sur n'importe quel perso */
    skins: {
        soldat_urbain: { nom: 'Gris urbain', rarete: 'commun', perso: 'soldat' },
        soldat_neige: { nom: 'Commando des neiges', rarete: 'rare', perso: 'soldat' },
        soldat_jungle: { nom: 'Jungle', rarete: 'rare', perso: 'soldat' },
        soldat_apparat: { nom: 'Tenue d\'apparat', rarete: 'epique', perso: 'soldat' },
        soldat_cyber: { nom: 'Cyber-soldat', rarete: 'legendaire', perso: 'soldat' },

        brute_marcel: { nom: 'Marcel blanc', rarete: 'commun', perso: 'brute' },
        brute_fonce: { nom: 'Brutus Black Edition', rarete: 'rare', perso: 'brute' },
        brute_hawai: { nom: 'Vacances à Hawaï', rarete: 'epique', perso: 'brute' },
        brute_noel: { nom: 'Père Noël en colère', rarete: 'epique', perso: 'brute' },
        brute_catch: { nom: 'Légende du catch', rarete: 'legendaire', perso: 'brute' },

        mira_rousse: { nom: 'Rousse incendiaire', rarete: 'commun', perso: 'grenadier' },
        mira_treillis: { nom: 'Treillis', rarete: 'rare', perso: 'grenadier' },
        mira_gothique: { nom: 'Gothique', rarete: 'epique', perso: 'grenadier' },
        mira_plage: { nom: 'Tenue de plage', rarete: 'epique', perso: 'grenadier' },
        mira_cyber: { nom: 'Néon Runner', rarete: 'legendaire', perso: 'grenadier' },

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
        // Tenue dédiée : son perso ; skin universel : un perso au hasard
        const perso = LOOT.skins[skinId].perso || hasard(Object.keys(CONFIG.personnages));
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
        if (!skin || skin.perso) return '';
        if (skin.anime) return `hue-rotate(${Math.round((t * 120) % 360)}deg) saturate(1.8)`;
        return skin.filtre || '';
    }

    // Sprites d'une tenue dédiée (chargés à la première demande), sinon ceux du perso
    const cacheSprites = {};
    function sprites_skin(perso, skinId) {
        const skin = LOOT.skins[skinId];
        if (!skin || !skin.perso) return SPRITES_PERSO[perso];
        return cacheSprites[skinId] || (cacheSprites[skinId] = charger_sprites(`skin_${skinId}`));
    }
    const sprites = perso => sprites_skin(perso, connu(L().equipes[perso]) ? L().equipes[perso] : null);

    return {
        ouvrir, gagner, equiper, filtre, tirer_objet, rarete, sprites, sprites_skin,
        solde: () => L().cranes,
        equipe: perso => (connu(L().equipes[perso]) ? L().equipes[perso] : null),
        skinsDe: perso => L().possedes.filter(id => typeof id === 'string' && id.startsWith(perso + ':'))
            .map(id => id.split(':')[1]).filter(connu),
        dechets: () => Object.fromEntries(Object.entries(L().dechets).filter(([id]) => LOOT.dechets[id])),
        stats: () => ({ ouvertes: L().ouvertes, avantGarantie: LOOT.garantie - L().depuisLegendaire })
    };
})();

/* =========================================================================
   SONS DE LOOTBOX (synthétisés avec Web Audio : aucun fichier à charger)
   ========================================================================= */
const SonLoot = (() => {
    let ac = null;
    const contexte = () => {
        if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); }
        if (ac && ac.state === 'suspended') ac.resume();
        return ac;
    };

    // Une note : fréquence (ou glissando de f1 à f2), départ et durée en secondes
    function note(f1, debut, duree, { type = 'square', vol = 0.08, f2 = null, sortie = null, absolu = false } = {}) {
        const c = contexte();
        if (!c || !Son.estActif()) return;
        const t = absolu ? debut : c.currentTime + debut;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f1, t);
        if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + duree);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
        osc.connect(gain).connect(sortie || c.destination);
        osc.start(t);
        osc.stop(t + duree + 0.02);
    }

    const arpege = (freqs, pas, duree, opts) => freqs.forEach((f, i) => note(f, i * pas, duree, opts));

    const REVELATIONS = {
        // Trombone triste
        commun: () => { note(330, 0, 0.25, { type: 'triangle', vol: 0.12 }); note(262, 0.25, 0.5, { type: 'triangle', vol: 0.12, f2: 220 }); },
        rare: () => arpege([660, 880, 1320], 0.09, 0.3, { type: 'sine', vol: 0.12 }),
        epique: () => { arpege([523, 659, 784, 1047], 0.07, 0.25, { vol: 0.07 }); note(1047, 0.3, 0.6, { type: 'sine', vol: 0.1 }); },
        legendaire: () => {
            arpege([523, 659, 784], 0.12, 0.2, { vol: 0.08 });
            [1047, 1319, 1568].forEach(f => note(f, 0.4, 1.2, { vol: 0.05 }));
            arpege([2093, 2637, 3136, 2637, 3136, 4186], 0.08, 0.15, { type: 'sine', vol: 0.04 });
        },
        mythique: () => {
            note(120, 0, 0.9, { type: 'sawtooth', vol: 0.08, f2: 1800 });
            [523, 659, 784, 1047].forEach(f => note(f, 0.9, 1.6, { type: 'sawtooth', vol: 0.035 }));
            for (let r = 0; r < 3; r++) arpege([1047, 1319, 1568, 2093], 0.06, 0.12, { type: 'sine', vol: 0.05 });
            note(55, 0.9, 1.4, { type: 'sine', vol: 0.25 });
        }
    };

    /* ---------- Musiques ----------
       Chaque musique passe par son propre volume (GainNode) : pour l'arrêter,
       on baisse ce volume et on le débranche, même les notes déjà programmées. */
    let bus = null, minuterie = null;

    function couper(fondu = 0.3) {
        clearInterval(minuterie);
        minuterie = null;
        if (bus && ac) {
            const b = bus;
            b.gain.setTargetAtTime(0.0001, ac.currentTime, fondu / 4);
            setTimeout(() => b.disconnect(), fondu * 1000 + 100);
        }
        bus = null;
    }

    function nouveau_bus(volume) {
        const c = contexte();
        if (!c) return null;
        couper(0.15);
        bus = c.createGain();
        bus.gain.value = volume;
        bus.connect(c.destination);
        return bus;
    }

    // Ambiance « boutique » : petite boucle C - Am - F - G, basse + arpège + clochette
    const ACCORDS = [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]];
    function musique_boutique() {
        const sortie = nouveau_bus(1);
        if (!sortie) return;
        const croche = 0.27;
        let prochain = ac.currentTime + 0.1, pas = 0;
        const programmer = () => {
            while (prochain < ac.currentTime + 0.6) {
                const accord = ACCORDS[Math.floor(pas / 8) % 4];
                const temps = pas % 8;
                if (temps === 0 || temps === 4) note(accord[0] / 2, prochain, croche * 3.5, { type: 'triangle', vol: 0.07, sortie, absolu: true });
                note(accord[[0, 1, 2, 1, 0, 1, 2, 1][temps]] * 2, prochain, croche * 0.9, { type: 'sine', vol: 0.03, sortie, absolu: true });
                if (pas % 32 === 0) note(2093, prochain, 0.6, { type: 'sine', vol: 0.025, sortie, absolu: true });
                prochain += croche;
                pas++;
            }
        };
        programmer();
        minuterie = setInterval(programmer, 150);
    }

    // Suspense de l'ouverture : roulement qui accélère + basse qui monte, calé sur la roulette
    function musique_suspense(duree) {
        const sortie = nouveau_bus(1);
        if (!sortie) return;
        const t0 = ac.currentTime;
        note(55, t0, duree, { type: 'sawtooth', vol: 0.035, f2: 220, sortie, absolu: true });
        note(880, t0 + duree * 0.5, duree * 0.5, { type: 'sine', vol: 0.015, f2: 1760, sortie, absolu: true });
        for (let t = 0; t < duree - 0.05;) {
            note(150, t0 + t, 0.05, { type: 'square', vol: 0.045, f2: 70, sortie, absolu: true });
            t += 0.18 - 0.14 * (t / duree);
        }
    }

    return {
        boutique: musique_boutique,
        suspense: musique_suspense,
        couper,
        // Clic de la roulette, un peu plus aigu quand ça ralentit (suspense)
        tick: (progression) => note(1400 + progression * 900 + Math.random() * 80, 0, 0.03, { vol: 0.05 }),
        ouverture: () => { note(90, 0, 0.25, { type: 'sawtooth', vol: 0.1, f2: 45 }); note(400, 0.05, 0.15, { type: 'square', vol: 0.04, f2: 1200 }); },
        revelation: rarete => (REVELATIONS[rarete] || REVELATIONS.commun)()
    };
})();

/* =========================================================================
   EFFETS VISUELS : lumière, tremblement de l'écran, confettis
   ========================================================================= */
const EffetsLoot = (() => {
    const conteneur = () => document.getElementById('game-container');
    const INTENSITE = { commun: 0, rare: 1, epique: 2, legendaire: 3, mythique: 4 };

    function relancer(el, classe) {
        el.classList.remove(classe);
        void el.offsetWidth;   // force le navigateur à rejouer l'animation
        el.classList.add(classe);
    }

    function trembler(niveau) {
        if (!niveau) return;
        const c = conteneur();
        c.classList.remove('tremble-1', 'tremble-2', 'tremble-3', 'tremble-4');
        relancer(c, `tremble-${niveau}`);
        setTimeout(() => c.classList.remove(`tremble-${niveau}`), 900);
    }

    function lumiere(couleur, niveau) {
        const flash = document.getElementById('loot-flash');
        flash.style.setProperty('--couleur-loot', couleur);
        flash.className = `niveau-${niveau}`;
        relancer(flash, 'actif');
    }

    function confettis(couleurs, nombre) {
        const c = conteneur();
        for (let i = 0; i < nombre; i++) {
            const p = document.createElement('div');
            p.className = 'confetti';
            p.style.left = `${Math.random() * 100}%`;
            p.style.background = couleurs[i % couleurs.length];
            p.style.animationDuration = `${1.2 + Math.random() * 1.3}s`;
            p.style.animationDelay = `${Math.random() * 0.4}s`;
            p.style.setProperty('--derive', `${(Math.random() - 0.5) * 160}px`);
            c.appendChild(p);
            setTimeout(() => p.remove(), 3000);
        }
    }

    function revelation(rarete) {
        const niveau = INTENSITE[rarete.id] || 0;
        lumiere(rarete.couleur, niveau);
        trembler(niveau);
        if (niveau >= 3) confettis([rarete.couleur, '#ffe14d', '#ffffff', '#ff6ec7', '#3cf0ff'], niveau === 4 ? 90 : 50);
        if (niveau === 4) setTimeout(() => { trembler(3); lumiere(rarete.couleur, 4); }, 700);
    }

    return { revelation, trembler };
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
        img.src = Loot.sprites_skin(objet.perso, objet.skin).arret.src;
        img.alt = '';
        if (objet.anime) img.classList.add('arcenciel');
        else if (objet.filtre) img.style.filter = objet.filtre;
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

        // Le cadre prend la couleur de la rareté, la case gagnante s'illumine
        const fenetre = $l('loot-fenetre');
        fenetre.style.setProperty('--couleur-loot', o.rarete.couleur);
        fenetre.classList.remove('loot-revele');
        void fenetre.offsetWidth;
        fenetre.classList.add('loot-revele');
        const gagnante = $l('loot-bande').children[INDEX_GAGNANT];
        if (gagnante) gagnante.classList.add('loot-gagnante');

        SonLoot.revelation(o.rarete.id);
        EffetsLoot.revelation(o.rarete);
        Succes.apres_caisse(o);
    }

    // Cliquetis à chaque case qui passe sous le curseur
    function suivre_roulette(bande, largeurFenetre, debut) {
        let derniere = -1;
        const centre = largeurFenetre / 2;
        function boucle_tick() {
            if (!enCours) return;
            const m = new DOMMatrixReadOnly(getComputedStyle(bande).transform);
            const index = Math.floor((centre - m.m41 - 4) / LARGEUR_CASE);
            if (index !== derniere && index >= 0) {
                derniere = index;
                SonLoot.tick(Math.min(1, (performance.now() - debut) / 4200));
            }
            requestAnimationFrame(boucle_tick);
        }
        requestAnimationFrame(boucle_tick);
    }

    function ouvrir_caisse() {
        if (enCours) return;
        const res = Loot.ouvrir();
        if (!res) return;
        enCours = true;
        maj_soldes();
        $l('loot-resultat').replaceChildren();
        $l('loot-fenetre').classList.remove('loot-revele');
        SonLoot.ouverture();
        SonLoot.suspense(4.2);
        EffetsLoot.trembler(1);

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
            suivre_roulette(bande, largeurFenetre, performance.now());
        }));

        setTimeout(() => {
            try {
                afficher_resultat(res);
                // La musique de la boutique revient une fois la fanfare passée
                setTimeout(() => {
                    if (!enCours && !$l('loot-overlay').classList.contains('hidden')) SonLoot.boutique();
                }, 2600);
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
    $l('btn-caisses').addEventListener('click', () => {
        maj_soldes();
        Son.suspendreMusique();   // la musique du jeu laisse la place à celle de la boutique
        SonLoot.boutique();
        $l('loot-overlay').classList.remove('hidden');
    });
    $l('btn-close-loot').addEventListener('click', () => {
        if (enCours) return;
        $l('loot-overlay').classList.add('hidden');
        SonLoot.couper();
        Son.reprendreMusique();
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
