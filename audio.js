/* =========================================================================
   GESTION DU SON
   Un seul lecteur de musique est utilisé (menu, normal ou playlist hardcore) :
   les gros fichiers MP3 ne sont téléchargés que lorsqu'ils sont joués.
   ========================================================================= */
const Son = (() => {
    const PISTES = {
        menu: { src: './assets/son/menu_theme.mp3', volume: 0.1 },
        normal: { src: './assets/son/background_sound.mp3', volume: 0.1 },
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
    let ambiance = null;        // 'menu' | 'normal' | 'hardcore' | null
    let indexHardcore = 0;

    // play() renvoie une promesse rejetée si le navigateur refuse la lecture
    const lire = (audio) => audio.play().catch(() => {});

    function chargerPiste(src, volume, enBoucle) {
        musique.src = src;
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
        ambiance = nom;
        arreter_marche();
        // L'entraînement a sa propre musique, générée (marche militaire, plus bas)
        if (nom === 'entrainement') {
            musique.pause();
            if (actif) demarrer_marche();
            return;
        }
        if (nom === 'hardcore') {
            indexHardcore = Math.floor(Math.random() * PISTES.hardcore.length);
            chargerPiste(PISTES.hardcore[indexHardcore], VOLUME_HARDCORE, false);
        } else {
            chargerPiste(PISTES[nom].src, PISTES[nom].volume, true);
        }
        if (actif) lire(musique);
    }

    function arreterMusique() {
        ambiance = null;
        musique.pause();
        arreter_marche();
    }

    // Musique de l'ambiance en cours : le lecteur MP3, ou la marche de l'entraînement
    function jouer() { if (ambiance === 'entrainement') demarrer_marche(); else lire(musique); }
    function couper() { musique.pause(); arreter_marche(); }

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

    /* ---------- Marche militaire de l'entraînement (générée, en boucle) ----------
       Sonorité « orchestre » : violons (vibrato), cuivres, nappe de cordes,
       contrebasse, caisse claire et grosse caisse, dans une réverbération de
       salle. 16 mesures à 100 battements par minute (environ 40 s) :
         A  (mesures 1-4)   thème aux cuivres
         A' (mesures 5-8)   thème aux violons et cuivres
         B  (mesures 9-12)  pont : les violons seuls chantent
         A" (mesures 13-16) reprise de tout l'orchestre, cadence finale
       Les notes sont programmées un peu à l'avance : la marche ne dépend pas de
       la boucle du jeu et continue quand la partie est figée (le Sergent parle). */
    const NOTES = {
        A3: 220, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
        C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784
    };
    // Mélodie en croches : une note, '-' la prolonge, '.' un silence
    const THEME = [
        'G4', '-', 'C5', 'D5', 'E5', '-', 'C5', '-',
        'D5', '-', 'B4', 'C5', 'D5', '-', 'G4', '-',
        'E5', '-', 'F5', 'E5', 'D5', '-', 'C5', 'B4',
        'C5', '-', 'D5', 'B4', 'C5', '-', '-', '.'
    ];
    const PONT = [
        'A4', '-', 'C5', '-', 'F5', '-', 'E5', 'D5',
        'E5', '-', 'G5', '-', 'E5', '-', 'C5', '-',
        'F5', '-', 'E5', 'D5', 'A4', '-', 'D5', '-',
        'B4', '-', 'D5', '-', 'G5', '-', '-', '.'
    ];
    const FINALE = [
        'G4', '-', 'C5', 'D5', 'E5', '-', 'C5', '-',
        'D5', '-', 'B4', 'C5', 'D5', '-', 'G4', '-',
        'F5', '-', 'F5', 'E5', 'D5', '-', 'B4', '-',
        'C5', '-', '-', '-', '-', '-', '-', '.'
    ];
    const MELODIE = [...THEME, ...THEME, ...PONT, ...FINALE];
    // Qui joue la mélodie, mesure par mesure
    const PUPITRE = ['cuivres', 'cuivres', 'cuivres', 'cuivres', 'tutti', 'tutti', 'tutti', 'tutti',
        'violons', 'violons', 'violons', 'violons', 'tutti', 'tutti', 'tutti', 'tutti'];
    const ACCORDS = {
        C: { notes: ['C4', 'E4', 'G4'], basse: [65.4, 98] }, G: { notes: ['B3', 'D4', 'G4'], basse: [49, 73.4] },
        Am: { notes: ['C4', 'E4', 'A4'], basse: [55, 82.4] }, G7: { notes: ['B3', 'D4', 'F4'], basse: [49, 73.4] },
        F: { notes: ['C4', 'F4', 'A4'], basse: [43.7, 65.4] }, Dm: { notes: ['D4', 'F4', 'A4'], basse: [73.4, 110] }
    };
    const GRILLE = ['C', 'G', 'Am', 'G7', 'C', 'G', 'Am', 'G7', 'F', 'C', 'Dm', 'G', 'C', 'G', 'G7', 'C'];
    let marche = null;

    // Réverbération de salle : réponse impulsionnelle de bruit qui s'éteint
    function salle(c) {
        const duree = 2.4, n = Math.floor(c.sampleRate * duree);
        const ir = c.createBuffer(2, n, c.sampleRate);
        for (let canal = 0; canal < 2; canal++) {
            const d = ir.getChannelData(canal);
            for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
        }
        const conv = c.createConvolver();
        conv.buffer = ir;
        return conv;
    }

    function demarrer_marche() {
        if (marche || !actif) return;
        const c = contexte(); if (!c) return;
        // Bus de la marche : son direct + réverbération, vers le volume de la musique
        const bus = c.createGain();
        const reverb = salle(c), mouille = c.createGain();
        mouille.gain.value = 0.4;
        bus.connect(sortieMusique);
        bus.connect(reverb).connect(mouille).connect(sortieMusique);
        marche = { bus, prochain: c.currentTime + 0.1, pas: 0, minuterie: setInterval(programmer_marche, 50) };
        programmer_marche();
    }
    function arreter_marche() {
        if (!marche) return;
        clearInterval(marche.minuterie);
        const bus = marche.bus, c = contexte();
        if (c) { bus.gain.setTargetAtTime(0, c.currentTime, 0.08); setTimeout(() => bus.disconnect(), 1500); }
        marche = null;
    }
    function programmer_marche() {
        const c = contexte(); if (!c || !marche) return;
        const croche = 60 / 100 / 2;
        while (marche.prochain < c.currentTime + 0.3) {
            jouer_croche(marche.pas, marche.prochain, croche);
            marche.prochain += croche;
            marche.pas = (marche.pas + 1) % MELODIE.length;
        }
    }

    /* Une voix d'instrument : oscillateurs désaccordés, filtre passe-bas, enveloppe
       douce. vibrato (en cents) : ondulation de la hauteur qui arrive après l'attaque,
       comme un violoniste. */
    function voix(f, t, duree, { vol, type = 'sawtooth', filtre = 1400, attaque = 0.05, sortie = 0.18, desaccord = [-6, 6], brillance = 1.6, vibrato = 0 }) {
        const c = contexte();
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + attaque);
        g.gain.setValueAtTime(vol, t + Math.max(attaque, duree - sortie));
        g.gain.exponentialRampToValueAtTime(0.0001, t + duree + sortie);
        const fl = c.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.setValueAtTime(filtre * 0.6, t);
        fl.frequency.exponentialRampToValueAtTime(filtre * brillance, t + attaque * 2);
        fl.frequency.exponentialRampToValueAtTime(filtre, t + attaque * 4);
        fl.connect(g).connect(marche.bus);
        let lfo = null, profondeur = null;
        if (vibrato) {
            lfo = c.createOscillator();
            lfo.frequency.value = 5.5;
            profondeur = c.createGain();
            profondeur.gain.setValueAtTime(0, t);
            profondeur.gain.linearRampToValueAtTime(vibrato, t + Math.min(0.35, duree * 0.6));
            lfo.connect(profondeur);
            lfo.start(t);
            lfo.stop(t + duree + sortie + 0.05);
        }
        for (const cents of desaccord) {
            const o = c.createOscillator();
            o.type = type;
            o.frequency.value = f;
            o.detune.value = cents;
            if (profondeur) profondeur.connect(o.detune);
            o.connect(fl);
            o.start(t);
            o.stop(t + duree + sortie + 0.05);
        }
    }
    const violons = (f, t, duree, vol) => voix(f, t, duree, { vol, filtre: 3200, attaque: 0.09, sortie: 0.2, desaccord: [-9, 0, 9], brillance: 1.3, vibrato: 14 });
    const cuivres = (f, t, duree, vol) => voix(f, t, duree, { vol, filtre: 1300, attaque: 0.06, sortie: 0.15, desaccord: [-7, 0, 7] });

    function jouer_croche(i, t, d) {
        const o = { sortie: marche.bus, absolu: true };
        const mesure = Math.floor(i / 8), dansMesure = i % 8, temps = Math.floor(dansMesure / 2);
        const accord = ACCORDS[GRILLE[mesure]], pont = PUPITRE[mesure] === 'violons';
        if (dansMesure % 2 === 0) {
            if (temps === 0 || (temps === 2 && !pont)) {
                ton(80, t, 0.45, { vol: pont ? 0.18 : 0.3, f2: 42, ...o });                                    // grosse caisse
                bruit(t, 0.06, { vol: 0.05, filtre: 500, ...o });
            } else if (!pont || temps === 3) {
                bruit(t, 0.22, { vol: pont ? 0.08 : 0.15, filtre: 2200, filtreFin: 900, type: 'bandpass', ...o });   // caisse claire
                ton(190, t, 0.1, { type: 'triangle', vol: 0.07, f2: 150, ...o });
            }
            // Contrebasse : fondamentale puis quinte
            voix(accord.basse[temps % 2], t, d * 1.6, { vol: 0.13, type: 'triangle', filtre: 500, attaque: 0.02, sortie: 0.12, desaccord: [0], brillance: 1.2 });
        } else if (temps === 3 && !pont) {
            bruit(t, 0.08, { vol: 0.05, filtre: 2500, type: 'bandpass', ...o });
        }
        // Roulement de caisse claire en fin de phrase (toutes les 4 mesures)
        if (mesure % 4 === 3 && dansMesure >= 4 && dansMesure < 7) bruit(t + d / 2, 0.1, { vol: 0.08, filtre: 2400, type: 'bandpass', ...o });
        // Nappe de cordes : l'accord de la mesure, tenu (plus présente pendant le pont)
        if (dansMesure === 0) for (const n of accord.notes) voix(NOTES[n], t, d * 7.5, { vol: pont ? 0.03 : 0.022, filtre: 1100, attaque: 0.35, sortie: 0.5, brillance: 1.1, vibrato: 8 });
        // La mélodie
        const n = MELODIE[i];
        if (n === '-' || n === '.') return;
        let tenue = 1;
        while (MELODIE[(i + tenue) % MELODIE.length] === '-' && tenue < 8) tenue++;
        const duree = d * tenue * 0.9, pupitre = PUPITRE[mesure];
        if (pupitre === 'cuivres' || pupitre === 'tutti') cuivres(NOTES[n], t, duree, pupitre === 'tutti' ? 0.035 : 0.045);
        if (pupitre === 'violons' || pupitre === 'tutti') violons(NOTES[n] * (pupitre === 'violons' ? 1 : 2), t, duree, pupitre === 'violons' ? 0.05 : 0.025);
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
        marcheActive: () => Boolean(marche),   // la marche de l'entraînement joue-t-elle ?
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
        estActif: () => actif,
        contexte,   // contexte Web Audio partagé (aussi utilisé par les sons de lootbox)
        ton,
        bouton: () => jouerEffet(sonBouton)
    };
})();
