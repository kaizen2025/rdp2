# UsersBatchActions.js - Composant d'Actions en Lot pour Utilisateurs

## 🎯 Vue d'ensemble

Le composant `UsersBatchActions.js` offre une interface moderne et complète pour effectuer des actions en lot sur les utilisateurs DocuCortex. Il intègre la sélection multiple, les actions groupées avec confirmation, un système de progression en temps réel, et un mécanisme de rollback.

## ✨ Fonctionnalités principales

### 🔧 Sélection Multiple
- **Ctrl+Click** : Sélection/désélection individuelle
- **Shift+Click** : Sélection en plage (range)
- **Sélection globale** : Bouton "Tout sélectionner"
- **Indicateur visuel** : Compteur de sélections en temps réel

### 🚀 Actions en Lot Disponibles

1. **Suppression d'Utilisateurs**
   - Suppression définitive avec double confirmation
   - Limite : 50 utilisateurs maximum
   - Rollback possible

2. **Modification des Groupes**
   - Ajout/suppression/remplacement de groupes AD
   - Limite : 100 utilisateurs maximum
   - Validation des groupes existants

3. **Export Excel**
   - Export CSV/Excel avec champs personnalisables
   - Limite : 1000 utilisateurs
   - Téléchargement automatique

4. **Export PDF**
   - Génération de rapports PDF personnalisés
   - Limite : 500 utilisateurs
   - Templates configurables

5. **Envoi d'Emails**
   - Notifications groupées par email
   - Limite : 200 utilisateurs
   - Sujet et message personnalisés

6. **Désactivation/Activation**
   - Changement de statut en lot
   - Limite : 100 utilisateurs
   - Rollback possible

7. **Mise à jour Groupes**
   - Modification des groupes AD en lot
   - Actions : Ajouter, Supprimer, Remplacer
   - Limite : 100 utilisateurs

### 🔒 Sécurité et Validation

- **Double confirmation** pour les actions critiques
- **Validation des permissions** utilisateur
- **Limites** d'utilisateurs par action
- **Audit complet** de toutes les actions
- **Messages de confirmation** sécurisés

### 📊 Progression et Feedback

- **Barre de progression** en temps réel
- **Messages d'état** détaillés
- **Compteurs** succès/erreurs
- **Notifications** toast pour le feedback

### 🔄 Système de Rollback

- **Historique complet** des actions
- **Annulation** des actions critiques
- **Restauration** de l'état précédent
- **Persistance** des données d'audit

### 🎨 Interface Moderne

- **Animations Framer Motion** fluides
- **Design Material-UI** moderne
- **Responsive** mobile/desktop
- **Thème sombre/clair** supporté

## 🚀 Installation et Configuration

### Prérequis

```javascript
// Dépendances requises
import React from 'react';
import { motion } from 'framer-motion';
import {
    Box, Paper, Typography, Button, Dialog, // ... Material-UI
} from '@mui/material';
import apiService from '../../services/apiService';
import BulkActionsEngine from '../bulk/BulkActionsEngine';
```

### Import du composant

```javascript
import UsersBatchActions, { BULK_ACTIONS, useMultipleSelection } from './UsersBatchActions';
import useUsersBatchActions from './useUsersBatchActions';
```

## 💻 Utilisation

### Utilisation de base

```javascript
import React, { useState } from 'react';
import UsersBatchActions from './UsersBatchActions';

const MyUserManagement = () => {
    const [users, setUsers] = useState([]);
    
    const handleUsersUpdate = () => {
        // Recharger les données depuis l'API
        loadUsers();
    };

    return (
        <div>
            {/* Votre interface utilisateur */}
            
            <UsersBatchActions
                users={users}
                onUsersUpdate={handleUsersUpdate}
                currentUser={{ id: 'admin', role: 'admin' }}
                className="user-actions-container"
            />
        </div>
    );
};
```

### Utilisation du hook personnalisé

```javascript
import useUsersBatchActions from './useUsersBatchActions';

const MyComponent = () => {
    const batchActions = useUsersBatchActions();
    
    const handleCustomAction = async () => {
        try {
            const result = await batchActions.actions.exportUsersExcel(
                ['user1', 'user2', 'user3'],
                ['username', 'email', 'department'],
                { department: 'IT' }
            );
            
            console.log('Export terminé:', result);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    return (
        <div>
            {batchActions.isProcessing && (
                <div>
                    Progression: {batchActions.progress}%
                    <br />
                    Action: {batchActions.currentAction}
                </div>
            )}
            
            <Button onClick={handleCustomAction}>
                Export Personnalisé
            </Button>
        </div>
    );
};
```

### Configuration avancée

```javascript
const AdvancedUsersComponent = () => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    const batchActions = useUsersBatchActions();
    
    // Personnalisation des actions disponibles
    const customActions = {
        ...BULK_ACTIONS,
        CUSTOM_ACTION: {
            id: 'CUSTOM_ACTION',
            label: 'Action Personnalisée',
            icon: CustomIcon,
            color: 'secondary',
            description: 'Description de l\'action personnalisée',
            requiresConfirmation: true,
            maxUsers: 25
        }
    };

    return (
        <UsersBatchActions
            users={users}
            onUsersUpdate={handleUsersUpdate}
            currentUser={{ id: 'admin', role: 'admin' }}
            availableActions={customActions}
        />
    );
};
```

## 🔧 API et Méthodes

### Props du composant

| Prop | Type | Défaut | Description |
|------|------|---------|-------------|
| `users` | `Array` | Requis | Liste des utilisateurs |
| `onUsersUpdate` | `Function` | Requis | Callback après mise à jour |
| `currentUser` | `Object` | `{}` | Utilisateur actuel |
| `className` | `String` | `''` | Classes CSS additionnelles |
| `availableActions` | `Object` | `BULK_ACTIONS` | Actions personnalisables |

### Actions disponibles via le hook

```javascript
// Actions disponibles
const actions = {
    // Suppression
    deleteUsers: async (userIds, parameters) => Result,
    
    // Modification groupes
    updateUserGroups: async (userIds, groups, actionType) => Result,
    
    // Export Excel
    exportUsersExcel: async (userIds, fields, filters) => Result,
    
    // Export PDF
    exportUsersPDF: async (userIds, template) => Result,
    
    // Emails
    sendEmails: async (userIds, emailData) => Result,
    
    // Statut utilisateurs
    toggleUserStatus: async (userIds, enable) => Result,
    
    // Mise à jour en lot
    batchUpdateUsers: async (userIds, updates) => Result,
    
    // Rollback
    rollbackAction: async (actionId, actionData) => void
};
```

### Structure des résultats

```javascript
// Structure de retour standard
const result = {
    successful: 25,        // Nombre d'opérations réussies
    failed: 2,            // Nombre d'opérations échouées
    results: [            // Détails par utilisateur
        {
            userId: 'user1',
            success: true,
            // ... données spécifiques à l'action
        }
    ]
};
```

## 🎨 Personnalisation et Thèmes

### Styles CSS personnalisés

```css
.users-batch-actions {
    /* Styles pour la barre d'actions flottante */
}

.users-batch-actions .action-button {
    /* Styles pour les boutons d'action */
}

/* Animations personnalisées */
.users-batch-actions-enter {
    animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
    from {
        transform: translateY(100px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
```

### Thème sombre

```javascript
import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        // Configuration spécifique pour les actions en lot
        primary: {
            main: '#your-primary-color'
        },
        secondary: {
            main: '#your-secondary-color'
        }
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    // Styles pour les dialogues de confirmation
                }
            }
        }
    }
});
```

## 🔍 Exemples d'Utilisation Avancée

### Intégration avec une table de données

```javascript
import { DataGrid } from '@mui/x-data-grid';

const UsersDataGrid = () => {
    const [selection, setSelection] = useState([]);
    
    const columns = [
        { field: 'username', headerName: 'Nom d\'utilisateur', width: 150 },
        { field: 'displayName', headerName: 'Nom affiché', width: 200 },
        { field: 'email', headerName: 'Email', width: 250 },
        // ... autres colonnes
    ];

    return (
        <div>
            <DataGrid
                rows={users}
                columns={columns}
                checkboxSelection
                onRowSelectionModelChange={setSelection}
                selectionModel={selection}
            />
            
            <UsersBatchActions
                users={users.filter(user => selection.includes(user.id))}
                onUsersUpdate={loadUsers}
                currentUser={currentUser}
            />
        </div>
    );
};
```

### Workflow personnalisé

```javascript
const CustomWorkflow = () => {
    const batchActions = useUsersBatchActions();
    
    const handleAdvancedWorkflow = async (userIds) => {
        try {
            // Étape 1: Export des données actuelles
            const exportResult = await batchActions.actions.exportUsersExcel(userIds);
            
            // Étape 2: Mise à jour des groupes
            await batchActions.actions.updateUserGroups(
                userIds, 
                ['VPN', 'Internet'], 
                'add'
            );
            
            // Étape 3: Envoi d'emails de notification
            await batchActions.actions.sendEmails(userIds, {
                subject: 'Modification de vos groupes',
                message: 'Vos groupes ont été mis à jour.'
            });
            
            // Étape 4: Génération d'un rapport PDF
            await batchActions.actions.exportUsersPDF(userIds, 'detailed');
            
        } catch (error) {
            // En cas d'erreur, possibilité de rollback
            console.error('Erreur dans le workflow:', error);
        }
    };

    return (
        <Button onClick={() => handleAdvancedWorkflow(selectedUserIds)}>
            Exécuter Workflow Complet
        </Button>
    );
};
```

