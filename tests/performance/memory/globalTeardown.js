/**
 * Teardown global pour les tests de mémoire
 * Nettoie l'environnement après tous les tests
 */

module.exports = async () => {
  console.log('🧹 Nettoyage de l\'environnement de tests de mémoire...');
  
  // Force le GC final
  if (global.gc) {
    global.gc();
    console.log('🧹 Garbage Collection final exécuté');
  }
  
  // Attend la stabilisation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Affiche un résumé mémoire final
  const finalMemory = process.memoryUsage();
  console.log('📊 Mémoire finale:', {
    heapUsed: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    rss: `${(finalMemory.rss / 1024 / 1024).toFixed(2)}MB`,
    external: `${(finalMemory.external / 1024 / 1024).toFixed(2)}MB`
  });
  
  console.log('✅ Nettoyage terminé');
};