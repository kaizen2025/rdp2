# Synchronisation Bidirectionnelle Active Directory ↔ Excel

## Vue d'ensemble

Le système `ActiveDirectorySync` fournit une synchronisation bidirectionnelle complète entre Active Directory et Excel/API DocuCortex avec gestion avancée des conflits et interface de résolution.

## Fonctionnalités Principales

### ✅ Synchronisation Bidirectionnelle
- **AD → Excel**: Synchronise les utilisateurs Active Directory vers Excel/API
- **Excel → AD**: Synchronise les utilisateurs Excel vers Active Directory
- **Bidirectionnelle**: Synchronisation complète dans les deux sens

### ⚠️ Détection Automatique des Conflits
- **Conflits de champs**: Détection des différences entre les valeurs AD et Excel
- **Conflits temporels**: Gestion des timestamps et versions
- **Enregistrements manquants**: Identification des utilisateurs présents dans une source mais pas l'autre
- **Enregistrements dupliqués**: Détection des doublons

### 🎛️ Interface de Résolution des Conflits
- **Résolution automatique**: Basée sur des règles configurables
- **Résolution manuelle**: Interface utilisateur pour décisions manuelles
- **Stratégies configurables**:
  - `KEEP_AD`: Prendre la valeur Active Directory
  - `KEEP_EXCEL`: Prendre la valeur Excel
  - `KEEP_NEWER`: Prendre la valeur la plus récente
  - `MANUAL`: Résolution manuelle requise

### 🔄 Synchronisation en Arrière-plan
- **Non-bloquant**: Ne bloque pas l'interface utilisateur
- **Automatique**: Synchronisation programmée configurable
- **Monitoring**: Suivi en temps réel du statut
- **Gestion des erreurs**: Reprise automatique en cas d'échec

### 📜 Logs Détaillés et Audit Trail
- **Logging structuré**: Niveaux debug, info, warn, error
- **Audit trail complet**: Historique de toutes les opérations
- **Métriques détaillées**: Performance et statistiques
- **Export**: Logs exportables en JSON/CSV

## Utilisation

### Initialisation Basique

```javascript
import { ActiveDirectorySync } from './components/users/index.js';

// Configuration de base
const adSync = new ActiveDirectorySync({
    autoSync: true,
    syncInterval: 300000, // 5 minutes
    conflictResolution: 'keep_newer'
});

// Initialisation
await adSync.initialize();
```

### Démarrage Manuel

```javascript
// Synchronisation immédiate
const result = await adSync.startSync({
    autoResolve: true,    // Résoudre automatiquement les conflits possibles
    background: false     // Synchronisation manuelle
});

console.log('Résultat:', result);
```

### Gestion des Événements

```javascript
// Écouter les événements de synchronisation
adSync.on('syncCompleted', (data) => {
    console.log('Sync terminée:', data);
});

adSync.on('conflictsDetected', (data) => {
    console.log('Conflits détectés:', data.conflicts);
});

adSync.on('syncFailed', (data) => {
    console.error('Erreur sync:', data.error);
});
```

### Résolution Manuelle des Conflits

```javascript
// Obtenir les conflits en attente
const conflicts = adSync.getPendingConflicts();

// Résoudre un conflit manuellement
await adSync.resolveConflictManually('user@example.com', {
    fields: {
        email: 'keep_excel',
        firstName: 'keep_ad',
        department: 'custom'
    },
    customValues: {
        department: 'IT Department'
    }
});
```

## Configuration

### Configuration Complète

```javascript
const config = {
    // Synchronisation
    autoSync: false,
    syncInterval: 300000, // 5 minutes
    batchSize: 100,
    maxRetries: 3,
    timeout: 30000,
    
    // Logging
    enableLogging: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    
    // Résolution des conflits
    conflictResolution: 'keep_newer',
    conflictRules: {
        emailConflictResolution: 'keep_excel',
        phoneConflictResolution: 'keep_ad',
        departmentConflictResolution: 'manual'
    },
    
    // Mapping des champs
    fieldMappings: {
        'firstName': 'givenName',
        'lastName': 'sn',
        'email': 'mail',
        'phone': 'telephoneNumber',
        'mobile': 'mobile',
        'department': 'department',
        'title': 'title'
    }
};

const adSync = new ActiveDirectorySync(config);
```

### Mise à Jour de Configuration

```javascript
// Mettre à jour la configuration
adSync.updateConfiguration({
    autoSync: true,
    conflictResolution: 'keep_ad'
});
```

## Intégration React

### Hook Personnalisé

```javascript
import { useActiveDirectorySync } from './components/users/index.js';

function SyncComponent() {
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
        autoSync: true,
        syncInterval: 600000 // 10 minutes
    });

    return (
        <div>
            <p>Status: {status}</p>
            <p>Conflits: {conflicts.length}</p>
            <button onClick={startSync} disabled={isRunning}>
                Démarrer la Sync
            </button>
        </div>
    );
}
```

### Composant Interface

```javascript
import { ActiveDirectorySyncPanel } from './components/users/index.js';

function SyncDashboard() {
    const handleSyncComplete = (metrics) => {
        console.log('Sync terminée avec succès', metrics);
    };

    const handleConflictDetected = (conflicts) => {
        console.log('Conflits détectés', conflicts);
        // Afficher une notification ou modal
    };

    return (
        <ActiveDirectorySyncPanel
            config={{
                autoSync: true,
                conflictResolution: 'keep_newer'
            }}
            onSyncComplete={handleSyncComplete}
            onConflictDetected={handleConflictDetected}
            height="500px"
        />
    );
}
```

