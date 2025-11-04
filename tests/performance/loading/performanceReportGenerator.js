/**
 * Générateur de Rapport de Performance - RDS Viewer Anecoop
 * Génère des rapports détaillés des temps de chargement
 * 
 * Date: 2025-11-04
 */

const fs = require('fs').promises;
const path = require('path');
const { performanceBenchmarks, PerformanceEvaluator } = require('./performanceBenchmarks');

class PerformanceReportGenerator {
    constructor() {
        this.evaluator = new PerformanceEvaluator();
        this.templateDir = __dirname;
        this.reportsDir = path.join(__dirname, 'reports');
    }

    /**
     * Initialise les répertoires nécessaires
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            await fs.mkdir(path.join(this.reportsDir, 'html'), { recursive: true });
            await fs.mkdir(path.join(this.reportsDir, 'json'), { recursive: true });
            await fs.mkdir(path.join(this.reportsDir, 'charts'), { recursive: true });
        } catch (error) {
            console.warn('⚠️ Impossible de créer les répertoires:', error.message);
        }
    }

    /**
     * Génère un rapport complet de performance
     */
    async generateFullReport(testResults) {
        console.log('📊 Génération du rapport de performance...');
        
        await this.initializeDirectories();
        
        const reportData = await this.processTestResults(testResults);
        
        // Générer les différents formats de rapport
        await Promise.all([
            this.generateJSONReport(reportData),
            this.generateHTMLReport(reportData),
            this.generateMarkdownReport(reportData)
        ]);
        
        console.log('✅ Rapports générés avec succès!');
        return reportData;
    }

    /**
     * Traite les résultats de test et calcule les métriques
     */
    async processTestResults(testResults) {
        const processedResults = {
            ...testResults,
            evaluations: {},
            benchmarkData: performanceBenchmarks,
            insights: {},
            trends: {},
            recommendations: []
        };

        // Évaluer chaque page
        for (const [pageName, pageData] of Object.entries(testResults.pages)) {
            const evaluation = this.evaluator.evaluatePagePerformance(pageData);
            processedResults.evaluations[pageName] = evaluation;
        }

        // Générer des insights globaux
        processedResults.insights = this.generateGlobalInsights(processedResults);
        
        // Analyser les tendances
        processedResults.trends = this.analyzeTrends(processedResults);
        
        // Compiler toutes les recommandations
        processedResults.recommendations = this.compileRecommendations(processedResults);
        
        return processedResults;
    }

    /**
     * Génère un rapport JSON détaillé
     */
    async generateJSONReport(data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-report-${timestamp}.json`;
        const filepath = path.join(this.reportsDir, 'json', filename);
        
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '1.0',
                application: 'RDS Viewer Anecoop',
                testType: 'Performance de chargement'
            },
            summary: data.summary,
            detailedResults: {
                pages: data.pages,
                evaluations: data.evaluations,
                browser: data.browser
            },
            benchmarks: data.benchmarkData,
            insights: data.insights,
            trends: data.trends,
            recommendations: data.recommendations
        };
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`💾 Rapport JSON sauvegardé: ${filepath}`);
        
        return filepath;
    }

    /**
     * Génère un rapport HTML interactif
     */
    async generateHTMLReport(data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-report-${timestamp}.html`;
        const filepath = path.join(this.reportsDir, 'html', filename);
        
        const html = this.generateHTMLTemplate(data);
        await fs.writeFile(filepath, html);
        console.log(`🌐 Rapport HTML sauvegardé: ${filepath}`);
        
        return filepath;
    }

