// src/components/bulk/index.js
// Export centralisé des composants d'actions groupées

// Composant principal
export { default as BulkActionsManager } from './BulkActionsManager';

// Moteur d'exécution
export { 
    default as BulkActionsEngine, 
    BulkActionResult, 
    BulkActionError, 
    AuditService 
} from './BulkActionsEngine';

// Composants d'interface spécialisés
export { default as BulkSelectionBar } from './BulkSelectionBar';
export { default as BulkActionDialog } from './BulkActionDialog';
export { 
    default as BulkProgressIndicator, 
    BulkActionCompletedIndicator,
    BULK_ACTION_STATUS 
} from './BulkProgressIndicator';
export { default as BulkErrorHandler } from './BulkErrorHandler';
export { default as BulkActionHistory } from './BulkActionHistory';

// Configuration
export { BULK_ACTIONS } from './BulkActionsManager';