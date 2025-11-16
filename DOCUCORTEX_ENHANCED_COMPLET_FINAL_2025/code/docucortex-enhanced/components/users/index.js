// src/components/users/index.js - EXPORT DES COMPOSANTS UTILISATEURS
// Point d'entrée centralisé pour tous les composants de gestion des utilisateurs

// Composants de gestion des utilisateurs
export { default as UserActions } from './UserActions.js';
export { default as UserCardModern } from './UserCardModern.js';
export { default as UserColorManagerOptimized } from './UserColorManagerOptimized.js';
export { default as UserDashboard } from './UserDashboard.js';
export { default as UserFilters } from './UserFilters.js';
export { default as UserInfoDialogEnhanced } from './UserInfoDialogEnhanced.js';
export { default as UsersManagementEnhanced } from './UsersManagementEnhanced.js';
export { default as UserProfileEnhancedTabs } from './UserProfileEnhancedTabs.js';

// Nouveau système de synchronisation Active Directory ↔ Excel
export { default as ActiveDirectorySync } from './ActiveDirectorySync.js';

// Énumérations et constantes
export { 
    SYNC_DIRECTION, 
    CONFLICT_TYPE, 
    CONFLICT_RESOLUTION, 
    SYNC_STATUS 
} from './ActiveDirectorySync.js';

// Configuration par défaut pour la synchronisation
export const DEFAULT_AD_SYNC_CONFIG = {
    autoSync: false,
    syncInterval: 300000, // 5 minutes
    conflictResolution: CONFLICT_RESOLUTION.KEEP_NEWER,
    batchSize: 100,
    maxRetries: 3,
    timeout: 30000,
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
        emailConflictResolution: CONFLICT_RESOLUTION.KEEP_EXCEL,
        phoneConflictResolution: CONFLICT_RESOLUTION.KEEP_AD,
        departmentConflictResolution: CONFLICT_RESOLUTION.MANUAL
    }
};

// Utilitaires de configuration
export const createADSyncInstance = (customConfig = {}) => {
    const { ActiveDirectorySync } = await import('./ActiveDirectorySync.js');
    return new ActiveDirectorySync({
        ...DEFAULT_AD_SYNC_CONFIG,
        ...customConfig
    });
};

// Hook React pour la synchronisation AD
export const useActiveDirectorySync = (config = {}) => {
    const [syncInstance, setSyncInstance] = React.useState(null);
    const [status, setStatus] = React.useState(SYNC_STATUS.IDLE);
    const [conflicts, setConflicts] = React.useState([]);
    const [metrics, setMetrics] = React.useState({});

    React.useEffect(() => {
        const sync = new ActiveDirectorySync({
            ...DEFAULT_AD_SYNC_CONFIG,
            ...config
        });

        // Écouter les événements
        sync.on('syncCompleted', (data) => {
            setStatus(SYNC_STATUS.COMPLETED);
            setMetrics(sync.getMetrics());
        });

        sync.on('syncFailed', (data) => {
            setStatus(SYNC_STATUS.FAILED);
        });

        sync.on('conflictsDetected', (data) => {
            setConflicts(data.conflicts);
            setStatus(SYNC_STATUS.CONFLICTS_PENDING);
        });

        sync.on('conflictResolved', (data) => {
            setConflicts(prev => prev.filter(c => c.userId !== data.userId));
            setMetrics(sync.getMetrics());
        });

        setSyncInstance(sync);

        return () => {
            sync.cleanup();
        };
    }, []);

    const startSync = React.useCallback(async (options = {}) => {
        if (syncInstance) {
            setStatus(SYNC_STATUS.RUNNING);
            try {
                return await syncInstance.startSync(options);
            } catch (error) {
                setStatus(SYNC_STATUS.FAILED);
                throw error;
            }
        }
    }, [syncInstance]);

    const resolveConflict = React.useCallback(async (userId, resolution) => {
        if (syncInstance) {
            return await syncInstance.resolveConflictManually(userId, resolution);
        }
    }, [syncInstance]);

    const getPendingConflicts = React.useCallback(() => {
        return syncInstance ? syncInstance.getPendingConflicts() : [];
    }, [syncInstance]);

    return {
        status,
        conflicts,
        metrics,
        startSync,
        resolveConflict,
        getPendingConflicts,
        isRunning: status === SYNC_STATUS.RUNNING,
        hasConflicts: conflicts.length > 0
    };
};

