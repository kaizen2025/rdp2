/**
 * SignatureDashboard.js - Tableau de bord des signatures électroniques
 * 
 * Ce composant fournit une vue d'ensemble complète des signatures électroniques
 * avec des statistiques, des graphiques et une interface de gestion.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Document as DocumentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

import SignatureInterface from './SignatureInterface';
import SignatureManager from './SignatureManager';
import SignatureValidation from './SignatureValidation';
import AuditTrail from './AuditTrail';
import CertificateViewer from './CertificateViewer';
import eSignatureService from '../../services/eSignatureService';

const SignatureDashboard = ({
  userId,
  onSignatureClick,
  onCertificateClick,
  compact = false,
  showActions = true
}) => {
  // États du dashboard
  const [dashboardData, setDashboardData] = useState({
    statistics: {
      totalSignatures: 0,
      totalCertificates: 0,
      activeCertificates: 0,
      pendingValidations: 0,
      invalidSignatures: 0,
      expiringCertificates: 0
    },
    recentSignatures: [],
    recentCertificates: [],
    topUsers: [],
    trends: {
      signaturesByMonth: {},
      certificatesByStatus: {},
      validationStats: {}
    },
    alerts: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Charger les données du dashboard
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Récupérer toutes les données
      const signatures = eSignatureService.getSignatures();
      const certificates = eSignatureService.getCertificates();
      
      // Calculer les statistiques
      const statistics = {
        totalSignatures: signatures.length,
        totalCertificates: certificates.length,
        activeCertificates: certificates.filter(c => c.isActive && new Date(c.expiresAt) > new Date()).length,
        pendingValidations: 0, // À implémenter selon la logique métier
        invalidSignatures: signatures.filter(s => s.isValid === false).length,
        expiringCertificates: certificates.filter(c => {
          if (!c.isActive) return false;
          const expiresAt = new Date(c.expiresAt);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry < 30 && daysUntilExpiry > 0;
        }).length
      };

      // Signatures récentes (dernières 10)
      const recentSignatures = signatures
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      // Certificats récents
      const recentCertificates = certificates
        .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
        .slice(0, 5);

      // Top utilisateurs par nombre de signatures
      const userSignatureCounts = {};
      signatures.forEach(sig => {
        userSignatureCounts[sig.userId] = (userSignatureCounts[sig.userId] || 0) + 1;
      });
      
      const topUsers = Object.entries(userSignatureCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }));

      // Tendances par mois (simulation)
      const currentDate = new Date();
      const signaturesByMonth = {};
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = month.toISOString().substring(0, 7);
        signaturesByMonth[monthKey] = signatures.filter(sig => 
          sig.timestamp.startsWith(monthKey)
        ).length;
      }

      // Statuts des certificats
      const certificatesByStatus = {
        active: certificates.filter(c => c.isActive && new Date(c.expiresAt) > new Date()).length,
        expired: certificates.filter(c => new Date(c.expiresAt) <= new Date()).length,
        revoked: certificates.filter(c => !c.isActive).length
      };

      // Statistiques de validation
      const validationStats = {
        valid: signatures.filter(s => s.isValid === true).length,
        invalid: signatures.filter(s => s.isValid === false).length,
        unknown: signatures.filter(s => s.isValid === undefined).length
      };

      // Alertes
      const alerts = [];
      if (statistics.expiringCertificates > 0) {
        alerts.push({
          type: 'warning',
          title: 'Certificats expirant bientôt',
          message: `${statistics.expiringCertificates} certificat(s) expirent dans les 30 jours`,
          count: statistics.expiringCertificates
        });
      }
      if (statistics.invalidSignatures > 0) {
        alerts.push({
          type: 'error',
          title: 'Signatures invalides détectées',
          message: `${statistics.invalidSignatures} signature(s) invalide(s) nécessitent une attention`,
          count: statistics.invalidSignatures
        });
      }

      setDashboardData({
        statistics,
        recentSignatures,
        recentCertificates,
        topUsers,
        trends: {
          signaturesByMonth,
          certificatesByStatus,
          validationStats
        },
        alerts
      });

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId, selectedPeriod]);

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir la couleur d'alerte
  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  // Rendu des cartes de statistiques
  const renderStatsCards = () => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <FingerprintIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {dashboardData.statistics.totalSignatures}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Signatures totales
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SecurityIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {dashboardData.statistics.activeCertificates}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Certificats actifs
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssessmentIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {dashboardData.statistics.invalidSignatures}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Signatures invalides
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {dashboardData.statistics.expiringCertificates}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Certificats expirant
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Rendu des alertes
  const renderAlerts = () => {
    if (dashboardData.alerts.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        {dashboardData.alerts.map((alert, index) => (
          <Alert 
            key={index}
            severity={getAlertColor(alert.type)}
            sx={{ mb: 1 }}
            action={
              <Button color="inherit" size="small">
                Voir
              </Button>
            }
          >
            <Typography variant="body2">
              <strong>{alert.title}:</strong> {alert.message}
            </Typography>
          </Alert>
        ))}
      </Box>
    );
  };

  // Rendu des signatures récentes
  const renderRecentSignatures = () => (
    <Card>
      <CardHeader
        title="Signatures récentes"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              onClick={() => loadDashboardData()}
              disabled={isLoading}
            >
              <RefreshIcon />
            </Button>
            <Button 
              size="small"
              onClick={() => setShowSignatureDialog(true)}
            >
              <AddIcon />
            </Button>
          </Box>
        }
      />
      <CardContent>
        {isLoading ? (
          <LinearProgress />
        ) : dashboardData.recentSignatures.length === 0 ? (
          <Typography color="textSecondary" textAlign="center">
            Aucune signature récente
          </Typography>
        ) : (
          <List>
            {dashboardData.recentSignatures.map((signature, index) => (
              <React.Fragment key={signature.id}>
                <ListItem 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSignature(signature);
                    setActiveTab(2);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <FingerprintIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {signature.documentType} {signature.documentId}
                        </Typography>
                        <Chip 
                          label={signature.isValid ? 'Valide' : 'Invalide'} 
                          color={signature.isValid ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Par: {signature.userId}
                        </Typography>
                        <Typography variant="caption">
                          {formatDate(signature.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemIcon>
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </ListItemIcon>
                </ListItem>
                {index < dashboardData.recentSignatures.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  // Rendu des tendances
  const renderTrends = () => (
    <Card>
      <CardHeader title="Tendances mensuelles" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.entries(dashboardData.trends.signaturesByMonth).map(([month, count]) => (
            <Box key={month} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 80 }}>
                {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(count / Math.max(...Object.values(dashboardData.trends.signaturesByMonth))) * 100}
                />
              </Box>
              <Typography variant="body2" sx={{ minWidth: 30 }}>
                {count}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  // Rendu des utilisateurs actifs
  const renderTopUsers = () => (
    <Card>
      <CardHeader title="Utilisateurs actifs" />
      <CardContent>
        <List>
          {dashboardData.topUsers.map((user, index) => (
            <ListItem key={user.userId}>
              <ListItemAvatar>
                <Avatar>{user.userId.charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.userId}
                secondary={`${user.count} signature(s)`}
              />
              <Chip 
                label={`#${index + 1}`} 
                color={index === 0 ? 'primary' : 'default'}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  if (compact) {
    return (
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tableau de bord des signatures</Typography>
            <Button size="small" onClick={loadDashboardData} disabled={isLoading}>
              <RefreshIcon />
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Signatures</Typography>
              <Typography variant="h5">{dashboardData.statistics.totalSignatures}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Certificats</Typography>
              <Typography variant="h5">{dashboardData.statistics.activeCertificates}</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h4">
                Tableau de bord des signatures
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Vue d'ensemble des signatures électroniques
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Période</InputLabel>
              <Select
                value={selectedPeriod}
                label="Période"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="week">Semaine</MenuItem>
                <MenuItem value="month">Mois</MenuItem>
                <MenuItem value="quarter">Trimestre</MenuItem>
                <MenuItem value="year">Année</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              disabled={isLoading}
            >
              Actualiser
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Alertes */}
      {renderAlerts()}

      {/* Cartes de statistiques */}
      {renderStatsCards()}

      {/* Grille principale */}
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          {renderRecentSignatures()}
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {renderTrends()}
            {renderTopUsers()}
          </Box>
        </Grid>
      </Grid>

      {/* Détails par onglets */}
      <Paper sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
            <Button
              variant={activeTab === 0 ? 'contained' : 'text'}
              onClick={() => setActiveTab(0)}
            >
              Vue d'ensemble
            </Button>
            <Button
              variant={activeTab === 1 ? 'contained' : 'text'}
              onClick={() => setActiveTab(1)}
            >
              Gestion
            </Button>
            <Button
              variant={activeTab === 2 ? 'contained' : 'text'}
              onClick={() => setActiveTab(2)}
              disabled={!selectedSignature}
            >
              Validation
            </Button>
            <Button
              variant={activeTab === 3 ? 'contained' : 'text'}
              onClick={() => setActiveTab(3)}
            >
              Audit
            </Button>
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          {activeTab === 0 && (
            <Typography>Vue d'ensemble du système de signatures</Typography>
          )}
          
          {activeTab === 1 && (
            <SignatureManager
              userId={userId}
              isVisible={true}
              showCreateCertificate={true}
              showFilters={true}
            />
          )}
          
          {activeTab === 2 && selectedSignature && (
            <SignatureValidation
              signatureId={selectedSignature.id}
              signatureData={selectedSignature}
              onValidationComplete={(result) => {
                console.log('Validation terminée:', result);
              }}
              autoValidate={true}
              showDetailedReport={true}
            />
          )}
          
          {activeTab === 3 && (
            <AuditTrail
              userId={userId}
              showFilters={true}
              showRealTime={false}
            />
          )}
        </Box>
      </Paper>

      {/* Dialog de signature rapide */}
      <Dialog 
        open={showSignatureDialog} 
        onClose={() => setShowSignatureDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Nouvelle signature électronique
        </DialogTitle>
        <DialogContent>
          <SignatureInterface
            userId={userId}
            documentType="loan"
            documentId={`temp_${Date.now()}`}
            documentTitle="Document temporaire"
            onSignatureComplete={(signature) => {
              setShowSignatureDialog(false);
              loadDashboardData(); // Actualiser le dashboard
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SignatureDashboard;