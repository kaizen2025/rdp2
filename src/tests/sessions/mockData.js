/**
 * Données de mock pour les tests des sessions RDS
 * Fournit des données réalistes pour tester les différents scénarios
 */

// ===== DONNÉES SESSIONS =====

export const mockActiveSessions = [
  {
    id: 'sess-001',
    sessionId: '1',
    username: 'alice.martin',
    displayName: 'Alice Martin',
    server: 'RDS-SERVER-01',
    isActive: true,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    endTime: null,
    clientAddress: '192.168.1.45',
    protocol: 'RDP'
  },
  {
    id: 'sess-002',
    sessionId: '2',
    username: 'bob.leroy',
    displayName: 'Bob Leroy',
    server: 'RDS-SERVER-01',
    isActive: true,
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
    endTime: null,
    clientAddress: '192.168.1.23',
    protocol: 'RDP'
  },
  {
    id: 'sess-003',
    sessionId: '3',
    username: 'carla.dubois',
    displayName: 'Carla Dubois',
    server: 'RDS-SERVER-02',
    isActive: false,
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    clientAddress: '192.168.1.78',
    protocol: 'RDP'
  },
  {
    id: 'sess-004',
    sessionId: '4',
    username: 'david.petit',
    displayName: 'David Petit',
    server: 'RDS-SERVER-02',
    isActive: true,
    startTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26h ago (long session)
    endTime: null,
    clientAddress: '192.168.1.34',
    protocol: 'RDP'
  },
  {
    id: 'sess-005',
    sessionId: '5',
    username: 'eva.rousseau',
    displayName: 'Eva Rousseau',
    server: 'RDS-SERVER-03',
    isActive: true,
    startTime: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(), // 45h ago (very long session)
    endTime: null,
    clientAddress: '192.168.1.56',
    protocol: 'RDP'
  },
  {
    id: 'sess-006',
    sessionId: '6',
    username: 'frank.moreau',
    displayName: 'Frank Moreau',
    server: 'RDS-SERVER-03',
    isActive: false,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
    clientAddress: '192.168.1.89',
    protocol: 'RDP'
  }
];

export const mockDisconnectedSessions = [
  {
    id: 'sess-007',
    sessionId: '7',
    username: 'grace.bernard',
    displayName: 'Grace Bernard',
    server: 'RDS-SERVER-01',
    isActive: false,
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    clientAddress: '192.168.1.12',
    protocol: 'RDP'
  },
  {
    id: 'sess-008',
    sessionId: '8',
    username: 'henri.garcia',
    displayName: 'Henri Garcia',
    server: 'RDS-SERVER-02',
    isActive: false,
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    clientAddress: '192.168.1.67',
    protocol: 'RDP'
  }
];

// Sessions pour tests de performance (grande quantité)
export const generateMockSessions = (count = 100) => {
  const servers = ['RDS-SERVER-01', 'RDS-SERVER-02', 'RDS-SERVER-03', 'RDS-SERVER-04'];
  const users = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8'];
  const sessions = [];
  
  for (let i = 0; i < count; i++) {
    const isActive = Math.random() > 0.3; // 70% actives
    const startTime = new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000); // Maximum 72h ago
    const endTime = isActive ? null : new Date(startTime.getTime() + Math.random() * 48 * 60 * 60 * 1000);
    
    sessions.push({
      id: `sess-${String(i).padStart(3, '0')}`,
      sessionId: String(i + 1),
      username: `${users[Math.floor(Math.random() * users.length)]}_${i}`,
      displayName: `Utilisateur ${i + 1}`,
      server: servers[Math.floor(Math.random() * servers.length)],
      isActive,
      startTime: startTime.toISOString(),
      endTime: endTime?.toISOString() || null,
      clientAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      protocol: 'RDP'
    });
  }
  
  return sessions;
};

// ===== DONNÉES SERVEURS =====

export const mockServers = [
  {
    id: 'server-001',
    name: 'RDS-SERVER-01',
    status: 'online',
    metrics: {
      cpu: 65,
      memory: 72,
      disk: 45,
      sessions: 25
    }
  },
  {
    id: 'server-002',
    name: 'RDS-SERVER-02',
    status: 'online',
    metrics: {
      cpu: 85, // Serveur surchargé
      memory: 78,
      disk: 52,
      sessions: 42
    }
  },
  {
    id: 'server-003',
    name: 'RDS-SERVER-03',
    status: 'online',
    metrics: {
      cpu: 45,
      memory: 90, // Serveur surchargé en mémoire
      disk: 38,
      sessions: 38
    }
  },
  {
    id: 'server-004',
    name: 'RDS-SERVER-04',
    status: 'maintenance',
    metrics: {
      cpu: 0,
      memory: 0,
      disk: 0,
      sessions: 0
    }
  }
];

// Serveur avec trop de sessions simultanées
export const mockOverloadedServer = {
  id: 'server-005',
  name: 'RDS-SERVER-OVERLOADED',
  status: 'online',
  metrics: {
    cpu: 95,
    memory: 92,
    disk: 65,
    sessions: 55 // Trop de sessions
  }
};

