# UserProfileEnhanced - Documentation Technique

## 📋 Vue d'ensemble

Le composant `UserProfileEnhanced` est un profil utilisateur enrichi avec onglets avancés, offrant une expérience moderne et interactive pour la gestion des profils dans DocuCortex.

## ✨ Fonctionnalités principales

### 🎯 6 Onglets structurés

1. **📝 Informations générales**
   - Photo de profil avec upload et preview
   - Informations personnelles (nom, fonction, service)
   - Informations de contact (email, téléphone, bureau)
   - Gestionnaire hiérarchique et date d'embauche

2. **👥 Groupes AD**
   - Auto-complétion intelligente des groupes Active Directory
   - Recherche en temps réel avec debouncing
   - Gestion des groupes avec types (security, distribution)
   - Historique des modifications de groupes

3. **📈 Historique activités**
   - Timeline des actions utilisateur
   - Filtrage par type d'activité
   - Détails étendus (IP, user agent, modifications)
   - Export des données d'activité

4. **📊 Statistiques usage**
   - Métriques principales (connexions, sessions, documents)
   - Graphiques de tendances mensuelles
   - Projets actifs et indicateurs de performance
   - Dashboard visuel avec cartes statistiques

5. **⚙️ Préférences**
   - Langue et fuseau horaire
   - Configuration des notifications (email, push, SMS)
   - Thème d'interface (clair, sombre, automatique)
   - Options d'affichage (mode compact)

6. **🔒 Audit trail**
   - Journal complet des actions et modifications
   - Traçabilité avec horodatage et utilisateur
   - Résultats d'actions (succès/échec)
   - Export pour conformité

### 🔧 Technologies et outils

- **React 18** avec hooks modernes
- **Material-UI v5** pour l'interface utilisateur
- **Framer Motion** pour les animations fluides
- **apiService.js** pour l'intégration API DocuCortex
- **Validation en temps réel** avec règles personnalisées
- **Debouncing** pour les recherches optimisées

## 🏗️ Architecture du composant

### Structure modulaire

```javascript
UserProfileEnhanced/
├── FormField (Composant de validation intelligente)
├── ProfilePhotoUpload (Gestionnaire d'upload photo)
├── ADGroupAutocomplete (Auto-complétion groupes AD)
├── TabContent (Contenu des onglets)
├── Actions (Gestion sauvegarde/annulation)
└── UI Components (Animation et interface)
```

### États et gestion des données

```javascript
const [
    activeTab,           // Onglet actif
    isEditing,           // Mode édition
    userData,            // Données utilisateur
    changes,             // Modifications non sauvegardées
    errors,              // Erreurs de validation
    selectedADGroups,    // Groupes AD sélectionnés
    preferences          // Préférences utilisateur
] = useState(/* initialisation */);
```

## 🔄 Flux de travail

### 1. Chargement initial
```javascript
useEffect(() => {
    if (open && user) {
        loadUserProfile();
    }
}, [open, user]);

const loadUserProfile = async () => {
    setIsLoading(true);
    try {
        const profileData = { ...user };
        await Promise.all([
            loadActivityHistory(),
            loadUsageStats(),
            loadPreferences(),
            loadAuditTrail()
        ]);
    } catch (error) {
        showNotification('error', 'Erreur de chargement');
    }
};
```

### 2. Validation en temps réel
```javascript
const validationRules = {
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: !value || emailRegex.test(value),
            message: value && !emailRegex.test(value) ? 'Format d\'email invalide' : ''
        };
    },
    phone: (value) => {
        const phoneRegex = /^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/;
        return {
            isValid: !value || phoneRegex.test(value.replace(/\s/g, '')),
            message: value && !phoneRegex.test(value.replace(/\s/g, '')) ? 'Format de téléphone invalide' : ''
        };
    }
};
```

### 3. Gestion des modifications
```javascript
const handleFieldChange = useCallback((field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    setChanges(prev => ({ ...prev, [field]: { from: prev[field], to: value } }));
    
    // Validation en temps réel
    if (validationRules[field]) {
        const validation = validationRules[field](value);
        setErrors(prev => ({
            ...prev,
            [field]: validation.isValid ? '' : validation.message
        }));
    }
}, []);
```

## 🎨 Animations et interface

### Variantes d'animation Framer Motion

```javascript
const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.3
        }
    }
};

const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            staggerChildren: 0.1
        }
    }
};
```

### Animations des onglets
- **Transition fluide** entre les onglets avec AnimatePresence
- **Staggering** des éléments enfants pour un effet sophistiqué
- **Hover effects** et micro-interactions

## 🔌 Intégration API

### Méthodes API DocuCortex utilisées

```javascript
// Récupération des données utilisateur
await apiService.getUserById(userId);

// Mise à jour du profil
await apiService.updateUser(userId, updates);

// Historique d'activité
await apiService.getUserActivity(userId, params);

// Statistiques d'usage
await apiService.getUserStatistics(userId);

// Audit trail
await apiService.getUserAuditTrail(userId);
```

### Gestion des erreurs et notifications
```javascript
try {
    await handleSave();
    showNotification('success', 'Profil mis à jour avec succès');
} catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification('error', 'Erreur lors de la sauvegarde du profil');
}
```

## 📱 Responsivité et accessibilité

### Breakpoints Material-UI
- **xs (< 600px)** : Layout vertical, onglets scrollables
- **sm (600px+)** : Deux colonnes pour informations
- **md (900px+)** : Layout optimisé avec sidebar
- **lg (1200px+)** : Interface complète avec toutes les fonctionnalités

### Accessibilité (WCAG AA)
- **Contraste** : Couleurs conformes AA (ratio 4.5:1)
- **Navigation clavier** : Support complet tab/enter/space
- **Screen readers** : Labels et descriptions appropriées
- **Focus management** : Indicateurs visuels clairs

## 🧪 Tests et validation

### Règles de validation implémentées
- **Email** : Format RFC 5322
- **Téléphone** : Format français international
- **Champs requis** : Validation au niveau composant
- **Longueur** : Limites de caractères appropriées

### États de validation
```javascript
const [errors, setErrors] = useState({});
const [validationRules, setValidationRules] = useState({
    email: validateEmail,
    phone: validatePhone,
    required: validateRequired
});
```

## 🚀 Performance et optimisations

### Optimisations React
- **React.memo** : Prévention des re-renders inutiles
- **useCallback** : Mémorisation des handlers
- **useMemo** : Calculs coûteux optimisés
- **Debouncing** : Recherche API avec délai

### Gestion de l'état
- **Local state** : Données temporaires et UI
- **Props drilling** : Évité avec context si nécessaire
- **Batch updates** : Optimisation des mises à jour

### Cache et persistance
```javascript
// Cache local pour éviter les requêtes répétées
const [cache, setCache] = useState(new Map());

// Sauvegarde automatique en localStorage
useEffect(() => {
    localStorage.setItem('user_profile_draft', JSON.stringify(userData));
}, [userData]);
```

## 🔧 Configuration et personnalisation

### Props du composant

| Prop | Type | Description | Défaut |
|------|------|-------------|---------|
| `open` | boolean | État d'ouverture du dialogue | - |
| `onClose` | function | Fermeture du dialogue | - |
| `user` | object | Données utilisateur à afficher | - |
| `onSave` | function | Callback de sauvegarde | - |
| `onCancel` | function | Callback d'annulation | - |
| `readOnly` | boolean | Mode lecture seule | false |

### Personnalisation du thème
```javascript
// Exemple de customisation
const customTheme = {
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0'
        }
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16
                }
            }
        }
    }
};
```

## 📦 Installation et utilisation

### 1. Import du composant
```javascript
import { UserProfileEnhanced } from '../components/users';
```

### 2. Utilisation de base
```javascript
const [profileOpen, setProfileOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);

<UserProfileEnhanced
    open={profileOpen}
    onClose={() => setProfileOpen(false)}
    user={selectedUser}
    onSave={async (userData, changes) => {
        // Logique de sauvegarde
        await apiService.updateUser(selectedUser.id, userData);
    }}
/>
```

### 3. Utilisation en mode lecture seule
```javascript
<UserProfileEnhanced
    open={profileOpen}
    onClose={() => setProfileOpen(false)}
    user={selectedUser}
    readOnly={true}
/>
```

## 🔮 Évolutions futures

### Fonctionnalités prévues
- **Synchronisation temps réel** : WebSocket pour updates live
- **Éditeur WYSIWYG** : Formattage riche pour les descriptions
- **Templates de profil** : Modèles prédéfinis par rôle
- **Import/export** : Formats JSON, CSV, Excel
- **Historique versions** : Comparaison et rollback
- **Workflow d'approbation** : Validation multi-niveaux
- **Intégration IA** : Suggestions automatiques
- **Géolocalisation** : Données de position

### Améliorations techniques
- **Tests unitaires** : Couverture complète avec Jest/Testing Library
- **Tests e2e** : Cypress pour tests d'intégration
- **Performance** : Virtualisation pour grandes listes
- **PWA** : Fonctionnement hors ligne
- **Internationalisation** : Support multi-langues
- **Sécurité** : Chiffrement des données sensibles

## 📞 Support et contact

Pour toute question ou demande d'amélioration du composant UserProfileEnhanced, consultez la documentation DocuCortex ou contactez l'équipe de développement.

---

*Documentation générée le 15 novembre 2025 - Version 1.0.0*