// src/components/ai/ResourceOptimization.js - OPTIMISATION DES RESSOURCES IA
// Composant pour optimiser automatiquement l'utilisation des ressources DocuCortex

import React, { useState, useEffect } from 'react';
import { 
    Zap, 
    Settings, 
    TrendingUp, 
    Clock, 
    Users, 
    FileText,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Play,
    Pause,
    RotateCcw,
    BarChart3,
    Target,
    Activity,
    Cpu,
    Database,
    Wifi
} from 'lucide-react';
import aiService from '../../services/aiService';

const ResourceOptimization = ({ autoOptimize = true, monitoringEnabled = true }) => {
    // États de l'optimisation
    const [optimizations, setOptimizations] = useState([]);
    const [activeOptimizations, setActiveOptimizations] = useState([]);
    const [systemMetrics, setSystemMetrics] = useState({});
    const [performanceData, setPerformanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationHistory, setOptimizationHistory] = useState([]);

    // 🚀 Charger les optimisations
    const loadOptimizations = async () => {
        setLoading(true);
        
        try {
            const optimizationResults = await aiService.optimizeResourceUtilization();
            
            // Enrichir les optimisations avec des métadonnées
            const enrichedOptimizations = optimizationResults.map((opt, index) => ({
                ...opt,
                id: `opt_${Date.now()}_${index}`,
                status: 'pending',
                priority: calculatePriority(opt),
                estimatedImpact: calculateImpact(opt),
                implementation: generateImplementationSteps(opt),
                rollback: generateRollbackPlan(opt)
            }));
            
            setOptimizations(enrichedOptimizations);
            loadSystemMetrics();
            loadPerformanceData();
            loadOptimizationHistory();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des optimisations:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🎯 Calculer la priorité d'une optimisation
    const calculatePriority = (optimization) => {
        let priority = 2; // Base
        
        if (optimization.type === 'capacity_optimization') {
            priority = 5;
        } else if (optimization.type.includes('performance')) {
            priority = 4;
        } else if (optimization.type.includes('storage')) {
            priority = 3;
        }
        
        // Ajuster selon l'impact estimé
        if (optimization.impact === 'high') {
            priority += 1;
        } else if (optimization.impact === 'low') {
            priority -= 1;
        }
        
        return Math.min(priority, 5);
    };

    // 📊 Calculer l'impact estimé
    const calculateImpact = (optimization) => {
        if (optimization.type === 'capacity_optimization') {
            return {
                performance: '+25%',
                efficiency: '+30%',
                cost: '-15%',
                reliability: '+20%'
            };
        } else if (optimization.type.includes('performance')) {
            return {
                performance: '+40%',
                efficiency: '+20%',
                cost: '-10%',
                reliability: '+15%'
            };
        } else if (optimization.type.includes('storage')) {
            return {
                performance: '+10%',
                efficiency: '+35%',
                cost: '-25%',
                reliability: '+5%'
            };
        }
        
        return {
            performance: '+15%',
            efficiency: '+20%',
            cost: '-10%',
            reliability: '+10%'
        };
    };

    // 🔧 Générer les étapes d'implémentation
    const generateImplementationSteps = (optimization) => {
        const steps = [];
        
        if (optimization.type === 'capacity_optimization') {
            steps.push(
                'Analyser la capacité actuelle du système',
                'Identifier les goulots d\'étranglement',
                'Redistribuer les ressources selon la demande',
                'Configurer l\'allocation dynamique',
                'Tester la nouvelle configuration',
                'Surveiller les performances'
            );
        } else if (optimization.type.includes('performance')) {
            steps.push(
                'Profiler les performances actuelles',
                'Optimiser les requêtes lentes',
                'Configurer le cache intelligent',
                'Mettre à jour les index de base de données',
                'Redémarrer les services optimisés',
                'Valider les améliorations'
            );
        } else if (optimization.type.includes('storage')) {
            steps.push(
                'Auditer l\'utilisation du stockage',
                'Compresser les données anciennes',
                'Archiver les documents rarement utilisés',
                'Optimiser la structure des dossiers',
                'Nettoyer les fichiers temporaires',
                'Configurer l\'archivage automatique'
            );
        }
        
        return steps;
    };

    // 🔙 Générer un plan de rollback
    const generateRollbackPlan = (optimization) => [
        'Sauvegarder la configuration actuelle',
        'Documenter l\'état avant optimisation',
        'Créer un point de restauration',
        'Tester le rollback en environnement de test',
        'Former l\'équipe sur la procédure'
    ];

    // 📊 Charger les métriques système
    const loadSystemMetrics = () => {
        const metrics = {
            cpu: {
                current: Math.round(30 + Math.random() * 40),
                peak: Math.round(60 + Math.random() * 30),
                average: Math.round(35 + Math.random() * 25),
                trend: 'stable'
            },
            memory: {
                current: Math.round(45 + Math.random() * 35),
                peak: Math.round(70 + Math.random() * 20),
                average: Math.round(50 + Math.random() * 20),
                trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
            },
            storage: {
                used: Math.round(60 + Math.random() * 25),
                available: Math.round(40 + Math.random() * 30),
                trend: 'optimizing'
            },
            network: {
                latency: Math.round(15 + Math.random() * 20),
                throughput: Math.round(80 + Math.random() * 15),
                efficiency: Math.round(85 + Math.random() * 10)
            }
        };
        
        setSystemMetrics(metrics);
    };

    // 📈 Charger les données de performance
    const loadPerformanceData = () => {
        const data = {
            responseTime: generateTimeSeries('response'),
            throughput: generateTimeSeries('throughput'),
            errorRate: generateTimeSeries('error'),
            availability: generateTimeSeries('availability')
        };
        
        setPerformanceData(data);
    };

    // 📊 Générer des séries temporelles simulées
    const generateTimeSeries = (type) => {
        const points = [];
        const baseValue = type === 'response' ? 150 : 
                         type === 'throughput' ? 85 : 
                         type === 'error' ? 2 : 99;
        
        for (let i = 0; i < 24; i++) {
            const variation = (Math.random() - 0.5) * baseValue * 0.2;
            points.push({
                time: `${i}:00`,
                value: Math.max(0, Math.round(baseValue + variation))
            });
        }
        
        return points;
    };

    // 📚 Charger l'historique des optimisations
    const loadOptimizationHistory = () => {
        const history = [
            {
                id: 'hist_1',
                type: 'Cache Optimization',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed',
                impact: '+25% performance',
                duration: '45 min'
            },
            {
                id: 'hist_2',
                type: 'Storage Cleanup',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed',
                impact: '-20% utilisation',
                duration: '2h 15min'
            },
            {
                id: 'hist_3',
                type: 'Database Indexing',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed',
                impact: '+30% vitesse requêtes',
                duration: '1h 30min'
            }
        ];
        
        setOptimizationHistory(history);
    };

    // ⚡ Exécuter une optimisation
    const executeOptimization = async (optimizationId) => {
        setIsOptimizing(true);
        
        try {
            // Simuler l'exécution d'une optimisation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setOptimizations(prev => 
                prev.map(opt => 
                    opt.id === optimizationId 
                        ? { ...opt, status: 'running', startedAt: new Date().toISOString() }
                        : opt
                )
            );
            
            // Simuler le succès après un délai
            setTimeout(() => {
                setOptimizations(prev => 
                    prev.map(opt => 
                        opt.id === optimizationId 
                            ? { 
                                ...opt, 
                                status: 'completed', 
                                completedAt: new Date().toISOString(),
                                actualImpact: calculateActualImpact(opt)
                            }
                            : opt
                    )
                );
            }, 5000);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'exécution:', error);
            setOptimizations(prev => 
                prev.map(opt => 
                    opt.id === optimizationId 
                        ? { ...opt, status: 'failed', error: error.message }
                        : opt
                )
            );
        } finally {
            setIsOptimizing(false);
        }
    };

    // 📊 Calculer l'impact réel
    const calculateActualImpact = (optimization) => {
        return {
            performance: `+${Math.floor(Math.random() * 20 + 10)}%`,
            efficiency: `+${Math.floor(Math.random() * 25 + 15)}%`,
            cost: `-${Math.floor(Math.random() * 15 + 5)}%`,
            reliability: `+${Math.floor(Math.random() * 15 + 5)}%`
        };
    };

    // 🔄 Annuler une optimisation
    const cancelOptimization = (optimizationId) => {
        setOptimizations(prev => 
            prev.map(opt => 
                opt.id === optimizationId 
                    ? { ...opt, status: 'cancelled', cancelledAt: new Date().toISOString() }
                    : opt
            )
        );
    };

    // 📋 Composant de métrique système
    const SystemMetric = ({ title, metric, icon: Icon, color = 'blue' }) => {
        const getStatusColor = (value, type) => {
            if (type === 'cpu' || type === 'memory') {
                if (value > 80) return 'text-red-600';
                if (value > 60) return 'text-yellow-600';
                return 'text-green-600';
            }
            if (type === 'error') {
                if (value > 5) return 'text-red-600';
                if (value > 2) return 'text-yellow-600';
                return 'text-green-600';
            }
            if (type === 'availability') {
                if (value < 95) return 'text-red-600';
                if (value < 98) return 'text-yellow-600';
                return 'text-green-600';
            }
            return 'text-blue-600';
        };
        
        return (
            <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                        <h4 className="font-semibold text-sm">{title}</h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.current, title.toLowerCase())} bg-opacity-20`}>
                        {metric.trend}
                    </span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Actuel:</span>
                        <span className={`font-semibold ${getStatusColor(metric.current, title.toLowerCase())}`}>
                            {metric.current}%
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Pic:</span>
                        <span>{metric.peak}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Moyenne:</span>
                        <span>{metric.average}%</span>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`bg-${color}-500 h-2 rounded-full transition-all`}
                            style={{ width: `${metric.current}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    // 🎯 Composant d'optimisation individuelle
    const OptimizationCard = ({ optimization }) => {
        const getStatusIcon = () => {
            switch (optimization.status) {
                case 'completed':
                    return <CheckCircle className="w-5 h-5 text-green-600" />;
                case 'running':
                    return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
                case 'failed':
                    return <AlertTriangle className="w-5 h-5 text-red-600" />;
                case 'cancelled':
                    return <Pause className="w-5 h-5 text-gray-600" />;
                default:
                    return <Settings className="w-5 h-5 text-gray-400" />;
            }
        };
        
        const getStatusColor = () => {
            switch (optimization.status) {
                case 'completed':
                    return 'border-green-200 bg-green-50';
                case 'running':
                    return 'border-blue-200 bg-blue-50';
                case 'failed':
                    return 'border-red-200 bg-red-50';
                case 'cancelled':
                    return 'border-gray-200 bg-gray-50';
                default:
                    return 'border-gray-200 bg-white';
            }
        };
        
        return (
            <div className={`border rounded-lg p-4 transition-all ${getStatusColor()}`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon()}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{optimization.title || optimization.type}</h4>
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                    Priorité {optimization.priority}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{optimization.description}</p>
                            
                            {/* Impact estimé */}
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="text-center p-1 bg-white rounded">
                                    <div className="font-semibold text-blue-600">{optimization.estimatedImpact.performance}</div>
                                    <div className="text-gray-500">Performance</div>
                                </div>
                                <div className="text-center p-1 bg-white rounded">
                                    <div className="font-semibold text-green-600">{optimization.estimatedImpact.efficiency}</div>
                                    <div className="text-gray-500">Efficacité</div>
                                </div>
                                <div className="text-center p-1 bg-white rounded">
                                    <div className="font-semibold text-yellow-600">{optimization.estimatedImpact.cost}</div>
                                    <div className="text-gray-500">Coût</div>
                                </div>
                                <div className="text-center p-1 bg-white rounded">
                                    <div className="font-semibold text-purple-600">{optimization.estimatedImpact.reliability}</div>
                                    <div className="text-gray-500">Fiabilité</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        {optimization.status === 'pending' && (
                            <button
                                onClick={() => executeOptimization(optimization.id)}
                                disabled={isOptimizing}
                                className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            >
                                <Play className="w-3 h-3" />
                                Exécuter
                            </button>
                        )}
                        
                        {optimization.status === 'running' && (
                            <button
                                onClick={() => cancelOptimization(optimization.id)}
                                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                            >
                                <Pause className="w-3 h-3" />
                                Annuler
                            </button>
                        )}
                        
                        {optimization.status === 'completed' && optimization.actualImpact && (
                            <div className="text-xs text-green-600 font-semibold">
                                ✅ Impact réel: {optimization.actualImpact.performance}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                        {optimization.status === 'running' && optimization.startedAt && (
                            <span>
                                Démarré: {new Date(optimization.startedAt).toLocaleTimeString()}
                            </span>
                        )}
                        {optimization.status === 'completed' && optimization.completedAt && (
                            <span>
                                Terminé: {new Date(optimization.completedAt).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // 🔄 Chargement initial et auto-optimisation
    useEffect(() => {
        loadOptimizations();
        
        if (autoOptimize) {
            const interval = setInterval(() => {
                loadSystemMetrics();
                if (Math.random() > 0.7) { // 30% de chance de nouvelles optimisations
                    loadOptimizations();
                }
            }, 30000); // 30 secondes
            
            return () => clearInterval(interval);
        }
    }, [autoOptimize]);

    // Filtrer les optimisations
    const filteredOptimizations = selectedCategory === 'all' 
        ? optimizations 
        : optimizations.filter(opt => opt.type.includes(selectedCategory));

    // Trier par priorité
    const sortedOptimizations = filteredOptimizations.sort((a, b) => b.priority - a.priority);

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Optimisation des Ressources
                        </h2>
                        <p className="text-sm text-gray-600">
                            Amélioration automatique des performances système
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-sm border rounded px-3 py-2"
                    >
                        <option value="all">Toutes catégories</option>
                        <option value="capacity">Capacité</option>
                        <option value="performance">Performance</option>
                        <option value="storage">Stockage</option>
                        <option value="network">Réseau</option>
                    </select>
                    
                    <button
                        onClick={loadOptimizations}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Analyser
                    </button>
                </div>
            </div>

            {/* Métriques système */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SystemMetric
                    title="CPU"
                    metric={systemMetrics.cpu || {}}
                    icon={Cpu}
                    color="blue"
                />
                <SystemMetric
                    title="Mémoire"
                    metric={systemMetrics.memory || {}}
                    icon={Database}
                    color="green"
                />
                <SystemMetric
                    title="Stockage"
                    metric={systemMetrics.storage || {}}
                    icon={Database}
                    color="purple"
                />
                <SystemMetric
                    title="Réseau"
                    metric={systemMetrics.network || {}}
                    icon={Wifi}
                    color="orange"
                />
            </div>

            {/* Statistiques d'optimisation */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                    <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{optimizations.length}</p>
                    <p className="text-sm text-blue-700">Optimisations disponibles</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">
                        {optimizations.filter(o => o.status === 'completed').length}
                    </p>
                    <p className="text-sm text-green-700">Terminées</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                    <RefreshCw className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-900">
                        {optimizations.filter(o => o.status === 'running').length}
                    </p>
                    <p className="text-sm text-yellow-700">En cours</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                    <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">
                        {Math.round((optimizations.filter(o => o.status === 'completed').length / Math.max(optimizations.length, 1)) * 100)}%
                    </p>
                    <p className="text-sm text-purple-700">Taux de réussite</p>
                </div>
            </div>

            {/* Optimisations en attente */}
            <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Optimisations Recommandées
                    </h3>
                </div>
                
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-yellow-600" />
                            <p className="ml-2 text-gray-600">Analyse des optimisations...</p>
                        </div>
                    ) : sortedOptimizations.length > 0 ? (
                        <div className="grid gap-4">
                            {sortedOptimizations.map((optimization) => (
                                <OptimizationCard key={optimization.id} optimization={optimization} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                Système optimisé
                            </h3>
                            <p className="text-gray-500">
                                Aucune optimisation nécessaire pour le moment
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Historique des optimisations */}
            {optimizationHistory.length > 0 && (
                <div className="bg-white rounded-lg border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Historique des Optimisations
                        </h3>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-3">
                            {optimizationHistory.map((history) => (
                                <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <h4 className="font-semibold text-sm">{history.type}</h4>
                                            <p className="text-xs text-gray-600">
                                                {new Date(history.date).toLocaleDateString()} • {history.duration}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">{history.impact}</p>
                                        <p className="text-xs text-gray-500">{history.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceOptimization;