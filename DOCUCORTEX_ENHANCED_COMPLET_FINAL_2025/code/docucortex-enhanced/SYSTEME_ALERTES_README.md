# Système d'Alertes Préventives DocuCortex

## Vue d'ensemble

Ce document décrit l'implémentation du système d'alertes préventives intelligent pour la gestion de prêts DocuCortex. Le système fournit des notifications automatiques 24h et 48h avant l'expiration des prêts, avec une interface complète de gestion des alertes.

## 🎯 Fonctionnalités Principales

### 🔔 Alertes Automatiques
- **24h avant expiration** : Alerte urgente avec actions rapides
- **48h avant expiration** : Alerte de rappel préventive
- **Prêts en retard** : Alerte critique avec notifications push
- **Seuils personnalisables** : Configuration des jours avant expiration

### 📊 Interface de Gestion
- **Dashboard des alertes** : Vue d'ensemble avec métriques de risque
- **Indicateurs visuels** : Dans la liste des prêts
- **Modal de gestion** : Actions rapides (prolonger, rappeler)
- **Historique des notifications** : Traçabilité complète

### ⚙️ Configuration
- **Préférences utilisateur** : Notifications navigateur, email, in-app
- **Filtres avancés** : Par niveau d'urgence, type d'alerte
- **Actions en masse** : Gestion de plusieurs alertes simultanément

## 📁 Structure des Fichiers

```
src/
├── services/
│   ├── alertsService.js      # Service principal des alertes
│   └── apiService.js         # Service API pour les prêts
├── components/
│   ├── alerts/
│   │   ├── AlertSystem.js    # Composant principal d'alertes
│   │   └── index.js          # Exports centralisés
│   ├── dashboard/
│   │   └── DashboardAlerts.js # Dashboard complet des alertes
│   └── loan-management/
│       └── LoanList.js       # Liste des prêts avec alertes intégrées
```

## 🚀 Utilisation

### 1. Service d'Alertes (alertsService.js)

```javascript
import alertsService from './services/alertsService';

// Calculer le statut d'alerte d'un prêt
const alertStatus = alertsService.calculateAlertStatus(loan);

// Envoyer une notification
await alertsService.sendNotification(loan, alertStatus);

// Obtenir les préférences utilisateur
const preferences = alertsService.getUserPreferences();

// Mettre à jour les préférences
alertsService.updateUserPreferences({
    enableBrowserNotifications: true,
    criticalThreshold: 3,
    warningThreshold: 7
});
```

### 2. Composant AlertSystem

```javascript
import AlertSystem from './components/alerts/AlertSystem';

// Version intégrée (dans un autre composant)
<AlertSystem
    loans={loans}
    embedded={true}
    showStatistics={false}
    onLoanAction={(action, loanId) => {
        // Gérer les actions (extend, recall, view)
    }}
/>

// Version autonome
<AlertSystem
    loans={loans}
    embedded={false}
    showStatistics={true}
    onLoanAction={(action, loanId) => {
        // Gérer les actions
    }}
/>
```

### 3. Dashboard des Alertes

```javascript
import DashboardAlerts from './components/dashboard/DashboardAlerts';

<DashboardAlerts
    loans={loans}
    onLoanAction={(action, loanId) => {
        // Gérer les actions de prêts
    }}
    refreshInterval={300000} // 5 minutes
/>
```

### 4. Liste des Prêts avec Alertes

```javascript
import LoanList from './components/loan-management/LoanList';

<LoanList
    loans={loans}
    selectedLoans={selectedLoans}
    onSelectLoan={setSelectedLoans}
    onReturn={handleReturn}
    onEdit={handleEdit}
    onExtend={handleExtend}
    onHistory={handleHistory}
    onCancel={handleCancel}
    showAlerts={true}
    showStatistics={true}
    compact={false}
/>
```

## 🔧 Configuration des Alertes

### Seuils par Défaut
```javascript
const DEFAULT_ALERT_CONFIG = {
    notificationHours: [24, 48],  // Heures avant expiration
    enableBrowserNotifications: true,
    enableEmailNotifications: false,
    enableInAppNotifications: true,
    criticalThreshold: 3,          // Jours pour alerte critique
    warningThreshold: 7           // Jours pour avertissement
};
```

### Niveaux d'Alerte
- **Niveau 1 - Faible** : Information générale
- **Niveau 2 - Moyen** : Avertissement (48h avant)
- **Niveau 3 - Élevé** : Urgence (24h avant)
- **Niveau 4 - Critique** : Retard ou très critique (<3j)

## 📱 Types de Notifications

### 1. Notifications In-App
- Affichage dans l'interface utilisateur
- Indicateurs visuels avec badges
- Actions directes depuis la notification

### 2. Notifications Navigateur
- Notifications système (si permissions accordées)
- Auto-fermeture configurable
- Actions cliquables

### 3. Notifications Email (Future)
- Intégration prévue avec service d'email
- Notifications hors ligne
- Rapports périodiques

## 🎯 Actions Disponibles

### Actions Contextuelles
- **Prolonger** : Étendre la date de retour
- **Rappeler** : Envoyer un rappel à l'emprunteur
- **Voir détails** : Ouvrir la fiche du prêt
- **Marquer lu** : Fermer la notification

### Actions en Masse
- Marquer plusieurs alertes comme lues
- Envoyer des rappels groupés
- Prolonger plusieurs prêts
- Supprimer des alertes

## 📊 Métriques et Statistiques

### Dashboard Principal
- **Total des alertes** : Nombre global
- **Alertes non lues** : Requièrent attention
- **Alertes urgentes** : Dernières 24h
- **Prêts en retard** : État critique

### Répartition par Niveau
- Graphique en barres des alertes par criticité
- Pourcentages de distribution
- Évolution temporelle

## 🔄 Gestion des Événements

### Événements Personnalisés
```javascript
// Nouvelle alerte créée
window.dispatchEvent(new CustomEvent('docucortex-new-alert', {
    detail: notification
}));

// Alerte marquée comme lue
window.dispatchEvent(new CustomEvent('docucortex-alert-read', {
    detail: { notificationId }
}));

// Action sur un prêt
window.dispatchEvent(new CustomEvent('docucortex-loan-action', {
    detail: { action: 'manage', loanId }
}));
```

### Écouteurs d'Événements
```javascript
// Écouter les nouvelles alertes
window.addEventListener('docucortex-new-alert', (event) => {
    const notification = event.detail;
    // Mettre à jour l'interface
});

// Traiter les prêts pour les alertes
window.dispatchEvent(new CustomEvent('docucortex-process-loan-alerts', {
    detail: { loans }
}));
```

## 💾 Persistance des Données

### localStorage
```javascript
// Clés de stockage
const STORAGE_KEYS = {
    ALERTS: 'docucortex_alerts',
    PREFERENCES: 'docucortex_alert_preferences',
    SENT_NOTIFICATIONS: 'docucortex_sent_notifications',
    USER_SETTINGS: 'docucortex_user_alert_settings'
};
```

### Limites de Stockage
- **Notifications** : 100 maximum (les plus récentes)
- **Historique** : 500 entrées maximum
- **Notifications envoyées** : 1000 clés maximum

## 🎨 Intégration avec Material-UI

### Composants Utilisés
- **Chip** : Indicateurs d'alerte
- **Badge** : Compteurs de notifications
- **Menu** : Actions contextuelles
- **Dialog** : Modales de configuration
- **Alert** : Notifications inline
- **Card** : Métriques et statistiques

### Thème et Couleurs
- **Succès** : Alertes résolues/normal
- **Info** : Information générale
- **Warning** : Avertissements (48h)
- **Error** : Urgences/retards (24h et +)

## 📱 Support Mobile

### Responsive Design
- Interface adaptative pour tablette/mobile
- Gestes tactiles optimisés
- Notifications push natives

### Performance
- Lazy loading des composants
- Virtualisation pour grandes listes
- Cache intelligent des données

## 🔧 API et Intégration

### Endpoints API
```javascript
// Service API fourni
apiService.getLoans()
apiService.updateLoan(loanId, updates)
apiService.returnLoan(loanId)
apiService.extendLoan(loanId, extensionData)
apiService.getLoanStatistics()
apiService.sendBulkReminders(loanIds)
```

### Configuration
```javascript
const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
    retries: 3
};
```

## 🚀 Déploiement

### Prérequis
```bash
npm install date-fns
npm install @mui/material @mui/icons-material
```

### Configuration Environment
```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true
```

### Initialisation
```javascript
// Dans App.js ou point d'entrée
import alertsService from './services/alertsService';

// Initialiser le service
alertsService.init().then(() => {
    console.log('Système d\'alertes prêt');
});
```

## 🐛 Dépannage

### Problèmes Courants

1. **Notifications non affichées**
   - Vérifier les permissions du navigateur
   - Contrôler les préférences utilisateur
   - Vérifier la console pour les erreurs

2. **Alertes manquantes**
   - Vérifier les seuils de configuration
   - Contrôler les dates des prêts
   - Valider les données d'entrée

3. **Performance dégradée**
   - Vider le cache localStorage
   - Réduire la fréquence d'actualisation
   - Optimiser le nombre d'alertes affichées

### Logs de Débogage
```javascript
// Activer les logs détaillés
localStorage.setItem('docucortex_debug_alerts', 'true');

// Consulter les logs
console.log('Alertes:', alertsService.getStoredNotifications());
console.log('Préférences:', alertsService.getUserPreferences());
console.log('Statistiques:', alertsService.getAlertStatistics());
```

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- **Intégration email** : Notifications par البريد électronique
- **Alertes prédictives** : IA pour anticiper les retards
- **Rapports automatisés** : Génération de rapports périodiques
- **Intégration calendrier** : Synchronisation avec calendriers externes

### Améliorations Techniques
- **Base de données** : Migration vers une vraie BDD
- **API temps réel** : WebSockets pour notifications instantanées
- **Mobile app** : Application native dédiée
- **Analytics** : Métriques d'usage et d'efficacité

---

## 👨‍💻 Support et Contribution

Pour toute question ou suggestion d'amélioration :
1. Consulter la documentation technique
2. Vérifier les exemples d'utilisation
3. Tester avec les données de démonstration
4. Signaler les bugs via le système de tickets

**Version** : 1.0.0  
**Date** : Novembre 2025  
**Compatibilité** : React 18+, Material-UI 5+, Navigateurs modernes