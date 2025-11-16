// src/components/users/UserColorManagerOptimized.js - Version optimisée du gestionnaire de couleurs utilisateur
// Système de couleurs enrichi avec distribution intelligente et accessibilité

import { useMemo } from 'react';
import { generateColorFromString } from '../../utils/colorUtils';

// Palettes de couleurs étendues et optimisées
const ENHANCED_COLOR_PALETTES = {
    // Palette principale - couleurs vives et contrastées
    primary: [
        '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336',
        '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B',
        '#E91E63', '#3F51B5', '#009688', '#CDDC39', '#FF5722'
    ],
    
    // Palette douce - couleurs pastels
    soft: [
        '#E3F2FD', '#E8F5E8', '#FFF3E0', '#F3E5F5', '#FFEBEE',
        '#E0F7FA', '#F1F8E9', '#FFFDE7', '#EFEBE9', '#ECEFF1',
        '#FCE4EC', '#E8EAF6', '#E0F2F1', '#F9FBE7', '#FBE9E7'
    ],
    
    // Palette professionnelle - couleurs neutres et elegantes
    professional: [
        '#1976D2', '#388E3C', '#F57C00', '#7B1FA2', '#D32F2F',
        '#0288D1', '#689F38', '#FF8F00', '#512DA8', '#C62828',
        '#0097A7', '#33691E', '#E65100', '#4A148C', '#B71C1C'
    ],
    
    // Palette accessibilité - couleurs conformes WCAG
    accessible: [
        '#0D47A1', '#1B5E20', '#E65100', '#4A148C', '#B71C1C',
        '#01579B', '#2E7D32', '#EF6C00', '#6A1B9A', '#C62828',
        '#006064', '#33691E', '#BF360C', '#880E4F', '#D32F2F'
    ],
    
    // Palette départements - couleurs par métier
    departments: {
        IT: '#1976D2',
        RH: '#E91E63',
        Finance: '#388E3C',
        Marketing: '#FF9800',
        Commercial: '#9C27B0',
        Direction: '#F44336',
        Support: '#00BCD4',
        Formation: '#8BC34A',
        Juridique: '#795548'
    }
};

// Configuration des algorithmes de distribution
const DISTRIBUTION_ALGORITHMS = {
    // Distribution séquentielle simple
    sequential: (index, palette) => palette[index % palette.length],
    
    // Distribution pseudo-aléatoire basée sur le hash
    deterministic: (hash, palette) => {
        const index = Math.abs(hash) % palette.length;
        return palette[index];
    },
    
    // Distribution circulaire avec offset
    circular: (index, hash, palette) => {
        const offset = Math.abs(hash) % 5; // 5 positions d'offset
        return palette[(index + offset) % palette.length];
    },
    
    // Distribution par grappes
    clustered: (dept, hash, palette) => {
        const deptIndex = Object.keys(ENHANCED_COLOR_PALETTES.departments).indexOf(dept);
        const clusterSize = Math.ceil(palette.length / Object.keys(ENHANCED_COLOR_PALETTES.departments).length);
        const startIndex = deptIndex * clusterSize;
        const localIndex = Math.abs(hash) % clusterSize;
        return palette[(startIndex + localIndex) % palette.length];
    }
};

/**
 * Génère un hash déterministe à partir d'une chaîne
 */
const generateHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
};

/**
 * Éclaircit une couleur hexadécimale
 */
const lightenColor = (color, amount) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
        (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
};

/**
 * Assombrit une couleur hexadécimale
 */
const darkenColor = (color, amount) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R>255?255:R<0?0:R)*0x10000 +
        (G>255?255:G<0?0:G)*0x100 + (B>255?255:B<0?0:B<255?0:B)*0x100).toString(16).slice(1);
};

/**
 * Calcule le contraste d'une couleur selon les standards WCAG
 */
