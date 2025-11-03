// src/tests/TestProviders.js - PROVIDERS ET HELPERS POUR LES TESTS

import React, { createContext, useContext, useState, useEffect } from 'react';
import { render } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { mockLoans, mockComputers, mockUsers, mockTechnicians } from './__mocks__/loanData';

// Mock du service API
export const mockApiService = {
    getLoans: jest.fn().mockResolvedValue(mockLoans),
    getLoanById: jest.fn().mockImplementation((id) => {
        const loan = mockLoans.find(l => l.id === id);
        return Promise.resolve(loan || null);
    }),
    createLoan: jest.fn().mockImplementation((loanData) => {
        const newLoan = { ...loanData, id: Date.now(), createdAt: new Date().toISOString() };
        mockLoans.push(newLoan);
        return Promise.resolve(newLoan);
    }),
    updateLoan: jest.fn().mockImplementation((id, loanData) => {
        const index = mockLoans.findIndex(l => l.id === id);
        if (index !== -1) {
            mockLoans[index] = { ...mockLoans[index], ...loanData, updatedAt: new Date().toISOString() };
            return Promise.resolve(mockLoans[index]);
        }
        return Promise.reject(new Error('Prêt non trouvé'));
    }),
    returnLoan: jest.fn().mockImplementation((id, notes, accessoryInfo) => {
        const loan = mockLoans.find(l => l.id === id);
        if (loan) {
            loan.status = 'returned';
            loan.actualReturnDate = new Date().toISOString();
            loan.returnNotes = notes;
            loan.accessoryInfo = accessoryInfo;
            return Promise.resolve(loan);
        }
        return Promise.reject(new Error('Prêt non trouvé'));
    }),
    extendLoan: jest.fn().mockImplementation((id, newDate, reason) => {
        const loan = mockLoans.find(l => l.id === id);
        if (loan) {
            loan.expectedReturnDate = newDate;
            loan.extensionReason = reason;
            loan.lastExtended = new Date().toISOString();
            return Promise.resolve(loan);
        }
        return Promise.reject(new Error('Prêt non trouvé'));
    }),
    cancelLoan: jest.fn().mockImplementation((id, reason) => {
        const loan = mockLoans.find(l => l.id === id);
        if (loan) {
            loan.status = 'cancelled';
            loan.cancellationReason = reason;
            loan.cancelledAt = new Date().toISOString();
            return Promise.resolve(loan);
        }
        return Promise.reject(new Error('Prêt non trouvé'));
    }),
    getLoanHistory: jest.fn().mockResolvedValue([]),
    exportLoans: jest.fn().mockResolvedValue(true),
    generateQRCode: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode')
};

// Mock du contexte de l'application
const MockAppContext = createContext();

const MockAppProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [currentUser] = useState({
        id: 1,
        name: 'Utilisateur Test',
        role: 'admin',
        department: 'Informatique'
    });

    const showNotification = (type, message, duration = 5000) => {
        const notification = {
            id: Date.now(),
            type,
            message,
            timestamp: new Date().toISOString()
        };
        setNotifications(prev => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, duration);
        }
    };

    const value = {
        showNotification,
        notifications,
        currentUser,
        isLoading: false,
        error: null
    };

    return (
        <MockAppContext.Provider value={value}>
            {children}
        </MockAppContext.Provider>
    );
};

// Mock du contexte de cache
const MockCacheContext = createContext();

const MockCacheProvider = ({ children }) => {
    const [cache, setCache] = useState({
        loans: mockLoans,
        computers: mockComputers,
        users: mockUsers,
        excel_users: { sheet1: mockUsers },
        config: {
            it_staff: mockTechnicians,
            company_name: 'Anecoop',
            version: '1.0.0'
        }
    });
    const [isLoading, setIsLoading] = useState(false);

    const invalidate = (key) => {
        if (key === 'loans') {
            // Simuler un rechargement des données
            setCache(prev => ({ ...prev, loans: [...mockLoans] }));
        }
    };

    const value = {
        cache,
        isLoading,
        invalidate,
        setCache
    };

    return (
        <MockCacheContext.Provider value={value}>
            {children}
        </MockCacheContext.Provider>
    );
};

// Provider de test complet
export const TestProviders = ({ children, mockData }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <MockAppProvider>
                <MockCacheProvider>
                    {children}
                </MockCacheProvider>
            </MockAppProvider>
        </LocalizationProvider>
    );
};

// Helper pour les tests avec rendu
export const renderWithProviders = (ui, options = {}) => {
    const { mockData: data, ...renderOptions } = options;
    
    const Wrapper = ({ children }) => (
        <TestProviders mockData={data}>
            {children}
        </TestProviders>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper pour les tests avec mocked API
export const renderWithMockedApi = (ui, options = {}) => {
    const { apiOverrides = {}, ...renderOptions } = options;
    
    // Appliquer les overrides
    Object.keys(apiOverrides).forEach(key => {
        if (mockApiService[key]) {
            mockApiService[key] = apiOverrides[key];
        }
    });

    const Wrapper = ({ children }) => (
        <TestProviders>
            {children}
        </TestProviders>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper pour simuler des delays
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper pour attendre que le DOM soit stable
export const waitForStable = () => new Promise(resolve => setTimeout(resolve, 100));

// Helper pour créer un élément DOM simulé
export const createMockElement = (tag, props = {}, children = []) => {
    const element = {
        tag,
        props,
        children,
        textContent: props.textContent || '',
        innerHTML: props.innerHTML || '',
        getAttribute: jest.fn((attr) => props[attr] || null),
        setAttribute: jest.fn(),
        click: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        focus: jest.fn(),
        blur: jest.fn(),
        value: props.value || '',
        checked: props.checked || false,
        disabled: props.disabled || false
    };
    
    // Ajouter les propriétés DOM communes
    Object.assign(element, {
        parentNode: null,
        nextSibling: null,
        previousSibling: null,
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn(),
            contains: jest.fn()
        },
        style: {
            setProperty: jest.fn(),
            getPropertyValue: jest.fn(() => ''),
            removeProperty: jest.fn()
        }
    });
    
    return element;
};

// Helper pour simuler une erreur réseau
export const simulateNetworkError = () => {
    const error = new Error('Erreur réseau');
    error.code = 'NETWORK_ERROR';
    error.status = 500;
    return error;
};

// Helper pour simuler une validation d'erreur
export const simulateValidationError = (field, message) => {
    const error = new Error(`Validation error: ${field} - ${message}`);
    error.code = 'VALIDATION_ERROR';
    error.field = field;
    error.message = message;
    return error;
};

// Helper pour simuler une permission denied error
export const simulatePermissionError = () => {
    const error = new Error('Permission refusée');
    error.code = 'PERMISSION_DENIED';
    error.status = 403;
    return error;
};

// Helper pour les tests de formulaires
export const createFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });
    return formData;
};

// Helper pour les tests de drag and drop
export const simulateDragAndDrop = (element, targetElement) => {
    const dragEvent = new DragEvent('dragstart', { bubbles: true });
    const dropEvent = new DragEvent('drop', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
            setData: jest.fn(),
            getData: jest.fn(),
            effectAllowed: 'move'
        }
    });
    
    Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
            getData: jest.fn(() => JSON.stringify({ id: element.dataset.id })),
            effectAllowed: 'move'
        }
    });
    
    fireEvent.dragStart(element, dragEvent);
    fireEvent.drop(targetElement, dropEvent);
};

// Helper pour les tests de clipboard
export const simulateClipboard = (text) => {
    Object.assign(navigator.clipboard, {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue(text)
    });
    
    Object.assign(document, {
        execCommand: jest.fn().mockReturnValue(true)
    });
};

// Helper pour les tests de performance
export const measurePerformance = (fn, iterations = 1) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        times.push(end - start);
    }
    
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { average, min, max, times };
};

// Helper pour les tests de mémoire
export const checkMemoryUsage = () => {
    if (performance.memory) {
        return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
    }
    return null;
};

// Hook personnalisé pour les tests
export const useTestHelpers = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const executeAsync = async (fn) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await fn();
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };
    
    const waitForCondition = async (condition, timeout = 5000, interval = 100) => {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return true;
            }
            await delay(interval);
        }
        
        throw new Error(`Condition non satisfaite après ${timeout}ms`);
    };
    
    return {
        isLoading,
        error,
        executeAsync,
        waitForCondition,
        delay,
        waitForStable
    };
};

// Export des contextes pour utilisation directe
export const useMockApp = () => useContext(MockAppContext);
export const useMockCache = () => useContext(MockCacheContext);

// Export des mocks pour réinitialisation
export const resetAllMocks = () => {
    jest.clearAllMocks();
    Object.values(mockApiService).forEach(mock => {
        if (mock.mockReset) {
            mock.mockReset();
        }
    });
};

// Configuration avant chaque test
export const setupTestEnvironment = () => {
    // Configuration global pour les tests
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
    
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
    
    // Configuration pour jsdom
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
};

export default {
    TestProviders,
    renderWithProviders,
    renderWithMockedApi,
    mockApiService,
    useTestHelpers,
    setupTestEnvironment,
    resetAllMocks,
    delay,
    waitForStable,
    createMockElement,
    simulateNetworkError,
    simulateValidationError,
    simulatePermissionError,
    createFormData,
    simulateDragAndDrop,
    simulateClipboard,
    measurePerformance,
    checkMemoryUsage
};
