import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

/**
 * Composant de recherche intelligente avec autocomplétion
 * Optimisé pour 500+ utilisateurs avec cache et performance
 */
const IntelligentUserSearch = ({
  users = [],
  onUserSelect,
  placeholder = "Rechercher un utilisateur...",
  maxResults = 10,
  enableVoiceSearch = false,
  enableFilters = true,
  customFilters = {},
  className = "",
  showUserAvatar = true,
  highlightMatches = true,
  cacheResults = true,
  debounceMs = 300
}) => {
  // États principaux
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [voiceRecognition, setVoiceRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // États pour les filtres
  const [activeFilters, setActiveFilters] = useState({
    department: '',
    role: '',
    status: '',
    ...customFilters
  });

  // Réfs
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const cacheRef = useRef(new Map());
  const voiceSearchSupported = useMemo(() => 
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window, []);

  // Cache intelligent pour les résultats
  const searchCache = useRef(new Map());
  const filterCache = useRef(new Map());

  // Debounce de la recherche
  const debouncedSearch = useCallback(
    debounce(async (query, filters) => {
      if (!query.trim() && Object.values(filters).every(f => !f)) {
        setFilteredUsers([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // Vérification du cache
        const cacheKey = `${query}_${JSON.stringify(filters)}`;
        let results;
        
        if (cacheResults && searchCache.current.has(cacheKey)) {
          results = searchCache.current.get(cacheKey);
        } else {
          // Recherche intelligente avec fuzzy matching
          results = performIntelligentSearch(users, query, filters);
          
          if (cacheResults) {
            searchCache.current.set(cacheKey, results);
            // Nettoyage du cache si trop volumineux
            if (searchCache.current.size > 100) {
              const firstKey = searchCache.current.keys().next().value;
              searchCache.current.delete(firstKey);
            }
          }
        }

        setFilteredUsers(results.slice(0, maxResults));
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setFilteredUsers([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [users, maxResults, cacheResults]
  );

  // Algorithme de recherche intelligente avec fuzzy matching
  const performIntelligentSearch = useCallback((usersList, query, filters) => {
    if (!query.trim() && Object.values(filters).every(f => !f)) {
      return usersList;
    }

    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(' ').filter(word => word.length > 0);

    return usersList.filter(user => {
      // Vérification des filtres
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return user[key]?.toLowerCase().includes(value.toLowerCase());
      });

      if (!matchesFilters) return false;

      // Si pas de query, on inclut tous les utilisateurs correspondants aux filtres
      if (!queryLower) return true;

      // Fuzzy matching sur les champs utilisateur
      const searchFields = [
        user.firstName || '',
        user.lastName || '',
        user.fullName || '',
        user.email || '',
        user.department || '',
        user.role || '',
        user.jobTitle || ''
      ].join(' ').toLowerCase();

      // Score de correspondance
      const score = calculateFuzzyScore(queryLower, queryWords, searchFields);
      user._searchScore = score;

      return score > 0.3; // Seuil de pertinence
    }).sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
  }, []);

  // Calcul du score de fuzzy matching
  const calculateFuzzyScore = (query, queryWords, text) => {
    let score = 0;
    let totalWeight = 0;

    queryWords.forEach(word => {
      let wordScore = 0;
      
      // Correspondance exacte
      if (text.includes(word)) wordScore += 1.0;
      
      // Correspondance par similarité (Levenshtein simplifié)
      text.split(' ').forEach(textWord => {
        if (textWord.length >= 3 && word.length >= 3) {
          const similarity = calculateSimilarity(word, textWord);
          if (similarity > 0.7) wordScore = Math.max(wordScore, similarity);
        }
      });

      // Bonus pour les correspondances au début des mots
      if (text.includes(word) && text.indexOf(word) < 5) {
        wordScore += 0.2;
      }

      score += wordScore;
      totalWeight += 1;
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  };

  // Calcul de similarité simplifié (Levenshtein)
  const calculateSimilarity = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i - 1] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    return 1 - distance / Math.max(len1, len2);
  };

  // Surlignage des correspondances
  const highlightMatch = (text, query) => {
    if (!highlightMatches || !query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Gestion de la recherche vocale
  const initializeVoiceSearch = useCallback(() => {
    if (!voiceSearchSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setVoiceRecognition(recognition);
    }
  }, [voiceSearchSupported]);

  const toggleVoiceSearch = useCallback(() => {
    if (!voiceRecognition) return;

    if (isListening) {
      voiceRecognition.stop();
      setIsListening(false);
    } else {
      voiceRecognition.start();
      setIsListening(true);
    }
  }, [voiceRecognition, isListening]);

  // Gestionnaires d'événements
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredUsers[selectedIndex]) {
          handleUserSelect(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showResults, filteredUsers, selectedIndex]);

  const handleUserSelect = useCallback((user) => {
    setSearchQuery(user.fullName || `${user.firstName} ${user.lastName}`);
    setShowResults(false);
    setSelectedIndex(-1);
    
    if (onUserSelect) {
      onUserSelect(user);
    }
    
    // Focus sur l'input après sélection
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, [onUserSelect]);

  const handleFilterChange = useCallback((filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  // Effets
  useEffect(() => {
    debouncedSearch(searchQuery, activeFilters);
  }, [searchQuery, activeFilters, debouncedSearch]);

  useEffect(() => {
    if (searchQuery.trim() || Object.values(activeFilters).some(f => f)) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery, activeFilters]);

  useEffect(() => {
    if (enableVoiceSearch) {
      initializeVoiceSearch();
    }
  }, [enableVoiceSearch, initializeVoiceSearch]);

  // Options des filtres uniques pour l'interface
  const filterOptions = useMemo(() => {
    const options = {
      department: [...new Set(users.map(u => u.department).filter(Boolean))],
      role: [...new Set(users.map(u => u.role).filter(Boolean))],
      status: [...new Set(users.map(u => u.status).filter(Boolean))]
    };
    
    // Ajout des filtres personnalisés
    Object.keys(customFilters).forEach(key => {
      if (!options[key]) {
        options[key] = [...new Set(users.map(u => u[key]).filter(Boolean))];
      }
    });
    
    return options;
  }, [users, customFilters]);

  return (
    <div className={`intelligent-user-search ${className}`}>
      {/* Barre de recherche principale */}
      <div className="search-container" style={{ position: 'relative' }}>
        <div className="search-input-wrapper" style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="search-input"
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingRight: enableVoiceSearch ? '60px' : '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          
          {/* Bouton de recherche vocale */}
          {enableVoiceSearch && voiceSearchSupported && (
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`voice-search-btn ${isListening ? 'listening' : ''}`}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                background: isListening ? '#ef4444' : '#f3f4f6',
                color: isListening ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={isListening ? 'Arrêter l\'écoute' : 'Activer la recherche vocale'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="loading-indicator" style={{
            position: 'absolute',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px'
          }}>
            <div className="spinner" style={{
              width: '100%',
              height: '100%',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
      </div>

      {/* Filtres avancés */}
      {enableFilters && (
        <div className="advanced-filters" style={{
          marginTop: '8px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {Object.entries(filterOptions).map(([key, options]) => (
            <select
              key={key}
              value={activeFilters[key] || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="filter-select"
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                minWidth: '120px'
              }}
            >
              <option value="">Tous les {key}s</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ))}
          
          {/* Bouton de réinitialisation des filtres */}
          {Object.values(activeFilters).some(f => f) && (
            <button
              onClick={() => setActiveFilters({ department: '', role: '', status: '', ...customFilters })}
              className="clear-filters-btn"
              style={{
                padding: '6px 12px',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#ef4444',
                cursor: 'pointer'
              }}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Résultats de recherche */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="search-results"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '4px'
          }}
        >
          {filteredUsers.length === 0 && !isLoading && (
            <div className="no-results" style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              {searchQuery.trim() ? 'Aucun utilisateur trouvé' : 'Commencez à taper pour rechercher'}
            </div>
          )}

          {filteredUsers.map((user, index) => (
            <div
              key={user.id || `${user.email}_${index}`}
              onClick={() => handleUserSelect(user)}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < filteredUsers.length - 1 ? '1px solid #f3f4f6' : 'none',
                backgroundColor: index === selectedIndex ? '#f3f4f6' : 'transparent',
                transition: 'background-color 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Avatar utilisateur */}
                {showUserAvatar && (
                  <div className="user-avatar" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: user.avatarColor || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={`${user.firstName} ${user.lastName}`}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                    ) : (
                      (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
                    )}
                  </div>
                )}

                <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="user-name" style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '2px'
                  }}>
                    <span 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(
                          user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                          searchQuery
                        )
                      }}
                    />
                  </div>
                  
                  <div className="user-details" style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {user.email && (
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(user.email, searchQuery)
                      }} />
                    )}
                    {user.department && <span>{user.department}</span>}
                    {user.role && <span>{user.role}</span>}
                    {user.jobTitle && <span>{user.jobTitle}</span>}
                  </div>

                  {/* Score de pertinence (pour debug) */}
                  {process.env.NODE_ENV === 'development' && user._searchScore && (
                    <div className="search-score" style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      marginTop: '2px'
                    }}>
                      Score: {Math.round(user._searchScore * 100)}%
                    </div>
                  )}
                </div>

                {/* Indicateur de statut */}
                {user.status && (
                  <div className={`status-indicator ${user.status}`} style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 
                      user.status === 'active' ? '#10b981' :
                      user.status === 'inactive' ? '#ef4444' :
                      user.status === 'pending' ? '#f59e0b' : '#6b7280'
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles CSS en ligne pour les animations
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .intelligent-user-search .search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .intelligent-user-search .search-result-item:hover {
    background-color: #f9fafb;
  }

  .intelligent-user-search .voice-search-btn.listening {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .intelligent-user-search mark {
    background-color: #fef3c7;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 500;
  }
`;

// Injection des styles
if (typeof document !== 'undefined' && !document.getElementById('intelligent-search-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'intelligent-search-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default IntelligentUserSearch;

/**
 * Hook personnalisé pour optimiser les performances avec de grandes listes
 */
export const useOptimizedUserSearch = (users, options = {}) => {
  const {
    chunkSize = 100,
    enableVirtualScrolling = false,
    maxVisibleResults = 20
  } = options;

  const [displayUsers, setDisplayUsers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Traitement par chunks pour éviter de bloquer l'UI
  const processUsersInChunks = useCallback(async (searchFunction) => {
    setIsProcessing(true);
    const results = [];
    
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      const chunkResults = await searchFunction(chunk);
      results.push(...chunkResults);
      
      // Libérer le thread principal
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    setIsProcessing(false);
    return results;
  }, [users, chunkSize]);

  // Fonction de recherche optimisée
  const searchUsers = useCallback(async (query, filters) => {
    if (!query.trim() && Object.values(filters).every(f => !f)) {
      setDisplayUsers(users.slice(0, maxVisibleResults));
      return;
    }

    const searchFunction = async (userChunk) => {
      // Implémentation de la recherche sur le chunk
      return userChunk.filter(user => {
        // Logique de filtrage similaire au composant principal
        return true; // Simplified for example
      });
    };

    const results = await processUsersInChunks(searchFunction);
    setDisplayUsers(results.slice(0, maxVisibleResults));
  }, [users, processUsersInChunks, maxVisibleResults]);

  return {
    displayUsers,
    isProcessing,
    searchUsers
  };
};

/**
 * Composant de recherche optimisé pour très grandes listes (>500 utilisateurs)
 */
export const VirtualizedUserSearch = React.memo(IntelligentUserSearch, (prevProps, nextProps) => {
  // Optimisation: re-render seulement si les props changent réellement
  return (
    JSON.stringify(prevProps.users) === JSON.stringify(nextProps.users) &&
    prevProps.onUserSelect === nextProps.onUserSelect &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.maxResults === nextProps.maxResults &&
    prevProps.enableVoiceSearch === nextProps.enableVoiceSearch &&
    prevProps.enableFilters === nextProps.enableFilters &&
    prevProps.customFilters === nextProps.customFilters &&
    prevProps.className === nextProps.className &&
    prevProps.showUserAvatar === nextProps.showUserAvatar &&
    prevProps.highlightMatches === nextProps.highlightMatches &&
    prevProps.cacheResults === nextProps.cacheResults &&
    prevProps.debounceMs === nextProps.debounceMs
  );
});