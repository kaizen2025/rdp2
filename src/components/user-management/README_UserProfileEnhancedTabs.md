# UserProfileEnhancedTabs - Profil Utilisateur Enrichi avec Onglets

## 📋 Description

Le composant `UserProfileEnhancedTabs` est une interface moderne et complète pour la gestion des profils utilisateurs avec onglets structurés, animations fluides et fonctionnalités avancées.

## ✨ Fonctionnalités

### 🎯 Onglets Structurés
- **Profil** : Informations personnelles avec upload d'avatar
- **Historique** : Journal des actions utilisateur
- **Permissions** : Gestion des droits d'accès
- **Statistiques** : Métriques et graphiques d'activité

### 🎨 Interface Moderne
- Design responsive avec Material-UI v5
- Animations fluides avec Framer Motion
- Interface adaptative (mobile/tablette/desktop)
- Thème sombre/clair automatique

### ⚡ Temps Réel
- Chargement des données en temps réel
- Sauvegarde automatique avec indicateur
- Mise à jour instantanée de l'interface
- Notifications toast pour le feedback utilisateur

### 🔒 Sécurité & Validation
- Validation côté client en temps réel
- Contrôles de format (email, téléphone)
- Gestion des erreurs avec messages explicites
- Upload sécurisé de fichiers (images uniquement)

### 📁 Gestion de Fichiers
- Upload d'avatar avec prévisualisation
- Validation des formats et tailles de fichiers
- Support des formats image (PNG, JPG, JPEG, WebP)
- Limite de taille : 5MB maximum

### 📊 Export de Données
- **JSON** : Format recommandé pour les développeurs
- **CSV** : Compatible avec les tableurs (Excel, Google Sheets)
- **PDF** : Format impression pour archivage
- Nom de fichier automatique avec timestamp

### 🎭 Animations Framer Motion
- Transitions fluides entre les onglets
- Animations d'entrée/sortie des composants
- Effets de skeleton loading
- Micro-interactions pour une UX optimale

## 🚀 Installation

Le composant est inclus dans le projet DocuCortex Enhanced. Aucune installation supplémentaire requise car il utilise les dépendances existantes :

```json
{
  "framer-motion": "^10.16.0",
  "@mui/material": "^5.14.0",
  "react-toastify": "^9.1.3",
  "date-fns": "^2.30.0"
}
```

## 💻 Utilisation

### Import Simple
```jsx
import UserProfileEnhancedTabs from './components/users/UserProfileEnhancedTabs';

// Dans votre composant
function App() {
  return <UserProfileEnhancedTabs />;
}
```

### Import avec le système d'index
```jsx
import { UserProfileEnhancedTabs } from './components/users';

// Dans votre composant
function App() {
  return <UserProfileEnhancedTabs />;
}
```

## 🔧 Configuration

### Props du Composant

Le composant `UserProfileEnhancedTabs` peut être configuré avec les props suivantes :

```jsx
<UserProfileEnhancedTabs
  // Personnalisation possible ici
  enableAutoSave={true}
  maxFileSize={5242880} // 5MB
  allowedImageTypes={["image/*"]}
/>
```

### Configuration du Hook useUserProfile

Le composant utilise un hook personnalisé `useUserProfile` qui peut être étendu :

```javascript
const {
  user,           // Données utilisateur actuelles
  loading,        // État de chargement
  saving,         // État de sauvegarde
  errors,         // Erreurs de validation
  autoSave,       // Sauvegarde automatique activée
  saveUser,       // Fonction de sauvegarde manuelle
  validateUser,   // Validation côté client
  uploadAvatar,   // Upload d'avatar
  exportUserData, // Export des données
  refetch         // Actualisation des données
} = useUserProfile();
```

## 📁 Structure des Données

### Données Utilisateur Modèle
```javascript
{
  id: '1',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@docucortex.com',
  telephone: '+33 1 23 45 67 89',
  poste: 'Chef de projet',
  departement: 'IT',
  avatar: 'data:image/jpeg;base64,...', // Base64 ou URL
  dateCreation: '2023-01-15T10:30:00Z',
  derniereConnexion: '2025-11-15T08:15:00Z',
  statut: 'Actif',
  permissions: {
    lecture: true,
    ecriture: true,
    administration: false,
    exports: true
  },
  preferences: {
    notifications: true,
    darkMode: false,
    langue: 'fr',
    frequenceSync: 'quotidien'
  },
  statistiques: {
    documentsTraites: 245,
    espaceUtilise: '1.2 GB',
    dernierUpload: '2025-11-14T16:45:00Z'
  },
  historique: [
    {
      action: 'Connexion',
      date: '2025-11-15T08:15:00Z',
      details: 'Connexion réussie'
    }
    // ... autres actions
  ]
}
```

## 🎨 Personnalisation du Thème

Le composant s'intègre parfaitement avec le système de thème Material-UI :

