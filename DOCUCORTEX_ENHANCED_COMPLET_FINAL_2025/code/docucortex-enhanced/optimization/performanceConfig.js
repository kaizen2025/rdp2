/**
 * Configuration pour GlobalPerformanceOptimizer
 * 
 * Centralise toutes les configurations d'optimisation pour différents environnements
 */

import { 
  GlobalPerformanceOptimizer,
  PerformanceTester 
} from './GlobalPerformanceOptimizer';

/**
 * Configuration pour environnement de développement
 */
export const DEV_CONFIG = {
  // Cache moins restrictif en dev
  MAX_CACHE_SIZE: 800 * 1024 * 1024, // 800MB
  CACHE_CLEANUP_THRESHOLD: 0.9,
  CACHE_PRUNE_INTERVAL: 60000, // 1 minute
  
  // Plus d'overscan pour debug
  ITEM_HEIGHT: 64,
  OVERSCAN_COUNT: 10,
  CHUNK_SIZE: 200,
  
  // Animations plus visibles
  REDUCED_MOTION_BREAKPOINT: 4,
  ANIMATION_DURATION: 0.3,
  
  // Memory plus permissif
  GC_THRESHOLD: 0.9,
  MAX_MEMORY_USAGE: 1500 * 1024 * 1024, // 1.5GB
  
  // Pas d'optimisation RDP spécifique en dev
  RDP_SMOOTH_SCROLL: false,
  RDP_LATENCY_COMPENSATION: 33,
  
  // Preload agressif pour tests
  PREDICTIVE_LOOKAHEAD: 7,
  PRELOAD_THRESHOLD: 0.8,
  
  // Debounce plus lent pour debug
  INSTANT_DEBOUNCE: 33, // ~30fps
  FAST_DEBOUNCE: 100,
  NORMAL_DEBOUNCE: 200,
  
  // Compression moins aggressive
  COMPRESSION_THRESHOLD: 2048, // 2KB
  LZ4_COMPRESSION_LEVEL: 1,
  
  // Monitoring actif
  ENABLE_PERFORMANCE_MONITORING: true,
  LOG_PERFORMANCE_METRICS: true,
  PERFORMANCE_ALERT_THRESHOLD: 70
};

/**
 * Configuration pour environnement de production
 */
export const PROD_CONFIG = {
  // Cache restrictif
  MAX_CACHE_SIZE: 300 * 1024 * 1024, // 300MB
  CACHE_CLEANUP_THRESHOLD: 0.75,
  CACHE_PRUNE_INTERVAL: 30000, // 30s
  
  // Virtualisation optimisée
  ITEM_HEIGHT: 72,
  OVERSCAN_COUNT: 5,
  CHUNK_SIZE: 100,
  
  // Animations fluides
  REDUCED_MOTION_BREAKPOINT: 2,
  ANIMATION_DURATION: 0.2,
  
  // Memory strict
  GC_THRESHOLD: 0.85,
  MAX_MEMORY_USAGE: 800 * 1024 * 1024, // 800MB
  
  // Optimisations RDP actives
  RDP_SMOOTH_SCROLL: true,
  RDP_LATENCY_COMPENSATION: 16,
  
  // Preload intelligent
  PREDICTIVE_LOOKAHEAD: 3,
  PRELOAD_THRESHOLD: 0.7,
  
  // Debounce ultra-rapide
  INSTANT_DEBOUNCE: 16,
  FAST_DEBOUNCE: 50,
  NORMAL_DEBOUNCE: 150,
  
  // Compression intelligente
  COMPRESSION_THRESHOLD: 1024, // 1KB
  LZ4_COMPRESSION_LEVEL: 3,
  
  // Monitoring léger
  ENABLE_PERFORMANCE_MONITORING: true,
  LOG_PERFORMANCE_METRICS: false,
  PERFORMANCE_ALERT_THRESHOLD: 85
};

/**
 * Configuration pour RDP
 */
export const RDP_CONFIG = {
  // Cache spécifique RDP
  MAX_CACHE_SIZE: 200 * 1024 * 1024, // 200MB
  CACHE_CLEANUP_THRESHOLD: 0.7,
  CACHE_PRUNE_INTERVAL: 20000, // 20s
  
  // Virtualisation renforcée
  ITEM_HEIGHT: 80,
  OVERSCAN_COUNT: 8,
  CHUNK_SIZE: 75,
  
  // Animations réduites
  REDUCED_MOTION_BREAKPOINT: 5,
  ANIMATION_DURATION: 0.1,
  
  // Memory conservatif
  GC_THRESHOLD: 0.8,
  MAX_MEMORY_USAGE: 600 * 1024 * 1024, // 600MB
  
  // Optimisations RDP obligatoires
  RDP_SMOOTH_SCROLL: true,
  RDP_LATENCY_COMPENSATION: 20,
  
  // Preload anticipé
  PREDICTIVE_LOOKAHEAD: 5,
  PRELOAD_THRESHOLD: 0.6,
  
  // Debounce adaptatif
  INSTANT_DEBOUNCE: 33, // Plus lent pour RDP
  FAST_DEBOUNCE: 67,
  NORMAL_DEBOUNCE: 100,
  
  // Compression renforcée
  COMPRESSION_THRESHOLD: 512, // 512B
  LZ4_COMPRESSION_LEVEL: 5,
  
  // Monitoring RDP
  ENABLE_PERFORMANCE_MONITORING: true,
  LOG_PERFORMANCE_METRICS: false,
  PERFORMANCE_ALERT_THRESHOLD: 80
};

/**
 * Configuration pour mobile
 */
export const MOBILE_CONFIG = {
  // Cache optimisé mobile
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  CACHE_CLEANUP_THRESHOLD: 0.7,
  CACHE_PRUNE_INTERVAL: 45000, // 45s
  
  // Virtualisation mobile
  ITEM_HEIGHT: 80,
  OVERSCAN_COUNT: 3,
  CHUNK_SIZE: 50,
  
  // Animations adaptées mobile
  REDUCED_MOTION_BREAKPOINT: 3,
  ANIMATION_DURATION: 0.15,
  
  // Memory strict mobile
  GC_THRESHOLD: 0.75,
  MAX_MEMORY_USAGE: 400 * 1024 * 1024, // 400MB
  
  // Pas d'optimisations RDP
  RDP_SMOOTH_SCROLL: false,
  RDP_LATENCY_COMPENSATION: 33,
  
  // Preload minimal mobile
  PREDICTIVE_LOOKAHEAD: 2,
  PRELOAD_THRESHOLD: 0.8,
  
  // Debounce mobile
  INSTANT_DEBOUNCE: 33,
  FAST_DEBOUNCE: 67,
  NORMAL_DEBOUNCE: 150,
  
  // Compression mobile
  COMPRESSION_THRESHOLD: 768, // 768B
  LZ4_COMPRESSION_LEVEL: 2,
  
  // Monitoring mobile
  ENABLE_PERFORMANCE_MONITORING: false,
  LOG_PERFORMANCE_METRICS: false,
  PERFORMANCE_ALERT_THRESHOLD: 75
};

/**
 * Configuration automatique selon l'environnement
 */
export const getAutoConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isRDP = detectRDPSession();
  const isMobile = detectMobileDevice();
  
  if (isDevelopment) {
    return DEV_CONFIG;
  }
  
  if (isRDP) {
    return RDP_CONFIG;
  }
  
  if (isMobile) {
    return MOBILE_CONFIG;
  }
  
  return PROD_CONFIG;
};

/**
 * Détection automatique du type de session
 */
const detectRDPSession = () => {
  return (
    navigator.userAgent.includes('Remote Desktop') ||
    window.devicePixelRatio !== 1 ||
    window.screen.width > 1920 ||
    navigator.userAgent.includes('RDP') ||
    (navigator.maxTouchPoints === 0 && window.screen.width > 1600)
  );
};

const detectMobileDevice = () => {
  const ua = navigator.userAgent;
  return /tablet|ipad|playbook|silk|mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua);
};

/**
 * Détecteur de profil utilisateur
 */
export class UserProfileDetector {
  static detect() {
    return {
      deviceType: this.getDeviceType(),
      networkType: this.getNetworkType(),
      browserType: this.getBrowserType(),
      rdpSession: detectRDPSession(),
      performanceTier: this.getPerformanceTier(),
      animationPreference: this.getAnimationPreference(),
      memoryProfile: this.getMemoryProfile()
    };
  }
  
  static getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk|android.*ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }
  
  static getNetworkType() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }
  
  static getBrowserType() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari')) return 'safari';
    if (ua.includes('Edge')) return 'edge';
    return 'unknown';
  }
  
  static getPerformanceTier() {
    // Évalue les capacités du device
    const cores = navigator.hardwareConcurrency || 1;
    const memory = navigator.deviceMemory || 4;
    
    if (cores >= 8 && memory >= 8) return 'high';
    if (cores >= 4 && memory >= 4) return 'medium';
    return 'low';
  }
  
  static getAnimationPreference() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
  }
  
  static getMemoryProfile() {
    const memory = navigator.deviceMemory || 4;
    
    if (memory >= 8) return 'high';
    if (memory >= 4) return 'medium';
    return 'low';
  }
}

/**
 * Gestionnaire de configuration intelligent
 */
export class ConfigManager {
  constructor() {
    this.currentConfig = getAutoConfig();
    this.userProfile = UserProfileDetector.detect();
    this.customOverrides = {};
  }
  
  /**
   * Applique des overrides personnalisés
   */
  setOverride(key, value) {
    this.customOverrides[key] = value;
  }
  
