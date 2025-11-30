// src/components/bulk/BulkActionsEngine.js
// Moteur d'exécution des actions groupées avec validation, progression et rollback

import { format, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import alertsService from '../../services/alertsService';

// Types et interfaces
class BulkActionResult {
    constructor(successful = 0, failed = 0, updatedLoans = [], errors = [], warnings = []) {
        this.successful = successful;
        this.failed = failed;
        this.updatedLoans = updatedLoans;
        this.errors = errors;
        this.warnings = warnings;
        this.timestamp = new Date().toISOString();
        this.totalProcessed = successful + failed;
        this.successRate = this.totalProcessed > 0 ? (successful / this.totalProcessed) * 100 : 0;
    }
}

class BulkActionError extends Error {
    constructor(message, failedLoans = [], errorCode = null) {
        super(message);
        this.name = 'BulkActionError';
        this.failedLoans = failedLoans;
        this.errorCode = errorCode;
    }
}

// Configuration des validations par action
const VALIDATION_RULES = {
    EXTEND: {
        maxLoans: 50,
        maxDays: 365,
        canExtend: (loan) => !['returned', 'cancelled'].includes(loan.status),
        checkConflicts: true
    },
    RECALL: {
        maxLoans: 100,
        canRecall: (loan) => ['active', 'overdue'].includes(loan.status),
        requiresEmail: true
    },
    TRANSFER: {
        maxLoans: 20,
        canTransfer: (loan) => !['returned', 'cancelled'].includes(loan.status),
        validateTargetUser: true
    },
    STATUS_CHANGE: {
        maxLoans: 100,
        canChangeStatus: (loan) => loan.status !== 'cancelled',
        validateNewStatus: true
    },
    EXPORT: {
        maxLoans: 1000,
        canExport: () => true,
        validateFormat: true
    },
    DELETE: {
        maxLoans: 10,
        canDelete: (loan) => loan.status === 'returned' || loan.status === 'cancelled',
        doubleConfirm: true
    }
};

// Service d'audit pour tracer les actions
class AuditService {
    static logAction(actionData) {
        const auditEntry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            userId: actionData.currentUser?.id || 'unknown',
            userRole: actionData.currentUser?.role || 'unknown',
            actionId: actionData.actionId,
            parameters: actionData.parameters,
            affectedLoans: actionData.selectedLoans?.map(loan => loan.id) || [],
            result: actionData.result,
            ipAddress: 'client-side', // À remplacer par l'IP réelle côté serveur
            userAgent: navigator.userAgent
        };

        // Stockage local pour demo - en production, envoi vers le serveur
        const existingAudit = JSON.parse(localStorage.getItem('bulkAuditLog') || '[]');
        existingAudit.unshift(auditEntry);
        
        // Garder seulement les 1000 dernières entrées
        if (existingAudit.length > 1000) {
            existingAudit.splice(1000);
        }
        
        localStorage.setItem('bulkAuditLog', JSON.stringify(existingAudit));
        
        // Émettre un événement pour l'interface utilisateur
        window.dispatchEvent(new CustomEvent('bulkActionLogged', {
            detail: auditEntry
        }));

        return auditEntry.id;
    }

    static getAuditHistory(filters = {}) {
        const auditLog = JSON.parse(localStorage.getItem('bulkAuditLog') || '[]');
        
        return auditLog.filter(entry => {
            if (filters.userId && entry.userId !== filters.userId) return false;
            if (filters.actionId && entry.actionId !== filters.actionId) return false;
            if (filters.dateFrom && entry.timestamp < filters.dateFrom) return false;
            if (filters.dateTo && entry.timestamp > filters.dateTo) return false;
            return true;
        });
    }
}

