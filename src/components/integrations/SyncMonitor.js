// src/components/integrations/SyncMonitor.js - MONITEUR DE SYNCHRONISATION
// Interface pour surveiller et gérer les synchronisations en temps réel

import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import integrationService from '../../services/integrationService.js';

const SyncMonitor = () => {
    const [syncHistory, setSyncHistory] = useState([]);
    const [activeSyncs, setActiveSyncs] = useState([]);
    const [selectedIntegration, setSelectedIntegration] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5); // 5 secondes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Données simulées pour la démo
    const mockSyncHistory = [
        {
            id: 'sync_1',
            integration: 'activeDirectory',
            type: 'incremental',
            status: 'completed',
            startTime: '2024-01-15T14:30:00Z',
            endTime: '2024-01-15T14:30:15Z',
            duration: 15,
            recordsProcessed: 12,
            recordsUpdated: 8,
            recordsCreated: 3,
            recordsFailed: 1,
            errors: ['Utilisateur jdupont: champ email invalide'],
            details: {
                usersSynced: 245,
                groupsSynced: 15,
                organizationalChanges: 3
            }
        },
        {
            id: 'sync_2',
            integration: 'cmdb',
            type: 'full',
            status: 'completed',
            startTime: '2024-01-15T14:25:00Z',
            endTime: '2024-01-15T14:25:23Z',
            duration: 23,
            recordsProcessed: 156,
            recordsUpdated: 23,
            recordsCreated: 0,
            recordsFailed: 2,
            errors: ['Équipement EQ999: tag d\'actif en double', 'Équipement EQ888: localisation manquante'],
            details: {
                equipmentSynced: 156,
                locationsUpdated: 8,
                warrantiesProcessed: 45
            }
        },
        {
            id: 'sync_3',
            integration: 'email',
            type: 'event',
            status: 'completed',
            startTime: '2024-01-15T14:32:00Z',
            endTime: '2024-01-15T14:32:02Z',
            duration: 2,
            recordsProcessed: 45,
            recordsUpdated: 0,
            recordsCreated: 45,
            recordsFailed: 0,
            errors: [],
            details: {
                emailsSent: 45,
                templateUsed: 'loan_reminder',
                successRate: 100
            }
        },
        {
            id: 'sync_4',
            integration: 'helpDesk',
            type: 'partial',
            status: 'failed',
            startTime: '2024-01-15T13:45:00Z',
            endTime: '2024-01-15T13:45:05Z',
            duration: 5,
            recordsProcessed: 0,
            recordsUpdated: 0,
            recordsCreated: 0,
            recordsFailed: 5,
            errors: ['Connexion timeout', 'API rate limit exceeded'],
            details: {
                ticketsAttempted: 5,
                errorType: 'connection'
            }
        }
    ];

    const mockActiveSyncs = [
        {
            id: 'sync_active_1',
            integration: 'activeDirectory',
            type: 'incremental',
            status: 'running',
            startTime: new Date().toISOString(),
            progress: 67,
            recordsProcessed: 34,
            totalRecords: 51,
            currentStep: 'Synchronisation des groupes AD',
            estimatedTimeRemaining: 12
        }
    ];

    const integrationNames = {
        activeDirectory: 'Active Directory',
        cmdb: 'CMDB',
        helpDesk: 'Help Desk',
        email: 'Email',
        calendar: 'Calendrier'
    };

    const integrationIcons = {
        activeDirectory: '👥',
        cmdb: '🖥️',
        helpDesk: '🎫',
        email: '📧',
        calendar: '📅'
    };

    const statusConfig = {
        completed: { color: 'text-green-600 bg-green-50', icon: '✅', label: 'Terminé' },
        running: { color: 'text-blue-600 bg-blue-50', icon: '⏳', label: 'En cours' },
        failed: { color: 'text-red-600 bg-red-50', icon: '❌', label: 'Échoué' },
        pending: { color: 'text-yellow-600 bg-yellow-50', icon: '⏸️', label: 'En attente' },
        cancelled: { color: 'text-gray-600 bg-gray-50', icon: '🚫', label: 'Annulé' }
    };

    const typeLabels = {
        full: 'Complète',
        incremental: 'Incrémentielle',
        partial: 'Partielle',
        event: 'Événement'
    };

    useEffect(() => {
        loadSyncData();
    }, [selectedIntegration]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(loadSyncData, refreshInterval * 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval]);

    const loadSyncData = async () => {
        try {
            setLoading(true);
            
            // Charger l'historique des synchronisations
            const history = await integrationService.getSyncHistory(50);
            
            // Filtrer par intégration si nécessaire
            const filteredHistory = selectedIntegration === 'all' 
                ? history 
                : history.filter(sync => sync.integration === selectedIntegration);
            
            setSyncHistory(filteredHistory.length > 0 ? filteredHistory : mockSyncHistory);
            setActiveSyncs(mockActiveSyncs);
            
        } catch (err) {
            console.error('Erreur chargement données sync:', err);
            setError('Erreur lors du chargement des données de synchronisation');
            // Utiliser les données simulées en cas d'erreur
            setSyncHistory(mockSyncHistory);
            setActiveSyncs(mockActiveSyncs);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <span className="mr-1">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const getDuration = (startTime, endTime) => {
        const duration = endTime 
            ? new Date(endTime).getTime() - new Date(startTime).getTime()
            : Date.now() - new Date(startTime).getTime();
        
        return Math.floor(duration / 1000); // en secondes
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const handleManualSync = async (integrationName, syncType = 'incremental') => {
        try {
            setLoading(true);
            
            switch (integrationName) {
                case 'activeDirectory':
                    await integrationService.syncActiveDirectoryUsers(syncType);
                    break;
                case 'cmdb':
                    await integrationService.syncEquipmentInventory(syncType);
                    break;
                case 'helpDesk':
                    await integrationService.syncTickets(syncType);
                    break;
            }
            
            // Recharger les données après un délai
            setTimeout(loadSyncData, 2000);
            
        } catch (err) {
            console.error('Erreur synchronisation manuelle:', err);
            setError(`Erreur lors de la synchronisation de ${integrationNames[integrationName]}`);
        } finally {
            setLoading(false);
        }
    };

    const cancelActiveSync = async (syncId) => {
        // Simuler l'annulation d'une synchronisation
        setActiveSyncs(prev => prev.filter(sync => sync.id !== syncId));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                🔄 Moniteur de synchronisation
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Surveillance en temps réel des synchronisations avec les systèmes externes
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedIntegration}
                                onChange={(e) => setSelectedIntegration(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="all">Toutes les intégrations</option>
                                {Object.entries(integrationNames).map(([key, name]) => (
                                    <option key={key} value={key}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    autoRefresh 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white text-gray-700 border border-gray-300'
                                }`}
                            >
                                {autoRefresh ? '⏸️ Pause' : '▶️ Auto-refresh'}
                            </button>
                            
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value={2}>2s</option>
                                <option value={5}>5s</option>
                                <option value={10}>10s</option>
                                <option value={30}>30s</option>
                            </select>
                            
                            <button
                                onClick={loadSyncData}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? '⏳' : '🔄'} Actualiser
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex">
                            <span className="text-red-400 mr-2">⚠️</span>
                            <span className="text-red-700">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Synchronisations actives */}
                {activeSyncs.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            🔄 Synchronisations actives ({activeSyncs.length})
                        </h2>
                        <div className="space-y-4">
                            {activeSyncs.map((sync) => (
                                <div key={sync.id} className="bg-white rounded-xl p-6 shadow-sm border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">
                                                {integrationIcons[sync.integration]}
                                            </span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {integrationNames[sync.integration]} - {typeLabels[sync.type]}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {sync.currentStep}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            {getStatusBadge(sync.status)}
                                            <button
                                                onClick={() => cancelActiveSync(sync.id)}
                                                className="px-3 py-1 text-red-600 bg-red-50 rounded-lg text-sm hover:bg-red-100"
                                            >
                                                🚫 Annuler
                                            </button>
                                        </div>
                                    </div>

                                    {/* Barre de progression */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                                            <span>Progression: {sync.recordsProcessed} / {sync.totalRecords}</span>
                                            <span>{sync.progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${sync.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Métriques en temps réel */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">
                                                {sync.recordsProcessed}
                                            </div>
                                            <div className="text-xs text-gray-600">Traitées</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatDuration(getDuration(sync.startTime, null))}
                                            </div>
                                            <div className="text-xs text-gray-600">Durée</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-yellow-600">
                                                {sync.estimatedTimeRemaining}s
                                            </div>
                                            <div className="text-xs text-gray-600">Restant (estimé)</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-purple-600">
                                                {Math.round(sync.recordsProcessed / (getDuration(sync.startTime, null) / 60))}
                                            </div>
                                            <div className="text-xs text-gray-600">Par minute</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Historique des synchronisations */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                📊 Historique des synchronisations
                            </h2>
                            
                            <div className="flex items-center space-x-2">
                                {Object.keys(integrationNames).map(integration => (
                                    <button
                                        key={integration}
                                        onClick={() => handleManualSync(integration)}
                                        disabled={loading}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                                        title={`Synchroniser ${integrationNames[integration]}`}
                                    >
                                        {integrationIcons[integration]} Sync
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Intégration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Durée
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Enregistrements
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Erreurs
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Heure
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {syncHistory.map((sync) => (
                                    <tr key={sync.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-xl mr-3">
                                                    {integrationIcons[sync.integration]}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {integrationNames[sync.integration]}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {sync.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {typeLabels[sync.type] || sync.type}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(sync.status)}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDuration(getDuration(sync.startTime, sync.endTime))}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                <div>Total: {sync.recordsProcessed}</div>
                                                {sync.recordsUpdated > 0 && (
                                                    <div className="text-green-600">✓ {sync.recordsUpdated} mises à jour</div>
                                                )}
                                                {sync.recordsCreated > 0 && (
                                                    <div className="text-blue-600">+ {sync.recordsCreated} créations</div>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {sync.recordsFailed > 0 ? (
                                                <div className="text-red-600">
                                                    {sync.recordsFailed} échec{sync.recordsFailed > 1 ? 's' : ''}
                                                </div>
                                            ) : (
                                                <span className="text-green-600">Aucune erreur</span>
                                            )}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>
                                                {formatDistanceToNow(new Date(sync.startTime), { 
                                                    addSuffix: true, 
                                                    locale: fr 
                                                })}
                                            </div>
                                            <div className="text-xs">
                                                {format(new Date(sync.startTime), 'HH:mm:ss', { locale: fr })}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Voir les détails"
                                                >
                                                    👁️ Détails
                                                </button>
                                                
                                                {sync.status === 'failed' && (
                                                    <button
                                                        onClick={() => handleManualSync(sync.integration, sync.type)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Relancer"
                                                    >
                                                        🔄 Relancer
                                                    </button>
                                                )}
                                                
                                                <button
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="Exporter les logs"
                                                >
                                                    📥 Logs
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {syncHistory.length === 0 && (
                            <div className="text-center py-12">
                                <span className="text-4xl mb-4 block">📊</span>
                                <p className="text-gray-500">
                                    Aucune synchronisation trouvée pour les critères sélectionnés.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Statistiques rapides */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {syncHistory.filter(sync => {
                                        const today = new Date();
                                        const syncDate = new Date(sync.startTime);
                                        return syncDate.toDateString() === today.toDateString();
                                    }).length}
                                </p>
                            </div>
                            <span className="text-3xl">📅</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Synchronisations</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Réussies</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {syncHistory.filter(sync => sync.status === 'completed').length}
                                </p>
                            </div>
                            <span className="text-3xl">✅</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Dernières 24h</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Échouées</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {syncHistory.filter(sync => sync.status === 'failed').length}
                                </p>
                            </div>
                            <span className="text-3xl">❌</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Dernières 24h</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Durée moyenne</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {(() => {
                                        const completedSyncs = syncHistory.filter(sync => sync.status === 'completed');
                                        if (completedSyncs.length === 0) return '0s';
                                        const avgDuration = completedSyncs.reduce((sum, sync) => sum + sync.duration, 0) / completedSyncs.length;
                                        return formatDuration(Math.round(avgDuration));
                                    })()}
                                </p>
                            </div>
                            <span className="text-3xl">⏱️</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Synchronisations</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncMonitor;