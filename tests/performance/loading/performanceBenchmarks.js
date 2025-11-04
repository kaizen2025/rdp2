/**
 * Métriques de Benchmark - Performance RDS Viewer Anecoop
 * Définit les seuils de performance acceptables et les métriques de référence
 * 
 * Date: 2025-11-04
 */

const performanceBenchmarks = {
    // Métriques de temps de chargement des pages (en millisecondes)
    pageLoading: {
        excellent: 800,      // < 800ms - Performance excellente
        good: 2000,          // 800ms - 2s - Performance bonne
        acceptable: 4000,    // 2s - 4s - Performance acceptable
        poor: 8000,          // 4s - 8s - Performance médiocre
        critical: 12000      // > 8s - Performance critique
    },

    // Métriques Core Web Vitals
    coreWebVitals: {
        firstContentfulPaint: {
            excellent: 400,
            good: 1200,
            acceptable: 2500,
            poor: 4000
        },
        largestContentfulPaint: {
            excellent: 1500,
            good: 3000,
            acceptable: 6000,
            poor: 10000
        },
        firstInputDelay: {
            excellent: 50,
            good: 100,
            acceptable: 200,
            poor: 500
        },
        cumulativeLayoutShift: {
            excellent: 0.05,
            good: 0.1,
            acceptable: 0.2,
            poor: 0.3
        }
    },

    // Temps de rendu des composants React
    componentRendering: {
        simpleComponent: {
            excellent: 50,     // Composants simples (buttons, labels)
            good: 150,
            acceptable: 300,
            poor: 500
        },
        complexComponent: {
            excellent: 100,    // Composants complexes (tables, charts)
            good: 300,
            acceptable: 600,
            poor: 1000
        },
        dataComponent: {
            excellent: 200,    // Composants avec données (grids, lists)
            good: 500,
            acceptable: 1000,
            poor: 2000
        },
        asyncComponent: {
            excellent: 300,    // Composants avec chargement async
            good: 800,
            acceptable: 1500,
            poor: 3000
        }
    },

    // Métriques spécifiques par page
    pageSpecific: {
        dashboard: {
            targetLoadTime: 1500,
            maxAcceptableTime: 3000,
            criticalTime: 5000,
            components: {
                statisticsCards: 200,
                recentActivity: 300,
                chartRendering: 500,
                dataTables: 800
            }
        },
        users: {
            targetLoadTime: 2000,
            maxAcceptableTime: 4000,
            criticalTime: 7000,
            components: {
                userTable: 600,
                searchFilter: 150,
                userDialog: 300,
                permissionsTree: 400
            }
        },
        loans: {
            targetLoadTime: 1800,
            maxAcceptableTime: 3500,
            criticalTime: 6000,
            components: {
                loanTable: 500,
                calendarView: 700,
                statisticsPanel: 400,
                loanDialog: 250
            }
        },
        sessions: {
            targetLoadTime: 1200,
            maxAcceptableTime: 2500,
            criticalTime: 4500,
            components: {
                sessionList: 400,
                connectionHistory: 600,
                monitoringPanel: 300,
                sessionDialog: 200
            }
        },
        inventory: {
            targetLoadTime: 2500,
            maxAcceptableTime: 5000,
            criticalTime: 8000,
            components: {
                inventoryTable: 800,
                searchFunction: 200,
                addItemDialog: 400,
                categoryTree: 300
            }
        },
        chat: {
            targetLoadTime: 1000,
            maxAcceptableTime: 2000,
            criticalTime: 3500,
            components: {
                chatInterface: 300,
                messageList: 400,
                inputArea: 100,
                aiResponse: 1500
            }
        },
        ocr: {
            targetLoadTime: 2000,
            maxAcceptableTime: 4000,
            criticalTime: 7000,
            components: {
                fileUpload: 500,
                textExtraction: 2000,
                resultDisplay: 600,
                processingStatus: 200
            }
        },
        ged: {
            targetLoadTime: 3000,
            maxAcceptableTime: 6000,
            criticalTime: 10000,
            components: {
                documentList: 1000,
                previewPanel: 800,
                searchResults: 600,
                uploadInterface: 400
            }
        },
        permissions: {
            targetLoadTime: 2200,
            maxAcceptableTime: 4500,
            criticalTime: 7500,
            components: {
                permissionsTable: 700,
                roleTree: 500,
                userPermissionEditor: 600,
                roleDialog: 300
            }
        }
    },

    // Métriques de mémoire
    memoryUsage: {
        initialLoad: {
            excellent: 25,     // MB
            good: 50,
            acceptable: 100,
            poor: 150
        },
        afterNavigation: {
            excellent: 40,     // MB
            good: 80,
            acceptable: 150,
            poor: 250
        },
        peakUsage: {
            excellent: 100,    // MB
            good: 200,
            acceptable: 400,
            poor: 600
        }
    },

    // Métriques réseau
    networkMetrics: {
        timeToFirstByte: {
            excellent: 200,    // ms
            good: 500,
            acceptable: 1000,
            poor: 2000
        },
        totalTransferSize: {
            excellent: 500,    // KB
            good: 1000,
            acceptable: 2000,
            poor: 5000
        },
        numberOfRequests: {
            excellent: 30,
            good: 60,
            acceptable: 100,
            poor: 150
        }
    },

    // Seuils de criticité
    criticalThresholds: {
        mustFix: [
            'Page load time > 8000ms',
            'FCP > 4000ms', 
            'LCP > 10000ms',
            'Memory usage > 600MB',
            'Number of requests > 150'
        ],
        shouldFix: [
            'Page load time > 4000ms',
            'FCP > 2500ms',
            'LCP > 6000ms', 
            'Memory usage > 400MB',
            'Number of requests > 100'
        ],
        niceToFix: [
            'Page load time > 2000ms',
            'FCP > 1200ms',
            'LCP > 3000ms',
            'Memory usage > 200MB',
            'Number of requests > 60'
        ]
    },

    // Métriques de performance par type d'appareil
    deviceSpecific: {
        desktop: {
            multiplier: 1.0,
            acceptableLoadTime: 3000
        },
        laptop: {
            multiplier: 1.2,
            acceptableLoadTime: 3600
        },
        tablet: {
            multiplier: 1.5,
            acceptableLoadTime: 4500
        },
        mobile: {
            multiplier: 2.0,
            acceptableLoadTime: 6000
        }
    }
};

/**
 * Fonction d'évaluation de performance
 */
class PerformanceEvaluator {
    constructor(benchmarks = performanceBenchmarks) {
        this.benchmarks = benchmarks;
    }

    /**
     * Évalue une métrique contre les seuils de benchmark
     */
    evaluateMetric(value, metricType, subType = null) {
        const thresholds = subType 
            ? this.benchmarks[metricType][subType]
            : this.benchmarks[metricType];

        if (!thresholds) {
            return { grade: 'N/A', status: 'unknown', message: 'Métrique non définie' };
        }

        let grade, status, message;

        if (value <= thresholds.excellent) {
            grade = 'A';
            status = 'excellent';
            message = 'Performance excellente';
        } else if (value <= thresholds.good) {
            grade = 'B';
            status = 'good';
            message = 'Performance bonne';
        } else if (value <= thresholds.acceptable) {
            grade = 'C';
            status = 'acceptable';
            message = 'Performance acceptable';
        } else if (value <= thresholds.poor) {
            grade = 'D';
            status = 'poor';
            message = 'Performance médiocre';
        } else {
            grade = 'F';
            status = 'critical';
            message = 'Performance critique';
        }

        return {
            grade,
            status,
            message,
            value,
            thresholds,
            performance: ((thresholds.acceptable - value) / (thresholds.acceptable - thresholds.poor) * 100).toFixed(2)
        };
    }

    /**
     * Évalue les performances d'une page complète
     */
    evaluatePagePerformance(pageMetrics) {
        const evaluations = {};
        
        // Temps de chargement total
        evaluations.loadTime = this.evaluateMetric(
            pageMetrics.totalTime, 
            'pageLoading'
        );

        // First Contentful Paint
        if (pageMetrics.firstContentfulPaint) {
            evaluations.firstContentfulPaint = this.evaluateMetric(
                pageMetrics.firstContentfulPaint,
                'coreWebVitals',
                'firstContentfulPaint'
            );
        }

        // Largest Contentful Paint
        if (pageMetrics.largestContentfulPaint) {
            evaluations.largestContentfulPaint = this.evaluateMetric(
                pageMetrics.largestContentfulPaint,
                'coreWebVitals',
                'largestContentfulPaint'
            );
        }

        // Mémoire utilisée
        if (pageMetrics.memoryUsage && pageMetrics.memoryUsage.used) {
            const memoryMB = pageMetrics.memoryUsage.used / (1024 * 1024);
            evaluations.memoryUsage = this.evaluateMetric(
                memoryMB,
                'memoryUsage',
                'peakUsage'
            );
        }

        // Calculer le score global
        evaluations.globalScore = this.calculateGlobalScore(evaluations);

        // Générer des recommandations
        evaluations.recommendations = this.generateRecommendations(evaluations);

        return evaluations;
    }

