// src/components/users/ActiveDirectorySync.types.ts - TYPES TYPESCRIPT
// Définitions de types pour la synchronisation AD ↔ Excel

export enum SYNC_DIRECTION {
    AD_TO_EXCEL = 'ad_to_excel',
    EXCEL_TO_AD = 'excel_to_ad',
    BIDIRECTIONAL = 'bidirectional'
}

export enum CONFLICT_TYPE {
    FIELD_MISMATCH = 'field_mismatch',
    TIMESTAMP_CONFLICT = 'timestamp_conflict',
    MISSING_RECORD = 'missing_record',
    DUPLICATE_RECORD = 'duplicate_record'
}

export enum CONFLICT_RESOLUTION {
    KEEP_AD = 'keep_ad',
    KEEP_EXCEL = 'keep_excel',
    KEEP_NEWER = 'keep_newer',
    MANUAL = 'manual'
}

export enum SYNC_STATUS {
    IDLE = 'idle',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CONFLICTS_PENDING = 'conflicts_pending'
}

// Interfaces de base
export interface ADUser {
    dn: string;
    userPrincipalName?: string;
    samAccountName?: string;
    displayName?: string;
    givenName?: string;
    sn?: string;
    mail?: string;
    telephoneNumber?: string;
    mobile?: string;
    department?: string;
    title?: string;
    manager?: string;
    userAccountControl?: number;
    whenCreated?: string;
    whenChanged?: string;
    accountExpires?: string;
    lastLogon?: number;
    memberOf?: string[];
    isActive?: boolean;
    isDisabled?: boolean;
    hasPasswordExpired?: boolean;
    isAdmin?: boolean;
}

export interface ExcelUser {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    mobile?: string;
    department?: string;
    title?: string;
    active?: boolean;
    lastModified?: string;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Conflits
export interface FieldConflict {
    field: string;
    adField: string;
    adValue: any;
    excelValue: any;
    resolution: CONFLICT_RESOLUTION;
    priority: number;
    timestamp: string;
}

export interface SyncConflict {
    type: CONFLICT_TYPE;
    userId: string;
    user: {
        ad: ADUser | ExcelUser | null;
        excel: ADUser | ExcelUser | null;
    };
    conflicts?: FieldConflict[];
    timestamp: string;
    resolution?: ConflictResolution;
    resolvedAt?: string;
}

export interface ConflictResolution {
    action: 'update_excel' | 'create_in_excel' | 'create_in_ad' | 'mark_inactive' | 'skip' | 'no_change';
    fields?: Record<string, any>;
    userData?: ADUser | ExcelUser;
    reason: string;
}

// Résultats de synchronisation
export interface SyncResult {
    syncedUsers: number;
    createdUsers: number;
    updatedUsers: number;
    deactivatedUsers: number;
    conflictsResolved: number;
    errors: SyncError[];
}

export interface SyncError {
    userId?: string;
    conflict?: SyncConflict;
    error: string;
    type: 'create' | 'update' | 'deactivate';
}

// Configuration
export interface SyncConfiguration {
    autoSync: boolean;
    syncInterval: number;
    conflictResolution: CONFLICT_RESOLUTION;
    batchSize: number;
    maxRetries: number;
    timeout: number;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    fieldMappings: Record<string, string>;
    conflictRules: Record<string, CONFLICT_RESOLUTION>;
    adConfig?: ADConfiguration;
}

export interface ADConfiguration {
    ldapUrl: string;
    domain: string;
    bindDN: string;
    bindCredentials: string;
    ouBase: string;
    autoSync: boolean;
    syncInterval: number;
    retryAttempts: number;
    timeout: number;
    enabled: boolean;
    fieldMappings: Record<string, string>;
}

// Métriques
export interface SyncMetrics {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflictsResolved: number;
    conflictsManual: number;
    lastSyncDuration: number;
    averageSyncTime: number;
    status: SYNC_STATUS;
    isRunning: boolean;
    cacheSize: {
        adUsers: number;
        excelUsers: number;
    };
    pendingConflicts: number;
    lastSync: string | null;
}

// Événements
export interface SyncEventData {
    syncId: string;
    duration: number;
    timestamp: string;
}

export interface SyncCompletedEvent extends SyncEventData {
    result: SyncResult;
    conflictsResolved: number;
}

export interface SyncFailedEvent extends SyncEventData {
    error: string;
}

export interface ConflictsDetectedEvent {
    conflicts: SyncConflict[];
    autoResolved: SyncConflict[];
}

export interface ConflictResolvedEvent {
    userId: string;
    resolution: ConflictResolution;
    result: any;
}

// Hook React
export interface UseActiveDirectorySyncReturn {
    status: SYNC_STATUS;
    conflicts: SyncConflict[];
    metrics: SyncMetrics;
    startSync: (options?: SyncOptions) => Promise<SyncResult>;
    resolveConflict: (userId: string, resolution: ConflictResolution) => Promise<any>;
    getPendingConflicts: () => SyncConflict[];
    isRunning: boolean;
    hasConflicts: boolean;
}

export interface SyncOptions {
    autoResolve?: boolean;
    background?: boolean;
    force?: boolean;
}

// API du composant
export interface ActiveDirectorySyncAPI {
    initialize(): Promise<boolean>;
    startSync(options?: SyncOptions): Promise<SyncResult>;
    stopBackgroundSync(): void;
    startBackgroundSync(): void;
    resolveConflictManually(userId: string, resolution: ConflictResolution): Promise<any>;
    getPendingConflicts(): SyncConflict[];
    getMetrics(): SyncMetrics;
    updateConfiguration(config: Partial<SyncConfiguration>): void;
    getConfiguration(): SyncConfiguration;
    cleanup(): Promise<void>;
    getSyncStatus(): Promise<SyncStatus>;
    forceSyncNow(): Promise<SyncResult>;
    pauseSync(): void;
    resumeSync(): void;
    getSyncHistory(limit?: number): SyncHistoryEntry[];
    exportAuditLog(format?: 'json' | 'csv'): string | SyncHistoryEntry[];
    
