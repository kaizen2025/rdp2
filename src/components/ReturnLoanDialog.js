// src/components/ReturnLoanDialog.js - AMÉLIORÉ avec config centralisée des accessoires

import React, { useState, useMemo, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import apiService from '../services/apiService';
import { getAccessoryIcon } from '../config/accessoriesConfig';

import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const ReturnLoanDialog = ({ open, onClose, loan, onReturn }) => {
    const [returnNotes, setReturnNotes] = useState('');
    const [returnedAccessories, setReturnedAccessories] = useState([]);
    const [allAccessories, setAllAccessories] = useState([]);

    useEffect(() => {
        const fetchAccessories = async () => {
            if (open) {
                try {
                    const accs = await apiService.getAccessories();
                    setAllAccessories(accs);
                } catch (error) {
                    console.error("Impossible de charger les accessoires", error);
                }
            }
        };
        fetchAccessories();
    }, [open]);
    
    const returnInfo = useMemo(() => {
        if (!loan) return null;
        const now = new Date();
        const expectedReturn = new Date(loan.expectedReturnDate);
        const daysLate = Math.max(0, Math.ceil((now - expectedReturn) / (1000 * 60 * 60 * 24)));
        return { isLate: daysLate > 0, daysLate, expectedReturnDate: expectedReturn };
    }, [loan]);

    const accessoriesInfo = useMemo(() => {
        if (!loan || !loan.accessories || loan.accessories.length === 0) {
            return { hasAccessories: false, allReturned: true, missingCount: 0 };
        }
        const loanedAccessories = loan.accessories || [];
        const missingAccessories = loanedAccessories.filter(id => !returnedAccessories.includes(id));
        return { hasAccessories: true, loanedAccessories, returnedAccessories, missingAccessories, allReturned: missingAccessories.length === 0, missingCount: missingAccessories.length };
    }, [loan, returnedAccessories]);

    const handleAccessoryToggle = (accessoryId) => {
        setReturnedAccessories(prev => prev.includes(accessoryId) ? prev.filter(id => id !== accessoryId) : [...prev, accessoryId]);
    };

    const handleReturn = () => {
        const accessoryInfoForNotes = accessoriesInfo.hasAccessories ? `\n\n[Accessoires retournés: ${returnedAccessories.length}/${accessoriesInfo.loanedAccessories.length}]` : '';
        const finalNotes = returnNotes + accessoryInfoForNotes;
        onReturn(loan, finalNotes, { returnedAccessories: returnedAccessories, loanedAccessories: loan.accessories || [] });
    };

    if (!loan || !returnInfo) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AssignmentReturnIcon />Retour de prêt</Box></DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}><Typography variant="subtitle2" color="textSecondary" gutterBottom>Ordinateur</Typography><Typography variant="h6">{loan.computerName}</Typography></Box>
                <Box sx={{ mb: 3 }}><Typography variant="subtitle2" color="textSecondary" gutterBottom>Utilisateur</Typography><Typography variant="body1">{loan.userDisplayName || loan.userName}</Typography></Box>
                <Divider sx={{ my: 2 }} />
                {returnInfo.isLate ? (<Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}><Typography variant="body2" fontWeight="bold">Retard de {returnInfo.daysLate} jour(s)</Typography><Typography variant="caption">Date de retour prévue : {returnInfo.expectedReturnDate.toLocaleDateString()}</Typography></Alert>) : (<Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}><Typography variant="body2">Retour dans les délais</Typography></Alert>)}
                {accessoriesInfo.hasAccessories && (
                    <><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>📦 Vérification des accessoires</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Cochez les accessoires qui ont été retournés</Typography>
                    <FormGroup><Grid container spacing={1}>{accessoriesInfo.loanedAccessories.map(accId => { const accessory = allAccessories.find(a => a.id === accId); if (!accessory) return null; return (<Grid item xs={12} sm={6} key={accId}><FormControlLabel control={<Checkbox checked={returnedAccessories.includes(accId)} onChange={() => handleAccessoryToggle(accId)} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{getAccessoryIcon(accessory.icon)}{accessory.name}</Box>} /></Grid>);})}</Grid></FormGroup>
                    {!accessoriesInfo.allReturned && (<Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}><Typography variant="body2">⚠️ <strong>{accessoriesInfo.missingCount} accessoire(s) manquant(s)</strong></Typography><Typography variant="caption">Vérifiez que tous les accessoires ont été retournés.</Typography></Alert>)}
                    {accessoriesInfo.allReturned && (<Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}><Typography variant="body2">✓ Tous les accessoires ont été retournés</Typography></Alert>)}
                    </>
                )}
                <TextField label="Notes de retour (optionnel)" placeholder="État de l'ordinateur, etc." multiline rows={4} fullWidth value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} sx={{ mt: 2 }} />
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleReturn} variant="contained" color={accessoriesInfo.allReturned ? "success" : "warning"} startIcon={<AssignmentReturnIcon />}>{accessoriesInfo.allReturned ? "Confirmer le retour" : "Retour avec manquants"}</Button></DialogActions>
        </Dialog>
    );
};

export default ReturnLoanDialog;