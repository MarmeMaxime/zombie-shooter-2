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
    { numero: 1, titre: 'La Recrue' }
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
            pv: { normal: 130, hardcore: 115 },          // le camion encaisse un peu plus en normal
            degats: 5, degatsTank: 12                    // par seconde et par zombie agrippé
        },
        apparition: {
            normal: { depart: 1.5, min: 1.0, acceleration: 0.006, groupe: 0.1, tank: 0.18, versCamion: 0.3 },
            hardcore: { depart: 1.4, min: 0.9, acceleration: 0.006, groupe: 0.12, tank: 0.22, versCamion: 0.4 }
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
