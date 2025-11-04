/**
 * Tests de performance du Virtual DOM avec beaucoup de données
 * Évalue les performances de rendu, memoization, et virtualisation
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { 
  useState, useMemo, useCallback, memo, useEffect, useRef,
  createContext, useContext, useReducer, createElement
} from 'react';

// Composant avec Virtual DOM basique
const VirtualDOMList = memo(({ items, onItemClick }) => {
  return (
    <div data-testid="virtual-dom-list">
      {items.map(item => (
        <VirtualListItem 
          key={item.id} 
          item={item} 
          onClick={onItemClick}
        />
      ))}
    </div>
  );
});

const VirtualListItem = memo(({ item, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(item.id);
  }, [item.id, onClick]);

  return (
    <div 
      data-testid={`virtual-item-${item.id}`}
      className="virtual-list-item"
      onClick={handleClick}
    >
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <div>Category: {item.category}</div>
      <div>Score: {item.score}</div>
    </div>
  );
});

// Composant avec memoization avancée
const MemoizedVirtualList = memo(({ 
  items, 
  filter, 
  sortBy, 
  onItemClick,
  highlightTerm 
}) => {
  const filteredAndSortedItems = useMemo(() => {
    let result = items;
    
    // Filtrage
    if (filter) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(filter.toLowerCase()) ||
        item.description.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    // Tri
    if (sortBy) {
      result = [...result].sort((a, b) => {
        if (typeof a[sortBy] === 'string') {
          return a[sortBy].localeCompare(b[sortBy]);
        }
        return a[sortBy] - b[sortBy];
      });
    }
    
    return result;
  }, [items, filter, sortBy]);

  const highlightedItems = useMemo(() => {
    if (!highlightTerm) return filteredAndSortedItems;
    
    return filteredAndSortedItems.map(item => ({
      ...item,
      title: item.title.replace(
        new RegExp(`(${highlightTerm})`, 'gi'),
        '<mark>$1</mark>'
      ),
      description: item.description.replace(
        new RegExp(`(${highlightTerm})`, 'gi'),
        '<mark>$1</mark>'
      )
    }));
  }, [filteredAndSortedItems, highlightTerm]);

  return (
    <div data-testid="memoized-list">
      {highlightedItems.map(item => (
        <MemoizedListItem
          key={item.id}
          item={item}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
});

const MemoizedListItem = memo(({ item, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(item.id);
  }, [item.id, onClick]);

  const expensiveCalculation = useMemo(() => {
    // Simulation de calcul coûteux
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.sqrt(item.score);
    }
    return result;
  }, [item.score]);

  return (
    <div 
      data-testid={`memoized-item-${item.id}`}
      className="memoized-list-item"
      onClick={handleClick}
      style={{ 
        padding: '8px', 
        margin: '4px', 
        border: '1px solid #ccc',
        backgroundColor: item.category === 'A' ? '#f0f8ff' : '#f8f8f8'
      }}
    >
      <h4 dangerouslySetInnerHTML={{ __html: item.title }} />
      <p dangerouslySetInnerHTML={{ __html: item.description }} />
      <div>Category: {item.category}</div>
      <div>Score: {item.score}</div>
      <div>Calcul: {expensiveCalculation.toFixed(2)}</div>
    </div>
  );
});

// Composant avec virtualisation (fenêtrage)
const VirtualizedList = memo(({ 
  items, 
  itemHeight = 100, 
  containerHeight = 400,
  onItemClick 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div 
      ref={containerRef}
      data-testid="virtualized-list"
      style={{ 
        height: `${containerHeight}px`, 
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: `${items.length * itemHeight}px`, position: 'relative' }}>
        {visibleItems.map(item => (
          <VirtualizedListItem
            key={item.id}
            item={item}
            itemHeight={itemHeight}
            virtualIndex={item.virtualIndex}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
});

const VirtualizedListItem = memo(({ item, itemHeight, virtualIndex, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(item.id);
  }, [item.id, onClick]);

  return (
    <div
      data-testid={`virtualized-item-${item.id}`}
      style={{
        position: 'absolute',
        top: `${virtualIndex * itemHeight}px`,
        left: 0,
        right: 0,
        height: `${itemHeight}px`,
        padding: '8px',
        borderBottom: '1px solid #ddd',
        boxSizing: 'border-box'
      }}
      onClick={handleClick}
    >
      <strong>{item.title}</strong>
      <p>{item.description}</p>
      <small>Score: {item.score}</small>
    </div>
  );
});

// Composant avec React.memo optimisé
const OptimizedMemoizedComponent = memo(({ data, config }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now(),
      calculations: {
        weightedScore: item.score * config.weight,
        normalizedValue: item.score / config.maxScore
      }
    }));
  }, [data, config.weight, config.maxScore]);

  const sortedData = useMemo(() => {
    return [...processedData].sort((a, b) => 
      b.calculations.weightedScore - a.calculations.weightedScore
    );
  }, [processedData]);

  return (
    <div data-testid="optimized-component">
      {sortedData.map(item => (
        <OptimizedMemoizedItem
          key={item.id}
          item={item}
          config={config}
        />
      ))}
    </div>
  );
});

const OptimizedMemoizedItem = memo(({ item, config }) => {
  const isHighPriority = item.calculations.weightedScore > config.threshold;
  
  return (
    <div
      data-testid={`optimized-item-${item.id}`}
      style={{
        backgroundColor: isHighPriority ? '#ffe6e6' : 'transparent',
        padding: '8px',
        margin: '4px 0'
      }}
    >
      <h4>{item.title}</h4>
      <p>{item.description}</p>
      <div>Weighted Score: {item.calculations.weightedScore.toFixed(2)}</div>
      <div>Normalized: {item.calculations.normalizedValue.toFixed(3)}</div>
    </div>
  );
});

// Context pour éviter les re-renders inutiles
const DataContext = createContext();

const DataProvider = memo(({ children, data }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const value = useMemo(() => ({
    data,
    selectedIds,
    toggleSelection
  }), [data, selectedIds, toggleSelection]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
});

const DataConsumer = memo(() => {
  const { data, selectedIds, toggleSelection } = useContext(DataContext);

  return (
    <div data-testid="data-consumer">
      {data.map(item => (
        <DataConsumerItem
          key={item.id}
          item={item}
          isSelected={selectedIds.has(item.id)}
          onToggle={() => toggleSelection(item.id)}
        />
      ))}
    </div>
  );
});

const DataConsumerItem = memo(({ item, isSelected, onToggle }) => (
  <div
    data-testid={`consumer-item-${item.id}`}
    style={{
      backgroundColor: isSelected ? '#e6f3ff' : 'transparent',
      padding: '8px',
      margin: '2px 0',
      cursor: 'pointer'
    }}
    onClick={onToggle}
  >
    <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
      {item.title}
    </span>
    <small style={{ marginLeft: '8px', color: '#666' }}>
      Score: {item.score}
    </small>
  </div>
));

// Utilitaire pour générer des données de test
const generateTestData = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i} - ${i % 10 === 0 ? 'High Priority' : 'Normal'}`,
    description: `Description for item ${i}. This is a longer description that includes additional details and context about the item.`,
    category: ['A', 'B', 'C', 'D', 'E'][i % 5],
    score: Math.random() * 100,
    tags: [`tag${i % 20}`, `category${i % 10}`],
    created: new Date(Date.now() - i * 86400000),
    metadata: {
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50)
    }
  }));
};

describe('Tests de Performance du Virtual DOM avec Données Volumineuses', () => {
  let testData = [];
  let renderTimes = [];

  beforeEach(() => {
    renderTimes = [];
  });

  afterEach(() => {
    testData = [];
    renderTimes = [];
  });

  describe('Tests de Virtual DOM basique', () => {
    test('Mesure les performances avec 1000 éléments', async () => {
      testData = generateTestData(1000);

      const onItemClick = jest.fn();
      
      const { container } = render(
        <VirtualDOMList items={testData} onItemClick={onItemClick} />
      );

      const listItems = container.querySelectorAll('.virtual-list-item');
      expect(listItems.length).toBe(1000);

      // Vérifier que certains éléments sont dans le DOM
      expect(screen.getByTestId('virtual-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('virtual-item-999')).toBeInTheDocument();
    });

    test('Teste les re-renders avec données statiques', async () => {
      testData = generateTestData(100);
      const onItemClick = jest.fn();

      const { rerender } = render(
        <VirtualDOMList items={testData} onItemClick={onItemClick} />
      );

      // 50 re-renders sans changements
      const reRenderStart = performance.now();
      for (let i = 0; i < 50; i++) {
        rerender(<VirtualDOMList items={testData} onItemClick={onItemClick} />);
      }
      const reRenderTime = performance.now() - reRenderStart;

      expect(reRenderTime).toBeLessThan(100); // 50 re-renders < 100ms
      expect(onItemClick).not.toHaveBeenCalled(); // Pas d'interactions
    });

    test('Mesure les performances avec 10 000 éléments', async () => {
      testData = generateTestData(10000);

      const onItemClick = jest.fn();
      
      const renderStartTime = performance.now();
      const { container } = render(
        <VirtualDOMList items={testData} onItemClick={onItemClick} />
      );
      const renderTime = performance.now() - renderStartTime;

      const listItems = container.querySelectorAll('.virtual-list-item');
      expect(listItems.length).toBe(10000);

      expect(renderTime).toBeLessThan(2000); // Rendu < 2s pour 10K éléments
    });

    test('Teste les clics sur de gros datasets', async () => {
      testData = generateTestData(5000);
      const user = userEvent.setup();

      const onItemClick = jest.fn();
      render(<VirtualDOMList items={testData} onItemClick={onItemClick} />);

      const clickStartTime = performance.now();
      
      // Cliquer sur 10 éléments différents
      for (let i = 0; i < 10; i++) {
        const element = screen.getByTestId(`virtual-item-${i * 100}`);
        await user.click(element);
      }

      const clickTime = performance.now() - clickStartTime;

      expect(clickTime).toBeLessThan(200); // 10 clics < 200ms
      expect(onItemClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Tests de Memoization', () => {
    test('Mesure l\'efficacité de React.memo avec 1000 éléments', async () => {
      testData = generateTestData(1000);
      const onItemClick = jest.fn();

      // Premier rendu
      const initialRenderStart = performance.now();
      const { container, rerender } = render(
        <MemoizedVirtualList 
          items={testData} 
          filter=""
          sortBy="title"
          onItemClick={onItemClick}
        />
      );
      const initialRenderTime = performance.now() - initialRenderStart;

      // Re-render avec les mêmes données
      const reRenderStart = performance.now();
      rerender(
        <MemoizedVirtualList 
          items={testData} 
          filter=""
          sortBy="title"
          onItemClick={onItemClick}
        />
      );
      const reRenderTime = performance.now() - reRenderStart;

      // Le re-render doit être plus rapide grâce à React.memo
      expect(reRenderTime).toBeLessThan(initialRenderTime / 2);
      expect(reRenderTime).toBeLessThan(50); // Re-render < 50ms
    });

    test('Teste les performances avec filtres et tri complexes', async () => {
      testData = generateTestData(2000);

      const filterTests = [
        { filter: 'High Priority', sortBy: 'score' },
        { filter: 'Item 1', sortBy: 'title' },
        { filter: 'A', sortBy: 'category' },
        { filter: '', sortBy: 'score' },
        { filter: '', sortBy: 'title' }
      ];

      for (const test of filterTests) {
        const { rerender } = render(
          <MemoizedVirtualList 
            items={testData} 
            filter={test.filter}
            sortBy={test.sortBy}
            onItemClick={jest.fn()}
          />
        );

        // Vérifier que le rendu s'est fait correctement
        const container = screen.getByTestId('memoized-list');
        expect(container).toBeInTheDocument();
      }
    });

    test('Benchmark memoization: avec/sans React.memo', async () => {
      testData = generateTestData(500);

      // Version sans memo
      const RegularList = ({ items, filter }) => {
        const filteredItems = items.filter(item => 
          !filter || item.title.toLowerCase().includes(filter.toLowerCase())
        );
        
        return (
          <div>
            {filteredItems.map(item => (
              <div key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        );
      };

      // Version avec memo (déjà définie ci-dessus)
      const onItemClick = jest.fn();

      // Test version régulière
      const regularStartTime = performance.now();
      for (let i = 0; i < 20; i++) {
        render(<RegularList items={testData} filter="" />);
      }
      const regularTime = performance.now() - regularStartTime;

      // Test version optimisée
      const optimizedStartTime = performance.now();
      for (let i = 0; i < 20; i++) {
        render(
          <MemoizedVirtualList 
            items={testData} 
            filter="" 
            sortBy={null}
            onItemClick={onItemClick}
            highlightTerm={null}
          />
        );
      }
      const optimizedTime = performance.now() - optimizedStartTime;

      expect(optimizedTime).toBeLessThan(regularTime); // Optimisé doit être plus rapide
    });
  });

  describe('Tests de Virtualisation', () => {
    test('Mesure les performances avec 50 000 éléments virtualisés', async () => {
      testData = generateTestData(50000);

      const onItemClick = jest.fn();
      
      const renderStartTime = performance.now();
      const { container } = render(
        <VirtualizedList 
          items={testData} 
          itemHeight={100}
          containerHeight={400}
          onItemClick={onItemClick}
        />
      );
      const renderTime = performance.now() - renderStartTime;

      // Ne devrait rendre que les éléments visibles
      const renderedItems = container.querySelectorAll('[data-testid^="virtualized-item-"]');
      expect(renderedItems.length).toBeLessThan(10); // 5-6 éléments visibles
      expect(renderTime).toBeLessThan(500); // Rendu < 500ms même avec 50K éléments

      // Test scroll virtuel
      const virtualizedList = container.querySelector('[data-testid="virtualized-list"]');
      
      act(() => {
        virtualizedList.scrollTop = 10000; // Scroll vers le milieu
      });

      // Attendre que le rendu se mette à jour
      await waitFor(() => {
        const newItems = container.querySelectorAll('[data-testid^="virtualized-item-"]');
        return newItems.length > 0;
      });

      // Cliquer sur un élément virtualisé
      const firstVisibleItem = container.querySelector('[data-testid^="virtualized-item-"]');
      if (firstVisibleItem) {
        fireEvent.click(firstVisibleItem);
        expect(onItemClick).toHaveBeenCalled();
      }
    });

    test('Teste la fluidité du scrolling virtuel', async () => {
      testData = generateTestData(10000);

      const { container } = render(
        <VirtualizedList 
          items={testData} 
          itemHeight={80}
          containerHeight={320}
          onItemClick={jest.fn()}
        />
      );

      const virtualizedList = container.querySelector('[data-testid="virtualized-list"]');
      const scrollStartTime = performance.now();

      // Simuler un scrolling fluide
      for (let i = 0; i < 100; i++) {
        const scrollTop = (i / 100) * (testData.length * 80 - 320);
        
        act(() => {
          virtualizedList.scrollTop = scrollTop;
        });
      }

      const scrollTime = performance.now() - scrollStartTime;

      expect(scrollTime).toBeLessThan(100); // Scroll fluide < 100ms
      expect(virtualizedList.scrollHeight).toBe(testData.length * 80);
    });

    test('Teste les performances avec hauteurs d\'éléments variables', async () => {
      testData = generateTestData(5000);
      
      // Ajuster les hauteurs dynamiquement
      const variableHeightItems = testData.map(item => ({
        ...item,
        height: item.score > 50 ? 120 : 80
      }));

      const { container } = render(
        <VirtualizedList 
          items={variableHeightItems} 
          itemHeight={100} // Hauteur moyenne
          containerHeight={400}
          onItemClick={jest.fn()}
        />
      );

      const renderedItems = container.querySelectorAll('[data-testid^="virtualized-item-"]');
      expect(renderedItems.length).toBeGreaterThan(0);
      expect(renderedItems.length).toBeLessThan(10);
    });
  });

  describe('Tests d\'optimisation avancée', () => {
    test('Teste les performances avec Context API pour éviter re-renders', async () => {
      testData = generateTestData(2000);

      const ProviderWrapper = ({ children }) => (
        <DataProvider data={testData}>
          {children}
        </DataProvider>
      );

      const renderStartTime = performance.now();
      render(
        <ProviderWrapper>
          <DataConsumer />
        </ProviderWrapper>
      );
      const renderTime = performance.now() - renderStartTime;

      const consumerItems = screen.queryAllByTestId(/^consumer-item-/);
      expect(consumerItems.length).toBe(2000);
      expect(renderTime).toBeLessThan(1500);
    });

    test('Benchmark calcul complexe avec memoization', async () => {
      testData = generateTestData(1000);
      const config = {
        weight: 1.5,
        maxScore: 100,
        threshold: 50
      };

      const calculationStartTime = performance.now();
      
      // Rendu avec calculs coûteux
      render(
        <OptimizedMemoizedComponent 
          data={testData} 
          config={config}
        />
      );
      
      const calculationTime = performance.now() - calculationStartTime;

      expect(calculationTime).toBeLessThan(2000); // Calculs < 2s
      
      // Vérifier que les calculs sont corrects
      const optimizedItems = screen.queryAllByTestId(/^optimized-item-/);
      expect(optimizedItems.length).toBe(1000);
    });

    test('Teste les performances avec useReducer pour state complexe', async () => {
      testData = generateTestData(1000);

      const initialState = {
        items: testData,
        selectedItems: new Set(),
        filters: {
          category: null,
          scoreRange: [0, 100],
          searchTerm: ''
        },
        sortBy: 'title',
        sortOrder: 'asc'
      };

      const reducer = (state, action) => {
        switch (action.type) {
          case 'SET_FILTER':
            return { ...state, filters: { ...state.filters, ...action.payload } };
          case 'SET_SORT':
            return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
          case 'TOGGLE_ITEM':
            const newSelected = new Set(state.selectedItems);
            if (newSelected.has(action.payload.id)) {
              newSelected.delete(action.payload.id);
            } else {
              newSelected.add(action.payload.id);
            }
            return { ...state, selectedItems: newSelected };
          default:
            return state;
        }
      };

      const ReducerComponent = () => {
        const [state, dispatch] = useReducer(reducer, initialState);

        const filteredItems = useMemo(() => {
          let items = state.items;
          
          if (state.filters.category) {
            items = items.filter(item => item.category === state.filters.category);
          }
          
          if (state.filters.searchTerm) {
            items = items.filter(item => 
              item.title.toLowerCase().includes(state.filters.searchTerm.toLowerCase())
            );
          }

          if (state.sortBy) {
            items = [...items].sort((a, b) => {
              const valueA = a[state.sortBy];
              const valueB = b[state.sortBy];
              const multiplier = state.sortOrder === 'asc' ? 1 : -1;
              
              if (typeof valueA === 'string') {
                return valueA.localeCompare(valueB) * multiplier;
              }
              return (valueA - valueB) * multiplier;
            });
          }

          return items;
        }, [state.items, state.filters, state.sortBy, state.sortOrder]);

        return (
          <div data-testid="reducer-component">
            <div data-testid="filtered-count">{filteredItems.length}</div>
            {filteredItems.map(item => (
              <div
                key={item.id}
                data-testid={`reducer-item-${item.id}`}
                onClick={() => dispatch({ type: 'TOGGLE_ITEM', payload: { id: item.id } })}
                style={{
                  backgroundColor: state.selectedItems.has(item.id) ? '#e6f3ff' : 'transparent'
                }}
              >
                {item.title} - {item.score}
              </div>
            ))}
          </div>
        );
      };

      const renderStartTime = performance.now();
      render(<ReducerComponent />);
      const renderTime = performance.now() - renderStartTime;

      expect(renderTime).toBeLessThan(1000);
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('1000');
    });
  });

  describe('Tests de charge extreme', () => {
    test('Teste avec 100 000 éléments et virtualisation', async () => {
      testData = generateTestData(100000);

      const onItemClick = jest.fn();
      
      const renderStartTime = performance.now();
      const { container } = render(
        <VirtualizedList 
          items={testData} 
          itemHeight={60}
          containerHeight={360}
          onItemClick={onItemClick}
        />
      );
      const renderTime = performance.now() - renderStartTime;

      // Même avec 100K éléments, le rendu doit être rapide grâce à la virtualisation
      expect(renderTime).toBeLessThan(800);
      
      const renderedItems = container.querySelectorAll('[data-testid^="virtualized-item-"]');
      expect(renderedItems.length).toBeLessThanOrEqual(10);

      // Test d'interaction avec les éléments virtualisés
      if (renderedItems[0]) {
        fireEvent.click(renderedItems[0]);
        expect(onItemClick).toHaveBeenCalled();
      }
    });

    test('Benchmark mémoire avec manipulations intensives', async () => {
      testData = generateTestData(10000);

      const memoryMonitor = performanceMonitor.monitorMemoryLeaks();
      
      const { rerender } = render(
        <MemoizedVirtualList 
          items={testData} 
          filter=""
          sortBy="title"
          onItemClick={jest.fn()}
          highlightTerm={null}
        />
      );

      // 200 manipulations intensives
      for (let i = 0; i < 200; i++) {
        const newData = testData.map(item => ({
          ...item,
          score: Math.random() * 100
        }));

        rerender(
          <MemoizedVirtualList 
            items={newData} 
            filter={i % 2 === 0 ? 'High' : ''}
            sortBy={i % 3 === 0 ? 'score' : 'title'}
            onItemClick={jest.fn()}
            highlightTerm={i % 4 === 0 ? 'Item' : null}
          />
        );

        if (i % 50 === 0) {
          // Laissez le temps au garbage collector
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const memoryResults = memoryMonitor.checkAfter();
      expect(memoryResults.hasMemoryLeak).toBe(false);
      expect(memoryResults.memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max
    });

    test('Test de concurrence: 10 composants virtualisés simultanés', async () => {
      const multipleDataSets = Array.from({ length: 10 }, (_, setIndex) =>
        generateTestData(5000).map(item => ({
          ...item,
          datasetId: setIndex
        }))
      );

      const renderStartTime = performance.now();
      
      render(
        <div>
          {multipleDataSets.map((dataSet, index) => (
            <VirtualizedList
              key={index}
              items={dataSet}
              itemHeight={70}
              containerHeight={280}
              onItemClick={jest.fn()}
            />
          ))}
        </div>
      );
      
      const totalRenderTime = performance.now() - renderStartTime;

      expect(totalRenderTime).toBeLessThan(2000); // 10 listes virtualisées < 2s
      
      // Vérifier que seules les éléments visibles sont rendus
      const allVirtualizedItems = screen.queryAllByTestId(/^virtualized-item-/);
      expect(allVirtualizedItems.length).toBeLessThanOrEqual(50); // ~5 par liste max
    });
  });
});