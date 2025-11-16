import React, { useState, useEffect, useCallback } from 'react';
import RDSMessagingFix from './RDSMessagingFix';
import './RDSMessagingExample.css';

/**
 * RDS Messaging Example - Exemple d'utilisation pratique
 * 
 * Ce composant démontre :
 * - Utilisation de base du RDSMessagingFix
 * - Gestion des messages et événements
 * - Personnalisation de l'interface
 * - Tests de diverses configurations
 */
const RDSMessagingExample = () => {
  // États locaux pour l'exemple
  const [isVisible, setIsVisible] = useState(true);
  const [activeUsers, setActiveUsers] = useState([
    { id: 'user1', name: 'Alice Martin', status: 'online' },
    { id: 'user2', name: 'Bob Durand', status: 'online' },
    { id: 'user3', name: 'Charlie Dubois', status: 'away' }
  ]);
  const [sessionStats, setSessionStats] = useState({
    totalMessages: 0,
    connectionTime: 0,
    reconnectCount: 0
  });
  const [debugMode, setDebugMode] = useState(false);

  // Configuration d'exemple
  const [config, setConfig] = useState({
    rdsEndpoint: 'wss://demo-rds.example.com/ws',
    userId: 'user_demo_' + Math.random().toString(36).substr(2, 9),
    sessionId: 'session_' + Date.now(),
    maxRetries: 3,
    retryDelay: 1000,
    heartbeatInterval: 30000,
    messageHistoryLimit: 100
  });

  // Gestionnaire de messages reçus
  const handleMessageReceived = useCallback((message) => {
    console.log('📨 Message reçu:', message);
    
    setSessionStats(prev => ({
      ...prev,
      totalMessages: prev.totalMessages + 1
    }));

    // Logique métier personnalisée
    if (message.type === 'message') {
      // Traitement spécifique des messages utilisateur
      handleUserMessage(message);
    } else if (message.type === 'system') {
      // Traitement des messages système
      handleSystemMessage(message);
    }
  }, []);

  // Traitement des messages utilisateur
  const handleUserMessage = (message) => {
    // Simulation de détection de mentions
    if (message.content.includes('@' + config.userId)) {
      console.log('💬 Mention détectée dans le message');
      // Action : notification, highlight, etc.
    }

    // Simulation de détection de liens
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.content.match(urlRegex);
    if (urls) {
      console.log('🔗 Liens détectés:', urls);
      // Action : prévisualisation, validation, etc.
    }
  };

  // Traitement des messages système
  const handleSystemMessage = (message) => {
    const content = message.content.toLowerCase();
    
    if (content.includes('rejoint')) {
      // Nouvel utilisateur
      console.log('👋 Nouvel utilisateur rejoint');
      // Action : mise à jour de la liste des utilisateurs
    } else if (content.includes('quitte')) {
      // Utilisateur quitte
      console.log('👋 Un utilisateur quitte');
    } else if (content.includes('erreur')) {
      // Erreur système
      console.log('⚠️ Erreur système détectée');
      // Action : notification d'erreur
    }
  };

  // Gestionnaire d'erreurs
  const handleError = useCallback((error, details) => {
    console.error('❌ Erreur RDS:', error);
    
    setSessionStats(prev => ({
      ...prev,
      reconnectCount: prev.reconnectCount + 1
    }));

    // Logique de gestion d'erreur personnalisée
    if (error.message.includes('connexion')) {
      // Action : tentative de reconnexion manuelle, notification utilisateur
    } else if (error.message.includes('timeout')) {
      // Action : ajustement des timeouts, fallback
    }

    // En production, vous pourriez envoyer à un service de monitoring
    // sendErrorToMonitoring(error, details);
  }, []);

  // Simulation de messages automatiques pour la démo
  const simulateMessages = useCallback(() => {
    if (debugMode) {
      console.log('🎭 Mode démo activé - Simulation de messages');
      
      // Simuler des messages périodiques
      const messageInterval = setInterval(() => {
        const randomUsers = activeUsers.filter(u => u.id !== config.userId);
        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        
        if (randomUser) {
          const demoMessages = [
            'Bonjour à tous !',
            'Comment allez-vous aujourd\'hui ?',
            'Quelqu\'un a-t-il vu le rapport ?',
            'Réunion à 15h, n\'oubliez pas !',
            'Excellent travail sur le projet 🎉',
            'Besoin d\'aide sur la tâche X',
            'Bientôt les vacances ! ☀️',
            `Message avec mention @${config.userId}`
          ];
          
          const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
          
          // Simuler la réception d'un message
          const simulatedMessage = {
            id: 'demo_' + Date.now(),
            type: 'message',
            content: randomMessage,
            timestamp: Date.now(),
            userId: randomUser.id,
            sessionId: config.sessionId,
            username: randomUser.name,
            status: 'received'
          };
          
          // Note: Dans une vraie application, ceci viendrait du WebSocket
          console.log('🎭 Message simulé reçu:', simulatedMessage);
        }
      }, 8000); // Toutes les 8 secondes

      return () => clearInterval(messageInterval);
    }
  }, [debugMode, activeUsers, config.userId, config.sessionId]);

  // Effet pour la simulation
  useEffect(() => {
    const cleanup = simulateMessages();
    return cleanup;
  }, [simulateMessages]);

  // Fonction pour envoyer un message de test
  const sendTestMessage = () => {
    const testMessages = [
      'Message de test automatique 🤖',
      'Test de connexion WebSocket 🔌',
      'Vérification du système RDS ✅',
      'Message avec émojis 😀😃😄',
      `Test mention @${config.userId}`,
      'Message très long pour tester l\'affichage correct du texte qui devrait se couper automatiquement si nécessaire et continuer sur plusieurs lignes sans poser de problème d\'affichage'
    ];
    
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    
    // Simulation d'envoi via l'API
    console.log('📤 Envoi message test:', randomMessage);
    
    // Dans une vraie app, ceci déclencherait l'envoi via le composant
  };

  // Fonction pour générer un rapport
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: config.sessionId,
      userId: config.userId,
      stats: sessionStats,
      config: config,
      status: 'generated'
    };
    
    console.log('📊 Rapport de session:', report);
    
    // En production, vous pourriez envoyer à une API
    // fetch('/api/session-report', { method: 'POST', body: JSON.stringify(report) });
  };

  // Fonction pour changer de session
  const switchSession = () => {
    setConfig(prev => ({
      ...prev,
      sessionId: 'session_' + Date.now()
    }));
    
    console.log('🔄 Changement de session:', config.sessionId);
  };

  if (!isVisible) {
    return (
      <div className="rds-example-minimized">
        <button 
          onClick={() => setIsVisible(true)}
          className="rds-restore-button"
        >
          📱 Ouvrir RDS Chat
        </button>
      </div>
    );
  }

  return (
    <div className="rds-example-container">
      {/* En-tête avec contrôles */}
      <div className="rds-example-header">
        <h2>🎯 Exemple d'utilisation RDS Messaging</h2>
        <div className="rds-example-controls">
          <button 
            onClick={() => setDebugMode(!debugMode)}
            className={`rds-debug-button ${debugMode ? 'active' : ''}`}
          >
            🔧 Debug {debugMode ? 'ON' : 'OFF'}
          </button>
          <button onClick={sendTestMessage} className="rds-test-button">
            📨 Message Test
          </button>
          <button onClick={generateReport} className="rds-report-button">
            📊 Rapport
          </button>
          <button onClick={switchSession} className="rds-switch-button">
            🔄 Nouvelle Session
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="rds-minimize-button"
          >
            ➖ Minimize
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="rds-stats-panel">
        <div className="rds-stat-item">
          <span className="rds-stat-label">Messages:</span>
          <span className="rds-stat-value">{sessionStats.totalMessages}</span>
        </div>
        <div className="rds-stat-item">
          <span className="rds-stat-label">Reconnexions:</span>
          <span className="rds-stat-value">{sessionStats.reconnectCount}</span>
        </div>
        <div className="rds-stat-item">
          <span className="rds-stat-label">Utilisateurs actifs:</span>
          <span className="rds-stat-value">{activeUsers.length}</span>
        </div>
        <div className="rds-stat-item">
          <span className="rds-stat-label">Session ID:</span>
          <span className="rds-stat-value small">{config.sessionId}</span>
        </div>
      </div>

      {/* Liste des utilisateurs connectés */}
      <div className="rds-users-panel">
        <h3>👥 Utilisateurs en ligne</h3>
        <div className="rds-users-list">
          {activeUsers.map(user => (
            <div key={user.id} className="rds-user-item">
              <div className={`rds-user-status ${user.status}`}></div>
              <span className="rds-user-name">{user.name}</span>
              {user.id === config.userId && (
                <span className="rds-user-you">(Vous)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="rds-config-panel">
        <h3>⚙️ Configuration</h3>
        <div className="rds-config-grid">
          <div className="rds-config-item">
            <label>Endpoint WebSocket:</label>
            <input 
              type="text" 
              value={config.rdsEndpoint}
              onChange={(e) => setConfig(prev => ({ ...prev, rdsEndpoint: e.target.value }))}
              className="rds-config-input"
            />
          </div>
          <div className="rds-config-item">
            <label>Max Retries:</label>
            <input 
              type="number" 
              value={config.maxRetries}
              onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
              className="rds-config-input"
              min="1"
              max="10"
            />
          </div>
          <div className="rds-config-item">
            <label>Retry Delay (ms):</label>
            <input 
              type="number" 
              value={config.retryDelay}
              onChange={(e) => setConfig(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
              className="rds-config-input"
              min="500"
              max="10000"
            />
          </div>
          <div className="rds-config-item">
            <label>Message History Limit:</label>
            <input 
              type="number" 
              value={config.messageHistoryLimit}
              onChange={(e) => setConfig(prev => ({ ...prev, messageHistoryLimit: parseInt(e.target.value) }))}
              className="rds-config-input"
              min="10"
              max="1000"
            />
          </div>
        </div>
      </div>

      {/* Composant RDS Messaging principal */}
      <div className="rds-messaging-wrapper">
        <RDSMessagingFix
          rdsEndpoint={config.rdsEndpoint}
          userId={config.userId}
          sessionId={config.sessionId}
          maxRetries={config.maxRetries}
          retryDelay={config.retryDelay}
          heartbeatInterval={config.heartbeatInterval}
          messageHistoryLimit={config.messageHistoryLimit}
          onMessageReceived={handleMessageReceived}
          onError={handleError}
          autoConnect={true}
        />
      </div>

      {/* Logs de démo */}
      {debugMode && (
        <div className="rds-debug-panel">
          <h3>🐛 Console de Debug</h3>
          <div className="rds-debug-logs">
            <div className="rds-debug-log">✅ Composant initialisé</div>
            <div className="rds-debug-log">🔗 Configuration WebSocket: {config.rdsEndpoint}</div>
            <div className="rds-debug-log">👤 User ID: {config.userId}</div>
            <div className="rds-debug-log">🆔 Session ID: {config.sessionId}</div>
            <div className="rds-debug-log">🔄 Retry config: {config.maxRetries} attempts, {config.retryDelay}ms delay</div>
            <div className="rds-debug-log">💬 Message history: {config.messageHistoryLimit} messages</div>
            <div className="rds-debug-log">👥 Active users: {activeUsers.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RDSMessagingExample;