// src/components/dashboard/KPIWidgetMUI.js - KPI Widget Material-UI

import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Remove as RemoveIcon
} from '@mui/icons-material';

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
    const getTrendColor = () => {
        if (!trend) return 'default';
        return trend > 0 ? 'success' : trend < 0 ? 'error' : 'default';
    };

    const getTrendIcon = () => {
        if (!trend || trend === 0) return <RemoveIcon />;
        return trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color === 'primary' ? '#1976d2 0%, #1565c0 100%' :
                    color === 'secondary' ? '#9c27b0 0%, #7b1fa2 100%' :
                    color === 'success' ? '#2e7d32 0%, #1b5e20 100%' :
                    color === 'error' ? '#d32f2f 0%, #c62828 100%' :
                    color === 'warning' ? '#ed6c02 0%, #e65100 100%' :
                    color === 'info' ? '#0288d1 0%, #01579b 100%' :
                    '#1976d2 0%, #1565c0 100%'})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                }
            }}
        >
            {/* Icône en background */}
            {Icon && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        opacity: 0.15,
                        transform: 'rotate(-15deg)'
                    }}
                >
                    <Icon sx={{ fontSize: 120 }} />
                </Box>
            )}

            {/* Contenu */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Titre */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 500,
                        opacity: 0.9,
                        mb: 1,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                    }}
                >
                    {title}
                </Typography>

                {/* Valeur */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            lineHeight: 1
                        }}
                    >
                        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                    </Typography>
                    {unit && (
                        <Typography variant="h6" sx={{ opacity: 0.8 }}>
                            {unit}
                        </Typography>
                    )}
                </Box>

                {/* Sous-titre ou Tendance */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {subtitle && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {subtitle}
                        </Typography>
                    )}

                    {trend !== null && (
                        <Chip
                            icon={getTrendIcon()}
                            label={`${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
                            size="small"
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 600,
                                height: 24,
                                '& .MuiChip-icon': {
                                    color: 'white'
                                }
                            }}
                        />
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default KPIWidgetMUI;
