// src/components/UserPrintSheet.js - Version finale avec libellés SAGE

import React, { forwardRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import {
    Person, VpnKey, Email, Business, Computer,
    Security, Phone, SupportAgent, Info
} from '@mui/icons-material';

import './UserPrintSheet.css';

const InfoItem = ({ label, value, icon, isConfidential = false }) => (
    <Box sx={{ mb: 1, pageBreakInside: 'avoid' }}>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#555', fontWeight: 600, textTransform: 'uppercase', fontSize: '8pt' }}>
            {React.cloneElement(icon, { sx: { fontSize: 14 } })} {label}
        </Typography>
        <Typography variant="body2" sx={{
            fontWeight: 500,
            fontSize: '10pt',
            fontFamily: isConfidential ? 'Consolas, "Courier New", monospace' : 'inherit',
            color: isConfidential ? '#d32f2f' : '#111',
            backgroundColor: '#f9f9f9',
            p: '4px 8px',
            borderRadius: 1,
            border: '1px solid #eee',
            minHeight: '28px',
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
        <Box ref={ref} className="print-sheet" sx={{ p: 2, backgroundColor: 'white', color: 'black', width: '100%', height: '148.5mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={0} sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ background: '#f5f7fa', p: 1.5, borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '16pt' }}>Fiche Utilisateur</Typography>
                        <Typography sx={{ color: '#444', fontSize: '10pt' }}>Groupe Anecoop France</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '12pt', fontWeight: 600 }}>{user.displayName}</Typography>
                        {/* ✅ AMÉLIORATION: Identifiant sans arobase, plus visible */}
                        <Typography sx={{ color: '#333', fontSize: '10pt', fontWeight: 600, backgroundColor: '#f0f0f0', px: 1, py: 0.5, borderRadius: 1, mt: 0.5 }}>
                            Identifiant : {user.username}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ p: 1.5, flexGrow: 1 }}>
                    <Grid container spacing={1.5}>
                        <Grid item xs={4}><InfoItem label="Service" value={user.department} icon={<Business />} /></Grid>
                        <Grid item xs={4}><InfoItem label="Email" value={user.email} icon={<Email />} /></Grid>
                        <Grid item xs={4}><InfoItem label="Serveur RDS" value={user.server} icon={<Computer />} /></Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }}><Chip label="Confidentiel" size="small" icon={<Security />} color="error" /></Divider>

                    <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: '#fff8f8', borderColor: '#fdd' }}>
                        <Grid container spacing={1.5}>
                            {/* ✅ AMÉLIORATION: Libellés mis à jour */}
                            <Grid item xs={12} sm={6}><InfoItem label="Mot de passe Windows / RDS / SAGE" value={user.password} icon={<VpnKey />} isConfidential /></Grid>
                            <Grid item xs={12} sm={6}><InfoItem label="Mot de passe Office 365" value={user.officePassword} icon={<Email />} isConfidential /></Grid>
                        </Grid>
                    </Paper>

                    <Divider sx={{ my: 1.5 }}><Chip label="Support Technique" size="small" icon={<SupportAgent />} color="primary" /></Divider>

                    <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: '#f3f6fc', borderColor: '#dbe3f6' }}>
                        <Grid container spacing={1.5} alignItems="center">
                            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Phone sx={{ color: 'primary.main' }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '10pt' }}>04 68 68 38 44</Typography>
                                    <Typography sx={{ fontSize: '8pt', color: '#555' }}>Interne: 3855</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email sx={{ color: 'primary.main' }} />
                                <Typography sx={{ fontWeight: 600, fontSize: '10pt' }}>support@anecoop-france.com</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                <Box className="print-footer" sx={{ borderTop: '1px solid #ccc', p: 1, backgroundColor: '#f5f7fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#d32f2f', fontWeight: 600, fontSize: '7pt' }}>
                        <Info sx={{ fontSize: 12 }} /> DOCUMENT CONFIDENTIEL
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '7pt' }}>
                        Généré le: {currentDate}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
});

UserPrintSheet.displayName = 'UserPrintSheet';

export default UserPrintSheet;