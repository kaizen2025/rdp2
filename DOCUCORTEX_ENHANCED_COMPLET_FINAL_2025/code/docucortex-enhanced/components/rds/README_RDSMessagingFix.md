# RDSMessagingFix - Documentation d'utilisation

## Vue d'ensemble

`RDSMessagingFix` est un composant React complet pour un système de messagerie RDS temps réel, corrigé et optimisé. Il offre une interface de chat moderne avec gestion WebSocket robuste, retry automatique, et indicateurs de statut avancés.

## Fonctionnalités principales

✅ **Gestion WebSocket robuste**
- Connexion automatique avec retry
- Reconnexion automatique en cas de déconnexion
- Heartbeat pour maintenir la connexion
- Exponential backoff pour les retries

✅ **Interface chat temps réel**
- Messages en temps réel avec animations fluides
- Indicateurs de frappe
- Statuts de livraison des messages
- Scroll automatique

✅ **Retry automatique**
- Retry des messages échoués après reconnexion
- Exponential backoff configurable
- Gestion intelligente des échecs temporaires

✅ **Indicateurs de statut**
- Statut de connexion en temps réel
- Compteur de tentatives de reconnexion
- Messages en attente
- Feedback visuel immédiat

✅ **Interface utilisateur intuitive**
- Design moderne et responsive
- Animations fluides
- Mode sombre automatique
- Accessibilité optimisée

✅ **Performance optimisée**
- Debouncing pour les inputs
- Limitation de l'historique des messages
- Virtual scrolling supporté
- Optimisation du re-rendu

✅ **Gestion d'erreurs complète**
- Try/catch appropriés
- Logging structuré
- Messages d'erreur user-friendly
- Fallbacks en cas d'échec

## Installation

```bash
# Dépendances requises
npm install lodash

# Optionnel: TypeScript pour une meilleure intégration
npm install --save-dev @types/react @types/react-dom
```

## Utilisation de base

```jsx
import React from 'react';
import RDSMessagingFix from './components/rds/RDSMessagingFix';

const App = () => {
  return (
    <div className="App">
      <RDSMessagingFix
        rdsEndpoint="wss://votre-serveur-rds.com/ws"
        userId="user123"
        sessionId="session456"
        onMessageReceived={(message) => {
          console.log('Message reçu:', message);
        }}
        onError={(error, details) => {
          console.error('Erreur RDS:', error, details);
        }}
      />
    </div>
  );
};

export default App;
```

## Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `rdsEndpoint` | string | `wss://rds-server.example.com/ws` | URL WebSocket du serveur RDS |
| `userId` | string | requis | ID unique de l'utilisateur |
| `sessionId` | string | requis | ID de la session RDS |
| `maxRetries` | number | `3` | Nombre maximum de tentatives de reconnexion |
| `retryDelay` | number | `1000` | Délai initial entre les retries (ms) |
| `heartbeatInterval` | number | `30000` | Intervalle du heartbeat (ms) |
| `messageHistoryLimit` | number | `100` | Limite d'historique des messages |
| `onMessageReceived` | function | `undefined` | Callback lors de la réception d'un message |
| `onError` | function | `undefined` | Callback lors d'une erreur |
| `autoConnect` | boolean | `true` | Connexion automatique au démarrage |

## Configuration avancée

### Personnalisation des timeouts

```jsx
<RDSMessagingFix
  maxRetries={5}
  retryDelay={2000}
  heartbeatInterval={15000}
  messageHistoryLimit={200}
/>
```

### Gestion personnalisée des messages

```jsx
const handleMessageReceived = (message) => {
  switch (message.type) {
    case 'message':
      // Traitement des messages utilisateur
      break;
    case 'system':
      // Traitement des messages système
      break;
    default:
      console.log('Message de type inconnu:', message.type);
  }
};

<RDSMessagingFix
  onMessageReceived={handleMessageReceived}
/>
```

### Gestion personnalisée des erreurs

```jsx
const handleError = (error, details) => {
  // Log vers un service externe
  console.error('Erreur RDS:', error, details);
  
  // Notification utilisateur
  alert(`Erreur de connexion: ${error.message}`);
  
  // Métriques
  if (window.gtag) {
    window.gtag('event', 'rds_error', {
      error_message: error.message,
      error_details: details
    });
  }
};

<RDSMessagingFix
  onError={handleError}
/>
```

## Structure des messages

### Message utilisateur
```json
{
  "id": "rds_1640995200000_abc123def",
  "type": "message",
  "content": "Bonjour, comment ça va ?",
  "timestamp": 1640995200000,
  "userId": "user123",
  "sessionId": "session456",
  "status": "sent"
}
```

### Message système
```json
{
  "id": "rds_1640995200000_system",
  "type": "system",
  "content": "Utilisateur john_doe a rejoint la session",
  "timestamp": 1640995200000,
  "status": "received"
}
```

### Indication de frappe
```json
{
  "type": "typing",
  "userId": "user123",
  "sessionId": "session456",
  "isTyping": true,
  "timestamp": 1640995200000
}
```

## États de connexion

| État | Couleur | Icône | Description |
|------|---------|-------|-------------|
| `connected` | Vert | 🟢 | Connecté et opérationnel |
| `connecting` | Orange | 🟡 | En cours de connexion |
| `disconnected` | Rouge | 🔴 | Déconnecté |
| `failed` | Rouge foncé | ❌ | Échec de connexion |

## Types de statut des messages

| Statut | Description |
|--------|-------------|
| `sending` | Message en cours d'envoi |
| `sent` | Message envoyé avec succès |
| `received` | Message reçu par le destinataire |
| `failed` | Échec d'envoi du message |

## Gestion des événements personnalisés

### Écoute des événements de connexion

```jsx
const [isConnected, setIsConnected] = useState(false);

// Utiliser useEffect pour surveiller l'état
useEffect(() => {
  const handleConnectionChange = () => {
    // Logique personnalisée basée sur l'état de connexion
    if (isConnected) {
      console.log('🔗 RDS connecté');
      // Actions à effectuer lors de la connexion
    } else {
      console.log('🔌 RDS déconnecté');
      // Actions à effectuer lors de la déconnexion
    }
  };

  handleConnectionChange();
}, [isConnected]);
```

### Envoi d'événements personnalisés

```jsx
// Le composant peut être étendu pour supporter des types d'événements personnalisés
const customEvent = {
  type: 'custom_event',
  data: { action: 'file_uploaded', fileId: 'file123' },
  timestamp: Date.now()
};

// Envoyer via WebSocket (nécessite modification du composant)
```

## Optimisations de performance

### Limitation de l'historique
Le composant limite automatiquement l'historique des messages pour optimiser les performances :

```jsx
// Par défaut: 100 messages
<RDSMessagingFix messageHistoryLimit={50} />
```

### Virtual scrolling (recommandé pour gros volumes)
Pour des sessions avec beaucoup de messages, utiliser une bibliothèque comme `react-window` :

```jsx
import { FixedSizeList as List } from 'react-window';

// Wrapper personnalisé autour du composant
const VirtualizedMessaging = (props) => {
  const itemCount = props.messages.length;
  const itemSize = 60; // Hauteur approximative d'un message

  const Row = ({ index, style }) => (
    <div style={style}>
      {/* Rendu du message à l'index */}
    </div>
  );

  return (
    <div className="rds-messages-container">
      <List
        height={400}
        itemCount={itemCount}
        itemSize={itemSize}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};
```

## Tests unitaires

### Test de base

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RDSMessagingFix from './RDSMessagingFix';

