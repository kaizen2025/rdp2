/**
 * Test de performance EasyOCR multi-langues sous charge
 * Mesure les temps de traitement OCR, précision et utilisation mémoire
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const PerformanceMonitor = require('../shared/performance-monitor');
const MetricsCollector = require('../shared/metrics-collector');

class EasyOCRLoadTest {
    constructor(config = {}) {
        this.config = {
            languages: ['fr', 'en', 'es', 'de', 'it'],
            concurrentUsers: 3,
            filesPerUser: 10,
            imageFormats: ['png', 'jpg', 'jpeg'],
            testDuration: 180, // 3 minutes
            batchSize: 5,
            ...config
        };
        
        this.monitor = new PerformanceMonitor('easyocr');
        this.metrics = new MetricsCollector('easyocr-load-test');
        this.results = {
            summary: {},
            detailed: [],
            errors: []
        };
        
        this.tempDir = './temp-ocr-images';
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🔄 Initialisation du test EasyOCR...');
        await this.monitor.start();
        
        // Générer les images de test
        await this.generateTestImages();
        
        // Vérifier que Python et EasyOCR sont disponibles
        try {
            await this.checkEnvironment();
        } catch (error) {
            throw new Error(`❌ Environnement EasyOCR non disponible: ${error.message}`);
        }
    }

    async generateTestImages() {
        console.log('🎨 Génération des images de test...');
        
        const imagePromises = [];
        
        for (let i = 0; i < this.config.filesPerUser * this.config.concurrentUsers; i++) {
            const lang = this.config.languages[i % this.config.languages.length];
            const format = this.config.imageFormats[i % this.config.imageFormats.length];
            
            imagePromises.push(this.createTestImage(i, lang, format));
        }
        
        await Promise.all(imagePromises);
    }

    async createTestImage(index, language, format) {
        const filename = `test-${language}-${index}.${format}`;
        const filepath = path.join(this.tempDir, filename);
        
        // Créer une image de test simple avec du texte
        const pythonScript = `
import PIL.Image as Image
import PIL.ImageDraw as ImageDraw
import PIL.ImageFont as ImageFont

# Texte de test multilingue
texts = {
    'fr': 'Bonjour le monde, ceci est un test OCR en français.',
    'en': 'Hello world, this is an OCR test in English.',
    'es': 'Hola mundo, esta es una prueba OCR en español.',
    'de': 'Hallo Welt, dies ist ein OCR-Test auf Deutsch.',
    'it': 'Ciao mondo, questo è un test OCR in italiano.'
}

# Créer une image
img = Image.new('RGB', (800, 200), 'white')
draw = ImageDraw.Draw(img)

# Utiliser une police par défaut
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
except:
    font = ImageFont.load_default()

# Dessiner le texte
text = texts.get('${language}', texts['fr'])
draw.text((50, 50), text, fill='black', font=font)

# Sauvegarder
img.save('${filepath}')
`;
        
        return new Promise((resolve, reject) => {
            exec(pythonScript, (error) => {
                if (error) {
                    console.warn(`⚠️ Impossible de créer l'image ${filename}: ${error.message}`);
                    // Créer une image vide de fallback
                    exec(`convert -size 800x200 xc:white ${filepath}`, (fallbackError) => {
                        if (fallbackError) {
                            reject(fallbackError);
                        } else {
                            resolve(filepath);
                        }
                    });
                } else {
                    resolve(filepath);
                }
            });
        });
    }

    async checkEnvironment() {
        return new Promise((resolve, reject) => {
            const pythonCheck = `python3 -c "import easyocr; print('EasyOCR version:', easyocr.__version__)"`;
            exec(pythonCheck, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Python/EasyOCR non installé: ${stderr}`));
                } else {
                    console.log('✅ EasyOCR disponible:', stdout.trim());
                    resolve();
                }
            });
        });
    }

    async runTest() {
        console.log('🚀 Démarrage du test de charge EasyOCR...');
        const startTime = Date.now();
        
        try {
            // Test de traitement séquentiel
            await this.sequentialProcessingTest();
            
            // Test de traitement concurrent
            await this.concurrentProcessingTest();
            
            // Test de traitement par lots
            await this.batchProcessingTest();

        } catch (error) {
            console.error('❌ Erreur pendant le test:', error.message);
            this.results.errors.push(error.message);
        } finally {
            const endTime = Date.now();
            this.results.summary.testDuration = endTime - startTime;
        }
    }

    async sequentialProcessingTest() {
        console.log('📋 Test de traitement séquentiel...');
        const images = fs.readdirSync(this.tempDir).slice(0, this.config.filesPerUser);
        
        for (const image of images) {
            const result = await this.processOCRImage(image, 'sequential', images.indexOf(image));
            this.results.detailed.push(result);
        }
    }

    async concurrentProcessingTest() {
        console.log('⚡ Test de traitement concurrent...');
        const images = fs.readdirSync(this.tempDir);
        const batches = this.createBatches(images, this.config.concurrentUsers);
        
        const batchPromises = batches.map((batch, batchIndex) => 
            this.processBatch(batch, 'concurrent', batchIndex)
        );
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(results => {
            this.results.detailed.push(...results);
        });
    }

    async batchProcessingTest() {
        console.log('📦 Test de traitement par lots...');
        const images = fs.readdirSync(this.tempDir);
        const batches = this.createBatches(images, this.config.batchSize);
        
        const batchPromises = batches.map((batch, batchIndex) => 
            this.processBatch(batch, 'batch', batchIndex)
        );
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(results => {
            this.results.detailed.push(...results);
        });
    }

    createBatches(images, batchSize) {
        const batches = [];
        for (let i = 0; i < images.length; i += batchSize) {
            batches.push(images.slice(i, i + batchSize));
        }
        return batches;
    }

    async processBatch(images, testType, batchIndex) {
        const results = [];
        const batchStart = Date.now();
        
        const processingPromises = images.map((image, index) => 
            this.processOCRImage(image, `${testType}-batch${batchIndex}`, index)
        );
        
        const batchResults = await Promise.all(processingPromises);
        batchResults.forEach(result => {
            results.push({
                ...result,
                batchIndex,
                batchSize: images.length,
                batchDuration: Date.now() - batchStart
            });
        });
        
        return results;
    }

    async processOCRImage(image, testType, index) {
        const filepath = path.join(this.tempDir, image);
        const startTime = Date.now();
        
        const result = {
            image,
            testType,
            index,
            timestamp: new Date().toISOString(),
            success: false,
            processingTime: 0,
            textExtracted: '',
            confidence: 0,
            wordsCount: 0,
            error: null
        };

        try {
            const pythonScript = `
import easyocr
import json
import time

start_time = time.time()

try:
    # Initialiser le lecteur
    reader = easyocr.Reader(['fr', 'en'])  # Langues de base
    
    # Lire l'image
    results = reader.readtext('${filepath}')
    
    end_time = time.time()
    processing_time = (end_time - start_time) * 1000  # en ms
    
    # Extraire les résultats
    text_lines = []
    total_confidence = 0
    valid_confidences = 0
    
    for (bbox, text, confidence in results:
        if confidence > 0.5:  # Seuil de confiance
            text_lines.append(text)
            if confidence < 1.0:  # Ignorer les confidences parfaites
                total_confidence += confidence
                valid_confidences += 1
    
    # Calculer la confiance moyenne
    avg_confidence = total_confidence / valid_confidences if valid_confidences > 0 else 1.0
    
    # Résultat final
    result = {
        'success': True,
        'processing_time': processing_time,
        'text_extracted': ' '.join(text_lines),
        'confidence': avg_confidence,
        'words_count': len([word for line in text_lines for word in line.split()])
    }
    
    print(json.dumps(result))
    
except Exception as e:
    error_result = {
        'success': False,
        'processing_time': (time.time() - start_time) * 1000,
        'text_extracted': '',
        'confidence': 0,
        'words_count': 0,
        'error': str(e)
    }
    print(json.dumps(error_result))
`;
            
            const processingResult = await this.executePythonScript(pythonScript);
            const parsedResult = JSON.parse(processingResult);
            
            result.success = parsedResult.success;
            result.processingTime = parsedResult.processing_time;
            result.textExtracted = parsedResult.text_extracted;
            result.confidence = parsedResult.confidence;
            result.wordsCount = parsedResult.words_count;
            
            if (!parsedResult.success) {
                result.error = parsedResult.error;
            }
            
        } catch (error) {
            result.error = error.message;
            result.processingTime = Date.now() - startTime;
            console.error(`❌ Erreur traitement OCR (${image}):`, error.message);
        }

        return result;
    }

    executePythonScript(script) {
        return new Promise((resolve, reject) => {
            exec(script, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Python error: ${stderr}`));
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async generateReport() {
        console.log('📊 Génération du rapport de performance EasyOCR...');
        
        const successfulRequests = this.results.detailed.filter(r => r.success);
        const failedRequests = this.results.detailed.filter(r => !r.success);
        
        // Métriques par type de test
        const testTypeMetrics = {};
        this.config.languages.forEach(lang => {
            testTypeMetrics[lang] = {
                total: 0,
                successful: 0,
                avgProcessingTime: 0,
                avgConfidence: 0,
                wordsPerSecond: 0
            };
        });
        
        successfulRequests.forEach(request => {
            const lang = request.image.split('-')[1];
            if (testTypeMetrics[lang]) {
                testTypeMetrics[lang].total++;
                if (request.success) {
                    testTypeMetrics[lang].successful++;
                    testTypeMetrics[lang].avgProcessingTime += request.processingTime;
                    testTypeMetrics[lang].avgConfidence += request.confidence;
                    testTypeMetrics[lang].wordsPerSecond += request.wordsCount / (request.processingTime / 1000);
                }
            }
        });
        
        // Calculer les moyennes
        Object.keys(testTypeMetrics).forEach(lang => {
            const metrics = testTypeMetrics[lang];
            if (metrics.successful > 0) {
                metrics.avgProcessingTime /= metrics.successful;
                metrics.avgConfidence /= metrics.successful;
                metrics.wordsPerSecond /= metrics.successful;
                metrics.successRate = (metrics.successful / metrics.total * 100).toFixed(2);
            }
        });

        this.results.summary = {
            ...this.results.summary,
            totalImages: this.results.detailed.length,
            successfulProcessing: successfulRequests.length,
            failedProcessing: failedRequests.length,
            overallSuccessRate: (successfulRequests.length / this.results.detailed.length * 100).toFixed(2),
            
            // Temps de traitement
            avgProcessingTime: this.calculateAverage(successfulRequests, 'processingTime'),
            p50ProcessingTime: this.calculatePercentile(successfulRequests, 'processingTime', 50),
            p95ProcessingTime: this.calculatePercentile(successfulRequests, 'processingTime', 95),
            p99ProcessingTime: this.calculatePercentile(successfulRequests, 'processingTime', 99),
            
            // Qualité OCR
            avgConfidence: this.calculateAverage(successfulRequests, 'confidence'),
            avgWordsCount: this.calculateAverage(successfulRequests, 'wordsCount'),
            wordsPerSecond: this.calculateAverage(successfulRequests.map(r => r.wordsCount / (r.processingTime / 1000)), 'value'),
            
            // Métriques par langue
            languageMetrics: testTypeMetrics,
            
            // Erreurs
            errorTypes: this.categorizeErrors(failedRequests),
            
            // Ressources système
            systemMetrics: await this.monitor.getSystemMetrics()
        };

        // Sauvegarde des résultats
        const reportPath = `../results/easyocr-load-test-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        return this.results.summary;
    }

    calculateAverage(data, field) {
        if (data.length === 0) return 0;
        return (data.reduce((sum, item) => sum + (typeof item === 'object' ? item[field] : item), 0) / data.length).toFixed(2);
    }

    calculatePercentile(data, field, percentile) {
        if (data.length === 0) return 0;
        const sorted = data.map(item => item[field]).sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    categorizeErrors(errors) {
        const categories = {};
        errors.forEach(error => {
            const category = error.error && error.error.includes('timeout') ? 'timeout' :
                           error.error && error.error.includes('memory') ? 'memory' :
                           error.error && error.error.includes('file') ? 'file' : 'other';
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }

    cleanup() {
        // Nettoyer les fichiers temporaires
        if (fs.existsSync(this.tempDir)) {
            fs.rmSync(this.tempDir, { recursive: true, force: true });
        }
    }

    async run() {
        try {
            await this.initialize();
            await this.runTest();
            const summary = await this.generateReport();
            await this.monitor.stop();
            this.cleanup();
            
            console.log('\n📈 RÉSUMÉ DU TEST EASYOCR:');
            console.log(`✓ Traitements réussis: ${summary.successfulProcessing}/${summary.totalImages} (${summary.overallSuccessRate}%)`);
            console.log(`⚡ Temps de traitement moyen: ${summary.avgProcessingTime}ms`);
            console.log(`📊 P95: ${summary.p95ProcessingTime}ms, P99: ${summary.p99ProcessingTime}ms`);
            console.log(`🎯 Confiance moyenne: ${summary.avgConfidence}`);
            console.log(`📝 Mots/sec: ${summary.wordsPerSecond}`);
            
            Object.entries(summary.languageMetrics).forEach(([lang, metrics]) => {
                if (metrics.total > 0) {
                    console.log(`  ${lang}: ${metrics.avgProcessingTime}ms, ${metrics.avgConfidence} conf`);
                }
            });
            
            return summary;
        } catch (error) {
            console.error('❌ Échec du test:', error);
            this.cleanup();
            throw error;
        }
    }
}

module.exports = EasyOCRLoadTest;