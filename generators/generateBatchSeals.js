const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const config = require('../config/sealConfig');
const { toCompactRomanSeries } = require('./variableStream');

/**
 * Dessine un glyphe géométrique spécifique (carré, cercle, losange, croix, barre)
 */
function drawGlyph(ctx, type, x, y, size) {
    ctx.save();
    ctx.strokeStyle = '#0F766E';
    ctx.fillStyle = '#0F766E';
    ctx.lineWidth = 3;
    const half = size / 2;

    switch (type) {
        case 'CIRCLE':
            ctx.beginPath();
            ctx.arc(x + half, y + half, half * 0.7, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'EMPTY_CIRCLE':
            ctx.beginPath();
            ctx.arc(x + half, y + half, half * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 'SQUARE':
            ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
            break;
        case 'DIAMOND':
            ctx.beginPath();
            ctx.moveTo(x + half, y);
            ctx.lineTo(x + size, y + half);
            ctx.lineTo(x + half, y + size);
            ctx.lineTo(x, y + half);
            ctx.closePath();
            ctx.fill();
            break;
        case 'CROSS':
            ctx.beginPath();
            ctx.moveTo(x + half, y + 2);
            ctx.lineTo(x + half, y + size - 2);
            ctx.moveTo(x + 2, y + half);
            ctx.lineTo(x + size - 2, y + half);
            ctx.stroke();
            break;
        case 'BAR':
        default:
            ctx.fillRect(x + size * 0.35, y + size * 0.1, size * 0.3, size * 0.8);
            break;
    }
    ctx.restore();
}

/**
 * Génère le Sceau unitaire carré avec trame de glyphes intérieurs et zone de lot en bas
 */
async function generateUnitSealPng(lotNumber, arabicIndex, compactSeries, cornerPattern) {
    const size = 800;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 1. Fond général du sceau
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, size, size);

    const margin = 60;
    const boxX = margin;
    const boxY = margin;
    const boxSize = size - (2 * margin);

    // 2. Cadre carré extérieur principal
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 6;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    // 3. Trame de glyphes intérieurs (répartition style motif technique)
    const glyphTypes = ['CIRCLE', 'SQUARE', 'DIAMOND', 'CROSS', 'BAR', 'EMPTY_CIRCLE'];
    const gridSize = 40;
    const startX = boxX + 30;
    const startY = boxY + 30;
    const endX = boxX + boxSize - 50;
    const endY = boxY + boxSize - 220; // Laisse de l'espace en bas pour le bloc Lot

    // Remplissage subtil en arrière-plan de glyphes
    let seed = 123;
    function pseudoRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    for (let gx = startX; gx < endX; gx += gridSize) {
        for (let gy = startY; gy < endY; gy += gridSize) {
            // On ne met pas de glyphes en plein milieu pour préserver la lisibilité du logo et du texte
            const distToCenterCenter = Math.hypot(gx - (size/2), gy - (boxY + 160));
            if (distToCenterCenter > 130) {
                if (pseudoRandom() > 0.4) {
                    const randomGlyph = glyphTypes[Math.floor(pseudoRandom() * glyphTypes.length)];
                    drawGlyph(ctx, randomGlyph, gx, gy, 24);
                }
            }
        }
    }

    // 4. Insertion du logo ANOR central
    const logoPath = path.join(__dirname, '../assets/logo_anor_master.png');
    if (fs.existsSync(logoPath)) {
        try {
            const logoImage = await loadImage(logoPath);
            const logoSize = 110;
            ctx.drawImage(logoImage, (size - logoSize) / 2, boxY + 50, logoSize, logoSize);
        } catch (e) {
            console.error("Erreur chargement logo :", e);
        }
    }

    // 5. Zone inférieure dédiée au Lot et à la Série (Conforme à ton attente)
    // Séparateur fin
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 50, boxY + 410);
    ctx.lineTo(boxX + boxSize - 50, boxY + 410);
    ctx.stroke();

    // Texte LOT
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#0F766E';
    ctx.fillText(`LOT ${lotNumber}`, size / 2, boxY + 470);

    // Texte Série / Code Datamatrix simulé en bas
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(`SERIE : ${compactSeries} / DM : #${arabicIndex}`, size / 2, boxY + 520);

    return canvas.toBuffer('image/png');
}

/**
 * Fonction principale de traitement du lot industriel
 */
async function processIndustrialBatch(lotNumber, totalQuantity) {
    console.log(`[GÉNÉRATION LOT CARRÉ] Traitement du lot ${lotNumber} (${totalQuantity} pièces)...`);
    
    const lotCornerPattern = ['SQUARE', 'CIRCLE', 'DIAMOND', 'CROSS'];
    const batchDir = path.join(__dirname, `../output/batches/${lotNumber}`);
    fs.mkdirSync(batchDir, { recursive: true });

    const csvContent = `lot_number,total_quantity\n${lotNumber},${totalQuantity}`;
    fs.writeFileSync(path.join(batchDir, `manifest_${lotNumber}.csv`), csvContent, 'utf-8');

    return {
        lotNumber,
        totalQuantity,
        cornerPattern: lotCornerPattern,
        manifestPath: path.join(batchDir, `manifest_${lotNumber}.csv`)
    };
}

module.exports = { 
    processIndustrialBatch, 
    generateUnitSealPng, 
    generateUnitSealSvg: generateUnitSealPng 
};