// apiService.js - Service API pour DocuCortex IA

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Intercepteur pour les requêtes
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour les réponses
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url} - Status: ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.config?.url} -`, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Vérifier la santé du serveur
  async checkServerHealth() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Serveur indisponible: ${error.message}`);
    }
  }

  // Analyser un document avec l'IA
  async analyzeDocument(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Le texte est requis pour l\'analyse');
    }

    try {
      const response = await this.api.post('/analyze', {
        text: text.trim()
      });

      if (response.data.success) {
        return response.data.analysis;
      } else {
        throw new Error(response.data.error || 'Erreur d\'analyse');
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  // Sauvegarder un document
  async saveDocument(title, content) {
    if (!title || !content) {
      throw new Error('Le titre et le contenu sont requis');
    }

    try {
      const response = await this.api.post('/documents', {
        title: title.trim(),
        content: content.trim()
      });

      if (response.data.success) {
        return response.data.document;
      } else {
        throw new Error(response.data.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  // Récupérer tous les documents
  async getDocuments() {
    try {
      const response = await this.api.get('/documents');
      
      if (response.data.success) {
        return response.data.documents;
      } else {
        throw new Error(response.data.error || 'Erreur de récupération');
      }
    } catch (error) {
      console.error('Erreur récupération documents:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  // Supprimer un document
  async deleteDocument(id) {
    try {
      const response = await this.api.delete(`/documents/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  // Exporter un document
  async exportDocument(id, format = 'pdf') {
    try {
      const response = await this.api.get(`/documents/${id}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-${id}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erreur export:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }
}

// Instance singleton
const apiService = new ApiService();

export default apiService;