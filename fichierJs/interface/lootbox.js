/* =========================================================================
   LOOTBOX : « Caisse de ravitaillement douteuse »
   Parodie assumée. Uniquement des cosmétiques, uniquement de la monnaie
   gagnée en jouant (les crânes). Aucun argent réel, jamais.
   ========================================================================= */
const LOOT = {
    prix: 100,                  // crânes par caisse
    lots: [5, 10],              // on peut aussi en ouvrir 5 ou 10 d'un coup
    pointsParCrane: 10,         // 1 crâne gagné tous les 10 points de score
    compensationDoublon: 10,    // crânes rendus pour un skin déjà possédé
    garantie: 100,              // légendaire (ou mieux) garanti au bout de N caisses sans (compteur caché au joueur)

    raretes: [
        { id: 'commun', nom: 'Commun', couleur: '#9a9a9a', poids: 61.999 },
        { id: 'rare', nom: 'Rare', couleur: '#3a8dff', poids: 25 },
        { id: 'epique', nom: 'Épique', couleur: '#b04aff', poids: 9 },
        { id: 'legendaire', nom: 'Légendaire', couleur: '#ff9a1a', poids: 3.5 },
        { id: 'mythique', nom: 'Mythique', couleur: '#ff2e4d', poids: 0.5 },
        // Unique : un seul skin par perso, qu'on n'obtient qu'une fois. Tant qu'il n'y en a
        // aucun à gagner (pas encore créé, ou déjà tous obtenus), ce rang ne tombe pas : sa
        // part revient aux objets communs (voir poids_effectifs)
        { id: 'unique', nom: 'Unique', couleur: '#3cf0ff', poids: 0.001 }   // 0,001 %, et la garantie ne le donne jamais
    ],

    /* Skins
       - Tenues dédiées à un perso (« perso ») : de vrais sprites redessinés,
         dans assets/skins/<dossier du perso>/<tenue>/ (l'id « mira_cyber » donne
         assets/skins/mira/cyber/) : arret.png, tir.png, marche1..4.png
       - Skins universels (sans « perso ») : un filtre de couleur sur n'importe quel perso
       - Rang « unique » : un par perso (avec « perso »), jamais en double ; par exemple
         soldat_xxx: { nom: '…', rarete: 'unique', perso: 'soldat' } */
    skins: {
        soldat_urbain: { nom: 'Gris urbain', rarete: 'commun', perso: 'soldat' },
        soldat_neige: { nom: 'Commando des neiges', rarete: 'rare', perso: 'soldat' },
        soldat_jungle: { nom: 'Jungle', rarete: 'rare', perso: 'soldat' },
        soldat_apparat: { nom: 'Tenue d\'apparat', rarete: 'epique', perso: 'soldat' },
        soldat_cyber: { nom: 'Cyber-soldat', rarete: 'legendaire', perso: 'soldat' },
        soldat_prototype: { nom: 'Prototype du labo', rarete: 'unique', perso: 'soldat', aura: '#3cf0ff' },

        brute_marcel: { nom: 'Marcel blanc', rarete: 'commun', perso: 'brute' },
        brute_fonce: { nom: 'Brutus Black Edition', rarete: 'rare', perso: 'brute' },
        brute_hawai: { nom: 'Vacances à Hawaï', rarete: 'epique', perso: 'brute' },
        brute_noel: { nom: 'Père Noël en colère', rarete: 'epique', perso: 'brute' },
        brute_catch: { nom: 'Légende du catch', rarete: 'legendaire', perso: 'brute' },
        brute_veteran: { nom: 'Vétéran des Trois Collines', rarete: 'unique', perso: 'brute' },

        mira_rousse: { nom: 'Rousse incendiaire', rarete: 'commun', perso: 'grenadier' },
        mira_treillis: { nom: 'Treillis', rarete: 'rare', perso: 'grenadier' },
        mira_gothique: { nom: 'Gothique', rarete: 'epique', perso: 'grenadier' },
        mira_plage: { nom: 'Tenue de plage', rarete: 'epique', perso: 'grenadier' },
        mira_cyber: { nom: 'Néon Runner', rarete: 'legendaire', perso: 'grenadier' },
        mira_teto: { nom: 'Kasane Teto', rarete: 'unique', perso: 'grenadier', paillettes: true },

        lassie_arctique: { nom: 'Renarde arctique', rarete: 'commun', perso: 'lassie' },
        lassie_kitsune: { nom: 'Kitsune', rarete: 'rare', perso: 'lassie' },
        lassie_tempete: { nom: 'Œil de la tempête', rarete: 'rare', perso: 'lassie' },
        lassie_pinup: { nom: 'Pin-up', rarete: 'epique', perso: 'lassie' },
        lassie_kyubi: { nom: 'Kyūbi aux neuf queues', rarete: 'legendaire', perso: 'lassie' },
        lassie_celeste: { nom: 'Renarde céleste', rarete: 'unique', perso: 'lassie', etoiles: ['2A3272', '1A1E4A', '3A44A0', '202662', '6A7AD8'] },

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

// Noms des raretés, des skins et des déchets dans la langue du joueur
Langue.traduire_objets(LOOT.raretes, ['nom']);
Langue.traduire_objets(Object.values(LOOT.skins), ['nom']);
Langue.traduire_objets(Object.values(LOOT.dechets), ['nom', 'texte']);

const Loot = (() => {
    // La progression vit dans la sauvegarde (sauvegarde.js). On la relit à chaque
    // accès : après une restauration ou un import, c'est toujours la bonne.
    const L = () => Sauvegarde.donnees.loot;
    const sauver = () => Sauvegarde.sauver();
    // Un skin retiré par une future mise à jour reste dans la sauvegarde, mais n'est pas proposé
    const connu = skin => Object.prototype.hasOwnProperty.call(LOOT.skins, skin);

    const hasard = tableau => tableau[Math.floor(Math.random() * tableau.length)];
    const rarete = id => LOOT.raretes.find(r => r.id === id);

    // Les skins uniques encore à gagner (un par perso, qu'on n'a pas déjà)
    const uniques_restants = () => Object.keys(LOOT.skins).filter(id => LOOT.skins[id].rarete === 'unique' && !L().possedes.includes(`${LOOT.skins[id].perso}:${id}`));
    // Les raretés qui peuvent tomber, avec leur poids : la part d'une rareté vide revient aux communs
    function poids_effectifs() {
        const vide = r => r.id === 'unique' && !uniques_restants().length;
        const perdu = LOOT.raretes.filter(vide).reduce((s, r) => s + r.poids, 0);
        return LOOT.raretes.filter(r => !vide(r)).map(r => (r.id === 'commun' ? { ...r, poids: Math.round((r.poids + perdu) * 1000) / 1000 } : r));
    }
    // « Légendaire ou mieux » : tomber sur l'un d'eux remet la garantie à zéro…
    const HAUTES = ['legendaire', 'mythique', 'unique'];
    // …mais la garantie, elle, ne donne jamais un unique : il ne tombe que par chance
    const GARANTIS = ['legendaire', 'mythique'];

    function tirer_rarete(garanti) {
        const toutes = poids_effectifs();
        const pool = garanti ? toutes.filter(r => GARANTIS.includes(r.id)) : toutes;
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
        // (un unique : seulement ceux qu'on n'a pas encore)
        const skinId = hasard(r.id === 'unique' ? uniques_restants() : Object.keys(LOOT.skins).filter(id => LOOT.skins[id].rarete === r.id));
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
        const haut = HAUTES.includes(objet.rarete.id);
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

    // Filtre à appliquer au sprite du perso (t en secondes, pour l'arc-en-ciel animé et l'aura qui pulse)
    function filtre(perso, t = 0) {
        const skin = LOOT.skins[L().equipes[perso]];
        if (skin && skin.aura) return `drop-shadow(0 0 ${(3 + 2 * Math.sin(t * 4)).toFixed(1)}px ${skin.aura})`;
        if (!skin || skin.perso) return '';
        if (skin.anime) return `hue-rotate(${Math.round((t * 120) % 360)}deg) saturate(1.8)`;
        return skin.filtre || '';
    }

    // Sprites d'une tenue dédiée (chargés à la première demande), sinon ceux du perso
    const cacheSprites = {};
    function sprites_skin(perso, skinId) {
        const skin = LOOT.skins[skinId];
        if (!skin || !skin.perso) return SPRITES_PERSO[perso];
        const tenue = skinId.slice(skinId.indexOf('_') + 1);
        return cacheSprites[skinId] || (cacheSprites[skinId] = charger_sprites(`skins/${CONFIG.personnages[skin.perso].sprites}/${tenue}`));
    }
    const sprites = perso => sprites_skin(perso, connu(L().equipes[perso]) ? L().equipes[perso] : null);

    return {
        ouvrir, gagner, equiper, filtre, tirer_objet, rarete, sprites, sprites_skin, poids_effectifs,
        solde: () => L().cranes,
        equipe: perso => (connu(L().equipes[perso]) ? L().equipes[perso] : null),
        // La définition du skin équipé (pour ses effets : aura, paillettes, étoiles), ou null
        skin_equipe: perso => (connu(L().equipes[perso]) ? LOOT.skins[L().equipes[perso]] : null),
        skinsDe: perso => L().possedes.filter(id => typeof id === 'string' && id.startsWith(perso + ':'))
            .map(id => id.split(':')[1]).filter(connu),
        dechets: () => Object.fromEntries(Object.entries(L().dechets).filter(([id]) => LOOT.dechets[id])),
        stats: () => ({ ouvertes: L().ouvertes })
    };
})();

/* =========================================================================
   SONS DE LOOTBOX (synthétisés avec Web Audio : aucun fichier à charger)
   ========================================================================= */
const SonLoot = (() => {
    // Même contexte audio et même générateur de notes que le reste du jeu (audio.js)
    let ac = null;
    const contexte = () => (ac = Son.contexte());
    const note = (f1, debut, duree, options = {}) => Son.ton(f1, debut, duree, { type: 'square', vol: 0.08, attaque: 0.01, ...options });

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
        },
        // Unique : une montée, un accord tenu comme un chœur, et des cloches qui tombent en cascade
        unique: () => {
            note(90, 0, 1.2, { type: 'sawtooth', vol: 0.08, f2: 2400 });
            [262, 330, 392, 523, 659, 784].forEach((f, i) => note(f, 1.2, 2.4, { type: i % 2 ? 'triangle' : 'sawtooth', vol: 0.03, attaque: 0.25 }));
            for (let r = 0; r < 4; r++) arpege([3136, 2637, 2093, 1568, 1319, 1047], 0.05, 0.25, { type: 'sine', vol: 0.045 });
            [1047, 1568, 2093].forEach((f, i) => note(f, 1.2 + i * 0.5, 1.5, { type: 'sine', vol: 0.06 }));
            note(55, 1.2, 2, { type: 'sine', vol: 0.28 });
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
        bus.connect(Son.sortieMusique());   // suit le réglage du volume de la musique
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
    const INTENSITE = { commun: 0, rare: 1, epique: 2, legendaire: 3, mythique: 4, unique: 5 };

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
        Son.vibrer(Math.min(1, niveau / 4), 60 + niveau * 50);   // le tremblement se sent aussi dans les mains
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
        const fort = Math.min(4, niveau);   // (la lumière et le tremblement vont jusqu'au niveau 4)
        lumiere(rarete.couleur, fort);
        trembler(fort);
        if (niveau >= 3) confettis([rarete.couleur, '#ffe14d', '#ffffff', '#ff6ec7', '#3cf0ff'], niveau >= 5 ? 140 : niveau === 4 ? 90 : 50);
        if (niveau >= 4) setTimeout(() => { trembler(3); lumiere(rarete.couleur, 4); }, 700);
        if (niveau >= 5) setTimeout(() => { trembler(4); lumiere('#ffffff', 4); confettis(['#ff2e4d', '#ff9a1a', '#ffe14d', '#4ad060', '#3a8dff', '#b04aff', '#3cf0ff'], 80); }, 1400);
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
        // (la garantie d'un légendaire existe, mais on ne montre pas où on en est)
        $l('loot-stats').textContent = T('Caisses ouvertes : {n}', { n: st.ouvertes });
        // Taux affichés en tout petit, par souci de « transparence » : seulement ce qui peut tomber
        $l('loot-taux').textContent = T('Taux : ') + Loot.poids_effectifs().map(r => `${r.nom} ${String(r.poids).replace('.', ',')} %`).join(' · ')
            + T(' · Les objets Communs ont 50 % de chances d\'être un déchet.');
        $l('btn-ouvrir').disabled = enCours || s < LOOT.prix;
        for (const n of LOOT.lots) $l('btn-ouvrir-' + n).disabled = enCours || s < LOOT.prix * n;
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
                ? T('Skin pour {perso}… que vous aviez déjà. Compensation : {n} 💀. Quelle générosité.', { perso: nomPerso, n: LOOT.compensationDoublon })
                : T('Nouveau skin pour {perso} ! Équipez-le dans le vestiaire.', { perso: nomPerso });
        } else {
            detail.textContent = o.texte;
        }
        zone.append(titre, detail);
        reveler(o);
        Succes.apres_caisse(o);
    }

    // Le cadre prend la couleur de la rareté, la case gagnante s'illumine, le son et les effets suivent
    function reveler(o) {
        const fenetre = $l('loot-fenetre');
        fenetre.style.setProperty('--couleur-loot', o.rarete.couleur);
        fenetre.classList.remove('loot-revele');
        void fenetre.offsetWidth;
        fenetre.classList.add('loot-revele');
        const gagnante = $l('loot-bande').children[INDEX_GAGNANT];
        if (gagnante) gagnante.classList.add('loot-gagnante');
        SonLoot.revelation(o.rarete.id);
        EffetsLoot.revelation(o.rarete);
    }

    // Plusieurs caisses d'un coup : un résumé par rareté, puis tout le butin en petites cases
    const ORDRE_RARETES = ['unique', 'mythique', 'legendaire', 'epique', 'rare', 'commun'];
    function afficher_lot(lot, meilleur) {
        const zone = $l('loot-resultat');
        zone.replaceChildren();
        zone.style.color = meilleur.objet.rarete.couleur;
        const titre = document.createElement('strong');
        const parRarete = ORDRE_RARETES.map(id => [Loot.rarete(id), lot.filter(r => r.objet.rarete.id === id).length]).filter(([, n]) => n);
        titre.textContent = parRarete.map(([r, n]) => `${r.nom} ×${n}`).join(' · ');
        const nouveaux = lot.filter(r => r.objet.type === 'skin' && !r.doublon).length;
        const doublons = lot.filter(r => r.doublon).length;
        const detail = document.createElement('span');
        detail.textContent = T('{n} nouveau(x) skin(s) · {d} doublon(s), remboursé(s) {c} 💀', { n: nouveaux, d: doublons, c: doublons * LOOT.compensationDoublon });
        const grille = document.createElement('div');
        grille.className = 'loot-lot';
        for (const r of [...lot].sort((a, b) => ORDRE_RARETES.indexOf(a.objet.rarete.id) - ORDRE_RARETES.indexOf(b.objet.rarete.id))) {
            const c = case_roulette(r.objet);
            c.title = `${r.objet.rarete.nom} : ${r.objet.nom}${r.doublon ? ' (' + T('doublon') + ')' : ''}`;
            if (r.doublon) c.classList.add('loot-doublon');
            grille.appendChild(c);
        }
        zone.append(titre, detail, grille);
        reveler(meilleur.objet);
        for (const r of lot) Succes.apres_caisse(r.objet);
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

    function ouvrir_caisse(nombre = 1) {
        if (enCours || Loot.solde() < LOOT.prix * nombre) return;
        const lot = [];
        for (let k = 0; k < nombre; k++) { const r = Loot.ouvrir(); if (r) lot.push(r); }
        if (!lot.length) return;
        // La roulette s'arrête sur le plus bel objet du lot
        const res = lot.reduce((a, b) => (ORDRE_RARETES.indexOf(b.objet.rarete.id) < ORDRE_RARETES.indexOf(a.objet.rarete.id) ? b : a));
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
                if (lot.length > 1) afficher_lot(lot, res); else afficher_resultat(res);
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
                b.textContent = def ? def.nom : T('Par défaut');
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
        $l('vestiaire-dechets').textContent = inutile ? T('Collection inutile : {liste}', { liste: inutile }) : T('Collection inutile : vide (pour l\'instant)');
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
        Sauvegarde.point_de_restauration(T('Après les caisses'));
    });
    $l('btn-ouvrir').addEventListener('click', () => ouvrir_caisse(1));
    for (const n of LOOT.lots) $l('btn-ouvrir-' + n).addEventListener('click', () => ouvrir_caisse(n));
    $l('btn-vestiaire').addEventListener('click', () => { remplir_vestiaire(); $l('vestiaire-overlay').classList.remove('hidden'); });
    $l('btn-close-vestiaire').addEventListener('click', () => $l('vestiaire-overlay').classList.add('hidden'));
    $l('btn-payer').addEventListener('click', () => {
        const zone = $l('loot-resultat');
        zone.style.color = '#ff3333';
        zone.textContent = T('Paiement refusé : ce jeu est gratuit. Retourne tuer des zombies pour gagner des 💀.');
    });

    maj_soldes();
    return { maj_soldes };
})();
