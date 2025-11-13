// src/components/AI/ConversationHistory.js - Historique intelligent avec recherche et tags

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, List, ListItem, ListItemText, ListItemButton,
    TextField, InputAdornment, Chip, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, Button, Menu, MenuItem,
    Divider, Alert, Stack, Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    FilterList as FilterIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Delete as DeleteIcon,
    Restore as RestoreIcon,
    Label as LabelIcon,
    CalendarToday as CalendarIcon,
    TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const TAGS = [
    { id: 'commercial', label: 'Commercial', color: 'primary' },
    { id: 'qualite', label: 'Qualité', color: 'success' },
    { id: 'production', label: 'Production', color: 'warning' },
    { id: 'rh', label: 'RH', color: 'info' },
    { id: 'logistique', label: 'Logistique', color: 'secondary' },
    { id: 'technique', label: 'Technique', color: 'error' }
];

const ConversationHistory = ({ conversations, onSelectConversation, currentSessionId, onDeleteConversation, onTogglePinned }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);

    // Détecter tags automatiquement depuis le contenu
    const detectTags = (message) => {
        const lowerMessage = message.toLowerCase();
        const detectedTags = [];

        if (lowerMessage.includes('commercial') || lowerMessage.includes('offre') || lowerMessage.includes('prix') || lowerMessage.includes('client')) {
            detectedTags.push('commercial');
        }
        if (lowerMessage.includes('qualité') || lowerMessage.includes('norme') || lowerMessage.includes('certification') || lowerMessage.includes('contrôle')) {
            detectedTags.push('qualite');
        }
        if (lowerMessage.includes('production') || lowerMessage.includes('fabriqu') || lowerMessage.includes('usine') || lowerMessage.includes('manufact')) {
            detectedTags.push('production');
        }
        if (lowerMessage.includes('rh') || lowerMessage.includes('recrutement') || lowerMessage.includes('employé') || lowerMessage.includes('salaire')) {
            detectedTags.push('rh');
        }
        if (lowerMessage.includes('logistique') || lowerMessage.includes('transport') || lowerMessage.includes('livraison') || lowerMessage.includes('stock')) {
            detectedTags.push('logistique');
        }
        if (lowerMessage.includes('technique') || lowerMessage.includes('bug') || lowerMessage.includes('erreur') || lowerMessage.includes('problème')) {
            detectedTags.push('technique');
        }

        return [...new Set(detectedTags)]; // Unique
    };

    // Enrichir conversations avec tags détectés
    const enrichedConversations = useMemo(() => {
        return conversations.map(conv => ({
            ...conv,
            autoTags: detectTags(conv.user_message + ' ' + (conv.ai_response || '')),
            isPinned: conv.is_pinned || false
        }));
    }, [conversations]);

    // Filtrer conversations
    const filteredConversations = useMemo(() => {
        let filtered = enrichedConversations;

        // Filtre recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(conv =>
                conv.user_message?.toLowerCase().includes(term) ||
                conv.ai_response?.toLowerCase().includes(term)
            );
        }

        // Filtre tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(conv =>
                selectedTags.some(tag => conv.autoTags.includes(tag))
            );
        }

        return filtered;
    }, [enrichedConversations, searchTerm, selectedTags]);

    // Grouper par date
    const groupedConversations = useMemo(() => {
        const groups = {
            pinned: [],
            today: [],
            yesterday: [],
            thisWeek: [],
            older: []
        };

        filteredConversations.forEach(conv => {
            if (conv.isPinned) {
                groups.pinned.push(conv);
                return;
            }

            const date = parseISO(conv.created_at);
            if (isToday(date)) {
                groups.today.push(conv);
            } else if (isYesterday(date)) {
                groups.yesterday.push(conv);
            } else if (isThisWeek(date)) {
                groups.thisWeek.push(conv);
            } else {
                groups.older.push(conv);
            }
        });

        return groups;
    }, [filteredConversations]);

    // Formatter date relative
    const formatRelativeDate = (dateStr) => {
        const date = parseISO(dateStr);
        if (isToday(date)) {
            return format(date, 'HH:mm', { locale: fr });
        } else if (isYesterday(date)) {
            return 'Hier ' + format(date, 'HH:mm', { locale: fr });
        } else if (isThisWeek(date)) {
            return format(date, 'EEEE HH:mm', { locale: fr });
        } else {
            return format(date, 'dd MMM yyyy', { locale: fr });
        }
    };

    // Toggle tag filter
    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    // Confirmer suppression
    const handleDeleteClick = (conv, e) => {
        e.stopPropagation();
        setConversationToDelete(conv);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (conversationToDelete) {
            onDeleteConversation(conversationToDelete.id);
        }
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    // Toggle épingler
    const handleTogglePinned = (conv, e) => {
        e.stopPropagation();
        onTogglePinned(conv.id, !conv.isPinned);
    };

    // Render groupe de conversations
    const renderGroup = (title, conversations, icon) => {
        if (conversations.length === 0) return null;

        return (
            <Box key={title} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 2 }}>
                    {icon}
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                        {title} ({conversations.length})
                    </Typography>
                </Box>
                <List disablePadding>
                    {conversations.map(conv => (
                        <ListItem
                            key={conv.id}
                            disablePadding
                            secondaryAction={
                                <Box>
                                    <Tooltip title={conv.isPinned ? "Désépingler" : "Épingler"}>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(e) => handleTogglePinned(conv, e)}
                                        >
                                            {conv.isPinned ? <StarIcon color="warning" /> : <StarBorderIcon />}
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(e) => handleDeleteClick(conv, e)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                        >
                            <ListItemButton
                                selected={conv.session_id === currentSessionId}
                                onClick={() => onSelectConversation(conv)}
                                sx={{
                                    borderLeft: conv.isPinned ? 3 : 0,
                                    borderColor: 'warning.main',
                                    bgcolor: conv.isPinned ? 'warning.lighter' : 'transparent'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: conv.isPinned ? 600 : 400 }}>
                                                {conv.user_message}
                                            </Typography>
                                            {conv.isPinned && <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {formatRelativeDate(conv.created_at)}
                                            </Typography>
                                            {conv.autoTags.length > 0 && (
                                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                                    {conv.autoTags.slice(0, 2).map(tagId => {
                                                        const tag = TAGS.find(t => t.id === tagId);
                                                        return tag ? (
                                                            <Chip
                                                                key={tagId}
                                                                label={tag.label}
                                                                size="small"
                                                                color={tag.color}
                                                                sx={{ height: 18, fontSize: '0.65rem' }}
                                                            />
                                                        ) : null;
                                                    })}
                                                    {conv.autoTags.length > 2 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            +{conv.autoTags.length - 2}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            )}
                                        </Box>
                                    }
                                    primaryTypographyProps={{ noWrap: true }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider sx={{ mt: 1 }} />
            </Box>
        );
    };

    return (
        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                    📜 Historique
                </Typography>

                {/* Recherche */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher dans l'historique..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{ mb: 1 }}
                />

                {/* Filtres tags */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Filtrer par tag">
                        <IconButton size="small" onClick={(e) => setFilterMenuAnchor(e.currentTarget)}>
                            <Badge badgeContent={selectedTags.length} color="primary">
                                <FilterIcon fontSize="small" />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    {selectedTags.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {selectedTags.map(tagId => {
                                const tag = TAGS.find(t => t.id === tagId);
                                return tag ? (
                                    <Chip
                                        key={tagId}
                                        label={tag.label}
                                        size="small"
                                        color={tag.color}
                                        onDelete={() => toggleTag(tagId)}
                                    />
                                ) : null;
                            })}
                        </Stack>
                    )}
                </Box>
            </Box>

            {/* Liste conversations */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {filteredConversations.length === 0 ? (
                    <Alert severity="info" sx={{ m: 2 }}>
                        {searchTerm || selectedTags.length > 0
                            ? 'Aucune conversation ne correspond aux filtres'
                            : 'Aucune conversation dans l\'historique'}
                    </Alert>
                ) : (
                    <>
                        {renderGroup('📌 Épinglées', groupedConversations.pinned, <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />)}
                        {renderGroup('Aujourd\'hui', groupedConversations.today, <TrendingIcon sx={{ fontSize: 16 }} />)}
                        {renderGroup('Hier', groupedConversations.yesterday, <CalendarIcon sx={{ fontSize: 16 }} />)}
                        {renderGroup('Cette semaine', groupedConversations.thisWeek, <CalendarIcon sx={{ fontSize: 16 }} />)}
                        {renderGroup('Plus ancien', groupedConversations.older, <CalendarIcon sx={{ fontSize: 16 }} />)}
                    </>
                )}
            </Box>

            {/* Menu filtres */}
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
            >
                <MenuItem disabled>
                    <Typography variant="caption" fontWeight="bold">Filtrer par tag :</Typography>
                </MenuItem>
                <Divider />
                {TAGS.map(tag => (
                    <MenuItem key={tag.id} onClick={() => toggleTag(tag.id)}>
                        <Chip
                            label={tag.label}
                            size="small"
                            color={tag.color}
                            variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                            icon={selectedTags.includes(tag.id) ? <LabelIcon /> : undefined}
                        />
                    </MenuItem>
                ))}
            </Menu>

            {/* Dialog confirmation suppression */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Supprimer la conversation ?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer cette conversation ?
                        Cette action est irréversible.
                    </Typography>
                    {conversationToDelete && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                                {conversationToDelete.user_message}
                            </Typography>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ConversationHistory;
