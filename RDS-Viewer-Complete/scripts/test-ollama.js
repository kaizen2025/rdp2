#!/usr/bin/env node

/**
 * Script de test de connectivité Ollama
 * DocuCortex IA - Test des services Ollama
 */

const axios = require('axios');
const colors = require('colors');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/ollama';

// Configuration des couleurs
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta'
});

console.log('\n🤖 Test de Connectivité Ollama - DocuCortex IA'.title);
console.log('=' * 60);

// Fonction d'affichage des résultats
const displayResult = (test, success, message, details = null) => {
  const icon = success ? '✅' : '❌';
  const color = success ? 'success' : 'error';
  
  console.log(`\n${icon} ${test}:`[color]);
  console.log(`   ${message}`);
  
  if (details) {
    console.log(`   Détails: ${details}`[color]);
  }
};

// Test 1: Connectivité Ollama de base
const testOllamaConnection = async () => {
  try {
    console.log('\n🔍 Test 1: Connectivité Ollama de base...');
    
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
    const models = response.data.models;
    
    displayResult(
      'Connexion Ollama',
      true,
      'Connexion établie avec succès',
      `Ollama v${response.data.version || 'unknown'} - ${models.length} modèle(s) disponible(s)`
    );
    
    return models;
  } catch (error) {
    displayResult(
      'Connexion Ollama',
      false,
      'Impossible de se connecter à Ollama',
      error.message
    );
    return null;
  }
};

// Test 2: API DocuCortex Ollama
const testDocuCortexAPI = async () => {
  try {
    console.log('\n🔍 Test 2: API DocuCortex Ollama...');
    
    const response = await axios.get(`${API_BASE_URL}/test`, { timeout: 10000 });
    
    displayResult(
      'API DocuCortex',
      true,
      'API DocuCortex fonctionnelle',
      `Statut: ${response.data.status} - Modèles: ${response.data.models?.length || 0}`
    );
    
    return true;
  } catch (error) {
    displayResult(
      'API DocuCortex',
      false,
      'API DocuCortex non accessible',
      error.message
    );
    return false;
  }
};

// Test 3: Génération de texte simple
const testTextGeneration = async (modelName) => {
  if (!modelName) {
    displayResult(
      'Génération de texte',
      false,
      'Pas de modèle disponible pour le test',
      'Installez d\'abord un modèle Ollama'
    );
    return false;
  }
  
  try {
    console.log('\n🔍 Test 3: Génération de texte...');
    
    const response = await axios.post(`${API_BASE_URL}/generate`, {
      prompt: 'Explique brièvement ce qu\'est DocuCortex IA en une phrase.',
      model: modelName,
      system: 'Tu es un assistant technique précis.'
    }, { timeout: 30000 });
    
    const result = response.data.data;
    displayResult(
      'Génération de texte',
      true,
      'Génération réussie',
      `Modèle: ${result.model} - ${result.eval_count} tokens générés`
    );
    
    return true;
  } catch (error) {
    displayResult(
      'Génération de texte',
      false,
      'Échec de la génération',
      error.message
    );
    return false;
  }
};

// Test 4: Analyse de document
const testDocumentAnalysis = async (modelName) => {
  if (!modelName) return false;
  
  try {
    console.log('\n🔍 Test 4: Analyse de document...');
    
    const testText = `Rapport mensuel de ventes - Mars 2024
Ventes totales: 150 000€
Nouveaux clients: 25
Produits vendus: 150 unités
Taux de satisfaction: 94%

Recommandations:
- Augmenter le marketing digital
- Développer la gamme premium
- Améliorer le service client`;
    
    const response = await axios.post(`${API_BASE_URL}/analyze-document`, {
      text: testText,
      type: 'txt',
      model: modelName
    }, { timeout: 45000 });
    
    displayResult(
      'Analyse de document',
      true,
      'Analyse réussie',
      `Type: ${response.data.data.type} - ${response.data.data.tokens_generated} tokens`
    );
    
    return true;
  } catch (error) {
    displayResult(
      'Analyse de document',
      false,
      'Échec de l\'analyse',
      error.message
    );
    return false;
  }
};

// Test 5: Performance et latence
const testPerformance = async (modelName) => {
  if (!modelName) return false;
  
  try {
    console.log('\n🔍 Test 5: Test de performance...');
    
    const startTime = Date.now();
    
    await axios.post(`${API_BASE_URL}/generate`, {
      prompt: 'List 5 avantages de l\'IA dans la gestion de documents.',
      model: modelName
    }, { timeout: 30000 });
    
    const duration = Date.now() - startTime;
    
    displayResult(
      'Performance',
      true,
      'Test de performance complété',
      `Temps de réponse: ${duration}ms`
    );
    
    return duration < 30000; // Moins de 30 secondes
  } catch (error) {
    displayResult(
      'Performance',
      false,
      'Test de performance échoué',
      error.message
    );
    return false;
  }
};

// Résumé des tests
const displaySummary = (results) => {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log('\n' + '=' * 60);
  console.log('📊 RÉSUMÉ DES TESTS'.title);
  console.log('=' * 60);
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'success' : 'error';
    console.log(`${icon} ${result.test}`[color]);
  });
  
  console.log(`\n📈 Résultats globaux: ${passedTests}/${totalTests} tests réussis (${successRate}%)`.title);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Félicitations! Tous les tests sont passés avec succès!'.success);
    console.log('Ollama est correctement configuré et prêt à l\'utilisation.'.success);
  } else {
    console.log('\n⚠️  Certains tests ont échoué.'.warning);
    console.log('Vérifiez la configuration d\'Ollama et l\'installation des modèles.'.warning);
  }
  
  console.log('\n💡 Commandes utiles:'.info);
  console.log(`   - Installer Ollama: curl -fsSL https://ollama.ai/install.sh | sh`.info);
  console.log(`   - Démarrer Ollama: ollama serve`.info);
  console.log(`   - Installer un modèle: ollama pull llama2`.info);
  console.log(`   - Configurer l'URL: export OLLAMA_HOST="http://localhost:11434"`.info);
};

// Fonction principale
const runTests = async () => {
  const results = [];
  
  try {
    // Test de base Ollama
    const models = await testOllamaConnection();
    results.push({ 
      test: 'Connexion Ollama', 
      success: !!models 
    });
    
    // Test API DocuCortex
    const apiWorks = await testDocuCortexAPI();
    results.push({ 
      test: 'API DocuCortex', 
      success: apiWorks 
    });
    
    if (models && models.length > 0) {
      const modelName = models[0].name;
      
      // Test génération de texte
      const textGen = await testTextGeneration(modelName);
      results.push({ 
        test: 'Génération de texte', 
        success: textGen 
      });
      
      // Test analyse de document
      const docAnalysis = await testDocumentAnalysis(modelName);
      results.push({ 
        test: 'Analyse de document', 
        success: docAnalysis 
      });
      
      // Test performance
      const perf = await testPerformance(modelName);
      results.push({ 
        test: 'Performance', 
        success: perf 
      });
    } else {
      results.push({ test: 'Génération de texte', success: false });
      results.push({ test: 'Analyse de document', success: false });
      results.push({ test: 'Performance', success: false });
    }
    
  } catch (error) {
    console.log('\n❌ Erreur inattendue lors des tests:'.error);
    console.log(error.message);
  }
  
  displaySummary(results);
  
  // Code de sortie
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
};

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Tests interrompus par l\'utilisateur.'.warning);
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Tests terminés par signal.'.warning);
  process.exit(0);
});

// Exécution
if (require.main === module) {
  runTests();
}

module.exports = {
  testOllamaConnection,
  testDocuCortexAPI,
  testTextGeneration,
  testDocumentAnalysis,
  testPerformance
};