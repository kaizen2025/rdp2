# HeaderPhotoComponent - Documentation

Composant moderne de sélection de photo de technicien pour le header de DocuCortex Enhanced.

## 🚀 Fonctionnalités

- **Affichage photo technicien sélectionné** : Avatar avec nom et rôle dans le header
- **Dropdown interactif** : Menu avec recherche et filtrage des techniciens
- **Prévisualisation rapide** : Dialog de prévisualisation avec détails complets
- **Animations fluides** : Transitions avec Framer Motion
- **Persistance utilisateur** : Sauvegarde automatique de la sélection
- **Interface Material-UI** : Design moderne et responsive
- **Gestion des favoris** : Ajout/suppression de techniciens favoris
- **Raccourcis clavier** : Support Ctrl+K pour ouverture rapide
- **Recherche intelligente** : Recherche par nom, rôle, département
- **Responsive** : Adaptation automatique mobile/desktop

## 📦 Installation

Le composant est prêt à l'emploi et utilise les dépendances existantes du projet :

- React 18+
- Material-UI (MUI) v5+
- Framer Motion
- Système d'animations DocuCortex

## 🔧 Utilisation

### Utilisation basique

```jsx
import HeaderPhotoComponent from './components/HeaderPhotoComponent';

// Données des techniciens
const availableTechnicians = [
  {
    id: 'tech-1',
    name: 'Jean Dupont',
    role: 'Technicien Principal',
    department: 'Informatique',
    avatar: '/images/technicians/jean.jpg',
    email: 'jean.dupont@entreprise.com',
    phone: '+33 1 23 45 67 89',
    status: 'Disponible',
    bio: 'Spécialiste en systèmes informatiques avec 10 ans d\'expérience.'
  },
  {
    id: 'tech-2',
    name: 'Marie Martin',
    role: 'Technicien Réseau',
    department: 'Télécommunications',
    avatar: '/images/technicians/marie.jpg',
    email: 'marie.martin@entreprise.com',
    status: 'En intervention'
  }
];

// Utilisation dans le header
function AppHeader() {
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  return (
    <Header
      component={
        <HeaderPhotoComponent
          availableTechnicians={availableTechnicians}
          selectedTechnician={selectedTechnician}
          onTechnicianChange={setSelectedTechnician}
        />
      }
    />
  );
}
```

### Configuration avancée

```jsx
<HeaderPhotoComponent
  // Données
  availableTechnicians={technicians}
  selectedTechnician={selectedTechnician}
  onTechnicianChange={handleTechnicianChange}
  
  // Options d'affichage
  variant="default" // 'default', 'minimal', 'compact'
  size="medium" // 'small', 'medium', 'large'
  position="right" // 'left', 'center', 'right'
  
  // Fonctionnalités
  enableSearch={true}
  enablePreview={true}
  enableKeyboardShortcuts={true}
  showStatus={true}
  showFavoriteOnly={false}
  
  // Persistance
  persistSelection={true}
  storageKey="docucortex_selected_technician"
  customStorage={customStorageFunction}
  
  // Raccourcis clavier
  keyboardShortcuts={{
    openDropdown: 'Ctrl+K',
    close: 'Escape'
  }}
/>
```

## 📋 Props

### Props principales

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `availableTechnicians` | `Array<TechData>` | `[]` | Liste des techniciens disponibles |
| `selectedTechnician` | `TechData \| null` | `null` | Technicien actuellement sélectionné |
| `onTechnicianChange` | `function` | - | Callback lors du changement de sélection |

### Props d'interface

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'default' \| 'minimal' \| 'compact'` | `'default'` | Style d'affichage |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Taille de l'avatar |
| `position` | `'left' \| 'center' \| 'right'` | `'right'` | Position du dropdown |
| `showStatus` | `boolean` | `true` | Afficher le statut du technicien |

### Props de fonctionnalités

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `enableSearch` | `boolean` | `true` | Activer la recherche |
| `enablePreview` | `boolean` | `true` | Activer la prévisualisation |
| `enableKeyboardShortcuts` | `boolean` | `true` | Raccourcis clavier |
| `showFavoriteOnly` | `boolean` | `false` | Filtrer par favoris |

### Props de persistance

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `persistSelection` | `boolean` | `true` | Sauvegarder la sélection |
| `storageKey` | `string` | `'docucortex_selected_technician'` | Clé de stockage |
| `customStorage` | `function \| null` | `null` | Stockage personnalisé |

## 📊 Structure des données

### TechData (Interface du technicien)

```typescript
interface TechData {
  id: string;           // Identifiant unique
  name: string;         // Nom complet
  role?: string;        // Rôle/fonction
  department?: string;  // Département
  avatar?: string;      // URL de l'avatar (optionnel)
  photo?: string;       // URL de la photo (alternative à avatar)
  email?: string;       // Email
  phone?: string;       // Téléphone
  status?: string;      // Statut (Disponible, En intervention, etc.)
  bio?: string;         // Biographie/description
}
```

## 🎨 Styles et thèmes

Le composant s'adapte automatiquement au thème Material-UI :

- **Couleurs** : Utilise les couleurs du thème
- **Typographie** : Respecte la hiérarchie typographique
- **Espacement** : Conforme aux spécifications Material-UI
- **Responsive** : Adaptation automatique mobile/desktop

### Variantes disponibles

1. **`default`** : Affichage complet avec nom et rôle
2. **`minimal`** : Avatar uniquement
3. **`compact`** : Avatar avec tooltip au hover

## ⌨️ Raccourcis clavier

- **`Ctrl+K`** : Ouvrir le dropdown de sélection
- **`Escape`** : Fermer les modales et dropdowns
- **Navigation clavier** : Dans le dropdown avec les flèches

## 💾 Persistance des données

### LocalStorage par défaut
```javascript
// Données sauvegardées automatiquement
{
  "id": "tech-1",
  "name": "Jean Dupont", 
  "timestamp": 1640995200000
}

// Favoris sauvegardés séparément
["tech-1", "tech-3", "tech-5"]
```

### Stockage personnalisé
```javascript
const customStorage = {
  async getItem(key) {
    // Récupération personnalisée (API, IndexedDB, etc.)
    return await myDatabase.get(key);
  },
  async setItem(key, value) {
    // Sauvegarde personnalisée
    await myDatabase.set(key, value);
  }
};
```

## 🔄 Animations

### Animations Framer Motion utilisées
- **Entrée/Sortie** : Fade + scale avec eased transitions
- **Hover effects** : Scale + shadow elevations
- **Sélection feedback** : Quick scale animation
- **Stagger animations** : Pour les listes d'éléments

### Configuration responsive
- **Respect des préférences utilisateur** : Animations désactivées si `prefers-reduced-motion`
- **Performance optimisée** : Animations GPU-accelerated
- **Fallbacks** : Transitions CSS pour les anciens navigateurs

## 📱 Responsive Design

### Points de rupture
- **Mobile** (`< 600px`) : Avatar compact, texte caché
- **Tablet** (`600px - 900px`) : Affichage hybride
- **Desktop** (`> 900px`) : Affichage complet

### Adaptations automatiques
- Menu dropdown repositionné automatiquement
- Dialog de prévisualisation adaptée à l'écran
- Textes tronqués avec ellipsis
- Touch-friendly sur mobile

## 🧪 Tests et exemples

### Exemple avec gestion d'état
```jsx
import { useState, useEffect } from 'react';

function HeaderWithTechnician() {
  const [selectedTech, setSelectedTech] = useState(null);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    // Charger les techniciens depuis l'API
    fetchTechnicians().then(setTechnicians);
  }, []);

  const handleTechnicianChange = (tech) => {
    setSelectedTech(tech);
    // Actions supplémentaires (analytics, etc.)
    console.log('Technicien sélectionné:', tech);
  };

  return (
    <HeaderPhotoComponent
      availableTechnicians={technicians}
      selectedTechnician={selectedTech}
      onTechnicianChange={handleTechnicianChange}
      enableSearch={true}
      showFavoriteOnly={false}
    />
  );
}
```

## 🔧 Intégration avec DocuCortex

### Hook personnalisé recommandé
```javascript
import { useHeaderPhoto } from './hooks/useHeaderPhoto';

function DocuCortexHeader() {
  const {
    selectedTechnician,
    technicians,
    changeTechnician,
    favorites
  } = useHeaderPhoto();

  return (
    <HeaderPhotoComponent
      availableTechnicians={technicians}
      selectedTechnician={selectedTechnician}
      onTechnicianChange={changeTechnician}
      persistSelection={true}
      storageKey="docucortex_user_technician"
    />
  );
}
```

### Integration avec le système d'authentification
```javascript
// Utilisation avec le contexte d'authentification
const { user, logout } = useAuth();
const { selectedTech } = useHeaderPhoto(user.id);
```

## 🐛 Dépannage

### Problèmes courants

1. **Avatar non affiché** : Vérifiez les URLs des images
2. **Persistance non fonctionnelle** : Vérifiez les permissions LocalStorage
3. **Animations saccadées** : Vérifiez les performances GPU
4. **Menu mal positionné** : Vérifiez le CSS et les z-index

### Debugging
```javascript
// Activer le mode debug
window.DEBUG_HEADER_PHOTO = true;

// Logs détaillés disponibles
console.log('HeaderPhoto debug mode activé');
```

## 🚀 Performances

- **Lazy loading** : Images chargées à la demande
- **Memoization** : Optimisation des calculs React
- **Virtualisation** : Pour de grandes listes (>100 techniciens)
- **Debounce** : Recherche optimisée

## 🔮 Évolutions futures

- [ ] Support drag & drop pour réorganiser
- [ ] Intégration avec calendriers
- [ ] Notifications en temps réel
- [ ] Historique des sélections
- [ ] Import/export de configurations
- [ ] Support multi-langues

## 📄 Licence

Composant intégré à DocuCortex Enhanced - Tous droits réservés.