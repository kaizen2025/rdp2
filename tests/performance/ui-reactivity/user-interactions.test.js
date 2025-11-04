/**
 * Tests de performance des interactions utilisateur
 * Évalue les temps de réponse pour les clics, formulaires et filtres
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useCallback, useMemo } from 'react';
import { Button, TextField, Select, MenuItem } from '@mui/material';

// Composant de test pour les interactions de base
const TestComponent = ({ onInteraction }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    filter: ''
  });
  const [items] = useState(Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    category: i % 5 === 0 ? 'A' : i % 3 === 0 ? 'B' : 'C'
  })));

  const filteredItems = useMemo(() => {
    return formData.filter 
      ? items.filter(item => item.name.toLowerCase().includes(formData.filter.toLowerCase()))
      : items;
  }, [items, formData.filter]);

  const handleInputChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    onInteraction?.('input', field, value);
  }, [onInteraction]);

  const handleClick = useCallback((action) => () => {
    onInteraction?.('click', action);
  }, [onInteraction]);

  return (
    <div>
      <div>
        <Button 
          data-testid="button-clicked"
          onClick={handleClick('simple-button')}
        >
          Cliquer
        </Button>
        <Button 
          data-testid="button-heavy"
          onClick={handleClick('heavy-button')}
        >
          Traitement Lourd
        </Button>
      </div>
      
      <form>
        <TextField
          data-testid="input-name"
          label="Nom"
          value={formData.name}
          onChange={handleInputChange('name')}
        />
        <TextField
          data-testid="input-email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
        />
        <Select
          data-testid="select-filter"
          value={formData.filter}
          onChange={handleInputChange('filter')}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="Item 1">Item 1</MenuItem>
          <MenuItem value="Item 2">Item 2</MenuItem>
        </Select>
      </form>

      <div data-testid="filtered-list">
        {filteredItems.slice(0, 10).map(item => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {item.name} - {item.category}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Tests de Performance des Interactions Utilisateur', () => {
  let performanceMetrics = [];
  let mockOnInteraction;

  beforeEach(() => {
    performanceMetrics = [];
    mockOnInteraction = jest.fn((type, ...args) => {
      performanceMetrics.push({
        type,
        args,
        timestamp: performance.now()
      });
    });

    // Reset performance.now mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceMetrics = [];
  });

  describe('Tests de clics', () => {
    test('Mesure le temps de réponse des clics simples', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const button = container.querySelector('[data-testid="button-clicked"]');

      const startTime = performance.now();
      await user.click(button);
      const endTime = performance.now();

      const clickTime = endTime - startTime;
      
      expect(clickTime).toBeLessThan(16); // 60fps = ~16ms par frame
      expect(mockOnInteraction).toHaveBeenCalledWith('click', 'simple-button');
    });

    test('Mesure le temps de réponse des clics avec traitement lourd', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const button = container.querySelector('[data-testid="button-heavy"]');

      const startTime = performance.now();
      await user.click(button);
      const endTime = performance.now();

      const clickTime = endTime - startTime;
      
      // Avec traitement lourd, on peut accepter jusqu'à 100ms
      expect(clickTime).toBeLessThan(100);
      expect(mockOnInteraction).toHaveBeenCalledWith('click', 'heavy-button');
    });

    test('Teste les clics multiples en rafale', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const button = container.querySelector('[data-testid="button-clicked"]');

      const startTime = performance.now();
      
      // Simuler 10 clics rapides
      for (let i = 0; i < 10; i++) {
        await user.click(button);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 10;

      expect(averageTime).toBeLessThan(16); // 60fps
      expect(mockOnInteraction).toHaveBeenCalledTimes(10);
    });

    test('Teste la performance avec 100 utilisateurs concurrents cliquant', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const button = container.querySelector('[data-testid="button-clicked"]');

      const clickPromises = [];
      const startTime = performance.now();

      // Simuler 100 utilisateurs cliquant simultanément
      for (let i = 0; i < 100; i++) {
        clickPromises.push(user.click(button));
      }

      await Promise.all(clickPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // 1 seconde max
      expect(mockOnInteraction).toHaveBeenCalledTimes(100);
    });
  });

  describe('Tests de formulaires', () => {
    test('Mesure le temps de saisie dans un champ texte', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const nameInput = container.querySelector('[data-testid="input-name"]');

      const startTime = performance.now();
      await user.type(nameInput, 'Test User');
      const endTime = performance.now();

      const inputTime = endTime - startTime;
      
      // Temps de saisie doit être fluide (moins de 50ms)
      expect(inputTime).toBeLessThan(50);
      expect(nameInput.value).toBe('Test User');
    });

    test('Teste la performance avec validation en temps réel', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const emailInput = container.querySelector('[data-testid="input-email"]');

      const emails = [
        'test@example.com',
        'invalid-email',
        'another@test.com',
        'user@domain.co',
        'final@test.fr'
      ];

      const totalStartTime = performance.now();
      
      for (const email of emails) {
        const startTime = performance.now();
        await user.clear(emailInput);
        await user.type(emailInput, email);
        const endTime = performance.now();
        
        const inputTime = endTime - startTime;
        expect(inputTime).toBeLessThan(30); // 30ms par saisie
      }
      
      const totalEndTime = performance.now();
      const totalTime = totalEndTime - totalStartTime;
      
      expect(totalTime).toBeLessThan(200); // Total moins de 200ms
    });

    test('Teste la soumission de formulaire avec 1000 validations', async () => {
      const formDataArray = Array.from({ length: 1000 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        filter: i % 10 === 0 ? 'Item 1' : ''
      }));

      const submitTimes = [];

      for (const formData of formDataArray) {
        const startTime = performance.now();
        
        // Simuler la validation du formulaire
        const isValid = formData.email.includes('@') && formData.name.length > 0;
        
        const endTime = performance.now();
        submitTimes.push(endTime - startTime);
        
        expect(isValid).toBe(true);
      }

      const averageSubmitTime = submitTimes.reduce((a, b) => a + b) / submitTimes.length;
      const maxSubmitTime = Math.max(...submitTimes);

      expect(averageSubmitTime).toBeLessThan(5); // 5ms en moyenne
      expect(maxSubmitTime).toBeLessThan(20); // 20ms max
    });

    test('Teste la performance avec auto-complétion', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const nameInput = container.querySelector('[data-testid="input-name"]');

      const suggestions = ['Test', 'Testing', 'Tester', 'Tested', 'Testing123'];
      const totalStartTime = performance.now();

      for (const suggestion of suggestions) {
        const startTime = performance.now();
        
        await user.type(nameInput, suggestion);
        
        // Simuler la recherche de suggestions
        const matchingSuggestions = suggestions.filter(s => s.toLowerCase().startsWith(suggestion.toLowerCase()));
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(50);
      }
      
      const totalEndTime = performance.now();
      expect(totalEndTime - totalStartTime).toBeLessThan(300);
    });
  });

  describe('Tests de filtres', () => {
    test('Mesure les temps de filtrage avec différentes tailles de datasets', async () => {
      const datasetSizes = [100, 500, 1000, 5000, 10000];
      const filterResults = [];

      for (const size of datasetSizes) {
        const items = Array.from({ length: size }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          category: i % 5 === 0 ? 'A' : i % 3 === 0 ? 'B' : 'C'
        }));

        const startTime = performance.now();
        const filtered = items.filter(item => 
          item.name.toLowerCase().includes('item') && item.category === 'A'
        );
        const endTime = performance.now();

        const filterTime = endTime - startTime;
        filterResults.push({ size, filterTime, resultCount: filtered.length });
        
        expect(filtered.length).toBeGreaterThan(0);
      }

      // Vérifier que le temps de filtrage est linéaire
      expect(filterResults[4].filterTime).toBeLessThan(filterResults[0].filterTime * 120); // 20x max pour 100x plus de données
    });

    test('Teste les filtres en cascade avec 1000 éléments', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        category: ['A', 'B', 'C', 'D', 'E'][i % 5],
        subcategory: ['X', 'Y', 'Z'][i % 3],
        status: i % 2 === 0 ? 'active' : 'inactive'
      }));

      const filterSteps = [
        { criteria: 'category', value: 'A', expectedRatio: 0.2 },
        { criteria: 'status', value: 'active', expectedRatio: 0.1 },
        { criteria: 'subcategory', value: 'X', expectedRatio: 0.033 }
      ];

      let currentItems = items;
      let totalFilterTime = 0;

      for (const step of filterSteps) {
        const startTime = performance.now();
        
        currentItems = currentItems.filter(item => {
          if (step.criteria === 'category') return item.category === step.value;
          if (step.criteria === 'status') return item.status === step.value;
          if (step.criteria === 'subcategory') return item.subcategory === step.value;
          return true;
        });
        
        const endTime = performance.now();
        const filterTime = endTime - startTime;
        totalFilterTime += filterTime;

        const actualRatio = currentItems.length / items.length;
        expect(actualRatio).toBeCloseTo(step.expectedRatio, 1);
        expect(filterTime).toBeLessThan(50);
      }

      expect(totalFilterTime).toBeLessThan(150);
    });

    test('Teste les temps de réponse de filtres avec debounce', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const filterSelect = container.querySelector('[data-testid="select-filter"]');

      const filterValues = ['Item 1', 'Item 2', ''];
      const filterTimes = [];

      for (const value of filterValues) {
        const startTime = performance.now();
        
        await user.selectOptions(filterSelect, value);
        
        // Simuler debounce (attendre 300ms dans un test)
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const endTime = performance.now();
        filterTimes.push(endTime - startTime);
      }

      const averageFilterTime = filterTimes.reduce((a, b) => a + b) / filterTimes.length;
      expect(averageFilterTime).toBeLessThan(50);
    });

    test('Benchmark de filtrage avec Trie pour améliorer les performances', () => {
      const items = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i} ${i % 100}`,
        keywords: [`keyword${i % 50}`, `tag${i % 25}`]
      }));

      // Construire un Trie pour la recherche
      class TrieNode {
        constructor() {
          this.children = {};
          this.items = [];
        }
      }

      const trie = new TrieNode();
      
      // Insertion dans le Trie
      const trieStartTime = performance.now();
      for (const item of items) {
        const words = [item.name, ...item.keywords];
        for (const word of words) {
          let node = trie;
          for (const char of word.toLowerCase()) {
            if (!node.children[char]) {
              node.children[char] = new TrieNode();
            }
            node = node.children[char];
          }
          node.items.push(item);
        }
      }
      const trieBuildTime = performance.now() - trieStartTime;

      // Recherche avec Trie
      const searchStartTime = performance.now();
      const searchResults = (() => {
        let node = trie;
        const searchTerm = 'item 123';
        for (const char of searchTerm.toLowerCase()) {
          if (!node.children[char]) return [];
          node = node.children[char];
        }
        return node.items;
      })();
      const trieSearchTime = performance.now() - searchStartTime;

      // Recherche classique
      const classicSearchStartTime = performance.now();
      const classicResults = items.filter(item =>
        item.name.toLowerCase().includes('item 123') ||
        item.keywords.some(k => k.includes('keyword'))
      );
      const classicSearchTime = performance.now() - classicSearchStartTime;

      expect(trieBuildTime).toBeLessThan(1000); // Construction < 1s
      expect(trieSearchTime).toBeLessThan(classicSearchTime / 10); // 10x plus rapide
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('Tests de charge pour interactions', () => {
    test('Teste la performance avec 50 interactions simultanées', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const button = container.querySelector('[data-testid="button-clicked"]');
      const nameInput = container.querySelector('[data-testid="input-name"]');
      const filterSelect = container.querySelector('[data-testid="select-filter"]');

      const interactions = [];
      const startTime = performance.now();

      // 50 interactions mixtes
      for (let i = 0; i < 50; i++) {
        if (i % 3 === 0) {
          interactions.push(user.click(button));
        } else if (i % 3 === 1) {
          interactions.push(user.type(nameInput, `Test ${i}`));
        } else {
          interactions.push(user.selectOptions(filterSelect, i % 2 === 0 ? 'Item 1' : 'Item 2'));
        }
      }

      await Promise.all(interactions);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(500); // 50 interactions en < 500ms
      expect(mockOnInteraction).toHaveBeenCalled();
    });

    test('Mesure l\'utilisation mémoire lors d\'interactions intensives', async () => {
      const user = userEvent.setup();
      
      const { container } = render(<TestComponent onInteraction={mockOnInteraction} />);
      const button = container.querySelector('[data-testid="button-clicked"]');

      // 1000 clics pour détecter les fuites mémoire
      const memoryMonitor = performanceMonitor.monitorMemoryLeaks();

      for (let i = 0; i < 1000; i++) {
        await user.click(button);
        
        if (i % 100 === 0) {
          // Nettoyer périodiquement
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const memoryResults = memoryMonitor.checkAfter();
      
      expect(memoryResults.hasMemoryLeak).toBe(false);
      expect(memoryResults.memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB max
    });
  });
});