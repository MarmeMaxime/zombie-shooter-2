// Reçoit les sprites générés par outils/sprites/exporter.html et les écrit en PNG dans assets/.
// Usage : node outils/exporter_sprites.js   puis ouvrir http://localhost:8766/outils/sprites/exporter.html
// (le jeu doit être servi par le serveur habituel). Il n'écrit que dans assets/, en .png.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ASSETS = path.resolve(__dirname, '..', 'assets');
const PORT = Number(process.env.PORT) || 8767;

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.end();
    if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
    let corps = '';
    req.on('data', d => { corps += d; });
    req.on('end', () => {
        try {
            const { chemin, base64 } = JSON.parse(corps);
            const cible = path.resolve(ASSETS, chemin + '.png');
            if (!cible.startsWith(ASSETS + path.sep)) throw new Error('hors de assets/ : ' + chemin);
            fs.mkdirSync(path.dirname(cible), { recursive: true });
            fs.writeFileSync(cible, Buffer.from(base64, 'base64'));
            res.end('ok');
        } catch (e) {
            res.statusCode = 400;
            res.end(String(e.message));
        }
    });
}).listen(PORT, () => console.log('Export des sprites : http://localhost:' + PORT));
