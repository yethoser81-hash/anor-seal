/**
 * ANOR_SEAL - Serveur API Backend (Node.js & Express)
 * Gère l'authentification des scans, la forge des lots/emballages via les modules de production, et le contrôle anti-fraude.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Importation de la configuration et du module de génération de lots
const sealConfig = require('./config/sealConfig');
const generateBatchSeals = require('./generator/generateBatchSeals');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de Multer pour gérer les fichiers envoyés par le formulaire de la forge en mémoire
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (index.html, forge.css, assets, etc.) depuis le dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Routes de test de santé du serveur
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', system: 'ANOR_SEAL Backend Active' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'online', timestamp: new Date() });
});

/**
 * Route de génération et de forge d'un sceau de lot (Interface d'administration / Forge)
 * Utilise les modules centralisés (generateBatchSeals & sealConfig)
 */
app.post('/api/seals/generate-batch-seal', upload.fields([
    { name: 'certificat_pdf', maxCount: 1 },
    { name: 'visuel_produit', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            lot,
            quantite,
            type_emballage
        } = req.body;

        // Validation des champs obligatoires requis pour la forge
        if (!lot || !quantite || !type_emballage) {
            return res.status(400).json({ 
                success: false, 
                message: "Veuillez remplir les champs obligatoires (Lot, Quantité, Type d'emballage)." 
            });
        }

        console.log(`[FORGE EN COURS] Lancement de la génération pour le lot : ${lot}`);

        // Exécution du module de génération modulaire des lots et sceaux
        const result = await generateBatchSeals({
            data: req.body,
            files: req.files,
            config: sealConfig
        });

        return res.status(200).json({
            success: true,
            lot: result.lot || lot,
            sha256_hash: result.sha256_hash,
            imageUrl: result.imageUrl,
            zipUrl: result.zipUrl,
            message: "Sceau de lot forgé et enregistré avec succès via les modules de production."
        });

    } catch (error) {
        console.error('Erreur lors de la forge du sceau:', error);
        return res.status(500).json({ 
            success: false, 
            error: { message: error.message || 'Erreur interne du serveur lors de la forge.' }
        });
    }
});

/**
 * Route principale de vérification et d'authentification d'un sceau scanné (par l'application mobile)
 */
app.post('/api/verify-seal', async (req, res) => {
    try {
        const { lotNumber, compactSeries, detectedCorners } = req.body;

        if (!lotNumber || !compactSeries) {
            return res.status(400).json({ 
                success: false, 
                message: 'Paramètres de lot ou de série manquants.' 
            });
        }

        // TODO: Connexion Supabase pour interroger la base de données et valider le sceau
        // const { data: lotData, error: lotError } = await supabase
        //     .from('anor_lots')
        //     .select('*')
        //     .eq('lot_number', lotNumber)
        //     .single();

        console.log(`[SCAN REÇU] Lot: ${lotNumber} | Série: ${compactSeries}`);

        return res.json({
            success: true,
            status: 'AUTHENTIC',
            agency: 'ANOR',
            details: {
                lotNumber: lotNumber,
                series: compactSeries,
                scanCount: 1,
                message: 'Sceau certifié conforme. Produit authentique.'
            }
        });

    } catch (error) {
        console.error('Erreur lors de la vérification du sceau:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur de vérification ANOR_SEAL.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`ANOR_SEAL backend opérationnel sur le port ${PORT}`);
});