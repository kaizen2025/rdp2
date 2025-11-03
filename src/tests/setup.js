// src/tests/setup.js - CONFIGURATION ENVIRONNEMENT DE TEST

import '@testing-library/jest-dom';
import { setupTestEnvironment } from './TestProviders';

// Configuration globale de l'environnement de test
setupTestEnvironment();

// Configuration de l'environnement DOM
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock des APIs du navigateur non supportées par jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock de performance.now pour les tests de performance
global.performance = {
    ...global.performance,
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
    }
};

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn();

// Configuration du mock pour les modules utilitaires
jest.mock('../utils/lazyModules', () => ({
    loadXLSX: jest.fn().mockResolvedValue({
        utils: {
            json_to_sheet: jest.fn().mockReturnValue({
                '!cols': [],
                'A1': { v: 'ID' },
                'B1': { v: 'Ordinateur' },
                'C1': { v: 'Utilisateur' },
                '!ref': 'A1:C1'
            }),
            book_new: jest.fn().mockReturnValue({ SheetNames: [], Sheets: {} }),
            book_append_sheet: jest.fn().mockReturnValue(undefined)
        },
        writeFile: jest.fn().mockImplementation((workbook, filename) => {
            // Simuler la création et téléchargement du fichier
            const blob = new Blob(['mock xlsx data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        })
    }),
    loadJsPDF: jest.fn().mockImplementation(() => {
        const MockJsPDF = jest.fn().constructor(function() {
            this.setFontSize = jest.fn();
            this.text = jest.fn();
            this.addPage = jest.fn();
            this.save = jest.fn().mockImplementation((filename) => {
                // Simuler la sauvegarde PDF
                const blob = new Blob(['mock pdf data'], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
            });
            return this;
        });
        return MockJsPDF;
    }),
    loadQRCode: jest.fn().mockResolvedValue(function QRCodeSVG({ value, size, level, includeMargin }) {
        return {
            // Mock component QR Code
            type: 'svg',
            props: { value, size, level, includeMargin },
            $$typeof: Symbol.for('react.element')
        };
    }),
    loadHtml2Canvas: jest.fn().mockResolvedValue(function html2canvas(element, options) {
        return Promise.resolve({
            toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockqrcode'),
            width: element?.offsetWidth || 200,
            height: element?.offsetHeight || 200
        });
    })
}));

// Mock de l'API fetch globale
global.fetch = jest.fn();

// Configuration du mock pour window.open et alert
global.window.open = jest.fn();
global.window.print = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn().mockReturnValue(true);

// Mock de console pour réduire le bruit dans les tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    console.error = jest.fn((...args) => {
        // Ignorer certaines erreurs de React qui sont normales en test
        if (!args[0]?.toString().includes('Warning:')) {
            originalConsoleError.call(console, ...args);
        }
    });
    
    console.warn = jest.fn((...args) => {
        // Ignorer certains warnings qui sont normaux en test
        if (!args[0]?.toString().includes('Warning:')) {
            originalConsoleWarn.call(console, ...args);
        }
    });
});

afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// Configuration des timeouts
jest.setTimeout(10000); // 10 secondes pour les tests asynchrones

// Nettoyage après chaque test
afterEach(() => {
    // Nettoyer tous les mocks
    jest.clearAllMocks();
    
    // Réinitialiser les modules avec cache
    jest.clearAllTimers();
    
    // Nettoyer le DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
});

// Helper pour attendre les Promises
export const waitForPromises = () => new Promise(resolve => setImmediate(resolve));

// Helper pour les tests avec MUI Date Pickers
export const setupDatePicker = () => {
    // Mock de Date.now pour avoir des dates déterministes
    const mockNow = jest.fn(() => new Date('2024-11-04T12:00:00Z').getTime());
    global.Date.now = mockNow;
    
    return {
        restoreNow: () => {
            global.Date.now = Date.now;
        }
    };
};

// Helper pour tester les components avec Material-UI
export const setupMuiTheme = () => {
    const mockCreateTheme = jest.fn().mockImplementation((theme) => ({
        ...theme,
        components: {
            MuiButton: {
                defaultProps: {
                    variant: 'contained'
                }
            }
        }
    }));
    
    return mockCreateTheme;
};

// Configuration pour les tests avec React Router
export const setupRouter = () => {
    const mockUseNavigate = jest.fn();
    const mockUseLocation = jest.fn().mockReturnValue({
        pathname: '/loans',
        search: '',
        hash: '',
        state: null,
        key: 'default'
    });
    const mockUseParams = jest.fn().mockReturnValue({});
    
    return {
        mockUseNavigate,
        mockUseLocation,
        mockUseParams
    };
};

// Helper pour tester les formulaires
export const setupFormTesting = () => {
    // Mock pour les champs de formulaire
    const mockInput = {
        value: '',
        checked: false,
        disabled: false,
        type: 'text',
        name: '',
        id: '',
        placeholder: '',
        required: false,
        focus: jest.fn(),
        blur: jest.fn(),
        select: jest.fn(),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };
    
    return {
        createInput: (type = 'text', props = {}) => ({
            ...mockInput,
            type,
            ...props
        }),
        triggerInputChange: (element, value) => {
            Object.defineProperty(element, 'value', {
                writable: true,
                configurable: true,
                value: value
            });
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };
};

// Helper pour tester les modals et dialogs
export const setupModalTesting = () => {
    const createMockPortal = (children) => {
        const portal = document.createElement('div');
        portal.setAttribute('data-testid', 'modal-portal');
        document.body.appendChild(portal);
        return portal;
    };
    
    return {
        createMockPortal,
        cleanupPortal: () => {
            const portals = document.querySelectorAll('[data-testid="modal-portal"]');
            portals.forEach(portal => portal.remove());
        }
    };
};

// Helper pour tester les callbacks asynchrones
export const setupAsyncTesting = () => {
    const waitForAsync = (timeout = 1000) => 
        new Promise(resolve => setTimeout(resolve, timeout));
    
    const waitForCondition = (condition, timeout = 1000) => 
        new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                if (condition()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Condition non satisfaite'));
                } else {
                    setTimeout(check, 10);
                }
            };
            check();
        });
    
    return {
        waitForAsync,
        waitForCondition
    };
};

