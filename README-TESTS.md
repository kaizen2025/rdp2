# Guide des Tests - Module Prêts de Matériel

## Vue d'ensemble

Cette suite de tests couvre de manière exhaustive le module Prêts de Matériel de RDS Viewer Anecoop. Les tests sont organisés en trois catégories principales : unitaires, d'intégration et de performance.

## Installation des Dépendances

```bash
# Installer les dépendances de test
npm install

# Vérifier l'installation
npm test
```

## Structure des Tests

```
src/tests/
├── loans.test.js                     # Tests unitaires (474 lignes)
├── loans-integration.test.js         # Tests d'intégration (498 lignes)
├── loans-performance.test.js         # Tests de performance (587 lignes)
├── TestProviders.js                  # Providers et helpers (457 lignes)
├── setup.js                          # Configuration environnement (347 lignes)
└── __mocks__/
    ├── loanData.js                   # Données mockées (503 lignes)
    └── fileMock.js                   # Mock pour les fichiers
```

## Exécution des Tests

### Commandes NPM

```bash
# Tous les tests du module prêts
npm run test:loans-all

# Tests unitaires uniquement
npm run test:loans-unit

# Tests d'intégration
npm run test:loans-integration

# Tests de performance
npm run test:loans-performance

# Tests avec couverture
npm run test:loans-coverage

# Tests en mode watch (développement)
npm run test:loans-watch

# Tests CI (intégration continue)
npm run test:loans-ci
```

### Commandes Jest Directes

```bash
# Tests unitaires
npm test src/tests/loans.test.js

# Tests d'intégration
npm test src/tests/loans-integration.test.js

# Tests de performance
npm test src/tests/loans-performance.test.js

# Tests spécifiques
npm test src/tests/loans.test.js -- --testNamePattern="LoanFilters"

# Tests avec coverage
npm test -- --coverage --watchAll=false

# Tests verbose
npm test src/tests/loans.test.js -- --verbose
```

## Composants Testés

### 1. LoanFilters (Filtres Avancés)

**Tests Unitaires :**
- ✅ Rendu initial avec état par défaut
- ✅ Expansion/fermeture des filtres
- ✅ Filtrage par statut (active, overdue, returned, etc.)
- ✅ Filtrage par plage de dates
- ✅ Sélection de technicien via Autocomplete
- ✅ Filtrage par nom ordinateur/utilisateur/département
- ✅ Affichage compteur filtres actifs
- ✅ Réinitialisation complète des filtres

**Tests d'Intégration :**
- ✅ Filtres appliqués puis export
- ✅ Persistance des critères de filtrage
- ✅ Combinaison multiple de filtres

### 2. LoanExportButton (Export de Données)

**Tests Unitaires :**
- ✅ Rendu du bouton export
- ✅ État désactivé sans données
- ✅ Ouverture menu d'options (Excel/PDF)
- ✅ État de chargement pendant export
- ✅ Désactivation pendant traitement

**Tests d'Intégration :**
- ✅ Export Excel avec données filtrées
- ✅ Export PDF formaté
- ✅ Génération et téléchargement de fichiers
- ✅ Gestion d'erreurs d'export

### 3. LoanQRCodeDialog (Codes QR)

**Tests Unitaires :**
- ✅ Non-affichage sans ordinateur
- ✅ Affichage dialog avec données
- ✅ Génération QR code avec données ordinateur
- ✅ Saisie et affichage texte personnalisé
- ✅ Affichage conditionnel numéro de série
- ✅ Fonctions d'impression et téléchargement

**Tests d'Intégration :**
- ✅ Workflow complet génération → impression
- ✅ Personnalisation étiquette → QR → impression
- ✅ Téléchargement image PNG
- ✅ Ouverture fenêtre impression système

### 4. LoanList (Liste des Prêts)

**Tests Unitaires :**
- ✅ Rendu table avec colonnes
- ✅ Filtrage par statut
- ✅ Recherche textuelle
- ✅ Actions boutons (retour, modification, etc.)
- ✅ Ouverture dialogs appropriés

**Tests d'Intégration :**
- ✅ Workflow CRUD complet
- ✅ Changements de vue liste ↔ calendrier
- ✅ Actions enchaînées
- ✅ Gestion d'erreurs API

### 5. LoansCalendar (Calendrier)

**Tests Unitaires :**
- ✅ Rendu en-tête et statistiques
- ✅ Navigation temporelle (précédent/suivant/aujourd'hui)
- ✅ Affichage prêts par jour
- ✅ Détails au clic sur jour

**Tests d'Intégration :**
- ✅ Synchronisation liste ↔ calendrier
- ✅ Visualisation statuts par couleur
- ✅ Tooltips informatifs
- ✅ Compteurs temps réel

## Scénarios de Test

### 1. Création de Prêt

```javascript
// Test case: Création prêt complet
test('should create complete loan with accessories', async () => {
    const loanData = {
        computerId: 1,
        userId: 1,
        loanDate: '2024-11-01T09:00:00Z',
        expectedReturnDate: '2024-11-15T18:00:00Z',
        accessories: ['Souris', 'Clavier'],
        notes: 'Prêt projet X'
    };
    
    const result = await mockApiService.createLoan(loanData);
    expect(result.id).toBeDefined();
    expect(result.status).toBe('active');
});
```

### 2. Expiration de Prêt

```javascript
// Test case: Détection prêt en retard
test('should detect overdue loans', () => {
    const overdueLoan = createMockLoan({
        loanDate: '2024-10-01T00:00:00Z',
        expectedReturnDate: '2024-10-08T00:00:00Z',
        actualReturnDate: null,
        status: 'active'
    });
    
    const isOverdue = new Date() > new Date(overdueLoan.expectedReturnDate);
    expect(isOverdue).toBe(true);
});
```

### 3. Export de Données

```javascript
// Test case: Export Excel filtré
test('should export filtered loans to Excel', async () => {
    const filteredLoans = mockLoans.filter(l => l.status === 'active');
    const exportButton = renderWithProviders(<LoanExportButton loans={filteredLoans} />);
    
    fireEvent.click(exportButton.getByText('Exporter'));
    fireEvent.click(exportButton.getByText('Excel'));
    
    await waitFor(() => {
        expect(mockApiService.exportLoans).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ status: 'active' })
            ])
        );
    });
});
```

### 4. QR Codes

```javascript
// Test case: Génération étiquette QR
test('should generate QR code for loan label', async () => {
    const computer = mockComputers[0];
    const loan = mockLoans[0];
    
    renderWithProviders(
        <LoanQRCodeDialog open={true} computer={computer} loan={loan} />
    );
    
    // Saisir texte personnalisé
    const textField = screen.getByLabelText('Texte personnalisé');
    fireEvent.change(textField, { target: { value: 'Bureau IT' } });
    
    // Tester impression
    const printButton = screen.getByText('Imprimer');
    fireEvent.click(printButton);
    
    expect(window.open).toHaveBeenCalled();
});
```

## Mock Data

### Données de Base

```javascript
// Techniciens
const mockTechnicians = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@anecoop.fr' },
    { id: 2, name: 'Marie Martin', email: 'marie.martin@anecoop.fr' }
    // ... 4 techniciens total
];

// Ordinateurs
const mockComputers = [
    {
        id: 1,
        name: 'PC-001',
        serial_number: 'SN001234',
        type: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7420'
    }
    // ... 5 ordinateurs représentatifs
];

// Prêts avec différents statuts
const mockLoans = [
    { id: 1, status: 'active', computerName: 'PC-001', /* ... */ },
    { id: 2, status: 'overdue', computerName: 'PC-002', /* ... */ },
    { id: 3, status: 'reserved', computerName: 'PC-003', /* ... */ },
    { id: 4, status: 'returned', computerName: 'PC-004', /* ... */ },
    { id: 5, status: 'critical', computerName: 'PC-005', /* ... */ }
];
```

### Génération de Données Volumineuses

```javascript
// Générer 1000 prêts pour tests de performance
const largeDataset = generateLargeMockData(1000);

// Créer prêt personnalisé
const customLoan = createMockLoan({
    status: 'critical',
    priority: 'urgent',
    accessories: ['Item1', 'Item2']
});
```

## Métriques de Performance

### Seuils Définis

```javascript
const PERFORMANCE_THRESHOLDS = {
    RENDER_TIME: 100,        // Temps rendu < 100ms
    FILTER_TIME: 50,         // Temps filtrage < 50ms
    SEARCH_TIME: 30,         // Temps recherche < 30ms
    EXPORT_TIME: 1000,       // Temps export < 1s
    QR_GENERATION_TIME: 200, // Génération QR < 200ms
    MEMORY_USAGE: 50 * 1024 * 1024 // Usage mémoire < 50MB
};
```

### Tests de Performance

```javascript
// Test rendu avec gros volume
test('should render with 1000 loans efficiently', () => {
    const startTime = performance.now();
    render(<LoanList loans={largeDataset} />);
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME);
});
```

## Couverture de Code

### Objectifs

- **Lignes** : ≥ 80%
- **Fonctions** : ≥ 80%
- **Branches** : ≥ 80%
- **Déclarations** : ≥ 80%

### Zones Critiques (≥ 85%)

- `src/components/loan-management/*.js`
- `src/pages/Loans*.js`

### Génération du Rapport

```bash
# Rapport complet
npm run test:loans-coverage

# Rapport HTML
open coverage/loans/index.html
```

## Debugging

### Techniques

```javascript
// Debug DOM
screen.debug(); // Affiche le DOM actuel

// Debug spécifique élément
screen.debug(screen.getByText('Prêt'));

// Logs dans tests
console.log('Debug info:', someData);

// Tests isolés
test.only('only this test runs', () => {
    // ...
});

// Ignorer test
test.skip('this test is skipped', () => {
    // ...
});
```

### Debug Avancé

```javascript
// Hook personnalisé pour tests
const { executeAsync, waitForCondition } = useTestHelpers();

// Mesure performance
const { average, min, max } = measurePerformance(() => {
    // Operation à tester
}, 100);

// Check mémoire
const memoryUsage = checkMemoryUsage();
console.log('Memory usage:', memoryUsage);
```

## Maintenance

### Ajout de Nouveaux Tests

1. **Identifier le composant** à tester
2. **Créer le test** dans le fichier approprié
3. **Ajouter les données mockées** si nécessaire
4. **Exécuter et vérifier** la couverture
5. **Mettre à jour la documentation**

### Exemple Nouveau Test

```javascript
describe('NouveauComposant', () => {
    test('should handle specific scenario', async () => {
        // Arrange
        render(<NouveauComposant props={mockProps} />);
        
        // Act
        const button = screen.getByText('Action');
        fireEvent.click(button);
        
        // Assert
        await waitFor(() => {
            expect(screen.getByText('Résultat')).toBeInTheDocument();
        });
    });
});
```

### Mise à Jour des Mocks

Quand les données réelles changent :

1. **Modifier** `src/tests/__mocks__/loanData.js`
2. **Ajuster** les tests existants
3. **Ajouter** nouveaux tests si nécessaire
4. **Vérifier** la couverture

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test-loans.yml
name: Tests Prêts de Matériel

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - run: npm install
      - run: npm run test:loans-ci
      - run: npm run test:loans-coverage
```

## Bonnes Pratiques

### 1. Tests Idempotents
- Les tests doivent pouvoir être répétés sans effet de bord
- Nettoyer après chaque test

### 2. Tests Descriptifs
- Noms de tests explicites
- Structure Arrange-Act-Assert claire

### 3. Mocking Approprié
- Mocker seulement les dépendances externes
- Garder les tests proches du code réel

### 4. Performance
- Tests rapides (< 1s chacun)
- Réutiliser les mocks entre tests

### 5. Maintenabilité
- Code de test DRY
- Helpers réutilisables
- Documentation à jour

## Conclusion

Cette suite de tests garantit :
- ✅ **Fonctionnalité complète** du module Prêts
- ✅ **Robustesse** face aux erreurs
- ✅ **Performance** optimale
- ✅ **Maintenabilité** à long terme
- ✅ **Évolutivité** pour nouvelles fonctionnalités

Les tests sont essentiels pour maintenir la qualité et la fiabilité du système de gestion des prêts d'Anecoop.
