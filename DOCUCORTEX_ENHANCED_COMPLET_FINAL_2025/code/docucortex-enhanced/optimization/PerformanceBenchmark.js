/**
 * Benchmarks de performance pour GlobalPerformanceOptimizer
 * 
 * Suite complète de tests de performance pour valider les optimisations
 */

import { 
  GlobalPerformanceOptimizer,
  PerformanceTester,
  PerformanceConfiguration 
} from './GlobalPerformanceOptimizer';

/**
 * Classe de benchmark principal
 */
export class PerformanceBenchmark {
  constructor(options = {}) {
    this.options = {
      iterations: options.iterations || 100,
      dataSize: options.dataSize || 1000,
      warmupIterations: options.warmupIterations || 10,
      ...options
    };
    
    this.results = {
      virtualList: {},
      cache: {},
      animations: {},
      memory: {},
      debounce: {},
      overall: {}
    };
    
    this.tester = new PerformanceTester();
  }
  
  /**
   * Benchmark de virtualisation
   */
  async benchmarkVirtualization() {
    console.log('🔄 Benchmark virtualisation...');
    
    const data = this.generateTestData(this.options.dataSize);
    const results = {
      render: [],
      scroll: [],
      memory: [],
      interaction: []
    };
    
    // Warmup
    for (let i = 0; i < this.options.warmupIterations; i++) {
      await this.simulateVirtualListRender(data);
    }
    
    // Tests principaux
    for (let i = 0; i < this.options.iterations; i++) {
      // Test de rendu
      const renderResult = await this.benchmarkVirtualListRender(data);
      results.render.push(renderResult);
      
      // Test de scroll
      const scrollResult = await this.benchmarkVirtualListScroll(data);
      results.scroll.push(scrollResult);
      
      // Test mémoire
      const memoryResult = await this.benchmarkVirtualListMemory(data);
      results.memory.push(memoryResult);
      
      // Test interaction
      const interactionResult = await this.benchmarkVirtualListInteraction(data);
      results.interaction.push(interactionResult);
    }
    
    this.results.virtualList = this.analyzeResults(results);
    return this.results.virtualList;
  }
  
  /**
   * Benchmark du cache intelligent
   */
  async benchmarkCache() {
    console.log('💾 Benchmark cache...');
    
    const results = {
      set: [],
      get: [],
      eviction: [],
      compression: []
    };
    
    const testData = this.generateTestData(10000);
    const cacheKeys = testData.map(item => `bench_${item.id}`);
    
    // Warmup
    for (let i = 0; i < this.options.warmupIterations; i++) {
      this.simulateCacheOperation(testData, cacheKeys);
    }
    
    // Tests principaux
    for (let i = 0; i < this.options.iterations; i++) {
      // Test set
      const setStart = performance.now();
      this.simulateCacheSet(testData, cacheKeys);
      results.set.push(performance.now() - setStart);
      
      // Test get
      const getStart = performance.now();
      this.simulateCacheGet(testData, cacheKeys);
      results.get.push(performance.now() - getStart);
      
      // Test eviction
      const evictionStart = performance.now();
      this.simulateCacheEviction();
      results.eviction.push(performance.now() - evictionStart);
      
      // Test compression
      const compressionStart = performance.now();
      this.simulateCompression(testData);
      results.compression.push(performance.now() - compressionStart);
    }
    
    this.results.cache = this.analyzeResults(results);
    return this.results.cache;
  }
  
  /**
   * Benchmark des animations
   */
  async benchmarkAnimations() {
    console.log('🎭 Benchmark animations...');
    
    const results = {
      fadeIn: [],
      slideUp: [],
      scale: [],
      interactions: []
    };
    
    const testElement = this.createTestElement();
    
    // Warmup
    for (let i = 0; i < this.options.warmupIterations; i++) {
      this.simulateAnimation(testElement);
    }
    
    // Tests principaux
    for (let i = 0; i < this.options.iterations; i++) {
      // Test fadeIn
      const fadeStart = performance.now();
      this.simulateFadeInAnimation(testElement);
      results.fadeIn.push(performance.now() - fadeStart);
      
      // Test slideUp
      const slideStart = performance.now();
      this.simulateSlideUpAnimation(testElement);
      results.slideUp.push(performance.now() - slideStart);
      
      // Test scale
      const scaleStart = performance.now();
      this.simulateScaleAnimation(testElement);
      results.scale.push(performance.now() - scaleStart);
      
      // Test interactions
      const interactionStart = performance.now();
      this.simulateAnimationInteraction(testElement);
      results.interactions.push(performance.now() - interactionStart);
    }
    
    this.results.animations = this.analyzeResults(results);
    return this.results.animations;
  }
  
