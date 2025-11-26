// useUsersBatchActions.js - Hook personnalisé pour les actions en lot sur les utilisateurs
// Intégration complète avec les APIs DocuCortex

import { useState, useCallback, useEffect } from 'react';
import apiService from '../../services/apiService';
import BulkActionsEngine, { AuditService } from '../bulk/BulkActionsEngine';

// Hook principal pour la gestion des actions en lot sur les utilisateurs
export const useUsersBatchActions = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentAction, setCurrentAction] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Actions spécifiques aux utilisateurs avec les APIs DocuCortex
    const userBulkActions = {
        // Suppression d'utilisateurs
        deleteUsers: async (userIds, parameters = {}) => {
            setIsProcessing(true);
            setCurrentAction('Suppression des utilisateurs');
            setProgress(0);

            try {
                const results = [];
                let completed = 0;

                for (const userId of userIds) {
                    try {
                        setProgress((completed / userIds.length) * 100);
                        
                        // Appel API DocuCortex pour supprimer l'utilisateur
                        await apiService.deleteUser(userId);
                        
                        results.push({ userId, success: true });
                        completed++;
                    } catch (err) {
                        results.push({ 
                            userId, 
                            success: false, 
                            error: err.message 
                        });
                        completed++;
                    }
                }

                setProgress(100);
                setSuccess(`Suppression terminée: ${results.filter(r => r.success).length} succès`);
                
                return {
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    results
                };

            } catch (err) {
                setError(`Erreur lors de la suppression: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        },

        // Modification des groupes d'utilisateurs
        updateUserGroups: async (userIds, groups, actionType = 'add') => {
            setIsProcessing(true);
            setCurrentAction('Modification des groupes');
            setProgress(0);

            try {
                const results = [];
                let completed = 0;

                for (const userId of userIds) {
                    try {
                        setProgress((completed / userIds.length) * 100);
                        
                        // Appel API DocuCortex pour modifier les groupes
                        await apiService.updateUserGroups(userId, groups, actionType);
                        
                        results.push({ userId, success: true, action: actionType, groups });
                        completed++;
                    } catch (err) {
                        results.push({ 
                            userId, 
                            success: false, 
                            error: err.message 
                        });
                        completed++;
                    }
                }

                setProgress(100);
                setSuccess(`Modification terminée: ${results.filter(r => r.success).length} succès`);
                
                return {
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    results
                };

            } catch (err) {
                setError(`Erreur lors de la modification: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        },

        // Export Excel
        exportUsersExcel: async (userIds, fields = [], filters = {}) => {
            setIsProcessing(true);
            setCurrentAction('Export Excel en cours');
            setProgress(0);

            try {
                // Préparation des données
                const userData = await Promise.all(
                    userIds.map(async (userId) => {
                        try {
                            const user = await apiService.getUserById(userId);
                            const loans = await apiService.getUserLoans(userId);
                            
                            return {
                                ...user,
                                phoneLoans: loans.phoneLoans?.length || 0,
                                computerLoans: loans.computerLoans?.length || 0
                            };
                        } catch (err) {
                            return { username: userId, error: err.message };
                        }
                    })
                );

                setProgress(30);

                // Génération du fichier Excel
                const csvContent = generateCSVContent(userData, fields);
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                
                setProgress(80);

                // Téléchargement
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `export_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setProgress(100);
                setSuccess(`Export Excel terminé pour ${userIds.length} utilisateurs`);

                // Enregistrement dans l'audit
                AuditService.logAction({
                    actionId: 'EXPORT_EXCEL',
                    parameters: { userIds, fields, filters },
                    result: { success: true, count: userIds.length },
                    timestamp: new Date().toISOString()
                });

                return { success: true, count: userIds.length };

            } catch (err) {
                setError(`Erreur lors de l'export: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        },

        // Export PDF
        exportUsersPDF: async (userIds, template = 'detailed') => {
            setIsProcessing(true);
            setCurrentAction('Génération du rapport PDF');
            setProgress(0);

            try {
                // Récupération des données détaillées
                const userReports = await Promise.all(
                    userIds.map(async (userId, index) => {
                        try {
                            setProgress((index / userIds.length) * 50);
                            
                            const [user, activity] = await Promise.all([
                                apiService.getUserById(userId),
                                apiService.getUserActivity(userId, { limit: 10 })
                            ]);

                            return {
                                user,
                                activity: activity.data || [],
                                generatedAt: new Date().toISOString()
                            };
                        } catch (err) {
                            return { 
                                user: { username: userId }, 
                                error: err.message,
                                generatedAt: new Date().toISOString()
                            };
                        }
                    })
                );

                setProgress(70);

                // Génération du PDF (simulation - en production utiliser jsPDF)
                const pdfContent = generatePDFContent(userReports, template);
                const blob = new Blob([pdfContent], { type: 'application/pdf' });

                setProgress(90);

                // Téléchargement
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `rapport_utilisateurs_${new Date().toISOString().split('T')[0]}.pdf`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setProgress(100);
                setSuccess(`Rapport PDF généré pour ${userIds.length} utilisateurs`);

                // Enregistrement dans l'audit
                AuditService.logAction({
                    actionId: 'EXPORT_PDF',
                    parameters: { userIds, template },
                    result: { success: true, count: userIds.length },
                    timestamp: new Date().toISOString()
                });

                return { success: true, count: userIds.length };

            } catch (err) {
                setError(`Erreur lors de la génération PDF: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        },

        // Envoi d'emails
        sendEmails: async (userIds, emailData) => {
            setIsProcessing(true);
            setCurrentAction('Envoi des emails');
            setProgress(0);

            try {
                const results = [];
                let completed = 0;

                for (const userId of userIds) {
                    try {
                        setProgress((completed / userIds.length) * 100);
                        
                        // Récupération des informations utilisateur
                        const user = await apiService.getUserById(userId);
                        
                        if (!user.email) {
                            results.push({ 
                                userId, 
                                success: false, 
                                error: 'Email non trouvé' 
                            });
                            completed++;
                            continue;
                        }

                        // Simulation d'envoi d'email - en production, utiliser un service email
                        await apiService.sendNotification({
                            type: 'email',
                            recipient: user.email,
                            subject: emailData.subject,
                            message: emailData.message,
                            userId: userId
                        });

                        results.push({ 
                            userId, 
                            success: true, 
                            email: user.email 
                        });
                        completed++;
                    } catch (err) {
                        results.push({ 
                            userId, 
                            success: false, 
                            error: err.message 
                        });
                        completed++;
                    }
                }

                setProgress(100);
                setSuccess(`Emails envoyés: ${results.filter(r => r.success).length} succès`);
                
                return {
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    results
                };

            } catch (err) {
                setError(`Erreur lors de l'envoi: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        },

        // Désactivation/réactivation d'utilisateurs
        toggleUserStatus: async (userIds, enable = true) => {
            setIsProcessing(true);
            setCurrentAction(enable ? 'Activation des utilisateurs' : 'Désactivation des utilisateurs');
            setProgress(0);

            try {
                const results = [];
                let completed = 0;

                for (const userId of userIds) {
                    try {
                        setProgress((completed / userIds.length) * 100);
                        
                        // Appel API DocuCortex pour changer le statut
                        await apiService.updateUserStatus(userId, { 
                            adEnabled: enable ? 1 : 0 
                        });
                        
                        results.push({ userId, success: true, enabled: enable });
                        completed++;
                    } catch (err) {
                        results.push({ 
                            userId, 
                            success: false, 
                            error: err.message 
                        });
                        completed++;
                    }
                }

                setProgress(100);
                setSuccess(`${enable ? 'Activation' : 'Désactivation'} terminée: ${results.filter(r => r.success).length} succès`);
                
                return {
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    results
                };

            } catch (err) {
                setError(`Erreur lors du changement de statut: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        },

        // Mise à jour des informations en lot
        batchUpdateUsers: async (userIds, updates) => {
            setIsProcessing(true);
            setCurrentAction('Mise à jour en lot');
            setProgress(0);

            try {
                const results = [];
                let completed = 0;

                for (const userId of userIds) {
                    try {
                        setProgress((completed / userIds.length) * 100);
                        
                        // Appel API DocuCortex pour mettre à jour l'utilisateur
                        await apiService.updateUser(userId, updates);
                        
                        results.push({ userId, success: true, updates });
                        completed++;
                    } catch (err) {
                        results.push({ 
                            userId, 
                            success: false, 
                            error: err.message 
                        });
                        completed++;
                    }
                }

                setProgress(100);
                setSuccess(`Mise à jour terminée: ${results.filter(r => r.success).length} succès`);
                
                return {
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    results
                };

            } catch (err) {
                setError(`Erreur lors de la mise à jour: ${err.message}`);
                throw err;
            } finally {
                setIsProcessing(false);
                setCurrentAction(null);
                setProgress(0);
            }
        }
    };

    // Fonction de rollback générique
    const rollbackAction = useCallback(async (actionId, actionData) => {
        setIsProcessing(true);
        setCurrentAction('Annulation en cours');
        setProgress(0);

        try {
            // Récupération de l'historique d'audit
            const auditHistory = AuditService.getAuditHistory({ actionId });
            const lastAction = auditHistory.find(entry => entry.id === actionData.auditId);

            if (!lastAction) {
                throw new Error('Action à annuler non trouvée dans l\'historique');
            }

            // Application du rollback selon le type d'action
            switch (actionId) {
                case 'DELETE_USERS':
                    // Restaurer les utilisateurs supprimés
                    for (const userId of actionData.userIds) {
                        await apiService.restoreUser(userId);
                    }
                    break;

                case 'UPDATE_GROUPS':
                    // Revenir aux groupes précédents
                    for (const result of actionData.results) {
                        if (result.success) {
                            // Logique de rollback des groupes
                            await apiService.updateUserGroups(
                                result.userId, 
                                actionData.previousGroups, 
                                'replace'
                            );
                        }
                    }
                    break;

                case 'DISABLE_USERS':
                case 'ENABLE_USERS':
                    // Inverser le statut
                    const enable = actionId === 'DISABLE_USERS';
                    for (const userId of actionData.userIds) {
                        await apiService.updateUserStatus(userId, { adEnabled: enable ? 1 : 0 });
                    }
                    break;
            }

            setProgress(100);
            setSuccess('Action annulée avec succès');

            // Enregistrement du rollback dans l'audit
            AuditService.logAction({
                actionId: 'ROLLBACK',
                parameters: { originalAction: actionId, actionData },
                result: { success: true },
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            setError(`Erreur lors de l'annulation: ${err.message}`);
            throw err;
        } finally {
            setIsProcessing(false);
            setCurrentAction(null);
            setProgress(0);
        }
    }, []);

    // Effacer les messages
    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    // Obtenir l'historique des actions
    const getActionHistory = useCallback((filters = {}) => {
        return AuditService.getAuditHistory({
            ...filters,
            actionId: filters.actionId || 'users_bulk_action'
        });
    }, []);

    return {
        // État
        isProcessing,
        progress,
        currentAction,
        error,
        success,
        
        // Actions
        actions: userBulkActions,
        rollbackAction,
        
        // Utilitaires
        clearMessages,
        getActionHistory,
        
        // État setters (pour usage externe si nécessaire)
        setProgress,
        setError,
        setSuccess
    };
};

// Utilitaires pour la génération de contenu

// Génération de contenu CSV
const generateCSVContent = (userData, fields) => {
    const defaultFields = ['username', 'displayName', 'email', 'department', 'server', 'adEnabled'];
    const selectedFields = fields.length > 0 ? fields : defaultFields;
    
    // En-têtes CSV
    const headers = selectedFields.join(',');
    
    // Données CSV
    const rows = userData.map(user => {
        return selectedFields.map(field => {
            let value = user[field] || '';
            
            // Formater les valeurs spéciales
            if (field === 'adEnabled') {
                value = user.adEnabled ? 'Actif' : 'Inactif';
            } else if (field === 'createdDate') {
                value = new Date(user.createdDate).toLocaleDateString();
            }
            
            // Échapper les virgules et guillemets
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
        }).join(',');
    });
    
    return [headers, ...rows].join('\n');
};

// Génération de contenu PDF (simulation)
const generatePDFContent = (userReports, template) => {
    // Simulation de génération PDF - en production, utiliser jsPDF
    let content = `RAPPORT UTILISATEURS - ${new Date().toLocaleDateString()}\n`;
    content += '='.repeat(50) + '\n\n';
    
    userReports.forEach((report, index) => {
        content += `${index + 1}. ${report.user.displayName || report.user.username}\n`;
        content += `   Email: ${report.user.email || 'Non spécifié'}\n`;
        content += `   Département: ${report.user.department || 'Non spécifié'}\n`;
        content += `   Serveur: ${report.user.server || 'Non spécifié'}\n`;
        content += `   Statut: ${report.user.adEnabled ? 'Actif' : 'Inactif'}\n`;
        
        if (template === 'detailed' && report.activity) {
            content += `   Activité récente: ${report.activity.length} événements\n`;
        }
        
        if (report.error) {
            content += `   ERREUR: ${report.error}\n`;
        }
        
        content += '\n';
    });
    
    content += `\nGénéré le: ${new Date().toLocaleString()}\n`;
    content += `Nombre d'utilisateurs: ${userReports.length}\n`;
    
    return content;
};

export default useUsersBatchActions;