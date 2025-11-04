# Tests de Performance UI - Réactivité sous Charge

Ce système de test complet évalue les performances de réactivité de l'interface utilisateur sous charge, incluant les interactions utilisateur, animations, virtualisation du DOM, menus dynamiques et notifications WebSocket.

## 📁 Structure du Projet

```
ui-reactivity/
├── config/
│   ├── jest-ui.config.js          # Configuration Jest pour tests UI
│   └── performance-config.js      # Configuration des seuils de performance
├── utils/
│   ├── performance-utils.js       # Utilitaires de mesure et benchmark
│   ├── globalSetup.js            # Setup global des tests
│   └── globalTeardown.js         # Nettoyage et rapport final
├── fixtures/
│   └── test-fixtures.js          # Données de test et fixtures
├── __mocks__/
│   └── fileMock.js               # Mock pour les fichiers statiques
├── results/                      # Rapports de test générés
├── user-interactions.test.js     # Tests de performance des interactions
├── animations-fluidity.test.js   # Tests des animations et transitions
├── virtual-dom-performance.test.js # Tests du Virtual DOM
├── dynamic-menus.test.js         # Tests des menus dynamiques
├── websocket-notifications.test.js # Tests des notifications WebSocket
└── concurrent-users-simulator.js # Simulateur d'utilisateurs concurrents
```

## 🚀 Utilisation

### Installation des dépendances

```bash
npm install --save-dev jest puppeteer @testing-library/react @testing-library/jest-dom
npm install --save-dev @mui/material @mui/icons-material @react-spring/web
npm install jest-html-reporters
```

### Configuration

1. **Jest Configuration** - Importez la configuration dans votre `jest.config.js`:

```javascript
module.exports = {
  // ... autres configurations
  setupFilesAfterEnv: ['<rootDir>/tests/performance/ui-reactivity/setup.js'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/performance/ui-reactivity/**/*.test.{js,jsx,ts,tsx}']
};
```

2. **Variables d'environnement** - Créez un fichier `.env.test`:

```env
UI_PERFORMANCE_BASE_URL=http://localhost:3000
UI_PERFORMANCE_CONCURRENT_USERS=50
UI_PERFORMANCE_TEST_DURATION=60000
```

### Exécution des Tests

#### Tests unitaires de performance
```bash
# Tous les tests
npm test ui-reactivity

# Tests spécifiques
npm test user-interactions.test.js
npm test animations-fluidity.test.js
npm test virtual-dom-performance.test.js
npm test dynamic-menus.test.js
npm test websocket-notifications.test.js
```

#### Tests de charge avec simulation d'utilisateurs
```bash
# Exécution du simulateur standalone
node tests/performance/ui-reactivity/concurrent-users-simulator.js

# Avec configuration personnalisée
const { runConcurrentUserTest } = require('./tests/performance/ui-reactivity/concurrent-users-simulator');
await runConcurrentUserTest({
  concurrentUsers: 100,
  testDuration: 120000,
  baseUrl: 'http://localhost:3000'
});
```

## 📊 Types de Tests

### 1. Tests de Performance des Interactions Utilisateur

Évalue les temps de réponse pour:
- **Clics simples et complexes**
- **Saisie dans les formulaires**
- **Filtrage et recherche**
- **Navigation dans les listes**

**Seuils de performance:**
- Clic simple: < 16ms (60fps)
- Saisie formulaire: < 50ms
- Filtrage 1000 éléments: < 100ms

### 2. Tests de Fluidité des Animations

Mesure les performances des animations:
- **Animations CSS et Material-UI**
- **Transitions et transformations**
- **60fps et accélération GPU**
- **Memory leaks lors d'animations répétées**

**Métriques évaluées:**
- Frame rate minimum: 30fps
- Frame rate moyen: 55fps
- Durée des transitions: < 350ms

### 3. Tests de Performance du Virtual DOM

Teste l'optimisation avec:
- **React.memo et useMemo**
- **Virtualisation des grandes listes**
- **Filtrage avec memoization**
- **Gestion de 100K+ éléments**

**Benchmarks:**
- 1000 éléments: < 50ms
- 10K éléments: < 200ms
- 100K éléments (virtualisé): < 1s

### 4. Tests de Réactivité des Menus Dynamiques

Évalue les performances de:
- **Génération de menus hiérarchiques**
- **Recherche et filtrage en temps réel**
- **Navigation avec virtualisation**
- **Menus intelligents avec catégorisation**

**Métriques:**
- Génération menu: < 100ms
- Recherche: < 80ms
- Navigation virtualisée: < 50ms

### 5. Tests de Performance des Notifications WebSocket

Mesure:
- **Latence de connexion WebSocket**
- **Throughput des notifications**
- **Gestion de la file d'attente**
- **Performance avec 1000+ notifications**

**Seuils:**
- Connexion WebSocket: < 100ms
- Latence notification: < 50ms
- Throughput: > 1000 msg/sec

## 🔧 Utilisation des Utilitaires

### PerformanceProfiler

```javascript
const { PerformanceProfiler } = require('./utils/performance-utils');

const profiler = new PerformanceProfiler();

// Mesurer une opération
profiler.start('my-operation');
// ... opération à mesurer ...
profiler.end('my-operation');

// Obtenir les statistiques
const stats = profiler.getStats('my-operation');
console.log(`Moyenne: ${stats.average}ms`);
console.log(`P95: ${stats.p95}ms`);

// Vérifier un seuil
const result = profiler.checkThreshold('my-operation', 100);
console.log(result.passed ? 'OK' : result.reason);
```

### TestDataGenerator

```javascript
const { TestDataGenerator } = require('./utils/performance-utils');

const generator = new TestDataGenerator();

// Générer des éléments de liste
const listItems = generator.generateListItems(1000, {
  includeChildren: true,
  categories: ['A', 'B', 'C'],
  maxScore: 100
});

// Générer des notifications
const notifications = generator.generateNotifications(500, {
  severities: ['info', 'warning', 'error'],
  types: ['system', 'user']
});

// Générer des menus
const menuItems = generator.generateMenuItems(100, {
  maxDepth: 3,
  includeIcons: true
});
```

### UserInteractionSimulator

```javascript
const { UserInteractionSimulator } = require('./utils/performance-utils');

// Simuler un clic
const clickTime = await UserInteractionSimulator.click(element);

// Simuler la saisie
const typeTime = await UserInteractionSimulator.type(inputElement, 'texte à saisir');

// Simuler le scroll
const scrollTime = await UserInteractionSimulator.scroll(container, 1000);
```

### BenchmarkSuite

```javascript
const { BenchmarkSuite } = require('./utils/performance-utils');

// Benchmark simple
const result = await BenchmarkSuite.benchmark(
  'my-function', 
  async () => { await myFunction(); },
  100
);

// Benchmark comparatif
const comparison = await BenchmarkSuite.compare(
  'sorting',
  {
    'builtin-sort': () => arr.sort(),
    'custom-sort': () => customSort(arr)
  },
  100
);
```

## 📈 Configuration des Seuils

Modifiez `config/performance-config.js` pour ajuster les seuils:

```javascript
module.exports = {
  performanceThresholds: {
    // Interactions utilisateur
    clickResponse: 16,      // 60fps
    formInput: 50,
    filterResponse: 100,
    
    // Animations
    animationFrame: 16.67,  // 60fps
    animationDuration: 300,
    
    // Virtual DOM
    render1000: 50,
    render10000: 200,
    
    // WebSocket
    websocketConnection: 100,
    notificationLatency: 50
  }
};
```

## 🔍 Simulation d'Utilisateurs Concurrents

### Configuration de base

```javascript
const { runConcurrentUserTest } = require('./concurrent-users-simulator');

await runConcurrentUserTest({
  baseUrl: 'http://localhost:3000',
  concurrentUsers: 50,
  testDuration: 60000,        // 1 minute
  rampUpTime: 10000,          // 10 secondes
  scenarios: {
    navigation: { weight: 30, actions: [...] },
    formInteraction: { weight: 25, actions: [...] }
  }
});
```

### Scénarios Personnalisés

```javascript
const customScenario = {
  weight: 20,
  actions: [
    { type: 'click', selector: '[data-testid="dashboard"]', delay: 100 },
    { type: 'input', selector: '[data-testid="search"]', value: 'test', delay: 200 },
    { type: 'scroll', selector: '[data-testid="results"]', amount: 500, delay: 300 }
  ]
};
```

## 📊 Rapports et Métriques

### Types de Rapports Générés

1. **Rapports JSON** - Données détaillées pour analyse
2. **Rapports HTML** - Visualisations interactives
3. **Rapports CSV** - Export pour outils externes

### Métriques Collectées

- **Temps de réponse** (moyenne, P50, P95, P99)
- **Throughput** (requêtes/seconde)
- **Taux d'erreur** (%)
- **Utilisation mémoire** (MB)
- **Frame rate** (fps)
- **Temps de rendu** (ms)

### Exemple d'Analyse

```javascript
// Dans un test
const result = await testUserInteraction();
expect(result.averageResponseTime).toBeLessThan(50);
expect(result.errorRate).toBeLessThan(2);
expect(result.memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
```

## 🛠️ Optimisations Mesurées

### React.memo et useMemo
```javascript
// Test de l'efficacité de la memoization
const OptimizedComponent = memo(({ data, filter }) => {
  const filteredData = useMemo(() => 
    data.filter(item => item.name.includes(filter)),
    [data, filter]
  );
  
  return <List items={filteredData} />;
});
```

### Virtualisation des Listes
```javascript
// Test avec 50K éléments virtualisés
const VirtualizedList = memo(({ items }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const visibleItems = useMemo(() => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = start + VISIBLE_COUNT;
    return items.slice(start, end);
  }, [items, scrollTop]);
  
  return <div>{visibleItems.map(item => <Item key={item.id} {...item} />)}</div>;
});
```

### Debouncing pour Recherche
```javascript
// Test de performance avec debouncing
const useDebouncedValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```env
# Tests
UI_TEST_TIMEOUT=30000
UI_PERFORMANCE_BASE_URL=http://localhost:3000

# Simulation
SIMULATE_CONCURRENT_USERS=100
SIMULATE_TEST_DURATION=120000
SIMULATE_RAMP_UP=15000

# Rapport
REPORT_FORMAT=json,html
REPORT_OUTPUT_DIR=./results
```

### Customisation des Mocks

```javascript
// Mock WebSocket réaliste
const mockWebSocket = RealisticMocks.createRealisticWebSocket();
mockWebSocket.simulateMessage({ type: 'test', data: 'message' });

// Mock API avec délai variable
const mockApi = RealisticMocks.createRealisticApi();
await mockApi.get('/data'); // ~50-250ms de délai
```

## 📝 Écriture de Nouveaux Tests

### Template de Test de Performance

```javascript
describe('Mon Test de Performance', () => {
  test('mesure la performance de ma fonctionnalité', async () => {
    const user = userEvent.setup();
    
    // Préparer le composant
    render(<MonComposant />);
    
    // Mesurer la performance
    const startTime = performance.now();
    
    // Effectuer l'action
    await user.click(screen.getByTestId('mon-bouton'));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Assertions de performance
    expect(duration).toBeLessThan(50); // < 50ms
    expect(screen.getByTestId('resultat')).toBeInTheDocument();
  });
});
```

### Test de Charge

```javascript
test('teste avec 1000 éléments', async () => {
  const largeData = generateTestData(1000);
  
  const renderStart = performance.now();
  render(<DataTable data={largeData} />);
  const renderTime = performance.now() - renderStart;
  
  expect(renderTime).toBeLessThan(200); // < 200ms pour 1000 éléments
  
  const filterStart = performance.now();
  fireEvent.change(screen.getByTestId('filter'), { 
    target: { value: 'test' } 
  });
  const filterTime = performance.now() - filterStart;
  
  expect(filterTime).toBeLessThan(100); // < 100ms pour filtrer 1000 éléments
});
```

## 🚨 Dépannage

### Problèmes Courants

1. **Tests timeout** - Augmentez `jest.setTimeout()`
2. **Mémoire insuffisante** - Réduisez la taille des datasets
3. **WebSocket non disponible** - Utilisez les mocks fournis
4. **Performances irrégulières** - Utilisez `jest.retryTimes()`

### Debug des Performances

```javascript
// Activer le profiling détaillé
global.performanceProfiler.start('debug-operation');
// ... test ...
const stats = global.performanceProfiler.getStats('debug-operation');
console.log('Debug stats:', stats);
```

### Logs de Performance

```javascript
// Ajouter des logs personnalisés
console.time('mon-operation');
await performOperation();
console.timeEnd('mon-operation');
// Output: mon-operation: 45.123ms
```

## 📚 Références

- [Documentation React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [Jest Performance Testing](https://jestjs.io/docs/tutorial-async)
- [Puppeteer Documentation](https://pptr.dev/)
- [Material-UI Performance](https://mui.com/material-ui/getting-started/usage/#performance)

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -am 'Ajoute ma fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.