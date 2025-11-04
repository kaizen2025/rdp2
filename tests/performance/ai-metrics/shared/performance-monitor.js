/**
 * Moniteur de performance système
 * Collecte les métriques CPU, mémoire, réseau et processus
 */

const os = require('os');
const { exec } = require('child_process');

class PerformanceMonitor {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.options = {
            interval: options.interval || 1000, // 1 seconde
            enableDetailedMetrics: options.enableDetailedMetrics || false,
            ...options
        };
        
        this.isRunning = false;
        this.monitoringInterval = null;
        this.metricsHistory = [];
        this.startTime = null;
        
        // Cache pour les métriques système
        this.systemCache = {
            lastCpuUsage: null,
            lastCpuTimes: null,
            lastMemoryInfo: null
        };
    }

    async start() {
        console.log(`📊 Démarrage du monitoring pour ${this.serviceName}...`);
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Collecte initiale
        await this.collectMetrics();
        
        // Démarrage de la collecte périodique
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, this.options.interval);
    }

    async stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.isRunning = false;
        console.log(`⏹️ Monitoring arrêté pour ${this.serviceName}`);
        
        // Collecte finale
        await this.collectMetrics();
    }

    async collectMetrics() {
        if (!this.isRunning) return;
        
        try {
            const timestamp = Date.now();
            const metrics = await this.getSystemMetrics();
            
            const monitoringData = {
                timestamp,
                uptime: this.startTime ? timestamp - this.startTime : 0,
                ...metrics
            };
            
            this.metricsHistory.push(monitoringData);
            
            // Maintenir seulement les dernières 1000 mesures
            if (this.metricsHistory.length > 1000) {
                this.metricsHistory = this.metricsHistory.slice(-1000);
            }
            
        } catch (error) {
            console.warn(`⚠️ Erreur collecte métriques ${this.serviceName}:`, error.message);
        }
    }

    async getSystemMetrics() {
        const metrics = {
            // Métriques système de base
            cpu: await this.getCPUUsage(),
            memory: await this.getMemoryUsage(),
            load: this.getSystemLoad(),
            
            // Métriques réseau
            network: await this.getNetworkMetrics(),
            
            // Métriques spécifiques au service
            service: await this.getServiceMetrics(),
            
            // Métriques détaillées si activées
            ...(this.options.enableDetailedMetrics ? await this.getDetailedMetrics() : {})
        };
        
        return metrics;
    }

    async getCPUUsage() {
        try {
            // Utiliser le module os pour CPU usage
            const cpus = os.cpus();
            const loadAvg = os.loadavg();
            
            // Calculer l'utilisation CPU approximative
            const cpuCount = cpus.length;
            const load1Min = loadAvg[0];
            const load5Min = loadAvg[1];
            const load15Min = loadAvg[2];
            
            // Estimation CPU usage basée sur la charge
            const cpuUsage = Math.min((load1Min / cpuCount) * 100, 100);
            
            return {
                usage: Math.round(cpuUsage),
                load1: load1Min.toFixed(2),
                load5: load5Min.toFixed(2),
                load15: load15Min.toFixed(2),
                count: cpuCount,
                model: cpus[0]?.model || 'Unknown'
            };
        } catch (error) {
            return {
                usage: 0,
                load1: '0.00',
                load5: '0.00',
                load15: '0.00',
                count: os.cpus().length,
                error: error.message
            };
        }
    }

    async getMemoryUsage() {
        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const usagePercent = (usedMem / totalMem) * 100;
            
            return {
                total: this.formatBytes(totalMem),
                used: this.formatBytes(usedMem),
                free: this.formatBytes(freeMem),
                usagePercent: Math.round(usagePercent),
                available: this.formatBytes(freeMem)
            };
        } catch (error) {
            return {
                usagePercent: 0,
                error: error.message
            };
        }
    }

    getSystemLoad() {
        try {
            const loadAvg = os.loadavg();
            return {
                '1min': loadAvg[0].toFixed(2),
                '5min': loadAvg[1].toFixed(2),
                '15min': loadAvg[2].toFixed(2)
            };
        } catch (error) {
            return {
                '1min': '0.00',
                '5min': '0.00',
                '15min': '0.00',
                error: error.message
            };
        }
    }

    async getNetworkMetrics() {
        try {
            // Simuler les métriques réseau (dans un vrai système, utiliser des libs comme 'network-stats')
            return {
                bytesIn: '0', // En producción, utiliser network-stats
                bytesOut: '0',
                packetsIn: 0,
                packetsOut: 0,
                connections: this.getActiveConnections()
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    getActiveConnections() {
        try {
            // Retourner le nombre de connexions réseau actives
            return {
                tcp: this.countTCPPconnections(),
                udp: 0 // Estimation
            };
        } catch (error) {
            return {
                tcp: 0,
                udp: 0,
                error: error.message
            };
        }
    }

    countTCPPconnections() {
        try {
            // Compter les connexions TCP actives
            // Dans un vrai système, utiliser netstat ou /proc/net/tcp
            return Math.floor(Math.random() * 100); // Simulation
        } catch (error) {
            return 0;
        }
    }

    async getServiceMetrics() {
        try {
            // Métriques spécifiques au service
            const metrics = {
                processCount: this.getProcessCount(),
                openFiles: this.getOpenFilesCount(),
                threads: this.getThreadCount(),
                responseTime: this.estimateResponseTime()
            };
            
            return metrics;
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    getProcessCount() {
        try {
            // Compter les processus Node.js
            // Dans un vrai système, utiliser ps ou /proc
            return Math.floor(Math.random() * 50) + 10; // Simulation
        } catch (error) {
            return 0;
        }
    }

    getOpenFilesCount() {
        try {
            // Compter les fichiers ouverts
            return Math.floor(Math.random() * 1000) + 100; // Simulation
        } catch (error) {
            return 0;
        }
    }

    getThreadCount() {
        try {
            // Estimation du nombre de threads
            return Math.floor(Math.random() * 20) + 5; // Simulation
        } catch (error) {
            return 0;
        }
    }

    estimateResponseTime() {
        try {
            // Estimation du temps de réponse basé sur la charge système
            const cpuUsage = this.systemCache.lastCpuUsage || 0;
            const memoryUsage = this.systemCache.lastMemoryInfo?.usagePercent || 0;
            
            // Formule simple d'estimation
            const baseTime = 100; // ms
            const cpuPenalty = (cpuUsage / 100) * 200; // +200ms à 100% CPU
            const memoryPenalty = (memoryUsage / 100) * 100; // +100ms à 100% mémoire
            
            return Math.floor(baseTime + cpuPenalty + memoryPenalty);
        } catch (error) {
            return 100; // Valeur par défaut
        }
    }

    async getDetailedMetrics() {
        try {
            return {
                disk: await this.getDiskMetrics(),
                systemInfo: this.getSystemInfo(),
                nodejs: this.getNodeMetrics()
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    async getDiskMetrics() {
        try {
            // Utilisation du disque (simulation)
            return {
                total: '50GB',
                used: '30GB',
                free: '20GB',
                usagePercent: 60
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: this.formatUptime(os.uptime()),
            hostname: os.hostname()
        };
    }

    getNodeMetrics() {
        const memUsage = process.memoryUsage();
        return {
            heapUsed: this.formatBytes(memUsage.heapUsed),
            heapTotal: this.formatBytes(memUsage.heapTotal),
            external: this.formatBytes(memUsage.external),
            rss: this.formatBytes(memUsage.rss),
            arrayBuffers: this.formatBytes(memUsage.arrayBuffers || 0)
        };
    }

    // Utilitaires
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        let uptime = '';
        if (days > 0) uptime += `${days}d `;
        if (hours > 0) uptime += `${hours}h `;
        if (minutes > 0) uptime += `${minutes}m `;
        uptime += `${secs}s`;
        
        return uptime;
    }

    // Méthodes publiques pour obtenir des métriques en temps réel
    getCurrentMetrics() {
        return this.metricsHistory[this.metricsHistory.length - 1] || {};
    }

    getMetricsHistory(duration = 60000) {
        const cutoff = Date.now() - duration;
        return this.metricsHistory.filter(m => m.timestamp > cutoff);
    }

    getAverageMetrics(duration = 60000) {
        const history = this.getMetricsHistory(duration);
        
        if (history.length === 0) return null;
        
        const avg = {
            count: history.length,
            cpu: 0,
            memory: 0,
            load1: 0,
            responseTime: 0
        };
        
        history.forEach(metrics => {
            avg.cpu += metrics.cpu?.usage || 0;
            avg.memory += metrics.memory?.usagePercent || 0;
            avg.load1 += parseFloat(metrics.load?.['1min'] || '0');
            avg.responseTime += metrics.service?.responseTime || 0;
        });
        
        avg.cpu = Math.round(avg.cpu / history.length);
        avg.memory = Math.round(avg.memory / history.length);
        avg.load1 = parseFloat((avg.load1 / history.length).toFixed(2));
        avg.responseTime = Math.round(avg.responseTime / history.length);
        
        return avg;
    }

    getPeakMetrics(duration = 60000) {
        const history = this.getMetricsHistory(duration);
        
        if (history.length === 0) return null;
        
        const peaks = {
            maxCpu: Math.max(...history.map(m => m.cpu?.usage || 0)),
            maxMemory: Math.max(...history.map(m => m.memory?.usagePercent || 0)),
            maxLoad1: Math.max(...history.map(m => parseFloat(m.load?.['1min'] || '0'))),
            maxResponseTime: Math.max(...history.map(m => m.service?.responseTime || 0))
        };
        
        return peaks;
    }

    // Méthode pour générer un rapport de performance
    generatePerformanceReport() {
        const current = this.getCurrentMetrics();
        const avg = this.getAverageMetrics(300000); // 5 minutes
        const peaks = this.getPeakMetrics(300000);
        
        return {
            service: this.serviceName,
            current,
            average: avg,
            peaks,
            historyLength: this.metricsHistory.length,
            monitoringDuration: this.startTime ? Date.now() - this.startTime : 0,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = PerformanceMonitor;