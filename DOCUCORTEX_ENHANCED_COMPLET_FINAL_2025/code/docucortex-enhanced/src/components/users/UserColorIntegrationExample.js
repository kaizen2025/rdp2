// src/components/users/UserColorIntegrationExample.js - Exemple d'utilisation pratique
// Démonstration complète de l'intégration des couleurs utilisateur

import React, { useState, useEffect } from 'react';
import { UserColorIntegration, useUserColorIntegration } from './UserColorIntegration';
import { UserColorBadgeOptimized, UserColorLegendEnhanced } from './UserColorManagerOptimized';

// Données d'exemple pour la démonstration
const SAMPLE_USERS = [
    {
        id: 1,
        userName: 'marie.dubois',
        displayName: 'Marie Dubois',
        email: 'marie.dubois@company.com',
        department: 'Direction',
        role: 'Directeur',
        category: 'admin',
        status: 'active',
        lastLogin: '2025-11-15T10:30:00Z',
        avatar: null
    },
    {
        id: 2,
        userName: 'pierre.martin',
        displayName: 'Pierre Martin',
        email: 'pierre.martin@company.com',
        department: 'IT',
        role: 'Chef_service',
        category: 'developer',
        status: 'active',
        lastLogin: '2025-11-15T09:15:00Z',
        avatar: null
    },
    {
        id: 3,
        userName: 'sophie.leroy',
        displayName: 'Sophie Leroy',
        email: 'sophie.leroy@company.com',
        department: 'RH',
        role: 'Responsable',
        category: 'manager',
        status: 'active',
        lastLogin: '2025-11-15T08:45:00Z',
        avatar: null
    },
    {
        id: 4,
        userName: 'julien.roux',
        displayName: 'Julien Roux',
        email: 'julien.roux@company.com',
        department: 'Finance',
        role: 'Manager',
        category: 'user',
        status: 'active',
        lastLogin: '2025-11-14T16:20:00Z',
        avatar: null
    },
    {
        id: 5,
        userName: 'claire.moreau',
        displayName: 'Claire Moreau',
        email: 'claire.moreau@company.com',
        department: 'Marketing',
        role: 'Expert',
        category: 'designer',
        status: 'active',
        lastLogin: '2025-11-15T11:00:00Z',
        avatar: null
    },
    {
        id: 6,
        userName: 'antoine.bernard',
        displayName: 'Antoine Bernard',
        email: 'antoine.bernard@company.com',
        department: 'Commercial',
        role: 'Consultant',
        category: 'consultant',
        status: 'active',
        lastLogin: '2025-11-15T07:30:00Z',
        avatar: null
    },
    {
        id: 7,
        userName: 'laura.garcia',
        displayName: 'Laura Garcia',
        email: 'laura.garcia@company.com',
        department: 'Support',
        role: 'Assistant',
        category: 'user',
        status: 'inactive',
        lastLogin: '2025-11-10T14:15:00Z',
        avatar: null
    },
    {
        id: 8,
        userName: 'nicolas.petit',
        displayName: 'Nicolas Petit',
        email: 'nicolas.petit@company.com',
        department: 'Formation',
        role: 'Stagiaire',
        category: 'guest',
        status: 'active',
        lastLogin: '2025-11-15T12:00:00Z',
        avatar: null
    },
    {
        id: 9,
        userName: 'emilie.durand',
        displayName: 'Émilie Durand',
        email: 'emilie.durand@company.com',
        department: 'Juridique',
        role: 'Expert',
        category: 'user',
        status: 'active',
        lastLogin: '2025-11-15T10:45:00Z',
        avatar: null
    },
    {
        id: 10,
        userName: 'thomas.moreau',
        displayName: 'Thomas Moreau',
        email: 'thomas.moreau@company.com',
        department: 'IT',
        role: 'Developer',
        category: 'developer',
        status: 'active',
        lastLogin: '2025-11-15T13:20:00Z',
        avatar: null
    }
];

/**
 * Composant d'exemple principal démontrant toutes les fonctionnalités
 */
export const UserColorIntegrationExample = () => {
    const [selectedView, setSelectedView] = useState('integration'); // 'integration', 'badges', 'legend'
    const [customUsers, setCustomUsers] = useState(SAMPLE_USERS);
    const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);

    return (
        <div style={{ 
            padding: '20px', 
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* En-tête de démonstration */}
            <header style={{ 
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <h1 style={{ 
                    margin: '0 0 10px 0',
                    color: '#333',
                    fontSize: '28px',
                    fontWeight: 'bold'
                }}>
                    🎨 UserColorIntegration.js - Démonstration Complète
                </h1>
                <p style={{ 
                    margin: '0',
                    color: '#666',
                    fontSize: '16px',
                    lineHeight: '1.5'
                }}>
                    Découvrez toutes les fonctionnalités d'intégration visuelle des couleurs : 
                    palette intelligente, accessibilité daltonisme, animations, filtres avancés et export/import.
                </p>
                
                {/* Navigation entre les vues */}
                <div style={{ 
                    marginTop: '20px',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                }}>
                    {[
                        { key: 'integration', label: 'Intégration Complète', icon: '🎯' },
                        { key: 'badges', label: 'Badges Optimisés', icon: '🏷️' },
                        { key: 'legend', label: 'Légende Avancée', icon: '📊' },
                        { key: 'analytics', label: 'Analytics Couleurs', icon: '📈' }
                    ].map(view => (
                        <button
                            key={view.key}
                            onClick={() => setSelectedView(view.key)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: selectedView === view.key ? '#2196F3' : 'white',
                                color: selectedView === view.key ? 'white' : '#333',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>{view.icon}</span>
                            {view.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Vue intégration complète */}
            {selectedView === 'integration' && (
                <IntegrationCompleteView 
                    users={customUsers}
                    showAdvancedFeatures={showAdvancedFeatures}
                />
            )}

            {/* Vue badges optimisés */}
            {selectedView === 'badges' && (
                <BadgesDemoView users={customUsers} />
            )}

            {/* Vue légende avancée */}
            {selectedView === 'legend' && (
                <LegendDemoView users={customUsers} />
            )}

            {/* Vue analytics */}
            {selectedView === 'analytics' && (
                <AnalyticsDemoView users={customUsers} />
            )}

            {/* Contrôles globaux */}
            <GlobalControls 
                customUsers={customUsers}
                setCustomUsers={setCustomUsers}
                showAdvancedFeatures={showAdvancedFeatures}
                setShowAdvancedFeatures={setShowAdvancedFeatures}
            />
        </div>
    );
};

/**
 * Vue de l'intégration complète avec toutes les fonctionnalités
 */
const IntegrationCompleteView = ({ users, showAdvancedFeatures }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [integrationOptions, setIntegrationOptions] = useState({
        palette: 'departments',
        accessibility: 'AA',
        colorblindAdaptation: true,
        animationEnabled: true,
        intensity: 0.8,
        showFilters: true,
        showLegend: true,
        showAnalytics: true
    });

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        console.log('Utilisateur sélectionné:', user);
    };

    const handleExport = (exportData) => {
        console.log('Export des couleurs:', exportData);
    };

    return (
        <div style={{ marginBottom: '30px' }}>
            {/* Configuration des options */}
            {showAdvancedFeatures && (
                <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>
                        ⚙️ Configuration des Couleurs
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                Palette
                            </label>
                            <select
                                value={integrationOptions.palette}
                                onChange={(e) => setIntegrationOptions({...integrationOptions, palette: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="primary">Palette Primaire</option>
                                <option value="departments">Par Département</option>
                                <option value="categories">Par Catégorie</option>
                                <option value="roles">Par Rôle</option>
                                <option value="accessible">Accessibilité</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                Accessibilité
                            </label>
                            <select
                                value={integrationOptions.accessibility}
                                onChange={(e) => setIntegrationOptions({...integrationOptions, accessibility: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="AA">WCAG AA</option>
                                <option value="AAA">WCAG AAA</option>
                                <option value="AALarge">AA Large</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                Intensité
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={integrationOptions.intensity}
                                onChange={(e) => setIntegrationOptions({...integrationOptions, intensity: parseFloat(e.target.value)})}
                                style={{ width: '100%' }}
                            />
                            <span style={{ fontSize: '11px' }}>{integrationOptions.intensity}</span>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                Options d'Affichage
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {['showFilters', 'showLegend', 'showAnalytics', 'colorblindAdaptation', 'animationEnabled'].map(option => (
                                    <label key={option} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="checkbox"
                                            checked={integrationOptions[option]}
                                            onChange={(e) => setIntegrationOptions({...integrationOptions, [option]: e.target.checked})}
                                        />
                                        {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Composant d'intégration principal */}
            <UserColorIntegration
                users={users}
                onUserSelect={handleUserSelect}
                showFilters={integrationOptions.showFilters}
                showLegend={integrationOptions.showLegend}
                showAnalytics={integrationOptions.showAnalytics}
                {...integrationOptions}
                style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px'
                }}
            />

            {/* Détails de l'utilisateur sélectionné */}
            {selectedUser && (
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
                        👤 Utilisateur Sélectionné
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                        <div><strong>Nom:</strong> {selectedUser.displayName}</div>
                        <div><strong>Email:</strong> {selectedUser.email}</div>
                        <div><strong>Département:</strong> {selectedUser.department}</div>
                        <div><strong>Rôle:</strong> {selectedUser.role}</div>
                        <div><strong>Catégorie:</strong> {selectedUser.category}</div>
                        <div><strong>Statut:</strong> {selectedUser.status}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Démonstration des badges optimisés
 */
const BadgesDemoView = ({ users }) => {
    const [badgeOptions, setBadgeOptions] = useState({
        size: 'medium',
        variant: 'solid',
        showIcon: true,
        showContrast: true,
        palette: 'primary',
        accessibility: 'AA'
    });

    return (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                🏷️ Badges Utilisateurs Optimisés
            </h3>
            
            {/* Configuration des badges */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
            }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                    Configuration des Badges
                </h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Taille
                        </label>
                        <select
                            value={badgeOptions.size}
                            onChange={(e) => setBadgeOptions({...badgeOptions, size: e.target.value})}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Variante
                        </label>
                        <select
                            value={badgeOptions.variant}
                            onChange={(e) => setBadgeOptions({...badgeOptions, variant: e.target.value})}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="solid">Solide</option>
                            <option value="outlined">Contour</option>
                            <option value="gradient">Dégradé</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Palette
                        </label>
                        <select
                            value={badgeOptions.palette}
                            onChange={(e) => setBadgeOptions({...badgeOptions, palette: e.target.value})}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="primary">Primaire</option>
                            <option value="departments">Départements</option>
                            <option value="categories">Catégories</option>
                            <option value="roles">Rôles</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grille de badges */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
            }}>
                {users.slice(0, 8).map(user => (
                    <div key={user.id} style={{
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px'
                    }}>
                        <UserColorBadgeOptimized
                            userId={user.id}
                            userName={user.userName}
                            displayName={user.displayName}
                            size={badgeOptions.size}
                            variant={badgeOptions.variant}
                            showIcon={badgeOptions.showIcon}
                            showContrast={badgeOptions.showContrast}
                            palette={badgeOptions.palette}
                            accessibility={badgeOptions.accessibility}
                            style={{ width: '100%', justifyContent: 'center' }}
                        />
                        <div style={{ 
                            marginTop: '8px', 
                            fontSize: '11px', 
                            color: '#666',
                            textAlign: 'center'
                        }}>
                            {user.department} • {user.role}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Démonstration de la légende avancée
 */
const LegendDemoView = ({ users }) => {
    const [legendOptions, setLegendOptions] = useState({
        compact: false,
        showVariants: true,
        accessibility: 'AA',
        maxHeight: 300
    });

    return (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                📊 Légende des Couleurs Avancée
            </h3>

            {/* Configuration de la légende */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
            }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                    Configuration de la Légende
                </h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Mode
                        </label>
                        <select
                            value={legendOptions.compact ? 'compact' : 'normal'}
                            onChange={(e) => setLegendOptions({...legendOptions, compact: e.target.value === 'compact'})}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="normal">Normal</option>
                            <option value="compact">Compact</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Accessibilité
                        </label>
                        <select
                            value={legendOptions.accessibility}
                            onChange={(e) => setLegendOptions({...legendOptions, accessibility: e.target.value})}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="AA">WCAG AA</option>
                            <option value="AAA">WCAG AAA</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Variantes
                        </label>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                                type="checkbox"
                                checked={legendOptions.showVariants}
                                onChange={(e) => setLegendOptions({...legendOptions, showVariants: e.target.checked})}
                            />
                            Afficher les variantes
                        </label>
                    </div>
                </div>
            </div>

            {/* Légende enhance */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px'
            }}>
                <UserColorLegendEnhanced
                    users={users}
                    title={`Légende des Utilisateurs (${users.length} utilisateurs)`}
                    compact={legendOptions.compact}
                    showVariants={legendOptions.showVariants}
                    accessibility={legendOptions.accessibility}
                    maxHeight={legendOptions.maxHeight}
                />
            </div>
        </div>
    );
};

/**
 * Démonstration des analytics de couleurs
 */
const AnalyticsDemoView = ({ users }) => {
    const { 
        users: filteredUsers, 
        generateContextualColors, 
        optimizeColorDistribution,
        getUniqueColors 
    } = useUserColorIntegration(users);

    const optimization = optimizeColorDistribution();
    const uniqueColors = getUniqueColors();

    return (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                📈 Analytics et Optimisation des Couleurs
            </h3>

            {/* Métriques générales */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976D2' }}>
                        {users.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        Utilisateurs Total
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#388E3C' }}>
                        {uniqueColors.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        Couleurs Uniques
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F57C00' }}>
                        {optimization.avgUsage.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        Utilisation Moyenne
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#fce4ec',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#C2185B' }}>
                        {optimization.recommendations.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        Recommandations
                    </div>
                </div>
            </div>

            {/* Analyse détaillée */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px'
            }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                    Analyse Détaillée
                </h4>

                {/* Distribution des couleurs */}
                <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                        Distribution des Couleurs
                    </h5>
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        maxHeight: '200px',
                        overflow: 'auto'
                    }}>
                        {Object.entries(optimization.colorDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .map(([color, count]) => {
                                const percentage = (count / users.length * 100).toFixed(1);
                                return (
                                    <div
                                        key={color}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: color + '20',
                                            borderRadius: '6px',
                                            border: `1px solid ${color}`
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                backgroundColor: color,
                                                borderRadius: '3px'
                                            }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                                {count} utilisateurs
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#666' }}>
                                                {percentage}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* Recommandations */}
                {optimization.recommendations.length > 0 && (
                    <div>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                            Recommandations d'Optimisation
                        </h5>
                        {optimization.recommendations.map((rec, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '12px',
                                    backgroundColor: '#fff3e0',
                                    border: '1px solid #ffb74d',
                                    borderRadius: '6px',
                                    marginBottom: '8px'
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e65100' }}>
                                    {rec.type === 'redistribution' ? '🔄' : '🎨'} {rec.type}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    {rec.message}
                                </div>
                                {rec.colors && (
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                        Couleurs concernées: {rec.colors.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Contrôles globaux pour la démonstration
 */
const GlobalControls = ({ 
    customUsers, 
    setCustomUsers, 
    showAdvancedFeatures, 
    setShowAdvancedFeatures 
}) => {
    const [newUser, setNewUser] = useState({
        userName: '',
        displayName: '',
        department: 'IT',
        role: 'User',
        category: 'user'
    });

    const addUser = () => {
        if (newUser.userName && newUser.displayName) {
            const user = {
                id: Date.now(),
                email: `${newUser.userName}@company.com`,
                status: 'active',
                lastLogin: new Date().toISOString(),
                avatar: null,
                ...newUser
            };
            setCustomUsers([...customUsers, user]);
            setNewUser({ userName: '', displayName: '', department: 'IT', role: 'User', category: 'user' });
        }
    };

    const resetUsers = () => {
        setCustomUsers(SAMPLE_USERS);
    };

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '30px'
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                🎛️ Contrôles Globaux
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px'
            }}>
                {/* Gestion des utilisateurs */}
                <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                        👥 Gestion des Utilisateurs
                    </h4>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Total: {customUsers.length} utilisateurs
                        </div>
                        <button
                            onClick={resetUsers}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Réinitialiser
                        </button>
                    </div>
                    
                    {/* Ajouter un utilisateur */}
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px'
                    }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
                            Ajouter un Utilisateur
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                                type="text"
                                placeholder="Nom d'utilisateur"
                                value={newUser.userName}
                                onChange={(e) => setNewUser({...newUser, userName: e.target.value})}
                                style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                            />
                            <input
                                type="text"
                                placeholder="Nom complet"
                                value={newUser.displayName}
                                onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                                style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                            />
                            <select
                                value={newUser.department}
                                onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                                style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                            >
                                <option value="IT">IT</option>
                                <option value="RH">RH</option>
                                <option value="Finance">Finance</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Direction">Direction</option>
                            </select>
                            <button
                                onClick={addUser}
                                disabled={!newUser.userName || !newUser.displayName}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: (!newUser.userName || !newUser.displayName) ? '#ccc' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: (!newUser.userName || !newUser.displayName) ? 'not-allowed' : 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Options d'affichage */}
                <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                        ⚙️ Options d'Affichage
                    </h4>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '14px',
                        marginBottom: '12px',
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={showAdvancedFeatures}
                            onChange={(e) => setShowAdvancedFeatures(e.target.checked)}
                        />
                        Afficher les options avancées
                    </label>
                    
                    <div style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        lineHeight: '1.5'
                    }}>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong>Fonctionnalités disponibles :</strong>
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            <li>Palette intelligente par contexte</li>
                            <li>Support daltonisme complet</li>
                            <li>Animations fluides</li>
                            <li>Filtres avancés</li>
                            <li>Export/import configuration</li>
                            <li>Analytics couleurs</li>
                            <li>Accessibilité WCAG</li>
                        </ul>
                    </div>
                </div>

                {/* Informations techniques */}
                <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                        ℹ️ Informations Techniques
                    </h4>
                    <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong>Version :</strong> 1.0.0
                        </p>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong>Compatibilité :</strong> Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
                        </p>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong>Accessibilité :</strong> WCAG 2.1 AA/AAA
                        </p>
                        <p style={{ margin: '0' }}>
                            <strong>Développé pour :</strong> DocuCortex Enhanced
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserColorIntegrationExample;