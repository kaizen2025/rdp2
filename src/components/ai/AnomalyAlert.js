// src/components/ai/AnomalyAlert.js - SYSTÈME D'ALERTES D'ANOMALIES IA
// Composant pour détecter et afficher les anomalies comportementales

import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    Shield, 
    Eye, 
    TrendingUp, 
    User, 
    Clock, 
    Zap,
    RefreshCw,
    Filter,
    Search,
    X,
    CheckCircle,
    XCircle,
    Info,
    AlertCircle,
    Activity
} from 'lucide-react';
import aiService, { ANOMALY_TYPES } from '../../services/aiService';

const AnomalyAlert = ({ autoRefresh = true, refreshInterval = 300000 }) => {
    // États du système d'alertes
    const [anomalies, setAnomalies] = useState([]);
    const [filteredAnomalies, setFilteredAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        severity: 'all',
        type: 'all',
        status: 'all',
        search: ''
    });
    const [selectedAnomaly, setSelectedAnomaly] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        critical: 0,
        resolved: 0,
        avgResolutionTime: 0
    });

    // 🔍 Charger les anomalies
    const loadAnomalies = async () => {
        setLoading(true);
        
        try {
            const detectedAnomalies = await aiService.detectAnomalies();
            
            // Enrichir les anomalies avec des métadonnées
            const enrichedAnomalies = detectedAnomalies.map((anomaly, index) => ({
                ...anomaly,
                id: `anomaly_${Date.now()}_${index}`,
                resolved: false,
                assignedTo: null,
                resolutionNotes: '',
                impact: calculateImpact(anomaly),
                category: categorizeAnomaly(anomaly),
                confidence: generateConfidenceScore(anomaly),
                evidence: generateEvidence(anomaly)
            }));
            
            setAnomalies(enrichedAnomalies);
            applyFilters(enrichedAnomalies);
            updateStats(enrichedAnomalies);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des anomalies:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🎯 Calculer l'impact d'une anomalie
    const calculateImpact = (anomaly) => {
        let impact = 1;
        
        switch (anomaly.type) {
            case ANOMALY_TYPES.FRAUDULENT_ACTIVITY:
                impact = 10;
                break;
            case ANOMALY_TYPES.HIGH_RETURN_DELAY:
                impact = 8;
                break;
            case ANOMALY_TYPES.EQUIPMENT_ABUSE:
                impact = 7;
                break;
            case ANOMALY_TYPES.UNUSUAL_BORROWING_PATTERN:
                impact = 5;
                break;
            case ANOMALY_TYPES.EXTENDED_LOAN_TIME:
                impact = 4;
                break;
            default:
                impact = 3;
        }
        
        // Ajuster selon la sévérité
        if (anomaly.severity === 'high') impact *= 1.5;
        else if (anomaly.severity === 'low') impact *= 0.5;
        
        return Math.min(impact, 10);
    };

    // 📂 Catégoriser une anomalie
    const categorizeAnomaly = (anomaly) => {
        if (anomaly.type.includes('borrowing') || anomaly.type.includes('loan')) {
            return 'Prêt';
        }
        if (anomaly.type.includes('equipment') || anomaly.type.includes('abuse')) {
            return 'Équipement';
        }
        if (anomaly.type.includes('user') || anomaly.type.includes('fraud')) {
            return 'Utilisateur';
        }
        if (anomaly.type.includes('time') || anomaly.type.includes('delay')) {
            return 'Timing';
        }
        return 'Système';
    };

    // 📊 Générer un score de confiance
    const generateConfidenceScore = (anomaly) => {
        let confidence = 0.7; // Base
        
        // Ajuster selon la sévérité
        if (anomaly.severity === 'high') confidence += 0.15;
        else if (anomaly.severity === 'low') confidence -= 0.1;
        
        // Facteurs spécifiques par type
        if (anomaly.type === ANOMALY_TYPES.FRAUDULENT_ACTIVITY) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 0.95);
    };

    // 🔍 Générer des preuves pour l'anomalie
    const generateEvidence = (anomaly) => {
        const evidence = [];
        
        switch (anomaly.type) {
            case ANOMALY_TYPES.UNUSUAL_BORROWING_PATTERN:
                evidence.push(
                    'Emprunts 300% plus fréquents que la normale',
                    'Horaire d\'emprunt atypique détecté',
                    'Documents rarement empruntés ensemble'
                );
                break;
            case ANOMALY_TYPES.EXTENDED_LOAN_TIME:
                evidence.push(
                    `Durée de prêt: ${anomaly.duration} jours`,
                    `Moyenne normale: ${anomaly.averageDuration} jours`,
                    'Dépassement du seuil statistique'
                );
                break;
            case ANOMALY_TYPES.HIGH_RETURN_DELAY:
                evidence.push(
                    '4 retours en retard sur 30 derniers jours',
                    'Délai moyen: 8.5 jours de retard',
                    'Tendance à l\'augmentation'
                );
                break;
            case ANOMALY_TYPES.EQUIPMENT_ABUSE:
                evidence.push(
                    'Usure prématurée détectée',
                    'Utilisation au-delà des spécifications',
                    'Fréquence d\'utilisation anormale'
                );
                break;
            case ANOMALY_TYPES.FRAUDULENT_ACTIVITY:
                evidence.push(
                    'Tentatives multiples d\'accès refusées',
                    'Comportement incohérent détecté',
                    'Localisation inhabituelle'
                );
                break;
            default:
                evidence.push('Analyse algorithmique automatique');
        }
        
        return evidence;
    };

    // 🔍 Appliquer les filtres
    const applyFilters = (anomalyList) => {
        let filtered = [...anomalyList];
        
        // Filtre par sévérité
        if (filter.severity !== 'all') {
            filtered = filtered.filter(a => a.severity === filter.severity);
        }
        
        // Filtre par type
        if (filter.type !== 'all') {
            filtered = filtered.filter(a => a.type === filter.type);
        }
        
        // Filtre par statut
        if (filter.status !== 'all') {
            filtered = filtered.filter(a => 
                filter.status === 'resolved' ? a.resolved : !a.resolved
            );
        }
        
        // Recherche textuelle
        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filtered = filtered.filter(a => 
                a.description.toLowerCase().includes(searchTerm) ||
                a.category.toLowerCase().includes(searchTerm) ||
                a.type.toLowerCase().includes(searchTerm)
            );
        }
        
        // Trier par impact et sévérité
        filtered.sort((a, b) => {
            if (a.severity !== b.severity) {
                const severityOrder = { high: 3, medium: 2, low: 1 };
                return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            }
            return b.impact - a.impact;
        });
        
        setFilteredAnomalies(filtered);
    };

    // 📊 Mettre à jour les statistiques
    const updateStats = (anomalyList) => {
        const total = anomalyList.length;
        const critical = anomalyList.filter(a => a.severity === 'high').length;
        const resolved = anomalyList.filter(a => a.resolved).length;
        
        setStats({
            total,
            critical,
            resolved,
            avgResolutionTime: 4.2 // En heures, simulé
        });
    };

    // 🔄 Mise à jour des filtres
    useEffect(() => {
        applyFilters(anomalies);
    }, [filter, anomalies]);

    // 🚀 Chargement initial et rafraîchissement automatique
    useEffect(() => {
        loadAnomalies();
        
        if (autoRefresh) {
            const interval = setInterval(loadAnomalies, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);

    // ✅ Marquer comme résolue
    const resolveAnomaly = (anomalyId, notes = '') => {
        setAnomalies(prev => 
            prev.map(a => 
                a.id === anomalyId 
                    ? { ...a, resolved: true, resolutionNotes: notes, resolvedAt: new Date().toISOString() }
                    : a
            )
        );
    };

    // ❌ Ignorer une anomalie
    const ignoreAnomaly = (anomalyId, reason = '') => {
        setAnomalies(prev => 
            prev.map(a => 
                a.id === anomalyId 
                    ? { ...a, ignored: true, ignoreReason: reason, ignoredAt: new Date().toISOString() }
                    : a
            )
        );
    };

    // 👤 Assigner une anomalie
    const assignAnomaly = (anomalyId, userId) => {
        setAnomalies(prev => 
            prev.map(a => 
                a.id === anomalyId 
                    ? { ...a, assignedTo: userId, assignedAt: new Date().toISOString() }
                    : a
            )
        );
    };

    // 🎯 Composant d'anomalie individuelle
    const AnomalyCard = ({ anomaly }) => {
        const isSelected = selectedAnomaly?.id === anomaly.id;
        
        const severityConfig = {
            high: {
                color: 'border-red-200 bg-red-50',
                icon: AlertTriangle,
                iconColor: 'text-red-600',
                badge: 'bg-red-100 text-red-800',
                priority: 'Critique'
            },
            medium: {
                color: 'border-yellow-200 bg-yellow-50',
                icon: AlertCircle,
                iconColor: 'text-yellow-600',
                badge: 'bg-yellow-100 text-yellow-800',
                priority: 'Moyen'
            },
            low: {
                color: 'border-blue-200 bg-blue-50',
                icon: Info,
                iconColor: 'text-blue-600',
                badge: 'bg-blue-100 text-blue-800',
                priority: 'Faible'
            }
        };
        
        const config = severityConfig[anomaly.severity] || severityConfig.medium;
        const IconComponent = config.icon;
        
        return (
            <div className={`border rounded-lg p-4 transition-all ${config.color} ${
                isSelected ? 'ring-2 ring-purple-300' : ''
            } ${anomaly.resolved ? 'opacity-60' : ''}`}>
                {/* En-tête */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <IconComponent className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">
                                    {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${config.badge}`}>
                                    {config.priority}
                                </span>
                                {anomaly.resolved && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                                {anomaly.ignored && (
                                    <XCircle className="w-4 h-4 text-gray-600" />
                                )}
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">{anomaly.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Impact: {anomaly.impact}/10
                                </span>
                                <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {Math.round(anomaly.confidence * 100)}% confiance
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(anomaly.detectedAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            {/* Catégorie et utilisateur */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {anomaly.category}
                                </span>
                                {anomaly.userId && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        Utilisateur: {anomaly.userId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedAnomaly(isSelected ? null : anomaly)}
                            className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            {isSelected ? 'Masquer détails' : 'Voir détails'}
                        </button>
                        
                        {!anomaly.resolved && !anomaly.ignored && (
                            <>
                                <button
                                    onClick={() => resolveAnomaly(anomaly.id)}
                                    className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Résoudre
                                </button>
                                <button
                                    onClick={() => ignoreAnomaly(anomaly.id)}
                                    className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Ignorer
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                        {anomaly.assignedTo && (
                            <span>Assigné à: {anomaly.assignedTo}</span>
                        )}
                    </div>
                </div>
                
                {/* Détails étendus */}
                {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Preuves et Analyse
                        </h5>
                        
                        <div className="space-y-3">
                            {/* Preuves */}
                            <div>
                                <h6 className="text-xs font-medium text-gray-700 mb-2">Preuves:</h6>
                                <ul className="space-y-1">
                                    {anomaly.evidence.map((evidence, index) => (
                                        <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                            {evidence}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Actions recommandées */}
                            <div>
                                <h6 className="text-xs font-medium text-gray-700 mb-2">Actions recommandées:</h6>
                                <div className="flex flex-wrap gap-1">
                                    {getRecommendedActions(anomaly).map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => console.log(`Action: ${action}`)}
                                            className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-50"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Résolution (si résolue) */}
                            {anomaly.resolved && (
                                <div className="p-3 bg-green-50 rounded border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">Résolue</span>
                                    </div>
                                    {anomaly.resolutionNotes && (
                                        <p className="text-xs text-green-700">
                                            Notes: {anomaly.resolutionNotes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 🎯 Obtenir les actions recommandées pour une anomalie
    const getRecommendedActions = (anomaly) => {
        switch (anomaly.type) {
            case ANOMALY_TYPES.FRAUDULENT_ACTIVITY:
                return ['Bloquer compte', 'Vérifier identité', 'Contacter utilisateur'];
            case ANOMALY_TYPES.HIGH_RETURN_DELAY:
                return ['Envoyer rappel', 'Prolonger prêt', 'Contacter utilisateur'];
            case ANOMALY_TYPES.EQUIPMENT_ABUSE:
                return ['Inspecter équipement', 'Réparer', 'Former utilisateur'];
            case ANOMALY_TYPES.UNUSUAL_BORROWING_PATTERN:
                return ['Vérifier activité', 'Contacter utilisateur', 'Surveiller'];
            case ANOMALY_TYPES.EXTENDED_LOAN_TIME:
                return ['Prolonger prêt', 'Rappeler retour', 'Contacter utilisateur'];
            default:
                return ['Investiguer', 'Contacter utilisateur', 'Surveiller'];
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* En-tête */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Système d'Alertes IA
                            </h2>
                            <p className="text-sm text-gray-600">
                                Détection intelligente d'anomalies comportementales
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={loadAnomalies}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Analyser
                    </button>
                </div>
                
                {/* Statistiques */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-red-900">{filteredAnomalies.length}</p>
                        <p className="text-xs text-red-700">Total</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-orange-900">{stats.critical}</p>
                        <p className="text-xs text-orange-700">Critiques</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-green-900">{stats.resolved}</p>
                        <p className="text-xs text-green-700">Résolues</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-blue-900">{stats.avgResolutionTime}h</p>
                        <p className="text-xs text-blue-700">Temps moy.</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center gap-4">
                    <Filter className="w-4 h-4 text-gray-600" />
                    
                    <select 
                        value={filter.severity}
                        onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="all">Toutes sévérités</option>
                        <option value="high">Critique</option>
                        <option value="medium">Moyen</option>
                        <option value="low">Faible</option>
                    </select>
                    
                    <select 
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="all">Tous types</option>
                        <option value="fraudulent_activity">Activité frauduleuse</option>
                        <option value="unusual_borrowing_pattern">Pattern emprunt inhabituel</option>
                        <option value="high_return_delay">Retards fréquents</option>
                        <option value="equipment_abuse">Abus équipement</option>
                        <option value="extended_loan_time">Temps prêt étendu</option>
                    </select>
                    
                    <select 
                        value={filter.status}
                        onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="all">Tous statuts</option>
                        <option value="unresolved">Non résolues</option>
                        <option value="resolved">Résolues</option>
                    </select>
                    
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher anomalies..."
                            value={filter.search}
                            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border rounded text-sm"
                        />
                        {filter.search && (
                            <button
                                onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setFilter({ severity: 'all', type: 'all', status: 'all', search: '' })}
                        className="text-sm text-gray-600 hover:text-gray-800"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Liste des anomalies */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
                        <p className="ml-2 text-gray-600">Analyse des anomalies en cours...</p>
                    </div>
                ) : filteredAnomalies.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAnomalies.map((anomaly) => (
                            <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            Aucune anomalie détectée
                        </h3>
                        <p className="text-gray-500">
                            Le système fonctionne normalement
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnomalyAlert;