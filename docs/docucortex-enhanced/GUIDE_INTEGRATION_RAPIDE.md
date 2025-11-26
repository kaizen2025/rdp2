# 🚀 GUIDE D'INTÉGRATION RAPIDE
## Dashboard Temps Réel DocuCortex

---

## ⚡ DÉMARRAGE EN 5 MINUTES

### 1️⃣ Installation Dépendances
```bash
# Dans votre projet DocuCortex
npm install recharts react-grid-layout react-resizable pako react-toastify

# Si pas encore fait
npm install react-window react-window-infinite-loader
```

### 2️⃣ Copie des Composants
```bash
# Copier depuis le projet enhanced
cp -r code/docucortex-enhanced/src/components/dashboard/* ./src/components/dashboard/
cp code/docucortex-enhanced/src/services/websocketService.js ./src/services/
```

### 3️⃣ Intégration Routes
```javascript
// src/App.js ou src/routes/index.js
import DashboardPrêts from './components/dashboard/DashboardPrêts';

const routes = [
  {
    path: '/dashboard',
    component: DashboardPrêts,
    exact: true
  }
];
```

### 4️⃣ Configuration WebSocket Backend
```javascript
// src/config/websocket.js
export const WS_CONFIG = {
  url: process.env.REACT_APP_WS_URL || 'ws://localhost:3002/ws',
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 15000
};
```

### 5️⃣ Test Rapide
```javascript
// src/pages/TestDashboard.js
import React from 'react';
import DashboardPrêts from '../components/dashboard/DashboardPrêts';

export default function TestDashboard() {
  return <DashboardPrêts enableDemo={true} />;
}
```

---

## 🔧 CONFIGURATION BACKEND WebSocket

### Structure Événements Requis
```javascript
// Exemple payload WebSocket
{
  "type": "loans_update",
  "data": {
    "total": 1250,
    "active": 890,
    "overdue": 45,
    "trend": "+5.2%"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}

{
  "type": "user_activity",
  "data": {
    "activeUsers": 23,
    "topUsers": [
      { "id": 1, "name": "Alice Martin", "loansCount": 12, "onTimeRate": 95 },
      { "id": 2, "name": "Bob Dupont", "loansCount": 8, "onTimeRate": 88 }
    ]
  }
}

{
  "type": "alert",
  "severity": "warning",
  "title": "Prêt en retard",
  "message": "Le prêt #1234 dépasse l'échéance de 30 jours",
  "timestamp": "2024-01-15T10:25:00Z"
}
```

### Endpoint WebSocket Minimal
```javascript
// Node.js + ws package
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3002 });

wss.on('connection', (ws) => {
  console.log('Client connecté');
  
  // Envoi données initiales
  ws.send(JSON.stringify({
    type: 'init',
    data: { connection: 'ok', timestamp: Date.now() }
  }));
  
  // Simulation envoi données
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'loans_update',
      data: {
        total: Math.floor(Math.random() * 2000) + 500,
        active: Math.floor(Math.random() * 1000) + 300,
        overdue: Math.floor(Math.random() * 50)
      },
      timestamp: Date.now()
    }));
  }, 5000);
});
```

---

## 📱 INTÉGRATION NAVIGATION

### Menu Principal
```javascript
// src/components/Navigation.js
import { Dashboard as DashboardIcon } from '@mui/icons-material';

const menuItems = [
  {
    text: 'Dashboard Temps Réel',
    icon: <DashboardIcon />,
    path: '/dashboard',
    description: 'Vue d\'ensemble activité prêts'
  }
];
```

### Header avec Indicateur
```javascript
// src/components/Header.js
import { Badge } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export function DashboardHeader() {
  const [alertCount, setAlertCount] = useState(0);
  
  return (
    <Badge badgeContent={alertCount} color="error">
      <NotificationsActiveIcon />
    </Badge>
  );
}
```

---

## 🎨 PERSONNALISATION RAPIDE

### Thème Custom
```javascript
// src/theme/dashboardTheme.js
import { createTheme } from '@mui/material/styles';

export const dashboardTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    error: { main: '#f44336' }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 }
      }
    }
  }
});
```

### Configuration Widgets
```javascript
// src/config/dashboard.js
export const DASHBOARD_CONFIG = {
  refreshInterval: 30000, // 30 secondes
  enableSounds: true,
  defaultLayout: 'balanced', // 'executive', 'technical', 'balanced'
  widgets: {
    loans: { enabled: true, position: [0, 0] },
    activity: { enabled: true, position: [6, 0] },
    users: { enabled: true, position: [0, 1] },
    alerts: { enabled: true, position: [6, 1] },
    performance: { enabled: true, position: [0, 2] }
  }
};
```

