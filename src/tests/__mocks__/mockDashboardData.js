/**
 * Mocks de données pour les tests du Dashboard
 * Fournit des données réalistes et cohérentes pour tous les tests
 */

// Mock des statistiques du dashboard
export const mockDashboardStats = {
  computers: {
    total: 50,
    available: 35,
    inUse: 12,
    maintenance: 3,
  },
  loans: {
    active: 15,
    reserved: 5,
    overdue: 3,
    critical: 1,
  },
  history: {
    totalLoans: 245,
    thisMonth: 67,
    completed: 220,
  },
  servers: {
    online: 3,
    offline: 1,
    total: 4,
  }
};

// Mock des données d'activité pour la heatmap
export const mockHeatmapData = [
  { timestamp: '2024-11-01T08:00:00Z', sessions: 45, users: 32, loans: 5 },
  { timestamp: '2024-11-01T09:00:00Z', sessions: 67, users: 45, loans: 8 },
  { timestamp: '2024-11-01T10:00:00Z', sessions: 78, users: 52, loans: 12 },
  { timestamp: '2024-11-01T11:00:00Z', sessions: 85, users: 58, loans: 15 },
  { timestamp: '2024-11-01T12:00:00Z', sessions: 42, users: 28, loans: 3 },
  { timestamp: '2024-11-01T13:00:00Z', sessions: 35, users: 25, loans: 2 },
  { timestamp: '2024-11-01T14:00:00Z', sessions: 88, users: 61, loans: 18 },
  { timestamp: '2024-11-01T15:00:00Z', sessions: 92, users: 65, loans: 20 },
  { timestamp: '2024-11-01T16:00:00Z', sessions: 79, users: 54, loans: 14 },
  { timestamp: '2024-11-01T17:00:00Z', sessions: 65, users: 43, loans: 9 },
  { timestamp: '2024-11-02T08:00:00Z', sessions: 52, users: 38, loans: 7 },
  { timestamp: '2024-11-02T09:00:00Z', sessions: 71, users: 49, loans: 11 },
  { timestamp: '2024-11-02T10:00:00Z', sessions: 83, users: 56, loans: 16 },
  { timestamp: '2024-11-02T11:00:00Z', sessions: 87, users: 59, loans: 17 },
  { timestamp: '2024-11-02T12:00:00Z', sessions: 48, users: 32, loans: 4 },
  { timestamp: '2024-11-02T13:00:00Z', sessions: 38, users: 27, loans: 2 },
  { timestamp: '2024-11-02T14:00:00Z', sessions: 90, users: 63, loans: 19 },
  { timestamp: '2024-11-02T15:00:00Z', sessions: 95, users: 67, loans: 22 },
  { timestamp: '2024-11-02T16:00:00Z', sessions: 81, users: 55, loans: 15 },
  { timestamp: '2024-11-02T17:00:00Z', sessions: 68, users: 46, loans: 10 }
];

// Mock des utilisateurs top
export const mockTopUsersData = [
  { user: 'Marie Garcia', sessions: 156, duration: 1240, loans: 23, trend: 'up', percentage: 15 },
  { user: 'Jean Dupont', sessions: 142, duration: 1130, loans: 19, trend: 'up', percentage: 8 },
  { user: 'Sophie Martin', sessions: 138, duration: 1090, loans: 21, trend: 'down', percentage: -5 },
  { user: 'Pierre Bernard', sessions: 125, duration: 980, loans: 17, trend: 'up', percentage: 12 },
  { user: 'Emma Petit', sessions: 118, duration: 950, loans: 15, trend: 'stable', percentage: 0 },
  { user: 'Lucas Dubois', sessions: 105, duration: 840, loans: 13, trend: 'down', percentage: -3 },
  { user: 'Camille Moreau', sessions: 98, duration: 780, loans: 12, trend: 'up', percentage: 7 },
  { user: 'Thomas Laurent', sessions: 87, duration: 690, loans: 10, trend: 'up', percentage: 4 },
  { user: 'Julie Simon', sessions: 76, duration: 610, loans: 8, trend: 'down', percentage: -8 },
  { user: 'Alexandre Michel', sessions: 65, duration: 520, loans: 6, trend: 'up', percentage: 2 }
];

// Mock des prêts actifs
export const mockActiveLoans = [
  {
    id: 1,
    computerName: 'LAPTOP-001',
    userDisplayName: 'Marie Garcia',
    startDate: '2024-10-28T08:00:00Z',
    expectedReturnDate: '2024-11-05T17:00:00Z',
    status: 'active',
    urgency: 'normal'
  },
  {
    id: 2,
    computerName: 'LAPTOP-002',
    userDisplayName: 'Jean Dupont',
    startDate: '2024-10-30T09:30:00Z',
    expectedReturnDate: '2024-11-06T17:00:00Z',
    status: 'active',
    urgency: 'normal'
  },
  {
    id: 3,
    computerName: 'LAPTOP-003',
    userDisplayName: 'Sophie Martin',
    startDate: '2024-11-01T08:15:00Z',
    expectedReturnDate: '2024-11-08T17:00:00Z',
    status: 'active',
    urgency: 'high'
  }
];

