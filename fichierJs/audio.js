/* =========================================================================
   GESTION DU SON
   Un seul lecteur MP3 (la playlist hardcore) ; le menu, le mode normal et
   l'entraînement ont des musiques générées (Web Audio, plus bas) :
   les gros fichiers MP3 ne sont téléchargés que lorsqu'ils sont joués.
   ========================================================================= */
const Son = (() => {
    const PISTES = {
        hardcore: [
            './assets/son/hardcore_gamer_music.mp3',
            './assets/son/hardcore_gamer2.mp3',
            './assets/son/hardcore_gamer3.mp3',
            './assets/son/hardcore_gamer4.mp3'
        ]
    };
    const VOLUME_HARDCORE = 0.05;

    const musique = new Audio();
    musique.preload = 'none';

    const sonBouton = new Audio('./assets/son/button_sound.mp3');
    sonBouton.volume = 0.5;

    const sonTir = new Audio('./assets/son/america.mp3');
    sonTir.volume = 0.4;

    // Réglages gardés dans la sauvegarde : son activé de base, volumes de 0 à 1.
    // Les navigateurs bloquent le son tant que la page n'a pas été touchée :
    // la musique démarre à la première touche ou au premier clic (écran titre).
    const reglages = Sauvegarde.donnees.son;
    let actif = reglages.actif;
    let volumeBase = 0.1;       // volume propre au morceau en cours (avant le réglage « musique »)
    let ambiance = null;        // 'menu' | 'normal' | 'entrainement' | 'hardcore' | null
    let compoEnCours = null;    // musique générée de l'ambiance (null : lecteur MP3)
    let indexHardcore = 0;

    // play() renvoie une promesse rejetée si le navigateur refuse la lecture
    const lire = (audio) => audio.play().catch(() => {});

    function chargerPiste(src, volume, enBoucle, vitesse = 1) {
        musique.src = src;
        musique.preservesPitch = true;
        musique.playbackRate = vitesse;
        musique.defaultPlaybackRate = vitesse;
        volumeBase = volume;
        musique.volume = volume * reglages.musique;
        musique.loop = enBoucle;
        musique.currentTime = 0;
    }

    // Passage automatique au morceau suivant en mode hardcore
    musique.addEventListener('ended', () => {
        if (ambiance !== 'hardcore') return;
        indexHardcore = (indexHardcore + 1) % PISTES.hardcore.length;
        chargerPiste(PISTES.hardcore[indexHardcore], VOLUME_HARDCORE, false);
        if (actif) lire(musique);
    });

    function jouerAmbiance(nom) {
        // Déjà en train de jouer cette musique générée : on la laisse continuer
        if (nom === ambiance && piste && compoEnCours === piste.compo) return;
        ambiance = nom;
        arreter_piste();
        // Le menu, le mode normal et l'entraînement ont leur musique générée (plus bas)
        compoEnCours = choisir_compo(nom);
        if (compoEnCours) {
            musique.pause();
            compoEnCours.reprise = 0;               // nouvelle ambiance : depuis le début
            if (actif) demarrer_piste(compoEnCours);
            return;
        }
        indexHardcore = Math.floor(Math.random() * PISTES.hardcore.length);
        chargerPiste(PISTES.hardcore[indexHardcore], VOLUME_HARDCORE, false);
        if (actif) lire(musique);
    }

    function arreterMusique() {
        ambiance = null;
        compoEnCours = null;
        musique.pause();
        arreter_piste();
    }

    // Musique de l'ambiance en cours : le lecteur MP3, ou une musique générée
    function jouer() { if (compoEnCours) demarrer_piste(compoEnCours); else lire(musique); }
    function couper() { musique.pause(); arreter_piste(); }

    function setActif(valeur) {
        actif = valeur;
        reglages.actif = valeur;
        Sauvegarde.sauver();
        if (!ambiance) return;
        if (actif && !suspendue) jouer();
        else couper();
    }

    // Silence temporaire (écran des caisses) : la musique reprend là où elle s'était arrêtée
    let suspendue = false;
    function suspendreMusique() { suspendue = true; couper(); }
    function reprendreMusique() { suspendue = false; if (actif && ambiance) jouer(); }

    // vitesse < 1 : son plus grave (chaque arme a ainsi sa propre détonation)
    function jouerEffet(audio, vitesse = 1) {
        if (!actif) return;
        // cloneNode permet de superposer plusieurs tirs rapprochés
        const copie = audio.cloneNode();
        copie.volume = audio.volume * reglages.effets;
        copie.preservesPitch = false;
        copie.playbackRate = vitesse;
        lire(copie);
    }

    /* ---------- Bruitages synthétisés (Web Audio, aucun fichier) ---------- */
    let ac = null, bruitBlanc = null, sortieEffets = null, sortieMusique = null;
    function contexte() {
        if (!ac) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ac = new AC();
            // 1 s de bruit blanc, réutilisé pour les détonations et explosions
            bruitBlanc = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
            const d = bruitBlanc.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            // Deux volumes généraux : les bruitages, et les musiques jouées en Web Audio (caisses)
            sortieEffets = ac.createGain();
            sortieEffets.gain.value = reglages.effets;
            sortieEffets.connect(ac.destination);
            sortieMusique = ac.createGain();
            sortieMusique.gain.value = reglages.musique;
            sortieMusique.connect(ac.destination);
        }
        if (ac.state === 'suspended') ac.resume();
        return ac;
    }

    // Souffle filtré : coup de feu, explosion, pas lourd…
    function bruit(debut, duree, { vol = 0.3, filtre = 1200, filtreFin = null, type = 'lowpass', sortie = null, absolu = false } = {}) {
        const c = contexte(); if (!c || !actif) return;
        const t = absolu ? debut : c.currentTime + debut;
        const src = c.createBufferSource(); src.buffer = bruitBlanc;
        const f = c.createBiquadFilter(); f.type = type;
        f.frequency.setValueAtTime(filtre, t);
        if (filtreFin) f.frequency.exponentialRampToValueAtTime(filtreFin, t + duree);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
        src.connect(f).connect(g).connect(sortie || sortieEffets);
        src.loop = true;                     // le tampon fait 1 s : en boucle, les longs souffles vont jusqu'au bout
        src.start(t, Math.random() * 0.5); src.stop(t + duree + 0.05);
    }

    /* Une note : fréquence f1 (ou glissando de f1 à f2), départ et durée en secondes.
       Options : type d'onde, volume, attaque (montée en douceur, en s), sortie
       (un nœud audio, par exemple le volume d'une musique), absolu (départ = heure
       du contexte audio au lieu de « dans X secondes »). Partagée avec lootbox.js. */
    function ton(f1, debut, duree, { type = 'sine', vol = 0.2, f2 = null, attaque = 0, sortie = null, absolu = false } = {}) {
        const c = contexte(); if (!c || !actif) return;
        const t = absolu ? debut : c.currentTime + debut;
        const o = c.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(f1, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + duree);
        const g = c.createGain();
        if (attaque > 0) {
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + attaque);
        } else {
            g.gain.setValueAtTime(vol, t);
        }
        g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
        o.connect(g).connect(sortie || sortieEffets);
        o.start(t); o.stop(t + duree + 0.05);
    }

    const BRUITAGES = {
        // Le fusil garde le son d'origine du jeu
        fusil: () => jouerEffet(sonTir, 1),
        // Grosse détonation grave, puis le « chk-chk » de la pompe
        pompe: () => {
            bruit(0, 0.35, { vol: 0.5, filtre: 2500, filtreFin: 300 });
            ton(110, 0, 0.18, { vol: 0.35, f2: 45 });
            bruit(0.28, 0.05, { vol: 0.25, filtre: 3000, type: 'highpass' });
            bruit(0.38, 0.06, { vol: 0.3, filtre: 2200, type: 'highpass' });
        },
        // « Thoomp » creux du lance-grenades
        grenade: () => {
            ton(180, 0, 0.22, { vol: 0.4, f2: 60 });
            bruit(0, 0.12, { vol: 0.2, filtre: 900, filtreFin: 200 });
        },
        explosion: () => {
            bruit(0, 0.8, { vol: 0.6, filtre: 1800, filtreFin: 80 });
            ton(70, 0, 0.6, { vol: 0.4, f2: 30 });
        },
        mort: () => bruit(0, 0.12, { vol: 0.08, filtre: 600, filtreFin: 150 }),
        bossArrive: () => {
            ton(60, 0, 1.6, { type: 'sawtooth', vol: 0.18, f2: 90 });
            ton(62, 0, 1.6, { type: 'sawtooth', vol: 0.18, f2: 85 });
            bruit(0, 1.4, { vol: 0.25, filtre: 500, filtreFin: 1500 });
        },
        crachat: () => { bruit(0, 0.25, { vol: 0.2, filtre: 1500, filtreFin: 400, type: 'bandpass' }); ton(300, 0, 0.2, { vol: 0.1, f2: 120 }); },
        bossMort: () => {
            bruit(0, 1.8, { vol: 0.7, filtre: 2000, filtreFin: 60 });
            ton(80, 0, 1.5, { type: 'sawtooth', vol: 0.2, f2: 25 });
            [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.9 + i * 0.12, 0.5, { type: 'square', vol: 0.06 }));
        },
        // Pistolet électrique : « bzzt » aigu
        foudre: () => {
            ton(1800, 0, 0.12, { type: 'square', vol: 0.07, f2: 600 });
            bruit(0, 0.1, { vol: 0.15, filtre: 4000, type: 'highpass' });
        },
        // Crépitement de la foudre qui saute de zombie en zombie
        foudreImpact: () => {
            for (let k = 0; k < 4; k++) bruit(k * 0.05, 0.06, { vol: 0.22, filtre: 3000, type: 'highpass' });
            ton(140, 0, 0.25, { type: 'sawtooth', vol: 0.08, f2: 60 });
        },
        // Cri aigu du Joggeur avant sa charge
        cri: () => {
            ton(950, 0, 0.4, { type: 'sawtooth', vol: 0.12, f2: 380 });
            ton(1400, 0.02, 0.3, { type: 'square', vol: 0.05, f2: 700 });
            bruit(0, 0.3, { vol: 0.15, filtre: 2500, type: 'bandpass' });
        },
        // Balle qui ricoche sur le bouclier de l'Anti-émeute
        ricochet: () => {
            ton(2400, 0, 0.12, { type: 'triangle', vol: 0.08, f2: 3200 });
            bruit(0, 0.05, { vol: 0.12, filtre: 5000, type: 'highpass' });
        },
        // Bouclier qui vole en éclats
        bouclierBrise: () => {
            for (let k = 0; k < 5; k++) bruit(k * 0.04, 0.08, { vol: 0.2, filtre: 2500 + k * 600, type: 'highpass' });
            ton(520, 0, 0.3, { type: 'square', vol: 0.06, f2: 180 });
        },
        // Pouvoirs spéciaux
        pouvoirPret: () => [660, 880, 1320].forEach((f, i) => ton(f, i * 0.07, 0.25, { type: 'triangle', vol: 0.1 })),
        rafale: () => { ton(220, 0, 0.3, { type: 'sawtooth', vol: 0.1, f2: 880 }); bruit(0, 0.2, { vol: 0.15, filtre: 3000, type: 'highpass' }); },
        onde: () => {
            bruit(0, 0.9, { vol: 0.7, filtre: 900, filtreFin: 50 });
            ton(55, 0, 0.7, { vol: 0.5, f2: 25 });
        },
        sifflement: () => [0, 0.12, 0.24].forEach(d => ton(1800, d, 0.6, { type: 'sine', vol: 0.05, f2: 500 })),
        orage: () => {
            bruit(0, 1.2, { vol: 0.6, filtre: 6000, filtreFin: 200 });
            ton(45, 0.05, 1.0, { type: 'sawtooth', vol: 0.15, f2: 30 });
        },
        // La Pondeuse éclate, l'Infirmier soigne, le Boxeur esquive
        eclatement: () => {
            bruit(0, 0.35, { vol: 0.35, filtre: 700, filtreFin: 120 });
            ton(160, 0, 0.3, { type: 'sawtooth', vol: 0.1, f2: 50 });
            for (let k = 0; k < 3; k++) bruit(0.12 + k * 0.06, 0.05, { vol: 0.12, filtre: 1800, type: 'bandpass' });
        },
        soin: () => [523, 659, 880].forEach((f, i) => ton(f, i * 0.06, 0.3, { type: 'sine', vol: 0.07, attaque: 0.02 })),
        esquive: () => bruit(0, 0.14, { vol: 0.12, filtre: 900, filtreFin: 3000, type: 'bandpass' }),
        // Le Fossoyeur : la pelletée part, retombe ; les tombes sortent de terre
        pelletee: () => { bruit(0, 0.25, { vol: 0.2, filtre: 600, filtreFin: 2500, type: 'bandpass' }); ton(220, 0, 0.2, { type: 'triangle', vol: 0.05, f2: 440 }); },
        impactTerre: () => { bruit(0, 0.3, { vol: 0.35, filtre: 500, filtreFin: 80 }); ton(70, 0, 0.25, { vol: 0.2, f2: 40 }); },
        tombe: () => { bruit(0, 0.6, { vol: 0.25, filtre: 300, filtreFin: 900 }); ton(55, 0, 0.6, { type: 'sawtooth', vol: 0.08, f2: 45 }); },
        succes: () => [784, 988, 1175, 1568].forEach((f, i) => ton(f, i * 0.09, 0.35, { type: 'triangle', vol: 0.15 })),
        degat: () => { ton(220, 0, 0.25, { type: 'square', vol: 0.12, f2: 90 }); bruit(0, 0.15, { vol: 0.15, filtre: 800 }); }
    };

    // Réglage d'un volume ('musique' ou 'effets', de 0 à 1), gardé dans la sauvegarde
    function setVolume(quoi, valeur) {
        reglages[quoi] = Math.max(0, Math.min(1, valeur));
        if (quoi === 'musique') {
            musique.volume = volumeBase * reglages.musique;
            if (sortieMusique) sortieMusique.gain.value = reglages.musique;
        } else if (sortieEffets) {
            sortieEffets.gain.value = reglages.effets;
        }
        Sauvegarde.sauver();
    }

    /* ---------- Musique de l'entraînement (générée, en boucle) ----------
       Même famille que les musiques du menu et du mode normal : sombre et
       cinématique, en la mineur harmonique (le sol# qui grince), 104 BPM.
       Bourdon grave, tambours façon taiko, nappes sombres, ostinato de cordes,
       « braams » de cuivres graves, et quelques roulements de caisse claire
       militaires pour rappeler qu'on est au camp. 32 mesures (≈ 74 s) en
       4 parties : installation, montée, pic, respiration.
       Les notes sont programmées un peu à l'avance (Web Audio) : la musique ne
       dépend pas des images du jeu et continue quand le sergent fige la partie. */
    const TEMPO = 104, DOUBLE = 60 / TEMPO / 4;     // durée d'une double croche
    const hz = n => 440 * Math.pow(2, (n - 69) / 12); // numéro MIDI -> fréquence
    // Accords (notes MIDI) : la mineur harmonique, l'accord de mi majeur (sol#) en tension
    const ACCORDS = {
        Am: { basse: 33, nappe: [57, 60, 64], arpege: [69, 72, 76, 72] },
        F: { basse: 29, nappe: [57, 60, 65], arpege: [69, 72, 77, 72] },
        Dm: { basse: 38, nappe: [57, 62, 65], arpege: [69, 74, 77, 74] },
        E: { basse: 28, nappe: [56, 59, 64], arpege: [68, 71, 76, 71] },
        G: { basse: 31, nappe: [55, 59, 62], arpege: [67, 71, 74, 71] },
        Bb: { basse: 34, nappe: [58, 62, 65], arpege: [70, 74, 77, 74] }
    };
    const GRILLE = [
        'Am', 'Am', 'F', 'E', 'Am', 'Am', 'Dm', 'E',       // installation
        'Am', 'Am', 'F', 'E', 'Am', 'Dm', 'Bb', 'E',       // montée
        'F', 'G', 'Am', 'E', 'F', 'G', 'E', 'E',           // pic
        'Am', 'Am', 'F', 'F', 'Dm', 'Dm', 'E', 'E'         // respiration
    ];
    // Motifs de tambours sur 16 doubles croches (1 = coup fort, 0.5 = coup léger)
    const TAIKO = [1, 0, 0, 0.5, 0, 0, 1, 0, 1, 0, 0, 0.5, 0, 0.5, 1, 0];
    const TAIKO_PIC = [1, 0, 0.5, 0.5, 1, 0, 1, 0, 1, 0, 0.5, 0.5, 1, 0.5, 1, 0.5];
    let piste = null;

    // Réverbération de grande salle : réponse impulsionnelle de bruit qui s'éteint.
    // Une seule par musique en cours, débranchée à l'arrêt (sinon elles s'accumulent).
    function salle(c) {
        const duree = 3, n = Math.floor(c.sampleRate * duree);
        const ir = c.createBuffer(2, n, c.sampleRate);
        for (let canal = 0; canal < 2; canal++) {
            const d = ir.getChannelData(canal);
            for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
        }
        const conv = c.createConvolver();
        conv.buffer = ir;
        return conv;
    }

    function demarrer_piste(compo) {
        if (piste || !actif) return;
        const c = contexte(); if (!c) return;
        // Son direct + beaucoup de réverbération, vers le volume « musique »
        const bus = c.createGain();
        bus.gain.value = compo.volume;   // réglé pour sonner aussi fort que les MP3
        const reverb = salle(c), mouille = c.createGain();
        mouille.gain.value = compo.reverb;
        bus.connect(sortieMusique);
        bus.connect(reverb).connect(mouille).connect(sortieMusique);
        // Reprend là où elle s'était arrêtée (pause, écran des caisses), au début de la mesure
        piste = { compo, bus, reverb, mouille, prochain: c.currentTime + 0.1, pas: compo.reprise || 0, minuterie: setInterval(programmer_piste, 50) };
        programmer_piste();
    }
    function arreter_piste() {
        if (!piste) return;
        clearInterval(piste.minuterie);
        const { bus, reverb, mouille, compo } = piste, c = contexte();
        compo.reprise = Math.floor(piste.pas / 16) * 16;
        if (c) {
            bus.gain.setTargetAtTime(0, c.currentTime, 0.15);
            setTimeout(() => { bus.disconnect(); reverb.disconnect(); mouille.disconnect(); }, 2500);
        }
        piste = null;
    }
    function programmer_piste() {
        const c = contexte(); if (!c || !piste) return;
        // Minuterie en retard (onglet en arrière-plan, gros calcul) : on saute les notes
        // passées au lieu de les jouer toutes d'un coup
        if (piste.prochain < c.currentTime) {
            const retard = Math.ceil((c.currentTime - piste.prochain) / piste.compo.double);
            piste.prochain += retard * piste.compo.double;
            piste.pas = (piste.pas + retard) % (piste.compo.mesures * 16);
        }
        while (piste.prochain < c.currentTime + 0.4) {
            const { compo } = piste;
            compo.jouer(piste.pas, piste.prochain);
            piste.prochain += compo.double;
            piste.pas = (piste.pas + 1) % (compo.mesures * 16);
        }
    }

    /* Une voix : oscillateurs désaccordés, filtre passe-bas qui peut s'ouvrir
       (balayage), enveloppe douce, vibrato léger éventuel. */
    function voix(f, t, duree, { vol, type = 'sawtooth', filtre = 900, filtreFin = null, attaque = 0.05, sortie = 0.3, desaccord = [-8, 8], vibrato = 0 }) {
        const c = contexte();
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + attaque);
        g.gain.setValueAtTime(vol, t + Math.max(attaque, duree - sortie));
        g.gain.exponentialRampToValueAtTime(0.0001, t + duree + sortie);
        const fl = c.createBiquadFilter();
        fl.type = 'lowpass';
        fl.Q.value = 0.8;
        fl.frequency.setValueAtTime(filtre, t);
        if (filtreFin) fl.frequency.exponentialRampToValueAtTime(filtreFin, t + duree);
        fl.connect(g).connect(piste.bus);
        let profondeur = null;
        if (vibrato) {
            const lfo = c.createOscillator();
            lfo.frequency.value = 5;
            profondeur = c.createGain();
            profondeur.gain.setValueAtTime(0, t);
            profondeur.gain.linearRampToValueAtTime(vibrato, t + Math.min(0.5, duree * 0.6));
            lfo.connect(profondeur);
            lfo.start(t); lfo.stop(t + duree + sortie + 0.05);
        }
        for (const cents of desaccord) {
            const o = c.createOscillator();
            o.type = type;
            o.frequency.value = f;
            o.detune.value = cents;
            if (profondeur) profondeur.connect(o.detune);
            o.connect(fl);
            o.start(t); o.stop(t + duree + sortie + 0.05);
        }
    }

    // Tambour grave façon taiko : coup de hauteur qui chute + claquement de peau
    function taiko(t, force, grave = false) {
        const o = { sortie: piste.bus, absolu: true };
        ton(grave ? 62 : 92, t, grave ? 0.9 : 0.5, { vol: 0.34 * force, f2: grave ? 34 : 48, ...o });
        bruit(t, 0.12, { vol: 0.09 * force, filtre: 700, filtreFin: 200, ...o });
    }

    function jouer_double(i, t) {
        const o = { sortie: piste.bus, absolu: true };
        const mesure = Math.floor(i / 16), pos = i % 16, partie = Math.floor(mesure / 8), dansPartie = mesure % 8;
        const accord = ACCORDS[GRILLE[mesure]], mesureDuree = DOUBLE * 16;

        // Bourdon grave et nappe sombre : posés au début de chaque mesure
        if (pos === 0) {
            voix(hz(accord.basse), t, mesureDuree * 0.98, { vol: 0.07, filtre: 260, attaque: 0.2, sortie: 0.5, desaccord: [-6, 0, 6] });
            voix(hz(accord.basse + 12), t, mesureDuree * 0.98, { vol: 0.03, type: 'square', filtre: 400, attaque: 0.3, sortie: 0.5, desaccord: [0] });
            for (const n of accord.nappe) voix(hz(n), t, mesureDuree * 0.98, { vol: partie === 3 ? 0.02 : 0.016, filtre: 750, attaque: 0.6, sortie: 0.7, vibrato: 6 });
        }

        // « Braam » : gros accord de cuivres graves qui s'ouvre (début de la montée et du pic)
        if (pos === 0 && (partie === 1 || partie === 2) && dansPartie % 4 === 0) {
            for (const n of [accord.basse + 12, accord.basse + 19, accord.basse + 24])
                voix(hz(n), t, mesureDuree * 0.9, { vol: 0.045, filtre: 180, filtreFin: 1600, attaque: 0.08, sortie: 0.9, desaccord: [-14, -5, 5, 14] });
            ton(48, t, 1.6, { vol: 0.32, f2: 28, ...o });                                  // impact sub
            bruit(t, 1.2, { vol: 0.05, filtre: 3000, filtreFin: 200, ...o });
        }

        // Tambours : discrets à l'installation, pleins à la montée, serrés au pic, rares à la respiration
        const motif = partie === 2 ? TAIKO_PIC : TAIKO;
        const force = motif[pos];
        if (force) {
            if (partie === 0 && dansPartie >= 2) { if (pos === 0 || pos === 8) taiko(t, 0.7, true); else if (dansPartie >= 4) taiko(t, force * 0.5); }
            else if (partie === 1 || partie === 2) taiko(t, force, pos === 0 || pos === 8);
            else if (partie === 3 && pos === 0) taiko(t, 0.6, true);
        }
        // Frottement métallique aigu (comme la texture dense des autres musiques)
        if (partie !== 3 && pos % 2 === 0 && (partie > 0 || dansPartie >= 4))
            bruit(t, 0.04, { vol: pos % 4 === 0 ? 0.012 : 0.02, filtre: 7000, type: 'highpass', ...o });

        // Ostinato de cordes en doubles croches (montée et pic), en arpège de l'accord
        if (partie === 1 || partie === 2 || (partie === 0 && dansPartie >= 6)) {
            const n = accord.arpege[pos % 4] + (partie === 2 ? 12 : 0) - 12;
            voix(hz(n), t, DOUBLE * 0.7, { vol: pos % 4 === 0 ? 0.026 : 0.018, filtre: 1800, attaque: 0.01, sortie: 0.06, desaccord: [-7, 7] });
        }
        // Thème lent, aux violoncelles puis aux violons : une note par demi-mesure
        if ((partie === 2 || partie === 3) && pos % 8 === 0) {
            const n = accord.nappe[(dansPartie + pos / 8) % 3] + (partie === 2 ? 12 : 0);
            voix(hz(n), t, DOUBLE * 7.5, { vol: 0.03, filtre: 2200, attaque: 0.15, sortie: 0.4, desaccord: [-9, 0, 9], vibrato: 14 });
        }

        // Roulement de caisse claire militaire à la fin de chaque partie (crescendo)
        if (dansPartie === 7 && pos >= 8) {
            const k = (pos - 8) / 8;
            for (const d of [0, DOUBLE / 2]) bruit(t + d, 0.07, { vol: 0.03 + 0.07 * k, filtre: 2300, filtreFin: 1200, type: 'bandpass', ...o });
        }
    }

    const ENTRAINEMENT = { nom: 'entrainement', double: DOUBLE, mesures: GRILLE.length, volume: 0.16, reverb: 0.55, jouer: jouer_double };

    /* ---------- Musique du menu (générée, en boucle) ----------
       Reprend l'ADN de l'ancien thème du menu : pédale grave sur sol qui
       frissonne d'un demi-ton (fa#, sol#), la aigu tenu au-dessus de sol
       mineur, passage vers mi bémol mineur. Mais retenue : 72 BPM, battement
       de cœur, horloge qui fait tic-tac, piano clairsemé, montées de souffle
       qui n'éclatent jamais… quelque chose est sur le point d'arriver.
       32 mesures (≈ 107 s) : calme, inquiétude, tension, retombée. */
    const M_DOUBLE = 60 / 72 / 4;
    // nappe : l'accord tenu ; haut : 4 notes de l'accord pour le piano et le trémolo
    const M_ACCORDS = {
        Gm: { basse: 31, nappe: [55, 58, 62, 69], haut: [62, 67, 69, 70] },     // sol mineur, avec le la aigu (neuvième)
        Eb: { basse: 27, nappe: [55, 58, 63, 70], haut: [63, 67, 70, 74] },
        Ebm: { basse: 27, nappe: [54, 58, 63, 70], haut: [63, 66, 70, 73] },    // le sol bémol qui assombrit tout
        Cm: { basse: 24, nappe: [55, 60, 63, 67], haut: [60, 63, 67, 70] },
        D: { basse: 26, nappe: [54, 57, 60, 62], haut: [62, 66, 69, 72] }       // ré 7 : la tension qui attend sa résolution
    };
    const M_GRILLE = [
        'Gm', 'Gm', 'Gm', 'Gm', 'Eb', 'Eb', 'Ebm', 'Ebm',   // calme
        'Gm', 'Gm', 'Gm', 'Gm', 'Ebm', 'Ebm', 'D', 'D',     // inquiétude
        'Gm', 'Gm', 'Eb', 'Eb', 'Cm', 'Cm', 'D', 'D',       // tension
        'Ebm', 'Ebm', 'Gm', 'Gm', 'Ebm', 'Ebm', 'D', 'D'    // retombée
    ];
    // Motif de piano : rang de la note dans « haut » (null = silence), une note par croche, sur 2 mesures.
    // Sur sol mineur, ça donne la-sol-ré puis si♭-la-ré ; sur les autres accords, la même forme.
    const M_PIANO = [2, null, 1, null, 0, null, null, null, 3, null, 2, null, 0, null, null, null];
    const MENU = { nom: 'menu', double: M_DOUBLE, mesures: M_GRILLE.length, volume: 0.2, reverb: 0.7, jouer: jouer_menu };

    // Une note de piano : attaque nette, extinction lente, un peu de corps
    function piano(f, t, vol) {
        const o = { sortie: piste.bus, absolu: true };
        ton(f, t, 2.6, { type: 'triangle', vol, ...o });
        ton(f * 2, t, 1.2, { type: 'sine', vol: vol * 0.35, ...o });
        ton(f * 3.01, t, 0.5, { type: 'sine', vol: vol * 0.12, ...o });
    }

    function jouer_menu(i, t) {
        const o = { sortie: piste.bus, absolu: true };
        const mesure = Math.floor(i / 16), pos = i % 16, partie = Math.floor(mesure / 8), dansPartie = mesure % 8;
        const nom = M_GRILLE[mesure], accord = M_ACCORDS[nom], mesureDuree = M_DOUBLE * 16;

        // Pédale grave : relancée toutes les deux mesures, très sombre
        if (pos === 0 && mesure % 2 === 0) {
            voix(hz(accord.basse), t, mesureDuree * 2, { vol: 0.08, filtre: 220, attaque: 1.2, sortie: 1.2, desaccord: [-5, 0, 5] });
            voix(hz(accord.basse + 12), t, mesureDuree * 2, { vol: 0.025, type: 'triangle', filtre: 500, attaque: 1.5, sortie: 1.2, desaccord: [0] });
        }
        // Le frisson de l'original : la basse glisse d'un demi-ton et revient (fin de chaque paire de mesures)
        if (pos === 12 && dansPartie % 2 === 1 && partie !== 0) {
            const voisin = accord.basse + (mesure % 4 === 1 ? 1 : -1);
            voix(hz(voisin), t, M_DOUBLE * 4, { vol: 0.05, filtre: 260, attaque: 0.3, sortie: 0.4, desaccord: [-5, 5] });
        }
        // Nappe de cordes : l'accord, tenu, qui respire (avec le la aigu de l'original)
        if (pos === 0) {
            const vol = [0.012, 0.015, 0.019, 0.014][partie];
            for (const n of accord.nappe) voix(hz(n), t, mesureDuree * 0.98, { vol, filtre: 900, attaque: 1.4, sortie: 1.4, vibrato: 7 });
        }
        // Note aiguë qui tremble au loin (trémolo de violons), à partir de l'inquiétude
        if (partie >= 1 && partie !== 3 && pos % 2 === 0) {
            const n = accord.haut[2] + 12;
            voix(hz(n), t, M_DOUBLE * 1.6, { vol: partie === 2 ? 0.009 : 0.006, filtre: 3000, attaque: 0.04, sortie: 0.1, desaccord: [-10, 10] });
        }

        // Battement de cœur : « boum-boum » une fois par mesure, plus pressant dans la tension
        if (partie >= 1 && (pos === 0 || pos === 3 || (partie === 2 && (pos === 8 || pos === 11)))) {
            const fort = pos === 0 || pos === 8;
            ton(fort ? 58 : 52, t, 0.5, { vol: fort ? 0.3 : 0.2, f2: 30, ...o });
            bruit(t, 0.05, { vol: 0.02, filtre: 300, ...o });
        }
        // Horloge : tic-tac discret à chaque temps (inquiétude et tension)
        if ((partie === 1 || partie === 2) && pos % 4 === 0)
            bruit(t, 0.025, { vol: pos % 8 === 0 ? 0.03 : 0.022, filtre: pos % 8 === 0 ? 5200 : 3800, type: 'bandpass', ...o });

        // Piano clairsemé : le motif du thème, joué doucement (pas dans la toute première partie)
        if (partie >= 1 && pos % 2 === 0) {
            const rang = M_PIANO[(mesure % 2) * 8 + pos / 2];
            if (rang !== null) piano(hz(accord.haut[rang]), t, partie === 3 ? 0.04 : 0.055);
        }
        if (partie === 0 && dansPartie >= 4 && pos === 0) piano(hz(accord.haut[2]), t, 0.035);   // une seule note, qui annonce

        // Montée de souffle sur les deux dernières mesures de chaque partie… qui s'arrête net
        if (dansPartie === 6 && pos === 0) {
            const duree = mesureDuree * 2 - M_DOUBLE * 2;
            bruit(t, duree, { vol: partie === 2 ? 0.05 : 0.03, filtre: 300, filtreFin: 5000, type: 'bandpass', ...o });
            voix(hz(accord.basse + 24), t, duree, { vol: 0.02, filtre: 200, filtreFin: 2500, attaque: duree * 0.85, sortie: 0.3, desaccord: [-20, -8, 8, 20] });
        }
        // Après la tension : un grondement lointain, étouffé (ce qui arrive est encore loin)
        if (partie === 3 && dansPartie === 0 && pos === 0) {
            ton(40, t, 3, { vol: 0.25, f2: 26, ...o });
            bruit(t, 2.5, { vol: 0.04, filtre: 180, filtreFin: 60, ...o });
        }
    }

    /* ---------- Musique du mode normal (générée, en boucle) ----------
       La recette de l'ancienne musique du mode normal : 133 BPM, pédale sur la
       qui frissonne vers sol# et si♭, basse qui rampe chromatiquement (do, do#,
       ré) sous une ligne en la mineur, éclairs de la majeur (do#).
       Pour ne pas lasser pendant une longue partie : 7 parties qui changent de
       basse, de batterie et parfois de tonalité, deux thèmes, un contre-chant,
       des breaks variés en fin de phrase. Et chaque nouveau tour de boucle
       change d'orchestration (thème aux violons, ostinato en plus…).
       88 mesures (≈ 2 min 40). */
    const N_DOUBLE = 60 / 133 / 4;
    // basse : motif de basse ; batterie : motif de batterie ; transpo : demi-tons
    const N_PARTIES = [
        { nom: 'arrivee', mesures: 8, basse: 'pedale', batterie: 'leger', transpo: 0 },
        { nom: 'assaut', mesures: 16, basse: 'rampe', batterie: 'rock', transpo: 0 },
        { nom: 'theme', mesures: 16, basse: 'rampe2', batterie: 'rock2', transpo: 0, theme: 'A' },
        { nom: 'cassure', mesures: 8, basse: 'tenue', batterie: 'demi', transpo: 0, theme: 'B' },
        { nom: 'poursuite', mesures: 16, basse: 'galop', batterie: 'double', transpo: 1 },
        { nom: 'reprise', mesures: 16, basse: 'rampe', batterie: 'toms', transpo: 3, theme: 'A', contrechant: true },
        { nom: 'retombee', mesures: 8, basse: 'pedale', batterie: 'leger', transpo: 0 }
    ];
    const N_DEBUTS = [];
    N_PARTIES.reduce((debut, p) => (N_DEBUTS.push(debut), debut + p.mesures), 0);
    const N_MESURES = N_PARTIES.reduce((n, p) => n + p.mesures, 0);
    const N_BASSES = {
        pedale: m => Array(8).fill([33, 33, 32, 33, 33, 33, 34, 33][m % 8]),   // la, avec sol# et si♭ qui frissonnent
        rampe: () => [36, 36, 37, 37, 38, 38, 37, 37],                         // do, do#, ré, do# : la basse qui rampe
        rampe2: m => m % 4 < 2 ? [36, 36, 37, 37, 38, 38, 37, 37] : [36, 37, 38, 39, 38, 37, 36, 35],
        tenue: m => Array(8).fill([33, 29, 26, 28][Math.floor(m / 2) % 4]),  // la, fa, ré, mi : longues notes
        galop: m => (m % 2 ? [33, 45, 33, 34, 33, 45, 32, 33] : [33, 45, 33, 45, 33, 45, 34, 32])
    };
    // Motifs de batterie sur 16 doubles croches : grosse caisse, caisse claire, charleston (1 = croche, 2 = double)
    const N_BATTERIES = {
        leger: { kick: [0], snare: [], hat: 1 },
        rock: { kick: [0, 8], snare: [4, 12], hat: 1 },
        rock2: { kick: [0, 6, 8, 10], snare: [4, 12], hat: 1 },
        demi: { kick: [0], snare: [8], hat: 0 },
        double: { kick: [0, 4, 8, 12], snare: [4, 12, 14], hat: 2 },
        toms: { kick: [0, 10], snare: [4, 12], hat: 1, toms: [3, 6, 7, 14] }
    };
    // Thèmes : une note par demi-mesure, sur 8 mesures (null = silence)
    const N_THEMES = {
        A: [69, 72, 76, 77, 76, 72, 71, 69, 69, 72, 76, 79, 77, 76, 72, 76],
        B: [76, null, 74, 72, 71, null, 72, 69, 68, null, 69, 71, 72, 71, 69, null]
    };
    const NORMAL = { nom: 'normal', double: N_DOUBLE, mesures: N_MESURES, volume: 0.18, reverb: 0.4, jouer: jouer_normal, tour: 0 };

    // Accord tenu de la mesure (avant transposition)
    function accord_normal(partie, mesure) {
        if (partie.basse === 'pedale') return mesure % 2 ? [57, 60, 64] : [57, 61, 64];   // la mineur / la majeur qui hésitent
        if (partie.basse === 'tenue') return [[57, 60, 64], [57, 60, 65], [57, 62, 65], [56, 59, 64]][Math.floor(mesure / 2) % 4];
        return Math.floor(mesure / 2) % 2 ? [57, 60, 65] : [57, 60, 64];                    // la mineur / fa
    }

    function jouer_normal(i, t) {
        const o = { sortie: piste.bus, absolu: true };
        if (i === 0) NORMAL.tour++;
        const tourPair = NORMAL.tour % 2 === 0;
        const mesure = Math.floor(i / 16), pos = i % 16, mesureDuree = N_DOUBLE * 16;
        let k = N_DEBUTS.length - 1;
        while (N_DEBUTS[k] > mesure) k--;
        const partie = N_PARTIES[k], dans = mesure - N_DEBUTS[k], T = partie.transpo;
        const derniere = dans === partie.mesures - 1;
        const nappe = accord_normal(partie, mesure).map(n => n + T);

        // Crash au début de chaque partie (sauf la toute première)
        if (pos === 0 && dans === 0 && k > 0) bruit(t, 1.4, { vol: 0.05, filtre: 6000, filtreFin: 3000, type: 'highpass', ...o });

        // Basse
        const motif = N_BASSES[partie.basse](mesure);
        if (partie.basse === 'galop') {
            // Galop : deux doubles croches + une croche, en boucle
            if (pos % 4 !== 1) {
                const n = motif[Math.floor(pos / 2)] + T;
                voix(hz(n), t, N_DOUBLE * 0.9, { vol: pos % 4 === 0 ? 0.08 : 0.055, filtre: 700, attaque: 0.005, sortie: 0.05, desaccord: [-7, 7] });
            }
        } else if (partie.basse === 'tenue') {
            if (pos === 0) voix(hz(motif[0] + T), t, mesureDuree * 0.98, { vol: 0.05, filtre: 300, attaque: 0.15, sortie: 0.4, desaccord: [-6, 0, 6] });
        } else if (pos % 2 === 0) {
            const n = motif[pos / 2] + T, accent = pos % 8 === 0;
            voix(hz(n), t, N_DOUBLE * 1.7, { vol: accent ? 0.07 : 0.05, filtre: accent ? 650 : 450, attaque: 0.008, sortie: 0.07, desaccord: [-7, 7] });
            if (partie.basse !== 'pedale') voix(hz(n + 12), t, N_DOUBLE * 1.5, { vol: 0.02, type: 'square', filtre: 900, attaque: 0.008, sortie: 0.06, desaccord: [0] });
        }

        // Nappe sombre ; la aigu tenu pendant les parties de combat
        if (pos === 0) {
            const vol = partie.basse === 'tenue' ? 0.012 : 0.011;
            for (const n of nappe) voix(hz(n), t, mesureDuree * 0.98, { vol, filtre: partie.basse === 'tenue' ? 1300 : 900, attaque: 0.25, sortie: 0.4, vibrato: 6 });
            if (partie.basse !== 'pedale' && partie.basse !== 'tenue') voix(hz(81 + T), t, mesureDuree * 0.98, { vol: 0.006, filtre: 2600, attaque: 0.3, sortie: 0.4, desaccord: [-10, 10], vibrato: 12 });
        }

        // Batterie (allégée au début de l'arrivée ; break à la fin de certaines phrases)
        const bat = N_BATTERIES[partie.batterie];
        const finPhrase = dans % 4 === 3, typeBreak = Math.floor(mesure / 4) % 3;
        const arret = finPhrase && typeBreak === 2 && pos >= 12 && partie.batterie !== 'leger';   // silence net avant la reprise
        const debutLeger = partie.batterie === 'leger' && dans < 2 && k === 0;
        if (!arret && !debutLeger) {
            if (bat.kick.includes(pos)) { ton(70, t, 0.35, { vol: 0.32, f2: 40, ...o }); bruit(t, 0.03, { vol: 0.04, filtre: 900, ...o }); }
            if (bat.snare.includes(pos)) {
                const fantome = pos === 14;
                bruit(t, 0.2, { vol: fantome ? 0.05 : 0.13, filtre: 1900, filtreFin: 900, type: 'bandpass', ...o });
                if (!fantome) ton(185, t, 0.12, { type: 'triangle', vol: 0.08, f2: 140, ...o });
            }
            const pasHat = bat.hat === 2 ? 1 : bat.hat === 1 ? 2 : 4;
            if (pos % pasHat === 0 && (partie.batterie !== 'leger' || dans >= 4))
                bruit(t, pos % 8 === 6 && bat.hat === 1 ? 0.12 : 0.035, { vol: pos % 4 === 2 ? 0.022 : 0.013, filtre: 7500, type: 'highpass', ...o });
            if (bat.toms && bat.toms.includes(pos)) taiko(t, 0.55, pos === 14);
        }
        // Breaks de fin de phrase, qui changent : toms qui dévalent, roulement de caisse claire, ou arrêt net
        if (finPhrase && pos >= 12 && partie.batterie !== 'leger' && partie.batterie !== 'demi') {
            if (typeBreak === 0) taiko(t, 0.6 + (pos - 12) * 0.1, pos === 15);
            else if (typeBreak === 1) for (const d of [0, N_DOUBLE / 2]) bruit(t + d, 0.06, { vol: 0.05 + (pos - 12) * 0.015, filtre: 2200, filtreFin: 1200, type: 'bandpass', ...o });
        }

        // Cordes en contretemps (assaut, thème, reprise)
        if ((partie.basse === 'rampe' || partie.basse === 'rampe2') && pos % 4 === 2)
            for (const n of [nappe[1] + 12, nappe[2] + 12]) voix(hz(n), t, N_DOUBLE * 0.8, { vol: 0.014, filtre: 2200, attaque: 0.006, sortie: 0.05, desaccord: [-6, 6] });
        // Ostinato de cordes en doubles croches : la poursuite, et l'assaut un tour sur deux
        if (partie.nom === 'poursuite' || (partie.nom === 'assaut' && !tourPair && dans >= 8)) {
            const n = [nappe[0], nappe[1], nappe[2], nappe[1]][pos % 4] + 12;
            voix(hz(n), t, N_DOUBLE * 0.7, { vol: pos % 4 === 0 ? 0.02 : 0.014, filtre: 2000, attaque: 0.005, sortie: 0.05, desaccord: [-7, 7] });
        }

        // Thèmes : A aux cuivres (aux violons, une octave au-dessus, un tour sur deux), B aux violoncelles
        if (partie.theme && pos % 8 === 0) {
            const n = N_THEMES[partie.theme][(dans % 8) * 2 + pos / 8];
            if (n !== null) {
                const note = n + T;
                if (partie.theme === 'B') voix(hz(note - 12), t, N_DOUBLE * 7.6, { vol: 0.035, filtre: 1100, attaque: 0.12, sortie: 0.3, desaccord: [-8, 0, 8], vibrato: 10 });
                else if (tourPair) {
                    voix(hz(note), t, N_DOUBLE * 7.4, { vol: 0.03, filtre: 1500, attaque: 0.05, sortie: 0.15, desaccord: [-7, 0, 7] });
                    voix(hz(note - 12), t, N_DOUBLE * 7.4, { vol: 0.02, filtre: 900, attaque: 0.05, sortie: 0.15, desaccord: [-5, 5] });
                } else voix(hz(note + 12), t, N_DOUBLE * 7.4, { vol: 0.022, filtre: 3000, attaque: 0.08, sortie: 0.2, desaccord: [-9, 0, 9], vibrato: 14 });
            }
        }
        // Contre-chant (reprise) : réponse en croches entre les notes du thème
        if (partie.contrechant && pos % 2 === 0 && pos >= 8) {
            const n = [nappe[2], nappe[1], nappe[0], nappe[1]][(pos - 8) / 2 % 4] + 12;
            voix(hz(n), t, N_DOUBLE * 1.6, { vol: 0.012, filtre: 2500, attaque: 0.01, sortie: 0.08, desaccord: [-6, 6] });
        }
        // Cassure : quelques notes de piano au loin
        if (partie.nom === 'cassure' && pos % 4 === 0 && (pos / 4 + mesure) % 3 === 0) piano(hz(nappe[(pos / 4) % 3] + 12), t, 0.03);

        // « Braam » au début des parties de combat et toutes les 4 mesures des thèmes
        if (pos === 0 && ((dans === 0 && partie.basse !== 'pedale' && partie.basse !== 'tenue') || (partie.theme === 'A' && dans % 4 === 0))) {
            for (const n of [45, 52, 57]) voix(hz(n + T), t, mesureDuree * 0.9, { vol: 0.04, filtre: 180, filtreFin: 1500, attaque: 0.06, sortie: 0.6, desaccord: [-14, -5, 5, 14] });
            ton(46, t, 1.3, { vol: 0.3, f2: 28, ...o });
            bruit(t, 1, { vol: 0.04, filtre: 3000, filtreFin: 200, ...o });
        }
        // Montée avant chaque nouvelle partie : roulement de caisse claire qui grossit
        if (derniere && pos >= 8) {
            const r = (pos - 8) / 8;
            for (const d of [0, N_DOUBLE / 2]) bruit(t + d, 0.06, { vol: 0.03 + 0.07 * r, filtre: 2200, filtreFin: 1200, type: 'bandpass', ...o });
        }
    }

    /* ---------- Seconde musique du mode normal : « Le Siège » ----------
       Même famille (sombre, dense, cinématique) mais un autre caractère : mi
       phrygien dominant (mi, fa, sol#, la, si, do, ré : la couleur orientale la
       plus noire), 140 BPM, un riff grave obstiné sur une batterie en 3-3-2,
       un thème de cuivres, une respiration, puis une montée où le riff grimpe
       marche après marche jusqu'à l'assaut final. Un tour sur deux, le thème
       passe aux violoncelles et un contre-riff s'ajoute.
       80 mesures (≈ 2 min 17). */
    const S_DOUBLE = 60 / 140 / 4;
    const S_PARTIES = [
        { nom: 'veille', mesures: 8 },
        { nom: 'riff', mesures: 16 },
        { nom: 'cuivres', mesures: 16 },
        { nom: 'souffle', mesures: 8 },
        { nom: 'montee', mesures: 16 },
        { nom: 'final', mesures: 12 },
        { nom: 'fin', mesures: 4 }
    ];
    const S_DEBUTS = [];
    S_PARTIES.reduce((debut, p) => (S_DEBUTS.push(debut), debut + p.mesures), 0);
    // Le riff, en croches, sur deux mesures : mi-mi-fa-mi, puis la réponse
    const S_RIFF = [[40, 40, 41, 40, 44, 45, 44, 41], [40, 40, 41, 40, 47, 48, 47, 45]];
    // Thème aux cuivres : une note par demi-mesure, sur 8 mesures (null = silence)
    const S_THEME = [76, 77, 76, 74, 72, 71, 72, 74, 76, 77, 80, 81, 80, 77, 76, null];
    // Respiration : accords tenus mi majeur, fa, ré mineur, mi (la cadence phrygienne)
    const S_SOUFFLE = [[52, 56, 59], [53, 57, 60], [50, 53, 57], [52, 56, 59]];
    const SIEGE = { nom: 'siege', double: S_DOUBLE, mesures: 80, volume: 0.14, reverb: 0.45, jouer: jouer_siege, tour: 0 };

    function jouer_siege(i, t) {
        const o = { sortie: piste.bus, absolu: true };
        if (i === 0) SIEGE.tour++;
        const tourPair = SIEGE.tour % 2 === 0;
        const mesure = Math.floor(i / 16), pos = i % 16, mesureDuree = S_DOUBLE * 16;
        let k = S_DEBUTS.length - 1;
        while (S_DEBUTS[k] > mesure) k--;
        const partie = S_PARTIES[k].nom, dans = mesure - S_DEBUTS[k], derniere = dans === S_PARTIES[k].mesures - 1;
        // La montée fait grimper le riff toutes les 4 mesures : mi, fa, sol, la
        const T = partie === 'montee' ? [0, 1, 3, 5][Math.floor(dans / 4)] : 0;
        const accordFa = mesure % 4 === 3;                       // une mesure sur quatre, l'accord de fa qui grince
        const nappe = (partie === 'souffle' ? S_SOUFFLE[Math.floor(dans / 2) % 4] : accordFa ? [53, 57, 60] : [52, 56, 59]).map(n => n + T);

        if (pos === 0 && dans === 0 && k > 0) bruit(t, 1.4, { vol: 0.05, filtre: 6000, filtreFin: 3000, type: 'highpass', ...o });

        // Le riff grave (pas pendant la respiration ; seulement des bribes à la fin)
        const riff = partie !== 'souffle' && (partie !== 'fin' || pos < 8);
        if (riff && pos % 2 === 0) {
            const n = S_RIFF[mesure % 2][pos / 2] + T;
            const pizz = partie === 'veille';
            voix(hz(n - 12), t, S_DOUBLE * (pizz ? 1 : 1.7), { vol: pizz ? 0.05 : 0.065, filtre: pizz ? 500 : 700, attaque: 0.006, sortie: pizz ? 0.12 : 0.06, desaccord: [-7, 7] });
            if (!pizz) voix(hz(n), t, S_DOUBLE * 1.5, { vol: 0.022, type: 'square', filtre: 1000, attaque: 0.006, sortie: 0.05, desaccord: [0] });
        }
        // Pédale de mi tout au fond, et nappe
        if (pos === 0) {
            if (partie !== 'fin') voix(hz(28 + T), t, mesureDuree * 0.98, { vol: 0.04, filtre: 180, attaque: 0.2, sortie: 0.4, desaccord: [-5, 5] });
            const vol = partie === 'souffle' ? 0.016 : 0.01;
            for (const n of nappe) voix(hz(n), t, mesureDuree * 0.98, { vol, filtre: partie === 'souffle' ? 1400 : 900, attaque: 0.3, sortie: 0.5, vibrato: 7 });
        }

        // Batterie en 3-3-2 (grosse caisse sur 0, 3, 6 puis 8, 11, 14)
        const plein = partie === 'riff' || partie === 'cuivres' || partie === 'montee' || partie === 'final';
        if (plein) {
            const kicks = partie === 'final' ? [0, 2, 3, 6, 8, 10, 11, 14] : [0, 3, 6, 8, 11, 14];
            if (kicks.includes(pos)) { ton(68, t, 0.32, { vol: 0.3, f2: 38, ...o }); bruit(t, 0.03, { vol: 0.04, filtre: 900, ...o }); }
            if (pos === 4 || pos === 12) {
                bruit(t, 0.2, { vol: 0.13, filtre: 1800, filtreFin: 850, type: 'bandpass', ...o });
                ton(175, t, 0.12, { type: 'triangle', vol: 0.08, f2: 130, ...o });
            }
            if (pos % 2 === 0) bruit(t, 0.035, { vol: pos % 4 === 0 ? 0.013 : 0.022, filtre: 8000, type: 'highpass', ...o });
            // Fin de phrase : toms ou arrêt sec, en alternance
            if (dans % 4 === 3 && pos >= 12) {
                if (Math.floor(mesure / 4) % 2) taiko(t, 0.55 + (pos - 12) * 0.1, pos === 15);
                else if (pos === 12) taiko(t, 0.9, true);
            }
            // La montée se resserre : roulement de caisse claire sur la dernière mesure de chaque marche
            if (partie === 'montee' && dans % 4 === 3) bruit(t, 0.05, { vol: 0.03 + pos * 0.004, filtre: 2300, type: 'bandpass', ...o });
        } else if (partie === 'veille' && pos === 0 && dans % 2 === 0) taiko(t, 0.7, true);
        else if (partie === 'souffle' && (pos === 0 || pos === 3)) { ton(pos ? 50 : 56, t, 0.5, { vol: pos ? 0.18 : 0.26, f2: 30, ...o }); }   // battement de cœur
        else if (partie === 'fin' && pos === 0 && dans === 3) { ton(44, t, 2, { vol: 0.32, f2: 26, ...o }); bruit(t, 1.5, { vol: 0.04, filtre: 200, filtreFin: 60, ...o }); }

        // Ostinato de cordes en doubles croches (cuivres et final) : mi-fa-mi-sol#
        if ((partie === 'cuivres' || partie === 'final') && pos % 2 === 0) {
            const n = [64, 65, 64, 68][(pos / 2) % 4] + T;
            voix(hz(n), t, S_DOUBLE * 1.4, { vol: 0.014, filtre: 2200, attaque: 0.005, sortie: 0.05, desaccord: [-7, 7] });
        }
        // Contre-riff aigu, un tour sur deux pendant le riff
        if (partie === 'riff' && tourPair && dans >= 8 && pos % 4 === 2) {
            const n = S_RIFF[(mesure + 1) % 2][(pos + 2) / 2 % 8] + 24;
            voix(hz(n), t, S_DOUBLE * 1.2, { vol: 0.013, filtre: 2600, attaque: 0.005, sortie: 0.06, desaccord: [-6, 6] });
        }

        // Thème : cuivres (ou violoncelles un tour sur deux), puis en octaves au final
        if ((partie === 'cuivres' || partie === 'final') && pos % 8 === 0) {
            const n = S_THEME[(dans % 8) * 2 + pos / 8];
            if (n !== null) {
                if (partie === 'final' || tourPair) {
                    voix(hz(n), t, S_DOUBLE * 7.4, { vol: 0.03, filtre: 1500, attaque: 0.05, sortie: 0.15, desaccord: [-7, 0, 7] });
                    voix(hz(n - 12), t, S_DOUBLE * 7.4, { vol: 0.02, filtre: 900, attaque: 0.05, sortie: 0.15, desaccord: [-5, 5] });
                }
                if (partie === 'final' || !tourPair) voix(hz(n - (partie === 'final' ? -12 : 12)), t, S_DOUBLE * 7.6, { vol: partie === 'final' ? 0.018 : 0.034, filtre: partie === 'final' ? 3000 : 1100, attaque: 0.1, sortie: 0.25, desaccord: [-8, 0, 8], vibrato: 12 });
            }
        }
        // Respiration : violon seul, très haut, sur la note de l'accord
        if (partie === 'souffle' && pos === 0 && dans % 2 === 0)
            voix(hz(nappe[2] + 24), t, mesureDuree * 1.9, { vol: 0.012, filtre: 3200, attaque: 0.6, sortie: 0.6, desaccord: [-4, 4], vibrato: 16 });

        // « Braams » : début du riff, toutes les 4 mesures des cuivres et du final, à chaque marche de la montée
        if (pos === 0 && ((partie === 'riff' && dans === 0) || ((partie === 'cuivres' || partie === 'final') && dans % 4 === 0) || (partie === 'montee' && dans % 4 === 0))) {
            for (const n of [40, 47, 52]) voix(hz(n + T), t, mesureDuree * 0.9, { vol: 0.04, filtre: 180, filtreFin: 1500, attaque: 0.06, sortie: 0.6, desaccord: [-14, -5, 5, 14] });
            ton(44, t, 1.3, { vol: 0.3, f2: 26, ...o });
            bruit(t, 1, { vol: 0.04, filtre: 3000, filtreFin: 200, ...o });
        }
        // Montée de caisse claire avant chaque nouvelle partie
        if (derniere && pos >= 8 && partie !== 'fin') {
            const r = (pos - 8) / 8;
            for (const d of [0, S_DOUBLE / 2]) bruit(t + d, 0.06, { vol: 0.03 + 0.07 * r, filtre: 2200, filtreFin: 1200, type: 'bandpass', ...o });
        }
    }

    // Musiques générées par ambiance ; le mode normal en a deux, tirées tour à tour
    const COMPOSITIONS = { menu: [MENU], normal: [NORMAL, SIEGE], entrainement: [ENTRAINEMENT] };
    let dernierNormal = null;
    function choisir_compo(nom) {
        const liste = COMPOSITIONS[nom];
        if (!liste) return null;
        if (liste.length === 1) return liste[0];
        // Au hasard, mais jamais deux fois de suite la même
        const autres = liste.filter(c => c !== dernierNormal);
        return (dernierNormal = autres[Math.floor(Math.random() * autres.length)]);
    }

    /* Vibrations : téléphone (navigator.vibrate, Android) et manette (vibreurs).
       force de 0 à 1, duree en millisecondes. Désactivables dans le panneau du son. */
    function vibrer(force, duree) {
        if (!reglages.vibrations || typeof navigator === 'undefined') return;
        // Le téléphone ne vibre qu'après un premier contact avec la page (sinon le navigateur proteste)
        const actifPage = !navigator.userActivation || navigator.userActivation.hasBeenActive;
        try { if (navigator.vibrate && actifPage) navigator.vibrate(Math.round(duree)); } catch { /* refusé par le navigateur */ }
        const manettes = navigator.getGamepads ? [...navigator.getGamepads()] : [];
        for (const gp of manettes) {
            if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
                gp.vibrationActuator.playEffect('dual-rumble', { duration: duree, strongMagnitude: force, weakMagnitude: Math.min(1, force * 0.6 + 0.2) }).catch(() => {});
            }
        }
    }
    function setVibrations(valeur) { reglages.vibrations = valeur; Sauvegarde.sauver(); }

    // Première interaction avec la page : le navigateur autorise enfin le son
    function debloquer() {
        if (actif && ambiance && !suspendue) jouer();
        if (actif) contexte();
    }
    for (const evt of ['pointerdown', 'keydown']) document.addEventListener(evt, debloquer, { once: true, capture: true });

    return {
        jouerAmbiance,
        ambiance: () => ambiance,              // ambiance en cours (tests, débogage)
        setVolume,
        vibrer,
        setVibrations,
        vibrations: () => reglages.vibrations,
        volume: quoi => reglages[quoi],
        sortieMusique: () => (contexte(), sortieMusique),
        effet: nom => { if (BRUITAGES[nom]) BRUITAGES[nom](); },
        arreterMusique,
        setActif,
        suspendreMusique,
        reprendreMusique,
        pisteActive: () => (piste ? piste.compo.nom : null),   // musique générée en cours (tests)
        estActif: () => actif,
        contexte,   // contexte Web Audio partagé (aussi utilisé par les sons de lootbox)
        ton,
        bouton: () => jouerEffet(sonBouton)
    };
})();
