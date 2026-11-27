/* =========================================================================
   ANIMATIONS DE MORT
   Appelées par toucher_zombie() (zombie.js) quand un zombie meurt.
   ========================================================================= */
/* ---------- Animations de mort ----------
   Le corps est ARTICULÉ : on dessine séparément le haut du corps (tête, buste,
   bras) et les jambes, reliés à la hanche. Une mort se joue par phases :
   recul à l'impact -> titube (il continue quelques pas) -> les genoux plient
   -> le buste bascule d'un côté pendant que les jambes se couchent de l'autre
   -> rebond au sol -> dernier spasme -> il reste allongé, puis disparaît.
   - face (zombie normal, Joggeur) : tombe en avant, face contre terre
   - dos (tank) : projetée en arrière, tombe sur le dos
   - glissade (Joggeur en plein sprint) : s'écrase et glisse sur le ventre
   - electro (foudre de Lassie) : tremble et clignote avant de tomber
   - colosse (boss) : titube longtemps, tombe à genoux, s'écroule (séisme)
   - paillettes (magical girl) : tourne sur elle-même et se dissout en étoiles
   sens : -1 = tombe vers la gauche (en avant), +1 = vers la droite (en arrière)
   hanche : hauteur de la hanche dans le sprite (fraction depuis le haut) */
const MORTS = {
    face: { duree: 2.6, titube: 0.4, genoux: [0.1, 0.45], chute: [0.45, 0.78], sens: -1, recul: 4, hanche: 0.6, flaque: '#5a0808' },
    dos: { duree: 2.6, titube: 0.15, genoux: [0.12, 0.32], chute: [0.32, 0.62], sens: 1, recul: 12, hanche: 0.6, flaque: '#5a0808' },
    glissade: { duree: 2.6, titube: 0, genoux: [0, 0.05], chute: [0.05, 0.28], sens: -1, recul: 0, hanche: 0.6, flaque: '#5a0808', glisse: 70 },
    electro: { duree: 2.6, titube: 0, genoux: [0.6, 0.78], chute: [0.78, 1.08], sens: -1, recul: 0, hanche: 0.6, flaque: '#5a0808', electro: 0.6 },
    colosse: { duree: 3.8, titube: 0.8, genoux: [0.8, 1.3], chute: [1.3, 1.9], sens: -1, recul: 0, hanche: 0.66, flaque: '#4a6a1a', tremble: true },
    paillettes: { duree: 1.5 }
};
let cadavres = [];

const entre = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));   // progression 0 -> 1 entre a et b
const lisse = t => t * t * (3 - 2 * t);                                     // départ et arrivée en douceur

function ajouter_cadavre(z) {
    // Style, couleurs, images propres à un type (TYPES_ZOMBIE.x.mort), éventuellement selon son état
    const type = TYPES_ZOMBIE[z.type];
    const propre = (typeof type.mort === 'function' ? type.mort(z) : type.mort) || {};
    const style = propre.style || (z.foudroye ? 'electro' : 'face');
    const couleurs = style === 'paillettes' ? ['#ff6ec7', '#ffe14d', '#ffffff']
        : style === 'electro' ? ['#5ae6ff', '#c8f8ff', '#2ab8ff']
        : propre.couleurs ? propre.couleurs
        : style === 'colosse' ? ['#6a8a2a', '#8fa83e', '#3a5a1a'] : ['#8a0f0f', '#b01818', '#5a0808'];
    const nombre = propre.particules || (style === 'colosse' ? 60 : 12);
    const sens = MORTS[style].sens || 1;
    const particules = Array.from({ length: nombre }, () => ({
        x: z.x + z.taille / 2, y: z.y + z.taille * 0.4,
        vx: (30 + Math.random() * 140) * (sens < 0 ? 0.6 : 1), vy: -60 - Math.random() * 140,
        taille: 2 + Math.random() * 3,
        couleur: couleurs[Math.floor(Math.random() * couleurs.length)]
    }));
    // Images du corps qui tombe : celles du type (zombie attaché), de son état (joggeur en plein sprint), ou de marche
    const images = type.imagesMort || propre.images || images_zombie(z);
    cadavres.push({
        style, images, etape: z.etape % images.length, x: z.x, y: z.y, taille: z.taille,
        age: 0, particules, poussiere: [], impact: false, etoiles: style === 'paillettes'
    });
}

