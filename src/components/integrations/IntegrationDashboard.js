// src/components/integrations/IntegrationDashboard.js - TABLEAU DE BORD DES INTÉGRATIONS
// Interface de gestion et monitoring des intégrations externes

import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import integrationService from '../../services/integrationService.js';

const IntegrationDashboard = () => {
    const [integrationStatus, setIntegrationStatus] = useState({});
    const [selectedIntegration, setSelectedIntegration] = useState('activeDirectory');
    const [refreshInterval, setRefreshInterval] = useState(30);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Données simulées pour la démo
    const mockIntegrationStatus = {
        activeDirectory: {
            connected: true,
            lastSync: '2024-01-15T14:30:00Z',
            syncStatus: {
                status: 'connected',
                timestamp: '2024-01-15T14:30:00Z'
            },
            metrics: {
                totalUsers: 245,
                activeUsers: 230,
                lastSyncDuration: '2.3s',
                errorCount: 0
            }
        },
        cmdb: {
            connected: true,
            lastSync: '2024-01-15T14:25:00Z',
            syncStatus: {
                status: 'connected',
                timestamp: '2024-01-15T14:25:00Z'
            },
            metrics: {
                totalEquipment: 156,
                activeEquipment: 142,
                lastSyncDuration: '1.8s',
                errorCount: 0
            }
        },
        helpDesk: {
            connected: false,
            lastSync: '2024-01-15T13:45:00Z',
            syncStatus: {
                status: 'error',
                error: 'Connexion timeout',
                timestamp: '2024-01-15T13:45:00Z'
            },
            metrics: {
                totalTickets: 23,
                openTickets: 5,
                lastSyncDuration: 'N/A',
                errorCount: 1
            }
        },
        email: {
            connected: true,
            lastSync: '2024-01-15T14:32:00Z',
            syncStatus: {
                status: 'connected',
                timestamp: '2024-01-15T14:32:00Z'
            },
            metrics: {
                emailsSent: 1247,
                successRate: 98.5,
                lastSyncDuration: '0.5s',
                errorCount: 0
            }
        },
        calendar: {
            connected: true,
            lastSync: '2024-01-15T14:28:00Z',
            syncStatus: {
                status: 'connected',
                timestamp: '2024-01-15T14:28:00Z'
            },
            metrics: {
                eventsCreated: 89,
                upcomingEvents: 12,
                lastSyncDuration: '1.2s',
                errorCount: 0
            }
        }
    };

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

    const integrationColors = {
        connected: 'text-green-600 bg-green-50',
        connecting: 'text-yellow-600 bg-yellow-50',
        error: 'text-red-600 bg-red-50',
        disconnected: 'text-gray-600 bg-gray-50'
    };

    useEffect(() => {
        loadIntegrationStatus();
    }, []);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(loadIntegrationStatus, refreshInterval * 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval]);

    const loadIntegrationStatus = async () => {
        try {
            setLoading(true);
            const status = await integrationService.getIntegrationStatus();
            setIntegrationStatus(status);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement status intégrations:', err);
            setError('Erreur lors du chargement du statut des intégrations');
            // Utiliser les données simulées en cas d'erreur
            setIntegrationStatus(mockIntegrationStatus);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = integrationColors[status] || integrationColors.disconnected;
        const statusLabels = {
            connected: 'Connecté',
            connecting: 'Connexion...',
            error: 'Erreur',
            disconnected: 'Déconnecté'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    const handleSync = async (integrationName) => {
        try {
            setLoading(true);
            
            switch (integrationName) {
                case 'activeDirectory':
                    await integrationService.syncActiveDirectoryUsers();
                    break;
                case 'cmdb':
                    await integrationService.syncEquipmentInventory();
                    break;
                case 'helpDesk':
                    await integrationService.syncTickets();
                    break;
            }

            // Recharger le statut
            setTimeout(loadIntegrationStatus, 1000);
        } catch (err) {
            console.error('Erreur synchronisation:', err);
            setError(`Erreur lors de la synchronisation ${integrationNames[integrationName]}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReconnect = async (integrationName) => {
        try {
            setLoading(true);
            await integrationService.reconnect(integrationName);
            setTimeout(loadIntegrationStatus, 1000);
        } catch (err) {
            console.error('Erreur reconnexion:', err);
            setError(`Erreur lors de la reconnexion à ${integrationNames[integrationName]}`);
        } finally {
            setLoading(false);
        }
    };

    const getHealthScore = (status) => {
        if (status.connected) return 100;
        if (status.syncStatus?.status === 'error') return 0;
        if (status.syncStatus?.status === 'connecting') return 50;
        return 25;
    };

    const selectedData = integrationStatus[selectedIntegration] || {};

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                🔗 Tableau de bord des intégrations
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Gestion et monitoring des connexions aux systèmes externes
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
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
                                <option value={10}>10s</option>
                                <option value={30}>30s</option>
                                <option value={60}>1min</option>
                                <option value={300}>5min</option>
                            </select>
                            
                            <button
                                onClick={loadIntegrationStatus}
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

                {/* Vue d'ensemble */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {Object.entries(integrationStatus).map(([name, status]) => {
                        const healthScore = getHealthScore(status);
                        const isHealthy = healthScore === 100;
                        const isConnected = status.connected;

                        return (
                            <div
                                key={name}
                                onClick={() => setSelectedIntegration(name)}
                                className={`bg-white rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                                    selectedIntegration === name 
                                        ? 'border-blue-500 ring-2 ring-blue-200' 
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-2xl">
                                        {integrationIcons[name]}
                                    </div>
                                    {getStatusBadge(isConnected ? 'connected' : status.syncStatus?.status || 'disconnected')}
                                </div>
                                
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    {integrationNames[name]}
                                </h3>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Santé:</span>
                                        <span className={`font-medium ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                                            {healthScore}%
                                        </span>
                                    </div>
                                    
                                    {status.lastSync && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Dernière sync:</span>
                                            <span className="text-gray-900 text-xs">
                                                {formatDistanceToNow(new Date(status.lastSync), { 
                                                    addSuffix: true, 
                                                    locale: fr 
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Barre de progression santé */}
                                <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${
                                                isHealthy ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${healthScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Détails de l'intégration sélectionnée */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">
                                    {integrationIcons[selectedIntegration]}
                                </span>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {integrationNames[selectedIntegration]}
                                    </h2>
                                    <p className="text-gray-600">
                                        Détails et actions pour cette intégration
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleSync(selectedIntegration)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? '⏳' : '🔄'} Synchroniser
                                </button>
                                
                                <button
                                    onClick={() => handleReconnect(selectedIntegration)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? '⏳' : '🔗'} Reconnecter
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {Object.keys(selectedData).length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Statut de connexion */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        🔗 Statut de connexion
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">État:</span>
                                            {getStatusBadge(selectedData.connected ? 'connected' : selectedData.syncStatus?.status || 'disconnected')}
                                        </div>
                                        
                                        {selectedData.lastSync && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">Dernière synchronisation:</span>
                                                <span className="text-gray-900 font-medium">
                                                    {format(new Date(selectedData.lastSync), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {selectedData.syncStatus?.timestamp && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">Dernière activité:</span>
                                                <span className="text-gray-900 font-medium">
                                                    {formatDistanceToNow(new Date(selectedData.syncStatus.timestamp), { 
                                                        addSuffix: true, 
                                                        locale: fr 
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        {selectedData.syncStatus?.error && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-center">
                                                    <span className="text-red-400 mr-2">⚠️</span>
                                                    <span className="text-red-700 text-sm">{selectedData.syncStatus.error}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Métriques */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        📊 Métriques
                                    </h3>
                                    
                                    {selectedData.metrics && (
                                        <div className="space-y-3">
                                            {Object.entries(selectedData.metrics).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-600 capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                                    </span>
                                                    <span className="text-gray-900 font-medium">
                                                        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <span className="text-4xl mb-4 block">📊</span>
                                <p className="text-gray-500">
                                    Sélectionnez une intégration pour voir les détails
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Statistiques globales */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Intégrations actives</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {Object.values(integrationStatus).filter(s => s.connected).length}
                                </p>
                            </div>
                            <span className="text-3xl">✅</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Erreurs récentes</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {Object.values(integrationStatus).filter(s => s.syncStatus?.status === 'error').length}
                                </p>
                            </div>
                            <span className="text-3xl">⚠️</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Dernière synchronisation</p>
                                <p className="text-lg font-bold text-blue-600">
                                    {(() => {
                                        const lastSync = Object.values(integrationStatus)
                                            .filter(s => s.lastSync)
                                            .map(s => new Date(s.lastSync))
                                            .sort((a, b) => b - a)[0];
                                        
                                        return lastSync 
                                            ? formatDistanceToNow(lastSync, { addSuffix: true, locale: fr })
                                            : 'N/A';
                                    })()}
                                </p>
                            </div>
                            <span className="text-3xl">🕒</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationDashboard;