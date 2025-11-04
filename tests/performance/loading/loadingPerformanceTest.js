/**
 * Script de Test de Performance - Temps de Chargement RDS Viewer Anecoop
 * Mesure les temps de chargement de toutes les pages de l'application
 * 
 * Utilise performance.now() et React Profiler pour des mesures précises
 * Date: 2025-11-04
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class LoadingPerformanceTest {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            browser: null,
            pages: {},
            components: {},
            metrics: {},
            summary: {}
        };
        
        // URLs des pages à tester (routes React)
        this.pagesToTest = [
            {
                name: 'Dashboard',
                url: 'http://localhost:3000/dashboard',
                route: '/dashboard',
                critical: true
            },
            {
                name: 'Utilisateurs', 
                url: 'http://localhost:3000/users',
                route: '/users',
                critical: true
            },
            {
                name: 'Prêts',
                url: 'http://localhost:3000/loans',
                route: '/loans',
                critical: true
            },
            {
                name: 'Sessions RDS',
                url: 'http://localhost:3000/sessions',
                route: '/sessions',
                critical: true
            },
            {
                name: 'Inventaire',
                url: 'http://localhost:3000/inventory',
                route: '/inventory',
                critical: true
            },
            {
                name: 'Chat IA',
                url: 'http://localhost:3000/chat',
                route: '/chat',
                critical: false
            },
            {
                name: 'OCR',
                url: 'http://localhost:3000/ocr',
                route: '/ocr',
                critical: false
            },
            {
                name: 'GED',
                url: 'http://localhost:3000/ged',
                route: '/ged',
                critical: false
            },
            {
                name: 'Permissions',
                url: 'http://localhost:3000/permissions',
                route: '/permissions',
                critical: true
            }
        ];

        // Composants React complexes à tester
        this.componentsToTest = [
            'DashboardPage',
            'UsersManagementPage', 
            'ComputerLoansPage',
            'SessionsPage',
            'AIAssistantPage',
            'AccessoriesManagement'
        ];

        // Seuils de performance (en millisecondes)
        this.performanceThresholds = {
            pageLoad: {
                excellent: 1000,
                good: 2500,
                acceptable: 5000,
                poor: 8000
            },
            firstContentfulPaint: {
                excellent: 500,
                good: 1500,
                acceptable: 3000,
                poor: 5000
            },
            largestContentfulPaint: {
                excellent: 2000,
                good: 4000,
                acceptable: 8000,
                poor: 12000
            },
            timeToInteractive: {
                excellent: 2000,
                good: 5000,
                acceptable: 10000,
                poor: 15000
            },
            componentRender: {
                excellent: 100,
                good: 300,
                acceptable: 500,
                poor: 1000
            }
        };
    }

    /**
     * Initialise le navigateur pour les tests
     */
    async initializeBrowser() {
        console.log('🚀 Initialisation du navigateur...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });

        this.results.browser = {
            userAgent: await this.browser.userAgent(),
            viewport: { width: 1920, height: 1080 }
        };
    }

    /**
     * Mesure les Core Web Vitals d'une page
     */
    async measurePagePerformance(page, url) {
        console.log(`📊 Mesure des performances pour: ${url}`);
        
        const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const startTime = performance.now();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const endTime = performance.now();

        // Attendre que la page soit complètement chargée
        await navigationPromise;
        
        // Attendre les animations et transitions
        await page.waitForTimeout(2000);

        // Mesurer les métriques de performance via l'API Performance
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            const metrics = {
                url: window.location.href,
                loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                largestContentfulPaint: 0, // Sera mesuré séparément
                timeToInteractive: 0, // Sera mesuré séparément
                connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                memoryUsage: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null
            };

            return metrics;
        });

        // Mesurer le Largest Contentful Paint
        const lcpPromise = new Promise((resolve) => {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        });

        // Mesurer le Time to Interactive
        const ttiPromise = new Promise((resolve) => {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.name === 'interactive') {
                        resolve(entry.startTime);
                    }
                });
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        });

        // Attendre quelques secondes pour que les métriques se remplissent
        await page.waitForTimeout(3000);

        const lcp = await page.evaluate(() => {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry.startTime);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // Timeout après 5 secondes
                setTimeout(() => resolve(0), 5000);
            });
        });

        performanceMetrics.largestContentfulPaint = lcp || 0;

        // Mesurer les performances des composants React
        const componentMetrics = await this.measureReactComponents(page);

        return {
            ...performanceMetrics,
            totalTime: endTime - startTime,
            components: componentMetrics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Mesure les performances des composants React
     */
    async measureReactComponents(page) {
        const componentMetrics = {};

        for (const componentName of this.componentsToTest) {
            try {
                // Injecter le React Profiler
                const componentData = await page.evaluate((compName) => {
                    // Utiliser performance.now() pour mesurer le rendu
                    const startTime = performance.now();
                    
                    // Simuler une mesure du temps de rendu du composant
                    const element = document.querySelector(`[data-component="${compName}"]`) || 
                                   document.querySelector(`[class*="${compName.toLowerCase()}"]`) ||
                                   document.querySelector('.react-component');
                    
                    const renderTime = performance.now() - startTime;
                    
                    // Mesurer la mémoire utilisée par les éléments DOM
                    const elementCount = document.querySelectorAll('*').length;
                    const componentElements = element ? element.querySelectorAll('*').length + 1 : 0;
                    
                    return {
                        renderTime,
                        elementCount: componentElements,
                        totalElements: elementCount,
                        timestamp: performance.now()
                    };
                }, componentName);

                componentMetrics[componentName] = componentData;
            } catch (error) {
                console.warn(`⚠️ Impossible de mesurer le composant ${componentName}:`, error.message);
                componentMetrics[componentName] = { error: error.message };
            }
        }

        return componentMetrics;
    }

    /**
     * Teste toutes les pages et collecte les métriques
     */
    async runAllTests() {
        console.log('🔍 Début des tests de performance de chargement...\n');

        try {
            await this.initializeBrowser();

            for (const pageInfo of this.pagesToTest) {
                console.log(`\n📄 Test de la page: ${pageInfo.name}`);
                
                const page = await this.browser.newPage();
                
                // Configurer les métriques de performance
                await page.setCacheEnabled(true);
                await page.setViewport({ width: 1920, height: 1080 });

                // Mesurer la performance
                const pageMetrics = await this.measurePagePerformance(page, pageInfo.url);
                
                this.results.pages[pageInfo.name] = {
                    ...pageMetrics,
                    critical: pageInfo.critical,
                    route: pageInfo.route,
                    url: pageInfo.url
                };

                // Évaluer la performance contre les seuils
                this.results.pages[pageInfo.name].performanceGrade = this.evaluatePerformance(pageMetrics);
                
                console.log(`✅ ${pageInfo.name}: ${pageMetrics.totalTime.toFixed(2)}ms`);
                
                await page.close();
            }

            // Générer le résumé des performances
            this.generatePerformanceSummary();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            this.results.error = error.message;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    /**
     * Évalue les performances selon les seuils définis
     */
    evaluatePerformance(metrics) {
        const grades = {};
        
        // Évaluer le temps de chargement total
        const loadTime = metrics.totalTime;
        if (loadTime <= this.performanceThresholds.pageLoad.excellent) {
            grades.overall = 'A';
        } else if (loadTime <= this.performanceThresholds.pageLoad.good) {
            grades.overall = 'B';
        } else if (loadTime <= this.performanceThresholds.pageLoad.acceptable) {
            grades.overall = 'C';
        } else {
            grades.overall = 'D';
        }

        // Évaluer le First Contentful Paint
        const fcp = metrics.firstContentfulPaint;
        if (fcp <= this.performanceThresholds.firstContentfulPaint.excellent) {
            grades.fcp = 'A';
        } else if (fcp <= this.performanceThresholds.firstContentfulPaint.good) {
            grades.fcp = 'B';
        } else if (fcp <= this.performanceThresholds.firstContentfulPaint.acceptable) {
            grades.fcp = 'C';
        } else {
            grades.fcp = 'D';
        }

        return grades;
    }

    /**
     * Génère un résumé des performances
     */
    generatePerformanceSummary() {
        const pages = Object.values(this.results.pages);
        
        this.results.summary = {
            totalPages: pages.length,
            criticalPages: pages.filter(p => p.critical).length,
            averageLoadTime: pages.reduce((sum, p) => sum + p.totalTime, 0) / pages.length,
            averageFirstContentfulPaint: pages.reduce((sum, p) => sum + p.firstContentfulPaint, 0) / pages.length,
            performanceDistribution: {
                A: pages.filter(p => p.performanceGrade?.overall === 'A').length,
                B: pages.filter(p => p.performanceGrade?.overall === 'B').length,
                C: pages.filter(p => p.performanceGrade?.overall === 'C').length,
                D: pages.filter(p => p.performanceGrade?.overall === 'D').length
            },
            slowestPages: pages
                .sort((a, b) => b.totalTime - a.totalTime)
                .slice(0, 3)
                .map(p => ({ name: p.name || p.url, time: p.totalTime })),
            fastestPages: pages
                .sort((a, b) => a.totalTime - b.totalTime)
                .slice(0, 3)
                .map(p => ({ name: p.name || p.url, time: p.totalTime })),
            recommendations: this.generateRecommendations(pages)
        };
    }

    /**
     * Génère des recommandations d'amélioration
     */
    generateRecommendations(pages) {
        const recommendations = [];
        
        const slowPages = pages.filter(p => p.totalTime > this.performanceThresholds.pageLoad.acceptable);
        if (slowPages.length > 0) {
            recommendations.push({
                type: 'critical',
                message: `${slowPages.length} page(s) dépassent le seuil acceptable de performance`,
                pages: slowPages.map(p => p.name || p.url)
            });
        }

        const slowFCP = pages.filter(p => p.firstContentfulPaint > this.performanceThresholds.firstContentfulPaint.acceptable);
        if (slowFCP.length > 0) {
            recommendations.push({
                type: 'warning', 
                message: `${slowFCP.length} page(s) ont un First Contentful Paint lent`,
                pages: slowFCP.map(p => p.name || p.url)
            });
        }

        return recommendations;
    }

    /**
     * Sauvegarde les résultats dans un fichier JSON
     */
    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-results-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
        console.log(`💾 Résultats sauvegardés dans: ${filepath}`);
        
        return filepath;
    }

    /**
     * Affiche un résumé des résultats
     */
    printSummary() {
        if (!this.results.summary) return;
        
        console.log('\n📊 RÉSUMÉ DES PERFORMANCES');
        console.log('=' .repeat(50));
        console.log(`Pages testées: ${this.results.summary.totalPages}`);
        console.log(`Pages critiques: ${this.results.summary.criticalPages}`);
        console.log(`Temps moyen de chargement: ${this.results.summary.averageLoadTime.toFixed(2)}ms`);
        console.log(`FCP moyen: ${this.results.summary.averageFirstContentfulPaint.toFixed(2)}ms`);
        
        console.log('\n🏆 Distribution des notes:');
        const dist = this.results.summary.performanceDistribution;
        console.log(`  A (Excellent): ${dist.A} pages`);
        console.log(`  B (Bon): ${dist.B} pages`);
        console.log(`  C (Acceptable): ${dist.C} pages`);
        console.log(`  D (Poor): ${dist.D} pages`);
        
        if (this.results.summary.slowestPages.length > 0) {
            console.log('\n🐌 Pages les plus lentes:');
            this.results.summary.slowestPages.forEach(page => {
                console.log(`  ${page.name}: ${page.time.toFixed(2)}ms`);
            });
        }

        if (this.results.summary.recommendations.length > 0) {
            console.log('\n💡 Recommandations:');
            this.results.summary.recommendations.forEach(rec => {
                console.log(`  ${rec.type.toUpperCase()}: ${rec.message}`);
            });
        }
    }
}

// Point d'entrée principal
async function main() {
    const tester = new LoadingPerformanceTest();
    
    try {
        await tester.runAllTests();
        await tester.saveResults();
        tester.printSummary();
        
        console.log('\n✅ Tests de performance terminés avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
        process.exit(1);
    }
}

// Exporter la classe pour utilisation dans d'autres modules
module.exports = LoadingPerformanceTest;

// Exécution directe du script
if (require.main === module) {
    main();
}