/**
 * Routes API pour le chat multimodal DocuCortex
 * Gère l'upload de fichiers, l'analyse par Gemini, et la génération de fichiers
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const multimodalService = require('../services/ai/multimodalService');
const geminiService = require('../services/ai/geminiService');
const aiService = require('../services/ai/aiService');
const conversationService = require('../services/ai/conversationService');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../data/uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB max
    },
    fileFilter: (req, file, cb) => {
        // Accepte tous les types de fichiers supportés par Gemini
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel', // xls
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/msword', // doc
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
            'text/csv',
            'application/json',
            'text/plain',
            'text/markdown',
            'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
            'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg',
            'video/webm', 'video/wmv', 'video/3gpp'
        ];

        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
            cb(null, true);
        } else {
            cb(new Error(`Type de fichier non supporté: ${file.mimetype}`));
        }
    }
});

/**
 * POST /api/ai/chat
 * Chat multimodal avec upload de fichiers
 */
router.post('/chat', upload.array('files', 10), async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        const files = req.files || [];

        console.log(`\n💬 Nouvelle requête chat multimodal:`);
        console.log(`   Message: ${message}`);
        console.log(`   Fichiers: ${files.length}`);
        console.log(`   Conversation: ${conversationId || 'nouvelle'}`);

        // Prépare les fichiers pour Gemini
        const preparedFiles = await multimodalService.prepareFilesForGemini(files);

        // Construit le prompt enrichi avec l'analyse des fichiers
        let enrichedMessage = message;

        if (preparedFiles.length > 0) {
            enrichedMessage += '\n\n📎 **Fichiers joints:**\n';
            for (const file of preparedFiles) {
                enrichedMessage += `\n**${file.name}** (${file.mimetype}):\n`;
                if (file.analysis.preview) {
                    enrichedMessage += `${file.analysis.preview}\n`;
                }
                if (file.analysis.csv) {
                    enrichedMessage += `\nDonnées:\n${file.analysis.csv}\n`;
                }
            }
        }

        // Détermine si c'est une demande GED ou une question générale
        const isDocumentQuery = message.toLowerCase().match(/(document|fichier|dossier|procédure|cherche|trouve|liste)/);

        let response;
        let provider = 'gemini';

        if (isDocumentQuery && !files.length) {
            // Requête GED classique
            response = await aiService.chat(enrichedMessage, conversationId);
        } else {
            // Requête multimodale avec Gemini
            try {
                // Prépare les parties du message pour Gemini
                const parts = [{ text: enrichedMessage }];

                // Ajoute les fichiers en inlineData pour Gemini
                for (const file of preparedFiles) {
                    if (file.geminiFormat.type === 'inlineData') {
                        const fileBuffer = await fs.readFile(file.path);
                        const base64Data = fileBuffer.toString('base64');

                        parts.push({
                            inlineData: {
                                mimeType: file.mimetype,
                                data: base64Data
                            }
                        });
                    }
                }

                // Appelle Gemini avec multimodal
                const geminiResponse = await geminiService.chatMultimodal(parts, conversationId);
                response = geminiResponse;

            } catch (geminiError) {
                console.error('❌ Erreur Gemini, fallback vers OpenRouter:', geminiError);
                // Fallback vers OpenRouter (sans multimodal)
                response = await aiService.chat(enrichedMessage, conversationId);
                provider = 'openrouter';
            }
        }

        // Détecte si la réponse contient des données à exporter
        const generatedFiles = await detectAndGenerateFiles(response.response, message);

        // Sauvegarde la conversation
        let convId = conversationId;
        if (!convId) {
            const conversation = await conversationService.createConversation({
                title: message.substring(0, 50) + '...'
            });
            convId = conversation.id;
        }

        await conversationService.addMessage(convId, {
            role: 'user',
            content: message,
            files: files.map(f => ({ name: f.originalname, type: f.mimetype }))
        });

        await conversationService.addMessage(convId, {
            role: 'assistant',
            content: response.response,
            files: generatedFiles,
            provider: provider,
            confidence: response.confidence
        });

        // Nettoie les fichiers uploadés après traitement
        setTimeout(async () => {
            for (const file of files) {
                try {
                    await fs.unlink(file.path);
                } catch (err) {
                    console.error('Erreur suppression fichier:', err);
                }
            }
        }, 5000);

        res.json({
            success: true,
            response: response.response,
            confidence: response.confidence,
            provider: provider,
            conversationId: convId,
            files: generatedFiles
        });

    } catch (error) {
        console.error('❌ Erreur chat multimodal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/conversations
 * Liste toutes les conversations
 */
router.get('/conversations', async (req, res) => {
    try {
        const conversations = await conversationService.getAllConversations();
        res.json({
            success: true,
            conversations: conversations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/conversations/:id
 * Récupère une conversation spécifique
 */
router.get('/conversations/:id', async (req, res) => {
    try {
        const conversation = await conversationService.getConversation(req.params.id);
        res.json({
            success: true,
            messages: conversation.messages,
            metadata: conversation.metadata
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/ai/conversations/:id
 * Supprime une conversation
 */
router.delete('/conversations/:id', async (req, res) => {
    try {
        await conversationService.deleteConversation(req.params.id);
        res.json({
            success: true,
            message: 'Conversation supprimée'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/ai/conversations
 * Purge toutes les conversations
 */
router.delete('/conversations', async (req, res) => {
    try {
        await conversationService.purgeAllConversations();
        res.json({
            success: true,
            message: 'Toutes les conversations ont été supprimées'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/status
 * Statut des providers
 */
router.get('/status', async (req, res) => {
    try {
        const status = {
            activeProvider: aiService.activeProvider,
            providers: {},
            fallbackEnabled: true
        };

        // Vérifie chaque provider
        for (const [name, provider] of Object.entries(aiService.providers)) {
            status.providers[name] = provider.enabled ? 'available' : 'disabled';
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/providers/:provider/test
 * Test un provider spécifique
 */
router.post('/providers/:provider/test', async (req, res) => {
    try {
        const { provider } = req.params;

        if (!aiService.providers[provider]) {
            return res.status(404).json({
                success: false,
                error: 'Provider non trouvé'
            });
        }

        const testResult = await aiService.providers[provider].service.testConnection();

        res.json({
            success: testResult.success,
            connected: testResult.success,
            modelsAvailable: testResult.modelsAvailable || 0,
            message: testResult.success ? 'Connexion réussie' : testResult.error
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/files/:fileId
 * Download un fichier généré
 */
router.get('/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const filePath = path.join(__dirname, '../../data/outputs', fileId);

        // Vérifie que le fichier existe
        await fs.access(filePath);

        res.download(filePath);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Fichier non trouvé'
        });
    }
});

/**
 * Détecte si la réponse contient des données à exporter
 * et génère les fichiers correspondants
 */
async function detectAndGenerateFiles(responseText, originalMessage) {
    const files = [];

    // Détecte si l'utilisateur demande un export Excel
    if (originalMessage.match(/(génère|créé|exporte).*excel/i)) {
        try {
            const excelPath = await multimodalService.textToExcel(responseText);
            if (excelPath) {
                files.push({
                    id: path.basename(excelPath),
                    name: path.basename(excelPath),
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    path: excelPath
                });
            }
        } catch (error) {
            console.error('Erreur génération Excel:', error);
        }
    }

    // Détecte si l'utilisateur demande un export Word
    if (originalMessage.match(/(génère|créé|exporte).*word|document/i)) {
        try {
            const wordPath = await multimodalService.textToWord(responseText);
            if (wordPath) {
                files.push({
                    id: path.basename(wordPath),
                    name: path.basename(wordPath),
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    path: wordPath
                });
            }
        } catch (error) {
            console.error('Erreur génération Word:', error);
        }
    }

    return files;
}

module.exports = router;
