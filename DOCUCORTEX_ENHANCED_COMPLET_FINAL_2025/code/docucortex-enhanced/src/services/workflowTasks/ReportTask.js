// src/services/workflowTasks/ReportTask.js - TÂCHE DE GÉNÉRATION DE RAPPORTS WORKFLOW
// Génère des rapports automatisés selon des templates et planification

import apiService from '../apiService';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

class ReportTask {
    constructor(config = {}) {
        this.config = {
            // Templates de rapports disponibles
            templates: {
                ...config.templates,
                loan_summary: {
                    name: 'Résumé des Prêts',
                    description: 'Rapport de synthèse des prêts sur une période',
                    type: 'summary',
                    sections: ['overview', 'statistics', 'trends'],
                    defaultPeriod: 'month'
                },
                overdue_report: {
                    name: 'Rapport des Prêts en Retard',
                    description: 'Liste détaillée des prêts en retard',
                    type: 'detailed',
                    sections: ['overdue_loans', 'statistics', 'recommendations'],
                    defaultPeriod: 'week'
                },
                user_activity: {
                    name: 'Rapport d\'Activité Utilisateur',
                    description: 'Analyse de l\'activité des utilisateurs',
                    type: 'analytics',
                    sections: ['user_stats', 'activity_trends', 'top_users'],
                    defaultPeriod: 'month'
                },
                system_performance: {
                    name: 'Rapport de Performance Système',
                    description: 'Métriques de performance du système',
                    type: 'technical',
                    sections: ['performance_metrics', 'errors', 'usage_stats'],
                    defaultPeriod: 'week'
                },
                compliance_report: {
                    name: 'Rapport de Conformité',
                    description: 'Vérification de la conformité des processus',
                    type: 'compliance',
                    sections: ['compliance_status', 'violations', 'audit_trail'],
                    defaultPeriod: 'quarter'
                }
            },
            
            // Configuration de génération
            generationSettings: {
                format: config.format || 'pdf', // 'pdf', 'html', 'csv', 'json'
                includeCharts: config.includeCharts !== false,
                includeImages: config.includeImages !== false,
                maxRecords: config.maxRecords || 10000,
                timeout: config.timeout || 300000, // 5 minutes
                ...config.generationSettings
            },
            
            // Configuration de distribution
            distribution: {
                email: config.email !== false,
                download: config.download !== false,
                store: config.store !== false,
                share: config.share !== false,
                ...config.distribution
            },
            
            // Planification
            scheduling: {
                autoSchedule: config.autoSchedule !== false,
                defaultSchedule: config.defaultSchedule || 'weekly',
                maxScheduled: config.maxScheduled || 50,
                ...config.scheduling
            },
            
            ...config
        };

        // État des rapports
        this.reportState = {
            generatedReports: new Map(),
            scheduledReports: new Map(),
            reportTemplates: new Map(),
            generationHistory: []
        };

        // Initialiser les templates
        this.initializeTemplates();
    }