function update_cadavres(dt) {
    for (const c of cadavres) {
        c.age += dt;
        const m = MORTS[c.style];
        for (const p of c.particules) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; }
        for (const p of c.poussiere) { p.age += dt; p.x += p.vx * dt; p.y -= 8 * dt; }
        c.poussiere = c.poussiere.filter(p => p.age < 0.7);

        // Moment où le corps touche le sol : poussière (et séisme pour le boss)
        if (m.chute && !c.impact && c.age >= m.chute[1]) {
            c.impact = true;
            const nb = c.style === 'colosse' ? 14 : 5;
            for (let k = 0; k < nb; k++) {
                c.poussiere.push({ x: c.x + c.taille * (0.1 + Math.random() * 0.8) + m.sens * c.taille * 0.3, y: c.y + c.taille - 4, vx: (Math.random() - 0.5) * 60, age: 0, r: c.style === 'colosse' ? 10 : 5 });
            }
            if (c.style === 'colosse') { secouer_ecran(3); Son.effet('explosion'); }
        }
        // Le joggeur glisse sur le ventre avec son élan
        if (m.glisse && c.age > m.chute[0]) c.x -= m.glisse * Math.exp(-3 * (c.age - m.chute[0])) * dt * 3;
        // La magical girl lâche des étoiles en se dissolvant
        if (c.style === 'paillettes' && c.age > 0.5 && c.age < 1.3 && Math.random() < 0.7) {
            const coupe = c.y + c.taille * entre(c.age, 0.5, 1.3);
            c.particules.push({ x: c.x + 16 + Math.random() * 32, y: coupe, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, taille: 2 + Math.random() * 2, couleur: ['#ff6ec7', '#ffe14d', '#ffffff'][Math.floor(Math.random() * 3)] });
        }
    }
    cadavres = cadavres.filter(c => c.age < MORTS[c.style].duree);
}

// Pose du corps articulé à l'instant c.age : rotation du buste, des jambes, pliage des genoux
function pose_articulee(c) {
    const m = MORTS[c.style], a = c.age, s = m.sens;
    const genoux = lisse(entre(a, m.genoux[0], m.genoux[1]));
    const chute = entre(a, m.chute[0], m.chute[1]);
    const chuteG = chute * chute;                          // accélère comme sous la gravité
    const p = { dx: 0, buste: 0, jambes: 0, plie: 1, filtre: null, flash: a < 0.08 };

    // Recul à l'impact : le buste est rejeté en arrière puis revient (ou part directement, pour « dos »)
    if (s > 0) { p.dx = m.recul * lisse(entre(a, 0, 0.25)); p.buste += 0.25 * entre(a, 0, 0.15); }
    else { p.dx = m.recul * Math.sin(entre(a, 0, 0.14) * Math.PI); p.buste += 0.22 * Math.sin(entre(a, 0, 0.16) * Math.PI); }

    // Titube : petits balancements pendant qu'il fait encore quelques pas
    if (a < m.titube) p.buste += 0.08 * Math.sin(a * 18) * (1 - a / m.titube);
    if (m.tremble && a < m.titube) p.dx += (Math.random() - 0.5) * 6;

    // Électrocuté : il tremble et clignote en bleu (on voit presque son squelette)
    if (m.electro && a < m.electro) {
        p.dx += (Math.random() - 0.5) * 5;
        p.buste += (Math.random() - 0.5) * 0.15;
        p.filtre = Math.floor(a / 0.05) % 2 ? 'brightness(2.4) sepia(1) hue-rotate(160deg) saturate(5)' : 'invert(1) brightness(1.4)';
    }

    // Les genoux plient : les jambes se tassent, le buste s'affaisse vers le côté de la chute
    p.plie = 1 - 0.4 * genoux;
    p.buste += s * 0.35 * genoux;

    // Chute : le buste bascule jusqu'au sol, les jambes se couchent de l'autre côté
    p.buste += s * (Math.PI / 2 - 0.35 * genoux) * chuteG;
    p.jambes = s * (Math.PI / 2) * chuteG;
    p.plie += (0.9 - p.plie) * chuteG;                    // une fois couchées, les jambes se détendent

    // Rebond au sol, puis dernier spasme
    const rebond = entre(a, m.chute[1], m.chute[1] + 0.18);
    if (rebond > 0 && rebond < 1) p.buste -= s * 0.14 * Math.sin(rebond * Math.PI);
    const spasme = entre(a, m.chute[1] + 0.6, m.chute[1] + 0.9);
    if (spasme > 0 && spasme < 1) { p.buste -= s * 0.05 * Math.sin(spasme * Math.PI * 6); p.jambes += s * 0.04 * Math.sin(spasme * Math.PI * 4); }

    // Image affichée : il continue de marcher en titubant, puis se fige dans sa chute
    const pas = Math.floor(Math.min(a, m.titube) / 0.12);
    p.image = c.images[(c.etape + pas) % c.images.length];
    return p;
}

