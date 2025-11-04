import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  SmartToy as AIIcon,
  Analytics as AnalyticsIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Image as ImageIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Summarize as SummarizeIcon,
  Scanner as ScannerIcon
} from '@mui/icons-material';
import axios from 'axios';
import Tesseract from 'tesseract.js';

const API_BASE_URL = 'http://localhost:5000/api/ollama';

const DocuCortexTab = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');
  
  // États pour le chat
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  
  // États pour l'OCR
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [ocrImage, setOcrImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  
  // États pour l'analyse de documents
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('txt');
  const [analysisResult, setAnalysisResult] = useState('');
  
  // États pour le résumé
  const [summaryText, setSummaryText] = useState('');
  const [summaryMaxLength, setSummaryMaxLength] = useState(200);
  const [summaryResult, setSummaryResult] = useState('');

  const tabs = [
    { label: 'Chat IA', icon: <AIIcon /> },
    { label: 'OCR Documents', icon: <ScannerIcon /> },
    { label: 'Analyse', icon: <AnalyticsIcon /> },
    { label: 'Résumé', icon: <SummarizeIcon /> },
    { label: 'Statut', icon: <InfoIcon /> }
  ];

  // Scroll automatique vers le bas du chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test de connectivité Ollama
  const testOllamaConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/test`, { timeout: 5000 });
      setOllamaStatus(response.data);
      
      if (response.data.models && response.data.models.length > 0) {
        setModels(response.data.models);
        
        // Détecter automatiquement llama3.2:3b
        const llama32 = response.data.models.find(m => 
          m.name.includes('llama3.2:3b') || m.name.includes('llama3.2')
        );
        
        if (llama32) {
          setSelectedModel(llama32.name);
        } else {
          setSelectedModel(response.data.models[0].name);
        }
      }
      
      return true;
    } catch (error) {
      setOllamaStatus({
        status: 'error',
        message: 'Impossible de se connecter à Ollama',
        error: error.message,
        suggestions: [
          'Vérifiez que Ollama est démarré',
          'Vérifiez l\'URL: http://192.168.1.232:11434',
          'Vérifiez votre connexion réseau'
        ]
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Chat avec streaming
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || streaming) return;
    
    const userMessage = {
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setStreaming(true);
    
    const assistantMessage = {
      role: 'assistant',
      content: ''
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          stream: true
        })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
        
        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          
          if (data === '[DONE]') {
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.message && parsed.message.content) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.content += parsed.message.content;
                return newMessages;
              });
            }
          } catch (e) {
            console.error('Erreur parsing:', e);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chat:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = 'Erreur lors de la communication avec Ollama';
        return newMessages;
      });
    } finally {
      setStreaming(false);
    }
  };

  // OCR avec Tesseract.js
  const handleOCR = async (file) => {
    if (!file) return;
    
    setOcrLoading(true);
    setOcrProgress(0);
    setOcrText('');
    
    try {
      // Créer une URL pour l'image
      const imageUrl = URL.createObjectURL(file);
      setOcrImage(imageUrl);
      
      // Lancer l'OCR avec Tesseract.js
      const result = await Tesseract.recognize(
        file,
        'fra+eng', // Support français et anglais
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      const extractedText = result.data.text;
      setOcrText(extractedText);
      
      // Analyse automatique avec Ollama après OCR
      if (extractedText.trim()) {
        setLoading(true);
        try {
          const response = await axios.post(`${API_BASE_URL}/analyze-document`, {
            text: extractedText,
            type: 'image',
            model: selectedModel
          });
          
          setAnalysisResult(response.data.data.analysis);
        } catch (error) {
          console.error('Erreur analyse post-OCR:', error);
        } finally {
          setLoading(false);
        }
      }
      
    } catch (error) {
      console.error('Erreur OCR:', error);
      setOcrText('Erreur lors de l\'extraction du texte');
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  };

  // Analyse de document
  const handleAnalyzeDocument = async () => {
    if (!documentText.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze-document`, {
        text: documentText,
        type: documentType,
        model: selectedModel
      });
      setAnalysisResult(response.data.data.analysis);
    } catch (error) {
      console.error('Erreur analyse:', error);
      setAnalysisResult('Erreur lors de l\'analyse du document');
    } finally {
      setLoading(false);
    }
  };

  // Résumé de document
  const handleSummarize = async () => {
    if (!summaryText.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/summarize`, {
        text: summaryText,
        maxLength: summaryMaxLength,
        model: selectedModel
      });
      setSummaryResult(response.data.data.summary);
    } catch (error) {
      console.error('Erreur résumé:', error);
      setSummaryResult('Erreur lors de la création du résumé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testOllamaConnection();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          DocuCortex IA
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {ollamaStatus && (
            <Chip
              icon={ollamaStatus.status === 'success' ? <CheckIcon /> : <ErrorIcon />}
              label={ollamaStatus.status === 'success' ? 'Ollama Connecté' : 'Ollama Déconnecté'}
              color={ollamaStatus.status === 'success' ? 'success' : 'error'}
              variant="outlined"
            />
          )}
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Modèle IA</InputLabel>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              label="Modèle IA"
            >
              {models.map((model) => (
                <MenuItem key={model.name} value={model.name}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <Card elevation={3}>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab 
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        {/* Onglet Chat IA */}
        {activeTab === 0 && (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chat IA avec Streaming
              </Typography>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  height: 500, 
                  overflow: 'auto', 
                  p: 2, 
                  bgcolor: 'grey.50',
                  mb: 2 
                }}
              >
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 10 }}>
                    <AIIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Commencez une conversation avec DocuCortex IA
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {messages.map((msg, index) => (
                      <ListItem 
                        key={index}
                        sx={{ 
                          flexDirection: 'column', 
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'flex-start',
                            maxWidth: '80%'
                          }}
                        >
                          {msg.role === 'assistant' && (
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <AIIcon />
                            </Avatar>
                          )}
                          
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              bgcolor: msg.role === 'user' ? 'primary.light' : 'white',
                              color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary'
                            }}
                          >
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                              {msg.content}
                            </Typography>
                          </Paper>
                          
                          {msg.role === 'user' && (
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              <PersonIcon />
                            </Avatar>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                  </List>
                )}
              </Paper>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={streaming}
                />
                
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={streaming || !inputMessage.trim()}
                  startIcon={streaming ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{ minWidth: 120 }}
                >
                  {streaming ? 'Envoi...' : 'Envoyer'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Onglet OCR Documents */}
        {activeTab === 1 && (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                OCR - Extraction de Texte d'Images
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      id="ocr-upload"
                      onChange={(e) => handleOCR(e.target.files[0])}
                    />
                    
                    <label htmlFor="ocr-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<ScannerIcon />}
                        disabled={ocrLoading}
                        size="large"
                      >
                        Sélectionner une Image
                      </Button>
                    </label>
                    
                    {ocrLoading && (
                      <Box sx={{ mt: 3 }}>
                        <CircularProgress />
                        <LinearProgress 
                          variant="determinate" 
                          value={ocrProgress} 
                          sx={{ mt: 2 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Extraction en cours... {ocrProgress}%
                        </Typography>
                      </Box>
                    )}
                    
                    {ocrImage && (
                      <Box sx={{ mt: 3 }}>
                        <img 
                          src={ocrImage} 
                          alt="Document scanné" 
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Texte Extrait:
                  </Typography>
                  <Paper sx={{ p: 2, minHeight: 300, bgcolor: 'grey.50', mb: 2 }}>
                    <Typography sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {ocrText || 'Le texte extrait apparaîtra ici...'}
                    </Typography>
                  </Paper>
                  
                  {analysisResult && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Analyse IA:
                      </Typography>
                      <Paper sx={{ p: 2, minHeight: 150, bgcolor: 'primary.light' }}>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                          {analysisResult}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Onglet Analyse de Documents */}
        {activeTab === 2 && (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analyse Intelligente de Documents
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Type de document</InputLabel>
                    <Select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      label="Type de document"
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="docx">Word (DOCX)</MenuItem>
                      <MenuItem value="txt">Texte (.txt)</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Texte du document"
                    multiline
                    rows={12}
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Collez ici le texte de votre document..."
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    onClick={handleAnalyzeDocument}
                    disabled={loading || !documentText.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                    fullWidth
                  >
                    Analyser le Document
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Analyse IA:
                  </Typography>
                  <Paper sx={{ p: 2, minHeight: 400, bgcolor: 'grey.50' }}>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {analysisResult || 'L\'analyse apparaîtra ici...'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Onglet Résumé */}
        {activeTab === 3 && (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Résumé de Document
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Longueur maximale (mots)"
                    value={summaryMaxLength}
                    onChange={(e) => setSummaryMaxLength(parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 50, max: 1000 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Texte à résumer"
                    multiline
                    rows={12}
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="Collez ici le texte à résumer..."
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    onClick={handleSummarize}
                    disabled={loading || !summaryText.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <SummarizeIcon />}
                    fullWidth
                  >
                    Créer le Résumé
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Résumé:
                  </Typography>
                  <Paper sx={{ p: 2, minHeight: 400, bgcolor: 'grey.50' }}>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {summaryResult || 'Le résumé apparaîtra ici...'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Onglet Statut */}
        {activeTab === 4 && (
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Statut du Service Ollama
                </Typography>
                <Button
                  variant="outlined"
                  onClick={testOllamaConnection}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  Actualiser
                </Button>
              </Box>
              
              {ollamaStatus ? (
                <Box>
                  <Alert 
                    severity={ollamaStatus.status === 'success' ? 'success' : 'error'}
                    icon={ollamaStatus.status === 'success' ? <CheckIcon /> : <ErrorIcon />}
                    sx={{ mb: 3 }}
                  >
                    <Typography variant="body1">
                      {ollamaStatus.message}
                    </Typography>
                  </Alert>
                  
                  {ollamaStatus.status === 'success' && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Modèles disponibles:
                      </Typography>
                      <Grid container spacing={2}>
                        {models.map((model) => (
                          <Grid item xs={12} md={6} key={model.name}>
                            <Paper sx={{ p: 2 }}>
                              <Chip
                                label={model.name}
                                color={model.name.includes('llama3.2') ? 'success' : 'primary'}
                                variant={model.name === selectedModel ? 'filled' : 'outlined'}
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="caption" display="block" color="text.secondary">
                                Taille: {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Modifié: {new Date(model.modified_at).toLocaleDateString()}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  
                  {ollamaStatus.suggestions && (
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Suggestions de résolution:
                      </Typography>
                      <List dense>
                        {ollamaStatus.suggestions.map((suggestion, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <InfoIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText primary={suggestion} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Test de connectivité en cours...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default DocuCortexTab;