// Moteur principal des actions groupées
class BulkActionsEngine {
    static async executeBulkAction({
        actionId,
        selectedLoans,
        parameters = {},
        currentUser = {},
        onProgress = () => {}
    }) {
        const startTime = Date.now();
        onProgress(0, 'Initialisation de l\'action...');

        try {
            // 1. Validation initiale
            onProgress(5, 'Validation des paramètres...');
            const validationResult = await this.validateAction(actionId, selectedLoans, parameters, currentUser);
            
            if (!validationResult.isValid) {
                throw new BulkActionError(
                    `Validation échouée: ${validationResult.errors.join(', ')}`,
                    validationResult.failedLoans,
                    'VALIDATION_FAILED'
                );
            }

            // 2. Préparation des données
            onProgress(15, 'Préparation des données...');
            const actionConfig = this.getActionConfig(actionId);
            const processedLoans = await this.preprocessLoans(selectedLoans, actionId, parameters);

            // 3. Exécution de l'action par lots
            onProgress(25, 'Exécution de l\'action...');
            const result = await this.executeActionInBatches({
                actionId,
                loans: processedLoans,
                parameters,
                currentUser,
                config: actionConfig,
                onProgress
            });

            // 4. Post-traitement
            onProgress(90, 'Finalisation...');
            const finalResult = await this.postProcessResult(result, actionId, parameters);

            // 5. Audit
            onProgress(95, 'Enregistrement de l\'action...');
            const auditId = AuditService.logAction({
                actionId,
                selectedLoans,
                parameters,
                currentUser,
                result: finalResult,
                duration: Date.now() - startTime
            });
            finalResult.auditId = auditId;

            // 6. Finalisation
            onProgress(100, 'Terminé');
            return finalResult;

        } catch (error) {
            console.error('Erreur dans executeBulkAction:', error);
            
            // Log de l'erreur pour audit
            AuditService.logAction({
                actionId,
                selectedLoans,
                parameters,
                currentUser,
                result: { successful: 0, failed: selectedLoans.length, errors: [error.message] },
                error: error.message,
                duration: Date.now() - startTime
            });

            throw error;
        }
    }

    // Validation d'une action
    static async validateAction(actionId, selectedLoans, parameters, currentUser) {
        const errors = [];
        const failedLoans = [];
        const rules = VALIDATION_RULES[actionId];

        if (!rules) {
            errors.push(`Action inconnue: ${actionId}`);
            return { isValid: false, errors, failedLoans };
        }

        // Vérification des limites
        if (selectedLoans.length > rules.maxLoans) {
            errors.push(`Trop de prêts sélectionnés (${selectedLoans.length}/${rules.maxLoans})`);
        }

        // Validation des permissions utilisateur
        if (!this.hasPermission(currentUser, actionId)) {
            errors.push(`Permissions insuffisantes pour l'action ${actionId}`);
        }

        // Validation de chaque prêt
        for (const loan of selectedLoans) {
            try {
                const loanValidation = await this.validateLoanForAction(loan, actionId, parameters);
                if (!loanValidation.isValid) {
                    failedLoans.push({
                        loanId: loan.id,
                        errors: loanValidation.errors
                    });
                }
            } catch (error) {
                failedLoans.push({
                    loanId: loan.id,
                    errors: [error.message]
                });
            }
        }

        return {
            isValid: errors.length === 0 && failedLoans.length === 0,
            errors,
            failedLoans
        };
    }

