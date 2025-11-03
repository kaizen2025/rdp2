// server.js - Serveur backend DocuCortex IA

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

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
});

module.exports = app;