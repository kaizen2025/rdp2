// src/components/dashboard/KPIWidget.js - WIDGET KPI POUR DASHBOARD EXÉCUTIF
// Composant réutilisable pour afficher les indicateurs clés de performance

import React from 'react';

const KPIWidget = ({ 
    title, 
    value, 
    unit = '', 
    change = 0, 
    trend = 'neutral', 
    color = 'blue', 
    format = 'number',
    icon = null,
    description = '',
    target = null,
    showTrend = true,
    size = 'normal'
}) => {
    // Couleurs disponibles
    const colorClasses = {
        blue: {
            bg: 'from-blue-500 to-blue-600',
            text: 'text-blue-600',
            light: 'bg-blue-50',
            border: 'border-blue-200'
        },
        green: {
            bg: 'from-green-500 to-green-600',
            text: 'text-green-600',
            light: 'bg-green-50',
            border: 'border-green-200'
        },
        purple: {
            bg: 'from-purple-500 to-purple-600',
            text: 'text-purple-600',
            light: 'bg-purple-50',
            border: 'border-purple-200'
        },
        orange: {
            bg: 'from-orange-500 to-orange-600',
            text: 'text-orange-600',
            light: 'bg-orange-50',
            border: 'border-orange-200'
        },
        red: {
            bg: 'from-red-500 to-red-600',
            text: 'text-red-600',
            light: 'bg-red-50',
            border: 'border-red-200'
        },
        indigo: {
            bg: 'from-indigo-500 to-indigo-600',
            text: 'text-indigo-600',
            light: 'bg-indigo-50',
            border: 'border-indigo-200'
        }
    };

    const colorClass = colorClasses[color] || colorClasses.blue;

    // Formatage des valeurs
    const formatValue = (val, fmt) => {
        switch (fmt) {
            case 'currency':
                return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(val);
            case 'percentage':
                return `${val.toFixed(1)}%`;
            case 'number':
                return val.toLocaleString('fr-FR');
            default:
                return val;
        }
    };

    // Icônes de tendance
    const getTrendIcon = () => {
        if (trend === 'up') return '↗';
        if (trend === 'down') return '↘';
        if (trend === 'stable') return '→';
        return '•';
    };

    // Classes CSS pour la taille
    const sizeClasses = {
        small: {
            container: 'p-4',
            title: 'text-xs',
            value: 'text-xl',
            change: 'text-xs'
        },
        normal: {
            container: 'p-6',
            title: 'text-sm',
            value: 'text-2xl',
            change: 'text-sm'
        },
        large: {
            container: 'p-8',
            title: 'text-base',
            value: 'text-4xl',
            change: 'text-base'
        }
    };

    const currentSize = sizeClasses[size] || sizeClasses.normal;

    return (
        <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${currentSize.container}`}>
            {/* En-tête avec icône optionnelle */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className={`font-medium text-gray-600 ${currentSize.title}`}>
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">
                            {description}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`text-2xl ${colorClass.text}`}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Valeur principale */}
            <div className="mb-3">
                <div className={`font-bold ${currentSize.value} text-gray-900`}>
                    {formatValue(value, format)}{unit}
                </div>
            </div>

            {/* Tendance et changement */}
            {showTrend && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {change !== 0 && (
                            <>
                                <span className={`text-lg ${colorClass.text}`}>
                                    {getTrendIcon()}
                                </span>
                                <span className={`font-medium ${
                                    trend === 'up' ? 'text-green-600' :
                                    trend === 'down' ? 'text-red-600' :
                                    'text-gray-600'
                                } ${currentSize.change}`}>
                                    {Math.abs(change).toFixed(1)}{format === 'percentage' ? '%' : unit}
                                </span>
                            </>
                        )}
                        {change === 0 && (
                            <span className={`text-gray-500 ${currentSize.change}`}>
                                Stable
                            </span>
                        )}
                    </div>
                    
                    {target && (
                        <div className="text-right">
                            <div className="text-xs text-gray-500">
                                Objectif: {formatValue(target, format)}
                            </div>
                            <div className={`text-xs font-medium ${
                                value >= target ? 'text-green-600' : 'text-orange-600'
                            }`}>
                                {((value / target) * 100).toFixed(0)}%
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Barre de progression (si objectif fourni) */}
            {target && (
                <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${colorClass.bg} transition-all duration-300`}
                            style={{ 
                                width: `${Math.min(100, (value / target) * 100)}%` 
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Indicateur de statut (optionnel) */}
            {trend !== 'neutral' && (
                <div className={`mt-3 text-xs font-medium ${
                    trend === 'up' ? 'text-green-600' :
                    trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                }`}>
                    {trend === 'up' ? '↗ En hausse' :
                     trend === 'down' ? '↘ En baisse' :
                     '→ Stable'}
                </div>
            )}
        </div>
    );
};

// Variantes spécialisées du widget KPI
export const FinancialKPIWidget = ({ 
    title, 
    value, 
    previousValue, 
    color = 'blue',
    ...props 
}) => {
    const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return (
        <KPIWidget
            title={title}
            value={value}
            change={Math.abs(change)}
            trend={trend}
            color={color}
            format="currency"
            {...props}
        />
    );
};

export const PercentageKPIWidget = ({ 
    title, 
    value, 
    target = 100,
    color = 'blue',
    ...props 
}) => {
    const change = value - (target / 2); // Simulation de changement
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return (
        <KPIWidget
            title={title}
            value={value}
            change={Math.abs(change)}
            trend={trend}
            color={color}
            format="percentage"
            target={target}
            {...props}
        />
    );
};

export const NumberKPIWidget = ({ 
    title, 
    value, 
    previousValue,
    color = 'blue',
    ...props 
}) => {
    const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return (
        <KPIWidget
            title={title}
            value={value}
            change={Math.abs(change)}
            trend={trend}
            color={color}
            format="number"
            {...props}
        />
    );
};

export const SatisfactionKPIWidget = ({ 
    title, 
    value, 
    maxValue = 10,
    color = 'green',
    ...props 
}) => {
    const percentage = (value / maxValue) * 100;
    const trend = percentage > 80 ? 'up' : percentage < 60 ? 'down' : 'stable';
    
    return (
        <KPIWidget
            title={title}
            value={value}
            unit={`/${maxValue}`}
            change={percentage - 75} // Simulation de changement
            trend={trend}
            color={color}
            format="number"
            target={maxValue}
            {...props}
        />
    );
};

// Widget KPI avec alertes
export const AlertKPIWidget = ({ 
    title, 
    value, 
    threshold, 
    comparison = 'greater',
    color = 'blue',
    ...props 
}) => {
    const isAlert = comparison === 'greater' ? value > threshold : value < threshold;
    const alertColor = isAlert ? 'red' : color;
    const alertIcon = isAlert ? '🚨' : '✅';
    
    return (
        <KPIWidget
            title={`${title} ${alertIcon}`}
            value={value}
            color={alertColor}
            {...props}
        />
    );
};

export default KPIWidget;