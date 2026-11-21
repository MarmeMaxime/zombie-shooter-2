/* =========================================================================
   MODE VAGUES (en plus du mode classique, choisi au lancement)
   - Une vague = une liste de monstres qui arrivent un par un. Elle est finie
     quand tout est tué ; la partie se fige et la boutique s'ouvre.
   - Les espèces spéciales arrivent au fil des vagues (CONFIG.vagues), un boss
     toutes les 5 vagues (Mastodonte et Fossoyeur à tour de rôle, boss.js).
   - Boutique : on dépense ses points en améliorations, valables jusqu'à la
     fin de la partie (cadence, vitesse, recharge du pouvoir) ou en vies.
   Réglages : CONFIG.vagues.
   ========================================================================= */
const Vagues = (() => {
    const $v = id => document.getElementById(id);
    let numero = 0, file = [], chrono = 0, boutique = false;
    let niveaux = {};   // niveau de chaque amélioration achetée

    // Composition de la vague n (mélangée), boss en tête toutes les X vagues
    function composer(n) {
        const cfg = CONFIG.vagues;
        const liste = [];
        const bossVague = n % cfg.bossToutesLes === 0;
        const normaux = Math.round((cfg.normaux.base + cfg.normaux.parVague * n) * (bossVague ? 0.5 : 1));
        for (let k = 0; k < normaux; k++) liste.push('normal');
        for (const [type, [premiere, parVague, max]] of Object.entries(cfg.speciaux)) {
            const modes = TYPES_ZOMBIE[type].config.modes;
            if (n < premiere || (modes && !modes.includes(etat.mode))) continue;
            const nombre = Math.min(max, 1 + Math.floor((n - premiere) * parVague));
            for (let k = 0; k < nombre * (bossVague ? 0.5 : 1); k++) liste.push(type);
        }
        for (let i = liste.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [liste[i], liste[j]] = [liste[j], liste[i]]; }
        if (bossVague) liste.unshift('boss');
        return liste;
    }

    const intervalle = () => Math.max(CONFIG.vagues.intervalle.min, CONFIG.vagues.intervalle.depart - CONFIG.vagues.intervalle.parVague * numero);

    function demarrer() {
        numero = 0;
        etat.vies = CONFIG.vagues.viesDepart;
        maj_hud();
        niveaux = { cadence: 0, vitesse: 0, pouvoir: 0 };
        boutique = false;
        $v('hud-vague').classList.remove('hidden');
        // Pas d'achat de vie par V : on cache le prix et le bouton tactile
        $v('hud-prix-vie').classList.add('hidden');
        $v('btn-touch-buy').classList.add('hidden');
        suivante();
    }

    function suivante() {
        numero++;
        etat.vague = numero;
        file = composer(numero);
        chrono = -CONFIG.vagues.pause;
        boutique = false;
        // Bandeau « VAGUE n » au centre de l'écran
        const b = $v('bandeau-vague');
        b.textContent = file[0] === 'boss' ? T('VAGUE {n} · BOSS', { n: numero }) : T('VAGUE {n}', { n: numero });
        b.classList.remove('hidden', 'anime');
        void b.offsetWidth;   // relance l'animation
        b.classList.add('anime');
        maj_hud_vague();
    }

    // Appelée à chaque image à la place des apparitions du mode classique (zombie.js)
    function maj(dt) {
        if (boutique) return;
        chrono += dt;
        while (file.length && chrono >= 0) {
            const type = file.shift();
            if (type === 'boss') faire_apparaitre_boss(MONDE.largeur, MONDE.hauteur);
            else creer_zombie(type, MONDE.largeur, MONDE.hauteur);
            chrono -= intervalle();
        }
        maj_hud_vague();
        if (!file.length && !zombies.length && !boss && etat.enCours) terminer();
    }

    let restantAffiche = -1;
    function maj_hud_vague() {
        const reste = file.length + zombies.length;
        if (reste === restantAffiche && $v('vague-num').textContent === String(numero)) return;
        restantAffiche = reste;
        $v('vague-num').textContent = numero;
        $v('vague-reste').textContent = reste;
    }

    function terminer() {
        boutique = true;
        const st = Sauvegarde.donnees.stats;
        st.meilleureVague = Math.max(st.meilleureVague || 0, numero);
        if (typeof Succes !== 'undefined') Succes.verifier();
        Son.effet('succes');
        mettre_en_pause(true, false);   // la partie attend, sans l'écran « PAUSE »
        ouvrir_boutique();
    }

    /* ---------- Boutique ---------- */
    const ARTICLES = [
        {
            id: 'vie', nom: 'Une vie de plus', desc: 'Pour encaisser un coup de plus.',
            prix: () => etat.prixVie, max: Infinity, niveau: () => null,
            acheter() { etat.score -= etat.prixVie; etat.vies++; etat.prixVie = Math.min(CONFIG.prixVieMax, Math.floor(etat.prixVie * CONFIG.multiplicateurPrixVie)); }
        },
        {
            id: 'cadence', nom: 'Cadence de tir', desc: 'Tu tires plus souvent (+11 % par niveau).',
            effet() { joueur.multCadence *= CONFIG.vagues.boutique.cadence.effet; }
        },
        {
            id: 'vitesse', nom: 'Bottes de course', desc: 'Tu te déplaces plus vite (+8 % par niveau).',
            effet() { joueur.vitesse *= CONFIG.vagues.boutique.vitesse.effet; }
        },
        {
            id: 'pouvoir', nom: 'Entraînement spécial', desc: 'Ton pouvoir se recharge plus vite (-15 % de victimes à faire).',
            effet() { pouvoir.reduction *= CONFIG.vagues.boutique.pouvoir.effet; maj_hud_pouvoir(); }
        }
    ];
    // Les améliorations à niveaux : prix qui monte à chaque niveau, niveau maximum
    for (const a of ARTICLES.slice(1)) {
        const cfg = () => CONFIG.vagues.boutique[a.id];
        a.prix = () => Math.round(cfg().prix * Math.pow(cfg().hausse, niveaux[a.id]));
        a.max = cfg().max;
        a.niveau = () => niveaux[a.id];
        a.acheter = () => { etat.score -= a.prix(); niveaux[a.id]++; a.effet(); };
    }
    const disponible = a => (a.niveau() === null || a.niveau() < a.max) && etat.score >= a.prix();

    function acheter(a) {
        if (!disponible(a)) return;
        a.acheter();
        Son.effet('pouvoirPret');
        maj_hud();   // score et vies de la barre du haut (main.js)
        remplir();
    }

    function remplir() {
        $v('boutique-titre').textContent = T('VAGUE {n} TERMINÉE', { n: numero });
        $v('boutique-points').textContent = etat.score;
        $v('boutique-liste').replaceChildren(...ARTICLES.map(a => {
            const ligne = document.createElement('button');
            const n = a.niveau(), complet = n !== null && n >= a.max;
            ligne.className = 'article' + (disponible(a) ? '' : ' indisponible');
            const texte = document.createElement('span');
            texte.className = 'article-texte';
            const titre = document.createElement('strong');
            titre.textContent = T(a.nom) + (n === null ? '' : ' ' + '●'.repeat(n) + '○'.repeat(a.max - n));
            const desc = document.createElement('small');
            desc.textContent = T(a.desc);
            texte.append(titre, desc);
            const prix = document.createElement('span');
            prix.className = 'article-prix';
            prix.textContent = complet ? T('MAX') : `${a.prix()} pts`;
            ligne.append(texte, prix);
            ligne.addEventListener('click', () => acheter(a));
            return ligne;
        }));
    }

    function ouvrir_boutique() {
        remplir();
        $v('boutique-overlay').classList.remove('hidden');
    }
    function vague_suivante() {
        if (!boutique) return;
        $v('boutique-overlay').classList.add('hidden');
        mettre_en_pause(false);
        suivante();
    }
    $v('btn-vague-suivante').addEventListener('click', vague_suivante);

    function arreter() {
        boutique = false;
        file = [];
        $v('boutique-overlay').classList.add('hidden');
        $v('hud-vague').classList.add('hidden');
        $v('hud-prix-vie').classList.remove('hidden');
        $v('btn-touch-buy').classList.remove('hidden');
        $v('bandeau-vague').classList.add('hidden');
    }

    // Pour le simulateur : achats d'un joueur prudent (vie si besoin, sinon la moins chère)
    function achats_automatiques() {
        for (let essais = 0; essais < 20; essais++) {
            const vie = ARTICLES[0];
            const choix = etat.vies < 4 && disponible(vie) ? vie
                : ARTICLES.slice(1).filter(disponible).sort((x, y) => x.prix() - y.prix())[0] || (disponible(vie) ? vie : null);
            if (!choix) return;
            choix.acheter();
        }
    }

    return {
        demarrer, maj, arreter, vague_suivante, achats_automatiques,
        enBoutique: () => boutique,
        numero: () => numero
    };
})();
