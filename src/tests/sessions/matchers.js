/**
 * Custom matchers Jest pour les tests des sessions RDS
 * Fournit des assertions spécialisées pour le domaine des sessions
 */

expect.extend({
  /**
   * Vérifie si un objet est une session RDS valide
   */
  toBeValidRdsSession(received) {
    const requiredFields = ['id', 'sessionId', 'username', 'server', 'isActive'];
    const hasRequiredFields = requiredFields.every(field => 
      received.hasOwnProperty(field) && received[field] !== undefined && received[field] !== null
    );
    
    const pass = hasRequiredFields && 
                 typeof received.isActive === 'boolean' &&
                 typeof received.username === 'string' &&
                 typeof received.server === 'string';
    
    return {
      message: () => 
        `expected ${this.utils.printReceived(received)} to be a valid RDS session. ` +
        `Required fields: ${requiredFields.join(', ')}`,
      pass
    };
  },

  /**
   * Vérifie si une session est active
   */
  toBeActive(received) {
    const isActive = received.isActive === true && 
                    (!received.endTime || received.endTime === null);
    
    return {
      message: () => 
        `expected session ${this.utils.printReceived(received)} to be active`,
      pass: isActive
    };
  },

  /**
   * Vérifie si une session est inactive/déconnectée
   */
  toBeInactive(received) {
    const isInactive = received.isActive === false || 
                      (received.endTime && received.endTime !== null);
    
    return {
      message: () => 
        `expected session ${this.utils.printReceived(received)} to be inactive`,
      pass: isInactive
    };
  },

  /**
   * Vérifie si une session dure plus longtemps qu'une durée donnée (en heures)
   */
  toHaveDurationLongerThan(received, hours) {
    const now = new Date('2025-01-15T10:30:00.000Z'); // Date fixe pour les tests
    const startTime = new Date(received.startTime);
    const endTime = received.endTime ? new Date(received.endTime) : now;
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    return {
      message: () => 
        `expected session duration (${durationHours.toFixed(2)}h) to be longer than ${hours}h`,
      pass: durationHours > hours
    };
  },

  /**
   * Vérifie si un serveur est surchargé selon les seuils
   */
  toBeOverloaded(received, thresholds = { cpu: 80, memory: 80 }) {
    const metrics = received.metrics || {};
    const cpu = metrics.cpu || 0;
    const memory = metrics.memory || 0;
    
    const isOverloaded = cpu > thresholds.cpu || memory > thresholds.memory;
    
    return {
      message: () => 
        `expected server ${received.name} not to be overloaded (CPU: ${cpu}%, Memory: ${memory}%)`,
      pass: !isOverloaded
    };
  },

  /**
   * Vérifie si un objet contient les bonnes métriques de serveur
   */
  toHaveValidServerMetrics(received) {
    const requiredMetrics = ['cpu', 'memory', 'disk', 'sessions'];
    const hasAllMetrics = requiredMetrics.every(metric => 
      received.hasOwnProperty(metric) && 
      typeof received[metric] === 'number' && 
      received[metric] >= 0
    );
    
    return {
      message: () => 
        `expected ${this.utils.printReceived(received)} to have valid server metrics`,
      pass: hasAllMetrics
    };
  },

  /**
   * Vérifie si une alerte a la bonne structure
   */
  toBeValidAlert(received) {
    const requiredFields = ['id', 'type', 'severity', 'title', 'message'];
    const hasRequiredFields = requiredFields.every(field => 
      received.hasOwnProperty(field) && received[field] !== null && received[field] !== undefined
    );
    
    const validSeverity = ['info', 'warning', 'error'].includes(received.severity);
    const validType = ['long_session', 'server_overload', 'concurrent_sessions'].includes(received.type);
    
    return {
      message: () => 
        `expected ${this.utils.printReceived(received)} to be a valid alert`,
      pass: hasRequiredFields && validSeverity && validType
    };
  },

  /**
   * Vérifie si un nombre est dans une plage donnée (inclusive)
   */
  toBeWithinRange(received, minimum, maximum) {
    const pass = received >= minimum && received <= maximum;
    
    return {
      message: () => 
        `expected ${received} to be within range ${minimum} - ${maximum}`,
      pass
    };
  },

  /**
   * Vérifie si une chaîne contient un nom d'utilisateur valide
   */
  toBeValidUsername(received) {
    // Pattern: lettres, chiffres, points, tirets, underscore, 3-50 caractères
    const usernamePattern = /^[a-zA-Z0-9._-]{3,50}$/;
    const pass = typeof received === 'string' && usernamePattern.test(received);
    
    return {
      message: () => 
        `expected "${received}" to be a valid username`,
      pass
    };
  },

  /**
   * Vérifie si un serveur a un nom valide
   */
  toBeValidServerName(received) {
    // Pattern: lettres, chiffres, tirets, 3-30 caractères
    const serverPattern = /^[A-Z0-9-]{3,30}$/;
    const pass = typeof received === 'string' && serverPattern.test(received);
    
    return {
      message: () => 
        `expected "${received}" to be a valid server name`,
      pass
    };
  },

  /**
   * Vérifie si un objet est une configuration RDS valide
   */
  toBeValidRdsConfig(received) {
    const hasServersArray = Array.isArray(received.rds_servers) && 
                           received.rds_servers.length > 0;
    const hasAlertThresholds = received.alertThresholds && 
                              typeof received.alertThresholds === 'object';
    
    return {
      message: () => 
        `expected ${this.utils.printReceived(received)} to be a valid RDS config`,
      pass: hasServersArray && hasAlertThresholds
    };
  },

  /**
   * Vérifie si un élément est visible dans le DOM
   */
  toBeVisibleInDom(received) {
    const element = received;
    const isVisible = element && (
      element.offsetWidth > 0 || 
      element.offsetHeight > 0 || 
      element.getClientRects().length > 0
    );
    
    return {
      message: () => 
        `expected element to be visible in DOM`,
      pass: isVisible
    };
  },

  /**
   * Vérifie si une date est dans le passé
   */
  toBeInThePast(received) {
    const date = new Date(received);
    const now = new Date('2025-01-15T10:30:00.000Z'); // Date fixe pour les tests
    
    return {
      message: () => 
        `expected ${received} to be in the past`,
      pass: date < now
    };
  },

  /**
   * Vérifie si une date est dans le futur
   */
  toBeInTheFuture(received) {
    const date = new Date(received);
    const now = new Date('2025-01-15T10:30:00.000Z'); // Date fixe pour les tests
    
    return {
      message: () => 
        `expected ${received} to be in the future`,
      pass: date > now
    };
  },

  /**
   * Vérifie si une alerte correspond au type attendu
   */
  toBeOfAlertType(received, expectedType) {
    const pass = received.type === expectedType;
    
    return {
      message: () => 
        `expected alert to be of type "${expectedType}", got "${received.type}"`,
      pass
    };
  },

  /**
   * Vérifie si une session correspond à un serveur donné
   */
  toBelongToServer(received, serverName) {
    const pass = received.server === serverName;
    
    return {
      message: () => 
        `expected session to belong to server "${serverName}", got "${received.server}"`,
      pass
    };
  },

  /**
   * Vérifie si le nombre de sessions actives correspond à l'attente
   */
  toHaveActiveSessionCount(received, sessionsArray, expectedCount) {
    const activeCount = sessionsArray.filter(s => s.isActive).length;
    const pass = activeCount === expectedCount;
    
    return {
      message: () => 
        `expected ${activeCount} active sessions, got ${expectedCount}`,
      pass
    };
  },

  /**
   * Vérifie si une IP est valide (format IPv4)
   */
  toBeValidIpAddress(received) {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const pass = typeof received === 'string' && ipPattern.test(received);
    
    return {
      message: () => 
        `expected "${received}" to be a valid IP address`,
      pass
    };
  },

  /**
   * Vérifie si une timeline a le bon format de données
   */
  toHaveValidTimelineData(received) {
    const isValid = Array.isArray(received) && received.length > 0 && 
                   received.every(point => 
                     point.hasOwnProperty('time') &&
                     point.hasOwnProperty('timestamp') &&
                     point.hasOwnProperty('sessions') &&
                     point.hasOwnProperty('users')
                   );
    
    return {
      message: () => 
        `expected ${this.utils.printReceived(received)} to be valid timeline data`,
      pass: isValid
    };
  },

  /**
   * Vérifie si une permission est valide pour une action
   */
  toHaveValidPermission(received, action) {
    const validActions = ['shadow', 'connect', 'message', 'info', 'refresh'];
    const isValidAction = validActions.includes(action);
    const hasPermission = typeof received === 'object' && received[action] === true;
    
    return {
      message: () => 
        `expected permission for "${action}" to be granted`,
      pass: isValidAction && hasPermission
    };
  },
});

// Export pour utilisation dans les tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}