// Configuration pour les tests de styles CSS
export const setupCSSTesting = () => {
    // Mock pour les styles CSS-in-JS
    const mockStyles = {
        container: 'styles_container__mock',
        button: 'styles_button__mock',
        dialog: 'styles_dialog__mock'
    };
    
    return {
        mockStyles,
        getClassName: (baseClass) => `${baseClass}__mock`
    };
};

// Helper pour les tests de localisation
export const setupLocalizationTesting = () => {
    const mockTranslations = {
        'loans.title': 'Prêts de Matériel',
        'loans.create': 'Créer un prêt',
        'loans.edit': 'Modifier le prêt',
        'loans.return': 'Retourner',
        'loans.status.active': 'Actif',
        'loans.status.overdue': 'En retard',
        'loans.status.returned': 'Retourné',
        'loans.status.reserved': 'Réservé',
        'loans.status.critical': 'Critique',
        'loans.filters.title': 'Filtres',
        'loans.export.title': 'Exporter',
        'loans.calendar.title': 'Calendrier des Prêts',
        'loans.qr.title': 'Étiquette QR Code'
    };
    
    return {
        mockTranslations,
        t: (key) => mockTranslations[key] || key
    };
};

// Configuration spécifique pour les tests de gestion utilisateurs
export const setupUserManagementTesting = () => {
    // Mock des services API pour la gestion utilisateurs
    const mockApiService = {
        refreshExcelUsers: jest.fn(() => Promise.resolve()),
        saveUserToExcel: jest.fn(() => Promise.resolve({ success: true })),
        deleteUserFromExcel: jest.fn(() => Promise.resolve({ success: true })),
        addUserToGroup: jest.fn(() => Promise.resolve({ success: true })),
        removeUserFromGroup: jest.fn(() => Promise.resolve({ success: true })),
        getAdUsersInOU: jest.fn(() => Promise.resolve([])),
        launchRdp: jest.fn(() => Promise.resolve({ success: true }))
    };

    // Mock du cache pour les utilisateurs
    const mockUserCache = {
        excel_users: {
            'user1': [{
                username: 'user1',
                displayName: 'Jean Dupont',
                email: 'jean.dupont@anecoop.com',
                department: 'IT',
                server: 'srv01',
                password: 'test123',
                officePassword: 'test456',
                adEnabled: 1
            }]
        },
        'ad_groups:VPN': [{ SamAccountName: 'user1' }],
        'ad_groups:Sortants_responsables': []
    };

    // Mock des notifications
    const mockNotifications = {
        showNotification: jest.fn()
    };

    return {
        mockApiService,
        mockUserCache,
        mockNotifications,
        createTestUser: (overrides = {}) => ({
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@anecoop.com',
            firstName: 'Test',
            lastName: 'User',
            department: 'IT',
            server: 'srv01',
            password: 'tu1234AB!',
            officePassword: 'OfficeTest123',
            adEnabled: 1,
            groups: { vpn: false, internet: false },
            ...overrides
        }),
        createTestCsvData: (count = 10, options = {}) => {
            const {
                includeErrors = false,
                includeSpecialChars = false,
                departments = ['IT', 'RH', 'Finance', 'Marketing']
            } = options;
            
            const data = [];
            
            for (let i = 1; i <= count; i++) {
                const username = includeSpecialChars && i % 10 === 0 
                    ? `user@with#special${i}` 
                    : `user${i.toString().padStart(4, '0')}`;
                
                const email = includeErrors && i % 15 === 0
                    ? 'invalid-email'
                    : `user${i}@anecoop.com`;
                
                const fullName = `Utilisateur Test ${i}`;
                const department = departments[i % departments.length];
                
                data.push({ username, email, fullName, department });
            }
            
            return data;
        }
    };
};

// Configuration pour les tests de performance
export const setupPerformanceTesting = () => {
    // Mock de performance.now pour des mesures précises
    global.performance.now = jest.fn(() => {
        const [seconds, nanoseconds] = process.hrtime();
        return seconds * 1000 + nanoseconds / 1000000;
    });

    // Fonction utilitaire pour mesurer les performances
    global.measurePerformance = async (testFunction, iterations = 1) => {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await testFunction();
            const end = performance.now();
            times.push(end - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        return { avgTime, minTime, maxTime, times };
    };

    // Fonction utilitaire pour attendre un délai
    global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Fonction pour simuler des erreurs réseau
    global.simulateNetworkError = () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => 
            Promise.reject(new Error('Network error'))
        );
        return () => {
            global.fetch = originalFetch;
        };
    };

    // Configuration pour les tests de mémoire
    if (global.gc) {
        global.cleanupMemory = () => {
            global.gc();
        };
    }
};

// Configuration pour les tests de génération de mots de passe
export const setupPasswordTesting = () => {
    // Générateur de mots de passe de test conforme aux règles Anecoop
    const generateTestRdsPassword = (firstName, lastName) => {
        const prenom = firstName.charAt(0).toLowerCase();
        const nom = lastName.charAt(0).toLowerCase();
        const digits = Math.floor(1000 + Math.random() * 9000);
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const special = '!@#$%&';
        
        const randomUpper = 
            upper[Math.floor(Math.random() * upper.length)] + 
            upper[Math.floor(Math.random() * upper.length)];
        
        const randomSpecial = special[Math.floor(Math.random() * special.length)];
        
        return `${prenom}${nom}${digits}${randomUpper}${randomSpecial}`;
    };

    // Générateur de mots de passe Office 365 de test
    const generateTestOfficePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let pwd = '';
        for (let i = 0; i < 16; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pwd;
    };

    // Évaluateur de force de mot de passe
    const evaluatePasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: 'Aucun', color: 'default' };
        
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score, label: 'Faible', color: 'error' };
        if (score <= 4) return { score, label: 'Moyen', color: 'warning' };
        return { score, label: 'Fort', color: 'success' };
    };

    return {
        generateTestRdsPassword,
        generateTestOfficePassword,
        evaluatePasswordStrength
    };
};

