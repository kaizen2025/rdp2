import React, { useState, useEffect } from 'react';
import {
  Box,
  Tooltip,
  Chip,
  Typography,
  CircularProgress,
  Popover,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Sync,
  WifiOff,
  Refresh,
  SmartToy,
  Memory,
  Computer,
  DataUsage
} from '@mui/icons-material';

const StatusIndicator = ({ status = 'disconnected' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          color: 'success',
          icon: <CheckCircle />,
          label: 'Connecté',
          bgColor: 'success.light',
          textColor: 'success.contrastText'
        };
      case 'connecting':
        return {
          color: 'warning',
          icon: <CircularProgress size={16} />,
          label: 'Connexion...',
          bgColor: 'warning.light',
          textColor: 'warning.contrastText'
        };
      case 'disconnected':
        return {
          color: 'error',
          icon: <WifiOff />,
          label: 'Déconnecté',
          bgColor: 'error.light',
          textColor: 'error.contrastText'
        };
      case 'error':
        return {
          color: 'error',
          icon: <Error />,
          label: 'Erreur',
          bgColor: 'error.light',
          textColor: 'error.contrastText'
        };
      default:
        return {
          color: 'default',
          icon: <Warning />,
          label: 'Inconnu',
          bgColor: 'grey.300',
          textColor: 'grey.800'
        };
    }
  };

  const config = getStatusConfig(status);

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    if (systemInfo === null) {
      await fetchSystemInfo();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations système:', error);
      setSystemInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchSystemInfo();
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      <Tooltip title={`Ollama: ${config.label}`}>
        <Chip
          icon={config.icon}
          label={config.label}
          size="small"
          onClick={handleClick}
          sx={{
            bgcolor: config.bgColor,
            color: config.textColor,
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
              transform: 'scale(1.02)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        />
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 320,
            maxWidth: 400
          }
        }}
      >
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy color="primary" />
              <Typography variant="h6" color="primary">
                Statut Ollama
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : systemInfo ? (
            <Box>
              {systemInfo.error ? (
                <Typography color="error" variant="body2">
                  Erreur: {systemInfo.error}
                </Typography>
              ) : (
                <List dense>
                  {/* Status général */}
                  <ListItem>
                    <ListItemIcon>
                      {systemInfo.services?.ollama?.status === 'connected' ? 
                        <CheckCircle color="success" /> : 
                        <Error color="error" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary="État du service"
                      secondary={
                        systemInfo.services?.ollama?.status === 'connected' ? 
                          'Opérationnel' : 'Hors ligne'
                      }
                    />
                  </ListItem>

                  <Divider />

                  {/* Modèles disponibles */}
                  {systemInfo.services?.ollama?.models && (
                    <ListItem>
                      <ListItemIcon>
                        <DataUsage color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Modèles installés"
                        secondary={`${systemInfo.services.ollama.models.length} modèle(s)`}
                      />
                    </ListItem>
                  )}

                  {/* Configuration */}
                  {systemInfo.config && (
                    <>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <Computer color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Configuration"
                          secondary={`Hôte: ${systemInfo.config.host}`}
                        />
                      </ListItem>
                    </>
                  )}

                  {/* Métriques système */}
                  {systemInfo.system && (
                    <>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <Memory color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Mémoire"
                          secondary={
                            systemInfo.system.memory ? 
                              `${(systemInfo.system.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(systemInfo.system.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB utilisés` :
                              'Non disponible'
                          }
                        />
                      </ListItem>
                    </>
                  )}

                  {/* Uptime */}
                  {systemInfo.uptime && (
                    <ListItem>
                      <ListItemIcon>
                        <Sync color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Temps de fonctionnement"
                        secondary={formatUptime(systemInfo.uptime)}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Cliquez sur l'indicateur pour voir les détails
            </Typography>
          )}
        </Paper>
      </Popover>
    </Box>
  );
};

export default StatusIndicator;