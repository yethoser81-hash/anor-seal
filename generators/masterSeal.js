/**
 * ANOR_SEAL - Générateur du Sceau Maître (Backend)
 * Crée le gabarit vectoriel de référence pour un lot donné.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/sealConfig');

function generateMasterSealSvg(lotNumber, selectedCorners, outputFilename) {
    // Dimensions de base pour le rendu vectoriel (ex: 600x600 unités pour 2x2cm ou plus)
    const size = 600;
    const margin = 50;
    const boxSize = size - (2 * margin);
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">\n`;
    
    // Style et couleurs institutionnelles
    svgContent += `  <style>\n`;
    svgContent += `    .border-box { fill: #FFFFFF; stroke: #0F766E; stroke-width: 4; }\n`;
    svgContent += `    .finder { fill: none; stroke: #1E293B; stroke-width: 5; }\n`;
    svgContent += `    .center-title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #0F766E; text-anchor: middle; }\n`;
    svgContent += `    .center-text { font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; fill: #1E293B; text-anchor: middle; }\n`;
    svgContent += `    .center-sub { font-family: Arial, sans-serif; font-size: 16px; fill: #64748B; text-anchor: middle; }\n`;
    svgContent += `    .separator { stroke: #0F766E; stroke-width: 2; }\n`;
    svgContent += `  </style>\n`;

    // Fond général
    svgContent += `  <rect width="${size}" height="${size}" fill="#FAF8F5" />\n`;

    // Cadre central principal
    svgContent += `  <rect x="${margin + 40}" y="${margin + 40}" width="${boxSize - 80}" height="${boxSize - 80}" class="border-box" />\n`;

    // Dessin des 4 coins vides (Finders hybrides) selon la configuration du lot
    // selectedCorners attend un tableau de 4 formes [TL, TR, BR, BL]
    const fSize = 40;
    const coords = [
        { x: margin, y: margin },                             // Top-Left
        { x: size - margin - fSize, y: margin },              // Top-Right
        { x: size - margin - fSize, y: size - margin - fSize }, // Bottom-Right
        { x: margin, y: size - margin - fSize }               // Bottom-Left
    ];

    coords.forEach((pos, index) => {
        const shape = selectedCorners[index] || 'EMPTY_SQUARE';
        if (shape === 'EMPTY_SQUARE') {
            svgContent += `  <rect x="${pos.x}" y="${pos.y}" width="${fSize}" height="${fSize}" class="finder" />\n`;
        } else if (shape === 'EMPTY_CIRCLE') {
            svgContent += `  <circle cx="${pos.x + fSize/2}" cy="${pos.y + fSize/2}" r="${fSize/2}" class="finder" />\n`;
        } else {
            // Par défaut, rectangle ou autre contour vide de sécurité
            svgContent += `  <rect x="${pos.x}" y="${pos.y}" width="${fSize}" height="${fSize}" class="finder" />\n`;
        }
    });

    // Contenu textuel central fixe (Sceau Maître)
    svgContent += `  <text x="${size/2}" y="${margin + 90}" class="center-title">ANOR CERTIFIED</text>\n`;
    svgContent += `  <line x1="${margin + 70}" y1="${margin + 115}" x2="${size - margin - 70}" y2="${margin + 115}" class="separator" />\n`;
    svgContent += `  <text x="${size/2}" y="${margin + 160}" class="center-text">LOT : ${lotNumber}</text>\n`;
    svgContent += `  <text x="${size/2}" y="${margin + 200}" class="center-sub">[SERIE VARIABLE]</text>\n`;
    svgContent += `  <text x="${size/2}" y="${size - margin - 60}" class="center-sub" font-size="12">OFFICIAL SECURE SEAL</text>\n`;

    svgContent += `</svg>`;

    // Sauvegarde du fichier SVG maître
    const outputPath = path.join(__dirname, '../output', outputFilename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, svgContent, 'utf-8');
    
    console.log(`Sceau maître généré avec succès : ${outputPath}`);
}

module.exports = { generateMasterSealSvg };