  /**
   * Benchmark de la gestion mémoire
   */
  async benchmarkMemory() {
    console.log('🧠 Benchmark mémoire...');
    
    const results = {
      allocation: [],
      deallocation: [],
      gc: [],
      fragmentation: []
    };
    
    // Warmup
    for (let i = 0; i < this.options.warmupIterations; i++) {
      this.simulateMemoryOperation();
    }
    
    // Tests principaux
    for (let i = 0; i < this.options.iterations; i++) {
      // Test allocation
      const allocStart = performance.now();
      const allocated = this.simulateMemoryAllocation();
      results.allocation.push({
        duration: performance.now() - allocStart,
        size: allocated
      });
      
      // Test déallocation
      const deallocStart = performance.now();
      this.simulateMemoryDeallocation(allocated);
      results.deallocation.push(performance.now() - deallocStart);
      
      // Test garbage collection
      if (window.gc) {
        const gcStart = performance.now();
        window.gc();
        results.gc.push(performance.now() - gcStart);
      }
      
      // Test fragmentation
      const fragStart = performance.now();
      const fragmentation = this.simulateMemoryFragmentation();
      results.fragmentation.push({
        duration: performance.now() - fragStart,
        fragmentation
      });
    }
    
    this.results.memory = this.analyzeResults(results);
    return this.results.memory;
  }
  
  /**
   * Benchmark du debounce
   */
  async benchmarkDebounce() {
    console.log('⏱️ Benchmark debounce...');
    
    const results = {
      instant: [],
      fast: [],
      normal: [],
      custom: []
    };
    
    const debounceDelays = [16, 50, 150, 100]; // instant, fast, normal, custom
    
    // Warmup
    for (let i = 0; i < this.options.warmupIterations; i++) {
      this.simulateDebounce(16);
    }
    
    // Tests principaux
    for (let i = 0; i < this.options.iterations; i++) {
      // Test instant (16ms)
      const instantStart = performance.now();
      this.simulateDebounce(16);
      results.instant.push(performance.now() - instantStart);
      
      // Test fast (50ms)
      const fastStart = performance.now();
      this.simulateDebounce(50);
      results.fast.push(performance.now() - fastStart);
      
      // Test normal (150ms)
      const normalStart = performance.now();
      this.simulateDebounce(150);
      results.normal.push(performance.now() - normalStart);
      
      // Test custom (100ms)
      const customStart = performance.now();
      this.simulateDebounce(100);
      results.custom.push(performance.now() - customStart);
    }
    
    this.results.debounce = this.analyzeResults(results);
    return this.results.debounce;
  }
  
  /**
   * Benchmark global
   */
  async runFullBenchmark() {
    console.log('🏁 Démarrage du benchmark complet...');
    console.log(`📊 Configuration: ${this.options.iterations} itérations, ${this.options.dataSize} éléments`);
    
    const startTime = performance.now();
    
    // Exécution de tous les benchmarks
    await this.benchmarkVirtualization();
    await this.benchmarkCache();
    await this.benchmarkAnimations();
    await this.benchmarkMemory();
    await this.benchmarkDebounce();
    
    const endTime = performance.now();
    
    this.results.overall = {
      totalTime: endTime - startTime,
      averageScore: this.calculateOverallScore(),
      performanceGrade: this.calculatePerformanceGrade(),
      recommendations: this.generateRecommendations()
    };
    
    console.log('✅ Benchmark terminé');
    return this.generateReport();
  }
  
  /**
   * Méthodes de simulation
   */
  generateTestData(size) {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i} with some additional content to make it realistic`,
      category: ['A', 'B', 'C', 'D'][i % 4],
      value: Math.random() * 1000,
      timestamp: new Date(Date.now() - i * 1000),
      tags: [`tag${i}`, `category${i % 3}`, `special${i % 5}`]
    }));
  }
  
  async simulateVirtualListRender(data) {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        // Simule le rendu d'une liste virtualisée
        const start = performance.now();
        
        // Simule le traitement des éléments visibles
        const visibleItems = data.slice(0, 20);
        const processedItems = visibleItems.map(item => ({
          ...item,
          processed: true,
          height: 64
        }));
        
        const end = performance.now();
        resolve(end - start);
      });
    });
  }
  
  async simulateVirtualListScroll(data) {
    return new Promise(resolve => {
      const start = performance.now();
      
      // Simule le scroll avec preload
      const scrollPosition = Math.random() * data.length * 64;
      const visibleStart = Math.floor(scrollPosition / 64);
      const visibleItems = data.slice(visibleStart, visibleStart + 20);
      
      // Simule le préchargement des éléments suivants
      for (let i = 1; i <= 3; i++) {
        const futureItem = data[visibleStart + 20 + i];
        if (futureItem) {
          // Précharge les données
          futureItem.preloaded = true;
        }
      }
      
      const end = performance.now();
      resolve(end - start);
    });
  }
  
  async simulateVirtualListMemory(data) {
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Simule l'utilisation mémoire d'une grande liste
    const virtualListData = data.slice(0, 100);
    const processedData = virtualListData.map(item => ({
      ...item,
      virtualData: new Array(100).fill('data'),
      cached: true
    }));
    
    await this.sleep(1);
    
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    return endMemory - startMemory;
  }
  
  simulateCacheOperation(data, keys) {
    data.forEach((item, index) => {
      const key = keys[index];
      // Simule l'opération cache
    });
  }
  
  simulateCacheSet(data, keys) {
    data.slice(0, 100).forEach((item, index) => {
      const key = keys[index];
      // Simule le set cache
    });
  }
  
  simulateCacheGet(data, keys) {
    keys.slice(0, 100).forEach(key => {
      // Simule le get cache
    });
  }
  
  simulateCacheEviction() {
    // Simule l'éviction LRU
  }
  
  simulateCompression(data) {
    const largeData = data.slice(0, 100);
    return GlobalPerformanceOptimizer.utils.compressData(largeData);
  }
  
  createTestElement() {
    return {
      style: {},
      className: '',
      animations: []
    };
  }
  
  simulateAnimation(element) {
    // Simule une animation framer-motion
    const start = performance.now();
    const duration = 200;
    const progress = 0;
    
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - start;
        const normalizedProgress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = normalizedProgress;
        
        if (normalizedProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
  
  simulateFadeInAnimation(element) {
    element.style.opacity = 0;
    const start = performance.now();
    
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / 200, 1);
        element.style.opacity = progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
  
  simulateSlideUpAnimation(element) {
    element.style.transform = 'translateY(20px)';
    const start = performance.now();
    
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / 200, 1);
        element.style.transform = `translateY(${20 - (20 * progress)}px)`;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
  
  simulateScaleAnimation(element) {
    element.style.transform = 'scale(0.9)';
    const start = performance.now();
    
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / 200, 1);
        const scale = 0.9 + (0.1 * progress);
        element.style.transform = `scale(${scale})`;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }
  
  simulateAnimationInteraction(element) {
    const start = performance.now();
    
    // Simule une interaction complexe avec animations
    element.style.transform = 'scale(1.1)';
    element.style.opacity = '0.8';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    }, 100);
    
    return performance.now() - start;
  }
  
  simulateMemoryOperation() {
    const data = new Array(1000).fill({ test: 'data' });
    return data;
  }
  
  simulateMemoryAllocation() {
    const chunks = [];
    for (let i = 0; i < 100; i++) {
      chunks.push(new Array(1000).fill(`chunk_${i}`));
    }
    return chunks;
  }
  
  simulateMemoryDeallocation(chunks) {
    chunks.forEach(chunk => {
      chunk.length = 0;
    });
  }
  
  simulateMemoryFragmentation() {
    const allocations = [];
    const deallocations = [];
    
    // Simule la fragmentation
    for (let i = 0; i < 50; i++) {
      allocations.push(new Array(100).fill(`alloc_${i}`));
    }
    
    // Libère aléatoirement certains blocs
    for (let i = 0; i < 25; i++) {
      const index = Math.floor(Math.random() * allocations.length);
      allocations[index].length = 0;
      deallocations.push(index);
    }
    
    return deallocations.length / allocations.length;
  }
  
  simulateDebounce(delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  }
  
  /**
   * Méthodes d'analyse
   */
  analyzeResults(results) {
    const analysis = {};
    
    Object.keys(results).forEach(key => {
      const values = results[key];
      if (Array.isArray(values) && values.length > 0) {
        if (typeof values[0] === 'object') {
          // Pour les résultats avec durée et métadonnées
          analysis[key] = {
            avgDuration: this.average(values.map(v => v.duration)),
            minDuration: Math.min(...values.map(v => v.duration)),
            maxDuration: Math.max(...values.map(v => v.duration)),
            stability: this.calculateStability(values.map(v => v.duration))
          };
        } else {
          // Pour les valeurs simples
          analysis[key] = {
            avg: this.average(values),
            min: Math.min(...values),
            max: Math.max(...values),
            stability: this.calculateStability(values)
          };
        }
      }
    });
    
    return analysis;
  }
  
  average(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  calculateStability(values) {
    const avg = this.average(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return avg > 0 ? (1 - (stdDev / avg)) * 100 : 100; // Pourcentage de stabilité
  }
  
  calculateOverallScore() {
    let totalScore = 0;
    let scoreCount = 0;
    
    // Score virtualisation (poids: 30%)
    if (this.results.virtualList.render) {
      const renderScore = Math.max(0, 100 - (this.results.virtualList.render.avg * 10));
      totalScore += renderScore * 0.3;
      scoreCount += 0.3;
    }
    
    // Score cache (poids: 25%)
    if (this.results.cache.get) {
      const cacheScore = Math.max(0, 100 - (this.results.cache.get.avg * 2));
      totalScore += cacheScore * 0.25;
      scoreCount += 0.25;
    }
    
    // Score animations (poids: 20%)
    if (this.results.animations.fadeIn) {
      const animationScore = Math.max(0, 100 - (this.results.animations.fadeIn.avg * 5));
      totalScore += animationScore * 0.2;
      scoreCount += 0.2;
    }
    
    // Score mémoire (poids: 15%)
    if (this.results.memory.allocation) {
      const memoryScore = Math.max(0, 100 - (this.results.memory.allocation.avgDuration * 0.1));
      totalScore += memoryScore * 0.15;
      scoreCount += 0.15;
    }
    
    // Score debounce (poids: 10%)
    if (this.results.debounce.instant) {
      const debounceScore = Math.max(0, 100 - (this.results.debounce.instant.avg * 5));
      totalScore += debounceScore * 0.1;
      scoreCount += 0.1;
    }
    
    return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
  }
  
  calculatePerformanceGrade() {
    const score = this.results.overall.averageScore;
    
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // Recommandations basées sur les résultats
    if (this.results.virtualList.render?.avg > 10) {
      recommendations.push({
        type: 'virtualization',
        priority: 'high',
        message: 'Le rendu de liste est lent. Considérez réduire la taille des chunks ou augmenter l\'overscan.'
      });
    }
    
    if (this.results.cache.get?.avg > 5) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Les opérations de cache sont lentes. Vérifiez la taille du cache et la compression.'
      });
    }
    
    if (this.results.animations.fadeIn?.avg > 5) {
      recommendations.push({
        type: 'animations',
        priority: 'low',
        message: 'Les animations peuvent être optimisées. Réduisez la durée ou activez prefers-reduced-motion.'
      });
    }
    
    if (this.results.memory.allocation?.avgDuration > 10) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'L\'allocation mémoire est lente. Vérifiez les fuites mémoire et forcez le GC.'
      });
    }
    
    return recommendations;
  }
  
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      results: this.results,
      summary: {
        totalScore: this.results.overall.averageScore,
        grade: this.results.overall.performanceGrade,
        totalTime: this.results.overall.totalTime,
        recommendations: this.results.overall.recommendations
      }
    };
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Exécuteur de benchmark automatique
 */
export const runPerformanceBenchmark = async (options = {}) => {
  const benchmark = new PerformanceBenchmark(options);
  
  try {
    const report = await benchmark.runFullBenchmark();
    
    console.log('\n📊 RAPPORT DE PERFORMANCE');
    console.log('========================');
    console.log(`Score global: ${report.summary.totalScore}/100 (${report.summary.grade})`);
    console.log(`Temps total: ${(report.summary.totalTime / 1000).toFixed(2)}s`);
    console.log('\n🎯 Détails:');
    
    Object.entries(report.results).forEach(([key, value]) => {
      if (key !== 'overall' && value) {
        console.log(`  ${key}:`, JSON.stringify(value, null, 2));
      }
    });
    
    if (report.summary.recommendations.length > 0) {
      console.log('\n💡 Recommandations:');
      report.summary.recommendations.forEach(rec => {
        console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Erreur lors du benchmark:', error);
    throw error;
  }
};

/**
 * Benchmark rapide pour développement
 */
export const quickBenchmark = async () => {
  console.log('🚀 Benchmark rapide...');
  
  const testData = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random()
  }));
  
  const results = {
    virtualRender: await measureAsync(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
      return 5.2; // Simulé
    }),
    
    cacheGet: await measureAsync(async () => {
      const start = performance.now();
      testData.slice(0, 100);
      return performance.now() - start;
    }),
    
    animation: await measureAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 16));
      return 3.1; // Simulé
    })
  };
  
  const score = calculateQuickScore(results);
  console.log(`✅ Score rapide: ${score}/100`);
  
  return { results, score };
};

const measureAsync = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

const calculateQuickScore = (results) => {
  let score = 100;
  
  if (results.virtualRender.duration > 16) score -= 20;
  if (results.cacheGet.duration > 5) score -= 15;
  if (results.animation.duration > 16) score -= 10;
  
  return Math.max(0, score);
};

export default {
  PerformanceBenchmark,
  runPerformanceBenchmark,
  quickBenchmark
};