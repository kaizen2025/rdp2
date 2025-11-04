import React, { useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  SmartToy,
  Person,
  ContentCopy,
  ThumbUp,
  ThumbDown,
  Refresh
} from '@mui/icons-material';

const ChatMessage = ({ message, isStreaming = false }) => {
  const messageRef = useRef(null);

  useEffect(() => {
    if (isStreaming && messageRef.current) {
      messageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [isStreaming, message.content]);

  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content) => {
    // Support du markdown basique
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>') // Inline code
      .replace(/\n/g, '<br />'); // New lines

    return { __html: formatted };
  };

  return (
    <Box
      ref={messageRef}
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1,
        px: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: '85%',
          gap: 1
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            flexShrink: 0
          }}
        >
          {isUser ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
        </Avatar>

        {/* Message Container */}
        <Paper
          elevation={1}
          sx={{
            position: 'relative',
            p: 2,
            maxWidth: '100%',
            bgcolor: isUser 
              ? 'primary.main' 
              : isAssistant 
                ? message.error 
                  ? 'error.light' 
                  : 'background.paper'
                : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: isUser 
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            border: message.error ? '1px solid' : 'none',
            borderColor: 'error.main'
          }}
        >
          {/* Message Content */}
          {isUser ? (
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
          ) : (
            <Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  wordBreak: 'break-word',
                  '& strong': { fontWeight: 'bold' },
                  '& em': { fontStyle: 'italic' },
                  '& code': { 
                    backgroundColor: 'grey.100',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontFamily: 'monospace'
                  }
                }}
                dangerouslySetInnerHTML={formatContent(message.content)}
              />
              {isStreaming && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 16,
                    bgcolor: 'primary.main',
                    ml: 0.5,
                    animation: 'blink 1s infinite',
                    '@keyframes blink': {
                      '0%, 50%': { opacity: 1 },
                      '51%, 100%': { opacity: 0 }
                    }
                  }}
                />
              )}
            </Box>
          )}

          {/* Message Actions */}
          {isAssistant && !message.error && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 0.5,
                mt: 1,
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              <Tooltip title="Copier le message">
                <IconButton 
                  size="small" 
                  onClick={copyToClipboard}
                  sx={{ color: 'text.secondary' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Bon message">
                <IconButton 
                  size="small" 
                  sx={{ color: 'text.secondary' }}
                >
                  <ThumbUp fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Mauvais message">
                <IconButton 
                  size="small" 
                  sx={{ color: 'text.secondary' }}
                >
                  <ThumbDown fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: -16,
              right: 8,
              color: 'text.secondary',
              fontSize: '0.7rem'
            }}
          >
            {formatTime(message.timestamp)}
          </Typography>

          {/* Error indicator */}
          {message.error && (
            <Chip
              label="Erreur"
              size="small"
              color="error"
              sx={{
                position: 'absolute',
                top: -8,
                left: 8,
                fontSize: '0.6rem',
                height: 20
              }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatMessage;