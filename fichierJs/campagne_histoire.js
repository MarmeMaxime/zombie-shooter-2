/* =========================================================================
   L'HISTOIRE DE LA CAMPAGNE (les données ; le moteur est dans campagne.js)
   - CHAPITRES : les chapitres et leur titre.
   - MISSIONS_CAMPAGNE : chaque mission, son objectif, ses apparitions et les
     mots du Sergent à la fin.
   - SCENES_CAMPAGNE : l'intro de chaque mission (décor de la scène et
     répliques). Les personnages ne parlent que de l'histoire, jamais du jeu.
   Pour ajouter une mission : une entrée dans MISSIONS_CAMPAGNE, sa scène
   dans SCENES_CAMPAGNE, et ses textes dans traductions.js.
   ========================================================================= */
const CHAPITRES = [
    { numero: 1, titre: 'La Recrue' },
    { numero: 2, titre: 'Le Cogneur' }
];

/* apparition : intervalle entre deux zombies (de « depart » à « min » secondes,
   il raccourcit de « acceleration » par seconde), « groupe » : chance qu'un
   second arrive en même temps, « max » : zombies à l'écran au plus.
   nuit : la mission se joue dans le noir, à la lampe torche. */
const MISSIONS_CAMPAGNE = [
    {
        id: 'c1m1', chapitre: 1, numero: 1, titre: 'Premier contact', perso: 'soldat',
        // Que des zombies normaux, mais beaucoup, et de plus en plus vite
        objectif: { normal: 60, hardcore: 80 },
        apparition: {
            normal: { depart: 1.3, min: 0.8, acceleration: 0.008, groupe: 0.12 },
            hardcore: { depart: 1.2, min: 0.75, acceleration: 0.008, groupe: 0.15 }
        },
        debrief: {
            normal: 'Pas mal, Soldat. Premier jour, et personne n\'est mort. À part eux.',
            hardcore: 'Ils couraient plus vite que d\'habitude, et ils étaient enragés. Et tu as tenu. Je retire ce que j\'ai dit sur les forces spéciales. Enfin, une partie.'
        }
    },
    {
        id: 'c1m2', chapitre: 1, numero: 2, titre: 'Couvre-feu', perso: 'soldat', nuit: true,
        // De nuit : moins de zombies à la fois, mais autant à abattre, et on ne les voit pas venir
        objectif: { normal: 60, hardcore: 80 },
        apparition: {
            normal: { depart: 1.6, min: 1.0, acceleration: 0.008, groupe: 0.1, max: 4 },
            hardcore: { depart: 1.5, min: 0.9, acceleration: 0.008, groupe: 0.12, max: 5 }
        },
        debrief: {
            normal: 'Plus un bruit. Bien joué, Soldat. Maintenant, si tu permets, j\'ai un oreiller qui m\'attend.',
            hardcore: 'Ceux-là couraient dans le noir comme en plein jour. Et tu les as eus quand même. Bonne nuit, Soldat. Enfin, ce qu\'il en reste.'
        }
    },
    {
        id: 'c1m3', chapitre: 1, numero: 3, titre: 'La Livraison', perso: 'soldat',
        // Escorter le camion de ravitaillement jusqu'au camp ; les Tanks (les videuses) arrivent
        camion: {
            y: 228,                                      // sur la piste de sable du bas
            duree: { normal: 80, hardcore: 90 },         // temps du trajet jusqu'au camp (secondes)
            depart: 3,
            pv: { normal: 130, hardcore: 125 },          // le camion encaisse un peu plus en normal
            degats: 5, degatsTank: 12                    // par seconde et par zombie agrippé
        },
        apparition: {
            normal: { depart: 1.5, min: 1.0, acceleration: 0.006, groupe: 0.1, tank: 0.18, versCamion: 0.3 },
            hardcore: { depart: 1.45, min: 0.92, acceleration: 0.006, groupe: 0.11, tank: 0.21, versCamion: 0.37 }
        },
        debrief: {
            normal: 'Le camion est là. Les échantillons aussi. Et mon café. Tu viens de gagner mon respect. Un peu. Ne t\'habitue pas.',
            hardcore: 'Ces videuses ne lâchaient rien, et toi non plus. Le camion est criblé de griffures, mais il est là. Le café a survécu. C\'est l\'essentiel.'
        },
        echec: 'Le camion… Mon café… Tu sais quoi ? On ne dira rien au labo.'
    },
    {
        id: 'c1m4', chapitre: 1, numero: 4, titre: 'La Brèche', perso: 'soldat',
        // Tenir pendant qu'on répare le mur : le chantier s'arrête tant qu'un zombie est trop près du camp.
        // Arrivée des Joggeurs (le marathon de charité), et quelques videuses.
        chantier: {
            duree: { normal: 70, hardcore: 80 },         // secondes de travail pour réparer le mur
            seuil: 250                                   // un zombie plus à gauche que ça : tout le monde se met à l'abri
        },
        apparition: {
            normal: { depart: 1.5, min: 1.0, acceleration: 0.006, groupe: 0.1, joggeur: 0.2, tank: 0.06 },
            hardcore: { depart: 1.4, min: 0.9, acceleration: 0.006, groupe: 0.12, joggeur: 0.25, tank: 0.08 }
        },
        debrief: {
            normal: 'Le mur tient. Plus solide qu\'avant, même. Et j\'ai fait monter une tour de guet. Si tu vois un marathonien, tu tires d\'en haut.',
            hardcore: 'Ils couraient plus vite qu\'aux Jeux olympiques, et le mur est quand même debout. Je commence à t\'apprécier. Ne le répète pas.'
        }
    },
    {
        id: 'c1m5', chapitre: 1, numero: 5, titre: 'Coup de foudre', perso: 'soldat',
        // L'échantillon enfui a muté en Mastodonte : d'abord sa horde, puis elle arrive (elle est attirée par le Soldat).
        boss: {
            avant: { normal: 50, hardcore: 55 },       // zombies à repousser avant qu'elle n'arrive
            ralenti: { normal: 3.5, hardcore: 4 }     // pendant le combat, la horde arrive autant de fois moins souvent
        },
        apparition: {
            normal: { depart: 1.4, min: 1.0, acceleration: 0.006, groupe: 0.1, joggeur: 0.12, tank: 0.08 },
            hardcore: { depart: 1.25, min: 0.9, acceleration: 0.006, groupe: 0.13, joggeur: 0.18, tank: 0.11 }
        },
        debrief: {
            normal: 'Elle est tombée. Et toi, tu es toujours debout. Le labo veut récupérer un morceau d\'elle. Je leur ai dit de se servir.',
            hardcore: 'Une horde enragée et une mutante amoureuse, et tu es encore là. Si un jour quelqu\'un m\'aime comme elle t\'aimait, je déserte.'
        },
        echec: 'Elle est passée. Elle te cherche dans le camp. Elle renverse les tentes une par une en t\'appelant… à sa façon.'
    },
    {
        id: 'c2m1', chapitre: 2, numero: 1, titre: 'La Débandade', perso: 'soldat',
        // À l'ouest : l'écran est en miroir (le camp à droite, la horde arrive par la gauche).
        // La horde fuit quelque chose (elle court plus vite) ; à la fin, c'était Brutus.
        miroir: true,
        objectif: { normal: 45, hardcore: 65 },
        apparition: {
            normal: { depart: 1.45, min: 1.0, acceleration: 0.006, groupe: 0.12, joggeur: 0.12, tank: 0.08, panique: 1.15 },
            hardcore: { depart: 1.25, min: 0.88, acceleration: 0.006, groupe: 0.16, joggeur: 0.17, tank: 0.11, panique: 1.2 }
        },
        // Ce qu'on entend pendant la vague (à une fraction de l'objectif)
        pendant: [
            { a: 0.4, qui: 'radio', texte: 'Il y a quelque chose derrière eux. Gros. Très gros. Et ça… ça les cogne ?' },
            { a: 0.75, qui: 'sergent', texte: 'Plus que quelques-uns. Et garde une balle pour la grosse chose, au cas où.' }
        ],
        // À la fin de la vague : Brutus sort de la poussière en cognant les derniers, puis les retrouvailles
        brutus: [
            { qui: 'sergent', texte: 'Soldat, baisse ton arme ! … Enfin, garde-la levée. Mais vise ailleurs.' },
            { qui: 'brutus', texte: 'Salut, la compagnie ! C\'est vous, le camp ? J\'ai ramené des invités. Désolé pour le désordre.' },
            { qui: 'sergent', texte: '… Non. Pas lui. Tout sauf lui.' },
            { qui: 'brutus', texte: 'CHEF CIGARE ! Ça alors ! Toujours vivant ? Et toujours ce cigare ?' },
            { qui: 'sergent', texte: 'Ne m\'appelle pas comme ça.' },
            { qui: 'soldat', texte: '…' }
        ],
        // Fin secrète « Tir ami » : tirer sur Brutus pendant qu'il arrive (une balle d'avertissement, puis 5)
        tirAmi: {
            avertissement: [
                { qui: 'brutus', texte: 'Hé ! C\'est moi ! Le gentil !' },
                { qui: 'sergent', texte: 'STOP ! TIR AMI ! CESSEZ LE FEU !' }
            ],
            cris: ['Aïe !', 'Mais arrête !', 'Chef, ta recrue est folle !', 'Ça… ça fait mal…'],
            // Il a pris des balles mais il est encore debout : les retrouvailles en parlent
            touche: [
                { qui: 'brutus', texte: 'Chef Cigare, ta recrue m\'a tiré dessus {n} fois.' },
                { qui: 'sergent', texte: 'Il vise bien, au moins.' }
            ],
            fin: [
                { qui: 'sergent', texte: '…' },
                { qui: 'sergent', texte: '… Tu viens d\'abattre le seul homme qui m\'ait jamais porté sur douze kilomètres.' },
                { qui: 'soldat', texte: '…' },
                { qui: 'sergent', texte: 'On va faire comme si ça n\'était jamais arrivé. Recommence. Et cette fois, tu vises les zombies.', bouton: 'Pardon, sergent…' }
            ]
        },
        debrief: {
            normal: 'Bon. On a un nouveau pensionnaire. Je sens que mes nuits calmes, c\'est terminé.',
            hardcore: 'Une horde en panique, et le pire, c\'était encore celui qui la poussait. Bienvenue au camp, Brutus. Hélas.'
        }
    },
    {
        id: 'c2m2', chapitre: 2, numero: 2, titre: 'Déménagement express', perso: 'brute',
        // L'histoire de Brutus, racontée au coin du feu : on la joue avec lui, en ville,
        // le jour où tout a commencé. Des foules entières : son fusil à pompe est fait pour ça.
        // La mariée qui « courait bien », c'est une Joggeuse ; les Videuses aussi sont sorties.
        decor: 'ville',
        objectif: { normal: 90, hardcore: 140 },
        apparition: {
            normal: { depart: 1.25, min: 0.78, acceleration: 0.006, groupe: 0.28, joggeur: 0.12, tank: 0.1 },
            hardcore: { depart: 0.95, min: 0.5, acceleration: 0.008, groupe: 0.42, joggeur: 0.2, tank: 0.14 }
        },
        // C'est Brutus qui raconte : il ouvre la mission, la commente et la conclut
        debut: [
            { qui: 'brutus', texte: 'Il y a des mois. En ville. Le piano était sur le trottoir, et moi devant, à reprendre mon souffle.', bouton: 'Et alors ?' }
        ],
        pendant: [
            { a: 0.35, qui: 'brutus', texte: 'Ils sortaient de partout. Des bureaux, du métro, d\'une boutique de robes de mariée. Il y avait une mariée. Elle courait bien.' },
            { a: 0.7, qui: 'brutus', texte: 'Et je ne les laissais pas approcher du piano. Il n\'était pas encore payé.' }
        ],
        debriefQui: 'brutus',
        debrief: {
            normal: 'Et voilà : la rue était propre, et le piano, intact. Je l\'ai même livré. Cinquième étage, sans ascenseur.',
            hardcore: 'En vrai, ils étaient deux fois plus. Trois fois. Et ils couraient à reculons. … Bon. Deux fois plus.'
        },
        // L'écran de fin : on n'est pas au camp, mais dans le souvenir de Brutus
        texteFin: {
            victoire: 'La rue est dégagée, et le piano n\'a pas une rayure. D\'après Brutus.',
            echec: '« Non, attends. Ce n\'est pas comme ça que ça s\'est passé. » Brutus reprend son histoire depuis le début.'
        }
    },
    {
        id: 'c2m3', chapitre: 2, numero: 3, titre: 'Terminus', perso: 'brute',
        // Brutus quitte la ville par le métro, à la lampe frontale. La ligne passe sous
        // l'hôpital : les Infirmiers soignent encore… les zombies. Il faut les viser en premier.
        decor: 'metro',
        nuit: true,
        neons: [[0.12, 40], [0.38, 40], [0.64, 40], [0.9, 40], [0.25, 362], [0.51, 362], [0.77, 362]],   // les néons du quai
        objectif: { normal: 70, hardcore: 100 },
        apparition: {
            normal: { depart: 1.5, min: 0.95, acceleration: 0.006, groupe: 0.15, max: 5, joggeur: 0.06, tank: 0.1, infirmier: 0.1 },
            hardcore: { depart: 1.35, min: 0.8, acceleration: 0.007, groupe: 0.2, max: 6, joggeur: 0.1, tank: 0.12, infirmier: 0.14 }
        },
        debut: [
            { qui: 'brutus', texte: 'Le tunnel. Ma lampe. Et quelque part devant, des roulettes qui grinçaient.', bouton: 'Et alors ?' }
        ],
        pendant: [
            { a: 0.3, qui: 'brutus', texte: 'Station Hôpital-Central. Des blouses blanches partout. Je n\'ai jamais aimé les hôpitaux. Là, encore moins.' },
            { a: 0.7, qui: 'brutus', texte: 'Au bout du tunnel, une lumière. Non, pas celle-là, Chef. Une vraie. La sortie.' }
        ],
        debriefQui: 'brutus',
        debrief: {
            normal: 'Au bout du terminus, le désert. Et derrière moi, plus rien qui grinçait.',
            hardcore: 'Ils étaient… bon, je ne vais pas dire deux fois plus. Mais beaucoup. Et les infirmiers avaient des renforts.'
        },
        texteFin: {
            victoire: 'Brutus sort du tunnel. Devant lui : le désert, et l\'ouest.',
            echec: '« Non, attends. Je me suis trompé de station. » Brutus reprend depuis l\'entrée du tunnel.'
        }
    },
    {
        id: 'c2m4', chapitre: 2, numero: 4, titre: 'Le Ring', perso: 'brute',
        // La logique : l'usine est le premier abri à la sortie du métro, les gens du quartier
        // (dont Gégé, l'ancien collègue de Brutus, qui a muté en gorille) s'y sont arrêtés.
        // Personne n'y entre armé (le bruit attire les morts) : on a pris son fusil à Brutus
        // pendant qu'il dormait, et les disputes s'y règlent à mains nues, sur le ring.
        // La carte : les guetteurs ont capté la radio du camp du Sergent ; Gégé ne peut pas
        // y aller (des soldats tireraient sur un gorille), alors il la met en jeu.
        // Un combat de boxe (boxe.js) : coups, esquives et contres, sans tir.
        decor: 'arene',
        objectif: { normal: 1, hardcore: 1 },
        boxe: {
            // pv de Gégé ; armer : temps entre le « ! » et l'impact ; parfait : fenêtre de l'esquive parfaite
            normal: { pv: 620, armer: 0.8, degats: 13, garde: [1.1, 2.0], ouvert: 1.0, parfait: 0.2, jab: 5, contre: 14, super: 45, feintes: 0 },
            hardcore: { pv: 700, armer: 0.62, degats: 22, garde: [0.8, 1.6], ouvert: 0.85, parfait: 0.16, jab: 4, contre: 13, super: 45, feintes: 0.25 }
        },
        debut: [
            // Pourquoi on lui a pris son fusil, et pourquoi on se bat à mains nues : la règle de la maison
            { qui: 'gorilleInconnu', texte: 'Tiens, le dormeur de la cabane. Tu cherches ton fusil ? Personne n\'entre armé chez moi. On l\'a pris, comme on prend celui de tout le monde.' },
            { qui: 'brutus', texte: 'C\'est mon fusil. Rends-le, et je ne casse rien.' },
            { qui: 'gorilleInconnu', texte: 'Ici, on ne tire pas : le bruit attire les morts. Les disputes, on les règle à mains nues. Sur le ring.' },
            // Les retrouvailles : l'usine est le premier abri à la sortie du métro, toute la ville y est passée
            { qui: 'gorilleInconnu', texte: '… Tu ne me reconnais vraiment pas ? Imagine-moi avec moins de poils.' },
            { qui: 'brutus', texte: '… Non.' },
            { qui: 'gorilleInconnu', texte: 'Le piano du conservatoire. Quatrième étage. Tu l\'as lâché sur mon pied.' },
            { qui: 'brutus', texte: '… GÉGÉ ?! Qu\'est-ce qui t\'est arrivé ?' },
            { qui: 'gorille', texte: 'J\'ai muté. Toi, tu as juste vieilli.' },
            { qui: 'gorille', texte: 'Tu veux ton fusil ? Gagne-le. Si tu perds, tu restes ici et tu portes mes caisses. Comme au bon vieux temps.' },
            { qui: 'brutus', texte: 'Au bon vieux temps, c\'est toi qui portais.' },
            // La carte : Gégé sait où est le camp, mais il ne peut pas y aller
            { qui: 'gorille', texte: 'Et si tu gagnes, je te donne aussi ça. Mes guetteurs ont capté une radio militaire : un camp, à l\'ouest. Des vivres, des murs, des soldats.' },
            { qui: 'brutus', texte: 'Et toi, tu n\'y vas pas ?' },
            { qui: 'gorille', texte: 'Regarde-moi. Des soldats qui voient arriver un gorille, ils ne posent pas de questions : ils tirent.' },
            { qui: 'brutus', texte: '… Monte sur le ring, Gégé.', bouton: 'Au combat !' }
        ],
        debriefQui: 'brutus',
        debrief: {
            normal: 'Gégé est tombé comme un piano. Il a tenu parole : mon fusil, et la carte. Un camp, à l\'ouest, avec des vivres et des murs.',
            hardcore: 'Il cognait plus fort qu\'avant, Gégé. Mais il a gardé son vieux défaut : il prévient toujours avant de frapper.'
        },
        echec: 'Non, attends. Je ne suis pas tombé. J\'ai… glissé. Je reprends.',
        echecBouton: 'Revanche !',
        texteFin: {
            victoire: 'Brutus récupère son fusil et la carte d\'un camp militaire. Direction : l\'ouest.',
            echec: 'Brutus jure qu\'il a glissé. Il reprend le combat depuis le début.'
        }
    },
    {
        id: 'c2m5', chapitre: 2, numero: 5, titre: 'La Longue Marche', perso: 'brute',
        // La logique : Gégé avait la direction du camp (la radio), pas sa position. Brutus a
        // marché vers l'ouest pendant des mois, de nuit, en croisant tout ce qui traîne dans
        // le désert (les monstres du mode normal, sauf l'Anti-émeute gardé pour plus tard),
        // jusqu'au village du Fossoyeur, sur sa
        // route. Le lendemain, il voit le mur du camp : c'est le début de « La Débandade ».
        // Le décor est le désert de la zone de combat.
        boss: {
            type: 'fossoyeur',
            bandeau: 'IL CREUSE…',
            avant: { normal: 90, hardcore: 160 },     // tout ce qu'il croise avant le village
            ralenti: { normal: 3.5, hardcore: 4 }
        },
        apparition: {
            normal: { depart: 1.35, min: 0.85, acceleration: 0.006, groupe: 0.15, tank: 0.08, joggeur: 0.08, infirmier: 0.07, pondeuse: 0.06 },
            hardcore: { depart: 1.0, min: 0.54, acceleration: 0.009, groupe: 0.32, tank: 0.15, joggeur: 0.15, infirmier: 0.1, pondeuse: 0.09 }
        },
        debut: [
            { qui: 'brutus', texte: 'Le désert. Des semaines, puis des mois. Je marchais la nuit, et je dormais le jour, à l\'ombre de ce que je trouvais.', bouton: 'Et alors ?' }
        ],
        pendant: [
            { a: 0.35, qui: 'brutus', texte: 'Les femmes enceintes, c\'était le pire. Il fallait les toucher de loin. Très loin.' },
            { a: 0.75, qui: 'brutus', texte: 'Et un matin, un village. Des croix partout, des trous tout frais. Et quelqu\'un qui creusait encore.' }
        ],
        debriefQui: 'brutus',
        debrief: {
            normal: 'Il a fini dans un de ses propres trous. Le lendemain, j\'ai vu un mur de sacs de sable au loin. Et une horde qui courait devant moi.',
            hardcore: 'Il creusait plus vite que je ne tirais. Presque. Le lendemain, je voyais votre mur. Et la horde qui me fuyait.'
        },
        echec: 'Non, attends. Il ne m\'a pas enterré : je suis là, non ? Je reprends.',
        echecBouton: 'Je reprends',
        texteFin: {
            victoire: 'Le Fossoyeur est enterré. À l\'horizon : un mur de sacs de sable. Le camp.',
            echec: '« Non, attends, il ne m\'a pas enterré. » Brutus reprend la route depuis le début.'
        }
    }
];

