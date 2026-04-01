<?php
// Configuration
header('Content-Type: application/json');
$hote = 'localhost';
$nom_base = 'leaderboard_zombie_shooter';
$utilisateur = 'root';
$mot_de_passe = 'X4keqyny!';

try {
    $pdo = new PDO("mysql:host=$hote;dbname=$nom_base;charset=utf8", $utilisateur, $mot_de_passe);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['erreur' => "Erreur de connexion aux archives: " . $e->getMessage()]));
}

$action = $_GET['action'] ?? '';

// AJOUT DE JOUEUR
if ($action === 'sauvegarder') {
    $donnees = json_decode(file_get_contents('php://input'), true);
    
    if (isset($donnees['pseudo'], $donnees['score'], $donnees['temps'], $donnees['difficulte'])) {
        $requete = $pdo->prepare("INSERT INTO classement_troupes (pseudo, score, temps, difficulte) VALUES (?, ?, ?, ?)");
        $requete->execute([$donnees['pseudo'], $donnees['score'], $donnees['temps'], $donnees['difficulte']]);
        echo json_encode(['statut' => 'succes']);
    } else {
        echo json_encode(['statut' => 'erreur', 'message' => 'Rapport incomplet']);
    }
} 

// DEMANDE DU CLASSEMENT (TOP 10)
elseif ($action === 'top10') {
    $requete = "SELECT pseudo, score, temps, difficulte 
                FROM classement_troupes 
                ORDER BY score DESC, (temps * IF(difficulte = 'hardcore', 10, 1)) DESC 
                LIMIT 10";
                
    $reponse = $pdo->query($requete);
    $classement = $reponse->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($classement);
}
?>