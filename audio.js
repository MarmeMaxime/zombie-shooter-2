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

    let actif = false;          // coupé par défaut (les navigateurs bloquent l'autoplay)
    let ambiance = null;        // 'menu' | 'normal' | 'hardcore' | null
    let indexHardcore = 0;

    // play() renvoie une promesse rejetée si le navigateur refuse la lecture
    const lire = (audio) => audio.play().catch(() => {});

    function chargerPiste(src, volume, enBoucle) {
        musique.src = src;
        musique.volume = volume;
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
    }

    function setActif(valeur) {
        actif = valeur;
        if (!ambiance) return;
        if (actif && !suspendue) lire(musique);
        else musique.pause();
    }

    // Silence temporaire (écran des caisses) : la musique reprend là où elle s'était arrêtée
    let suspendue = false;
    function suspendreMusique() { suspendue = true; musique.pause(); }
    function reprendreMusique() { suspendue = false; if (actif && ambiance) lire(musique); }

    // vitesse < 1 : son plus grave (chaque arme a ainsi sa propre détonation)
    function jouerEffet(audio, vitesse = 1) {
        if (!actif) return;
        // cloneNode permet de superposer plusieurs tirs rapprochés
        const copie = audio.cloneNode();
        copie.volume = audio.volume;
        copie.preservesPitch = false;
        copie.playbackRate = vitesse;
        lire(copie);
    }

    /* ---------- Bruitages synthétisés (Web Audio, aucun fichier) ---------- */
    let ac = null, bruitBlanc = null;
    function contexte() {
        if (!ac) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ac = new AC();
            // 1 s de bruit blanc, réutilisé pour les détonations et explosions
            bruitBlanc = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
            const d = bruitBlanc.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        if (ac.state === 'suspended') ac.resume();
        return ac;
    }

    // Souffle filtré : coup de feu, explosion, pas lourd…
    function bruit(debut, duree, { vol = 0.3, filtre = 1200, filtreFin = null, type = 'lowpass' } = {}) {
        const c = contexte(); if (!c || !actif) return;
        const t = c.currentTime + debut;
        const src = c.createBufferSource(); src.buffer = bruitBlanc;
        const f = c.createBiquadFilter(); f.type = type;
        f.frequency.setValueAtTime(filtre, t);
        if (filtreFin) f.frequency.exponentialRampToValueAtTime(filtreFin, t + duree);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
        src.connect(f).connect(g).connect(c.destination);
        src.start(t, Math.random() * 0.5); src.stop(t + duree + 0.05);
    }

    function ton(f1, debut, duree, { type = 'sine', vol = 0.2, f2 = null } = {}) {
        const c = contexte(); if (!c || !actif) return;
        const t = c.currentTime + debut;
        const o = c.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(f1, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + duree);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
        o.connect(g).connect(c.destination);
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
        succes: () => [784, 988, 1175, 1568].forEach((f, i) => ton(f, i * 0.09, 0.35, { type: 'triangle', vol: 0.15 })),
        degat: () => { ton(220, 0, 0.25, { type: 'square', vol: 0.12, f2: 90 }); bruit(0, 0.15, { vol: 0.15, filtre: 800 }); }
    };

    return {
        jouerAmbiance,
        effet: nom => { if (BRUITAGES[nom]) BRUITAGES[nom](); },
        arreterMusique,
        setActif,
        suspendreMusique,
        reprendreMusique,
        estActif: () => actif,
        tir: (vitesse) => jouerEffet(sonTir, vitesse),
        bouton: () => jouerEffet(sonBouton)
    };
})();