/* Intros des missions : le décor de la scène et les répliques.
   qui : sergent, labo ou soldat ; action : un effet dans la scène (coup, sirene). */
const SCENES_CAMPAGNE = {
    c1m1: {
        jeep: true,                                  // la jeep arrive, le Soldat en descend
        sergent: { x: CAMP.sergent.x, y: CAMP.sergent.y },
        soldat: { x: CAMP.jeep.x + 92, y: CAMP.jeep.y + 14, apparait: 2.4 },
        attente: 2600,
        lignes: [
            { qui: 'sergent', texte: 'Alors c\'est toi, le renfort qu\'on m\'a promis. Un seul. J\'avais demandé une section.' },
            { qui: 'sergent', texte: 'Ton dossier dit « forces spéciales ». Le reste est raturé au marqueur noir. Ton nom aussi.' },
            { qui: 'sergent', texte: 'Donc pour moi, tu t\'appelles Soldat. Ça te va ? Ça te va.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: 'Bavard, en plus. On va bien s\'entendre.' },
            { qui: 'sergent', texte: 'Tu te demandes ce qu\'on garde en plein désert ? Là-dessous, il y a un labo. Avec des chercheurs : des blouses blanches qui n\'ont pas vu le soleil depuis trois mois.', action: 'coup' },
            { qui: 'sergent', texte: 'Ils cherchent un remède. Un vrai. Pas une prière, pas un vaccin miracle de la télé. Un remède.' },
            { qui: 'sergent', texte: 'Et d\'après eux, ils sont proches. Ça fait trois mois qu\'ils sont « proches ».' },
            { qui: 'labo', texte: 'Sergent ? Les nouveaux échantillons sont arrivés ? Certains sujets réagissent… bizarrement. Ils ne se transforment pas complètement.' },
            { qui: 'sergent', texte: 'Je ne fais pas les livraisons ! … Là-dessous, ils croient tous que je suis facteur.' },
            { qui: 'sergent', texte: 'Ta mission est simple. Les zombies arrivent toujours par l\'est. Entre eux et cette trappe, il y a toi. Rien ne passe.' },
            { qui: 'sergent', texte: 'Forces spéciales ou pas, ici tu es une recrue. Alors avant de jouer les héros, tu vas me montrer que tu sais tirer.' },
            { qui: 'sergent', texte: '… Ou on saute l\'entraînement. Ils arrivent. À ton poste, Soldat !', action: 'sirene', bouton: 'À mon poste !' }
        ]
    },
    c1m2: {
        nuit: true,                                  // le camp de nuit, éclairé par le feu
        camera: 100,                                 // on cadre plus bas : autour du feu
        sergent: { x: 92, y: 262, pyjama: true, sortDe: 30 },   // il sort de sa tente, en pyjama
        soldat: { x: 196, y: 254 },                  // le Soldat près du feu, déjà en armure
        attente: 1600,
        lignes: [
            { qui: 'sergent', texte: 'Soldat ! Debout ! … Ah. Tu es déjà debout.' },
            { qui: 'sergent', texte: 'Tu dors en armure, toi ? … Remarque, ça fait gagner du temps. Je devrais essayer.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: 'Ne regarde pas le pyjama. C\'est un pyjama réglementaire. Il l\'était en tout cas, en 1987.' },
            { qui: 'labo', texte: 'Sergent ? Il y a du bruit là-haut. On peut dormir tranquilles ?' },
            { qui: 'sergent', texte: 'Personne ne dort tranquille ici. Surtout pas moi, visiblement.' },
            { qui: 'sergent', texte: 'Les guetteurs ont entendu grogner à l\'est. Ils arrivent par petits groupes. Moins nombreux, mais on ne les voit pas venir.' },
            { qui: 'sergent', texte: 'Allume ta lampe. Tire sur tout ce qui grogne. Et si ça grogne en pyjama, c\'est moi : tu ne tires pas.' },
            { qui: 'sergent', texte: 'Tiens jusqu\'à ce qu\'on n\'en entende plus un seul. Moi, je surveille. D\'ici. Allongé.', action: 'sirene', bouton: 'À mon poste !' }
        ]
    },
    c1m3: {
        sergent: { x: CAMP.sergent.x, y: CAMP.sergent.y },
        soldat: { x: 168, y: 214 },
        attente: 900,
        lignes: [
            { qui: 'sergent', texte: 'Bonne nouvelle, Soldat : le ravitaillement arrive aujourd\'hui. Mauvaise nouvelle : il passe par la route de l\'est.' },
            { qui: 'sergent', texte: 'Sur cette route, il y a une boîte de nuit. Réservée aux filles. Enfin, il y avait. Elle s\'est fait envahir cette nuit.' },
            { qui: 'sergent', texte: 'Et une boîte pareille, évidemment, ça avait des videuses. Beaucoup de videuses. Il faut bien protéger ces demoiselles des sacripants dans ton genre.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: 'Ne fais pas cette tête. Enfin, je suppose que tu fais une tête, là-dessous.' },
            { qui: 'sergent', texte: 'Les videuses ont été mordues comme les autres. Elles sont grosses, lentes, et elles encaissent : il faut plusieurs balles pour les coucher.' },
            { qui: 'labo', texte: 'Sergent ? Le camion, c\'est bien celui avec nos échantillons ?' },
            { qui: 'sergent', texte: 'Celui-là même. Avec mon café dedans. Donc il arrive entier.' },
            { qui: 'sergent', texte: 'Le camion entre par l\'est et file jusqu\'au camp. Toi, tu le couvres : rien ne s\'y agrippe, rien ne le touche. En position !', bouton: 'À mon poste !' }
        ]
    },
    c1m4: {
        breche: true,                                // le mur éventré, le camion garé sur le feu de camp
        camera: 100,                                 // cadré plus bas : la brèche et le camion
        sergent: { x: CAMP.sergent.x, y: CAMP.sergent.y },
        soldat: { x: 22, y: 126 },
        attente: 900,
        lignes: [
            { qui: 'sergent', texte: 'Tu as vu l\'arrivée du chauffeur, hier ? Il a traversé le mur. Sans freiner.' },
            { qui: 'sergent', texte: 'Et il s\'est garé sur le feu de camp. Il conduit comme il se gare : pas du tout.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: 'Non, je ne sais pas qui c\'est. Il dort dans son camion et il ne parle à personne. Ça me rappelle quelqu\'un.' },
            { qui: 'labo', texte: 'Sergent ? Les échantillons sont intacts. Enfin… presque tous. L\'un d\'eux bouge encore.' },
            { qui: 'sergent', texte: 'Formidable. Je note : « bouge encore ». Je le range avec mes autres soucis.' },
            { qui: 'sergent', texte: 'Bref. On répare la brèche. Les gars posent les sacs, toi tu les couvres. Tant qu\'un zombie traîne près du mur, personne ne travaille.' },
            { qui: 'sergent', texte: 'Et ouvre l\'œil : un marathon de charité passait par ici le jour où tout a commencé. Ils courent toujours.' },
            { qui: 'sergent', texte: 'Pour une bonne cause, j\'imagine. Ils chargent dès qu\'ils te voient dans l\'axe : ne reste pas planté en face d\'eux. Au travail !', bouton: 'À mon poste !' }
        ]
    },
    c1m5: {
        sergent: { x: CAMP.sergent.x, y: CAMP.sergent.y },
        soldat: { x: 182, y: 204 },                  // à droite de la tour de guet
        attente: 900,
        lignes: [
            { qui: 'sergent', texte: 'Mauvaise nouvelle, Soldat. L\'échantillon qui « bougeait encore »… ne bouge plus ici. Il s\'est enfui cette nuit. Vers l\'est.' },
            { qui: 'labo', texte: 'On vous avait dit qu\'il bougeait encore ! On vous l\'avait dit !' },
            { qui: 'sergent', texte: 'Oui, oui. J\'ai envoyé un éclaireur sur ses traces. Il devrait appeler… maintenant.' },
            { qui: 'radio', texte: 'Éclaireur au camp. Je l\'ai retrouvé. Enfin… je crois que c\'est lui. Il a changé.' },
            { qui: 'radio', texte: 'Il a muté, Sergent. Deux mètres cinquante. Vert. Avec des pustules qui clignotent. Et… je crois que c\'est une « elle », maintenant.' },
            { qui: 'radio', texte: 'Elle n\'est pas seule : toute une horde la suit. Ils foncent droit vers le camp.' },
            { qui: 'sergent', texte: 'Droit vers le camp ? Qu\'est-ce qui l\'attire ?' },
            { qui: 'radio', texte: 'Je ne sais pas. Elle renifle l\'air… et elle regarde vers le mur. Là où se tient… le soldat.' },
            { qui: 'soldat', texte: '…' },
            { qui: 'sergent', texte: '… Toi ? Qu\'est-ce que tu lui as fait ?' },
            { qui: 'sergent', texte: 'Peu importe. Tu fais le ménage dans la horde, et quand la grosse arrive, tu lui expliques que ce n\'est pas réciproque. Avec ton fusil.', action: 'sirene', bouton: 'À mon poste !' }
        ]
    }
};

SCENES_CAMPAGNE.c2m1 = {
    sergent: { x: CAMP.sergent.x, y: CAMP.sergent.y },
    soldat: { x: 182, y: 204 },
    attente: 900,
    lignes: [
        { qui: 'radio', texte: 'Éclaireur au camp. Le mouvement à l\'ouest… c\'est une horde. Elle vient droit sur nous.' },
        { qui: 'sergent', texte: 'À l\'ouest. Évidemment. Pour une fois qu\'il ne se passait rien à l\'est.' },
        { qui: 'sergent', texte: 'Retourne-toi, Soldat. Cette fois, ils arrivent de l\'autre côté. Et le mur, de ce côté-là, est plus bas que mon moral.' },
        { qui: 'radio', texte: 'Sergent… ils courent. Ils ne regardent même pas le camp. On dirait qu\'ils fuient quelque chose.' },
        { qui: 'sergent', texte: 'Fuir ? Qu\'est-ce qui peut faire peur à un zombie ?' },
        { qui: 'soldat', texte: '…' },
        { qui: 'sergent', texte: 'C\'est bien ce que je pensais : toi non plus, tu n\'en sais rien. En position !', action: 'sirene', bouton: 'À mon poste !' }
    ]
};

/* Épilogues : joués après le débriefing de la dernière mission d'un chapitre,
   la première fois qu'on le termine. Ils annoncent la suite sans rien en dire. */
const EPILOGUES = {
    // Fin du chapitre 2 : retour au coin du feu ; la boucle est bouclée avec « La Débandade »
    2: [
        { qui: 'sergent', texte: 'Donc la horde qui a failli nous passer dessus… c\'est toi qui l\'as amenée jusqu\'ici.' },
        { qui: 'brutus', texte: 'Je ne l\'ai pas amenée, Chef. Elle me fuyait. Nuance.' },
        { qui: 'chercheur', texte: 'Des infirmiers qui soignent les zombies. Un homme qui a muté et qui se souvient de tout… Sergent, cette fois, je retourne au labo.' },
        { qui: 'sergent', texte: 'Vas-y. Et dors un peu, pour une fois.' },
        { qui: 'brutus', texte: 'Et moi, Chef ? Je fais quoi, maintenant ?' },
        { qui: 'sergent', texte: 'Toi ? Tu dors dans ta tente, les pieds dehors. Et demain, tu montes la garde avec la recrue.' },
        { qui: 'soldat', texte: '…' },
        { qui: 'brutus', texte: 'Il parle toujours autant ?' },
        { qui: 'sergent', texte: 'Jamais. C\'est ce que je préfère chez lui.', bouton: 'Fin du chapitre 2' }
    ],
    1: [
        { qui: 'sergent', texte: 'Bon. Le mur tient, la mutante est tombée, et le labo a ses échantillons. Enfin, ce qu\'il en reste.' },
        { qui: 'labo', texte: 'Sergent ? Les tissus de la mutante… ils réagissent au remède. Pas comme prévu. Mais ils réagissent.' },
        { qui: 'sergent', texte: '« Pas comme prévu ». Je commence à détester cette phrase.' },
        { qui: 'radio', texte: 'Éclaireur au camp. Il y a du mouvement à l\'ouest. Beaucoup de mouvement.' },
        { qui: 'sergent', texte: 'À l\'ouest ? Il n\'y a jamais rien à l\'ouest.' },
        { qui: 'soldat', texte: '…' },
        { qui: 'sergent', texte: 'Repose-toi, Soldat. Tu l\'as mérité. Demain, on change de programme.', bouton: 'Fin du chapitre 1' }
    ]
};

/* La nuit, au coin du feu : la tente de Brutus est montée, et la personne du
   labo est sortie exprès (on ne voit d'elle qu'une silhouette). */
SCENES_CAMPAGNE.c2m2 = {
    nuit: true,
    camera: 100,
    sergent: { x: 86, y: 256 },
    soldat: { x: 202, y: 214 },
    brutus: { x: 182, y: 260 },
    chercheur: { x: 120, y: 280 },
    lanterne: { x: 70, y: 176 },                 // devant la tente de Brutus (camp_decor.js, étape 2)
    attente: 1400,
    lignes: [
        { qui: 'brutus', texte: 'Elle est belle, ma tente, hein ? Un peu petite. Mes pieds dorment dehors.' },
        { qui: 'sergent', texte: 'Tes pieds dorment dehors depuis la guerre des Trois Collines.' },
        { qui: 'sergent', texte: 'Et toi ? Trois mois sans voir le soleil, et tu sors pour la lune ?' },
        { qui: 'chercheur', texte: 'Il fallait que je voie ça de mes yeux. Un homme qui traverse une horde à mains nues.' },
        { qui: 'brutus', texte: 'Pas à mains nues. J\'avais mon fusil. Je m\'en sers juste moins que de mes mains.' },
        { qui: 'chercheur', texte: 'Justement. D\'où venez-vous ? Comment êtes-vous arrivé jusqu\'ici, au milieu de tout ça ?' },
        { qui: 'brutus', texte: 'Ah ! Ça, c\'est une histoire. Chef, tu te souviens de ce que je faisais, après les Trois Collines ?' },
        { qui: 'sergent', texte: 'Tu portais des choses lourdes. Et tu les cassais.' },
        { qui: 'brutus', texte: 'Déménageur ! En ville. Le jour où tout a commencé, je montais un piano au cinquième. Sans ascenseur.' },
        { qui: 'brutus', texte: 'Et en bas, dans la rue, les gens se sont mis à… mordre les autres gens.' },
        { qui: 'soldat', texte: '…' },
        { qui: 'brutus', texte: 'C\'est exactement ce que j\'ai dit ! Alors j\'ai posé le piano, et j\'ai sorti mon fusil à pompe.' },
        { qui: 'sergent', texte: 'Pourquoi un déménageur a un fusil à pompe ?' },
        { qui: 'brutus', texte: 'Les clients ne paient pas toujours, Chef.' },
        { qui: 'brutus', texte: 'Bref. Imaginez la rue. Les sirènes. Le piano sur le trottoir. Et moi.', bouton: 'Raconte !' }
    ]
};

/* Toujours au coin du feu : la suite de l'histoire de Brutus. */
SCENES_CAMPAGNE.c2m3 = {
    ...SCENES_CAMPAGNE.c2m2,
    lignes: [
        { qui: 'sergent', texte: 'Un piano livré au cinquième, une rue nettoyée… Et ensuite ? Tu as appelé un taxi ?' },
        { qui: 'brutus', texte: 'Les rues étaient bouchées, Chef. Des voitures partout, des gens partout. Et des gens qui mangeaient les gens.' },
        { qui: 'brutus', texte: 'Alors je suis descendu dans le métro. Sous terre, pas d\'embouteillage. Et les tunnels sortent tous de la ville.' },
        { qui: 'chercheur', texte: 'Dans le noir ? Avec eux ?' },
        { qui: 'brutus', texte: 'J\'avais ma lampe frontale. Un déménageur a toujours une lampe frontale. Les caves, les greniers…' },
        { qui: 'sergent', texte: 'Et un fusil à pompe. Pour les clients.' },
        { qui: 'brutus', texte: 'Voilà. Le problème, c\'est que la ligne passait sous l\'hôpital. Et à l\'hôpital, il y avait les infirmiers.' },
        { qui: 'brutus', texte: 'Ils soignaient encore. Les zombies. Tu en abîmes un, l\'infirmier arrive, et hop : comme neuf.' },
        { qui: 'chercheur', texte: '… Ils les soignaient ? Un zombie qui en répare un autre ?' },
        { qui: 'chercheur', texte: 'Sergent, il faut que je retourne au labo. Tout de suite.' },
        { qui: 'sergent', texte: 'Assieds-toi. Personne ne quitte le feu avant la fin de l\'histoire. C\'est le règlement.' },
        { qui: 'soldat', texte: '…' },
        { qui: 'brutus', texte: 'Donc : le tunnel. Le noir. Et un bruit de roulettes de brancard.', bouton: 'Raconte !' }
    ]
};

/* Toujours au coin du feu : le fusil volé, et la grande bâtisse. */
SCENES_CAMPAGNE.c2m4 = {
    ...SCENES_CAMPAGNE.c2m2,
    lignes: [
        { qui: 'chercheur', texte: 'Et après le tunnel ? Vous avez marché jusqu\'ici, à travers le désert ?' },
        { qui: 'brutus', texte: 'Pas tout de suite. J\'ai dormi dans une cabane, au bord de la voie. Et au réveil… plus de fusil.' },
        { qui: 'sergent', texte: 'On t\'a volé ton fusil. Pendant que tu dormais. Toi.' },
        { qui: 'brutus', texte: 'Je dors profondément, Chef. Tu le sais. Aux Trois Collines, j\'ai dormi pendant un bombardement.' },
        { qui: 'sergent', texte: 'C\'était un orage.' },
        { qui: 'brutus', texte: 'Bref. Il y avait des traces dans la poussière. Des pieds… et des mains. Je les ai suivies jusqu\'à une vieille usine, pas loin de la voie.' },
        { qui: 'brutus', texte: 'Et dedans, des gens. Des vivants ! Tout le quartier avait fui par le métro, comme moi. L\'usine, c\'était le premier abri à la sortie.' },
        { qui: 'brutus', texte: 'Et au milieu, assis sur des caisses comme sur un trône… un gorille.' },
        { qui: 'chercheur', texte: 'Un gorille ? Un vrai ?' },
        { qui: 'brutus', texte: 'Un homme. Enfin, à moitié. Il avait muté.' },
        { qui: 'chercheur', texte: 'Muté… Et il parlait ? Il se souvenait de qui il était ?' },
        { qui: 'soldat', texte: '…' },
        { qui: 'brutus', texte: 'Oh oui. Il se souvenait très bien. Surtout de moi.', bouton: 'Raconte !' }
    ]
};

/* Toujours au coin du feu : la longue marche jusqu'au camp. */
SCENES_CAMPAGNE.c2m5 = {
    ...SCENES_CAMPAGNE.c2m2,
    lignes: [
        { qui: 'sergent', texte: 'Ton fusil, une carte… Et de l\'usine jusqu\'ici, tu as mis combien de temps ?' },
        { qui: 'brutus', texte: 'Des mois, Chef.' },
        { qui: 'sergent', texte: 'Des mois. Avec une carte.' },
        { qui: 'brutus', texte: 'Les guetteurs de Gégé avaient capté votre radio, pas votre adresse. Sur la carte, il y avait une flèche. « Ouest ». C\'est tout.' },
        { qui: 'brutus', texte: 'Alors j\'ai marché vers l\'ouest. De nuit, à cause du soleil. J\'ai bu dans les citernes des fermes. Et il y avait du monde sur la route.' },
        { qui: 'chercheur', texte: 'Du monde ?' },
        { qui: 'brutus', texte: 'Tout ce que vous connaissez. Les coureurs, les videuses, les infirmiers… et les femmes enceintes qui éclatent.' },
        { qui: 'sergent', texte: 'Le désert entier, en somme. Et tu les as tous gardés pour toi.' },
        { qui: 'brutus', texte: 'Le pire, c\'était le village. Tout le monde y était enterré. Et celui qui les avait enterrés creusait encore. Il m\'avait gardé une place.' },
        { qui: 'soldat', texte: '…' },
        { qui: 'brutus', texte: 'Fais pas cette tête. Je suis là, non ?', bouton: 'Raconte !' }
    ]
};