const getContrastRatio = (color1, color2) => {
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
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Détermine la couleur de texte optimale pour l'accessibilité
 */
const getOptimalTextColor = (backgroundColor, accessibilityLevel = 'AA') => {
    const white = '#FFFFFF';
    const black = '#000000';
    
    const contrastWithWhite = getContrastRatio(backgroundColor, white);
    const contrastWithBlack = getContrastRatio(backgroundColor, black);
    
    const minContrast = accessibilityLevel === 'AAA' ? 7 : 4.5;
    
    if (contrastWithWhite >= minContrast && contrastWithWhite > contrastWithBlack) {
        return white;
    } else if (contrastWithBlack >= minContrast) {
        return black;
    }
    
    // Si aucune couleur ne respecte les standards, retourner la couleur avec le meilleur contraste
    return contrastWithWhite > contrastWithBlack ? white : black;
};

/**
 * Génère une variante de couleur avec des tons adjacents
 */
const generateColorVariants = (baseColor, count = 3) => {
    const variants = [];
    const lightnessSteps = [0.1, 0.2, -0.1, -0.2];
    
    for (let i = 0; i < count && i < lightnessSteps.length; i++) {
        const step = lightnessSteps[i];
        const variant = step > 0 ? lightenColor(baseColor, step) : darkenColor(baseColor, -step);
        variants.push({
            color: variant,
            textColor: getOptimalTextColor(variant),
            type: step > 0 ? 'light' : 'dark',
            contrast: getContrastRatio(variant, getOptimalTextColor(variant))
        });
    }
    
    return variants;
};

/**
 * Génère une couleur pour un utilisateur avec algorithm avancé
 */
const generateEnhancedUserColor = (
    userName, 
    userId, 
    options = {
        palette: 'primary',
        algorithm: 'deterministic',
        accessibility: 'AA',
        includeVariants: false,
        department: null
    }
) => {
    if (!userName && !userId) {
        return {
            color: '#9E9E9E',
            textColor: '#FFFFFF',
            variants: [],
            accessibility: 'AA',
            contrast: getContrastRatio('#9E9E9E', '#FFFFFF')
        };
    }

    const key = userId || userName;
    const hash = generateHash(key);
    const palette = ENHANCED_COLOR_PALETTES[options.palette] || ENHANCED_COLOR_PALETTES.primary;
    
    // Sélection de la couleur selon l'algorithme
    let color;
    switch (options.algorithm) {
        case 'sequential':
            color = DISTRIBUTION_ALGORITHMS.sequential(hash, palette);
            break;
        case 'circular':
            color = DISTRIBUTION_ALGORITHMS.circular(hash, hash, palette);
            break;
        case 'clustered':
            color = DISTRIBUTION_ALGORITHMS.clustered(options.department, hash, palette);
            break;
        case 'deterministic':
        default:
            color = DISTRIBUTION_ALGORITHMS.deterministic(hash, palette);
            break;
    }
    
    const textColor = getOptimalTextColor(color, options.accessibility);
    const contrast = getContrastRatio(color, textColor);
    
    const result = {
        color,
        textColor,
        accessibility: options.accessibility,
        contrast,
        palette: options.palette,
        algorithm: options.algorithm
    };
    
    // Ajouter les variantes si demandé
    if (options.includeVariants) {
        result.variants = generateColorVariants(color);
    }
    
    return result;
};

/**
 * Hook personnalisé optimisé pour la gestion des couleurs
 */
export const useUserColorManagerOptimized = (
    users = [],
    options = {
        palette: 'primary',
        algorithm: 'deterministic',
        accessibility: 'AA',
        includeVariants: false,
        persistCache: true
    }
) => {
    // Cache intelligent des couleurs avec TTL
    const userColorCache = useMemo(() => {
        const cache = {};
        const cacheKey = `user_colors_${options.palette}_${options.algorithm}`;
        
        // Tentative de récupération du cache persisted
        let cachedColors = null;
        if (options.persistCache) {
            try {
                const stored = localStorage.getItem(cacheKey);
                if (stored) {
                    cachedColors = JSON.parse(stored);
                }
            } catch (error) {
                console.warn('Erreur lors de la récupération du cache de couleurs:', error);
            }
        }
        
        users.forEach((user, index) => {
            if (user && (user.userName || user.name || user.id)) {
                const userKey = user.id || user.userName || user.name;
                const userName = user.userName || user.name || user.displayName;
                
                // Vérifier le cache persisted
                if (cachedColors && cachedColors[userKey]) {
                    cache[userKey] = cachedColors[userKey];
                } else {
                    // Générer une nouvelle couleur
                    cache[userKey] = generateEnhancedUserColor(userName, userKey, {
                        ...options,
                        department: user.department
                    });
                }
            }
        });
        
        // Sauvegarder en cache si demandé
        if (options.persistCache) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(cache));
            } catch (error) {
                console.warn('Erreur lors de la sauvegarde du cache de couleurs:', error);
            }
        }
        
        return cache;
    }, [users, JSON.stringify(options)]);
    
    // Fonction pour obtenir la couleur d'un utilisateur
    const getUserColor = useCallback((userId, userName = null, overrideOptions = {}) => {
        if (!userId && !userName) {
            return {
                color: '#9E9E9E',
                textColor: '#FFFFFF',
                variants: [],
                accessibility: 'AA',
                contrast: getContrastRatio('#9E9E9E', '#FFFFFF')
            };
        }
        
        const key = userId || userName;
        const mergedOptions = { ...options, ...overrideOptions };
        
        if (userColorCache[key]) {
            return userColorCache[key];
        }
        
        // Générer une couleur à la volée si pas en cache
        return generateEnhancedUserColor(userName, userId, mergedOptions);
    }, [userColorCache, options]);
    
    // Fonction pour obtenir la liste des utilisateurs colorés
    const getColoredUserList = useCallback(() => {
        return Object.values(userColorCache);
    }, [userColorCache]);
    
    // Fonction pour obtenir les couleurs par département
    const getColorsByDepartment = useCallback((department) => {
        return Object.values(userColorCache).filter(user => 
            user.department === department
        );
    }, [userColorCache]);
    
    // Fonction pour obtenir la couleur dominante d'un département
    const getDepartmentColor = useCallback((department) => {
        const deptUsers = Object.values(userColorCache).filter(user => 
            user.department === department
        );
        
        if (deptUsers.length === 0) return '#9E9E9E';
        
        // Couleur la plus fréquente dans le département
        const colorCount = {};
        deptUsers.forEach(user => {
            colorCount[user.color] = (colorCount[user.color] || 0) + 1;
        });
        
        return Object.keys(colorCount).reduce((a, b) => 
            colorCount[a] > colorCount[b] ? a : b
        );
    }, [userColorCache]);
    
    // Fonction pour optimiser la distribution des couleurs
    const optimizeColorDistribution = useCallback(() => {
        const colors = Object.values(userColorCache);
        const colorUsage = {};
        
        // Compter l'utilisation de chaque couleur
        colors.forEach(user => {
            colorUsage[user.color] = (colorUsage[user.color] || 0) + 1;
        });
        
        // Identifier les couleurs sur-utilisées
        const avgUsage = colors.length / Object.keys(colorUsage).length;
        const overusedColors = Object.entries(colorUsage)
            .filter(([color, count]) => count > avgUsage * 1.5)
            .map(([color]) => color);
        
        return {
            colorUsage,
            avgUsage,
            overusedColors,
            totalColors: Object.keys(colorUsage).length
        };
    }, [userColorCache]);
    
    // Fonction pour réorganiser les couleurs si nécessaire
    const redistributeColors = useCallback((redistributionPlan) => {
        const updatedCache = { ...userColorCache };
        
        Object.entries(redistributionPlan).forEach(([userKey, newColor]) => {
            if (updatedCache[userKey]) {
                updatedCache[userKey].color = newColor;
                updatedCache[userKey].textColor = getOptimalTextColor(newColor);
                updatedCache[userKey].contrast = getContrastRatio(newColor, updatedCache[userKey].textColor);
            }
        });
        
        return updatedCache;
    }, [userColorCache]);
    
    // Fonction pour sauvegarder la configuration de couleurs
    const saveColorConfiguration = useCallback((configName, config) => {
        try {
            const configs = JSON.parse(localStorage.getItem('user_color_configs') || '{}');
            configs[configName] = {
                ...config,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('user_color_configs', JSON.stringify(configs));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
            return false;
        }
    }, []);
    
    // Fonction pour charger une configuration de couleurs
    const loadColorConfiguration = useCallback((configName) => {
        try {
            const configs = JSON.parse(localStorage.getItem('user_color_configs') || '{}');
            return configs[configName] || null;
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            return null;
        }
    }, []);
    
    return {
        userColorCache,
        getUserColor,
        getColoredUserList,
        getColorsByDepartment,
        getDepartmentColor,
        optimizeColorDistribution,
        redistributeColors,
        saveColorConfiguration,
        loadColorConfiguration,
        colorPalettes: ENHANCED_COLOR_PALETTES,
        algorithms: Object.keys(DISTRIBUTION_ALGORITHMS)
    };
};

