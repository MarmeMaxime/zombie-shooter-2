# Outils de développement

Ces scripts ne sont pas utilisés par le jeu : ils servent à le fabriquer et à le vérifier.

## Sprites (Windows PowerShell)

Les personnages et tenues sont générés à partir des sprites d'origine du soldat
(`assets/persos/soldat/`) et de la zombie tank (`assets/monstres/tank/`), par recoloration
pixel par pixel. À lancer dans cet ordre, depuis la racine du projet :

```powershell
.\outils\generer_persos.ps1 -assets "$PWD\assets"   # Mira, Brutus, magical girl
.\outils\generer_lassie.ps1 -assets "$PWD\assets"   # Lassie, à partir des sprites de Mira
.\outils\generer_tenues.ps1 -assets "$PWD\assets"   # les 20 tenues des lootbox (assets/skins/)
```

Pour une nouvelle tenue : ajouter une ligne `Recolor ...` dans `generer_tenues.ps1`,
puis la déclarer dans `LOOT.skins` (`fichierJs/lootbox.js`).

## Simulation d'équilibrage (Node.js)

Fait jouer un bot avec le vrai code du jeu, sans navigateur, et mesure s'il survit.

```powershell
$env:PERSO = "soldat"; node outils\simulation.js . hardcore 45 0.25 5
```

Arguments : dossier du jeu, mode (`normal` / `hardcore`), durée en minutes,
temps de réaction du bot en secondes, graine aléatoire, et en option des
réglages à tester en JSON, par exemple `'{"boss":{"pvMax":40}}'`.
Variables d'environnement : `PERSO` (soldat, brute, grenadier) et `LARGEUR`
(largeur du monde, 800 par défaut ; 1600 pour simuler un écran large).

Résultat : temps de survie, vies restantes, vies perdues, boss vaincus, et
d'où viennent les pertes (zombie sorti de l'écran, contact, crachats).