// Configuration pour les tests d'historique des modifications
export const setupHistoryTesting = () => {
    // Générateur d'historique de test
    const generateTestHistory = (username) => [
        {
            id: 1,
            timestamp: new Date('2025-11-02T14:30:00'),
            action: 'update',
            user: 'admin',
            changes: {
                email: { before: 'ancien@example.com', after: 'nouveau@example.com' },
                department: { before: 'IT', after: 'Marketing' }
            }
        },
        {
            id: 2,
            timestamp: new Date('2025-11-01T09:15:00'),
            action: 'password_reset',
            user: 'admin',
            changes: {
                password: { before: '********', after: '********' }
            }
        },
        {
            id: 3,
            timestamp: new Date('2025-10-30T16:45:00'),
            action: 'deactivate',
            user: 'supervisor',
            changes: {
                status: { before: 'active', after: 'inactive' }
            }
        },
        {
            id: 4,
            timestamp: new Date('2025-10-15T11:20:00'),
            action: 'create',
            user: 'admin',
            changes: {
                username: { before: null, after: username || 'user123' },
                email: { before: null, after: 'user@example.com' }
            }
        }
    ];

    // Mappage des couleurs d'actions
    const getActionColor = (action) => {
        const colors = {
            create: 'success',
            update: 'primary',
            delete: 'error',
            password_reset: 'warning',
            activate: 'success',
            deactivate: 'warning'
        };
        return colors[action] || 'default';
    };

    // Mappage des libellés d'actions
    const getActionLabel = (action) => {
        const labels = {
            create: 'Création',
            update: 'Modification',
            delete: 'Suppression',
            password_reset: 'Réinit. mot de passe',
            activate: 'Activation',
            deactivate: 'Désactivation'
        };
        return labels[action] || action;
    };

    return {
        generateTestHistory,
        getActionColor,
        getActionLabel
    };
};

// Configuration de l'environnement complet de test
export const setupTestEnvironment = () => {
    setupPerformanceTesting();
    setupPasswordTesting();
    setupHistoryTesting();
    
    // Configuration globale pour les tests
    if (process.env.NODE_ENV === 'test' && process.env.PERFORMANCE_TESTS === 'true') {
        process.env.PERFORMANCE_DATA_SIZE = 'small';
    }

    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
    process.env.REACT_APP_ENV = 'test';

    // Configuration pour les tests de debug
    if (process.env.DEBUG_TESTS === 'true') {
        global.debug = {
            log: (message, data) => {
                console.log(`🔍 [DEBUG] ${message}`, data);
            },
            error: (message, error) => {
                console.error(`❌ [DEBUG ERROR] ${message}`, error);
            },
            performance: (label, startTime) => {
                const endTime = performance.now();
                console.log(`⚡ [DEBUG PERF] ${label}: ${(endTime - startTime).toFixed(2)}ms`);
            }
        };
    } else {
        global.debug = {
            log: () => {},
            error: () => {},
            performance: () => {}
        };
    }

    console.log('🧪 User Management Test Environment configured');
};

// Export des helpers pour utilisation dans les tests
export default {
    waitForPromises,
    setupDatePicker,
    setupMuiTheme,
    setupRouter,
    setupFormTesting,
    setupModalTesting,
    setupAsyncTesting,
    setupCSSTesting,
    setupLocalizationTesting,
    setupUserManagementTesting,
    setupPerformanceTesting,
    setupPasswordTesting,
    setupHistoryTesting,
    setupTestEnvironment
};