/**
 * Composant de légende des couleurs amélioré
 */
export const UserColorLegendEnhanced = ({ 
    users = [], 
    title = "Légende des utilisateurs",
    maxHeight = 300,
    compact = false,
    showVariants = false,
    accessibility = 'AA',
    className 
}) => {
    const { getColoredUserList } = useUserColorManagerOptimized(users, {
        includeVariants: showVariants,
        accessibility
    });
    const coloredUsers = getColoredUserList();

    if (coloredUsers.length === 0) return null;

    const legendStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: compact ? '4px' : '8px',
        padding: compact ? '4px' : '12px',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.1)',
        maxHeight,
        overflow: 'auto',
        ...className
    };

    const labelStyle = { 
        fontWeight: 'bold', 
        marginRight: '12px',
        alignSelf: 'center',
        color: '#666',
        fontSize: compact ? '11px' : '13px',
        flexBasis: '100%'
    };

    return (
        <div className="user-color-legend-enhanced" style={legendStyle}>
            <div style={labelStyle}>
                {title}:
            </div>
            {coloredUsers.map(user => (
                <div
                    key={user.id || user.userName}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: compact ? '4px' : '8px',
                        padding: compact ? '4px 8px' : '6px 12px',
                        backgroundColor: user.color,
                        color: user.textColor,
                        borderRadius: '16px',
                        fontSize: compact ? '10px' : '12px',
                        fontWeight: '500',
                        border: `1px solid ${lightenColor(user.color, 0.2)}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        maxWidth: compact ? '150px' : '200px'
                    }}
                    title={`${user.displayName} (${user.userName}) - Contraste: ${user.contrast.toFixed(2)}:1`}
                >
                    <div
                        style={{
                            width: compact ? '12px' : '16px',
                            height: compact ? '12px' : '16px',
                            backgroundColor: user.textColor,
                            borderRadius: '50%',
                            flexShrink: 0
                        }}
                    />
                    <span style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {user.displayName}
                    </span>
                    {user.contrast < 4.5 && (
                        <span
                            style={{
                                fontSize: '8px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                marginLeft: '4px'
                            }}
                        >
                            ⚠
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

/**
 * Composant de badge coloré optimisé
 */
export const UserColorBadgeOptimized = ({ 
    userId, 
    userName, 
    displayName, 
    size = 'medium',
    showIcon = true,
    showContrast = false,
    variant = 'solid', // 'solid', 'outlined', 'gradient'
    accessibility = 'AA',
    palette = 'primary',
    className,
    style = {} 
}) => {
    const { getUserColor } = useUserColorManagerOptimized([], {
        accessibility,
        palette,
        includeVariants: true
    });
    const userColor = getUserColor(userId, userName);

    const sizeStyles = {
        small: { padding: '4px 8px', fontSize: '11px', gap: '6px', borderRadius: '12px' },
        medium: { padding: '6px 12px', fontSize: '13px', gap: '8px', borderRadius: '16px' },
        large: { padding: '8px 16px', fontSize: '14px', gap: '10px', borderRadius: '20px' }
    };

    const currentSize = sizeStyles[size] || sizeStyles.medium;

    const getBadgeStyle = () => {
        const baseStyle = {
            display: 'inline-flex',
            alignItems: 'center',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...currentSize,
            ...style
        };

        switch (variant) {
            case 'outlined':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    color: userColor.color,
                    border: `2px solid ${userColor.color}`,
                    '&:hover': {
                        backgroundColor: userColor.color,
                        color: userColor.textColor
                    }
                };
            case 'gradient':
                return {
                    ...baseStyle,
                    background: `linear-gradient(135deg, ${userColor.color}, ${lightenColor(userColor.color, 0.1)})`,
                    color: userColor.textColor,
                    boxShadow: `0 2px 8px ${userColor.color}40`
                };
            case 'solid':
            default:
                return {
                    ...baseStyle,
                    backgroundColor: userColor.color,
                    color: userColor.textColor,
                    boxShadow: `0 2px 4px ${userColor.color}30`
                };
        }
    };

    return (
        <div
            style={getBadgeStyle()}
            title={`${displayName || userColor.displayName} (${userName || userColor.userName}) • Palette: ${palette}`}
            className={className}
        >
            {showIcon && (
                <div
                    style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: variant === 'outlined' ? userColor.color : userColor.textColor,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: variant === 'outlined' ? userColor.textColor : userColor.color
                    }}
                >
                    {(displayName || userColor.displayName).charAt(0).toUpperCase()}
                </div>
            )}
            <span>{displayName || userColor.displayName}</span>
            {showContrast && (
                <span
                    style={{
                        fontSize: '8px',
                        backgroundColor: variant === 'outlined' ? userColor.color : userColor.textColor + '20',
                        color: variant === 'outlined' ? userColor.textColor : userColor.textColor,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        marginLeft: '4px'
                    }}
                >
                    {userColor.contrast.toFixed(1)}:1
                </span>
            )}
        </div>
    );
};

export default {
    useUserColorManagerOptimized,
    UserColorLegendEnhanced,
    UserColorBadgeOptimized
};
