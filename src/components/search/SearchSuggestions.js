// src/components/search/SearchSuggestions.js - SYSTÈME DE SUGGESTIONS INTELLIGENTES
// Composant d'affichage des suggestions avec catégorisation et actions rapides

import React, { useMemo } from 'react';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Chip,
    Divider,
    Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Description as DocumentIcon,
    Person as PersonIcon,
    Category as CategoryIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    History as HistoryIcon,
    FilterList as FilterIcon,
    ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const SearchSuggestions = ({
    suggestions = [],
    recentSearches = [],
    popularSearches = [],
    documentSuggestions = [],
    userSuggestions = [],
    categorySuggestions = [],
    statusSuggestions = [],
    open = false,
    onSuggestionSelect,
    onClearSuggestions,
    maxHeight = 400,
    showCategories = true,
    showPopular = true,
    showRecent = true,
    className
}) => {
    const theme = useTheme();

    // Catégorisation des suggestions
    const categorizedSuggestions = useMemo(() => {
        const categories = {
            documents: documentSuggestions.filter(item => item.type === 'document'),
            users: userSuggestions.filter(item => item.type === 'user'),
            categories: categorySuggestions.filter(item => item.type === 'category'),
            status: statusSuggestions.filter(item => item.type === 'status'),
            general: suggestions.filter(item => !item.type || item.type === 'general')
        };
        return categories;
    }, [suggestions, documentSuggestions, userSuggestions, categorySuggestions, statusSuggestions]);

    // Gestionnaire de sélection
    const handleSuggestionClick = (suggestion) => {
        if (onSuggestionSelect) {
            onSuggestionSelect(suggestion);
        }
    };

    // Icônes par type de suggestion
    const getSuggestionIcon = (suggestion) => {
        switch (suggestion.type) {
            case 'document':
                return <DocumentIcon fontSize="small" />;
            case 'user':
                return <PersonIcon fontSize="small" />;
            case 'category':
                return <CategoryIcon fontSize="small" />;
            case 'status':
                return <ScheduleIcon fontSize="small" />;
            default:
                return <SearchIcon fontSize="small" />;
        }
    };

    // Icônes par type de suggestion récent
    const getHistoryIcon = (searchQuery) => {
        // Analyser le type de recherche basé sur le contenu
        if (searchQuery.includes('retard') || searchQuery.includes('urgent')) {
            return <ScheduleIcon fontSize="small" color="error" />;
        }
        if (searchQuery.includes('emprunt') || searchQuery.includes('prêt')) {
            return <DocumentIcon fontSize="small" color="primary" />;
        }
        if (searchQuery.includes('@') || searchQuery.includes('email')) {
            return <PersonIcon fontSize="small" color="info" />;
        }
        return <SearchIcon fontSize="small" />;
    };

    // Formatage de la date relative
    const formatRelativeDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            if (isToday(date)) return 'Aujourd\'hui';
            if (isYesterday(date)) return 'Hier';

            const daysAgo = differenceInDays(new Date(), date);
            if (daysAgo < 7) return `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
            if (daysAgo < 30) return `Il y a ${Math.floor(daysAgo / 7)} semaine${Math.floor(daysAgo / 7) > 1 ? 's' : ''}`;

            return format(date, 'dd/MM/yyyy', { locale: fr });
        } catch {
            return '';
        }
    };

    // Composant d'élément de suggestion
    const SuggestionItem = ({ suggestion, index, showArrow = false }) => (
        <div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <ListItemButton
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                    borderRadius: 1,
                    mx: 0.5,
                    mb: 0.5,
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    }
                }}
            >
                <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: suggestion.color || 'primary.main',
                            fontSize: '0.875rem'
                        }}
                    >
                        {getSuggestionIcon(suggestion)}
                    </Avatar>
                </ListItemIcon>

                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap>
                                {suggestion.title || suggestion.label || suggestion.query}
                            </Typography>
                            {suggestion.count && (
                                <Chip
                                    label={suggestion.count}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                            {suggestion.score && (
                                <Chip
                                    label={`${Math.round(suggestion.score * 100)}%`}
                                    size="small"
                                    color="success"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>
                    }
                    secondary={
                        suggestion.subtitle && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {suggestion.subtitle}
                            </Typography>
                        )
                    }
                />

                {showArrow && (
                    <ArrowIcon fontSize="small" color="action" />
                )}
            </ListItemButton>
        </div>
    );

    // Composant d'élément d'historique
    const HistoryItem = ({ searchQuery, index }) => (
        <div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <ListItemButton
                onClick={() => handleSuggestionClick({ query: searchQuery.query, type: 'history' })}
                sx={{
                    borderRadius: 1,
                    mx: 0.5,
                    mb: 0.5,
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.5),
                    }
                }}
            >
                <ListItemIcon sx={{ minWidth: 40 }}>
                    {getHistoryIcon(searchQuery.query)}
                </ListItemIcon>

                <ListItemText
                    primary={
                        <Typography variant="body2">
                            {searchQuery.query}
                        </Typography>
                    }
                    secondary={
                        <Typography variant="caption" color="text.secondary">
                            {formatRelativeDate(searchQuery.timestamp)}
                        </Typography>
                    }
                />
            </ListItemButton>
        </div>
    );

    if (!open) return null;

    return (
        <Paper
            elevation={8}
            className={className}
            sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                mt: 0.5,
                maxHeight,
                overflow: 'auto',
                backgroundColor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2
            }}
        >
            <AnimatePresence>
                <Box sx={{ p: 1 }}>
                    {/* Suggestions de recherche populaires */}
                    {showPopular && popularSearches.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                                <TrendingUpIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                    Recherches populaires
                                </Typography>
                            </Box>
                            <List dense sx={{ py: 0 }}>
                                {popularSearches.map((suggestion, index) => (
                                    <SuggestionItem
                                        key={`popular-${index}`}
                                        suggestion={suggestion}
                                        index={index}
                                    />
                                ))}
                            </List>
                        </Box>
                    )}

                    {/* Suggestions par catégorie */}
                    {showCategories && (
                        <>
                            {/* Documents */}
                            {categorizedSuggestions.documents.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                                        <DocumentIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Documents
                                        </Typography>
                                    </Box>
                                    <List dense sx={{ py: 0 }}>
                                        {categorizedSuggestions.documents.map((suggestion, index) => (
                                            <SuggestionItem
                                                key={`document-${index}`}
                                                suggestion={suggestion}
                                                index={index}
                                            />
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Utilisateurs */}
                            {categorizedSuggestions.users.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                                        <PersonIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Utilisateurs
                                        </Typography>
                                    </Box>
                                    <List dense sx={{ py: 0 }}>
                                        {categorizedSuggestions.users.map((suggestion, index) => (
                                            <SuggestionItem
                                                key={`user-${index}`}
                                                suggestion={suggestion}
                                                index={index}
                                            />
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Catégories */}
                            {categorizedSuggestions.categories.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                                        <CategoryIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Catégories
                                        </Typography>
                                    </Box>
                                    <List dense sx={{ py: 0 }}>
                                        {categorizedSuggestions.categories.map((suggestion, index) => (
                                            <SuggestionItem
                                                key={`category-${index}`}
                                                suggestion={suggestion}
                                                index={index}
                                            />
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Statuts */}
                            {categorizedSuggestions.status.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                                        <ScheduleIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Statuts
                                        </Typography>
                                    </Box>
                                    <List dense sx={{ py: 0 }}>
                                        {categorizedSuggestions.status.map((suggestion, index) => (
                                            <SuggestionItem
                                                key={`status-${index}`}
                                                suggestion={suggestion}
                                                index={index}
                                            />
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Suggestions générales */}
                            {categorizedSuggestions.general.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                                        <StarIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Suggestions
                                        </Typography>
                                    </Box>
                                    <List dense sx={{ py: 0 }}>
                                        {categorizedSuggestions.general.map((suggestion, index) => (
                                            <SuggestionItem
                                                key={`general-${index}`}
                                                suggestion={suggestion}
                                                index={index}
                                            />
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </>
                    )}

                    {/* Historique des recherches */}
                    {showRecent && recentSearches.length > 0 && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <HistoryIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Recherches récentes
                                        </Typography>
                                    </Box>
                                    {onClearSuggestions && (
                                        <Chip
                                            label="Effacer"
                                            size="small"
                                            variant="text"
                                            onClick={onClearSuggestions}
                                            sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                                        />
                                    )}
                                </Box>
                                <List dense sx={{ py: 0 }}>
                                    {recentSearches.map((searchQuery, index) => (
                                        <HistoryItem
                                            key={`history-${index}`}
                                            searchQuery={searchQuery}
                                            index={index}
                                        />
                                    ))}
                                </List>
                            </Box>
                        </>
                    )}

                    {/* Message si aucune suggestion */}
                    {suggestions.length === 0 && recentSearches.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <SearchIcon fontSize="large" color="disabled" sx={{ mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Commencez à taper pour voir des suggestions...
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Recherchez par document, utilisateur, date ou statut
                            </Typography>
                        </Box>
                    )}
                </Box>
            </AnimatePresence>
        </Paper>
    );
};

export default React.memo(SearchSuggestions);
