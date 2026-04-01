USE leaderboard_zombie_shooter;

CREATE TABLE IF NOT EXISTS classement_troupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pseudo VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    temps INT NOT NULL,
    difficulte VARCHAR(20) NOT NULL
);