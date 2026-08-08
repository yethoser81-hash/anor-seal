const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const config = require('../config/sealConfig');
const { toCompactRomanSeries } = require('./variableStream');

/**
 * Sélectionne de manière aléatoire ou séquentielle 4 coins vides parmi l'alphabet autorisé
 */
function generateRandomCornerPattern() {
    const shapes = config.cornerShapes;
    return [
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)]
    ];
}

/**
 * Dessine la forme géométrique du coin ancré sur le Canvas PNG
 */
function drawCornerShape(ctx, shape, x, y, size) {
    const half = size / 2;
    ctx.save();
    ctx.strokeStyle = '#0F766E';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 5;

    switch (shape) {
        case 'EMPTY_CIRCLE':
            ctx.beginPath();
            ctx.arc(x + half, y + half, half, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'EMPTY_DIAMOND':
            ctx.beginPath();
            ctx.moveTo(x + half, y);
            ctx.lineTo(x + size, y + half);
            ctx.lineTo(x + half, y + size);
            ctx.lineTo(x, y + half);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'EMPTY_H_RECTANGLE':
            ctx.fillRect(x, y + size * 0.25, size, size * 0.5);
            ctx.strokeRect(x, y + size * 0.25, size, size * 0.5);
            break;
        case 'EMPTY_V_RECTANGLE':
            ctx.fillRect(x + size * 0.25, y, size * 0.5, size);
            ctx.strokeRect(x + size * 0.25, y, size * 0.5, size);
            break;
        case 'EMPTY_TRIANGLE':
            ctx.beginPath();
            ctx.moveTo(x + half, y);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x, y + size);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'EMPTY_SQUARE':
        default:
            ctx.fillRect(x, y, size, size);
            ctx.strokeRect(x, y, size, size);
            break;
    }
    ctx.restore();
}

/**
 * Génère le Sceau unitaire en PNG Haute Définition
 */
async function generateUnitSealPng(lotNumber, arabicIndex, compactSeries, cornerPattern) {
    const size = 800;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const margin = 100;
    const boxX = margin;
    const boxY = margin;
    const boxSize = size - (2 * margin);
    dataSize = 50; // fSize renommé

    // 1. Fond général
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, size, size);

    // 2. Cadre principal de certification (Le Carré)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 6;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    // 3. Rendu des 4 coins géométriques ancrés STRICTEMENT aux 4 coins intérieurs du carré
    const cornerCoordinates = [
        { x: boxX, y: boxY },                                     // Top-Left
        { x: boxX + boxSize - dataSize, y: boxY },                // Top-Right
        { x: boxX + boxSize - dataSize, y: boxY + boxSize - dataSize }, // Bottom-Right
        { x: boxX, y: boxY + boxSize - dataSize }                 // Bottom-Left
    ];

    cornerCoordinates.forEach((pos, index) => {
        const shape = cornerPattern[index];
        drawCornerShape(ctx, shape, pos.x, pos.y, dataSize);
    });

    // 4. Identité institutionnelle et textes du haut
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#0F766E';
    ctx.fillText('ANOR CERTIFIED', size / 2, boxY + 70);

    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 80, boxY + 95);
    ctx.lineTo(boxX + boxSize - 80, boxY + 95);
    ctx.stroke();

    // 5. Insertion du logo central (assets/logo_anor_master.png)
    const logoPath = path.join(__dirname, '../assets/logo_anor_master.png');
    if (fs.existsSync(logoPath)) {
        try {
            const logoImage = await loadImage(logoPath);
            const logoSize = 120;
            ctx.drawImage(logoImage, (size - logoSize) / 2, boxY + 130, logoSize, logoSize);
        } catch (e) {
            console.error("Erreur lors du chargement du logo central PNG :", e);
        }
    }

    // 6. Textes de lot et série au centre/bas
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(`LOT : ${lotNumber}`, size / 2, boxY + 295);

    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = '#0F766E';
    ctx.fillText(`SERIE : ${compactSeries}`, size / 2, boxY + 345);

    // 7. Index arabes en bas de l'encart
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`INDEX ARABES : #${arabicIndex}`, size / 2, boxY + boxSize - 35);

    return canvas.toBuffer('image/png');
}

/**
 * Fonction principale de création de lot complet pour l'industriel (Sortie PNG HD)
 */
async function processIndustrialBatch(lotNumber, totalQuantity) {
    console.log(`[GÉNÉRATION PNG HD] Traitement du lot ${lotNumber} pour ${totalQuantity} produits...`);
    
    const lotCornerPattern = generateRandomCornerPattern();
    console.log(`[SÉCURITÉ] Motif des 4 coins vides assigné au lot :`, lotCornerPattern);

    const batchDir = path.join(__dirname, `../output/batches/${lotNumber}`);
    fs.mkdirSync(batchDir, { recursive: true });

    let batchManifest = [];

    for (let i = 1; i <= totalQuantity; i++) {
        const compactSeries = toCompactRomanSeries(i);
        const unitPngBuffer = await generateUnitSealPng(lotNumber, i, compactSeries, lotCornerPattern);
        
        if (totalQuantity <= 5000) {
            fs.writeFileSync(path.join(batchDir, `seal_${i}_${compactSeries}.png`), unitPngBuffer);
        }

        batchManifest.push({
            arabic_index: i,
            compact_series: compactSeries,
            corner_pattern: lotCornerPattern
        });
    }

    let csvContent = 'arabic_index,compact_series,lot_number\n';
    batchManifest.forEach(item => {
        csvContent += `${item.arabic_index},${item.compact_series},${lotNumber}\n`;
    });
    fs.writeFileSync(path.join(batchDir, `manifest_${lotNumber}.csv`), csvContent, 'utf-8');

    console.log(`[SUCCÈS] Kit PNG HD du lot ${lotNumber} généré avec succès dans : ${batchDir}`);
    return {
        lotNumber,
        totalQuantity,
        cornerPattern: lotCornerPattern,
        manifestPath: path.join(batchDir, `manifest_${lotNumber}.csv`)
    };
}

module.exports = { processIndustrialBatch, generateUnitSealPng };