    /**
     * Calcule un score global de performance
     */
    calculateGlobalScore(evaluations) {
        const weights = {
            loadTime: 0.4,
            firstContentfulPaint: 0.25,
            largestContentfulPaint: 0.25,
            memoryUsage: 0.1
        };

        let totalScore = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(metric => {
            if (evaluations[metric] && evaluations[metric].performance) {
                const score = parseFloat(evaluations[metric].performance);
                totalScore += score * weights[metric];
                totalWeight += weights[metric];
            }
        });

        return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;
    }

    /**
     * Génère des recommandations basées sur les évaluations
     */
    generateRecommendations(evaluations) {
        const recommendations = [];

        if (evaluations.loadTime && evaluations.loadTime.status === 'critical') {
            recommendations.push({
                priority: 'high',
                category: 'performance',
                issue: 'Temps de chargement critique',
                suggestion: 'Optimiser le chargement des ressources, implémenter la mise en cache, réduire la taille des bundles',
                impact: 'Amélioration significative de l\'expérience utilisateur'
            });
        }

        if (evaluations.firstContentfulPaint && evaluations.firstContentfulPaint.status === 'poor') {
            recommendations.push({
                priority: 'high',
                category: 'rendering',
                issue: 'Premier affichage lent',
                suggestion: 'Optimiser le CSS critique, implémenter le preloading, réduire le JavaScript bloquant',
                impact: 'Amélioration de la perception de rapidité'
            });
        }

        if (evaluations.largestContentfulPaint && evaluations.largestContentfulPaint.status === 'poor') {
            recommendations.push({
                priority: 'medium',
                category: 'content',
                issue: 'Affichage du contenu principal lent',
                suggestion: 'Optimiser les images, implémenter le lazy loading, prioriser le contenu au-dessus de la ligne de flottaison',
                impact: 'Amélioration de l\'expérience utilisateur'
            });
        }

        if (evaluations.memoryUsage && evaluations.memoryUsage.status === 'critical') {
            recommendations.push({
                priority: 'medium',
                category: 'memory',
                issue: 'Consommation mémoire excessive',
                suggestion: 'Optimiser la gestion de l\'état, implémenter la cleanup des composants, utiliser le code splitting',
                impact: 'Réduction des risques de crash et amélioration des performances'
            });
        }

        return recommendations;
    }

    /**
     * Génère un rapport de benchmark
     */
    generateBenchmarkReport(evaluations, pageName) {
        const report = {
            page: pageName,
            timestamp: new Date().toISOString(),
            overallGrade: this.getOverallGrade(evaluations.globalScore),
            globalScore: evaluations.globalScore,
            detailedScores: evaluations,
            summary: {
                status: this.getOverallStatus(evaluations),
                criticalIssues: evaluations.recommendations.filter(r => r.priority === 'high').length,
                totalRecommendations: evaluations.recommendations.length
            },
            recommendations: evaluations.recommendations
        };

        return report;
    }

    /**
     * Détermine la note globale basée sur le score
     */
    getOverallGrade(score) {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        if (score >= 20) return 'D';
        return 'F';
    }

    /**
     * Détermine le statut global
     */
    getOverallStatus(evaluations) {
        const hasCritical = Object.values(evaluations).some(eval => 
            eval && eval.status === 'critical'
        );
        
        if (hasCritical) return 'critical';
        
        const hasPoor = Object.values(evaluations).some(eval => 
            eval && eval.status === 'poor'
        );
        
        if (hasPoor) return 'needs-improvement';
        
        return 'good';
    }
}

// Export des données et fonctions
module.exports = {
    performanceBenchmarks,
    PerformanceEvaluator
};

// Utilisation en ligne de commande
if (require.main === module) {
    const evaluator = new PerformanceEvaluator();
    
    // Exemple d'utilisation
    const sampleMetrics = {
        totalTime: 3500,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 3000,
        memoryUsage: { used: 150 * 1024 * 1024 } // 150MB
    };
    
    const evaluation = evaluator.evaluatePagePerformance(sampleMetrics);
    const report = evaluator.generateBenchmarkReport(evaluation, 'Dashboard');
    
    console.log(JSON.stringify(report, null, 2));
}