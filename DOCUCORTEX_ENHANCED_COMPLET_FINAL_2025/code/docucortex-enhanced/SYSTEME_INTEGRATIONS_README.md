# 🔗 Système d'Intégrations DocuCortex

## Vue d'ensemble

Le système d'intégrations DocuCortex permet la synchronisation automatique et bidirectionnelle avec les systèmes d'entreprise existants. Il offre des connecteurs pour Active Directory, CMDB, Help Desk, Email et Calendrier.

## 🏗️ Architecture

```
src/
├── services/
│   └── integrationService.js      # Service principal d'intégration
├── integrations/
│   ├── ActiveDirectoryConnector.js # Connecteur Active Directory
│   ├── CMDBConnector.js           # Connecteur CMDB
│   ├── HelpDeskConnector.js       # Connecteur Help Desk
│   ├── EmailConnector.js          # Connecteur Email
│   ├── CalendarConnector.js       # Connecteur Calendrier
│   └── index.js                   # Index des composants
└── components/integrations/
    ├── IntegrationDashboard.js    # Tableau de bord principal
    ├── ConnectionManager.js       # Gestionnaire de connexions
    ├── SyncMonitor.js             # Moniteur de synchronisation
    ├── IntegrationSettings.js     # Paramètres de configuration
    ├── ErrorHandler.js            # Gestionnaire d'erreurs
    └── index.js                   # Export centralisé
```

## 🚀 Fonctionnalités Principales

### 📊 Tableau de Bord des Intégrations
- Vue d'ensemble en temps réel de l'état de toutes les intégrations
- Métriques de santé et de performance
- Actions rapides (synchronisation, reconnexion)
- Statistiques globales

### 🔌 Gestionnaire de Connexions
- Configuration des paramètres de connexion pour chaque système
- Test de connectivité en temps réel
- Gestion des credentials et authentification
- Interface utilisateur intuitive

### 🔄 Moniteur de Synchronisation
- Surveillance en temps réel des synchronisations en cours
- Historique détaillé des synchronisations
- Statistiques de performance (durée, volume, erreurs)
- Actions manuelles (lancer, annuler, relancer)

### ⚙️ Paramètres de Configuration
- Configuration globale et par intégration
- Mapping des champs de données
- Options de synchronisation avancées
- Gestion des templates email

### ⚠️ Gestionnaire d'Erreurs
- Centralisation et classification des erreurs
- Système de résolution et suivi
- Filtrage et recherche avancée
- Export des logs d'erreurs

## 🔧 Connecteurs Disponibles

### Active Directory Connector
**Fichier:** `src/integrations/ActiveDirectoryConnector.js`

**Fonctionnalités:**
- 🔐 Authentification SSO avec AD
- 👥 Synchronisation automatique des comptes utilisateurs
- 🏢 Import des groupes et permissions AD
- 📊 Gestion des changements d'organisation
- 🔄 Gestion des employés actifs/inactifs

**Configuration LDAP:**
```javascript
const adConfig = {
    ldapUrl: 'ldap://ldap.company.com:389',
    domain: 'company.com',
    bindDN: 'CN=svc-docucortex,OU=Service Accounts,DC=company,DC=com',
    bindCredentials: 'password',
    ouBase: 'DC=company,DC=com'
};
```

### CMDB Connector
**Fichier:** `src/integrations/CMDBConnector.js`

**Fonctionnalités:**
- 📋 Synchronisation inventaire équipements
- 📍 Mise à jour statuts et localisations
- 📄 Import des spécifications techniques
- 🛡️ Gestion des garanties et maintenance
- ⚠️ Alertes de fin de garantie

**Configuration API:**
```javascript
const cmdbConfig = {
    apiUrl: 'https://cmdb.company.com/api',
    apiKey: 'your-api-key',
    endpoints: {
        equipment: '/api/equipment',
        assets: '/api/assets',
        warranties: '/api/warranties'
    }
};
```

### Help Desk Connector
**Fichier:** `src/integrations/HelpDeskConnector.js`

**Fonctionnalités:**
- 🎫 Création automatique de tickets
- 📊 Suivi des incidents liés aux prêts
- 🔄 Intégration avec les workflows
- 🔔 Notifications bidirectionnelles
- 📈 Statistiques et reporting

**Configuration API:**
```javascript
const helpdeskConfig = {
    apiUrl: 'https://helpdesk.company.com/api',
    apiKey: 'your-api-key',
    autoTicketCreation: true,
    ticketCategories: {
        equipment: 'Equipment',
        document: 'Document'
    }
};
```

### Email Connector
**Fichier:** `src/integrations/EmailConnector.js`

**Fonctionnalités:**
- 📧 Notifications automatiques par email
- 📝 Templates personnalisables
- 📊 Suivi des envois et statistiques
- ⚡ Envoi en masse avec limitation de débit
- 🔒 Authentification SMTP sécurisée

