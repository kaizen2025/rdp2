// src/components/LoanDialog.js - VERSION AMÉLIORÉE AVEC RÉSERVATIONS MULTIPLES

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays, format, isWithinInterval, parseISO, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoIcon from '@mui/icons-material/Info';
import apiService from '../services/apiService';
import { getAccessoryIcon } from '../config/accessoriesConfig';

// ✅ AMÉLIORÉ: Ajout de existingLoans et isReservation comme props + transition optimisée
const LoanDialog = ({ open, onClose, loan, onSave, users, itStaff, computers = [], computer = null, existingLoans = [], isReservation = false }) => {
    const { currentTechnician } = useApp();
    const [formData, setFormData] = useState({});
    const [availableAccessories, setAvailableAccessories] = useState([]);
    const [userConfirmed, setUserConfirmed] = useState(false);
    const [errors, setErrors] = useState({});
    const [isReady, setIsReady] = useState(false);
    const isEditMode = !!loan;

    // ✅ OPTIMISATION: Différer le rendu complet après l'ouverture
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setIsReady(true), 50);
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => {
                apiService.getAccessories().then(accs => setAvailableAccessories(accs.filter(a => a.active)));
            });

            if (isEditMode) {
                setFormData({
                    ...loan,
                    loanDate: new Date(loan.loanDate),
                    expectedReturnDate: new Date(loan.expectedReturnDate),
                    accessories: loan.accessories || [],
                });
                setUserConfirmed(true);
            } else {
                const defaultStaff = currentTechnician?.name || (itStaff.length > 0 ? itStaff[0] : '');
                const defaultStartDate = isReservation ? addDays(new Date(), 1) : new Date();
                setFormData({
                    computerId: computer?.id || null, userName: '', userDisplayName: '', itStaff: defaultStaff,
                    loanDate: defaultStartDate, expectedReturnDate: addDays(defaultStartDate, 7),
                    notes: '', accessories: []
                });
                setUserConfirmed(false);
            }
            setErrors({});
        }
    }, [loan, open, itStaff, isEditMode, computer, currentTechnician, isReservation]);

    // ✅ NOUVEAU: Récupérer les réservations existantes pour l'ordinateur sélectionné
    const existingReservationsForComputer = useMemo(() => {
        if (!formData.computerId || !existingLoans) return [];
        return existingLoans
            .filter(l =>
                l.computerId === formData.computerId &&
                l.id !== loan?.id &&
                ['active', 'reserved', 'overdue', 'critical'].includes(l.status)
            )
            .sort((a, b) => new Date(a.loanDate) - new Date(b.loanDate));
    }, [formData.computerId, existingLoans, loan?.id]);

    // ✅ NOUVEAU: Vérifier si les dates chevauchent un prêt existant
    const checkDateConflict = (computerId, startDate, endDate) => {
        if (!existingLoans || existingLoans.length === 0) return null;

        const loansForComputer = existingLoans.filter(l =>
            l.computerId === computerId &&
            l.id !== loan?.id &&
            ['active', 'reserved', 'overdue', 'critical'].includes(l.status)
        );

        const conflictingLoan = loansForComputer.find(l => {
            const loanStart = new Date(l.loanDate);
            const loanEnd = new Date(l.expectedReturnDate);
            loanStart.setHours(0, 0, 0, 0);
            loanEnd.setHours(23, 59, 59, 999);
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return (start <= loanEnd && end >= loanStart);
        });

        return conflictingLoan;
    };

    // ✅ NOUVEAU: Calculer le statut de disponibilité en temps réel
    const availabilityStatus = useMemo(() => {
        if (!formData.computerId || !formData.loanDate || !formData.expectedReturnDate) {
            return { available: true, message: '' };
        }
        const conflict = checkDateConflict(formData.computerId, formData.loanDate, formData.expectedReturnDate);
        if (conflict) {
            return {
                available: false,
                conflict,
                message: `Conflit avec le prêt de ${conflict.userDisplayName || conflict.userName} (${format(new Date(conflict.loanDate), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(conflict.expectedReturnDate), 'dd/MM/yyyy', { locale: fr })})`
            };
        }
        return { available: true, message: 'Dates disponibles' };
    }, [formData.computerId, formData.loanDate, formData.expectedReturnDate, existingLoans]);

    const validate = () => {
        const newErrors = {};
        if (!formData.computerId) newErrors.computerId = 'Veuillez sélectionner un ordinateur';
        if (!formData.userName) newErrors.userName = 'Veuillez sélectionner un utilisateur';
        if (!formData.itStaff) newErrors.itStaff = 'Veuillez sélectionner un responsable IT';
        if (!formData.loanDate) newErrors.loanDate = 'Veuillez sélectionner une date de prêt';
        if (!formData.expectedReturnDate) newErrors.expectedReturnDate = 'Veuillez sélectionner une date de retour';
        if (formData.loanDate && formData.expectedReturnDate && formData.loanDate > formData.expectedReturnDate) {
            newErrors.expectedReturnDate = 'La date de retour doit être après la date de prêt';
        }

        // ✅ NOUVEAU: Vérifier les conflits de dates pour les réservations multiples
        if (formData.computerId && formData.loanDate && formData.expectedReturnDate) {
            const conflict = checkDateConflict(formData.computerId, formData.loanDate, formData.expectedReturnDate);
            if (conflict) {
                const conflictStart = new Date(conflict.loanDate).toLocaleDateString('fr-FR');
                const conflictEnd = new Date(conflict.expectedReturnDate).toLocaleDateString('fr-FR');
                newErrors.loanDate = `Ce matériel est déjà réservé du ${conflictStart} au ${conflictEnd}`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        if (!isEditMode && !userConfirmed) {
            alert('Veuillez confirmer que l\'utilisateur a bien reçu le matériel.');
            return;
        }

        const selectedComputer = computers.find(c => c.id === formData.computerId);
        const loanData = {
            ...formData,
            computerName: selectedComputer?.name || 'N/A',
            loanDate: formData.loanDate.toISOString(),
            expectedReturnDate: formData.expectedReturnDate.toISOString(),
            status: isEditMode ? loan.status : (new Date(formData.loanDate) > new Date() ? 'reserved' : 'active'),
            signature: {
                userConfirmation: userConfirmed,
                technicianName: currentTechnician?.name,
                date: new Date().toISOString()
            }
        };
        onSave(loanData);
    };

    const handleAccessoryToggle = (accessoryId) => {
        setFormData(prev => ({ ...prev, accessories: prev.accessories.includes(accessoryId) ? prev.accessories.filter(id => id !== accessoryId) : [...prev.accessories, accessoryId] }));
    };

    // ✅ AMÉLIORATION: Permettre de sélectionner tous les ordinateurs (pas seulement disponibles)
    // car on peut réserver pour une date future même si le matériel est actuellement prêté
    const availableComputers = useMemo(() => {
        if (isEditMode) {
            // En mode édition, montrer tous les ordinateurs + celui du prêt actuel
            return computers.filter(c => c.status !== 'retired' && c.status !== 'maintenance');
        }
        // En mode création, montrer tous les ordinateurs non-retirés/maintenance
        // La validation des dates empêchera les conflits
        return computers.filter(c => c.status !== 'retired' && c.status !== 'maintenance');
    }, [computers, isEditMode]);

    // Ordinateurs avec leur statut de disponibilité pour les dates sélectionnées
    const computersWithAvailability = useMemo(() => {
        if (!formData.loanDate || !formData.expectedReturnDate) return availableComputers.map(c => ({ ...c, isAvailableForDates: true }));

        return availableComputers.map(comp => {
            const conflict = checkDateConflict(comp.id, formData.loanDate, formData.expectedReturnDate);
            return {
                ...comp,
                isAvailableForDates: !conflict,
                conflictInfo: conflict
            };
        });
    }, [availableComputers, formData.loanDate, formData.expectedReturnDate, existingLoans]);

    const selectedUser = users.find(u => u.username === formData.userName);

    // Calculer si c'est une réservation future
    const isFutureReservation = formData.loanDate && new Date(formData.loanDate) > new Date();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isEditMode ? 'Modifier le prêt' : (isFutureReservation ? 'Créer une réservation' : 'Créer un prêt')}
                {isFutureReservation && !isEditMode && (
                    <Chip size="small" label="Réservation" color="warning" sx={{ ml: 1 }} />
                )}
            </DialogTitle>
            <DialogContent dividers>
                {/* Alerte si aucun ordinateur disponible */}
                {!isEditMode && availableComputers.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Aucun ordinateur disponible pour le moment. Tous les ordinateurs sont déjà en prêt.
                    </Alert>
                )}

                {/* Affichage du statut de disponibilité en temps réel */}
                {formData.computerId && formData.loanDate && formData.expectedReturnDate && (
                    <Alert
                        severity={availabilityStatus.available ? 'success' : 'error'}
                        icon={availabilityStatus.available ? <EventAvailableIcon /> : <EventBusyIcon />}
                        sx={{ mb: 2 }}
                    >
                        {availabilityStatus.available ? (
                            'Ces dates sont disponibles pour ce matériel'
                        ) : (
                            <>
                                <AlertTitle>Conflit de dates</AlertTitle>
                                {availabilityStatus.message}
                            </>
                        )}
                    </Alert>
                )}

                <Grid container spacing={2} sx={{ pt: 1 }}>
                    {/* Sélection ordinateur avec indicateur de disponibilité */}
                    <Grid item xs={12}>
                        <FormControl fullWidth required error={!!errors.computerId}>
                            <InputLabel>Ordinateur</InputLabel>
                            <Select
                                value={formData.computerId || ''}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, computerId: e.target.value }));
                                    setErrors(prev => ({ ...prev, computerId: '', loanDate: '' }));
                                }}
                                label="Ordinateur"
                            >
                                {computersWithAvailability.map(comp => (
                                    <MenuItem key={comp.id} value={comp.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <Typography variant="body2">
                                                {comp.name} - {comp.brand} {comp.model}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {comp.status === 'loaned' && (
                                                    <Chip size="small" label="Prêté" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                )}
                                                {comp.status === 'reserved' && (
                                                    <Chip size="small" label="Réservé" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                )}
                                                {comp.status === 'available' && (
                                                    <Chip size="small" label="Dispo" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                )}
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.computerId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>{errors.computerId}</Typography>}
                        </FormControl>
                    </Grid>

                    {/* Affichage des réservations existantes pour cet ordinateur */}
                    {existingReservationsForComputer.length > 0 && (
                        <Grid item xs={12}>
                            <Alert severity="info" icon={<InfoIcon />} sx={{ py: 0.5 }}>
                                <Typography variant="caption" fontWeight={600}>
                                    Périodes déjà réservées pour ce matériel :
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {existingReservationsForComputer.map(res => (
                                        <Chip
                                            key={res.id}
                                            size="small"
                                            variant="outlined"
                                            color={res.status === 'active' || res.status === 'overdue' ? 'error' : 'warning'}
                                            label={`${format(new Date(res.loanDate), 'dd/MM')} - ${format(new Date(res.expectedReturnDate), 'dd/MM')} (${res.userDisplayName || res.userName})`}
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    ))}
                                </Box>
                            </Alert>
                        </Grid>
                    )}

                    {/* Sélection utilisateur */}
                    <Grid item xs={12}>
                        <Autocomplete
                            options={users}
                            value={selectedUser || null}
                            getOptionLabel={(option) => `${option.displayName || option.username} (${option.username})`}
                            onChange={(event, newValue) => {
                                setFormData(prev => ({ ...prev, userName: newValue ? newValue.username : '', userDisplayName: newValue ? newValue.displayName : '' }));
                                setErrors(prev => ({ ...prev, userName: '' }));
                            }}
                            renderInput={(params) => <TextField {...params} label="Utilisateur" required error={!!errors.userName} helperText={errors.userName} />}
                        />
                    </Grid>

                    {/* Responsable IT */}
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Responsable IT</InputLabel>
                            <Select name="itStaff" label="Responsable IT" value={formData.itStaff || ''} onChange={(e) => setFormData(prev => ({ ...prev, itStaff: e.target.value }))}>
                                {itStaff.map(staff => (<MenuItem key={staff} value={staff}>{staff}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Dates avec erreurs visuelles */}
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date de début"
                            value={formData.loanDate}
                            onChange={(v) => {
                                setFormData(prev => ({ ...prev, loanDate: v }));
                                setErrors(prev => ({ ...prev, loanDate: '' }));
                            }}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    error: !!errors.loanDate,
                                    helperText: errors.loanDate
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date de retour prévue"
                            value={formData.expectedReturnDate}
                            onChange={(v) => {
                                setFormData(prev => ({ ...prev, expectedReturnDate: v }));
                                setErrors(prev => ({ ...prev, expectedReturnDate: '' }));
                            }}
                            minDate={formData.loanDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    error: !!errors.expectedReturnDate,
                                    helperText: errors.expectedReturnDate
                                }
                            }}
                        />
                    </Grid>

                    {/* Accessoires */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>Accessoires</Typography>
                        <FormGroup>
                            <Grid container spacing={1}>
                                {availableAccessories.map(accessory => (
                                    <Grid item xs={12} sm={6} key={accessory.id}>
                                        <FormControlLabel
                                            control={<Checkbox size="small" checked={formData.accessories?.includes(accessory.id)} onChange={() => handleAccessoryToggle(accessory.id)} />}
                                            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>{getAccessoryIcon(accessory.icon)}{accessory.name}</Box>}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </FormGroup>
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <TextField name="notes" label="Notes" value={formData.notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} fullWidth multiline rows={2} size="small" />
                    </Grid>

                    {/* Confirmation utilisateur */}
                    {!isEditMode && selectedUser && (
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <FormControlLabel
                                control={<Checkbox checked={userConfirmed} onChange={(e) => setUserConfirmed(e.target.checked)} color="success" />}
                                label={
                                    <Typography variant="body2">
                                        {isFutureReservation
                                            ? `Je confirme la réservation pour ${selectedUser.displayName}`
                                            : `L'utilisateur ${selectedUser.displayName} confirme avoir reçu le matériel`
                                        }
                                    </Typography>
                                }
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color={isFutureReservation ? 'warning' : 'primary'}
                    disabled={(!isEditMode && !userConfirmed) || !availabilityStatus.available}
                >
                    {isEditMode ? 'Sauvegarder' : (isFutureReservation ? 'Réserver' : 'Créer le prêt')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoanDialog;