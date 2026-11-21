/* =========================================================================
   ÉCRAN TITRE ET FOND ANIMÉ DU MENU
   Derrière le titre et les menus, une petite démo tourne : des zombies
   avancent dans le décor et le personnage choisi (avec son skin) les abat.
   Elle s'arrête pendant les parties pour ne rien coûter.
   ========================================================================= */
(() => {
    const toile = document.getElementById('fond-anime');
    const c = toile.getContext('2d');
    const H = 400;                      // même hauteur de référence que le jeu
    let echelle = 1, L = 800;
    let zombiesDemo = [], ballesDemo = [], mortsDemo = [];
    let chronoApparition = 0, chronoTir = 1, dernier = performance.now();
    const perso = { y: 200, animTir: 0 };

    function redimensionner() {
        const dpr = window.devicePixelRatio || 1;
        toile.width = Math.round(toile.clientWidth * dpr);
        toile.height = Math.round(toile.clientHeight * dpr);
        echelle = toile.height / H;
        L = toile.width / echelle;
    }
    window.addEventListener('resize', redimensionner);

    function apparition() {
        const r = Math.random();
        const type = r < 0.6 ? 'normal' : r < 0.74 ? 'tank' : r < 0.85 ? 'joggeur' : r < 0.94 ? 'emeute' : 'magicalgirl';
        zombiesDemo.push({
            type, x: L + 20, y: 50 + Math.random() * 270, taille: 64,
            vitesse: 25 + Math.random() * 30, etape: 0, tempsImage: 0, pv: type === 'tank' || type === 'emeute' ? 3 : 1
        });
    }

    function mettre_a_jour(dt) {
        chronoApparition -= dt;
        if (chronoApparition <= 0) { apparition(); chronoApparition = 1.4 + Math.random() * 1.2; }

        for (const z of zombiesDemo) {
            const type = TYPES_ZOMBIE[z.type];
            z.x -= z.vitesse * dt;
            z.tempsImage += dt;
            if (z.tempsImage >= type.config.dureeImage) { z.tempsImage = 0; z.etape = (z.etape + 1) % type.images.length; }
        }
        zombiesDemo = zombiesDemo.filter(z => z.x > -80);

        // Le personnage vise le zombie le plus proche et tire
        const cible = zombiesDemo.filter(z => z.x < L * 0.85).sort((a, b) => a.x - b.x)[0];
        if (cible) perso.y += Math.sign(cible.y - perso.y) * Math.min(Math.abs(cible.y - perso.y), 90 * dt);
        chronoTir -= dt;
        perso.animTir = Math.max(0, perso.animTir - dt);
        if (cible && chronoTir <= 0 && Math.abs(cible.y - perso.y) < 10) {
            chronoTir = 0.7;
            perso.animTir = 0.25;
            ballesDemo.push({ x: 60 + CONFIG.canon.x, y: perso.y + CONFIG.canon.y });
        }

        for (const b of ballesDemo) {
            b.x += 700 * dt;
            const touche = zombiesDemo.find(z => b.x > z.x + 12 && b.x < z.x + 52 && b.y > z.y + 12 && b.y < z.y + 52);
            if (touche) {
                b.fini = true;
                if (--touche.pv <= 0) {
                    zombiesDemo.splice(zombiesDemo.indexOf(touche), 1);
                    mortsDemo.push({ ...touche, age: 0 });
                }
            }
        }
        ballesDemo = ballesDemo.filter(b => !b.fini && b.x < L);
        for (const m of mortsDemo) m.age += dt;
        mortsDemo = mortsDemo.filter(m => m.age < 0.8);
    }

    function dessiner() {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.imageSmoothingEnabled = true;
        c.drawImage(img_fond, 0, 0, toile.width, toile.height);
        c.setTransform(echelle, 0, 0, echelle, 0, 0);
        c.imageSmoothingEnabled = false;

        for (const m of mortsDemo) {
            const t = m.age / 0.8;
            c.save();
            c.globalAlpha = 1 - t;
            c.translate(m.x + 32, m.y + 64);
            c.rotate(Math.min(1, m.age / 0.3) * Math.PI / 2);
            c.drawImage(TYPES_ZOMBIE[m.type].images[m.etape], -32, -64, 64, 64);
            c.restore();
        }
        for (const z of zombiesDemo) c.drawImage(TYPES_ZOMBIE[z.type].images[z.etape], z.x, z.y, z.taille, z.taille);

        c.fillStyle = '#ffd541';
        for (const b of ballesDemo) c.fillRect(b.x, b.y, 14, 4);

        // Personnage choisi, avec son skin équipé
        const idPerso = typeof perso_choisi !== 'undefined' ? perso_choisi : 'soldat';
        const sprites = Loot.sprites(idPerso);
        const filtre = Loot.filtre(idPerso, performance.now() / 1000);
        c.save();
        if (filtre) c.filter = filtre;
        c.drawImage(perso.animTir > 0 ? sprites.tir : sprites.arret, 60, perso.y, 64, 64);
        c.restore();
    }

    function boucle(instant) {
        const dt = Math.min(0.05, (instant - dernier) / 1000);
        dernier = instant;
        // Pendant une partie, le fond est caché : on ne calcule rien
        if (!etat.enCours && !document.hidden) {
            if (toile.width !== Math.round(toile.clientWidth * (window.devicePixelRatio || 1))) redimensionner();
            mettre_a_jour(dt);
            dessiner();
        }
        requestAnimationFrame(boucle);
    }

    redimensionner();
    for (let i = 0; i < 3; i++) { apparition(); zombiesDemo[i].x = L * (0.45 + i * 0.2); }
    requestAnimationFrame(boucle);
})();

/* ---------- Écran titre : « Appuie sur une touche » ---------- */
(() => {
    const ecran = document.getElementById('ecran-titre');
    let parti = false;
    function entrer(e) {
        if (parti) return;
        if (e && e.type === 'keydown') e.preventDefault();   // la touche ne déclenche rien d'autre
        parti = true;
        Son.bouton();
        ecran.classList.add('sortie');
        document.getElementById('game-container').classList.remove('titre-actif');   // le menu apparaît
        setTimeout(() => ecran.classList.add('hidden'), 600);
        document.removeEventListener('keydown', entrer);
    }
    document.addEventListener('keydown', entrer);
    ecran.addEventListener('pointerdown', entrer);
})();
