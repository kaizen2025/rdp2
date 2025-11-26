/**
 * signatureTypes.js - Types et interfaces pour les signatures électroniques
 */

// Types de base pour les signatures électroniques
export const SIGNATURE_TYPES = {
  SIMPLE: 'simple',
  ADVANCED: 'advanced',
  QUALIFIED: 'qualified',
  BIOMETRIC: 'biometric'
};

// États de validation
export const VALIDATION_STATES = {
  VALID: 'valid',
  INVALID: 'invalid',
  WARNING: 'warning',
  PENDING: 'pending',
  EXPIRED: 'expired',
  REVOKED: 'revoked'
};

// Types d'événements d'audit
export const AUDIT_EVENTS = {
  SIGNATURE_CREATED: 'SIGNATURE_CREATED',
  SIGNATURE_VERIFIED: 'SIGNATURE_VERIFIED',
  SIGNATURE_REJECTED: 'SIGNATURE_REJECTED',
  CERTIFICATE_CREATED: 'CERTIFICATE_CREATED',
  CERTIFICATE_REVOKED: 'CERTIFICATE_REVOKED',
  DOCUMENT_ACCESSED: 'DOCUMENT_ACCESSED',
  DOCUMENT_MODIFIED: 'DOCUMENT_MODIFIED',
  WORKFLOW_STARTED: 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  SECURITY_ALERT: 'SECURITY_ALERT'
};

// Niveaux de sévérité
export const SEVERITY_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Types de documents
export const DOCUMENT_TYPES = {
  LOAN: 'loan',
  RETURN: 'return',
  CONTRACT: 'contract',
  REPORT: 'report',
  CERTIFICATE: 'certificate',
  IDENTITY: 'identity'
};

// Paramètres de signature
export const SIGNATURE_SETTINGS = {
  DEFAULT_STROKE_COLOR: '#000000',
  DEFAULT_STROKE_WIDTH: 2,
  DEFAULT_CANVAS_WIDTH: 500,
  DEFAULT_CANVAS_HEIGHT: 300,
  MIN_STROKE_LENGTH: 3,
  MAX_SIGNATURE_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_FORMATS: ['PNG', 'SVG', 'PDF', 'JSON'],
  QUALITY_THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 70,
    ACCEPTABLE: 50,
    POOR: 30
  }
};

// Rôles dans les workflows
export const SIGNER_ROLES = {
  REQUESTER: 'requester',
  APPROVER: 'approver',
  REVIEWER: 'reviewer',
  WITNESS: 'witness',
  ADMIN: 'admin'
};

// Types de certificats
export const CERTIFICATE_TYPES = {
  USER: 'user',
  ORGANIZATION: 'organization',
  DEVICE: 'device',
  DOCUMENT: 'document'
};

// Algorithmes cryptographiques supportés
export const CRYPTO_ALGORITHMS = {
  RSA: 'RSA-2048',
  ECDSA: 'ECDSA-P256',
  SHA256: 'SHA-256',
  AES256: 'AES-256'
};

// Configuration de l'horodatage
export const TIMESTAMP_CONFIG = {
  ACCURACY: 1000, // millisecondes
  AUTHORITY: 'DocuCortex-TSA',
  VERSION: '1.0'
};

// Interface pour une signature
export class SignatureData {
  constructor({
    id,
    userId,
    documentId,
    documentType,
    timestamp,
    signatureImage,
    biometricData,
    certificateId,
    metadata = {},
    status = 'active'
  }) {
    this.id = id;
    this.userId = userId;
    this.documentId = documentId;
    this.documentType = documentType;
    this.timestamp = timestamp;
    this.signatureImage = signatureImage;
    this.biometricData = biometricData;
    this.certificateId = certificateId;
    this.metadata = metadata;
    this.status = status;
  }
}

// Interface pour un certificat
export class Certificate {
  constructor({
    id,
    subject,
    issuer,
    publicKey,
    issuedAt,
    expiresAt,
    serialNumber,
    signature,
    isActive = true
  }) {
    this.id = id;
    this.subject = subject;
    this.issuer = issuer;
    this.publicKey = publicKey;
    this.issuedAt = issuedAt;
    this.expiresAt = expiresAt;
    this.serialNumber = serialNumber;
    this.signature = signature;
    this.isActive = isActive;
  }
}