**Configuration SMTP:**
```javascript
const emailConfig = {
    smtp: {
        host: 'smtp.company.com',
        port: 587,
        secure: true,
        auth: {
            user: 'noreply@company.com',
            pass: 'password'
        }
    },
    fromEmail: 'noreply@company.com',
    batchSize: 50,
    rateLimit: 10 // emails par minute
};
```

### Calendar Connector
**Fichier:** `src/integrations/CalendarConnector.js`

**Fonctionnalités:**
- 📅 Planification réservations équipements
- 🔔 Rappels automatiques de retour
- 📊 Synchronisation événements
- 🔗 Intégration Google/Outlook Calendar
- ⏰ Gestion créneaux de maintenance

**Configuration OAuth:**
```javascript
const calendarConfig = {
    provider: 'google', // ou 'outlook'
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    calendarId: 'primary',
    timezone: 'Europe/Paris'
};
```

## 📊 Service Principal

### IntegrationService
**Fichier:** `src/services/integrationService.js`

Le service central orchestre tous les connecteurs et offre une API unifiée :

```javascript
import integrationService from './services/integrationService.js';

// Synchroniser les utilisateurs AD
await integrationService.syncActiveDirectoryUsers();

// Synchroniser l'inventaire CMDB
await integrationService.syncEquipmentInventory();

// Créer un ticket Help Desk
await integrationService.createHelpDeskTicket({
    title: 'Problème équipement',
    description: 'Description du problème',
    category: 'equipment'
});

// Envoyer un email de rappel
await integrationService.sendLoanReminder(loanId);

// Planifier une réservation
await integrationService.scheduleEquipmentReservation(
    equipmentId, userId, startDate, endDate
);
```

### Méthodes Principales

#### Synchronisation
- `syncActiveDirectoryUsers(syncType)` - Synchronisation des utilisateurs AD
- `syncEquipmentInventory(syncType)` - Synchronisation des équipements CMDB
- `syncTickets(syncType)` - Synchronisation des tickets Help Desk

#### Notifications
- `sendLoanReminder(loanId)` - Envoi rappel de prêt
- `sendOverdueNotice(loanId)` - Notification retard
- `sendEquipmentReturnConfirmation()` - Confirmation retour

#### Planification
- `scheduleEquipmentReservation()` - Réservation équipement
- `createCalendarEvent()` - Création événement calendrier

#### Monitoring
- `getIntegrationStatus()` - Statut des intégrations
- `getSyncHistory()` - Historique synchronisations
- `healthCheck()` - Vérification santé système

## 🎯 Utilisation des Composants

### 1. Tableau de Bord
```javascript
import { IntegrationDashboard } from './components/integrations/index.js';

function App() {
    return <IntegrationDashboard />;
}
```

### 2. Gestionnaire de Connexions
```javascript
import { ConnectionManager } from './components/integrations/index.js';

function App() {
    return <ConnectionManager />;
}
```

### 3. Moniteur de Synchronisation
```javascript
import { SyncMonitor } from './components/integrations/index.js';

function App() {
    return <SyncMonitor />;
}
```

### 4. Paramètres
```javascript
import { IntegrationSettings } from './components/integrations/index.js';

function App() {
    return <IntegrationSettings />;
}
```

### 5. Gestionnaire d'Erreurs
```javascript
import { ErrorHandler } from './components/integrations/index.js';

function App() {
    return <ErrorHandler />;
}
```

## 🔒 Sécurité et Authentification

### Active Directory
- Authentification LDAP sécurisée
- Support SSO Kerberos/SPNEGO
- Chiffrement des credentials
- Validation des certificats

### APIs REST
- Authentification OAuth 2.0
- Clés API sécurisées
- Rate limiting
- Validation des tokens

### Email
- Authentification SMTP sécurisée (TLS/SSL)
- Chiffrement des mots de passe
- Limitation de débit
- Logs de sécurité

### Calendriers
- OAuth 2.0 pour Google/Outlook
- Scope minimal requis
- Renouvellement automatique des tokens
- Révocation des accès

## 📊 Monitoring et Observabilité

### Métriques Disponibles
- Nombre d'enregistrements synchronisés
- Temps de synchronisation
- Taux de réussite/échec
- Latence des APIs
- Utilisation des quotas

### Alertes Configurables
- Échecs de connexion
- Retards de synchronisation
- Quotas API dépassés
- Erreurs de données critiques

### Logs et Audits
- Logs détaillés de toutes les opérations
- Traçabilité des modifications
- Export des logs d'erreurs
- Historique des synchronisations

## 🚀 Déploiement et Configuration

