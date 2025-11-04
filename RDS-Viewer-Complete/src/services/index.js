// Export des services DocuCortex
export { default as ocrService } from '../../../services/ocrService';
export { default as OllamaService } from '../../../services/ollamaService';

// Fonctions utilitaires OCR
export { 
  extractText, 
  processDocument, 
  processBatchDocuments, 
  testOCRService 
} from '../../../services/ocrService';

// Fonctions utilitaires Ollama
export { 
  testOllamaConnection, 
  chatWithOllama, 
  analyzeWithOllama, 
  summarizeWithOllama, 
  getOllamaModels 
} from '../../../services/ollamaService';