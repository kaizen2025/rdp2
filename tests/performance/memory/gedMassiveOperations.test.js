/**
 * Tests de performance mémoire pour opérations GED massives
 * Teste l'upload, téléchargement, traitement et stockage de documents
 */

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { MemoryMonitor } = require('./memoryMonitor');
const { GED_CONFIG } = require('./memory.config');

// Mock GED Service
class GEDServiceMock {
  constructor() {
    this.documents = new Map();
    this.tempFiles = [];
    this.processingQueue = [];
  }

  // Upload de document avec potentiel leak
  async uploadDocumentLeaky(documentData) {
    // Fuite: stocke toutes les versions en mémoire
    const documentId = `doc_${Date.now()}`;
    const versions = [];
    
    for (let i = 0; i < 10; i++) {
      const version = {
        id: `v${i}`,
        content: documentData.content,
        metadata: { ...documentData.metadata, version: i },
        // Fuite: garde les références
        previousVersion: i > 0 ? versions[i - 1] : null
      };
      versions.push(version);
    }

    this.documents.set(documentId, {
      id: documentId,
      versions: versions, // Fuite: référence à toutes les versions
      currentVersion: versions[9],
      metadata: documentData.metadata
    });

    return documentId;
  }

  // Upload avec gestion mémoire correcte
  async uploadDocumentClean(documentData) {
    const documentId = `doc_${Date.now()}`;
    
    this.documents.set(documentId, {
      id: documentId,
      versions: [], // Ne garde pas toutes les versions
      currentVersion: {
        content: documentData.content,
        metadata: documentData.metadata
      },
      metadata: documentData.metadata,
      // Callback pour nettoyer si nécessaire
      cleanup: () => {
        this.documents.delete(documentId);
      }
    });

    return documentId;
  }

  // Recherche de documents avec cache sans limite
  async searchDocumentsLeaky(query, limit = 1000) {
    const results = [];
    const searchCache = new Map(); // Fuite: cache illimité

    for (let i = 0; i < limit; i++) {
      const docId = `doc_${i}`;
      const cached = searchCache.get(query);
      
      if (!cached) {
        // Simule recherche expensive
        const result = this.simulateDocumentSearch(docId, query);
        searchCache.set(query, result); // Fuite: cache sans limite
        results.push(result);
      } else {
        results.push(cached);
      }
    }

    return results;
  }

  // Recherche avec cache limitée
  async searchDocumentsClean(query, limit = 100) {
    const results = [];
    const searchCache = new Map();
    const MAX_CACHE_SIZE = 50;

    for (let i = 0; i < limit; i++) {
      const docId = `doc_${i}`;
      const cached = searchCache.get(query);
      
      if (!cached && searchCache.size < MAX_CACHE_SIZE) {
        const result = this.simulateDocumentSearch(docId, query);
        searchCache.set(query, result);
        results.push(result);
      } else if (cached) {
        results.push(cached);
      } else {
        // Cache plein, fait la recherche sans cache
        results.push(this.simulateDocumentSearch(docId, query));
      }
    }

    return results;
  }

  simulateDocumentSearch(docId, query) {
    return {
      id: docId,
      title: `Document ${docId}`,
      content: 'x'.repeat(1000), // 1KB content
      query: query,
      score: Math.random(),
      metadata: {
        size: 1024,
        type: 'pdf',
        created: new Date(),
        tags: ['tag1', 'tag2', 'tag3']
      }
    };
  }

  // Traitement OCR avec mémoire optimisée
  async processOCRBatchClean(documents) {
    const BATCH_SIZE = 10;
    const results = [];
    
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (doc) => {
          // Simule traitement OCR
          const ocrResult = {
            documentId: doc.id,
            text: 'x'.repeat(5000), // 5KB OCR result
            confidence: Math.random(),
            processingTime: Date.now()
          };
          
          // Libère la mémoire du document après traitement
          delete doc.content;
          
          return ocrResult;
        })
      );
      
      results.push(...batchResults);
      
      // Force le GC entre les batches
      if (global.gc) global.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  // Traitement OCR avec fuites
  async processOCRBatchLeaky(documents) {
    const results = [];
    
    for (const doc of documents) {
      // Fuite: garde toutes les références
      const ocrResult = {
        documentId: doc.id,
        text: 'x'.repeat(5000),
        originalDocument: doc, // Fuite: référence circulaire
        confidence: Math.random(),
        processingTime: Date.now()
      };
      
      results.push(ocrResult);
      // Ne libère pas doc.content
    }
    
    return results;
  }

  // Nettoyage
  cleanup() {
    this.documents.clear();
    this.tempFiles = [];
    this.processingQueue = [];
  }
}

describe('Tests Performance Mémoire GED Massive', () => {
  let memoryMonitor;
  let gedService;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
    gedService = new GEDServiceMock();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
    gedService.cleanup();
  });

  describe('Tests Upload de Documents', () => {
    test('doit gérer l\'upload de gros documents', async () => {
      const largeDocument = {
        content: 'x'.repeat(GED_CONFIG.MAX_FILE_SIZE), // 50MB
        metadata: {
          name: 'large-document.txt',
          type: 'text',
          size: GED_CONFIG.MAX_FILE_SIZE,
          tags: ['large', 'test']
        }
      };

      const { result: docId, memory } = await memoryMonitor.measureFunctionMemory(
        () => gedService.uploadDocumentClean(largeDocument),
        'uploadLargeDocument'
      );

      expect(docId).toBeDefined();
      expect(memory.increase).toBeGreaterThan(0);
      expect(memory.increase).toBeLessThan(50); // Devrait être < 50MB
    });

    test('doit détecter les fuites de versions de documents', async () => {
      const createDocumentWithVersions = async () => {
        const document = {
          content: 'x'.repeat(1024 * 1024), // 1MB
          metadata: {
            name: 'versioned-document.txt',
            type: 'text'
          }
        };

        const docId = await gedService.uploadDocumentLeaky(document);
        return { docId };
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        createDocumentWithVersions,
        'documentWithVersions'
      );

      expect(result.docId).toBeDefined();
      expect(memory.increase).toBeGreaterThan(5); // Au moins 5MB pour les versions
    });

    test('doit comparer upload propre vs avec fuites', async () => {
      const document = {
        content: 'x'.repeat(1024 * 1024), // 1MB
        metadata: { name: 'test.txt' }
      };

      // Test avec version propre
      const cleanResult = await memoryMonitor.measureFunctionMemory(
        () => gedService.uploadDocumentClean(document),
        'cleanUpload'
      );

      // Reset pour test avec fuite
      gedService.cleanup();
      
      // Test avec version leaky
      const leakyResult = await memoryMonitor.measureFunctionMemory(
        () => gedService.uploadDocumentLeaky(document),
        'leakyUpload'
      );

      // La version leaky devrait utiliser plus de mémoire
      expect(leakyResult.memory.increase).toBeGreaterThan(cleanResult.memory.increase);
    });
  });

  describe('Tests Recherche de Documents', () => {
    test('doit effectuer des recherches sans fuites', async () => {
      const performSearch = async () => {
        const results = await gedService.searchDocumentsClean('test query', 100);
        return results.length;
      };

      const { result: count, memory } = await memoryMonitor.measureFunctionMemory(
        performSearch,
        'cleanSearch'
      );

      expect(count).toBe(100);
      expect(memory.increase).toBeLessThan(10); // Devrait être < 10MB
    });

    test('doit détecter les fuites de cache de recherche', async () => {
      const performLeakySearch = async () => {
        const results = await gedService.searchDocumentsLeaky('leaky query', 1000);
        return results.length;
      };

      const { result: count, memory } = await memoryMonitor.measureFunctionMemory(
        performLeakySearch,
        'leakySearch'
      );

      expect(count).toBe(1000);
      expect(memory.increase).toBeGreaterThan(50); // Devrait être > 50MB avec cache illimité
    });

    test('doit tester les recherches parallèles', async () => {
      const parallelSearches = async () => {
        const searches = [
          'query1', 'query2', 'query3', 'query4', 'query5'
        ];

        const promises = searches.map(query => 
          gedService.searchDocumentsClean(query, 50)
        );

        const results = await Promise.all(promises);
        return results.flat().length;
      };

      const { result: totalResults } = await memoryMonitor.measureFunctionMemory(
        parallelSearches,
        'parallelSearches'
      );

      expect(totalResults).toBe(250); // 5 queries * 50 résultats chacune
    });
  });

  describe('Tests Traitement OCR Batch', () => {
    test('doit traiter des lots de documents efficacement', async () => {
      // Crée des documents de test
      const documents = Array.from({ length: 100 }, (_, i) => ({
        id: `doc_${i}`,
        content: 'x'.repeat(100 * 1024), // 100KB par doc
        metadata: { name: `document_${i}.pdf` }
      }));

      const { result: ocrResults, memory } = await memoryMonitor.measureFunctionMemory(
        () => gedService.processOCRBatchClean(documents),
        'processOCRClean'
      );

      expect(ocrResults.length).toBe(100);
      expect(memory.increase).toBeGreaterThan(0);
      expect(memory.increase).toBeLessThan(100); // Devrait être < 100MB
    });

    test('doit détecter les fuites dans le traitement OCR', async () => {
      const documents = Array.from({ length: 50 }, (_, i) => ({
        id: `doc_leaky_${i}`,
        content: 'x'.repeat(200 * 1024), // 200KB par doc
        metadata: { name: `leaky_${i}.pdf` }
      }));

      const { result: ocrResults, memory } = await memoryMonitor.measureFunctionMemory(
        () => gedService.processOCRBatchLeaky(documents),
        'processOCRLeaky'
      );

      expect(ocrResults.length).toBe(50);
      expect(memory.increase).toBeGreaterThan(100); // Devrait être > 100MB avec fuites
    });

    test('doit mesurer l\'impact du batch size', async () => {
      const documents = Array.from({ length: 200 }, (_, i) => ({
        id: `doc_batch_${i}`,
        content: 'x'.repeat(50 * 1024), // 50KB par doc
        metadata: { name: `batch_${i}.pdf` }
      }));

      const { result: ocrResults } = await memoryMonitor.measureFunctionMemory(
        () => gedService.processOCRBatchClean(documents),
        'processOCRBatch'
      );

      expect(ocrResults.length).toBe(200);
    });
  });

  describe('Tests Streaming et Chunked Processing', () => {
    test('doit traiter des streams de gros fichiers', async () => {
      const createStreamingProcessor = () => {
        return new Promise((resolve, reject) => {
          const stream = new Readable({
            read() {
              for (let i = 0; i < 10; i++) {
                this.push('x'.repeat(GED_CONFIG.STREAMING_CHUNK_SIZE));
              }
              this.push(null); // End stream
            }
          });

          let processedSize = 0;
          const chunks = [];

          stream.on('data', (chunk) => {
            processedSize += chunk.length;
            chunks.push(chunk);
          });

          stream.on('end', () => {
            resolve({ processedSize, chunksCount: chunks.length });
          });

          stream.on('error', reject);
        });
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        createStreamingProcessor,
        'streamingProcessor'
      );

      expect(result.processedSize).toBe(10 * GED_CONFIG.STREAMING_CHUNK_SIZE);
      expect(result.chunksCount).toBe(10);
    });

    test('doit comparer streaming vs memory loading', async () => {
      // Test streaming (efficient)
      const streamingTest = async () => {
        const processor = () => new Promise((resolve) => {
          const chunks = [];
          const stream = new Readable({
            read() {
              for (let i = 0; i < 5; i++) {
                this.push('x'.repeat(GED_CONFIG.STREAMING_CHUNK_SIZE));
              }
              this.push(null);
            }
          });

          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(chunks.length));
        });
        return processor();
      };

      // Test memory loading (moins efficient)
      const memoryLoadingTest = async () => {
        const largeData = 'x'.repeat(5 * GED_CONFIG.STREAMING_CHUNK_SIZE);
        const chunks = largeData.match(/.{1,1024000}/g) || [];
        return chunks.length;
      };

      const streamingResult = await memoryMonitor.measureFunctionMemory(
        streamingTest,
        'streaming'
      );

      gedService.cleanup();
      
      const memoryLoadingResult = await memoryMonitor.measureFunctionMemory(
        memoryLoadingTest,
        'memoryLoading'
      );

      // Streaming devrait être plus memory-efficient
      expect(streamingResult.memory.increase).toBeLessThanOrEqual(memoryLoadingResult.memory.increase);
    });
  });

  describe('Tests Surveillance Continue GED', () => {
    test('doit surveiller les opérations GED en temps réel', async () => {
      memoryMonitor.startMonitoring();

      // Simule une session GED complète
      const gedSession = async () => {
        // Upload de documents
        for (let i = 0; i < 20; i++) {
          const doc = {
            content: 'x'.repeat(100 * 1024), // 100KB
            metadata: { name: `session_doc_${i}.pdf` }
          };
          await gedService.uploadDocumentClean(doc);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Recherches
        for (let i = 0; i < 10; i++) {
          await gedService.searchDocumentsClean(`session_query_${i}`, 20);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        return true;
      };

      await memoryMonitor.measureFunctionMemory(
        gedSession,
        'gedSession'
      );

      // Attends plusieurs cycles de surveillance
      await new Promise(resolve => setTimeout(resolve, 15000));

      memoryMonitor.stopMonitoring();

      const leaks = memoryMonitor.detectLeaks();
      const report = memoryMonitor.exportReport();

      expect(report.snapshots.length).toBeGreaterThan(0);
      console.log('Surveillance GED session:', {
        leaks: leaks?.length || 0,
        finalMemory: report.current.heapUsed,
        snapshots: report.snapshots.length
      });
    });

    test('doit détecter les patterns de fuite dans les opérations GED', async () => {
      const createLeakPattern = async () => {
        // Pattern: upload -> recherche -> nettoyage partiel
        for (let i = 0; i < 10; i++) {
          const doc = {
            content: 'x'.repeat(200 * 1024),
            metadata: { name: `leak_pattern_${i}.pdf` }
          };

          // Upload avec fuites
          const docId = await gedService.uploadDocumentLeaky(doc);
          
          // Recherche avec cache
          await gedService.searchDocumentsLeaky(`pattern_query_${i}`, 100);
          
          // Nettoyage partiel (doc seulement, pas les recherches)
          if (i % 2 === 0) {
            gedService.documents.delete(docId);
          }
        }
      };

      const { memory } = await memoryMonitor.measureFunctionMemory(
        createLeakPattern,
        'createLeakPattern'
      );

      // Teste le nettoyage complet
      gedService.cleanup();
      
      const memoryAfterCleanup = memoryMonitor.getMemoryStats();
      
      // La mémoire ne devrait pas revenir complètement au niveau initial
      // si il y a des fuites
      console.log('Pattern de fuites détecté:', {
        increase: memory.increase,
        memoryAfterCleanup: memoryAfterCleanup.heapUsed
      });
    });
  });
});