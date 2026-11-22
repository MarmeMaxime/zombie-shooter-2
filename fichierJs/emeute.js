/* =========================================================================
   L'ANTI-ÉMEUTE
   3 PV, mais un seul PV perdu par tir, quelle que soit l'arme (une salve de
   plombs ou une grenade = un tir ; voir toucher_zombie) ; la foudre s'arrête
   sur lui (voir foudroyer).
   1er tir : le bouclier se fend ; 2e : il se brise et le zombie fonce ;
   3e : mort. Réglages : CONFIG.emeute ; sprite : emeute_sprite.js.
   ========================================================================= */
let eclats = [];   // étincelles d'impact et boucliers qui tombent

const nouvel_emeute = () => ({ etat: 'garde', dernierTir: null });
const vitesse_emeute = z => (z.emeute.etat === 'sans' ? parMode(CONFIG.emeute.vitesseSansBouclier) : z.vitesse);
const images_emeute = z => SPRITES_EMEUTE[z.emeute.etat];

// Touché sans être tué : étincelles sur le bouclier, qui se brise au 2e tir
function emeute_blesse(z) {
    const e = z.emeute;
    if (e.etat !== 'garde') return;
    const bx = z.x + 15, by = z.y + 12 + Math.random() * 30;
    for (let k = 0; k < 5; k++) {
        eclats.push({ type: 'etincelle', x: bx, y: by, vx: 60 + Math.random() * 120, vy: (Math.random() - 0.5) * 160, age: 0, duree: 0.2 });
    }
    if (z.pv > 1) {
        Son.effet('ricochet');
        return;
    }
    // Bouclier brisé : il le lâche et fonce
    e.etat = 'sans';
    eclats.push({ type: 'bouclier', x: z.x + 15, y: z.y + 30, vx: -20, vy: -90, age: 0, duree: 0.9, rotation: 0 });
    Son.effet('bouclierBrise');
    if (typeof Succes !== 'undefined') Succes.compter('bouclierBrises');
}

function update_eclats(dt) {
    for (const p of eclats) {
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 400 * dt;
        if (p.type === 'bouclier') p.rotation -= dt * 5;
    }
    eclats = eclats.filter(p => p.age < p.duree);
}

function dessiner_emeute(ctx, z) {
    ctx.drawImage(images_emeute(z)[z.etape], z.x, z.y, z.taille, z.taille);
    // Bouclier fendu après le premier tir
    if (z.emeute.etat === 'garde' && z.pv < z.pvMax) {
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 40, 50, 0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const x0 = z.x + 14, y0 = z.y + 22;
        ctx.moveTo(x0 + 1, y0); ctx.lineTo(x0 + 4, y0 + 6); ctx.lineTo(x0 + 2, y0 + 11);
        ctx.lineTo(x0 + 5, y0 + 17); ctx.moveTo(x0 + 4, y0 + 6); ctx.lineTo(x0 + 6, y0 + 4);
        ctx.stroke();
        ctx.restore();
    }
}

function draw_eclats(ctx) {
    ctx.save();
    for (const p of eclats) {
        ctx.globalAlpha = 1 - p.age / p.duree;
        if (p.type === 'etincelle') {
            ctx.fillStyle = '#ffe680';
            ctx.fillRect(p.x, p.y, 2, 2);
        } else {
            // Le bouclier brisé tournoie et tombe
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#8396a6';
            ctx.fillRect(-4, -20, 8, 40);
            ctx.fillStyle = '#bccbd6';
            ctx.fillRect(-3, -19, 4, 38);
            ctx.restore();
        }
    }
    ctx.restore();
}
