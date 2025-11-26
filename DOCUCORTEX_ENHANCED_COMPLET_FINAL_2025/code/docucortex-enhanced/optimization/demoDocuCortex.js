/**
 * Démonstration pratique DocuCortex Enhanced
 * 
 * Exemple d'intégration complète du système d'optimisation
 * dans une application de gestion de documents
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  OptimizedApp,
  OptimizedVirtualList,
  OptimizedAnimatePresence,
  useGlobalPerformance,
  useUltraFastDebounce,
  useLagFreeAnimations,
  usePerformanceMonitoring,
  createOptimizedComponent,
  PerformanceDiagnostic
} from './index.js';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Application principale optimisée DocuCortex
 */
const DocuCortexApp = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard, documents, users
  
  // Hook de monitoring
  const performanceData = usePerformanceMonitoring();
  
  // Simulation du chargement de données
  React.useEffect(() => {
    loadDocuments();
    loadUsers();
    loadAnalytics();
  }, []);
  
  const loadDocuments = async () => {
    setIsLoading(true);
    
    // Simule le chargement avec optimisations
    setTimeout(() => {
      const mockDocuments = Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        title: `Document ${i + 1}`,
        type: ['PDF', 'DOC', 'TXT', 'XLS'][i % 4],
        size: Math.floor(Math.random() * 10000) + 100, // 100KB - 10MB
        status: ['En cours', 'Validé', 'Rejeté', 'Archivé'][i % 4],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        modifiedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        author: `Utilisateur ${Math.floor(Math.random() * 100) + 1}`,
        tags: [`tag${i % 10}`, `category${i % 5}`, `department${i % 3}`],
        signature: {
          required: Math.random() > 0.7,
          status: ['En attente', 'Signé', 'Rejeté'][Math.floor(Math.random() * 3)],
          signers: Math.floor(Math.random() * 5) + 1
        }
      }));
      
      setDocuments(mockDocuments);
      setIsLoading(false);
    }, 500);
  };
  
  const loadUsers = async () => {
    // Simule le chargement des utilisateurs
    setTimeout(() => {
      // Les données seraient chargées ici
    }, 200);
  };
  
  const loadAnalytics = async () => {
    // Simule le chargement des analytics
    setTimeout(() => {
      // Les données seraient chargées ici
    }, 300);
  };
  
  // Navigation optimisée
  const navigateTo = useUltraFastDebounce((newView) => {
    setView(newView);
    setSelectedDocument(null);
  }, 50);
  
  return (
    <div className="docucortex-app">
      <OptimizedHeader 
        performanceData={performanceData}
        onNavigate={navigateTo}
        currentView={view}
      />
      
      <div className="app-content">
        {isLoading ? (
          <OptimizedLoadingScreen />
        ) : (
          <OptimizedAnimatePresence>
            {view === 'dashboard' && (
              <DashboardView documents={documents} />
            )}
            
            {view === 'documents' && (
              <DocumentsView 
                documents={documents}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                onDocumentSelect={setSelectedDocument}
                selectedDocument={selectedDocument}
              />
            )}
            
            {view === 'users' && (
              <UsersView />
            )}
          </OptimizedAnimatePresence>
        )}
      </div>
      
      {/* Panel de diagnostic (développement uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <DiagnosticPanel />
      )}
    </div>
  );
};

/**
 * Header optimisé avec navigation
 */
const OptimizedHeader = ({ performanceData, onNavigate, currentView }) => {
  const animations = useLagFreeAnimations();
  const { isRDPSession } = useGlobalPerformance();
  
  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'users', label: 'Utilisateurs', icon: '👥' }
  ];
  
  return (
    <motion.header 
      className={`app-header ${isRDPSession ? 'rdp-optimized' : ''}`}
      initial={animations.slideUp}
      animate={animations.slideUp}
      exit={animations.slideUp}
    >
      <div className="header-content">
        <div className="logo">
          <h1>📋 DocuCortex</h1>
          <span className="version">Enhanced v2.0</span>
        </div>
        
        <nav className="main-nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="header-actions">
          <PerformanceBadge performanceData={performanceData} />
          
          <button className="action-btn">
            🔔
            <span className="notification-badge">3</span>
          </button>
          
          <button className="action-btn profile">
            👤
          </button>
        </div>
      </div>
    </motion.header>
  );
};