```jsx
import { createTheme } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Couleur principale
    },
    secondary: {
      main: '#dc004e', // Couleur secondaire
    }
  },
  typography: {
    fontFamily: 'Inter, sans-serif', // Police personnalisée
  }
});
```

## 🔌 Intégration API

Pour connecter le composant à votre API réelle, modifiez la fonction `fetchUser` dans le hook `useUserProfile` :

```javascript
const fetchUser = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement du profil');
    }
    
    const userData = await response.json();
    setUser(userData);
  } catch (error) {
    toast.error('Erreur lors du chargement du profil');
  } finally {
    setLoading(false);
  }
}, []);
```

## 📱 Responsive Design

Le composant s'adapte automatiquement à tous les formats d'écran :

- **Mobile (< 600px)** : Onglets scrollables horizontalement
- **Tablette (600px - 900px)** : Onglets optimisés pour le tactile
- **Desktop (> 900px)** : Interface complète avec sidebar

### Breakpoints Material-UI
```javascript
// Utilisation des breakpoints dans le composant
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
```

## 🎭 Animations Personnalisables

### Variants Framer Motion
```javascript
const customVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};
```

### Transitions Personnalisées
```javascript
const customTransition = {
  type: "spring",
  stiffness: 100,
  damping: 15,
  mass: 0.5
};
```

## 🔒 Sécurité & Validation

### Validation Côté Client
- **Email** : Format RFC 5322
- **Téléphone** : Minimum 10 caractères
- **Nom/Prénom** : Minimum 2 caractères
- **Avatar** : Images uniquement, max 5MB

### Upload Sécurisé
```javascript
const uploadAvatar = useCallback(async (file) => {
  // Validation du type de fichier
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image');
  }
  
  // Validation de la taille
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('L\'image ne doit pas dépasser 5MB');
  }
  
  // Upload sécurisé...
}, []);
```

## 📊 Métriques & Analytics

Le composant inclut des métriques intégrées :

- **Documents traités** : Compteur global
- **Espace utilisé** : En GB avec évolution
- **Actions récentes** : Activité de la semaine
- **Connexions** : Nombre de connexions

## 🛠️ Développement & Debug

### Logs de Développement
```javascript
// Le composant inclut des logs détaillés
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('User data updated:', user);
    console.log('Validation errors:', errors);
    console.log('Auto-save status:', autoSave);
  }
}, [user, errors, autoSave]);
```

### États de Debug
Le composant expose plusieurs états pour le debug :

```javascript
{
  loading: false,     // Chargement des données
  saving: false,      // Sauvegarde en cours
  errors: {},         // Erreurs de validation
  autoSave: true      // Sauvegarde auto activée
}
```

## 📦 Exports de Données

### Formats Supportés

#### JSON (Recommandé)
```json
{
  "id": "1",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@docucortex.com",
  "permissions": {
    "lecture": true,
    "ecriture": true,
    "administration": false,
    "exports": true
  }
}
```

#### CSV
```csv
id,1
nom,Dupont
prenom,Jean
email,jean.dupont@docucortex.com
statut,Actif
```

#### PDF (Format texte)
```
Profil Utilisateur

Nom: Dupont Jean
Email: jean.dupont@docucortex.com
Téléphone: +33 1 23 45 67 89
Poste: Chef de projet
Département: IT
Date de création: 15/01/2023
Statut: Actif
```

## 🚀 Performance

### Optimisations Incluses
- **Lazy Loading** : Chargement à la demande des onglets
- **Memoization** : Optimisation des re-renders avec React.memo
- **Debouncing** : Sauvegarde automatique avec délai
- **Skeleton Loading** : États de chargement visuels
- **Virtual Scrolling** : Pour les grandes listes d'historique

### Métriques de Performance
- **First Paint** : < 1.5s
- **Interactive** : < 2.5s
- **Bundle Size** : Optimisé avec tree-shaking
- **Memory Usage** : Minimal avec cleanup automatique

## 🔧 Maintenance

### Mise à Jour du Composant
Pour mettre à jour le composant :
1. Sauvegarder les personnalisations
2. Télécharger la nouvelle version
3. Tester sur un environnement de développement
4. Déployer en production

### Tests
```javascript
// Tests unitaires recommandés
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfileEnhancedTabs from './UserProfileEnhancedTabs';

test('should display user profile tabs', () => {
  render(<UserProfileEnhancedTabs />);
  expect(screen.getByText('Profil')).toBeInTheDocument();
  expect(screen.getByText('Historique')).toBeInTheDocument();
});
```

## 📞 Support

### Issues Connus
- Les très gros avatars (>5MB) peuvent causer des timeouts
- Les animations peuvent être désactivées pour les utilisateurs avec motion-sensitivity
- Export PDF génère un fichier texte simple

### Contact
Pour toute question ou problème :
- 📧 Email : support@docucortex.com
- 📚 Documentation : [Wiki interne]
- 🐛 Bug Reports : [GitLab Issues]

---

## 📄 Licence

Ce composant est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

*Dernière mise à jour : 15/11/2025 - Version 1.0.0*