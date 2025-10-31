// server/apiRoutes.js - VERSION FINALE, 100% COMPLÈTE ET SÉCURISÉE

const express = require('express');
const configService = require('../backend/services/configService');
const dataService = require('../backend/services/dataService');
const adService = require('../backend/services/adService');
const excelService = require('../backend/services/excelService');
const userService = require('../backend/services/userService');
const accessoriesService = require('../backend/services/accessoriesService');
const chatService = require('../backend/services/chatService');
const notificationService = require('../backend/services/notificationService');
const technicianService = require('../backend/services/technicianService');
const rdsService = require('../backend/services/rdsService');

module.exports = (broadcast) => {
    const router = express.Router();

    const getCurrentTechnician = (req) => {
        const techId = req.headers['x-technician-id'];
        if (!techId) return (configService.appConfig.it_technicians || [])[0];
        const tech = (configService.appConfig.it_technicians || []).find(t => t.id === techId);
        return tech || (configService.appConfig.it_technicians || [])[0];
    };

    const asyncHandler = (fn) => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error(`❌ Erreur sur la route ${req.method} ${req.originalUrl}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.', details: error.message });
        });

    // --- ROUTES DE SANTÉ ET CONFIGURATION (toujours disponibles) ---
    router.get('/health', asyncHandler(async (req, res) => {
        if (!configService.isConfigurationValid()) {
            return res.status(503).json({
                status: 'error',
                message: 'Le serveur est en mode dégradé en raison d\'une configuration invalide.',
            });
        }
        res.json({ status: 'ok', message: 'Le serveur est opérationnel.' });
    }));
    router.get('/config', asyncHandler(async (req, res) => res.json(configService.getConfig())));
    router.post('/config', asyncHandler(async (req, res) => {
        const result = await configService.saveConfig(req.body.newConfig);
        broadcast({ type: 'config_updated' });
        res.json(result);
    }));

    // Middleware pour bloquer les autres routes si la config est invalide
    router.use((req, res, next) => {
        if (!configService.isConfigurationValid()) {
            return res.status(503).json({
                error: 'Service Indisponible',
                message: 'Le serveur est en mode dégradé car la configuration est invalide. Veuillez corriger config.json.'
            });
        }
        next();
    });

    // --- ROUTES PROTÉGÉES PAR LA CONFIGURATION ---
    router.get('/technicians/connected', asyncHandler(async (req, res) => res.json(await technicianService.getConnectedTechnicians())));
    router.post('/technicians/login', asyncHandler(async (req, res) => {
        const result = await technicianService.registerTechnicianLogin(req.body);
        broadcast({ type: 'data_updated', payload: { entity: 'technicians' } });
        res.json(result);
    }));

    router.get('/rds-sessions', asyncHandler(async (req, res) => res.json(await rdsService.getStoredRdsSessions())));
    router.post('/rds-sessions/refresh', asyncHandler(async (req, res) => {
        const result = await rdsService.refreshAndStoreRdsSessions();
        broadcast({ type: 'data_updated', payload: { entity: 'rds_sessions' } });
        res.json(result);
    }));
    router.post('/rds-sessions/send-message', asyncHandler(async (req, res) => res.json(await rdsService.sendMessage(req.body.server, req.body.sessionId, req.body.message))));
    router.get('/rds-sessions/ping/:server', asyncHandler(async (req, res) => res.json(await rdsService.pingServer(req.params.server))));
    
    router.get('/computers', asyncHandler(async (req, res) => res.json(await dataService.getComputers())));
    router.post('/computers', asyncHandler(async (req, res) => {
        const result = await dataService.saveComputer(req.body, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.status(201).json(result);
    }));
    router.put('/computers/:id', asyncHandler(async (req, res) => {
        const result = await dataService.saveComputer({ ...req.body, id: req.params.id }, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));
    router.delete('/computers/:id', asyncHandler(async (req, res) => {
        const result = await dataService.deleteComputer(req.params.id, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));
    router.post('/computers/:id/maintenance', asyncHandler(async (req, res) => {
        const result = await dataService.addComputerMaintenance(req.params.id, req.body, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));

    router.get('/loans', asyncHandler(async (req, res) => res.json(await dataService.getLoans())));
    router.post('/loans', asyncHandler(async (req, res) => {
        const result = await dataService.createLoan(req.body, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'loans' } });
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.status(201).json(result);
    }));
    // ✅ NOUVELLE ROUTE: Modification d'un prêt existant
    router.put('/loans/:id', asyncHandler(async (req, res) => {
        const result = await dataService.updateLoan(req.params.id, req.body, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'loans' } });
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));
    router.post('/loans/:id/return', asyncHandler(async (req, res) => {
        const result = await dataService.returnLoan(req.params.id, getCurrentTechnician(req), req.body.returnNotes, req.body.accessoryInfo);
        broadcast({ type: 'data_updated', payload: { entity: 'loans' } });
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));
    router.post('/loans/:id/extend', asyncHandler(async (req, res) => {
        const result = await dataService.extendLoan(req.params.id, req.body.newReturnDate, req.body.reason, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'loans' } });
        res.json(result);
    }));
    router.post('/loans/:id/cancel', asyncHandler(async (req, res) => {
        const result = await dataService.cancelLoan(req.params.id, req.body.reason, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'loans' } });
        broadcast({ type: 'data_updated', payload: { entity: 'computers' } });
        res.json(result);
    }));
    router.get('/loans/history', asyncHandler(async (req, res) => res.json(await dataService.getLoanHistory(req.query))));
    router.get('/loans/statistics', asyncHandler(async (req, res) => res.json(await dataService.getLoanStatistics())));
    router.get('/loans/settings', asyncHandler(async (req, res) => res.json(await dataService.getLoanSettings())));

    router.get('/accessories', asyncHandler(async (req, res) => res.json(await accessoriesService.getAccessories())));
    router.post('/accessories', asyncHandler(async (req, res) => {
        const result = await accessoriesService.saveAccessory(req.body, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'accessories' } });
        res.status(201).json(result);
    }));
    router.delete('/accessories/:id', asyncHandler(async (req, res) => {
        const result = await accessoriesService.deleteAccessory(req.params.id, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'accessories' } });
        res.json(result);
    }));

    router.get('/notifications', asyncHandler(async (req, res) => res.json(await notificationService.getNotifications())));
    router.get('/notifications/unread', asyncHandler(async (req, res) => res.json(await notificationService.getUnreadNotifications())));
    router.post('/notifications/:id/mark-read', asyncHandler(async (req, res) => {
        const result = await notificationService.markNotificationAsRead(req.params.id);
        broadcast({ type: 'data_updated', payload: { entity: 'notifications' } });
        res.json(result);
    }));
    router.post('/notifications/mark-all-read', asyncHandler(async (req, res) => {
        const result = await notificationService.markAllNotificationsAsRead();
        broadcast({ type: 'data_updated', payload: { entity: 'notifications' } });
        res.json(result);
    }));

    router.get('/ad/users/search/:term', asyncHandler(async (req, res) => res.json(await adService.searchAdUsers(req.params.term))));
    router.get('/ad/groups/search/:term', asyncHandler(async (req, res) => res.json(await adService.searchAdGroups(req.params.term))));
    router.get('/ad/groups/:groupName/members', asyncHandler(async (req, res) => res.json(await adService.getAdGroupMembers(req.params.groupName))));
    router.post('/ad/groups/members', asyncHandler(async (req, res) => {
        const result = await adService.addUserToGroup(req.body.username, req.body.groupName);
        broadcast({ type: 'data_updated', payload: { entity: 'ad_groups', group: req.body.groupName } });
        res.json(result);
    }));
    router.delete('/ad/groups/:groupName/members/:username', asyncHandler(async (req, res) => {
        const result = await adService.removeUserFromGroup(req.params.username, req.params.groupName);
        broadcast({ type: 'data_updated', payload: { entity: 'ad_groups', group: req.params.groupName } });
        res.json(result);
    }));
    router.get('/ad/users/:username/details', asyncHandler(async (req, res) => res.json(await adService.getAdUserDetails(req.params.username))));
    router.post('/ad/users/:username/enable', asyncHandler(async (req, res) => res.json(await adService.enableAdUser(req.params.username))));
    router.post('/ad/users/:username/disable', asyncHandler(async (req, res) => res.json(await adService.disableAdUser(req.params.username))));
    router.post('/ad/users/:username/reset-password', asyncHandler(async (req, res) => res.json(await adService.resetAdUserPassword(req.params.username, req.body.newPassword, req.body.mustChange))));
    router.post('/ad/users', asyncHandler(async (req, res) => res.json(await adService.createAdUser(req.body))));

    router.get('/ad/ous', asyncHandler(async (req, res) => {
        const { parentId } = req.query; // parentId sera l'ID (DistinguishedName) de l'OU parente
        res.json(await adService.getAdOUs(parentId || null));
    }));

    router.get('/ad/ou-users', asyncHandler(async (req, res) => {
        const { ouDN } = req.query;
        if (!ouDN) {
            return res.status(400).json({ error: 'Le paramètre ouDN est manquant.' });
        }
        res.json(await adService.getAdUsersInOU(ouDN));
    }));

    router.get('/excel/users', asyncHandler(async (req, res) => res.json(await userService.getUsersByServer())));
    router.post('/excel/users/refresh', asyncHandler(async (req, res) => {
        excelService.invalidateCache();
        const result = await userService.syncUsersFromExcel(true);
        broadcast({ type: 'data_updated', payload: { entity: 'excel_users' } });
        res.json(result);
    }));
    router.post('/excel/users', asyncHandler(async (req, res) => {
        const result = await userService.saveUser(req.body.user, getCurrentTechnician(req));
        if (result.success) broadcast({ type: 'data_updated', payload: { entity: 'excel_users' } });
        res.json(result);
    }));
    router.delete('/excel/users/:username', asyncHandler(async (req, res) => {
        const result = await userService.deleteUser(req.params.username, getCurrentTechnician(req));
        if (result.success) broadcast({ type: 'data_updated', payload: { entity: 'excel_users' } });
        res.json(result);
    }));

    router.get('/chat/channels', asyncHandler(async (req, res) => res.json(await chatService.getChannels())));
    router.post('/chat/channels', asyncHandler(async (req, res) => {
        const result = await chatService.addChannel(req.body.name, req.body.description, getCurrentTechnician(req));
        broadcast({ type: 'data_updated', payload: { entity: 'chat_channels' } });
        res.status(201).json(result);
    }));
    router.get('/chat/messages/:channelId', asyncHandler(async (req, res) => res.json(await chatService.getMessages(req.params.channelId))));
    router.post('/chat/messages', asyncHandler(async (req, res) => {
        const newMessage = await chatService.addMessage(req.body.channelId, req.body.messageText, getCurrentTechnician(req), req.body.fileInfo);
        broadcast({ type: 'chat_message_new', payload: newMessage });
        res.status(201).json(newMessage);
    }));
    router.put('/chat/messages/:messageId', asyncHandler(async (req, res) => {
        const result = await chatService.editMessage(req.params.messageId, req.body.channelId, req.body.newText, getCurrentTechnician(req));
        broadcast({ type: 'chat_message_updated', payload: { messageId: req.params.messageId, channelId: req.body.channelId } });
        res.json(result);
    }));
    router.delete('/chat/messages/:messageId', asyncHandler(async (req, res) => {
        const { channelId } = req.body;
        const result = await chatService.deleteMessage(req.params.messageId, channelId, getCurrentTechnician(req));
        broadcast({ type: 'chat_message_deleted', payload: { messageId: req.params.messageId, channelId } });
        res.json(result);
    }));
    router.post('/chat/reactions', asyncHandler(async (req, res) => {
        const { messageId, channelId, emoji } = req.body;
        const result = await chatService.toggleReaction(messageId, channelId, emoji, getCurrentTechnician(req).id);
        broadcast({ type: 'chat_reaction_toggled', payload: { messageId, channelId } });
        res.json(result);
    }));

    return router;
};