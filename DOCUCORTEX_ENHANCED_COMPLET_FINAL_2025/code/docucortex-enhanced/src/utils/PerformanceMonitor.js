// src/utils/PerformanceMonitor.js - SURVEILLANCE AVANCÉE DES PERFORMANCES

import React from 'react';

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            renderTimes: [],
            memoryUsage: [],
            fps: [],
            timestamp: Date.now()
        };
        this.maxSamples = 60; // Conserver 60 échantillons (~1 seconde à 60fps)
        this.isInitialized = false;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
    }

    // 📊 Initialisation du monitor
    init() {
        if (this.isInitialized) return;
        
        this.isInitialized = true;
        this.startFrameCounting();
        this.startMemoryMonitoring();
        
        console.log('🚀 PerformanceMonitor initialisé');
    }

    // 🎯 Mesurer le temps de rendu
    measureRender(componentName, startTime) {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        this.metrics.renderTimes.push({
            component: componentName,
            time: renderTime,
            timestamp: endTime
        });
        
        // Conserver seulement les derniers échantillons
        if (this.metrics.renderTimes.length > this.maxSamples) {
            this.metrics.renderTimes.shift();
        }
        
        return renderTime;
    }

    // 🧠 Surveiller l'utilisation mémoire
    startMemoryMonitoring() {
        if (!performance.memory) {
            console.warn('⚠️ Performance.memory non disponible dans ce navigateur');
            return;
        }

        setInterval(() => {
            const memory = performance.memory;
            this.metrics.memoryUsage.push({
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                timestamp: Date.now()
            });
            
            // Nettoyer les anciens échantillons
            if (this.metrics.memoryUsage.length > this.maxSamples) {
                this.metrics.memoryUsage.shift();
            }
        }, 1000); // Vérifier chaque seconde
    }

    // 📈 Compter les frames pour le FPS
    startFrameCounting() {
        const countFrame = () => {
            this.frameCount++;
            const currentTime = performance.now();
            
            // Calculer FPS chaque seconde
            if (currentTime - this.lastFrameTime >= 1000) {
                const fps = this.frameCount;
                this.metrics.fps.push({
                    fps,
                    timestamp: currentTime
                });
                
                // Conserver seulement les derniers échantillons
                if (this.metrics.fps.length > this.maxSamples) {
                    this.metrics.fps.shift();
                }
                
                this.frameCount = 0;
                this.lastFrameTime = currentTime;
            }
            
            requestAnimationFrame(countFrame);
        };
        
        requestAnimationFrame(countFrame);
    }

    // 📊 Obtenir les métriques actuelles
    getCurrentMetrics() {
        const latestRenderTime = this.metrics.renderTimes.length > 0 
            ? this.metrics.renderTimes[this.metrics.renderTimes.length - 1].time 
            : 0;
            
        const latestMemory = this.metrics.memoryUsage.length > 0 
            ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].used 
            : 0;
            
        const latestFps = this.metrics.fps.length > 0 
            ? this.metrics.fps[this.metrics.fps.length - 1].fps 
            : 60;

        return {
            renderTime: latestRenderTime,
            memoryUsage: latestMemory,
            fps: latestFps,
            itemCount: 0, // Sera mis à jour par le composant
            timestamp: Date.now()
        };
    }

    // 📈 Obtenir les statistiques détaillées
    getStatistics() {
        const renderTimes = this.metrics.renderTimes.map(m => m.time);
        const fpsValues = this.metrics.fps.map(m => m.fps);
        const memoryValues = this.metrics.memoryUsage.map(m => m.used);

        return {
            renderTime: {
                average: renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0,
                min: renderTimes.length > 0 ? Math.min(...renderTimes) : 0,
                max: renderTimes.length > 0 ? Math.max(...renderTimes) : 0,
                latest: renderTimes[renderTimes.length - 1] || 0
            },
            memory: {
                average: memoryValues.length > 0 ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length : 0,
                min: memoryValues.length > 0 ? Math.min(...memoryValues) : 0,
                max: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
                latest: memoryValues[memoryValues.length - 1] || 0
            },
            fps: {
                average: fpsValues.length > 0 ? fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length : 0,
                min: fpsValues.length > 0 ? Math.min(...fpsValues) : 0,
                max: fpsValues.length > 0 ? Math.max(...fpsValues) : 0,
                latest: fpsValues[fpsValues.length - 1] || 60
            },
            samples: {
                renderTime: renderTimes.length,
                memory: memoryValues.length,
                fps: fpsValues.length
            }
        };
    }

    // 🧹 Nettoyer les données
    clear() {
        this.metrics.renderTimes = [];
        this.metrics.memoryUsage = [];
        this.metrics.fps = [];
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
    }

    // 📊 Exporter les données pour l'analyse
    exportData() {
        return {
            metrics: this.metrics,
            statistics: this.getStatistics(),
            exportTime: Date.now(),
            userAgent: navigator.userAgent
        };
    }

    // 🚨 Détecter les problèmes de performance
    detectIssues() {
        const stats = this.getStatistics();
        const issues = [];
        
        // Vérifier le temps de rendu
        if (stats.renderTime.latest > 16.67) { // Plus de 1 frame à 60fps
            issues.push({
                type: 'performance',
                severity: 'warning',
                message: `Temps de rendu élevé: ${stats.renderTime.latest.toFixed(2)}ms`,
                value: stats.renderTime.latest
            });
        }
        
        // Vérifier la mémoire
        const memoryMB = stats.memory.latest / 1024 / 1024;
        if (memoryMB > 100) { // Plus de 100MB
            issues.push({
                type: 'memory',
                severity: memoryMB > 200 ? 'error' : 'warning',
                message: `Utilisation mémoire élevée: ${memoryMB.toFixed(1)}MB`,
                value: memoryMB
            });
        }
        
        // Vérifier le FPS
        if (stats.fps.latest < 30) {
            issues.push({
                type: 'fps',
                severity: 'error',
                message: `FPS faible: ${stats.fps.latest}`,
                value: stats.fps.latest
            });
        }
        
        return issues;
    }

    // 🎯 Hook React pour l'intégration facile
    usePerformanceMonitoring(componentName) {
        const startTimeRef = React.useRef(performance.now());
        
        React.useEffect(() => {
            this.init();
            
            const renderTime = this.measureRender(componentName, startTimeRef.current);
            
            // Log en mode développement
            if (process.env.NODE_ENV === 'development') {
                console.log(`⏱️ ${componentName} rendu en ${renderTime.toFixed(2)}ms`);
            }
            
            return () => {
                // Nettoyage si nécessaire
            };
        });
        
        return {
            getMetrics: () => this.getCurrentMetrics(),
            getStatistics: () => this.getStatistics(),
            detectIssues: () => this.detectIssues(),
            exportData: () => this.exportData(),
            clear: () => this.clear()
        };
    }
}

// 📦 Instance singleton pour l'utilisation globale
const performanceMonitor = new PerformanceMonitor();

// 🔗 Hook React pour l'intégration facile
const usePerformanceMonitor = (componentName) => {
    return performanceMonitor.usePerformanceMonitoring(componentName);
};

// 📤 Export de l'instance singleton et du hook
export { performanceMonitor, usePerformanceMonitor };
export default performanceMonitor;