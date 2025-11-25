/**
 * Exemple d'utilisation du GlobalPerformanceOptimizer
 * 
 * Ce fichier démontre toutes les fonctionnalités du système d'optimisation
 * dans un contexte d'application DocuCortex
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  GlobalPerformanceProvider,
  OptimizedVirtualList,
  OptimizedAnimatePresence,
  useGlobalPerformance,
  useUltraFastDebounce,
  useLagFreeAnimations,
  usePredictivePreload,
  useUserProfileOptimization,
  PerformanceTester
} from './GlobalPerformanceOptimizer';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant principal avec Provider
 */
const OptimizedApp = () => {
  const [users] = useState(generateMockUsers(1000));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  return (
    <GlobalPerformanceProvider 
      config={{
        MAX_CACHE_SIZE: 400 * 1024 * 1024, // 400MB
        ITEM_HEIGHT: 72,
        PREDICTIVE_LOOKAHEAD: 5,
        OVERSCAN_COUNT: 7,
        INSTANT_DEBOUNCE: 16
      }}
    >
      <div className="app">
        <PerformanceMonitor />
        
        <div className="main-content">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            data={users}
          />
          
          <UserList 
            users={users}
            searchQuery={searchQuery}
            onUserSelect={setSelectedUser}
          />
          
          <OptimizedAnimatePresence>
            {selectedUser && (
              <UserDetailDialog
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
              />
            )}
          </OptimizedAnimatePresence>
        </div>
      </div>
    </GlobalPerformanceProvider>
  );
};

/**
 * Composant de recherche avec debounce ultra-rapide
 */
