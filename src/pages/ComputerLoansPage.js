// src/pages/ComputerLoansPage.js - VERSION RESTRUCTURÉE

import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import { useApp } from '../contexts/AppContext';

// Icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import ComputerIcon from '@mui/icons-material/Computer';
import InventoryIcon from '@mui/icons-material/Inventory';

// Lazy load
const LoanList = lazy(() => import('../components/loan-management/LoanList'));
const ComputersPage = lazy(() => import('../pages/ComputersPage')); // Renommé pour la clarté
const LoansCalendar = lazy(() => import('../pages/LoansCalendar'));
const UserLoanHistoryPage = lazy(() => import('../pages/UserLoanHistoryPage'));
const ComputerLoanHistoryPage = lazy(() => import('../pages/ComputerLoanHistoryPage'));
const LoanStatisticsDialog = lazy(() => import('../components/LoanStatisticsDialog'));

const LoadingFallback = () => (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center', minHeight: '50vh' }}><CircularProgress /></Box>);

const HistoryTab = ({ refreshKey }) => {
    const [subTab, setSubTab] = useState(0);
    return (
        <Box>
            <Paper
                elevation={1}
                sx={{
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'linear-gradient(to right, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03))'
                }}
            >
                <Tabs
                    value={subTab}
                    onChange={(e, v) => setSubTab(v)}
                    centered
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: 56,
                            fontWeight: 500,
                            '&.Mui-selected': {
                                color: '#764ba2',
                                fontWeight: 600
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                        }
                    }}
                >
                    <Tab icon={<PersonSearchIcon />} iconPosition="start" label="Par Utilisateur" />
                    <Tab icon={<ComputerIcon />} iconPosition="start" label="Par Matériel" />
                </Tabs>
            </Paper>
            <Box>
                {subTab === 0 && <UserLoanHistoryPage key={refreshKey} />}
                {subTab === 1 && <ComputerLoanHistoryPage key={refreshKey} />}
            </Box>
        </Box>
    );
};

const ComputerLoansPage = () => {
    const { showNotification, events } = useApp();
    const location = useLocation();
    const [currentTab, setCurrentTab] = useState(location.state?.initialTab || 0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false);
    
    const handleForceRefresh = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
        showNotification('info', 'Rafraîchissement des données en cours...');
        events.emit('force_refresh:loans');
        events.emit('force_refresh:computers');
    }, [showNotification, events]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ p: 2 }}>
                {/* Header moderne avec gradient Anecoop */}
                <Paper
                    elevation={4}
                    sx={{
                        p: 3,
                        mb: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AssignmentIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                            <Box>
                                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Gestion des Prêts et du Matériel
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Suivi complet des ordinateurs et des prêts
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Statistiques">
                                <IconButton
                                    onClick={() => setStatisticsDialogOpen(true)}
                                    sx={{
                                        color: 'white',
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                                    }}
                                >
                                    <BarChartIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Actualiser les données">
                                <IconButton
                                    onClick={handleForceRefresh}
                                    sx={{
                                        color: 'white',
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Paper>

                {/* Tabs avec style moderne */}
                <Paper
                    elevation={3}
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        background: 'linear-gradient(to right, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))'
                    }}>
                        <Tabs
                            value={currentTab}
                            onChange={(e, v) => setCurrentTab(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            sx={{
                                '& .MuiTab-root': {
                                    minHeight: 64,
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    '&.Mui-selected': {
                                        color: '#764ba2',
                                        fontWeight: 700
                                    }
                                },
                                '& .MuiTabs-indicator': {
                                    height: 3,
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                }
                            }}
                        >
                            <Tab icon={<AssignmentIcon />} iconPosition="start" label="Suivi des Prêts" />
                            <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventaire Matériel" />
                            <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Calendrier" />
                            <Tab icon={<HistoryIcon />} iconPosition="start" label="Historique" />
                        </Tabs>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <Suspense fallback={<LoadingFallback />}>
                            {currentTab === 0 && <LoanList key={refreshKey} preFilter={location.state?.preFilter} />}
                            {currentTab === 1 && <ComputersPage key={refreshKey} />}
                            {currentTab === 2 && <LoansCalendar key={refreshKey} />}
                            {currentTab === 3 && <HistoryTab refreshKey={refreshKey} />}
                        </Suspense>
                    </Box>
                </Paper>

                <Suspense fallback={<div />}>
                    {statisticsDialogOpen && <LoanStatisticsDialog open={statisticsDialogOpen} onClose={() => setStatisticsDialogOpen(false)} />}
                </Suspense>
            </Box>
        </LocalizationProvider>
    );
};

export default ComputerLoansPage;