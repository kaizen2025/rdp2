/**
 * Configuration pour les tests de mémoire
 * Définit les seuils, configurations et utilitaires pour la détection de fuites
 */

// Seuils d'alerte mémoire (en MB)
const MEMORY_THRESHOLDS = {
  HEAP_USED: {
    WARNING: 100, // 100MB utilisé
    CRITICAL: 200 // 200MB utilisé
  },
  HEAP_TOTAL: {
    WARNING: 150,
    CRITICAL: 250
  },
  RSS: {
    WARNING: 200,
    CRITICAL: 300
  },
  EVENT_LOOP_LAG: {
    WARNING: 50, // ms
    CRITICAL: 100 // ms
  }
};

// Configuration du profilage mémoire
const PROFILING_CONFIG = {
  SNAPSHOT_INTERVAL: 5000, // 5 secondes
  HEAP_SAMPLES: 100, // Nombre d'échantillons à conserver
  LEak_DETECTION_THRESHOLD: 1024 * 1024, // 1MB croissance suspecte
  GARBAGE_COLLECTION_ATTEMPTS: 3 // Nombre de tentatives de GC avant test
};

// Configuration React
const REACT_CONFIG = {
  COMPONENT_MOUNT_TIMEOUT: 10000,
  MAX_COMPONENTS_TO_MONITOR: 50,
  EVENT_LISTENER_THRESHOLD: 10, // Plus de 10 listeners par élément suspect
  USEEFFECT_CLEANUP_TIMEOUT: 2000
};

// Configuration WebSocket
const WEBSOCKET_CONFIG = {
  CONNECTION_TIMEOUT: 5000,
  MAX_CONNECTIONS: 100,
  MEMORY_PER_CONNECTION: 50 * 1024, // 50KB par connexion
  PING_INTERVAL: 30000
};

// Configuration GED massive
const GED_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_BATCH: 1000,
  STREAMING_CHUNK_SIZE: 1024 * 1024, // 1MB
  MEMORY_MONITORING_INTERVAL: 1000
};

// Configuration Electron
const ELECTRON_CONFIG = {
  WINDOW_CREATION_TIMEOUT: 10000,
  WINDOW_CLEANUP_TIMEOUT: 5000,
  BROWSER_WINDOW_MEMORY_LIMIT: 200 * 1024 * 1024, // 200MB
  IPC_MESSAGE_LIMIT: 1000
};

module.exports = {
  MEMORY_THRESHOLDS,
  PROFILING_CONFIG,
  REACT_CONFIG,
  WEBSOCKET_CONFIG,
  GED_CONFIG,
  ELECTRON_CONFIG
};