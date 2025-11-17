// src/components/users/UserColorIntegration.js - Intégration visuelle avancée des couleurs utilisateur
// Version complète avec palette intelligente, accessibilité, animations et export/import

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    useUserColorManagerOptimized, 
    UserColorLegendEnhanced, 
    UserColorBadgeOptimized 
} from './UserColorManagerOptimized';

// ============================================================================
// PALETTES DE COULEURS INTELLIGENTES
// ============================================================================

const INTELLIGENT_COLOR_PALETTES = {
    // Palette dynamique basée sur les catégories
    categories: {
        admin: ['#1976D2', '#0D47A1', '#1565C0'],       // Bleus profonds
        manager: ['#388E3C', '#2E7D32', '#1B5E20'],     // Verts administrateurs
        user: ['#F57C00', '#EF6C00', '#E65100'],        // Oranges utilisateurs
        guest: ['#9E9E9E', '#757575', '#616161'],       // Gris invités
        developer: ['#7B1FA2', '#6A1B9A', '#4A148C'],   // Violets développeurs
        designer: ['#E91E63', '#C2185B', '#AD1457'],      // Roses designers
        analyst: ['#00BCD4', '#0097A7', '#006064'],     // Cyans analystes
        consultant: ['#FF9800', '#F57C00', '#E65100']   // Orange consultants
    },

    // Palette par département avec variations
    departments: {
        'Direction': {
            primary: '#B71C1C',
            variants: ['#C62828', '#D32F2F', '#F44336']
        },
        'IT': {
            primary: '#1976D2', 
            variants: ['#2196F3', '#42A5F5', '#64B5F6']
        },
        'RH': {
            primary: '#E91E63',
            variants: ['#F06292', '#F48FB1', '#FCE4EC']
        },
        'Finance': {
            primary: '#388E3C',
            variants: ['#4CAF50', '#66BB6A', '#81C784']
        },
        'Marketing': {
            primary: '#FF9800',
            variants: ['#FFB74D', '#FFCC02', '#FFD54F']
        },
        'Commercial': {
            primary: '#9C27B0',
            variants: ['#BA68C8', '#CE93D8', '#E1BEE7']
        },
        'Support': {
            primary: '#00BCD4',
            variants: ['#4DD0E1', '#80DEEA', '#B2EBF2']
        },
        'Formation': {
            primary: '#8BC34A',
            variants: ['#9CCC65', '#AED581', '#C5E1A5']
        },
        'Juridique': {
            primary: '#795548',
            variants: ['#8D6E63', '#A1887F', '#BCAAA4']
        }
    },

    // Palette par rôle avec hiérarchie visuelle
    roles: {
        'Directeur': '#D32F2F',        // Rouge hiérarchique
        'Chef_service': '#1976D2',     // Bleu direction
        'Responsable': '#388E3C',      // Vert responsable  
        'Manager': '#F57C00',          // Orange management
        'Expert': '#7B1FA2',           // Violet expertise
        'Consultant': '#00BCD4',       // Cyan consultation
        'Assistant': '#8BC34A',        // Vert assistant
        'Stagiaire': '#9E9E9E'         // Gris formation
    }
};

// ============================================================================
// UTILITAIRES COULEURS ET ACCESSIBILITÉ
// ============================================================================

/**
 * Détection des types de daltonisme et adaptation des couleurs
 */
const COLORBLIND_PATTERNS = {
    protanopia: { // Manque de sensibilité au rouge
        safeColors: ['#0173B2', '#DE8F05', '#029E73', '#CC78BC', '#CA9161', '#949494']
    },
    deuteranopia: { // Manque de sensibilité au vert
        safeColors: ['#0173B2', '#DE8F05', '#029E73', '#CC78BC', '#56B4E9', '#F0E442']
    },
    tritanopia: { // Manque de sensibilité au bleu
        safeColors: ['#D55E00', '#E69F00', '#0072B2', '#CC79A7', '#009E73', '#F0E442']
    },
    achromatopsia: { // Absence totale de couleur
        safeColors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF']
    }
};

