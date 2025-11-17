/**
 * SignatureValidation.js - Validation automatique des signatures électroniques
 * 
 * Fonctionnalités:
 * - Validation cryptographique automatique
 * - Vérification d'intégrité des certificats
 * - Contrôle d'horodatage légal
 * - Détection de fraude
 * - Rapport de validation détaillé
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Verified as VerifiedIcon,
  Gavel as GavelIcon,
  Timeline as TimelineIcon,
  Fingerprint as FingerprintIcon,
  Certificate as CertificateIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

import eSignatureService from '../../services/eSignatureService';

const SignatureValidation = ({
  signatureId,
  signatureData,
  onValidationComplete,
  autoValidate = true,
  showDetailedReport = true
}) => {
  // États de validation
  const [validationStatus, setValidationStatus] = useState('validating');
  const [validationResults, setValidationResults] = useState(null);
  const [checks, setChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('overview');
  const [fraudAnalysis, setFraudAnalysis] = useState(null);

  // Types de vérifications
  const VALIDATION_CHECKS = [
    {
      id: 'signature_integrity',
      name: 'Intégrité de la signature',
      description: 'Vérification de la signature cryptographique',
      critical: true
    },
    {
      id: 'certificate_validity',
      name: 'Validité du certificat',
      description: 'Vérification de l\'expiration et du statut du certificat',
      critical: true
    },
    {
      id: 'timestamp_accuracy',
      name: 'Précision de l\'horodatage',
      description: 'Vérification de l\'horodatage légal',
      critical: true
    },
    {
      id: 'document_integrity',
      name: 'Intégrité du document',
      description: 'Vérification que le document n\'a pas été modifié',
      critical: true
    },
    {
      id: 'signer_identity',
      name: 'Identité du signataire',
      description: 'Vérification de l\'identité du signataire',
      critical: false
    },
    {
      id: 'biometric_analysis',
      name: 'Analyse biométrique',
      description: 'Analyse des caractéristiques de la signature',
      critical: false
    },
    {
      id: 'fraud_detection',
      name: 'Détection de fraude',
      description: 'Recherche d\'anomalies suspectes',
      critical: true
    }
  ];

  // Lancer la validation automatique
  useEffect(() => {
    if (autoValidate && signatureData) {
      performValidation();
    }
  }, [autoValidate, signatureData]);

  // Effectuer toutes les validations
  const performValidation = async () => {
    if (!signatureData || !signatureId) return;

    setIsLoading(true);
    setValidationStatus('validating');

    const validationResults = {
      signatureId,
      validationDate: new Date().toISOString(),
      overallStatus: 'pending',
      checks: [],
      score: 0,
      issues: [],
      recommendations: []
    };

    try {
      // Exécuter chaque vérification
      for (const check of VALIDATION_CHECKS) {
        const result = await performCheck(check, signatureData);
        validationResults.checks.push(result);
        
        // Mettre à jour le score
        if (result.status === 'passed') {
          validationResults.score += result.weight || 10;
        } else if (result.status === 'failed') {
          validationResults.score -= result.penalty || 5;
          validationResults.issues.push(result.message);
        }

        // Mettre à jour l'état du composant
        setChecks(prev => {
          const existing = prev.find(c => c.id === check.id);
          if (existing) {
            return prev.map(c => c.id === check.id ? result : c);
          } else {
            return [...prev, result];
          }
        });
      }

      // Analyser les risques de fraude
      const fraudResult = await performFraudAnalysis(signatureData);
      validationResults.fraudAnalysis = fraudResult;
      setFraudAnalysis(fraudResult);

      // Déterminer le statut global
      const passedChecks = validationResults.checks.filter(c => c.status === 'passed').length;
      const totalChecks = validationResults.checks.length;
      const criticalChecks = validationResults.checks.filter(c => c.critical);
      const passedCritical = criticalChecks.filter(c => c.status === 'passed').length;

      if (passedCritical === criticalChecks.length && passedChecks >= totalChecks * 0.8) {
        validationResults.overallStatus = 'valid';
      } else if (passedCritical < criticalChecks.length) {
        validationResults.overallStatus = 'invalid';
      } else {
        validationResults.overallStatus = 'warning';
      }

      // Ajouter des recommandations
      validationResults.recommendations = generateRecommendations(validationResults);

      setValidationResults(validationResults);
      setValidationStatus(validationResults.overallStatus);

      // Notifier le parent
      if (onValidationComplete) {
        onValidationComplete(validationResults);
      }

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      setValidationStatus('error');
      validationResults.overallStatus = 'error';
      validationResults.issues.push('Erreur lors de la validation: ' + error.message);
      setValidationResults(validationResults);
    } finally {
      setIsLoading(false);
    }
  };

  // Effectuer une vérification spécifique
  const performCheck = async (check, signatureData) => {
    const result = {
      id: check.id,
      name: check.name,
      description: check.description,
      critical: check.critical,
      status: 'pending',
      timestamp: new Date().toISOString(),
      weight: 10,
      penalty: 5,
      details: {},
      message: ''
    };

    try {
      switch (check.id) {
        case 'signature_integrity':
          return await validateSignatureIntegrity(result, signatureData);
        
        case 'certificate_validity':
          return await validateCertificate(result, signatureData);
        
        case 'timestamp_accuracy':
          return await validateTimestamp(result, signatureData);
        
        case 'document_integrity':
          return await validateDocumentIntegrity(result, signatureData);
        
        case 'signer_identity':
          return await validateSignerIdentity(result, signatureData);
        
        case 'biometric_analysis':
          return await validateBiometricData(result, signatureData);
        
        case 'fraud_detection':
          return await validateFraudIndicators(result, signatureData);
        
        default:
          result.status = 'skipped';
          result.message = 'Vérification non implémentée';
          return result;
      }
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Validation de l'intégrité de la signature
  const validateSignatureIntegrity = async (result, signatureData) => {
    try {
      const signature = eSignatureService.getSignatureById(signatureData.id);
      if (!signature) {
        result.status = 'failed';
        result.message = 'Signature non trouvée dans la base de données';
        return result;
      }

      // Vérifier la signature via le service
      const isValid = await eSignatureService.verifySignature(signature, signature.dataHash);
      
      result.status = isValid ? 'passed' : 'failed';
      result.message = isValid ? 
        'Signature cryptographiquement valide' : 
        'Signature cryptographiquement invalide';
      result.details = {
        algorithm: signature.algorithm,
        hash: signature.dataHash.substring(0, 16) + '...',
        verified: isValid
      };

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur de validation: ${error.message}`;
      return result;
    }
  };

  // Validation du certificat
  const validateCertificate = async (result, signatureData) => {
    try {
      const signature = eSignatureService.getSignatureById(signatureData.id);
      const certificate = eSignatureService.findCertificateByUserId(signature.userId);
      
      if (!certificate) {
        result.status = 'failed';
        result.message = 'Certificat non trouvé';
        return result;
      }

      const validation = await eSignatureService.validateCertificate(certificate.id);
      
      result.status = validation.isValid ? 'passed' : 'failed';
      result.message = validation.reason;
      result.details = {
        certificateId: certificate.id.substring(0, 8) + '...',
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        isActive: certificate.isActive,
        isValid: validation.isValid
      };

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Validation de l'horodatage
  const validateTimestamp = async (result, signatureData) => {
    try {
      const signature = eSignatureService.getSignatureById(signatureData.id);
      
      if (!signature.timestampData) {
        result.status = 'failed';
        result.message = 'Horodatage manquant';
        return result;
      }

      const isValidTimestamp = await eSignatureService.verifyTimestamp(signature.timestampData);
      
      result.status = isValidTimestamp ? 'passed' : 'warning';
      result.message = isValidTimestamp ? 
        'Horodatage valide et légal' : 
        'Horodatage présent mais non vérifié';
      result.details = {
        timestamp: signature.timestamp,
        timezone: signature.timestampData.timezone,
        authority: signature.timestampData.authority,
        verified: isValidTimestamp
      };

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Validation de l'intégrité du document
  const validateDocumentIntegrity = async (result, signatureData) => {
    try {
      // Simuler la vérification d'intégrité du document
      const documentHash = signatureData.metadata?.documentHash;
      const expectedHash = signatureData.signature?.dataHash;
      
      const isIntegrityValid = documentHash === expectedHash;
      
      result.status = isIntegrityValid ? 'passed' : 'warning';
      result.message = isIntegrityValid ? 
        'Intégrité du document vérifiée' : 
        'Impossible de vérifier l\'intégrité du document';
      result.details = {
        documentHash: documentHash?.substring(0, 16) + '...' || 'Non disponible',
        signatureHash: expectedHash?.substring(0, 16) + '...' || 'Non disponible',
        match: isIntegrityValid
      };

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Validation de l'identité du signataire
  const validateSignerIdentity = async (result, signatureData) => {
    try {
      const signature = eSignatureService.getSignatureById(signatureData.id);
      const certificate = eSignatureService.findCertificateByUserId(signature.userId);
      
      if (!certificate) {
        result.status = 'failed';
        result.message = 'Impossible de vérifier l\'identité';
        return result;
      }

      const identityVerified = certificate.subject.userName && certificate.subject.email;
      
      result.status = identityVerified ? 'passed' : 'warning';
      result.message = identityVerified ? 
        'Identité du signataire vérifiée' : 
        'Informations d\'identité incomplètes';
      result.details = {
        userName: certificate.subject.userName,
        email: certificate.subject.email,
        organization: certificate.subject.organization,
        verified: identityVerified
      };

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Validation des données biométriques
  const validateBiometricData = async (result, signatureData) => {
    try {
      const biometricData = signatureData.metadata?.biometricData;
      
      if (!biometricData) {
        result.status = 'skipped';
        result.message = 'Aucune donnée biométrique disponible';
        return result;
      }

      // Analyser la qualité de la signature
      const quality = biometricData.quality || 0;
      const strokeCount = biometricData.strokeCount || 0;
      const totalTime = biometricData.totalTime || 0;
      
      // Critères d'une signature valide
      const hasGoodQuality = quality >= 70;
      const hasMultipleStrokes = strokeCount >= 2;
      const hasReasonableDuration = totalTime >= 1000 && totalTime <= 30000;
      
      const isBiometricValid = hasGoodQuality && hasMultipleStrokes && hasReasonableDuration;
      
      result.status = isBiometricValid ? 'passed' : 'warning';
      result.message = isBiometricValid ? 
        'Données biométriques valides' : 
        'Données biométriques suspectes';
      result.details = {
        quality: `${quality}%`,
        strokeCount,
        totalTime: `${Math.round(totalTime / 1000)}s`,
        hasGoodQuality,
        hasMultipleStrokes,
        hasReasonableDuration
      };

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Validation des indicateurs de fraude
  const validateFraudIndicators = async (result, signatureData) => {
    try {
      const fraudIndicators = await performFraudAnalysis(signatureData);
      
      const hasFraudRisk = fraudIndicators.riskLevel !== 'none';
      
      result.status = hasFraudRisk ? 'warning' : 'passed';
      result.message = hasFraudRisk ? 
        `Risque de fraude détecté: ${fraudIndicators.riskLevel}` : 
        'Aucun indicateur de fraude détecté';
      result.details = fraudIndicators;

      return result;
    } catch (error) {
      result.status = 'failed';
      result.message = `Erreur: ${error.message}`;
      return result;
    }
  };

  // Analyse de fraude
  const performFraudAnalysis = async (signatureData) => {
    const analysis = {
      riskLevel: 'none',
      indicators: [],
      score: 0,
      recommendations: []
    };

    try {
      const biometricData = signatureData.metadata?.biometricData;
      
      // Analyser les patterns suspects
      if (biometricData) {
        // Signature trop rapide (possiblement copiée)
        if (biometricData.totalTime < 500) {
          analysis.indicators.push({
            type: 'speed_anomaly',
            severity: 'medium',
            message: 'Signature anormalement rapide',
            description: 'La signature a été créée en moins de 0.5 seconde'
          });
          analysis.score += 20;
        }

        // Signature trop lente (signe de recopie)
        if (biometricData.totalTime > 60000) {
          analysis.indicators.push({
            type: 'duration_anomaly',
            severity: 'low',
            message: 'Signature anormalement longue',
            description: 'La signature a pris plus d\'une minute'
          });
          analysis.score += 10;
        }

        // Trop peu de traits (signature simplifiée)
        if (biometricData.strokeCount < 2) {
          analysis.indicators.push({
            type: 'stroke_simplification',
            severity: 'high',
            message: 'Signature trop simplifiée',
            description: 'Très peu de traits détectés dans la signature'
          });
          analysis.score += 30;
        }

        // Variabilité de pression anormale
        if (biometricData.pressure && biometricData.pressure.length > 0) {
          const avgPressure = biometricData.pressure.reduce((a, b) => a + b, 0) / biometricData.pressure.length;
          if (avgPressure > 0.9 || avgPressure < 0.1) {
            analysis.indicators.push({
              type: 'pressure_anomaly',
              severity: 'medium',
              message: 'Pression anormalement constante',
              description: 'La pression du trait est trop uniforme'
            });
            analysis.score += 15;
          }
        }
      }

      // Analyser l'horodatage
      const signatureTime = new Date(signatureData.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now - signatureTime);
      
      // Signature datée du futur (signe de manipulation)
      if (signatureTime > now) {
        analysis.indicators.push({
          type: 'future_timestamp',
          severity: 'high',
          message: 'Horodatage dans le futur',
          description: 'La signature est datée dans le futur'
        });
        analysis.score += 40;
      }

      // Signature très ancienne sans explication
      if (timeDiff > 365 * 24 * 60 * 60 * 1000) { // Plus d'un an
        analysis.indicators.push({
          type: 'old_signature',
          severity: 'low',
          message: 'Signature très ancienne',
          description: 'La signature date de plus d\'un an'
        });
        analysis.score += 5;
      }

      // Déterminer le niveau de risque
      if (analysis.score >= 50) {
        analysis.riskLevel = 'high';
      } else if (analysis.score >= 20) {
        analysis.riskLevel = 'medium';
      } else if (analysis.score >= 5) {
        analysis.riskLevel = 'low';
      }

      // Générer des recommandations
      if (analysis.indicators.length > 0) {
        analysis.recommendations.push('Vérifier manuellement la signature');
        if (analysis.score >= 30) {
          analysis.recommendations.push('Demander une nouvelle signature');
          analysis.recommendations.push('Vérifier l\'identité du signataire');
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'analyse de fraude:', error);
      analysis.indicators.push({
        type: 'analysis_error',
        severity: 'low',
        message: 'Erreur d\'analyse',
        description: error.message
      });
    }

    return analysis;
  };

  // Générer des recommandations
  const generateRecommendations = (results) => {
    const recommendations = [];

    if (results.overallStatus === 'invalid') {
      recommendations.push('Signature invalide - Ne pas accepter le document');
    } else if (results.overallStatus === 'warning') {
      recommendations.push('Vérification manuelle recommandée');
    }

    if (results.fraudAnalysis?.riskLevel === 'high') {
      recommendations.push('Analyse de fraude élevée - Vérification approfondie requise');
    }

    const failedChecks = results.checks.filter(c => c.status === 'failed');
    if (failedChecks.length > 0) {
      recommendations.push('Vérifier les certificats et l\'horodatage');
    }

    if (results.score < 70) {
      recommendations.push('Qualité de signature faible - Nouvelle signature recommandée');
    }

    return recommendations;
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return <CheckCircleIcon color="success" />;
      case 'invalid': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'validating': return <CircularProgress size={20} />;
      default: return <SecurityIcon color="disabled" />;
    }
  };

  // Obtenir la couleur de statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'success';
      case 'invalid': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  // Rendu de l'état de validation
  const renderValidationStatus = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      {getStatusIcon(validationStatus)}
      <Typography variant="h6">
        {validationStatus === 'valid' && 'Signature valide'}
        {validationStatus === 'invalid' && 'Signature invalide'}
        {validationStatus === 'warning' && 'Avertissements détectés'}
        {validationStatus === 'validating' && 'Validation en cours...'}
        {validationStatus === 'error' && 'Erreur de validation'}
      </Typography>
      {validationResults && (
        <Chip 
          label={`Score: ${validationResults.score}/100`}
          color={validationResults.score >= 70 ? 'success' : validationResults.score >= 50 ? 'warning' : 'error'}
          size="small"
        />
      )}
    </Box>
  );

  if (!signatureData) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">
          Aucune signature à valider
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Statut de validation */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {renderValidationStatus()}
        
        {validationResults && (
          <>
            <Alert severity={getStatusColor(validationResults.overallStatus)} sx={{ mb: 2 }}>
              <Typography variant="body2">
                {validationResults.overallStatus === 'valid' && 'La signature est cryptographiquement valide et légalement contraignante.'}
                {validationResults.overallStatus === 'warning' && 'La signature présente des anomalies qui nécessitent une vérification manuelle.'}
                {validationResults.overallStatus === 'invalid' && 'La signature est invalide et ne doit pas être acceptée.'}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={performValidation}
                disabled={isLoading}
              >
                Revalider
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AssessmentIcon />}
                onClick={() => setExpandedSection(
                  expandedSection === 'overview' ? '' : 'overview'
                )}
              >
                Détails
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Liste des vérifications */}
      <Paper sx={{ mb: 2 }}>
        <CardHeader
          title="Vérifications de sécurité"
          subheader={`${checks.filter(c => c.status === 'passed').length}/${checks.length} vérifications passées`}
          avatar={<SecurityIcon />}
        />
        <CardContent>
          <List>
            {checks.map(check => (
              <ListItem key={check.id}>
                <ListItemIcon>
                  {check.status === 'passed' && <CheckCircleIcon color="success" />}
                  {check.status === 'failed' && <ErrorIcon color="error" />}
                  {check.status === 'warning' && <WarningIcon color="warning" />}
                  {check.status === 'skipped' && <SecurityIcon color="disabled" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{check.name}</Typography>
                      {check.critical && (
                        <Chip label="Critique" size="small" color="error" />
                      )}
                    </Box>
                  }
                  secondary={check.message}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Paper>

      {/* Détails étendus */}
      {showDetailedReport && expandedSection && validationResults && (
        <Paper sx={{ mb: 2 }}>
          <CardHeader
            title="Rapport détaillé"
            action={
              <IconButton onClick={() => setExpandedSection('')}>
                <ExpandMoreIcon />
              </IconButton>
            }
          />
          <Collapse in={expandedSection === 'overview'}>
            <CardContent>
              <Grid container spacing={2}>
                {validationResults.checks.map(check => (
                  <Grid item xs={12} md={6} key={check.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {check.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {check.description}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">
                          <strong>Statut:</strong> {check.message}
                        </Typography>
                        {check.details && Object.keys(check.details).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Détails:
                            </Typography>
                            <pre style={{ 
                              fontSize: '0.75rem', 
                              background: '#f5f5f5', 
                              padding: '8px', 
                              borderRadius: '4px',
                              overflow: 'auto'
                            }}>
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Analyse de fraude */}
              {fraudAnalysis && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Analyse de fraude
                  </Typography>
                  <Alert 
                    severity={
                      fraudAnalysis.riskLevel === 'high' ? 'error' :
                      fraudAnalysis.riskLevel === 'medium' ? 'warning' :
                      fraudAnalysis.riskLevel === 'low' ? 'info' : 'success'
                    }
                  >
                    <Typography variant="body2">
                      <strong>Niveau de risque:</strong> {fraudAnalysis.riskLevel.toUpperCase()}
                      {fraudAnalysis.score > 0 && ` (Score: ${fraudAnalysis.score})`}
                    </Typography>
                  </Alert>

                  {fraudAnalysis.indicators.length > 0 && (
                    <List dense>
                      {fraudAnalysis.indicators.map((indicator, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ShieldIcon color={indicator.severity === 'high' ? 'error' : 'warning'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={indicator.message}
                            secondary={indicator.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}

              {/* Recommandations */}
              {validationResults.recommendations.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Recommandations
                  </Typography>
                  <List>
                    {validationResults.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <GavelIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Collapse>
        </Paper>
      )}
    </Box>
  );
};

export default SignatureValidation;