// Interface pour un workflow de signature
export class SignatureWorkflow {
  constructor({
    id,
    documentId,
    documentType,
    requiredSigners = [],
    optionalSigners = [],
    status = 'pending',
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.documentId = documentId;
    this.documentType = documentType;
    this.requiredSigners = requiredSigners;
    this.optionalSigners = optionalSigners;
    this.status = status;
    this.createdAt = createdAt;
    this.completedAt = null;
    this.signatures = [];
  }
}

// Interface pour un événement d'audit
export class AuditEvent {
  constructor({
    id,
    type,
    timestamp = new Date().toISOString(),
    userId,
    documentId,
    severity = SEVERITY_LEVELS.INFO,
    description,
    metadata = {}
  }) {
    this.id = id;
    this.type = type;
    this.timestamp = timestamp;
    this.userId = userId;
    this.documentId = documentId;
    this.severity = severity;
    this.description = description;
    this.metadata = metadata;
  }
}

// Interface pour la validation
export class ValidationResult {
  constructor({
    isValid,
    score = 0,
    checks = [],
    issues = [],
    recommendations = []
  }) {
    this.isValid = isValid;
    this.score = score;
    this.checks = checks;
    this.issues = issues;
    this.recommendations = recommendations;
    this.timestamp = new Date().toISOString();
  }
}

// Interface pour les données biométriques
export class BiometricData {
  constructor({
    strokes = [],
    pressure = [],
    velocity = [],
    acceleration = [],
    totalTime = 0,
    strokeCount = 0,
    quality = 0
  }) {
    this.strokes = strokes;
    this.pressure = pressure;
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.totalTime = totalTime;
    this.strokeCount = strokeCount;
    this.quality = quality;
  }
}

// Utilitaires pour les signatures
export const SignatureValidators = {
  // Valider la qualité d'une signature
  validateSignatureQuality(biometricData) {
    const { strokeCount, totalTime, pressure } = biometricData;
    
    let score = 0;
    
    // Critère: nombre de traits
    if (strokeCount >= 3) score += 30;
    else if (strokeCount >= 2) score += 20;
    else if (strokeCount >= 1) score += 10;
    
    // Critère: durée de signature
    if (totalTime >= 1000 && totalTime <= 30000) score += 30;
    else if (totalTime >= 500 && totalTime <= 60000) score += 20;
    
    // Critère: variabilité de pression
    if (pressure && pressure.length > 0) {
      const avgPressure = pressure.reduce((a, b) => a + b, 0) / pressure.length;
      if (avgPressure > 0.2 && avgPressure < 1.0) score += 40;
      else if (avgPressure > 0.1 && avgPressure < 1.0) score += 20;
    }
    
    return Math.min(score, 100);
  },
  
  // Valider un certificat
  validateCertificate(certificate) {
    const now = new Date();
    const issuedAt = new Date(certificate.issuedAt);
    const expiresAt = new Date(certificate.expiresAt);
    
    if (!certificate.isActive) {
      return { isValid: false, reason: 'Certificat révoqué' };
    }
    
    if (now < issuedAt) {
      return { isValid: false, reason: 'Certificat pas encore valide' };
    }
    
    if (now > expiresAt) {
      return { isValid: false, reason: 'Certificat expiré' };
    }
    
    return { isValid: true, reason: 'Certificat valide' };
  },
  
  // Détecter les anomalies de signature
  detectSignatureAnomalies(biometricData) {
    const anomalies = [];
    
    // Signature trop rapide
    if (biometricData.totalTime < 500) {
      anomalies.push({
        type: 'SPEED_ANOMALY',
        severity: 'medium',
        message: 'Signature anormalement rapide'
      });
    }
    
    // Signature trop lente
    if (biometricData.totalTime > 60000) {
      anomalies.push({
        type: 'DURATION_ANOMALY',
        severity: 'low',
        message: 'Signature anormalement longue'
      });
    }
    
    // Trop peu de traits
    if (biometricData.strokeCount < 2) {
      anomalies.push({
        type: 'SIMPLIFICATION_ANOMALY',
        severity: 'high',
        message: 'Signature trop simplifiée'
      });
    }
    
    // Pression anormale
    if (biometricData.pressure && biometricData.pressure.length > 0) {
      const avgPressure = biometricData.pressure.reduce((a, b) => a + b, 0) / biometricData.pressure.length;
      if (avgPressure > 0.9 || avgPressure < 0.1) {
        anomalies.push({
          type: 'PRESSURE_ANOMALY',
          severity: 'medium',
          message: 'Pression anormalement constante'
        });
      }
    }
    
    return anomalies;
  }
};

// Constantes d'export
export default {
  SIGNATURE_TYPES,
  VALIDATION_STATES,
  AUDIT_EVENTS,
  SEVERITY_LEVELS,
  DOCUMENT_TYPES,
  SIGNATURE_SETTINGS,
  SIGNER_ROLES,
  CERTIFICATE_TYPES,
  CRYPTO_ALGORITHMS,
  TIMESTAMP_CONFIG,
  SignatureData,
  Certificate,
  SignatureWorkflow,
  AuditEvent,
  ValidationResult,
  BiometricData,
  SignatureValidators
};