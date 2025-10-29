// src/components/PrintPreviewDialog.js

import React, { useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// Icônes
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopy from '@mui/icons-material/ContentCopy';

// Bibliothèques de génération
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Composant interne pour le design de la fiche ---
// Ce composant recrée le design de votre "jolie" fiche.
const UserSheet = React.forwardRef(({ user }, ref) => {
    if (!user) return null;

    const [showWindowsPassword, setShowWindowsPassword] = useState(false);
    const [showOfficePassword, setShowOfficePassword] = useState(false);
    const [copiedWindows, setCopiedWindows] = useState(false);
    const [copiedOffice, setCopiedOffice] = useState(false);

    const handleCopyPassword = async (password, setCopied) => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    };

    const Section = ({ title, icon, children }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            {icon}
            <Typography variant="h6" component="h3" sx={{ ml: 1, fontWeight: 'bold' }}>{title}</Typography>
        </Box>
    );

    const InfoField = ({ label, value }) => (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase' }}>{label}</Typography>
            <Typography variant="body1" sx={{ borderBottom: '1px solid #eee', pb: 0.5 }}>{value || '-'}</Typography>
        </Box>
    );

    const ConfidentialField = ({ label, value, isVisible, onToggleVisibility, onCopy, copied }) => (
         <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="error.dark" sx={{ display: 'block', textTransform: 'uppercase', mb: 0.5 }}>{label}</Typography>
            <Box sx={{
                border: '2px dashed #d32f2f',
                p: 1,
                borderRadius: 1,
                backgroundColor: '#ffebee',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <Typography variant="body1" sx={{
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    flex: 1,
                    minWidth: 0
                }}>
                    {value ? (isVisible ? value : '••••••••') : 'Non défini'}
                </Typography>
                {value && (
                    <>
                        <Tooltip title={isVisible ? 'Masquer' : 'Afficher'}>
                            <IconButton
                                size="small"
                                onClick={onToggleVisibility}
                                sx={{ p: 0.5 }}
                            >
                                {isVisible ?
                                    <VisibilityOff sx={{ fontSize: '18px' }} /> :
                                    <Visibility sx={{ fontSize: '18px' }} />
                                }
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={copied ? 'Copié!' : 'Copier'}>
                            <IconButton
                                size="small"
                                onClick={onCopy}
                                sx={{ p: 0.5 }}
                                color={copied ? 'success' : 'default'}
                            >
                                <ContentCopy sx={{ fontSize: '16px' }} />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Box>
        </Box>
    );

    return (
        <Box ref={ref} sx={{ p: 3, backgroundColor: '#f9f9f9', color: '#333', fontFamily: 'Arial, sans-serif' }}>
            <Paper elevation={0} sx={{ border: '1px solid #ddd' }}>
                {/* En-tête */}
                <Box sx={{ p: 2, backgroundColor: '#1976d2', color: 'white', textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>FICHE D'INFORMATION UTILISATEUR</Typography>
                    <Typography variant="subtitle1">Groupe Anecoop France</Typography>
                </Box>

                <Grid container spacing={3} sx={{ p: 3 }}>
                    {/* Colonne de gauche */}
                    <Grid item xs={12} md={6}>
                        <Section title="Identité & Profil" icon={<PersonIcon color="primary" />} />
                        <InfoField label="Nom Complet" value={user.displayName} />
                        <InfoField label="Identifiant Windows" value={user.username} />
                        <InfoField label="Service / Département" value={user.department} />
                    </Grid>

                    {/* Colonne de droite */}
                    <Grid item xs={12} md={6}>
                        <Section title="Accès & Contact" icon={<ContactMailIcon color="primary" />} />
                        <InfoField label="Email Professionnel" value={user.email} />
                        <InfoField label="Serveur RDS" value={user.server} />
                        <InfoField label="Domaine" value="ANECOOPFR.LOCAL" />
                    </Grid>
                </Grid>

                <Divider sx={{ mx: 3 }} />

                {/* Section Confidentielle */}
                <Box sx={{ p: 3, backgroundColor: '#fff5f5', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
                    <Section title="Informations Confidentielles" icon={<VpnKeyIcon color="error" />} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <ConfidentialField
                                label="Mot de passe Windows"
                                value={user.password}
                                isVisible={showWindowsPassword}
                                onToggleVisibility={() => setShowWindowsPassword(!showWindowsPassword)}
                                onCopy={() => handleCopyPassword(user.password, setCopiedWindows)}
                                copied={copiedWindows}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <ConfidentialField
                                label="Mot de passe Office 365"
                                value={user.officePassword}
                                isVisible={showOfficePassword}
                                onToggleVisibility={() => setShowOfficePassword(!showOfficePassword)}
                                onCopy={() => handleCopyPassword(user.officePassword, setCopiedOffice)}
                                copied={copiedOffice}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Section Support */}
                <Box sx={{ p: 3, backgroundColor: '#e3f2fd' }}>
                     <Section title="Support Technique" icon={<SupportAgentIcon color="primary" />} />
                     <Typography sx={{ mb: 2 }}>Pour toute demande d'assistance technique :</Typography>
                     <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>04 68 68 38 44</Typography>
                        <Typography variant="body1">Interne : poste 3855</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>support@anecoop-france.com</Typography>
                     </Paper>
                </Box>

                {/* Pied de page */}
                <Box sx={{ p: 2, backgroundColor: '#f0f0f0', textAlign: 'center', borderTop: '1px solid #ddd' }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d32f2f', fontWeight: 'bold' }}>
                        <WarningAmberIcon sx={{ mr: 1, fontSize: '1rem' }} /> DOCUMENT CONFIDENTIEL - NE PAS DIVULGUER
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Généré le : {new Date().toLocaleString('fr-FR')}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
});


// --- Composant principal du dialogue ---
const PrintPreviewDialog = ({ open, onClose, user }) => {
    const printContentRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Fonction centrale pour générer le document (PDF ou Impression)
    const generateDocument = async (outputType = 'save') => {
        if (!printContentRef.current || isGenerating) return;

        setIsGenerating(true);

        try {
            const canvas = await html2canvas(printContentRef.current, {
                scale: 2, // Une échelle de 2 est un bon compromis qualité/poids
                useCORS: true,
                logging: false,
            });

            // MODIFICATION 1 : Générer une image en JPEG avec une qualité de 0.92 (92%)
            // C'est la modification clé pour réduire la taille du fichier.
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            
            // MODIFICATION 2 : Le format est maintenant fixé à 'a4'
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasAspectRatio = canvas.height / canvas.width;
            const finalHeight = pdfWidth * canvasAspectRatio;

            // MODIFICATION 3 : Indiquer à jsPDF que l'image est un JPEG
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, finalHeight);

            if (outputType === 'print') {
                pdf.autoPrint();
                const blobUrl = pdf.output('bloburl');
                const printWindow = window.open(blobUrl, '_blank');
                if (!printWindow) {
                    alert("Veuillez autoriser les pop-ups pour imprimer ce document.");
                }
            } else {
                pdf.save(`Fiche_Utilisateur_${user.username}.pdf`);
            }

        } catch (error) {
            console.error("Erreur lors de la génération du document:", error);
            alert("Une erreur est survenue lors de la génération du document.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Aperçu avant impression / enregistrement</DialogTitle>
            <DialogContent sx={{ position: 'relative', backgroundColor: '#e0e0e0' }}>
                {isGenerating && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Génération du document...</Typography>
                    </Box>
                )}
                <UserSheet ref={printContentRef} user={user} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Annuler</Button>
                <Button 
                    variant="outlined" 
                    startIcon={<PrintIcon />} 
                    onClick={() => generateDocument('print')} 
                    disabled={isGenerating}
                    sx={{ ml: 1 }}
                >
                    Imprimer
                </Button>
                <Button 
                    variant="contained" 
                    startIcon={<PictureAsPdfIcon />} 
                    onClick={() => generateDocument('save')} 
                    disabled={isGenerating}
                    sx={{ ml: 1 }}
                >
                    Enregistrer en PDF
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PrintPreviewDialog;