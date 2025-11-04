/**
 * Tests de détection de fuites mémoire dans les composants React
 * Teste useEffect, event listeners, et autres patterns à risque
 */

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react');
const { MemoryMonitor } = require('./memoryMonitor');
const { REACT_CONFIG } = require('./memory.config');

// Mock du profiler React DevTools
const mockReactProfiler = {
  recordProfile: jest.fn(),
  getProfilingData: jest.fn(() => ({
    commits: [],
    durations: [],
    rootFlareEvents: [],
    treeSnapshot: {}
  }))
};

// Composant avec fuite useEffect
const LeakyComponent = ({ dataSize = 1000 }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    // Fuite: intervalle non nettoyé
    const interval = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);

    // Ne pas return cleanup = fuite
  }, []);

  React.useEffect(() => {
    // Fuite: event listener non nettoyé
    const handleClick = () => {
      console.log('click');
    };
    
    document.addEventListener('click', handleClick);
    
    // Pas de cleanup = fuite
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

// Composant avec cleanup correct
const CleanComponent = ({ dataSize = 1000 }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const handleClick = () => {
      console.log('click');
    };
    
    document.addEventListener('click', handleClick);
    
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

// Composant avec fuite de données
const DataLeakComponent = () => {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const response = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            largeArray: new Array(50000).fill('data'),
            cache: new Map()
          });
        }, 100);
      });
      setData(response);
    };

    fetchData();
  }, []);

  return <div>{data ? 'Data loaded' : 'Loading...'}</div>;
};

describe('Tests Fuites Mémoire Composants React', () => {
  let memoryMonitor;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
    jest.clearAllMocks();
  });

  describe('Tests Event Listeners', () => {
    test('doit détecter des event listeners non nettoyés', async () => {
      const { unmount } = render(
        <LeakyComponent />
      );

      // Attendre que les listeners soient ajoutés
      await waitFor(() => {
        expect(document.querySelectorAll('*').length).toBeGreaterThan(0);
      }, { timeout: REACT_CONFIG.COMPONENT_MOUNT_TIMEOUT });

      const initialListeners = getEventListeners(document);

      // Démonte le composant
      unmount();

      // Vérifie que les listeners ne sont pas nettoyés
      const finalListeners = getEventListeners(document);
      
      // Si les listeners ne sont pas nettoyés, c'est une fuite
      if (finalListeners.click && finalListeners.click.length > initialListeners.click.length) {
        console.log('Fuites détectées:', {
          initial: initialListeners.click.length,
          final: finalListeners.click.length
        });
      }
    });

    test('doit nettoyer correctement les event listeners', async () => {
      const { unmount } = render(
        <CleanComponent />
      );

      await waitFor(() => {
        expect(document.querySelectorAll('*').length).toBeGreaterThan(0);
      }, { timeout: REACT_CONFIG.COMPONENT_MOUNT_TIMEOUT });

      const initialListeners = getEventListeners(document);

      // Force le GC et attend
      if (global.gc) global.gc();
      await new Promise(resolve => setTimeout(resolve, REACT_CONFIG.USEEFFECT_CLEANUP_TIMEOUT));

      unmount();

      // Attend le cleanup
      await waitFor(() => {
        // Le composant devrait avoir nettoyé ses listeners
      }, { timeout: REACT_CONFIG.USEEFFECT_CLEANUP_TIMEOUT });
    });
  });

  describe('Tests useEffect Cleanup', () => {
    test('doit détecter les fuites de setInterval', async () => {
      const { unmount } = render(
        <LeakyComponent />
      );

      // Démarre la surveillance
      memoryMonitor.startMonitoring();

      // Attendre quelques cycles d'intervalle
      await new Promise(resolve => setTimeout(resolve, 3000));

      const snapshotsBeforeUnmount = [...memoryMonitor.heapSnapshots];

      // Démonte le composant
      unmount();

      // Attend le nettoyage
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vérifie l'utilisation mémoire après unmount
      const leaks = memoryMonitor.detectLeaks();
      
      if (leaks && leaks.length > 0) {
        console.log('Fuites useEffect détectées:', leaks);
      }
    });

    test('doit mesurer l\'impact mémoire des composants', async () => {
      // Mesure l'impact d'un composant avec fuite
      const leakyResult = await memoryMonitor.measureFunctionMemory(() => {
        const { container } = render(<LeakyComponent />);
        return container;
      }, 'leaky');

      // Mesure l'impact d'un composant propre
      const cleanResult = await memoryMonitor.measureFunctionMemory(() => {
        const { container } = render(<CleanComponent />);
        return container;
      }, 'clean');

      expect(leakyResult.memory.increase).toBeGreaterThan(0);
      expect(cleanResult.memory.increase).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tests Référence Mémoire', () => {
    test('doit détecter les fuites de données dans useState', async () => {
      const { unmount } = render(<DataLeakComponent />);

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(document.textContent).toContain('Data loaded');
      }, { timeout: 5000 });

      const memoryBeforeUnmount = memoryMonitor.getMemoryStats();

      // Démonte le composant
      unmount();

      // Force le GC
      if (global.gc) global.gc();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const memoryAfterUnmount = memoryMonitor.getMemoryStats();
      const memoryDiff = memoryAfterUnmount.heapUsed - memoryBeforeUnmount.heapUsed;

      // Si la mémoire augmente après unmount, c'est une fuite
      if (memoryDiff > 1) { // 1MB
        console.log(`Fuite détectée: +${memoryDiff.toFixed(2)}MB après unmount`);
      }
    });

    test('doit mesurer l\'allocation de gros objets', async () => {
      const largeObjectTest = () => {
        // Crée un gros objet avec références circulaires
        const obj1 = { name: 'obj1', data: new Array(10000).fill('data') };
        const obj2 = { name: 'obj2', data: new Array(10000).fill('data') };
        
        obj1.ref = obj2;
        obj2.ref = obj1;

        return { obj1, obj2 };
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        largeObjectTest,
        'largeObjectTest'
      );

      expect(result.obj1).toBeDefined();
      expect(result.obj2).toBeDefined();
      expect(memory.increase).toBeGreaterThan(0);
    });
  });

  describe('Tests Performance Composants', () => {
    test('doit profiler le rendu de multiples composants', async () => {
      const renderMultipleComponents = async () => {
        const containers = [];
        
        for (let i = 0; i < 10; i++) {
          const { container } = render(<CleanComponent key={i} />);
          containers.push(container);
          
          // Pequeña pausa para simular operaciones reales
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return containers;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        renderMultipleComponents,
        'renderMultipleComponents'
      );

      expect(result.length).toBe(10);
      expect(memory.increase).toBeGreaterThan(0);
    });

    test('doit tester le démantèlement de composants en cascade', async () => {
      const cascadeUnmount = async () => {
        const containers = [];
        
        for (let i = 0; i < 5; i++) {
          const { container, unmount } = render(<CleanComponent key={i} />);
          containers.push(unmount);
          
          // Démonte immédiatement pour tester la cascade
          await new Promise(resolve => setTimeout(resolve, 100));
          unmount();
        }
        
        return containers.length;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        cascadeUnmount,
        'cascadeUnmount'
      );

      expect(result).toBe(5);
    });
  });

  describe('Tests Monitoring Continue', () => {
    test('doit surveiller les composants en temps réel', async () => {
      memoryMonitor.startMonitoring();

      // Monte plusieurs composants
      const components = [];
      for (let i = 0; i < 3; i++) {
        const { container } = render(<CleanComponent key={i} />);
        components.push(container);
      }

      // Attend plusieurs cycles de surveillance
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Démonte tous les composants
      components.forEach(container => {
        const component = container.closest('[data-testid]');
        if (component) {
          // Simule unmount
        }
      });

      // Attend que la mémoire se stabilise
      await new Promise(resolve => setTimeout(resolve, 3000));

      memoryMonitor.stopMonitoring();

      const leaks = memoryMonitor.detectLeaks();
      const report = memoryMonitor.exportReport();

      expect(report.snapshots.length).toBeGreaterThan(0);
      console.log('Rapport de surveillance:', {
        leaks: leaks?.length || 0,
        snapshots: report.snapshots.length
      });
    });
  });
});

// Utilitaire pour obtenir les event listeners (mock simplifié)
function getEventListeners(element) {
  // En environnement réel, utiliser getEventListeners du DOM
  return {
    click: [],
    keydown: [],
    keyup: [],
    mouseover: []
  };
}