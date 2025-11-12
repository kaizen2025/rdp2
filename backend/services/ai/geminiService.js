// backend/services/ai/geminiService.js

let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (error) {
  console.warn('⚠️ Package @google/generative-ai non disponible. Installez-le avec: npm install @google/generative-ai');
  GoogleGenerativeAI = null;
}

let genAI;
let model;
let config;

async function initialize(options) {
  try {
    if (!GoogleGenerativeAI) {
      throw new Error('Package @google/generative-ai non installé');
    }
    if (!options.apiKey || options.apiKey === 'VOTRE_CLE_API_GEMINI') {
      throw new Error('Clé API Gemini non configurée');
    }
    genAI = new GoogleGenerativeAI(options.apiKey);
    model = genAI.getGenerativeModel({ model: options.model || 'gemini-1.5-flash' });
    config = options;
    console.log('✅ Service Gemini initialisé avec succès.');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur initialisation Gemini:', error.message);
    return { success: false, error: error.message };
  }
}

async function processConversation(messages, options = {}) {
  try {
    if (!GoogleGenerativeAI || !model) {
      throw new Error('Service Gemini non initialisé ou package non installé');
    }
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return { success: true, response: text };
  } catch (error) {
    console.error('❌ Erreur API Gemini:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Chat multimodal avec Gemini
 * @param {Array} parts - Array de parts (text, inlineData, etc.)
 * @param {String} conversationId - ID de la conversation (optionnel)
 * @returns {Object} - Réponse de Gemini
 */
async function chatMultimodal(parts, conversationId = null) {
  try {
    if (!GoogleGenerativeAI || !model) {
      throw new Error('Service Gemini non initialisé ou package non installé');
    }

    console.log(`🎨 Chat multimodal Gemini: ${parts.length} parts`);

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      response: text,
      confidence: 95, // Gemini est généralement très confiant
      conversationId: conversationId
    };
  } catch (error) {
    console.error('❌ Erreur chat multimodal Gemini:', error.message);
    throw error;
  }
}

async function testConnection(apiKey, modelName) {
  try {
    if (!GoogleGenerativeAI) {
      throw new Error('Package @google/generative-ai non installé');
    }
    const testAI = new GoogleGenerativeAI(apiKey || config.apiKey);
    const testModel = testAI.getGenerativeModel({ model: modelName || config.model });
    const result = await testModel.generateContent('test');
    const response = await result.response;
    const text = response.text();
    if (text) {
      return { success: true, message: 'Connexion à Gemini réussie.' };
    }
    return { success: false, error: 'Réponse invalide de Gemini.' };
  } catch (error) {
    console.error('❌ Erreur test connexion Gemini:', error.message);
    return { success: false, error: error.message };
  }
}

function getStatistics() {
  return {
    provider: 'gemini',
    model: config?.model,
    calls: 0, // Not implemented
  };
}

module.exports = {
  initialize,
  processConversation,
  chatMultimodal,
  testConnection,
  getStatistics,
};
