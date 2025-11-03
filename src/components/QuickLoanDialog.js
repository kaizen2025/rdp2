// src/components/QuickLoanDialog.js - NOUVEAU FICHIER

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';
import { useApp } from '../contexts/AppContext';

const QuickLoanDialog = ({ open, onClose, computer, users, onSave }) => {
    const { currentTechnician } = useApp();
    const [selectedUser, setSelectedUser] = useState(null);
    const [returnDate, setReturnDate] = useState(addDays(new Date(), 7));

    const handleSave = () => {
        if (!selectedUser) {
            alert("Veuillez sélectionner un utilisateur.");
            return;
        }
        const loanData = {
            computerId: computer.id,
            computerName: computer.name,
            userName: selectedUser.username,
            userDisplayName: selectedUser.displayName,
            itStaff: currentTechnician?.name || 'N/A',
            loanDate: new Date().toISOString(),
            expectedReturnDate: returnDate.toISOString(),
            status: 'active',
            notes: 'Prêt rapide',
            accessories: [],
        };
        onSave(loanData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Prêt Rapide - {computer?.name}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => `${option.displayName} (${option.username})`}
                            onChange={(e, newValue) => setSelectedUser(newValue)}
                            renderInput={(params) => <TextField {...params} label="Utilisateur" required autoFocus />}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <DatePicker
                            label="Date de retour"
                            value={returnDate}
                            onChange={setReturnDate}
                            minDate={new Date()}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} variant="contained" disabled={!selectedUser}>Créer le prêt</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickLoanDialog;