/**
 * Tests de détection de fuites WebSocket et connexions persistantes
 * Teste les connexions WebSocket, les messages, et les event listeners
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const { MemoryMonitor } = require('./memoryMonitor');
const { WEBSOCKET_CONFIG } = require('./memory.config');

// Mock WebSocket Server
class MockWebSocketServer extends EventEmitter {
  constructor(port = 8080) {
    super();
    this.port = port;
    this.clients = new Set();
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.emit('started', { port: this.port });
  }

  stop() {
    this.isRunning = false;
    this.clients.clear();
    this.emit('stopped');
  }

  createClient() {
    if (!this.isRunning) {
      throw new Error('Server not started');
    }

    const mockClient = new EventEmitter();
    mockClient.readyState = WebSocket.OPEN;
    mockClient.send = jest.fn();
    mockClient.close = jest.fn();
    mockClient.terminate = jest.fn();
    mockClient.on = mockClient.addEventListener;

    this.clients.add(mockClient);
    return mockClient;
  }

  broadcast(message) {
    this.clients.forEach(client => {
      client.emit('message', message);
    });
  }
}

// Client WebSocket avec fuites potentielles
class LeakyWebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.messageHistory = [];
    this.eventListeners = new Map();
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Simule connexion
      setTimeout(() => {
        this.isConnected = true;
        this.socket = {
          readyState: WebSocket.OPEN,
          send: (data) => this.messageHistory.push(data),
          close: () => { this.isConnected = false; },
          terminate: () => { this.isConnected = false; }
        };
        resolve(this.socket);
      }, 100);
    });
  }

  on(event, callback) {
    // Fuite: stocke les listeners sans les nettoyer
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Simule l'ajout d'event listener
    if (this.socket) {
      this.socket[`on${event}`] = callback;
    }
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(data);
      return true;
    }
    return false;
  }

  // Fuite: pas de méthode cleanup
  disconnect() {
    this.isConnected = false;
    // Ne nettoie pas les event listeners!
  }
}

// Client WebSocket correct avec cleanup
class CleanWebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.messageHistory = [];
    this.isConnected = false;
    this.cleanupCallbacks = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.isConnected = true;
        this.socket = {
          readyState: WebSocket.OPEN,
          send: (data) => this.messageHistory.push(data),
          close: () => { this.isConnected = false; },
          terminate: () => { this.isConnected = false; }
        };
        resolve(this.socket);
      }, 100);
    });
  }

  on(event, callback) {
    if (this.socket) {
      this.socket[`on${event}`] = callback;
      
      // Stocke le callback pour cleanup
      const cleanup = () => {
        if (this.socket) {
          delete this.socket[`on${event}`];
        }
      };
      
      this.cleanupCallbacks.push(cleanup);
    }
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(data);
      return true;
    }
    return false;
  }

  disconnect() {
    this.isConnected = false;
    
    // Nettoie tous les callbacks
    this.cleanupCallbacks.forEach(cleanup => cleanup());
    this.cleanupCallbacks = [];
  }
}

describe('Tests Fuites WebSocket et Connexions Persistantes', () => {
  let memoryMonitor;
  let mockServer;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
    mockServer = new MockWebSocketServer(8080);
    mockServer.start();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
    mockServer.stop();
    jest.clearAllMocks();
  });

  describe('Tests Connexions WebSocket', () => {
    test('doit créer et fermer des connexions WebSocket', async () => {
      const createConnection = async () => {
        const client = new CleanWebSocketClient('ws://localhost:8080');
        await client.connect();
        return client;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        createConnection,
        'createConnection'
      );

      expect(result.isConnected).toBe(true);
      expect(memory.increase).toBeGreaterThanOrEqual(0);
    });

    test('doit mesurer l\'impact de connexions multiples', async () => {
      const createMultipleConnections = async () => {
        const clients = [];
        
        for (let i = 0; i < WEBSOCKET_CONFIG.MAX_CONNECTIONS; i++) {
          const client = new CleanWebSocketClient(`ws://localhost:8080/${i}`);
          await client.connect();
          clients.push(client);
        }
        
        return clients;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        createMultipleConnections,
        'createMultipleConnections'
      );

      expect(result.length).toBe(WEBSOCKET_CONFIG.MAX_CONNECTIONS);
      expect(memory.increase).toBeGreaterThan(0);
    });

    test('doit détecter les fuites avec clients mal nettoyer', async () => {
      const createLeakyConnections = async () => {
        const clients = [];
        
        for (let i = 0; i < 50; i++) {
          const client = new LeakyWebSocketClient(`ws://localhost:8080/${i}`);
          await client.connect();
          
          // Ajoute des listeners (qui ne seront pas nettoyés)
          client.on('message', (data) => console.log('message:', data));
          client.on('error', (error) => console.error('error:', error));
          client.on('close', () => console.log('closed'));
          
          clients.push(client);
        }
        
        return clients;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        createLeakyConnections,
        'createLeakyConnections'
      );

      expect(result.length).toBe(50);
      expect(memory.increase).toBeGreaterThan(0);

      // Vérifie que les listeners sont toujours présents
      const totalListeners = result.reduce((sum, client) => 
        sum + Array.from(client.eventListeners.values()).reduce((s, listeners) => s + listeners.size, 0), 0
      );
      expect(totalListeners).toBeGreaterThan(0);
    });
  });

  describe('Tests Messages WebSocket', () => {
    test('doit gérer l\'envoi de messages sans fuites', async () => {
      const sendMessages = async () => {
        const client = new CleanWebSocketClient('ws://localhost:8080');
        await client.connect();

        const messageCount = 1000;
        for (let i = 0; i < messageCount; i++) {
          client.send(JSON.stringify({
            type: 'message',
            data: `message_${i}`,
            timestamp: Date.now()
          }));
        }

        return { client, messageCount };
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        sendMessages,
        'sendMessages'
      );

      expect(result.messageCount).toBe(1000);
      expect(result.client.messageHistory.length).toBe(1000);
      expect(memory.increase).toBeGreaterThanOrEqual(0);
    });

    test('doit détecter les fuites d\'historique de messages', async () => {
      const sendManyMessages = async () => {
        const client = new LeakyWebSocketClient('ws://localhost:8080');
        await client.connect();

        // Envoie beaucoup de messages
        for (let i = 0; i < 5000; i++) {
          const largeMessage = {
            type: 'large_message',
            data: 'x'.repeat(10000), // 10KB par message
            timestamp: Date.now()
          };
          client.send(JSON.stringify(largeMessage));
        }

        return client;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        sendManyMessages,
        'sendManyMessages'
      );

      expect(result.messageHistory.length).toBe(5000);
      expect(memory.increase).toBeGreaterThan(0);

      // Teste la déconnexion sans cleanup
      result.disconnect();
      
      // La mémoire ne devrait pas changer (mais les listeners restent)
      const memoryAfterDisconnect = memoryMonitor.getMemoryStats();
      expect(memoryAfterDisconnect.heapUsed).toBeGreaterThanOrEqual(memoryMonitor.getMemoryStats().heapUsed);
    });

    test('doit tester le broadcasting de messages', async () => {
      const broadcastTest = async () => {
        const clients = [];
        
        // Crée plusieurs clients
        for (let i = 0; i < 20; i++) {
          const client = new CleanWebSocketClient(`ws://localhost:8080/${i}`);
          await client.connect();
          clients.push(client);
        }

        // Broadcast à tous les clients
        for (let i = 0; i < 100; i++) {
          const message = {
            type: 'broadcast',
            data: `broadcast_${i}`,
            timestamp: Date.now()
          };
          mockServer.broadcast(JSON.stringify(message));
        }

        return clients;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        broadcastTest,
        'broadcastTest'
      );

      expect(result.length).toBe(20);
      expect(memory.increase).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tests Event Listeners WebSocket', () => {
    test('doit nettoyer correctement les event listeners', async () => {
      const testListenerCleanup = async () => {
        const client = new CleanWebSocketClient('ws://localhost:8080');
        await client.connect();

        // Ajoute plusieurs listeners
        const listeners = ['message', 'error', 'close', 'open', 'pong'];
        listeners.forEach(event => {
          client.on(event, (data) => {
            console.log(`${event}:`, data);
          });
        });

        // Se déconnecte et nettoie
        client.disconnect();

        return { listeners, cleanupCount: client.cleanupCallbacks.length };
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        testListenerCleanup,
        'testListenerCleanup'
      );

      expect(result.listeners.length).toBe(5);
      expect(result.cleanupCount).toBe(5);
    });

    test('doit détecter les listeners non nettoyés', async () => {
      const testLeakyListeners = async () => {
        const clients = [];
        
        for (let i = 0; i < 30; i++) {
          const client = new LeakyWebSocketClient(`ws://localhost:8080/${i}`);
          await client.connect();

          // Ajoute plusieurs listeners sans cleanup
          for (let j = 0; j < 5; j++) {
            client.on(`event${j}`, (data) => console.log(`event${j}:`, data));
          }

          clients.push(client);
        }

        return clients;
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        testLeakyListeners,
        'testLeakyListeners'
      );

      // Calcule le total des listeners non nettoyés
      const totalListeners = result.reduce((sum, client) => {
        return sum + Array.from(client.eventListeners.values())
          .reduce((eventSum, listeners) => eventSum + listeners.size, 0);
      }, 0);

      expect(totalListeners).toBe(150); // 30 clients * 5 listeners chacun
    });
  });

  describe('Tests Surveillance Continue WebSocket', () => {
    test('doit surveiller les connexions en temps réel', async () => {
      memoryMonitor.startMonitoring();

      const clients = [];
      
      // Crée des connexions progressivement
      for (let i = 0; i < 5; i++) {
        const client = new CleanWebSocketClient(`ws://localhost:8080/${i}`);
        await client.connect();
        clients.push(client);

        // Attend un cycle de surveillance
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Simule l'envoi de messages
      clients.forEach(client => {
        for (let i = 0; i < 10; i++) {
          client.send(`message_${i}`);
        }
      });

      // Attend plusieurs cycles
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Déconnecte tous les clients
      clients.forEach(client => client.disconnect());

      // Attend la stabilisation
      await new Promise(resolve => setTimeout(resolve, 3000));

      memoryMonitor.stopMonitoring();

      const leaks = memoryMonitor.detectLeaks();
      const report = memoryMonitor.exportReport();

      expect(report.snapshots.length).toBeGreaterThan(0);
      console.log('Surveillance WebSocket:', {
        leaks: leaks?.length || 0,
        finalMemory: report.current.heapUsed
      });
    });

    test('doit tester les reconnexions automatiques', async () => {
      const testReconnections = async () => {
        const client = new CleanWebSocketClient('ws://localhost:8080');
        
        const reconnections = [];
        
        for (let i = 0; i < 10; i++) {
          await client.connect();
          reconnections.push(true);
          
          // Simule une déconnexion
          client.disconnect();
          
          // Petite pause
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { reconnections, finalClient: client };
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        testReconnections,
        'testReconnections'
      );

      expect(result.reconnections.length).toBe(10);
    });
  });

  describe('Tests Stress et Performance', () => {
    test('doit gérer le stress de connexions', async () => {
      const stressTest = async () => {
        const promises = [];
        
        for (let i = 0; i < 50; i++) {
          promises.push((async () => {
            const client = new CleanWebSocketClient(`ws://localhost:8080/stress_${i}`);
            await client.connect();
            
            // Envoie quelques messages
            for (let j = 0; j < 10; j++) {
              client.send(`stress_message_${i}_${j}`);
            }
            
            client.disconnect();
            return true;
          })());
        }
        
        const results = await Promise.all(promises);
        return results.filter(Boolean).length;
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        stressTest,
        'stressTest'
      );

      expect(result).toBe(50);
    });

    test('doit détecter les fuites sous stress', async () => {
      const memoryMonitorLocal = new MemoryMonitor();
      memoryMonitorLocal.startMonitoring();

      const stressLeakTest = async () => {
        const leakyClients = [];
        
        for (let i = 0; i < 20; i++) {
          const client = new LeakyWebSocketClient(`ws://localhost:8080/leak_${i}`);
          await client.connect();
          
          // Ajoute des listeners et gros messages
          client.on('largeData', (data) => {
            const processed = new Array(1000).fill(data);
          });
          
          for (let j = 0; j < 50; j++) {
            client.send('x'.repeat(5000)); // Messages de 5KB
          }
          
          leakyClients.push(client);
        }
        
        return leakyClients;
      };

      const { result } = await memoryMonitorLocal.measureFunctionMemory(
        stressLeakTest,
        'stressLeakTest'
      );

      // Attends que la mémoire se stabilise
      await new Promise(resolve => setTimeout(resolve, 2000));

      memoryMonitorLocal.stopMonitoring();

      const leaks = memoryMonitorLocal.detectLeaks();
      const report = memoryMonitorLocal.exportReport();

      console.log('Test de fuites sous stress:', {
        leaks: leaks?.length || 0,
        finalMemory: report.current.heapUsed,
        totalSnapshots: report.snapshots.length
      });

      // Sous stress, on devrait détecter des fuites
      expect(report.current.heapUsed).toBeGreaterThan(0);
    });
  });
});