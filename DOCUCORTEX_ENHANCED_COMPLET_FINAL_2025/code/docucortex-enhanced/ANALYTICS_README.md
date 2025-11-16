# Dashboard Analytics Avancé - DocuCortex

## 📊 Vue d'ensemble

Le Dashboard Analytics Avancé de DocuCortex offre une interface complète de visualisation et d'analyse des données de prêts avec des fonctionnalités sophistiquées d'analytics temporels, de comparaisons de périodes et de métriques de performance.

## 🚀 Fonctionnalités Principales

### 1. **AdvancedAnalyticsDashboard** - Tableau de Bord Principal
- Interface unifiée pour tous les composants analytics
- Système de filtrage multi-critères avancé
- Mises à jour temps réel via WebSocket
- Configuration personnalisable et sauvegarde
- Export de données (CSV, JSON, PDF)

### 2. **TimelineWidget** - Chronologie Interactive
- **Fonctionnalités clés :**
  - Visualisation temporelle des prêts sur 7j, 30j, 90j, 1an
  - Zoom interactif et brush selection
  - Lignes de tendance et baseline
  - Multiple métriques (prêts, retours, revenus, actifs)
  - Graphiques en lignes ou zones
  - Calculs statistiques avancés

- **Métriques disponibles :**
  - Nouveaux prêts
  - Retours
  - Prêts actifs
  - Revenus générés

### 3. **DistributionChart** - Graphiques de Répartition
- **Types de graphiques :**
  - Secteurs (Pie Chart)
  - Barres
  - Radar
  - Treemap

- **Dimensions d'analyse :**
  - Répartition par statut
  - Répartition par département
  - Répartition par type d'équipement

- **Fonctionnalités avancées :**
  - Filtrage par pourcentage minimum
  - Limitation du nombre d'éléments
  - Calcul du coefficient de Gini
  - Détection des concentrations

### 4. **ActivityHeatmap** - Carte de Chaleur d'Activité
- **Modes de visualisation :**
  - Utilisateur ↔ Document
  - Temps ↔ Utilisateur
  - Temps ↔ Document

- **Fonctionnalités :**
  - Échelles d'intensité linéaires ou logarithmiques
  - Schémas de couleurs personnalisables
  - Filtrage et recherche
  - Cellules sélectionnables
  - Légende dynamique

### 5. **PerformanceGraph** - Métriques et KPIs
- **Métriques de performance :**
  - Taux d'utilisation (%)
  - Durée moyenne des prêts (jours)
  - Taux de retour (%)
  - Taux de retard (%)

- **Analyses avancées :**
  - Scores de performance calculés
  - Détection des alertes (warning/critical)
  - Moyennes mobiles
  - Lignes de baseline et cibles
  - Analyse des tendances

### 6. **ComparisonWidget** - Comparaisons de Périodes
- **Modes de comparaison :**
  - Période précédente
  - Mois sur mois (MoM)
  - Année sur année (YoY)

- **Types d'affichage :**
  - Graphiques superposés
  - Barres côte à côte
  - Différences

- **Analyses :**
  - Calculs d'évolution (%)
  - Insights automatiques
  - Tendances globales

## 📋 Installation et Utilisation

### Prérequis
```bash
npm install recharts date-fns framer-motion
```

### Import des Composants
```javascript
// Import du dashboard complet
import { AdvancedAnalyticsDashboard } from './components/analytics';

// Import des composants individuels
import { TimelineWidget, DistributionChart, ActivityHeatmap, PerformanceGraph, ComparisonWidget } from './components/analytics';
```

### Utilisation de Base

#### 1. Dashboard Complet
```javascript
<AdvancedAnalyticsDashboard
    height="100vh"
    defaultPeriod="30d"
    autoRefresh={true}
    refreshInterval={60000}
    enableExport={true}
    enableRealTime={true}
/>
```

#### 2. Composant Timeline
```javascript
<TimelineWidget
    data={timelineData}
    height={400}
    showControls={true}
    enableZoom={true}
    enableBrush={true}
    enableExport={true}
/>
```

