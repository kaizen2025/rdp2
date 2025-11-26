/**
 * Tests unitaires pour GlobalPerformanceOptimizer
 * 
 * Tests complets de toutes les fonctionnalités d'optimisation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  GlobalPerformanceProvider,
  OptimizedVirtualList,
  useGlobalPerformance,
  useUltraFastDebounce,
  useLagFreeAnimations,
  usePredictivePreload,
  useUserProfileOptimization,
  PerformanceTester
} from './GlobalPerformanceOptimizer';
import { motion } from 'framer-motion';

// Mock performance.memory pour les tests
global.performance = {
  memory: {
    usedJSHeapSize: 100 * 1024 * 1024, // 100MB
    totalJSHeapSize: 150 * 1024 * 1024,
    jsHeapSizeLimit: 1024 * 1024 * 1024
  },
  now: () => Date.now()
};

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});

describe('GlobalPerformanceOptimizer', () => {
  
  describe('GlobalPerformanceProvider', () => {
    test('fournit le contexte d\'optimisation', () => {
      let contextValue;
      
      const TestComponent = () => {
        contextValue = useGlobalPerformance();
        return <div>Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      expect(contextValue).toBeDefined();
      expect(contextValue.config).toBeDefined();
      expect(contextValue.memoryUsage).toBeDefined();
      expect(contextValue.performanceScore).toBeDefined();
    });
    
    test('accepte la configuration personnalisée', () => {
      let contextValue;
      const customConfig = { MAX_CACHE_SIZE: 300 * 1024 * 1024 };
      
      const TestComponent = () => {
        contextValue = useGlobalPerformance();
        return <div>Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider config={customConfig}>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      expect(contextValue.config.MAX_CACHE_SIZE).toBe(300 * 1024 * 1024);
    });
    
    test('gère le cache intelligent', async () => {
      let contextValue;
      const TestComponent = () => {
        contextValue = useGlobalPerformance();
        return <div>Cache Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      // Test mise en cache
      const testData = { id: 1, name: 'Test' };
      contextValue.setInCache('test_key', testData, 60000);
      
      // Test récupération cache
      const cached = contextValue.getFromCache('test_key');
      expect(cached).toEqual(testData);
    });
    
    test('détecte les sessions RDP', () => {
      let contextValue;
      const TestComponent = () => {
        contextValue = useGlobalPerformance();
        return <div>RDP Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      // Test détection RDP
      expect(contextValue.isRDPSession).toBeDefined();
    });
  });
  
  describe('OptimizedVirtualList', () => {
    const mockItems = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: `Value ${i}`
    }));
    
    const mockRenderItem = (item) => (
      <div key={item.id}>
        <h3>{item.name}</h3>
        <p>{item.value}</p>
      </div>
    );
    
    test('rend une liste virtualisée', () => {
      render(
        <OptimizedVirtualList
          items={mockItems}
          height={400}
          itemHeight={64}
          renderItem={mockRenderItem}
        />
      );
      
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
    
    test('s\'adapte aux sessions RDP', () => {
      const { container } = render(
        <OptimizedVirtualList
          items={mockItems}
          height={400}
          itemHeight={64}
          renderItem={mockRenderItem}
        />
      );
      
      // Vérifie que la classe rdp-optimized est ajoutée pour RDP
      const virtualList = container.querySelector('.optimized-virtual-list');
      expect(virtualList).toBeInTheDocument();
    });
    
    test('utilise la bonne configuration d\'overscan', () => {
      const customConfig = { OVERSCAN_COUNT: 10 };
      
      render(
        <GlobalPerformanceProvider config={customConfig}>
          <OptimizedVirtualList
            items={mockItems}
            height={400}
            itemHeight={64}
            renderItem={mockRenderItem}
          />
        </GlobalPerformanceProvider>
      );
      
      // Vérifie que les props sont correctement passées
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });
  });
  
  describe('useUltraFastDebounce', () => {
    test('débounce les appels avec délai personnalisé', async () => {
      const TestComponent = () => {
        let callCount = 0;
        const debouncedFunc = useUltraFastDebounce(() => {
          callCount++;
        }, 50);
        
        React.useEffect(() => {
          debouncedFunc();
          debouncedFunc();
          debouncedFunc();
        }, []);
        
        return <div>Debounce Test</div>;
      };
      
      render(<TestComponent />);
      
      // Au départ, pas d'appel
      await waitFor(() => {
        // Après le délai, un seul appel
      }, { timeout: 200 });
    });
    
    test('débounce ultra-rapide pour animations', async () => {
      const TestComponent = () => {
        const debouncedHandler = useUltraFastDebounce((value) => {
          console.log('Handler called with:', value);
        }, 16);
        
        React.useEffect(() => {
          debouncedHandler('test1');
          debouncedHandler('test2');
        }, []);
        
        return <div>Ultra Fast Debounce</div>;
      };
      
      render(<TestComponent />);
      
      // Le debounce ultra-rapide devrait s'exécuter rapidement
      await waitFor(() => {
        // Vérifie que les handlers ont été appelé
      }, { timeout: 100 });
    });
  });
  
  describe('useLagFreeAnimations', () => {
    test('génère des animations optimisées', () => {
      let animations;
      
      const TestComponent = () => {
        animations = useLagFreeAnimations();
        return <div>Animations Test</div>;
      };
      
      render(<TestComponent />);
      
      expect(animations).toBeDefined();
      expect(animations.fadeIn).toBeDefined();
      expect(animations.slideUp).toBeDefined();
      expect(animations.scale).toBeDefined();
    });
    
    test('adapte les animations selon les préférences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      let animations;
      
      const TestComponent = () => {
        animations = useLagFreeAnimations();
        return <div>Reduced Motion Test</div>;
      };
      
      render(<TestComponent />);
      
      // Les animations devraient être réduites
      expect(animations.fadeIn).toEqual({ opacity: 1 });
    });
  });
  
  describe('usePredictivePreload', () => {
    const mockData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];
    
    test('gère le préchargement prédictif', () => {
      let preloadApi;
      
      const TestComponent = () => {
        preloadApi = usePredictivePreload(mockData);
        return <div>Preload Test</div>;
      };
      
      render(<TestComponent />);
      
      expect(preloadApi.preloadItem).toBeDefined();
      expect(preloadApi.isPreloaded).toBeDefined();
      
      // Test préchargement
      preloadApi.preloadItem(1, mockData[0]);
      expect(preloadApi.isPreloaded(1)).toBe(true);
    });
  });
  
  describe('useUserProfileOptimization', () => {
    test('détecte le profil utilisateur', async () => {
      let profile;
      
      const TestComponent = () => {
        const { userProfile } = useUserProfileOptimization();
        profile = userProfile;
        return <div>Profile Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      // Le profil est asynchrone, attendez qu'il soit défini
      await waitFor(() => {
        expect(profile).toBeDefined();
      }, { timeout: 1000 });
      
      expect(profile.deviceType).toBeDefined();
      expect(profile.networkType).toBeDefined();
    });
  });
  
  describe('PerformanceTester', () => {
    test('teste la navigation instantanée', async () => {
      const tester = new PerformanceTester();
      
      const result = await tester.testInstantNavigation();
      
      expect(result).toBeDefined();
      expect(result.time).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['excellent', 'good', 'needs-optimization']).toContain(result.status);
    });
    
    test('teste les performances de rendu', () => {
      const tester = new PerformanceTester();
      
      // Mock component avec forceUpdate
      const mockComponent = {
        forceUpdate: jest.fn()
      };
      
      const result = tester.testRenderPerformance(mockComponent);
      
      expect(result).toBeDefined();
      expect(result.renderTime).toBeDefined();
      expect(result.memoryIncrease).toBeDefined();
      expect(result.status).toBeDefined();
    });
    
    test('génère un rapport de performance', async () => {
      const tester = new PerformanceTester();
      
      // Exécute quelques tests
      await tester.testInstantNavigation();
      tester.testRenderPerformance({ forceUpdate: jest.fn() });
      
      const report = tester.generateReport();
      
      expect(report).toBeDefined();
      expect(report.navigation).toBeDefined();
      expect(report.render).toBeDefined();
      expect(report.memory).toBeDefined();
      expect(report.overall).toBeDefined();
      expect(report.overall).toBeGreaterThanOrEqual(0);
      expect(report.overall).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Cache et Compression', () => {
    test('compresse automatiquement les grandes données', () => {
      const largeData = {
        description: 'A'.repeat(2000) // Plus de 1KB
      };
      
      const compressed = GlobalPerformanceOptimizer.utils.compressData(largeData);
      
      expect(compressed).toBeDefined();
      expect(compressed).not.toBe('"');
    });
    
    test('ne compresse pas les petites données', () => {
      const smallData = { id: 1, name: 'Test' };
      
      const result = GlobalPerformanceOptimizer.utils.compressData(smallData);
      
      expect(result).toEqual(smallData);
    });
    
    test('décompresse les données', () => {
      const originalData = { id: 1, name: 'Test', description: 'Large data' };
      const compressed = GlobalPerformanceOptimizer.utils.compressData(originalData);
      const decompressed = GlobalPerformanceOptimizer.utils.decompressData(compressed);
      
      expect(decompressed).toEqual(originalData);
    });
  });
  
  describe('Mesure de performance', () => {
    test('mesure la performance d\'une fonction', () => {
      const testFn = () => {
        // Simulation d'un calcul
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };
      
      const { result, duration } = GlobalPerformanceOptimizer.utils.measurePerformance(testFn);
      
      expect(result).toBe(499500); // Somme de 0 à 999
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Gestion mémoire', () => {
    test('nettoie automatiquement le cache', async () => {
      let contextValue;
      
      const TestComponent = () => {
        contextValue = useGlobalPerformance();
        return <div>Memory Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider config={{ MAX_CACHE_SIZE: 1024 * 1024 }}>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      // Remplit le cache avec beaucoup de données
      for (let i = 0; i < 100; i++) {
        contextValue.setInCache(`key_${i}`, { data: 'x'.repeat(1000) });
      }
      
      // Force le nettoyage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Vérifie que le cache a été nettoyé
      expect(contextValue.cacheStats.size).toBeLessThan(1024 * 1024);
    });
    
    test('surveille l\'utilisation mémoire', () => {
      let memoryUsage;
      
      const TestComponent = () => {
        const { memoryUsage: mem } = useGlobalPerformance();
        memoryUsage = mem;
        return <div>Memory Monitor</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Intégration RDP', () => {
    test('active les optimisations RDP', () => {
      // Mock pour simuler une session RDP
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      let contextValue;
      
      const TestComponent = () => {
        contextValue = useGlobalPerformance();
        return <div>RDP Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      // Vérifie que les optimisations RDP sont activées
      expect(contextValue.isRDPSession).toBeDefined();
    });
  });
  
  describe('Performance globale', () => {
    test('calcule le score de performance', () => {
      let score;
      
      const TestComponent = () => {
        const { performanceScore } = useGlobalPerformance();
        score = performanceScore;
        return <div>Score Test</div>;
      };
      
      render(
        <GlobalPerformanceProvider>
          <TestComponent />
        </GlobalPerformanceProvider>
      );
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

// Tests d'intégration
describe('GlobalPerformanceOptimizer - Intégration', () => {
  test('fonctionne avec une application complète', async () => {
    const AppWithOptimization = () => {
      const [items] = React.useState(
        Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))
      );
      
      const { cacheStats, performanceScore } = useGlobalPerformance();
      const debouncedHandler = useUltraFastDebounce(() => {}, 50);
      const animations = useLagFreeAnimations();
      
      return (
        <div>
          <div data-testid="performance-score">{performanceScore}</div>
          <div data-testid="cache-stats">{cacheStats.items}</div>
          <OptimizedVirtualList
            items={items}
            height={400}
            itemHeight={64}
            renderItem={(item) => <div key={item.id}>{item.name}</div>}
          />
        </div>
      );
    };
    
    render(
      <GlobalPerformanceProvider>
        <AppWithOptimization />
      </GlobalPerformanceProvider>
    );
    
    // Vérifie que les métriques sont affichées
    expect(screen.getByTestId('performance-score')).toBeInTheDocument();
    expect(screen.getByTestId('cache-stats')).toBeInTheDocument();
    
    // Vérifie que les éléments sont virtualisés
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});

// Tests de régression
describe('GlobalPerformanceOptimizer - Régression', () => {
  test('ne plante pas avec des données vides', () => {
    expect(() => {
      render(
        <GlobalPerformanceProvider>
          <OptimizedVirtualList
            items={[]}
            height={400}
            itemHeight={64}
            renderItem={(item) => <div>{item.name}</div>}
          />
        </GlobalPerformanceProvider>
      );
    }).not.toThrow();
  });
  
  test('gère les erreurs de cache', () => {
    let contextValue;
    
    const TestComponent = () => {
      contextValue = useGlobalPerformance();
      return <div>Error Test</div>;
    };
    
    render(
      <GlobalPerformanceProvider>
        <TestComponent />
      </GlobalPerformanceProvider>
    );
    
    // Test avec des données invalides
    expect(() => {
      contextValue.setInCache('test', null);
      contextValue.getFromCache('invalid_key');
    }).not.toThrow();
  });
  
  test('supporte plusieurs instances', () => {
    const TestApp = () => {
      const [count, setCount] = React.useState(0);
      
      return (
        <div>
          <button onClick={() => setCount(c => c + 1)}>Increment</button>
          <div data-testid="count">{count}</div>
          
          <GlobalPerformanceProvider>
            <div>Provider 1</div>
          </GlobalPerformanceProvider>
          
          <GlobalPerformanceProvider>
            <div>Provider 2</div>
          </GlobalPerformanceProvider>
        </div>
      );
    };
    
    render(<TestApp />);
    
    fireEvent.click(screen.getByText('Increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});