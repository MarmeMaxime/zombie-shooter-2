/* =========================================================================
   LANGUES : français (langue d'origine du jeu), anglais, espagnol et zombie.
   - T('texte français', { variables }) renvoie le texte dans la langue choisie
     (dictionnaire : traductions.js) ; {x} est remplacé par la variable x.
   - La langue zombie est générée : chaque mot devient un grognement, toujours
     le même pour le même mot ; nombres, emojis et ponctuation restent lisibles.
   - Le texte écrit directement dans la page (index.html) est traduit au
     chargement ; changer de langue recharge la page.
   - Ce qui est marqué data-langue-fixe n'est jamais traduit (titre du jeu,
     noms des langues, pour pouvoir toujours revenir en arrière).
   ========================================================================= */
const LANGUES = {
    fr: { nom: 'Français', locale: 'fr-FR' },
    en: { nom: 'English', locale: 'en-GB' },
    es: { nom: 'Español', locale: 'es-ES' },
    zombie: { nom: 'Zombie 🧟', locale: 'fr-FR' }
};

const Langue = (() => {
    const options = Sauvegarde.donnees.options;
    const code = Object.hasOwn(LANGUES, options.langue) ? options.langue : 'fr';
    const colonne = { en: 0, es: 1 }[code];
    const manquants = new Set();   // textes sans traduction (pour les tests)

    // Grognements de base, étirés à la longueur du mot d'origine
    const GROGNEMENTS = ['grr', 'arrgh', 'brains', 'uuh', 'rhaa', 'mmh', 'gnn', 'hrr', 'blarg', 'aah', 'grou', 'urgh', 'braa', 'heuu'];
    function zombifier(texte) {
        return texte.replace(/\{[^}]+\}|[A-Za-zÀ-ÿŒœ]+(?:['’-][A-Za-zÀ-ÿŒœ]+)*/g, mot => {
            if (mot.startsWith('{') || mot.length < 2) return mot;
            let h = 0;
            for (const c of mot.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
            let z = GROGNEMENTS[h % GROGNEMENTS.length];
            const cible = Math.min(Math.max(mot.length, 3), 10);
            while (z.length < cible) z += z[z.length - 1];
            z = z.slice(0, Math.max(cible, 3));
            if (mot.length > 1 && mot === mot.toUpperCase()) return z.toUpperCase();
            if (mot[0] === mot[0].toUpperCase()) return z[0].toUpperCase() + z.slice(1);
            return z;
        });
    }

    function traduire(texte) {
        if (code === 'fr' || !texte) return texte;
        if (code === 'zombie') return zombifier(texte);
        const t = TRADUCTIONS[texte];
        if (t) return t[colonne];
        manquants.add(texte);
        return texte;
    }

    function T(texte, variables) {
        let res = traduire(texte);
        if (variables) for (const [k, v] of Object.entries(variables)) res = res.split(`{${k}}`).join(v);
        return res;
    }

    // Traduit les champs texte d'objets de données (noms, descriptions…) ; garde l'original dans _fr
    function traduire_objets(objets, champs) {
        for (const o of objets) {
            for (const c of champs) {
                if (typeof o[c] !== 'string') continue;
                (o._fr || (o._fr = {}))[c] = o[c];
                o[c] = T(o[c]);
            }
        }
    }

    // Texte de la page : nœuds texte et attributs title / aria-label
    function traduire_page(racine = document.body) {
        if (code === 'fr') return;
        const fixe = n => n.parentElement && n.parentElement.closest('[data-langue-fixe], script, style');
        const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
        const noeuds = [];
        while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
        for (const n of noeuds) {
            const brut = n.nodeValue, propre = brut.replace(/\s+/g, ' ').trim();
            if (!propre || !/[A-Za-zÀ-ÿ]{2}/.test(propre) || fixe(n)) continue;
            const debut = brut.match(/^\s*/)[0], fin = brut.match(/\s*$/)[0];
            n.nodeValue = debut + traduire(propre) + fin;
        }
        for (const el of racine.querySelectorAll('[title], [aria-label]')) {
            if (el.closest('[data-langue-fixe]')) continue;
            for (const a of ['title', 'aria-label']) if (el.hasAttribute(a)) el.setAttribute(a, traduire(el.getAttribute(a)));
        }
    }

    function choisir(nouveau) {
        if (!Object.hasOwn(LANGUES, nouveau) || nouveau === code) return;
        options.langue = nouveau;
        Sauvegarde.sauver();
        location.reload();   // tout le texte est recalculé dans la nouvelle langue
    }

    return { code, T, traduire_objets, traduire_page, choisir, manquants, locale: LANGUES[code].locale };
})();
const T = Langue.T;

// Données de la config affichées au joueur
Langue.traduire_objets(Object.values(CONFIG.personnages), ['nom', 'description']);
Langue.traduire_objets(Object.values(CONFIG.armes), ['nom']);
Langue.traduire_objets(Object.values(CONFIG.pouvoirs), ['nom', 'description']);
Langue.traduire_objets([CONFIG.boss, CONFIG.fossoyeur], ['nom']);
if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = Langue.code === 'zombie' ? 'fr' : Langue.code;