    // Validation d'un prêt pour une action
    static async validateLoanForAction(loan, actionId, parameters) {
        const rules = VALIDATION_RULES[actionId];
        const errors = [];

        switch (actionId) {
            case 'EXTEND':
                if (rules.canExtend && !rules.canExtend(loan)) {
                    errors.push(`Le prêt ${loan.id} ne peut pas être prolongé`);
                }
                
                if (parameters.days > rules.maxDays) {
                    errors.push(`Période de prolongation trop longue (max ${rules.maxDays} jours)`);
                }
                
                // Vérification des conflits
                if (rules.checkConflicts) {
                    const conflictCheck = await this.checkExtendConflicts(loan, parameters.days);
                    if (!conflictCheck.isValid) {
                        errors.push(...conflictCheck.reasons);
                    }
                }
                break;

            case 'RECALL':
                if (rules.canRecall && !rules.canRecall(loan)) {
                    errors.push(`Le prêt ${loan.id} ne peut pas faire l'objet d'un rappel`);
                }
                break;

            case 'TRANSFER':
                if (rules.canTransfer && !rules.canTransfer(loan)) {
                    errors.push(`Le prêt ${loan.id} ne peut pas être transféré`);
                }
                
                if (rules.validateTargetUser && parameters.targetUser === loan.borrowerId) {
                    errors.push('Impossible de transférer vers le même utilisateur');
                }
                break;

            case 'STATUS_CHANGE':
                if (rules.canChangeStatus && !rules.canChangeStatus(loan)) {
                    errors.push(`Le statut du prêt ${loan.id} ne peut pas être modifié`);
                }
                
                if (rules.validateNewStatus && parameters.newStatus === loan.status) {
                    errors.push('Le nouveau statut est identique au statut actuel');
                }
                break;

            case 'DELETE':
                if (rules.canDelete && !rules.canDelete(loan)) {
                    errors.push(`Le prêt ${loan.id} ne peut pas être supprimé`);
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Vérification des conflits pour les prolongations
    static async checkExtendConflicts(loan, daysToAdd) {
        const newReturnDate = addDays(parseISO(loan.returnDate), daysToAdd);
        const conflicts = [];

        // Vérification des réservations conflictuelles
        // Cette logique devrait être implémentée côté serveur
        
        return {
            isValid: conflicts.length === 0,
            reasons: conflicts
        };
    }

    // Vérification des permissions utilisateur
    static hasPermission(user, actionId) {
        const rolePermissions = {
            'admin': ['EXTEND', 'RECALL', 'TRANSFER', 'STATUS_CHANGE', 'EXPORT', 'DELETE'],
            'manager': ['EXTEND', 'RECALL', 'TRANSFER', 'STATUS_CHANGE', 'EXPORT'],
            'user': ['RECALL', 'EXPORT']
        };

        const allowedActions = rolePermissions[user.role] || [];
        return allowedActions.includes(actionId);
    }

    // Pré-traitement des prêts
    static async preprocessLoans(loans, actionId, parameters) {
        return loans.map(loan => ({
            ...loan,
            _bulkProcessing: {
                originalStatus: loan.status,
                originalReturnDate: loan.returnDate,
                timestamp: new Date().toISOString()
            }
        }));
    }

    // Exécution de l'action par lots
    static async executeActionInBatches({ actionId, loans, parameters, currentUser, config, onProgress }) {
        const batchSize = config.batchSize || 10;
        const results = new BulkActionResult();
        
        for (let i = 0; i < loans.length; i += batchSize) {
            const batch = loans.slice(i, i + batchSize);
            const progress = 25 + (i / loans.length) * 60; // 25% à 85%
            
            onProgress(progress, `Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(loans.length / batchSize)}`);
            
            const batchResults = await Promise.allSettled(
                batch.map(loan => this.executeSingleLoanAction(actionId, loan, parameters, currentUser))
            );

            // Traitement des résultats du lot
            for (let j = 0; j < batchResults.length; j++) {
                const result = batchResults[j];
                const loan = batch[j];
                
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        results.successful++;
                        results.updatedLoans.push(result.value.updatedLoan);
                    } else {
                        results.failed++;
                        results.errors.push({
                            loanId: loan.id,
                            error: result.value.error
                        });
                    }
                } else {
                    results.failed++;
                    results.errors.push({
                        loanId: loan.id,
                        error: result.reason?.message || 'Erreur inconnue'
                    });
                }
            }

            // Petit délai pour éviter de surcharger le serveur
            if (i + batchSize < loans.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return results;
    }

    // Exécution d'une action sur un seul prêt
    static async executeSingleLoanAction(actionId, loan, parameters, currentUser) {
        try {
            const result = await this.executeActionLogic(actionId, loan, parameters, currentUser);
            
            return {
                success: true,
                updatedLoan: result.updatedLoan,
                auditInfo: result.auditInfo
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                loanId: loan.id
            };
        }
    }

    // Logique métier pour chaque action
    static async executeActionLogic(actionId, loan, parameters, currentUser) {
        const timestamp = new Date().toISOString();
        let updatedLoan = { ...loan };
        const auditInfo = {
            action: actionId,
            timestamp,
            userId: currentUser.id,
            parameters
        };

        switch (actionId) {
            case 'EXTEND':
                const newReturnDate = addDays(parseISO(loan.returnDate), parameters.days);
                updatedLoan = {
                    ...loan,
                    returnDate: newReturnDate.toISOString(),
                    status: 'active',
                    extended: (loan.extended || 0) + 1,
                    lastExtended: timestamp,
                    extendedBy: currentUser.id,
                    history: [
                        ...(loan.history || []),
                        {
                            action: 'extend',
                            timestamp,
                            userId: currentUser.id,
                            oldReturnDate: loan.returnDate,
                            newReturnDate: newReturnDate.toISOString(),
                            daysAdded: parameters.days
                        }
                    ]
                };
                break;

            case 'RECALL':
                // Simulation d'envoi d'email de rappel
                const recallResult = await this.sendRecallEmail(loan, parameters.message, currentUser);
                updatedLoan = {
                    ...loan,
                    lastRecall: timestamp,
                    recalledBy: currentUser.id,
                    recallCount: (loan.recallCount || 0) + 1,
                    history: [
                        ...(loan.history || []),
                        {
                            action: 'recall',
                            timestamp,
                            userId: currentUser.id,
                            message: parameters.message || 'Rappel automatique',
                            emailSent: recallResult.success,
                            emailId: recallResult.emailId
                        }
                    ]
                };
                break;

            case 'TRANSFER':
                updatedLoan = {
                    ...loan,
                    borrowerId: parameters.targetUser,
                    transferredAt: timestamp,
                    transferredBy: currentUser.id,
                    transferReason: parameters.reason || '',
                    history: [
                        ...(loan.history || []),
                        {
                            action: 'transfer',
                            timestamp,
                            userId: currentUser.id,
                            oldBorrowerId: loan.borrowerId,
                            newBorrowerId: parameters.targetUser,
                            reason: parameters.reason
                        }
                    ]
                };
                break;

            case 'STATUS_CHANGE':
                updatedLoan = {
                    ...loan,
                    status: parameters.newStatus,
                    statusChangedAt: timestamp,
                    statusChangedBy: currentUser.id,
                    statusChangeReason: parameters.reason || '',
                    history: [
                        ...(loan.history || []),
                        {
                            action: 'status_change',
                            timestamp,
                            userId: currentUser.id,
                            oldStatus: loan.status,
                            newStatus: parameters.newStatus,
                            reason: parameters.reason
                        }
                    ]
                };
                break;

            case 'EXPORT':
                // Pour l'export, on ne modifie pas le prêt mais on génère les données
                updatedLoan = {
                    ...loan,
                    lastExported: timestamp,
                    exportedBy: currentUser.id,
                    exportFormat: parameters.format,
                    history: [
                        ...(loan.history || []),
                        {
                            action: 'export',
                            timestamp,
                            userId: currentUser.id,
                            format: parameters.format,
                            fields: parameters.fields
                        }
                    ]
                };
                break;

            case 'DELETE':
                updatedLoan = {
                    ...loan,
                    status: 'deleted',
                    deletedAt: timestamp,
                    deletedBy: currentUser.id,
                    deletionReason: parameters.reason || 'Suppression en lot',
                    history: [
                        ...(loan.history || []),
                        {
                            action: 'delete',
                            timestamp,
                            userId: currentUser.id,
                            reason: parameters.reason
                        }
                    ]
                };
                break;

            default:
                throw new Error(`Action non implémentée: ${actionId}`);
        }

        return { updatedLoan, auditInfo };
    }

    // Simulation d'envoi d'email de rappel
    static async sendRecallEmail(loan, message, currentUser) {
        // Simulation d'envoi - en production, ceci ferait un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            emailId: `email_${Date.now()}_${loan.id}`,
            recipient: loan.borrowerEmail || loan.borrowerId,
            subject: `Rappel de retour de document - ${loan.documentTitle}`,
            body: message || 'Veuillez retourner le document emprunté dans les plus brefs délais.',
            sentAt: new Date().toISOString()
        };
    }

    // Post-traitement des résultats
    static async postProcessResult(result, actionId, parameters) {
        // Enrichissement des résultats selon l'action
        if (actionId === 'EXPORT') {
            const exportData = await this.generateExportData(result.updatedLoans, parameters);
            result.exportData = exportData;
            result.downloadUrl = await this.createDownloadUrl(exportData, parameters.format);
        }

        // Calcul des métriques d'audit
        result.auditMetrics = {
            averageProcessingTime: result.totalProcessed > 0 ? 
                result.totalProcessed / result.duration : 0,
            errorRate: result.failed / result.totalProcessed * 100,
            warningsCount: result.warnings.length
        };

        return result;
    }

    // Génération des données d'export
    static async generateExportData(loans, parameters) {
        const fields = parameters.fields || ['id', 'documentTitle', 'borrowerName', 'loanDate', 'returnDate', 'status'];
        
        return loans.map(loan => {
            const exportRecord = {};
            fields.forEach(field => {
                switch (field) {
                    case 'loanDate':
                    case 'returnDate':
                        exportRecord[field] = format(parseISO(loan[field]), 'dd/MM/yyyy HH:mm', { locale: fr });
                        break;
                    default:
                        exportRecord[field] = loan[field] || '';
                }
            });
            return exportRecord;
        });
    }

    // Création d'URL de téléchargement
    static async createDownloadUrl(data, format) {
        let content, mimeType, extension;
        
        switch (format) {
            case 'csv':
                content = this.convertToCSV(data);
                mimeType = 'text/csv';
                extension = 'csv';
                break;
            case 'json':
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                extension = 'json';
                break;
            case 'excel':
                // Simulation - en réalité utiliserait une librairie comme xlsx
                content = this.convertToExcel(data);
                mimeType = 'application/vnd.ms-excel';
                extension = 'xlsx';
                break;
            case 'pdf':
                // Simulation - en réalité utiliserait jsPDF
                content = this.convertToPDF(data);
                mimeType = 'application/pdf';
                extension = 'pdf';
                break;
            default:
                throw new Error(`Format non supporté: ${format}`);
        }

        const blob = new Blob([content], { type: mimeType });
        return URL.createObjectURL(blob);
    }

    // Utilitaires de conversion
    static convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');
        
        return csvContent;
    }

    static convertToExcel(data) {
        // Simulation - en réalité utiliserait xlsx ou exceljs
        return JSON.stringify(data, null, 2);
    }

    static convertToPDF(data) {
        // Simulation - en réalité utiliserait jsPDF
        return JSON.stringify(data, null, 2);
    }

    // Récupération de la configuration d'une action
    static getActionConfig(actionId) {
        const configs = {
            EXTEND: { batchSize: 5, delayBetweenBatches: 200 },
            RECALL: { batchSize: 10, delayBetweenBatches: 500 },
            TRANSFER: { batchSize: 3, delayBetweenBatches: 300 },
            STATUS_CHANGE: { batchSize: 15, delayBetweenBatches: 100 },
            EXPORT: { batchSize: 50, delayBetweenBatches: 50 },
            DELETE: { batchSize: 2, delayBetweenBatches: 1000, requiresConfirmation: true }
        };
        
        return configs[actionId] || { batchSize: 10, delayBetweenBatches: 100 };
    }

    // Méthode de rollback (en cas d'erreur)
    static async rollbackAction(auditId) {
        const auditLog = AuditService.getAuditHistory();
        const auditEntry = auditLog.find(entry => entry.id === auditId);
        
        if (!auditEntry) {
            throw new Error('Entrée d\'audit non trouvée');
        }

        // Implémentation du rollback selon le type d'action
        // Ceci nécessiterait une logique plus complexe pour restaurer l'état précédent
        console.log('Rollback de l\'action:', auditEntry);
    }
}

export default BulkActionsEngine;
export { BulkActionsEngine, BulkActionResult, BulkActionError, AuditService };