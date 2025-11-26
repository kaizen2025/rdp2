// src/components/dashboard/DashboardConfiguration.js - Configuration Layout & Personnalisation
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Switch,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Chip,
    Avatar,
    Divider,
    Alert,
    useTheme,
    useMediaQuery,
    Tooltip,
    Badge
} from '@mui/material';
import {
    DragIndicator,
    Dashboard,
    Timeline,
    BarChart,
    TrendingUp,
    Warning,
    CheckCircle,
    Settings,
    Save,
    Restore,
    Add,
    Remove,
    Edit,
    Visibility,
    VisibilityOff,
    Fullscreen,
    ColorLens,
    Notifications,
    Timer,
    Speed
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

// Configuration des widgets disponibles
const AVAILABLE_WIDGETS = {
    loansStats: {
        id: 'loansStats',
        name: 'Statistiques Prêts',
        description: 'Métriques principales des prêts en temps réel',
        icon: <Timeline />,
        category: 'analytics',
        defaultSize: 'large',
        customizable: true,
        minWidth: 4,
        minHeight: 2
    },
    activityChart: {
        id: 'activityChart',
        name: 'Graphique Activité',
        description: 'Graphiques d\'activité temporelle',
        icon: <BarChart />,
        category: 'charts',
        defaultSize: 'large',
        customizable: true,
        minWidth: 6,
        minHeight: 3
    },
    topUsers: {
        id: 'topUsers',
        name: 'Top Utilisateurs',
        description: 'Utilisateurs les plus actifs',
        icon: <TrendingUp />,
        category: 'users',
        defaultSize: 'medium',
        customizable: true,
        minWidth: 4,
        minHeight: 2
    },
    alerts: {
        id: 'alerts',
        name: 'Résumé Alertes',
        description: 'Alertes et notifications système',
        icon: <Warning />,
        category: 'monitoring',
        defaultSize: 'medium',
        customizable: true,
        minWidth: 4,
        minHeight: 2
    },
    performance: {
        id: 'performance',
        name: 'Métriques Performance',
        description: 'Performances système et métriques',
        icon: <Speed />,
        category: 'monitoring',
        defaultSize: 'large',
        customizable: true,
        minWidth: 6,
        minHeight: 3
    },
    loanCalendar: {
        id: 'loanCalendar',
        name: 'Calendrier Prêts',
        description: 'Vue calendrier des prêts',
        icon: <Dashboard />,
        category: 'calendar',
        defaultSize: 'large',
        customizable: false,
        minWidth: 6,
        minHeight: 4
    },
    equipmentStatus: {
        id: 'equipmentStatus',
        name: 'Statut Équipements',
        description: 'État des équipements en temps réel',
        icon: <CheckCircle />,
        category: 'monitoring',
        defaultSize: 'medium',
        customizable: true,
        minWidth: 4,
        minHeight: 2
    }
};

// Layouts prédéfinis
const PREDEFINED_LAYOUTS = {
    default: {
        id: 'default',
        name: 'Layout Standard',
        description: 'Configuration par défaut équilibrée',
        widgets: ['loansStats', 'activityChart', 'topUsers', 'alerts', 'performance']
    },
    monitoring: {
        id: 'monitoring',
        name: 'Layout Monitoring',
        description: 'Focus sur le monitoring et les alertes',
        widgets: ['performance', 'alerts', 'activityChart', 'equipmentStatus']
    },
    analytics: {
        id: 'analytics',
        name: 'Layout Analyses',
        description: 'Focus sur les analyses et statistiques',
        widgets: ['loansStats', 'activityChart', 'topUsers', 'performance']
    },
    compact: {
        id: 'compact',
        name: 'Layout Compact',
        description: 'Vue compacte pour petits écrans',
        widgets: ['loansStats', 'alerts', 'performance']
    }
};

// Thèmes de couleurs prédéfinis
const COLOR_THEMES = {
    default: {
        name: 'Défaut',
        primary: '#2196f3',
        secondary: '#9c27b0',
        background: '#fafafa',
        surface: '#ffffff'
    },
    blue: {
        name: 'Bleu',
        primary: '#1976d2',
        secondary: '#42a5f5',
        background: '#e3f2fd',
        surface: '#ffffff'
    },
    green: {
        name: 'Vert',
        primary: '#388e3c',
        secondary: '#66bb6a',
        background: '#e8f5e8',
        surface: '#ffffff'
    },
    purple: {
        name: 'Violet',
        primary: '#7b1fa2',
        secondary: '#ab47bc',
        background: '#f3e5f5',
        surface: '#ffffff'
    },
    dark: {
        name: 'Sombre',
        primary: '#90caf9',
        secondary: '#ce93d8',
        background: '#121212',
        surface: '#1e1e1e'
    }
};

const DashboardConfiguration = ({
    open,
    onClose,
    currentLayout,
    onLayoutChange,
    availableWidgets = AVAILABLE_WIDGETS,
    predefinedLayouts = PREDEFINED_LAYOUTS,
    colorThemes = COLOR_THEMES,
    onSave,
    onReset
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // États de configuration
    const [configuration, setConfiguration] = useState(() => {
        const saved = localStorage.getItem('dashboard_configuration');
        return saved ? JSON.parse(saved) : {
            layout: currentLayout || 'default',
            widgets: {},
            theme: 'default',
            settings: {
                autoRefresh: true,
                refreshInterval: 30000,
                animationsEnabled: true,
                compactMode: false,
                showAnimations: true,
                maxWidgets: 10
            },
            customizations: {
                gridSize: 12,
                widgetSpacing: 2,
                borderRadius: 8,
                shadowsEnabled: true
            }
        };
    });
    
    // États de l'interface
    const [activeTab, setActiveTab] = useState('layout');
    const [selectedLayout, setSelectedLayout] = useState(configuration.layout);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    
    // Synchronisation avec le layout actuel
    useEffect(() => {
        if (currentLayout) {
            setConfiguration(prev => ({ ...prev, layout: currentLayout }));
            setSelectedLayout(currentLayout);
        }
    }, [currentLayout]);
    
    // Détection des changements non sauvegardés
    useEffect(() => {
        const hasChanges = JSON.stringify(configuration) !== localStorage.getItem('dashboard_configuration');
        setUnsavedChanges(hasChanges);
    }, [configuration]);
    
    // Gestion des widgets dans le layout
    const addWidgetToLayout = useCallback((widgetId) => {
        const widget = availableWidgets[widgetId];
        if (!widget) return;
        
        const newWidget = {
            id: `${widgetId}_${Date.now()}`,
            type: widgetId,
            name: widget.name,
            visible: true,
            order: Object.keys(configuration.widgets).length,
            size: widget.defaultSize,
            properties: {}
        };
        
        setConfiguration(prev => ({
            ...prev,
            widgets: {
                ...prev.widgets,
                [newWidget.id]: newWidget
            }
        }));
    }, [availableWidgets, configuration.widgets]);
    
    const removeWidgetFromLayout = useCallback((widgetId) => {
        setConfiguration(prev => {
            const newWidgets = { ...prev.widgets };
            delete newWidgets[widgetId];
            
            // Réorganiser les ordres
            Object.values(newWidgets)
                .filter(w => w.order > prev.widgets[widgetId]?.order)
                .forEach(w => {
                    newWidgets[w.id].order -= 1;
                });
            
            return {
                ...prev,
                widgets: newWidgets
            };
        });
    }, [configuration.widgets]);
    
    const updateWidgetProperties = useCallback((widgetId, properties) => {
        setConfiguration(prev => ({
            ...prev,
            widgets: {
                ...prev.widgets,
                [widgetId]: {
                    ...prev.widgets[widgetId],
                    properties: {
                        ...prev.widgets[widgetId].properties,
                        ...properties
                    }
                }
            }
        }));
    }, []);
    
    const toggleWidgetVisibility = useCallback((widgetId) => {
        setConfiguration(prev => ({
            ...prev,
            widgets: {
                ...prev.widgets,
                [widgetId]: {
                    ...prev.widgets[widgetId],
                    visible: !prev.widgets[widgetId].visible
                }
            }
        }));
    }, []);
    
    // Gestion du drag & drop pour réorganiser les widgets
    const handleDragEnd = useCallback((result) => {
        if (!result.destination) return;
        
        const { source, destination } = result;
        const widgetIds = Object.keys(configuration.widgets).sort(
            (a, b) => configuration.widgets[a].order - configuration.widgets[b].order
        );
        
        const reorderedWidgetIds = Array.from(widgetIds);
        const [removed] = reorderedWidgetIds.splice(source.index, 1);
        reorderedWidgetIds.splice(destination.index, 0, removed);
        
        setConfiguration(prev => {
            const newWidgets = { ...prev.widgets };
            reorderedWidgetIds.forEach((widgetId, index) => {
                newWidgets[widgetId].order = index;
            });
            
            return {
                ...prev,
                widgets: newWidgets
            };
        });
    }, [configuration.widgets]);
    
    // Application d'un layout prédéfini
    const applyPredefinedLayout = useCallback((layoutId) => {
        const layout = predefinedLayouts[layoutId];
        if (!layout) return;
        
        const newWidgets = {};
        layout.widgets.forEach((widgetType, index) => {
            const widget = availableWidgets[widgetType];
            if (widget) {
                newWidgets[`${widgetType}_${Date.now()}_${index}`] = {
                    id: `${widgetType}_${Date.now()}_${index}`,
                    type: widgetType,
                    name: widget.name,
                    visible: true,
                    order: index,
                    size: widget.defaultSize,
                    properties: {}
                };
            }
        });
        
        setConfiguration(prev => ({
            ...prev,
            layout: layoutId,
            widgets: newWidgets
        }));
        setSelectedLayout(layoutId);
    }, [predefinedLayouts, availableWidgets]);
    
    // Sauvegarde de la configuration
    const saveConfiguration = useCallback(() => {
        localStorage.setItem('dashboard_configuration', JSON.stringify(configuration));
        onLayoutChange?.(configuration.layout);
        onSave?.(configuration);
        setUnsavedChanges(false);
        
        // Notification de sauvegarde
        console.log('[DashboardConfig] Configuration sauvegardée:', configuration);
    }, [configuration, onLayoutChange, onSave]);
    
    // Réinitialisation de la configuration
    const resetConfiguration = useCallback(() => {
        const defaultConfig = {
            layout: 'default',
            widgets: {},
            theme: 'default',
            settings: {
                autoRefresh: true,
                refreshInterval: 30000,
                animationsEnabled: true,
                compactMode: false,
                showAnimations: true,
                maxWidgets: 10
            },
            customizations: {
                gridSize: 12,
                widgetSpacing: 2,
                borderRadius: 8,
                shadowsEnabled: true
            }
        };
        
        setConfiguration(defaultConfig);
        setSelectedLayout('default');
        localStorage.removeItem('dashboard_configuration');
        onReset?.();
    }, [onReset]);
    
    // Gestion des onglets
    const renderTabContent = () => {
        switch (activeTab) {
            case 'layout':
                return <LayoutTab />;
            case 'widgets':
                return <WidgetsTab />;
            case 'themes':
                return <ThemesTab />;
            case 'settings':
                return <SettingsTab />;
            default:
                return <LayoutTab />;
        }
    };
    
    // Onglet Layout
    const LayoutTab = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Layouts Prédéfinis
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.values(predefinedLayouts).map((layout) => (
                    <Grid item xs={12} sm={6} key={layout.id}>
                        <Card 
                            variant={selectedLayout === layout.id ? 'elevation' : 'outlined'}
                            sx={{ 
                                cursor: 'pointer',
                                border: selectedLayout === layout.id ? 2 : 1,
                                borderColor: selectedLayout === layout.id ? 'primary.main' : 'divider',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[4]
                                }
                            }}
                            onClick={() => setSelectedLayout(layout.id)}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {layout.name}
                                    </Typography>
                                    {selectedLayout === layout.id && (
                                        <CheckCircle color="primary" />
                                    )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {layout.description}
                                </Typography>
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {layout.widgets.map((widgetType, index) => {
                                        const widget = availableWidgets[widgetType];
                                        return (
                                            <Chip
                                                key={index}
                                                label={widget?.name || widgetType}
                                                size="small"
                                                variant="outlined"
                                                icon={widget?.icon}
                                            />
                                        );
                                    })}
                                </Box>
                            </CardContent>
                            <CardActionArea onClick={() => applyPredefinedLayout(layout.id)}>
                                <Box p={2} pt={0}>
                                    <Button fullWidth variant={selectedLayout === layout.id ? 'contained' : 'outlined'}>
                                        {selectedLayout === layout.id ? 'Layout Actuel' : 'Appliquer'}
                                    </Button>
                                </Box>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            {Object.keys(configuration.widgets).length > 0 && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Réorganisation des Widgets
                    </Typography>
                    
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="widgets-list">
                            {(provided) => (
                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                    {Object.values(configuration.widgets)
                                        .sort((a, b) => a.order - b.order)
                                        .map((widget, index) => {
                                            const widgetConfig = availableWidgets[widget.type];
                                            return (
                                                <Draggable 
                                                    key={widget.id} 
                                                    draggableId={widget.id} 
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <ListItem
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            sx={{
                                                                mb: 1,
                                                                bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                                                borderRadius: 1,
                                                                border: 1,
                                                                borderColor: 'divider'
                                                            }}
                                                        >
                                                            <ListItemIcon {...provided.dragHandleProps}>
                                                                <DragIndicator />
                                                            </ListItemIcon>
                                                            
                                                            <ListItemIcon>
                                                                {widgetConfig?.icon}
                                                            </ListItemIcon>
                                                            
                                                            <ListItemText
                                                                primary={widget.name}
                                                                secondary={`${widgetConfig?.description || 'Widget'} • Position ${index + 1}`}
                                                            />
                                                            
                                                            <ListItemSecondaryAction>
                                                                <Tooltip title={widget.visible ? "Masquer" : "Afficher"}>
                                                                    <IconButton 
                                                                        onClick={() => toggleWidgetVisibility(widget.id)}
                                                                        color={widget.visible ? "primary" : "default"}
                                                                    >
                                                                        {widget.visible ? <Visibility /> : <VisibilityOff />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                                
                                                                <Tooltip title="Supprimer">
                                                                    <IconButton 
                                                                        onClick={() => removeWidgetFromLayout(widget.id)}
                                                                        color="error"
                                                                    >
                                                                        <Remove />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </ListItemSecondaryAction>
                                                        </ListItem>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                    {provided.placeholder}
                                </List>
                            )}
                        </Droppable>
                    </DragDropContext>
                </>
            )}
        </Box>
    );
    
    // Onglet Widgets
    const WidgetsTab = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Widgets Disponibles
            </Typography>
            
            <Grid container spacing={2}>
                {Object.values(availableWidgets).map((widget) => {
                    const isInLayout = Object.values(configuration.widgets).some(w => w.type === widget.id);
                    
                    return (
                        <Grid item xs={12} sm={6} key={widget.id}>
                            <Card 
                                variant={isInLayout ? 'elevation' : 'outlined'}
                                sx={{ 
                                    opacity: isInLayout ? 0.7 : 1,
                                    border: isInLayout ? 2 : 1,
                                    borderColor: isInLayout ? 'primary.main' : 'divider'
                                }}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {widget.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {widget.name}
                                            </Typography>
                                            <Chip 
                                                label={widget.category} 
                                                size="small" 
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {widget.description}
                                    </Typography>
                                    
                                    <Box display="flex" gap={1}>
                                        <Chip 
                                            label={`Taille: ${widget.defaultSize}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        
                                        {widget.customizable && (
                                            <Chip 
                                                label="Personnalisable"
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </CardContent>
                                
                                <CardActionArea 
                                    disabled={isInLayout}
                                    onClick={() => addWidgetToLayout(widget.id)}
                                >
                                    <Box p={2} pt={0}>
                                        <Button 
                                            fullWidth 
                                            variant="contained"
                                            startIcon={isInLayout ? <CheckCircle /> : <Add />}
                                            disabled={isInLayout}
                                        >
                                            {isInLayout ? 'Déjà ajouté' : 'Ajouter'}
                                        </Button>
                                    </Box>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
    
    // Onglet Thèmes
    const ThemesTab = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Thèmes de Couleurs
            </Typography>
            
            <Grid container spacing={2}>
                {Object.entries(colorThemes).map(([themeId, themeConfig]) => (
                    <Grid item xs={12} sm={6} key={themeId}>
                        <Card 
                            variant={configuration.theme === themeId ? 'elevation' : 'outlined'}
                            sx={{ 
                                cursor: 'pointer',
                                border: configuration.theme === themeId ? 2 : 1,
                                borderColor: configuration.theme === themeId ? 'primary.main' : 'divider',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setConfiguration(prev => ({ ...prev, theme: themeId }))}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {themeConfig.name}
                                    </Typography>
                                    {configuration.theme === themeId && (
                                        <Badge color="primary" badgeContent="Actuel" />
                                    )}
                                </Box>
                                
                                <Box display="flex" gap={1}>
                                    <Box 
                                        sx={{ 
                                            width: 40, 
                                            height: 40, 
                                            bgcolor: themeConfig.primary,
                                            borderRadius: '50%',
                                            border: 2,
                                            borderColor: 'white'
                                        }}
                                    />
                                    <Box 
                                        sx={{ 
                                            width: 40, 
                                            height: 40, 
                                            bgcolor: themeConfig.secondary,
                                            borderRadius: '50%',
                                            border: 2,
                                            borderColor: 'white'
                                        }}
                                    />
                                    <Box 
                                        sx={{ 
                                            width: 40, 
                                            height: 40, 
                                            bgcolor: themeConfig.background,
                                            borderRadius: '50%',
                                            border: 1,
                                            borderColor: 'divider'
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
    
    // Onglet Paramètres
    const SettingsTab = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Paramètres Généraux
            </Typography>
            
            <List>
                <ListItem>
                    <ListItemText 
                        primary="Actualisation automatique"
                        secondary="Mise à jour automatique des données"
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            checked={configuration.settings.autoRefresh}
                            onChange={(e) => setConfiguration(prev => ({
                                ...prev,
                                settings: { ...prev.settings, autoRefresh: e.target.checked }
                            }))}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                    <ListItemText 
                        primary="Animations activées"
                        secondary="Animations et transitions visuelles"
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            checked={configuration.settings.animationsEnabled}
                            onChange={(e) => setConfiguration(prev => ({
                                ...prev,
                                settings: { ...prev.settings, animationsEnabled: e.target.checked }
                            }))}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                    <ListItemText 
                        primary="Mode compact"
                        secondary="Affichage compact des widgets"
                    />
                    <ListItemSecondaryAction>
                        <Switch
                            checked={configuration.settings.compactMode}
                            onChange={(e) => setConfiguration(prev => ({
                                ...prev,
                                settings: { ...prev.settings, compactMode: e.target.checked }
                            }))}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                    <ListItemText 
                        primary="Intervalle d'actualisation"
                        secondary={`${configuration.settings.refreshInterval / 1000} secondes`}
                    />
                    <Box sx={{ width: 200, ml: 2 }}>
                        <Slider
                            value={configuration.settings.refreshInterval}
                            onChange={(_, value) => setConfiguration(prev => ({
                                ...prev,
                                settings: { ...prev.settings, refreshInterval: value }
                            }))}
                            min={5000}
                            max={300000}
                            step={5000}
                            marks={[
                                { value: 5000, label: '5s' },
                                { value: 30000, label: '30s' },
                                { value: 60000, label: '1m' },
                                { value: 300000, label: '5m' }
                            ]}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
                Personnalisation Avancée
            </Typography>
            
            <List>
                <ListItem>
                    <ListItemText 
                        primary="Taille de la grille"
                        secondary={`${configuration.customizations.gridSize} colonnes`}
                    />
                    <Box sx={{ width: 200 }}>
                        <Slider
                            value={configuration.customizations.gridSize}
                            onChange={(_, value) => setConfiguration(prev => ({
                                ...prev,
                                customizations: { ...prev.customizations, gridSize: value }
                            }))}
                            min={6}
                            max={24}
                            step={1}
                            marks={[
                                { value: 6, label: '6' },
                                { value: 12, label: '12' },
                                { value: 24, label: '24' }
                            ]}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </ListItem>
                
                <ListItem>
                    <ListItemText 
                        primary="Espacement widgets"
                        secondary={`${configuration.customizations.widgetSpacing * 8}px`}
                    />
                    <Box sx={{ width: 200 }}>
                        <Slider
                            value={configuration.customizations.widgetSpacing}
                            onChange={(_, value) => setConfiguration(prev => ({
                                ...prev,
                                customizations: { ...prev.customizations, widgetSpacing: value }
                            }))}
                            min={1}
                            max={4}
                            step={0.5}
                            marks={[
                                { value: 1, label: '8px' },
                                { value: 2, label: '16px' },
                                { value: 4, label: '32px' }
                            ]}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value * 8}px`}
                        />
                    </Box>
                </ListItem>
            </List>
        </Box>
    );
    
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { height: isMobile ? '100vh' : '80vh' }
            }}
        >
            <Box sx={{ display: 'flex', height: '100%' }}>
                {/* Sidebar avec onglets */}
                <Box 
                    sx={{ 
                        width: 250, 
                        borderRight: 1, 
                        borderColor: 'divider',
                        display: { xs: 'none', md: 'block' }
                    }}
                >
                    <List>
                        {[
                            { id: 'layout', label: 'Layouts', icon: <Dashboard /> },
                            { id: 'widgets', label: 'Widgets', icon: <Settings /> },
                            { id: 'themes', label: 'Thèmes', icon: <ColorLens /> },
                            { id: 'settings', label: 'Paramètres', icon: <Settings /> }
                        ].map((tab) => (
                            <ListItem 
                                key={tab.id}
                                button
                                selected={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <ListItemIcon>{tab.icon}</ListItemIcon>
                                <ListItemText primary={tab.label} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
                
                {/* Contenu principal */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                Configuration Dashboard
                            </Typography>
                            
                            {unsavedChanges && (
                                <Alert severity="warning" sx={{ maxWidth: 300 }}>
                                    Modifications non sauvegardées
                                </Alert>
                            )}
                        </Box>
                        
                        {/* Onglets mobiles */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, mt: 2, gap: 1 }}>
                            {[
                                { id: 'layout', label: 'Layouts' },
                                { id: 'widgets', label: 'Widgets' },
                                { id: 'themes', label: 'Thèmes' },
                                { id: 'settings', label: 'Paramètres' }
                            ].map((tab) => (
                                <Button
                                    key={tab.id}
                                    size="small"
                                    variant={activeTab === tab.id ? 'contained' : 'outlined'}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                    
                    {/* Contenu des onglets */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderTabContent()}
                            </motion.div>
                        </AnimatePresence>
                    </Box>
                    
                    {/* Actions */}
                    <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Button 
                                onClick={resetConfiguration}
                                startIcon={<Restore />}
                                color="warning"
                            >
                                Réinitialiser
                            </Button>
                            
                            <Box display="flex" gap={1}>
                                <Button onClick={onClose}>
                                    Annuler
                                </Button>
                                <Button 
                                    onClick={saveConfiguration}
                                    variant="contained"
                                    startIcon={<Save />}
                                    disabled={!unsavedChanges}
                                >
                                    Sauvegarder
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

export default DashboardConfiguration;