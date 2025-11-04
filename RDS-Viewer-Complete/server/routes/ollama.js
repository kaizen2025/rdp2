const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Configuration Ollama
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.232:11434';

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array()
    });
  }
  next();
};

// Test de connectivité Ollama
router.get('/test', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`, {
      timeout: 5000
    });
    
    res.json({
      status: 'success',
      message: 'Connexion Ollama établie',
      models: response.data.models,
      ollama_version: response.data.version || 'unknown'
    });
  } catch (error) {
    console.error('Erreur test Ollama:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'Impossible de se connecter à Ollama',
      error: error.message,
      suggestions: [
        'Vérifiez que Ollama est démarré',
        `Configurez l'URL Ollama via OLLAMA_HOST (défaut: ${OLLAMA_HOST})`,
        'Installez et démarrer Ollama: https://ollama.ai'
      ]
    });
  }
});

// Obtenir la liste des modèles disponibles
router.get('/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
    res.json({
      status: 'success',
      models: response.data.models.map(model => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at
      }))
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Impossible de récupérer les modèles Ollama',
      error: error.message
    });
  }
});

// Génération de texte
router.post('/generate', [
  body('prompt').isString().isLength({ min: 1, max: 4000 }),
  body('model').optional().isString(),
  body('system').optional().isString(),
  body('context').optional().isArray(),
  body('stream').optional().isBoolean(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { prompt, model = 'llama2', system, context, stream = false } = req.body;
    
    const ollamaPayload = {
      model,
      prompt,
      stream
    };
    
    if (system) ollamaPayload.system = system;
    if (context) ollamaPayload.context = context;

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, ollamaPayload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      data: {
        response: response.data.response,
        model: response.data.model,
        total_duration: response.data.total_duration,
        load_duration: response.data.load_duration,
        prompt_eval_count: response.data.prompt_eval_count,
        prompt_eval_duration: response.data.prompt_eval_duration,
        eval_count: response.data.eval_count,
        eval_duration: response.data.eval_duration
      }
    });
  } catch (error) {
    console.error('Erreur génération Ollama:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération de texte',
      error: error.message
    });
  }
});

// Chat avec contexte
router.post('/chat', [
  body('messages').isArray({ min: 1 }),
  body('model').optional().isString(),
  body('stream').optional().isBoolean(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { messages, model = 'llama2', stream = false } = req.body;
    
    if (stream) {
      // Configuration pour Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const ollamaPayload = {
        model,
        messages,
        stream: true
      };

      try {
        const response = await axios.post(`${OLLAMA_HOST}/api/chat`, ollamaPayload, {
          timeout: 60000,
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              res.write(`data: ${JSON.stringify(data)}\n\n`);
              
              if (data.done) {
                res.write('data: [DONE]\n\n');
                res.end();
              }
            } catch (e) {
              console.error('Erreur parsing chunk:', e);
            }
          }
        });

        response.data.on('end', () => {
          res.end();
        });

        response.data.on('error', (error) => {
          console.error('Erreur stream:', error);
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
        });
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Chat sans streaming (réponse complète)
      const ollamaPayload = {
        model,
        messages,
        stream: false
      };

      const response = await axios.post(`${OLLAMA_HOST}/api/chat`, ollamaPayload, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      res.json({
        status: 'success',
        data: {
          message: response.data.message,
          model: response.data.model,
          total_duration: response.data.total_duration,
          load_duration: response.data.load_duration,
          prompt_eval_count: response.data.prompt_eval_count,
          prompt_eval_duration: response.data.prompt_eval_duration,
          eval_count: response.data.eval_count,
          eval_duration: response.data.eval_duration
        }
      });
    }
  } catch (error) {
    console.error('Erreur chat Ollama:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du chat avec l\'IA',
      error: error.message
    });
  }
});

// Analyse de document DocuCortex
router.post('/analyze-document', [
  body('text').isString().isLength({ min: 1, max: 100000 }),
  body('type').isString().isIn(['pdf', 'docx', 'txt', 'image']),
  body('model').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { text, type, model = 'llama2' } = req.body;
    
    const systemPrompt = `
Tu es DocuCortex IA, un assistant intelligent spécialisé dans l'analyse de documents.
Analyse le document suivant et fournis:
1. Un résumé exécutif
2. Les points clés
3. Les entités importantes (personnes, organisations, lieux)
4. Les sentiments et tonalité
5. Des recommandations d'actions

Type de document: ${type}
    `;
    
    const ollamaPayload = {
      model,
      prompt: systemPrompt + '\n\nDocument à analyser:\n' + text,
      system: 'Tu es DocuCortex IA, un assistant spécialisé dans l\'analyse intelligente de documents.',
      stream: false
    };

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, ollamaPayload, {
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      data: {
        analysis: response.data.response,
        type,
        model: response.data.model,
        processing_time: response.data.total_duration,
        tokens_generated: response.data.eval_count
      }
    });
  } catch (error) {
    console.error('Erreur analyse document:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'analyse du document',
      error: error.message
    });
  }
});

