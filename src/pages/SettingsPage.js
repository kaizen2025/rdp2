// src/pages/SettingsPage.js - VERSION COMPLÈTE AMÉLIORÉE

import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';

import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import DnsIcon from '@mui/icons-material/Dns';
import SecurityIcon from '@mui/icons-material/Security'; // ✅ NOUVEAU - Pour permissions
import SmartToyIcon from '@mui/icons-material/SmartToy'; // ✅ NOUVEAU - Pour GED/IA
import ApiIcon from '@mui/icons-material/Api'; // ✅ NOUVEAU - Pour configuration API IA
import StorageIcon from '@mui/icons-material/Storage'; // ✅ NOUVEAU - Pour serveur AD

// ✅ NOUVEAUX COMPOSANTS - Panneaux de configuration avancés
import UsersPermissionsPanel from '../components/settings/UsersPermissionsPanel';
import GEDSettingsPanel from '../components/settings/GEDSettingsPanel';
import AISettingsPanel from '../components/settings/AISettingsPanel';

function TabPanel({ children, value, index }) {
    return <div hidden={value !== index}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>;
}

const TechnicianDialog = ({ open, onClose, onSave, technician }) => {
    const [formData, setFormData] = useState({ name: '', position: '', email: '', avatar: '', permissions: [], isActive: true });
    useEffect(() => {
        if (technician) setFormData(technician);
        else setFormData({ name: '', position: '', email: '', avatar: '', permissions: [], isActive: true });
    }, [technician, open]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };
    const handlePermsChange = (e) => setFormData(p => ({ ...p, permissions: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }));
    const handleSubmit = () => {
        onSave({ ...formData, id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '_') });
        onClose();
    };
    const availablePermissions = ['admin', 'config', 'loans', 'users', 'servers', 'reports'];
    const permissionTranslations = { admin: 'Administrateur', config: 'Configuration', loans: 'Gestion des prêts', users: 'Gestion des utilisateurs', servers: 'Gestion des serveurs', reports: 'Rapports' };
    const translatePermission = (p) => permissionTranslations[p] || p;
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{technician ? 'Modifier' : 'Ajouter'} un technicien</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}><TextField name="name" label="Nom complet" value={formData.name || ''} onChange={handleChange} fullWidth required /></Grid>
                    <Grid item xs={12}><TextField name="position" label="Poste" value={formData.position || ''} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12}><TextField name="email" label="Email" value={formData.email || ''} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12}><TextField name="avatar" label="Avatar (Initiales)" value={formData.avatar || ''} onChange={handleChange} fullWidth inputProps={{ maxLength: 2 }} /></Grid>
                    <Grid item xs={12}><FormControl fullWidth><InputLabel>Permissions</InputLabel><Select multiple name="permissions" value={formData.permissions || []} onChange={handlePermsChange} renderValue={(selected) => selected.map(translatePermission).join(', ')}>{availablePermissions.map(p => (<MenuItem key={p} value={p}><Checkbox checked={(formData.permissions || []).includes(p)} />{translatePermission(p)}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={12}><FormControlLabel control={<Switch name="isActive" checked={formData.isActive} onChange={handleChange} />} label="Compte Actif" /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit}>Sauvegarder</Button></DialogActions>
        </Dialog>
    );
};


const SettingsPage = ({ open, onClose }) => {
    const { config, handleSaveConfig, showNotification } = useApp();
    const [editedConfig, setEditedConfig] = useState(config);
    const [currentTab, setCurrentTab] = useState(0);

    const isElectron = !!window.electronAPI?.showSaveDialog;

    useEffect(() => {
        setEditedConfig(config);
    }, [config, open]);

    const handleFieldChange = (event) => {
        const { name, value, type, checked } = event.target;
        const keys = name.split('.');
        setEditedConfig(prev => {
            const newConfig = JSON.parse(JSON.stringify(prev));
            let current = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
            return newConfig;
        });
    };

    const handleBrowse = async (fieldName, isFile = true) => {
        if (!isElectron) {
            showNotification('info', 'Cette fonctionnalité est uniquement disponible dans l\'application de bureau.');
            return;
        }
        const result = await window.electronAPI.showSaveDialog({
            properties: [isFile ? 'openFile' : 'openDirectory'],
            filters: isFile ? [{ name: 'Fichiers', extensions: ['xlsx', 'json', 'sqlite'] }] : []
        });
        if (!result.canceled && result.filePath) {
            handleFieldChange({ target: { name: fieldName, value: result.filePath } });
        }
    };

    const handleSave = async () => {
        const success = await handleSaveConfig({ newConfig: editedConfig });
        if (success) {
            showNotification('success', 'Configuration sauvegardée.');
            onClose();
        } else {
            showNotification('error', 'La sauvegarde a échoué.');
        }
    };

    if (!editedConfig) return null;

    return (
        <Dialog fullScreen open={open} onClose={onClose}>
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose}><CloseIcon /></IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6">Configuration</Typography>
                    <Button autoFocus color="inherit" onClick={handleSave} startIcon={<SaveIcon />}>Sauvegarder & Fermer</Button>
                </Toolbar>
            </AppBar>
            <Box sx={{ display: 'flex', height: 'calc(100% - 64px)' }}>
                <Tabs orientation="vertical" variant="scrollable" value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderRight: 1, borderColor: 'divider', minWidth: 180 }}>
                    <Tab icon={<LockIcon />} iconPosition="start" label="Général" />
                    <Tab icon={<StorageIcon />} iconPosition="start" label="Active Directory" />
                    <Tab icon={<DnsIcon />} iconPosition="start" label="Serveurs & Chat" />
                    <Tab icon={<FolderSharedIcon />} iconPosition="start" label="Chemins d'accès" />
                    <Tab icon={<AssignmentIcon />} iconPosition="start" label="Prêts" />
                    <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
                    <Tab icon={<PaletteIcon />} iconPosition="start" label="Interface" />
                    {/* ✅ ONGLETS AVANCÉS */}
                    <Tab icon={<SecurityIcon />} iconPosition="start" label="Permissions & Rôles" />
                    <Tab icon={<SmartToyIcon />} iconPosition="start" label="DocuCortex IA" />
                    <Tab icon={<ApiIcon />} iconPosition="start" label="API IA (HF & OpenRouter)" />
                </Tabs>
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    <TabPanel value={currentTab} index={0}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h5" gutterBottom>Sécurité Application</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField label="Nouveau mot de passe App" type="password" fullWidth helperText="Laissez vide pour ne pas changer" /></Grid>
                            </Grid>
                        </Paper>
                    </TabPanel>
                    <TabPanel value={currentTab} index={1}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StorageIcon /> Configuration Active Directory
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Configurez l'accès au serveur Active Directory. Laissez vide pour utiliser le serveur par défaut (PC sur le domaine).
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Serveur AD"
                                        name="ad_server"
                                        value={editedConfig.ad_server || ''}
                                        onChange={handleFieldChange}
                                        fullWidth
                                        placeholder="Ex: SRV-AD-1"
                                        helperText="Nom du serveur AD (obligatoire si PC hors domaine avec VPN, laissez vide si PC sur le domaine)"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Domaine AD"
                                        name="domain"
                                        value={editedConfig.domain || ''}
                                        onChange={handleFieldChange}
                                        fullWidth
                                        helperText="Ex: anecoopfr.local"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Utilisateur AD (Admin)"
                                        name="username"
                                        value={editedConfig.username || ''}
                                        onChange={handleFieldChange}
                                        fullWidth
                                        helperText="Compte avec droits admin AD"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Mot de passe AD"
                                        name="password"
                                        type="password"
                                        value={editedConfig.password || ''}
                                        onChange={handleFieldChange}
                                        fullWidth
                                        helperText="Mot de passe du compte admin"
                                    />
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.lighter', borderRadius: 1 }}>
                                <Typography variant="subtitle2" color="info.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    💡 Mode d'utilisation :
                                </Typography>
                                <Typography variant="body2" color="info.dark" component="div">
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        <li><strong>PC sur le domaine :</strong> Laissez "Serveur AD" vide - les commandes AD fonctionneront en mode natif</li>
                                        <li><strong>PC hors domaine avec VPN :</strong> Renseignez le nom du serveur AD (ex: SRV-AD-1) - l'authentification distante sera utilisée</li>
                                    </ul>
                                </Typography>
                            </Box>
                        </Paper>
                    </TabPanel>
                    <TabPanel value={currentTab} index={2}>
                        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                            <Typography variant="h5" gutterBottom>Serveurs RDS</Typography>
                            <TextField label="Liste des serveurs (un par ligne)" name="rds_servers" value={editedConfig.rds_servers?.join('\n') || ''} onChange={e => setEditedConfig(p => ({ ...p, rds_servers: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))} multiline rows={8} fullWidth />
                        </Paper>
                    </TabPanel>
                    <TabPanel value={currentTab} index={3}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h5" gutterBottom>Chemins d'Accès</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><TextField label="Fichier Excel Utilisateurs" name="excelFilePath" value={editedConfig.excelFilePath || ''} onChange={handleFieldChange} fullWidth InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => handleBrowse('excelFilePath')} disabled={!isElectron}><FolderOpenIcon /></IconButton></InputAdornment>) }} /></Grid>
                                <Grid item xs={12}><TextField label="Base de données SQLite" name="databasePath" value={editedConfig.databasePath || ''} onChange={handleFieldChange} fullWidth InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => handleBrowse('databasePath')} disabled={!isElectron}><FolderOpenIcon /></IconButton></InputAdornment>) }} /></Grid>
                            </Grid>
                        </Paper>
                    </TabPanel>
                    <TabPanel value={currentTab} index={4}><Paper sx={{ p: 3 }}><Typography variant="h5" gutterBottom>Paramètres des Prêts</Typography><Grid container spacing={3}><Grid item xs={12} sm={6}><TextField label="Durée maximum (jours)" name="loans.maxLoanDays" type="number" value={editedConfig.loans?.maxLoanDays || 90} onChange={handleFieldChange} fullWidth /></Grid><Grid item xs={12} sm={6}><TextField label="Nombre max de prolongations" name="loans.maxExtensions" type="number" value={editedConfig.loans?.maxExtensions || 3} onChange={handleFieldChange} fullWidth /></Grid><Grid item xs={12}><FormControlLabel control={<Switch name="loans.autoNotifications" checked={editedConfig.loans?.autoNotifications ?? true} onChange={handleFieldChange} />} label="Activer les notifications automatiques" /></Grid></Grid></Paper></TabPanel>
                    <TabPanel value={currentTab} index={5}><Paper sx={{ p: 3 }}><Typography variant="h5" gutterBottom>Notifications</Typography><Grid container spacing={3}><Grid item xs={12}><FormControlLabel control={<Switch name="notifications.enabled" checked={editedConfig.notifications?.enabled ?? true} onChange={handleFieldChange} />} label="Activer les notifications système globales" /></Grid><Grid item xs={12}><FormControlLabel control={<Switch name="notifications.loanReminders" checked={editedConfig.notifications?.loanReminders ?? true} onChange={handleFieldChange} />} label="Activer les rappels avant échéance des prêts" /></Grid><Grid item xs={12}><FormControlLabel control={<Switch name="notifications.overdueLoanAlerts" checked={editedConfig.notifications?.overdueLoanAlerts ?? true} onChange={handleFieldChange} />} label="Activer les alertes pour les prêts en retard" /></Grid></Grid></Paper></TabPanel>
                    <TabPanel value={currentTab} index={6}><Paper sx={{ p: 3 }}><Typography variant="h5" gutterBottom>Interface</Typography><Grid container spacing={3}><Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Thème</InputLabel><Select name="ui.theme" value={editedConfig.ui?.theme || 'light'} label="Thème" onChange={handleFieldChange}><MenuItem value="light">Clair</MenuItem><MenuItem value="dark">Sombre</MenuItem></Select></FormControl></Grid><Grid item xs={12}><FormControlLabel control={<Switch name="ui.compactView" checked={editedConfig.ui?.compactView ?? false} onChange={handleFieldChange} />} label="Activer le mode compact" /></Grid><Grid item xs={12}><FormControlLabel control={<Switch name="ui.autoRefresh" checked={editedConfig.ui?.autoRefresh ?? true} onChange={handleFieldChange} />} label="Activer le rafraîchissement automatique" /></Grid></Grid></Paper></TabPanel>

                    {/* ✅ ONGLET AVANCÉ - Permissions & Rôles */}
                    <TabPanel value={currentTab} index={7}>
                        <UsersPermissionsPanel />
                    </TabPanel>

                    {/* ✅ ONGLET AVANCÉ - DocuCortex IA / GED */}
                    <TabPanel value={currentTab} index={8}>
                        <GEDSettingsPanel />
                    </TabPanel>

                    {/* ✅ ONGLET 9: Configuration API IA (Hugging Face & OpenRouter) */}
                    <TabPanel value={currentTab} index={9}>
                        <AISettingsPanel />
                    </TabPanel>
                </Box>
            </Box>
        </Dialog>
    );
};

export default SettingsPage;