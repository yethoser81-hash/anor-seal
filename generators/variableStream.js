/**
 * ANOR_SEAL - Générateur de Flux Variable (Backend)
 * Produit le fichier CSV avec la logique de sérialisation hybride (chiffres standards + notation romaine compacte par paliers).
 */

const fs = require('fs');
const path = require('path');

// Fonction de conversion personnalisée selon la règle industrielle demandée
function toCompactRomanSeries(num) {
    if (num < 100) {
        return num.toString(); // De 1 à 99, on garde le chiffre standard
    }
    
    // Paliers de compression : Millions, Milliers, Centaines
    let result = "";
    
    // Gestion des millions (M)
    if (num >= 1000000) {
        const millions = Math.floor(num / 1000000);
        result += millions + "M̅";
        num %= 1000000;
    }
    
    // Gestion des dizaines de milliers / milliers (M)
    if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        result += thousands + "M";
        num %= 1000;
    }
    
    // Gestion des centaines (C)
    if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        result += hundreds + "C";
        num %= 100;
    }
    
    // Le reste (unités/dizaines restantes)
    if (num > 0) {
        result += num;
    }
    
    return result;
}

function generateVariableCsv(lotNumber, totalQuantity, outputFilename = 'batch_variable_stream.csv') {
    let csvRows = ['index,lot_number,arabic_series,compact_series'];
    
    for (let i = 1; i <= totalQuantity; i++) {
        const compactVal = toCompactRomanSeries(i);
        csvRows.push(`${i},${lotNumber},${i},${compactVal}`);
    }

    const outputPath = path.join(__dirname, '../output', outputFilename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
    
    console.log(`Flux CSV variable mis à jour avec succès (${totalQuantity} entrées) : ${outputPath}`);
}

module.exports = { toCompactRomanSeries, generateVariableCsv };