# TechnicianPhotoManager - Composant de Gestion des Photos de Techniciens

Un composant React avancé pour la gestion intelligente des photos de techniciens avec cache optimisé, lazy loading, fallback automatique vers les initiales et animations fluides.

## ✨ Fonctionnalités

### 🔧 Fonctionnalités Principales
- **Affichage intelligent** : Affichage automatique des photos uploadées ou des initiales
- **Cache optimisé** : Système de cache intelligent pour optimiser les performances
- **Fallback automatique** : Basculement automatique vers les initiales en cas d'erreur
- **Interface responsive** : Support adaptatif pour toutes les tailles d'écran
- **Animations fluides** : Animations Framer Motion pour une expérience utilisateur premium
- **Performance optimisée** : Lazy loading et optimisations mémoire
- **Support multi-tailles** : Gestion adaptative des différentes tailles d'écran

### 🚀 Optimisations Techniques
- **Lazy Loading** : Chargement différé des images basé sur la visibilité
- **Intersection Observer** : Détection optimisée du viewport
- **Cache mémoire** : Gestion intelligente de la mémoire avec limite
- **Préchargement** : Anticipation du chargement des images critiques
- **Error Handling** : Gestion robuste des erreurs de chargement

## 📦 Installation

### Dépendances Requises
```bash
npm install react framer-motion
```

### Structure des Fichiers
```
components/
├── TechnicianPhotoManager.js
├── TechnicianPhotoManager.index.js
├── hooks/
│   └── useIntersectionObserver.js
└── README_TechnicianPhotoManager.md
```

## 🎯 Utilisation

### Importation de Base
```javascript
import { TechnicianPhotoManager } from './TechnicianPhotoManager.js';
```

### Utilisation Simple
```javascript
const technician = {
  id: 1,
  name: "Jean Dupont",
  email: "jean.dupont@company.com",
  photo: "https://example.com/photo.jpg" // ou null pour les initiales
};

<TechnicianPhotoManager 
  technician={technician} 
  size={48} 
/>
```

### Utilisation Avancée
```javascript
<TechnicianPhotoManager 
  technician={technician}
  size={{
    xs: 24,   // Mobile
    sm: 32,   // Tablette
    md: 48,   // Desktop
    lg: 64    // Grand écran
  }}
  showBorder={true}
  borderColor="border-blue-500"
  onPhotoClick={(tech) => console.log('Photo cliquée:', tech)}
  priority="high" // "high" ou "normal"
  className="shadow-lg hover:shadow-xl"
/>
```

## 🎨 Variantes de Composants

### 1. TechnicianPhotoGrid - Liste avec Compteur
```javascript
import { TechnicianPhotoGrid } from './TechnicianPhotoManager.js';

<TechnicianPhotoGrid 
  technicians={techniciansList}
  size={40}
  maxVisible={5}
  onTechnicianClick={(tech) => handleClick(tech)}
  showMoreCount={true}
/>
```

### 2. TechnicianPhotoGallery - Galerie en Grille
```javascript
import { TechnicianPhotoGallery } from './TechnicianPhotoManager.js';

<TechnicianPhotoGallery 
  technicians={techniciansList}
  columns={4}
  gap={16}
  onPhotoSelect={(tech) => handleSelect(tech)}
/>
```

## 🛠️ API Reference

### TechnicianPhotoManager Props

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `technician` | Object | Requis | Objet technicien avec name, photo, email |
| `size` | number/string/object | 48 | Taille de l'avatar (xs, sm, md, lg, xl, 2xl) ou responsive object |
| `className` | string | '' | Classes CSS additionnelles |
| `showBorder` | boolean | true | Afficher la bordure |
| `borderColor` | string | 'border-white' | Couleur de la bordure |
| `onPhotoClick` | function | null | Callback lors du clic sur la photo |
| `priority` | string | 'normal' | Priorité de chargement ('high' ou 'normal') |

### TechnicianPhotoGrid Props

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `technicians` | Array | [] | Liste des techniciens |
| `size` | number/string | 48 | Taille des avatars |
| `maxVisible` | number | 5 | Nombre maximum d'avatars visibles |
| `onTechnicianClick` | function | null | Callback lors du clic |
| `showMoreCount` | boolean | true | Afficher le compteur des éléments restants |

### TechnicianPhotoGallery Props

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `technicians` | Array | [] | Liste des techniciens |
| `columns` | number | 4 | Nombre de colonnes dans la grille |
| `gap` | number | 16 | Espacement entre les éléments |
| `onPhotoSelect` | function | null | Callback lors de la sélection |

## 📱 Responsive Design

