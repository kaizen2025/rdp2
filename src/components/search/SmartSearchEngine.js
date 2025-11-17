// src/components/search/SmartSearchEngine.js - Moteur de recherche simplifié

// Simple search implementation without external dependencies
export class SmartSearchEngine {
    constructor(options = {}) {
        this.options = options;
        this.index = [];
    }

    setDocuments(docs) {
        this.index = docs || [];
    }

    search(query) {
        if (!query || !query.trim()) return [];
        
        const term = query.toLowerCase();
        return this.index.filter(doc => {
            const searchText = Object.values(doc)
                .filter(v => typeof v === 'string')
                .join(' ')
                .toLowerCase();
            return searchText.includes(term);
        });
    }
}

// Hook pour utiliser le moteur de recherche
export const useSmartSearch = (documents = []) => {
    const [results, setResults] = React.useState([]);
    const engine = React.useMemo(() => new SmartSearchEngine(), []);

    React.useEffect(() => {
        engine.setDocuments(documents);
    }, [documents, engine]);

    const search = React.useCallback((query) => {
        const found = engine.search(query);
        setResults(found);
        return found;
    }, [engine]);

    return { search, results };
};

export default SmartSearchEngine;
