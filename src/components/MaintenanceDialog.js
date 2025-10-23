// src/components/MaintenanceDialog.js - Dialogue de maintenance

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addMonths } from 'date-fns';

import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const MAINTENANCE_TYPES = {
    preventive: { label: 'Préventive', color: 'info' },
    corrective: { label: 'Corrective', color: 'warning' },
    inspection: { label: 'Inspection', color: 'success' },
    upgrade: { label: 'Mise à niveau', color: 'primary' },
    repair: { label: 'Réparation', color: 'error' },
};

const MaintenanceDialog = ({ open, onClose, computer, onSave }) => {
    const [formData, setFormData] = useState({
        type: 'preventive',
        description: '',
        nextMaintenanceDate: addMonths(new Date(), 6),
    });

    useEffect(() => {
        if (open && computer) {
            setFormData({
                type: 'preventive',
                description: '',
                nextMaintenanceDate: addMonths(new Date(), 6),
            });
        }
    }, [open, computer]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.description.trim()) {
            alert('Veuillez saisir une description de la maintenance.');
            return;
        }
        onSave(computer.id, formData);
        onClose();
    };

    if (!computer) return null;

    const hasMaintenanceHistory = computer.maintenanceHistory && computer.maintenanceHistory.length > 0;
    const nextMaintenanceOverdue = computer.nextMaintenanceDate && 
        new Date(computer.nextMaintenanceDate) < new Date();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon />
                    Maintenance - {computer.name}
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Ordinateur
                            </Typography>
                            <Typography variant="body1">
                                {computer.brand} {computer.model}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                S/N: {computer.serialNumber}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                                {nextMaintenanceOverdue && (
                                    <Chip 
                                        label="Maintenance en retard"
                                        size="small"
                                        color="warning"
                                        icon={<WarningIcon />}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    {hasMaintenanceHistory && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Historique des maintenances
                            </Typography>
                            <Box sx={{ maxHeight: 150, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                <List dense>
                                    {computer.maintenanceHistory.slice(-5).reverse().map((record, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip 
                                                            label={MAINTENANCE_TYPES[record.type]?.label || record.type}
                                                            size="small"
                                                            color={MAINTENANCE_TYPES[record.type]?.color || 'default'}
                                                        />
                                                        <Typography variant="caption" color="textSecondary">
                                                            {new Date(record.date).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="body2">
                                                        {record.description}
                                                        {record.performedBy && ` - Par ${record.performedBy}`}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Nouvelle intervention
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Type de maintenance</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type de maintenance"
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                {Object.entries(MAINTENANCE_TYPES).map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        {value.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Prochaine maintenance"
                            value={formData.nextMaintenanceDate}
                            onChange={(date) => handleChange('nextMaintenanceDate', date)}
                            minDate={new Date()}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Description de l'intervention"
                            placeholder="Décrivez les opérations effectuées, problèmes détectés, pièces remplacées..."
                            multiline
                            rows={4}
                            fullWidth
                            required
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, display: 'flex', gap: 1 }}>
                            <InfoIcon color="info" fontSize="small" />
                            <Typography variant="caption" color="info.dark">
                                Cette intervention sera enregistrée dans l'historique de maintenance de l'ordinateur.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    startIcon={<BuildIcon />}
                    disabled={!formData.description.trim()}
                >
                    Enregistrer la maintenance
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MaintenanceDialog;