/**
 * Logger utilitaire pour les tests de performance
 * @file logger.js
 */

const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

class PerformanceLogger {
    constructor() {
        this.logs = [];
        this.verbose = false;
        this.outputDir = null;
    }

    init(outputDir, verbose = false) {
        this.outputDir = outputDir;
        this.verbose = verbose;
        this.logFile = path.join(outputDir, `performance-tests-${moment().format('YYYY-MM-DD_HH-mm-ss')}.log`);
    }

    formatMessage(level, message, data = null) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;
        
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        this.logs.push(logEntry);
        
        // Afficher sur console
        if (this.verbose || level !== 'DEBUG') {
            switch (level) {
                case 'ERROR':
                    console.error('❌', formattedMessage);
                    break;
                case 'WARN':
                    console.warn('⚠️', formattedMessage);
                    break;
                case 'INFO':
                    console.log('ℹ️', formattedMessage);
                    break;
                case 'DEBUG':
                    console.log('🔧', formattedMessage);
                    break;
                default:
                    console.log(message);
            }
        }
        
        // Ajouter les données détaillées
        if (data && this.verbose) {
            console.log('   ', JSON.stringify(data, null, 2));
        }
        
        return logEntry;
    }

    error(message, data = null) {
        return this.formatMessage('ERROR', message, data);
    }

    warn(message, data = null) {
        return this.formatMessage('WARN', message, data);
    }

    info(message, data = null) {
        return this.formatMessage('INFO', message, data);
    }

    debug(message, data = null) {
        return this.formatMessage('DEBUG', message, data);
    }

    success(message, data = null) {
        return this.formatMessage('SUCCESS', message, data);
    }

    // Méthodes spécialisées pour les benchmarks
    startBenchmark(testName, params = {}) {
        this.info(`🚀 Démarrage du benchmark: ${testName}`, params);
        return {
            testName,
            startTime: moment(),
            params
        };
    }

    endBenchmark(benchmark, result) {
        const duration = moment().diff(benchmark.startTime, 'milliseconds');
        this.success(`🏁 Benchmark terminé: ${benchmark.testName} (${duration}ms)`, result);
        return {
            ...benchmark,
            endTime: moment(),
            duration,
            result
        };
    }

    logMetrics(metrics) {
        this.info('📊 Métriques collectées:', metrics);
    }

    logError(testName, error) {
        this.error(`❌ Erreur dans ${testName}: ${error.message}`, {
            stack: error.stack,
            name: error.name
        });
    }

    logProgress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
        
        console.log(`\r🔄 [${progressBar}] ${percentage}% (${current}/${total}) ${message}`);
        
        if (current === total) {
            console.log(''); // Nouvelle ligne à la fin
        }
    }

    // Sauvegarde des logs
    async save() {
        if (!this.outputDir) {
            console.warn('📝 Aucun dossier de sortie configuré pour la sauvegarde des logs');
            return;
        }

        try {
            const logContent = this.logs.map(log => 
                `[${log.timestamp}] [${log.level}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
            ).join('\n');
            
            await fs.writeFile(this.logFile, logContent);
            console.log(`📁 Logs sauvegardés: ${this.logFile}`);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des logs:', error);
        }
    }

    // Obtenir un résumé des logs
    getSummary() {
        const summary = {
            total: this.logs.length,
            errors: this.logs.filter(l => l.level === 'ERROR').length,
            warnings: this.logs.filter(l => l.level === 'WARN').length,
            info: this.logs.filter(l => l.level === 'INFO').length,
            debug: this.logs.filter(l => l.level === 'DEBUG').length
        };

        return summary;
    }

    // Exporter les logs pour les rapports
    exportLogs(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.logs, null, 2);
            case 'csv':
                const headers = 'timestamp,level,message,data';
                const rows = this.logs.map(log => 
                    `"${log.timestamp}","${log.level}","${log.message}","${JSON.stringify(log.data || {})}"`
                ).join('\n');
                return `${headers}\n${rows}`;
            default:
                return this.logs;
        }
    }
}

// Instance globale
const logger = new PerformanceLogger();

module.exports = logger;