// Composant React pour l'interface de synchronisation
export const ActiveDirectorySyncPanel = ({ 
    config = {}, 
    onSyncComplete = () => {},
    onConflictDetected = () => {},
    height = '400px',
    ...props 
}) => {
    const {
        status,
        conflicts,
        metrics,
        startSync,
        resolveConflict,
        getPendingConflicts,
        isRunning,
        hasConflicts
    } = useActiveDirectorySync(config);

    React.useEffect(() => {
        if (status === SYNC_STATUS.COMPLETED) {
            onSyncComplete(metrics);
        } else if (status === SYNC_STATUS.CONFLICTS_PENDING) {
            onConflictDetected(conflicts);
        }
    }, [status, metrics, conflicts, onSyncComplete, onConflictDetected]);

    const getStatusColor = () => {
        switch (status) {
            case SYNC_STATUS.RUNNING: return '#2196F3';
            case SYNC_STATUS.COMPLETED: return '#4CAF50';
            case SYNC_STATUS.FAILED: return '#F44336';
            case SYNC_STATUS.CONFLICTS_PENDING: return '#FF9800';
            default: return '#757575';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case SYNC_STATUS.IDLE: return 'Prêt';
            case SYNC_STATUS.RUNNING: return 'Synchronisation en cours...';
            case SYNC_STATUS.COMPLETED: return 'Synchronisation terminée';
            case SYNC_STATUS.FAILED: return 'Erreur de synchronisation';
            case SYNC_STATUS.CONFLICTS_PENDING: return `${conflicts.length} conflit(s) à résoudre`;
            case SYNC_STATUS.PAUSED: return 'En pause';
            default: return status;
        }
    };

    return (
        <div 
            style={{ 
                height, 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fafafa'
            }}
            {...props}
        >
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                    Synchronisation Active Directory ↔ Excel
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                        style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(),
                            animation: status === SYNC_STATUS.RUNNING ? 'pulse 1.5s infinite' : 'none'
                        }}
                    />
                    <span style={{ color: '#666', fontSize: '14px' }}>
                        {getStatusText()}
                    </span>
                </div>
            </div>

            {status === SYNC_STATUS.CONFLICTS_PENDING && conflicts.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#FF9800' }}>
                        Conflits à résoudre ({conflicts.length})
                    </h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {conflicts.map((conflict, index) => (
                            <div 
                                key={conflict.userId || index}
                                style={{ 
                                    padding: '8px',
                                    marginBottom: '4px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                            >
                                <strong>{conflict.user?.ad?.displayName || conflict.userId}</strong>
                                <br />
                                Type: {conflict.type}
                                <br />
                                <button
                                    onClick={() => resolveConflict(conflict.userId, {
                                        action: CONFLICT_RESOLUTION.KEEP_NEWER
                                    })}
                                    style={{
                                        marginTop: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Résoudre automatiquement
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ 
                display: 'flex', 
                gap: '8px',
                marginTop: '16px'
            }}>
                <button
                    onClick={() => startSync()}
                    disabled={isRunning}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isRunning ? '#ccc' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isRunning ? 'Synchronisation...' : 'Démarrer la sync'}
                </button>

                <button
                    onClick={() => {
                        const pendingConflicts = getPendingConflicts();
                        console.log('Conflits en attente:', pendingConflicts);
                    }}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#757575',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Voir détails
                </button>
            </div>

            {metrics.totalSyncs > 0 && (
                <div style={{ 
                    marginTop: '16px',
                    fontSize: '12px',
                    color: '#666',
                    borderTop: '1px solid #e0e0e0',
                    paddingTop: '12px'
                }}>
                    <div>Total synchronisations: {metrics.totalSyncs}</div>
                    <div>Succès: {metrics.successfulSyncs}</div>
                    <div>Erreurs: {metrics.failedSyncs}</div>
                    <div>Durée moyenne: {Math.round(metrics.averageSyncTime / 1000)}s</div>
                </div>
            )}
        </div>
    );
};

// Style pour l'animation de pulsation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);