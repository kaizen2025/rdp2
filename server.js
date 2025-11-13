// server.js - Serveur backend DocuCortex IA

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const rdsMonitoringService = require('./backend/services/rdsMonitoringService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Routes API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DocuCortex IA API - Serveur opérationnel',
    version: '3.0.31',
    timestamp: new Date().toISOString()
  });
});

// Route pour l'analyse de documents (simulation IA)
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Aucun texte fourni pour l\'analyse'
      });
    }

    // Simulation d'analyse IA
    const analysis = {
      summary: "Analyse automatique du document effectuée avec succès.",
      keywords: ["gestion", "intelligence", "artificielle", "workflow", "analyse"],
      sentiment: text.includes('bon') || text.includes('excellent') ? 'positif' : 
                text.includes('mauvais') || text.includes('problème') ? 'négatif' : 'neutre',
      category: text.includes('technique') ? 'document_technique' : 'document_gestion',
      confidence: Math.random() * 0.3 + 0.7, // Entre 0.7 et 1.0
      suggestions: [
        "Vérifier la cohérence des informations",
        "Ajouter des métadonnées appropriées",
        "Organiser le contenu en sections claires"
      ],
      wordCount: text.split(' ').length,
      paragraphCount: text.split('\n').filter(p => p.trim()).length,
      estimatedReadTime: Math.ceil(text.split(' ').length / 200) + ' min'
    };

    res.json({
      success: true,
      analysis: analysis,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse du document',
      details: error.message
    });
  }
});

// Route pour sauvegarder des documents
app.post('/api/documents', (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        error: 'Titre et contenu requis'
      });
    }

    const document = {
      id: Date.now(),
      title: title,
      content: content,
      createdAt: new Date().toISOString(),
      wordCount: content.split(' ').length
    };

    // Sauvegarde temporaire en mémoire
    const documentsFile = path.join(dataDir, 'documents.json');
    let documents = [];
    
    if (fs.existsSync(documentsFile)) {
      try {
        documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
      } catch (e) {
        console.warn('Erreur lecture documents, nouveau fichier créé');
      }
    }

    documents.push(document);
    fs.writeFileSync(documentsFile, JSON.stringify(documents, null, 2));

    res.json({
      success: true,
      document: document,
      message: 'Document sauvegardé avec succès'
    });

  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    res.status(500).json({
      error: 'Erreur lors de la sauvegarde',
      details: error.message
    });
  }
});

// Route pour récupérer les documents
app.get('/api/documents', (req, res) => {
  try {
    const documentsFile = path.join(dataDir, 'documents.json');
    
    if (!fs.existsSync(documentsFile)) {
      return res.json({
        success: true,
        documents: []
      });
    }

    const documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
    res.json({
      success: true,
      documents: documents
    });

  } catch (error) {
    console.error('Erreur lecture documents:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des documents',
      details: error.message
    });
  }
});

// ========================================
// 🖥️ ROUTES RDS MONITORING
// ========================================

// Obtenir stats d'un serveur spécifique
app.get('/api/rds/monitoring/:serverName', async (req, res) => {
  try {
    const { serverName } = req.params;
    const config = require('./config/config.json');

    const result = await rdsMonitoringService.getServerStats(
      serverName,
      config.domain,
      config.credential_target
    );

    if (result.success) {
      res.json({ success: true, ...result });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir toutes les stats en cache
app.get('/api/rds/monitoring/stats/all', (req, res) => {
  try {
    const stats = rdsMonitoringService.getAllCachedStats();
    res.json({ success: true, servers: stats, count: stats.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir les alertes actives
app.get('/api/rds/monitoring/alerts/active', (req, res) => {
  try {
    const alerts = rdsMonitoringService.getActiveAlerts();
    res.json({ success: true, alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir configuration monitoring
app.get('/api/rds/monitoring/config', (req, res) => {
  try {
    const config = rdsMonitoringService.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mettre à jour les seuils d'alerte
app.post('/api/rds/monitoring/config/thresholds', (req, res) => {
  try {
    const { diskSpaceGB, cpuPercent, memoryPercent } = req.body;

    const thresholds = {};
    if (diskSpaceGB !== undefined) thresholds.diskSpaceGB = parseFloat(diskSpaceGB);
    if (cpuPercent !== undefined) thresholds.cpuPercent = parseFloat(cpuPercent);
    if (memoryPercent !== undefined) thresholds.memoryPercent = parseFloat(memoryPercent);

    rdsMonitoringService.updateThresholds(thresholds);

    res.json({
      success: true,
      message: 'Seuils mis à jour',
      thresholds: rdsMonitoringService.getConfig().thresholds
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Démarrer/Arrêter monitoring
app.post('/api/rds/monitoring/control/:action', (req, res) => {
  try {
    const { action } = req.params;

    if (action === 'start') {
      rdsMonitoringService.start();
      res.json({ success: true, message: 'Monitoring démarré', isRunning: true });
    } else if (action === 'stop') {
      rdsMonitoringService.stop();
      res.json({ success: true, message: 'Monitoring arrêté', isRunning: false });
    } else {
      res.status(400).json({ success: false, error: 'Action invalide (start/stop)' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Forcer un check immédiat
app.post('/api/rds/monitoring/check', async (req, res) => {
  try {
    await rdsMonitoringService.checkAllServers();
    const stats = rdsMonitoringService.getAllCachedStats();
    res.json({
      success: true,
      message: 'Check effectué',
      servers: stats,
      count: stats.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir les fichiers statiques React en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 DocuCortex IA - Serveur API démarré sur le port ${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📝 Analyse: http://localhost:${PORT}/api/analyze`);
  console.log(`💾 Documents: http://localhost:${PORT}/api/documents`);
  console.log(`🖥️  RDS Monitoring: http://localhost:${PORT}/api/rds/monitoring/stats/all`);

  // Démarrer le monitoring RDS automatique
  console.log('🔄 Démarrage du monitoring RDS...');
  rdsMonitoringService.start();

  // Logger les alertes dans la console
  rdsMonitoringService.on('alert', (alert) => {
    console.log(`\n🚨 ALERTE RDS - ${alert.serverName}`);
    alert.alerts.forEach(a => {
      const emoji = a.severity === 'critical' ? '🔴' : '⚠️';
      console.log(`  ${emoji} ${a.type.toUpperCase()}: ${a.message}`);
    });
  });

  rdsMonitoringService.on('monitoring_cycle_complete', (summary) => {
    console.log(`✅ Monitoring cycle: ${summary.successCount}/${summary.serversChecked} serveurs OK`);
    if (summary.alerts.length > 0) {
      console.log(`   🚨 ${summary.alerts.length} alerte(s) active(s)`);
    }
  });
});

module.exports = app;