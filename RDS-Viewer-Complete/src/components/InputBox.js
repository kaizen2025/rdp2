import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Fade,
  InputAdornment
} from '@mui/material';
import {
  Send,
  Stop,
  AttachFile,
  Image,
  PictureAsPdf,
  Description,
  SmartToy
} from '@mui/icons-material';

const InputBox = ({ 
  onSendMessage, 
  onStopGeneration, 
  disabled = false, 
  isStreaming = false 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const textFieldRef = useRef(null);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    if (disabled || isLoading || !inputValue.trim()) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      if (attachedFiles.length > 0) {
        // Traiter les fichiers attachés
        for (const file of attachedFiles) {
          const fileData = await processFile(file);
          await onSendMessage(fileData, 'file');
        }
        setAttachedFiles([]);
      } else {
        // Envoyer le message texte
        await onSendMessage(messageContent, 'text');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    } finally {
      setIsLoading(false);
      // Remettre le focus sur le champ
      setTimeout(() => {
        textFieldRef.current?.focus();
      }, 100);
    }
  }, [inputValue, attachedFiles, disabled, isLoading, onSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const processFile = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result
          };

          // Si c'est un document texte, lire le contenu
          if (file.type.startsWith('text/') || 
              file.name.endsWith('.txt') || 
              file.name.endsWith('.md')) {
            const textContent = await readTextFile(file);
            resolve({
              type: 'document',
              content: textContent,
              filename: file.name,
              originalFile: fileData
            });
          } else {
            resolve({
              type: 'file',
              filename: file.name,
              fileData: fileData
            });
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      
      if (file.type.startsWith('image/') || 
          file.type.startsWith('text/') || 
          file.name.endsWith('.txt') || 
          file.name.endsWith('.md')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }, []);

  const readTextFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Erreur lors de la lecture'));
      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Types de fichiers autorisés
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain', 'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]) || file.type.startsWith(type))) {
        console.warn(`Type de fichier non supporté: ${file.type}`);
        return false;
      }
      
      if (file.size > maxSize) {
        console.warn(`Fichier trop volumineux: ${file.name}`);
        return false;
      }
      
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  }, []);

  const removeFile = useCallback((index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = useCallback((file) => {
    if (file.type.startsWith('image/')) return <Image fontSize="small" />;
    if (file.type === 'application/pdf') return <PictureAsPdf fontSize="small" />;
    return <Description fontSize="small" />;
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
      {/* Fichiers attachés */}
      {attachedFiles.length > 0 && (
        <Fade in={true}>
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachedFiles.map((file, index) => (
              <Chip
                key={index}
                icon={getFileIcon(file)}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => removeFile(index)}
                variant="outlined"
                color="primary"
                size="small"
              />
            ))}
          </Box>
        </Fade>
      )}

      {/* Input Form */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        {/* Attach Button */}
        <Tooltip title="Joindre un fichier">
          <IconButton
            component="label"
            disabled={disabled || isLoading}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <AttachFile />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
              accept="image/*,.pdf,.txt,.md,.doc,.docx"
            />
          </IconButton>
        </Tooltip>

        {/* Text Input */}
        <TextField
          ref={textFieldRef}
          multiline
          maxRows={6}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            disabled 
              ? 'Assistant en cours d\'écriture...' 
              : 'Tapez votre message ou posez une question sur vos documents...'
          }
          disabled={disabled || isLoading}
          variant="standard"
          sx={{
            flex: 1,
            '& .MuiInputBase-input': {
              py: 1.5,
              px: 1,
              fontSize: '1rem'
            },
            '& .MuiInput-underline:before': {
              borderBottom: 'none'
            },
            '& .MuiInput-underline:after': {
              borderBottom: 'none'
            }
          }}
          InputProps={{
            disableUnderline: true,
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}>
                  <SmartToy fontSize="small" />
                  <span>IA</span>
                </Box>
              </InputAdornment>
            )
          }}
        />

        {/* Send/Stop Button */}
        {isStreaming ? (
          <Tooltip title="Arrêter la génération">
            <IconButton
              type="button"
              onClick={onStopGeneration}
              color="error"
              sx={{
                bgcolor: 'error.light',
                color: 'error.contrastText',
                '&:hover': {
                  bgcolor: 'error.main'
                }
              }}
            >
              <Stop />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Envoyer le message">
            <span>
              <IconButton
                type="submit"
                disabled={disabled || isLoading || !inputValue.trim() && attachedFiles.length === 0}
                color="primary"
                sx={{
                  bgcolor: (disabled || !inputValue.trim() && attachedFiles.length === 0) 
                    ? 'action.disabledBackground' 
                    : 'primary.main',
                  color: (disabled || !inputValue.trim() && attachedFiles.length === 0)
                    ? 'action.disabled'
                    : 'primary.contrastText',
                  '&:hover': {
                    bgcolor: (disabled || !inputValue.trim() && attachedFiles.length === 0)
                      ? 'action.disabledBackground'
                      : 'primary.dark'
                  }
                }}
              >
                {isLoading ? (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      border: '2px solid',
                      borderColor: 'inherit',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                ) : (
                  <Send />
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Paper>

      {/* Tips */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ 
          display: 'block', 
          mt: 1, 
          textAlign: 'center',
          fontSize: '0.7rem'
        }}
      >
        {isStreaming 
          ? 'Génération en cours... Cliquez sur Stop pour interrompre'
          : 'Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne'
        }
      </Typography>
    </Box>
  );
};

export default InputBox;