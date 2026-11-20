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
        if (actif) lire(musique);
        else musique.pause();
    }

    function jouerEffet(audio) {
        if (!actif) return;
        // cloneNode permet de superposer plusieurs tirs rapprochés
        const copie = audio.cloneNode();
        copie.volume = audio.volume;
        lire(copie);
    }

    return {
        jouerAmbiance,
        arreterMusique,
        setActif,
        estActif: () => actif,
        tir: () => jouerEffet(sonTir),
        bouton: () => jouerEffet(sonBouton)
    };
})();
