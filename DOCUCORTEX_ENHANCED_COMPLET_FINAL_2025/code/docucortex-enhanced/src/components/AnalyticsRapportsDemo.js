// src/components/AnalyticsRapportsDemo.js - DÉMONSTRATION COMPLÈTE DU SYSTÈME ANALYTICS ET RAPPORTS
// Composant principal montrant l'utilisation de tous les composants créés

import React, { useState } from 'react';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';
import { 
    ExecutiveDashboard,
    KPIWidget,
    FinancialKPIWidget,
    NumberKPIWidget,
    SatisfactionKPIWidget,
    TrendAnalysis,
    BenchmarkComparison,
    InsightsPanel
} from './dashboard';
import ReportGenerator from './reports/ReportGenerator';
import MonthlyReport from './reports/MonthlyReport';
import UsageReport from './reports/UsageReport';
import ComplianceReport from './reports/ComplianceReport';
import PerformanceReport from './reports/PerformanceReport';
import UserActivityReport from './reports/UserActivityReport';
import analyticsService from '../services/analyticsService';

const AnalyticsRapportsDemo = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [selectedReportType, setSelectedReportType] = useState('monthly');
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    const sections = [
        { id: 'dashboard', name: 'Dashboard Exécutif', icon: '📊' },
        { id: 'reports', name: 'Générateur de Rapports', icon: '📄' },
        { id: 'monthly', name: 'Rapport Mensuel', icon: '📅' },
        { id: 'usage', name: 'Rapport Utilisation', icon: '👥' },
        { id: 'compliance', name: 'Rapport Conformité', icon: '⚖️' },
        { id: 'performance', name: 'Rapport Performance', icon: '⚡' },
        { id: 'activity', name: 'Rapport Activité', icon: '📈' }
    ];

    const reportTypes = [
        { id: 'monthly', name: 'Rapport Mensuel', description: 'Rapport complet d\'activité mensuelle' },
        { id: 'usage', name: 'Rapport d\'Utilisation', description: 'Analyse détaillée de l\'utilisation du système' },
        { id: 'compliance', name: 'Rapport de Conformité', description: 'Vérification de la conformité et audit' },
        { id: 'performance', name: 'Rapport de Performance', description: 'Métriques de performance système' },
        { id: 'userActivity', name: 'Rapport d\'Activité Utilisateurs', description: 'Analyse de l\'activité des utilisateurs' }
    ];

    const handleReportGenerated = (result) => {
        if (result.success) {
            alert(`✅ Rapport généré avec succès: ${result.filename}`);
        } else {
            alert(`❌ Erreur lors de la génération: ${result.error}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation principale */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🚀</span>
                            <h1 className="text-xl font-bold text-gray-900">
                                DocuCortex - Analytics & Rapports Avancés
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-600">
                                Phase 3 - Analytics & Rapports
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Menu de navigation */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        Système d'Analytics et Rapports Automatiques
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`p-3 rounded-lg text-center transition-all duration-200 ${
                                    activeSection === section.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <div className="text-2xl mb-1">{section.icon}</div>
                                <div className="text-xs font-medium">{section.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Configuration des dates */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        ⚙️ Configuration de la Période d'Analyse
                    </h3>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de début
                            </label>
                            <input
                                type="date"
                                value={dateRange.start.toISOString().split('T')[0]}
                                onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de fin
                            </label>
                            <input
                                type="date"
                                value={dateRange.end.toISOString().split('T')[0]}
                                onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setDateRange({
                                    start: startOfMonth(new Date()),
                                    end: endOfMonth(new Date())
                                })}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                            >
                                Ce mois
                            </button>
                            <button
                                onClick={() => setDateRange({
                                    start: subDays(new Date(), 30),
                                    end: new Date()
                                })}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                            >
                                30 derniers jours
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenu principal selon la section active */}
                <div className="transition-all duration-300">
                    {activeSection === 'dashboard' && (
                        <div className="space-y-8">
                            <ExecutiveDashboard 
                                dateRange={dateRange}
                                autoRefresh={true}
                                refreshInterval={300000}
                            />
                            
                            {/* Démonstration des widgets KPI spécialisés */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    🎯 Démonstration des Widgets KPI Spécialisés
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <FinancialKPIWidget
                                        title="Revenus Mensuels"
                                        value={125000}
                                        previousValue={108000}
                                        change={15.7}
                                        color="green"
                                        target={120000}
                                        description="Revenus du mois en cours"
                                    />
                                    <NumberKPIWidget
                                        title="Nouveaux Clients"
                                        value={127}
                                        previousValue={98}
                                        color="blue"
                                        target={120}
                                        description="Acquisitions ce mois"
                                    />
                                    <PercentageKPIWidget
                                        title="Taux de Conversion"
                                        value={8.5}
                                        target={10}
                                        color="purple"
                                        description="Conversion lead vers client"
                                    />
                                    <SatisfactionKPIWidget
                                        title="Score Satisfaction"
                                        value={8.9}
                                        maxValue={10}
                                        color="orange"
                                        description="Satisfaction client moyenne"
                                    />
                                    <AlertKPIWidget
                                        title="Alertes Système"
                                        value={3}
                                        threshold={5}
                                        comparison="less"
                                        color="red"
                                        description="Alertes actives"
                                    />
                                </div>
                            </div>

                            {/* Analyse des tendances standalone */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <TrendAnalysis 
                                    data={null}
                                    dateRange={dateRange}
                                    selectedMetrics={['loans', 'users', 'satisfaction']}
                                />
                                <BenchmarkComparison 
                                    data={null}
                                    benchmarks={null}
                                />
                            </div>

                            {/* Panel d'insights standalone */}
                            <InsightsPanel 
                                insights={null}
                                predictions={null}
                                anomalies={null}
                            />
                        </div>
                    )}

                    {activeSection === 'reports' && (
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    📄 Générateur de Rapports Avancé
                                </h3>
                                <ReportGenerator 
                                    onReportGenerated={handleReportGenerated}
                                    defaultDateRange={dateRange}
                                    reportTypes={['monthly', 'usage', 'compliance', 'performance', 'userActivity']}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'monthly' && (
                        <MonthlyReport 
                            month={new Date()}
                            onDataLoad={(data) => console.log('Données du rapport mensuel:', data)}
                            includeComparison={true}
                        />
                    )}

                    {activeSection === 'usage' && (
                        <UsageReport 
                            dateRange={dateRange}
                            onDataLoad={(data) => console.log('Données du rapport d\'utilisation:', data)}
                        />
                    )}

                    {activeSection === 'compliance' && (
                        <ComplianceReport 
                            dateRange={dateRange}
                            onDataLoad={(data) => console.log('Données du rapport de conformité:', data)}
                        />
                    )}

                    {activeSection === 'performance' && (
                        <PerformanceReport 
                            dateRange={dateRange}
                            onDataLoad={(data) => console.log('Données du rapport de performance:', data)}
                        />
                    )}

                    {activeSection === 'activity' && (
                        <UserActivityReport 
                            dateRange={dateRange}
                            onDataLoad={(data) => console.log('Données du rapport d\'activité:', data)}
                        />
                    )}
                </div>

                {/* Informations sur le système */}
                <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        🚀 Fonctionnalités Implémentées - Phase 3
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-semibold text-blue-700 mb-2">📊 AnalyticsService</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• KPIs business avancés</li>
                                <li>• Métriques financières</li>
                                <li>• Analyses prédictives</li>
                                <li>• Détection d'anomalies</li>
                                <li>• Insights automatiques</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-green-700 mb-2">📄 Générateur de Rapports</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Multi-formats (PDF, Excel, HTML)</li>
                                <li>• Templates personnalisables</li>
                                <li>• Planification automatique</li>
                                <li>• Distribution email</li>
                                <li>• Prévisualisation en temps réel</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-purple-700 mb-2">📈 Types de Rapports</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Rapport Mensuel</li>
                                <li>• Rapport d'Utilisation</li>
                                <li>• Rapport de Conformité</li>
                                <li>• Rapport de Performance</li>
                                <li>• Rapport d'Activité Utilisateurs</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-orange-700 mb-2">💼 Dashboard Exécutif</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• KPIs en temps réel</li>
                                <li>• Widgets spécialisés</li>
                                <li>• Analyse des tendances</li>
                                <li>• Comparaisons benchmarks</li>
                                <li>• Insights intelligents</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 mb-2">⚡ Fonctionnalités Avancées</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Machine Learning (basique)</li>
                                <li>• Prédictions automatiques</li>
                                <li>• Détection d'anomalies</li>
                                <li>• Recommandations intelligentes</li>
                                <li>• Export multi-formats</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-indigo-700 mb-2">🛠️ Technologies Utilisées</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Chart.js pour graphiques</li>
                                <li>• jsPDF pour génération PDF</li>
                                <li>• ExcelJS pour Excel</li>
                                <li>• date-fns pour dates</li>
                                <li>• React pour interface</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Status du système */}
                <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-green-800">
                                ✅ Système Analytics & Rapports - Phase 3 Complétée
                            </h3>
                            <p className="text-green-700 mt-1">
                                Toutes les fonctionnalités demandées ont été implémentées avec succès.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Dernière mise à jour</div>
                            <div className="font-semibold text-gray-800">
                                {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsRapportsDemo;