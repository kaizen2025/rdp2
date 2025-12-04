/**
 * Service d'analytique pour les documents
 * Génère des statistiques et détecte des anomalies
 */

class AnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * 📊 Génère des statistiques complètes sur les documents
     */
    async getDocumentAnalytics(documents, timeRange = '30d') {
        try {
            console.log(`[Analytics] Génération des statistiques pour ${documents.length} documents (${timeRange})`);

            // Filtrer les documents selon la période
            const filteredDocs = this.filterByTimeRange(documents, timeRange);

            const stats = {
                total: filteredDocs.length,
                byCategory: {},
                byAuthor: {},
                byFileType: {},
                sizeStats: {
                    total: 0,
                    avg: 0,
                    min: Infinity,
                    max: 0
                },
                documentsThisWeek: 0,
                documentsThisMonth: 0,
                growth: 0,
                recentActivity: []
            };

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const previousPeriodStart = this.getPreviousPeriodDate(timeRange);

            filteredDocs.forEach(doc => {
                const docDate = new Date(doc.date_added || doc.created_at);

                // Par catégorie
                const category = doc.category || 'Non classé';
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

                // Par auteur
                const author = doc.author || doc.created_by || 'Inconnu';
                stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;

                // Par type de fichier
                const fileType = doc.filename ? doc.filename.split('.').pop().toLowerCase() : 'unknown';
                stats.byFileType[fileType] = (stats.byFileType[fileType] || 0) + 1;

                // Statistiques de taille
                if (doc.file_size) {
                    stats.sizeStats.total += doc.file_size;
                    stats.sizeStats.min = Math.min(stats.sizeStats.min, doc.file_size);
                    stats.sizeStats.max = Math.max(stats.sizeStats.max, doc.file_size);
                }

                // Documents cette semaine/mois
                if (docDate >= weekAgo) {
                    stats.documentsThisWeek++;
                }
                if (docDate >= monthAgo) {
                    stats.documentsThisMonth++;
                }
            });

            // Taille moyenne
            if (filteredDocs.length > 0) {
                stats.sizeStats.avg = stats.sizeStats.total / filteredDocs.length;
            }

            // Calcul de la croissance
            const previousPeriodDocs = documents.filter(doc => {
                const docDate = new Date(doc.date_added || doc.created_at);
                return docDate >= previousPeriodStart;
            });

            if (previousPeriodDocs.length > 0) {
                stats.growth = ((filteredDocs.length - previousPeriodDocs.length) / previousPeriodDocs.length) * 100;
            }

            // Activité récente (5 derniers documents)
            stats.recentActivity = filteredDocs
                .sort((a, b) => {
                    const dateA = new Date(a.date_added || a.created_at);
                    const dateB = new Date(b.date_added || b.created_at);
                    return dateB - dateA;
                })
                .slice(0, 5)
                .map(doc => ({
                    description: `Document ajouté: ${doc.filename}`,
                    timestamp: doc.date_added || doc.created_at,
                    type: 'added'
                }));

            console.log('[Analytics] ✅ Statistiques générées');

            return {
                success: true,
                stats,
                timeRange
            };

        } catch (error) {
            console.error('[Analytics] Erreur:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 📈 Génère les tendances temporelles
     */
    async getDocumentTrends(documents, timeRange = '30d') {
        try {
            const filteredDocs = this.filterByTimeRange(documents, timeRange);
            const dates = this.generateDateLabels(timeRange);

            const trends = {
                dates: dates,
                documentsAdded: new Array(dates.length).fill(0),
                documentsViewed: new Array(dates.length).fill(0),
                documentsByCategory: {}
            };

            // Compter les documents par jour
            filteredDocs.forEach(doc => {
                const docDate = new Date(doc.date_added || doc.created_at);
                const dateStr = this.formatDate(docDate);
                const index = trends.dates.indexOf(dateStr);

                if (index !== -1) {
                    trends.documentsAdded[index]++;

                    // Simuler les vues (dans une vraie implémentation, utiliser les données réelles)
                    trends.documentsViewed[index] += Math.floor(Math.random() * 3);

                    // Par catégorie
                    const category = doc.category || 'Non classé';
                    if (!trends.documentsByCategory[category]) {
                        trends.documentsByCategory[category] = new Array(dates.length).fill(0);
                    }
                    trends.documentsByCategory[category][index]++;
                }
            });

            return {
                success: true,
                trends
            };

        } catch (error) {
            console.error('[Analytics] Erreur tendances:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ⚠️ Détection d'anomalies
     */
    async detectAnomalies(documents, stats) {
        const anomalies = [];

        try {
            // Anomalie 1: Pic de documents ajoutés
            if (stats.documentsThisWeek > stats.total * 0.5) {
                anomalies.push({
                    type: 'spike',
                    severity: 'warning',
                    message: `Pic inhabituel: ${stats.documentsThisWeek} documents ajoutés cette semaine (${Math.round((stats.documentsThisWeek / stats.total) * 100)}% du total)`
                });
            }

            // Anomalie 2: Documents sans catégorie
            const uncategorized = stats.byCategory['Non classé'] || 0;
            if (uncategorized > stats.total * 0.2) {
                anomalies.push({
                    type: 'uncategorized',
                    severity: 'info',
                    message: `${uncategorized} documents (${Math.round((uncategorized / stats.total) * 100)}%) ne sont pas catégorisés`
                });
            }

            // Anomalie 3: Fichiers de grande taille
            if (stats.sizeStats.max > 100 * 1024 * 1024) { // > 100MB
                anomalies.push({
                    type: 'large_file',
                    severity: 'warning',
                    message: `Fichier très volumineux détecté: ${(stats.sizeStats.max / (1024 * 1024)).toFixed(2)} MB`
                });
            }

            // Anomalie 4: Peu de diversité dans les catégories
            const categoryCount = Object.keys(stats.byCategory).length;
            if (categoryCount < 3 && stats.total > 20) {
                anomalies.push({
                    type: 'low_diversity',
                    severity: 'info',
                    message: `Peu de diversité: seulement ${categoryCount} catégories pour ${stats.total} documents`
                });
            }

            // Anomalie 5: Un seul auteur dominant (>80%)
            const topAuthor = Object.entries(stats.byAuthor).sort((a, b) => b[1] - a[1])[0];
            if (topAuthor && topAuthor[1] > stats.total * 0.8) {
                anomalies.push({
                    type: 'single_author',
                    severity: 'info',
                    message: `Un seul auteur domine: ${topAuthor[0]} (${Math.round((topAuthor[1] / stats.total) * 100)}% des documents)`
                });
            }

            // Anomalie 6: Baisse d'activité
            if (stats.growth < -50) {
                anomalies.push({
                    type: 'decline',
                    severity: 'warning',
                    message: `Forte baisse d'activité: ${Math.abs(Math.round(stats.growth))}% par rapport à la période précédente`
                });
            }

            console.log(`[Analytics] ${anomalies.length} anomalie(s) détectée(s)`);

            return anomalies;

        } catch (error) {
            console.error('[Analytics] Erreur détection anomalies:', error);
            return [];
        }
    }

    /**
     * 📤 Export des statistiques
     */
    async exportAnalytics(stats, trends, format = 'json') {
        try {
            const data = {
                generatedAt: new Date().toISOString(),
                stats,
                trends
            };

            switch (format) {
                case 'json':
                    return {
                        success: true,
                        data: JSON.stringify(data, null, 2),
                        contentType: 'application/json',
                        filename: `analytics-${Date.now()}.json`
                    };

                case 'csv':
                    const csv = this.convertToCSV(stats);
                    return {
                        success: true,
                        data: csv,
                        contentType: 'text/csv',
                        filename: `analytics-${Date.now()}.csv`
                    };

                default:
                    throw new Error(`Format non supporté: ${format}`);
            }

        } catch (error) {
            console.error('[Analytics] Erreur export:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🔧 Méthodes utilitaires
     */

    filterByTimeRange(documents, timeRange) {
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                return documents;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        return documents.filter(doc => {
            const docDate = new Date(doc.date_added || doc.created_at);
            return docDate >= startDate;
        });
    }

    getPreviousPeriodDate(timeRange) {
        const now = new Date();
        let daysToSubtract;

        switch (timeRange) {
            case '7d':
                daysToSubtract = 14;
                break;
            case '30d':
                daysToSubtract = 60;
                break;
            case '90d':
                daysToSubtract = 180;
                break;
            case '1y':
                daysToSubtract = 730;
                break;
            default:
                daysToSubtract = 60;
        }

        return new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    }

    generateDateLabels(timeRange) {
        const now = new Date();
        const labels = [];
        let days;

        switch (timeRange) {
            case '7d':
                days = 7;
                break;
            case '30d':
                days = 30;
                break;
            case '90d':
                days = 90;
                break;
            case '1y':
                days = 365;
                break;
            default:
                days = 30;
        }

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            labels.push(this.formatDate(date));
        }

        return labels;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    convertToCSV(stats) {
        let csv = 'Catégorie,Nombre de documents,Pourcentage\n';

        Object.entries(stats.byCategory || {}).forEach(([category, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(2);
            csv += `"${category}",${count},${percentage}\n`;
        });

        csv += '\n\nAuteur,Nombre de documents\n';

        Object.entries(stats.byAuthor || {}).forEach(([author, count]) => {
            csv += `"${author}",${count}\n`;
        });

        return csv;
    }
}

// Export singleton
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
