/* =========================================================================
   BESTIAIRE
   Une fiche par monstre : sprite, description (pas très sérieuse), conseil et
   nombre de victimes. Un monstre est « découvert » dès qu'il apparaît dans
   une partie (Sauvegarde.donnees.bestiaire) ; les autres restent des
   silhouettes. Une ancienne sauvegarde découvre ceux qu'elle a déjà tués.
   ========================================================================= */
const FICHES = [
    {
        type: 'normal', nom: 'Le Zombie',
        description: 'Le modèle de base. Pas de permis, pas de projet de vie, juste une envie irrépressible de te croquer la cervelle. Il traîne des pieds depuis 2009 et ne compte pas s\'arrêter.',
        conseil: 'Une balle suffit. Le problème, c\'est qu\'ils sont des centaines.'
    },
    {
        type: 'tank', nom: 'Le Tank',
        description: 'Ancienne videuse de boîte de nuit. Elle ne laisse toujours entrer personne, sauf que maintenant elle te mange aussi. Il faut trois balles pour qu\'elle remarque qu\'elle saigne. Et elle déteste qu\'on l\'appelle « le » Tank : c\'est une question de respect.',
        conseil: '3 PV : vise-la tôt, avant qu\'elle soit sur toi.'
    },
    {
        type: 'magicalgirl', nom: 'La Magical Girl', hardcore: true,
        description: 'Elle a signé un contrat avec une adorable créature sans bouche. Elle aurait dû lire les petites lignes. Elle se téléporte dans un nuage de paillettes, ce qui reste plus classe que ta façon de marcher.',
        conseil: 'Un cercle rose annonce où elle va réapparaître : vise-le.'
    },
    {
        type: 'joggeur', nom: 'Le Joggeur',
        description: 'Mort pendant son semi-marathon, il a décidé de finir la course quand même. Quand il crie, c\'est qu\'il a repéré la ligne d\'arrivée : toi.',
        conseil: 'Sors de sa ligne quand il crie, puis abats-le pendant qu\'il reprend son souffle.'
    },
    {
        type: 'emeute', nom: 'L\'Anti-émeute',
        description: 'Il maintient l\'ordre bien après sa mort. Son bouclier encaisse tout, et il n\'a visiblement rien retenu des cours de physique : la foudre s\'arrête net sur lui.',
        conseil: 'Il ne perd qu\'un PV par tir, quelle que soit l\'arme.'
    },
    {
        type: 'pondeuse', nom: 'La Pondeuse',
        description: 'Elle attend un heureux événement. Plusieurs, en fait. Personne n\'a osé demander qui était le père. Au premier tir, elle éclate et tout le monde fait connaissance.',
        conseil: 'Tue-la de loin : ses larves auront plus de chemin à faire.'
    },
    {
        type: 'larve', nom: 'La Larve',
        description: 'Blanche, molle et pressée. Ce sont les enfants de la Pondeuse : ils ont hérité de son appétit, mais pas de sa lenteur. Elles ne t\'appelleront jamais maman.',
        conseil: 'Une balle chacune, mais elles arrivent par trois.'
    },
    {
        type: 'infirmier', nom: 'L\'Infirmier',
        description: 'Toujours de garde, malgré trois arrêts cardiaques dont le sien. Il soigne les autres zombies mais jamais lui-même : le règlement interdit l\'automédication.',
        conseil: 'Abats-le en premier, sinon tu recommences tout.'
    },
    {
        type: 'boxeur', nom: 'Le Boxeur', hardcore: true,
        description: 'Ancien champion poids moyen. Il esquive les balles comme il esquivait les impôts. Mais une seule fois : ensuite il doit reprendre son souffle, comme à la fin de chaque round.',
        conseil: 'Tire une fois pour le faire bouger, puis achève-le pendant qu\'il transpire.'
    },
    {
        type: 'boss', nom: 'Le Mastodonte', boss: true,
        description: 'Deux mètres cinquante de chair verdâtre. Des pustules qui clignotent comme des guirlandes de Noël, une haleine qui décolle le papier peint, un crachat d\'acide qui troue le bitume. Elle sent le fromage oublié tout l\'été dans une voiture. Les autres zombies changent de trottoir quand elle passe. Et pourtant… elle t\'aime. Vraiment. Chaque crachat est une déclaration, chaque zombie qu\'elle invoque, un bouquet de fleurs. Son petit nom, c\'est Alana.',
        conseil: 'Elle arrive une fois sur deux. Sors de la ligne de son crachat. Ne lui brise pas le cœur trop vite.'
    },
    {
        type: 'fossoyeur', nom: 'Le Fossoyeur', boss: true,
        description: 'Il a enterré tout le village, puis le village d\'à côté, puis lui-même. Il ne s\'en est jamais remis. Maintenant il creuse pour les autres, il te réserve une place au premier rang et il prend les mesures à distance, à coups de pelle. Il est très professionnel : chaque tombe est livrée avec son occupant.',
        conseil: 'Sors du cercle avant que la pelletée tombe. Casse les tombes avant qu\'elles s\'ouvrent, ou tape le patron.'
    }
];

