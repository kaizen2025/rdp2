// src/components/users/UsersBulkActionBar.js
// Barre d'actions en lot pour les utilisateurs

import React from 'react';
import {
    Box,
    Paper,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Divider
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Group as GroupIcon,
    VpnKey as VpnKeyIcon,
    Language as LanguageIcon
} from '@mui/icons-material';

const UsersBulkActionBar = ({
    selectedCount = 0,
    totalCount = 0,
    onClearSelection,
    onBulkExport,
    onBulkPrint,
    onBulkDelete,
    onBulkEmail,
    onBulkAddToGroup
}) => {
    if (selectedCount === 0) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                mb: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 2
            }}
        >
            <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                {/* Info sélection */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                    <GroupIcon />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedCount} utilisateur{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
                    </Typography>
                    <Chip
                        label={`${((selectedCount / totalCount) * 100).toFixed(0)}%`}
                        size="small"
                        sx={{
                            backgroundColor: 'white',
                            color: 'primary.main',
                            fontWeight: 700
                        }}
                    />
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {onBulkExport && (
                        <Tooltip title="Exporter la sélection">
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={onBulkExport}
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'primary.main',
                                    '&:hover': { backgroundColor: 'grey.100' }
                                }}
                                size="small"
                            >
                                Exporter
                            </Button>
                        </Tooltip>
                    )}

                    {onBulkPrint && (
                        <Tooltip title="Imprimer les fiches">
                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                onClick={onBulkPrint}
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'primary.main',
                                    '&:hover': { backgroundColor: 'grey.100' }
                                }}
                                size="small"
                            >
                                Imprimer
                            </Button>
                        </Tooltip>
                    )}

                    {onBulkEmail && (
                        <Tooltip title="Envoyer un email">
                            <IconButton
                                onClick={onBulkEmail}
                                sx={{ color: 'white' }}
                                size="small"
                            >
                                <EmailIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {onBulkAddToGroup && (
                        <Tooltip title="Ajouter à un groupe">
                            <IconButton
                                onClick={() => onBulkAddToGroup('VPN')}
                                sx={{ color: 'white' }}
                                size="small"
                            >
                                <VpnKeyIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Divider orientation="vertical" flexItem sx={{ backgroundColor: 'white', opacity: 0.5, mx: 1 }} />

                    {onBulkDelete && (
                        <Tooltip title="Supprimer la sélection">
                            <Button
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={onBulkDelete}
                                sx={{
                                    borderColor: 'white',
                                    color: 'white',
                                    '&:hover': {
                                        borderColor: 'error.light',
                                        backgroundColor: 'error.main',
                                        color: 'white'
                                    }
                                }}
                                size="small"
                            >
                                Supprimer
                            </Button>
                        </Tooltip>
                    )}

                    {onClearSelection && (
                        <Tooltip title="Tout désélectionner">
                            <IconButton
                                onClick={onClearSelection}
                                sx={{
                                    color: 'white',
                                    ml: 1
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Toolbar>
        </Paper>
    );
};

export default UsersBulkActionBar;
