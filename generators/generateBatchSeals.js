/**
 * ANOR_SEAL - Générateur Complet de Lot Industriel (Backend)
 * Associe les 4 coins géométriques vides, les glyphes, le lot et les séries compactes,
 * puis prépare l'exportation pour l'industriel et l'injection en base de données.
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
    // On tire 4 coins (H-G, H-D, B-D, B-G)
    return [
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)]
    ];
}

/**
 * Génère le SVG d'un sceau unitaire (Sceau Maître + Série Compacte incrémentielle)
 */
function generateUnitSealSvg(lotNumber, arabicIndex, compactSeries, cornerPattern) {
    const size = 600;
    const margin = 50;
    const boxSize = size - (2 * margin);
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">\n`;
    
    svg += `  <style>\n`;
    svg += `    .border-box { fill: #FFFFFF; stroke: #0F766E; stroke-width: 4; }\n`;
    svg += `    .finder { fill: none; stroke: #1E293B; stroke-width: 5; }\n`;
    svg += `    .center-title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #0F766E; text-anchor: middle; }\n`;
    svg += `    .center-text { font-family: Arial, sans-serif; font-size: 26px; font-weight: bold; fill: #1E293B; text-anchor: middle; }\n`;
    svg += `    .center-sub { font-family: Arial, sans-serif; font-size: 16px; fill: #64748B; text-anchor: middle; }\n`;
    svg += `    .separator { stroke: #0F766E; stroke-width: 2; }\n`;
    svg += `  </style>\n`;

    // Fond et cadre
    svg += `  <rect width="${size}" height="${size}" fill="#FAF8F5" />\n`;
    svg += `  <rect x="${margin + 40}" y="${margin + 40}" width="${boxSize - 80}" height="${boxSize - 80}" class="border-box" />\n`;

    // Rendu des 4 coins vides (Finders dynamiques)
    const fSize = 40;
    const coords = [
        { x: margin, y: margin },                             // Top-Left
        { x: size - margin - fSize, y: margin },              // Top-Right
        { x: size - margin - fSize, y: size - margin - fSize }, // Bottom-Right
        { x: margin, y: size - margin - fSize }               // Bottom-Left
    ];

    coords.forEach((pos, index) => {
        const shape = cornerPattern[index];
        // Représentation vectorielle simplifiée des formes vides
        if (shape === 'EMPTY_CIRCLE') {
            svg += `  <circle cx="${pos.x + fSize/2}" cy="${pos.y + fSize/2}" r="${fSize/2}" class="finder" />\n`;
        } else if (shape === 'EMPTY_DIAMOND') {
            svg += `  <polygon points="${pos.x + fSize/2},${pos.y} ${pos.x + fSize},${pos.y + fSize/2} ${pos.x + fSize/2},${pos.y + fSize} ${pos.x},${pos.y + fSize/2}" class="finder" />\n`;
        } else {
            // Par défaut carré vide ou rectangle vide
            svg += `  <rect x="${pos.x}" y="${pos.y}" width="${fSize}" height="${fSize}" class="finder" />\n`;
        }
    });

    // Identité centrale (ANOR + Lot + Série Compacte)
    svg += `  <text x="${size/2}" y="${margin + 90}" class="center-title">ANOR CERTIFIED</text>\n`;
    svg += `  <line x1="${margin + 70}" y1="${margin + 115}" x2="${size - margin - 70}" y2="${margin + 115}" class="separator" />\n`;
    svg += `  <text x="${size/2}" y="${margin + 155}" class="center-sub">LOT : ${lotNumber}</text>\n`;
    svg += `  <text x="${size/2}" y="${margin + 200}" class="center-text">SERIE : ${compactSeries}</text>\n`;
    svg += `  <text x="${size/2}" y="${size - margin - 60}" class="center-sub" font-size="12">INDEX ARABES : #${arabicIndex}</text>\n`;

    svg += `</svg>`;
    return svg;
}

/**
 * Fonction principale de création de lot complet pour l'industriel
 */
function processIndustrialBatch(lotNumber, totalQuantity) {
    console.log(`[GÉNÉRATION] Traitement du lot ${lotNumber} pour ${totalQuantity} produits...`);
    
    // 1. Génération de l'empreinte unique des 4 coins pour ce lot
    const lotCornerPattern = generateRandomCornerPattern();
    console.log(`[SÉCURITÉ] Motif des 4 coins vides assigné au lot :`, lotCornerPattern);

    // 2. Dossier de sortie pour ce lot spécifique
    const batchDir = path.join(__dirname, `../output/batches/${lotNumber}`);
    fs.mkdirSync(batchDir, { recursive: true });

    // 3. Boucle de génération des séries unitaires (Flux ou Fichiers)
    let batchManifest = [];

    for (let i = 1; i <= totalQuantity; i++) {
        const compactSeries = toCompactRomanSeries(i);
        
        // Génération du sceau SVG unitaire
        const unitSvg = generateUnitSealSvg(lotNumber, i, compactSeries, lotCornerPattern);
        
        // Optionnel : Enregistrement physique des fichiers si l'industriel veut des images unitaires
        // (Pour de très gros volumes comme 1 million, on privilégie l'injection directe en base + flux d'impression à la volée)
        if (totalQuantity <= 5000) {
            fs.writeFileSync(path.join(batchDir, `seal_${i}_${compactSeries}.svg`), unitSvg, 'utf-8');
        }

        batchManifest.push({
            arabic_index: i,
            compact_series: compactSeries,
            corner_pattern: lotCornerPattern
        });
    }

    // 4. Génération du fichier CSV global pour l'imprimeur numérique
    let csvContent = 'arabic_index,compact_series,lot_number\n';
    batchManifest.forEach(item => {
        csvContent += `${item.arabic_index},${item.compact_series},${lotNumber}\n`;
    });
    fs.writeFileSync(path.join(batchDir, `manifest_${lotNumber}.csv`), csvContent, 'utf-8');

    console.log(`[SUCCÈS] Kit numérique du lot ${lotNumber} généré dans : ${batchDir}`);
    return {
        lotNumber,
        totalQuantity,
        cornerPattern: lotCornerPattern,
        manifestPath: path.join(batchDir, `manifest_${lotNumber}.csv`)
    };
}

module.exports = { processIndustrialBatch, generateUnitSealSvg };