## 🛠️ Intégration avec les APIs DocuCortex

Le composant est entièrement intégré avec les APIs DocuCortex existantes :

```javascript
// Utilisation directe des APIs
import apiService from '../../services/apiService';

// Exemple d'intégration
const integrationExample = {
    // Les actions utilisent automatiquement ces APIs :
    
    // apiService.getUsers() - Récupération des utilisateurs
    // apiService.updateUser() - Mise à jour d'un utilisateur
    // apiService.deleteUser() - Suppression d'un utilisateur
    // apiService.getUserLoans() - Prêts utilisateur
    // apiService.updateUserGroups() - Gestion des groupes
    // apiService.sendNotification() - Notifications/Emails
    
    // Toutes les actions sont automatiquement auditées
    // via AuditService.logAction()
};
```

## 📝 Événements et Callbacks

```javascript
// Événements disponibles
const eventHandlers = {
    onActionStart: (action, userIds) => {
        console.log('Action démarrée:', action, userIds);
    },
    
    onActionProgress: (progress, message) => {
        console.log('Progression:', progress, message);
    },
    
    onActionComplete: (result) => {
        console.log('Action terminée:', result);
    },
    
    onActionError: (error, action) => {
        console.error('Erreur action:', error, action);
    },
    
    onRollback: (originalAction) => {
        console.log('Rollback effectué pour:', originalAction);
    }
};
```

## 🐛 Débogage et Logs

### Activation des logs de débogage

```javascript
// Activer les logs détaillés
localStorage.setItem('debug_batch_actions', 'true');

// Voir l'historique des actions
console.log(AuditService.getAuditHistory({
    actionId: 'users_bulk_action',
    dateFrom: '2024-01-01'
}));
```

### Tests et validation

```javascript
// Utilisation en mode test
const testMode = process.env.NODE_ENV === 'development';

if (testMode) {
    // Simulation d'API pour les tests
    window.mockApiService = {
        deleteUser: jest.fn().mockResolvedValue({ success: true }),
        updateUserGroups: jest.fn().mockResolvedValue({ success: true }),
        // ... autres mocks
    };
}
```

## 🚀 Performance et Optimisation

### Recommandations

1. **Pagination** : Utiliser la pagination pour les grandes listes (>1000 utilisateurs)
2. **Virtualisation** : Implémenter la virtualisation pour l'affichage
3. **Cache** : Utiliser le cache API pour éviter les rechargements
4. **Debounce** : Appliquer le debounce sur les recherches et filtres

```javascript
// Exemple d'optimisation
import { useMemo, useCallback, useDeferredValue } from 'react';

const OptimizedUsersComponent = () => {
    const deferredSearchTerm = useDeferredValue(searchTerm);
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.displayName.includes(deferredSearchTerm)
        );
    }, [users, deferredSearchTerm]);
    
    const handleBatchAction = useCallback(async (action, userIds) => {
        // Optimisation des actions en lot
        await batchActions.actions[action](userIds);
    }, [batchActions]);
    
    return (
        // JSX optimisé
    );
};
```

## 📚 Ressources et Documentation

- **Material-UI** : https://mui.com/
- **Framer Motion** : https://www.framer.com/motion/
- **Date-fns** : https://date-fns.org/
- **API DocuCortex** : Documentation API interne

## 🔧 Support et Maintenance

### Mise à jour du composant

Pour mettre à jour le composant, suivre ces étapes :

1. Sauvegarder la configuration personnalisée
2. Installer les nouvelles dépendances
3. Migrer les styles personnalisés
4. Tester les fonctionnalités

### Contributions

Pour contribuer au composant :

1. Fork du repository
2. Création d'une branche feature
3. Tests unitaires requis
4. Documentation mise à jour
5. Pull request avec description détaillée

---

## 📞 Support

Pour toute question ou problème avec ce composant :

- **Documentation** : Consultez ce README
- **Issues** : Utilisez le système de tickets
- **Tests** : Consultez `UsersBatchActionsDemo.js`
- **Logs** : Activez le mode debug pour plus d'informations

**Version** : 1.0.0  
**Dernière mise à jour** : 2024-11-15  
**Compatibilité** : React 18+, Material-UI 5+, Framer Motion 6+