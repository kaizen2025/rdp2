# 🚀 OPTIMISATIONS À APPLIQUER - Guide d'implémentation

## ⚡ PHASE 1 - CRITIQUES (À appliquer immédiatement)

### 1. CacheContext - Lazy Loading avec priorités

**Fichier:** `src/contexts/CacheContext.js`

**Remplacement des lignes 12-15:**
```javascript
// AVANT
const ENTITIES = [
    'loans', 'computers', 'excel_users', 'technicians', 'rds_sessions', 'config',
    'ad_groups:VPN', 'ad_groups:Sortants_responsables'
];

// APRÈS
const CRITICAL_ENTITIES = ['config', 'technicians']; // Chargé immédiatement
const SECONDARY_ENTITIES = ['loans', 'computers'];    // Chargé après 500ms
const LAZY_ENTITIES = ['excel_users', 'rds_sessions', 'ad_groups:VPN', 'ad_groups:Sortants_responsables']; // On-demand
const ALL_ENTITIES = [...CRITICAL_ENTITIES, ...SECONDARY_ENTITIES, ...LAZY_ENTITIES];
```

**Remplacement des lignes 76-83:**
```javascript
// AVANT
useEffect(() => {
    const initialLoad = async () => {
        setIsLoading(true);
        await Promise.all(ENTITIES.map(entity => fetchDataForEntity(entity)));
        setIsLoading(false);
    };
    initialLoad();
}, [fetchDataForEntity]);

// APRÈS
useEffect(() => {
    const initialLoad = async () => {
        setIsLoading(true);

        // 1. Charger CRITICAL immédiatement
        await Promise.all(CRITICAL_ENTITIES.map(entity => fetchDataForEntity(entity)));

        // 2. Charger SECONDARY après un court délai
        setTimeout(() => {
            Promise.all(SECONDARY_ENTITIES.map(entity => fetchDataForEntity(entity)));
        }, 500);

        // 3. LAZY sera chargé on-demand par les composants

        setIsLoading(false); // UI débloquée rapidement !
    };
    initialLoad();
}, [fetchDataForEntity]);

// Ajouter méthode pour charger lazy on-demand
const loadLazyEntity = useCallback(async (entity) => {
    if (!cache[entity]) {
        await fetchDataForEntity(entity);
    }
}, [cache, fetchDataForEntity]);
```

---

### 2. CacheContext - Mise à jour partielle WebSocket

**Ajouter cette fonction utilitaire après fetchDataForEntity:**
```javascript
/**
 * Met à jour un élément dans le cache sans re-fetch
 */
const updateCacheItem = useCallback((entity, data, action) => {
    setCache(prev => {
        const current = prev[entity];

        // Si c'est un objet simple (config), remplacer directement
        if (!Array.isArray(current)) {
            return { ...prev, [entity]: action === 'delete' ? {} : data };
        }

        // Si c'est un tableau (loans, computers, etc.)
        let updated;
        switch (action) {
            case 'create':
                updated = [...current, data];
                break;
            case 'update':
                updated = current.map(item => item.id === data.id ? data : item);
                break;
            case 'delete':
                updated = current.filter(item => item.id !== data.id);
                break;
            case 'full_refresh':
                // Fallback: si on ne peut pas faire de mise à jour partielle
                fetchDataForEntity(entity);
                return prev;
            default:
                return prev;
        }

        return { ...prev, [entity]: updated };
    });
}, [fetchDataForEntity]);
```

**Remplacement des lignes 86-99:**
```javascript
// AVANT
useEffect(() => {
    const handleDataUpdate = (payload) => {
        if (payload && payload.entity) {
            const entityToUpdate = payload.group ? `${payload.entity}:${payload.group}` : payload.entity;
            if (ENTITIES.includes(entityToUpdate)) {
                console.log(`[CacheContext] Mise à jour reçue pour: ${entityToUpdate}`);
                fetchDataForEntity(entityToUpdate); // ❌ Re-fetch complet
            }
        }
    };

    const unsubscribe = events.on('data_updated', handleDataUpdate);
    return () => unsubscribe();
}, [events, fetchDataForEntity]);

// APRÈS
useEffect(() => {
    const handleDataUpdate = (payload) => {
        if (payload && payload.entity) {
            const entityToUpdate = payload.group ? `${payload.entity}:${payload.group}` : payload.entity;

            if (ALL_ENTITIES.includes(entityToUpdate)) {
                console.log(`[CacheContext] Mise à jour reçue pour: ${entityToUpdate}`);

                // ✅ Mise à jour partielle si les données sont fournies
                if (payload.data && payload.action) {
                    updateCacheItem(entityToUpdate, payload.data, payload.action);
                } else {
                    // Fallback: re-fetch si pas de données
                    fetchDataForEntity(entityToUpdate);
                }
            }
        }
    };

    const unsubscribe = events.on('data_updated', handleDataUpdate);
    return () => unsubscribe();
}, [events, fetchDataForEntity, updateCacheItem]);
```

---

### 3. AppContext - Suppression double émission

**Fichier:** `src/contexts/AppContext.js`

**Remplacement des lignes 111-123:**
```javascript
// AVANT
ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'data_updated' && data.payload?.entity) {
            emit(`data_updated:${data.payload.entity}`, data.payload); // ❌ Double
            emit('data_updated', data.payload);                         // ❌ Double
        } else {
            emit(data.type, data.payload);
        }
    } catch (e) {
        console.error('Erreur parsing message WebSocket:', e);
    }
};

// APRÈS
ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        // ✅ Émettre une seule fois
        emit(data.type, data.payload);

        // Gestion du heartbeat
        if (data.type === 'pong') {
            clearTimeout(pongTimeoutRef.current);
        }
    } catch (e) {
        console.error('Erreur parsing message WebSocket:', e);
    }
};
```

---

### 4. AppUsersManagementPage - Modal instantané

**Fichier:** `src/pages/AppUsersManagementPage.js`

**Ajouter ces fonctions utilitaires avant le composant:**
```javascript
/**
 * Fonctions pures pour mapper les données (plus rapide)
 */
function getDefaultFormData() {
    return {
        username: '',
        email: '',
        display_name: '',
        position: '',
        is_admin: false,
        permissions: {
            can_access_dashboard: true,
            can_access_rds_sessions: false,
            can_access_servers: false,
            can_access_users: false,
            can_access_ad_groups: false,
            can_access_loans: false,
            can_access_docucortex: false,
            can_manage_users: false,
            can_manage_permissions: false,
            can_view_reports: false
        }
    };
}

function mapUserToFormData(user) {
    const permissionKeys = [
        'can_access_dashboard', 'can_access_rds_sessions', 'can_access_servers',
        'can_access_users', 'can_access_ad_groups', 'can_access_loans',
        'can_access_docucortex', 'can_manage_users', 'can_manage_permissions',
        'can_view_reports'
    ];

    return {
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        position: user.position || '',
        is_admin: user.is_admin === 1,
        permissions: Object.fromEntries(
            permissionKeys.map(key => [key, user[key] === 1])
        )
    };
}
```

**Remplacement de handleOpenDialog (lignes 104-145):**
```javascript
// AVANT
const handleOpenDialog = (user = null) => {
    if (user) {
        setEditingUser(user);
        setFormData({
            username: user.username,
            // ... 20 lignes de conversions synchrones
        });
    } else {
        setEditingUser(null);
        setFormData({
            username: '',
            // ... 15 lignes de réinitialisation
        });
    }
    setDialogOpen(true); // ❌ Exécuté APRÈS
};

// APRÈS
const handleOpenDialog = (user = null) => {
    // ✅ 1. Ouvrir immédiatement le modal
    setDialogOpen(true);
    setEditingUser(user);

    // ✅ 2. Charger les données de manière asynchrone (non-bloquant)
    requestAnimationFrame(() => {
        setFormData(user ? mapUserToFormData(user) : getDefaultFormData());
    });
};
```

---

### 5. Backend - Envoyer données partielles dans WebSocket

**Fichier:** `backend/services/dataService.js` et routes correspondantes

**Après chaque opération de modification (create/update/delete), émettre:**
```javascript
// Exemple dans createLoan
async function createLoan(loanData, technician) {
    const id = `loan_${Date.now()}`;
    // ... création du prêt

    // ✅ Émettre avec les données complètes
    wsManager.broadcast({
        type: 'data_updated',
        payload: {
            entity: 'loans',
            action: 'create', // ✅ Nouveau
            data: { id, ...loanData } // ✅ Données complètes
        }
    });

    return { success: true };
}

// Exemple dans updateLoan
async function updateLoan(loanId, loanData, technician) {
    // ... mise à jour

    wsManager.broadcast({
        type: 'data_updated',
        payload: {
            entity: 'loans',
            action: 'update',
            data: { id: loanId, ...loanData }
        }
    });
}

// Exemple dans deleteLoan
async function deleteLoan(loanId, technician) {
    // ... suppression

    wsManager.broadcast({
        type: 'data_updated',
        payload: {
            entity: 'loans',
            action: 'delete',
            data: { id: loanId }
        }
    });
}
```

---

## ⚡ PHASE 2 - IMPORTANTES (Court terme)

### 6. Debounce sur recherches

**Installer lodash si pas déjà fait:**
```bash
npm install lodash
```

**Dans tous les composants avec SearchInput:**
```javascript
import { debounce } from 'lodash';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

const debouncedSetSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 300),
    []
);

const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // ✅ Affichage immédiat
    debouncedSetSearch(e.target.value); // ✅ Filtrage différé
};

const filteredData = useMemo(() => {
    return data.filter(item =>
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
}, [data, debouncedSearch]); // ✅ Utiliser debouncedSearch
```

---

### 7. React.memo sur composants coûteux

**Exemple pour les lignes de tableau:**
```javascript
const UserRow = React.memo(({ user, onEdit, onDelete, onResetPassword }) => {
    return (
        <TableRow>
            {/* ... */}
        </TableRow>
    );
}, (prevProps, nextProps) => {
    // Ne re-render que si l'utilisateur a changé
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.updated_at === nextProps.user.updated_at;
});
```

---

### 8. Heartbeat WebSocket

**Fichier:** `src/contexts/AppContext.js`

**Ajouter après connectWebSocket:**
```javascript
const pongTimeoutRef = useRef(null);
const pingIntervalRef = useRef(null);

// Ajouter dans connectWebSocket après ws.onopen
ws.onopen = () => {
    console.log('✅ WebSocket connecté au serveur.');
    setIsOnline(true);
    showNotification('success', 'Connecté au serveur en temps réel.');
    clearTimeout(reconnectTimeoutRef.current);

    // ✅ Démarrer le heartbeat
    pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));

            // Timeout si pas de pong dans 5 secondes
            pongTimeoutRef.current = setTimeout(() => {
                console.warn('⚠️ Pas de pong reçu, connexion probablement morte');
                ws.close();
            }, 5000);
        }
    }, 30000);
};

// Ajouter dans ws.onclose
ws.onclose = () => {
    clearInterval(pingIntervalRef.current);
    clearTimeout(pongTimeoutRef.current);
    // ... reste du code
};
```

---

## 📊 ORDRE D'APPLICATION RECOMMANDÉ

1. ✅ **CacheContext - Lazy Loading** (Impact: Démarrage 5x plus rapide)
2. ✅ **AppUsersManagementPage - Modal instantané** (Impact: UX immédiate)
3. ✅ **AppContext - Suppression double émission** (Impact: -50% re-renders)
4. ✅ **CacheContext - Mise à jour partielle** (Impact: Bande passante / Perf)
5. ✅ **Backend - Données partielles WebSocket** (Requis pour #4)
6. ✅ **Debounce recherches** (Impact: Fluidité)
7. ✅ **React.memo** (Impact: Optimisation fine)
8. ✅ **Heartbeat** (Impact: Robustesse)

---

## ✅ VALIDATION

Après chaque optimisation, tester :

1. **Démarrage** : `<1s` pour voir l'interface
2. **Modal** : `<50ms` pour ouverture
3. **Recherche** : Fluide même en tapant rapidement
4. **Multi-user** : Tester avec 2 navigateurs simultanés
5. **WebSocket** : Vérifier mises à jour temps réel

---

## 🎯 MÉTRIQUES ATTENDUES

| Opération | Avant | Après |
|-----------|-------|-------|
| Démarrage app | 3-5s | <1s |
| Ouverture modal | 200-300ms | <50ms |
| Mise à jour prêt | Re-fetch 100+ items | Patch 1 item |
| Recherche (frappe) | 100ms | <16ms |
| Reconnexion WebSocket | 5s | 3s + heartbeat |

---

## 💡 NOTES IMPORTANTES

- Appliquer les optimisations UNE PAR UNE
- Tester après chaque modification
- Committer séparément chaque optimisation
- Garder un œil sur la console pour les erreurs
- Mesurer avant/après avec React DevTools Profiler