// OCR et analyse d'image
router.post('/analyze-image', [
  body('image').isString(), // Base64 encoded image
  body('type').optional().isString().isIn(['pdf', 'photo', 'scan']),
  body('model').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { image, type = 'photo', model = 'llava' } = req.body;
    
    const prompt = `
Analyse cette image dans le contexte d'un gestionnaire de documents DocuCortex.
Fournis:
1. Description du contenu visuel
2. Texte détecté (OCR) si présent
3. Classification du type d'image
4. Extraction d'informations structurées
5. Recommandations d'indexation

Type d'image: ${type}
    `;
    
    const ollamaPayload = {
      model,
      prompt,
      images: [image], // Image en base64
      stream: false
    };

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, ollamaPayload, {
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      data: {
        analysis: response.data.response,
        model: response.data.model,
        type,
        processing_time: response.data.total_duration
      }
    });
  } catch (error) {
    console.error('Erreur analyse image:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'analyse de l\'image',
      error: error.message
    });
  }
});

// Résumé de document
router.post('/summarize', [
  body('text').isString().isLength({ min: 1, max: 100000 }),
  body('maxLength').optional().isInt({ min: 50, max: 1000 }),
  body('model').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { text, maxLength = 200, model = 'llama2' } = req.body;
    
    const systemPrompt = `
Tu es DocuCortex IA, un assistant spécialisé dans le résumé de documents.
Crée un résumé concis et informatif du texte suivant.
Le résumé ne doit pas dépasser ${maxLength} mots.
Conserve les informations essentielles et la structure principale.
    `;
    
    const ollamaPayload = {
      model,
      prompt: systemPrompt + '\n\nTexte à résumer:\n' + text,
      stream: false
    };

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, ollamaPayload, {
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      data: {
        summary: response.data.response,
        maxLength,
        originalLength: text.length,
        model: response.data.model,
        processing_time: response.data.total_duration
      }
    });
  } catch (error) {
    console.error('Erreur résumé:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du résumé du document',
      error: error.message
    });
  }
});

// Upload et traitement de fichier
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier fourni'
      });
    }

    const file = req.file;
    const fileType = path.extname(file.originalname).toLowerCase();
    
    let extractedText = '';
    let analysis = '';

    // Extraction de texte selon le type de fichier
    switch (fileType) {
      case '.pdf':
        // Utiliser pdf-parse pour extraire le texte du PDF
        const pdf = require('pdf-parse');
        const pdfBuffer = require('fs').readFileSync(file.path);
        const pdfData = await pdf(pdfBuffer);
        extractedText = pdfData.text;
        break;
        
      case '.docx':
        // Utiliser mammoth pour extraire le texte du Word
        const mammoth = require('mammoth');
        const docxBuffer = require('fs').readFileSync(file.path);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        extractedText = docxResult.value;
        break;
        
      case '.txt':
        extractedText = require('fs').readFileSync(file.path, 'utf-8');
        break;
        
      default:
        return res.status(400).json({
          status: 'error',
          message: `Type de fichier non supporté: ${fileType}`
        });
    }

    // Analyse avec Ollama
    const analysisResponse = await axios.post(`http://localhost:${process.env.PORT || 5000}/api/ollama/analyze-document`, {
      text: extractedText,
      type: fileType.replace('.', ''),
      model: 'llama2'
    });

    analysis = analysisResponse.data.data.analysis;

    // Nettoyage du fichier temporaire
    require('fs').unlinkSync(file.path);

    res.json({
      status: 'success',
      data: {
        filename: file.originalname,
        type: fileType,
        text_length: extractedText.length,
        analysis: analysis
      }
    });
  } catch (error) {
    console.error('Erreur upload document:', error.message);
    
    // Nettoyage en cas d'erreur
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du traitement du document',
      error: error.message
    });
  }
});

// Middleware de gestion des erreurs pour les routes Ollama
router.use((err, req, res, next) => {
  console.error('Erreur route Ollama:', err);
  res.status(500).json({
    status: 'error',
    message: 'Erreur du serveur Ollama',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;