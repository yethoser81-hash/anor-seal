/**
 * ANOR_SEAL - Générateur Complet de Lot Industriel (Backend - SVG Natif / Sans dépendance native)
 * Associe les 4 coins géométriques, les glyphes, le lot et les séries compactes,
 * puis génère les visuels robustes pour l'industriel.
 */

const fs = require('fs');
const path = require('path');
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
 * Génère le balisage SVG pour une forme de repère ancrée
 */
function getCornerSvgShape(shape, x, y, size) {
    const half = size / 2;
    switch (shape) {
        case 'EMPTY_CIRCLE':
            return `<circle cx="${x + half}" cy="${y + half}" r="${half}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />`;
        case 'EMPTY_DIAMOND':
            return `<polygon points="${x + half},${y} ${x + size},${y + half} ${x + half},${y + size} ${x},${y + half}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />`;
        case 'EMPTY_H_RECTANGLE':
            return `<rect x="${x}" y="${y + size * 0.25}" width="${size}" height="${size * 0.5}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />`;
        case 'EMPTY_V_RECTANGLE':
            return `<rect x="${x + size * 0.25}" y="${y}" width="${size * 0.5}" height="${size}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />`;
        case 'EMPTY_TRIANGLE':
            return `<polygon points="${x + half},${y} ${x + size},${y + size} ${x},${y + size}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />`;
        case 'EMPTY_SQUARE':
        default:
            return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />`;
    }
}

/**
 * Génère le Sceau unitaire en SVG haute définition avec repères strictement ancrés dans le carré
 */
function generateUnitSealSvg(lotNumber, arabicIndex, compactSeries, cornerPattern) {
    const size = 800;
    const margin = 100;
    const boxX = margin;
    const boxY = margin;
    const boxSize = size - (2 * margin);
    const fSize = 50;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">\n`;
    
    // 1. Fond général
    svg += `  <rect width="${size}" height="${size}" fill="#FAF8F5" />\n`;

    // 2. Cadre principal de certification (Le Carré)
    svg += `  <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" fill="#FFFFFF" stroke="#0F766E" stroke-width="6" />\n`;

    // 3. Rendu des 4 coins géométriques ancrés STRICTEMENT aux 4 coins intérieurs du carré
    const cornerCoordinates = [
        { x: boxX, y: boxY },                               // Top-Left
        { x: boxX + boxSize - fSize, y: boxY },             // Top-Right
        { x: boxX + boxSize - fSize, y: boxY + boxSize - fSize }, // Bottom-Right
        { x: boxX, y: boxY + boxSize - fSize }              // Bottom-Left
    ];

    cornerCoordinates.forEach((pos, index) => {
        const shape = cornerPattern[index];
        svg += `  ${getCornerSvgShape(shape, pos.x, pos.y, fSize)}\n`;
    });

    // 4. Identité institutionnelle et textes
    svg += `  <text x="${size / 2}" y="${boxY + 70}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#0F766E" text-anchor="middle">ANOR CERTIFIED</text>\n`;
    svg += `  <line x1="${boxX + 80}" y1="${boxY + 95}" x2="${boxX + boxSize - 80}" y2="${boxY + 95}" stroke="#0F766E" stroke-width="2" />\n`;
    
    svg += `  <text x="${size / 2}" y="${boxY + 145}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1E293B" text-anchor="middle">LOT : ${lotNumber}</text>\n`;
    svg += `  <text x="${size / 2}" y="${boxY + 195}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#0F766E" text-anchor="middle">SERIE : ${compactSeries}</text>\n`;

    // 5. Index arabes en bas de l'encart
    svg += `  <text x="${size / 2}" y="${boxY + boxSize - 35}" font-family="Arial, sans-serif" font-size="16" fill="#64748B" text-anchor="middle">INDEX ARABES : #${arabicIndex}</text>\n`;

    svg += `</svg>`;
    return svg;
}

/**
 * Fonction principale de création de lot complet pour l'industriel
 */
function processIndustrialBatch(lotNumber, totalQuantity) {
    console.log(`[GÉNÉRATION] Traitement du lot ${lotNumber} pour ${totalQuantity} produits...`);
    
    const lotCornerPattern = generateRandomCornerPattern();
    console.log(`[SÉCURITÉ] Motif des 4 coins vides assigné au lot :`, lotCornerPattern);

    const batchDir = path.join(__dirname, `../output/batches/${lotNumber}`);
    fs.mkdirSync(batchDir, { recursive: true });

    let batchManifest = [];

    for (let i = 1; i <= totalQuantity; i++) {
        const compactSeries = toCompactRomanSeries(i);
        const unitSvg = generateUnitSealSvg(lotNumber, i, compactSeries, lotCornerPattern);
        
        if (totalQuantity <= 5000) {
            fs.writeFileSync(path.join(batchDir, `seal_${i}_${compactSeries}.svg`), unitSvg, 'utf-8');
        }

        batchManifest.path = batchManifest.push ? null : null; // structure
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

    console.log(`[SUCCÈS] Kit du lot ${lotNumber} généré avec succès dans : ${batchDir}`);
    return {
        lotNumber,
        totalQuantity,
        cornerPattern: lotCornerPattern,
        manifestPath: path.join(batchDir, `manifest_${lotNumber}.csv`)
    };
}

module.exports = { processIndustrialBatch, generateUnitSealSvg };