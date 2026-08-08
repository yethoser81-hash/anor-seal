const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const config = require('../config/sealConfig');
const { toCompactRomanSeries } = require('./variableStream');

/**
 * Dessine proprement un glyphe géométrique dans la trame
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
            ctx.moveTo(x + half, y + 4);
            ctx.lineTo(x + half, y + size - 4);
            ctx.moveTo(x + 4, y + half);
            ctx.lineTo(x + size - 4, y + half);
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
 * Génère le Sceau unitaire carré avec une bordure de glyphes alignée et une zone basse propre
 */
async function generateUnitSealPng(lotNumber, arabicIndex, compactSeries, cornerPattern) {
    const size = 800;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 1. Fond général
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, size, size);

    const margin = 50;
    const boxX = margin;
    const boxY = margin;
    const boxSize = size - (2 * margin);

    // 2. Cadre extérieur principal
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 5;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    // 3. Trame de glyphes rigoureusement alignée en bordure (cadre de sécurité)
    const glyphTypes = ['CIRCLE', 'SQUARE', 'DIAMOND', 'CROSS', 'BAR', 'EMPTY_CIRCLE'];
    const step = 45;
    
    // Fonction pseudo-aléatoire fixe basée sur les index pour garder la cohérence du lot
    let seed = arabicIndex * 33;
    const getSymbol = (i) => glyphTypes[(seed + i) % glyphTypes.length];

    let indexCount = 0;
    // Bordure Haute et Basse (dans la zone haute)
    for (let x = boxX + 30; x < boxX + boxSize - 30; x += step) {
        drawGlyph(ctx, getSymbol(indexCount++), x, boxY + 20, 26);
        drawGlyph(ctx, getSymbol(indexCount++), x, boxY + boxSize - 220, 26);
    }
    // Bordures Latérales
    for (let y = boxY + 80; y < boxY + boxSize - 240; y += step) {
        drawGlyph(ctx, getSymbol(indexCount++), boxX + 20, y, 26);
        drawGlyph(ctx, getSymbol(indexCount++), boxX + boxSize - 46, y, 26);
    }

    // 4. Logo ANOR central bien positionné
    const logoPath = path.join(__dirname, '../assets/logo_anor_master.png');
    if (fs.existsSync(logoPath)) {
        try {
            const logoImage = await loadImage(logoPath);
            const logoSize = 120;
            ctx.drawImage(logoImage, (size - logoSize) / 2, boxY + 70, logoSize, logoSize);
        } catch (e) {
            console.error("Erreur chargement logo :", e);
        }
    }

    // 5. Ligne de séparation nette et propre
    const sepY = boxY + 540;
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(boxX + 40, sepY);
    ctx.lineTo(boxX + boxSize - 40, sepY);
    ctx.stroke();

    // 6. Zone inférieure structurée pour le Lot et les métadonnées (sans aucun chevauchement)
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillStyle = '#0F766E';
    ctx.fillText(`LOT : ${lotNumber}`, size / 2, sepY + 65);

    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(`SÉRIE : ${compactSeries}   |   INDEX : #${arabicIndex}`, size / 2, sepY + 120);

    return canvas.toBuffer('image/png');
}

/**
 * Fonction principale de traitement du lot industriel
 */
async function processIndustrialBatch(lotNumber, totalQuantity) {
    console.log(`[GÉNÉRATION LOT CARRÉ PRO] Traitement du lot ${lotNumber} (${totalQuantity} pièces)...`);
    
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