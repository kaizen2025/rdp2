// src/components/LoanDialog.js - VERSION NETTOYÉE

import React, { useState, useEffect } from 'react';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';
import apiService from '../services/apiService';
import { getAccessoryIcon } from '../config/accessoriesConfig';

const LoanDialog = ({ open, onClose, loan, onSave, users, itStaff, computers = [], loans = [] }) => {
    const { events } = useApp();
    const [formData, setFormData] = useState({});
    const [availableAccessories, setAvailableAccessories] = useState([]);
    const isEditMode = !!loan;

    useEffect(() => {
        if (open) {
            events.emit('pause-refresh');
        }
        return () => {
            events.emit('resume-refresh');
        };
    }, [open, events]);

    useEffect(() => {
        if (open) {
            apiService.getAccessories().then(accs => setAvailableAccessories(accs.filter(a => a.active)));
            
            if (isEditMode) {
                setFormData({
                    ...loan,
                    loanDate: new Date(loan.loanDate),
                    expectedReturnDate: new Date(loan.expectedReturnDate),
                });
            } else {
                const defaultStaff = itStaff.length > 0 ? itStaff[0] : '';
                setFormData({
                    computerId: null, userName: '', userDisplayName: '', itStaff: defaultStaff,
                    loanDate: new Date(), expectedReturnDate: addDays(new Date(), 7),
                    notes: '', accessories: []
                });
            }
        }
    }, [loan, open, itStaff, isEditMode]);

    const handleSubmit = () => {
        if (!formData.computerId || !formData.userName || !formData.itStaff) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        const selectedComputer = computers.find(c => c.id === formData.computerId);
        const loanData = {
            ...formData,
            computerName: selectedComputer?.name || 'N/A',
            loanDate: formData.loanDate.toISOString(),
            expectedReturnDate: formData.expectedReturnDate.toISOString(),
            status: new Date(formData.loanDate) > new Date() ? 'reserved' : 'active'
        };
        onSave(loanData);
    };
    
    const handleAccessoryToggle = (accessoryId) => {
        setFormData(prev => ({ ...prev, accessories: prev.accessories.includes(accessoryId) ? prev.accessories.filter(id => id !== accessoryId) : [...prev.accessories, accessoryId] }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEditMode ? 'Modifier le prêt' : 'Créer un prêt'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Ordinateur</InputLabel>
                            <Select value={formData.computerId || ''} onChange={(e) => setFormData(prev => ({ ...prev, computerId: e.target.value }))} label="Ordinateur">
                                {computers.map(comp => (<MenuItem key={comp.id} value={comp.id}>{comp.name} - {comp.brand} {comp.model}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={users}
                            value={users.find(u => u.username === formData.userName) || null}
                            getOptionLabel={(option) => `${option.displayName || option.username} (${option.username})`}
                            onChange={(event, newValue) => setFormData(prev => ({...prev, userName: newValue ? newValue.username : '', userDisplayName: newValue ? newValue.displayName : ''}))}
                            renderInput={(params) => <TextField {...params} label="Utilisateur" required />}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Responsable IT</InputLabel>
                            <Select name="itStaff" label="Responsable IT" value={formData.itStaff || ''} onChange={(e) => setFormData(prev => ({...prev, itStaff: e.target.value }))}>
                                {itStaff.map(staff => (<MenuItem key={staff} value={staff}>{staff}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}><DatePicker label="Date de prêt/début" value={formData.loanDate} onChange={(v) => setFormData(prev => ({...prev, loanDate: v}))} renderInput={(params) => <TextField {...params} fullWidth />} /></Grid>
                    <Grid item xs={12} sm={6}><DatePicker label="Date de retour prévue" value={formData.expectedReturnDate} onChange={(v) => setFormData(prev => ({...prev, expectedReturnDate: v}))} minDate={formData.loanDate} renderInput={(params) => <TextField {...params} fullWidth />} /></Grid>
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>Accessoires</Typography>
                        <FormGroup><Grid container spacing={1}>{availableAccessories.map(accessory => (<Grid item xs={12} sm={6} key={accessory.id}><FormControlLabel control={<Checkbox checked={formData.accessories?.includes(accessory.id)} onChange={() => handleAccessoryToggle(accessory.id)}/>} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{getAccessoryIcon(accessory.icon)}{accessory.name}</Box>} /></Grid>))}</Grid></FormGroup>
                    </Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} /><TextField name="notes" label="Notes" value={formData.notes || ''} onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value }))} fullWidth multiline rows={3} /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} variant="contained">{isEditMode ? 'Sauvegarder' : 'Créer le prêt'}</Button></DialogActions>
        </Dialog>
    );
};

export default LoanDialog;