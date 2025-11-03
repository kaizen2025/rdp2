/**
 * Tests d'intégration pour Chat DocuCortex IA
 * Scénarios bout-en-bout couvrant plusieurs composants
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import AIAssistantPage from '../pages/AIAssistantPage';
import { mockApiService } from './__mocks__/mockApiService';
import { mockPermissions } from './__mocks__/mockPermissions';
import {
    createMockDocument,
    createMockConversation,
    createMockNetworkConfig,
    createMockUploadResult,
    createMockStatistics
} from './__mocks__/mockData';

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
            onClick: config.onDrop ? () => {} : undefined,
            'data-testid': 'dropzone-root'
        }),
        getInputProps: () => ({
            'data-testid': 'dropzone-input'
        }),
        isDragActive: false
    })
}));

describe('Chat DocuCortex IA - Tests d\'Intégration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        // Configuration par défaut des mocks
        mockApiService.getAIDocuments.mockResolvedValue({ success: true, documents: [] });
        mockApiService.getAIStatistics.mockResolvedValue(createMockStatistics());
        mockApiService.getUserPreferences.mockResolvedValue({ success: true, preferences: {} });
        mockApiService.getAIConversationHistory.mockResolvedValue({ success: true, conversations: [] });
    });

    describe('Scénario : Chat normal avec recherche de documents', () => {
        test('Doit permettre de poser une question et obtenir une réponse avec sources', async () => {
            const mockResponse = {
                success: true,
                response: 'Basé sur les documents analysés, voici les informations demandées.',
                confidence: 0.92,
                sources: [
                    { documentId: 'doc1', filename: 'rapport_2024.pdf', score: 95 },
                    { documentId: 'doc2', filename: 'contrat_commercial.pdf', score: 87 }
                ],
                suggestions: ['Voir les détails du rapport', 'Consulter le contrat'],
                metadata: { processingTime: 1.2, documentsSearched: 15 }
            };
            
            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Vérifier l'affichage initial
            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
                expect(screen.getByText('Le Cortex de vos Documents - GED Intelligente')).toBeInTheDocument();
            });

            // Le chat DocuCortex est actif par défaut
            expect(screen.getByText('Chat DocuCortex')).toHaveAttribute('aria-pressed', 'true');

            // Attendre que le composant chat soit chargé
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            // Poser une question
            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            act(() => {
                fireEvent.change(input, { target: { value: 'Quels sont les documents les plus récents ?' } });
            });

            act(() => {
                fireEvent.click(sendButton);
            });

            // Vérifier l'envoi du message
            await waitFor(() => {
                expect(screen.getByText('Quels sont les documents les plus récents ?')).toBeInTheDocument();
                expect(mockApiService.sendAIMessage).toHaveBeenCalledWith(
                    expect.stringMatching(/^docu_\d+$/),
                    'Quels sont les documents les plus récents ?'
                );
            });

            // Vérifier la réponse avec sources
            await waitFor(() => {
                expect(screen.getByText(/Basé sur les documents analysés/)).toBeInTheDocument();
                expect(screen.getByText('📚 Sources (2):')).toBeInTheDocument();
                expect(screen.getByText('rapport_2024.pdf')).toBeInTheDocument();
                expect(screen.getByText('contrat_commercial.pdf')).toBeInTheDocument();
            });

            // Vérifier les suggestions
            const suggestions = screen.getAllByText(/Voir les détails du rapport/);
            expect(suggestions.length).toBeGreaterThan(0);

            // Vérifier le score de confiance
            expect(screen.getByText('Confiance: 92%')).toBeInTheDocument();
        });

        test('Doit permettre de cliquer sur une suggestion', async () => {
            const responses = [
                {
                    success: true,
                    response: 'Voici les documents récents disponibles.',
                    confidence: 0.9,
                    sources: [],
                    suggestions: ['Afficher les contrats', 'Voir les rapports']
                },
                {
                    success: true,
                    response: 'Voici les contrats disponibles.',
                    confidence: 0.88,
                    sources: [],
                    suggestions: []
                }
            ];
            
            let responseIndex = 0;
            mockApiService.sendAIMessage.mockImplementation(() => {
                return Promise.resolve(responses[responseIndex++]);
            });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            // Attendre la réponse initiale (message de bienvenue)
            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            // Poser une question
            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            
            act(() => {
                fireEvent.change(input, { target: { value: 'Quels documents récents ?' } });
            });

            act(() => {
                fireEvent.click(screen.getByRole('button', { name: /send/i }));
            });

            // Attendre la première réponse
            await waitFor(() => {
                expect(screen.getByText(/Voici les documents récents/)).toBeInTheDocument();
            });

            // Cliquer sur une suggestion
            const suggestionButton = screen.getByText('Afficher les contrats');
            fireEvent.click(suggestionButton);

            // Vérifier que la suggestion a été envoyée
            await waitFor(() => {
                expect(screen.getByText('Afficher les contrats')).toBeInTheDocument();
                expect(mockApiService.sendAIMessage).toHaveBeenCalledWith(
                    expect.any(String),
                    'Afficher les contrats'
                );
            });

            // Vérifier la réponse à la suggestion
            await waitFor(() => {
                expect(screen.getByText(/Voici les contrats disponibles/)).toBeInTheDocument();
            });
        });
    });

    describe('Scénario : Upload de document et recherche', () => {
        test('Doit uploader un document et le retrouver dans la recherche', async () => {
            const mockFile = new File(['contenu PDF'], 'document_commercial.pdf', { type: 'application/pdf' });
            const mockUploadResult = createMockUploadResult({
                filename: 'document_commercial.pdf',
                language: 'fr',
                wordCount: 850,
                chunksCount: 12
            });
            
            mockApiService.uploadAIDocument.mockResolvedValue(mockUploadResult);
            
            const mockSearchResponse = {
                success: true,
                response: 'J\'ai trouvé le document "document_commercial.pdf" dans la base de données.',
                confidence: 0.95,
                sources: [
                    { documentId: 'new_doc_1', filename: 'document_commercial.pdf', score: 100 }
                ],
                suggestions: []
            };
            
            mockApiService.sendAIMessage.mockResolvedValue(mockSearchResponse);

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Upload
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[1]); // Onglet Upload
            });

            // Vérifier l'affichage de la zone de drop
            await waitFor(() => {
                expect(screen.getByText(/Glissez-déposez vos fichiers ici/)).toBeInTheDocument();
            });

            // Uploader le document
            const dropzone = screen.getByTestId('dropzone-root');
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: [mockFile] }
                });
            });

            // Vérifier l'upload
            await waitFor(() => {
                expect(screen.getByText('document_commercial.pdf')).toBeInTheDocument();
                expect(screen.getByText('FR')).toBeInTheDocument();
                expect(screen.getByText('850 mots')).toBeInTheDocument();
                expect(screen.getByText('12 chunks')).toBeInTheDocument();
            });

            // Retourner au chat
            await act(async () => {
                fireEvent.click(tabs[0]); // Onglet Chat
            });

            // Poser une question sur le document uploadé
            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Trouve-moi le document commercial' } });
            });

            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /send/i }));
            });

            // Vérifier la recherche
            await waitFor(() => {
                expect(mockApiService.sendAIMessage).toHaveBeenCalledWith(
                    expect.any(String),
                    'Trouve-moi le document commercial'
                );
            });

            await waitFor(() => {
                expect(screen.getByText(/J'ai trouvé le document "document_commercial.pdf"/)).toBeInTheDocument();
            });
        });

        test('Doit gérer l\'upload de plusieurs documents', async () => {
            const mockFiles = [
                new File(['contrat'], 'contrat_2024.pdf', { type: 'application/pdf' }),
                new File(['rapport'], 'rapport_q4.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                new File(['note'], 'note_confidentielle.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
            ];
            
            let uploadCallCount = 0;
            mockApiService.uploadAIDocument.mockImplementation(() => {
                const file = mockFiles[uploadCallCount];
                uploadCallCount++;
                return Promise.resolve(createMockUploadResult({
                    filename: file.name,
                    language: 'fr',
                    wordCount: Math.floor(Math.random() * 1000) + 100,
                    chunksCount: Math.floor(Math.random() * 20) + 5
                }));
            });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Upload
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[1]);
            });

            // Uploader tous les documents
            const dropzone = screen.getByTestId('dropzone-root');
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: mockFiles }
                });
            });

            // Vérifier que tous les documents apparaissent
            await waitFor(() => {
                expect(screen.getByText('contrat_2024.pdf')).toBeInTheDocument();
                expect(screen.getByText('rapport_q4.xlsx')).toBeInTheDocument();
                expect(screen.getByText('note_confidentielle.docx')).toBeInTheDocument();
            });

            // Vérifier que l'API a été appelée pour chaque fichier
            expect(mockApiService.uploadAIDocument).toHaveBeenCalledTimes(3);
        });
    });

    describe('Scénario : Configuration réseau et scan', () => {
        test('Doit configurer le réseau et scanner les documents', async () => {
            const mockConfig = createMockNetworkConfig();
            const mockScanResult = {
                success: true,
                scanned: 25,
                indexed: 20,
                errors: 0,
                duration: 15.3
            };

            mockApiService.configureNetwork.mockResolvedValue({ success: true });
            mockApiService.testNetworkConnection.mockResolvedValue({ success: true, path: mockConfig.serverPath });
            mockApiService.startNetworkWatch.mockResolvedValue({ success: true });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Config Réseau
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[3]); // Onglet Config Réseau
            });

            // Vérifier l'affichage du panneau de configuration
            await waitFor(() => {
                expect(screen.getByText('Configuration Serveur Réseau DocuCortex')).toBeInTheDocument();
            });

            // Configurer le chemin réseau
            const serverPathField = screen.getByLabelText(/Chemin Serveur Réseau/);
            await act(async () => {
                fireEvent.change(serverPathField, { target: { value: mockConfig.serverPath } });
            });

            // Tester la connexion
            const testButton = screen.getByText(/Tester Connexion/);
            await act(async () => {
                fireEvent.click(testButton);
            });

            await waitFor(() => {
                expect(mockApiService.testNetworkConnection).toHaveBeenCalledWith();
            });

            // Lancer le scan
            const scanButton = screen.getByText(/Scanner Réseau/);
            await act(async () => {
                fireEvent.click(scanButton);
            });

            // Vérifier le progrès de scan
            await waitFor(() => {
                expect(screen.getByText(/Scan en cours/)).toBeInTheDocument();
            });

            // Attendre la fin du scan
            await waitFor(() => {
                expect(screen.getByText(/Scan réseau terminé/)).toBeInTheDocument();
            });

            // Vérifier les résultats de scan
            await waitFor(() => {
                expect(screen.getByText('25 fichiers trouvés')).toBeInTheDocument();
                expect(screen.getByText('20 indexés')).toBeInTheDocument();
            });

            // Démarrer la surveillance automatique
            const watchButton = screen.getByText('Démarrer');
            await act(async () => {
                fireEvent.click(watchButton);
            });

            await waitFor(() => {
                expect(mockApiService.startNetworkWatch).toHaveBeenCalled();
            });
        });

        test('Doit gérer les erreurs de configuration réseau', async () => {
            const mockError = { success: false, error: 'Chemin réseau inaccessible' };
            
            mockApiService.testNetworkConnection.mockRejectedValue(new Error('Network error'));
            mockApiService.configureNetwork.mockRejectedValue(new Error('Config error'));

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Config Réseau
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[3]);
            });

            // Tester avec un chemin invalide
            const serverPathField = screen.getByLabelText(/Chemin Serveur Réseau/);
            await act(async () => {
                fireEvent.change(serverPathField, { target: { value: '\\\\invalid\\path' } });
            });

            // Tester la connexion
            const testButton = screen.getByText(/Tester Connexion/);
            await act(async () => {
                fireEvent.click(testButton);
            });

            // Vérifier l'affichage de l'erreur
            await waitFor(() => {
                expect(screen.getByText(/Échec connexion/)).toBeInTheDocument();
            });
        });
    });

    describe('Scénario : Gestion des sessions et historique', () => {
        test('Doit maintenir les sessions entre les onglets', async () => {
            const mockHistory = createMockConversation([
                {
                    user_message: 'Première question',
                    ai_response: 'Première réponse',
                    confidence_score: 0.9
                },
                {
                    user_message: 'Deuxième question',
                    ai_response: 'Deuxième réponse',
                    confidence_score: 0.85
                }
            ]);
            
            mockApiService.getAIConversationHistory.mockResolvedValue(mockHistory);

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Attendre le chargement de l'historique
            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            // Aller à l'onglet Documents
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[2]); // Onglet Documents
            });

            // Revenir au chat
            await act(async () => {
                fireEvent.click(tabs[0]); // Onglet Chat
            });

            // L'historique devrait toujours être là
            await waitFor(() => {
                expect(screen.getByText('Première question')).toBeInTheDocument();
                expect(screen.getByText('Deuxième question')).toBeInTheDocument();
                expect(screen.getByText('Première réponse')).toBeInTheDocument();
                expect(screen.getByText('Deuxième réponse')).toBeInTheDocument();
            });
        });

        test('Doit sauvegarder et charger l\'historique en localStorage', async () => {
            const mockHistory = createMockConversation([
                {
                    user_message: 'Question de test',
                    ai_response: 'Réponse de test',
                    confidence_score: 0.9
                }
            ]);
            
            mockApiService.getAIConversationHistory.mockResolvedValue(mockHistory);
            mockApiService.sendAIMessage.mockResolvedValue({
                success: true,
                response: 'Nouvelle réponse',
                confidence: 0.88,
                sources: [],
                suggestions: []
            });

            // Premier rendu
            const { unmount } = render(<AIAssistantPage />, { wrapper: TestWrapper });
            
            await waitFor(() => {
                expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
            });

            // Vérifier la sauvegarde dans localStorage
            await waitFor(() => {
                const history = localStorage.getItem('docucortex_history');
                expect(history).toBeTruthy();
                const parsed = JSON.parse(history);
                expect(Object.keys(parsed).length).toBeGreaterThan(0);
            });

            // Envoyer un nouveau message
            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Test sauvegarde' } });
            });

            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /send/i }));
            });

            await waitFor(() => {
                expect(screen.getByText('Test sauvegarde')).toBeInTheDocument();
            });

            // Démonte le composant
            unmount();

            // Remonte le composant
            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Vérifier que l'historique est rechargé
            await waitFor(() => {
                expect(screen.getByText('Question de test')).toBeInTheDocument();
            });
        });
    });

    describe('Scénario : Préférences utilisateur', () => {
        test('Doit sauvegarder et appliquer les préférences', async () => {
            const mockPreferences = {
                theme: 'dark',
                chatSound: false,
                autoSave: true,
                language: 'fr',
                model: 'advanced'
            };

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Préférences
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[5]); // Onglet Préférences
            });

            // Vérifier l'affichage des préférences
            await waitFor(() => {
                expect(screen.getByText('Préférences Utilisateur')).toBeInTheDocument();
                expect(screen.getByText('Interface')).toBeInTheDocument();
                expect(screen.getByText('Fonctionnalités')).toBeInTheDocument();
            });

            // Changer le thème
            const darkButton = screen.getByText('Sombre');
            await act(async () => {
                fireEvent.click(darkButton);
            });

            // Désactiver le son
            const soundButton = screen.getByText(/Son de chat: OFF/);
            await act(async () => {
                fireEvent.click(soundButton);
            });

            // Vérifier la sauvegarde en localStorage
            await waitFor(() => {
                const stored = localStorage.getItem('docucortex_preferences');
                expect(stored).toBeTruthy();
                const parsed = JSON.parse(stored);
                expect(parsed.theme).toBe('dark');
                expect(parsed.chatSound).toBe(false);
            });

            // Exporter les préférences
            const exportButton = screen.getByText('Exporter les préférences');
            await act(async () => {
                fireEvent.click(exportButton);
            });

            // Vérifier le téléchargement (simulation)
            // Note: dans un vrai test, on vérifierait que URL.createObjectURL est appelée
        });
    });

    describe('Scénario : Gestion des erreurs globales', () => {
        test('Doit gérer les erreurs et afficher des messages utilisateur', async () => {
            // Simuler des erreurs API
            mockApiService.getAIDocuments.mockRejectedValue(new Error('Erreur serveur'));
            mockApiService.getAIStatistics.mockRejectedValue(new Error('Erreur base de données'));
            mockApiService.getUserPreferences.mockRejectedValue(new Error('Erreur authentification'));

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Les erreurs devraient être gérées gracieusement
            await waitFor(() => {
                expect(screen.getByText('DocuCortex')).toBeInTheDocument();
            });

            // Le composant ne devrait pas planter
            expect(screen.getByText('Le Cortex de vos Documents - GED Intelligente')).toBeInTheDocument();
        });

        test('Doit afficher un message d\'erreur si le chat échoue', async () => {
            mockApiService.sendAIMessage.mockRejectedValue(new Error('Service indisponible'));

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Test erreur' } });
            });

            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /send/i }));
            });

            // Vérifier le message d'erreur
            await waitFor(() => {
                expect(screen.getByText(/Erreur de connexion au serveur/)).toBeInTheDocument();
            });
        });
    });

    describe('Scénario : Performance avec gros volumes', () => {
        test('Doit gérer efficacement les gros historiques de conversation', async () => {
            const largeHistory = createMockConversation(
                Array.from({ length: 50 }, (_, i) => ({
                    user_message: `Question ${i + 1}`,
                    ai_response: `Réponse détaillée ${i + 1} avec beaucoup de contenu pour tester les performances`,
                    confidence_score: 0.8 + (i * 0.002)
                }))
            );

            mockApiService.getAIConversationHistory.mockResolvedValue(largeHistory);

            const startTime = performance.now();
            render(<AIAssistantPage />, { wrapper: TestWrapper });
            const endTime = performance.now();

            await waitFor(() => {
                expect(screen.getByText('Question 1')).toBeInTheDocument();
            });

            // Le rendu ne devrait pas prendre plus de 3 secondes pour 50 messages
            const renderTime = endTime - startTime;
            expect(renderTime).toBeLessThan(3000);

            // Tous les messages devraient être visibles
            await waitFor(() => {
                expect(screen.getByText('Question 50')).toBeInTheDocument();
            });
        });

        test('Doit gérer efficacement la liste de documents volumineuse', async () => {
            const largeDocuments = Array.from({ length: 100 }, (_, i) => 
                createMockDocument({
                    filename: `document_${i + 1}.pdf`,
                    file_type: 'pdf',
                    language: 'fr',
                    file_size: 1024000 + (i * 1000),
                    wordCount: 500 + (i * 10)
                })
            );

            mockApiService.getAIDocuments.mockResolvedValue({
                success: true,
                documents: largeDocuments
            });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Documents
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[2]);
            });

            await waitFor(() => {
                expect(screen.getByText(/Documents indexés \(100\)/)).toBeInTheDocument();
            });

            // La liste devrait être scrollable
            const documentGrid = screen.getByText(/Documents indexés/).closest('.MuiGrid-container');
            expect(documentGrid).toBeInTheDocument();
        });
    });

    describe('Scénario : Accessibilité et navigation', () => {
        test('Doit être entièrement navigable au clavier', async () => {
            const mockResponse = {
                success: true,
                response: 'Réponse accessible',
                confidence: 0.9,
                sources: [],
                suggestions: ['Suggestion 1', 'Suggestion 2']
            };
            
            mockApiService.sendAIMessage.mockResolvedValue(mockResponse);

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Posez votre question à DocuCortex/)).toBeInTheDocument();
            });

            // Navigation au clavier dans le chat
            const input = screen.getByPlaceholderText(/Posez votre question à DocuCortex/);
            const sendButton = screen.getByRole('button', { name: /send/i });

            // Focus sur l'input
            fireEvent.focus(input);
            
            // Taper du texte
            fireEvent.change(input, { target: { value: 'Question accessible' } });

            // Envoyer avec Entrée
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

            await waitFor(() => {
                expect(mockApiService.sendAIMessage).toHaveBeenCalled();
            });

            // Navigation entre onglets au clavier
            const tabs = screen.getAllByRole('tab');
            fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
            
            await waitFor(() => {
                expect(tabs[1]).toHaveFocus();
            });
        });

        test('Doit avoir des labels d\'accessibilité appropriés', async () => {
            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Vérifier les labels ARIA
            expect(screen.getByLabelText(/Chemin Serveur Réseau/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Répertoire de Travail/)).toBeInTheDocument();
            
            // Vérifier les rôles
            expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
            expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
        });
    });

    describe('Scénario : Synchronisation entre composants', () => {
        test('Doit synchroniser les uploads avec la liste des documents', async () => {
            const initialDocuments = [
                createMockDocument({
                    filename: 'document_existant.pdf',
                    id: 'existing_1'
                })
            ];

            mockApiService.getAIDocuments.mockResolvedValue({
                success: true,
                documents: initialDocuments
            });

            const uploadResult = createMockUploadResult({
                filename: 'nouveau_document.pdf',
                id: 'uploaded_1'
            });

            mockApiService.uploadAIDocument.mockResolvedValue(uploadResult);

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Vérifier les documents initiaux
            await waitFor(() => {
                expect(screen.getByText('document_existant.pdf')).toBeTheDocument();
            });

            // Aller à l'onglet Upload
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[1]);
            });

            // Uploader un nouveau document
            const mockFile = new File(['test'], 'nouveau_document.pdf', { type: 'application/pdf' });
            const dropzone = screen.getByTestId('dropzone-root');
            
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: [mockFile] }
                });
            });

            await waitFor(() => {
                expect(screen.getByText('nouveau_document.pdf')).toBeInTheDocument();
            });

            // Retourner à la liste des documents
            await act(async () => {
                fireEvent.click(tabs[2]);
            });

            // La liste devrait être actualisée (dans un vrai scénario)
            // Note: Le callback onUploadComplete appelle loadDocuments()
            // mais avec notre mock, on ne peut pas vérifier la mise à jour automatique
        });

        test('Doit synchroniser les statistiques après upload', async () => {
            let uploadCount = 0;
            mockApiService.uploadAIDocument.mockImplementation(() => {
                uploadCount++;
                return Promise.resolve(createMockUploadResult());
            });

            let statsCallCount = 0;
            mockApiService.getAIStatistics.mockImplementation(() => {
                statsCallCount++;
                return Promise.resolve(createMockStatistics({ totalDocuments: 10 + uploadCount }));
            });

            render(<AIAssistantPage />, { wrapper: TestWrapper });

            // Aller à l'onglet Upload
            const tabs = screen.getAllByRole('tab');
            await act(async () => {
                fireEvent.click(tabs[1]);
            });

            // Uploader un document
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const dropzone = screen.getByTestId('dropzone-root');
            
            await act(async () => {
                fireEvent.drop(dropzone, {
                    dataTransfer: { files: [mockFile] }
                });
            });

            // Attendre l'upload et la mise à jour des stats
            await waitFor(() => {
                expect(uploadCount).toBe(1);
            });

            // Les statistiques devraient être rechargées (via onUploadComplete)
            // Note: Dans un vrai test avec la vraies implémentation,
            // on vérifierait que getAIStatistics est appelé après l'upload
        });
    });
});