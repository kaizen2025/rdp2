// src/components/loan-management/LoanListVirtualized.js - COMPOSANT VIRTUALISÉ OPTIMISÉ
// Gestion avancée de virtualisation pour des milliers de prêts avec react-window

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Paper, Chip, Typography, Tooltip, IconButton, LinearProgress, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon, Speed as SpeedIcon, Assessment as AssessmentIcon } from '@mui/icons-material';

// Import des composants optimisés existants
import { StatusChip, LoanRow } from './LoanList';

// Import des services de performance
import PerformanceMonitor from '../../utils/PerformanceMonitor';
import { debounce } from '../../utils/debounce';

const VIRTUALIZATION_THRESHOLD = 100; // Seuil pour activer la virtualisation
const DEFAULT_ROW_HEIGHT = 80; // Hauteur par défaut des lignes
const OVERSCAN_COUNT = 5; // Nombre de lignes à rendre en avance/arrière

// Configuration des statuts (copie depuis LoanList.js)
const STATUS_CONFIG = {
    active: { label: 'Actif', color: 'success', priority: 1 },
    reserved: { label: 'Réservé', color: 'info', priority: 2 },
    overdue: { label: 'En retard', color: 'warning', priority: 3 },
    critical: { label: 'Critique', color: 'error', priority: 4 },
    returned: { label: 'Retourné', color: 'default', priority: 5 },
    cancelled: { label: 'Annulé', color: 'default', priority: 6 },
};