    /**
     * Génère un rapport Markdown
     */
    async generateMarkdownReport(data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-report-${timestamp}.md`;
        const filepath = path.join(this.reportsDir, 'markdown', filename);
        
        const markdown = this.generateMarkdownTemplate(data);
        await fs.writeFile(filepath, markdown);
        console.log(`📝 Rapport Markdown sauvegardé: ${filepath}`);
        
        return filepath;
    }

    /**
     * Génère le template HTML avec visualisations
     */
    generateHTMLTemplate(data) {
        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Performance - RDS Viewer Anecoop</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007acc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007acc;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 1.1em;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .performance-section {
            margin: 40px 0;
        }
        .performance-section h2 {
            color: #333;
            border-left: 4px solid #007acc;
            padding-left: 15px;
            margin-bottom: 20px;
        }
        .page-result {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .page-result h4 {
            color: #007acc;
            margin: 0 0 15px 0;
            font-size: 1.3em;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .metric {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #28a745;
        }
        .metric.warning {
            border-left-color: #ffc107;
        }
        .metric.danger {
            border-left-color: #dc3545;
        }
        .metric .label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .metric .value {
            font-size: 1.4em;
            font-weight: bold;
            color: #333;
        }
        .grade {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .grade.a { background: #d4edda; color: #155724; }
        .grade.b { background: #cce5ff; color: #004085; }
        .grade.c { background: #fff3cd; color: #856404; }
        .grade.d { background: #f8d7da; color: #721c24; }
        .grade.f { background: #f5c6cb; color: #721c24; }
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        .recommendations {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .recommendation {
            background: white;
            border-left: 4px solid #007acc;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .priority-high {
            border-left-color: #dc3545 !important;
        }
        .priority-medium {
            border-left-color: #ffc107 !important;
        }
        .priority-low {
            border-left-color: #28a745 !important;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Rapport de Performance</h1>
            <p>RDS Viewer Anecoop - Analyse des Temps de Chargement</p>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Pages Testées</h3>
                <div class="value">${data.summary?.totalPages || 0}</div>
            </div>
            <div class="summary-card">
                <h3>Temps Moyen</h3>
                <div class="value">${(data.summary?.averageLoadTime || 0).toFixed(0)}ms</div>
            </div>
            <div class="summary-card">
                <h3>Score Global</h3>
                <div class="value">${this.calculateOverallScore(data).toFixed(0)}%</div>
            </div>
            <div class="summary-card">
                <h3>Recommandations</h3>
                <div class="value">${data.recommendations?.length || 0}</div>
            </div>
        </div>

        <div class="performance-section">
            <h2>📊 Performances par Page</h2>
            
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Temps de Chargement</th>
                        <th>First Contentful Paint</th>
                        <th>Largest Contentful Paint</th>
                        <th>Note Globale</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.pages || {}).map(([pageName, pageData]) => {
                        const evaluation = data.evaluations?.[pageName];
                        return `
                            <tr>
                                <td><strong>${pageName}</strong></td>
                                <td>${(pageData.totalTime || 0).toFixed(0)}ms</td>
                                <td>${(pageData.firstContentfulPaint || 0).toFixed(0)}ms</td>
                                <td>${(pageData.largestContentfulPaint || 0).toFixed(0)}ms</td>
                                <td><span class="grade ${evaluation?.globalScore ? this.getGradeFromScore(evaluation.globalScore).toLowerCase() : 'c'}">${evaluation?.globalScore ? this.getGradeFromScore(evaluation.globalScore) : 'N/A'}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="performance-section">
            <h2>📈 Analyse des Tendances</h2>
            ${data.insights ? this.renderInsights(data.insights) : '<p>Aucune donnée d\'insight disponible</p>'}
        </div>

        <div class="performance-section">
            <h2>💡 Recommandations</h2>
            <div class="recommendations">
                ${(data.recommendations || []).map(rec => `
                    <div class="recommendation priority-${rec.priority}">
                        <h4>${rec.category.toUpperCase()}: ${rec.issue}</h4>
                        <p><strong>Suggestion:</strong> ${rec.suggestion}</p>
                        <p><strong>Impact attendu:</strong> ${rec.impact}</p>
                        <span class="grade ${rec.priority === 'high' ? 'f' : rec.priority === 'medium' ? 'c' : 'a'}">${rec.priority.toUpperCase()}</span>
                    </div>
                `).join('') || '<p>Aucune recommandation générée</p>'}
            </div>
        </div>

        <div class="footer">
            <p>Rapport généré automatiquement par le système de tests de performance RDS Viewer Anecoop</p>
            <p>Version 1.0 - ${new Date().getFullYear()}</p>
        </div>
    </div>

    <script>
        // Graphique des performances
        const ctx = document.getElementById('performanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(data.pages || {}))},
                datasets: [{
                    label: 'Temps de Chargement (ms)',
                    data: ${JSON.stringify(Object.values(data.pages || {}).map(p => p.totalTime || 0))},
                    backgroundColor: ${JSON.stringify(Object.values(data.pages || {}).map(p => {
                        const time = p.totalTime || 0;
                        if (time < 1000) return '#28a745';
                        if (time < 2500) return '#ffc107';
                        return '#dc3545';
                    }))},
                    borderColor: '#007acc',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Temps de Chargement par Page'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Temps (ms)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Génère le template Markdown
     */
    generateMarkdownTemplate(data) {
        return `# 🚀 Rapport de Performance - RDS Viewer Anecoop

**Généré le:** ${new Date().toLocaleString('fr-FR')}  
**Application:** RDS Viewer Anecoop  
**Type d'analyse:** Performance de chargement des pages

## 📊 Résumé Exécutif

| Métrique | Valeur |
|----------|--------|
| Pages testées | ${data.summary?.totalPages || 0} |
| Temps moyen de chargement | ${(data.summary?.averageLoadTime || 0).toFixed(0)}ms |
| Score global | ${this.calculateOverallScore(data).toFixed(0)}% |
| Recommandations | ${data.recommendations?.length || 0} |

## 🎯 Performances par Page

| Page | Temps de Chargement | FCP | LCP | Note |
|------|-------------------|-----|-----|------|
${Object.entries(data.pages || {}).map(([pageName, pageData]) => {
    const evaluation = data.evaluations?.[pageName];
    return `| ${pageName} | ${(pageData.totalTime || 0).toFixed(0)}ms | ${(pageData.firstContentfulPaint || 0).toFixed(0)}ms | ${(pageData.largestContentfulPaint || 0).toFixed(0)}ms | ${evaluation?.globalScore ? this.getGradeFromScore(evaluation.globalScore) : 'N/A'} |`;
}).join('\n')}

## 📈 Analyse des Performances

${Object.entries(data.evaluations || {}).map(([pageName, evaluation]) => `
### ${pageName}

- **Score global:** ${evaluation.globalScore || 'N/A'}%
- **Temps de chargement:** ${evaluation.loadTime?.value || 'N/A'}ms (Note: ${evaluation.loadTime?.grade || 'N/A'})
- **First Contentful Paint:** ${evaluation.firstContentfulPaint?.value || 'N/A'}ms (Note: ${evaluation.firstContentfulPaint?.grade || 'N/A'})

`).join('')}

## 💡 Recommandations

${(data.recommendations || []).map(rec => `
### ${rec.issue}

**Priorité:** ${rec.priority.toUpperCase()}  
**Catégorie:** ${rec.category}  
**Suggestion:** ${rec.suggestion}  
**Impact attendu:** ${rec.impact}

`).join('')}

## 🔍 Insights Globaux

${data.insights ? Object.entries(data.insights).map(([key, insight]) => `
**${key}:** ${insight}
`).join('\n') : 'Aucune insight disponible'}

## 📋 Prochaines Étapes

1. Analyser les recommandations prioritaires
2. Implémenter les optimisations suggérées
3. Relancer les tests de performance
4. Surveiller les métriques en continu

---

*Rapport généré automatiquement par le système de tests de performance RDS Viewer Anecoop*
`;
    }

    /**
     * Génère des insights globaux
     */
    generateGlobalInsights(data) {
        const insights = {};
        
        // Analyser les patterns de performance
        const pages = Object.values(data.pages || {});
        const evaluations = Object.values(data.evaluations || {});
        
        if (pages.length === 0) return insights;
        
        const avgLoadTime = pages.reduce((sum, p) => sum + (p.totalTime || 0), 0) / pages.length;
        
        insights.avgPerformance = avgLoadTime < 2000 ? 'excellente' : 
                                 avgLoadTime < 4000 ? 'bonne' : 'médiocre';
        
        insights.slowestBottleneck = this.identifyBottleneck(pages);
        
        insights.mostCriticalIssue = this.identifyMostCriticalIssue(evaluations);
        
        insights.recommendedActions = this.getTopRecommendations(data.recommendations);
        
        return insights;
    }

    /**
     * Identifie les goulots d'étranglement
     */
    identifyBottleneck(pages) {
        const sortedPages = pages.sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));
        return sortedPages[0] ? {
            page: sortedPages[0].name || 'Inconnu',
            time: sortedPages[0].totalTime || 0,
            reason: 'Temps de chargement le plus élevé'
        } : null;
    }

    /**
     * Identifie le problème le plus critique
     */
    identifyMostCriticalIssue(evaluations) {
        const criticalIssues = evaluations.filter(e => 
            e.loadTime?.status === 'critical' || 
            e.firstContentfulPaint?.status === 'critical'
        );
        
        return criticalIssues.length > 0 ? 
            `${criticalIssues.length} problèmes critiques détectés` : 
            'Aucun problème critique';
    }

    /**
     * Récupère les meilleures recommandations
     */
    getTopRecommendations(recommendations) {
        return (recommendations || []).filter(r => r.priority === 'high').slice(0, 3);
    }

    /**
     * Compile toutes les recommandations
     */
    compileRecommendations(data) {
        const allRecommendations = [];
        
        // Ajouter les recommandations des évaluations de pages
        Object.values(data.evaluations || {}).forEach(evaluation => {
            if (evaluation.recommendations) {
                allRecommendations.push(...evaluation.recommendations);
            }
        });
        
        return allRecommendations;
    }

    /**
     * Calcule le score global
     */
    calculateOverallScore(data) {
        const evaluations = Object.values(data.evaluations || {});
        if (evaluations.length === 0) return 0;
        
        const totalScore = evaluations.reduce((sum, eval) => 
            sum + (parseFloat(eval.globalScore) || 0), 0);
        
        return totalScore / evaluations.length;
    }

    /**
     * Convertit un score en note
     */
    getGradeFromScore(score) {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        if (score >= 20) return 'D';
        return 'F';
    }

    /**
     * Rend les insights pour le template HTML
     */
    renderInsights(insights) {
        return Object.entries(insights).map(([key, value]) => `
            <div class="insight-card">
                <h4>${key}</h4>
                <p>${value}</p>
            </div>
        `).join('');
    }
}

// Export
module.exports = PerformanceReportGenerator;

// Utilisation en ligne de commande
if (require.main === module) {
    // Test du générateur avec des données d'exemple
    const generator = new PerformanceReportGenerator();
    const sampleData = {
        summary: {
            totalPages: 9,
            averageLoadTime: 2500
        },
        pages: {},
        recommendations: []
    };
    
    generator.generateFullReport(sampleData).catch(console.error);
}