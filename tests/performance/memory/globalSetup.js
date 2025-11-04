/**
 * Setup global pour les tests de mémoire
 * Configure l'environnement pour l'optimisation des tests de mémoire
 */

module.exports = async () => {
  console.log('🔧 Configuration de l\'environnement pour les tests de mémoire...');
  
  // Vérifie que le GC est disponible (nécessite --expose-gc)
  if (global.gc) {
    console.log('✅ Garbage Collection exposé et disponible');
  } else {
    console.warn('⚠️  Garbage Collection non exposé. Exécutez avec: node --expose-gc');
  }
  
  // Configure les limites mémoire pour les tests
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '';
  if (!process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
    process.env.NODE_OPTIONS += ' --max-old-space-size=512'; // 512MB pour les tests
  }
  
  // Force le GC au début
  if (global.gc) {
    global.gc();
    console.log('🧹 Garbage Collection initial exécuté');
  }
  
  // Attend la stabilisation mémoire
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('✅ Environnement de test mémoire configuré');
};