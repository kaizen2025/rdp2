// src/components/search/SearchBar.js - BARRE DE RECHERCHE PRINCIPALE AVEC AUTOCOMPLÉTION
// Composant de recherche intelligent avec support clavier et modes d'affichage

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Paper,
    Tooltip,
    Popover,
    Chip,
    Typography,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    KeyboardArrowDown as DropdownIcon,
    History as HistoryIcon,
    FilterList as FilterIcon,
    Fullscreen as FullscreenIcon,
    Close as CloseIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion'; // Removed - not installed

const SearchBar = ({
    value,
    onChange,
    onSearch,
    onClear,
    onFilterClick,
    onHistoryClick,
    placeholder = "Rechercher un document, utilisateur...",
    fullWidth = true,
    size = 'medium',
    showFilters = true,
    showHistory = true,
    showFullscreen = true,
    disabled = false,
    loading = false,
    suggestions = [],
    onSuggestionSelect,
    recentSearches = [],
    filtersCount = 0,
    autoFocus = false,
    className,
    sx = {}
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
    
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Gestion des événements clavier
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            setShowSuggestions(false);
            setFocusedSuggestion(-1);
            if (onClear) onClear();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (focusedSuggestion >= 0 && suggestions[focusedSuggestion]) {
                const suggestion = suggestions[focusedSuggestion];
                if (onSuggestionSelect) onSuggestionSelect(suggestion);
                setShowSuggestions(false);
            } else if (onSearch) {
                onSearch(value);
                setShowSuggestions(false);
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setShowSuggestions(true);
            setFocusedSuggestion(prev => 
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setFocusedSuggestion(prev => prev > 0 ? prev - 1 : -1);
            return;
        }

        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            inputRef.current?.focus();
            return;
        }

        if (event.ctrlKey && event.key === 'b') {
            event.preventDefault();
            setIsExpanded(!isExpanded);
            return;
        }
    }, [value, suggestions, focusedSuggestion, onSearch, onClear, onSuggestionSelect, isExpanded]);

    // Gestion du focus et des suggestions
    const handleFocus = useCallback(() => {
        if (value || suggestions.length > 0 || recentSearches.length > 0) {
            setShowSuggestions(true);
        }
    }, [value, suggestions, recentSearches]);

    const handleBlur = useCallback((event) => {
        // Délai pour permettre le clic sur les suggestions
        setTimeout(() => {
            if (!containerRef.current?.contains(event.relatedTarget)) {
                setShowSuggestions(false);
                setFocusedSuggestion(-1);
            }
        }, 150);
    }, []);

    // Gestion des clics
    const handleSuggestionClick = useCallback((suggestion) => {
        if (onSuggestionSelect) {
            onSuggestionSelect(suggestion);
        }
        setShowSuggestions(false);
        setFocusedSuggestion(-1);
        inputRef.current?.focus();
    }, [onSuggestionSelect]);

    const handleHistoryClick = useCallback((historyItem) => {
        if (onChange) onChange(historyItem.query);
        if (onSearch) onSearch(historyItem.query);
        setShowSuggestions(false);
    }, [onChange, onSearch]);

    const handleClear = useCallback(() => {
        if (onClear) onClear();
        if (onChange) onChange('');
        inputRef.current?.focus();
    }, [onClear, onChange]);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isExpanded]);

    // Gestion du clic outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setFocusedSuggestion(-1);
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Gestion des raccourcis clavier globaux
    useEffect(() => {
        const handleGlobalKeydown = (event) => {
            // Ctrl/Cmd + K pour focus la recherche
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleGlobalKeydown);
        return () => document.removeEventListener('keydown', handleGlobalKeydown);
    }, []);

    const displayValue = isMobile && isExpanded ? value : value;

    return (
        <Box
            ref={containerRef}
            className={className}
            sx={{
                position: 'relative',
                width: fullWidth ? '100%' : 'auto',
                ...sx
            }}
        >
            <Paper
                elevation={isExpanded ? 8 : 2}
                sx={{
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s ease',
                    '&:focus-within': {
                        boxShadow: theme.shadows[8],
                        transform: isMobile ? 'scale(1.02)' : 'none'
                    }
                }}
            >
                <TextField
                    ref={inputRef}
                    fullWidth={fullWidth}
                    value={displayValue}
                    onChange={(e) => onChange?.(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    size={size}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon 
                                    color={loading ? "action" : "action"} 
                                    sx={{ 
                                        animation: loading ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' }
                                        }
                                    }} 
                                />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {/* Indicateur de filtres actifs */}
                                    {filtersCount > 0 && (
                                        <Chip
                                            label={filtersCount}
                                            size="small"
                                            color="primary"
                                            variant="filled"
                                            onClick={onFilterClick}
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    )}

                                    {/* Bouton d'historique */}
                                    {showHistory && recentSearches.length > 0 && (
                                        <Tooltip title="Historique des recherches">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    setAnchorEl(e.currentTarget);
                                                    setShowSuggestions(true);
                                                }}
                                                onBlur={handleBlur}
                                            >
                                                <HistoryIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {/* Bouton filtres */}
                                    {showFilters && (
                                        <Tooltip title="Filtres avancés">
                                            <IconButton
                                                size="small"
                                                onClick={onFilterClick}
                                            >
                                                <FilterIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {/* Bouton plein écran */}
                                    {showFullscreen && !isMobile && (
                                        <Tooltip title="Mode plein écran">
                                            <IconButton
                                                size="small"
                                                onClick={toggleExpanded}
                                            >
                                                {isExpanded ? <CloseIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {/* Bouton clear */}
                                    {value && (
                                        <Tooltip title="Effacer">
                                            <IconButton
                                                size="small"
                                                onClick={handleClear}
                                                onBlur={handleBlur}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {/* Dropdown pour plus d'options */}
                                    <Tooltip title="Plus d'options">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => setAnchorEl(e.currentTarget)}
                                        >
                                            <DropdownIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: isExpanded ? 2 : 1,
                            '& .MuiInputBase-input': {
                                padding: size === 'small' ? '8.5px 14px' : '16.5px 14px',
                                fontSize: size === 'small' ? '0.875rem' : '1rem'
                            }
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: 2,
                            },
                        },
                    }}
                />

                {/* Mode plein écran */}
                    {isExpanded && !isMobile && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                p: 2,
                                backgroundColor: 'background.paper',
                                borderRadius: 1,
                                boxShadow: theme.shadows[8],
                                border: `1px solid ${theme.palette.divider}`,
                                mt: 0.5
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Recherche intelligente DocuCortex
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Utilisez des mots-clés, des filtres avancés ou l'historique pour trouver rapidement vos documents
                            </Typography>
                        </Box>
                    )}
            </Paper>

            {/* Menu d'options */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ p: 1, pb: 0.5 }}>
                        Options de recherche
                    </Typography>
                    
                    <Tooltip title="Filtres avancés">
                        <IconButton
                            fullWidth
                            onClick={() => {
                                onFilterClick?.();
                                setAnchorEl(null);
                            }}
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                        >
                            <FilterIcon fontSize="small" sx={{ mr: 1 }} />
                            Filtres avancés
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Historique">
                        <IconButton
                            fullWidth
                            onClick={() => {
                                onHistoryClick?.();
                                setAnchorEl(null);
                            }}
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                        >
                            <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                            Historique des recherches
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Paramètres de recherche">
                        <IconButton
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                        >
                            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                            Paramètres
                        </IconButton>
                    </Tooltip>
                </Box>
            </Popover>

            {/* Suggestions et historique */}
                {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
                        <Paper
                            elevation={8}
                            sx={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                mt: 0.5,
                                maxHeight: 400,
                                overflow: 'auto',
                                backgroundColor: 'background.paper'
                            }}
                        >
                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                                        Suggestions
                                    </Typography>
                                    {suggestions.map((suggestion, index) => (
                                        <Box
                                            key={`suggestion-${index}`}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1,
                                                cursor: 'pointer',
                                                borderRadius: 1,
                                                backgroundColor: index === focusedSuggestion ? 'action.hover' : 'transparent',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <SearchIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                {suggestion}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Historique */}
                            {recentSearches.length > 0 && (
                                <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                                        Recherches récentes
                                    </Typography>
                                    {recentSearches.map((historyItem, index) => (
                                        <Box
                                            key={`history-${index}`}
                                            onClick={() => handleHistoryClick(historyItem)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1,
                                                cursor: 'pointer',
                                                borderRadius: 1,
                                                '&:hover': {
                                                    backgroundColor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <HistoryIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                {historyItem.query}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                                {new Date(historyItem.timestamp).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Paper>
                )}
        </Box>
    );
};

export default React.memo(SearchBar);