/**
 * Génère un motif pour daltoniens
 */
const generatePatternForColorblind = (color, type = 'stripes') => {
    const patterns = {
        stripes: `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 4px)`,
        dots: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
        waves: `repeating-linear-gradient(90deg, ${color}, ${color} 1px, transparent 1px, transparent 3px)`,
        squares: `repeating-linear-gradient(0deg, ${color}, ${color} 3px, transparent 3px, transparent 6px)`
    };
    return patterns[type] || patterns.stripes;
};

/**
 * Validation de l'accessibilité WCAG
 */
const validateWCAG = (backgroundColor, textColor, level = 'AA') => {
    const getLuminance = (color) => {
        const rgb = parseInt(color.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    
    const lum1 = getLuminance(backgroundColor);
    const lum2 = getLuminance(textColor);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    const contrast = (brightest + 0.05) / (darkest + 0.05);
    
    const thresholds = { AA: 4.5, AAA: 7.0, AALarge: 3.0, AAALarge: 4.5 };
    
    return {
        ratio: contrast,
        passes: contrast >= thresholds[level],
        level,
        status: contrast >= thresholds[level] ? 'PASS' : 'FAIL'
    };
};

// ============================================================================
// HOOK PRINCIPAL D'INTÉGRATION COULEURS
// ============================================================================

export const useUserColorIntegration = (users = [], options = {}) => {
    const [colorblindMode, setColorblindMode] = useState('none');
    const [animationEnabled, setAnimationEnabled] = useState(true);
    const [exportData, setExportData] = useState(null);
    const [filters, setFilters] = useState({
        department: null,
        role: null,
        category: null,
        color: null
    });

    // Configuration par défaut
    const defaultOptions = {
        palette: 'primary',
        algorithm: 'deterministic',
        accessibility: 'AA',
        includeVariants: true,
        persistCache: true,
        showAnimations: true,
        colorblindAdaptation: true,
        intensity: 0.8, // Intensité des couleurs (0-1)
        theme: 'light' // 'light', 'dark', 'auto'
    };

    const config = { ...defaultOptions, ...options };

    // Utilisation du gestionnaire de couleurs optimisé
    const colorManager = useUserColorManagerOptimized(users, {
        palette: config.palette,
        algorithm: config.algorithm,
        accessibility: config.accessibility,
        includeVariants: config.includeVariants,
        persistCache: config.persistCache
    });

    // Génération intelligente des couleurs par contexte
    const generateContextualColors = useCallback((user) => {
        if (!user) return {};

        const baseColors = {
            department: INTELLIGENT_COLOR_PALETTES.departments[user.department],
            category: INTELLIGENT_COLOR_PALETTES.categories[user.category],
            role: INTELLIGENT_COLOR_PALETTES.roles[user.role]
        };

        // Sélection de la couleur la plus appropriée
        let primaryColor = baseColors.department?.primary || 
                          baseColors.role || 
                          colorManager.getUserColor(user.id, user.userName).color;

        // Application de l'intensité
        const intensityFactor = config.intensity;
        const finalColor = adjustColorIntensity(primaryColor, intensityFactor);

        // Adaptation daltonisme si activée
        const adaptedColor = colorblindMode !== 'none' && config.colorblindAdaptation
            ? adaptColorForColorblind(finalColor, colorblindMode)
            : finalColor;

        // Validation de l'accessibilité
        const textColor = getOptimalTextColor(adaptedColor);
        const accessibility = validateWCAG(adaptedColor, textColor, config.accessibility);

        return {
            primary: adaptedColor,
            text: textColor,
            accessibility,
            patterns: {
                stripes: generatePatternForColorblind(adaptedColor, 'stripes'),
                dots: generatePatternForColorblind(adaptedColor, 'dots'),
                waves: generatePatternForColorblind(adaptedColor, 'waves'),
                squares: generatePatternForColorblind(adaptedColor, 'squares')
            },
            variants: generateColorVariants(adaptedColor),
            context: {
                department: baseColors.department,
                category: baseColors.category,
                role: baseColors.role
            }
        };
    }, [colorManager, colorblindMode, config.intensity, config.accessibility, config.colorblindAdaptation]);

    // Application des filtres par couleur
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (filters.department && user.department !== filters.department) return false;
            if (filters.role && user.role !== filters.role) return false;
            if (filters.category && user.category !== filters.category) return false;
            if (filters.color) {
                const userColors = generateContextualColors(user);
                if (userColors.primary !== filters.color) return false;
            }
            return true;
        });
    }, [users, filters, generateContextualColors]);

    // Export/Import des configurations
    const exportColorConfiguration = useCallback(() => {
        const configuration = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            options: config,
            userColors: {},
            filters,
            colorblindMode,
            palettes: INTELLIGENT_COLOR_PALETTES
        };

        filteredUsers.forEach(user => {
            const colors = generateContextualColors(user);
            configuration.userColors[user.id || user.userName] = colors;
        });

        const dataStr = JSON.stringify(configuration, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        setExportData({ url, data: configuration });
        return { url, data: configuration };
    }, [filteredUsers, filters, config, colorblindMode, generateContextualColors]);

    const importColorConfiguration = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const configuration = JSON.parse(e.target.result);
                    // Valider la structure de la configuration
                    if (configuration.version && configuration.userColors) {
                        // Appliquer la configuration importée
                        resolve(configuration);
                    } else {
                        reject(new Error('Format de configuration invalide'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }, []);

    // Optimisation de la distribution des couleurs
    const optimizeColorDistribution = useCallback(() => {
        const usersWithColors = filteredUsers.map(user => ({
            ...user,
            colors: generateContextualColors(user)
        }));

        // Analyse de la distribution
        const colorDistribution = {};
        usersWithColors.forEach(user => {
            const color = user.colors.primary;
            colorDistribution[color] = (colorDistribution[color] || 0) + 1;
        });

        // Identification des couleurs sur-utilisées
        const avgUsage = usersWithColors.length / Object.keys(colorDistribution).length;
        const optimization = {
            totalUsers: usersWithColors.length,
            colorDistribution,
            avgUsage,
            overusedColors: Object.entries(colorDistribution)
                .filter(([color, count]) => count > avgUsage * 1.5)
                .map(([color]) => color),
            recommendations: []
        };

        // Génération de recommandations
        if (optimization.overusedColors.length > 0) {
            optimization.recommendations.push({
                type: 'redistribution',
                message: 'Certaines couleurs sont sur-utilisées. Considérez redistribuer les couleurs.',
                colors: optimization.overusedColors
            });
        }

        if (Object.keys(colorDistribution).length < 5) {
            optimization.recommendations.push({
                type: 'diversity',
                message: 'La palette de couleurs pourrait être plus diversifiée.',
                currentCount: Object.keys(colorDistribution).length,
                recommendedMin: 8
            });
        }

        return optimization;
    }, [filteredUsers, generateContextualColors]);

    // Animation des transitions de couleurs
    const animateColorTransition = useCallback((element, fromColor, toColor, duration = 300) => {
        if (!animationEnabled || !element) return;

        element.style.transition = `background-color ${duration}ms ease-in-out, color ${duration}ms ease-in-out`;
        element.style.backgroundColor = toColor;

        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }, [animationEnabled]);

    // Obtenir la liste des couleurs uniques pour la légende
    const getUniqueColors = useCallback(() => {
        const colorSet = new Set();
        filteredUsers.forEach(user => {
            const colors = generateContextualColors(user);
            colorSet.add(colors.primary);
        });
        return Array.from(colorSet);
    }, [filteredUsers, generateContextualColors]);

    return {
        // Données et gestion
        colorManager,
        users: filteredUsers,
        generateContextualColors,
        filters,
        setFilters,
        
        // Accessibilité et daltonisme
        colorblindMode,
        setColorblindMode,
        colorblindPatterns: COLORBLIND_PATTERNS,
        
        // Configuration et export/import
        exportColorConfiguration,
        importColorConfiguration,
        exportData,
        
        // Optimisation
        optimizeColorDistribution,
        getUniqueColors,
        
        // Animation
        animationEnabled,
        setAnimationEnabled,
        animateColorTransition,
        
        // Utilitaires
        intelligentPalettes: INTELLIGENT_COLOR_PALETTES,
        validateWCAG,
        generatePatternForColorblind
    };
};

// ============================================================================
// COMPOSANTS PRINCIPAUX
// ============================================================================

/**
 * Composant principal d'intégration visuelle des couleurs
 */
export const UserColorIntegration = ({
    users = [],
    onUserSelect,
    showFilters = true,
    showLegend = true,
    showAnalytics = false,
    className = '',
    style = {},
    ...integrationOptions
}) => {
    const {
        users: filteredUsers,
        generateContextualColors,
        filters,
        setFilters,
        colorblindMode,
        setColorblindMode,
        exportColorConfiguration,
        importColorConfiguration,
        optimizeColorDistribution,
        animationEnabled,
        setAnimationEnabled,
        intelligentPalettes,
        showLegend: shouldShowLegend = showLegend
    } = useUserColorIntegration(users, integrationOptions);

    const [selectedUser, setSelectedUser] = useState(null);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const userListRef = useRef(null);

    // Optimisation de la distribution
    const optimization = optimizeColorDistribution();

    // Gestion de la sélection d'utilisateur
    const handleUserSelect = useCallback((user) => {
        setSelectedUser(user);
        if (onUserSelect) {
            onUserSelect(user);
        }
    }, [onUserSelect]);

    // Gestion de l'import de configuration
    const handleImportConfig = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const config = await importColorConfiguration(file);
                console.log('Configuration importée:', config);
                // Ici vous pourriez appliquer la configuration importée
            } catch (error) {
                console.error('Erreur lors de l\'import:', error);
            }
        }
    }, [importColorConfiguration]);

    return (
        <div className={`user-color-integration ${className}`} style={style}>
            {/* Barre d'outils supérieure */}
            <div className="color-integration-toolbar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '16px',
                gap: '12px'
            }}>
                {/* Filtres de couleurs */}
                {showFilters && (
                    <ColorFilterPanel 
                        filters={filters}
                        onFiltersChange={setFilters}
                        users={users}
                        intelligentPalettes={intelligentPalettes}
                        colorblindMode={colorblindMode}
                        onColorblindModeChange={setColorblindMode}
                        animationEnabled={animationEnabled}
                        onAnimationToggle={setAnimationEnabled}
                    />
                )}

                {/* Actions d'export/import */}
                <div className="color-actions" style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={() => setShowExportDialog(!showExportDialog)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Exporter
                    </button>
                    <label style={{
                        padding: '6px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}>
                        Importer
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportConfig}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

            {/* Légende interactive */}
            {shouldShowLegend && (
                <InteractiveColorLegend 
                    users={filteredUsers}
                    generateContextualColors={generateContextualColors}
                    filters={filters}
                    onFiltersChange={setFilters}
                    colorblindMode={colorblindMode}
                    className="mb-4"
                />
            )}

            {/* Liste des utilisateurs avec couleurs intégrées */}
            <div 
                ref={userListRef}
                className="user-color-list" 
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px',
                    maxHeight: '600px',
                    overflow: 'auto',
                    padding: '4px'
                }}
            >
                {filteredUsers.map(user => (
                    <UserColorCard
                        key={user.id || user.userName}
                        user={user}
                        colors={generateContextualColors(user)}
                        isSelected={selectedUser?.id === user.id}
                        onSelect={() => handleUserSelect(user)}
                        animationEnabled={animationEnabled}
                        colorblindMode={colorblindMode}
                    />
                ))}
            </div>

            {/* Analytics et optimisation */}
            {showAnalytics && (
                <ColorAnalyticsPanel 
                    optimization={optimization}
                    filteredUsers={filteredUsers}
                    generateContextualColors={generateContextualColors}
                />
            )}

            {/* Dialog d'export */}
            {showExportDialog && (
                <ExportDialog 
                    onClose={() => setShowExportDialog(false)}
                    onExport={exportColorConfiguration}
                />
            )}
        </div>
    );
};

