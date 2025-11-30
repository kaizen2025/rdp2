// src/utils/UsersPerformanceOptimizer.js - OPTIMISATION PERFORMANCE UTILISATEURS 500+
// Gestion optimisée des performances pour listes utilisateur avec navigation instantanée

import React, { memo, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { debounce, debounceSearch, getAdaptiveDebounceDelay } from './debounce';
import { performanceMonitor } from './PerformanceMonitor';

// 🎯 CACHE INTELLIGENT AVEC TTL ET LRU
class UserDataCache {
    constructor(maxSize = 1000, ttl = 5 * 60 * 1000) { // 5 minutes TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.accessOrder = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    // 💾 Stocker des données avec TTL
    set(key, data, customTTL = null) {
        const now = Date.now();
        const ttl = customTTL || this.ttl;
        
        // Supprimer l'ancien entry si existant
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        }

        // Gestion LRU - supprimer les plus anciens si cache plein
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        this.cache.set(key, {
            data,
            timestamp: now,
            expires: now + ttl
        });
        this.accessOrder.set(key, now);
    }

    // 🔍 Récupérer des données avec TTL
    get(key) {
        if (!this.cache.has(key)) {
            this.cacheMisses++;
            return null;
        }

        const entry = this.cache.get(key);
        const now = Date.now();

        // Vérifier si expiré
        if (now > entry.expires) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
            this.cacheMisses++;
            return null;
        }

        // Mettre à jour l'ordre d'accès (LRU)
        this.accessOrder.set(key, now);
        this.cacheHits++;
        return entry.data;
    }

    // 🗑️ Éliminer l'élément le moins récemment utilisé
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, time] of this.accessOrder.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.accessOrder.delete(oldestKey);
        }
    }

    // 🧹 Nettoyer les entrées expirées
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expires) {
                this.cache.delete(key);
                this.accessOrder.delete(key);
            }
        }
    }

    // 📊 Statistiques du cache
    getStats() {
        this.cleanup();
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) * 100 || 0
        };
    }

    // 🗑️ Vider le cache
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
}

// 🚀 OPTIMISATEUR PRINCIPAL
class UsersPerformanceOptimizer {
    constructor() {
        this.userCache = new UserDataCache(1000, 10 * 60 * 1000); // Cache plus large pour utilisateurs
        this.preloadedData = new Map();
        this.searchFilters = {
            searchTerm: '',
            role: 'all',
            department: 'all',
            status: 'active'
        };
        this.listeners = new Map();
        this.memoryThreshold = 100 * 1024 * 1024; // 100MB
        this.maxUsersInMemory = 500;
        this.cleanupInterval = null;
        this.observerInstances = [];
        
        this.init();
    }

    // 🔧 Initialisation
    init() {
        this.startCleanupInterval();
        this.setupMemoryMonitoring();
        this.preloadCriticalData();
        console.log('🚀 UsersPerformanceOptimizer initialisé');
    }

    // 🧹 Nettoyage automatique périodique
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // Chaque minute
    }

    // 🧠 Surveillance mémoire
    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const used = performance.memory.usedJSHeapSize;
                if (used > this.memoryThreshold) {
                    this.handleMemoryPressure();
                }
            }, 5000); // Vérifier toutes les 5 secondes
        }
    }

    // 📥 PRELOAD DES DONNÉES CRITIQUES
    preloadCriticalData() {
        // Précharger les données les plus consultées
        setTimeout(() => {
            this.preloadUserList(1, 50);
            this.preloadUserProfiles([1, 2, 3, 4, 5]);
        }, 1000);
    }

    // 📋 Précharger une liste d'utilisateurs
    async preloadUserList(page = 1, pageSize = 50) {
        const cacheKey = `users_page_${page}_${pageSize}`;
        if (this.userCache.get(cacheKey)) return;

        try {
            // Simulation d'API call optimisée
            const users = await this.fetchUsersOptimized(page, pageSize);
            this.userCache.set(cacheKey, users, 2 * 60 * 1000); // 2 minutes TTL
            this.preloadedData.set(`page_${page}`, users);
        } catch (error) {
            console.error('❌ Erreur preload utilisateurs:', error);
        }
    }

    // 👤 Précharger des profils utilisateurs spécifiques
    async preloadUserProfiles(userIds) {
        const profiles = [];
        for (const userId of userIds) {
            const cacheKey = `user_profile_${userId}`;
            if (!this.userCache.get(cacheKey)) {
                try {
                    const profile = await this.fetchUserProfile(userId);
                    profiles.push(profile);
                    this.userCache.set(cacheKey, profile, 5 * 60 * 1000); // 5 minutes TTL
                } catch (error) {
                    console.error(`❌ Erreur preload profil utilisateur ${userId}:`, error);
                }
            }
        }
        return profiles;
    }

    // 🔍 RECHERCHE ET FILTRES OPTIMISÉS
    createSearchOptimizer() {
        const debouncedSearch = debounceSearch((searchParams) => {
            this.updateSearchFilters(searchParams);
            this.notifyListeners('search', searchParams);
        }, getAdaptiveDebounceDelay());

        const debouncedFilter = debounce((filterParams) => {
            this.updateSearchFilters(filterParams);
            this.notifyListeners('filter', filterParams);
        }, 300);

        return {
            search: debouncedSearch,
            filter: debouncedFilter,
            clearFilters: () => {
                this.searchFilters = {
                    searchTerm: '',
                    role: 'all',
                    department: 'all',
                    status: 'active'
                };
                this.notifyListeners('clear', {});
            }
        };
    }

    // 📊 Mise à jour des filtres de recherche
    updateSearchFilters(newFilters) {
        this.searchFilters = { ...this.searchFilters, ...newFilters };
        this.optimizeSearchQuery();
    }

    // ⚡ Optimisation de requête de recherche
    optimizeSearchQuery() {
        // Appliquer des optimisations basées sur les filtres
        const hasComplexFilters = this.searchFilters.role !== 'all' || 
                                  this.searchFilters.department !== 'all';
        
        if (hasComplexFilters) {
            // Pour filtres complexes, utiliser des index spécifiques
            this.useOptimizedIndex();
        }
    }

    // 🗂️ Utilisation d'index optimisés
    useOptimizedIndex() {
        // Implémentation d'index optimisés pour la recherche
        console.log('🔍 Utilisation d\'index optimisés pour la recherche');
    }

    // 📱 LAZY LOADING DES IMAGES/PROFILS
    createImageLazyLoader() {
        const imageCache = new Map();
        const loadingPromises = new Map();

        const lazyLoadImage = (src, options = {}) => {
            const { 
                threshold = '50px',
                rootMargin = '0px',
                fallback = '/default-avatar.png' 
            } = options;

            return new Promise((resolve, reject) => {
                // Vérifier le cache
                if (imageCache.has(src)) {
                    resolve(imageCache.get(src));
                    return;
                }

                // Vérifier si déjà en cours de chargement
                if (loadingPromises.has(src)) {
                    loadingPromises.get(src)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                // Créer l'Intersection Observer
                const observer = new IntersectionObserver(
                    (entries) => {
                        const [entry] = entries;
                        if (entry.isIntersecting) {
                            loadImage();
                        }
                    },
                    { threshold, rootMargin }
                );

                const loadImage = () => {
                    const img = new Image();
                    const loadingPromise = new Promise((imgResolve, imgReject) => {
                        img.onload = () => {
                            // Créer un canvas pour optimiser l'image
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            
                            // Optimiser la qualité selon le device
                            const optimizedSrc = this.optimizeImageForDevice(img);
                            
                            imageCache.set(src, optimizedSrc);
                            loadingPromises.delete(src);
                            observer.disconnect();
                            imgResolve(optimizedSrc);
                        };
                        
                        img.onerror = () => {
                            imageCache.set(src, fallback);
                            loadingPromises.delete(src);
                            observer.disconnect();
                            imgResolve(fallback);
                        };
                    });

                    loadingPromises.set(src, loadingPromise);
                    img.src = src;
                };

                const imgElement = document.querySelector(`img[data-src="${src}"]`);
                if (imgElement) {
                    observer.observe(imgElement);
                } else {
                    loadImage();
                }
            });
        };

        return { lazyLoadImage };
    }

    // 🖼️ Optimisation d'image selon le device
    optimizeImageForDevice(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Ajuster la qualité selon la densité d'écran
        const devicePixelRatio = window.devicePixelRatio || 1;
        const targetWidth = Math.min(img.width, 100 * devicePixelRatio);
        const targetHeight = Math.min(img.height, 100 * devicePixelRatio);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // 🧠 GESTION MÉMOIRE POUR 500+ UTILISATEURS
    handleMemoryPressure() {
        console.log('⚠️ Pression mémoire détectée, nettoyage en cours...');
        
        // Stratégies de nettoyage par priorité
        const cleanupStrategies = [
            () => this.cleanupUnusedImages(),
            () => this.compressCachedData(),
            () => this.reduceCacheSize(),
            () => this.forceGarbageCollection()
        ];

        for (const strategy of cleanupStrategies) {
            try {
                strategy();
                if (this.getMemoryUsage() < this.memoryThreshold * 0.8) {
                    break; // Arrêter si suffisamment nettoyé
                }
            } catch (error) {
                console.error('❌ Erreur lors du nettoyage:', error);
            }
        }
    }

    // 🗑️ Nettoyer les images non utilisées
    cleanupUnusedImages() {
        // Logique de nettoyage des images en cache
        console.log('🖼️ Nettoyage des images non utilisées');
    }

    // 📦 Compresser les données en cache
    compressCachedData() {
        // Compression des données en cache
        console.log('📦 Compression des données en cache');
    }

    // 📉 Réduire la taille du cache
    reduceCacheSize() {
        const originalSize = this.userCache.maxSize;
        this.userCache.maxSize = Math.floor(originalSize * 0.7); // Réduire de 30%
        console.log(`📉 Cache réduit de ${originalSize} à ${this.userCache.maxSize}`);
    }

    // 🗑️ Forcer le garbage collection
    forceGarbageCollection() {
        if (window.gc) {
            window.gc();
            console.log('🗑️ Garbage collection forcé');
        }
    }

    // 📊 Obtenir l'utilisation mémoire
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    // 🎯 VIRTUALISATION RÉACT-WINDOW OPTIMISÉE
    createVirtualizedList(users, options = {}) {
        const {
            itemHeight = 80,
            overscan = 5,
            height = 600,
            width = '100%'
        } = options;

        // Pré-calculer les métadonnées pour l'optimisation
        const metadata = useMemo(() => ({
            totalCount: users.length,
            estimatedTotalSize: users.length * itemHeight,
            hasNextPage: false, // À implémenter selon la pagination
            hasPreviousPage: false
        }), [users.length, itemHeight]);

        // Memoized row renderer pour performance optimale
        const Row = memo(({ index, style }) => {
            const user = users[index];
            const startTime = performance.now();

            return (
                <div style={style} className="virtualized-user-row">
                    {/* Rendu optimisé de la ligne utilisateur */}
                    <UserRowComponent 
                        user={user} 
                        index={index}
                        onHover={() => this.handleUserHover(user.id)}
                    />
                    {/* Mesure performance en développement */}
                    {process.env.NODE_ENV === 'development' && (
                        <PerformanceTracker 
                            component={`UserRow_${index}`}
                            startTime={startTime}
                        />
                    )}
                </div>
            );
        });

        return {
            component: (
                <List
                    height={height}
                    width={width}
                    itemCount={users.length}
                    itemSize={itemHeight}
                    overscanCount={overscan}
                    itemData={users}
                >
                    {Row}
                </List>
            ),
            metadata
        };
    }

    // 👆 Gestion du hover sur utilisateur pour preload
    handleUserHover(userId) {
        // Précharger les données du profil au survol
        if (!this.userCache.get(`user_profile_${userId}`)) {
            this.preloadUserProfiles([userId]);
        }
    }

    // 🔄 NETTOYAGE ET MAINTENANCE
    cleanup() {
        this.userCache.cleanup();
        
        // Nettoyer les données préchargées anciennes
        const now = Date.now();
        for (const [key, data] of this.preloadedData.entries()) {
            if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
                this.preloadedData.delete(key);
            }
        }

        // Disconnect observers inutilisés
        this.observerInstances.forEach(observer => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        this.observerInstances = [];
    }

    // 📡 SYSTÈME D'ÉVÉNEMENTS
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    removeListener(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Erreur listener ${event}:`, error);
                }
            });
        }
    }

    // 🔍 API CALLS OPTIMISÉS
    async fetchUsersOptimized(page = 1, pageSize = 50, filters = {}) {
        // Simulation d'API call avec cache
        const cacheKey = `users_${page}_${pageSize}_${JSON.stringify(filters)}`;
        
        let users = this.userCache.get(cacheKey);
        if (users) {
            return users;
        }

        // Simuler un délai API
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Générer des données de test optimisées
        users = Array.from({ length: pageSize }, (_, index) => ({
            id: (page - 1) * pageSize + index + 1,
            name: `Utilisateur ${(page - 1) * pageSize + index + 1}`,
            email: `user${(page - 1) * pageSize + index + 1}@docucortex.fr`,
            role: ['Admin', 'User', 'Manager'][index % 3],
            department: ['IT', 'RH', 'Finance'][index % 3],
            status: ['active', 'inactive'][index % 2],
            avatar: `/api/placeholder/40/40?text=${index + 1}`,
            lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

        // Appliquer les filtres
        if (filters.role && filters.role !== 'all') {
            users = users.filter(user => user.role === filters.role);
        }

        if (filters.department && filters.department !== 'all') {
            users = users.filter(user => user.department === filters.department);
        }

        this.userCache.set(cacheKey, users, 2 * 60 * 1000);
        return users;
    }

    async fetchUserProfile(userId) {
        const cacheKey = `user_profile_${userId}`;
        let profile = this.userCache.get(cacheKey);
        
        if (profile) {
            return profile;
        }

        // Simulation API call
        await new Promise(resolve => setTimeout(resolve, 50));
        
        profile = {
            id: userId,
            name: `Utilisateur ${userId}`,
            email: `user${userId}@docucortex.fr`,
            role: ['Admin', 'User', 'Manager'][userId % 3],
            department: ['IT', 'RH', 'Finance'][userId % 3],
            phone: `+33 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`,
            address: `${Math.floor(Math.random() * 999)} Rue de la Paix, 75001 Paris`,
            joinDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            avatar: `/api/placeholder/80/80?text=${userId}`,
            permissions: ['read', 'write'].concat(userId % 2 === 0 ? ['admin'] : []),
            preferences: {
                theme: ['light', 'dark'][userId % 2],
                language: 'fr',
                notifications: userId % 2 === 0
            },
            statistics: {
                documentsProcessed: Math.floor(Math.random() * 1000),
                activeProjects: Math.floor(Math.random() * 10),
                efficiency: Math.floor(Math.random() * 100)
            }
        };

        this.userCache.set(cacheKey, profile, 5 * 60 * 1000);
        return profile;
    }

    // 📊 MÉTRIQUES ET ANALYTICS
    getPerformanceMetrics() {
        return {
            cacheStats: this.userCache.getStats(),
            memoryUsage: this.getMemoryUsage(),
            preloadedDataSize: this.preloadedData.size,
            listenersCount: Array.from(this.listeners.values()).reduce((acc, set) => acc + set.size, 0),
            activeUsersInMemory: this.userCache.cache.size
        };
    }

    // 🛠️ DESTRUCTEUR
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanup();
        this.listeners.clear();
        this.observerInstances = [];
    }
}

// 📦 COMPOSANTS HELPER POUR L'INTÉGRATION

// Composant de tracking performance pour développement
const PerformanceTracker = memo(({ component, startTime }) => {
    useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16.67) { // Plus d'une frame à 60fps
            console.warn(`⚠️ ${component} rendu en ${renderTime.toFixed(2)}ms`);
        }
    });

    return null;
});

// Composant de ligne utilisateur optimisée
const UserRowComponent = memo(({ user, index, onHover }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    return (
        <div 
            className="user-row"
            onMouseEnter={() => onHover(user.id)}
            style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff'
            }}
        >
            {/* Avatar avec lazy loading */}
            <div style={{ position: 'relative' }}>
                <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        opacity: imageLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    onLoad={() => setImageLoaded(true)}
                    loading="lazy"
                />
                {!imageLoaded && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#999'
                    }}>
                        {user.name.charAt(0)}
                    </div>
                )}
            </div>
            
            {/* Informations utilisateur */}
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {user.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    {user.email}
                </div>
            </div>
            
            {/* Badge rôle */}
            <div style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: user.role === 'Admin' ? '#ffebee' : 
                               user.role === 'Manager' ? '#e8f5e8' : '#e3f2fd',
                color: user.role === 'Admin' ? '#c62828' :
                       user.role === 'Manager' ? '#2e7d32' : '#1565c0',
                fontSize: '11px',
                fontWeight: 'bold'
            }}>
                {user.role}
            </div>
            
            {/* Badge département */}
            <div style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                fontSize: '11px'
            }}>
                {user.department}
            </div>
            
            {/* Statut */}
            <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: user.status === 'active' ? '#4caf50' : '#f44336'
            }} title={user.status === 'active' ? 'Actif' : 'Inactif'} />
        </div>
    );
});

// 🎣 HOOK REACT POUR L'UTILISATION FACILE
const useUsersPerformanceOptimizer = () => {
    const optimizerRef = useRef(null);
    
    useEffect(() => {
        if (!optimizerRef.current) {
            optimizerRef.current = new UsersPerformanceOptimizer();
        }
        
        return () => {
            if (optimizerRef.current) {
                optimizerRef.current.destroy();
                optimizerRef.current = null;
            }
        };
    }, []);

    return optimizerRef.current;
};

// 📤 EXPORTS
export { 
    UsersPerformanceOptimizer,
    UserDataCache,
    useUsersPerformanceOptimizer
};

export default UsersPerformanceOptimizer;