// Position de la hanche : les pieds restent au sol, la hanche suit les jambes qui basculent,
// sans descendre sous l'épaisseur du corps allongé
function position_hanche(c, p) {
    const m = MORTS[c.style];
    const longueur = c.taille * (1 - m.hanche) * p.plie;
    const sol = c.y + c.taille;
    return {
        hx: c.x + c.taille / 2 + p.dx + Math.sin(p.jambes) * longueur,
        hy: Math.min(sol - Math.cos(p.jambes) * longueur, sol - c.taille * 0.14)
    };
}

// Haut du corps et jambes dessinés séparément autour de la hanche
function dessiner_corps_articule(ctx, c, p) {
    const m = MORTS[c.style];
    const t = c.taille, img = p.image;
    const nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
    const { hx, hy } = position_hanche(c, p);

    if (p.filtre) ctx.filter = p.filtre;
    else if (p.flash) ctx.filter = 'brightness(3)';        // flash blanc à l'impact

    ctx.save();                                            // jambes
    ctx.translate(hx, hy);
    ctx.rotate(p.jambes);
    ctx.scale(1, p.plie);
    ctx.drawImage(img, 0, nh * m.hanche, nw, nh * (1 - m.hanche), -t / 2, 0, t, t * (1 - m.hanche));
    ctx.restore();
    ctx.save();                                            // haut du corps
    ctx.translate(hx, hy);
    ctx.rotate(p.buste);
    ctx.drawImage(img, 0, 0, nw, nh * m.hanche, -t / 2, -t * m.hanche, t, t * m.hanche);
    ctx.restore();
}

function draw_cadavres(ctx) {
    for (const c of cadavres) {
        const m = MORTS[c.style];
        const fin = m.duree - 0.5;
        const alpha = c.age < fin ? 1 : 1 - entre(c.age, fin, m.duree);

        if (c.style === 'paillettes') {
            // Magical girl : tourne sur elle-même en s'élevant, puis se dissout de haut en bas
            const coupe = c.taille * entre(c.age, 0.5, 1.3);
            ctx.save();
            ctx.translate(c.x + c.taille / 2, c.y + c.taille - 8 * entre(c.age, 0.1, 0.6));
            ctx.scale(Math.cos(entre(c.age, 0.1, 0.9) * Math.PI * 4), 1);
            if (c.age < 0.08) ctx.filter = 'brightness(3)';
            ctx.beginPath();
            ctx.rect(-c.taille, -c.taille + coupe, c.taille * 2, c.taille);
            ctx.clip();
            ctx.drawImage(c.images[c.etape], -c.taille / 2, -c.taille, c.taille, c.taille);
            ctx.restore();
        } else {
            const p = pose_articulee(c);
            // Flaque qui s'étend sous le buste une fois au sol
            const f = entre(c.age, m.chute[1], m.chute[1] + 1.2);
            if (f > 0) {
                const { hx } = position_hanche(c, p);
                ctx.save();
                ctx.globalAlpha = 0.75 * alpha;
                ctx.fillStyle = m.flaque;
                ctx.beginPath();
                ctx.ellipse(hx + m.sens * c.taille * 0.3, c.y + c.taille - 3, c.taille * 0.42 * f, c.taille * 0.1 * f, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.save();
            ctx.globalAlpha = alpha;
            dessiner_corps_articule(ctx, c, p);
            ctx.restore();
        }

        // Poussière soulevée par la chute
        ctx.save();
        ctx.fillStyle = '#c8a878';
        for (const d of c.poussiere) {
            ctx.globalAlpha = 0.5 * (1 - d.age / 0.7);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * (1 + d.age * 2), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Gerbe de sang (ou d'étoiles)
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - c.age * 0.9);
        for (const q of c.particules) {
            ctx.fillStyle = q.couleur;
            if (c.etoiles) dessiner_etoile(ctx, q.x, q.y, q.taille + 1);
            else ctx.fillRect(q.x, q.y, q.taille, q.taille);
        }
        ctx.restore();
    }
}