// Mock des prêts en retard
export const mockOverdueLoans = [
  {
    id: 4,
    computerName: 'LAPTOP-004',
    userDisplayName: 'Pierre Bernard',
    startDate: '2024-10-25T08:00:00Z',
    expectedReturnDate: '2024-11-01T17:00:00Z',
    status: 'overdue',
    urgency: 'critical',
    daysOverdue: 3
  },
  {
    id: 5,
    computerName: 'LAPTOP-005',
    userDisplayName: 'Emma Petit',
    startDate: '2024-10-22T10:00:00Z',
    expectedReturnDate: '2024-10-30T17:00:00Z',
    status: 'critical',
    urgency: 'critical',
    daysOverdue: 5
  }
];

// Mock des techniciens connectés
export const mockConnectedTechnicians = [
  {
    id: 1,
    name: 'Alexandre Tech',
    avatar: 'AT',
    loginTime: '2024-11-04T07:30:00Z',
    status: 'connected'
  },
  {
    id: 2,
    name: 'Julie Support',
    avatar: 'JS',
    loginTime: '2024-11-04T08:15:00Z',
    status: 'connected'
  },
  {
    id: 3,
    name: 'Thomas Maintenance',
    avatar: 'TM',
    loginTime: '2024-11-04T06:45:00Z',
    status: 'connected'
  }
];

// Mock des serveurs RDS
export const mockRdsServers = ['srv-rds-01.anecoop.local', 'srv-rds-02.anecoop.local', 'srv-rds-03.anecoop.local', 'srv-rds-backup.anecoop.local'];

export const mockServerStatuses = {
  'srv-rds-01.anecoop.local': {
    online: true,
    responseTime: 12,
    message: 'Serveur en ligne'
  },
  'srv-rds-02.anecoop.local': {
    online: true,
    responseTime: 8,
    message: 'Serveur en ligne'
  },
  'srv-rds-03.anecoop.local': {
    online: true,
    responseTime: 15,
    message: 'Serveur en ligne'
  },
  'srv-rds-backup.anecoop.local': {
    online: false,
    responseTime: null,
    message: 'Timeout de connexion'
  }
};

// Mock des filtres de date
export const mockDateFilters = {
  today: {
    start: new Date('2024-11-04T00:00:00'),
    end: new Date('2024-11-04T23:59:59'),
    label: "Aujourd'hui"
  },
  week: {
    start: new Date('2024-10-28T00:00:00'),
    end: new Date('2024-11-03T23:59:59'),
    label: 'Cette semaine'
  },
  month: {
    start: new Date('2024-11-01T00:00:00'),
    end: new Date('2024-11-30T23:59:59'),
    label: 'Ce mois'
  }
};

// Mock du cache
export const mockCache = {
  loans: [...mockActiveLoans, ...mockOverdueLoans],
  computers: Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
    status: i < 35 ? 'available' : i < 47 ? 'inUse' : 'maintenance'
  })),
  loan_history: [
    { id: 1, eventType: 'created', computerName: 'LAPTOP-001', by: 'Marie Garcia', timestamp: '2024-10-28T08:00:00Z' },
    { id: 2, eventType: 'returned', computerName: 'LAPTOP-006', by: 'System', timestamp: '2024-11-03T16:30:00Z' },
    { id: 3, eventType: 'extended', computerName: 'LAPTOP-002', by: 'Jean Dupont', timestamp: '2024-11-02T10:15:00Z' },
    { id: 4, eventType: 'created', computerName: 'LAPTOP-003', by: 'Sophie Martin', timestamp: '2024-11-01T08:15:00Z' },
    { id: 5, eventType: 'cancelled', computerName: 'LAPTOP-007', by: 'Admin', timestamp: '2024-11-01T14:20:00Z' }
  ],
  technicians: mockConnectedTechnicians,
  config: {
    rds_servers: mockRdsServers
  }
};

// Mock des layouts de widgets
export const mockWidgetLayouts = {
  lg: [
    { i: 'heatmap', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'top-users', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'active-loans', x: 0, y: 4, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'server-status', x: 6, y: 4, w: 6, h: 3, minW: 4, minH: 2 }
  ]
};

// Mock des widgets complets
export const mockWidgets = [
  {
    id: 'heatmap',
    title: 'Carte Thermique d\'Activité',
    x: 0, y: 0, w: 6, h: 4,
    content: null // Sera rempli par le composant réel
  },
  {
    id: 'top-users',
    title: 'Top 10 Utilisateurs',
    x: 6, y: 0, w: 6, h: 4,
    content: null
  },
  {
    id: 'active-loans',
    title: 'Prêts Actifs',
    x: 0, y: 4, w: 6, h: 3,
    content: null
  },
  {
    id: 'server-status',
    title: 'Statut Serveurs RDS',
    x: 6, y: 4, w: 6, h: 3,
    content: null
  }
];

// Fonction utilitaire pour générer des données volumineuses pour les tests de performance
export const generateLargeMockData = (size = 1000) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(2024, 10, Math.floor(i / 40) + 1, i % 24).toISOString(),
    sessions: Math.floor(Math.random() * 100) + 1,
    users: Math.floor(Math.random() * 80) + 1,
    loans: Math.floor(Math.random() * 25) + 1,
    user: `User${i + 1}`
  }));
};

// Export par défaut avec toutes les données
export default {
  mockDashboardStats,
  mockHeatmapData,
  mockTopUsersData,
  mockActiveLoans,
  mockOverdueLoans,
  mockConnectedTechnicians,
  mockRdsServers,
  mockServerStatuses,
  mockDateFilters,
  mockCache,
  mockWidgetLayouts,
  mockWidgets,
  generateLargeMockData
};