/**
 * Panneau de filtres de couleurs
 */
const ColorFilterPanel = ({ 
    filters, 
    onFiltersChange, 
    users, 
    intelligentPalettes, 
    colorblindMode, 
    onColorblindModeChange,
    animationEnabled,
    onAnimationToggle 
}) => {
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
    const roles = [...new Set(users.map(u => u.role).filter(Boolean))];
    const categories = Object.keys(intelligentPalettes.categories);

    const updateFilter = (key, value) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="color-filter-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
        }}>
            {/* Filtre département */}
            <select
                value={filters.department || ''}
                onChange={(e) => updateFilter('department', e.target.value || null)}
                style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}
            >
                <option value="">Tous départements</option>
                {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                ))}
            </select>

            {/* Filtre rôle */}
            <select
                value={filters.role || ''}
                onChange={(e) => updateFilter('role', e.target.value || null)}
                style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}
            >
                <option value="">Tous rôles</option>
                {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                ))}
            </select>

            {/* Filtre couleur */}
            <input
                type="color"
                value={filters.color || '#000000'}
                onChange={(e) => updateFilter('color', e.target.value || null)}
                style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
                title="Filtrer par couleur"
            />

            {/* Mode daltonisme */}
            <select
                value={colorblindMode}
                onChange={(e) => onColorblindModeChange(e.target.value)}
                style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}
                title="Adaptation daltonisme"
            >
                <option value="none">Normal</option>
                <option value="protanopia">Protanopie</option>
                <option value="deuteranopia">Deutéranopie</option>
                <option value="tritanopia">Tritanopie</option>
                <option value="achromatopsia">Achromatopsie</option>
            </select>

            {/* Toggle animations */}
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer'
            }}>
                <input
                    type="checkbox"
                    checked={animationEnabled}
                    onChange={(e) => onAnimationToggle(e.target.checked)}
                />
                Animations
            </label>
        </div>
    );
};

/**
 * Légende interactive des couleurs
 */
const InteractiveColorLegend = ({ 
    users, 
    generateContextualColors, 
    filters, 
    onFiltersChange, 
    colorblindMode,
    className 
}) => {
    const colorCounts = useMemo(() => {
        const counts = {};
        users.forEach(user => {
            const colors = generateContextualColors(user);
            const color = colors.primary;
            counts[color] = (counts[color] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([color, count]) => ({ color, count }))
            .sort((a, b) => b.count - a.count);
    }, [users, generateContextualColors]);

    const handleColorClick = (color) => {
        const newFilter = filters.color === color ? null : color;
        onFiltersChange({ ...filters, color: newFilter });
    };

    return (
        <div className={`interactive-color-legend ${className}`} style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
        }}>
            <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333'
            }}>
                Légende Interactive ({colorCounts.length} couleurs)
            </h4>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                {colorCounts.map(({ color, count }) => (
                    <button
                        key={color}
                        onClick={() => handleColorClick(color)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            backgroundColor: filters.color === color ? color : 'white',
                            color: filters.color === color ? getOptimalTextColor(color) : '#333',
                            border: `2px solid ${color}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            boxShadow: filters.color === color ? `0 2px 4px ${color}40` : 'none'
                        }}
                        title={`${count} utilisateur(s) - Cliquer pour filtrer`}
                    >
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: color,
                                borderRadius: '50%',
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}
                        />
                        <span>{count}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * Carte utilisateur avec intégration de couleurs
 */
const UserColorCard = ({ 
    user, 
    colors, 
    isSelected, 
    onSelect, 
    animationEnabled, 
    colorblindMode 
}) => {
    const cardRef = useRef(null);

    // Animation d'entrée
    useEffect(() => {
        if (cardRef.current && animationEnabled) {
            cardRef.current.style.opacity = '0';
            cardRef.current.style.transform = 'translateY(20px)';
            requestAnimationFrame(() => {
                cardRef.current.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                cardRef.current.style.opacity = '1';
                cardRef.current.style.transform = 'translateY(0)';
            });
        }
    }, [user.id, animationEnabled]);

    return (
        <div
            ref={cardRef}
            onClick={onSelect}
            className={`user-color-card ${isSelected ? 'selected' : ''}`}
            style={{
                backgroundColor: isSelected ? colors.primary : 'white',
                color: isSelected ? colors.text : '#333',
                border: `2px solid ${colors.primary}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: animationEnabled ? 'all 0.2s ease' : 'none',
                boxShadow: isSelected ? `0 4px 12px ${colors.primary}40` : '0 2px 4px rgba(0,0,0,0.1)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                if (!isSelected && animationEnabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}30`;
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected && animationEnabled) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
            }}
        >
            {/* Pattern pour daltoniens */}
            {colorblindMode !== 'none' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: colors.patterns.stripes,
                        opacity: 0.1,
                        pointerEvents: 'none'
                    }}
                />
            )}

            {/* En-tête avec avatar et informations principales */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
            }}>
                {/* Avatar coloré */}
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: colors.primary,
                        color: colors.text,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        flexShrink: 0
                    }}
                >
                    {(user.displayName || user.userName).charAt(0).toUpperCase()}
                </div>

                {/* Informations utilisateur */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: isSelected ? colors.text : '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {user.displayName || user.userName}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: isSelected ? colors.text + 'CC' : '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {user.userName}
                    </div>
                </div>
            </div>

            {/* Métadonnées avec couleurs contextuelles */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                fontSize: '11px'
            }}>
                {user.department && (
                    <div style={{
                        padding: '4px 8px',
                        backgroundColor: colors.primary + '20',
                        borderRadius: '4px',
                        color: isSelected ? colors.text : colors.primary,
                        textAlign: 'center'
                    }}>
                        {user.department}
                    </div>
                )}
                {user.role && (
                    <div style={{
                        padding: '4px 8px',
                        backgroundColor: colors.primary + '20',
                        borderRadius: '4px',
                        color: isSelected ? colors.text : colors.primary,
                        textAlign: 'center'
                    }}>
                        {user.role}
                    </div>
                )}
            </div>

            {/* Indicateurs d'accessibilité */}
            {colors.accessibility && !colors.accessibility.passes && (
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                }}
                title="Contraste insuffisant"
                >
                    !
                </div>
            )}

            {/* Indicateur daltonisme */}
            {colorblindMode !== 'none' && (
                <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    backgroundColor: colors.primary,
                    color: colors.text,
                    borderRadius: '4px',
                    padding: '2px 4px',
                    fontSize: '8px',
                    fontWeight: 'bold'
                }}>
                    {colorblindMode.slice(0, 4).toUpperCase()}
                </div>
            )}
        </div>
    );
};