// ===== DONNÉES UTILISATEURS =====

export const mockUsers = {
  'RDS-SERVER-01': [
    {
      username: 'alice.martin',
      displayName: 'Alice Martin',
      department: 'Comptabilité',
      email: 'alice.martin@anecoop.com',
      password: 'password123'
    },
    {
      username: 'bob.leroy',
      displayName: 'Bob Leroy',
      department: 'RH',
      email: 'bob.leroy@anecoop.com',
      password: 'password456'
    }
  ],
  'RDS-SERVER-02': [
    {
      username: 'carla.dubois',
      displayName: 'Carla Dubois',
      department: 'Commercial',
      email: 'carla.dubois@anecoop.com',
      password: 'password789'
    },
    {
      username: 'david.petit',
      displayName: 'David Petit',
      department: 'IT',
      email: 'david.petit@anecoop.com',
      password: null // Pas de mot de passe configuré
    }
  ],
  'RDS-SERVER-03': [
    {
      username: 'eva.rousseau',
      displayName: 'Eva Rousseau',
      department: 'Marketing',
      email: 'eva.rousseau@anecoop.com',
      password: 'password101'
    },
    {
      username: 'frank.moreau',
      displayName: 'Frank Moreau',
      department: 'Logistique',
      email: 'frank.moreau@anecoop.com',
      password: 'password102'
    }
  ]
};

// ===== CONFIGURATION =====

export const mockConfig = {
  rds_servers: [
    'RDS-SERVER-01',
    'RDS-SERVER-02',
    'RDS-SERVER-03',
    'RDS-SERVER-04'
  ],
  alertThresholds: {
    longSessionHours: 24,
    criticalLongSessionHours: 72,
    maxConcurrentSessions: 50,
    serverLoadWarning: 80,
    serverLoadCritical: 95
  }
};

// ===== ALERTES ATTENDUES =====

export const expectedAlerts = {
  longSessions: [
    {
      id: 'long-sess-004',
      type: 'long_session',
      severity: 'warning',
      title: 'Session longue durée',
      message: 'david.petit - Session active depuis 26h'
    },
    {
      id: 'long-sess-005',
      type: 'long_session',
      severity: 'error',
      title: 'Session longue durée',
      message: 'eva.rousseau - Session active depuis 45h'
    }
  ],
  serverOverload: [
    {
      id: 'overload-server-002',
      type: 'server_overload',
      severity: 'error',
      title: 'Serveur surchargé',
      message: 'RDS-SERVER-02 - CPU: 85%, RAM: 78%'
    },
    {
      id: 'overload-server-003',
      type: 'server_overload',
      severity: 'error',
      title: 'Serveur surchargé',
      message: 'RDS-SERVER-03 - CPU: 45%, RAM: 90%'
    }
  ],
  concurrentSessions: [
    {
      id: 'concurrent-RDS-SERVER-OVERLOADED',
      type: 'concurrent_sessions',
      severity: 'warning',
      title: 'Trop de sessions simultanées',
      message: 'RDS-SERVER-OVERLOADED - 55 sessions actives'
    }
  ]
};

// ===== DONNÉES POUR TESTS DE TIMELINE =====

export const mockTimelineData = Array.from({ length: 24 }, (_, i) => {
  const timestamp = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
  return {
    time: timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    timestamp,
    sessions: Math.floor(Math.random() * 30) + 10,
    users: Math.floor(Math.random() * 25) + 8
  };
});

// ===== MOCK RESPONSES API =====

export const mockApiResponses = {
  sessions: {
    success: true,
    data: mockActiveSessions
  },
  users: {
    success: true,
    data: mockUsers
  },
  config: {
    success: true,
    data: mockConfig
  },
  refresh: {
    success: true,
    message: 'Sessions rafraîchies avec succès'
  },
  shadow: {
    success: true,
    message: 'Shadow session launched successfully'
  },
  connect: {
    success: true,
    message: 'RDP connection initiated'
  },
  sendMessage: {
    success: true,
    message: 'Message sent successfully'
  }
};

// ===== DONNÉES SHADOW SESSION =====

export const mockShadowSession = {
  sessionId: 'shadow-001',
  targetSession: {
    username: 'alice.martin',
    server: 'RDS-SERVER-01',
    sessionId: '1',
    isActive: true
  },
  status: 'connecting',
  startTime: new Date().toISOString()
};

// ===== MÉTRIQUES DE PERFORMANCE =====

export const mockPerformanceMetrics = {
  responseTime: {
    average: 150,
    min: 80,
    max: 350,
    p95: 280
  },
  memoryUsage: {
    current: 256,
    peak: 512,
    limit: 1024
  },
  cpuUsage: {
    current: 25,
    average: 35,
    peak: 78
  },
  sessionStats: {
    total: 150,
    active: 120,
    disconnected: 30,
    peakConcurrent: 180
  }
};