/**
 * Badge de performance optimisé
 */
const PerformanceBadge = ({ performanceData }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return '#28a745';
    if (score >= 80) return '#ffc107';
    return '#dc3545';
  };
  
  return (
    <motion.div
      className="performance-badge"
      whileHover={{ scale: 1.05 }}
      style={{
        backgroundColor: getScoreColor(performanceData.performanceScore)
      }}
    >
      <span className="score">{performanceData.performanceScore}</span>
      <span className="label">Perf</span>
    </motion.div>
  );
};

/**
 * Écran de chargement optimisé
 */
const OptimizedLoadingScreen = () => {
  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>Chargement de DocuCortex...</h2>
        <p>Optimisation des performances en cours...</p>
      </div>
    </motion.div>
  );
};

/**
 * Vue tableau de bord avec graphiques optimisés
 */
const DashboardView = ({ documents }) => {
  const [analytics, setAnalytics] = useState(null);
  
  React.useEffect(() => {
    // Génère les analytics optimisées
    setAnalytics(generateOptimizedAnalytics(documents));
  }, [documents]);
  
  if (!analytics) return null;
  
  return (
    <motion.div
      className="dashboard-view"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="dashboard-header">
        <h2>📊 Tableau de bord</h2>
        <p>Vue d'ensemble de votre système de documents</p>
      </div>
      
      <div className="dashboard-grid">
        <OptimizedMetricCard
          title="Total Documents"
          value={documents.length.toLocaleString()}
          icon="📄"
          trend="+12%"
        />
        
        <OptimizedMetricCard
          title="Signatures en attente"
          value={analytics.pendingSignatures}
          icon="✍️"
          trend="-5%"
        />
        
        <OptimizedMetricCard
          title="Documents validés"
          value={analytics.approvedDocuments}
          icon="✅"
          trend="+8%"
        />
        
        <OptimizedMetricCard
          title="Utilisateurs actifs"
          value="1,247"
          icon="👥"
          trend="+3%"
        />
      </div>
      
      <div className="dashboard-charts">
        <OptimizedChart data={analytics.documentTypes} title="Types de documents" />
        <OptimizedChart data={analytics.monthlyActivity} title="Activité mensuelle" />
      </div>
    </motion.div>
  );
};

/**
 * Métrique optimisée
 */
const OptimizedMetricCard = ({ title, value, icon, trend }) => {
  const animations = useLagFreeAnimations();
  
  return (
    <motion.div
      className="metric-card"
      initial={animations.fadeIn}
      animate={animations.fadeIn}
      whileHover={animations.scale}
    >
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3 className="metric-value">{value}</h3>
        <p className="metric-title">{title}</p>
        <span className={`metric-trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>
          {trend}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Graphique optimisé
 */
const OptimizedChart = ({ data, title }) => {
  const { isRDPSession } = useGlobalPerformance();
  
  return (
    <div className={`chart-container ${isRDPSession ? 'rdp-optimized' : ''}`}>
      <h3>{title}</h3>
      <div className="chart-content">
        {/* Simulation d'un graphique simplifié */}
        {data.map((item, index) => (
          <motion.div
            key={index}
            className="chart-bar"
            style={{ height: `${item.value}%` }}
            initial={{ height: 0 }}
            animate={{ height: `${item.value}%` }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="chart-label">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/**
 * Vue documents avec virtualisation avancée
 */
const DocumentsView = ({ 
  documents, 
  searchQuery, 
  onSearch, 
  onDocumentSelect, 
  selectedDocument 
}) => {
  const { getFromCache, setInCache } = useGlobalPerformance();
  const debouncedSearch = useUltraFastDebounce(onSearch, 50);
  
  // Filtrage optimisé avec cache
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    
    const cacheKey = `search_${searchQuery}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    const filtered = documents.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setInCache(cacheKey, filtered, 60000); // 1 minute
    return filtered;
  }, [documents, searchQuery, getFromCache, setInCache]);
  
  // Renderer optimisé pour chaque document
  const renderDocument = useCallback((document, index) => (
    <OptimizedDocumentCard
      document={document}
      isSelected={selectedDocument?.id === document.id}
      onClick={() => onDocumentSelect(document)}
    />
  ), [selectedDocument, onDocumentSelect]);
  
  return (
    <motion.div
      className="documents-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="documents-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher dans les documents..."
            value={searchQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="documents-actions">
          <button className="action-btn primary">
            ➕ Nouveau document
          </button>
          
          <button className="action-btn secondary">
            📤 Exporter
          </button>
        </div>
      </div>
      
      <div className="documents-stats">
        <span>{filteredDocuments.length.toLocaleString()} documents</span>
        {searchQuery && (
          <span>Résultats pour "{searchQuery}"</span>
        )}
      </div>
      
      <div className="documents-list-container">
        <OptimizedVirtualList
          items={filteredDocuments}
          height={600}
          itemHeight={80}
          renderItem={renderDocument}
          className="documents-list"
        />
      </div>
    </motion.div>
  );
};

/**
 * Carte de document optimisée
 */
const OptimizedDocumentCard = ({ document, isSelected, onClick }) => {
  const animations = useLagFreeAnimations();
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Validé': return '#28a745';
      case 'En cours': return '#ffc107';
      case 'Rejeté': return '#dc3545';
      case 'Archivé': return '#6c757d';
      default: return '#007bff';
    }
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF': return '📕';
      case 'DOC': return '📘';
      case 'TXT': return '📗';
      case 'XLS': return '📙';
      default: return '📄';
    }
  };
  
  return (
    <motion.div
      className={`document-card ${isSelected ? 'selected' : ''}`}
      initial={animations.fadeIn}
      animate={animations.fadeIn}
      whileHover={animations.scale}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        borderColor: isSelected ? '#007bff' : 'transparent'
      }}
    >
      <div className="document-icon">
        {getTypeIcon(document.type)}
      </div>
      
      <div className="document-content">
        <h3 className="document-title">{document.title}</h3>
        
        <div className="document-meta">
          <span className="document-type">{document.type}</span>
          <span className="document-author">par {document.author}</span>
          <span className="document-date">
            {document.modifiedAt.toLocaleDateString('fr-FR')}
          </span>
        </div>
        
        <div className="document-status">
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(document.status) }}
          >
            {document.status}
          </span>
          
          {document.signature.required && (
            <span className="signature-badge">
              ✍️ Signature {document.signature.status}
            </span>
          )}
          
          <span className="document-size">
            {(document.size / 1024).toFixed(1)}KB
          </span>
        </div>
        
        <div className="document-tags">
          {document.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="document-actions">
        <button className="doc-action-btn">👁️</button>
        <button className="doc-action-btn">✏️</button>
        <button className="doc-action-btn">📤</button>
      </div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="document-hover-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button onClick={(e) => { e.stopPropagation(); }}>
              Ouvrir
            </button>
            <button onClick={(e) => { e.stopPropagation(); }}>
              Modifier
            </button>
            <button onClick={(e) => { e.stopPropagation(); }}>
              Partager
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Vue utilisateurs (simplifiée)
 */
const UsersView = () => {
  return (
    <motion.div
      className="users-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="users-header">
        <h2>👥 Gestion des utilisateurs</h2>
        <p>Fonctionnalité en cours de développement...</p>
      </div>
      
      <div className="users-placeholder">
        <div className="placeholder-icon">🚧</div>
        <h3>Section en développement</h3>
        <p>Cette section sera disponible dans la prochaine mise à jour</p>
      </div>
    </motion.div>
  );
};

/**
 * Panel de diagnostic
 */
const DiagnosticPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);
  
  const runDiagnostic = async () => {
    // Le diagnostic sera exécuté ici
    console.log('🔍 Diagnostic en cours...');
  };
  
  return (
    <div className="diagnostic-panel">
      <button 
        className="diagnostic-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔍 Performance
      </button>
      
      {isOpen && (
        <motion.div
          className="diagnostic-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <PerformanceDiagnostic onComplete={setDiagnostic} />
          
          {diagnostic && (
            <div className="diagnostic-summary">
              <h4>Récapitulatif</h4>
              <p>Score: {diagnostic.summary.totalScore}/100</p>
              <p>Note: {diagnostic.summary.grade}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

/**
 * Utilitaires de génération de données
 */
const generateOptimizedAnalytics = (documents) => {
  const types = {};
  const signatures = { pending: 0, signed: 0, rejected: 0 };
  
  documents.forEach(doc => {
    types[doc.type] = (types[doc.type] || 0) + 1;
    
    if (doc.signature.required) {
      switch (doc.signature.status) {
        case 'En attente':
          signatures.pending++;
          break;
        case 'Signé':
          signatures.signed++;
          break;
        case 'Rejeté':
          signatures.rejected++;
          break;
      }
    }
  });
  
  return {
    documentTypes: Object.entries(types).map(([type, count]) => ({
      label: type,
      value: Math.max(10, (count / documents.length) * 100)
    })),
    monthlyActivity: Array.from({ length: 12 }, (_, i) => ({
      label: new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
      value: Math.floor(Math.random() * 80) + 20
    })),
    pendingSignatures: signatures.pending,
    approvedDocuments: documents.filter(d => d.status === 'Validé').length
  };
};

/**
 * Composant wrapper avec application principale optimisée
 */
const DocuCortexPerformanceDemo = () => {
  return (
    <OptimizedApp
      config={{
        MAX_CACHE_SIZE: 400 * 1024 * 1024,
        ITEM_HEIGHT: 80,
        PREDICTIVE_LOOKAHEAD: 5,
        ANIMATION_DURATION: 0.2
      }}
    >
      <div className="docucortex-demo">
        <DocuCortexApp />
      </div>
    </OptimizedApp>
  );
};

export default DocuCortexPerformanceDemo;

/**
 * Styles CSS pour la démonstration
 */
const styles = `
.docucortex-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo .version {
  font-size: 0.75rem;
  color: #666;
  font-weight: normal;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-item.active {
  background: #667eea;
  color: white;
}

.nav-icon {
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.performance-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}

.action-btn {
  position: relative;
  padding: 0.75rem;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

.app-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-view {
  animation: fadeInUp 0.5s ease-out;
}

.dashboard-header h2 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: white;
}

.dashboard-header p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  font-size: 2.5rem;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.metric-title {
  color: #666;
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.metric-trend {
  font-size: 0.8rem;
  font-weight: 600;
}

.metric-trend.positive {
  color: #28a745;
}

.metric-trend.negative {
  color: #dc3545;
}

.dashboard-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.chart-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chart-container h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.chart-content {
  display: flex;
  align-items: end;
  gap: 0.5rem;
  height: 200px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
}

.chart-label {
  position: absolute;
  bottom: -20px;
  font-size: 0.8rem;
  color: #666;
}

.documents-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #667eea;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.documents-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn.primary {
  background: #667eea;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.action-btn.secondary {
  background: white;
  color: #667eea;
  padding: 0.75rem 1.5rem;
  border: 2px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.documents-stats {
  display: flex;
  gap: 1rem;
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.documents-list-container {
  height: 600px;
  overflow: hidden;
}

.documents-list {
  /* Styles personnalisés pour la liste virtualisée */
}

.document-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.document-card:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.document-card.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.document-icon {
  font-size: 2rem;
}

.document-content {
  flex: 1;
}

.document-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.document-meta {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.document-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.signature-badge {
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.75rem;
}

.document-size {
  color: #999;
  font-size: 0.8rem;
}

.document-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #666;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.doc-action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-action-btn:hover {
  background: #e0e0e0;
}

.document-hover-overlay {
  position: absolute;
  top: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 0.5rem;
}

.document-hover-overlay button {
  padding: 0.5rem;
  border: none;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.users-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.users-placeholder {
  padding: 4rem 2rem;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.users-placeholder h3 {
  color: #666;
  margin-bottom: 0.5rem;
}

.users-placeholder p {
  color: #999;
}

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.diagnostic-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.diagnostic-toggle {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.diagnostic-content {
  position: absolute;
  bottom: 60px;
  right: 0;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.diagnostic-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Optimisations RDP */
.docucortex-app.rdp-optimized .document-card {
  transition: none;
}

.docucortex-app.rdp-optimized .action-btn:hover {
  transform: none;
}

.docucortex-app.rdp-optimized .metric-card:hover {
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .main-nav {
    order: -1;
  }
  
  .documents-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-charts {
    grid-template-columns: 1fr;
  }
}
`;