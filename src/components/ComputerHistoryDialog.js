import React, { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import UpdateIcon from '@mui/icons-material/Update';
import CancelIcon from '@mui/icons-material/Cancel';

const eventIcons = {
    created: <EventAvailableIcon />,
    returned: <AssignmentReturnIcon />,
    extended: <UpdateIcon />,
    cancelled: <CancelIcon />,
    maintenance: <BuildIcon />
};

const eventColors = {
    created: 'success',
    returned: 'primary',
    extended: 'info',
    cancelled: 'error',
    maintenance: 'warning'
};

const ComputerHistoryDialog = ({ open, onClose, computer }) => {
    const [currentTab, setCurrentTab] = useState(0);
    const [loanHistory, setLoanHistory] = useState([]);
    const [maintenanceHistory, setMaintenanceHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        if (!computer) return;
        setIsLoading(true);
        try {
            const history = await window.electronAPI.getLoanHistory({
                computerId: computer.id,
                limit: 500
            });

            setLoanHistory(history);
            setMaintenanceHistory(computer.maintenanceHistory || []);
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        } finally {
            setIsLoading(false);
        }
    }, [computer]);

    useEffect(() => {
        if (open && computer) {
            loadHistory();
        }
    }, [open, computer, loadHistory]);

    if (!computer) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateLoanDuration = (loan) => {
        const start = new Date(loan.details.loanDate);
        const end = loan.details.actualReturnDate 
            ? new Date(loan.details.actualReturnDate) 
            : new Date();
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return days;
    };

    const getTotalLoanDays = () => {
        return loanHistory
            .filter(event => event.eventType === 'returned')
            .reduce((sum, event) => sum + calculateLoanDuration(event), 0);
    };

    const getTotalLoans = () => {
        return loanHistory.filter(event => event.eventType === 'created').length;
    };

    const getAverageLoanDuration = () => {
        const returned = loanHistory.filter(event => event.eventType === 'returned');
        if (returned.length === 0) return 0;
        return Math.round(getTotalLoanDays() / returned.length);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <HistoryIcon color="primary" />
                        <Box>
                            <Typography variant="h6" component="span">
                                Historique complet - {computer.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {computer.brand} {computer.model} • S/N: {computer.serialNumber}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">{getTotalLoans()}</Typography>
                                <Typography variant="body2" color="text.secondary">Prêts total</Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main">{getTotalLoanDays()}</Typography>
                                <Typography variant="body2" color="text.secondary">Jours prêtés</Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                                <Typography variant="h4" color="info.main">{getAverageLoanDuration()}</Typography>
                                <Typography variant="body2" color="text.secondary">Moyenne (jours)</Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                                <Typography variant="h4" color="warning.main">{maintenanceHistory.length}</Typography>
                                <Typography variant="body2" color="text.secondary">Maintenances</Typography>
                            </Paper>
                        </Box>

                        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 2 }}>
                            <Tab label="Historique des prêts" icon={<AssignmentIcon />} iconPosition="start" />
                            <Tab label="Maintenance" icon={<BuildIcon />} iconPosition="start" />
                        </Tabs>

                        {currentTab === 0 && (
                            <>
                                {loanHistory.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            Aucun historique de prêt
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Timeline>
                                        {loanHistory
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .map((event, index) => (
                                                <TimelineItem key={index}>
                                                    <TimelineOppositeContent color="text.secondary">
                                                        {formatDate(event.date)}
                                                    </TimelineOppositeContent>
                                                    <TimelineSeparator>
                                                        <TimelineDot color={eventColors[event.eventType]}>
                                                            {eventIcons[event.eventType]}
                                                        </TimelineDot>
                                                        {index < loanHistory.length - 1 && <TimelineConnector />}
                                                    </TimelineSeparator>
                                                    <TimelineContent>
                                                        <Paper elevation={3} sx={{ p: 2 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                                <Box>
                                                                    <Typography variant="h6">
                                                                        {event.eventType === 'created' && 'Prêt créé'}
                                                                        {event.eventType === 'returned' && 'Retourné'}
                                                                        {event.eventType === 'extended' && 'Prolongé'}
                                                                        {event.eventType === 'cancelled' && 'Annulé'}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Par {event.by}
                                                                    </Typography>
                                                                </Box>
                                                                <Chip 
                                                                    label={event.eventType} 
                                                                    size="small" 
                                                                    color={eventColors[event.eventType]}
                                                                />
                                                            </Box>
                                                            
                                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                                <strong>Utilisateur:</strong> {event.userDisplayName || event.userName}
                                                            </Typography>
                                                            
                                                            {event.eventType === 'created' && (
                                                                <>
                                                                    <Typography variant="body2">
                                                                        <strong>Date de prêt:</strong> {new Date(event.details.loanDate).toLocaleDateString('fr-FR')}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Retour prévu:</strong> {new Date(event.details.expectedReturnDate).toLocaleDateString('fr-FR')}
                                                                    </Typography>
                                                                </>
                                                            )}
                                                            
                                                            {event.eventType === 'returned' && (
                                                                <>
                                                                    <Typography variant="body2">
                                                                        <strong>Durée:</strong> {calculateLoanDuration(event)} jour(s)
                                                                    </Typography>
                                                                    {event.details.daysLate > 0 && (
                                                                        <Chip 
                                                                            label={`${event.details.daysLate} jour(s) de retard`}
                                                                            size="small"
                                                                            color="warning"
                                                                            sx={{ mt: 1 }}
                                                                        />
                                                                    )}
                                                                    {event.details.returnNotes && (
                                                                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                                            "{event.details.returnNotes}"
                                                                        </Typography>
                                                                    )}
                                                                </>
                                                            )}
                                                            
                                                            {event.details.notes && (
                                                                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                                    "{event.details.notes}"
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            ))}
                                    </Timeline>
                                )}
                            </>
                        )}

                        {currentTab === 1 && (
                            <>
                                {maintenanceHistory.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            Aucun historique de maintenance
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Date</strong></TableCell>
                                                    <TableCell><strong>Type</strong></TableCell>
                                                    <TableCell><strong>Description</strong></TableCell>
                                                    <TableCell><strong>Effectué par</strong></TableCell>
                                                    <TableCell><strong>Prochaine maintenance</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {maintenanceHistory
                                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                    .map((record, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                {new Date(record.date).toLocaleDateString('fr-FR')}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip label={record.type} size="small" color="primary" />
                                                            </TableCell>
                                                            <TableCell>{record.description}</TableCell>
                                                            <TableCell>{record.performedBy}</TableCell>
                                                            <TableCell>
                                                                {record.nextMaintenanceDate 
                                                                    ? new Date(record.nextMaintenanceDate).toLocaleDateString('fr-FR')
                                                                    : '-'
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined">Fermer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ComputerHistoryDialog;