// src/services/workflowTasks/AutoApprovalTask.js - TÂCHE D'AUTOMATISATION D'APPROBATION
// Gère l'approbation automatique des prêts selon des critères prédéfinis

import apiService from '../apiService';
import { LOAN_STATUS } from '../apiService';

class AutoApprovalTask {
    constructor(config = {}) {
        this.config = {
            // Critères d'approbation automatique
            maxLoanDays: config.maxLoanDays || 30,
            maxUserLoans: config.maxUserLoans || 3,
            restrictedCategories: config.restrictedCategories || [],
            requireApprovalCategories: config.requireApprovalCategories || ['confidential', 'restricted'],
            
            // Configuration des notifications
            notifyOnApproval: config.notifyOnApproval !== false,
            notifyOnRejection: config.notifyOnRejection !== false,
            approvalMessage: config.approvalMessage || 'Prêt approuvé automatiquement',
            rejectionMessage: config.rejectionMessage || 'Prêt nécessite une approbation manuelle',
            
            // Actions post-approbation
            autoExtendLoan: config.autoExtendLoan || false,
            autoExtendDays: config.autoExtendDays || 0,
            sendWelcomeEmail: config.sendWelcomeEmail || false,
            
            ...config
        };
    }

    /**
     * Exécuter la tâche d'approbation automatique
     */
    async execute(context) {
        const { task, executionContext, variables } = context;
        const loanId = variables.loanId || task.loanId;
        const customCriteria = task.criteria || {};

        try {
            // Récupérer les données du prêt
            const loan = await this.getLoanData(loanId);
            if (!loan) {
                throw new Error(`Prêt non trouvé: ${loanId}`);
            }

            // Évaluer les critères d'approbation
            const approvalResult = await this.evaluateApprovalCriteria(loan, customCriteria);
            
            let result = {
                loanId,
                decision: approvalResult.decision,
                reason: approvalResult.reason,
                confidence: approvalResult.confidence,
                autoApproved: false,
                criteria: approvalResult.criteria,
                timestamp: new Date().toISOString()
            };

            // Prendre la décision d'approbation
            if (approvalResult.decision === 'auto_approve') {
                result = await this.approveLoan(loan, result);
            } else if (approvalResult.decision === 'auto_reject') {
                result = await this.rejectLoan(loan, result);
            } else {
                // Nécessite une approbation manuelle
                result.decision = 'manual_review_required';
                result.message = 'Le prêt nécessite une révision manuelle';
            }

            return result;

        } catch (error) {
            console.error('Erreur lors de l\'approbation automatique:', error);
            
            return {
                loanId,
                decision: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Évaluer les critères d'approbation
     */
    async evaluateApprovalCriteria(loan, customCriteria) {
        const criteria = {
            loanDuration: null,
            userLoanCount: null,
            documentCategory: null,
            userHistory: null,
            riskScore: null
        };

        const reasons = [];
        let score = 0;
        let maxScore = 0;

        // 1. Durée du prêt
        maxScore += 25;
        const loanDays = this.calculateLoanDays(loan);
        criteria.loanDuration = {
            days: loanDays,
            withinLimit: loanDays <= this.config.maxLoanDays
        };

        if (criteria.loanDuration.withinLimit) {
            score += 25;
            reasons.push(`Durée acceptable (${loanDays} jours)`);
        } else {
            reasons.push(`Durée trop longue (${loanDays} jours > ${this.config.maxLoanDays})`);
        }

        // 2. Nombre de prêts actifs de l'utilisateur
        maxScore += 25;
        const userLoanCount = await this.getUserActiveLoansCount(loan.borrowerId);
        criteria.userLoanCount = {
            count: userLoanCount,
            withinLimit: userLoanCount < this.config.maxUserLoans
        };

        if (criteria.userLoanCount.withinLimit) {
            score += 25;
            reasons.push(`Nombre de prêts acceptable (${userLoanCount}/${this.config.maxUserLoans})`);
        } else {
            reasons.push(`Trop de prêts actifs (${userLoanCount} >= ${this.config.maxUserLoans})`);
        }

        // 3. Catégorie du document
        maxScore += 20;
        const documentCategory = await this.getDocumentCategory(loan.documentId);
        criteria.documentCategory = {
            category: documentCategory,
            isRestricted: this.config.restrictedCategories.includes(documentCategory),
            requiresApproval: this.config.requireApprovalCategories.includes(documentCategory)
        };

        if (criteria.documentCategory.isRestricted) {
            reasons.push(`Document dans une catégorie restreinte (${documentCategory})`);
        } else if (criteria.documentCategory.requiresApproval) {
            reasons.push(`Document nécessite une approbation (${documentCategory})`);
        } else {
            score += 20;
            reasons.push(`Catégorie acceptable (${documentCategory})`);
        }

        // 4. Historique de l'utilisateur
        maxScore += 15;
        const userHistory = await this.getUserHistory(loan.borrowerId);
        criteria.userHistory = {
            totalLoans: userHistory.totalLoans,
            returnedOnTime: userHistory.returnedOnTime,
            lateReturns: userHistory.lateReturns,
            reliabilityScore: this.calculateReliabilityScore(userHistory)
        };

        if (criteria.userHistory.reliabilityScore >= 80) {
            score += 15;
            reasons.push(`Excellent historique utilisateur (${criteria.userHistory.reliabilityScore}% fiable)`);
        } else if (criteria.userHistory.reliabilityScore >= 60) {
            score += 10;
            reasons.push(`Bon historique utilisateur (${criteria.userHistory.reliabilityScore}% fiable)`);
        } else {
            reasons.push(`Historique utilisateur mitigé (${criteria.userHistory.reliabilityScore}% fiable)`);
        }

        // 5. Score de risque global
        maxScore += 15;
        const riskScore = this.calculateRiskScore(loan, criteria);
        criteria.riskScore = riskScore;

        if (riskScore <= 20) {
            score += 15;
            reasons.push(`Score de risque très faible (${riskScore})`);
        } else if (riskScore <= 40) {
            score += 10;
            reasons.push(`Score de risque faible (${riskScore})`);
        } else if (riskScore <= 60) {
            score += 5;
            reasons.push(`Score de risque moyen (${riskScore})`);
        } else {
            reasons.push(`Score de risque élevé (${riskScore})`);
        }

        // Critères personnalisés
        if (customCriteria) {
            for (const [key, value] of Object.entries(customCriteria)) {
                if (key === 'minReliabilityScore' && criteria.userHistory.reliabilityScore < value) {
                    score -= 10;
                    reasons.push(`Score de fiabilité insuffisant (< ${value}%)`);
                }
                
                if (key === 'maxLoanAmount' && loan.amount > value) {
                    score -= 15;
                    reasons.push(`Montant de prêt trop élevé (> ${value})`);
                }
            }
        }

        // Calculer la décision
        const confidence = Math.round((score / maxScore) * 100);
        let decision = 'manual_review_required';
        let reason = 'Critères insuffisants pour approbation automatique';

        if (confidence >= 80 && !criteria.documentCategory.isRestricted && !criteria.documentCategory.requiresApproval) {
            decision = 'auto_approve';
            reason = `Approbation automatique avec ${confidence}% de confiance`;
        } else if (confidence <= 30 || criteria.documentCategory.isRestricted) {
            decision = 'auto_reject';
            reason = `Rejet automatique - ${confidence}% de confiance`;
        }

        return {
            decision,
            reason,
            confidence,
            score,
            maxScore,
            reasons,
            criteria
        };
    }

    /**
     * Approuver automatiquement un prêt
     */
    async approveLoan(loan, result) {
        try {
            // Mettre à jour le statut du prêt
            await apiService.updateLoan(loan.id, {
                status: LOAN_STATUS.ACTIVE,
                approvedAt: new Date().toISOString(),
                approvedBy: 'auto-approval-system',
                approvalReason: this.config.approvalMessage
            });

            // Actions post-approbation
            if (this.config.autoExtendLoan && this.config.autoExtendDays > 0) {
                await apiService.extendLoan(loan.id, {
                    extensionDays: this.config.autoExtendDays,
                    reason: 'Extension automatique post-approbation'
                });
            }

            // Envoyer notification
            if (this.config.notifyOnApproval) {
                await this.sendApprovalNotification(loan);
            }

            result.autoApproved = true;
            result.message = this.config.approvalMessage;
            result.approvedAt = new Date().toISOString();

            return result;

        } catch (error) {
            throw new Error(`Erreur lors de l'approbation: ${error.message}`);
        }
    }

    /**
     * Rejeter automatiquement un prêt
     */
    async rejectLoan(loan, result) {
        try {
            // Annuler le prêt
            await apiService.cancelLoan(loan.id, this.config.rejectionMessage);

            // Envoyer notification
            if (this.config.notifyOnRejection) {
                await this.sendRejectionNotification(loan);
            }

            result.autoRejected = true;
            result.message = this.config.rejectionMessage;
            result.rejectedAt = new Date().toISOString();

            return result;

        } catch (error) {
            throw new Error(`Erreur lors du rejet: ${error.message}`);
        }
    }

    // 📊 MÉTHODES D'AIDE

    /**
     * Récupérer les données du prêt
     */
    async getLoanData(loanId) {
        try {
            return await apiService.getLoanById(loanId);
        } catch (error) {
            console.error('Erreur lors de la récupération du prêt:', error);
            return null;
        }
    }

    /**
     * Calculer la durée du prêt en jours
     */
    calculateLoanDays(loan) {
        const startDate = new Date(loan.loanDate);
        const endDate = new Date(loan.returnDate);
        return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    /**
     * Récupérer le nombre de prêts actifs d'un utilisateur
     */
    async getUserActiveLoansCount(userId) {
        try {
            const loans = await apiService.getUserLoans(userId);
            return loans.filter(loan => loan.status === LOAN_STATUS.ACTIVE).length;
        } catch (error) {
            console.error('Erreur lors de la récupération des prêts utilisateur:', error);
            return 0;
        }
    }

    /**
     * Récupérer la catégorie d'un document
     */
    async getDocumentCategory(documentId) {
        try {
            const document = await apiService.getDocumentById(documentId);
            return document?.category || 'general';
        } catch (error) {
            console.error('Erreur lors de la récupération du document:', error);
            return 'general';
        }
    }

    /**
     * Récupérer l'historique d'un utilisateur
     */
    async getUserHistory(userId) {
        try {
            const activity = await apiService.getUserActivity(userId, { limit: 100 });
            
            const history = {
                totalLoans: 0,
                returnedOnTime: 0,
                lateReturns: 0,
                cancelledLoans: 0
            };

            if (activity && activity.loans) {
                activity.loans.forEach(loan => {
                    history.totalLoans++;
                    
                    if (loan.status === LOAN_STATUS.RETURNED) {
                        const actualReturnDate = new Date(loan.actualReturnDate || loan.returnDate);
                        const scheduledReturnDate = new Date(loan.returnDate);
                        
                        if (actualReturnDate <= scheduledReturnDate) {
                            history.returnedOnTime++;
                        } else {
                            history.lateReturns++;
                        }
                    } else if (loan.status === LOAN_STATUS.CANCELLED) {
                        history.cancelledLoans++;
                    }
                });
            }

            return history;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            return {
                totalLoans: 0,
                returnedOnTime: 0,
                lateReturns: 0,
                cancelledLoans: 0
            };
        }
    }

    /**
     * Calculer le score de fiabilité d'un utilisateur
     */
    calculateReliabilityScore(history) {
        if (history.totalLoans === 0) return 100;

        const onTimeRate = history.returnedOnTime / history.totalLoans;
        const completionRate = (history.returnedOnTime + history.lateReturns) / history.totalLoans;
        
        // Pondération: 70% pour les retours à l'heure, 30% pour le taux de complétion
        return Math.round((onTimeRate * 0.7 + completionRate * 0.3) * 100);
    }

    /**
     * Calculer un score de risque global
     */
    calculateRiskScore(loan, criteria) {
        let risk = 0;

        // Risque basé sur la durée
        if (criteria.loanDuration.days > this.config.maxLoanDays) {
            risk += 20;
        }

        // Risque basé sur le nombre de prêts
        if (criteria.userLoanCount.count >= this.config.maxUserLoans) {
            risk += 15;
        }

        // Risque basé sur l'historique utilisateur
        if (criteria.userHistory.reliabilityScore < 50) {
            risk += 25;
        } else if (criteria.userHistory.reliabilityScore < 70) {
            risk += 15;
        } else if (criteria.userHistory.reliabilityScore < 90) {
            risk += 5;
        }

        // Risque basé sur les catégories de documents
        if (criteria.documentCategory.requiresApproval) {
            risk += 15;
        }
        if (criteria.documentCategory.isRestricted) {
            risk += 25;
        }

        return Math.min(risk, 100);
    }

    /**
     * Envoyer une notification d'approbation
     */
    async sendApprovalNotification(loan) {
        try {
            await apiService.sendNotification({
                type: 'loan_approval',
                recipient: loan.borrowerId,
                title: 'Prêt approuvé automatiquement',
                message: `${this.config.approvalMessage} - Document: ${loan.documentTitle || loan.documentId}`,
                data: {
                    loanId: loan.id,
                    documentId: loan.documentId,
                    approvalType: 'automatic'
                }
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de notification d\'approbation:', error);
        }
    }

    /**
     * Envoyer une notification de rejet
     */
    async sendRejectionNotification(loan) {
        try {
            await apiService.sendNotification({
                type: 'loan_rejection',
                recipient: loan.borrowerId,
                title: 'Prêt rejeté automatiquement',
                message: `${this.config.rejectionMessage} - Document: ${loan.documentTitle || loan.documentId}`,
                data: {
                    loanId: loan.id,
                    documentId: loan.documentId,
                    rejectionType: 'automatic'
                }
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de notification de rejet:', error);
        }
    }

    /**
     * Obtenir la configuration de la tâche
     */
    getConfig() {
        return this.config;
    }

    /**
     * Mettre à jour la configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

export default AutoApprovalTask;