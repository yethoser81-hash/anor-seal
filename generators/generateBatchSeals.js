/**
 * ANOR_SEAL - Générateur Complet de Lot Industriel (Backend - PNG Souverain & Repères Ancrés)
 * Associe les 4 coins géométriques, les glyphes, le lot et les séries compactes,
 * puis génère les visuels en PNG pur pour l'industriel.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
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
 * Dessine une forme de repère géométrique ancrée exactement aux coordonnées cibles
 */
function drawCornerShape(ctx, shape, x, y, size) {
    ctx.save();
    ctx.strokeStyle = '#1E293B';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 5;

    switch (shape) {
        case 'EMPTY_CIRCLE':
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'EMPTY_DIAMOND':
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y);
            ctx.lineTo(x + size, y + size / 2);
            ctx.lineTo(x + size / 2, y + size);
            ctx.lineTo(x, y + size / 2);
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
            ctx.moveTo(x + size / 2, y);
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
 * Génère le PNG d'un sceau unitaire avec les repères ancrés dans le carré
 */
async function generateUnitSealPng(lotNumber, arabicIndex, compactSeries, cornerPattern, productImgPath) {
    const size = 800; // Haute définition industrielle
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 1. Fond général du sceau
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, size, size);

    // 2. Cadre principal de certification (Le Carré)
    const margin = 100;
    const boxX = margin;
    const boxY = margin;
    const boxSize = size - (2 * margin);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 6;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    // 3. Rendu des 4 coins géométriques ancrés STRICTEMENT aux 4 coins intérieurs du carré
    const fSize = 50;
    const cornerCoordinates = [
        { x: boxX, y: boxY },                               // Top-Left (H-G)
        { x: boxX + boxSize - fSize, y: boxY },             // Top-Right (H-D)
        { x: boxX + boxSize - fSize, y: boxY + boxSize - fSize }, // Bottom-Right (B-D)
        { x: boxX, y: boxY + boxSize - fSize }              // Bottom-Left (B-G)
    ];

    cornerCoordinates.forEach((pos, index) => {
        const shape = cornerPattern[index];
        drawCornerShape(ctx, shape, pos.x, pos.y, fSize);
    });

    // 4. Logo central / Filigrane et identité institutionnelle
    ctx.fillStyle = '#0F766E';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANOR CERTIFIED', size / 2, boxY + 70);

    // Ligne de séparation
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 80, boxY + 95);
    ctx.lineTo(boxX + boxSize - 80, boxY + 95);
    ctx.stroke();

    // Textes centraux (Lot & Série)
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`LOT : ${lotNumber}`, size / 2, boxY + 145);

    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = '#0F766E';
    ctx.fillText(`SERIE : ${compactSeries}`, size / 2, boxY + 195);

    // 5. Incrustation optionnelle du visuel produit ou logo au centre si disponible
    if (productImgPath && fs.existsSync(productImgPath)) {
        try {
            const productImg = await loadImage(productImgPath);
            const imgSize = 140;
            ctx.drawImage(productImg, (size / 2) - (imgSize / 2), boxY + 220, imgSize, imgSize);
        } catch (e) {
            console.error("Erreur de chargement du visuel produit :", e);
        }
    }

    // 6. Index arabes en bas de l'encart
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText(`INDEX ARABES : #${arabicIndex}`, size / 2, boxY + boxSize - 35);

    // Retourne le buffer PNG
    return canvas.toBuffer('image/png');
}

/**
 * Fonction principale de création de lot complet pour l'industriel (Export PNG + Manifeste CSV)
 */
async function processIndustrialBatch(lotNumber, totalQuantity, productImgPath = null) {
    console.log(`[GÉNÉRATION PNG] Traitement du lot ${lotNumber} pour ${totalQuantity} produits...`);
    
    const lotCornerPattern = generateRandomCornerPattern();
    console.log(`[SÉCURITÉ] Motif des 4 coins vides assigné au lot :`, lotCornerPattern);

    const batchDir = path.join(__dirname, `../output/batches/${lotNumber}`);
    fs.mkdirSync(batchDir, { recursive: true });

    let batchManifest = [];

    for (let i = 1; i <= totalQuantity; i++) {
        const compactSeries = toCompactRomanSeries(i);
        
        // Génération du sceau unitaire au format PNG souverain
        const unitPngBuffer = await generateUnitSealPng(lotNumber, i, compactSeries, lotCornerPattern, productImgPath);
        
        // Sauvegarde physique de l'image PNG unitaire si le volume est raisonnable
        if (totalQuantity <= 5000) {
            fs.writeFileSync(path.join(batchDir, `seal_${i}_${compactSeries}.png`), unitPngBuffer);
        }

        batchManifest.push({
            arabic_index: i,
            compact_series: compactSeries,
            corner_pattern: lotCornerPattern
        });
    }

    // Génération du manifeste CSV global
    let csvContent = 'arabic_index,compact_series,lot_number\n';
    batchManifest.forEach(item => {
        csvContent += `${item.arabic_index},${item.compact_series},${lotNumber}\n`;
    });
    fs.writeFileSync(path.join(batchDir, `manifest_${lotNumber}.csv`), csvContent, 'utf-8');

    console.log(`[SUCCÈS] Kit PNG souverain du lot ${lotNumber} généré dans : ${batchDir}`);
    return {
        lotNumber,
        totalQuantity,
        cornerPattern: lotCornerPattern,
        manifestPath: path.join(batchDir, `manifest_${lotNumber}.csv`)
    };
}

module.exports = { processIndustrialBatch, generateUnitSealPng };