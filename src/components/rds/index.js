/**
 * RDS Components - Point d'entrée principal
 * 
 * Ce fichier expose tous les composants RDS pour faciliter l'import
 * et l'utilisation dans l'application Docucortex Enhanced.
 */

// Composant principal de messagerie RDS
export { default as RDSMessagingFix } from './RDSMessagingFix';

// CSS du composant principal
import './RDSMessagingFix.css';

// Exemple d'utilisation pratique
export { default as RDSMessagingExample } from './RDSMessagingExample';

// CSS de l'exemple
import './RDSMessagingExample.css';

/**
 * Utilitaires et helpers pour les composants RDS
 */

// Génération d'ID unique pour les messages
export const generateRDSMessageId = () => {
  return `rds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validation de la configuration WebSocket
export const validateRDSConfig = (config) => {
  const required = ['rdsEndpoint', 'userId', 'sessionId'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Configuration RDS incomplète. Champs manquants: ${missing.join(', ')}`);
  }
  
  // Validation de l'URL WebSocket
  try {
    new URL(config.rdsEndpoint);
  } catch (error) {
    throw new Error('URL WebSocket invalide');
  }
  
  return true;
};

// Formatage de timestamp pour les messages
export const formatRDSTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Détection de mentions dans le texte
export const detectRDPMentions = (text, userId) => {
  const mentionPattern = new RegExp(`@${userId}\\b`, 'gi');
  return mentionPattern.test(text);
};

// Extraction d'URLs dans le texte
export const extractRDSUrls = (text) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.match(urlPattern) || [];
};

// Validation de contenu de message
export const validateRDSMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Contenu du message invalide' };
  }
  
  if (content.trim().length === 0) {
    return { valid: false, error: 'Message vide' };
  }
  
  if (content.length > 1000) {
    return { valid: false, error: 'Message trop long (max 1000 caractères)' };
  }
  
  // Vérification de contenu inapproprié basique
  const inappropriateWords = ['spam', 'flood']; // Liste extensible
  const lowercaseContent = content.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (lowercaseContent.includes(word)) {
      return { valid: false, error: `Contenu potentiellement inapproprié détecté: ${word}` };
    }
  }
  
  return { valid: true };
};

// Calcul de statistiques de session RDS
export const calculateRDSStats = (messages) => {
  if (!Array.isArray(messages)) {
    return {
      totalMessages: 0,
      uniqueUsers: 0,
      avgMessageLength: 0,
      timeSpan: 0
    };
  }
  
  const totalMessages = messages.length;
  const uniqueUsers = new Set(messages.map(m => m.userId).filter(Boolean)).size;
  const messageLengths = messages.map(m => (m.content || '').length);
  const avgMessageLength = totalMessages > 0 
    ? Math.round(messageLengths.reduce((a, b) => a + b, 0) / totalMessages)
    : 0;
  
  const timestamps = messages.map(m => m.timestamp).filter(Boolean).sort((a, b) => a - b);
  const timeSpan = timestamps.length > 1 
    ? timestamps[timestamps.length - 1] - timestamps[0]
    : 0;
  
  return {
    totalMessages,
    uniqueUsers,
    avgMessageLength,
    timeSpan
  };
};

// Constantes de configuration RDS
export const RDS_CONFIG = {
  DEFAULT_ENDPOINT: 'wss://rds-server.example.com/ws',
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_RETRY_DELAY: 1000,
  DEFAULT_HEARTBEAT_INTERVAL: 30000,
  DEFAULT_MESSAGE_HISTORY_LIMIT: 100,
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_DEBOUNCE: 1000,
  CONNECTION_TIMEOUT: 10000
};

// Types de statut de connexion
export const RDS_CONNECTION_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed'
};

// Types de statut de message
export const RDS_MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  RECEIVED: 'received',
  FAILED: 'failed'
};

// Types de message RDS
export const RDS_MESSAGE_TYPE = {
  MESSAGE: 'message',
  SYSTEM: 'system',
  TYPING: 'typing',
  PING: 'ping',
  PONG: 'pong',
  STATUS: 'status'
};

/**
 * Hook React personnalisé pour la gestion RDS
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export const useRDSConnection = (config) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(RDS_CONNECTION_STATUS.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      validateRDSConfig(config);
    } catch (error) {
      setLastError(error.message);
      setConnectionStatus(RDS_CONNECTION_STATUS.FAILED);
      return;
    }

    setConnectionStatus(RDS_CONNECTION_STATUS.CONNECTING);
    setLastError(null);

    const ws = new WebSocket(`${config.rdsEndpoint}?userId=${config.userId}&sessionId=${config.sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus(RDS_CONNECTION_STATUS.CONNECTED);
      setReconnectAttempts(0);
      setLastError(null);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setConnectionStatus(RDS_CONNECTION_STATUS.DISCONNECTED);
      
      if (event.code !== 1000 && reconnectAttempts < (config.maxRetries || RDS_CONFIG.DEFAULT_MAX_RETRIES)) {
        const delay = (config.retryDelay || RDS_CONFIG.DEFAULT_RETRY_DELAY) * Math.pow(2, reconnectAttempts);
        setReconnectAttempts(prev => prev + 1);
        
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (error) => {
      setLastError('Erreur de connexion WebSocket');
    };
  }, [config, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Déconnexion manuelle');
    }
  }, []);

  useEffect(() => {
    if (config.autoConnect) {
      connect();
    }

    return disconnect;
  }, [connect, disconnect, config.autoConnect]);

  return {
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastError,
    connect,
    disconnect
  };
};

/**
 * Utilitaire de debugging RDS
 */
export const RDS_DEBUG = {
  enabled: process.env.NODE_ENV === 'development',
  
  log: (message, data = null) => {
    if (RDS_DEBUG.enabled) {
      console.log(`[RDS DEBUG] ${message}`, data);
    }
  },
  
  warn: (message, data = null) => {
    if (RDS_DEBUG.enabled) {
      console.warn(`[RDS WARN] ${message}`, data);
    }
  },
  
  error: (message, data = null) => {
    if (RDS_DEBUG.enabled) {
      console.error(`[RDS ERROR] ${message}`, data);
    }
  }
};

// Export par défaut du composant principal pour compatibilité
export default RDSMessagingFix;