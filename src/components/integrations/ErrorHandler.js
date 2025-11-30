// src/components/integrations/ErrorHandler.js - GESTIONNAIRE D'ERREURS
// Interface pour gérer et surveiller les erreurs des intégrations

import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ErrorHandler = () => {
    const [errors, setErrors] = useState([]);
    const [selectedError, setSelectedError] = useState(null);
    const [filterIntegration, setFilterIntegration] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterTimeRange, setFilterTimeRange] = useState('24h');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10);
    const [loading, setLoading] = useState(false);
    const [showResolved, setShowResolved] = useState(false);

    // Données simulées pour la démo
    const mockErrors = [
        {
            id: 'err_001',
            integration: 'activeDirectory',
            severity: 'high',
            type: 'connection',
            title: 'Timeout de connexion Active Directory',
            description: 'La connexion au serveur LDAP a expiré après 30 secondes',
            details: {
                errorCode: 'LDAP_TIMEOUT',
                errorMessage: 'Connection timed out after 30000ms',
                stackTrace: 'Error: Connection timed out\n    at LDAPConnector.connect (ActiveDirectoryConnector.js:245:15)',
                context: {
                    serverUrl: 'ldap://ldap.company.com:389',
                    bindDN: 'CN=svc-docucortex,OU=Service Accounts',
                    operation: 'bind'
                }
            },
            status: 'unresolved',
            createdAt: '2024-01-15T14:30:00Z',
            resolvedAt: null,
            resolvedBy: null,
            retryCount: 3,
            lastRetry: '2024-01-15T14:30:15Z',
            affectedRecords: 0,
            metadata: {
                userAgent: 'DocuCortex-Integration/1.0.0',
                environment: 'production',
                correlationId: 'corr_abc123'
            }
        },
        {
            id: 'err_002',
            integration: 'cmdb',
            severity: 'medium',
            type: 'data',
            title: 'Équipement avec tag d\'actif en double',
            description: 'Un équipement avec le tag ACT-001 existe déjà dans la base de données',
            details: {
                errorCode: 'DUPLICATE_ASSET_TAG',
                errorMessage: 'Asset tag ACT-001 already exists',
                affectedEntity: 'equipment',
                conflictingData: {
                    existing: {
                        id: 'EQ123',
                        name: 'Dell Latitude 7420',
                        assetTag: 'ACT-001'
                    },
                    incoming: {
                        id: 'EQ456',
                        name: 'Dell Latitude 7420',
                        assetTag: 'ACT-001'
                    }
                }
            },
            status: 'resolved',
            createdAt: '2024-01-15T13:45:00Z',
            resolvedAt: '2024-01-15T13:50:00Z',
            resolvedBy: 'system',
            retryCount: 1,
            lastRetry: '2024-01-15T13:45:30Z',
            affectedRecords: 1,
            metadata: {
                syncId: 'sync_cmdb_001',
                batchId: 'batch_20240115_1345'
            }
        },
        {
            id: 'err_003',
            integration: 'helpDesk',
            severity: 'low',
            type: 'api',
            title: 'Limite de taux API dépassée',
            description: 'La limite de requêtes API a été dépassée (100 req/min)',
            details: {
                errorCode: 'RATE_LIMIT_EXCEEDED',
                errorMessage: 'API rate limit exceeded',
                headers: {
                    'X-RateLimit-Limit': '100',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': '1642248000'
                },
                retryAfter: 60
            },
            status: 'unresolved',
            createdAt: '2024-01-15T12:30:00Z',
            resolvedAt: null,
            resolvedBy: null,
            retryCount: 5,
            lastRetry: '2024-01-15T12:35:00Z',
            affectedRecords: 0,
            metadata: {
                endpoint: '/api/tickets',
                method: 'POST',
                userAgent: 'DocuCortex-Integration/1.0.0'
            }
        },
        {
            id: 'err_004',
            integration: 'email',
            severity: 'high',
            type: 'delivery',
            title: 'Échec de livraison d\'email',
            description: 'Impossible de livrer l\'email à john.doe@invalid-domain.com (domaine inexistant)',
            details: {
                errorCode: 'DELIVERY_FAILED',
                errorMessage: '550 5.1.1 User unknown',
                recipient: 'john.doe@invalid-domain.com',
                smtpResponse: '550 5.1.1 <john.doe@invalid-domain.com>... User unknown',
                template: 'loan_reminder',
                emailData: {
                    borrowerName: 'John Doe',
                    documentTitle: 'Manuel Utilisateur',
                    returnDate: '2024-01-20'
                }
            },
            status: 'unresolved',
            createdAt: '2024-01-15T11:15:00Z',
            resolvedAt: null,
            resolvedBy: null,
            retryCount: 2,
            lastRetry: '2024-01-15T11:20:00Z',
            affectedRecords: 1,
            metadata: {
                messageId: 'msg_123456',
                smtpServer: 'smtp.company.com'
            }
        }
    ];

    const integrationNames = {
        activeDirectory: 'Active Directory',
        cmdb: 'CMDB',
        helpDesk: 'Help Desk',
        email: 'Email',
        calendar: 'Calendrier'
    };

    const severityConfig = {
        critical: { color: 'text-red-600 bg-red-50', label: 'Critique', icon: '🚨' },
        high: { color: 'text-red-600 bg-red-50', label: 'Élevé', icon: '⚠️' },
        medium: { color: 'text-yellow-600 bg-yellow-50', label: 'Moyen', icon: '🟡' },
        low: { color: 'text-blue-600 bg-blue-50', label: 'Faible', icon: 'ℹ️' }
    };

    const errorTypes = {
        connection: 'Connexion',
        authentication: 'Authentification',
        data: 'Données',
        api: 'API',
        configuration: 'Configuration',
        delivery: 'Livraison',
        timeout: 'Timeout',
        validation: 'Validation'
    };

    const statusConfig = {
        unresolved: { color: 'text-red-600 bg-red-50', label: 'Non résolu' },
        resolved: { color: 'text-green-600 bg-green-50', label: 'Résolu' },
        ignored: { color: 'text-gray-600 bg-gray-50', label: 'Ignoré' }
    };

    useEffect(() => {
        loadErrors();
    }, [filterIntegration, filterSeverity, filterTimeRange, showResolved]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(loadErrors, refreshInterval * 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval]);

    const loadErrors = async () => {
        try {
            setLoading(true);
            
            // Simuler le chargement des erreurs depuis l'API
            let filteredErrors = [...mockErrors];

            // Filtrer par intégration
            if (filterIntegration !== 'all') {
                filteredErrors = filteredErrors.filter(error => error.integration === filterIntegration);
            }

            // Filtrer par sévérité
            if (filterSeverity !== 'all') {
                filteredErrors = filteredErrors.filter(error => error.severity === filterSeverity);
            }

            // Filtrer par statut
            if (!showResolved) {
                filteredErrors = filteredErrors.filter(error => error.status === 'unresolved');
            }

            // Filtrer par période
            const now = new Date();
            const timeRanges = {
                '1h': 1,
                '24h': 24,
                '7d': 24 * 7,
                '30d': 24 * 30
            };
            
            if (filterTimeRange !== 'all') {
                const hours = timeRanges[filterTimeRange];
                const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
                filteredErrors = filteredErrors.filter(error => new Date(error.createdAt) > cutoff);
            }

            setErrors(filteredErrors);
        } catch (err) {
            console.error('Erreur chargement erreurs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity) => {
        const config = severityConfig[severity] || severityConfig.low;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <span className="mr-1">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.unresolved;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const handleResolveError = (errorId) => {
        setErrors(prev => prev.map(error => 
            error.id === errorId 
                ? { 
                    ...error, 
                    status: 'resolved', 
                    resolvedAt: new Date().toISOString(),
                    resolvedBy: 'current_user'
                  }
                : error
        ));
    };

    const handleIgnoreError = (errorId) => {
        setErrors(prev => prev.map(error => 
            error.id === errorId 
                ? { ...error, status: 'ignored' }
                : error
        ));
    };

    const handleRetryError = async (errorId) => {
        const error = errors.find(e => e.id === errorId);
        if (!error) return;

        try {
            // Simuler une tentative de réparation
            setErrors(prev => prev.map(e => 
                e.id === errorId 
                    ? { ...e, retryCount: e.retryCount + 1, lastRetry: new Date().toISOString() }
                    : e
            ));

            // Simuler un délai de traitement
            setTimeout(() => {
                // 50% de chance de réussite pour la démo
                const success = Math.random() > 0.5;
                
                setErrors(prev => prev.map(e => 
                    e.id === errorId 
                        ? { 
                            ...e, 
                            status: success ? 'resolved' : 'unresolved',
                            resolvedAt: success ? new Date().toISOString() : null,
                            resolvedBy: success ? 'system' : null
                          }
                        : e
                ));
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de la nouvelle tentative:', err);
        }
    };

    const exportErrors = () => {
        const dataStr = JSON.stringify(errors, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `integration-errors-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const clearResolvedErrors = () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les erreurs résolues ?')) {
            setErrors(prev => prev.filter(error => error.status === 'unresolved'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                ⚠️ Gestionnaire d'erreurs
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Surveillance et gestion des erreurs des intégrations
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={exportErrors}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                            >
                                📥 Exporter
                            </button>
                            
                            <button
                                onClick={clearResolvedErrors}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                            >
                                🗑️ Nettoyer résolus
                            </button>
                            
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
                            
                            <button
                                onClick={loadErrors}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                            >
                                {loading ? '⏳' : '🔄'} Actualiser
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total erreurs</p>
                                <p className="text-2xl font-bold text-gray-900">{errors.length}</p>
                            </div>
                            <span className="text-3xl">📊</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Non résolues</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {errors.filter(e => e.status === 'unresolved').length}
                                </p>
                            </div>
                            <span className="text-3xl">🚨</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Critiques</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {errors.filter(e => e.severity === 'critical').length}
                                </p>
                            </div>
                            <span className="text-3xl">🔴</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">24h</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {errors.filter(e => {
                                        const errorTime = new Date(e.createdAt);
                                        const twentyFourHours = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                        return errorTime > twentyFourHours;
                                    }).length}
                                </p>
                            </div>
                            <span className="text-3xl">📅</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Taux résolution</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {(() => {
                                        const resolved = errors.filter(e => e.status === 'resolved').length;
                                        const total = errors.length;
                                        return total > 0 ? Math.round((resolved / total) * 100) : 0;
                                    })()}%
                                </p>
                            </div>
                            <span className="text-3xl">✅</span>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Intégration
                            </label>
                            <select
                                value={filterIntegration}
                                onChange={(e) => setFilterIntegration(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Toutes</option>
                                {Object.entries(integrationNames).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sévérité
                            </label>
                            <select
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Toutes</option>
                                <option value="critical">Critique</option>
                                <option value="high">Élevé</option>
                                <option value="medium">Moyen</option>
                                <option value="low">Faible</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Période
                            </label>
                            <select
                                value={filterTimeRange}
                                onChange={(e) => setFilterTimeRange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Toutes</option>
                                <option value="1h">1 heure</option>
                                <option value="24h">24 heures</option>
                                <option value="7d">7 jours</option>
                                <option value="30d">30 jours</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showResolved}
                                    onChange={(e) => setShowResolved(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Afficher les erreurs résolues
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des erreurs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Erreurs des intégrations ({errors.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Erreur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Intégration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sévérité
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Créée
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tentatives
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {errors.map((error) => (
                                    <tr key={error.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {error.title}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {error.type} • {error.errorCode}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {integrationNames[error.integration] || error.integration}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getSeverityBadge(error.severity)}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(error.status)}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>
                                                {formatDistanceToNow(new Date(error.createdAt), { 
                                                    addSuffix: true, 
                                                    locale: fr 
                                                })}
                                            </div>
                                            {error.resolvedAt && (
                                                <div className="text-xs text-green-600">
                                                    Résolue {formatDistanceToNow(new Date(error.resolvedAt), { 
                                                        addSuffix: true, 
                                                        locale: fr 
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {error.retryCount} tentative{error.retryCount > 1 ? 's' : ''}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setSelectedError(error)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Voir les détails"
                                                >
                                                    👁️ Détails
                                                </button>
                                                
                                                {error.status === 'unresolved' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResolveError(error.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Marquer comme résolu"
                                                        >
                                                            ✅ Résoudre
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleRetryError(error.id)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                            title="Nouvelle tentative"
                                                        >
                                                            🔄 Réessayer
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleIgnoreError(error.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Ignorer"
                                                        >
                                                            👁️ Ignorer
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {errors.length === 0 && (
                            <div className="text-center py-12">
                                <span className="text-4xl mb-4 block">✅</span>
                                <p className="text-gray-500">
                                    Aucune erreur trouvée pour les critères sélectionnés.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de détails d'erreur */}
                {selectedError && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Détails de l'erreur
                                    </h2>
                                    <button
                                        onClick={() => setSelectedError(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Informations générales</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>ID:</strong> {selectedError.id}</div>
                                            <div><strong>Intégration:</strong> {integrationNames[selectedError.integration]}</div>
                                            <div><strong>Type:</strong> {errorTypes[selectedError.type] || selectedError.type}</div>
                                            <div><strong>Sévérité:</strong> {getSeverityBadge(selectedError.severity)}</div>
                                            <div><strong>Statut:</strong> {getStatusBadge(selectedError.status)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Chronologie</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Créée:</strong> {format(new Date(selectedError.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</div>
                                            {selectedError.resolvedAt && (
                                                <div><strong>Résolue:</strong> {format(new Date(selectedError.resolvedAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</div>
                                            )}
                                            <div><strong>Tentatives:</strong> {selectedError.retryCount}</div>
                                            {selectedError.lastRetry && (
                                                <div><strong>Dernière tentative:</strong> {formatDistanceToNow(new Date(selectedError.lastRetry), { addSuffix: true, locale: fr })}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                                    <p className="text-sm text-gray-700">{selectedError.description}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Détails techniques</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="text-sm">
                                            <div><strong>Code d'erreur:</strong> {selectedError.details.errorCode}</div>
                                            <div><strong>Message:</strong> {selectedError.details.errorMessage}</div>
                                        </div>
                                    </div>
                                </div>

                                {selectedError.details.stackTrace && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Stack trace</h3>
                                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                                            {selectedError.details.stackTrace}
                                        </pre>
                                    </div>
                                )}

                                {selectedError.affectedRecords > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Enregistrements affectés</h3>
                                        <span className="text-red-600 font-bold">{selectedError.affectedRecords}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={() => setSelectedError(null)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Fermer
                                </button>
                                
                                {selectedError.status === 'unresolved' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleResolveError(selectedError.id);
                                                setSelectedError(null);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            ✅ Marquer comme résolu
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                handleRetryError(selectedError.id);
                                                setSelectedError(null);
                                            }}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                        >
                                            🔄 Nouvelle tentative
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorHandler;