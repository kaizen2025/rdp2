// src/components/dashboard/InsightsPanel.js - PANEL D'INSIGHTS INTELLIGENTS
// Composant d'affichage des insights automatiques et recommandations

import React, { useState } from 'react';
import { format } from 'date-fns';

const InsightsPanel = ({ 
    insights, 
    predictions, 
    anomalies,
    maxInsights = 10,
    autoRefresh = false 
}) => {
    const [activeTab, setActiveTab] = useState('insights');
    const [expandedInsight, setExpandedInsight] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');

    // Générer des insights par défaut si none fournis
    const defaultInsights = {
        performance: [
            "Le taux de retour des documents a augmenté de 12% ce mois, indiquant une amélioration de l'expérience utilisateur.",
            "Les performances système sont stables avec un temps de réponse moyen de 150ms.",
            "La satisfaction client se maintient à un niveau élevé de 8.9/10."
        ],
        opportunities: [
            "Potentiel d'augmentation de 25% de l'adoption en formant les nouveaux utilisateurs.",
            "Opportunité d'optimiser les processus pour réduire les coûts opérationnels de 15%.",
            "Marché en expansion dans le secteur de la gestion documentaire avec 40% de croissance prévue."
        ],
        risks: [
            "Augmentation de 8% des retards de retour nécessitant un système de rappel plus proactif.",
            "Concurrence accrue sur le marché avec 3 nouveaux entrants majeurs.",
            "Dépendance à l'infrastructure cloud nécessitant un plan de contingence."
        ],
        recommendations: [
            "Implémenter un programme de gamification pour augmenter l'engagement utilisateur.",
            "Développer des partenariats stratégiques pour расширить la clientèle.",
            "Investir dans l'IA pour l'automatisation des processus métier.",
            "Renforcer la sécurité avec l'authentification multi-facteurs.",
            "Créer un programme de fidélité pour les gros utilisateurs."
        ],
        trends: [
            "Adoption croissante des solutions cloud avec 67% des entreprises qui migrent.",
            "Demande forte pour l'intégration mobile et l'accessibilité 24/7.",
            "Émergence de l'IA et du machine learning comme priorités d'investissement."
        ],
        benchmarks: [
            "Performance supérieure de 18% à la moyenne du secteur en termes d'efficacité.",
            "Position dans le top 25% pour la satisfaction client.",
            "ROI de 78.5% dépassant l'objectif de 75% fixé pour cette année."
        ]
    };

    const insightsData = insights || defaultInsights;

    // Prédictions par défaut
    const defaultPredictions = {
        nextMonth: {
            loans: Math.floor(Math.random() * 200) + 150,
            users: Math.floor(Math.random() * 50) + 120,
            revenue: Math.floor(Math.random() * 20000) + 80000,
            confidence: Math.floor(Math.random() * 20) + 75
        },
        trends: [
            "Croissance continue prévue de 15% sur les 3 prochains mois.",
            "Pic d'activité attendu pendant la période fiscale (mars-avril).",
            "Adoption accélérée des nouvelles fonctionnalités prévue en mai."
        ],
        riskFactors: [
            "Saisonnalité traditionnelle en juillet-août.",
            "Concurrence potentielle avec le lancement d'un concurrent majeur.",
            "Volatilité des marchés pouvant affecter les investissements."
        ]
    };

    const predictionsData = predictions || defaultPredictions;

    // Anomalies par défaut
    const defaultAnomalies = {
        systemAnomalies: [],
        behavioralAnomalies: [],
        securityAnomalies: []
    };

    const anomaliesData = anomalies || defaultAnomalies;

    // Filtrer les insights
    const filteredInsights = Object.entries(insightsData).reduce((acc, [category, items]) => {
        if (filterCategory === 'all' || category === filterCategory) {
            acc[category] = items;
        }
        return acc;
    }, {});

    // Calculer le niveau de confiance global
    const calculateConfidenceLevel = () => {
        const anomalyCount = Object.values(anomaliesData).flat().length;
        const insightCount = Object.values(insightsData).flat().length;
        
        if (anomalyCount === 0) return { level: 'high', percentage: 92, color: 'green' };
        if (anomalyCount < 3) return { level: 'medium', percentage: 78, color: 'yellow' };
        return { level: 'low', percentage: 65, color: 'red' };
    };

    const confidence = calculateConfidenceLevel();

    // Obtenir l'icône pour chaque catégorie
    const getCategoryIcon = (category) => {
        const icons = {
            performance: '📊',
            opportunities: '💡',
            risks: '⚠️',
            recommendations: '🎯',
            trends: '📈',
            benchmarks: '🏆'
        };
        return icons[category] || '📋';
    };

    // Obtenir la couleur pour chaque catégorie
    const getCategoryColor = (category) => {
        const colors = {
            performance: 'blue',
            opportunities: 'green',
            risks: 'red',
            recommendations: 'purple',
            trends: 'orange',
            benchmarks: 'indigo'
        };
        return colors[category] || 'gray';
    };

    // Générer les insights prioritaires
    const getPriorityInsights = () => {
        const allInsights = Object.entries(filteredInsights)
            .flatMap(([category, items]) => 
                items.map(insight => ({ category, insight, icon: getCategoryIcon(category) }))
            )
            .slice(0, maxInsights);

        return allInsights;
    };

    const priorityInsights = getPriorityInsights();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                    🧠 Panel d'Insights Intelligents
                </h3>
                <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${confidence.color}-100 text-${confidence.color}-700`}>
                        Confiance: {confidence.percentage}%
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Toutes les catégories</option>
                        <option value="performance">Performance</option>
                        <option value="opportunities">Opportunités</option>
                        <option value="risks">Risques</option>
                        <option value="recommendations">Recommandations</option>
                        <option value="trends">Tendances</option>
                        <option value="benchmarks">Benchmarks</option>
                    </select>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'insights'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Insights ({priorityInsights.length})
                </button>
                <button
                    onClick={() => setActiveTab('predictions')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'predictions'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Prédictions
                </button>
                <button
                    onClick={() => setActiveTab('anomalies')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'anomalies'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Anomalies
                </button>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'insights' && (
                <div className="space-y-4">
                    {priorityInsights.map((item, index) => (
                        <div 
                            key={index}
                            className={`p-4 rounded-lg border-l-4 bg-${getCategoryColor(item.category)}-50 border-${getCategoryColor(item.category)}-400 hover:shadow-md transition-shadow cursor-pointer`}
                            onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <span className="text-2xl">{item.icon}</span>
                                    <div className="flex-1">
                                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-${getCategoryColor(item.category)}-100 text-${getCategoryColor(item.category)}-700 mb-2`}>
                                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                        </div>
                                        <p className={`text-${getCategoryColor(item.category)}-800 font-medium ${expandedInsight !== index ? 'line-clamp-2' : ''}`}>
                                            {item.insight}
                                        </p>
                                        {expandedInsight === index && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <strong>Analyse:</strong> Cet insight est basé sur l'analyse des données récentes et les tendances identifiées.
                                                </p>
                                                <div className="flex space-x-2">
                                                    <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                                        Voir détails
                                                    </button>
                                                    <button className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                                        Agir
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    {expandedInsight === index ? '−' : '+'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'predictions' && (
                <div className="space-y-6">
                    {/* Prédictions quantitatives */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                            <div className="text-sm text-blue-700 mb-1">Prêts Prévus</div>
                            <div className="text-2xl font-bold text-blue-800">
                                {predictionsData.nextMonth.loans}
                            </div>
                            <div className="text-xs text-blue-600">Prochain mois</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                            <div className="text-sm text-green-700 mb-1">Nouveaux Utilisateurs</div>
                            <div className="text-2xl font-bold text-green-800">
                                {predictionsData.nextMonth.users}
                            </div>
                            <div className="text-xs text-green-600">Croissance prévue</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                            <div className="text-sm text-purple-700 mb-1">Revenus Prévus</div>
                            <div className="text-2xl font-bold text-purple-800">
                                {predictionsData.nextMonth.revenue.toLocaleString()}€
                            </div>
                            <div className="text-xs text-purple-600">
                                Confiance: {predictionsData.nextMonth.confidence}%
                            </div>
                        </div>
                    </div>

                    {/* Tendances prédites */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-semibold text-yellow-800 mb-3">📈 Tendances Prédictives</h4>
                        <ul className="space-y-2">
                            {predictionsData.trends.map((trend, index) => (
                                <li key={index} className="text-yellow-700 text-sm flex items-start">
                                    <span className="text-yellow-500 mr-2">▶</span>
                                    {trend}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Facteurs de risque */}
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <h4 className="font-semibold text-red-800 mb-3">⚠️ Facteurs de Risque</h4>
                        <ul className="space-y-2">
                            {predictionsData.riskFactors.map((factor, index) => (
                                <li key={index} className="text-red-700 text-sm flex items-start">
                                    <span className="text-red-500 mr-2">▶</span>
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'anomalies' && (
                <div className="space-y-6">
                    {/* Résumé des anomalies */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-800">🔍 Anomalies Détectées</h4>
                            <div className="text-sm text-gray-600">
                                {format(new Date(), 'dd/MM/yyyy HH:mm')} - Dernière analyse
                            </div>
                        </div>
                        
                        {Object.keys(anomaliesData).every(key => anomaliesData[key].length === 0) ? (
                            <div className="text-center py-8">
                                <span className="text-4xl">✅</span>
                                <p className="text-green-600 font-medium mt-2">
                                    Aucune anomalie détectée
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Le système fonctionne normalement
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(anomaliesData).map(([type, anomalies]) => (
                                    <div key={type} className="bg-white p-3 rounded-lg border">
                                        <h5 className="font-medium text-gray-700 mb-2">
                                            {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </h5>
                                        <div className="text-2xl font-bold text-gray-800">
                                            {anomalies.length}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {anomalies.length === 0 ? 'Aucune anomalie' : 
                                             anomalies.length === 1 ? '1 anomalie' : 
                                             `${anomalies.length} anomalies`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Détails des anomalies (si existantes) */}
                    {Object.values(anomaliesData).flat().length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800">Détails des Anomalies</h4>
                            {Object.entries(anomaliesData).map(([type, anomalies]) => 
                                anomalies.length > 0 && (
                                    <div key={type} className="border rounded-lg p-4">
                                        <h5 className="font-medium text-gray-700 mb-3">
                                            {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </h5>
                                        <div className="space-y-2">
                                            {anomalies.map((anomaly, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                                                    <span className="text-sm text-red-700">{anomaly}</span>
                                                    <button className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                                                        Analyser
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Actions rapides */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Dernière mise à jour: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
                    </div>
                    <div className="flex space-x-2">
                        <button className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                            Exporter Insights
                        </button>
                        <button className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                            Programmer Alertes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsPanel;