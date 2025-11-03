# Architecture des Modules Core - RDS Viewer

*Analyse technique détaillée de l'architecture des modules fondamentaux*

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des Pages](#structure-des-pages)
3. [Système de Layouts](#système-de-layouts)
4. [Gestion des Contexts](#gestion-des-contexts)
5. [Services Core](#services-core)
6. [Dépendances et Intégrations](#dépendances-et-intégrations)
7. [Flux de Données](#flux-de-données)
8. [Architecture de Sécurité](#architecture-de-sécurité)
9. [Recommandations](#recommandations)

---

## Vue d'ensemble

L'application RDS Viewer suit une architecture **modulaire** basée sur React avec une séparation claire des responsabilités :

- **Pages** : Interface utilisateur et logique métier
- **Layouts** : Structure et navigation
- **Contexts** : Gestion d'état global
- **Services** : Communication avec les APIs
- **Hooks** : Logique réutilisable

### Principes architecturaux

1. **Single Source of Truth** : Centralisation dans CacheContext
2. **Reactive Architecture** : WebSocket pour les mises à jour en temps réel
3. **Modularité** : Modules indépendants et réutilisables
4. **Sécurité** : Système de permissions granulaires
5. **Performance** : Lazy loading et memoization

---

## Structure des Pages

### 1. DashboardPage.js
**Rôle** : Point d'entrée principal - Vue d'ensemble de l'activité

**Fonctionnalités** :
- Widgets temps réel (serveurs RDS, techniciens connectés, activité récente)
- Statistiques consolidées (prêts, matériel, historique)
- Navigation rapide vers les modules spécifiques
- Mise à jour automatique via WebSocket

**Intégrations** :
- `useCache()` : Récupération des données via cache centralisé
- `useApp()` : Notifications et gestion d'état
- `apiService` : Ping des serveurs RDS

**Widgets spécialisés** :
```javascript
// Widgets memoïsés pour performance
- ServerStatusWidget : Surveillance serveurs
- ConnectedTechniciansWidget : Techniciens actifs
- RecentActivityWidget : Activité récente
```

### 2. LoginPage.js
**Rôle** : Authentification et sélection de profil technicien

**Fonctionnalités** :
- Sélection de technicien (validation compte actif)
- Authentification multi-facteurs
- Détection de connexion existante
- Gestion d'erreurs de connexion

**Intégrations** :
- `useApp()` : Gestion état authentification
- `apiService.login()` : Processus de connexion
- Configuration dynamique des techniciens

**Flux d'authentification** :
```javascript
1. Chargement initial (config + techniciens connectés)
2. Sélection technicien
3. Saisie mot de passe
4. Validation et création session
```

### 3. SessionsPage.js
**Rôle** : Surveillance et gestion des sessions RDS

**Fonctionnalités** :
- Groupement des sessions par utilisateur
- Filtrage par serveur et statut
- Actions : Shadow, RDP, messages, infos utilisateur
- Actualisation forcée et automatique

**Intégrations** :
- `useCache()` : Cache sessions RDS
- `apiService` : Gestion sessions et messages
- WebSocket : Mises à jour temps réel

**Composants spécialisés** :
```javascript
- GroupedUserRow : Ligne groupée utilisateur
- Dialogs : SendMessageDialog, UserInfoDialog, GlobalMessageDialog
```

### 4. ComputersPage.js
**Rôle** : Gestion d'inventaire matériel

**Fonctionnalités** :
- Vues multiples (grille, liste, tableau)
- Filtrage avancé (statut, localisation, marque)
- Gestion prêts (rapide et complet)
- Maintenance et historique

**Intégrations** :
- `useCache()` : Données matériel et prêts
- `apiService` : CRUD ordinateurs et accessoires
- Dialogs : ComputerDialog, LoanDialog, MaintenanceDialog

**Vue cartes optimisées** :
```javascript
- ComputerCard : Vue compacte avec actions
- ComputerListItem : Vue liste pour performance
- QuickLoanDialog : Création prêt simplifiée
```

### 5. UsersManagementPage.js
**Rôle** : Administration utilisateurs RDS et Active Directory

**Fonctionnalités** :
- Vue virtualisée (react-window) pour performance
- Gestion groupes AD (VPN, Internet)
- Actions AD (création, mot de passe, activation)
- Synchronisation Excel ↔ Active Directory

**Intégrations** :
- `useCache()` : Utilisateurs Excel et groupes AD
- `apiService` : Opérations AD et Excel
- AdTreeView : Navigation unités organisation

**Composants spécialisés** :
```javascript
- UserRow : Ligne virtualisée avec actions
- AdGroupBadge : Badges groupes AD
- Dialogs : UserDialog, AdActionsDialog, PrintPreviewDialog
```

### 6. SettingsPage.js
**Rôle** : Configuration système et administration

**Fonctionnalités** :
- Interface onglets pour organisation
- Gestion techniciens et permissions
- Configuration RDV et AD
- Paramètres interface et notifications

**Intégrations** :
- `useApp()` : Configuration globale
- `apiService.saveConfig()` : Sauvegarde persistante
- Composants : UsersPermissionsPanel, GEDSettingsPanel

**Onglets spécialisés** :
```javascript
- Général : Sécurité et Active Directory
- Techniciens : CRUD et permissions
- Serveurs : Configuration RDS et Chat
- Chemins : Fichiers Excel, DB SQLite
- Prêts : Paramètres et limites
- Permissions : Gestion rôles et accès
- DocuCortex IA : Configuration IA/GED
```

### 7. LoansCalendar.js
**Rôle** : Visualisation calendrier des prêts

**Fonctionnalités** :
- Calendrier mensuel interactif
- Codes couleur par statut
- Détails prêts par jour
- Navigation temporelle

**Intégrations** :
- `apiService.getLoans()` : Données prêts
- État local : currentDate, view, selectedDay

---

## Système de Layouts

### MainLayout.js - Architecture de Navigation

**Structure** :
```javascript
MainLayout
├── AppBar (fixe)
│   ├── Logo RDS Viewer - Anecoop
│   ├── Statuts (en ligne, sessions actives)
│   ├── Badge rôle utilisateur
│   ├── Actions (Chat, Notifications)
│   └── Menu utilisateur (Paramètres, Déconnexion)
├── Navigation horizontale (Tabs)
│   ├── Menu dynamique basé permissions
│   ├── Badges notification
│   └── Lazy loading pages
└── Contenu principal (Routes)
```

**Intégrations critiques** :
- `usePermissions()` : Menu dynamique
- `useUnreadMessages()` : Badges notifications
- `ProtectedRoute` : Sécurité routes
- WebSocket : Mises à jour temps réel

**Navigation sécurisée** :
```javascript
// Routes protégées par permission
<Route path="/dashboard" element={
  <ProtectedRoute requiredPermission="dashboard:view">
    <DashboardPage />
  </ProtectedRoute>
} />
```

---

## Gestion des Contexts

### 1. AppContext.js - État Global Principal

**Responsabilités** :
- Configuration application
- Gestion technicien connecté
- Notifications toast
- Connexion WebSocket
- Événements personnalisés

**API fournie** :
```javascript
const value = {
  config,                    // Configuration globale
  currentTechnician,         // Technicien connecté
  setCurrentTechnician,      // Setter technicien
  isInitializing,           // État chargement
  error,                    // Erreurs
  isOnline,                 // Statut connexion
  notifications,            // Notifications toast
  showNotification,         // Afficher notification
  handleSaveConfig,         // Sauvegarde config
  events: { on, off, emit } // Événements personnalisés
}
```

**WebSocket intégré** :
```javascript
// Connexion automatique au démarrage
wsRef.current = new WebSocket('ws://localhost:3003');

// Gestion événements
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'data_updated') {
    emit('data_updated', data.payload);
  }
}
```

### 2. CacheContext.js - Cache Centralisé

**Responsabilités** :
- Cache centralisé des données
- Synchronisation WebSocket
- Invalidation ciblée
- Gestion erreurs chargement

**Entités cachées** :
```javascript
const ENTITIES = [
  'loans',                    // Prêts
  'computers',                // Ordinateurs
  'excel_users',              // Utilisateurs Excel
  'technicians',              // Techniciens
  'rds_sessions',             // Sessions RDS
  'config',                   // Configuration
  'ad_groups:VPN',           // Groupe AD VPN
  'ad_groups:Sortants_responsables' // Groupe AD Internet
];
```

**API fournie** :
```javascript
const value = {
  cache,                      // Données cachées
  isLoading,                  // État chargement
  error,                      // Erreurs cache
  invalidate                  // Invalidation entité
}
```

**Synchronisation temps réel** :
```javascript
// Écoute mises à jour WebSocket
useEffect(() => {
  const handleDataUpdate = (payload) => {
    if (payload.entity && ENTITIES.includes(payload.entity)) {
      fetchDataForEntity(payload.entity);
    }
  };
  
  const unsubscribe = events.on('data_updated', handleDataUpdate);
  return unsubscribe;
}, [events]);
```

### 3. ThemeModeContext.js - Thématisation

**Responsabilités** :
- Gestion thème clair/sombre
- Préférences utilisateur
- Persistance localStorage

**Intégrations** :
- Material-UI ThemeProvider
- Mode sombre/clair global

---

## Services Core

### 1. apiService.js - Service API Principal

**Architecture** : Singleton pattern avec méthodes centralisées

**Base URL** : `http://localhost:3002/api`

**Méthodes principales** :

#### Santé & Authentification
```javascript
checkServerHealth()     // Vérification serveur
login(technicianData)   // Connexion technicien
logout()               // Déconnexion
getConnectedTechnicians() // Techniciens actifs
```

#### Gestion Données
```javascript
getConfig() / saveConfig()                    // Configuration
getComputers() / saveComputer() / deleteComputer() // Ordinateurs
getLoans() / createLoan() / updateLoan() / returnLoan() // Prêts
getExcelUsers() / saveUserToExcel() / deleteUserFromExcel() // Utilisateurs
getRdsSessions() / refreshRdsSessions() // Sessions RDS
```

#### Active Directory
```javascript
searchAdUsers(term)                           // Recherche utilisateurs
getAdGroupMembers(group)                     // Membres groupe
addUserToGroup(username, groupName)          // Ajout groupe
createAdUser(userData)                       // Création utilisateur
resetAdUserPassword(username, newPassword)   // Reset mot de passe
```

#### Chat & Notifications
```javascript
getChatChannels() / sendChatMessage()        // Chat
getNotifications() / markNotificationAsRead() // Notifications
```

#### Agent IA (DocuCortex)
```javascript
uploadAIDocument(file)                      // Upload document
sendAIMessage(sessionId, message)           // Chat IA
searchAIDocuments(query)                    // Recherche documents
getAIStatistics()                           // Statistiques IA
```

**Gestion erreurs** :
```javascript
// Centralisation gestion erreurs
if (error.message.includes('Failed to fetch')) {
  throw new Error('Impossible de contacter le serveur...');
}
```

**Headers automatiques** :
```javascript
// Ajout automatique technician ID
if (techId) {
  headers['x-technician-id'] = techId;
}
```

### 2. AIService.js - Service IA DocuCortex

**Base URL** : `http://localhost:8000`

**Méthodes** :
```javascript
testConnection()          // Test connexion IA
sendMessage(message, context) // Chat
getAvailableModels()      // Modèles disponibles
analyzeDocument(text)     // Analyse document
```

**Architecture** : Service séparé pour intégration IA/GED

### 3. permissionService.js - Service Permissions

**Architecture** : Singleton avec gestion rôles/permissions

**Concepts clés** :
- Rôles prédéfinis (ADMIN, TECHNICIAN, VIEWER)
- Permissions granulaires par module
- Modules accessibles selon permissions
- Actions par module (view, create, edit, delete, export, admin)

**API principale** :
```javascript
hasPermission(permission)              // Vérification permission
hasAnyPermission(permissions)          // OU logique
hasAllPermissions(permissions)         // ET logique
getUserRole()                          // Rôle utilisateur
getAccessibleModules()                 // Modules accessibles
isAdmin() / isSuperAdmin()            // Vérification admin
canAccessModule(moduleId)             // Accès module
```

**Modèles intégrés** :
```javascript
import {
  ROLES,                    // Rôles prédéfinis
  MODULES,                 // Modules système
  hasPermission,           // Vérification permission
  getAccessibleModules     // Modules accessibles
} from '../models/permissions';
```

---

## Dépendances et Intégrations

### 1. Patterns d'Intégration

#### Cache-First Architecture
```javascript
// Toutes les pages utilisent le cache comme source principale
const { cache, isLoading, invalidate } = useCache();

// Accès direct aux données
const computers = cache.computers || [];
const users = Object.values(cache.excel_users || {}).flat();
const config = cache.config || {};
```

#### Service Layer Pattern
```javascript
// Pages → Services → API Backend
PageComponent → apiService → HTTP Requests → Backend API
```

#### Context Provider Pattern
```javascript
// Fourniture état global aux composants
<AppProvider>
  <CacheProvider>
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>
  </CacheProvider>
</AppProvider>
```

### 2. WebSocket - Temps Réel

**Intégration complète** :
```javascript
// AppContext gère la connexion
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  emit(data.type, data.payload);
};

// CacheContext écoute les mises à jour
events.on('data_updated', (payload) => {
  if (ENTITIES.includes(payload.entity)) {
    fetchDataForEntity(payload.entity);
  }
});

// Pages react aux changements cache
useEffect(() => {
  // Interface mise à jour automatiquement
}, [cache]);
```

### 3. Sécurité - Multi-Niveaux

#### Route Level Security
```javascript
<ProtectedRoute requiredPermission="dashboard:view">
  <DashboardPage />
</ProtectedRoute>
```

#### Service Level Security
```javascript
// apiService ajoute automatiquement technician ID
if (techId) {
  headers['x-technician-id'] = techId;
}
```

#### UI Level Security
```javascript
// Menu dynamique selon permissions
const accessibleModules = getAccessibleModules();
const navItems = accessibleModules.map(module => ({
  text: module.label,
  path: module.path,
  badge: module.badge
}));
```

### 4. Performance Optimizations

#### Lazy Loading
```javascript
// MainLayout charge les pages à la demande
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));
```

#### Memoization
```javascript
// Évite re-renders inutiles
const DashboardPage = () => {
  const { activeLoans, stats } = useMemo(() => {
    const active = loans.filter(l => l.status === 'active');
    const statistics = { /* calculation */ };
    return { activeLoans: active, stats: statistics };
  }, [loans, computers, loan_history]);
};
```

#### Virtualized Rendering
```javascript
// UsersManagementPage utilise react-window
<AutoSizer>
  {({ height, width }) => (
    <List 
      height={height} 
      width={width} 
      itemCount={filteredUsers.length} 
      itemSize={80}
    >
      {Row}
    </List>
  )}
</AutoSizer>
```

---

## Flux de Données

### 1. Flux Standard (Read)

```mermaid
graph TD
    A[Page Component] --> B[useCache()]
    B --> C[CacheContext]
    C --> D[apiService.getData()]
    D --> E[HTTP GET /api/entity]
    E --> F[Backend Database]
    F --> E
    E --> D
    D --> C
    C --> B
    B --> A
```

### 2. Flux Temps Réel (WebSocket)

```mermaid
graph TD
    A[Backend Event] --> B[WebSocket Server]
    B --> C[AppContext WebSocket]
    C --> D[events.emit()]
    D --> E[CacheContext listener]
    E --> F[apiService.refresh()]
    F --> G[HTTP GET /api/entity]
    G --> H[State Update]
    H --> I[React Re-render]
```

### 3. Flux CRUD (Write)

```mermaid
graph TD
    A[User Action] --> B[Page Component]
    B --> C[apiService.method()]
    C --> D[HTTP POST/PUT/DELETE /api/entity]
    D --> E[Backend Database]
    E --> F[WebSocket Broadcast]
    F --> C
    G[Invalidate Cache] --> H[Auto-refresh UI]
```

---

## Architecture de Sécurité

### 1. Authentification Multi-Niveaux

#### Niveau 1 : Connexion Application
```javascript
// LoginPage vérifie compte actif
if (!technician.isActive) {
  setError('Ce compte technicien est désactivé.');
  return;
}
```

#### Niveau 2 : Sessions Sécurisées
```javascript
// apiService persiste technician ID
setCurrentTechnician(technicianId);
localStorage.setItem('currentTechnicianId', technicianId);
```

#### Niveau 3 : Permissions Granulaires
```javascript
// PermissionService vérifie accès
canAccessModule(moduleId) {
  const module = MODULES[moduleId.toUpperCase()];
  return this.hasPermission(module.requiredPermission);
}
```

### 2. Protection des Données

#### Validation Côté Client
```javascript
// QuickLoanDialog validation
const handleSave = () => {
  if (!selectedUser) {
    alert("Veuillez sélectionner un utilisateur.");
    return;
  }
  // ... continue processing
};
```

#### Headers Sécurisés
```javascript
// apiService ajoute authentication headers
if (techId) {
  headers['x-technician-id'] = techId;
}
```

#### Sanitization
```javascript
// Recherche sécurisée AD
searchAdUsers(term) {
  return this.request(`/ad/users/search/${encodeURIComponent(term)}`);
}
```

---

## Recommandations

### 1. Améliorations Architecturales

#### Gestion d'État Avancée
```javascript
// Considérer Redux Toolkit ou Zustand pour état complexe
// Mise en place selectors memoïsés avec Reselect
```

#### Cache Intelligent
```javascript
// Implémentation cache avec TTL et invalidation fine
// Support offline avec IndexedDB
```

#### Micro-Frontend
```javascript
// Découper en modules indépendants
// Modules: Auth, Dashboard, Users, Computers, Loans
```

### 2. Optimisations Performance

#### Bundle Splitting
```javascript
// Code splitting par route et par fonctionnalité
const AdminModule = lazy(() => import('./modules/Admin'));
```

#### Service Worker
```javascript
// Cache strategies pour offline support
// Background sync pour actions offline
```

#### Web Workers
```javascript
// Traitement heavy data en background
// Virtualization avancée pour grandes listes
```

### 3. Sécurité Renforcée

#### JWT Tokens
```javascript
// Remplacement localStorage par tokens sécurisés
// Refresh tokens automatiques
```

#### Content Security Policy
```javascript
// Headers CSP stricts
// XSS protection
```

#### Audit Trail
```javascript
// Logging complet des actions utilisateur
// Alertes sécurité automatiques
```

### 4. Monitoring et Observabilité

#### Metrics
```javascript
// Performance monitoring (Core Web Vitals)
// Business metrics (utilisation modules)
```

#### Error Tracking
```javascript
// Sentry ou équivalent pour error tracking
// Logs structurés et corrélation
```

#### Health Checks
```javascript
// Monitoring services tiers (IA, AD)
// Alertes proactives
```

---

## Conclusion

L'architecture des modules core de RDS Viewer démontre une approche **modulaire** et **scalable** avec :

### Points Forts ✅
- **Séparation responsabilités** claire entre pages, services, et contexts
- **Cache centralisé** avec synchronisation temps réel
- **Système permissions** granulaires et sécurisé
- **Performance optimisée** avec lazy loading et memoization
- **WebSocket intégré** pour temps réel natif
- **Architecture extensible** pour nouvelles fonctionnalités

### Axes d'Amélioration 🔄
- **State management** plus robuste (Redux Toolkit)
- **Cache intelligent** avec TTL et invalidation fine
- **Tests unitaires** et d'intégration complets
- **Documentation API** auto-générée
- **Monitoring** et observabilité avancés

### Vision Future 🎯
L'architecture actuelle constitue une **base solide** pour l'évolution vers une solution **micro-frontend** avec des modules **indépendants** et **déployables séparément**, tout en maintenant la cohérence et la sécurité au niveau global.

---

*Document généré le 2025-11-04 - Analyse architecture modules core RDS Viewer v1.0*