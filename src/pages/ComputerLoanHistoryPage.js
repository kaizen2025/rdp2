// src/pages/ComputerLoanHistoryPage.js - VERSION AMÉLIORÉE AVEC STATS ET DURÉES

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, Autocomplete, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert, Card, CardContent, Grid
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ComputerIcon from '@mui/icons-material/Computer';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';
import { parseISO, differenceInDays, isAfter } from 'date-fns';

const eventConfig = {
    created: {
        label: 'Prêt créé',
        icon: <AssignmentIcon fontSize="small" />,
        color: 'success'
    },
    returned: {
        label: 'Retourné',
        icon: <CheckCircleIcon fontSize="small" />,
        color: 'primary'
    },
    extended: {
        label: 'Prolongé',
        icon: <TrendingUpIcon fontSize="small" />,
        color: 'info'
    },
    cancelled: {
        label: 'Annulé',
        icon: <CancelIcon fontSize="small" />,
        color: 'error'
    }
};

const ComputerLoanHistoryPage = () => {
    const { showNotification } = useApp();
    const [computers, setComputers] = useState([]);
    const [selectedComputer, setSelectedComputer] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingComputers, setLoadingComputers] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const loadComputers = async () => {
            setLoadingComputers(true);
            try {
                const data = await apiService.getComputers();
                if (Array.isArray(data) && data.length > 0) {
                    const sortedComputers = data.sort((a, b) => 
                        (a.name || '').localeCompare(b.name || '')
                    );
                    setComputers(sortedComputers);
                } else {
                    setComputers([]);
                    showNotification('warning', 'Aucun ordinateur trouvé dans l\'inventaire');
                }
            } catch (error) {
                console.error('Erreur chargement ordinateurs:', error);
                showNotification('error', 'Erreur lors du chargement des ordinateurs');
            } finally {
                setLoadingComputers(false);
            }
        };
        loadComputers();
    }, [showNotification]);

    useEffect(() => {
        if (!selectedComputer) {
            setHistory([]);
            setStats(null);
            return;
        }

        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                const computerHistory = await apiService.getLoanHistory({
                    computerId: selectedComputer.id,
                    limit: 1000
                });

                setHistory(Array.isArray(computerHistory) ? computerHistory : []);

            } catch (error) {
                console.error('Erreur chargement historique:', error);
                showNotification('error', 'Erreur lors du chargement de l\'historique');
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, [selectedComputer, showNotification]);

    // Calculer les statistiques avec useMemo
    const statistics = useMemo(() => {
        if (history.length === 0) return null;

        // Regrouper les événements par prêt
        const loanMap = new Map();
        history.forEach(event => {
            if (!loanMap.has(event.loanId)) {
                loanMap.set(event.loanId, {
                    loanDate: event.details?.loanDate,
                    expectedReturnDate: event.details?.expectedReturnDate,
                    actualReturnDate: event.details?.actualReturnDate,
                    status: event.eventType === 'returned' ? 'returned' : 'active'
                });
            } else {
                const loan = loanMap.get(event.loanId);
                if (event.eventType === 'returned') {
                    loan.status = 'returned';
                    loan.actualReturnDate = event.details?.actualReturnDate;
                }
            }
        });

        const loans = Array.from(loanMap.values());
        const completedLoans = loans.filter(loan => loan.actualReturnDate && loan.loanDate);
        const activeLoans = loans.filter(loan => loan.status === 'active');

        // Calculer les durées
        const durations = completedLoans.map(loan => {
            const start = parseISO(loan.loanDate);
            const end = parseISO(loan.actualReturnDate);
            return differenceInDays(end, start);
        });

        const totalDuration = durations.reduce((acc, days) => acc + days, 0);

        return {
            totalLoans: loans.length,
            completedLoans: completedLoans.length,
            activeLoans: activeLoans.length,
            avgDuration: completedLoans.length > 0 ? Math.round(totalDuration / completedLoans.length) : 0
        };
    }, [history]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDuration = (loanDate, actualReturnDate) => {
        if (!loanDate) return '-';

        const start = parseISO(loanDate);
        const end = actualReturnDate ? parseISO(actualReturnDate) : new Date();
        const days = differenceInDays(end, start);

        if (days < 0) return '-'; // Cas d'erreur ou date future bizarre
        if (days === 0) return '< 1 jour';
        return `${days} ${days > 1 ? 'jours' : 'jour'}`;
    };

    const isLate = (expectedReturnDate, actualReturnDate) => {
        if (!expectedReturnDate) return false;
        const expectedDate = parseISO(expectedReturnDate);
        const actualDate = actualReturnDate ? parseISO(actualReturnDate) : new Date();
        return isAfter(actualDate, expectedDate);
    };

    const getComputerLabel = (computer) => {
        return `${computer.name || 'Sans nom'} - ${computer.brand || ''} ${computer.model || ''}`.trim();
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ComputerIcon color="primary" />
                    <Typography variant="h5">Historique des prêts par matériel</Typography>
                </Box>
                
                <Autocomplete
                    options={computers}
                    getOptionLabel={getComputerLabel}
                    loading={loadingComputers}
                    value={selectedComputer}
                    onChange={(event, newValue) => setSelectedComputer(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Sélectionnez un ordinateur..."
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingComputers ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                )
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                            <Box>
                                <Typography variant="body1">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.brand} {option.model} • S/N: {option.serialNumber}
                                </Typography>
                            </Box>
                        </li>
                    )}
                />
            </Paper>

            {selectedComputer && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {selectedComputer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Chip label={`${selectedComputer.brand} ${selectedComputer.model}`} variant="outlined" />
                            <Chip label={`S/N: ${selectedComputer.serialNumber}`} variant="outlined" />
                            <Chip 
                                label={selectedComputer.status === 'available' ? 'Disponible' : selectedComputer.status === 'loaned' ? 'Prêté' : 'Réservé'} 
                                color={selectedComputer.status === 'available' ? 'success' : 'warning'}
                            />
                        </Box>

                        {statistics && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        boxShadow: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Prêts</Typography>
                                                    <Typography variant="h4" fontWeight="bold">{statistics.totalLoans}</Typography>
                                                </Box>
                                                <AssignmentIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{
                                        background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                                        color: 'white',
                                        boxShadow: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Terminés</Typography>
                                                    <Typography variant="h4" fontWeight="bold">{statistics.completedLoans}</Typography>
                                                </Box>
                                                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{
                                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                        color: 'white',
                                        boxShadow: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>En Cours</Typography>
                                                    <Typography variant="h4" fontWeight="bold">{statistics.activeLoans}</Typography>
                                                </Box>
                                                <EventAvailableIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{
                                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                        color: 'white',
                                        boxShadow: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Durée Moyenne</Typography>
                                                    <Typography variant="h4" fontWeight="bold">{statistics.avgDuration}j</Typography>
                                                </Box>
                                                <AccessTimeIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <HistoryIcon />
                        <Typography variant="h6">Historique complet</Typography>
                    </Box>

                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : history.length === 0 ? (
                        <Alert severity="info">Aucun historique de prêt pour cet ordinateur</Alert>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Utilisateur</TableCell>
                                        <TableCell>Date événement</TableCell>
                                        <TableCell>Date prêt</TableCell>
                                        <TableCell>Retour prévu</TableCell>
                                        <TableCell>Retour effectif</TableCell>
                                        <TableCell>Durée</TableCell>
                                        <TableCell>Par</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.map((event) => {
                                        const config = eventConfig[event.eventType] || {};
                                        const late = isLate(event.details?.expectedReturnDate, event.details?.actualReturnDate);
                                        const duration = calculateDuration(event.details?.loanDate, event.details?.actualReturnDate);

                                        return (
                                            <TableRow
                                                key={event.id}
                                                sx={{
                                                    backgroundColor: late && event.eventType !== 'returned' ? 'error.light' : 'inherit',
                                                    '& td': { color: late && event.eventType !== 'returned' ? 'error.contrastText' : 'inherit' }
                                                }}
                                            >
                                                <TableCell>
                                                    <Chip
                                                        icon={config.icon}
                                                        label={config.label || event.eventType}
                                                        color={config.color || 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{event.userDisplayName || event.details?.userName || '-'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{event.userName || event.details?.username || ''}</Typography>
                                                </TableCell>
                                                <TableCell>{formatDate(event.date)}</TableCell>
                                                <TableCell>{formatDate(event.details?.loanDate)}</TableCell>
                                                <TableCell>{formatDate(event.details?.expectedReturnDate)}</TableCell>
                                                <TableCell>{formatDate(event.details?.actualReturnDate)}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {late && event.eventType !== 'returned' && (
                                                            <WarningIcon fontSize="small" color="error" />
                                                        )}
                                                        <Typography variant="body2" fontWeight={late ? 'bold' : 'normal'}>
                                                            {duration}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell><Typography variant="caption">{event.by || '-'}</Typography></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {!selectedComputer && !loadingComputers && (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <ComputerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Sélectionnez un ordinateur pour voir son historique de prêts
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default ComputerLoanHistoryPage;
