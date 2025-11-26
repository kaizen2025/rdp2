import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Avatar,
  Fab,
  Drawer
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Play,
  Stop,
  Refresh,
  Settings,
  Visibility,
  GetApp,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Timeline,
  AccountTree,
  Code,
  Preview,
  ExpandMore,
  Dashboard,
  Assignment,
  Schedule,
  Notifications,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { WorkflowEngine } from '../../services/workflowEngine';

/**
 * WorkflowDesigner - Éditeur visuel avancé de workflows
 * 
 * Fonctionnalités:
 * - Interface de design visuel avec canvas
 * - Édition des propriétés des nœuds
 * - Prévisualisation en temps réel
 * - Validation de workflow
 * - Import/Export de configurations
 */
const WorkflowDesigner = ({ workflowEngine, onWorkflowSaved }) => {
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [canvasMode, setCanvasMode] = useState('design'); // design, preview, simulation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
  
  // États de sauvegarde
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  
  // Import/Export
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  
  // Historique des modifications
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canvasRef = useRef();
  const workflowEngineRef = useRef();

  // Types de nœuds disponibles
  const nodeTypes = {
    start: {
      icon: <Dashboard />,
      color: 'success',
      label: 'Début',
      category: 'start'
    },
    end: {
      icon: <CheckCircle />,
      color: 'error',
      label: 'Fin',
      category: 'end'
    },
    task: {
      icon: <Assignment />,
      color: 'primary',
      label: 'Tâche',
      category: 'processing'
    },
    decision: {
      icon: <Warning />,
      color: 'warning',
      label: 'Décision',
      category: 'logic'
    },
    delay: {
      icon: <Schedule />,
      color: 'info',
      label: 'Délai',
      category: 'timing'
    },
    notification: {
      icon: <Notifications />,
      color: 'secondary',
      label: 'Notification',
      category: 'action'
    },
    data_sync: {
      icon: <Analytics />,
      color: 'primary',
      label: 'Sync Données',
      category: 'data'
    },
    escalation: {
      icon: <Error />,
      color: 'warning',
      label: 'Escalade',
      category: 'action'
    },
    auto_approval: {
      icon: <CheckCircle />,
      color: 'success',
      label: 'Auto Approval',
      category: 'processing'
    }
  };

  // Propriétés par défaut des nœuds
  const defaultNodeProperties = {
    start: { name: 'Début', description: 'Point de départ du workflow' },
    end: { name: 'Fin', description: 'Point de fin du workflow' },
    task: { 
      name: 'Nouvelle tâche', 
      description: 'Description de la tâche',
      config: { taskType: 'generic', parameters: {} }
    },
    decision: { 
      name: 'Condition', 
      description: 'Logique de décision',
      config: { condition: '', trueLabel: 'Oui', falseLabel: 'Non' }
    },
    delay: { 
      name: 'Délai', 
      description: 'Attente avant de continuer',
      config: { duration: 1000, unit: 'ms' }
    },
    notification: { 
      name: 'Notification', 
      description: 'Envoyer une notification',
      config: { type: 'email', recipients: [], template: 'default' }
    },
    data_sync: { 
      name: 'Sync Données', 
      description: 'Synchroniser les données',
      config: { source: '', target: '', direction: 'bidirectional' }
    },
    escalation: { 
      name: 'Escalade', 
      description: 'Escalader vers un niveau supérieur',
      config: { level: 1, timeout: 300000 }
    },
    auto_approval: { 
      name: 'Auto Approval', 
      description: 'Approbation automatique',
      config: { rules: [], threshold: 0.8 }
    }
  };

  // Initialiser le workflow engine
  useEffect(() => {
    if (!workflowEngine) {
      workflowEngineRef.current = new WorkflowEngine();
    } else {
      workflowEngineRef.current = workflowEngine;
    }
    
    // Charger ou créer un workflow par défaut
    if (!currentWorkflow) {
      createNewWorkflow();
    }
  }, [workflowEngine]);

  // Gérer les changements non sauvegardés
  useEffect(() => {
    setUnsavedChanges(historyIndex < history.length - 1);
  }, [nodes, connections, historyIndex, history.length]);

  // Créer un nouveau workflow
  const createNewWorkflow = () => {
    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      name: 'Nouveau Workflow',
      description: '',
      version: '1.0.0',
      status: 'draft',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes: [],
      connections: [],
      config: {}
    };
    
    setCurrentWorkflow(newWorkflow);
    setNodes([]);
    setConnections([]);
    setValidationErrors([]);
    setHistory([JSON.stringify(newWorkflow)]);
    setHistoryIndex(0);
    setWorkflowName(newWorkflow.name);
  };

  // Ajouter un nœud
  const addNode = (type, position = { x: 100, y: 100 }) => {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode = {
      id: nodeId,
      type,
      position,
      properties: { ...defaultNodeProperties[type] },
      selected: false
    };
    
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    saveToHistory(updatedNodes, connections);
    
    return newNode;
  };

  // Supprimer un nœud
  const deleteNode = (nodeId) => {
    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    const updatedConnections = connections.filter(
      conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    );
    
    setNodes(updatedNodes);
    setConnections(updatedConnections);
    setSelectedNode(null);
    saveToHistory(updatedNodes, updatedConnections);
  };

  // Connecter deux nœuds
  const connectNodes = (sourceId, targetId, condition = '') => {
    if (sourceId === targetId) return;
    
    // Vérifier si la connexion existe déjà
    const existingConnection = connections.find(
      conn => conn.sourceNodeId === sourceId && conn.targetNodeId === targetId
    );
    
    if (existingConnection) return;
    
    const newConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      condition,
      selected: false
    };
    
    const updatedConnections = [...connections, newConnection];
    setConnections(updatedConnections);
    saveToHistory(nodes, updatedConnections);
    
    return newConnection;
  };

  // Supprimer une connexion
  const deleteConnection = (connectionId) => {
    const updatedConnections = connections.filter(conn => conn.id !== connectionId);
    setConnections(updatedConnections);
    setSelectedConnection(null);
    saveToHistory(nodes, updatedConnections);
  };

  // Mettre à jour les propriétés d'un nœud
  const updateNodeProperties = (nodeId, properties) => {
    const updatedNodes = nodes.map(node =>
      node.id === nodeId 
        ? { ...node, properties: { ...node.properties, ...properties } }
        : node
    );
    
    setNodes(updatedNodes);
    saveToHistory(updatedNodes, connections);
  };

  // Gérer la sélection de nœuds
  const handleNodeClick = (nodeId, event) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-sélection (non implémenté dans cette version)
      return;
    }
    
    // Désélectionner tous les nœuds
    const deselectedNodes = nodes.map(node => ({ ...node, selected: false }));
    
    // Sélectionner le nœud cliqué
    const selectedNodes = deselectedNodes.map(node =>
      node.id === nodeId ? { ...node, selected: true } : node
    );
    
    setNodes(selectedNodes);
    setSelectedNode(selectedNodes.find(node => node.id === nodeId));
    setSelectedConnection(null);
  };

  // Gérer le glisser-déposer des nœuds
  const handleMouseDown = (nodeId, event) => {
    event.preventDefault();
    setIsDragging(true);
    setDraggedNode(nodeId);
    
    const startX = event.clientX - pan.x;
    const startY = event.clientY - pan.y;
    
    const handleMouseMove = (e) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      const updatedNodes = nodes.map(node =>
        node.id === nodeId
          ? { ...node, position: { x: newX / zoom, y: newY / zoom } }
          : node
      );
      
      setNodes(updatedNodes);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
      saveToHistory(nodes, connections);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Valider le workflow
  const validateWorkflow = () => {
    const errors = [];
    
    // Vérifier qu'il y a au moins un nœud de début
    const startNodes = nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Le workflow doit avoir au moins un nœud de début');
    }
    
    if (startNodes.length > 1) {
      errors.push('Le workflow ne peut avoir qu\'un seul nœud de début');
    }
    
    // Vérifier les connexions orphelines
    nodes.forEach(node => {
      if (node.type !== 'start') {
        const incomingConnections = connections.filter(conn => conn.targetNodeId === node.id);
        if (incomingConnections.length === 0) {
          errors.push(`Le nœud "${node.properties.name}" n'a pas de connexion entrante`);
        }
      }
      
      if (node.type !== 'end') {
        const outgoingConnections = connections.filter(conn => conn.sourceNodeId === node.id);
        if (outgoingConnections.length === 0) {
          errors.push(`Le nœud "${node.properties.name}" n'a pas de connexion sortante`);
        }
      }
    });
    
    // Vérifier les propriétés requises
    nodes.forEach(node => {
      if (!node.properties.name?.trim()) {
        errors.push(`Le nœud "${node.type}" doit avoir un nom`);
      }
    });
    
    setValidationErrors(errors);
    setIsValid(errors.length === 0);
    
    return errors;
  };

  // Sauvegarder l'historique
  const saveToHistory = (updatedNodes, updatedConnections) => {
    const workflowState = {
      ...currentWorkflow,
      nodes: updatedNodes,
      connections: updatedConnections
    };
    
    // Supprimer les états futurs si on est au milieu de l'historique
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(workflowState));
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Annuler
  const undo = () => {
    if (historyIndex > 0) {
      const previousIndex = historyIndex - 1;
      const previousState = JSON.parse(history[previousIndex]);
      
      setNodes(previousState.nodes || []);
      setConnections(previousState.connections || []);
      setHistoryIndex(previousIndex);
    }
  };

  // Refaire
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = JSON.parse(history[nextIndex]);
      
      setNodes(nextState.nodes || []);
      setConnections(nextState.connections || []);
      setHistoryIndex(nextIndex);
    }
  };

  // Sauvegarder le workflow
  const saveWorkflow = async () => {
    if (!workflowName.trim()) return;
    
    setSaving(true);
    
    try {
      const workflow = {
        ...currentWorkflow,
        name: workflowName,
        nodes,
        connections,
        modified: new Date().toISOString()
      };
      
      await workflowEngineRef.current.saveWorkflow(workflow);
      setCurrentWorkflow(workflow);
      setUnsavedChanges(false);
      setSaveDialogOpen(false);
      
      if (onWorkflowSaved) {
        onWorkflowSaved(workflow);
      }
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  // Exporter le workflow
  const exportWorkflow = () => {
    const exportData = {
      ...currentWorkflow,
      nodes,
      connections,
      exported: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName || 'workflow'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Importer un workflow
  const importWorkflow = () => {
    try {
      const importObject = JSON.parse(importData);
      
      setCurrentWorkflow(importObject);
      setNodes(importObject.nodes || []);
      setConnections(importObject.connections || []);
      setWorkflowName(importObject.name || '');
      setHistory([JSON.stringify(importObject)]);
      setHistoryIndex(0);
      
      setImportDialogOpen(false);
      setImportData('');
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    }
  };

  // Simuler l'exécution
  const simulateWorkflow = () => {
    setCanvasMode('simulation');
    // Logique de simulation à implémenter
  };

  // Prévisualiser le workflow
  const previewWorkflow = () => {
    setCanvasMode('preview');
    validateWorkflow();
  };

  // Gérer le zoom
  const handleZoom = (delta) => {
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
    setZoom(newZoom);
  };

  // Centrer le canvas
  const centerCanvas = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Rendu du nœud
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type];
    const isSelected = node.selected;
    
    return (
      <Box
        key={node.id}
        sx={{
          position: 'absolute',
          left: node.position.x * zoom + pan.x,
          top: node.position.y * zoom + pan.y,
          width: 120 * zoom,
          height: 60 * zoom,
          cursor: 'move',
          border: isSelected ? '2px solid #1976d2' : '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 2,
          '&:hover': {
            boxShadow: 3
          }
        }}
        onMouseDown={(e) => handleMouseDown(node.id, e)}
        onClick={(e) => handleNodeClick(node.id, e)}
      >
        <Box sx={{ textAlign: 'center', p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
            <nodeType.icon sx={{ fontSize: 16 * zoom, mr: 1, color: `${nodeType.color}.main` }} />
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: 10 * zoom, 
              fontWeight: 'bold',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {node.properties.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Rendu de la connexion
  const renderConnection = (connection) => {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = nodes.find(n => n.id === connection.targetNodeId);
    
    if (!sourceNode || !targetNode) return null;
    
    const sourceX = (sourceNode.position.x + 60) * zoom + pan.x;
    const sourceY = (sourceNode.position.y + 30) * zoom + pan.y;
    const targetX = (targetNode.position.x + 60) * zoom + pan.x;
    const targetY = (targetNode.position.y + 30) * zoom + pan.y;
    
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    const pathData = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    
    return (
      <g key={connection.id}>
        <path
          d={pathData}
          stroke={connection.selected ? '#1976d2' : '#666'}
          strokeWidth={connection.selected ? 3 : 2}
          fill="none"
          markerEnd="url(#arrowhead)"
          style={{ cursor: 'pointer' }}
        />
        
        {connection.condition && (
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            fontSize={12 * zoom}
            fill="#666"
            style={{ userSelect: 'none' }}
          >
            {connection.condition}
          </text>
        )}
      </g>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Concepteur de Workflow
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Undo />}
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              Annuler
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Redo />}
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              Refaire
            </Button>
            
            <Button
              variant="outlined"
              onClick={centerCanvas}
            >
              Centrer
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Nouveau Nœud</InputLabel>
            <Select label="Nouveau Nœud">
              {Object.entries(nodeTypes).map(([type, config]) => (
                <MenuItem key={type} onClick={() => addNode(type)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <config.icon sx={{ fontSize: 20 }} />
                    {config.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<ZoomOut />}
            onClick={() => handleZoom(-0.1)}
          >
            Zoom -
          </Button>
          
          <Typography variant="body2">
            {Math.round(zoom * 100)}%
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<ZoomIn />}
            onClick={() => handleZoom(0.1)}
          >
            Zoom +
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            variant="outlined"
            onClick={previewWorkflow}
            startIcon={<Preview />}
          >
            Prévisualiser
          </Button>
          
          <Button
            variant="outlined"
            onClick={simulateWorkflow}
            startIcon={<Play />}
          >
            Simuler
          </Button>
          
          <Button
            variant="contained"
            onClick={() => setSaveDialogOpen(true)}
            startIcon={<Save />}
            disabled={saving}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Palette de nœuds */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: 200,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 200,
              boxSizing: 'border-box',
              mt: 8
            }
          }}
        >
          <Typography variant="h6" sx={{ p: 2 }}>
            Nœuds
          </Typography>
          
          <List dense>
            {Object.entries(nodeTypes).map(([type, config]) => (
              <ListItem
                key={type}
                button
                onClick={() => addNode(type)}
              >
                <ListItemIcon>
                  <config.icon color={config.color} />
                </ListItemIcon>
                <ListItemText primary={config.label} />
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Canvas principal */}
        <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: 'grey.100' }}>
          <Box
            ref={canvasRef}
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onClick={() => {
              setSelectedNode(null);
              setSelectedConnection(null);
            }}
          >
            {/* Grille de fond */}
            <svg
              width="100%"
              height="100%"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            >
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                </pattern>
                
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#666"
                  />
                </marker>
              </defs>
              
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            
            {/* Connexions */}
            <svg
              width="100%"
              height="100%"
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              {connections.map(renderConnection)}
            </svg>
            
            {/* Nœuds */}
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              {nodes.map(renderNode)}
            </Box>
            
            {/* Bouton flottant pour ajouter un nœud rapidement */}
            <Fab
              color="primary"
              aria-label="add"
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16
              }}
              onClick={() => {
                const centerX = canvasRef.current?.clientWidth / 2 || 400;
                const centerY = canvasRef.current?.clientHeight / 2 || 300;
                addNode('task', { x: centerX / zoom - 60, y: centerY / zoom - 30 });
              }}
            >
              <Add />
            </Fab>
          </Box>
        </Box>

        {/* Panneau de propriétés */}
        {propertiesPanelOpen && (
          <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Propriétés
            </Typography>
            
            {selectedNode ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Nœud: {selectedNode.type}
                </Typography>
                
                <TextField
                  fullWidth
                  size="small"
                  label="Nom"
                  value={selectedNode.properties.name || ''}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  label="Description"
                  value={selectedNode.properties.description || ''}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { description: e.target.value })}
                  sx={{ mb: 2 }}
                />
                
                {/* Propriétés spécifiques au type */}
                {selectedNode.type === 'decision' && (
                  <Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Condition"
                      value={selectedNode.properties.config?.condition || ''}
                      onChange={(e) => updateNodeProperties(selectedNode.id, { 
                        config: { ...selectedNode.properties.config, condition: e.target.value }
                      })}
                      sx={{ mb: 1 }}
                    />
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="Libellé Vrai"
                      value={selectedNode.properties.config?.trueLabel || ''}
                      onChange={(e) => updateNodeProperties(selectedNode.id, { 
                        config: { ...selectedNode.properties.config, trueLabel: e.target.value }
                      })}
                      sx={{ mb: 1 }}
                    />
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="Libellé Faux"
                      value={selectedNode.properties.config?.falseLabel || ''}
                      onChange={(e) => updateNodeProperties(selectedNode.id, { 
                        config: { ...selectedNode.properties.config, falseLabel: e.target.value }
                      })}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => deleteNode(selectedNode.id)}
                >
                  Supprimer
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Sélectionnez un nœud pour modifier ses propriétés
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      {/* Erreurs de validation */}
      {!isValid && validationErrors.length > 0 && (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Erreurs de validation ({validationErrors.length}):
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((error, index) => (
              <li key={index}>
                <Typography variant="body2">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Dialog de sauvegarde */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sauvegarder le Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nom du workflow"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              exportWorkflow();
              setSaveDialogOpen(false);
            }}
            variant="outlined"
          >
            Exporter
          </Button>
          <Button
            onClick={saveWorkflow}
            variant="contained"
            disabled={!workflowName.trim() || saving}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'import */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importer un Workflow</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Configuration JSON"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Collez ici la configuration JSON du workflow..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={importWorkflow}
            variant="contained"
            disabled={!importData.trim()}
          >
            Importer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowDesigner;