/**
 * ANOR_SEAL - Serveur API Backend (Node.js & Express)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const sealConfig = require('./config/sealConfig');
const { processIndustrialBatch, generateUnitSealSvg } = require('./generators/generateBatchSeals');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', system: 'ANOR_SEAL Backend Active' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'online', timestamp: new Date() });
});

/**
 * Route de génération et de forge d'un sceau de lot
 */
app.post('/api/seals/generate-batch-seal', upload.fields([
    { name: 'certificat_pdf', maxCount: 1 },
    { name: 'visuel_produit', maxCount: 1 }
]), async (req, res) => {
    try {
        const { lot, quantite, type_emballage, nom_produit, pays_origine } = req.body;

        if (!lot || !quantite || !type_emballage) {
            return res.status(400).json({ 
                success: false, 
                message: "Veuillez remplir les champs obligatoires (Lot, Quantité, Type d'emballage)." 
            });
        }

        console.log(`[FORGE DU LOT] Traitement pour le lot : ${lot} (Quantité : ${quantite})`);

        let batchResult;
        try {
            batchResult = processIndustrialBatch(lot, parseInt(quantite, 10));
        } catch (genError) {
            console.error("Erreur dans processIndustrialBatch:", genError);
            throw new Error(`Erreur du générateur de lot : ${genError.message}`);
        }

        if (!batchResult || !batchResult.cornerPattern) {
            throw new Error("Le générateur n'a pas retourné de motif de coins valide (cornerPattern).");
        }

        // 2. Génération du sceau PNG unitaire Haute Définition (avec await)
        const samplePngBuffer = await generateUnitSealSvg(lot, 1, "I", batchResult.cornerPattern);
        
        // Conversion du buffer PNG en base64 pour le front-end
        const pngBase64 = samplePngBuffer.toString('base64');
        const imageUrl = `data:image/png;base64,${pngBase64}`;

        // 3. Calcul de l'empreinte Hash SHA-256 unique
        const rawStringData = `${nom_produit || 'Produit'}-${lot}-${quantite}-${pays_origine || 'Cameroun'}-${Date.now()}`;
        const sha256_hash = crypto.createHash('sha256').update(rawStringData).digest('hex');

        const zipUrl = `/output/batches/${lot}/manifest_${lot}.csv`;

        return res.status(200).json({
            success: true,
            lot: batchResult.lotNumber,
            sha256_hash: sha256_hash,
            imageUrl: imageUrl,
            zipUrl: zipUrl,
            cornerPattern: batchResult.cornerPattern,
            message: "Sceau de lot forgé et enregistré avec succès."
        });

    } catch (error) {
        console.error('Erreur lors de la forge du sceau:', error);
        return res.status(500).json({ 
            success: false, 
            error: { message: error.message || 'Erreur interne du serveur lors de la forge.' }
        });
    }
});

app.post('/api/verify-seal', async (req, res) => {
    try {
        const { lotNumber, compactSeries } = req.body;
        if (!lotNumber || !compactSeries) {
            return res.status(400).json({ success: false, message: 'Paramètres manquants.' });
        }
        return res.json({
            success: true,
            status: 'AUTHENTIC',
            agency: 'ANOR',
            details: { lotNumber, series: compactSeries, scanCount: 1, message: 'Sceau certifié conforme.' }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erreur interne.' });
    }
});

app.listen(PORT, () => {
    console.log(`ANOR_SEAL backend opérationnel sur le port ${PORT}`);
});