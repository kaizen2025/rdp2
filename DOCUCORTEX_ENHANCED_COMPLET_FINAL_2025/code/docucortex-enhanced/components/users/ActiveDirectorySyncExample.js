// src/components/users/ActiveDirectorySyncExample.js - EXEMPLE D'UTILISATION PRATIQUE
// Exemple complet d'utilisation du système de synchronisation AD ↔ Excel

import React, { useState, useEffect } from 'react';
import { 
    ActiveDirectorySync, 
    ActiveDirectorySyncPanel, 
    useActiveDirectorySync,
    SYNC_STATUS 
} from './index.js';

/**
 * Exemple d'utilisation du système de synchronisation AD ↔ Excel
 */
const ActiveDirectorySyncExample = () => {
    const [syncInstance, setSyncInstance] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialisation du système
    useEffect(() => {
        const initializeSync = async () => {
            try {
                const sync = new ActiveDirectorySync({
                    autoSync: false, // Désactiver pour l'exemple
                    syncInterval: 300000, // 5 minutes
                    conflictResolution: 'keep_newer',
                    enableLogging: true,
                    logLevel: 'info',
                    fieldMappings: {
                        'firstName': 'givenName',
                        'lastName': 'sn',
                        'email': 'mail',
                        'phone': 'telephoneNumber',
                        'mobile': 'mobile',
                        'department': 'department',
                        'title': 'title'
                    },
                    conflictRules: {
                        emailConflictResolution: 'keep_excel',
                        phoneConflictResolution: 'keep_ad',
                        departmentConflictResolution: 'manual'
                    }
                });

                // Configurer les event listeners
                sync.on('syncCompleted', (data) => {
                    addLog('info', `Synchronisation terminée: ${data.result.syncedUsers} utilisateurs synchronisés`);
                });

                sync.on('syncFailed', (data) => {
                    addLog('error', `Échec synchronisation: ${data.error}`);
                });

                sync.on('conflictsDetected', (data) => {
                    addLog('warn', `${data.conflicts.length} conflits détectés`);
                });

                sync.on('conflictResolved', (data) => {
                    addLog('info', `Conflit résolu pour ${data.userId}`);
                });

                // Initialiser le système
                await sync.initialize();
                setSyncInstance(sync);
                setIsInitialized(true);
                addLog('info', 'Système de synchronisation initialisé');

            } catch (error) {
                addLog('error', `Erreur initialisation: ${error.message}`);
            }
        };

        initializeSync();

        // Cleanup
        return () => {
            if (syncInstance) {
                syncInstance.cleanup();
            }
        };
    }, []);

    const addLog = (level, message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-19), { timestamp, level, message }]);
    };

    const handleStartSync = async () => {
        if (!syncInstance) return;

        try {
            addLog('info', 'Démarrage synchronisation manuelle...');
            const result = await syncInstance.startSync({
                autoResolve: true,
                background: false
            });
            
            addLog('info', `Sync terminée: ${result.syncedUsers} utilisateurs`);
            addLog('info', `Créés: ${result.createdUsers}, Modifiés: ${result.updatedUsers}`);
            
            if (result.errors.length > 0) {
                addLog('warn', `${result.errors.length} erreurs lors de la synchronisation`);
            }

        } catch (error) {
            addLog('error', `Erreur sync: ${error.message}`);
        }
    };

    const handleForceSync = async () => {
        if (!syncInstance) return;

        try {
            addLog('info', 'Synchronisation forcée en cours...');
            const result = await syncInstance.forceSyncNow();
            addLog('info', 'Synchronisation forcée terminée');
        } catch (error) {
            addLog('error', `Erreur sync forcée: ${error.message}`);
        }
    };

    const handleGetConflicts = () => {
        if (!syncInstance) return;
        
        const conflicts = syncInstance.getPendingConflicts();
        addLog('info', `${conflicts.length} conflits en attente:`);
        conflicts.forEach(conflict => {
            addLog('info', `- ${conflict.userId} (${conflict.type})`);
        });
    };

    const handleGetMetrics = () => {
        if (!syncInstance) return;
        
        const metrics = syncInstance.getMetrics();
        addLog('info', 'Métriques:');
        addLog('info', `- Total syncs: ${metrics.totalSyncs}`);
        addLog('info', `- Succès: ${metrics.successfulSyncs}`);
        addLog('info', `- Erreurs: ${metrics.failedSyncs}`);
        addLog('info', `- Durée moyenne: ${Math.round(metrics.averageSyncTime / 1000)}s`);
    };

    const handleExportLogs = () => {
        if (!syncInstance) return;
        
        const auditLog = syncInstance.exportAuditLog('json');
        console.log('Audit Trail:', auditLog);
        addLog('info', 'Logs exportés dans la console');
    };

    if (!isInitialized) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif'
            }}>
                <div>⏳ Initialisation du système de synchronisation...</div>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1>🔄 Synchronisation Active Directory ↔ Excel</h1>
            <p>Système de synchronisation bidirectionnelle avancée avec détection de conflits</p>

            {/* Panel de contrôle principal */}
            <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h3>🎛️ Contrôles de Synchronisation</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={handleStartSync}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ▶️ Démarrer Sync
                    </button>
                    
                    <button 
                        onClick={handleForceSync}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#FF9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Sync Forcée
                    </button>
                    
                    <button 
                        onClick={handleGetConflicts}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ⚠️ Voir Conflits
                    </button>
                    
                    <button 
                        onClick={handleGetMetrics}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#9C27B0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        }
                    >
                        📊 Métriques
                    </button>
                    
                    <button 
                        onClick={handleExportLogs}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#607D8B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        📜 Export Logs
                    </button>
                </div>
            </div>

            {/* Interface React intégrable */}
            <div style={{ marginBottom: '20px' }}>
                <h3>🖥️ Interface React Intégrée</h3>
                <ReactSyncInterface />
            </div>

            {/* Historique et logs */}
            <div style={{ 
                backgroundColor: '#fafafa', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <h3>📜 Journal d'Événements</h3>
                <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}>
                    {logs.length === 0 ? (
                        <div style={{ color: '#999' }}>Aucun événement pour le moment</div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} style={{ 
                                marginBottom: '4px',
                                color: log.level === 'error' ? '#f44336' : 
                                      log.level === 'warn' ? '#ff9800' : '#333'
                            }}>
                                [{log.timestamp}] {log.level.toUpperCase()}: {log.message}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Interface React utilisant le hook personnalisé
 */
const ReactSyncInterface = () => {
    const {
        status,
        conflicts,
        metrics,
        startSync,
        resolveConflict,
        getPendingConflicts,
        isRunning,
        hasConflicts
    } = useActiveDirectorySync({
        autoSync: false, // Manuel pour l'exemple
        conflictResolution: 'keep_newer'
    });

    const handleQuickSync = async () => {
        try {
            await startSync({ autoResolve: true });
        } catch (error) {
            console.error('Erreur sync rapide:', error);
        }
    };

    const handleResolveAllConflicts = async () => {
        const pendingConflicts = getPendingConflicts();
        for (const conflict of pendingConflicts) {
            try {
                await resolveConflict(conflict.userId, {
                    action: 'keep_newer'
                });
            } catch (error) {
                console.error(`Erreur résolution conflit ${conflict.userId}:`, error);
            }
        }
    };

    return (
        <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '15px', 
            borderRadius: '6px',
            border: '1px solid #4caf50'
        }}>
            <div style={{ marginBottom: '15px' }}>
                <strong>Status:</strong> 
                <span style={{ 
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: status === SYNC_STATUS.COMPLETED ? '#4caf50' :
                                   status === SYNC_STATUS.RUNNING ? '#ff9800' :
                                   status === SYNC_STATUS.FAILED ? '#f44336' : '#757575',
                    color: 'white',
                    fontSize: '12px'
                }}>
                    {status}
                </span>
            </div>

            {hasConflicts && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                    <strong>⚠️ {conflicts.length} conflit(s) en attente</strong>
                    <button
                        onClick={handleResolveAllConflicts}
                        style={{
                            marginLeft: '10px',
                            padding: '4px 8px',
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Résoudre tous
                    </button>
                </div>
            )}

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={handleQuickSync}
                    disabled={isRunning}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isRunning ? '#ccc' : '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {isRunning ? '🔄 Sync en cours...' : '⚡ Sync Rapide'}
                </button>
            </div>

            {metrics.totalSyncs > 0 && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                    <div>📊 Syncs totales: {metrics.totalSyncs}</div>
                    <div>✅ Succès: {metrics.successfulSyncs}</div>
                    <div>❌ Erreurs: {metrics.failedSyncs}</div>
                    <div>⏱️ Durée moy: {Math.round(metrics.averageSyncTime / 1000)}s</div>
                </div>
            )}
        </div>
    );
};

/**
 * Hook personnalisé pour l'exemple
 */
const useActiveDirectorySyncExample = () => {
    const [syncState, setSyncState] = useState({
        status: SYNC_STATUS.IDLE,
        conflicts: [],
        metrics: {}
    });

    const createSyncInstance = () => {
        return new ActiveDirectorySync({
            autoSync: false,
            enableLogging: true,
            logLevel: 'debug'
        });
    };

    return {
        syncState,
        setSyncState,
        createSyncInstance
    };
};

export default ActiveDirectorySyncExample;
export { 
    ActiveDirectorySyncExample, 
    ReactSyncInterface,
    useActiveDirectorySyncExample
};