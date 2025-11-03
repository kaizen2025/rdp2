/**
 * Configuration globale pour les tests Jest
 */

// Augmenter le timeout global pour les tests
jest.setTimeout(10000);

// Mock pour localStorage (utilisé dans le frontend)
global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = value.toString();
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    }
};

// Mock pour fetch (utilisé dans apiService)
global.fetch = jest.fn();

// Nettoyer après chaque test
afterEach(() => {
    jest.clearAllMocks();
    global.localStorage.clear();
});
