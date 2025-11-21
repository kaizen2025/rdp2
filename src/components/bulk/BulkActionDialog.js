// src/components/bulk/BulkActionDialog.js
// Modal de configuration des actions groupées avec validation avancée

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    Typography,
    Alert,
    Grid,
    Checkbox,
    FormControlLabel,
    Autocomplete,
    Paper,
    List,
    ListItem,
    ListItemText,
    Stepper,
    Step,
    StepLabel,
    Skeleton,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import {
    Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import apiService from '../../services/apiService';

const ACTION_STEPS = {
    EXTEND: ['Période de prolongation', 'Confirmation', 'Exécution'],
    RECALL: ['Message personnalisé', 'Confirmation', 'Exécution'],
    TRANSFER: ['Utilisateur cible', 'Motif de transfert', 'Confirmation', 'Exécution'],
    STATUS_CHANGE: ['Nouveau statut', 'Motif de changement', 'Confirmation', 'Exécution'],
    EXPORT: ['Format d\'export', 'Champs à inclure', 'Confirmation', 'Exécution'],
    DELETE: ['Confirmation définitive', 'Motif de suppression', 'Confirmation finale', 'Exécution']
};

const BulkActionDialog = ({
    open,
    onClose,
    action,
    parameters = {},
    validationErrors = {},
    selectedCount = 0,
    onParametersChange,
    onConfirm,
    canPerformAction = () => true
}) => {
    // États locaux
    const [currentStep, setCurrentStep] = useState(0);
    const [localParameters, setLocalParameters] = useState(parameters);
    const [localValidationErrors, setLocalValidationErrors] = useState({});
    const [previewData, setPreviewData] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [typedConfirmation, setTypedConfirmation] = useState('');

    // Reset des états lors de l'ouverture
    useEffect(() => {
        if (open) {
            setCurrentStep(0);
            setLocalParameters({});
            setLocalValidationErrors({});
            setPreviewData(null);
            setTypedConfirmation('');
            if (action?.id === 'DELETE') {
                setShowConfirmation(true);
            }
        }
    }, [open, action]);

    // Validation en temps réel
    useEffect(() => {
        if (action && localParameters) {
            const errors = validateParameters(action, localParameters);
            setLocalValidationErrors(errors);
        }
    }, [localParameters, action]);

    // Génération de prévisualisation pour l'export
    useEffect(() => {
        if (action?.id === 'EXPORT' && localParameters.format && localParameters.fields?.length > 0) {
            generatePreview();
        }
    }, [action, localParameters.format, localParameters.fields]);

    // Gestionnaires d'événements
    const handleParameterChange = (key, value) => {
        const newParams = { ...localParameters, [key]: value };
        setLocalParameters(newParams);
        onParametersChange?.(newParams);
    };

    const handleNext = () => {
        if (currentStep < getSteps(action?.id).length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleConfirm = () => {
        if (action?.id === 'DELETE') {
            const requiredConfirmation = `SUPPRIMER ${selectedCount}`;
            if (typedConfirmation !== requiredConfirmation) {
                setLocalValidationErrors({
                    confirmation: `Veuillez taper exactement: ${requiredConfirmation}`
                });
                return;
            }
        }
        onConfirm();
    };

    const handleClose = () => {
        setCurrentStep(0);
        setLocalParameters({});
        setLocalValidationErrors({});
        onClose();
    };

    // Génération de prévisualisation
    const generatePreview = async () => {
        if (!action || action.id !== 'EXPORT') return;

        setIsGeneratingPreview(true);

        // Simulation de génération de données de prévisualisation
        await new Promise(resolve => setTimeout(resolve, 1000));

        const sampleData = generateSampleExportData(localParameters.fields, selectedCount);
        setPreviewData(sampleData);
        setIsGeneratingPreview(false);
    };

    if (!action) return null;

    const steps = getSteps(action.id);
    const canProceed = Object.keys(localValidationErrors).length === 0 &&
        Object.values(localParameters).some(value =>
            value !== undefined && value !== '' &&
            (!Array.isArray(value) || value.length > 0)
        );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {action.icon}
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {action.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {action.description}
                        </Typography>
                    </Box>
                    <Chip
                        label={`${selectedCount} prêt${selectedCount > 1 ? 's' : ''}`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Étapes du processus */}
                <Box sx={{ mb: 3 }}>
                    <Stepper activeStep={currentStep} orientation="horizontal">
                        {steps.map((label, index) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Contenu de l'étape actuelle */}
                <Box sx={{ minHeight: '400px' }}>
                    {action.id === 'EXTEND' && (
                        <StepExtendContent
                            parameters={localParameters}
                            onChange={handleParameterChange}
                            errors={localValidationErrors}
                            selectedCount={selectedCount}
                        />
                    )}

                    {action.id === 'RECALL' && (
                        <StepRecallContent
                            parameters={localParameters}
                            onChange={handleParameterChange}
                            errors={localValidationErrors}
                            selectedCount={selectedCount}
                        />
                    )}

                    {action.id === 'TRANSFER' && (
                        <StepTransferContent
                            parameters={localParameters}
                            onChange={handleParameterChange}
                            errors={localValidationErrors}
                            selectedCount={selectedCount}
                        />
                    )}

                    {action.id === 'STATUS_CHANGE' && (
                        <StepStatusChangeContent
                            parameters={localParameters}
                            onChange={handleParameterChange}
                            errors={localValidationErrors}
                            selectedCount={selectedCount}
                        />
                    )}

                    {action.id === 'EXPORT' && (
                        <StepExportContent
                            parameters={localParameters}
                            onChange={handleParameterChange}
                            errors={localValidationErrors}
                            previewData={previewData}
                            isGeneratingPreview={isGeneratingPreview}
                            selectedCount={selectedCount}
                        />
                    )}

                    {action.id === 'DELETE' && (
                        <StepDeleteContent
                            parameters={localParameters}
                            onChange={handleParameterChange}
                            errors={localValidationErrors}
                            selectedCount={selectedCount}
                            showConfirmation={showConfirmation}
                            onToggleConfirmation={() => setShowConfirmation(!showConfirmation)}
                            typedConfirmation={typedConfirmation}
                            onTypedConfirmationChange={setTypedConfirmation}
                        />
                    )}
                </Box>

                {/* Avertissements pour les actions dangereuses */}
                {action.dangerous && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Action irréversible:</strong> Cette action ne peut pas être annulée.
                            Assurez-vous d'avoir vérifié votre sélection avant de continuer.
                        </Typography>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose}>
                    Annuler
                </Button>

                {currentStep > 0 && (
                    <Button onClick={handleBack}>
                        Précédent
                    </Button>
                )}

                {currentStep < steps.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                    >
                        Suivant
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color={action.dangerous ? 'error' : 'primary'}
                        onClick={handleConfirm}
                        disabled={!canProceed || Object.keys(localValidationErrors).length > 0}
                        startIcon={action.dangerous ? <DeleteIcon /> : action.icon}
                    >
                        {action.dangerous ? 'Supprimer définitivement' : 'Exécuter l\'action'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// Composants pour chaque étape d'action
const StepExtendContent = ({ parameters, onChange, errors, selectedCount }) => (
    <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                type="number"
                label="Nombre de jours"
                value={parameters.days || ''}
                onChange={(e) => onChange('days', parseInt(e.target.value) || 0)}
                error={!!errors.days}
                helperText={errors.days || `${selectedCount} prêt${selectedCount > 1 ? 's' : ''} sera${selectedCount > 1 ? 'ont' : ''} prolongé${selectedCount > 1 ? 's' : ''}`}
                InputProps={{
                    inputProps: { min: 1, max: 365 },
                    endAdornment: <InputAdornment position="end">jours</InputAdornment>
                }}
            />
        </Grid>

        <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Nouvelle date de retour (aperçu)"
                value={parameters.days ?
                    format(addDays(new Date(), parameters.days), 'dd/MM/yyyy', { locale: fr }) :
                    'Sélectionnez une durée'
                }
                InputProps={{ readOnly: true }}
                helperText="Date calculée automatiquement"
            />
        </Grid>
    </Grid>
);

const StepRecallContent = ({ parameters, onChange, errors, selectedCount }) => (
    <Box>
        <TextField
            fullWidth
            multiline
            rows={4}
            label="Message personnalisé (optionnel)"
            value={parameters.message || ''}
            onChange={(e) => onChange('message', e.target.value)}
            error={!!errors.message}
            helperText={errors.message || `Message qui sera envoyé aux ${selectedCount} emprunteur${selectedCount > 1 ? 's' : ''}`}
            placeholder="Bonjour, nous vous rappelons que le document... (laisser vide pour le message par défaut)"
        />

        <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
                Un email de rappel sera envoyé automatiquement à chaque emprunteur.
                Le message par défaut sera utilisé si aucun message personnalisé n'est spécifié.
            </Typography>
        </Alert>
    </Box>
);

const StepTransferContent = ({ parameters, onChange, errors, selectedCount }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            try {
                const result = await apiService.getAllAppUsers();
                if (result.success) {
                    setUsers(result.users);
                }
            } catch (error) {
                console.error('Erreur chargement utilisateurs:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Autocomplete
                    fullWidth
                    options={users}
                    loading={loading}
                    getOptionLabel={(option) => option.display_name || option.username || ''}
                    onChange={(e, value) => onChange('targetUser', value?.id || '')}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Utilisateur cible"
                            error={!!errors.targetUser}
                            helperText={errors.targetUser || 'Sélectionnez l\'utilisateur qui recevra les prêts'}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                        />
                    )}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Motif de transfert (optionnel)"
                    value={parameters.reason || ''}
                    onChange={(e) => onChange('reason', e.target.value)}
                    error={!!errors.reason}
                    helperText={errors.reason}
                    placeholder="Raison du transfert..."
                />
            </Grid>
        </Grid>
    );
};

const StepStatusChangeContent = ({ parameters, onChange, errors, selectedCount }) => (
    <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.newStatus}>
                <InputLabel>Nouveau statut</InputLabel>
                <Select
                    value={parameters.newStatus || ''}
                    onChange={(e) => onChange('newStatus', e.target.value)}
                    label="Nouveau statut"
                >
                    <MenuItem value="active">Actif</MenuItem>
                    <MenuItem value="reserved">Réservé</MenuItem>
                    <MenuItem value="overdue">En retard</MenuItem>
                    <MenuItem value="returned">Retourné</MenuItem>
                </Select>
                {errors.newStatus && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.newStatus}
                    </Typography>
                )}
            </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Motif de changement (optionnel)"
                value={parameters.reason || ''}
                onChange={(e) => onChange('reason', e.target.value)}
                error={!!errors.reason}
                helperText={errors.reason}
                placeholder="Raison du changement de statut..."
            />
        </Grid>
    </Grid>
);

const StepExportContent = ({ parameters, onChange, errors, previewData, isGeneratingPreview, selectedCount }) => (
    <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.format}>
                <InputLabel>Format d'export</InputLabel>
                <Select
                    value={parameters.format || ''}
                    onChange={(e) => onChange('format', e.target.value)}
                    label="Format d'export"
                >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                </Select>
                {errors.format && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.format}
                    </Typography>
                )}
            </FormControl>
        </Grid>

        <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.fields}>
                <InputLabel>Champs à inclure</InputLabel>
                <Select
                    multiple
                    value={parameters.fields || []}
                    onChange={(e) => onChange('fields', e.target.value)}
                    label="Champs à inclure"
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} size="small" label={value} />
                            ))}
                        </Box>
                    )}
                >
                    <MenuItem value="id">ID Prêt</MenuItem>
                    <MenuItem value="documentTitle">Document</MenuItem>
                    <MenuItem value="borrowerName">Emprunteur</MenuItem>
                    <MenuItem value="loanDate">Date d'emprunt</MenuItem>
                    <MenuItem value="returnDate">Date de retour</MenuItem>
                    <MenuItem value="status">Statut</MenuItem>
                </Select>
                {errors.fields && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.fields}
                    </Typography>
                )}
            </FormControl>
        </Grid>

        {/* Prévisualisation */}
        <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
                Aperçu des données ({Math.min(selectedCount, 5)} enregistrements sur {selectedCount})
            </Typography>

            {isGeneratingPreview ? (
                <Box>
                    <Skeleton variant="rectangular" height={120} sx={{ mb: 1 }} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                </Box>
            ) : previewData ? (
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                        {previewData.map((record, index) => (
                            <ListItem key={index} sx={{ borderBottom: index < previewData.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                                <ListItemText
                                    primary={record.documentTitle || record.id}
                                    secondary={`${record.borrowerName} • ${record.status} • ${record.returnDate}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Alert severity="info">
                    Sélectionnez un format et des champs pour voir la prévisualisation
                </Alert>
            )}
        </Grid>
    </Grid>
);

const StepDeleteContent = ({
    parameters,
    onChange,
    errors,
    selectedCount,
    showConfirmation,
    onToggleConfirmation,
    typedConfirmation,
    onTypedConfirmationChange
}) => (
    <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ATTENTION: Action irréversible
            </Typography>
            <Typography variant="body2">
                Cette action supprimera définitivement {selectedCount} prêt${selectedCount > 1 ? 's' : ''}
                de la base de données. Cette opération ne peut pas être annulée.
            </Typography>
        </Alert>

        <FormControlLabel
            control={
                <Checkbox
                    checked={parameters.confirmation || false}
                    onChange={(e) => onChange('confirmation', e.target.checked)}
                />
            }
            label="Je confirme la suppression définitive de tous les prêts sélectionnés"
        />

        <TextField
            fullWidth
            label="Motif de suppression (optionnel)"
            value={parameters.reason || ''}
            onChange={(e) => onChange('reason', e.target.value)}
            error={!!errors.reason}
            helperText={errors.reason}
            placeholder="Raison de la suppression..."
            sx={{ mt: 2 }}
        />

        {showConfirmation && (
            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                    Confirmation définitive requise
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pour confirmer, tapez exactement: <strong>SUPPRIMER {selectedCount}</strong>
                </Typography>
                <TextField
                    fullWidth
                    value={typedConfirmation}
                    onChange={(e) => onTypedConfirmationChange(e.target.value)}
                    error={!!errors.confirmation}
                    helperText={errors.confirmation || 'Cette étape est obligatoire pour la sécurité'}
                    placeholder="Tapez votre confirmation ici..."
                />
            </Box>
        )}
    </Box>
);

// Utilitaires
function getSteps(actionId) {
    return ACTION_STEPS[actionId] || ['Configuration', 'Confirmation', 'Exécution'];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function generateSampleExportData(fields, selectedCount) {
    const sampleRecords = [];
    for (let i = 0; i < Math.min(selectedCount, 5); i++) {
        const record = {};
        fields.forEach(field => {
            switch (field) {
                case 'id':
                    record[field] = `PRÊT-${String(i + 1).padStart(3, '0')}`;
                    break;
                case 'documentTitle':
                    record[field] = `Document exemple ${i + 1}`;
                    break;
                case 'borrowerName':
                    record[field] = `Utilisateur ${i + 1}`;
                    break;
                case 'loanDate':
                    record[field] = format(new Date(2024, 0, 1 + i), 'dd/MM/yyyy HH:mm', { locale: fr });
                    break;
                case 'returnDate':
                    record[field] = format(new Date(2024, 0, 15 + i), 'dd/MM/yyyy HH:mm', { locale: fr });
                    break;
                case 'status':
                    record[field] = ['Actif', 'En retard', 'Réservé'][i % 3];
                    break;
                default:
                    record[field] = `Valeur ${field} ${i + 1}`;
            }
        });
        sampleRecords.push(record);
    }
    return sampleRecords;
}

function validateParameters(action, parameters) {
    const errors = {};

    if (action.requiresParameters && action.parameterSchema) {
        Object.entries(action.parameterSchema).forEach(([key, schema]) => {
            const value = parameters[key];

            if (schema.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
                errors[key] = `${schema.label} est requis`;
                return;
            }

            if (value) {
                switch (schema.type) {
                    case 'number':
                        if (typeof value !== 'number' || isNaN(value)) {
                            errors[key] = `${schema.label} doit être un nombre`;
                        } else if (schema.min !== undefined && value < schema.min) {
                            errors[key] = `${schema.label} doit être ≥ ${schema.min}`;
                        } else if (schema.max !== undefined && value > schema.max) {
                            errors[key] = `${schema.label} doit être ≤ ${schema.max}`;
                        }
                        break;

                    case 'select':
                        if (!schema.options.find(option => option.value === value)) {
                            errors[key] = `Valeur invalide pour ${schema.label}`;
                        }
                        break;

                    case 'multiselect':
                        if (!Array.isArray(value) || value.length === 0) {
                            errors[key] = `Sélectionnez au moins une option pour ${schema.label}`;
                        }
                        break;

                    case 'checkbox':
                        if (!value) {
                            errors[key] = `Veuillez confirmer pour ${schema.label}`;
                        }
                        break;
                }
            }
        });
    }

    return errors;
}

export default React.memo(BulkActionDialog);