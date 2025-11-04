// apiService.js - Service API DYNAMIQUE pour DocuCortex IA

import axios from 'axios';

// Création d'une instance Axios de base SANS baseURL pour l'initialisation
const initialApi = axios.create({
  timeout: 5000,
});

// L'instance principale qui sera configurée dynamiquement
const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// --- NOUVELLE LOGIQUE D'INITIALISATION ASYNCHRONE ---
const initializeApiService = async () => {
  try {
    // 1. Découvrir le port de l'API en utilisant une URL relative.
    //    Cela fonctionne car le serveur React et le serveur API sont sur le même 'hôte'.
    console.log('[ApiService] 🔍 Découverte du port de l'API...');
    const response = await initialApi.get('/api/ports');

    if (response.data.success && response.data.ports.http) {
      const apiPort = response.data.ports.http;
      const baseURL = `http://localhost:${apiPort}/api`;

      // 2. Configurer l'instance principale d'Axios avec la bonne URL de base.
      api.defaults.baseURL = baseURL;

      console.log(`[ApiService] ✅ Configuration réussie. API sur: ${baseURL}`);

      // Mettre en place les intercepteurs sur l'instance configurée
      setupInterceptors();

      return true; // Succès de l'initialisation
    } else {
      throw new Error('La réponse de /api/ports est invalide.');
    }
  } catch (error) {
    console.error('❌ [ApiService] ERREUR CRITIQUE: Impossible de configurer l\'API.', error.message);
    // Afficher une alerte ou un message à l'utilisateur ici pourrait être une bonne idée
    document.body.innerHTML = `<div style="text-align: center; margin-top: 50px; font-family: sans-serif; color: red;">
      <h1>Erreur Critique</h1>
      <p>Impossible de communiquer avec le serveur backend. L'application ne peut pas démarrer.</p>
      <p>Veuillez vérifier que le serveur est bien lancé et accessible.</p>
    </div>`;
    return Promise.reject('Échec de l\'initialisation de l\'API');
  }
};

// --- INTERCEPTEURS ---
function setupInterceptors() {
  api.interceptors.request.use(
    (config) => {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
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


// --- L'API SERVICE UTILISANT L'INSTANCE DYNAMIQUEMENT CONFIGURÉE ---
class ApiService {

  // Les méthodes de l'API service restent les mêmes, mais utilisent `api` au lieu de `this.api`

  async checkServerHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Serveur indisponible: ${error.message}`);
    }
  }

  async analyzeDocument(text) {
    if (!text || text.trim().length === 0) throw new Error('Le texte est requis pour l\'analyse');
    try {
      const response = await api.post('/analyze', { text: text.trim() });
      if (response.data.success) return response.data.analysis;
      throw new Error(response.data.error || 'Erreur d\'analyse');
    } catch (error) {
      console.error('Erreur analyse:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async saveDocument(title, content) {
    if (!title || !content) throw new Error('Le titre et le contenu sont requis');
    try {
      const response = await api.post('/documents', { title: title.trim(), content: content.trim() });
      if (response.data.success) return response.data.document;
      throw new Error(response.data.error || 'Erreur de sauvegarde');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async getDocuments() {
    try {
      const response = await api.get('/documents');
      if (response.data.success) return response.data.documents;
      throw new Error(response.data.error || 'Erreur de récupération');
    } catch (error) {
      console.error('Erreur récupération documents:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async deleteDocument(id) {
    try {
      const response = await api.delete(`/documents/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async exportDocument(id, format = 'pdf') {
    try {
      const response = await api.get(`/documents/${id}/export`, { params: { format }, responseType: 'blob' });
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

// --- EXPORTATION ---
// On exporte la promesse d'initialisation pour que l'app puisse attendre
export const apiServicePromise = initializeApiService();

// On exporte une instance du service pour une utilisation facile
const apiService = new ApiService();
export default apiService;
