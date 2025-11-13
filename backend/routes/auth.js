/**
 * Routes d'authentification et gestion des utilisateurs
 */

const express = require('express');
const router = express.Router();
const userPermissionsService = require('../services/userPermissionsService');

// ==================== AUTHENTIFICATION ====================

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username et password requis'
            });
        }

        const user = await userPermissionsService.verifyPassword(username, password);

        if (!user) {
            // Log échec de connexion
            const userAttempt = userPermissionsService.getUserByUsername(username);
            if (userAttempt) {
                userPermissionsService.logLogin(
                    userAttempt.id,
                    req.ip,
                    req.get('user-agent'),
                    false,
                    'Mot de passe incorrect'
                );
            }

            return res.status(401).json({
                success: false,
                error: 'Identifiants invalides'
            });
        }

        // Log succès de connexion
        userPermissionsService.logLogin(
            user.id,
            req.ip,
            req.get('user-agent'),
            true
        );

        res.json({
            success: true,
            user: user,
            mustChangePassword: user.must_change_password === 1
        });
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/auth/change-password
 * Changer le mot de passe de l'utilisateur connecté
 */
router.post('/change-password', async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Données manquantes'
            });
        }

        // Vérifier l'ancien mot de passe si fourni
        if (oldPassword) {
            const user = userPermissionsService.getUserById(userId);
            const isValid = await userPermissionsService.verifyPassword(user.username, oldPassword);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Ancien mot de passe incorrect'
                });
            }
        }

        // Changer le mot de passe
        const success = await userPermissionsService.changePassword(userId, newPassword, true);

        if (success) {
            res.json({
                success: true,
                message: 'Mot de passe modifié avec succès'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Échec de modification du mot de passe'
            });
        }
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/auth/check-permissions/:userId/:tabName
 * Vérifier si un utilisateur a accès à un onglet
 */
router.get('/check-permissions/:userId/:tabName', (req, res) => {
    try {
        const { userId, tabName } = req.params;

        const hasAccess = userPermissionsService.hasAccessToTab(parseInt(userId), tabName);

        res.json({
            success: true,
            hasAccess: hasAccess
        });
    } catch (error) {
        console.error('Erreur vérification permissions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== GESTION UTILISATEURS ====================

/**
 * GET /api/auth/users
 * Liste tous les utilisateurs
 */
router.get('/users', (req, res) => {
    try {
        const users = userPermissionsService.getAllUsers();

        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/auth/users/:id
 * Obtenir un utilisateur par ID
 */
router.get('/users/:id', (req, res) => {
    try {
        const user = userPermissionsService.getUserById(parseInt(req.params.id));

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/auth/users
 * Créer un nouvel utilisateur
 */
router.post('/users', async (req, res) => {
    try {
        const { username, email, display_name, position, is_admin, permissions } = req.body;

        if (!username || !email || !display_name) {
            return res.status(400).json({
                success: false,
                error: 'Données obligatoires manquantes (username, email, display_name)'
            });
        }

        const userId = await userPermissionsService.createUser({
            username,
            email,
            display_name,
            position,
            is_admin,
            permissions
        });

        const user = userPermissionsService.getUserById(userId);

        res.json({
            success: true,
            message: 'Utilisateur créé avec succès',
            user: user
        });
    } catch (error) {
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/auth/users/:id
 * Mettre à jour un utilisateur
 */
router.put('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { email, display_name, position, is_admin, is_active } = req.body;

        const success = await userPermissionsService.updateUser(userId, {
            email,
            display_name,
            position,
            is_admin,
            is_active
        });

        if (success) {
            const user = userPermissionsService.getUserById(userId);
            res.json({
                success: true,
                message: 'Utilisateur mis à jour',
                user: user
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé ou aucune modification'
            });
        }
    } catch (error) {
        console.error('Erreur mise à jour utilisateur:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/auth/users/:id
 * Supprimer un utilisateur
 */
router.delete('/users/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (userId === 1) {
            return res.status(403).json({
                success: false,
                error: 'Impossible de supprimer l\'administrateur principal'
            });
        }

        const success = userPermissionsService.deleteUser(userId);

        if (success) {
            res.json({
                success: true,
                message: 'Utilisateur supprimé'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/auth/users/:id/permissions
 * Mettre à jour les permissions d'un utilisateur
 */
router.put('/users/:id/permissions', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const permissions = req.body;

        const success = userPermissionsService.updatePermissions(userId, permissions);

        if (success) {
            const user = userPermissionsService.getUserById(userId);
            res.json({
                success: true,
                message: 'Permissions mises à jour',
                user: user
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé ou aucune modification'
            });
        }
    } catch (error) {
        console.error('Erreur mise à jour permissions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/auth/users/:id/reset-password
 * Réinitialiser le mot de passe d'un utilisateur (admin uniquement)
 */
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Nouveau mot de passe requis'
            });
        }

        const success = await userPermissionsService.changePassword(userId, newPassword, false);

        if (success) {
            res.json({
                success: true,
                message: 'Mot de passe réinitialisé. L\'utilisateur devra le changer à la prochaine connexion.'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
    } catch (error) {
        console.error('Erreur réinitialisation mot de passe:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== STATISTIQUES ====================

/**
 * GET /api/auth/stats/login
 * Statistiques de connexion
 */
router.get('/stats/login', (req, res) => {
    try {
        const stats = userPermissionsService.getLoginStats();

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/auth/users/:id/login-history
 * Historique des connexions d'un utilisateur
 */
router.get('/users/:id/login-history', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 50;

        const history = userPermissionsService.getLoginHistory(userId, limit);

        res.json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
