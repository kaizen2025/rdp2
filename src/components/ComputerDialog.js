import React, { useState, useEffect } from 'react';
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
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const COMPUTER_STATUS = {
  AVAILABLE: 'available',
  LOANED: 'loaned',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired'
};

const statusTranslations = {
    available: 'Disponible',
    loaned: 'Prêté',
    reserved: 'Réservé',
    maintenance: 'En maintenance',
    retired: 'Retiré',
};

const LOCATIONS = [
    'Bureau Perpignan',
    'Bureau Lyon', 
    'Bureau Paris',
    'Entrepôt',
    'Stock IT',
    'Externe'
];

const CONDITIONS = [
    'Neuf',
    'Excellent',
    'Très bon',
    'Bon',
    'Acceptable',
    'Médiocre',
    'Hors service'
];

const ComputerDialog = ({ open, onClose, computer, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        status: COMPUTER_STATUS.AVAILABLE,
        notes: '',
        specifications: {
            cpu: '',
            ram: '',
            os: '',
            format: '',
            storage: '',
            screen: ''
        },
        warranty: {
            hasWarranty: false,
            provider: '',
            expirationDate: null,
            purchaseDate: null,
            purchasePrice: ''
        },
        location: '',
        condition: 'Bon',
        assignedTo: '',
        assetTag: ''
    });

    useEffect(() => {
        if (computer) {
            setFormData({
                id: computer.id || null,
                name: computer.name || '',
                brand: computer.brand || '',
                model: computer.model || '',
                serialNumber: computer.serialNumber || '',
                status: computer.status || COMPUTER_STATUS.AVAILABLE,
                notes: computer.notes || '',
                specifications: {
                    cpu: computer.specifications?.cpu || '',
                    ram: computer.specifications?.ram || '',
                    os: computer.specifications?.os || '',
                    format: computer.specifications?.format || '',
                    storage: computer.specifications?.storage || '',
                    screen: computer.specifications?.screen || ''
                },
                warranty: {
                    hasWarranty: computer.warranty?.hasWarranty || false,
                    provider: computer.warranty?.provider || '',
                    expirationDate: computer.warranty?.expirationDate ? new Date(computer.warranty.expirationDate) : null,
                    purchaseDate: computer.warranty?.purchaseDate ? new Date(computer.warranty.purchaseDate) : null,
                    purchasePrice: computer.warranty?.purchasePrice || ''
                },
                location: computer.location || '',
                condition: computer.condition || 'Bon',
                assignedTo: computer.assignedTo || '',
                assetTag: computer.assetTag || ''
            });
        } else {
            setFormData({
                name: '',
                brand: '',
                model: '',
                serialNumber: '',
                status: COMPUTER_STATUS.AVAILABLE,
                notes: '',
                specifications: {
                    cpu: '',
                    ram: '',
                    os: '',
                    format: '',
                    storage: '',
                    screen: ''
                },
                warranty: {
                    hasWarranty: false,
                    provider: '',
                    expirationDate: null,
                    purchaseDate: null,
                    purchasePrice: ''
                },
                location: '',
                condition: 'Bon',
                assignedTo: '',
                assetTag: ''
            });
        }
    }, [computer, open]);

    const handleWarrantyToggle = (e) => {
        const hasWarranty = e.target.value === 'true';
        setFormData(prev => ({
            ...prev,
            warranty: {
                ...prev.warranty,
                hasWarranty
            }
        }));
    };

    const handleDateChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            warranty: {
                ...prev.warranty,
                [field]: value
            }
        }));
    };

    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'name':
                if (!value) error = 'Le nom de l\'ordinateur est obligatoire';
                break;
            case 'serialNumber':
                if (!value) error = 'Le numéro de série est obligatoire';
                break;
            default:
                break;
        }
        return error;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validate = () => {
        const newErrors = {};
        const fieldsToValidate = ['name', 'serialNumber'];
        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) {
            alert('Veuillez corriger les erreurs dans le formulaire.');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            TransitionComponent={Transition}
            aria-labelledby="computer-dialog-title"
            aria-describedby="computer-dialog-description"
        >
            <DialogTitle id="computer-dialog-title">
                {computer ? 'Modifier l\'ordinateur' : 'Ajouter un ordinateur'}
            </DialogTitle>
            <DialogContent>
                <Typography id="computer-dialog-description" style={{ display: 'none' }}>
                    Formulaire pour ajouter ou modifier un ordinateur.
                </Typography>
                <Grid container spacing={3} sx={{ mt: 0.5 }}>
                    {/* Informations de base */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>Informations de base</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField 
                            name="name" 
                            label="Nom de l'ordinateur (ex: PC-ANECOOP-01)" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                            required 
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField 
                            name="assetTag" 
                            label="N° d'inventaire" 
                            value={formData.assetTag} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField 
                            name="brand" 
                            label="Marque" 
                            value={formData.brand} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            name="model" 
                            label="Modèle" 
                            value={formData.model} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            name="serialNumber" 
                            label="Numéro de série" 
                            value={formData.serialNumber} 
                            onChange={handleChange} 
                            fullWidth 
                            required 
                            error={!!errors.serialNumber}
                            helperText={errors.serialNumber}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>Statut</InputLabel>
                            <Select 
                                name="status" 
                                label="Statut" 
                                value={formData.status} 
                                onChange={handleChange}
                            >
                                {Object.values(COMPUTER_STATUS).map(status => (
                                    <MenuItem key={status} value={status}>{statusTranslations[status]}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>Localisation</InputLabel>
                            <Select 
                                name="location" 
                                label="Localisation" 
                                value={formData.location} 
                                onChange={handleChange}
                            >
                                {LOCATIONS.map(loc => (
                                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>État</InputLabel>
                            <Select 
                                name="condition" 
                                label="État" 
                                value={formData.condition} 
                                onChange={handleChange}
                            >
                                {CONDITIONS.map(cond => (
                                    <MenuItem key={cond} value={cond}>{cond}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField 
                            name="assignedTo" 
                            label="Assigné à (utilisateur)" 
                            value={formData.assignedTo} 
                            onChange={handleChange} 
                            fullWidth 
                            helperText="Laisser vide si non assigné"
                        />
                    </Grid>

                    {/* Spécifications techniques */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Spécifications techniques</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                            name="specifications.cpu" 
                            label="Processeur" 
                            value={formData.specifications.cpu} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                            name="specifications.ram" 
                            label="RAM" 
                            value={formData.specifications.ram} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                            name="specifications.storage" 
                            label="Stockage" 
                            value={formData.specifications.storage} 
                            onChange={handleChange} 
                            fullWidth 
                            placeholder="Ex: SSD 256Go"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                            name="specifications.os" 
                            label="Système d'exploitation" 
                            value={formData.specifications.os} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                            name="specifications.format" 
                            label="Format" 
                            value={formData.specifications.format} 
                            onChange={handleChange} 
                            fullWidth 
                            placeholder="Petit/Moyen/Grand"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                            name="specifications.screen" 
                            label="Taille écran" 
                            value={formData.specifications.screen} 
                            onChange={handleChange} 
                            fullWidth 
                            placeholder="Ex: 15.6 pouces"
                        />
                    </Grid>

                    {/* Garantie et achat */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Garantie et achat</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Sous garantie ?</InputLabel>
                            <Select 
                                value={formData.warranty.hasWarranty.toString()} 
                                label="Sous garantie ?" 
                                onChange={handleWarrantyToggle}
                            >
                                <MenuItem value="false">Non</MenuItem>
                                <MenuItem value="true">Oui</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {formData.warranty.hasWarranty && (
                        <>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    name="warranty.provider" 
                                    label="Fournisseur de garantie" 
                                    value={formData.warranty.provider} 
                                    onChange={handleChange} 
                                    fullWidth 
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Date d'expiration garantie"
                                    value={formData.warranty.expirationDate}
                                    onChange={(newValue) => handleDateChange('expirationDate', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Grid>
                        </>
                    )}

                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Date d'achat"
                            value={formData.warranty.purchaseDate}
                            onChange={(newValue) => handleDateChange('purchaseDate', newValue)}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField 
                            name="warranty.purchasePrice" 
                            label="Prix d'achat (€)" 
                            value={formData.warranty.purchasePrice} 
                            onChange={handleChange} 
                            fullWidth 
                            type="number"
                        />
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Notes</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField 
                            name="notes" 
                            label="Notes" 
                            value={formData.notes} 
                            onChange={handleChange} 
                            fullWidth 
                            multiline 
                            rows={3} 
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {computer ? 'Sauvegarder' : 'Ajouter'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ComputerDialog;