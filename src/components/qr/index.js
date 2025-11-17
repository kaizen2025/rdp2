// src/components/qr/index.js - Exports des composants QR

export { default as QRCodeGenerator } from './QRCodeGenerator';
export { default as QRCodeScanner } from './QRCodeScanner';
export { default as QRCodeManager } from './QRCodeManager';
export { default as QRCodeSystem } from './QRCodeSystem';

// Types et constantes
export const QR_TYPES = {
  COMPUTER: 'computer',
  ACCESSORY: 'accessory',
  LOAN: 'loan',
  BATCH: 'batch'
};

export const QR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOST: 'lost',
  DAMAGED: 'damaged',
  ARCHIVED: 'archived'
};

export const QR_VERSIONS = {
  V1: { version: 1, description: 'Version de base', maxSize: 'Petits espaces' },
  V2: { version: 2, description: 'Version avec métadonnées', maxSize: 'Moyens espaces' },
  V3: { version: 3, description: 'Version complète', maxSize: 'Grands espaces' },
  V4: { version: 4, description: 'Version haute qualité', maxSize: 'Impression' }
};

export const SCAN_ACTIONS = {
  SCAN: 'scan',
  VALIDATE: 'validate',
  CHECKOUT: 'checkout',
  CHECKIN: 'checkin',
  UPDATE: 'update'
};

// Fonctions utilitaires
export const generateValidationHash = (data) => {
  const { validationHash, ...dataToHash } = data;
  const stringData = JSON.stringify(dataToHash);
  let hash = 0;
  for (let i = 0; i < stringData.length; i++) {
    const char = stringData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const calculateDistance = (loc1, loc2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance en mètres
};