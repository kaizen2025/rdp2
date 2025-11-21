// src/components/ai/RecommendationsPanel.js - PANNEAU DE RECOMMANDATIONS IA
// Interface pour afficher et gérer les recommandations intelligentes

import React, { useState, useEffect } from 'react';
import { 
    Target, 
    Lightbulb, 
    CheckCircle, 
    XCircle, 
    Clock, 
    TrendingUp, 
    Star,
    Filter,
    RefreshCw,
    ArrowRight,
    ThumbsUp,
    ThumbsDown,
    BookmarkPlus,
    Settings
} from 'lucide-react';
import aiService from '../../services/aiService';

const RecommendationsPanel = ({ userId = null, maxRecommendations = 20 }) => {
    // États du panneau
    const [recommendations, setRecommendations] = useState([]);
    const [filteredRecommendations, setFilteredRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        priority: 'all',
        type: 'all',
        status: 'all',
        sortBy: 'priority'
    });
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [feedback, setFeedback] = useState({});

    // 🎯 Charger les recommandations
    const loadRecommendations = async () => {
        setLoading(true);
        
        try {
            const recs = await aiService.generatePersonalizedRecommendations(userId);
            
            // Ajouter des métadonnées supplémentaires
            const enrichedRecs = recs.map((rec, index) => ({
                ...rec,
                id: `rec_${Date.now()}_${index}`,
                createdAt: new Date().toISOString(),
                status: 'new',
                impact: rec.impact || 'medium',
                confidence: rec.confidence || 0.7,
                tags: generateTags(rec),
                actionItems: generateActionItems(rec)
            }));
            
            setRecommendations(enrichedRecs);
            applyFilters(enrichedRecs);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des recommandations:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🏷️ Générer des tags pour les recommandations
    const generateTags = (recommendation) => {
        const tags = [];
        
        if (recommendation.type === 'equipment_suggestion') {
            tags.push('Équipement', 'Suggestion');
        } else if (recommendation.type === 'maintenance_schedule') {
            tags.push('Maintenance', 'Planification');
        } else if (recommendation.type === 'capacity_optimization') {
            tags.push('Optimisation', 'Ressources');
        } else if (recommendation.type === 'loan_policy_update') {
            tags.push('Politique', 'Gestion');
        }
        
        if (recommendation.confidence > 0.8) {
            tags.push('Haute confiance');
        }
        
        if (recommendation.impact === 'high') {
            tags.push('Impact élevé');
        }
        
        return tags;
    };

    // ✅ Générer des actions pour les recommandations
    const generateActionItems = (recommendation) => {
        const actions = [];
        
        if (recommendation.type === 'equipment_suggestion') {
            actions.push(
                { label: 'Voir détails', action: 'view_details' },
                { label: 'Ajouter aux favoris', action: 'bookmark' },
                { label: 'Configurer alerte', action: 'set_alert' }
            );
        } else if (recommendation.type === 'maintenance_schedule') {
            actions.push(
                { label: 'Planifier', action: 'schedule' },
                { label: 'Reporter', action: 'postpone' },
                { label: 'Ignorer', action: 'dismiss' }
            );
        } else if (recommendation.type === 'capacity_optimization') {
            actions.push(
                { label: 'Appliquer', action: 'apply' },
                { label: 'Tester', action: 'test' },
                { label: 'Plus d\'info', action: 'learn_more' }
            );
        }
        
        return actions;
    };

    // 🔍 Appliquer les filtres
    const applyFilters = (recs) => {
        let filtered = [...recs];
        
        // Filtre par priorité
        if (filter.priority !== 'all') {
            filtered = filtered.filter(rec => rec.priority === filter.priority);
        }
        
        // Filtre par type
        if (filter.type !== 'all') {
            filtered = filtered.filter(rec => rec.type === filter.type);
        }
        
        // Filtre par statut
        if (filter.status !== 'all') {
            filtered = filtered.filter(rec => rec.status === filter.status);
        }
        
        // Tri
        filtered.sort((a, b) => {
            switch (filter.sortBy) {
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                case 'confidence':
                    return (b.confidence || 0) - (a.confidence || 0);
                case 'date':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'impact':
                    const impactOrder = { high: 3, medium: 2, low: 1 };
                    return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
                default:
                    return 0;
            }
        });
        
        setFilteredRecommendations(filtered.slice(0, maxRecommendations));
    };

    // 📊 Mise à jour des filtres
    useEffect(() => {
        applyFilters(recommendations);
    }, [filter, recommendations, maxRecommendations]);

    // 🚀 Chargement initial
    useEffect(() => {
        loadRecommendations();
    }, [userId]);

    // 👍 Donner un feedback
    const giveFeedback = (recommendationId, isPositive) => {
        setFeedback(prev => ({
            ...prev,
            [recommendationId]: isPositive ? 'positive' : 'negative'
        }));
        
        // Ici, on pourrait envoyer le feedback au service IA pour améliorer les recommandations
        console.log(`Feedback donné pour ${recommendationId}: ${isPositive ? 'positif' : 'négatif'}`);
    };

    // ✅ Marquer comme lu
    const markAsRead = (recommendationId) => {
        setRecommendations(prev => 
            prev.map(rec => 
                rec.id === recommendationId 
                    ? { ...rec, status: 'read' }
                    : rec
            )
        );
    };

    // ❌ Ignorer une recommandation
    const dismissRecommendation = (recommendationId) => {
        setRecommendations(prev => 
            prev.map(rec => 
                rec.id === recommendationId 
                    ? { ...rec, status: 'dismissed' }
                    : rec
            )
        );
    };

    // ⭐ Sauvegarder une recommandation
    const bookmarkRecommendation = (recommendationId) => {
        setRecommendations(prev => 
            prev.map(rec => 
                rec.id === recommendationId 
                    ? { ...rec, status: 'bookmarked' }
                    : rec
            )
        );
    };

    // 🎯 Composant de recommandation individuelle
    const RecommendationCard = ({ recommendation }) => {
        const isSelected = selectedRecommendation?.id === recommendation.id;
        const userFeedback = feedback[recommendation.id];
        
        const priorityConfig = {
            high: { 
                color: 'border-red-200 bg-red-50', 
                icon: TrendingUp, 
                iconColor: 'text-red-600',
                badge: 'bg-red-100 text-red-800'
            },
            medium: { 
                color: 'border-yellow-200 bg-yellow-50', 
                icon: Target, 
                iconColor: 'text-yellow-600',
                badge: 'bg-yellow-100 text-yellow-800'
            },
            low: { 
                color: 'border-blue-200 bg-blue-50', 
                icon: Lightbulb, 
                iconColor: 'text-blue-600',
                badge: 'bg-blue-100 text-blue-800'
            }
        };
        
        const config = priorityConfig[recommendation.priority] || priorityConfig.medium;
        const IconComponent = config.icon;
        
        return (
            <div className={`border rounded-lg p-4 transition-all ${config.color} ${
                isSelected ? 'ring-2 ring-purple-300' : ''
            }`}>
                {/* En-tête */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <IconComponent className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${config.badge}`}>
                                    {recommendation.priority}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{recommendation.description}</p>
                            
                            {/* Tags */}
                            {recommendation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {recommendation.tags.map((tag, index) => (
                                        <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            
                            {/* Confiance et impact */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Confiance: {Math.round((recommendation.confidence || 0.5) * 100)}%</span>
                                <span>Impact: {recommendation.impact}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(recommendation.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Status et actions */}
                    <div className="flex items-center gap-1">
                        {recommendation.status === 'new' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {recommendation.status === 'read' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {recommendation.status === 'dismissed' && (
                            <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {recommendation.status === 'bookmarked' && (
                            <BookmarkPlus className="w-4 h-4 text-yellow-500" />
                        )}
                    </div>
                </div>
                
                {/* Actions rapides */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => giveFeedback(recommendation.id, true)}
                            className={`p-1 rounded ${userFeedback === 'positive' ? 'text-green-600' : 'text-gray-400'}`}
                            title="Utile"
                        >
                            <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => giveFeedback(recommendation.id, false)}
                            className={`p-1 rounded ${userFeedback === 'negative' ? 'text-red-600' : 'text-gray-400'}`}
                            title="Pas utile"
                        >
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => bookmarkRecommendation(recommendation.id)}
                            className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-50"
                        >
                            Sauvegarder
                        </button>
                        <button
                            onClick={() => setSelectedRecommendation(
                                isSelected ? null : recommendation
                            )}
                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                        >
                            Détails
                            <ArrowRight className={`w-3 h-3 transition-transform ${
                                isSelected ? 'rotate-90' : ''
                            }`} />
                        </button>
                    </div>
                </div>
                
                {/* Détails étendus */}
                {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-sm mb-2">Actions suggérées</h5>
                        <div className="grid gap-2">
                            {recommendation.actionItems.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => console.log(`Action: ${action.action}`)}
                                    className="text-left text-sm p-2 bg-white rounded border hover:bg-gray-50"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* En-tête */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Target className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Recommandations IA
                            </h2>
                            <p className="text-sm text-gray-600">
                                Suggestions personnalisées intelligentes
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={loadRecommendations}
                        disabled={loading}
                        className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
                
                {/* Statistiques */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-blue-900">{filteredRecommendations.length}</p>
                        <p className="text-xs text-blue-700">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-green-900">
                            {filteredRecommendations.filter(r => r.status === 'read').length}
                        </p>
                        <p className="text-xs text-green-700">Lues</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-yellow-900">
                            {filteredRecommendations.filter(r => r.status === 'bookmarked').length}
                        </p>
                        <p className="text-xs text-yellow-700">Sauvegardées</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-red-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-red-900">
                            {filteredRecommendations.filter(r => r.priority === 'high').length}
                        </p>
                        <p className="text-xs text-red-700">Priorité haute</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center gap-4">
                    <Filter className="w-4 h-4 text-gray-600" />
                    
                    <select 
                        value={filter.priority}
                        onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="all">Toutes priorités</option>
                        <option value="high">Priorité haute</option>
                        <option value="medium">Priorité moyenne</option>
                        <option value="low">Priorité basse</option>
                    </select>
                    
                    <select 
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="all">Tous types</option>
                        <option value="equipment_suggestion">Équipements</option>
                        <option value="maintenance_schedule">Maintenance</option>
                        <option value="capacity_optimization">Optimisation</option>
                        <option value="loan_policy_update">Politiques</option>
                    </select>
                    
                    <select 
                        value={filter.sortBy}
                        onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="priority">Trier par priorité</option>
                        <option value="confidence">Trier par confiance</option>
                        <option value="date">Trier par date</option>
                        <option value="impact">Trier par impact</option>
                    </select>
                    
                    <button
                        onClick={() => setFilter({ priority: 'all', type: 'all', status: 'all', sortBy: 'priority' })}
                        className="text-sm text-gray-600 hover:text-gray-800"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Liste des recommandations */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                        <p className="ml-2 text-gray-600">Chargement des recommandations...</p>
                    </div>
                ) : filteredRecommendations.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRecommendations.map((recommendation) => (
                            <RecommendationCard 
                                key={recommendation.id} 
                                recommendation={recommendation} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            Aucune recommandation
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {recommendations.length === 0 
                                ? "Les recommandations seront générées automatiquement par l'IA"
                                : "Aucune recommandation ne correspond aux filtres actuels"
                            }
                        </p>
                        <button
                            onClick={loadRecommendations}
                            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                        >
                            Générer des recommandations
                        </button>
                    </div>
                )}
            </div>

            {/* Actions globales */}
            {!loading && filteredRecommendations.length > 0 && (
                <div className="p-4 bg-gray-50 border-t">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            {filteredRecommendations.length} recommandation(s) affichée(s)
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const unreadRecs = filteredRecommendations.filter(r => r.status === 'new');
                                    unreadRecs.forEach(rec => markAsRead(rec.id));
                                }}
                                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Tout marquer comme lu
                            </button>
                            
                            <button
                                onClick={() => {
                                    const bookmarkedRecs = filteredRecommendations.filter(r => r.status !== 'bookmarked');
                                    bookmarkedRecs.forEach(rec => bookmarkRecommendation(rec.id));
                                }}
                                className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                                Tout sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPanel;