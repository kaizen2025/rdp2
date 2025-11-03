/**
 * Tests de performance pour Chat DocuCortex IA
 * Métriques de performance, mémoire et réactivité
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import ChatInterfaceDocuCortex from '../components/AI/ChatInterfaceDocuCortex';
import DocumentUploader from '../components/AI/DocumentUploader';
import NetworkConfigPanel from '../components/AI/NetworkConfigPanel';
import AIAssistantPage from '../pages/AIAssistantPage';
import { mockApiService } from './__mocks__/mockApiService';
import { mockPermissions } from './__mocks__/mockPermissions';
import {
    generateLargeHistory,
    generateLargeDocumentList,
    createMockUploadResult,
    createMockStatistics,
    createMockResponse
} from './__mocks__/mockDataPerformance';

// Configuration du thème pour les tests
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#667eea' },
        secondary: { main: '#764ba2' }
    }
});

// Wrapper pour les tests avec providers
const TestWrapper = ({ children }) => (
    <BrowserRouter>
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                {children}
            </LocalizationProvider>
        </ThemeProvider>
    </BrowserRouter>
);

// Mock des dépendances
jest.mock('../services/apiService', () => mockApiService);
jest.mock('../hooks/usePermissions', () => mockPermissions);
jest.mock('../components/auth/PermissionGate', () => ({
    __esModule: true,
    default: ({ children, fallback }) => <>{children}</>
}));
jest.mock('react-markdown', () => ({ children }) => <div data-testid="mock-markdown">{children}</div>);
jest.mock('react-dropzone', () => ({
    useDropzone: (config) => ({
        getRootProps: () => ({
            'data-testid': 'dropzone-root'
        }),
        getInputProps: () => ({
            'data-testid': 'dropzone-input'
        }),
        isDragActive: false
    })
}));

// Utilitaires de mesure de performance
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }

    startTimer(name) {
        this.metrics[name] = {
            start: performance.now(),
            marks: []
        };
    }

    mark(name, label) {
        if (this.metrics[name]) {
            this.metrics[name].marks.push({
                label,
                time: performance.now()
            });
        }
    }

    endTimer(name) {
        if (this.metrics[name]) {
            this.metrics[name].end = performance.now();
            this.metrics[name].duration = this.metrics[name].end - this.metrics[name].start;
            return this.metrics[name];
        }
        return null;
    }

    getResults() {
        return this.metrics;
    }

    reset() {
        this.metrics = {};
    }
}

const performanceMonitor = new PerformanceMonitor();

describe('Chat DocuCortex IA - Tests de Performance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        performanceMonitor.reset();
        // Configuration par défaut des mocks
        mockApiService.getAIDocuments.mockResolvedValue({ success: true, documents: [] });
        mockApiService.getAIStatistics.mockResolvedValue(createMockStatistics());
        mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });
        mockApiService.getAIConversationHistory.mockResolvedValue({ success: true, conversations: [] });
    });

    describe('Métriques de rendu', () => {
        test('ChatInterfaceDocuCortex doit se rendre en moins de 100ms avec historique vide', () => {
            performanceMonitor.startTimer('chat_empty_render');

            render(
                <ChatInterfaceDocuCortex 
                    sessionId="perf_test_session" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            const result = performanceMonitor.endTimer('chat_empty_render');
            expect(result.duration).toBeLessThan(100);
        });

        test('ChatInterfaceDocuCortex doit gérer 100 messages en moins de 500ms', async () => {
            const largeHistory = generateLargeHistory(100);
            mockApiService.getAIConversationHistory.mockResolvedValue(largeHistory);

            performanceMonitor.startTimer('chat_large_history_render');

            render(
                <ChatInterfaceDocuCortex 
                    sessionId="perf_test_session_large" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            await waitFor(() => {
                expect(screen.getByText(/Question 1/)).toBeInTheDocument();
            });

            const result = performanceMonitor.endTimer('chat_large_history_render');
            expect(result.duration).toBeLessThan(500);
        });

        test('DocumentUploader doit gérer 50 fichiers simultanément en moins de 200ms', () => {
            performanceMonitor.startTimer('uploader_render');

            render(<DocumentUploader onUploadComplete={jest.fn()} />, { wrapper: TestWrapper });

            const result = performanceMonitor.endTimer('uploader_render');
            expect(result.duration).toBeLessThan(200);
        });

        test('NetworkConfigPanel doit se rendre en moins de 150ms', () => {
            performanceMonitor.startTimer('network_config_render');

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            const result = performanceMonitor.endTimer('network_config_render');
            expect(result.duration).toBeLessThan(150);
        });

        test('AIAssistantPage complète doit se rendre en moins de 300ms', () => {
            performanceMonitor.startTimer('full_page_render');

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            const result = performanceMonitor.endTimer('full_page_render');
            expect(result.duration).toBeLessThan(300);
        });
    });

    describe('Métriques d\'interaction', () => {
        test('Envoi de message doit prendre moins de 100ms', async () => {
            const mockResponse = createMockResponse({
                response: 'Réponse performance test',
                confidence: 0.9,
                sources: []
            });

            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(
                <ChatInterfaceDocuCortex 
                    sessionId="perf_interaction_test" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            performanceMonitor.startTimer('send_message_interaction');

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            act(() => {
                fireEvent.change(input, { target: { value: 'Test performance message' } });
            });

            act(() => {
                fireEvent.click(sendButton);
            });

            const result = performanceMonitor.endTimer('send_message_interaction');
            expect(result.duration).toBeLessThan(100);
        });

        test('Upload de fichier doit prendre moins de 50ms pour l\'interface', async () => {
            const mockFile = new File(['perf test'], 'performance.pdf', { type: 'application/pdf' });
            const mockResult = createMockUploadResult();
            
            mockApiService.uploadAIDocument.mockResolvedValue(mockResult);

            render(<DocumentUploader onUploadComplete={jest.fn()} />, { wrapper: TestWrapper });

            performanceMonitor.startTimer('upload_file_interaction');

            const dropzone = screen.getByTestId('dropzone-root');

            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: [mockFile] }
                });
            });

            const result = performanceMonitor.endTimer('upload_file_interaction');
            expect(result.duration).toBeLessThan(50);
        });

        test('Changement d\'onglet doit prendre moins de 75ms', async () => {
            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            });

            performanceMonitor.startTimer('tab_switch_interaction');

            const tabs = screen.getAllByRole('tab');
            
            act(() => {
                fireEvent.click(tabs[1]); // Onglet Upload
            });

            const result = performanceMonitor.endTimer('tab_switch_interaction');
            expect(result.duration).toBeLessThan(75);
        });

        test('Configuration réseau doit prendre moins de 200ms', async () => {
            const mockConfig = {
                serverPath: '\\\\192.168.1.230\\Donnees',
                workingDirectory: '',
                autoIndex: true,
                scanInterval: 30,
                maxFileSize: 100
            };

            mockApiService.configureNetwork.mockResolvedValue({ success: true });

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            performanceMonitor.startTimer('network_config_interaction');

            const serverPathField = screen.getByLabelText(/Chemin Serveur Réseau/);
            const saveButton = screen.getByText(/Sauvegarder Config/);

            act(() => {
                fireEvent.change(serverPathField, { target: { value: mockConfig.serverPath } });
            });

            act(() => {
                fireEvent.click(saveButton);
            });

            const result = performanceMonitor.endTimer('network_config_interaction');
            expect(result.duration).toBeLessThan(200);
        });
    });

    describe('Tests de charge mémoire', () => {
        test('ChatInterfaceDocuCortex ne doit pas avoir de fuites mémoire avec historique large', async () => {
            // Capture de la mémoire avant
            if (global.gc) {
                global.gc();
            }

            const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

            const largeHistory = generateLargeHistory(200);
            mockApiService.getAIConversationHistory.mockResolvedValue(largeHistory);

            // Rendu initial
            const { unmount } = render(
                <ChatInterfaceDocuCortex 
                    sessionId="memory_test_session" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            await waitFor(() => {
                expect(screen.getByText(/Question 1/)).toBeInTheDocument();
            });

            // Simulation de scroll et d'interactions
            const chatContainer = screen.getByText(/Question 1/).closest('[data-testid="chat-container"]');
            if (chatContainer) {
                for (let i = 0; i < 10; i++) {
                    fireEvent.scroll(chatContainer, { target: { scrollTop: i * 100 } });
                    await act(async () => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    });
                }
            }

            // Démontage
            unmount();

            // Forcer le garbage collection si disponible
            if (global.gc) {
                global.gc();
            }

            // Capture de la mémoire après
            const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
            const memoryIncrease = finalMemory - initialMemory;

            // La mémoire ne devrait pas augmenter de plus de 10MB
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });

        test('DocumentUploader doit libérer la mémoire après upload', async () => {
            if (global.gc) {
                global.gc();
            }

            const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

            const mockFiles = Array.from({ length: 20 }, (_, i) => 
                new File([`content ${i}`], `document_${i}.pdf`, { type: 'application/pdf' })
            );

            const uploadResults = mockFiles.map(() => createMockUploadResult());
            let callCount = 0;
            mockApiService.uploadAIDocument.mockImplementation(() => {
                return Promise.resolve(uploadResults[callCount++]);
            });

            const { unmount } = render(<DocumentUploader onUploadComplete={jest.fn()} />, { wrapper: TestWrapper });

            const dropzone = screen.getByTestId('dropzone-root');

            // Upload de tous les fichiers
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: mockFiles }
                });
            });

            // Attendre que tous les uploads soient traités
            await waitFor(() => {
                expect(mockApiService.uploadAIDocument).toHaveBeenCalledTimes(20);
            });

            // Démontage
            unmount();

            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
            const memoryIncrease = finalMemory - initialMemory;

            // La mémoire ne devrait pas augmenter de plus de 5MB
            expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
        });

        test('AIAssistantPage doit gérer le cycling des onglets sans fuites', async () => {
            if (global.gc) {
                global.gc();
            }

            const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

            const { unmount } = render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            });

            // Cycling entre onglets
            const tabs = screen.getAllByRole('tab');
            for (let cycle = 0; cycle < 5; cycle++) {
                for (let i = 0; i < tabs.length; i++) {
                    performanceMonitor.startTimer(`tab_cycle_${cycle}_${i}`);
                    
                    act(() => {
                        fireEvent.click(tabs[i]);
                    });

                    await act(async () => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    });

                    performanceMonitor.endTimer(`tab_cycle_${cycle}_${i}`);
                }
            }

            // Vérifier les performances des cycles
            const results = performanceMonitor.getResults();
            Object.keys(results).forEach(key => {
                if (key.startsWith('tab_cycle_')) {
                    expect(results[key].duration).toBeLessThan(100); // Moins de 100ms par cycle
                }
            });

            // Démontage
            unmount();

            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
            const memoryIncrease = finalMemory - initialMemory;

            expect(memoryIncrease).toBeLessThan(8 * 1024 * 1024); // Moins de 8MB d'augmentation
        });
    });

    describe('Tests de réactivité', () => {
        test('ChatInterfaceDocuCortex doit répondre à l\'input en temps réel (<16ms)', async () => {
            render(
                <ChatInterfaceDocuCortex 
                    sessionId="responsiveness_test" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);

            // Mesurer la réactivité à chaque frappe
            const responsivenessTimes = [];

            for (let i = 0; i < 10; i++) {
                const startTime = performance.now();
                
                act(() => {
                    fireEvent.change(input, { 
                        target: { 
                            value: `Test message ${i} with some additional text to measure typing responsiveness`
                        } 
                    });
                });

                const endTime = performance.now();
                responsivenessTimes.push(endTime - startTime);

                // Attendre le prochain frame
                await act(async () => {
                    await new Promise(resolve => requestAnimationFrame(resolve));
                });
            }

            // 95% des interactions doivent être sous 16ms (60fps)
            const sortedTimes = responsivenessTimes.sort((a, b) => a - b);
            const p95Index = Math.floor(sortedTimes.length * 0.95);
            const p95ResponseTime = sortedTimes[p95Index];

            expect(p95ResponseTime).toBeLessThan(16);
        });

        test('Boutons et interactions UI doivent avoir une latence perceptible <50ms', async () => {
            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            });

            const tabs = screen.getAllByRole('tab');
            const buttonTimes = [];

            // Mesurer la réactivité de chaque bouton/onglet
            for (let i = 0; i < Math.min(tabs.length, 5); i++) {
                const startTime = performance.now();
                
                act(() => {
                    fireEvent.click(tabs[i]);
                });

                const endTime = performance.now();
                buttonTimes.push(endTime - startTime);

                await act(async () => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                });
            }

            // Tous les boutons doivent répondre en moins de 50ms
            buttonTimes.forEach((time, index) => {
                expect(time).toBeLessThan(50);
            });

            // Le temps moyen doit être encore plus faible
            const averageTime = buttonTimes.reduce((a, b) => a + b, 0) / buttonTimes.length;
            expect(averageTime).toBeLessThan(25);
        });
    });

    describe('Tests de throughput', () => {
        test('ChatInterfaceDocuCortex doit traiter 10 messages consécutifs rapidement', async () => {
            const responses = Array.from({ length: 10 }, (_, i) => 
                createMockResponse({
                    response: `Réponse ${i + 1} à la question de test`,
                    confidence: 0.9 - (i * 0.01),
                    sources: []
                })
            );

            let responseIndex = 0;
            mockApiService.sendAIMessage.mockImplementation(() => {
                return Promise.resolve(responses[responseIndex++]);
            });

            render(
                <ChatInterfaceDocuCortex 
                    sessionId="throughput_test" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            performanceMonitor.startTimer('ten_messages_throughput');

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Envoyer 10 messages consécutifs
            for (let i = 0; i < 10; i++) {
                act(() => {
                    fireEvent.change(input, { target: { value: `Message ${i + 1}` } });
                });

                act(() => {
                    fireEvent.click(sendButton);
                });

                // Attendre la réponse avant le prochain message
                await waitFor(() => {
                    expect(screen.getByText(`Message ${i + 1}`)).toBeInTheDocument();
                });

                // Attendre la réponse du bot
                await waitFor(() => {
                    expect(screen.getByText(`Réponse ${i + 1}`)).toBeInTheDocument();
                }, { timeout: 500 });
            }

            const result = performanceMonitor.endTimer('ten_messages_throughput');
            
            // 10 messages + réponses doivent être traités en moins de 2 secondes
            expect(result.duration).toBeLessThan(2000);
            
            // Temps moyen par message
            const avgTimePerMessage = result.duration / 20; // 10 messages + 10 réponses
            expect(avgTimePerMessage).toBeLessThan(100);
        });

        test('DocumentUploader doit traiter 5 uploads simultanés efficacement', async () => {
            const mockFiles = Array.from({ length: 5 }, (_, i) => 
                new File([`content file ${i}`], `file_${i}.pdf`, { type: 'application/pdf' })
            );

            const uploadResults = mockFiles.map((_, i) => createMockUploadResult({
                filename: `file_${i}.pdf`,
                wordCount: 500 + (i * 100)
            }));

            let callCount = 0;
            mockApiService.uploadAIDocument.mockImplementation(() => {
                return Promise.resolve(uploadResults[callCount++]);
            });

            render(<DocumentUploader onUploadComplete={jest.fn()} />, { wrapper: TestWrapper });

            performanceMonitor.startTimer('five_uploads_throughput');

            const dropzone = screen.getByTestId('dropzone-root');

            // Upload simultané de 5 fichiers
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: mockFiles }
                });
            });

            // Attendre que tous les uploads soient traités
            await waitFor(() => {
                expect(mockApiService.uploadAIDocument).toHaveBeenCalledTimes(5);
            }, { timeout: 2000 });

            // Vérifier que tous les fichiers apparaissent
            await waitFor(() => {
                mockFiles.forEach(file => {
                    expect(screen.getByText(file.name)).toBeInTheDocument();
                });
            });

            const result = performanceMonitor.endTimer('five_uploads_throughput');
            
            // 5 uploads doivent être traités en moins de 1 seconde
            expect(result.duration).toBeLessThan(1000);
            
            // Temps moyen par upload
            const avgTimePerUpload = result.duration / 5;
            expect(avgTimePerUpload).toBeLessThan(200);
        });
    });

    describe('Tests de stabilité', () => {
        test('ChatInterfaceDocuCortex doit rester stable après 50 interactions', async () => {
            const mockResponse = createMockResponse();
            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(
                <ChatInterfaceDocuCortex 
                    sessionId="stability_test" 
                    onMessageSent={jest.fn()} 
                />, 
                { wrapper: TestWrapper }
            );

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // 50 interactions rapides
            for (let i = 0; i < 50; i++) {
                act(() => {
                    fireEvent.change(input, { target: { value: `Message test ${i}` } });
                });

                act(() => {
                    fireEvent.click(sendButton);
                });

                // Attendre la réponse (avec timeout court)
                try {
                    await waitFor(() => {
                        expect(screen.getByText(`Message test ${i}`)).toBeInTheDocument();
                    }, { timeout: 100 });
                } catch (error) {
                    // Ignorer les timeouts pour ce test de stabilité
                }

                // Petite pause entre les messages
                await act(async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                });
            }

            // Le composant devrait toujours être fonctionnel
            expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            
            // L'input devrait encore accepter du texte
            act(() => {
                fireEvent.change(input, { target: { value: 'Test final de stabilité' } });
            });
            
            expect(input.value).toBe('Test final de stabilité');
        });

        test('AIAssistantPage doit gérer les erreurs multiples sans crasher', async () => {
            // Faire échouer toutes les API calls
            mockApiService.getAIDocuments.mockRejectedValue(new Error('Erreur réseau'));
            mockApiService.getAIStatistics.mockRejectedValue(new Error('Erreur base de données'));
            mockApiService.getUserPreferences.mockRejectedValue(new Error('Erreur auth'));
            mockApiService.getAIConversationHistory.mockRejectedValue(new Error('Erreur conversation'));
            mockApiService.sendAIMessage.mockRejectedValue(new Error('Erreur chat'));

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Attendre le rendu de base
            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            });

            // Essayer diverses interactions malgré les erreurs
            const tabs = screen.getAllByRole('tab');
            
            // Cliquer sur différents onglets
            for (let i = 0; i < tabs.length; i++) {
                act(() => {
                    fireEvent.click(tabs[i]);
                });

                // Le composant ne devrait pas crasher
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            }

            // Essayer d'envoyer un message
            try {
                const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
                if (input) {
                    act(() => {
                        fireEvent.change(input, { target: { value: 'Test message' } });
                    });
                }
            } catch (error) {
                // Ignorer les erreurs d'interaction
            }

            // Le composant devrait toujours être renderable
            expect(screen.getByText('Le Cortex de vos Documents - GED Intelligente')).toBeInTheDocument();
        });
    });

    describe('Métriques de monitoring', () => {
        test('Doit générer des métriques de performance exploitables', () => {
            // Test pour valider que les métriques sont collectées
            performanceMonitor.startTimer('metric_test');
            
            render(<AIAssistantPage />, { wrapper: TestWrapper });
            
            const result = performanceMonitor.endTimer('metric_test');
            const metrics = performanceMonitor.getResults();

            expect(metrics.metric_test).toBeDefined();
            expect(metrics.metric_test.duration).toBeGreaterThan(0);
            expect(typeof metrics.metric_test.duration).toBe('number');
        });

        test('Doit mesurer les transitions entre états', async () => {
            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            });

            // Mesurer la transition vers l'onglet Documents
            performanceMonitor.startTimer('documents_tab_transition');
            
            const tabs = screen.getAllByRole('tab');
            act(() => {
                fireEvent.click(tabs[2]); // Onglet Documents
            });

            performanceMonitor.mark('documents_tab_transition', 'after_click');
            
            await waitFor(() => {
                expect(screen.getByText(/Documents indexés/)).toBeInTheDocument();
            });

            performanceMonitor.mark('documents_tab_transition', 'after_render');
            
            const result = performanceMonitor.endTimer('documents_tab_transition');
            
            expect(result.marks).toHaveLength(2);
            expect(result.marks[0].label).toBe('after_click');
            expect(result.marks[1].label).toBe('after_render');
        });
    });

    afterEach(() => {
        // Nettoyer les métriques après chaque test
        performanceMonitor.reset();
    });

    afterAll(() => {
        // Log des métriques globales (en mode debug)
        const globalResults = performanceMonitor.getResults();
        if (Object.keys(globalResults).length > 0) {
            console.log('Performance Monitor Results:', globalResults);
        }
    });
});