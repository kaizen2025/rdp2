// src/components/UserPrintSheet.js - Version améliorée avec design harmonieux

import React, { forwardRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import {
    VpnKey, Email, Business, Computer,
    Security, Phone, SupportAgent, Info
} from '@mui/icons-material';

import './UserPrintSheet.css';

const InfoItem = ({ label, value, icon, isConfidential = false }) => (
    <Box sx={{ mb: 0.75, pageBreakInside: 'avoid' }}>
        <Typography variant="caption" sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: '#666',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '7pt',
            mb: 0.25
        }}>
            {React.cloneElement(icon, { sx: { fontSize: 12, color: isConfidential ? '#e53935' : '#1976d2' } })} {label}
        </Typography>
        <Typography variant="body2" sx={{
            fontWeight: 500,
            fontSize: '9pt',
            fontFamily: isConfidential ? 'Consolas, "Courier New", monospace' : 'inherit',
            color: isConfidential ? '#c62828' : '#222',
            backgroundColor: isConfidential ? '#ffebee' : '#f8f9fa',
            p: '4px 8px',
            borderRadius: '4px',
            border: isConfidential ? '1px solid #ffcdd2' : '1px solid #e9ecef',
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            wordBreak: 'break-all'
        }}>
            {value || 'N/A'}
        </Typography>
    </Box>
);

const UserPrintSheet = forwardRef(({ user }, ref) => {
    if (!user) return null;
    const currentDate = new Date().toLocaleDateString('fr-FR');

    return (
        <Box ref={ref} className="print-sheet" sx={{
            p: 1.5,
            backgroundColor: 'white',
            color: 'black',
            width: '100%',
            height: '148.5mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Paper elevation={0} sx={{
                border: '2px solid #1976d2',
                borderRadius: 2,
                overflow: 'hidden',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header avec gradient */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white'
                }}>
                    <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '14pt', color: 'white' }}>Fiche Utilisateur</Typography>
                        <Typography sx={{ fontSize: '9pt', opacity: 0.9 }}>Groupe Anecoop France</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '12pt', fontWeight: 600 }}>{user.displayName}</Typography>
                        <Chip
                            label={`Identifiant : ${user.username}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '8pt',
                                height: 22,
                                mt: 0.5
                            }}
                        />
                    </Box>
                </Box>

                {/* Contenu */}
                <Box sx={{ p: 1.5, flexGrow: 1 }}>
                    {/* Informations générales */}
                    <Grid container spacing={1}>
                        <Grid item xs={4}><InfoItem label="Service" value={user.department} icon={<Business />} /></Grid>
                        <Grid item xs={4}><InfoItem label="Email" value={user.email} icon={<Email />} /></Grid>
                        <Grid item xs={4}><InfoItem label="Serveur RDS" value={user.server} icon={<Computer />} /></Grid>
                    </Grid>

                    {/* Section confidentielle */}
                    <Divider sx={{ my: 1 }}>
                        <Chip label="Confidentiel" size="small" icon={<Security />} color="error" sx={{ fontWeight: 600 }} />
                    </Divider>

                    <Paper variant="outlined" sx={{
                        p: 1,
                        backgroundColor: '#fff5f5',
                        borderColor: '#ffcdd2',
                        borderRadius: 1.5
                    }}>
                        <Grid container spacing={1}>
                            <Grid item xs={12} sm={6}>
                                <InfoItem label="Mot de passe Windows / RDS / SAGE" value={user.password} icon={<VpnKey />} isConfidential />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <InfoItem label="Mot de passe Office 365" value={user.officePassword} icon={<Email />} isConfidential />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Section support */}
                    <Divider sx={{ my: 1 }}>
                        <Chip label="Support Technique" size="small" icon={<SupportAgent />} color="primary" sx={{ fontWeight: 600 }} />
                    </Divider>

                    <Paper variant="outlined" sx={{
                        p: 1,
                        backgroundColor: '#e3f2fd',
                        borderColor: '#90caf9',
                        borderRadius: 1.5
                    }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    bgcolor: '#1976d2',
                                    borderRadius: '50%',
                                    p: 0.5,
                                    display: 'flex'
                                }}>
                                    <Phone sx={{ color: 'white', fontSize: 16 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '10pt', color: '#1565c0' }}>04 68 68 38 44</Typography>
                                    <Typography sx={{ fontSize: '7pt', color: '#666' }}>Interne: 3855</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    bgcolor: '#1976d2',
                                    borderRadius: '50%',
                                    p: 0.5,
                                    display: 'flex'
                                }}>
                                    <Email sx={{ color: 'white', fontSize: 16 }} />
                                </Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '9pt', color: '#1565c0' }}>support@anecoop-france.com</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* Footer */}
                <Box className="print-footer" sx={{
                    borderTop: '1px solid #e0e0e0',
                    p: 0.75,
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="caption" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: '#c62828',
                        fontWeight: 600,
                        fontSize: '7pt'
                    }}>
                        <Info sx={{ fontSize: 10 }} /> DOCUMENT CONFIDENTIEL
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', fontSize: '7pt' }}>
                        Généré le: {currentDate}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
});

UserPrintSheet.displayName = 'UserPrintSheet';

export default UserPrintSheet;