// VirtualizedLoanList.js - Liste de prêts optimisée avec virtualisation
import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
    Card, 
    CardContent, 
    Typography, 
    Chip, 
    IconButton, 
    Tooltip,
    Box,
    Avatar,
    LinearProgress,
    useTheme
} from '@mui/material';
import {
    AccessTime,
    CheckCircle,
    Warning,
    Error,
    Person,
    Computer,
    DateRange,
    Assignment
} from '@mui/icons-material';
import { UserColorBadge } from './UserColorManager';

// Hook pour la gestion des alertes préventives
const useLoanAlerts = (loans = []) => {
    const alerts = useMemo(() => {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        return loans.map(loan => {
            const returnDate = new Date(loan.returnDate);
            const isOverdue = returnDate < now;
            const isDue24h = returnDate <= next24h && returnDate > now;
            const isDue48h = returnDate <= next48h && returnDate > next24h;
            
            let alertLevel = 'none';
            let alertColor = 'success';
            
            if (isOverdue) {
                alertLevel = 'critical';
                alertColor = 'error';
            } else if (isDue24h) {
                alertLevel = 'warning';
                alertColor = 'warning';
            } else if (isDue48h) {
                alertLevel = 'info';
                alertColor = 'info';
            }
            
            return {
                ...loan,
                alertLevel,
                alertColor,
                daysUntilReturn: Math.ceil((returnDate - now) / (1000 * 60 * 60 * 24))
            };
        });
    }, [loans]);
    
    return alerts;
};

const VirtualizedLoanList = ({ 
    loans = [], 
    onLoanSelect, 
    onLoanEdit, 
    onLoanReturn,
    height = 600,
    itemSize = 120
}) => {
    const theme = useTheme();
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    
    // Appliquer les alertes préventives
    const loansWithAlerts = useLoanAlerts(loans);
    
    // Calculer les statistiques pour l'en-tête
    const stats = useMemo(() => {
        const total = loansWithAlerts.length;
        const overdue = loansWithAlerts.filter(l => l.alertLevel === 'critical').length;
        const due24h = loansWithAlerts.filter(l => l.alertLevel === 'warning').length;
        const due48h = loansWithAlerts.filter(l => l.alertLevel === 'info').length;
        const active = loansWithAlerts.filter(l => l.status === 'active').length;
        
        return { total, overdue, due24h, due48h, active };
    }, [loansWithAlerts]);
    
    const handleLoanClick = useCallback((loan) => {
        setSelectedLoanId(loan.id);
        onLoanSelect?.(loan);
    }, [onLoanSelect]);
    
    const getStatusIcon = (loan) => {
        switch (loan.alertLevel) {
            case 'critical':
                return <Error color="error" />;
            case 'warning':
                return <Warning color="warning" />;
            case 'info':
                return <AccessTime color="info" />;
            case 'none':
                return <CheckCircle color="success" />;
            default:
                return <Assignment color="action" />;
        }
    };
    
    const getStatusText = (loan) => {
        const days = loan.daysUntilReturn;
        switch (loan.alertLevel) {
            case 'critical':
                return `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
            case 'warning':
                return `Retour dû dans ${days} jour${days > 1 ? 's' : ''}`;
            case 'info':
                return `Retour dû dans ${days} jour${days > 1 ? 's' : ''}`;
            case 'none':
                return 'Retour à jour';
            default:
                return 'Statut inconnu';
        }
    };
    
    const LoanItem = ({ index, style }) => {
        const loan = loansWithAlerts[index];
        if (!loan) return null;
        
        const isSelected = selectedLoanId === loan.id;
        
        return (
            <div style={style}>
                <Card 
                    sx={{ 
                        m: 1, 
                        height: itemSize - 16,
                        cursor: 'pointer',
                        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: theme.shadows[4],
                            transform: 'translateY(-2px)'
                        }
                    }}
                    onClick={() => handleLoanClick(loan)}
                >
                    <CardContent sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                                    <Computer fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                                        {loan.equipmentName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {loan.equipmentType}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UserColorBadge 
                                    userId={loan.userId}
                                    userName={loan.userName}
                                    displayName={loan.userDisplayName}
                                    size="small"
                                />
                                {getStatusIcon(loan)}
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                <DateRange sx={{ fontSize: 16, mr: 0.5 }} />
                                Retour: {new Date(loan.returnDate).toLocaleDateString('fr-FR')}
                            </Typography>
                            
                            <Chip 
                                label={getStatusText(loan)}
                                size="small"
                                color={loan.alertColor}
                                variant="outlined"
                            />
                        </Box>
                        
                        {loan.progress !== undefined && (
                            <LinearProgress 
                                variant="determinate" 
                                value={loan.progress}
                                color={loan.alertColor}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };
    
    return (
        <Box>
            {/* Statistiques d'alertes */}
            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 2, 
                p: 2, 
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid #e0e0e0'
            }}>
                <Chip 
                    label={`${stats.total} prêts`} 
                    variant="outlined" 
                    icon={<Assignment />}
                />
                <Chip 
                    label={`${stats.active} actifs`} 
                    color="primary" 
                    variant="outlined"
                    icon={<Person />}
                />
                {stats.overdue > 0 && (
                    <Chip 
                        label={`${stats.overdue} en retard`} 
                        color="error" 
                        variant="filled"
                        icon={<Error />}
                    />
                )}
                {stats.due24h > 0 && (
                    <Chip 
                        label={`${stats.due24h} dus 24h`} 
                        color="warning" 
                        variant="filled"
                        icon={<Warning />}
                    />
                )}
                {stats.due48h > 0 && (
                    <Chip 
                        label={`${stats.due48h} dus 48h`} 
                        color="info" 
                        variant="outlined"
                        icon={<AccessTime />}
                    />
                )}
            </Box>
            
            {/* Liste virtualisée */}
            <List
                height={height}
                itemCount={loansWithAlerts.length}
                itemSize={itemSize}
                width="100%"
            >
                {LoanItem}
            </List>
        </Box>
    );
};

export default VirtualizedLoanList;