    /**
     * Exécuter la tâche de génération de rapport
     */
    async execute(context) {
        const { task, executionContext, variables } = context;
        const {
            template,
            period,
            filters = {},
            format: reportFormat = this.config.generationSettings.format,
            recipients = [],
            schedule = null,
            options = {}
        } = task;

        try {
            const reportId = this.generateReportId();
            
            const reportResult = {
                reportId,
                taskId: task.id,
                template,
                format: reportFormat,
                status: 'generating',
                startedAt: new Date().toISOString(),
                period: period || this.getDefaultPeriod(template),
                filters,
                stats: {
                    recordsProcessed: 0,
                    pagesGenerated: 0,
                    size: 0,
                    generationTime: 0
                },
                downloadUrl: null,
                error: null,
                completedAt: null
            };

            // Enregistrer le rapport en cours
            this.reportState.generatedReports.set(reportId, reportResult);

            // Générer le rapport
            const reportData = await this.generateReport(
                template,
                period,
                filters,
                options
            );

            // Créer le document final
            const finalReport = await this.createReportDocument(
                reportData,
                reportFormat,
                options
            );

            // Finaliser le rapport
            reportResult.status = 'completed';
            reportResult.completedAt = new Date().toISOString();
            reportResult.stats = {
                ...reportResult.stats,
                ...finalReport.stats
            };
            reportResult.downloadUrl = finalReport.downloadUrl;

            // Distribuer le rapport
            if (recipients.length > 0) {
                await this.distributeReport(finalReport, recipients);
            }

            // Programmer si nécessaire
            if (schedule) {
                await this.scheduleReport(template, schedule, filters);
            }

            // Enregistrer dans l'historique
            this.addToHistory(reportResult);

            console.log(`Rapport généré avec succès: ${reportId}`);
            
            return reportResult;

        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            
            return {
                taskId: task.id,
                error: error.message,
                status: 'failed',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Générer les données du rapport
     */
    async generateReport(template, period, filters, options) {
        const templateConfig = this.reportState.reportTemplates.get(template);
        if (!templateConfig) {
            throw new Error(`Template non trouvé: ${template}`);
        }

        const reportData = {
            template,
            period,
            generatedAt: new Date().toISOString(),
            metadata: {
                title: templateConfig.name,
                description: templateConfig.description,
                type: templateConfig.type,
                filters
            },
            sections: {}
        };

        // Générer chaque section du template
        for (const section of templateConfig.sections) {
            try {
                const sectionData = await this.generateSection(section, template, period, filters, options);
                reportData.sections[section] = sectionData;
            } catch (error) {
                console.error(`Erreur lors de la génération de la section ${section}:`, error);
                reportData.sections[section] = {
                    error: error.message,
                    data: null
                };
            }
        }

        return reportData;
    }

    /**
     * Générer une section spécifique du rapport
     */
    async generateSection(sectionName, template, period, filters, options) {
        let sectionData = {
            name: sectionName,
            generatedAt: new Date().toISOString(),
            data: null,
            charts: []
        };

        switch (template) {
            case 'loan_summary':
                sectionData = await this.generateLoanSummarySection(sectionName, period, filters);
                break;

            case 'overdue_report':
                sectionData = await this.generateOverdueSection(sectionName, period, filters);
                break;

            case 'user_activity':
                sectionData = await this.generateUserActivitySection(sectionName, period, filters);
                break;

            case 'system_performance':
                sectionData = await this.generatePerformanceSection(sectionName, period, filters);
                break;

            case 'compliance_report':
                sectionData = await this.generateComplianceSection(sectionName, period, filters);
                break;

            default:
                throw new Error(`Template non supporté: ${template}`);
        }

        return sectionData;
    }

    // 📊 SECTIONS DE RAPPORTS

    /**
     * Générer la section résumé des prêts
     */
    async generateLoanSummarySection(sectionName, period, filters) {
        const data = {
            overview: {},
            statistics: {},
            trends: {}
        };

        // Période d'analyse
        const dateRange = this.getDateRange(period);
        
        try {
            // Vue d'ensemble
            const allLoans = await apiService.getLoans({
                from: dateRange.from,
                to: dateRange.to,
                ...filters
            });
            
            data.overview = {
                totalLoans: allLoans.length,
                activeLoans: allLoans.filter(loan => loan.status === 'active').length,
                returnedLoans: allLoans.filter(loan => loan.status === 'returned').length,
                cancelledLoans: allLoans.filter(loan => loan.status === 'cancelled').length
            };

            // Statistiques détaillées
            const stats = await apiService.getLoanStatistics({
                from: dateRange.from,
                to: dateRange.to
            });
            
            data.statistics = {
                averageLoanDuration: stats.averageDuration || 0,
                mostBorrowedDocuments: stats.topDocuments || [],
                busiestUsers: stats.topUsers || [],
                loansByCategory: stats.byCategory || {}
            };

            // Tendances (comparaison avec la période précédente)
            const previousPeriod = this.getPreviousPeriod(period);
            const previousDateRange = this.getDateRange(previousPeriod);
            
            const previousLoans = await apiService.getLoans({
                from: previousDateRange.from,
                to: previousDateRange.to
            });

            data.trends = {
                periodComparison: {
                    current: data.overview.totalLoans,
                    previous: previousLoans.length,
                    change: this.calculatePercentageChange(data.overview.totalLoans, previousLoans.length)
                },
                trendDirection: this.determineTrend(data.overview.totalLoans, previousLoans.length)
            };

        } catch (error) {
            console.error('Erreur lors de la génération du résumé des prêts:', error);
            data.error = error.message;
        }

        return {
            name: sectionName,
            data,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Générer la section des prêts en retard
     */
    async generateOverdueSection(sectionName, period, filters) {
        const data = {
            overdueLoans: [],
            statistics: {},
            recommendations: []
        };

        try {
            // Récupérer les prêts en retard
            const overdueLoans = await apiService.getOverdueLoans();
            
            data.overdueLoans = overdueLoans.map(loan => ({
                id: loan.id,
                borrowerName: loan.borrowerName,
                documentTitle: loan.documentTitle,
                loanDate: loan.loanDate,
                returnDate: loan.returnDate,
                daysOverdue: this.calculateDaysOverdue(loan.returnDate),
                status: loan.status
            }));

            // Statistiques des retards
            const overdueStats = {
                totalOverdue: overdueLoans.length,
                averageDaysOverdue: data.overdueLoans.length > 0 
                    ? Math.round(data.overdueLoans.reduce((sum, loan) => sum + loan.daysOverdue, 0) / data.overdueLoans.length)
                    : 0,
                maxDaysOverdue: data.overdueLoans.length > 0 
                    ? Math.max(...data.overdueLoans.map(loan => loan.daysOverdue))
                    : 0,
                loansByUser: this.groupBy(data.overdueLoans, 'borrowerName')
            };

            data.statistics = overdueStats;

            // Recommandations
            data.recommendations = this.generateOverdueRecommendations(overdueStats);

        } catch (error) {
            console.error('Erreur lors de la génération du rapport des retards:', error);
            data.error = error.message;
        }

        return {
            name: sectionName,
            data,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Générer la section d'activité utilisateur
     */
    async generateUserActivitySection(sectionName, period, filters) {
        const data = {
            userStats: {},
            activityTrends: {},
            topUsers: []
        };

        const dateRange = this.getDateRange(period);

        try {
            // Statistiques utilisateurs
            const users = await apiService.getUsers({ limit: 1000 });
            const allLoans = await apiService.getLoans({
                from: dateRange.from,
                to: dateRange.to
            });

            // Grouper les prêts par utilisateur
            const loansByUser = this.groupBy(allLoans, 'borrowerId');
            
            data.userStats = {
                totalUsers: users.length,
                activeUsers: Object.keys(loansByUser).length,
                inactiveUsers: users.length - Object.keys(loansByUser).length,
                totalLoans: allLoans.length,
                averageLoansPerUser: allLoans.length / users.length
            };

            // Tendances d'activité (par jour)
            data.activityTrends = this.calculateActivityTrends(allLoans, dateRange);

            // Top utilisateurs
            data.topUsers = Object.entries(loansByUser)
                .map(([userId, loans]) => ({
                    userId,
                    userName: users.find(u => u.id === userId)?.name || 'Utilisateur inconnu',
                    loanCount: loans.length,
                    lastActivity: loans.sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate))[0]?.loanDate
                }))
                .sort((a, b) => b.loanCount - a.loanCount)
                .slice(0, 10);

        } catch (error) {
            console.error('Erreur lors de la génération du rapport d\'activité:', error);
            data.error = error.message;
        }

        return {
            name: sectionName,
            data,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Générer la section de performance
     */
    async generatePerformanceSection(sectionName, period, filters) {
        const data = {
            performanceMetrics: {},
            errors: [],
            usageStats: {}
        };

        const dateRange = this.getDateRange(period);

        try {
            // Métriques de performance simulées
            data.performanceMetrics = {
                averageResponseTime: Math.round(Math.random() * 1000) + 200, // ms
                throughput: Math.round(Math.random() * 100) + 50, // req/min
                errorRate: Math.round(Math.random() * 5) + 1, // %
                uptime: Math.round(Math.random() * 5) + 95, // %
                concurrentUsers: Math.round(Math.random() * 50) + 10
            };

            // Statistiques d'usage
            const loans = await apiService.getLoans({
                from: dateRange.from,
                to: dateRange.to
            });

            data.usageStats = {
                totalRequests: loans.length * 3, // Estimation
                peakHour: this.getPeakHour(loans),
                averageSessionDuration: Math.round(Math.random() * 30) + 15, // minutes
                mostActiveHour: this.getMostActiveHour(loans)
            };

        } catch (error) {
            console.error('Erreur lors de la génération du rapport de performance:', error);
            data.error = error.message;
        }

        return {
            name: sectionName,
            data,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Générer la section de conformité
     */
    async generateComplianceSection(sectionName, period, filters) {
        const data = {
            complianceStatus: {},
            violations: [],
            auditTrail: []
        };

        const dateRange = this.getDateRange(period);

        try {
            // Vérifications de conformité
            const loans = await apiService.getLoans({
                from: dateRange.from,
                to: dateRange.to
            });

            // Simulation de vérifications de conformité
            data.complianceStatus = {
                dataRetention: { status: 'compliant', score: 95 },
                accessControls: { status: 'compliant', score: 98 },
                auditLogging: { status: 'warning', score: 87 },
                backupProcedures: { status: 'compliant', score: 92 },
                overallScore: 93
            };

            // Violations détectées (simulation)
            data.violations = [
                {
                    type: 'Retention Policy',
                    description: 'Algunos préstamos tienen fechas de devolución que exceden la política de retención',
                    severity: 'low',
                    count: 3
                }
            ];

            // Piste d'audit (simulation)
            data.auditTrail = [
                {
                    timestamp: new Date().toISOString(),
                    action: 'system_check',
                    details: 'Vérification automatique de conformité terminée'
                }
            ];

        } catch (error) {
            console.error('Erreur lors de la génération du rapport de conformité:', error);
            data.error = error.message;
        }

        return {
            name: sectionName,
            data,
            generatedAt: new Date().toISOString()
        };
    }

    // 📄 CRÉATION DU DOCUMENT FINAL

    /**
     * Créer le document final du rapport
     */
    async createReportDocument(reportData, format, options) {
        let document = null;
        let downloadUrl = null;
        const startTime = Date.now();

        switch (format) {
            case 'pdf':
                document = await this.createPDFReport(reportData, options);
                break;
            case 'html':
                document = await this.createHTMLReport(reportData, options);
                break;
            case 'csv':
                document = await this.createCSVReport(reportData, options);
                break;
            case 'json':
                document = await this.createJSONReport(reportData, options);
                break;
            default:
                throw new Error(`Format non supporté: ${format}`);
        }

        const generationTime = Date.now() - startTime;

        return {
            document,
            downloadUrl,
            stats: {
                recordsProcessed: this.countRecords(reportData),
                pagesGenerated: this.estimatePages(reportData, format),
                size: document.length,
                generationTime
            }
        };
    }

    /**
     * Créer un rapport PDF
     */
    async createPDFReport(reportData, options) {
        // Simulation de création PDF
        // En production, ceci would use une library comme jsPDF, Puppeteer, ou un service externe
        
        const htmlContent = await this.generateHTMLContent(reportData, options);
        
        // Simulation - en production, conversion HTML to PDF
        console.log('Simulation création PDF...');
        
        const pdfContent = `
        === RAPPORT DOCUCORTEX ===
        
        ${reportData.metadata.title}
        Période: ${reportData.period}
        Généré le: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')}
        
        ${JSON.stringify(reportData.sections, null, 2)}
        
        === FIN DU RAPPORT ===
        `;
        
        return pdfContent;
    }

    /**
     * Créer un rapport HTML
     */
    async createHTMLReport(reportData, options) {
        return await this.generateHTMLContent(reportData, options);
    }

    /**
     * Générer le contenu HTML
     */
    async generateHTMLContent(reportData, options) {
        const { includeCharts = true, includeImages = false } = options;
        
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${reportData.metadata.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .section h2 { color: #333; border-bottom: 2px solid #007acc; }
                .stats { display: flex; flex-wrap: wrap; gap: 20px; }
                .stat-card { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${reportData.metadata.title}</h1>
                <p>Période: ${reportData.period}</p>
                <p>Généré le: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
        `;

        // Générer chaque section
        for (const [sectionName, sectionData] of Object.entries(reportData.sections)) {
            html += `<div class="section">`;
            html += `<h2>${this.formatSectionTitle(sectionName)}</h2>`;
            
            if (sectionData.data && !sectionData.data.error) {
                html += this.formatSectionContent(sectionData.data);
            } else {
                html += `<p style="color: red;">Erreur: ${sectionData.data?.error || 'Section non disponible'}</p>`;
            }
            
            html += `</div>`;
        }

        html += `
        </body>
        </html>
        `;

        return html;
    }

    /**
     * Créer un rapport CSV
     */
    async createCSVReport(reportData, options) {
        let csv = '';
        
        // En-têtes
        csv += 'Section,Type,Données\n';
        
        // Données de chaque section
        for (const [sectionName, sectionData] of Object.entries(reportData.sections)) {
            if (sectionData.data && !sectionData.data.error) {
                csv += `"${sectionName}","overview","${JSON.stringify(sectionData.data.overview || sectionData.data)}"\n`;
            } else {
                csv += `"${sectionName}","error","${sectionData.data?.error || 'Données non disponibles'}"\n`;
            }
        }
        
        return csv;
    }

    /**
     * Créer un rapport JSON
     */
    async createJSONReport(reportData, options) {
        return JSON.stringify(reportData, null, 2);
    }

    // 📧 DISTRIBUTION

    /**
     * Distribuer le rapport
     */
    async distributeReport(report, recipients) {
        const distributionResults = [];

        for (const recipient of recipients) {
            try {
                if (recipient.type === 'email') {
                    await this.sendReportByEmail(recipient, report);
                    distributionResults.push({ type: 'email', recipient: recipient.address, status: 'sent' });
                } else if (recipient.type === 'download') {
                    // Le téléchargement sera géré par l'interface
                    distributionResults.push({ type: 'download', status: 'available' });
                } else if (recipient.type === 'store') {
                    await this.storeReport(report);
                    distributionResults.push({ type: 'store', status: 'stored' });
                }
            } catch (error) {
                console.error(`Erreur de distribution vers ${recipient.type}:`, error);
                distributionResults.push({ type: recipient.type, recipient: recipient.address, status: 'failed', error: error.message });
            }
        }

        return distributionResults;
    }

    /**
     * Envoyer le rapport par email
     */
    async sendReportByEmail(recipient, report) {
        // Simulation d'envoi d'email
        console.log(`Envoi du rapport par email à ${recipient.address}`);
        
        // En production, ceci would use un vrai service d'email
        // await emailService.send({
        //     to: recipient.address,
        //     subject: `Rapport DocuCortex - ${report.metadata.title}`,
        //     body: 'Veuillez trouver ci-joint votre rapport.',
        //     attachments: [{
        //         filename: `rapport-${Date.now()}.${report.format}`,
        //         content: report.document
        //     }]
        // });
    }

    /**
     * Stocker le rapport
     */
    async storeReport(report) {
        const storageId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Stocker en localStorage pour la simulation
        try {
            localStorage.setItem(storageId, JSON.stringify({
                ...report,
                storedAt: new Date().toISOString()
            }));
            
            console.log(`Rapport stocké avec l'ID: ${storageId}`);
        } catch (error) {
            console.error('Erreur lors du stockage du rapport:', error);
        }
    }

    // 🛠️ UTILITAIRES

    /**
     * Initialiser les templates
     */
    initializeTemplates() {
        for (const [templateId, templateConfig] of Object.entries(this.config.templates)) {
            this.reportState.reportTemplates.set(templateId, templateConfig);
        }
    }

    /**
     * Obtenir la période par défaut pour un template
     */
    getDefaultPeriod(template) {
        const templateConfig = this.config.templates[template];
        return templateConfig?.defaultPeriod || 'month';
    }

    /**
     * Calculer la plage de dates pour une période
     */
    getDateRange(period) {
        const now = new Date();
        let from, to;

        switch (period) {
            case 'day':
                from = startOfDay(now);
                to = endOfDay(now);
                break;
            case 'week':
                from = subDays(now, 7);
                to = now;
                break;
            case 'month':
                from = subMonths(now, 1);
                to = now;
                break;
            case 'quarter':
                from = subMonths(now, 3);
                to = now;
                break;
            case 'year':
                from = subMonths(now, 12);
                to = now;
                break;
            default:
                from = subMonths(now, 1);
                to = now;
        }

        return {
            from: format(from, 'yyyy-MM-dd'),
            to: format(to, 'yyyy-MM-dd')
        };
    }

    /**
     * Obtenir la période précédente
     */
    getPreviousPeriod(period) {
        switch (period) {
            case 'day':
                return 'day';
            case 'week':
                return 'week';
            case 'month':
                return 'month';
            case 'quarter':
                return 'quarter';
            case 'year':
                return 'year';
            default:
                return 'month';
        }
    }

    /**
     * Calculer le pourcentage de changement
     */
    calculatePercentageChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    /**
     * Déterminer la tendance
     */
    determineTrend(current, previous) {
        const change = this.calculatePercentageChange(current, previous);
        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    }

    /**
     * Calculer les jours de retard
     */
    calculateDaysOverdue(returnDate) {
        const now = new Date();
        const returnDateObj = new Date(returnDate);
        const diffTime = now - returnDateObj;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Grouper des données par clé
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    /**
     * Générer des recommandations pour les retards
     */
    generateOverdueRecommendations(stats) {
        const recommendations = [];

        if (stats.totalOverdue > 10) {
            recommendations.push({
                type: 'urgent',
                message: 'Nombre élevé de prêts en retard - Action immédiate recommandée'
            });
        }

        if (stats.averageDaysOverdue > 14) {
            recommendations.push({
                type: 'moderate',
                message: 'Retards moyens importants - Revoir les politiques de prêt'
            });
        }

        if (stats.maxDaysOverdue > 30) {
            recommendations.push({
                type: 'critical',
                message: 'Prêts très en retard - Contacter directement les emprunteurs'
            });
        }

        return recommendations;
    }

    /**
     * Calculer les tendances d'activité
     */
    calculateActivityTrends(loans, dateRange) {
        const trends = {};
        const startDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        
        // Grouper par jour
        const loansByDay = this.groupBy(loans, loan => {
            const loanDate = new Date(loan.loanDate);
            return format(loanDate, 'yyyy-MM-dd');
        });
        
        return loansByDay;
    }

    /**
     * Obtenir l'heure de pointe
     */
    getPeakHour(loans) {
        // Simulation - en production, analyser les vraies heures d'activité
        return '14:00'; // 2 PM
    }

    /**
     * Obtenir l'heure la plus active
     */
    getMostActiveHour(loans) {
        // Simulation - analyser les timestamps des prêts
        const hourCounts = {};
        
        loans.forEach(loan => {
            const hour = new Date(loan.loanDate).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        
        return `${peakHour}:00`;
    }

    /**
     * Formater le titre d'une section
     */
    formatSectionTitle(sectionName) {
        return sectionName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Formater le contenu d'une section
     */
    formatSectionContent(data) {
        let html = '<div class="stats">';
        
        if (data.overview) {
            Object.entries(data.overview).forEach(([key, value]) => {
                html += `<div class="stat-card"><strong>${this.formatKey(key)}:</strong> ${value}</div>`;
            });
        }
        
        if (data.statistics && data.statistics.mostBorrowedDocuments) {
            html += '<h3>Documents les plus empruntés:</h3><ul>';
            data.statistics.mostBorrowedDocuments.forEach(doc => {
                html += `<li>${doc.title || doc.name || 'Document'} (${doc.count || 0})</li>`;
            });
            html += '</ul>';
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Formater une clé
     */
    formatKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Compter les enregistrements
     */
    countRecords(reportData) {
        let count = 0;
        Object.values(reportData.sections).forEach(section => {
            if (section.data && Array.isArray(section.data.overdueLoans)) {
                count += section.data.overdueLoans.length;
            }
        });
        return count;
    }

    /**
     * Estimer le nombre de pages
     */
    estimatePages(reportData, format) {
        if (format === 'pdf') {
            return Math.ceil(this.countRecords(reportData) / 50) + Object.keys(reportData.sections).length;
        }
        return 1;
    }

    /**
     * Programmer un rapport
     */
    async scheduleReport(template, schedule, filters) {
        const scheduleId = this.generateScheduleId();
        
        const scheduledReport = {
            id: scheduleId,
            template,
            schedule,
            filters,
            createdAt: new Date().toISOString(),
            nextRun: this.calculateNextRun(schedule)
        };
        
        this.reportState.scheduledReports.set(scheduleId, scheduledReport);
    }

    /**
     * Calculer la prochaine exécution
     */
    calculateNextRun(schedule) {
        const now = new Date();
        
        switch (schedule.frequency) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'monthly':
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
    }

    /**
     * Générer un ID de rapport
     */
    generateReportId() {
        return `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un ID de planification
     */
    generateScheduleId() {
        return `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Ajouter à l'historique
     */
    addToHistory(reportResult) {
        this.reportState.generationHistory.push(reportResult);
        
        // Limiter l'historique
        if (this.reportState.generationHistory.length > 100) {
            this.reportState.generationHistory = this.reportState.generationHistory.slice(-50);
        }
    }

    /**
     * Obtenir l'état des rapports
     */
    getReportState() {
        return {
            ...this.reportState,
            generatedReports: Array.from(this.reportState.generatedReports.values()),
            scheduledReports: Array.from(this.reportState.scheduledReports.values())
        };
    }

    /**
     * Obtenir la configuration
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

export default ReportTask;