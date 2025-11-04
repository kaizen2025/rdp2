import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  Fade,
  Slide
} from '@mui/material';
import {
  SmartToy,
  Person,
  DeleteOutline,
  Download,
  Upload,
  History
} from '@mui/icons-material';
import ChatMessage from './ChatMessage';
import InputBox from './InputBox';
import StatusIndicator from './StatusIndicator';

const DocuCortexChat = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('docucortex_chat_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        if (parsed.length > 0) {
          setMessages(parsed[parsed.length - 1].messages || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }
    }
  }, []);

  // Sauvegarder l'historique
  const saveToHistory = useCallback((currentMessages) => {
    if (currentMessages.length > 0) {
      const newSession = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        messages: currentMessages,
        title: currentMessages[0]?.content.substring(0, 50) + '...'
      };
      
      const updatedHistory = [...history, newSession].slice(-10); // Garder les 10 dernières sessions
      setHistory(updatedHistory);
      localStorage.setItem('docucortex_chat_history', JSON.stringify(updatedHistory));
    }
  }, [history]);

  // Envoyer un message
  const handleSendMessage = useCallback(async (content, type = 'text') => {
    if (!content.trim() && type === 'text') return;

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content,
      timestamp: new Date().toISOString(),
      streaming: false
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsTyping(true);
    setIsStreaming(true);

    try {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Créer un nouveau AbortController
      abortControllerRef.current = new AbortController();

      // Appel API streaming
      const response = await fetch('http://localhost:5000/api/ollama/stream-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.slice(-10), // Envoyer les 10 derniers messages
          model: 'llama2'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Traitement du streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        streaming: true
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              assistantMessage.content += data.content;
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: assistantMessage.content }
                  : msg
              ));
            } else if (data.type === 'end') {
              assistantMessage.streaming = false;
              setIsTyping(false);
              setIsStreaming(false);
              break;
            }
          }
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        timestamp: new Date().toISOString(),
        streaming: false,
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsStreaming(false);
    }
  }, [messages]);

  // Arrêter la génération
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setIsStreaming(false);
    }
  }, []);

  // Effacer la conversation
  const handleClearChat = useCallback(() => {
    setMessages([]);
    saveToHistory([]);
  }, [saveToHistory]);

  // Charger une session d'historique
  const handleLoadHistory = useCallback((sessionMessages) => {
    setMessages(sessionMessages);
  }, []);

  // Vérifier la connexion à Ollama
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        setConnectionStatus(data.services?.ollama?.status || 'unknown');
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Vérifier toutes les 30s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        maxHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderRadius: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SmartToy color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" color="primary">
              DocuCortex IA
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Assistant intelligent Ollama
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusIndicator status={connectionStatus} />
          <IconButton 
            onClick={handleClearChat} 
            color="error" 
            title="Effacer la conversation"
          >
            <DeleteOutline />
          </IconButton>
        </Box>
      </Paper>

      <Divider />

      {/* Zone de messages */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {messages.length === 0 ? (
          <Fade in={true} timeout={1000}>
            <Box 
              sx={{ 
                textAlign: 'center', 
                mt: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <SmartToy sx={{ fontSize: 64, color: 'primary.main', opacity: 0.3 }} />
              <Typography variant="h5" color="text.secondary">
                Bienvenue sur DocuCortex IA
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                Commencez une conversation avec l'assistant intelligent pour analyser vos documents, 
                obtenir des réponses, et optimiser votre productivité.
              </Typography>
            </Box>
          </Fade>
        ) : (
          messages.map((message, index) => (
            <Slide 
              key={message.id} 
              direction="up" 
              in={true} 
              timeout={300}
              style={{ transformDelay: `${index * 50}ms` }}
            >
              <div>
                <ChatMessage 
                  message={message}
                  isStreaming={message.streaming}
                />
              </div>
            </Slide>
          ))
        )}
        
        {isTyping && (
          <Fade in={true}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
              <SmartToy color="action" />
              <Box sx={{ 
                bgcolor: 'action.hover', 
                borderRadius: 2, 
                px: 2, 
                py: 1,
                minWidth: 60
              }}>
                <Typography variant="body2" color="text.secondary">
                  {isStreaming ? 'Génère une réponse...' : 'En attente...'}
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input Box */}
      <InputBox 
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        disabled={isTyping && !isStreaming}
        isStreaming={isStreaming}
      />
    </Box>
  );
};

export default DocuCortexChat;