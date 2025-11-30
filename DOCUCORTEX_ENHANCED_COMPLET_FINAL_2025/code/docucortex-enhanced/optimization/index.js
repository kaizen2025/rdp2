/**
 * Index principal du système d'optimisation DocuCortex
 * 
 * Point d'entrée unique pour toutes les fonctionnalités d'optimisation
 */

import React from 'react';

// Import du système principal
export {
  GlobalPerformanceProvider,
  useGlobalPerformance,
  OptimizedVirtualList,
  OptimizedAnimatePresence,
  useUltraFastDebounce,
  useLagFreeAnimations,
  usePredictivePreload,
  useUserProfileOptimization,
  PerformanceTester
} from './GlobalPerformanceOptimizer';

// Import des configurations
export {
  PerformanceConfiguration,
  DEV_CONFIG,
  PROD_CONFIG,
  RDP_CONFIG,
  MOBILE_CONFIG,
  getAutoConfig,
  UserProfileDetector,
  ConfigManager,
  initializePerformanceOptimization
} from './performanceConfig';

// Import des benchmarks
export {
  PerformanceBenchmark,
  runPerformanceBenchmark,
  quickBenchmark
} from './PerformanceBenchmark';

/**
 * Composant d'application optimisée prêt à l'emploi
 */
export const OptimizedApp = ({ children, config = {} }) => {
  const initialization = initializePerformanceOptimization(config);
  
  return (
    <GlobalPerformanceProvider config={initialization.config}>
      <PerformanceMonitor />
      {children}
    </GlobalPerformanceProvider>
  );
};

/**
 * Composant de monitoring léger
 */
const PerformanceMonitor = () => {
  const { performanceScore, memoryUsage, isRDPSession } = useGlobalPerformance();
  
  if (process.env.NODE_ENV !== 'development') {
    return null; // Masquer en production
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      display: 'flex',
      gap: '12px'
    }}>
      <span>⚡ Score: {performanceScore}/100</span>
      <span>💾 {(memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
      {isRDPSession && <span>🖥️ RDP</span>}
    </div>
  );
};

/**
 * Hook de monitoring avancé pour le développement
 */
export const usePerformanceMonitoring = () => {
  const {
    memoryUsage,
    performanceScore,
    cacheStats,
    updatePerformanceMetrics,
    forceGarbageCollection
  } = useGlobalPerformance();
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      updatePerformanceMetrics();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [updatePerformanceMetrics]);
  
  const performanceLevel = performanceScore >= 90 ? 'excellent' :
                          performanceScore >= 80 ? 'good' :
                          performanceScore >= 70 ? 'fair' : 'poor';
  
  const memoryLevel = memoryUsage < 100 * 1024 * 1024 ? 'low' :
                     memoryUsage < 300 * 1024 * 1024 ? 'medium' : 'high';
  
  return {
    memoryUsage,
    performanceScore,
    cacheStats,
    performanceLevel,
    memoryLevel,
    forceGarbageCollection,
    updatePerformanceMetrics
  };
};

/**
 * Composant de diagnostic de performance
 */
export const PerformanceDiagnostic = ({ onComplete }) => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState(null);
  
  const runDiagnostic = async () => {
    setIsRunning(true);
    
    try {
      const report = await runPerformanceBenchmark({
        iterations: 20, // Réduire pour le diagnostic
        dataSize: 500,
        warmupIterations: 5
      });
      
      setResults(report);
      onComplete?.(report);
      
    } catch (error) {
      console.error('Diagnostic échoué:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="performance-diagnostic">
      <h3>🔍 Diagnostic de Performance</h3>
      
      <button 
        onClick={runDiagnostic}
        disabled={isRunning}
        className="diagnostic-btn"
      >
        {isRunning ? '🔄 Diagnostic en cours...' : '🚀 Lancer le diagnostic'}
      </button>
      
      {results && (
        <div className="diagnostic-results">
          <div className="score-display">
            <span className={`score ${results.summary.grade.toLowerCase()}`}>
              Score: {results.summary.totalScore}/100 ({results.summary.grade})
            </span>
          </div>
          
          <div className="recommendations">
            <h4>Recommandations:</h4>
            {results.summary.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.priority}`}>
                <strong>[{rec.priority.toUpperCase()}]</strong> {rec.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook pour créer des composants optimisés rapidement
 */
export const createOptimizedComponent = (BaseComponent, options = {}) => {
  const {
    enableVirtualization = false,
    enableAnimations = true,
    enableCache = false,
    itemHeight = 64
  } = options;
  
  const OptimizedComponent = React.forwardRef((props, ref) => {
    const animations = useLagFreeAnimations();
    
    if (enableVirtualization && props.items && props.items.length > 50) {
      return (
        <OptimizedVirtualList
          items={props.items}
          height={props.height || 400}
          itemHeight={itemHeight}
          renderItem={(item, index) => (
            <BaseComponent {...props} item={item} index={index} />
          )}
        />
      );
    }
    
    return (
      <motion.div
        initial={enableAnimations ? animations.fadeIn : {}}
        ref={ref}
      >
        <BaseComponent {...props} />
      </motion.div>
    );
  });
  
  OptimizedComponent.displayName = `Optimized(${BaseComponent.displayName || BaseComponent.name || 'Component'})`;
  
  return OptimizedComponent;
};

/**
 * Hook pour préchargement intelligent
 */
export const useSmartPreload = (data, dependencies = []) => {
  const { setInCache, getFromCache } = useGlobalPerformance();
  const [preloadedItems, setPreloadedItems] = React.useState(new Set());
  const [loadingStates, setLoadingStates] = React.useState(new Map());
  
  const preloadItem = React.useCallback((itemId, itemData) => {
    const cacheKey = `smart_${itemId}`;
    
    if (!preloadedItems.has(itemId)) {
      setInCache(cacheKey, itemData, 300000); // 5 minutes
      setPreloadedItems(prev => new Set(prev).add(itemId));
    }
  }, [preloadedItems, setInCache]);
  
  const loadItem = React.useCallback(async (itemId, loader) => {
    const cacheKey = `smart_${itemId}`;
    let data = getFromCache(cacheKey);
    
    if (!data) {
      setLoadingStates(prev => new Map(prev).set(itemId, true));
      
      try {
        data = await loader();
        preloadItem(itemId, data);
      } catch (error) {
        console.error('Erreur de préchargement:', error);
      } finally {
        setLoadingStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(itemId);
          return newMap;
        });
      }
    }
    
    return data;
  }, [getFromCache, preloadItem]);
  
  const isLoaded = React.useCallback((itemId) => {
    return preloadedItems.has(itemId);
  }, [preloadedItems]);
  
  const isLoading = React.useCallback((itemId) => {
    return loadingStates.get(itemId) || false;
  }, [loadingStates]);
  
  React.useEffect(() => {
    // Précharge les premiers éléments automatiquement
    if (data && data.length > 0) {
      data.slice(0, 10).forEach(item => {
        preloadItem(item.id || item.key, item);
      });
    }
  }, [data, ...dependencies, preloadItem]);
  
  return {
    preloadItem,
    loadItem,
    isLoaded,
    isLoading,
    preloadedCount: preloadedItems.size,
    loadingCount: loadingStates.size
  };
};

/**
 * Utilitaires de mesure
 */
export const measureComponent = (Component) => {
  const MeasuredComponent = (props) => {
    const [metrics, setMetrics] = React.useState({});
    
    React.useEffect(() => {
      const startTime = performance.now();
      const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      const measureEnd = () => {
        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        setMetrics({
          renderTime: endTime - startTime,
          memoryDelta: endMemory - startMemory,
          timestamp: Date.now()
        });
      };
      
      // Mesure après le rendu
      requestAnimationFrame(measureEnd);
    }, [props]);
    
    return (
      <>
        <Component {...props} />
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            fontSize: '10px',
            color: '#666',
            marginTop: '4px'
          }}>
            Render: {metrics.renderTime?.toFixed(2)}ms | 
            Memory: {metrics.memoryDelta ? (metrics.memoryDelta / 1024).toFixed(1) + 'KB' : 'N/A'}
          </div>
        )}
      </>
    );
  };
  
  MeasuredComponent.displayName = `Measured(${Component.displayName || Component.name || 'Component'})`;
  return MeasuredComponent;
};

/**
 * Export des hooks personnalisés
 */
export const hooks = {
  useGlobalPerformance,
  useUltraFastDebounce,
  useLagFreeAnimations,
  usePredictivePreload,
  useUserProfileOptimization,
  usePerformanceMonitoring,
  useSmartPreload
};

/**
 * Export des composants optimisés
 */
export const components = {
  OptimizedApp,
  OptimizedVirtualList,
  OptimizedAnimatePresence,
  PerformanceDiagnostic
};

/**
 * Export des utilitaires
 */
export const utils = {
  measureComponent,
  createOptimizedComponent,
  GlobalPerformanceOptimizer,
  PerformanceTester
};

/**
 * Configuration automatique
 */
export const autoConfigure = (environment = 'auto') => {
  if (environment === 'auto') {
    environment = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
  }
  
  switch (environment) {
    case 'dev':
      return DEV_CONFIG;
    case 'rdp':
      return RDP_CONFIG;
    case 'mobile':
      return MOBILE_CONFIG;
    case 'prod':
    default:
      return PROD_CONFIG;
  }
};

/**
 * Version du système
 */
export const VERSION = '1.0.0';

/**
 * Export principal
 */
export default {
  // Composants
  OptimizedApp,
  OptimizedVirtualList,
  OptimizedAnimatePresence,
  PerformanceDiagnostic,
  
  // Hooks
  ...hooks,
  
  // Utilitaires
  ...utils,
  
  // Configuration
  autoConfigure,
  PerformanceConfiguration,
  
  // Benchmarks
  PerformanceBenchmark,
  runPerformanceBenchmark,
  quickBenchmark,
  
  // Metadata
  VERSION,
  
  // Main object
  GlobalPerformanceOptimizer
};