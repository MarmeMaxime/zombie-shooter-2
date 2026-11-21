/* =========================================================================
   SAUVEGARDE
   - Une seule sauvegarde, versionnée, dans le stockage du navigateur.
   - Un historique de points de restauration (automatiques).
   - Export / import en fichier .json.

   Résistance aux mises à jour :
   - Chaque sauvegarde porte un numéro de version. Une mise à jour qui change
     le format ajoute une MIGRATION (voir plus bas) : les anciennes
     sauvegardes sont converties, jamais effacées.
   - Les champs manquants reprennent leur valeur par défaut, les champs de
     mauvais type aussi : une sauvegarde incomplète reste utilisable.
   - Les champs inconnus (venant d'une version plus récente) sont conservés.
   - Une sauvegarde illisible est mise de côté, pas supprimée.
   ========================================================================= */
const Sauvegarde = (() => {
    const FORMAT = 'zombie-shooter-2';
    const VERSION = 1;
    const CLE = 'zs2-sauvegarde';
    const CLE_HISTORIQUE = 'zs2-historique';
    const CLE_CORROMPUE = 'zs2-sauvegarde-illisible';
    const TAILLE_HISTORIQUE = 15;

    const defauts = () => ({
        perso: 'soldat',
        loot: { cranes: 0, possedes: [], dechets: {}, equipes: {}, ouvertes: 0, depuisLegendaire: 0 },
        // Ajoutés après coup : les anciennes sauvegardes les reçoivent vides, sans migration
        stats: { tues: {}, parties: 0, bossTues: 0, persosJoues: [], meilleurTemps: {}, meilleurScore: {}, mythiques: 0, persos: {}, esquives: 0, sprintsStoppes: 0, bouclierBrises: 0, pouvoirs: 0, soins: 0, esquivesBoxeur: 0 },
        succes: [],
        missions: [],
        persosDebloques: ['soldat'],
        son: { actif: true, musique: 0.8, effets: 0.8, vibrations: true },   // réglages du son (activé de base)
        bestiaire: [],
        titre: ''
    });

    /* ---------- Migrations ----------
       MIGRATIONS[n] transforme des données de version n-1 en version n.
       Exemple pour une future v2 qui renommerait « cranes » en « monnaie » :
         2: d => { d.loot.monnaie = d.loot.cranes; delete d.loot.cranes; return d; }
       puis passer VERSION à 2. Rien d'autre à faire. */
    const MIGRATIONS = {
        // v0 = avant ce système : progression éparpillée dans plusieurs clés
        1: d => d
    };

    /* ---------- Outils ---------- */
    const lire = cle => { try { return localStorage.getItem(cle); } catch { return null; } };
    const ecrire = (cle, valeur) => { try { localStorage.setItem(cle, valeur); return true; } catch { return false; } };
    const copie = o => JSON.parse(JSON.stringify(o));
    const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v);

    // Prend les valeurs de « source » quand leur type correspond à celui du défaut.
    // Les clés absentes des défauts sont gardées telles quelles (futures versions).
    function fusionner(defaut, source) {
        if (!estObjet(source)) return copie(defaut);
        const res = { ...source };
        for (const cle of Object.keys(defaut)) {
            const d = defaut[cle], s = source[cle];
            if (estObjet(d)) res[cle] = estObjet(s) ? (Object.keys(d).length ? fusionner(d, s) : { ...s }) : copie(d);
            else if (Array.isArray(d)) res[cle] = Array.isArray(s) ? s.slice() : copie(d);
            else if (typeof d === 'number') res[cle] = (typeof s === 'number' && Number.isFinite(s) && s >= 0) ? s : d;
            else res[cle] = typeof s === typeof d ? s : d;
        }
        return res;
    }

    function migrer(version, donnees) {
        let v = Number.isInteger(version) ? version : 0;
        let d = donnees;
        while (v < VERSION) {
            v++;
            if (MIGRATIONS[v]) d = MIGRATIONS[v](d);
        }
        return fusionner(defauts(), d);
    }

    // Empreinte FNV-1a : détecte un fichier abîmé ou retouché à la main
    function empreinte(texte) {
        let h = 0x811c9dc5;
        for (let i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
        return h.toString(16).padStart(8, '0');
    }

    /* ---------- Chargement ---------- */
    function charger() {
        const brut = lire(CLE);
        if (brut) {
            try {
                const obj = JSON.parse(brut);
                if (obj && obj.format === FORMAT) {
                    // Sauvegarde d'une version plus récente du jeu : on lit ce qu'on comprend,
                    // et les champs inconnus restent intacts grâce à fusionner().
                    return { version: Math.max(obj.version || 0, VERSION), donnees: migrer(Math.min(obj.version || 0, VERSION), obj.donnees) };
                }
            } catch { /* illisible : traité juste en dessous */ }
            ecrire(CLE_CORROMPUE, brut);   // on garde une copie, au cas où

            // Sauvegarde illisible : on repart du point de restauration le plus récent
            try {
                const h = JSON.parse(lire(CLE_HISTORIQUE));
                if (Array.isArray(h) && h[0] && estObjet(h[0].donnees)) {
                    return { version: VERSION, donnees: migrer(Math.min(h[0].version || 1, VERSION), h[0].donnees) };
                }
            } catch { /* pas d'historique exploitable */ }
        }

        // Pas de sauvegarde au nouveau format : on récupère l'ancienne progression (v0)
        const ancien = defauts();
        try { const l = JSON.parse(lire('zs2-loot')); if (estObjet(l)) ancien.loot = l; } catch { /* rien */ }
        const p = lire('perso'); if (p) ancien.perso = p;
        return { version: VERSION, donnees: migrer(0, ancien) };
    }

    const etat = charger();
    let versionFichier = etat.version;
    const donnees = etat.donnees;

    function serialiser() {
        return JSON.stringify({ format: FORMAT, version: versionFichier, modifie: new Date().toISOString(), donnees });
    }

    function sauver() {
        ecrire(CLE, serialiser());
    }

    sauver();   // écrit tout de suite au nouveau format (migration faite une fois pour toutes)

    /* ---------- Historique ---------- */
    function historique() {
        try { const h = JSON.parse(lire(CLE_HISTORIQUE)); return Array.isArray(h) ? h : []; } catch { return []; }
    }

    function point_de_restauration(raison) {
        const h = historique();
        const dernier = h[0];
        const instantane = JSON.stringify(donnees);
        if (dernier && JSON.stringify(dernier.donnees) === instantane) return;   // rien n'a changé
        h.unshift({ date: new Date().toISOString(), raison, version: versionFichier, donnees: JSON.parse(instantane) });
        ecrire(CLE_HISTORIQUE, JSON.stringify(h.slice(0, TAILLE_HISTORIQUE)));
    }

    function remplacer(nouvelles) {
        for (const cle of Object.keys(donnees)) delete donnees[cle];
        Object.assign(donnees, nouvelles);
        sauver();
    }

    function restaurer(index) {
        const entree = historique()[index];
        if (!entree) return false;
        point_de_restauration('Avant restauration');
        remplacer(migrer(Math.min(entree.version || 1, VERSION), entree.donnees));
        return true;
    }

    /* ---------- Fichier ---------- */
    function telecharger() {
        const contenu = { format: FORMAT, version: versionFichier, exporteLe: new Date().toISOString(), donnees };
        contenu.empreinte = empreinte(JSON.stringify(donnees));
        const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' });
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(blob);
        lien.download = `zombie-shooter-2-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(lien);
        lien.click();
        lien.remove();
        setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
    }

    // Renvoie { ok, message, retouche } ; n'applique rien si le fichier est invalide
    function analyser(texte) {
        let obj;
        try { obj = JSON.parse(texte); } catch { return { ok: false, message: 'Ce fichier n\'est pas une sauvegarde lisible.' }; }
        if (!obj || obj.format !== FORMAT || !estObjet(obj.donnees)) {
            return { ok: false, message: 'Ce fichier n\'est pas une sauvegarde de Zombie Shooter 2.' };
        }
        const retouche = obj.empreinte !== empreinte(JSON.stringify(obj.donnees));
        return { ok: true, obj, retouche };
    }

    function importer(obj) {
        point_de_restauration('Avant import');
        versionFichier = Math.max(obj.version || 0, VERSION);
        remplacer(migrer(Math.min(obj.version || 0, VERSION), obj.donnees));
    }

    return {
        donnees,          // objet vivant : les autres modules lisent et modifient dedans, puis appellent sauver()
        sauver,
        point_de_restauration,
        historique,
        restaurer,
        telecharger,
        analyser,
        importer,
        VERSION
    };
})();