  /**
   * Obtient la configuration finale
   */
  getFinalConfig() {
    const baseConfig = this.getProfileBasedConfig();
    return {
      ...baseConfig,
      ...this.customOverrides
    };
  }
  
  /**
   * Configuration basée sur le profil utilisateur
   */
  getProfileBasedConfig() {
    let config = this.currentConfig;
    
    // Adaptations selon le profil
    if (this.userProfile.performanceTier === 'low') {
      config = this.applyLowPerformanceOptimizations(config);
    }
    
    if (this.userProfile.memoryProfile === 'low') {
      config = this.applyLowMemoryOptimizations(config);
    }
    
    if (this.userProfile.animationPreference === 'reduced') {
      config = this.applyReducedMotionOptimizations(config);
    }
    
    return config;
  }
  
  applyLowPerformanceOptimizations(config) {
    return {
      ...config,
      ITEM_HEIGHT: config.ITEM_HEIGHT + 8,
      OVERSCAN_COUNT: Math.max(2, Math.floor(config.OVERSCAN_COUNT * 0.6)),
      CHUNK_SIZE: Math.max(25, Math.floor(config.CHUNK_SIZE * 0.5)),
      PREDICTIVE_LOOKAHEAD: Math.max(1, Math.floor(config.PREDICTIVE_LOOKAHEAD * 0.5)),
      ANIMATION_DURATION: config.ANIMATION_DURATION * 1.5
    };
  }
  
  applyLowMemoryOptimizations(config) {
    return {
      ...config,
      MAX_CACHE_SIZE: config.MAX_CACHE_SIZE * 0.5,
      GC_THRESHOLD: config.GC_THRESHOLD * 0.8,
      MAX_MEMORY_USAGE: config.MAX_MEMORY_USAGE * 0.6,
      COMPRESSION_THRESHOLD: config.COMPRESSION_THRESHOLD * 0.5
    };
  }
  
  applyReducedMotionOptimizations(config) {
    return {
      ...config,
      ANIMATION_DURATION: 0.05,
      REDUCED_MOTION_BREAKPOINT: 10,
      INSTANT_DEBOUNCE: config.INSTANT_DEBOUNCE * 2,
      FAST_DEBOUNCE: config.FAST_DEBOUNCE * 1.5
    };
  }
  
  /**
   * Recommandations d'optimisation
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    
    if (this.userProfile.rdpSession) {
      recommendations.push({
        type: 'rdp',
        title: 'Optimisations RDP détectées',
        description: 'Le système adapte automatiquement les performances pour les sessions RDP',
        priority: 'high'
      });
    }
    
    if (this.userProfile.performanceTier === 'low') {
      recommendations.push({
        type: 'performance',
        title: 'Performance limitée détectée',
        description: 'Utilisez des listes plus petites et des animations réduites',
        priority: 'medium'
      });
    }
    
    if (this.userProfile.memoryProfile === 'low') {
      recommendations.push({
        type: 'memory',
        title: 'Mémoire limitée',
        description: 'Le cache et les preload sont automatiquement restreints',
        priority: 'high'
      });
    }
    
    if (this.userProfile.networkType === 'slow-2g' || this.userProfile.networkType === '2g') {
      recommendations.push({
        type: 'network',
        title: 'Connexion lente détectée',
        description: 'Préchargement agressif et compression renforcée activés',
        priority: 'high'
      });
    }
    
    return recommendations;
  }
}

/**
 * Initialisation automatique
 */
export const initializePerformanceOptimization = (customConfig = {}) => {
  const configManager = new ConfigManager();
  
  // Applique les configurations personnalisées
  if (customConfig) {
    Object.entries(customConfig).forEach(([key, value]) => {
      configManager.setOverride(key, value);
    });
  }
  
  const finalConfig = configManager.getFinalConfig();
  const recommendations = configManager.getOptimizationRecommendations();
  
  // Logs pour développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 GlobalPerformanceOptimizer initialisé');
    console.log('📱 Profil utilisateur:', configManager.userProfile);
    console.log('⚙️ Configuration:', finalConfig);
    console.log('💡 Recommandations:', recommendations);
  }
  
  return {
    config: finalConfig,
    userProfile: configManager.userProfile,
    recommendations
  };
};

/**
 * Export du système complet
 */
export const PerformanceConfiguration = {
  // Configurations prédéfinies
  DEV: DEV_CONFIG,
  PROD: PROD_CONFIG,
  RDP: RDP_CONFIG,
  MOBILE: MOBILE_CONFIG,
  
  // Utilitaires
  getAutoConfig,
  UserProfileDetector,
  ConfigManager,
  initializePerformanceOptimization,
  
  // Default export
  default: {
    config: getAutoConfig(),
    detector: UserProfileDetector,
    manager: ConfigManager,
    init: initializePerformanceOptimization
  }
};

export default PerformanceConfiguration;