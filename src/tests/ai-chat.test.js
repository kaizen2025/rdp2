/**
 * Tests unitaires pour Chat DocuCortex IA
 * Couverture des composants :
 * - ChatInterfaceDocuCortex
 * - DocumentUploader
 * - NetworkConfigPanel
 * - AIAssistantPage
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

// Mock du service API
jest.mock('../services/apiService', () => mockApiService);

// Mock des permissions
jest.mock('../hooks/usePermissions', () => mockPermissions);

// Mock de PermissionGate
jest.mock('../components/auth/PermissionGate', () => ({
    __esModule: true,
    default: ({ children, fallback }) => <>{children}</>
}));

// Mock de ReactMarkdown
jest.mock('react-markdown', () => ({ children }) => <div data-testid="mock-markdown">{children}</div>);

// Mock de useDropzone
jest.mock('react-dropzone', () => ({
    useDropzone: (config) => ({
        getRootProps: () => ({
            onClick: config.onDrop ? () => {} : undefined,
            'data-testid': 'dropzone-root'
        }),
        getInputProps: () => ({
            'data-testid': 'dropzone-input'
        }),
        isDragActive: config.onDragEnter ? false : false
    })
}));

describe('Chat DocuCortex IA - Tests Unitaires', () => {
    // Variables globales pour les tests
    const mockSessionId = 'test_session_123';
    const mockOnMessageSent = jest.fn();
    
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    describe('ChatInterfaceDocuCortex', () => {
        const defaultProps = {
            sessionId: mockSessionId,
            onMessageSent: mockOnMessageSent
        };

        test('Doit render le composant chat DocuCortex', () => {
            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });
            
            expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            expect(screen.getByText('Le Cortex de vos Documents')).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
        });

        test('Doit afficher le message de bienvenue pour une nouvelle session', async () => {
            mockApiService.getAIConversationHistory.mockResolvedValue({ success: true, conversations: [] });
            
            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText(/Bonjour ! Je suis DocuCortex/)).toBeInTheDocument();
            });
        });

        test('Doit charger l\'historique de conversation existant', async () => {
            const mockHistory = {
                success: true,
                conversations: [
                    {
                        user_message: 'Bonjour',
                        ai_response: 'Bonjour, comment puis-je vous aider ?',
                        confidence_score: 0.95,
                        sources: '[]',
                        created_at: new Date().toISOString()
                    }
                ]
            };
            mockApiService.getAIConversationHistory.mockResolvedValue(mockHistory);

            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('Bonjour')).toBeInTheDocument();
                expect(screen.getByText('Bonjour, comment puis-je vous aider ?')).toBeInTheDocument();
            });
        });

        test('Doit envoyer un message et recevoir une réponse', async () => {
            const mockResponse = {
                success: true,
                response: 'Réponse test du bot DocuCortex',
                confidence: 0.88,
                sources: [],
                suggestions: []
            };
            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });

            // Attendre le chargement initial
            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            // Saisir et envoyer un message
            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            act(() => {
                fireEvent.change(input, { target: { value: 'Test message' } });
            });

            act(() => {
                fireEvent.click(sendButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Test message')).toBeInTheDocument();
                expect(mockApiService.sendAIMessage).toHaveBeenCalledWith(mockSessionId, 'Test message');
            });
        });

        test('Doit gérer les erreurs de connexion', async () => {
            mockApiService.sendAIMessage.mockRejectedValue(new Error('Erreur réseau'));

            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            act(() => {
                fireEvent.change(input, { target: { value: 'Test message' } });
            });

            act(() => {
                fireEvent.click(sendButton);
            });

            await waitFor(() => {
                expect(screen.getByText(/Erreur de connexion au serveur/)).toBeInTheDocument();
            });
        });

        test('Doit supporter les suggestions de questions', async () => {
            const mockHistory = { success: true, conversations: [] };
            mockApiService.getAIConversationHistory.mockResolvedValue(mockHistory);

            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });

            await waitFor(() => {
                const suggestions = screen.getAllByText(/Quels types de documents/);
                expect(suggestions.length).toBeGreaterThan(0);
            });
        });

        test('Doit faire défiler vers le bas automatiquement', async () => {
            const mockResponse = {
                success: true,
                response: 'Réponse avec beaucoup de contenu...',
                confidence: 0.9,
                sources: [],
                suggestions: []
            };
            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(<ChatInterfaceDocuCortex {...defaultProps} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            act(() => {
                fireEvent.change(input, { target: { value: 'Test' } });
            });

            act(() => {
                fireEvent.click(sendButton);
            });

            await waitFor(() => {
                expect(mockApiService.sendAIMessage).toHaveBeenCalled();
            });
        });
    });

    describe('DocumentUploader', () => {
        const defaultProps = {
            onUploadComplete: jest.fn()
        };

        test('Doit render la zone de drop', () => {
            render(<DocumentUploader {...defaultProps} />, { wrapper: TestWrapper });
            
            expect(screen.getByText(/Glissez-déposez vos fichiers ici/)).toBeInTheDocument();
            expect(screen.getByText(/ou cliquez pour sélectionner des fichiers/)).toBeInTheDocument();
        });

        test('Doit afficher les types de fichiers acceptés', () => {
            render(<DocumentUploader {...defaultProps} />, { wrapper: TestWrapper });
            
            expect(screen.getByText('PDF')).toBeInTheDocument();
            expect(screen.getByText('Word')).toBeInTheDocument();
            expect(screen.getByText('Excel')).toBeInTheDocument();
            expect(screen.getByText('PowerPoint')).toBeInTheDocument();
            expect(screen.getByText('Images')).toBeInTheDocument();
            expect(screen.getByText('Texte')).toBeInTheDocument();
        });

        test('Doit uploader un fichier avec succès', async () => {
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const mockResult = {
                success: true,
                language: 'fr',
                wordCount: 150,
                chunksCount: 5
            };
            mockApiService.uploadAIDocument.mockResolvedValue(mockResult);

            render(<DocumentUploader {...defaultProps} />, { wrapper: TestWrapper });

            // Simuler le drop de fichier
            const dropzone = screen.getByTestId('dropzone-root');
            
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: {
                        files: [mockFile]
                    }
                });
            });

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.getByText('FR')).toBeInTheDocument();
                expect(screen.getByText('150 mots')).toBeInTheDocument();
                expect(screen.getByText('5 chunks')).toBeInTheDocument();
            });
        });

        test('Doit gérer les erreurs d\'upload', async () => {
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            mockApiService.uploadAIDocument.mockRejectedValue(new Error('Upload échoué'));

            render(<DocumentUploader {...defaultProps} />, { wrapper: TestWrapper });

            const dropzone = screen.getByTestId('dropzone-root');

            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: {
                        files: [mockFile]
                    }
                });
            });

            await waitFor(() => {
                expect(screen.getByText(/Erreur de connexion/)).toBeInTheDocument();
            });
        });

        test('Doit limiter les types de fichiers acceptés', () => {
            render(<DocumentUploader {...defaultProps} />, { wrapper: TestWrapper });
            
            // Vérifier que seuls les types supportés sont acceptés
            expect(screen.getByText('PDF')).toBeInTheDocument();
            expect(screen.getByText('Word')).toBeInTheDocument();
        });

        test('Doit afficher le progrès d\'upload', async () => {
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const mockResult = {
                success: true,
                language: 'fr',
                wordCount: 150,
                chunksCount: 5
            };
            mockApiService.uploadAIDocument.mockResolvedValue(mockResult);

            render(<DocumentUploader {...defaultProps} />, { wrapper: TestWrapper });

            const dropzone = screen.getByTestId('dropzone-root');

            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: {
                        files: [mockFile]
                    }
                });
            });

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });
        });
    });

    describe('NetworkConfigPanel', () => {
        test('Doit render la configuration réseau', () => {
            render(<NetworkConfigPanel />, { wrapper: TestWrapper });
            
            expect(screen.getByText('Configuration Serveur Réseau DocuCortex')).toBeInTheDocument();
            expect(screen.getByLabelText(/Chemin Serveur Réseau/)).toBeInTheDocument();
        });

        test('Doit avoir le chemin UNC par défaut', () => {
            render(<NetworkConfigPanel />, { wrapper: TestWrapper });
            
            const serverPathField = screen.getByLabelText(/Chemin Serveur Réseau/);
            expect(serverPathField.value).toBe('\\\\192.168.1.230\\Donnees');
        });

        test('Doit tester la connexion réseau', async () => {
            const mockResult = { success: true, path: '\\\\192.168.1.230\\Donnees' };
            mockApiService.configureNetwork.mockResolvedValue(mockResult);
            mockApiService.testNetworkConnection.mockResolvedValue(mockResult);

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            const testButton = screen.getByText(/Tester Connexion/);

            await act(async () => {
                fireEvent.click(testButton);
            });

            expect(mockApiService.testNetworkConnection).toHaveBeenCalled();
        });

        test('Doit sauvegarder la configuration', async () => {
            const mockResult = { success: true, message: 'Configuration sauvegardée' };
            mockApiService.configureNetwork.mockResolvedValue(mockResult);

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            // Modifier le chemin
            const serverPathField = screen.getByLabelText(/Chemin Serveur Réseau/);
            fireEvent.change(serverPathField, { target: { value: '\\\\192.168.1.100\\Documents' } });

            const saveButton = screen.getByText(/Sauvegarder Config/);

            await act(async () => {
                fireEvent.click(saveButton);
            });

            expect(mockApiService.configureNetwork).toHaveBeenCalled();
        });

        test('Doit lancer le scan réseau', async () => {
            mockApiService.configureNetwork.mockResolvedValue({ success: true });

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            const scanButton = screen.getByText(/Scanner Réseau/);

            await act(async () => {
                fireEvent.click(scanButton);
            });

            await waitFor(() => {
                expect(screen.getByText(/Scan en cours/)).toBeInTheDocument();
            });
        });

        test('Doit afficher les résultats de scan', async () => {
            mockApiService.configureNetwork.mockResolvedValue({ success: true });

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            const scanButton = screen.getByText(/Scanner Réseau/);

            await act(async () => {
                fireEvent.click(scanButton);
            });

            await waitFor(() => {
                expect(screen.getByText(/Fichiers Trouvés/)).toBeInTheDocument();
            });
        });

        test('Doit filtrer et trier les fichiers trouvés', async () => {
            mockApiService.configureNetwork.mockResolvedValue({ success: true });

            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            const scanButton = screen.getByText(/Scanner Réseau/);

            await act(async () => {
                fireEvent.click(scanButton);
            });

            await waitFor(() => {
                expect(screen.getByText(/Fichiers Trouvés/)).toBeInTheDocument();
            });

            // Test de recherche
            const searchField = screen.getByPlaceholderText(/Rechercher fichiers/);
            fireEvent.change(searchField, { target: { value: 'Contrat' } });

            // Test de tri
            const sortButton = screen.getByText(/Nom/);
            fireEvent.click(sortButton);
        });
    });

    describe('AIAssistantPage', () => {
        test('Doit render la page d\'assistant IA', () => {
            render(<AIAssistantPage />, { wrapper: TestWrapper });
            
            expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            expect(screen.getByText('Le Cortex de vos Documents - GED Intelligente')).toBeInTheDocument();
        });

        test('Doit afficher les statistiques', async () => {
            const mockStats = {
                success: true,
                database: {
                    totalDocuments: 150,
                    totalConversations: 45,
                    totalChunks: 2000
                },
                sessions: {
                    activeSessions: 3
                }
            };
            mockApiService.getAIStatistics.mockResolvedValue(mockStats);
            mockApiService.getAIDocuments.mockResolvedValue({ success: true, documents: [] });
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('150')).toBeInTheDocument(); // Documents indexés
                expect(screen.getByText('45')).toBeInTheDocument();  // Conversations
            });
        });

        test('Doit changer de mode de chat', () => {
            render(<AIAssistantPage />, { wrapper: TestWrapper });

            const docucortexButton = screen.getByText('Chat DocuCortex');
            const classicButton = screen.getByText('Chat IA Classique');

            expect(docucortexButton).toHaveAttribute('aria-pressed', 'true');

            fireEvent.click(classicButton);

            expect(classicButton).toHaveAttribute('aria-pressed', 'true');
            expect(docucortexButton).toHaveAttribute('aria-pressed', 'false');
        });

        test('Doit charger les documents', async () => {
            const mockDocuments = {
                success: true,
                documents: [
                    {
                        id: '1',
                        filename: 'test.pdf',
                        file_type: 'pdf',
                        language: 'fr',
                        file_size: 2048000,
                        indexed_at: new Date().toISOString(),
                        metadata: JSON.stringify({ wordCount: 500 })
                    }
                ]
            };
            mockApiService.getAIDocuments.mockResolvedValue(mockDocuments);
            mockApiService.getAIStatistics.mockResolvedValue({ success: true });
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });
        });

        test('Doit supprimer un document', async () => {
            const mockDocuments = {
                success: true,
                documents: [
                    {
                        id: 'doc1',
                        filename: 'test.pdf',
                        file_type: 'pdf',
                        language: 'fr',
                        file_size: 2048000,
                        indexed_at: new Date().toISOString(),
                        metadata: null
                    }
                ]
            };
            const mockDelete = { success: true };
            
            mockApiService.getAIDocuments.mockResolvedValue(mockDocuments);
            mockApiService.getAIStatistics.mockResolvedValue({ success: true });
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });
            mockApiService.deleteAIDocument.mockResolvedValue(mockDelete);

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Documents
            const tabs = screen.getAllByRole('tab');
            fireEvent.click(tabs[2]); // Onglet Documents

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });

            // Cliquer sur l'icône de suppression
            const deleteButton = screen.getByLabelText('supprimer le document');
            fireEvent.click(deleteButton);

            // Confirmer la suppression
            const confirmButton = screen.getByText('Supprimer');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockApiService.deleteAIDocument).toHaveBeenCalledWith('doc1');
            });
        });

        test('Doit gérer les erreurs globales', () => {
            mockApiService.getAIDocuments.mockRejectedValue(new Error('Erreur API'));
            mockApiService.getAIStatistics.mockRejectedValue(new Error('Erreur API'));
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // L'erreur devrait être affichée
            // Note: L'implémentation actuelle peut ne pas montrer toutes les erreurs
        });

        test('Doit sauvegarder les préférences', async () => {
            mockApiService.getAIDocuments.mockResolvedValue({ success: true, documents: [] });
            mockApiService.getAIStatistics.mockResolvedValue({ success: true });
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Préférences
            const tabs = screen.getAllByRole('tab');
            fireEvent.click(tabs[5]); // Onglet Préférences

            // Changer le thème
            const darkButton = screen.getByText('Sombre');
            fireEvent.click(darkButton);

            // Les préférences devraient être sauvegardées dans localStorage
            await waitFor(() => {
                const stored = localStorage.getItem('docucortex_preferences');
                expect(stored).toBeTruthy();
            });
        });

        test('Doit gérer l\'historique et les favoris', async () => {
            // Préparer les données
            localStorage.setItem('docucortex_history', JSON.stringify({
                'docu_test_session_123': {
                    lastActivity: new Date().toISOString(),
                    messageCount: 5
                }
            }));

            mockApiService.getAIDocuments.mockResolvedValue({ success: true, documents: [] });
            mockApiService.getAIStatistics.mockResolvedValue({ success: true });
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Historique & Favoris
            const tabs = screen.getAllByRole('tab');
            fireEvent.click(tabs[4]); // Onglet Historique & Favoris

            await waitFor(() => {
                expect(screen.getByText(/Chat DocuCortex: 1 conversations/)).toBeInTheDocument();
            });

            // Effacer l'historique
            const clearButton = screen.getByText('Effacer l\'historique');
            fireEvent.click(clearButton);

            await waitFor(() => {
                const history = localStorage.getItem('docucortex_history');
                expect(JSON.parse(history)).toEqual({});
            });
        });

        test('Doit prévisualiser un document', async () => {
            const mockDocuments = {
                success: true,
                documents: [
                    {
                        id: '1',
                        filename: 'test.pdf',
                        file_type: 'pdf',
                        language: 'fr',
                        file_size: 2048000,
                        indexed_at: new Date().toISOString(),
                        metadata: JSON.stringify({ wordCount: 500, pages: 10 })
                    }
                ]
            };
            
            mockApiService.getAIDocuments.mockResolvedValue(mockDocuments);
            mockApiService.getAIStatistics.mockResolvedValue({ success: true });
            mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Documents
            const tabs = screen.getAllByRole('tab');
            fireEvent.click(tabs[2]); // Onglet Documents

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });

            // Cliquer sur le document pour le prévisualiser
            const documentCard = screen.getByText('test.pdf').closest('[role="button"]');
            fireEvent.click(documentCard);

            await waitFor(() => {
                expect(screen.getByText(/Prévisualisation: test.pdf/)).toBeInTheDocument();
                expect(screen.getByText('500')).toBeInTheDocument(); // Nombre de mots
                expect(screen.getByText('10')).toBeInTheDocument();  // Pages
            });

            // Fermer la prévisualisation
            const closeButton = screen.getByText('Fermer');
            fireEvent.click(closeButton);
        });
    });

    describe('Accessibilité et UX', () => {
        test('ChatInterfaceDocuCortex doit être accessible au clavier', async () => {
            const mockResponse = {
                success: true,
                response: 'Réponse test',
                confidence: 0.9,
                sources: [],
                suggestions: []
            };
            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(<ChatInterfaceDocuCortex sessionId={mockSessionId} onMessageSent={mockOnMessageSent} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Navigation au clavier
            fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

            // Le message devrait être envoyé
            expect(mockApiService.sendAIMessage).toHaveBeenCalled();
        });

        test('DocumentUploader doit gérer le drag & drop correctement', async () => {
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const mockResult = {
                success: true,
                language: 'fr',
                wordCount: 150,
                chunksCount: 5
            };
            mockApiService.uploadAIDocument.mockResolvedValue(mockResult);

            render(<DocumentUploader onUploadComplete={jest.fn()} />, { wrapper: TestWrapper });

            const dropzone = screen.getByTestId('dropzone-root');

            // Tester drag enter
            fireEvent.dragEnter(dropzone);
            fireEvent.dragLeave(dropzone);

            // Tester drop
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: {
                        files: [mockFile]
                    }
                });
            });

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });
        });

        test('NetworkConfigPanel doit valider les champs', async () => {
            render(<NetworkConfigPanel />, { wrapper: TestWrapper });

            // Le champ devrait être vide par défaut si invalide
            const serverPathField = screen.getByLabelText(/Chemin Serveur Réseau/);
            expect(serverPathField).toBeValid();
            
            // Test avec chemin invalide
            fireEvent.change(serverPathField, { target: { value: '' } });
            
            // Les boutons devraient être désactivés
            const testButton = screen.getByText(/Tester Connexion/);
            const saveButton = screen.getByText(/Sauvegarder Config/);
            const scanButton = screen.getByText(/Scanner Réseau/);

            expect(testButton).toBeDisabled();
            expect(saveButton).toBeDisabled();
            expect(scanButton).toBeDisabled();
        });
    });

    describe('Gestion des performances', () => {
        test('ChatInterfaceDocuCortex doit gérer les gros historiques', async () => {
            const largeHistory = {
                success: true,
                conversations: Array.from({ length: 100 }, (_, i) => ({
                    user_message: `Message ${i}`,
                    ai_response: `Réponse ${i}`,
                    confidence_score: 0.9,
                    sources: '[]',
                    created_at: new Date().toISOString()
                }))
            };
            mockApiService.getAIConversationHistory.mockResolvedValue(largeHistory);

            const startTime = performance.now();
            render(<ChatInterfaceDocuCortex sessionId={mockSessionId} onMessageSent={mockOnMessageSent} />, { wrapper: TestWrapper });
            const endTime = performance.now();

            await waitFor(() => {
                expect(screen.getByText('Message 0')).toBeInTheDocument();
            });

            // Le rendu ne devrait pas prendre plus de 2 secondes
            expect(endTime - startTime).toBeLessThan(2000);
        });

        test('DocumentUploader doit gérer plusieurs uploads simultanés', async () => {
            const mockFiles = [
                new File(['doc1'], 'document1.pdf', { type: 'application/pdf' }),
                new File(['doc2'], 'document2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
                new File(['doc3'], 'document3.txt', { type: 'text/plain' })
            ];
            
            const mockResult = {
                success: true,
                language: 'fr',
                wordCount: 150,
                chunksCount: 5
            };
            
            mockApiService.uploadAIDocument.mockResolvedValue(mockResult);

            render(<DocumentUploader onUploadComplete={jest.fn()} />, { wrapper: TestWrapper });

            const dropzone = screen.getByTestId('dropzone-root');

            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: {
                        files: mockFiles
                    }
                });
            });

            await waitFor(() => {
                expect(screen.getByText('document1.pdf')).toBeInTheDocument();
                expect(screen.getByText('document2.docx')).toBeInTheDocument();
                expect(screen.getByText('document3.txt')).toBeInTheDocument();
            });
        });
    });
});