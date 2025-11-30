// src/components/users/OptimizedUsersList.jsx - EXEMPLE D'UTILISATION
// Composant optimisé utilisant UsersPerformanceOptimizer

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UsersPerformanceOptimizer } from '../../utils/UsersPerformanceOptimizer';
import { performanceMonitor } from '../../utils/PerformanceMonitor';

const OptimizedUsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        role: 'all',
        department: 'all',
        status: 'active'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);

    // Initialiser l'optimiseur
    const optimizer = useMemo(() => new UsersPerformanceOptimizer(), []);

    // Créer les optimiseurs de recherche et filtres
    const searchOptimizer = useMemo(() => optimizer.createSearchOptimizer(), [optimizer]);
    const { lazyLoadImage } = useMemo(() => optimizer.createImageLazyLoader(), [optimizer]);

    // Surveillance performance
    const { getMetrics } = performanceMonitor.usePerformanceMonitoring('OptimizedUsersList');

    // Charger les utilisateurs avec optimisation
    const loadUsers = useCallback(async (page = 1, newFilters = {}) => {
        setLoading(true);
        try {
            const startTime = performance.now();
            const userData = await optimizer.fetchUsersOptimized(page, pageSize, newFilters);
            
            // Appliquer recherche locale si terme présent
            let filteredData = userData;
            if (searchTerm) {
                filteredData = userData.filter(user =>
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setUsers(filteredData);
            setCurrentPage(page);
            
            // Précharger la page suivante
            if (page === 1) {
                optimizer.preloadUserList(2, pageSize);
            }

            // Métriques de performance
            const renderTime = performance.now() - startTime;
            console.log(`⚡ Utilisateurs chargés en ${renderTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('❌ Erreur chargement utilisateurs:', error);
        } finally {
            setLoading(false);
        }
    }, [optimizer, searchTerm, pageSize]);

    // Effet initial
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Effet pour les filtres
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadUsers(1, filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters, loadUsers]);

    // Gestion recherche avec debounce
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
        searchOptimizer.search({ searchTerm: term });
    }, [searchOptimizer]);

    // Gestion filtres avec debounce
    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
        searchOptimizer.filter(newFilters);
    }, [searchOptimizer]);

    // Créer la liste virtualisée
    const { component: VirtualizedList, metadata } = useMemo(() => {
        return optimizer.createVirtualizedList(users, {
            itemHeight: 80,
            overscan: 5,
            height: 600,
            width: '100%'
        });
    }, [optimizer, users]);

    // Nettoyage
    useEffect(() => {
        return () => {
            optimizer.destroy();
        };
    }, [optimizer]);

    // Obtenir les métriques
    const metrics = getMetrics();
    const perfMetrics = optimizer.getPerformanceMetrics();

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header avec métriques */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#333' }}>
                        👥 Gestion des Utilisateurs Optimisée
                    </h2>
                    <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                        {users.length} utilisateurs • Page {currentPage}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                    <span>📊 FPS: {metrics.fps.toFixed(0)}</span>
                    <span>🧠 Mémoire: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                    <span>⚡ Rendu: {metrics.renderTime.toFixed(1)}ms</span>
                    <span>💾 Cache: {perfMetrics.cacheStats.hitRate.toFixed(1)}%</span>
                </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
            }}>
                {/* Recherche */}
                <input
                    type="text"
                    placeholder="🔍 Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />

                {/* Filtre rôle */}
                <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange({ ...filters, role: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="all">Tous les rôles</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                </select>

                {/* Filtre département */}
                <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange({ ...filters, department: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="all">Tous les départements</option>
                    <option value="IT">IT</option>
                    <option value="RH">RH</option>
                    <option value="Finance">Finance</option>
                </select>

                {/* Filtre statut */}
                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                    <option value="all">Tous</option>
                </select>
            </div>

            {/* Liste virtualisée */}
            <div style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ marginTop: '10px' }}>Chargement des utilisateurs...</p>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <>
                        {VirtualizedList}
                        <div style={{
                            padding: '16px',
                            textAlign: 'center',
                            backgroundColor: '#f9f9f9',
                            borderTop: '1px solid #e0e0e0',
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            📈 Liste virtualisée • {metadata.totalCount} éléments • 
                            Taille estimée: {Math.round(metadata.estimatedTotalSize / 1024)}KB
                        </div>
                    </>
                )}
            </div>

            {/* Statistiques avancées */}
            <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#f0f8ff',
                border: '1px solid #b3d9ff',
                borderRadius: '8px',
                fontSize: '12px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>
                    📊 Statistiques de Performance
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div>
                        <strong>Cache:</strong><br />
                        Hit Rate: {perfMetrics.cacheStats.hitRate.toFixed(1)}%<br />
                        Taille: {perfMetrics.cacheStats.size}/{perfMetrics.cacheStats.maxSize}
                    </div>
                    <div>
                        <strong>Mémoire:</strong><br />
                        Utilisé: {(perfMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB<br />
                        Seuil: {(100).toFixed(0)}MB
                    </div>
                    <div>
                        <strong>Préchargement:</strong><br />
                        Données préchargées: {perfMetrics.preloadedDataSize}<br />
                        Listeners actifs: {perfMetrics.listenersCount}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptimizedUsersList;