import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import './RDSMessagingFix.css';

/**
 * RDSMessagingFix - Système de messagerie RDS corrigé et optimisé
 * 
 * Fonctionnalités :
 * - Gestion WebSocket robuste avec reconnexion automatique
 * - Interface chat temps réel intuitive
 * - Retry automatique en cas d'échec
 * - Indicateurs de statut connexion
 * - Performance optimisée
 * - Gestion d'erreurs complète
 */
const RDSMessagingFix = ({
  rdsEndpoint = 'wss://rds-server.example.com/ws',
  userId,
  sessionId,
  maxRetries = 3,
  retryDelay = 1000,
  heartbeatInterval = 30000,
  messageHistoryLimit = 100,
  onMessageReceived,
  onError,
  autoConnect = true
}) => {
  // États principaux
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [typing, setTyping] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Refs
  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Configuration optimisée
  const config = useMemo(() => ({
    maxRetries,
    retryDelay,
    heartbeatInterval,
    messageHistoryLimit,
    exponentialBackoff: true,
    reconnectEnabled: true,
    typingDebounce: 1000,
    messageBatchSize: 10
  }), [maxRetries, retryDelay, heartbeatInterval, messageHistoryLimit]);

  /**
   * Gestionnaire de connexion WebSocket robuste
   */
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setLastError(null);

    try {
      const ws = new WebSocket(`${rdsEndpoint}?userId=${userId}&sessionId=${sessionId}`);
      wsRef.current = ws;

      // Gestionnaires d'événements WebSocket
      ws.onopen = () => {
        console.log('🔗 WebSocket RDS connecté');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        setLastError(null);

        // Démarrer le heartbeat
        startHeartbeat();

        // Envoyer les messages en attente
        sendPendingMessages();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ Erreur parsing message:', error);
          handleError('Erreur de parsing du message', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket RDS fermé:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsConnecting(false);
        
        stopHeartbeat();
        
        // Reconnexion automatique si activée
        if (config.reconnectEnabled && event.code !== 1000) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        setLastError('Erreur de connexion WebSocket');
        handleError('Erreur WebSocket', error);
      };

    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error);
      setIsConnecting(false);
      setConnectionStatus('error');
      setLastError('Impossible de se connecter au serveur RDS');
      handleError('Erreur de connexion', error);
      scheduleReconnect();
    }
  }, [rdsEndpoint, userId, sessionId, config, isConnecting]);

  /**
   * Démarrage du heartbeat pour maintenir la connexion
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, config.heartbeatInterval);
  }, [config.heartbeatInterval]);

  /**
   * Arrêt du heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  /**
   * Reconnexion automatique avec exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (!config.reconnectEnabled || reconnectAttempts >= config.maxRetries) {
      setConnectionStatus('failed');
      return;
    }

    const delay = config.exponentialBackoff 
      ? config.retryDelay * Math.pow(2, reconnectAttempts)
      : config.retryDelay;

    console.log(`🔄 Reconnexion dans ${delay}ms (tentative ${reconnectAttempts + 1}/${config.maxRetries})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connect();
    }, delay);
  }, [config, reconnectAttempts, connect]);

  /**
   * Envoi de message avec retry automatique
   */
  const sendMessage = useCallback(async (messageContent) => {
    if (!messageContent.trim() || !isConnected) {
      return false;
    }

    const message = {
      id: generateMessageId(),
      type: 'message',
      content: messageContent.trim(),
      timestamp: Date.now(),
      userId,
      sessionId,
      status: 'sending'
    };

    try {
      // Ajouter immédiatement au state pour feedback utilisateur
      setMessages(prev => [...prev.slice(-config.messageHistoryLimit + 1), message]);
      setInputMessage('');

      // Envoyer via WebSocket
      wsRef.current.send(JSON.stringify(message));

      // Marquer comme envoyé
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));

      return true;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      
      // Ajouter à la file d'attente des messages en attente
      setPendingMessages(prev => [...prev, message]);
      
      // Marquer comme échoué
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));

      handleError('Erreur d\'envoi de message', error);
      return false;
    }
  }, [isConnected, userId, sessionId, config.messageHistoryLimit]);

  /**
   * Envoi des messages en attente après reconnexion
   */
  const sendPendingMessages = useCallback(async () => {
    if (pendingMessages.length === 0) return;

    const messagesToSend = [...pendingMessages];
    setPendingMessages([]);

    for (const message of messagesToSend) {
      try {
        wsRef.current.send(JSON.stringify(message));
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'sent' } : msg
        ));
      } catch (error) {
        console.error('❌ Erreur envoi message en attente:', error);
        setPendingMessages(prev => [...prev, message]);
      }
    }
  }, [pendingMessages]);

  /**
   * Gestion des messages reçus
   */
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'pong':
        // Réponse au ping
        break;

      case 'message':
        const newMessage = {
          ...data,
          status: 'received'
        };
        setMessages(prev => [...prev.slice(-config.messageHistoryLimit + 1), newMessage]);
        
        if (onMessageReceived) {
          onMessageReceived(newMessage);
        }
        break;

      case 'typing':
        setTyping(prev => {
          const updated = prev.filter(t => t.userId !== data.userId);
          if (data.isTyping) {
            updated.push({ userId: data.userId, username: data.username });
          }
          return updated;
        });
        break;

      case 'system':
        const systemMessage = {
          id: data.id || generateMessageId(),
          type: 'system',
          content: data.content,
          timestamp: data.timestamp || Date.now(),
          status: 'received'
        };
        setMessages(prev => [...prev.slice(-config.messageHistoryLimit + 1), systemMessage]);
        break;

      case 'status':
        setConnectionStatus(data.status);
        break;

      default:
        console.warn('⚠️ Type de message inconnu:', data.type);
    }
  }, [config.messageHistoryLimit, onMessageReceived]);

  /**
   * Gestion des erreurs
   */
  const handleError = useCallback((message, error) => {
    console.error(`❌ ${message}:`, error);
    setLastError(message);
    
    if (onError) {
      onError(new Error(message), error);
    }
  }, [onError]);

  /**
   * Indicateur de frappe avec debouncing
   */
  const sendTypingIndicator = useMemo(
    () => debounce((isTyping) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          userId,
          sessionId,
          isTyping,
          timestamp: Date.now()
        }));
      }
    }, config.typingDebounce),
    [userId, sessionId, config.typingDebounce]
  );

  /**
   * Gestion de la frappe utilisateur
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Arrêter l'indicateur de frappe après un délai
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, config.typingDebounce + 500);
  }, [isTyping, sendTypingIndicator, config.typingDebounce]);

  /**
   * Génération d'ID unique pour les messages
   */
  const generateMessageId = () => {
    return `rds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Scroll automatique vers le bas
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Nettoyage à la destruction
   */
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Composant démonté');
      }
    };
  }, [stopHeartbeat]);

  /**
   * Connexion automatique si activée
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect, connect]);

  /**
   * Rendu du statut de connexion
   */
  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: { color: '#10B981', icon: '🟢', text: 'Connecté' },
      connecting: { color: '#F59E0B', icon: '🟡', text: 'Connexion...' },
      disconnected: { color: '#EF4444', icon: '🔴', text: 'Déconnecté' },
      failed: { color: '#DC2626', icon: '❌', text: 'Échec connexion' }
    };

    const status = statusConfig[connectionStatus] || statusConfig.disconnected;

    return (
      <div className="rds-status-indicator" style={{ color: status.color }}>
        <span className="rds-status-icon">{status.icon}</span>
        <span className="rds-status-text">{status.text}</span>
        {reconnectAttempts > 0 && (
          <span className="rds-retry-count">({reconnectAttempts}/{config.maxRetries})</span>
        )}
        {pendingMessages.length > 0 && (
          <span className="rds-pending-count">
            📤 {pendingMessages.length}
          </span>
        )}
      </div>
    );
  };

  /**
   * Rendu des indicateurs de frappe
   */
  const renderTypingIndicators = () => {
    if (typing.length === 0) return null;

    return (
      <div className="rds-typing-indicators">
        {typing.map(t => (
          <span key={t.userId} className="rds-typing-indicator">
            {t.username} est en train d'écrire...
          </span>
        ))}
      </div>
    );
  };

  /**
   * Rendu d'un message individuel
   */
  const renderMessage = (message) => {
    const isOwn = message.userId === userId;
    const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusIcon = {
      sending: '⏳',
      sent: '✅',
      received: '👁️',
      failed: '❌'
    };

    return (
      <div key={message.id} className={`rds-message ${isOwn ? 'own' : 'other'}`}>
        <div className="rds-message-content">
          <div className="rds-message-text">{message.content}</div>
          <div className="rds-message-meta">
            <span className="rds-message-time">{time}</span>
            {isOwn && message.status && (
              <span className="rds-message-status">{statusIcon[message.status]}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Rendu de l'interface principale
   */
  return (
    <div className="rds-messaging-container">
      {/* En-tête avec statut */}
      <div className="rds-messaging-header">
        <h3 className="rds-messaging-title">
          💬 Chat RDS - Session {sessionId}
        </h3>
        {renderConnectionStatus()}
      </div>

      {/* Zone des messages */}
      <div className="rds-messages-container">
        {lastError && (
          <div className="rds-error-banner">
            ⚠️ {lastError}
            <button 
              onClick={() => setLastError(null)}
              className="rds-error-close"
            >
              ✕
            </button>
          </div>
        )}

        <div className="rds-messages-list">
          {messages.length === 0 ? (
            <div className="rds-empty-state">
              <p>Aucun message pour le moment</p>
              <p>Commencez la conversation !</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {renderTypingIndicators()}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone de saisie */}
      <div className="rds-input-container">
        <div className="rds-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputMessage);
              }
            }}
            placeholder={isConnected ? "Tapez votre message..." : "Connexion en cours..."}
            disabled={!isConnected}
            className="rds-message-input"
            maxLength={1000}
          />
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={!isConnected || !inputMessage.trim()}
            className="rds-send-button"
          >
            📤
          </button>
        </div>
      </div>

      {/* Contrôles de connexion */}
      <div className="rds-controls">
        <button
          onClick={connect}
          disabled={isConnecting || isConnected}
          className="rds-connect-button"
        >
          {isConnected ? '🔗 Connecté' : isConnecting ? '⏳ Connexion...' : '🔌 Se connecter'}
        </button>
        
        {isConnected && (
          <button
            onClick={() => {
              wsRef.current?.close(1000, 'Déconnexion manuelle');
            }}
            className="rds-disconnect-button"
          >
            🔌 Déconnexion
          </button>
        )}
      </div>
    </div>
  );
};

export default RDSMessagingFix;