# 🔍 ANALYSE APPROFONDIE DE PERFORMANCE - RDS Viewer
**Date:** 2025-11-13
**Contexte:** Application portable multi-utilisateurs en temps réel

---

## 📊 PROBLÈMES IDENTIFIÉS

### 🔴 CRITIQUE - Chargement initial bloquant

**Fichier:** `src/contexts/CacheContext.js:76-83`

**Problème:**
```javascript
useEffect(() => {
    const initialLoad = async () => {
        setIsLoading(true);
        // ❌ Charge TOUT en parallèle au démarrage
        await Promise.all(ENTITIES.map(entity => fetchDataForEntity(entity)));
        setIsLoading(false);
    };
    initialLoad();
}, [fetchDataForEntity]);
```

**Impact:**
- ❌ Bloque l'UI pendant 2-5 secondes au démarrage
- ❌ Charge des données inutiles (ex: AD groups si pas sur cette page)
- ❌ 8+ requêtes HTTP simultanées créent de la congestion

**Solution:** Lazy loading + priorités
```javascript
// Charger uniquement ce qui est nécessaire immédiatement
const CRITICAL_ENTITIES = ['config', 'technicians'];
const SECONDARY_ENTITIES = ['loans', 'computers', 'excel_users'];
const LAZY_ENTITIES = ['rds_sessions', 'ad_groups:VPN', 'ad_groups:Sortants_responsables'];

// Charger en cascade avec priorités
1. CRITICAL (immédiat)
2. SECONDARY (après 500ms)
3. LAZY (on-demand uniquement)
```

---

### 🔴 CRITIQUE - Re-fetch complet au lieu de mise à jour partielle

**Fichier:** `src/contexts/CacheContext.js:86-99`

**Problème:**
```javascript
const handleDataUpdate = (payload) => {
    if (payload && payload.entity) {
        // ❌ Re-charge TOUTE la liste pour une seule modification
        fetchDataForEntity(entityToUpdate);
    }
};
```

**Impact:**
- ❌ Si un prêt est modifié, on re-charge les 100+ prêts
- ❌ Gaspillage de bande passante
- ❌ Latence perçue par l'utilisateur

**Solution:** Mise à jour partielle
```javascript
const handleDataUpdate = (payload) => {
    if (payload.data) {
        // ✅ Mise à jour directe des données dans le cache
        setCache(prev => ({
            ...prev,
            [payload.entity]: updateCacheItem(prev[payload.entity], payload.data, payload.action)
        }));
    }
};

function updateCacheItem(currentData, newData, action) {
    switch (action) {
        case 'create':
            return Array.isArray(currentData) ? [...currentData, newData] : currentData;
        case 'update':
            return Array.isArray(currentData)
                ? currentData.map(item => item.id === newData.id ? newData : item)
                : currentData;
        case 'delete':
            return Array.isArray(currentData)
                ? currentData.filter(item => item.id !== newData.id)
                : currentData;
        default:
            return currentData;
    }
}
```

---

### 🟡 IMPORTANT - Latence d'ouverture des modals

**Fichier:** `src/pages/AppUsersManagementPage.js:104-140`

**Problème:**
```javascript
const handleOpenDialog = (user = null) => {
    if (user) {
        // ❌ 10+ conversions synchrones bloquent le thread principal
        setFormData({
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            position: user.position || '',
            is_admin: user.is_admin === 1,
            permissions: {
                can_access_dashboard: user.can_access_dashboard === 1,
                can_access_rds_sessions: user.can_access_rds_sessions === 1,
                can_access_servers: user.can_access_servers === 1,
                can_access_users: user.can_access_users === 1,
                can_access_ad_groups: user.can_access_ad_groups === 1,
                can_access_loans: user.can_access_loans === 1,
                can_access_docucortex: user.can_access_docucortex === 1,
                can_manage_users: user.can_manage_users === 1,
                can_manage_permissions: user.can_manage_permissions === 1,
                can_view_reports: user.can_view_reports === 1
            }
        });
    }
    setDialogOpen(true); // ❌ Exécuté APRÈS les calculs
};
```

**Impact:**
- ❌ Délai de 100-300ms avant ouverture du modal
- ❌ "Lag" perçu par l'utilisateur

**Solution:** Ouvrir d'abord, charger après
```javascript
const handleOpenDialog = (user = null) => {
    // ✅ 1. Ouvrir immédiatement le modal
    setDialogOpen(true);
    setEditingUser(user);

    // ✅ 2. Charger les données de manière asynchrone
    requestAnimationFrame(() => {
        if (user) {
            setFormData(mapUserToFormData(user));
        } else {
            setFormData(getDefaultFormData());
        }
    });
};

// Fonctions pures pour mapper les données
function mapUserToFormData(user) {
    return {
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        position: user.position || '',
        is_admin: user.is_admin === 1,
        permissions: mapUserPermissions(user)
    };
}

function mapUserPermissions(user) {
    const permissionKeys = [
        'can_access_dashboard', 'can_access_rds_sessions', 'can_access_servers',
        'can_access_users', 'can_access_ad_groups', 'can_access_loans',
        'can_access_docucortex', 'can_manage_users', 'can_manage_permissions',
        'can_view_reports'
    ];

    return Object.fromEntries(
        permissionKeys.map(key => [key, user[key] === 1])
    );
}
```

---

### 🟡 IMPORTANT - Double émission d'événements WebSocket

**Fichier:** `src/contexts/AppContext.js:114-117`

**Problème:**
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'data_updated' && data.payload?.entity) {
        emit(`data_updated:${data.payload.entity}`, data.payload); // ❌ Émission 1
        emit('data_updated', data.payload);                         // ❌ Émission 2
    }
};
```

**Impact:**
- ❌ Chaque mise à jour déclenche 2× le re-fetch
- ❌ Double travail inutile

**Solution:** Émettre une seule fois
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'data_updated' && data.payload?.entity) {
        // ✅ Émettre uniquement l'événement générique
        emit('data_updated', data.payload);
    } else {
        emit(data.type, data.payload);
    }
};
```

---

### 🟢 AMÉLIORATION - Pas de debounce sur les recherches

**Fichier:** Composants avec SearchInput

**Problème:**
- ❌ Chaque frappe déclenche un re-render
- ❌ Pas de debounce pour limiter les calculs

**Solution:** Debounce de 300ms
```javascript
import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

const debouncedSetSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 300),
    []
);

const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSetSearch(e.target.value);
};

// Utiliser debouncedSearch pour filtrer
const filteredData = useMemo(() => {
    return data.filter(item =>
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
}, [data, debouncedSearch]);
```

---

### 🟢 AMÉLIORATION - Pas de virtualisation pour grandes listes

**Fichiers:** Tables avec 100+ lignes

**Problème:**
- ❌ Render de TOUS les éléments même si invisibles
- ❌ Ralentissement avec 500+ prêts

**Solution:** react-window
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
    height={600}
    itemCount={filteredData.length}
    itemSize={50}
    width="100%"
>
    {({ index, style }) => (
        <div style={style}>
            <UserRow user={filteredData[index]} />
        </div>
    )}
</FixedSizeList>
```

---

## 🎯 OPTIMISATIONS MULTI-UTILISATEURS

### 1. Gestion des conflits de modification

**Problème actuel:**
- ❌ Aucune gestion de verrouillage optimiste
- ❌ Deux utilisateurs peuvent modifier le même prêt simultanément

**Solution:** Versioning optimiste
```javascript
// Ajouter un champ 'version' à chaque enregistrement
{
    id: 'loan_123',
    version: 5,
    data: { ... }
}

// Lors de la modification
async function updateLoan(loanId, newData, currentVersion) {
    const result = await apiService.updateLoan(loanId, {
        ...newData,
        expectedVersion: currentVersion
    });

    if (result.conflict) {
        // Afficher un modal de conflit
        showConflictDialog(result.serverData);
    }
}
```

### 2. Notifications de présence

**Ajouter:**
- ✅ Indicateur "Qui est en train de modifier ce prêt ?"
- ✅ Badge de "lock" temporaire (30 secondes)

```javascript
// WebSocket message
{
    type: 'user_editing',
    payload: {
        entityType: 'loan',
        entityId: 'loan_123',
        userId: 'kevin_bivia',
        userName: 'Kevin BIVIA'
    }
}
```

### 3. Synchronisation robuste

**Ajouter heartbeat WebSocket:**
```javascript
// Ping toutes les 30 secondes
setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);

// Pong timeout detection
let pongTimeout;
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pong') {
        clearTimeout(pongTimeout);
    }
};
```

---

## 📈 MÉTRIQUES CIBLES

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Démarrage initial | 3-5s | <1s |
| Ouverture modal | 200-300ms | <50ms |
| Recherche (frappe) | 100ms/frappe | <16ms (60fps) |
| Mise à jour WebSocket | Re-fetch complet | Patch partiel |
| Liste 500+ items | Tout rendu | Virtualisé |

---

## 🚀 PLAN D'ACTION PRIORITAIRE

### Phase 1 - CRITIQUE (Immédiat)
1. ✅ Lazy loading du cache (CRITICAL → SECONDARY → LAZY)
2. ✅ Mise à jour partielle WebSocket (pas de re-fetch)
3. ✅ Optimisation ouverture modals (requestAnimationFrame)
4. ✅ Suppression double émission WebSocket

### Phase 2 - IMPORTANT (Court terme)
5. ✅ Debounce sur recherches
6. ✅ Virtualisation des grandes listes
7. ✅ Heartbeat WebSocket robuste

### Phase 3 - AMÉLIORATION (Moyen terme)
8. ✅ Versioning optimiste (conflits)
9. ✅ Indicateurs de présence
10. ✅ Métriques de performance (monitoring)

---

## 💡 RECOMMANDATIONS ARCHITECTURE

### 1. Séparer le cache par domaine
Au lieu d'un seul CacheContext, créer :
- `LoansCache`
- `ComputersCache`
- `UsersCache`

Avantage : Re-renders isolés, meilleure performance

### 2. Implémenter React.memo sur composants coûteux
```javascript
const UserRow = React.memo(({ user, onEdit, onDelete }) => {
    // ...
}, (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.version === nextProps.user.version;
});
```

### 3. Utiliser useMemo pour calculs coûteux
```javascript
const filteredAndSortedLoans = useMemo(() => {
    return loans
        .filter(loan => loan.status === filterStatus)
        .sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate));
}, [loans, filterStatus]);
```

---

## ✅ RÉSUMÉ

**Problèmes majeurs:**
- 🔴 Chargement initial bloquant (3-5s)
- 🔴 Re-fetch complet au lieu de mise à jour partielle
- 🟡 Latence modals (200-300ms)
- 🟡 Double émission WebSocket
- 🟢 Pas de debounce/virtualisation

**Impact utilisateur actuel:**
- ⏱️ Application semble "lente"
- 😟 Clics sur boutons pas instantanés
- 🔄 Rechargements complets fréquents

**Après optimisations:**
- ⚡ Démarrage <1s
- 🚀 Modals instantanés (<50ms)
- 🎯 Mises à jour partielles temps réel
- 💪 Support multi-utilisateurs robuste
