// backend/routes/userRoutes.js - Routes pour gestion des utilisateurs RDS (SQLite)

const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const multer = require('multer');
const xlsx = require('xlsx');

// Configuration multer pour l'upload de fichiers Excel
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/users
 * Récupérer tous les utilisateurs
 */
router.get('/', async (req, res) => {
    try {
        const users = await userService.getUsers();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/users/by-server
 * Récupérer les utilisateurs groupés par serveur
 */
router.get('/by-server', async (req, res) => {
    try {
        const usersByServer = await userService.getUsersByServer();
        res.json({ success: true, data: usersByServer });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs par serveur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/users/stats
 * Récupérer les statistiques des utilisateurs
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await userService.getUserStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/users
 * Créer ou mettre à jour un utilisateur
 */
router.post('/', async (req, res) => {
    try {
        const userData = req.body;
        await userService.saveUser(userData);
        res.json({ success: true, message: 'Utilisateur sauvegardé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/users/:username
 * Supprimer un utilisateur
 */
router.delete('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        await userService.deleteUser(username);
        res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/users/import-excel
 * Importer des utilisateurs depuis un fichier Excel
 */
router.post('/import-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
        }

        // Lire le fichier Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let imported = 0;
        let errors = [];

        // Importer chaque utilisateur
        for (const row of data) {
            try {
                // Mapper les colonnes Excel vers la structure SQLite
                const userData = {
                    username: row['Nom d\'utilisateur'] || row['username'],
                    server: row['Serveur'] || row['server'] || 'RDS01',
                    email: row['Email'] || row['email'] || '',
                    department: row['Département'] || row['department'] || '',
                    phone: row['Téléphone'] || row['phone'] || '',
                    notes: row['Notes'] || row['notes'] || ''
                };

                if (userData.username) {
                    await userService.saveUser(userData);
                    imported++;
                }
            } catch (err) {
                errors.push({ row, error: err.message });
            }
        }

        res.json({
            success: true,
            message: `${imported} utilisateurs importés avec succès`,
            imported,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Erreur lors de l\'import Excel:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
