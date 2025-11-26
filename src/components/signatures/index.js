/**
 * signatures/index.js - Point d'entrée pour tous les composants de signatures électroniques
 * 
 * Ce fichier exporte tous les composants et services liés aux signatures électroniques
 * pour faciliter les imports dans l'application.
 */

// Services
export { default as eSignatureService } from '../services/eSignatureService';

// Composants de base
export { default as DigitalSignaturePad } from './DigitalSignaturePad';
export { default as SignatureManager } from './SignatureManager';

// Composants de workflow et processus
export { default as SignatureWorkflow } from './SignatureWorkflow';
export { default as DocumentSigner } from './DocumentSigner';

// Composants de validation et audit
export { default as SignatureValidation } from './SignatureValidation';
export { default as AuditTrail } from './AuditTrail';
export { default as CertificateViewer } from './CertificateViewer';

// Types et utilitaires
export { default as SignatureTypes } from './utils/signatureTypes';
export { default as SignatureUtils } from './utils/signatureUtils';

// Composants composites
export { default as SignatureInterface } from './SignatureInterface';
export { default as SignatureDashboard } from './SignatureDashboard';