#### 3. Composant Distribution
```javascript
<DistributionChart
    data={distributionData}
    height={350}
    showControls={true}
    showDetails={true}
    enableExport={true}
/>
```

#### 4. Composant Heatmap
```javascript
<ActivityHeatmap
    data={heatmapData}
    height={350}
    showControls={true}
    showDetails={true}
    enableExport={true}
/>
```

#### 5. Composant Performance
```javascript
<PerformanceGraph
    data={performanceData}
    height={350}
    showControls={true}
    showDetails={true}
    realTimeUpdates={true}
/>
```

#### 6. Composant Comparaison
```javascript
<ComparisonWidget
    data={comparisonData}
    height={350}
    showControls={true}
    showDetails={true}
    enableExport={true}
/>
```

## 🔧 Configuration Avancée

### Filtres et Paramètres

#### Système de Filtrage
```javascript
const filters = {
    period: '30d',           // 7d, 30d, 90d, 1y, custom
    startDate: '2024-01-01', // Pour période custom
    endDate: '2024-01-31',   // Pour période custom
    users: [],               // IDs des utilisateurs
    documents: [],           // IDs des documents
    statuses: [],            // Statuts de prêts
    departments: [],         // Départements
    equipmentTypes: []       // Types d'équipements
};
```

#### Configuration Dashboard
```javascript
const dashboardConfig = {
    visibleCharts: ['timeline', 'distribution', 'heatmap', 'performance'],
    chartPositions: {
        timeline: { order: 1, visible: true, size: 'large' },
        distribution: { order: 2, visible: true, size: 'medium' },
        heatmap: { order: 3, visible: true, size: 'medium' },
        performance: { order: 4, visible: true, size: 'large' },
        comparison: { order: 5, visible: false, size: 'medium' }
    },
    settings: {
        autoRefresh: true,
        realTimeUpdates: true,
        showTooltips: true,
        enableDrillDown: true,
        animationSpeed: 300,
        colorScheme: 'default'
    }
};
```

### Formats de Données

#### Timeline Data
```javascript
const timelineData = [
    {
        date: '2024-01-01',
        loans: 15,
        returns: 12,
        active: 23,
        revenue: 1250.50
    },
    // ...
];
```

#### Distribution Data
```javascript
const distributionData = {
    byStatus: [
        { name: 'Actifs', value: 45, color: '#4CAF50' },
        { name: 'Retournés', value: 32, color: '#2196F3' },
        { name: 'En retard', value: 8, color: '#F44336' }
    ],
    byDepartment: [
        { name: 'IT', value: 25 },
        { name: 'RH', value: 18 },
        // ...
    ],
    byType: [
        { name: 'Ordinateurs', value: 30 },
        { name: 'Tablettes', value: 15 },
        // ...
    ]
};
```

#### Heatmap Data
```javascript
const heatmapData = [
    {
        user: 'user123',
        document: 'doc456',
        value: 5,
        intensity: 0.5
    },
    // ...
];
```

#### Performance Data
```javascript
const performanceData = {
    utilizationRate: 75.5,
    avgLoanDuration: 8.2,
    returnRate: 92.3,
    overdueRate: 3.2,
    // Données temporelles pour les graphiques...
};
```

## 🎛️ API et Méthodes

### AdvancedAnalyticsDashboard

#### Props
```typescript
interface AdvancedAnalyticsDashboardProps {
    height?: string;                    // Hauteur du dashboard
    defaultPeriod?: string;             // Période par défaut
    autoRefresh?: boolean;              // Actualisation automatique
    refreshInterval?: number;           // Intervalle en ms
    enableExport?: boolean;             // Autoriser l'export
    enableRealTime?: boolean;           // Mises à jour temps réel
}
```

#### Méthodes Disponibles
- `loadInitialData()` : Charge les données initiales
- `calculateAnalytics(loans)` : Calcule les analytics
- `exportData(format)` : Exporte les données
- `updateFilters(newFilters)` : Met à jour les filtres
- `saveConfig()` : Sauvegarde la configuration

### TimelineWidget

#### Props
```typescript
interface TimelineWidgetProps {
    data: TimelineDataPoint[];          // Données temporelles
    height?: number;                    // Hauteur en px
    filters?: FilterConfig;             // Configuration des filtres
    settings?: WidgetSettings;          // Paramètres du widget
    showControls?: boolean;             // Afficher les contrôles
    enableZoom?: boolean;               // Activer le zoom
    enableBrush?: boolean;              // Activer la brush
    enableExport?: boolean;             // Autoriser l'export
}
```

#### Événements
- `onPointHover(data)` : Survol d'un point
- `onPointClick(data)` : Clic sur un point
- `onZoomChange(level)` : Changement de zoom

### DistributionChart

#### Props
```typescript
interface DistributionChartProps {
    data: DistributionData;             // Données de distribution
    height?: number;                    // Hauteur en px
    showControls?: boolean;             // Afficher les contrôles
    showDetails?: boolean;              // Afficher les détails
    enableExport?: boolean;             // Autoriser l'export
}
```

#### Types de Graphiques
- `'pie'` : Graphique en secteurs
- `'bar'` : Graphique en barres
- `'radar'` : Graphique radar
- `'treemap'` : Carte proportionnelle

### ActivityHeatmap

#### Props
```typescript
interface ActivityHeatmapProps {
    data: HeatmapDataPoint[];           // Données de heatmap
    height?: number;                    // Hauteur en px
    showControls?: boolean;             // Afficher les contrôles
    showDetails?: boolean;              // Afficher les détails
    enableExport?: boolean;             // Autoriser l'export
}
```

#### Modes de Heatmap
- `'user_document'` : Utilisateur ↔ Document
- `'time_user'` : Temps ↔ Utilisateur  
- `'time_document'` : Temps ↔ Document

### PerformanceGraph

#### Props
```typescript
interface PerformanceGraphProps {
    data: PerformanceData;              // Données de performance
    height?: number;                    // Hauteur en px
    showControls?: boolean;             // Afficher les contrôles
    showDetails?: boolean;              // Afficher les détails
    realTimeUpdates?: boolean;          // Mises à jour temps réel
}
```

#### Métriques Supportées
- `'utilizationRate'` : Taux d'utilisation
- `'avgLoanDuration'` : Durée moyenne des prêts
- `'returnRate'` : Taux de retour
- `'overdueRate'` : Taux de retard

### ComparisonWidget

#### Props
```typescript
interface ComparisonWidgetProps {
    data: ComparisonData;               // Données de comparaison
    height?: number;                    // Hauteur en px
    showControls?: boolean;             // Afficher les contrôles
    showDetails?: boolean;              // Afficher les détails
    enableExport?: boolean;             // Autoriser l'export
}
```

#### Modes de Comparaison
- `'period'` : Période précédente
- `'month_over_month'` : Mois sur mois
- `'year_over_year'` : Année sur année

## 🎨 Personnalisation Thématique

### Couleurs Personnalisées
```javascript
const customTheme = {
    palette: {
        primary: {
            main: '#your-primary-color'
        },
        secondary: {
            main: '#your-secondary-color'
        }
    }
};
```

### Schémas de Couleurs pour Graphiques
```javascript
const colorSchemes = {
    default: ['#3f51b5', '#f44336', '#4caf50', '#ff9800'],
    red: ['#f44336', '#ff5722', '#e91e63', '#ad1457'],
    green: ['#4caf50', '#8bc34a', '#009688', '#00695c'],
    blue: ['#2196f3', '#03a9f4', '#00bcd4', '#0097a7']
};
```

## 📱 Responsive Design

Le dashboard s'adapte automatiquement aux différentes tailles d'écran :

### Desktop (≥1200px)
- Dashboard complet avec tous les widgets
- Contrôles détaillés
- Exports multiples formats
- Zoom et navigation avancés

### Tablet (768px - 1199px)
- Disposition adaptée en grille
- Contrôles simplifiés
- Tooltips optimisés
- Navigation tactile

### Mobile (<768px)
- Widgets empilés verticalement
- Interface compacte
- Gestes tactiles
- FAB pour actions rapides

## 🔄 Intégration Temps Réel

### WebSocket Events
```javascript
// Écoute des événements temps réel
webSocketService.on('loan_update', (data) => {
    // Mise à jour des données de prêts
});

webSocketService.on('analytics_update', (data) => {
    // Mise à jour des analytics
});

webSocketService.on('kpi_alert', (alert) => {
    // Notification d'alerte KPI
});
```

### Configuration WebSocket
```javascript
const wsConfig = {
    url: 'ws://localhost:8080/analytics',
    reconnectInterval: 5000,
    maxRetries: 10
};
```

## 📊 Export de Données

### Formats Supportés
- **CSV** : Données tabulaires
- **JSON** : Structure complète
- **PDF** : Rapport formaté (à venir)

### Méthode d'Export
```javascript
await dashboard.exportData('csv');   // Export CSV
await dashboard.exportData('json');  // Export JSON
```

### Structure des Données Exportées
```json
{
    "exportDate": "2024-01-15T10:30:00Z",
    "filters": { /* Filtres appliqués */ },
    "timeline": [ /* Données timeline */ ],
    "distribution": { /* Données distribution */ ],
    "heatmap": [ /* Données heatmap */ ],
    "performance": { /* Données performance */ ],
    "kpis": { /* Métriques calculées */ }
}
```

## 🚨 Gestion des Alertes

### Types d'Alertes
- **Critical** : Valeurs critiques nécessitant une action immédiate
- **Warning** : Attention requise, seuil d'alerte dépassé
- **Info** : Notifications informatives
- **Success** : Confirmation d'actions

### Configuration des Seuils
```javascript
const alertThresholds = {
    utilizationRate: { warning: 70, critical: 90 },
    overdueRate: { warning: 5, critical: 10 },
    returnRate: { warning: 85, critical: 70 }
};
```

## 🛠️ Dépannage

### Problèmes Courants

#### 1. Données ne s'affichent pas
- Vérifier le format des données
- Contrôler la console pour les erreurs
- Valider les types de données

#### 2. Performance dégradée
- Réduire le nombre de points de données
- Désactiver les animations
- Augmenter l'intervalle de rafraîchissement

#### 3. Erreurs d'export
- Vérifier les permissions de téléchargement
- Contrôler la taille des données
- Tester avec des jeux de données plus petits

### Logs et Débogage
```javascript
// Activer les logs détaillés
localStorage.setItem('analytics_debug', 'true');

// Voir les logs dans la console
console.log('[Analytics Debug]', data);
```

## 📚 Exemples d'Utilisation

### Exemple Complet
Voir le fichier `src/demo/AnalyticsDemo.js` pour un exemple d'implémentation complet avec données de démonstration.

### Cas d'Usage
1. **Monitoring quotidien** : Suivi des KPIs en temps réel
2. **Analyse comparative** : Comparaison mois sur mois/année sur année
3. **Détection d'anomalies** : Identification des variations inhabituelles
4. **Rapports de performance** : Génération automatique de rapports
5. **Optimisation des ressources** : Analyse de l'utilisation des équipements

## 🔮 Évolutions Futures

### Fonctionnalités Prévues
- [ ] Export PDF natif
- [ ] Machine Learning pour prédictions
- [ ] Analytics prédictives
- [ ] Intégration API externe
- [ ] Tableau de bord mobile natif
- [ ] Notifications push
- [ ] Sauvegarde cloud des configurations

---

## 📞 Support

Pour toute question ou assistance technique concernant le Dashboard Analytics Avancé, consultez la documentation technique ou contactez l'équipe de développement DocuCortex.

**Version :** 2.0.0  
**Dernière mise à jour :** Janvier 2024  
**Compatibilité :** React 18+, Material-UI 5+, Recharts 2.8+