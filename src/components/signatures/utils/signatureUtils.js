/**
 * signatureUtils.js - Utilitaires pour les signatures électroniques
 */

import CryptoJS from 'crypto-js';

/**
 * Classe utilitaire pour les signatures électroniques
 */
class SignatureUtils {
  
  /**
   * Génère un ID unique pour une signature
   */
  static generateSignatureId(prefix = 'sig') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Génère un fingerprint pour un certificat
   */
  static generateCertificateFingerprint(certificateData) {
    const dataString = JSON.stringify(certificateData);
    return CryptoJS.SHA256(dataString).toString().toUpperCase();
  }

  /**
   * Génère un hash pour les données de signature
   */
  static generateSignatureHash(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.SHA256(dataString).toString();
  }

  /**
   * Valide le format d'une signature image
   */
  static validateSignatureImage(imageData) {
    if (!imageData) {
      return { isValid: false, reason: 'Aucune image de signature fournie' };
    }

    // Vérifier si c'est un data URL valide
    if (!imageData.startsWith('data:image/')) {
      return { isValid: false, reason: 'Format d\'image invalide' };
    }

    // Vérifier la taille (estimation)
    const sizeInBytes = (imageData.length * 3) / 4;
    const maxSize = 1024 * 1024; // 1MB

    if (sizeInBytes > maxSize) {
      return { isValid: false, reason: 'Image trop volumineuse' };
    }

    return { isValid: true, reason: 'Image valide' };
  }

  /**
   * Analyse la qualité d'une signature basée sur les données biométriques
   */
  static analyzeSignatureQuality(biometricData) {
    const {
      strokeCount = 0,
      totalTime = 0,
      pressure = [],
      velocity = [],
      acceleration = []
    } = biometricData;

    let quality = 0;
    const factors = [];

    // Factor 1: Nombre de traits
    if (strokeCount >= 5) {
      quality += 25;
      factors.push('Nombre de traits excellent');
    } else if (strokeCount >= 3) {
      quality += 20;
      factors.push('Nombre de traits bon');
    } else if (strokeCount >= 2) {
      quality += 15;
      factors.push('Nombre de traits acceptable');
    } else if (strokeCount >= 1) {
      quality += 5;
      factors.push('Signature simplifiée');
    } else {
      factors.push('Signature très simplifiée');
    }

    // Factor 2: Durée de signature
    if (totalTime >= 2000 && totalTime <= 15000) {
      quality += 25;
      factors.push('Durée de signature naturelle');
    } else if (totalTime >= 1000 && totalTime <= 30000) {
      quality += 20;
      factors.push('Durée de signature acceptable');
    } else if (totalTime >= 500) {
      quality += 10;
      factors.push('Durée de signature rapide');
    } else {
      factors.push('Durée de signature très rapide');
    }

    // Factor 3: Variabilité de la pression
    if (pressure.length > 0) {
      const avgPressure = pressure.reduce((a, b) => a + b, 0) / pressure.length;
      const pressureVariance = pressure.reduce((acc, p) => acc + Math.pow(p - avgPressure, 2), 0) / pressure.length;
      
      if (pressureVariance > 0.1 && avgPressure > 0.2 && avgPressure < 1.0) {
        quality += 25;
        factors.push('Pression variable et naturelle');
      } else if (pressureVariance > 0.05) {
        quality += 15;
        factors.push('Pression légèrement variable');
      } else {
        factors.push('Pression trop constante');
      }
    }

    // Factor 4: Vitesse et accélération
    if (velocity.length > 0) {
      const avgVelocity = velocity.reduce((a, b) => a + b, 0) / velocity.length;
      if (avgVelocity > 0.5 && avgVelocity < 5.0) {
        quality += 15;
        factors.push('Vitesse de signature naturelle');
      } else {
        factors.push('Vitesse de signature anormale');
      }
    }

    // Factor 5: Complexité globale
    const totalPoints = biometricData.strokes ? 
      biometricData.strokes.reduce((sum, stroke) => sum + (stroke.points ? stroke.points.length : 0), 0) : 0;
    
    if (totalPoints >= 20) {
      quality += 10;
      factors.push('Signature complexe');
    } else if (totalPoints >= 10) {
      quality += 5;
      factors.push('Signature modérément complexe');
    }

    // Limiter le score à 100
    quality = Math.min(quality, 100);

    // Déterminer le niveau de qualité
    let qualityLevel = 'poor';
    if (quality >= 90) qualityLevel = 'excellent';
    else if (quality >= 70) qualityLevel = 'good';
    else if (quality >= 50) qualityLevel = 'acceptable';

    return {
      quality,
      qualityLevel,
      factors,
      recommendation: this.getQualityRecommendation(qualityLevel)
    };
  }

  /**
   * Recommandations basées sur la qualité
   */
  static getQualityRecommendation(qualityLevel) {
    const recommendations = {
      excellent: 'Signature de très haute qualité, excellente pour usage légal.',
      good: 'Signature de bonne qualité, adaptée pour la plupart des usages légaux.',
      acceptable: 'Signature acceptable mais pourrait être améliorée pour plus de sécurité.',
      poor: 'Signature de faible qualité. Il est recommandé de recommencer la signature.'
    };

    return recommendations[qualityLevel] || 'Qualité inconnue';
  }

  /**
   * Détecte les anomalies dans une signature
   */
  static detectSignatureAnomalies(biometricData) {
    const anomalies = [];

    // Anomalie de vitesse
    if (biometricData.totalTime < 300) {
      anomalies.push({
        type: 'SPEED_ANOMALY',
        severity: 'high',
        message: 'Signature anormalement rapide (< 300ms)',
        description: 'Cela peut indiquer une signature copiée ou automatique'
      });
    }

    // Anomalie de durée
    if (biometricData.totalTime > 120000) {
      anomalies.push({
        type: 'DURATION_ANOMALY',
        severity: 'medium',
        message: 'Signature anormalement longue (> 2min)',
        description: 'Cela peut indiquer des hésitations ou une recopie'
      });
    }

    // Anomalie de simplification
    if (biometricData.strokeCount === 1) {
      anomalies.push({
        type: 'SIMPLIFICATION_ANOMALY',
        severity: 'medium',
        message: 'Signature trop simplifiée (1 seul trait)',
        description: 'Les signatures naturelles contiennent généralement plusieurs traits'
      });
    }

    // Anomalie de pression
    if (biometricData.pressure && biometricData.pressure.length > 0) {
      const avgPressure = biometricData.pressure.reduce((a, b) => a + b, 0) / biometricData.pressure.length;
      const pressureVariance = biometricData.pressure.reduce((acc, p) => acc + Math.pow(p - avgPressure, 2), 0) / biometricData.pressure.length;

      if (pressureVariance < 0.01) {
        anomalies.push({
          type: 'PRESSURE_ANOMALY',
          severity: 'low',
          message: 'Pression anormalement constante',
          description: 'Cela peut indiquer une signature digitale plutôt que naturelle'
        });
      }

      if (avgPressure > 0.95) {
        anomalies.push({
          type: 'PRESSURE_ANOMALY',
          severity: 'low',
          message: 'Pression trop élevée',
          description: 'Pression anormalement forte tout au long de la signature'
        });
      }
    }

    // Anomalie de accélération
    if (biometricData.acceleration && biometricData.acceleration.length > 0) {
      const extremeAccelerations = biometricData.acceleration.filter(acc => Math.abs(acc) > 10);
      if (extremeAccelerations.length > biometricData.acceleration.length * 0.3) {
        anomalies.push({
          type: 'ACCELERATION_ANOMALY',
          severity: 'low',
          message: 'Accélérations extrêmes détectées',
          description: 'Mouvements très erratiques dans la signature'
        });
      }
    }

    return anomalies;
  }

  /**
   * Convertit les données de signature en format exportable
   */
  static exportSignatureData(signature, options = {}) {
    const {
      includeBiometric = true,
      includeMetadata = true,
      format = 'json'
    } = options;

    const exportData = {
      id: signature.id,
      userId: signature.userId,
      documentId: signature.documentId,
      documentType: signature.documentType,
      timestamp: signature.timestamp,
      signatureImage: signature.signatureImage,
      certificateId: signature.certificateId
    };

    if (includeBiometric && signature.biometricData) {
      exportData.biometricData = this.analyzeSignatureQuality(signature.biometricData);
    }

    if (includeMetadata && signature.metadata) {
      exportData.metadata = signature.metadata;
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  /**
   * Convertit en format CSV
   */
  static convertToCSV(data) {
    const headers = ['ID', 'Utilisateur', 'Document', 'Type', 'Horodatage', 'Qualité'];
    const row = [
      data.id,
      data.userId,
      data.documentId,
      data.documentType,
      data.timestamp,
      data.biometricData?.quality || 'N/A'
    ];

    return [headers, row].map(r => r.join(',')).join('\n');
  }

  /**
   * Génère un QR code pour le partage de certificat
   */
  static generateCertificateQRData(certificate) {
    const qrData = {
      type: 'certificate',
      id: certificate.id,
      subject: certificate.subject.userName,
      issuer: certificate.issuer.name,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      fingerprint: certificate.fingerprint
    };

    return JSON.stringify(qrData);
  }

  /**
   * Valide les paramètres de configuration de signature
   */
  static validateSignatureSettings(settings) {
    const errors = [];

    // Valider la couleur
    if (settings.color && !/^#[0-9A-F]{6}$/i.test(settings.color)) {
      errors.push('Format de couleur invalide (utilisez le format #RRGGBB)');
    }

    // Valider l'épaisseur du trait
    if (settings.strokeWidth && (settings.strokeWidth < 0.5 || settings.strokeWidth > 10)) {
      errors.push('Épaisseur du trait doit être entre 0.5 et 10 pixels');
    }

    // Valider les dimensions du canvas
    if (settings.width && (settings.width < 200 || settings.width > 2000)) {
      errors.push('Largeur du canvas doit être entre 200 et 2000 pixels');
    }

    if (settings.height && (settings.height < 100 || settings.height > 1000)) {
      errors.push('Hauteur du canvas doit être entre 100 et 1000 pixels');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcule les statistiques d'utilisation des signatures
   */
  static calculateSignatureStatistics(signatures) {
    const stats = {
      total: signatures.length,
      byDocumentType: {},
      byUser: {},
      byMonth: {},
      averageQuality: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        acceptable: 0,
        poor: 0
      }
    };

    if (signatures.length === 0) return stats;

    let totalQuality = 0;

    signatures.forEach(sig => {
      // Par type de document
      stats.byDocumentType[sig.documentType] = (stats.byDocumentType[sig.documentType] || 0) + 1;

      // Par utilisateur
      stats.byUser[sig.userId] = (stats.byUser[sig.userId] || 0) + 1;

      // Par mois
      const month = new Date(sig.timestamp).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

      // Qualité
      if (sig.biometricData) {
        const quality = this.analyzeSignatureQuality(sig.biometricData).quality;
        totalQuality += quality;

        if (quality >= 90) stats.qualityDistribution.excellent++;
        else if (quality >= 70) stats.qualityDistribution.good++;
        else if (quality >= 50) stats.qualityDistribution.acceptable++;
        else stats.qualityDistribution.poor++;
      }
    });

    stats.averageQuality = totalQuality / signatures.length;

    return stats;
  }

  /**
   * Formate les métadonnées pour l'affichage
   */
  static formatMetadata(metadata) {
    const formatted = {};

    Object.keys(metadata).forEach(key => {
      const value = metadata[key];
      
      if (value instanceof Date) {
        formatted[key] = value.toLocaleString('fr-FR');
      } else if (typeof value === 'number') {
        formatted[key] = value.toLocaleString('fr-FR');
      } else if (typeof value === 'object' && value !== null) {
        formatted[key] = JSON.stringify(value, null, 2);
      } else {
        formatted[key] = String(value);
      }
    });

    return formatted;
  }

  /**
   * Crée un résumé textuel d'une signature
   */
  static createSignatureSummary(signature) {
    const date = new Date(signature.timestamp).toLocaleDateString('fr-FR');
    const time = new Date(signature.timestamp).toLocaleTimeString('fr-FR');
    
    let summary = `Signature de ${signature.userId} sur ${signature.documentType} ${signature.documentId}`;
    summary += ` le ${date} à ${time}`;
    
    if (signature.biometricData) {
      const quality = this.analyzeSignatureQuality(signature.biometricData);
      summary += ` (qualité: ${quality.quality}%, ${quality.qualityLevel})`;
    }

    return summary;
  }
}

export default SignatureUtils;