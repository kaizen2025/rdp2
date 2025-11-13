// src/pages/LoansCalendar.js - VERSION AMÉLIORÉE

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, Tooltip, ButtonGroup, Button, Card, CardContent, Dialog,
    DialogTitle, DialogContent, DialogActions, Alert, List
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Today, CalendarMonth, ViewWeek
} from '@mui/icons-material';
import LaptopIcon from '@mui/icons-material/Laptop';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import apiService from '../services/apiService';

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const STATUS_COLORS = {
    active: { bg: '#4caf50', text: 'white', label: 'Actif' },
    reserved: { bg: '#2196f3', text: 'white', label: 'Réservé' },
    overdue: { bg: '#f44336', text: 'white', label: 'En retard' },
    critical: { bg: '#d32f2f', text: 'white', label: 'Critique' }
};

const LoansCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [loans, setLoans] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    useEffect(() => {
        const loadLoans = async () => {
            try {
                const data = await apiService.getLoans();
                setLoans(data.filter(l => l.status !== 'returned' && l.status !== 'cancelled'));
            } catch (error) {
                console.error('Erreur chargement prêts:', error);
            }
        };
        loadLoans();
    }, []);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getDaysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }
        return days;
    }, [currentDate]);

    const getLoansForDay = (date) => {
        return loans.filter(loan => {
            const loanStart = new Date(loan.loanDate);
            const loanEnd = new Date(loan.expectedReturnDate);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            loanStart.setHours(0, 0, 0, 0);
            loanEnd.setHours(0, 0, 0, 0);
            return checkDate >= loanStart && checkDate <= loanEnd;
        });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const handleDayClick = (dayInfo) => {
        const dayLoans = getLoansForDay(dayInfo.date);
        if (dayLoans.length > 0) {
            setSelectedDay({ date: dayInfo.date, loans: dayLoans });
            setDetailDialogOpen(true);
        }
    };

    const stats = useMemo(() => {
        return {
            total: loans.length,
            active: loans.filter(l => l.status === 'active').length,
            reserved: loans.filter(l => l.status === 'reserved').length,
            overdue: loans.filter(l => l.status === 'overdue' || l.status === 'critical').length
        };
    }, [loans]);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>Calendrier des Prêts</Typography>
                <Typography variant="body2" color="text.secondary">Visualisez les prêts d'ordinateurs planifiés et en cours</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip label={`${stats.total} prêts total`} icon={<EventIcon />} color="default" variant="outlined" />
                <Chip label={`${stats.active} actifs`} icon={<EventIcon />} sx={{ bgcolor: STATUS_COLORS.active.bg, color: STATUS_COLORS.active.text }} />
                <Chip label={`${stats.reserved} réservés`} icon={<EventIcon />} sx={{ bgcolor: STATUS_COLORS.reserved.bg, color: STATUS_COLORS.reserved.text }} />
                {stats.overdue > 0 && (
                    <Chip label={`${stats.overdue} en retard`} icon={<EventIcon />} sx={{ bgcolor: STATUS_COLORS.overdue.bg, color: STATUS_COLORS.overdue.text }} />
                )}
            </Box>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton onClick={goToPreviousMonth}><ChevronLeft /></IconButton>
                        <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>{MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}</Typography>
                        <IconButton onClick={goToNextMonth}><ChevronRight /></IconButton>
                        <Button startIcon={<Today />} onClick={goToToday} size="small" variant="outlined">Aujourd'hui</Button>
                    </Box>
                    <ButtonGroup size="small">
                        <Button variant={view === 'month' ? 'contained' : 'outlined'} startIcon={<CalendarMonth />} onClick={() => setView('month')}>Mois</Button>
                        <Button variant={view === 'week' ? 'contained' : 'outlined'} startIcon={<ViewWeek />} onClick={() => setView('week')}>Semaine</Button>
                    </ButtonGroup>
                </Box>
            </Paper>
            <Paper elevation={3} sx={{ p: 2, overflow: 'auto' }}> {/* ✅ FIX: Add overflow:auto to Paper */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1, minWidth: 700 }}> {/* ✅ FIX: Add minWidth */}
                    {DAYS_FR.map(day => (<Box key={day} sx={{ textAlign: 'center', fontWeight: 'bold', color: 'text.secondary', py: 1 }}>{day}</Box>))}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, minWidth: 700 }}> {/* ✅ FIX: Add minWidth */}
                    {getDaysInMonth.map((dayInfo, index) => {
                        const dayLoans = getLoansForDay(dayInfo.date);
                        const isTodayDate = isToday(dayInfo.date);
                        return (
                            <Box key={index} onClick={() => handleDayClick(dayInfo)} sx={{ minHeight: 120, p: 1, border: 1, borderColor: isTodayDate ? 'primary.main' : 'divider', borderWidth: isTodayDate ? 2 : 1, borderRadius: 1, bgcolor: dayInfo.isCurrentMonth ? 'background.paper' : 'action.hover', cursor: dayLoans.length > 0 ? 'pointer' : 'default', '&:hover': dayLoans.length > 0 ? { bgcolor: 'action.hover', boxShadow: 1 } : {}, overflow: 'hidden' }}> {/* ✅ FIX: Add overflow:hidden to each cell */}
                                <Typography variant="body2" sx={{ fontWeight: isTodayDate ? 'bold' : 'normal', color: dayInfo.isCurrentMonth ? 'text.primary' : 'text.disabled' }}>{dayInfo.day}</Typography>
                                <Box sx={{ mt: 0.5, width: '100%' }}> {/* ✅ FIX: Constrain width */}
                                    {dayLoans.slice(0, 2).map((loan) => (
                                        <Tooltip key={loan.id} title={`Détails: ${loan.computerName} prêté à ${loan.userDisplayName || loan.userName}`}>
                                            <Box sx={{
                                                fontSize: '0.65rem',
                                                bgcolor: STATUS_COLORS[loan.status]?.bg || '#grey',
                                                color: STATUS_COLORS[loan.status]?.text || 'white',
                                                borderRadius: 1, px: 0.5, py: 0.3, mb: 0.5,
                                                overflow: 'hidden',
                                                width: '100%'
                                            }}>
                                                <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: 'block', fontSize: '0.65rem', lineHeight: 1.2 }}>
                                                    {loan.computerName}
                                                </Typography>
                                                <Typography variant="caption" noWrap sx={{ display: 'block', fontSize: '0.6rem', opacity: 0.9, lineHeight: 1.2 }}>
                                                    👤 {loan.userDisplayName || loan.userName}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    ))}
                                    {dayLoans.length > 2 && (<Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 'bold' }}>+{dayLoans.length - 2} autre(s)</Typography>)}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Paper>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>Légende:</Typography>
                {Object.entries(STATUS_COLORS).map(([status, config]) => (<Chip key={status} label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.text }} />))}
            </Box>
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon /> Prêts du {selectedDay && selectedDay.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedDay && selectedDay.loans.length > 0 ? (
                        <List>
                            {selectedDay.loans.map(loan => (
                                <Card key={loan.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <LaptopIcon color="primary" />
                                                    <Typography variant="h6">{loan.computerName}</Typography>
                                                    <Chip label={STATUS_COLORS[loan.status]?.label || loan.status} size="small" sx={{ bgcolor: STATUS_COLORS[loan.status]?.bg, color: STATUS_COLORS[loan.status]?.text }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><PersonIcon fontSize="small" color="action" /><Typography variant="body2">{loan.userDisplayName || loan.userName}</Typography></Box>
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Début: {new Date(loan.loanDate).toLocaleDateString('fr-FR')}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>Retour prévu: {new Date(loan.expectedReturnDate).toLocaleDateString('fr-FR')}</Typography>
                                                </Box>
                                                {loan.notes && (<Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>Note: {loan.notes}</Typography>)}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </List>
                    ) : (<Alert severity="info">Aucun prêt ce jour</Alert>)}
                </DialogContent>
                <DialogActions><Button onClick={() => setDetailDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default LoansCalendar;