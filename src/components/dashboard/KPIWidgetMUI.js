// src/components/dashboard/KPIWidgetMUI.js - KPI Widget Material-UI Optimisé

import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Remove as RemoveIcon
} from '@mui/icons-material';

// Mappage des couleurs du thème vers des codes hexadécimaux pour le dégradé
// Cela permet d'utiliser les noms de palette MUI (primary, error, etc.)
const getColorGradient = (color) => {
    const colors = {
        primary: '#1976d2 0%, #1565c0 100%',
        secondary: '#9c27b0 0%, #7b1fa2 100%',
        success: '#2e7d32 0%, #1b5e20 100%',
        error: '#d32f2f 0%, #c62828 100%',
        warning: '#ed6c02 0%, #e65100 100%',
        info: '#0288d1 0%, #01579b 100%',
        default: '#455a64 0%, #37474f 100%'
    };
    return colors[color] || colors.default;
};

const KPIWidgetMUI = ({
    title,
    value,
    unit = '',
    trend = null,
    trendValue = null,
    icon: Icon,
    color = 'primary',
    subtitle = null
}) => {
    // Déterminer la couleur de la tendance
    const getTrendIcon = () => {
        if (!trend || trend === 0) return <RemoveIcon fontSize="small" />;
        return trend > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
    };

    return (
        <Paper
            elevation={3}
            sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${getColorGradient(color)})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 12px 24px rgba(0,0,0,0.2)',
                },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            {/* Icône en background artistique */}
            {Icon && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: -15,
                        right: -15,
                        opacity: 0.12,
                        transform: 'rotate(-15deg)',
                        pointerEvents: 'none'
                    }}
                >
                    <Icon sx={{ fontSize: 130 }} />
                </Box>
            )}

            {/* En-tête : Titre */}
            <Typography
                variant="subtitle2"
                component="div"
                sx={{
                    fontWeight: 600,
                    opacity: 0.95,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '0.75rem',
                    zIndex: 1
                }}
            >
                {title}
            </Typography>

            {/* Corps : Valeur */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, my: 1.5, zIndex: 1 }}>
                <Typography
                    variant="h3"
                    component="div"
                    sx={{
                        fontWeight: 700,
                        lineHeight: 1,
                        fontSize: '2.5rem'
                    }}
                >
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </Typography>
                {unit && (
                    <Typography variant="h6" component="span" sx={{ opacity: 0.85, fontWeight: 500 }}>
                        {unit}
                    </Typography>
                )}
            </Box>

            {/* Pied : Sous-titre ou Tendance */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                {subtitle ? (
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
                        {subtitle}
                    </Typography>
                ) : <Box />}

                {trend !== null && (
                    <Chip
                        icon={getTrendIcon()}
                        label={`${trend > 0 ? '+' : ''}${trend}%`}
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 700,
                            height: 24,
                            border: '1px solid rgba(255,255,255,0.3)',
                            '& .MuiChip-icon': {
                                color: 'white'
                            },
                            '& .MuiChip-label': {
                                px: 1
                            }
                        }}
                    />
                )}
            </Box>
        </Paper>
    );
};

export default KPIWidgetMUI;
