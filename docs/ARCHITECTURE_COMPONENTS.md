# Architecture des Composants React - DocuCortex AI

## 📋 Vue d'ensemble

Cette documentation analyse l'architecture des composants React avancés du système DocuCortex AI, une plateforme de gestion d'inventaire et de prêts d'équipements avec intégration IA.

## 🏗️ Structure des composants

### Organisation hiérarchique

```
src/components/
├── common/           # Composants réutilisables
├── auth/            # Composants d'authentification
├── dashboard/       # Composants du tableau de bord
├── loan-management/ # Gestion des prêts
├── user-management/ # Gestion des utilisateurs
├── sessions/        # Gestion des sessions
├── inventory/       # Gestion d'inventaire
├── server-monitoring/ # Monitoring serveurs
├── AI/              # Composants IA
└── settings/        # Paramètres
```

## 🎯 Patterns de composants fondamentales

### 1. **LoadingScreen** - Skeletons modernes

**Localisation:** `src/components/common/LoadingScreen.js`

**Architecture:**
- **Pattern:** Factory Pattern avec composants spécialisés
- **Types de skeletons:**
  - `TableSkeleton` - Tableaux avec lignes dynamiques
  - `CardSkeleton` - Grilles de cartes responsives
  - `DashboardSkeleton` - Layout dashboard complexe
  - `ListSkeleton` - Listes avec avatars et actions
  - `FormSkeleton` - Formulaires avec champs

**Caractéristiques:**
- Réutilisable via la propriété `type`
- Utilise Material-UI Skeleton
- Responsive avec breakpoints Material-UI
- Animation fluide et réaliste

### 2. **ErrorBoundary** - Gestion d'erreurs

**Localisation:** `src/components/common/ErrorBoundary.js`

**Architecture:**
- **Pattern:** Higher-Order Component (HOC) pattern
- **Fonctionnalités:**
  - Capture des erreurs JavaScript
  - Interface utilisateur d'erreur stylée
  - Détails en mode développement uniquement
  - Bouton de rechargement

### 3. **Toast** - Système de notifications

**Localisation:** `src/components/common/Toast.js`

**Architecture:**
- **Pattern:** Configuration-driven avec icon mapping
- **Transitions:** Slide et Grow animations
- **Types:** success, error, warning, info
- **Persistance:** Auto-hide configurable

### 4. **PermissionGate** - Contrôle d'accès

**Localisation:** `src/components/auth/PermissionGate.js`

**Architecture:**
- **Pattern:** Render props avec logique conditionnelle
- **Stratégies de permissions:**
  - Permission unique (`permission`)
  - Au moins une permission (`anyOf`)
  - Toutes les permissions (`allOf`)
- **Fallback configurable**

### 5. **ProtectedRoute** - Protection de routes

**Localisation:** `src/components/auth/ProtectedRoute.js`

**Architecture:**
- **Pattern:** Route guard avec redirections
- **Vérifications:**
  - Authentification utilisateur
  - Permissions requises
  - Fallback UI personnalisé
- **Redirection automatique vers login**

## 🎨 Patterns UI/UX

### 1. **ThemeModeContext** - Gestion des thèmes

**Localisation:** `src/contexts/ThemeModeContext.js`

**Architecture:**
- **Pattern:** Context API avec persist localStorage
- **Auto-détection:** Préférence système utilisateur
- **Palette personnalisée:** Mode sombre et clair
- **Component overrides:** Material-UI customisé

```javascript
// Configuration personnalisée
const theme = createTheme({
    palette: {
        mode,
        primary: { main: '#2196f3' },
        background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5'
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', borderRadius: 8 }
            }
        }
    }
});
```

### 2. **ThemeModeToggle** - Toggle interface

**Localisation:** `src/components/ThemeModeToggle.js`

**Architecture:**
- **Pattern:** Hook consumer avec IconButton
- **Iconographie dynamique:** Basée sur le mode actuel
- **Tooltip contextuel:** Indications utilisateur

## 🔧 Hooks personnalisés

### 1. **usePermissions** - Gestion des permissions

**Localisation:** `src/hooks/usePermissions.js`

**Architecture:**
- **Pattern:** Custom hook avec service delegation
- **Méthodes disponibles:**
  - `hasPermission(permission)`
  - `hasAnyPermission(permissions[])`
  - `hasAllPermissions(permissions[])`
  - `getAccessibleModules()`
  - `canAccessModule(moduleId)`

**Intégration:**
- Utilise `AppContext` pour les données utilisateur
- Délègue au `permissionService`
- Mémorisation avec `useMemo` pour performance

### 2. **useUnreadMessages** - Messages non lus

**Localisation:** `src/hooks/useUnreadMessages.js`

**Architecture:**
- **Pattern:** Event-driven avec localStorage persistence
- **Fonctionnalités:**
  - Calcul automatique des messages non lus
  - Événements en temps réel via AppContext
  - Persistance des timestamps de lecture
  - Marquage de canaux comme lus

## 📊 Composants spécialisés par domaine

### 1. **DashboardWidgets** - Tableau de bord interactif

**Localisation:** `src/components/dashboard/DashboardWidgets.js`

**Architecture:**
- **Librairie:** react-grid-layout pour drag & drop
- **Fonctionnalités:**
  - Widgets redimensionnables
  - Drag & drop interface
  - Persistance layout en localStorage
  - Widgets refreshables
  - Responsive grid system

**Breakpoints:**
```javascript
breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
```

### 2. **ChatInterface** - Interface IA

**Localisation:** `src/components/AI/ChatInterface.js`

**Architecture:**
- **Pattern:** State management complexe avec hooks
- **Fonctionnalités:**
  - Historique des conversations
  - Messages temps réel
  - Indicateurs de confiance
  - Avatar utilisateur/bot
  - Scroll automatique

**États gérés:**
- Messages utilisateur/bot
- État de chargement
- Historique persistant
- Métadonnées (confiance, documents utilisés)

### 3. **LoanList** - Gestion des prêts

**Localisation:** `src/components/loan-management/LoanList.js`

**Architecture:**
- **Pattern:** Filterable list avec pagination
- **Intégrations:**
  - `useCache` pour performance
  - `useApp` pour notifications
  - `SearchInput` component
  - Dialog system modulaire

**Filtrage:**
```javascript
const filteredLoans = useMemo(() => {
    let result = [...loans];
    if (statusFilter !== 'all') {
        if (statusFilter === 'active_ongoing') {
            result = result.filter(l => ['active', 'overdue', 'critical', 'reserved'].includes(l.status));
        }
        // ...
    }
}, [loans, statusFilter, searchTerm]);
```

### 4. **ServerMonitoringPanel** - Monitoring serveur

**Localisation:** `src/components/server-monitoring/ServerMonitoringPanel.js`

**Architecture:**
- **Pattern:** Real-time dashboard avec charts
- **Librairies:**
  - Recharts pour graphiques
  - Material-UI pour interface
  - State management pour métriques

**Métriques surveillées:**
- CPU usage avec color coding
- RAM utilization
- Disk usage
- Status en temps réel

### 5. **EquipmentAlerts** - Alertes d'inventaire

**Localisation:** `src/components/inventory/EquipmentAlerts.js`

**Architecture:**
- **Pattern:** Alert aggregation system
- **Types d'alertes:**
  - Garantie expirée
  - Maintenance préventive
  - Équipement en retard

**Logique temporelle:**
```javascript
const daysUntilExpiry = differenceInDays(warrantyEnd, now);
if (daysUntilExpiry <= 30) {
    newAlerts.push({
        type: 'warranty_expiring',
        severity: 'warning',
        message: `Expire dans ${daysUntilExpiry} jours`
    });
}
```

## 🔗 Intégrations avec les services

### 1. **ApiService** - Service centralisé

**Localisation:** `src/services/apiService.js`

**Architecture:**
- **Pattern:** Singleton pattern avec méthodes centralisées
- **Fonctionnalités:**
  - Configuration automatique des headers
  - Gestion d'erreurs centralisée
  - Support FormData
  - Authentication via x-technician-id

**Configuration:**
```javascript
request = async (endpoint, options = {}) => {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (techId) { headers['x-technician-id'] = techId; }
    return fetch(url, { ...options, headers });
};
```

### 2. **CacheContext** - Gestion du cache

**Localisation:** `src/contexts/CacheContext.js`

**Pattern:** Context API avec invalidation sélective

### 3. **AppContext** - État global

**Localisation:** `src/contexts/AppContext.js`

**Pattern:** Context provider avec event system

## 🎨 Architecture de l'UI

### Système de design

1. **Material-UI** comme framework de base
2. **Thème unifié** avec mode sombre/clair
3. **Composants réutilisables** dans `common/`
4. **Patterns cohérents** pour interactions

### Responsive Design

- Breakpoints Material-UI standards
- Grid system adaptatif
- Composants mobile-first

### Accessibilité

- Iconographie avec labels
- Contrastes respectés
- Navigation clavier
- ARIA attributes

## 📱 Composants dialog/modal

**Pattern récurrent:**
- State management local
- Props d'initialisation
- Callbacks de confirmation
- Intégration avec services

**Exemples:**
- `LoanDialog` - Création/édition de prêts
- `ReturnLoanDialog` - Retour d'équipement
- `ChatInterfaceDocuCortex` - Interface IA

## 🚀 Patterns d'optimisation

### 1. **Performance**

- `useMemo` pour calculs lourds
- `useCallback` pour fonctions
- `React.memo` pour composants purs
- Lazy loading pour routes

### 2. **État local vs global**

- État local: UI temporary (dialogs, filtres)
- État global: Données partagées (utilisateur, config)
- Context API pour état complexe

### 3. **Error boundaries**

- Couches multiples de protection
- Fallbacks gradués
- Logging d'erreurs

## 🔮 Évolutivité et Maintenance

### Points forts

1. **Séparation des responsabilités** claire
2. **Composants réutilisables** bien définis
3. **Hooks personnalisés** pour logique métier
4. **Services centralisés** pour API
5. **Système de permissions** robuste

### Améliorations possibles

1. **TypeScript** pour type safety
2. **Tests unitaires** pour composants critiques
3. **Documentation Storybook** pour composants
4. **Bundle splitting** pour performance
5. **Server-side rendering** pour SEO

### Recommandations

1. Standardiser les propTypes
2. Ajouter des tests d'intégration
3. Optimiser les re-renders avec React.memo
4. Implémenter une stratégie de caching plus robuste
5. Améliorer l'accessibilité (focus management)

## 📝 Conclusion

L'architecture des composants DocuCortex AI démontre une approche moderne et bien structurée du développement React avec:

- **Modularité** excellente
- **Réutilisabilité** des composants
- **Séparation des préoccupations** claire
- **Performance** optimisée
- **Expérience utilisateur** soignée

La combinaison de hooks personnalisés, Context API, et patterns de composants avancés créé une base solide pour une application enterprise complexe.

---

*Documentation générée le: 2025-11-04*  
*Version: 1.0*  
*Auteur: Architecture Analysis Team*