const SearchBar = ({ searchQuery, onSearchChange, data }) => {
  const { cacheStats } = useGlobalPerformance();
  
  // Debounce ultra-rapide pour la recherche
  const debouncedSearch = useUltraFastDebounce((value) => {
    onSearchChange(value);
  }, 16);
  
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const cacheKey = `search_${searchQuery}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    const filtered = data.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setInCache(cacheKey, filtered, 60000);
    return filtered;
  }, [data, searchQuery]);
  
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Rechercher un utilisateur..."
        onChange={(e) => debouncedSearch(e.target.value)}
        className="search-input"
      />
      
      <div className="search-stats">
        <span>{filteredData.length} résultats</span>
        <span>Cache: {cacheStats.items} éléments</span>
      </div>
    </div>
  );
};

/**
 * Liste virtualisée optimisée avec preload prédictif
 */
const UserList = ({ users, searchQuery, onUserSelect }) => {
  const { userProfile } = useUserProfileOptimization();
  const { getOptimalChunkSize } = useGlobalPerformance();
  const { preloadItem, isPreloaded } = usePredictivePreload(users);
  
  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);
  
  // Renderer optimisé pour chaque utilisateur
  const renderUser = useCallback((user, index) => (
    <UserCard
      user={user}
      isPreloaded={isPreloaded(user.id)}
      onClick={() => {
        // Précharge les données détaillées
        preloadItem(`user_${user.id}`, getUserDetails(user.id));
        onUserSelect(user);
      }}
    />
  ), [onUserSelect, preloadItem, isPreloaded]);
  
  // Gestionnaire de scroll avec préchargement
  const handleScroll = useCallback((scrollOffset) => {
    // Préchargement intelligent basé sur la position
    const currentIndex = Math.floor(scrollOffset / 72);
    const preloadRange = userProfile?.rdpSession ? 3 : 5;
    
    for (let i = 1; i <= preloadRange; i++) {
      const userIndex = currentIndex + (preloadRange + i);
      if (userIndex < filteredUsers.length) {
        const user = filteredUsers[userIndex];
        preloadItem(`user_${user.id}`, getUserDetails(user.id));
      }
    }
  }, [filteredUsers, preloadItem, userProfile]);
  
  return (
    <div className="user-list-container">
      <OptimizedVirtualList
        items={filteredUsers}
        height={600}
        itemHeight={72}
        renderItem={renderUser}
        className="user-list"
        overscan={userProfile?.rdpSession ? 10 : 5}
      />
      
      <div className="user-list-footer">
        <span>Chunk size: {getOptimalChunkSize()}</span>
        <span>Type: {userProfile?.deviceType}</span>
        {userProfile?.rdpSession && <span className="rdp-badge">RDP</span>}
      </div>
    </div>
  );
};

/**
 * Carte utilisateur avec animations optimisées
 */
const UserCard = ({ user, isPreloaded, onClick }) => {
  const animations = useLagFreeAnimations();
  const { memoryUsage } = useGlobalPerformance();
  
  return (
    <motion.div
      className={`user-card ${isPreloaded ? 'preloaded' : ''}`}
      onClick={onClick}
      whileHover={animations.scale}
      initial={animations.fadeIn}
      transition={{ duration: 0.2 }}
    >
      <div className="user-avatar">
        <img 
          src={user.avatar} 
          alt={user.name}
          loading="lazy"
        />
      </div>
      
      <div className="user-info">
        <h3>{user.name}</h3>
        <p className="user-email">{user.email}</p>
        <p className="user-department">{user.department}</p>
        
        <div className="user-status">
          <span className={`status ${user.status}`}>
            {user.status}
          </span>
          
          {user.lastActive && (
            <span className="last-active">
              Dernière activité: {formatDate(user.lastActive)}
            </span>
          )}
        </div>
      </div>
      
      <div className="user-actions">
        <button className="action-btn edit">
          ✏️
        </button>
        <button className="action-btn message">
          💬
        </button>
        <button className="action-btn more">
          ⋯
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Dialogue de détail avec animations fluides
 */
const UserDetailDialog = ({ user, onClose }) => {
  const animations = useLagFreeAnimations();
  const [userDetails, setUserDetails] = useState(null);
  const { getFromCache } = useGlobalPerformance();
  
  // Charge les détails depuis le cache ou l'API
  React.useEffect(() => {
    const loadDetails = async () => {
      const cacheKey = `user_details_${user.id}`;
      let details = getFromCache(cacheKey);
      
      if (!details) {
        // Simulation d'appel API
        details = await fetchUserDetails(user.id);
        setInCache(cacheKey, details, 300000);
      }
      
      setUserDetails(details);
    };
    
    loadDetails();
  }, [user.id]);
  
  return (
    <motion.div
      className="user-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="user-detail-dialog"
        initial={animations.slideUp}
        animate={animations.slideUp}
        exit={animations.slideUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>{user.name}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        {userDetails && (
          <div className="dialog-content">
            <div className="user-avatar-large">
              <img src={user.avatar} alt={user.name} />
            </div>
            
            <div className="user-details-grid">
              <DetailField label="Email" value={user.email} />
              <DetailField label="Département" value={user.department} />
              <DetailField label="Statut" value={user.status} />
              <DetailField label="Téléphone" value={userDetails.phone} />
              <DetailField label="Bureau" value={userDetails.office} />
              <DetailField label="Manager" value={userDetails.manager} />
            </div>
            
            <div className="user-activity">
              <h3>Activité récente</h3>
              {userDetails.activities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </div>
        )}
        
        <div className="dialog-actions">
          <button className="btn-primary">Modifier</button>
          <button className="btn-secondary">Envoyer un message</button>
          <button className="btn-secondary">Voir l'historique</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Composant de monitoring des performances
 */
const PerformanceMonitor = () => {
  const {
    memoryUsage,
    performanceScore,
    cacheStats,
    isRDPSession,
    updatePerformanceMetrics
  } = useGlobalPerformance();
  
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState(null);
  
  // Tests de performance automatiques
  React.useEffect(() => {
    const runPerformanceTest = async () => {
      const tester = new PerformanceTester();
      const navTest = await tester.testInstantNavigation();
      
      setMetrics({
        navigation: navTest,
        timestamp: new Date().toLocaleTimeString()
      });
    };
    
    const interval = setInterval(() => {
      updatePerformanceMetrics();
      runPerformanceTest();
    }, 10000); // Test toutes les 10 secondes
    
    return () => clearInterval(interval);
  }, [updatePerformanceMetrics]);
  
  const memoryMB = (memoryUsage / 1024 / 1024).toFixed(1);
  const cacheMB = (cacheStats.size / 1024 / 1024).toFixed(1);
  
  if (!isVisible) {
    return (
      <button
        className="performance-toggle"
        onClick={() => setIsVisible(true)}
      >
        📊 Performance: {performanceScore}/100
      </button>
    );
  }
  
  return (
    <motion.div
      className="performance-monitor"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
    >
      <div className="monitor-header">
        <h3>Monitoring Performance</h3>
        <button 
          className="close-btn"
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>
      
      <div className="monitor-grid">
        <MetricCard
          label="Score Global"
          value={performanceScore}
          unit="/100"
          status={performanceScore > 90 ? 'excellent' : 'good'}
        />
        
        <MetricCard
          label="Mémoire"
          value={memoryMB}
          unit="MB"
          status={memoryMB < 100 ? 'excellent' : 'warning'}
        />
        
        <MetricCard
          label="Cache"
          value={cacheMB}
          unit="MB"
          status={cacheMB < 200 ? 'excellent' : 'warning'}
        />
        
        <MetricCard
          label="Éléments Cache"
          value={cacheStats.items}
          unit=""
          status="neutral"
        />
      </div>
      
      {isRDPSession && (
        <div className="rdp-notification">
          🎯 Optimisations RDP activées
        </div>
      )}
      
      {metrics && (
        <div className="performance-tests">
          <h4>Tests automatiques</h4>
          <div className="test-results">
            <span>Navigation: {metrics.navigation.status}</span>
            <span>Heure: {metrics.timestamp}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Composants utilitaires
 */
const DetailField = ({ label, value }) => (
  <div className="detail-field">
    <label>{label}</label>
    <span>{value || 'Non renseigné'}</span>
  </div>
);

const ActivityItem = ({ activity }) => (
  <div className="activity-item">
    <span className="activity-type">{activity.type}</span>
    <span className="activity-description">{activity.description}</span>
    <span className="activity-time">{formatDate(activity.timestamp)}</span>
  </div>
);

const MetricCard = ({ label, value, unit, status }) => (
  <div className={`metric-card ${status}`}>
    <span className="metric-label">{label}</span>
    <span className="metric-value">
      {value} {unit}
    </span>
  </div>
);

/**
 * Utilitaires et données de test
 */
const generateMockUsers = (count) => {
  const departments = ['IT', 'RH', 'Finance', 'Marketing', 'Vente', 'Support'];
  const statuses = ['actif', 'inactif', 'congé', 'mission'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Utilisateur ${i + 1}`,
    email: `user${i + 1}@company.com`,
    department: departments[i % departments.length],
    status: statuses[i % statuses.length],
    avatar: `https://i.pravatar.cc/64?u=user${i + 1}`,
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));
};

const getUserDetails = (userId) => ({
  phone: `01 23 45 67 ${String(userId).padStart(2, '0')}`,
  office: `Bureau ${Math.ceil(userId / 10)}`,
  manager: `Manager ${Math.ceil(userId / 5)}`,
  activities: [
    {
      type: 'connexion',
      description: 'Connexion à l\'application',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      type: 'document',
      description: 'Modification document.doc',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ]
});

const fetchUserDetails = async (userId) => {
  // Simulation d'un appel API avec délai
  await new Promise(resolve => setTimeout(resolve, 200));
  return getUserDetails(userId);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Utilitaires de cache (à remplacer par les vrais depuis le contexte)
const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;
    
    const item = JSON.parse(cached);
    if (Date.now() > item.timestamp + item.ttl) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return item.data;
  } catch {
    return null;
  }
};

const setInCache = (key, data, ttl = 300000) => {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  } catch (error) {
    console.warn('Cache set failed:', error);
  }
};

export default OptimizedApp;

/**
 * Styles CSS pour l'exemple (à adapter à votre CSS)
 */
const styles = `
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #eee;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.search-stats {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 1rem;
}

.user-list-container {
  flex: 1;
  overflow: hidden;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: transform 0.2s;
}

.user-card:hover {
  transform: translateX(4px);
}

.user-card.preloaded {
  background: #f8f9fa;
}

.user-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.user-info {
  flex: 1;
  margin-left: 1rem;
}

.user-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.user-email {
  color: #666;
  font-size: 0.85rem;
  margin: 0;
}

.user-department {
  color: #888;
  font-size: 0.8rem;
  margin: 0.25rem 0;
}

.user-status {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status.actif { background: #d4edda; color: #155724; }
.status.inactif { background: #f8d7da; color: #721c24; }
.status.congé { background: #fff3cd; color: #856404; }
.status.mission { background: #d1ecf1; color: #0c5460; }

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: #e0e0e0;
}

.user-list-footer {
  padding: 0.5rem 1rem;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.rdp-badge {
  background: #007bff;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
}

.performance-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  z-index: 1000;
}

.performance-monitor {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.monitor-header h3 {
  margin: 0;
  font-size: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.monitor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-card {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

.metric-card.excellent {
  background: #d4edda;
  color: #155724;
}

.metric-card.warning {
  background: #fff3cd;
  color: #856404;
}

.metric-card.neutral {
  background: #e2e3e5;
  color: #383d41;
}

.metric-label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: bold;
}

.rdp-notification {
  background: #d1ecf1;
  color: #0c5460;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.75rem;
}

.performance-tests {
  border-top: 1px solid #eee;
  padding-top: 0.75rem;
}

.performance-tests h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.test-results {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
}

.user-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.user-detail-dialog {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  margin: 1rem;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.dialog-header h2 {
  margin: 0;
}

.dialog-content {
  padding: 1.5rem;
}

.user-avatar-large {
  text-align: center;
  margin-bottom: 1.5rem;
}

.user-avatar-large img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.user-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-field label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.detail-field span {
  font-size: 0.95rem;
}

.user-activity {
  margin-top: 1.5rem;
}

.user-activity h3 {
  margin-bottom: 1rem;
}

.activity-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-type {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.activity-description {
  font-size: 0.9rem;
}

.activity-time {
  font-size: 0.8rem;
  color: #666;
}

.dialog-actions {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: white;
  color: #007bff;
  border: 1px solid #007bff;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary:hover {
  background: #f8f9fa;
}
`;