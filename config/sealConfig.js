/**
 * ANOR_SEAL - Configuration Globale du Système
 * Paramètres mathématiques, géométriques et dimensionnels du sceau.
 */

module.exports = {
    // Dimensions du sceau (exprimées en millimètres ou pixels de référence vectorielle)
    // 20x20 est le format minimal de base, mais extensible selon l'emballage.
    dimensions: {
        minSizeMm: 20, 
        defaultSizeMm: 25,
        resolutionDpi: 300
    },

    // Les 4 coins de repérage (Finders) "Hybrides et Vides"
    // Liste des 6 formes géométriques de contours autorisées pour les coins
    cornerShapes: [
        'EMPTY_SQUARE',
        'EMPTY_CIRCLE',
        'EMPTY_H_RECTANGLE',
        'EMPTY_V_RECTANGLE',
        'EMPTY_TRIANGLE',
        'EMPTY_DIAMOND'
    ],

    // Alphabet des glyphes de données périmétriques (pleins)
    dataGlyphs: [
        'CIRCLE',
        'SQUARE',
        'CROSS',
        'BAR'
    ],

    // Paramètres de sérialisation et compression romaine
    serialization: {
        useRomanNumerals: true,
        maxArabicLimitBeforeCompression: 1000
    }
};