describe('RDSMessagingFix', () => {
  test('affiche le titre du chat', () => {
    render(
      <RDSMessagingFix
        userId="user123"
        sessionId="session456"
        autoConnect={false}
      />
    );

    expect(screen.getByText(/Chat RDS/)).toBeInTheDocument();
  });

  test('envoy un message lors de la frappe sur Entrée', async () => {
    // Mock WebSocket
    const mockWebSocket = {
      readyState: 1, // OPEN
      send: jest.fn(),
      close: jest.fn()
    };
    global.WebSocket = jest.fn(() => mockWebSocket);

    const { getByPlaceholderText } = render(
      <RDSMessagingFix
        userId="user123"
        sessionId="session456"
        autoConnect={false}
      />
    );

    const input = getByPlaceholderText('Tapez votre message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13 });

    await waitFor(() => {
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });
  });
});
```

### Test des erreurs

```jsx
test('gère les erreurs de connexion', async () => {
  const mockWebSocket = {
    readyState: 1,
    send: jest.fn(),
    close: jest.fn(),
    onerror: null,
    onclose: null
  };

  global.WebSocket = jest.fn(() => mockWebSocket);

  const onError = jest.fn();
  
  render(
    <RDSMessagingFix
      userId="user123"
      sessionId="session456"
      onError={onError}
      autoConnect={false}
    />
  );

  // Simuler une erreur
  mockWebSocket.onerror(new Error('Connection failed'));

  await waitFor(() => {
    expect(onError).toHaveBeenCalled();
  });
});
```

## Intégration avec TypeScript

### Types définis

```typescript
interface RDSMessage {
  id: string;
  type: 'message' | 'system' | 'typing';
  content: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  status?: 'sending' | 'sent' | 'received' | 'failed';
  username?: string;
  isTyping?: boolean;
}

interface RDSConnectionStatus {
  connected: string;
  connecting: string;
  disconnected: string;
  failed: string;
}

interface RDSConfig {
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
  messageHistoryLimit: number;
  exponentialBackoff: boolean;
  reconnectEnabled: boolean;
  typingDebounce: number;
  messageBatchSize: number;
}

interface RDSMessagingProps {
  rdsEndpoint?: string;
  userId: string;
  sessionId: string;
  maxRetries?: number;
  retryDelay?: number;
  heartbeatInterval?: number;
  messageHistoryLimit?: number;
  onMessageReceived?: (message: RDSMessage) => void;
  onError?: (error: Error, details: any) => void;
  autoConnect?: boolean;
}
```

### Utilisation typée

```tsx
import React, { useState } from 'react';
import RDSMessagingFix, { 
  RDSMessage, 
  RDSMessagingProps 
} from './RDSMessagingFix';

const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<RDSMessage[]>([]);

  const handleMessageReceived = (message: RDSMessage) => {
    setMessages(prev => [...prev, message]);
    console.log('Nouveau message:', message);
  };

  const handleError = (error: Error, details: any) => {
    console.error('Erreur RDS:', error, details);
    // Logique de gestion d'erreur personnalisée
  };

  return (
    <RDSMessagingFix
      rdsEndpoint="wss://production-rds.example.com/ws"
      userId="user_123"
      sessionId="session_456"
      maxRetries={5}
      retryDelay={2000}
      onMessageReceived={handleMessageReceived}
      onError={handleError}
    />
  );
};

export default ChatApp;
```

## Migration depuis l'ancien système

### Changements majeurs

1. **WebSocket au lieu de AJAX** : Migration vers une connexion WebSocket persistante
2. **Gestion d'état centralisée** : Utilisation de React hooks au lieu d'événements DOM
3. **Retry automatique** : Implémentation native du retry avec exponential backoff
4. **Interface modernisée** : Nouveau design avec animations et feedback visuel

### Checklist de migration

- [ ] Installer `lodash` pour le debouncing
- [ ] Remplacer les appels AJAX par WebSocket
- [ ] Migrer la gestion d'événements vers les callbacks props
- [ ] Adapter les styles CSS existants
- [ ] Tester les scénarios de reconnexion
- [ ] Vérifier les performances avec de gros volumes de messages
- [ ] Mettre à jour la documentation utilisateur

## Support et maintenance

### Debugging

```jsx
// Activer les logs détaillés en mode développement
if (process.env.NODE_ENV === 'development') {
  console.log('RDS Messaging Debug Mode Activé');
  
  // Écouter tous les événements WebSocket
  const originalSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function(data) {
    console.log('📤 Envoi WebSocket:', JSON.parse(data));
    return originalSend.call(this, data);
  };
}
```

### Monitoring des performances

```jsx
const performanceMetrics = {
  connectionTime: 0,
  messageDeliveryTime: 0,
  errorCount: 0,
  reconnectCount: 0
};

// Utiliser avec React DevTools Profiler
// ou des outils comme Lighthouse pour audit des performances
```

### Ressources utiles

- [Documentation WebSocket MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)

## Licence

Ce composant fait partie du projet Docucortex Enhanced et suit la même licence.