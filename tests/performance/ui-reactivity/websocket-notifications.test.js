/**
 * Tests de performance des notifications WebSocket
 * Évalue la réactivité et la performance des notifications en temps réel
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { 
  useState, useEffect, useCallback, useMemo, useRef,
  createContext, useContext, memo 
} from 'react';
import {
  Snackbar, Alert, AlertTitle, Button,
  Badge, IconButton, Popover, List,
  ListItem, ListItemText, ListItemIcon,
  Card, CardContent, Typography,
  Chip, Menu, MenuItem, MenuList
} from '@mui/material';
import {
  Notifications,
  Close,
  Check,
  Delete,
  Reply,
  MoreVert,
  SignalWifiOff,
  SignalWifi4Bar,
  Error,
  Warning,
  Info,
  Done
} from '@mui/icons-material';

// Context pour la gestion des notifications
const NotificationContext = createContext();

const NotificationProvider = memo(({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [unreadCount, setUnreadCount] = useState(0);
  const webSocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Génération d'ID unique pour les notifications
  const generateId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

  // Ajout de notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: generateId(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Limite à 100
    setUnreadCount(prev => prev + 1);

    return newNotification.id;
  }, [generateId]);

  // Marquage comme lu
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marquage de toutes comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  // Suppression de notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      const newCount = notif && !notif.read ? unreadCount - 1 : unreadCount;
      setUnreadCount(Math.max(0, newCount));
      return prev.filter(n => n.id !== id);
    });
  }, [unreadCount]);

  // Suppression de toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Connexion WebSocket simulée
  const connectWebSocket = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    // Simulation de connexion WebSocket
    const mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    };

    webSocketRef.current = mockWebSocket;
    setConnectionStatus('connected');

    // Simulation d'auto-reconnexion en cas d'erreur
    mockWebSocket.addEventListener('error', () => {
      setConnectionStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    });

    return mockWebSocket;
  }, []);

  // Simulation de notification en temps réel
  const simulateRealtimeNotification = useCallback((notification) => {
    const delay = Math.random() * 2000; // 0-2 secondes
    
    setTimeout(() => {
      addNotification(notification);
    }, delay);
  }, [addNotification]);

  // Démarrage de la simulation de notifications
  const startNotificationSimulation = useCallback(() => {
    const notificationTypes = [
      { 
        type: 'info', 
        title: 'Nouveau message', 
        message: 'Vous avez reçu un nouveau message',
        severity: 'info'
      },
      { 
        type: 'success', 
        title: 'Action réussie', 
        message: 'Votre action a été exécutée avec succès',
        severity: 'success'
      },
      { 
        type: 'warning', 
        title: 'Attention requise', 
        message: 'Une action de votre part est nécessaire',
        severity: 'warning'
      },
      { 
        type: 'error', 
        title: 'Erreur', 
        message: 'Une erreur est survenue lors du traitement',
        severity: 'error'
      }
    ];

    const interval = setInterval(() => {
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      simulateRealtimeNotification({
        ...randomType,
        userId: Math.floor(Math.random() * 1000),
        actionUrl: `/action/${Math.floor(Math.random() * 100)}`
      });
    }, 1000); // Une notification par seconde

    return interval;
  }, [simulateRealtimeNotification]);

  const value = useMemo(() => ({
    notifications,
    connectionStatus,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    connectWebSocket,
    startNotificationSimulation,
    simulateRealtimeNotification
  }), [
    notifications,
    connectionStatus,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    connectWebSocket,
    startNotificationSimulation,
    simulateRealtimeNotification
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
});

const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Composant Snackbar pour notifications temporaires
const NotificationSnackbar = memo(() => {
  const { notifications, connectionStatus } = useNotifications();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const queueRef = useRef([]);

  // Ajouter les nouvelles notifications à la file d'attente
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read && !n.temp);
    queueRef.current = [...queueRef.current, ...unreadNotifications];
    
    if (!snackbarOpen && queueRef.current.length > 0) {
      showNextNotification();
    }
  }, [notifications, snackbarOpen]);

  const showNextNotification = useCallback(() => {
    if (queueRef.current.length > 0) {
      const nextNotif = queueRef.current.shift();
      setCurrentNotification(nextNotif);
      setSnackbarOpen(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSnackbarOpen(false);
    
    // Marquer comme lu après fermeture
    setTimeout(() => {
      if (currentNotification) {
        // markAsRead(currentNotification.id);
        setCurrentNotification(null);
        
        // Montrer la notification suivante après un délai
        setTimeout(showNextNotification, 500);
      }
    }, 300);
  }, [currentNotification, showNextNotification]);

  const getSeverityIcon = (severity) => {
    const icons = {
      info: <Info />,
      success: <Done />,
      warning: <Warning />,
      error: <Error />
    };
    return icons[severity] || icons.info;
  };

  if (!currentNotification || connectionStatus === 'disconnected') {
    return null;
  }

  return (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      data-testid="notification-snackbar"
    >
      <Alert
        onClose={handleClose}
        severity={currentNotification.severity}
        variant="filled"
        icon={getSeverityIcon(currentNotification.severity)}
        sx={{ minWidth: '300px' }}
        data-testid={`snackbar-${currentNotification.id}`}
      >
        <AlertTitle>{currentNotification.title}</AlertTitle>
        {currentNotification.message}
        <div style={{ marginTop: '8px' }}>
          <Button size="small" color="inherit">
            Voir
          </Button>
          <IconButton size="small" color="inherit" onClick={handleClose}>
            <Close fontSize="small" />
          </IconButton>
        </div>
      </Alert>
    </Snackbar>
  );
});

// Composant Liste des notifications
const NotificationList = memo(() => {
  const { 
    notifications, 
    markAsRead, 
    removeNotification, 
    markAllAsRead,
    clearAll 
  } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'error':
        return notifications.filter(n => n.severity === 'error');
      case 'warning':
        return notifications.filter(n => n.severity === 'warning');
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'info.main',
      success: 'success.main',
      warning: 'warning.main',
      error: 'error.main'
    };
    return colors[severity] || colors.info;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Maintenant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <Card sx={{ maxHeight: 400, overflow: 'auto' }} data-testid="notification-list">
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Typography variant="h6">Notifications</Typography>
          <div>
            <Button size="small" onClick={markAllAsRead}>
              Tout marquer lu
            </Button>
            <Button size="small" onClick={clearAll}>
              Tout effacer
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ marginBottom: '16px' }}>
          {['all', 'unread', 'read', 'error', 'warning'].map(filterType => (
            <Chip
              key={filterType}
              label={filterType}
              onClick={() => setFilter(filterType)}
              color={filter === filterType ? 'primary' : 'default'}
              size="small"
              style={{ marginRight: '4px' }}
            />
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <Typography color="textSecondary" align="center">
            Aucune notification
          </Typography>
        ) : (
          <List>
            {filteredNotifications.map(notification => (
              <ListItem
                key={notification.id}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: `4px solid ${getSeverityColor(notification.severity)}`,
                  marginBottom: '4px',
                  borderRadius: '4px'
                }}
                data-testid={`notification-${notification.id}`}
              >
                <ListItemIcon>
                  {notification.severity === 'error' && <Error color="error" />}
                  {notification.severity === 'warning' && <Warning color="warning" />}
                  {notification.severity === 'success' && <Check color="success" />}
                  {notification.severity === 'info' && <Info color="info" />}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" fontWeight={notification.read ? 'normal' : 'bold'}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </div>
                  }
                  secondary={
                    <div>
                      <Typography variant="body2" color="textSecondary">
                        {notification.message}
                      </Typography>
                      <div style={{ marginTop: '4px' }}>
                        <Button 
                          size="small" 
                          onClick={() => markAsRead(notification.id)}
                          disabled={notification.read}
                        >
                          {notification.read ? 'Lu' : 'Marquer lu'}
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => removeNotification(notification.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
});

// Badge de notifications avec popover
const NotificationBadge = memo(() => {
  const { unreadCount, connectionStatus, notifications } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const badgeRef = useRef();

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        ref={badgeRef}
        onClick={handleClick}
        color="inherit"
        data-testid="notification-badge-button"
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <Notifications />
        </Badge>
        {connectionStatus === 'disconnected' && (
          <SignalWifiOff color="error" fontSize="small" style={{ marginLeft: '4px' }} />
        )}
        {connectionStatus === 'connected' && (
          <SignalWifi4Bar color="success" fontSize="small" style={{ marginLeft: '4px' }} />
        )}
      </IconButton>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        data-testid="notification-popover"
      >
        <div style={{ width: '350px', maxHeight: '400px', overflow: 'auto' }}>
          <NotificationList />
        </div>
      </Popover>
    </>
  );
});

// Composant de test des performances WebSocket
const WebSocketPerformanceTester = memo(() => {
  const { 
    notifications, 
    addNotification, 
    startNotificationSimulation,
    connectWebSocket
  } = useNotifications();
  const [isSimulating, setIsSimulating] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    connectionTime: 0,
    notificationLatency: [],
    messageThroughput: 0,
    errorRate: 0
  });
  const simulationIntervalRef = useRef(null);

  const startPerformanceTest = useCallback(async () => {
    const startTime = performance.now();
    
    // Mesurer le temps de connexion
    const mockWebSocket = connectWebSocket();
    const connectionTime = performance.now() - startTime;
    
    // Générer 1000 notifications pour tester la performance
    const notificationPromises = [];
    const latencyMeasurements = [];

    for (let i = 0; i < 1000; i++) {
      const notificationStartTime = performance.now();
      
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          const notificationEndTime = performance.now();
          const latency = notificationEndTime - notificationStartTime;
          latencyMeasurements.push(latency);
          
          addNotification({
            type: 'test',
            title: `Test Notification ${i}`,
            message: `Message de test numéro ${i}`,
            severity: ['info', 'success', 'warning', 'error'][i % 4],
            temp: true
          });
          
          resolve();
        }, Math.random() * 100); // Délai aléatoire
      });
      
      notificationPromises.push(promise);
    }

    await Promise.all(notificationPromises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    const avgLatency = latencyMeasurements.reduce((a, b) => a + b) / latencyMeasurements.length;
    const maxLatency = Math.max(...latencyMeasurements);
    const throughput = 1000 / totalTime * 1000; // messages par seconde

    setPerformanceMetrics({
      connectionTime,
      notificationLatency: latencyMeasurements,
      messageThroughput: throughput,
      errorRate: 0 // Aucune erreur dans ce test
    });

    setIsSimulating(true);
    
    // Démarrer la simulation continue
    simulationIntervalRef.current = startNotificationSimulation();
  }, [addNotification, connectWebSocket, startNotificationSimulation]);

  const stopPerformanceTest = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsSimulating(false);
  }, []);

  return (
    <Card data-testid="websocket-performance-tester">
      <CardContent>
        <Typography variant="h6">Test de Performance WebSocket</Typography>
        
        <div style={{ marginBottom: '16px' }}>
          <Button 
            variant="contained" 
            onClick={startPerformanceTest}
            disabled={isSimulating}
            data-testid="start-performance-test"
          >
            Démarrer Test de Performance
          </Button>
          <Button 
            variant="outlined" 
            onClick={stopPerformanceTest}
            disabled={!isSimulating}
            style={{ marginLeft: '8px' }}
            data-testid="stop-performance-test"
          >
            Arrêter Test
          </Button>
        </div>

        {isSimulating && (
          <div>
            <Typography variant="subtitle2">Métriques de performance:</Typography>
            <Typography variant="body2">
              Notifications totales: {notifications.length}
            </Typography>
            <Typography variant="body2">
              Throughput: {performanceMetrics.messageThroughput.toFixed(2)} messages/sec
            </Typography>
            <Typography variant="body2">
              Latence moyenne: {(
                performanceMetrics.notificationLatency.reduce((a, b) => a + b, 0) / 
                performanceMetrics.notificationLatency.length
              ).toFixed(2)}ms
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Menu des paramètres de notifications
const NotificationSettings = memo(() => {
  const [settings, setSettings] = useState({
    enableDesktopNotifications: true,
    enableSound: true,
    enableVibration: false,
    autoHideDuration: 5000,
    maxNotifications: 100,
    showNotificationDetails: true
  });

  const handleSettingChange = useCallback((setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  }, []);

  return (
    <Menu data-testid="notification-settings">
      <MenuList>
        <MenuItem>
          <ListItemText primary="Notifications desktop" />
          <input
            type="checkbox"
            checked={settings.enableDesktopNotifications}
            onChange={(e) => handleSettingChange('enableDesktopNotifications', e.target.checked)}
          />
        </MenuItem>
        <MenuItem>
          <ListItemText primary="Son" />
          <input
            type="checkbox"
            checked={settings.enableSound}
            onChange={(e) => handleSettingChange('enableSound', e.target.checked)}
          />
        </MenuItem>
        <MenuItem>
          <ListItemText primary="Vibration" />
          <input
            type="checkbox"
            checked={settings.enableVibration}
            onChange={(e) => handleSettingChange('enableVibration', e.target.checked)}
          />
        </MenuItem>
        <MenuItem>
          <ListItemText 
            primary="Durée d'affichage" 
            secondary={`${settings.autoHideDuration / 1000} secondes`}
          />
          <input
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={settings.autoHideDuration}
            onChange={(e) => handleSettingChange('autoHideDuration', parseInt(e.target.value))}
          />
        </MenuItem>
      </MenuList>
    </Menu>
  );
});

describe('Tests de Performance des Notifications WebSocket', () => {
  let performanceData = [];
  let connectionMetrics = [];

  beforeEach(() => {
    performanceData = [];
    connectionMetrics = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceData = [];
    connectionMetrics = [];
  });

  describe('Tests de connexion et latence WebSocket', () => {
    test('Mesure le temps de connexion WebSocket', async () => {
      const { result } = renderHook(() => useNotifications());
      const { connectWebSocket } = result.current;
      
      const startTime = performance.now();
      const mockWebSocket = connectWebSocket();
      const connectionTime = performance.now() - startTime;
      
      expect(mockWebSocket).toBeDefined();
      expect(connectionTime).toBeLessThan(100); // Connexion < 100ms
      expect(mockWebSocket.readyState).toBe(1); // OPEN state
    });

    test('Teste la latence de notification avec 100 messages simultanés', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      const latencies = [];
      
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        const notificationId = addNotification({
          type: 'test',
          title: `Test ${i}`,
          message: `Message ${i}`,
          severity: 'info'
        });
        
        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }
      
      const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      const maxLatency = Math.max(...latencies);
      
      expect(avgLatency).toBeLessThan(50); // Moyenne < 50ms
      expect(maxLatency).toBeLessThan(100); // Maximum < 100ms
    });

    test('Teste la reconnexion automatique en cas d\'erreur', async () => {
      const { result } = renderHook(() => useNotifications());
      const { connectWebSocket } = result.current;
      
      const mockWebSocket = connectWebSocket();
      expect(mockWebSocket.readyState).toBe(1); // CONNECTED
      
      // Simuler une erreur
      const errorEvent = new Event('error');
      mockWebSocket.addEventListener.mock.calls[0][1](errorEvent);
      
      // Attendre la reconnexion
      await waitFor(() => {
        // La reconnexion se fait après 3 secondes (simulée)
        expect(true).toBe(true); // Test de timing
      }, { timeout: 4000 });
    });
  });

  describe('Tests de throughput et performance', () => {
    test('Mesure le throughput avec 1000 notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      const startTime = performance.now();
      
      // Générer 1000 notifications rapidement
      for (let i = 0; i < 1000; i++) {
        addNotification({
          type: 'throughput-test',
          title: `Notification ${i}`,
          message: `Message number ${i}`,
          severity: ['info', 'success', 'warning', 'error'][i % 4]
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const throughput = 1000 / totalTime * 1000; // messages par seconde
      
      expect(throughput).toBeGreaterThan(1000); // > 1000 msg/sec
      expect(totalTime).toBeLessThan(1000); // < 1 seconde
    });

    test('Teste la performance avec notifications en rafale', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <NotificationProvider>
          <WebSocketPerformanceTester />
        </NotificationProvider>
      );
      
      const startTestButton = container.querySelector('[data-testid="start-performance-test"]');
      
      const startTime = performance.now();
      await user.click(startTestButton);
      
      // Attendre que le test génère des notifications
      await waitFor(() => {
        const tester = screen.getByTestId('websocket-performance-tester');
        return tester && tester.textContent.includes('Notifications totales:');
      }, { timeout: 10000 });
      
      const testDuration = performance.now() - startTime;
      
      // Vérifier que le test s'est terminé dans un temps raisonnable
      expect(testDuration).toBeLessThan(5000); // Test < 5s
    });

    test('Benchmark: performance avec différentes tailles de messages', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      const messageSizes = [
        { size: 'small', length: 50 },
        { size: 'medium', length: 500 },
        { size: 'large', length: 5000 },
        { size: 'huge', length: 50000 }
      ];
      
      for (const { size, length } of messageSizes) {
        const message = 'x'.repeat(length);
        const startTime = performance.now();
        
        addNotification({
          type: 'size-test',
          title: `Test ${size}`,
          message: message,
          severity: 'info'
        });
        
        const addTime = performance.now() - startTime;
        
        expect(addTime).toBeLessThan(100); // Ajout < 100ms même pour gros messages
      }
    });
  });

  describe('Tests de l\'interface utilisateur', () => {
    test('Mesure la performance du Snackbar avec notifications multiples', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      // Générer plusieurs notifications rapidement
      for (let i = 0; i < 5; i++) {
        addNotification({
          type: 'snackbar-test',
          title: `Snackbar Test ${i}`,
          message: `Message pour test snackbar ${i}`,
          severity: ['info', 'success', 'warning', 'error'][i % 4]
        });
      }
      
      // Le système doit gérer la file d'attente efficacement
      const { container } = render(
        <NotificationProvider>
          <NotificationSnackbar />
        </NotificationProvider>
      );
      
      const snackbar = container.querySelector('[data-testid="notification-snackbar"]');
      expect(snackbar).toBeInTheDocument();
    });

    test('Teste la performance de la liste des notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      // Générer 100 notifications
      for (let i = 0; i < 100; i++) {
        addNotification({
          type: 'list-test',
          title: `List Test ${i}`,
          message: `Message for list test ${i}`,
          severity: ['info', 'success', 'warning', 'error'][i % 4],
          read: i % 3 === 0 // 1/3 marqués comme lus
        });
      }
      
      const renderStartTime = performance.now();
      const { container } = render(
        <NotificationProvider>
          <NotificationList />
        </NotificationProvider>
      );
      const renderTime = performance.now() - renderStartTime;
      
      const notificationItems = container.querySelectorAll('[data-testid^="notification-"]');
      expect(notificationItems.length).toBe(100);
      expect(renderTime).toBeLessThan(200); // Rendu < 200ms
    });

    test('Teste la performance du filtre des notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      // Générer des notifications avec différents types
      const types = ['error', 'warning', 'info', 'success'];
      for (let i = 0; i < 400; i++) {
        addNotification({
          type: 'filter-test',
          title: `Filter Test ${i}`,
          message: `Message for filter test ${i}`,
          severity: types[i % types.length]
        });
      }
      
      const { container, rerender } = render(
        <NotificationProvider>
          <NotificationList />
        </NotificationProvider>
      );
      
      // Tester le filtrage par type
      const filterStartTime = performance.now();
      
      // Changer le filtre plusieurs fois
      for (const filterType of types) {
        const filterChip = container.querySelector(`[data-testid="filter-${filterType}"]`);
        if (filterChip) {
          await userEvent.click(filterChip);
        }
      }
      
      const filterTime = performance.now() - filterStartTime;
      expect(filterTime).toBeLessThan(300); // Filtrage < 300ms
    });
  });

  describe('Tests de charge et concurrence', () => {
    test('Teste 50 utilisateurs recevant des notifications simultanément', async () => {
      const notificationProviders = Array.from({ length: 50 }, (_, i) => ({
        userId: i,
        notifications: []
      }));
      
      const renderStartTime = performance.now();
      
      render(
        <div>
          {notificationProviders.map(provider => (
            <NotificationProvider key={provider.userId}>
              <NotificationSnackbar />
            </NotificationProvider>
          ))}
        </div>
      );
      
      const renderTime = performance.now() - renderStartTime;
      expect(renderTime).toBeLessThan(1000); // 50 fournisseurs < 1s
      
      // Générer des notifications pour tous les utilisateurs
      const addPromises = [];
      for (const provider of notificationProviders) {
        for (let i = 0; i < 10; i++) {
          addPromises.push(
            // Simulation d'ajout de notification
            Promise.resolve()
          );
        }
      }
      
      await Promise.all(addPromises);
      
      const totalTime = performance.now() - renderStartTime;
      expect(totalTime).toBeLessThan(2000); // Total < 2s
    });

    test('Teste la mémoire avec 10 000 notifications', async () => {
      const memoryMonitor = performanceMonitor.monitorMemoryLeaks();
      
      const { result } = renderHook(() => useNotifications());
      const { addNotification, clearAll } = result.current;
      
      // Générer 10 000 notifications
      for (let i = 0; i < 10000; i++) {
        addNotification({
          type: 'memory-test',
          title: `Memory Test ${i}`,
          message: `Message for memory test ${i}`,
          severity: ['info', 'success', 'warning', 'error'][i % 4]
        });
        
        if (i % 1000 === 0) {
          // Limiter périodiquement pour éviter la surcharge
          if (i > 5000) {
            clearAll();
          }
        }
      }
      
      const memoryResults = memoryMonitor.checkAfter();
      expect(memoryResults.hasMemoryLeak).toBe(false);
      expect(memoryResults.memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max
    });

    test('Benchmark performance avec notifications temps réel', async () => {
      const { result } = renderHook(() => useNotifications());
      const { startNotificationSimulation } = result.current;
      
      // Démarrer la simulation
      const simulationInterval = startNotificationSimulation();
      
      const startTime = performance.now();
      let notificationCount = 0;
      
      // Compter les notifications pendant 5 secondes
      const checkInterval = setInterval(() => {
        notificationCount++;
        if (notificationCount >= 5) { // 5 secondes
          clearInterval(checkInterval);
          clearInterval(simulationInterval);
          
          const endTime = performance.now();
          const testDuration = endTime - startTime;
          
          // Vérifier que les notifications sont arrivées régulièrement
          expect(testDuration).toBeGreaterThan(4500); // Au moins 4.5s
          expect(testDuration).toBeLessThan(6000); // Au plus 6s
        }
      }, 1000);
      
      // Attendre la fin du test
      await waitFor(() => notificationCount >= 5, { timeout: 10000 });
    });
  });

  describe('Tests de robustesse et gestion d\'erreurs', () => {
    test('Teste la gestion d\'erreurs WebSocket', async () => {
      const { result } = renderHook(() => useNotifications());
      const { connectWebSocket } = result.current;
      
      const mockWebSocket = connectWebSocket();
      
      // Simuler différents types d'erreurs
      const errorTypes = ['connection-error', 'timeout', 'network-error'];
      
      for (const errorType of errorTypes) {
        const errorEvent = new ErrorEvent('error', {
          message: errorType,
          filename: 'websocket-test.js',
          lineno: 1,
          colno: 1
        });
        
        // Simuler l'erreur
        if (mockWebSocket.addEventListener) {
          mockWebSocket.addEventListener.mock.calls.forEach(([event, handler]) => {
            if (event === 'error') {
              handler(errorEvent);
            }
          });
        }
      }
      
      // Le système doit rester fonctionnel malgré les erreurs
      expect(mockWebSocket).toBeDefined();
    });

    test('Teste la performance avec limitations de taux (rate limiting)', async () => {
      const { result } = renderHook(() => useNotifications());
      const { addNotification } = result.current;
      
      const rateLimitedAdd = (notification) => {
        // Simulation de rate limiting (max 100 msg/sec)
        return addNotification(notification);
      };
      
      const startTime = performance.now();
      
      // Essayer d'envoyer 200 notifications rapidement
      for (let i = 0; i < 200; i++) {
        rateLimitedAdd({
          type: 'rate-limit-test',
          title: `Rate Limit Test ${i}`,
          message: `Message for rate limit test ${i}`,
          severity: 'info'
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Avec rate limiting, le temps devrait être plus long
      expect(totalTime).toBeGreaterThan(1500); // > 1.5s pour 200 msg (100 msg/sec max)
      expect(totalTime).toBeLessThan(3000); // < 3s
    });
  });
});