// backend/services/ai/geminiService.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
let model;
let config;

async function initialize(options) {
  try {
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

async function testConnection(apiKey, modelName) {
  try {
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
  testConnection,
  getStatistics,
};