### Variables d'Environnement
```bash
# Active Directory
REACT_APP_AD_LDAP_URL=ldap://ldap.company.com:389
REACT_APP_AD_DOMAIN=company.com
REACT_APP_AD_BIND_DN=CN=svc-docucortex,OU=Service Accounts,DC=company,DC=com
REACT_APP_AD_BIND_CREDENTIALS=password

# CMDB
REACT_APP_CMDB_API_URL=https://cmdb.company.com/api
REACT_APP_CMDB_API_KEY=your-api-key

# Help Desk
REACT_APP_HELPDESK_API_URL=https://helpdesk.company.com/api
REACT_APP_HELPDESK_API_KEY=your-api-key

# Email SMTP
REACT_APP_SMTP_HOST=smtp.company.com
REACT_APP_SMTP_PORT=587
REACT_APP_SMTP_USER=noreply@company.com
REACT_APP_SMTP_PASS=password

# Calendrier
REACT_APP_CALENDAR_PROVIDER=google
REACT_APP_CALENDAR_API_KEY=your-calendar-api-key
REACT_APP_CALENDAR_CLIENT_ID=your-client-id
```

### Installation
```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Lancer l'application
npm start
```

### Configuration Docker (optionnel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Patterns de Conception

### Circuit Breaker
Protection contre les cascades d'erreurs avec fermeture automatique des circuits problématiques.

### Retry Logic
Tentatives multiples avec backoff exponentiel pour la résilience.

### Rate Limiting
Limitation automatique du débit pour respecter les quotas API.

### Batch Processing
Traitement par lots pour optimiser les performances.

### Event-Driven Architecture
Architecture événementielle pour les notifications et synchronisations.

## 📚 API Reference

### IntegrationService Methods

#### `syncActiveDirectoryUsers(syncType = 'full')`
Synchronise les utilisateurs depuis Active Directory.

**Paramètres:**
- `syncType` (string): Type de synchronisation ('full', 'incremental', 'partial')

**Retour:**
```javascript
{
    type: 'full',
    userCount: 245,
    users: [...],
    timestamp: '2024-01-15T14:30:00Z',
    syncId: 'AD_SYNC_1705321800_abc123'
}
```

#### `syncEquipmentInventory(syncType = 'full')`
Synchronise l'inventaire depuis le CMDB.

**Retour:**
```javascript
{
    type: 'full',
    equipmentCount: 156,
    equipment: [...],
    metadata: {...},
    timestamp: '2024-01-15T14:30:00Z'
}
```

#### `createHelpDeskTicket(ticketData)`
Crée un ticket dans le système Help Desk.

**Paramètres:**
- `ticketData` (object): Données du ticket

**Retour:**
```javascript
{
    id: 'TICKET-1234',
    title: 'Problème équipement',
    status: 'New',
    createdAt: '2024-01-15T14:30:00Z'
}
```

#### `sendEmail(template, recipient, data)`
Envoie un email utilisant un template.

**Paramètres:**
- `template` (string): Nom du template
- `recipient` (string): Email du destinataire
- `data` (object): Données de substitution

#### `createCalendarEvent(eventData)`
Crée un événement calendrier.

**Paramètres:**
- `eventData` (object): Données de l'événement

### Event Handlers

Le service émet des événements pour la communication asynchrone :

```javascript
// Écouter les événements
integrationService.on('integration:statusChanged', (data) => {
    console.log('Statut changé:', data);
});

integrationService.on('activeDirectory:syncCompleted', (result) => {
    console.log('Synchronisation AD terminée:', result);
});
```

## 🧪 Tests et Développement

### Tests Unitaires
```javascript
import { ActiveDirectoryConnector } from './integrations/ActiveDirectoryConnector.js';

describe('ActiveDirectoryConnector', () => {
    test('should connect successfully', async () => {
        const connector = new ActiveDirectoryConnector(testConfig);
        const result = await connector.testConnection();
        expect(result.connected).toBe(true);
    });
});
```

### Données Mock
Le système inclut des données simulées pour le développement :
- Utilisateurs AD fictifs
- Équipements CMDB example
- Templates email de test
- Événements calendrier simulés

### Debug Mode
```javascript
// Activer le mode debug
localStorage.setItem('integration_debug', 'true');

// Logs détaillés dans la console
integrationService.on('*', (event, data) => {
    console.log(`Event: ${event}`, data);
});
```

## 🔄 Maintenance et Support

### Tâches de Maintenance
- Nettoyage régulier des logs
- Archivage des anciennes synchronisations
- Vérification de l'intégrité des données
- Mise à jour des credentials

### Monitoring Continu
- Surveillance automatique de la santé
- Alertes en cas de problème
- Rapports de performance réguliers
- Métriques d'utilisation

### Support Technique
- Documentation complète des APIs
- Exemples de configuration
- Troubleshooting guides
- Support communautaire

---

## 📄 Changelog

### Version 1.0.0
- ✨ Implémentation initiale du système d'intégrations
- 🔌 Connecteurs pour AD, CMDB, Help Desk, Email, Calendrier
- 📊 Interface de monitoring et gestion complète
- 🔒 Sécurité et authentification robustes
- 📚 Documentation complète

---

*Ce système d'intégrations DocuCortex offre une solution complète pour la synchronisation et l'intégration avec les systèmes d'entreprise existants, avec une architecture modulaire, sécurisée et scalable.*