Langue.traduire_objets(FICHES, ['nom', 'description', 'conseil']);

const Bestiaire = (() => {
    const decouverts = () => Sauvegarde.donnees.bestiaire;
    const fiche = type => FICHES.find(f => f.type === type);

    // Ancienne sauvegarde : les monstres déjà tués sont découverts
    for (const f of FICHES) {
        if (!decouverts().includes(f.type) && (Sauvegarde.donnees.stats.tues[f.type] || 0) > 0) decouverts().push(f.type);
    }

    // Appelée à la première apparition d'un monstre dans une partie (zombie.js)
    function rencontre(type) {
        if (decouverts().includes(type) || !fiche(type)) return;
        decouverts().push(type);
        Sauvegarde.sauver();
        Succes.notifier(T('📖 Nouveau monstre dans le bestiaire : {nom}', { nom: fiche(type).nom }));
    }

    /* ---------- Écran ---------- */
    const $b = id => document.getElementById(id);

    // Sprite (image ou canvas) recadré dans une petite vignette
    function vignette(type, connu) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        c.className = 'bestiaire-sprite' + (connu ? '' : ' inconnu');
        const img = TYPES_ZOMBIE[type] && TYPES_ZOMBIE[type].images[0];
        if (img) {
            const g = c.getContext('2d');
            g.imageSmoothingEnabled = false;
            const dessiner = () => g.drawImage(img, 0, 0, 64, 64);   // le boss (128 px) est réduit
            if (img.complete === false) img.addEventListener('load', dessiner, { once: true }); else dessiner();
        }
        return c;
    }

    function remplir() {
        const connus = FICHES.filter(f => decouverts().includes(f.type)).length;
        $b('bestiaire-compte').textContent = T('{a} / {b} monstres découverts', { a: connus, b: FICHES.length });
        $b('bestiaire-liste').replaceChildren(...FICHES.map(f => {
            const connu = decouverts().includes(f.type);
            const ligne = document.createElement('div');
            ligne.className = 'bestiaire-fiche' + (connu ? '' : ' inconnu') + (f.boss ? ' boss' : '');

            const texte = document.createElement('div');
            texte.className = 'bestiaire-texte';
            const nom = document.createElement('strong');
            nom.textContent = connu ? f.nom : '???';
            if (f.hardcore || f.boss) {
                const tag = document.createElement('span');
                tag.className = 'bestiaire-tag';
                tag.textContent = f.boss ? T('BOSS') : T('Hardcore').toUpperCase();
                nom.append(' ', tag);
            }
            const desc = document.createElement('p');
            desc.textContent = connu ? f.description : T(f.hardcore ? 'Pas encore rencontré. Il rôde en hardcore…' : 'Pas encore rencontré.');
            texte.append(nom, desc);
            if (connu) {
                const conseil = document.createElement('small');
                conseil.textContent = T('💡 {conseil} · Tués : {n}', { conseil: f.conseil, n: Sauvegarde.donnees.stats.tues[f.type] || 0 });
                texte.append(conseil);
            }
            ligne.append(vignette(f.type, connu), texte);
            return ligne;
        }));
    }

    $b('btn-bestiaire').addEventListener('click', () => {
        remplir();
        $b('bestiaire-overlay').classList.remove('hidden');
    });
    $b('btn-close-bestiaire').addEventListener('click', () => $b('bestiaire-overlay').classList.add('hidden'));

    return { rencontre };
})();