### Tailles Disponibles
```javascript
// Tailles prédéfinies
size="xs"  // 24px
size="sm"  // 32px
size="md"  // 48px (défaut)
size="lg"  // 64px
size="xl"  // 80px
size="2xl" // 96px

// Taille fixe
size={64}

// Objet responsive
size={{
  xs: 32,  // Mobile
  sm: 40,  // Tablette
  md: 48,  // Desktop
  lg: 56   // Grand écran
}}
```

## 🎭 Gestion des États

### États des Images
1. **Chargement** : Skeleton loader animé
2. **Chargée** : Affichage fluide de l'image
3. **Erreur** : Fallback automatique vers les initiales
4. **Non visible** : Placeholder gris (lazy loading)

### Animations Disponibles
- **Entrée** : Apparition avec scale et fade
- **Hover** : Effet de survol avec scale
- **Chargement** : Skeleton avec pulse
- **Erreur** : Transition fluide vers initiales

## 🔧 Utilitaires

### Préchargement d'Images
```javascript
import { preloadImage, clearImageCache } from './TechnicianPhotoManager.js';

// Précharger une image
preloadImage('https://example.com/photo.jpg')
  .then(() => console.log('Image préchargée'))
  .catch(err => console.error('Erreur:', err));

// Vider le cache
clearImageCache();
```

### Hook Personnalisé
```javascript
import { useTechnicianPhotos } from './TechnicianPhotoManager.js';

function MyComponent({ technician }) {
  const { 
    imageSrc, 
    isLoading, 
    error, 
    initials, 
    hasImage 
  } = useTechnicianPhotos(technician);

  // Utiliser les données...
}
```

## 🎨 Customisation

### Styles Personnalisés
```css
/* Classes utilitaires personnalisées */
.my-photo {
  @apply shadow-lg ring-2 ring-blue-500;
}

.my-initials {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Couleurs Générées
Les initiales utilisent une couleur générée de manière déterministe basée sur le nom :
- HSL avec hue calculé
- Saturation 65%, Luminosité 55%
- Dégradé léger pour l'effet

## 🚀 Performances

### Optimisations Incluses
- **Cache mémoire** : Limité à 50 images pour éviter les fuites
- **Lazy loading** : Chargement différé avec intersection observer
- **Priorisation** : Images prioritaires chargées immédiatement
- **Préchargement** : Anticipation des images critiques

### Métriques de Performance
- Temps de chargement initial < 100ms
- Lazy loading avec seuil de 10% de visibilité
- Cache intelligent avec gestion de la mémoire
- Animations 60fps avec Framer Motion

## 🧪 Tests et Débogage

### Console de Débogage
```javascript
// Vérifier la taille du cache
import { getImageCacheSize } from './TechnicianPhotoManager.js';
console.log('Images en cache:', getImageCacheSize());
```

### États de Débogage
- Hover pour voir l'icône de visualisation
- Console log pour les chargements d'images
- Monitoring des erreurs de réseau

## 📋 Exemples Complet

### Dashboard Techniciens
```javascript
import React from 'react';
import { TechnicianPhotoManager, TechnicianPhotoGrid } from './TechnicianPhotoManager.js';

function TechniciansDashboard() {
  const technicians = [
    { id: 1, name: "Jean Dupont", email: "jean@company.com", photo: "/photos/jean.jpg" },
    { id: 2, name: "Marie Martin", email: "marie@company.com" },
    // ...
  ];

  return (
    <div className="space-y-8">
      {/* Vue globale */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Équipe Technique</h2>
        <TechnicianPhotoGrid 
          technicians={technicians}
          maxVisible={6}
          onTechnicianClick={(tech) => openProfile(tech)}
        />
      </div>

      {/* Détails individuels */}
      <div className="grid grid-cols-3 gap-4">
        {technicians.map(tech => (
          <div key={tech.id} className="text-center">
            <TechnicianPhotoManager 
              technician={tech}
              size="xl"
              onPhotoClick={() => openProfile(tech)}
              className="mx-auto mb-2"
            />
            <p className="text-sm text-gray-600">{tech.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔄 Mises à Jour et Maintenance

### Versioning
- Version actuelle : 1.0.0
- Compatibilité React : 16.8+
- Maintenance active

### Contributions
1. Fork le projet
2. Créer une branche feature
3. Commit avec messages clairs
4. Pull request avec documentation

---

## 📞 Support

Pour toute question ou problème :
- Consulter cette documentation
- Vérifier les exemples fournis
- Tester avec les données de démonstration

**Développé avec ❤️ pour DocuCortex Enhanced**