    // Event handling
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    emit(event: string, data: any): void;
}

// Historique
export interface SyncHistoryEntry {
    syncId: string;
    duration: number;
    timestamp: string;
    status: string;
    result: SyncResult;
    metrics: SyncMetrics;
}

// Audit Trail
export interface AuditLogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}

// Props du composant React
export interface ActiveDirectorySyncPanelProps {
    config?: Partial<SyncConfiguration>;
    onSyncComplete?: (metrics: SyncMetrics) => void;
    onConflictDetected?: (conflicts: SyncConflict[]) => void;
    height?: string;
    className?: string;
    style?: React.CSSProperties;
}

// Props de l'exemple
export interface ActiveDirectorySyncExampleProps {
    showControls?: boolean;
    showLogs?: boolean;
    showMetrics?: boolean;
    height?: string;
}

// Mock data for testing
export interface MockADUserData {
    dn: string;
    userPrincipalName: string;
    samAccountName: string;
    displayName: string;
    givenName: string;
    sn: string;
    mail: string;
    telephoneNumber?: string;
    mobile?: string;
    department?: string;
    title?: string;
    userAccountControl: number;
    memberOf: string[];
}

export interface MockExcelUserData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    mobile?: string;
    department?: string;
    title?: string;
    active: boolean;
    lastModified: string;
}

// Export de la classe avec types
declare class ActiveDirectorySync {
    constructor(config?: Partial<SyncConfiguration>);
    
    // Properties
    config: SyncConfiguration;
    status: SYNC_STATUS;
    isRunning: boolean;
    metrics: SyncMetrics;
    
    // Methods (définies dans la classe principale)
    initialize(): Promise<boolean>;
    startSync(options?: SyncOptions): Promise<SyncResult>;
    stopBackgroundSync(): void;
    startBackgroundSync(): void;
    resolveConflictManually(userId: string, resolution: ConflictResolution): Promise<any>;
    getPendingConflicts(): SyncConflict[];
    getMetrics(): SyncMetrics;
    updateConfiguration(config: Partial<SyncConfiguration>): void;
    getConfiguration(): SyncConfiguration;
    cleanup(): Promise<void>;
    getSyncStatus(): Promise<SyncStatus>;
    forceSyncNow(): Promise<SyncResult>;
    pauseSync(): void;
    resumeSync(): void;
    getSyncHistory(limit?: number): SyncHistoryEntry[];
    exportAuditLog(format?: 'json' | 'csv'): string | SyncHistoryEntry[];
    
    // Event handling
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    emit(event: string, data: any): void;
}

export default ActiveDirectorySync;