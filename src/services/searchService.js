// src/services/searchService.js - Service de recherche

class SearchService {
    async search(query, options = {}) {
        // Implémentation basique de recherche
        return {
            results: [],
            total: 0,
            query
        };
    }

    async searchUsers(query) {
        return this.search(query, { type: 'users' });
    }

    async searchDocuments(query) {
        return this.search(query, { type: 'documents' });
    }

    async searchLoans(query) {
        return this.search(query, { type: 'loans' });
    }
}

export default new SearchService();
