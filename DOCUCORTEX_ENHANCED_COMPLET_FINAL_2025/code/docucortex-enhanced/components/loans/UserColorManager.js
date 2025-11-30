// src/components/loan-management/UserColorManager.js - GESTIONNAIRE DE COULEURS UTILISATEUR

import { useMemo } from 'react';
import { generateColorFromString } from '../../utils/colorUtils';

// Palette de couleurs professionnelle et cohérente
const COLOR_PALETTE = [
    '#2196F3', // Bleu
    '#4CAF50', // Vert
    '#FF9800', // Orange
    '#9C27B0', // Violet
    '#F44336', // Rouge
    '#00BCD4', // Cyan
    '#8BC34A', // Light Green
    '#FFC107', // Amber
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63', // Pink
    '#3F51B5', // Indigo
    '#009688', // Teal
    '#CDDC39', // Lime
    '#FF5722', // Deep Orange
    '#673AB7', // Deep Purple
    '#1E88E5', // Blue
    '#43A047', // Green
    '#FB8C00', // Orange
    '#8E24AA', // Purple
];

/**
 * Génère une couleur cohérente pour un utilisateur donné
 * @param {string} userName - Nom d'utilisateur unique
 * @param {string} userId - ID utilisateur (optionnel)
 * @returns {string} - Couleur hexadécimale
 */
const generateUserColor = (userName, userId) => {
    if (!userName && !userId) {
        return '#9E9E9E'; // Gris par défaut
    }

    // Clé pour le cache et la cohérence
    const key = userId || userName;
    
    // Génération déterministe de couleur basée sur l'utilisateur
    const hash = key.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);

    // Utilisation du hash pour sélectionner une couleur de la palette
    const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
    let color = COLOR_PALETTE[colorIndex];

    // Pour les utilisateurs très fréquents, on peut aussi générer des variantes
    // en modifiant légèrement la luminosité
    const frequency = Math.abs(hash) % 3;
    if (frequency === 1) {
        color = lightenColor(color, 0.1);
    } else if (frequency === 2) {
        color = darkenColor(color, 0.1);
    }

    return color;
};

/**
 * Éclaircit une couleur hexadécimale
 * @param {string} color - Couleur hexadécimale
 * @param {number} amount - Quantité d'éclaircissement (0-1)
 * @returns {string} - Couleur éclaircie
 */
const lightenColor = (color, amount) => {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
        (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
};

/**
 * Assombrit une couleur hexadécimale
 * @param {string} color - Couleur hexadécimale
 * @param {number} amount - Quantité d'assombrissement (0-1)
 * @returns {string} - Couleur assombrie
 */
const darkenColor = (color, amount) => {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R>255?255:R<0?0:R)*0x10000 +
        (G>255?255:G<0?0:G)*0x100 + (B>255?255:B<0?0:B)).toString(16).slice(1);
};

/**
 * Génère une couleur de texte contrastée pour une couleur de fond
 * @param {string} backgroundColor - Couleur de fond
 * @returns {string} - Couleur de texte (noir ou blanc)
 */
const getContrastText = (backgroundColor) => {
    // Calcul de la luminance pour déterminer la couleur de texte optimale
    const rgb = parseInt(backgroundColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // Calcul de la luminance (formule standard)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Hook personnalisé pour la gestion des couleurs utilisateur
 * @param {Array} users - Liste des utilisateurs
 * @returns {Object} - Fonctions et données pour la gestion des couleurs
 */
export const useUserColorManager = (users = []) => {
    // Génération du cache des couleurs utilisateur
    const userColorCache = useMemo(() => {
        const cache = {};
        
        users.forEach(user => {
            if (user && (user.userName || user.name || user.id)) {
                const userKey = user.id || user.userName || user.name;
                const userName = user.userName || user.name || user.displayName;
                const color = generateUserColor(userName, userKey);
                
                cache[userKey] = {
                    color,
                    textColor: getContrastText(color),
                    displayName: user.displayName || userName,
                    userName,
                    id: user.id
                };
            }
        });

        return cache;
    }, [users]);

    // Fonction pour obtenir la couleur d'un utilisateur
    const getUserColor = (userId, userName = null) => {
        if (!userId && !userName) {
            return {
                color: '#9E9E9E',
                textColor: '#FFFFFF',
                displayName: 'Inconnu',
                userName: 'Inconnu'
            };
        }

        const key = userId || userName;
        return userColorCache[key] || {
            color: generateUserColor(userName, userId),
            textColor: getContrastText(generateUserColor(userName, userId)),
            displayName: userName || 'Utilisateur',
            userName: userName,
            userId: userId
        };
    };

    // Fonction pour obtenir la liste des utilisateurs colorés
    const getColoredUserList = () => {
        return Object.values(userColorCache);
    };

    // Fonction pour obtenir les couleurs par département
    const getColorsByDepartment = (department) => {
        return Object.values(userColorCache).filter(user => 
            user.department === department
        );
    };

    // Fonction pour obtenir la couleur dominante d'un département
    const getDepartmentColor = (department) => {
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
    };

    return {
        userColorCache,
        getUserColor,
        getColoredUserList,
        getColorsByDepartment,
        getDepartmentColor,
        colorPalette: COLOR_PALETTE
    };
};

/**
 * Composant pour afficher la légende des couleurs utilisateur
 */
export const UserColorLegend = ({ 
    users = [], 
    title = "Légende des utilisateurs",
    maxHeight,
    compact = false 
}) => {
    const { getColoredUserList } = useUserColorManager(users);
    const coloredUsers = getColoredUserList();

    if (coloredUsers.length === 0) return null;

    const legendStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: compact ? '4px' : '8px',
        padding: compact ? '4px' : '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
        maxHeight: maxHeight || 'none',
        overflow: maxHeight ? 'auto' : 'visible'
    };

    const labelStyle = { 
        fontWeight: 'bold', 
        marginRight: '12px',
        alignSelf: 'center',
        color: '#666',
        fontSize: compact ? '11px' : '12px'
    };

    return (
        <div className="user-color-legend" style={legendStyle}>
            <div style={labelStyle}>
                {title}:
            </div>
            {coloredUsers.map(user => {
                const userItemStyle = {
                    display: 'flex',
                    alignItems: 'center',
                    gap: compact ? '4px' : '6px',
                    padding: compact ? '2px 6px' : '4px 8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: `2px solid ${user.color}`,
                    fontSize: compact ? '10px' : '12px'
                };

                return (
                    <div
                        key={user.id || user.userName}
                        style={userItemStyle}
                        title={`${user.displayName} (${user.userName})`}
                    >
                        <div
                            style={{
                                width: compact ? '8px' : '12px',
                                height: compact ? '8px' : '12px',
                                backgroundColor: user.color,
                                borderRadius: '50%'
                            }}
                        />
                        <span style={{ color: user.textColor, fontWeight: '500' }}>
                            {user.displayName}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

/**
 * Composant pour afficher un badge coloré utilisateur
 */
export const UserColorBadge = ({ 
    userId, 
    userName, 
    displayName, 
    size = 'medium',
    showIcon = true,
    style = {} 
}) => {
    const { getUserColor } = useUserColorManager();
    const userColor = getUserColor(userId, userName);

    const sizeStyles = {
        small: { padding: '2px 6px', fontSize: '11px', gap: '4px' },
        medium: { padding: '4px 8px', fontSize: '12px', gap: '6px' },
        large: { padding: '6px 12px', fontSize: '14px', gap: '8px' }
    };

    const currentSize = sizeStyles[size] || sizeStyles.medium;

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: userColor.color,
                color: userColor.textColor,
                borderRadius: '12px',
                fontWeight: '500',
                ...currentSize,
                ...style
            }}
            title={`${displayName || userColor.displayName} (${userName || userColor.userName})`}
        >
            {showIcon && (
                <div
                    style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: userColor.textColor,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: userColor.color
                    }}
                >
                    {(displayName || userColor.displayName).charAt(0).toUpperCase()}
                </div>
            )}
            <span>{displayName || userColor.displayName}</span>
        </div>
    );
};

export default useUserColorManager;