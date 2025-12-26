// src/components/common/StatCard.js - Card moderne pour afficher des statistiques

import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Tooltip, IconButton, Skeleton } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Info as InfoIcon } from '@mui/icons-material';

/**
 * StatCard - Card moderne pour afficher des statistiques
 *
 * @param {string} title - Titre de la statistique
 * @param {string|number} value - Valeur principale
 * @param {string|number} subtitle - Sous-titre ou valeur secondaire
 * @param {ReactNode} icon - Icône (composant MUI Icon)
 * @param {string} color - Couleur (primary, secondary, success, error, warning, info)
 * @param {number} trend - Variation en % (ex: +5.2, -3.1)
 * @param {string} trendLabel - Label de la tendance (ex: "vs mois dernier")
 * @param {Function} onClick - Callback au clic
 * @param {boolean} loading - État de chargement
 * @param {string} tooltip - Tooltip d'information
 */
const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'primary',
    trend,
    trendLabel,
    onClick,
    loading = false,
    tooltip,
}) => {
    const getGradient = (color) => {
        const gradients = {
            primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            warning: 'linear-gradient(135deg, #ffa585 0%, #ffeda0 100%)',
            info: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        };
        return gradients[color] || gradients.primary;
    };

    if (loading) {
        return (
            <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}>
                <CardContent>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 12px 32px rgba(0,0,0,0.15)',
                } : {},
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: getGradient(color),
                },
            }}
            onClick={onClick}
        >
            <CardContent sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    {Icon && (
                        <Avatar
                            sx={{
                                background: getGradient(color),
                                width: 40,
                                height: 40,
                                boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            <Icon sx={{ color: 'white', fontSize: 20 }} />
                        </Avatar>
                    )}
                    {tooltip && (
                        <Tooltip title={tooltip} arrow>
                            <IconButton size="small">
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {value}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {title}
                </Typography>

                {subtitle && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {subtitle}
                    </Typography>
                )}

                {trend !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {trend > 0 ? (
                            <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                            <TrendingDownIcon fontSize="small" color="error" />
                        )}
                        <Typography
                            variant="caption"
                            sx={{
                                color: trend > 0 ? 'success.main' : 'error.main',
                                fontWeight: 600,
                            }}
                        >
                            {trend > 0 ? '+' : ''}{trend}%
                        </Typography>
                        {trendLabel && (
                            <Typography variant="caption" color="text.secondary">
                                {trendLabel}
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;
