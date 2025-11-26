/**
 * RDS Messaging Fix - Types TypeScript
 * 
 * Ce fichier contient toutes les définitions de types TypeScript
 * pour le système de messagerie RDS Docucortex Enhanced.
 */

// Types de base RDS
export interface RDSMessage {
  id: string;
  type: RDSMessageType;
  content: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  status?: RDSMessageStatus;
  username?: string;
  isTyping?: boolean;
}

// Types de messages
export type RDSMessageType = 
  | 'message' 
  | 'system' 
  | 'typing' 
  | 'ping' 
  | 'pong' 
  | 'status'
  | 'custom_event';

// Types de statut de connexion
export type RDSConnectionStatus = 
  | 'connected' 
  | 'connecting' 
  | 'disconnected' 
  | 'failed';

// Types de statut de message
export type RDSMessageStatus = 
  | 'sending' 
  | 'sent' 
  | 'received' 
  | 'failed';

// Configuration RDS
export interface RDSConfig {
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
  messageHistoryLimit: number;
  exponentialBackoff: boolean;
  reconnectEnabled: boolean;
  typingDebounce: number;
  messageBatchSize: number;
}

// Props du composant RDSMessagingFix
export interface RDSMessagingProps {
  rdsEndpoint?: string;
  userId: string;
  sessionId: string;
  maxRetries?: number;
  retryDelay?: number;
  heartbeatInterval?: number;
  messageHistoryLimit?: number;
  onMessageReceived?: (message: RDSMessage) => void;
  onError?: (error: Error, details?: any) => void;
  autoConnect?: boolean;
}

// État interne du composant
export interface RDSComponentState {
  messages: RDSMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: RDSConnectionStatus;
  reconnectAttempts: number;
  pendingMessages: RDSMessage[];
  typing: RDSTypingIndicator[];
  inputMessage: string;
  isTyping: boolean;
  lastError: string | null;
}

// Indicateur de frappe
export interface RDSTypingIndicator {
  userId: string;
  username: string;
}

// Événements WebSocket
export interface RDSSocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

// Configuration WebSocket
export interface RDSWebSocketConfig {
  url: string;
  protocols?: string | string[];
  headers?: Record<string, string>;
  timeout?: number;
  heartbeatInterval?: number;
}

// Résultat de validation
export interface RDSValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// Statistiques de session
export interface RDSSessionStats {
  totalMessages: number;
  uniqueUsers: number;
  avgMessageLength: number;
  timeSpan: number;
  connectionDuration: number;
  errorCount: number;
  retryCount: number;
}

// Métriques de performance
export interface RDSPerformanceMetrics {
  messageDeliveryTime: number[];
  connectionTime: number;
  memoryUsage: number;
  messageThroughput: number; // messages par seconde
  errorRate: number; // pourcentage d'erreurs
}

// État de l'utilisateur RDS
export interface RDSUserState {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen: number;
  currentSession?: string;
  typing?: boolean;
}

// Configuration d'exemple
export interface RDSExampleConfig {
  rdsEndpoint: string;
  userId: string;
  sessionId: string;
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
  messageHistoryLimit: number;
  debugMode: boolean;
  simulateMessages: boolean;
}

// Props de l'exemple
export interface RDSExampleProps {
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  initialConfig?: Partial<RDSExampleConfig>;
}

// Gestionnaire d'événements
export type RDSMessageHandler = (message: RDSMessage) => void;
export type RDSErrorHandler = (error: Error, details?: any) => void;
export type RDSConnectionHandler = (status: RDSConnectionStatus, details?: any) => void;

// Hook pour la connexion RDS
export interface UseRDSConnectionResult {
  isConnected: boolean;
  connectionStatus: RDSConnectionStatus;
  reconnectAttempts: number;
  lastError: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => Promise<boolean>;
  sendTyping: (isTyping: boolean) => void;
}

// Options de retry
export interface RDSRetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

// Configuration de logging
export interface RDSLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  includeStack: boolean;
  includeTimestamp: boolean;
  outputTarget: 'console' | 'remote' | 'file';
}

// Utilitaires de types
export type RDSOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RDSRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Types pour l'API de stockage
export interface RDSStorageMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface RDSStorageSession {
  sessionId: string;
  participants: string[];
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  status: 'active' | 'archived' | 'closed';
}

// Types pour les notifications
export interface RDSNotification {
  id: string;
  type: 'message' | 'mention' | 'system' | 'error';
  title: string;
  message: string;
  timestamp: number;
  userId: string;
  sessionId?: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Configuration du thème
export interface RDSThemeConfig {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  shadow: string;
  radius: number;
}

// Props de configuration avancée
export interface RDSAdvancedConfig extends RDSConfig {
  theme?: Partial<RDSThemeConfig>;
  logging?: Partial<RDSLoggingConfig>;
  retry?: Partial<RDSRetryOptions>;
  storage?: {
    persistMessages: boolean;
    maxStoredMessages: number;
    autoCleanup: boolean;
  };
  notifications?: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    desktop: boolean;
  };
}

// État global RDS (pour gestion centralisée)
export interface RDSGlobalState {
  connections: Map<string, UseRDSConnectionResult>;
  sessions: Map<string, RDSStorageSession>;
  users: Map<string, RDSUserState>;
  notifications: RDSNotification[];
  config: RDSAdvancedConfig;
}

// Actions pour le reducer RDS
export type RDSGlobalAction = 
  | { type: 'CONNECT'; payload: { sessionId: string; config: RDSConfig } }
  | { type: 'DISCONNECT'; payload: { sessionId: string } }
  | { type: 'MESSAGE_RECEIVED'; payload: { sessionId: string; message: RDSMessage } }
  | { type: 'MESSAGE_SENT'; payload: { sessionId: string; message: RDSMessage } }
  | { type: 'USER_TYPING'; payload: { sessionId: string; userId: string; isTyping: boolean } }
  | { type: 'ERROR_OCCURRED'; payload: { sessionId: string; error: Error } }
  | { type: 'NOTIFICATION_ADD'; payload: RDSNotification }
  | { type: 'NOTIFICATION_READ'; payload: string }
  | { type: 'CONFIG_UPDATE'; payload: Partial<RDSAdvancedConfig> };

// Provider RDS
export interface RDSProviderProps {
  children: React.ReactNode;
  config?: Partial<RDSAdvancedConfig>;
}

// Context RDS
export interface RDSContextType {
  state: RDSGlobalState;
  dispatch: React.Dispatch<RDSGlobalAction>;
  connect: (sessionId: string, config: RDSConfig) => Promise<boolean>;
  disconnect: (sessionId: string) => void;
  sendMessage: (sessionId: string, content: string) => Promise<boolean>;
  getSessionStats: (sessionId: string) => RDSSessionStats | null;
  addNotification: (notification: Omit<RDSNotification, 'id' | 'timestamp'>) => void;
}

// Utilitaires TypeScript pour le debugging
export type RDSDebugLog = {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: number;
  component: string;
};

export type RDSErrorDetails = {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
};

// Extension des types React
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'rds-messaging': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'endpoint'?: string;
        'user-id'?: string;
        'session-id'?: string;
        'auto-connect'?: boolean;
      };
    }
  }
}

// Exports par défaut
export default RDSMessage;