// 📊 MÉTRIQUES DE PERFORMANCE EN TEMPS RÉEL
const PerformanceMetrics = React.memo(({ metrics }) => {
    if (!metrics.isVisible) return null;

    return (
        <Paper elevation={3} sx={{ 
            position: 'fixed', 
            top: 10, 
            right: 10, 
            zIndex: 9999, 
            p: 2, 
            minWidth: 280,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white'
        }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                📊 Métriques Performance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>🎯 Rendu:</span>
                    <span>{metrics.renderTime.toFixed(2)}ms</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>🧠 Mémoire:</span>
                    <span>{(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>🖼️ Éléments:</span>
                    <span>{metrics.itemCount}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>⚡ FPS Scroll:</span>
                    <span style={{ color: metrics.fps >= 55 ? '#4caf50' : metrics.fps >= 30 ? '#ff9800' : '#f44336' }}>
                        {metrics.fps.toFixed(0)} FPS
                    </span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>🚀 Virtualisation:</span>
                    <span style={{ color: 'var(--accent-color)' }}>Active</span>
                </Box>
            </Box>
        </Paper>
    );
});

// 🎯 COMPOSANT D'ÉLÉMENT VIRTUALISÉ OPTIMISÉ
const VirtualizedLoanItem = React.memo(({ 
    index, 
    style, 
    data 
}) => {
    const { loans, selectedLoans, onSelectLoan, onReturn, onEdit, onExtend, onHistory, onCancel, getUserColor, sortConfig } = data;
    const loan = loans[index];

    if (!loan) {
        return (
            <div style={style}>
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress sx={{ width: '80%' }} />
                </Box>
            </div>
        );
    }

    return (
        <div style={style}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <LoanRow
                    loan={loan}
                    isSelected={selectedLoans.has(loan.id)}
                    onSelect={onSelectLoan}
                    onReturn={onReturn}
                    onEdit={onEdit}
                    onExtend={onExtend}
                    onHistory={onHistory}
                    onCancel={onCancel}
                    sortConfig={sortConfig}
                    onSort={() => {}} // Désactiver le tri pour la virtualisation
                    getUserColor={getUserColor}
                    compact={true} // Mode compact pour la virtualisation
                />
            </Box>
        </div>
    );
}, (prevProps, nextProps) => {
    // Optimisation: Ne re-rendre que si les données ont changé
    const prevLoan = prevProps.data.loans[prevProps.index];
    const nextLoan = nextProps.data.loans[nextProps.index];
    
    return (
        prevLoan?.id === nextLoan?.id &&
        prevLoan?.status === nextLoan?.status &&
        prevLoan?.updatedAt === nextLoan?.updatedAt &&
        prevProps.data.selectedLoans.has(loan?.id) === nextProps.data.selectedLoans.has(loan?.id)
    );
});

// 🔄 COMPTEUR DE SCROLL INTELLIGENT
const ScrollSpeedMonitor = React.memo(({ onScrollSpeedChange }) => {
    const lastScrollTime = useRef(0);
    const scrollPositions = useRef([]);

    const handleScroll = useCallback((event) => {
        const now = performance.now();
        const timeDiff = now - lastScrollTime.current;
        
        if (timeDiff > 0) {
            const scrollSpeed = Math.abs(event.scrollTop - (scrollPositions.current[scrollPositions.current.length - 1] || 0)) / timeDiff;
            
            // Stocker les 5 dernières vitesses pour calculer une moyenne
            scrollPositions.current.push(event.scrollTop);
            if (scrollPositions.current.length > 5) {
                scrollPositions.current.shift();
            }
            
            onScrollSpeedChange(scrollSpeed);
        }
        
        lastScrollTime.current = now;
    }, [onScrollSpeedChange]);

    return null; // Composant invisible qui monitore le scroll
});

// 🎨 COMPOSANT PRINCIPAL VIRTUALISÉ
const LoanListVirtualized = ({
    loans,
    selectedLoans,
    onSelectLoan,
    onReturn,
    onEdit,
    onExtend,
    onHistory,
    onCancel,
    getUserColor,
    sortConfig,
    onSort,
    enableMetrics = true,
    height = 600,
    overscan = OVERSCAN_COUNT,
    rowHeight = DEFAULT_ROW_HEIGHT,
    enableInfiniteScroll = false,
    loadMoreItems = null,
    hasNextPage = false,
    isNextPageLoading = false
}) => {
    const listRef = useRef(null);
    const [scrollSpeed, setScrollSpeed] = useState(0);
    const [showMetrics, setShowMetrics] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    
    // 🔍 DÉTECTION AUTOMATIQUE DE LA VIRTUALISATION
    const shouldVirtualize = useMemo(() => {
        return loans.length > VIRTUALIZATION_THRESHOLD;
    }, [loans.length]);

    // 📊 SURVEILLANCE DE PERFORMANCE
    const performanceData = useMemo(() => {
        const startTime = performance.now();
        const memoryInfo = performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
        } : null;

        return {
            itemCount: loans.length,
            memoryUsage: memoryInfo?.used || 0,
            startTime
        };
    }, [loans.length]);

    // 🎯 MÉTRIQUES EN TEMPS RÉEL
    const [metrics, setMetrics] = useState({
        renderTime: 0,
        memoryUsage: 0,
        fps: 60,
        itemCount: 0,
        isVisible: false
    });

    // 📈 CALCUL AUTOMATIQUE DE LA HAUTEUR DYNAMIQUE
    const dynamicRowHeight = useMemo(() => {
        // Calculer la hauteur basée sur le contenu et la taille de l'écran
        const screenHeight = window.innerHeight;
        const maxHeight = Math.min(screenHeight - 300, height);
        const estimatedItems = Math.floor(maxHeight / rowHeight);
        
        return rowHeight;
    }, [height, rowHeight]);

    // 🎨 RENDU DE LA LISTE AVEC VIRTUALISATION
    const renderVirtualizedList = useCallback(() => {
        const itemData = {
            loans,
            selectedLoans,
            onSelectLoan,
            onReturn,
            onEdit,
            onExtend,
            onHistory,
            onCancel,
            getUserColor,
            sortConfig
        };

        return (
            <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
                {/* Indicateur de défilement */}
                {isScrolling && (
                    <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1000,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        fontSize: '0.8rem'
                    }}>
                        Vitesse: {scrollSpeed.toFixed(1)} px/ms
                    </Box>
                )}
                
                <List
                    ref={listRef}
                    height={height}
                    itemCount={loans.length}
                    itemSize={dynamicRowHeight}
                    itemData={itemData}
                    overscanCount={overscan}
                    onScroll={({ scrollTop, scrollOffset, scrollDirection }) => {
                        setIsScrolling(true);
                        
                        // Annuler le scrolling après un délai
                        clearTimeout(handleScrollTimeout.current);
                        handleScrollTimeout.current = setTimeout(() => {
                            setIsScrolling(false);
                        }, 150);
                        
                        // Gestion du scroll infini
                        if (enableInfiniteScroll && hasNextPage && !isNextPageLoading) {
                            const threshold = height * 0.8; // Charger quand 80% scrollé
                            const maxScroll = (loans.length * dynamicRowHeight) - height;
                            if (scrollTop > maxScroll - threshold) {
                                loadMoreItems?.();
                            }
                        }
                    }}
                >
                    {VirtualizedLoanItem}
                </List>
                
                {/* Indicateur de chargement infini */}
                {enableInfiniteScroll && isNextPageLoading && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <LinearProgress sx={{ width: 100 }} color="inherit" />
                        <Typography variant="caption">Chargement...</Typography>
                    </Box>
                )}
            </Box>
        );
    }, [
        loans, selectedLoans, onSelectLoan, onReturn, onEdit, onExtend, onHistory, onCancel,
        getUserColor, sortConfig, height, dynamicRowHeight, overscan,
        enableInfiniteScroll, hasNextPage, isNextPageLoading, loadMoreItems,
        scrollSpeed, isScrolling
    ]);

    // 🔍 GESTION DU TIMEOUT DE SCROLL
    const handleScrollTimeout = useRef(null);

    // 📊 MÉTRIQUES EN TEMPS RÉEL
    useEffect(() => {
        if (!enableMetrics) return;

        const measurePerformance = () => {
            const endTime = performance.now();
            const renderTime = endTime - performanceData.startTime;
            
            // Calcul approximatif du FPS basé sur le temps de rendu
            const fps = Math.min(60, Math.max(1, 1000 / renderTime));

            setMetrics({
                renderTime,
                memoryUsage: performanceData.memoryUsage,
                fps,
                itemCount: performanceData.itemCount,
                isVisible: showMetrics
            });
        };

        // Mesurer la performance après chaque rendu
        const timeoutId = setTimeout(measurePerformance, 16); // ~60fps
        return () => clearTimeout(timeoutId);
    }, [loans, performanceData, enableMetrics, showMetrics]);

    // 🎨 RENDU CONDITIONNEL
    if (!shouldVirtualize) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                <Typography variant="body2">
                    💡 La virtualisation n'est pas nécessaire pour {loans.length} éléments (seuil: {VIRTUALIZATION_THRESHOLD}).
                    Utilisation du mode liste classique pour une performance optimale.
                </Typography>
            </Alert>
        );
    }

    return (
        <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
            {/* Barre d'informations de performance */}
            <Paper elevation={1} sx={{ 
                p: 1, 
                mb: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: 'primary.light',
                color: 'primary.contrastText'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SpeedIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Mode Virtualisé • {loans.length.toLocaleString()} éléments
                    </Typography>
                    <Chip 
                        label="Performance Optimisée" 
                        size="small" 
                        color="success"
                        icon={<SpeedIcon />}
                    />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        startIcon={<AssessmentIcon />}
                        onClick={() => setShowMetrics(!showMetrics)}
                    >
                        {showMetrics ? 'Masquer' : 'Afficher'} Métriques
                    </Button>
                    
                    <Tooltip title="Rafraîchir">
                        <IconButton size="small" color="inherit">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* Liste virtualisée */}
            <Paper elevation={2} sx={{ 
                flex: 1, 
                overflow: 'hidden',
                backgroundColor: 'background.paper'
            }}>
                {renderVirtualizedList()}
            </Paper>

            {/* Métriques de performance */}
            {enableMetrics && (
                <>
                    <ScrollSpeedMonitor onScrollSpeedChange={setScrollSpeed} />
                    <PerformanceMetrics metrics={metrics} />
                </>
            )}

            {/* Informations de débogage en mode développement */}
            {process.env.NODE_ENV === 'development' && (
                <Paper elevation={1} sx={{ 
                    position: 'absolute', 
                    bottom: 10, 
                    left: 10, 
                    p: 1, 
                    fontSize: '0.7rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    zIndex: 1000
                }}>
                    <Typography variant="caption">
                        Debug: {loans.length} éléments • Virtualisation: {shouldVirtualize ? 'Active' : 'Inactive'} • 
                        Hauteur ligne: {dynamicRowHeight}px • Overscan: {overscan}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default React.memo(LoanListVirtualized);