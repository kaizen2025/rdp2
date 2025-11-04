import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { TabPanel } from '@mui/lab';
import {
  DocuCortexChat,
  ChatMessage,
  InputBox,
  StatusIndicator
} from './index';

const ChatExample = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [demoMessages, setDemoMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Exemple d'utilisation du composant ChatMessage isolément
  const handleSendMessage = (content, type) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setDemoMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Simulation d'une réponse
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Voici ma réponse à votre message : "${content}". C'est un exemple de réponse générée par DocuCortex IA.`,
        timestamp: new Date().toISOString()
      };
      setDemoMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 2000);
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
  };

  const demoMessages2 = [
    {
      id: 1,
      type: 'user',
      content: 'Bonjour, pouvez-vous m\'aider à analyser ce document ?',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: 'assistant',
      content: 'Bien sûr ! Je serais ravi de vous aider à analyser votre document. Pouvez-vous me dire de quel type de document il s\'agit et quelles informations vous souhaitez extraire ?',
      timestamp: new Date().toISOString()
    },
    {
      id: 3,
      type: 'user',
      content: 'C\'est un rapport de ventes. Je veux un résumé des points clés.',
      timestamp: new Date().toISOString()
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3 }}>
        DocuCortex IA - Exemples d'Utilisation
      </Typography>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 120px)' }}>
        {/* Onglet principal - Chat complet */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                <Tab label="Chat Complet" />
                <Tab label="Composants Séparés" />
                <Tab label="Démonstration" />
                <Tab label="Statut Système" />
              </Tabs>
            </Box>

            <TabPanel value={0} sx={{ flex: 1, p: 0 }}>
              <DocuCortexChat />
            </TabPanel>

            <TabPanel value={1} sx={{ flex: 1, p: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                {/* Zone de messages */}
                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>
                    ChatMessage Component
                  </Typography>
                  <Box sx={{ 
                    flex: 1, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    p: 2,
                    overflow: 'auto',
                    bgcolor: 'background.default'
                  }}>
                    {demoMessages2.map(message => (
                      <ChatMessage 
                        key={message.id} 
                        message={message}
                        isStreaming={message.streaming}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Zone de saisie */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    InputBox Component
                  </Typography>
                  <InputBox 
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    disabled={isStreaming}
                    isStreaming={isStreaming}
                  />

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    StatusIndicator Component
                  </Typography>
                  <StatusIndicator status="connected" />
                  <StatusIndicator status="disconnected" />
                  <StatusIndicator status="connecting" />
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={2} sx={{ flex: 1, p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Messages Individuels
                      </Typography>
                      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <ChatMessage 
                          message={{
                            id: 1,
                            type: 'user',
                            content: 'Message utilisateur exemple',
                            timestamp: new Date().toISOString()
                          }}
                        />
                        <ChatMessage 
                          message={{
                            id: 2,
                            type: 'assistant',
                            content: 'Réponse de l\'assistant avec **formatage markdown** et `code inline`',
                            timestamp: new Date().toISOString()
                          }}
                          isStreaming={true}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Composants de Contrôle
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <StatusIndicator status="connected" />
                        <StatusIndicator status="error" />
                        <Button 
                          variant="outlined" 
                          onClick={() => setDemoMessages([])}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Effacer les Messages
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={3} sx={{ flex: 1, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Statut du Système Ollama
              </Typography>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <StatusIndicator status="connected" />
                  <Typography variant="body1">
                    Le service Ollama est opérationnel
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Ce composant affiche en temps réel l'état de connexion avec le service Ollama 
                  et fournit des informations détaillées sur le système dans un popover.
                </Typography>
              </Paper>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChatExample;