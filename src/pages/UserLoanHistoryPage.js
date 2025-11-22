// src/pages/UserLoanHistoryPage.js - VERSION AMÉLIORÉE AVEC DURÉES ET STATISTIQUES

import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import apiService from '../services/apiService';
import { differenceInDays, parseISO } from 'date-fns';

// Icons
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import UpdateIcon from '@mui/icons-material/Update';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';

const eventConfig = {
    created: { label: 'Prêt créé', color: 'success', icon: <EventAvailableIcon fontSize="small" /> },
    returned: { label: 'Retourné', color: 'primary', icon: <AssignmentReturnIcon fontSize="small" /> },
    extended: { label: 'Prolongé', color: 'info', icon: <UpdateIcon fontSize="small" /> },
    cancelled: { label: 'Annulé', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

const UserLoanHistoryPage = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        const loadAllUsers = async () => {
            setLoadingUsers(true);
            try {
                const usersResult = await apiService.getUsers();
                if (usersResult && usersResult.success) {
                    const formattedUsers = Object.values(usersResult.users).flat();
                    const uniqueUsers = Array.from(new Map(formattedUsers.map(user => [user.username, user])).values());
                    setAllUsers(uniqueUsers);
                } else {
                    setAllUsers([]);
                }
            } catch (error) {
                console.error("Erreur chargement utilisateurs:", error);
            } finally {
                setLoadingUsers(false);
            }
        };
        loadAllUsers();
    }, []);

    useEffect(() => {
        if (!selectedUser) { setHistory([]); return; }
        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                const userHistory = await apiService.getLoanHistory({ userName: selectedUser.username, limit: 1000 });
                setHistory(userHistory);
            } catch (error) {
                console.error("Erreur chargement historique utilisateur:", error);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, [selectedUser]);

    // Calculer les statistiques
    const statistics = useMemo(() => {
        if (!history || history.length === 0) return null;

        // Regrouper les prêts par loanId
        const loanMap = new Map();
        history.forEach(event => {
            if (!loanMap.has(event.loanId)) {
                loanMap.set(event.loanId, {
                    loanId: event.loanId,
                    computerName: event.computerName,
                    loanDate: event.details?.loanDate,
                    expectedReturnDate: event.details?.expectedReturnDate,
                    actualReturnDate: event.details?.actualReturnDate,
                    events: []
                });
            }
            loanMap.get(event.loanId).events.push(event);
        });

        const loans = Array.from(loanMap.values());
        const completedLoans = loans.filter(l => l.actualReturnDate);
        const ongoingLoans = loans.filter(l => !l.actualReturnDate);

        // Calculer les durées
        const durations = completedLoans.map(loan => {
            if (!loan.loanDate || !loan.actualReturnDate) return 0;
            const start = parseISO(loan.loanDate);
            const end = parseISO(loan.actualReturnDate);
            return differenceInDays(end, start);
        }).filter(d => d >= 0);

        const totalDuration = durations.reduce((sum, d) => sum + d, 0);
        const avgDuration = durations.length > 0 ? Math.round(totalDuration / durations.length) : 0;

        // Prêts en retard
        const now = new Date();
        const lateLoans = ongoingLoans.filter(loan => {
            if (!loan.expectedReturnDate) return false;
            const expected = parseISO(loan.expectedReturnDate);
            return expected < now;
        });

        return {
            totalLoans: loans.length,
            completedLoans: completedLoans.length,
            ongoingLoans: ongoingLoans.length,
            lateLoans: lateLoans.length,
            avgDuration
        };
    }, [history]);

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : '-';

    // Calculer la durée d'un prêt
    const calculateDuration = (loanDate, actualReturnDate) => {
        if (!loanDate) return '-';

        const start = parseISO(loanDate);
        const end = actualReturnDate ? parseISO(actualReturnDate) : new Date();
        const days = differenceInDays(end, start);

        if (days < 0) return '-';
        if (days === 0) return '< 1 jour';
        if (days === 1) return '1 jour';
        return `${days} jours`;
    };

    // Vérifier si un prêt est en retard
    const isLate = (expectedReturnDate, actualReturnDate) => {
        if (!expectedReturnDate || actualReturnDate) return false;
        const expected = parseISO(expectedReturnDate);
        const now = new Date();
        return expected < now;
    };

    const getAvatarLetters = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonSearchIcon color="primary" fontSize="large" />
                    <Typography variant="h5" fontWeight="600">
                        Historique des prêts par utilisateur
                    </Typography>
                </Box>
                <Autocomplete
                    isOptionEqualToValue={(option, value) => option.username === value.username}
                    getOptionLabel={(option) => `${option.displayName} (${option.username})`}
                    options={allUsers}
                    loading={loadingUsers}
                    value={selectedUser}
                    onChange={(event, newValue) => {
                        setSelectedUser(newValue);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Rechercher un utilisateur..."
                            placeholder="Commencez à taper un nom..."
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>
                            <Avatar sx={{ mr: 2, width: 32, height: 32, fontSize: '0.9rem', bgcolor: 'primary.main' }}>
                                {getAvatarLetters(option.displayName)}
                            </Avatar>
                            <Box>
                                <Typography variant="body1">{option.displayName}</Typography>
                                <Typography variant="caption" color="text.secondary">{option.username}</Typography>
                            </Box>
                        </Box>
                    )}
                />
            </Paper>

            {selectedUser && statistics && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">{statistics.totalLoans}</Typography>
                                        <Typography variant="body2">Total Prêts</Typography>
                                    </Box>
                                    <AssignmentIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ bgcolor: 'success.main', color: 'white' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">{statistics.completedLoans}</Typography>
                                        <Typography variant="body2">Retournés</Typography>
                                    </Box>
                                    <AssignmentReturnIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ bgcolor: 'info.main', color: 'white' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">{statistics.ongoingLoans}</Typography>
                                        <Typography variant="body2">En cours</Typography>
                                    </Box>
                                    <AccessTimeIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ bgcolor: statistics.lateLoans > 0 ? 'error.main' : 'grey.400', color: 'white' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">{statistics.avgDuration}</Typography>
                                        <Typography variant="body2">Durée Moy. (jours)</Typography>
                                    </Box>
                                    <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {selectedUser && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        📋 Historique détaillé : <strong>{selectedUser.displayName}</strong>
                    </Typography>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell><strong>Événement</strong></TableCell>
                                        <TableCell><strong>Ordinateur</strong></TableCell>
                                        <TableCell><strong>Date Événement</strong></TableCell>
                                        <TableCell><strong>Date Prêt</strong></TableCell>
                                        <TableCell><strong>Retour Prévu</strong></TableCell>
                                        <TableCell><strong>Retour Réel</strong></TableCell>
                                        <TableCell><strong>⏱️ Durée</strong></TableCell>
                                        <TableCell><strong>Technicien</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.length > 0 ? (
                                        history.map((event) => {
                                            const config = eventConfig[event.eventType] || {};
                                            const late = isLate(event.details?.expectedReturnDate, event.details?.actualReturnDate);

                                            return (
                                                <TableRow
                                                    key={event.id}
                                                    sx={{
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        bgcolor: late ? 'error.light' : 'inherit'
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
                                                        <Tooltip title={event.computerName}>
                                                            <span style={{ fontWeight: 500 }}>{event.computerName}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>{formatDate(event.date)}</TableCell>
                                                    <TableCell>{formatDate(event.details?.loanDate)}</TableCell>
                                                    <TableCell>
                                                        {late && <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />}
                                                        {formatDate(event.details?.expectedReturnDate)}
                                                    </TableCell>
                                                    <TableCell>{formatDate(event.details?.actualReturnDate)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={calculateDuration(event.details?.loanDate, event.details?.actualReturnDate)}
                                                            size="small"
                                                            variant="outlined"
                                                            color={late ? 'error' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{event.by}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Aucun historique de prêt pour cet utilisateur.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default UserLoanHistoryPage;