## API et Méthodes

### Méthodes Principales

#### `startSync(options)`
Démarre une synchronisation manuelle.

**Options:**
- `autoResolve` (bool): Résoudre automatiquement les conflits possibles
- `background` (bool): Synchronisation en arrière-plan

**Retourne:** Promise avec le résultat de synchronisation

#### `resolveConflictManually(userId, resolution)`
Résout manuellement un conflit.

**Paramètres:**
- `userId` (string): Identifiant de l'utilisateur
- `resolution` (object): Résolution du conflit

#### `getPendingConflicts()`
Retourne la liste des conflits en attente de résolution manuelle.

#### `getMetrics()`
Retourne les métriques et statistiques de synchronisation.

### Événements

#### `syncCompleted`
Émis à la fin d'une synchronisation réussie.

#### `syncFailed`
Émis en cas d'échec de synchronisation.

#### `conflictsDetected`
Émis quand des conflits sont détectés.

#### `conflictResolved`
Émis quand un conflit est résolu.

#### `syncPaused` / `syncResumed`
Émis lors de la mise en pause/reprise.

## Intégration avec DocuCortex

Le système s'intègre parfaitement avec l'API DocuCortex existante :

```javascript
// Utilisation avec apiService.js
const adSync = new ActiveDirectorySync();

// Les opérations utilisent automatiquement apiService :
// - getUsers() pour récupérer les utilisateurs Excel
// - updateUser() pour mettre à jour
// - createUser() pour créer
// - etc.
```

## Gestion des Erreurs

### Stratégie de Reprise

```javascript
// Configuration de la reprise automatique
const config = {
    maxRetries: 3,
    timeout: 30000,
    retryAttempts: 3
};

// Le système gère automatiquement :
// - Timeouts de connexion
// - Erreurs temporaires
// - Reconnexions AD
```

### Gestion des Logs

```javascript
// Les logs sont sauvegardés automatiquement
// dans localStorage pour audit

// Récupérer les logs d'audit
const auditLog = adSync.exportAuditLog('json');
console.log('Audit trail:', auditLog);
```

## Performance et Optimisation

### Batch Processing
- Traitement par lots pour éviter la surcharge
- Configuration de la taille de lot via `batchSize`

### Cache Intelligent
- Cache des données AD et Excel
- Mise à jour sélective
- Gestion automatique du cache

### Synchronisation Incrémentale
- Synchronisation basée sur les timestamps
- Réduction du temps de traitement
- Optimisation de la bande passante

## Sécurité

### Authentification
- Intégration native avec Active Directory
- Support Kerberos/SPNEGO
- Gestion des tokens sécurisés

### Audit Trail
- Logs complets de toutes les opérations
- Traçabilité des modifications
- Export pour audit externe

## Dépannage

### Problèmes Courants

#### Connexion AD Échoue
```javascript
// Vérifier la configuration AD
const health = await adSync.adConnector.healthCheck();
console.log('Santé AD:', health);
```

#### Conflits Persistants
```javascript
// Réviser les règles de résolution
adSync.updateConfiguration({
    conflictRules: {
        emailConflictResolution: 'keep_ad',
        phoneConflictResolution: 'keep_excel'
    }
});
```

#### Performance Lente
```javascript
// Réduire la taille des lots
adSync.updateConfiguration({
    batchSize: 50,  // Réduire de 100 à 50
    syncInterval: 600000  // Augmenter l'intervalle
});
```

## Métriques et Monitoring

### Métriques Disponibles
- `totalSyncs`: Nombre total de synchronisations
- `successfulSyncs`: Synchronisations réussies
- `failedSyncs`: Synchronisations échouées
- `conflictsResolved`: Conflits résolus automatiquement
- `conflictsManual`: Conflits résolus manuellement
- `lastSyncDuration`: Durée de la dernière sync
- `averageSyncTime`: Durée moyenne

### Dashboard de Monitoring

```javascript
// Affichage en temps réel
const metrics = adSync.getMetrics();
console.log('Tableau de bord:', {
    Status: metrics.status,
    'Syncs totales': metrics.totalSyncs,
    'Taux de succès': `${Math.round((metrics.successfulSyncs / metrics.totalSyncs) * 100)}%`,
    'Conflits en attente': metrics.pendingConflicts,
    'Dernière sync': metrics.lastSync
});
```

## Roadmap et Évolutions

### Prochaines Fonctionnalités
- [ ] Synchronisation des groupes AD
- [ ] Support multi-domaines
- [ ] Synchronisation bidirectionnelle des mots de passe
- [ ] Interface web de gestion avancée
- [ ] API REST pour gestion externe
- [ ] Alertes email pour conflits critiques
- [ ] Intégration avec d'autres sources (LDAP, CSV, etc.)

### Améliorations Prévues
- [ ] Algorithmes de résolution de conflits plus sophistiqués
- [ ] Machine Learning pour prédire les résolutions
- [ ] Synchronisation temps réel (WebSockets)
- [ ] Interface de visualisation des conflits
- [ ] Templates de configuration
- [ ] Export/import de configurations

---

**Documentation générée le 15/11/2025 - Phase 1 - SyncADBirectionnelle**