---

## 🔍 TESTS & DEBUG

### Mode Debug
```javascript
// Active logs détaillés en développement
const DEBUG_WEBSOCKET = process.env.NODE_ENV === 'development';

// Dans DashboardPrêts.js
if (DEBUG_WEBSOCKET) {
  console.log('🔗 WebSocket connecté:', connectionStatus);
  console.log('📊 Métriques performance:', performanceMetrics);
}
```

### Test avec Données Mock
```javascript
// Activation mode démo
<DashboardPrêts 
  enableDemo={true}
  demoDataInterval={2000} // 2 secondes
/>
```

### Monitoring Performance
```javascript
// src/hooks/usePerformanceMonitor.js
import { useEffect, useState } from 'react';

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({ fps: 60, renderTime: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Collecte métriques
      setMetrics({
        fps: Math.round(1000 / performance.now()),
        renderTime: performance.now()
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
}
```

---

## 🚀 DÉPLOIEMENT

### Variables d'Environnement
```bash
# .env.production
REACT_APP_WS_URL=wss://your-domain.com/ws
REACT_APP_WS_PORT=3002
REACT_APP_REFRESH_INTERVAL=30000
REACT_APP_ENABLE_METRICS=true
```

### Configuration Serveur
```nginx
# nginx.conf - WebSocket proxy
location /ws {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### Health Check
```javascript
// src/services/healthCheck.js
export async function checkDashboardHealth() {
  const checks = {
    websocket: false,
    api: false,
    permissions: false
  };
  
  try {
    // Test WebSocket
    const ws = new WebSocket(process.env.REACT_APP_WS_URL);
    await new Promise(resolve => ws.onopen = resolve);
    checks.websocket = true;
    ws.close();
    
    // Test API
    const response = await fetch('/api/health');
    checks.api = response.ok;
    
    return checks;
  } catch (error) {
    console.error('Health check failed:', error);
    return checks;
  }
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs à Surveiller
- **Temps de chargement** : < 2 secondes
- **FPS Dashboard** : > 50 FPS constant
- **Latence WebSocket** : < 100ms
- **Mémoire utilisée** : < 50MB
- **Taux d'erreur** : < 0.1%

### Alertes Automatiques
```javascript
// Configuration seuils
const PERFORMANCE_THRESHOLDS = {
  fps: { warning: 30, critical: 15 },
  memory: { warning: 100, critical: 200 }, // MB
  latency: { warning: 500, critical: 2000 }, // ms
  errorRate: { warning: 0.01, critical: 0.05 } // %
};
```

---

## 🆘 SUPPORT & RÉSOLUTION

### Problèmes Courants

#### WebSocket ne connecte pas
```javascript
// Vérification firewall/proxy
const wsUrl = process.env.REACT_APP_WS_URL;
console.log('URL WebSocket:', wsUrl);

// Test connexion manuelle
const testWs = new WebSocket(wsUrl);
testWs.onopen = () => console.log('✅ Connexion OK');
testWs.onerror = (error) => console.error('❌ Erreur:', error);
```

#### Widgets ne s'affichent pas
```javascript
// Vérification imports
import DashboardPrêts from './components/dashboard/DashboardPrêts';
import LoansStatsWidget from './components/dashboard/LoansStatsWidget';

// Vérification routing
console.log('Routes disponibles:', routes);
```

#### Performance dégradée
```javascript
// Activer métriques
<DashboardPrêts enableMetrics={true} />

// Réduire fréquence refresh
const refreshConfig = {
  slowDevices: 60000, // 1 minute
  fastDevices: 30000  // 30 secondes
};
```

### Logs de Debug
```javascript
// Console commands utiles
localStorage.getItem('dashboard_config'); // Configuration sauvegardée
sessionStorage.getItem('websocket_status'); // État connexion
performance.getEntriesByType('navigation')[0]; // Temps chargement
```

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] **Dépendances installées** (recharts, react-grid-layout, etc.)
- [ ] **Composants copiés** dans projet cible
- [ ] **Routes configurées** (/dashboard)
- [ ] **Backend WebSocket** opérationnel
- [ ] **Variables environnement** définies
- [ ] **Tests navigation** validés
- [ ] **Performance monitorée** (>50 FPS)
- [ ] **Alertes configurées** seuils appropriés
- [ ] **Formation utilisateurs** réalisée
- [ ] **Documentation partagée** équipes

---

**🎯 Dashboard Temps Réel DocuCortex - Prêt pour Production !**

*Pour support supplémentaire : consultez DASHBOARD_TEMPS_REEL_SUMMARY.md*