/**
 * Panneau d'analytics des couleurs
 */
const ColorAnalyticsPanel = ({ optimization, filteredUsers, generateContextualColors }) => {
    const colorDistribution = optimization.colorDistribution;
    const totalColors = Object.keys(colorDistribution).length;
    const avgUsage = optimization.avgUsage;

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px'
        }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Analytics des Couleurs
            </h3>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
            }}>
                {/* Statistiques générales */}
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Vue d'ensemble</h4>
                    <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                        <div>Total utilisateurs: {optimization.totalUsers}</div>
                        <div>Couleurs uniques: {totalColors}</div>
                        <div>Utilisation moyenne: {avgUsage.toFixed(1)}</div>
                    </div>
                </div>

                {/* Recommandations */}
                {optimization.recommendations.length > 0 && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '6px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#e65100' }}>
                            Recommandations
                        </h4>
                        {optimization.recommendations.map((rec, index) => (
                            <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                • {rec.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* Distribution des couleurs */}
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Distribution</h4>
                    <div style={{ maxHeight: '100px', overflow: 'auto' }}>
                        {Object.entries(colorDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .map(([color, count]) => (
                            <div key={color} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '11px',
                                marginBottom: '4px'
                            }}>
                                <div
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: color,
                                        borderRadius: '3px',
                                        border: '1px solid rgba(0,0,0,0.1)'
                                    }}
                                />
                                <span style={{ flex: 1 }}>{count} utilisateurs</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Dialog d'export des couleurs
 */
const ExportDialog = ({ onClose, onExport }) => {
    const handleExport = () => {
        const result = onExport();
        // Auto-téléchargement
        if (result && result.url) {
            const link = document.createElement('a');
            link.href = result.url;
            link.download = `user-colors-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(result.url);
        }
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                minWidth: '300px'
            }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Exporter la configuration des couleurs</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
                    Cette action téléchargera un fichier JSON contenant toutes les couleurs attribuées,
                    les filtres actuels et les paramètres de configuration.
                </p>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleExport}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Exporter
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Ajuste l'intensité d'une couleur
 */
const adjustColorIntensity = (color, intensity) => {
    const num = parseInt(color.replace("#", ""), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;

    // Mélange avec le blanc selon l'intensité
    const newR = Math.round(r + (255 - r) * (1 - intensity));
    const newG = Math.round(g + (255 - g) * (1 - intensity));
    const newB = Math.round(b + (255 - b) * (1 - intensity));

    return "#" + (0x1000000 + (newR << 16) + (newG << 8) + newB).toString(16).slice(1);
};

/**
 * Adapte une couleur pour le daltonisme
 */
const adaptColorForColorblind = (color, type) => {
    const safeColors = COLORBLIND_PATTERNS[type]?.safeColors || [];
    if (safeColors.length === 0) return color;

    // Trouver la couleur safe la plus proche
    const distance = (color1, color2) => {
        const rgb1 = parseInt(color1.slice(1), 16);
        const rgb2 = parseInt(color2.slice(1), 16);
        const r1 = (rgb1 >> 16) & 0xff;
        const g1 = (rgb1 >> 8) & 0xff;
        const b1 = rgb1 & 0xff;
        const r2 = (rgb2 >> 16) & 0xff;
        const g2 = (rgb2 >> 8) & 0xff;
        const b2 = rgb2 & 0xff;

        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    };

    let closestColor = safeColors[0];
    let minDistance = distance(color, closestColor);

    for (const safeColor of safeColors) {
        const dist = distance(color, safeColor);
        if (dist < minDistance) {
            minDistance = dist;
            closestColor = safeColor;
        }
    }

    return closestColor;
};

/**
 * Génère des variantes de couleur
 */
const generateColorVariants = (baseColor, count = 3) => {
    const variants = [];
    const steps = [0.1, 0.2, -0.1, -0.2, 0.3, -0.3];

    for (let i = 0; i < count && i < steps.length; i++) {
        const step = steps[i];
        const variant = step > 0 
            ? lightenColor(baseColor, step)
            : darkenColor(baseColor, -step);
        
        variants.push({
            color: variant,
            textColor: getOptimalTextColor(variant),
            type: step > 0 ? 'light' : 'dark'
        });
    }

    return variants;
};

// Ré-export des composants du gestionnaire optimisé pour compatibilité
export { UserColorLegendEnhanced, UserColorBadgeOptimized } from './UserColorManagerOptimized';

export default UserColorIntegration;