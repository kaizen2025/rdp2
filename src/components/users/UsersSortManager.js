import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, RotateCcw } from 'lucide-react';

/**
 * UsersSortManager - Gestionnaire de tri multi-colonnes optimisé pour DocuCortex
 * 
 * Fonctionnalités :
 * - Tri multi-colonnes avec persistance localStorage
 * - Indicateurs visuels (flèches)
 * - Tri intelligent (numérique, textuel, date)
 * - Performance optimisée pour 500+ utilisateurs
 * - Animations fluides sans latence
 */
const UsersSortManager = ({ 
  users = [], 
  onSort,
  className = '',
  showResetButton = true,
  enableLocalStorage = true,
  animationDuration = 150
}) => {
  // États du composant
  const [sortStates, setSortStates] = useState(new Map());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef(null);
  const lastSaveRef = useRef(0);

  // Clé de stockage localStorage
  const STORAGE_KEY = 'docucortex_users_sort_states';

  // Détection intelligente du type de données
  const detectDataType = useCallback((value, key) => {
    if (value === null || value === undefined) return 'string';
    
    // Détection par clé de champ
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('date') || lowerKey.includes('created') || lowerKey.includes('updated')) {
      return 'date';
    }
    
    if (lowerKey.includes('age') || lowerKey.includes('loan') || lowerKey.includes('count') || 
        lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('score')) {
      return 'number';
    }
    
    if (lowerKey.includes('email') || lowerKey.includes('phone') || lowerKey.includes('id')) {
      return 'string';
    }
    
    // Détection automatique par format
    if (typeof value === 'number') return 'number';
    
    if (typeof value === 'string') {
      // Test si c'est une date
      const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
      if (datePattern.test(value) && !isNaN(Date.parse(value))) {
        return 'date';
      }
      
      // Test si c'est numérique (avec ou sans decimaux)
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return 'number';
      }
    }
    
    return 'string';
  }, []);

  // Fonction de tri intelligente
  const smartSort = useCallback((a, b, sortKey, direction, dataType) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    // Gestion des valeurs nulles/undefined
    if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1;
    if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1;
    if (aVal === bVal) return 0;
    
    let comparison = 0;
    
    switch (dataType) {
      case 'number': {
        const numA = parseFloat(aVal) || 0;
        const numB = parseFloat(bVal) || 0;
        comparison = numA - numB;
        break;
      }
      
      case 'date': {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      }
      
      case 'string':
      default: {
        const strA = String(aVal).toLowerCase().trim();
        const strB = String(bVal).toLowerCase().trim();
        comparison = strA.localeCompare(strB, 'fr', { numeric: true, sensitivity: 'base' });
        break;
      }
    }
    
    return direction === 'asc' ? comparison : -comparison;
  }, []);

  // Sauvegarde en localStorage (throttle pour performance)
  const saveToStorage = useCallback((states) => {
    if (!enableLocalStorage) return;
    
    const now = Date.now();
    if (now - lastSaveRef.current < 100) return; // Throttle 100ms
    
    try {
      const serializableStates = Array.from(states.entries()).map(([key, state]) => ({
        key,
        direction: state.direction,
        dataType: state.dataType,
        order: state.order
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableStates));
      lastSaveRef.current = now;
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des états de tri:', error);
    }
  }, [enableLocalStorage]);

  // Chargement depuis localStorage
  const loadFromStorage = useCallback(() => {
    if (!enableLocalStorage) return new Map();
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return new Map();
      
      const parsed = JSON.parse(saved);
      return new Map(parsed.map(item => [
        item.key,
        {
          direction: item.direction || 'asc',
          dataType: item.dataType || 'string',
          order: item.order || 0
        }
      ]));
    } catch (error) {
      console.warn('Erreur lors du chargement des états de tri:', error);
      return new Map();
    }
  }, [enableLocalStorage]);

  // Initialisation des états de tri
  useEffect(() => {
    const initialStates = loadFromStorage();
    if (initialStates.size === 0 && users.length > 0) {
      // Détection automatique des types de données pour les premiers utilisateurs
      const sampleUser = users[0];
      const autoStates = new Map();
      
      Object.keys(sampleUser).forEach((key, index) => {
        if (key === 'id') return;
        
        const sampleValue = sampleUser[key];
        const dataType = detectDataType(sampleValue, key);
        
        if (dataType !== 'unknown') {
          autoStates.set(key, {
            direction: index === 0 ? 'asc' : 'none',
            dataType,
            order: index === 0 ? 1 : 0
          });
        }
      });
      
      setSortStates(autoStates);
    } else {
      setSortStates(initialStates);
    }
  }, [users, loadFromStorage, detectDataType]);

  // Gestionnaire de clic sur en-tête
  const handleSortClick = useCallback((key) => {
    setIsAnimating(true);
    
    setSortStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(key) || { direction: 'none', dataType: 'string', order: 0 };
      
      // Cycle: none -> asc -> desc -> none
      let newDirection;
      if (currentState.direction === 'none') {
        newDirection = 'asc';
      } else if (currentState.direction === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = 'none';
      }
      
      // Réorganiser les ordres
      const updatedStates = new Map();
      let maxOrder = 0;
      
      newStates.forEach((state, stateKey) => {
        if (stateKey !== key && state.direction !== 'none') {
          updatedStates.set(stateKey, state);
          maxOrder = Math.max(maxOrder, state.order);
        }
      });
      
      if (newDirection !== 'none') {
        updatedStates.set(key, {
          direction: newDirection,
          dataType: currentState.dataType,
          order: maxOrder + 1
        });
      } else {
        // Supprimer et réorganiser
        newStates.delete(key);
        updatedStates.forEach((state, stateKey) => {
          if (state.order > currentState.order) {
            updatedStates.set(stateKey, { ...state, order: state.order - 1 });
          }
        });
      }
      
      saveToStorage(updatedStates);
      
      // Animation frame pour smooth transition
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setIsAnimating(false);
      });
      
      return updatedStates;
    });
  }, [saveToStorage]);

  // Reset des tris
  const handleReset = useCallback(() => {
    setIsAnimating(true);
    setSortStates(new Map());
    saveToStorage(new Map());
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  }, [animationDuration, saveToStorage]);

  // Obtention des indicateurs visuels
  const getSortIndicator = useCallback((key) => {
    const state = sortStates.get(key);
    if (!state || state.direction === 'none') {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    }
    
    return state.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  }, [sortStates]);

  // Obtention des ordres de tri pour affichage
  const getSortOrders = useCallback(() => {
    const orders = [];
    sortStates.forEach((state, key) => {
      if (state.direction !== 'none') {
        orders.push({ key, order: state.order, direction: state.direction });
      }
    });
    return orders.sort((a, b) => a.order - b.order);
  }, [sortStates]);

  // Tri des utilisateurs (optimisé avec useMemo)
  const sortedUsers = useMemo(() => {
    if (users.length === 0 || sortStates.size === 0) return users;
    
    const activeSorts = Array.from(sortStates.entries())
      .filter(([_, state]) => state.direction !== 'none')
      .sort((a, b) => a[1].order - b[1].order);
    
    if (activeSorts.length === 0) return users;
    
    return [...users].sort((a, b) => {
      for (const [key, state] of activeSorts) {
        const result = smartSort(a, b, key, state.direction, state.dataType);
        if (result !== 0) return result;
      }
      return 0;
    });
  }, [users, sortStates, smartSort]);

  // Notification du parent (debounced pour performance)
  useEffect(() => {
    if (onSort && !isAnimating) {
      const timeoutId = setTimeout(() => {
        onSort(sortedUsers, Array.from(sortStates.entries()));
      }, 50); // Debounce 50ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [sortedUsers, sortStates, onSort, isAnimating]);

  // Obtention des clés de tri disponibles
  const availableSortKeys = useMemo(() => {
    if (users.length === 0) return [];
    
    const sampleUser = users[0];
    return Object.keys(sampleUser)
      .filter(key => key !== 'id')
      .map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        dataType: detectDataType(sampleUser[key], key)
      }))
      .filter(item => item.dataType !== 'unknown');
  }, [users, detectDataType]);

  return (
    <div className={`users-sort-manager ${className}`}>
      {/* Barre d'outils de tri */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4 border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Tri multi-colonnes:</span>
          {getSortOrders().map(({ key, order, direction }, index) => (
            <div 
              key={key}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-${animationDuration}`}
              style={{
                backgroundColor: direction === 'asc' ? '#dbeafe' : '#fef3c7',
                color: direction === 'asc' ? '#1e40af' : '#92400e'
              }}
            >
              <span className="text-gray-600">#{order + 1}</span>
              <span className="font-semibold">{key}</span>
              {getSortIndicator(key)}
            </div>
          ))}
        </div>
        
        {showResetButton && sortStates.size > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors duration-200"
            disabled={isAnimating}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* En-têtes de colonnes cliquables */}
      <div className="overflow-x-auto">
        <div className="inline-flex space-x-1 min-w-full">
          {availableSortKeys.map(({ key, label, dataType }) => (
            <button
              key={key}
              onClick={() => handleSortClick(key)}
              className={`
                flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg
                transition-all duration-${animationDuration} whitespace-nowrap
                ${sortStates.has(key) && sortStates.get(key).direction !== 'none'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }
                ${isAnimating ? 'pointer-events-none opacity-75' : ''}
              `}
              disabled={isAnimating}
              title={`Trier par ${label} (${dataType})`}
            >
              <span>{label}</span>
              <div className="flex flex-col items-center">
                {getSortIndicator(key)}
                <span className="text-xs opacity-60 mt-1">{dataType}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques de tri */}
      <div className="mt-3 text-xs text-gray-500 flex items-center space-x-4">
        <span>Colonnes triées: {getSortOrders().length}</span>
        <span>Utilisateurs: {sortedUsers.length}</span>
        <span>Performance: {isAnimating ? 'Tri en cours...' : 'Prêt'}</span>
      </div>
    </div>
  );
};

export default UsersSortManager;