// src/components/workflow/WorkflowBuilder.js - BUILDER DE WORKFLOW AVEC DRAG & DROP
// Interface graphique pour créer, éditer et gérer les workflows DocuCortex

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    Tabs,
    Tab,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Add,
    PlayArrow,
    Pause,
    Save,
    Settings,
    Delete,
    Copy,
    Download,
    Upload,
    DragIndicator,
    CheckCircle,
    Error,
    Warning,
    Info,
    Speed,
    Timeline,
    Code,
    Visibility,
    VisibilityOff,
    Refresh,
    Schedule,
    FilterList,
    Clear
} from '@mui/icons-material';
import { workflowEngine } from '../../services/workflowEngine';
import { alertManager } from '../../services/alertManager';

class WorkflowBuilder extends React.Component {
    constructor(props) {
        super(props);
        
        this.canvasRef = React.createRef();
        this.dragState = useRef({
            isDragging: false,
            draggedNode: null,
            dragOffset: { x: 0, y: 0 },
            dropZone: null
        });
        
        this.state = {
            // Interface
            activeTab: 'design',
            selectedNode: null,
            selectedConnection: null,
            isSimulation: false,
            
            // Workflow
            workflow: {
                id: null,
                name: 'Nouveau Workflow',
                description: '',
                version: '1.0.0',
                enabled: true,
                tasks: [],
                triggers: [],
                variables: {},
                connections: [],
                metadata: {
                    category: 'general',
                    priority: 'normal',
                    tags: []
                }
            },
            
            // Palette de tâches
            taskPalette: [
                {
                    type: 'auto-approval',
                    name: 'Approbation Auto',
                    icon: <CheckCircle />,
                    color: '#4CAF50',
                    category: 'Logique',
                    description: 'Approuve automatiquement selon des critères'
                },
                {
                    type: 'notification',
                    name: 'Notification',
                    icon: <Info />,
                    color: '#2196F3',
                    category: 'Communication',
                    description: 'Envoie des notifications'
                },
                {
                    type: 'escalation',
                    name: 'Escalade',
                    icon: <Error />,
                    color: '#FF5722',
                    category: 'Gestion',
                    description: 'Escalade automatiquement les problèmes'
                },
                {
                    type: 'data-sync',
                    name: 'Sync Données',
                    icon: <Refresh />,
                    color: '#9C27B0',
                    category: 'Données',
                    description: 'Synchronise les données'
                },
                {
                    type: 'report',
                    name: 'Génération Rapport',
                    icon: <Timeline />,
                    color: '#FF9800',
                    category: 'Rapports',
                    description: 'Génère des rapports'
                },
                {
                    type: 'condition',
                    name: 'Condition',
                    icon: <FilterList />,
                    color: '#607D8B',
                    category: 'Logique',
                    description: 'Évalue des conditions'
                },
                {
                    type: 'delay',
                    name: 'Attente',
                    icon: <Schedule />,
                    color: '#795548',
                    category: 'Contrôle',
                    description: 'Insère un délai'
                },
                {
                    type: 'api-call',
                    name: 'Appel API',
                    icon: <Code />,
                    color: '#3F51B5',
                    category: 'Intégration',
                    description: 'Appelle une API externe'
                }
            ],
            
            // État des connexions
            connections: [],
            isConnecting: false,
            connectionStart: null,
            
            // Modals
            taskModalOpen: false,
            connectionModalOpen: false,
            workflowModalOpen: false,
            settingsModalOpen: false,
            
            // Validation
            validationErrors: [],
            validationWarnings: [],
            
            // Simulation
            simulationRunning: false,
            simulationResults: null,
            currentSimulationStep: 0,
            
            // Recherche et filtrage
            searchTerm: '',
            filteredTasks: [],
            showHidden: false,
            
            // Historique
            history: [],
            historyIndex: -1,
            
            // Performance
            canvasZoom: 1,
            canvasOffset: { x: 0, y: 0 },
            canvasSize: { width: 2000, height: 1200 }
        };
        
        this.initializeBuilder();
    }
    
    async initializeBuilder() {
        // Écouter les événements du moteur de workflow
        workflowEngine.on('workflow-created', this.handleWorkflowCreated);
        workflowEngine.on('workflow-updated', this.handleWorkflowUpdated);
        workflowEngine.on('task-completed', this.handleTaskCompleted);
        workflowEngine.on('task-failed', this.handleTaskFailed);
        
        // Écouter les événements d'alertes
        alertManager.on('alert-created', this.handleAlertCreated);
        
        // Charger les workflows existants
        await this.loadExistingWorkflows();
        
        // Initialiser l'historique
        this.saveStateToHistory('initial');
    }
    
    componentDidMount() {
        // Ajouter les event listeners globaux
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Initialiser le canvas
        this.initializeCanvas();
    }
    
    componentWillUnmount() {
        // Retirer les event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        // Retirer les listeners du workflow engine
        workflowEngine.off('workflow-created', this.handleWorkflowCreated);
        workflowEngine.off('workflow-updated', this.handleWorkflowUpdated);
        workflowEngine.off('task-completed', this.handleTaskCompleted);
        workflowEngine.off('task-failed', this.handleTaskFailed);
        
        alertManager.off('alert-created', this.handleAlertCreated);
    }
    
    // === GESTION DES ÉVÉNEMENTS ===
    
    handleWorkflowCreated = (workflow) => {
        console.log('Workflow créé:', workflow);
        this.showNotification('success', `Workflow "${workflow.name}" créé avec succès`);
    };
    
    handleWorkflowUpdated = (workflow) => {
        console.log('Workflow mis à jour:', workflow);
        this.showNotification('success', `Workflow "${workflow.name}" mis à jour`);
    };
    
    handleTaskCompleted = (data) => {
        console.log('Tâche complétée:', data);
    };
    
    handleTaskFailed = (data) => {
        console.log('Tâche échouée:', data);
        this.showNotification('error', `Échec de la tâche: ${data.error}`);
    };
    
    handleAlertCreated = (alert) => {
        console.log('Alerte créée:', alert);
    };
    
    handleKeyDown = (event) => {
        // Gestion des raccourcis clavier
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 's':
                    event.preventDefault();
                    this.handleSaveWorkflow();
                    break;
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'a':
                    event.preventDefault();
                    this.selectAllNodes();
                    break;
                case 'Delete':
                case 'Backspace':
                    event.preventDefault();
                    this.deleteSelected();
                    break;
            }
        }
        
        // Supprimer avec Delete/Backspace
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (this.state.selectedNode) {
                this.deleteNode(this.state.selectedNode.id);
            }
        }
    };
    
    handleMouseMove = (event) => {
        if (this.dragState.current.isDragging) {
            const rect = this.canvasRef.current.getBoundingClientRect();
            const x = (event.clientX - rect.left - this.state.canvasOffset.x) / this.state.canvasZoom;
            const y = (event.clientY - rect.top - this.state.canvasOffset.y) / this.state.canvasZoom;
            
            this.updateDragPosition(x, y);
        }
    };
    
    handleMouseUp = (event) => {
        if (this.dragState.current.isDragging) {
            this.endDrag();
        }
    };
    
    // === GESTION DU CANVAS ===
    
    initializeCanvas = () => {
        // Initialiser la grille et les guides
        this.drawGrid();
    };
    
    drawGrid = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const { width, height } = this.state.canvasSize;
        
        // Nettoyer le canvas
        ctx.clearRect(0, 0, width, height);
        
        // Dessiner la grille
        const gridSize = 20;
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Redessiner les nœuds et connexions
        this.drawNodes();
        this.drawConnections();
    };
    
    // === GESTION DES TÂCHES ===
    
    addTaskFromPalette = (taskType) => {
        const paletteTask = this.state.taskPalette.find(t => t.type === taskType);
        if (!paletteTask) return;
        
        const newTask = {
            id: this.generateTaskId(),
            type: taskType,
            name: paletteTask.name,
            x: 100 + Math.random() * 400,
            y: 100 + Math.random() * 400,
            width: 120,
            height: 80,
            config: this.getDefaultTaskConfig(taskType),
            inputs: [],
            outputs: [],
            status: 'idle',
            execution: null
        };
        
        this.setState(prevState => ({
            workflow: {
                ...prevState.workflow,
                tasks: [...prevState.workflow.tasks, newTask]
            },
            selectedNode: newTask
        }), () => {
            this.saveStateToHistory('add-task');
            this.drawGrid();
        });
    };
    
    getDefaultTaskConfig = (taskType) => {
        const configs = {
            'auto-approval': {
                maxLoanDays: 30,
                maxUserLoans: 3,
                notifyOnApproval: true,
                notifyOnRejection: true
            },
            'notification': {
                type: 'info',
                recipients: [],
                channels: ['inApp'],
                template: 'default'
            },
            'escalation': {
                levels: [
                    { delay: 300000, recipients: ['admin'] }
                ],
                triggers: ['overdue_loans']
            },
            'data-sync': {
                source: 'api',
                target: 'database',
                syncType: 'incremental'
            },
            'report': {
                template: 'loan_summary',
                format: 'pdf',
                schedule: null
            },
            'condition': {
                conditions: [],
                logicalOperator: 'AND'
            },
            'delay': {
                duration: 5000,
                unit: 'milliseconds'
            },
            'api-call': {
                method: 'GET',
                url: '',
                headers: {},
                timeout: 30000
            }
        };
        
        return configs[taskType] || {};
    };
    
    updateTask = (taskId, updates) => {
        this.setState(prevState => ({
            workflow: {
                ...prevState.workflow,
                tasks: prevState.workflow.tasks.map(task =>
                    task.id === taskId ? { ...task, ...updates } : task
                )
            }
        }), () => {
            this.saveStateToHistory('update-task');
            this.drawGrid();
        });
    };
    
    deleteNode = (taskId) => {
        this.setState(prevState => ({
            workflow: {
                ...prevState.workflow,
                tasks: prevState.workflow.tasks.filter(task => task.id !== taskId),
                connections: prevState.workflow.connections.filter(conn =>
                    conn.source !== taskId && conn.target !== taskId
                )
            },
            selectedNode: null
        }), () => {
            this.saveStateToHistory('delete-node');
            this.drawGrid();
        });
    };
    
    // === GESTION DES CONNEXIONS ===
    
    startConnection = (taskId, portType = 'output') => {
        const task = this.state.workflow.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.setState({
            isConnecting: true,
            connectionStart: {
                taskId,
                portType,
                x: task.x + (portType === 'output' ? task.width : 0),
                y: task.y + task.height / 2
            }
        });
    };
    
    createConnection = (sourceId, targetId) => {
        const connection = {
            id: this.generateConnectionId(),
            source: sourceId,
            target: targetId,
            type: 'data',
            condition: null,
            enabled: true
        };
        
        this.setState(prevState => ({
            workflow: {
                ...prevState.workflow,
                connections: [...prevState.workflow.connections, connection]
            },
            isConnecting: false,
            connectionStart: null
        }), () => {
            this.saveStateToHistory('add-connection');
            this.drawGrid();
        });
    };
    
    deleteConnection = (connectionId) => {
        this.setState(prevState => ({
            workflow: {
                ...prevState.workflow,
                connections: prevState.workflow.connections.filter(conn => conn.id !== connectionId)
            },
            selectedConnection: null
        }), () => {
            this.saveStateToHistory('delete-connection');
            this.drawGrid();
        });
    };
    
    // === GESTION DU DRAG & DROP ===
    
    startDrag = (taskId, event) => {
        event.preventDefault();
        const task = this.state.workflow.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const rect = this.canvasRef.current.getBoundingClientRect();
        const canvasX = (event.clientX - rect.left - this.state.canvasOffset.x) / this.state.canvasZoom;
        const canvasY = (event.clientY - rect.top - this.state.canvasOffset.y) / this.state.canvasZoom;
        
        this.dragState.current = {
            isDragging: true,
            draggedNode: task,
            dragOffset: {
                x: canvasX - task.x,
                y: canvasY - task.y
            }
        };
        
        this.setState({
            selectedNode: task
        });
    };
    
    updateDragPosition = (x, y) => {
        const { draggedNode, dragOffset } = this.dragState.current;
        if (!draggedNode) return;
        
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        
        this.updateTask(draggedNode.id, { x: newX, y: newY });
    };
    
    endDrag = () => {
        this.dragState.current.isDragging = false;
        this.dragState.current.draggedNode = null;
    };
    
    // === SIMULATION ===
    
    startSimulation = async () => {
        this.setState({
            simulationRunning: true,
            currentSimulationStep: 0,
            simulationResults: null
        });
        
        try {
            // Créer un contexte de simulation
            const simulationContext = {
                mode: 'simulation',
                dryRun: true,
                variables: {}
            };
            
            // Simuler l'exécution
            const results = await this.simulateWorkflow(simulationContext);
            
            this.setState({
                simulationRunning: false,
                simulationResults: results,
                isSimulation: true
            });
            
            this.showNotification('success', 'Simulation terminée avec succès');
            
        } catch (error) {
            this.setState({
                simulationRunning: false
            });
            
            this.showNotification('error', `Erreur de simulation: ${error.message}`);
        }
    };
    
    simulateWorkflow = async (context) => {
        const results = {
            steps: [],
            totalTime: 0,
            success: true,
            errors: []
        };
        
        const startTime = Date.now();
        
        for (const task of this.state.workflow.tasks) {
            const stepStart = Date.now();
            
            try {
                // Simuler l'exécution de la tâche
                const stepResult = await this.simulateTaskExecution(task, context);
                
                results.steps.push({
                    taskId: task.id,
                    taskName: task.name,
                    type: task.type,
                    status: 'completed',
                    duration: Date.now() - stepStart,
                    result: stepResult,
                    timestamp: new Date().toISOString()
                });
                
                // Vérifier les conditions pour les connexions
                for (const connection of this.state.workflow.connections) {
                    if (connection.source === task.id) {
                        const conditionResult = this.evaluateConnectionCondition(connection, results.steps);
                        if (!conditionResult) {
                            // Ignorer cette connexion
                            continue;
                        }
                    }
                }
                
            } catch (error) {
                results.success = false;
                results.errors.push({
                    taskId: task.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                results.steps.push({
                    taskId: task.id,
                    taskName: task.name,
                    type: task.type,
                    status: 'failed',
                    duration: Date.now() - stepStart,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                // Arrêter si la tâche a échoué et que c'est critique
                if (this.isTaskCritical(task)) {
                    break;
                }
            }
        }
        
        results.totalTime = Date.now() - startTime;
        return results;
    };
    
    simulateTaskExecution = async (task, context) => {
        // Simulation simplifiée de l'exécution des tâches
        const simulationDelays = {
            'auto-approval': 1000,
            'notification': 500,
            'escalation': 2000,
            'data-sync': 3000,
            'report': 5000,
            'condition': 100,
            'delay': task.config.duration || 1000,
            'api-call': 1500
        };
        
        const delay = simulationDelays[task.type] || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Résultats simulés par type de tâche
        const mockResults = {
            'auto-approval': {
                decision: 'auto_approve',
                confidence: 0.85,
                criteria: {
                    loanDuration: { withinLimit: true },
                    userLoanCount: { withinLimit: true },
                    documentCategory: { isRestricted: false }
                }
            },
            'notification': {
                sent: true,
                recipients: 1,
                channels: ['inApp']
            },
            'escalation': {
                escalated: false,
                level: 0,
                actions: []
            },
            'data-sync': {
                synced: 45,
                failed: 2,
                skipped: 1
            },
            'report': {
                generated: true,
                format: 'pdf',
                pages: 3
            },
            'condition': {
                result: Math.random() > 0.3,
                evaluatedConditions: task.config.conditions?.length || 0
            },
            'delay': {
                delayed: true,
                duration: task.config.duration || 1000
            },
            'api-call': {
                success: true,
                statusCode: 200,
                responseTime: delay
            }
        };
        
        return mockResults[task.type] || { simulated: true };
    };
    
    evaluateConnectionCondition = (connection, steps) => {
        if (!connection.condition) return true;
        
        // Évaluation simple des conditions de connexion
        // Dans une implémentation réelle, ceci serait plus sophistiqué
        return Math.random() > 0.2; // 80% de chance que la condition soit vraie
    };
    
    isTaskCritical = (task) => {
        const criticalTasks = ['escalation', 'auto-approval'];
        return criticalTasks.includes(task.type);
    };
    
    // === VALIDATION ===
    
    validateWorkflow = () => {
        const errors = [];
        const warnings = [];
        
        // Vérifier que le workflow a au moins une tâche
        if (this.state.workflow.tasks.length === 0) {
            errors.push('Le workflow doit contenir au moins une tâche');
        }
        
        // Vérifier que toutes les connexions sont valides
        this.state.workflow.connections.forEach(connection => {
            const sourceTask = this.state.workflow.tasks.find(t => t.id === connection.source);
            const targetTask = this.state.workflow.tasks.find(t => t.id === connection.target);
            
            if (!sourceTask) {
                errors.push(`Connexion ${connection.id}: tâche source introuvable`);
            }
            
            if (!targetTask) {
                errors.push(`Connexion ${connection.id}: tâche cible introuvable`);
            }
        });
        
        // Vérifier les tâches orphelines
        const connectedTasks = new Set();
        this.state.workflow.connections.forEach(conn => {
            connectedTasks.add(conn.source);
            connectedTasks.add(conn.target);
        });
        
        this.state.workflow.tasks.forEach(task => {
            if (!connectedTasks.has(task.id) && this.state.workflow.tasks.length > 1) {
                warnings.push(`La tâche "${task.name}" n'est connectée à aucune autre tâche`);
            }
        });
        
        // Vérifier la configuration des tâches
        this.state.workflow.tasks.forEach(task => {
            const configValidation = this.validateTaskConfig(task);
            errors.push(...configValidation.errors);
            warnings.push(...configValidation.warnings);
        });
        
        this.setState({
            validationErrors: errors,
            validationWarnings: warnings
        });
        
        return { errors, warnings };
    };
    
    validateTaskConfig = (task) => {
        const errors = [];
        const warnings = [];
        
        switch (task.type) {
            case 'auto-approval':
                if (!task.config.maxLoanDays || task.config.maxLoanDays <= 0) {
                    errors.push(`Tâche ${task.name}: maxLoanDays doit être > 0`);
                }
                break;
                
            case 'notification':
                if (!task.config.recipients || task.config.recipients.length === 0) {
                    warnings.push(`Tâche ${task.name}: aucun destinataire défini`);
                }
                break;
                
            case 'api-call':
                if (!task.config.url) {
                    errors.push(`Tâche ${task.name}: URL manquante`);
                }
                break;
                
            case 'delay':
                if (!task.config.duration || task.config.duration <= 0) {
                    errors.push(`Tâche ${task.name}: durée invalide`);
                }
                break;
        }
        
        return { errors, warnings };
    };
    
    // === HISTORIQUE ===
    
    saveStateToHistory = (action) => {
        const currentState = {
            workflow: JSON.parse(JSON.stringify(this.state.workflow)),
            timestamp: Date.now(),
            action
        };
        
        this.setState(prevState => {
            const newHistory = prevState.history.slice(0, prevState.historyIndex + 1);
            newHistory.push(currentState);
            
            return {
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    };
    
    undo = () => {
        if (this.state.historyIndex > 0) {
            const previousState = this.state.history[this.state.historyIndex - 1];
            
            this.setState(prevState => ({
                workflow: JSON.parse(JSON.stringify(previousState.workflow)),
                historyIndex: prevState.historyIndex - 1,
                selectedNode: null
            }), () => {
                this.drawGrid();
                this.showNotification('info', 'Annulé');
            });
        }
    };
    
    redo = () => {
        if (this.state.historyIndex < this.state.history.length - 1) {
            const nextState = this.state.history[this.state.historyIndex + 1];
            
            this.setState(prevState => ({
                workflow: JSON.parse(JSON.stringify(nextState.workflow)),
                historyIndex: prevState.historyIndex + 1,
                selectedNode: null
            }), () => {
                this.drawGrid();
                this.showNotification('info', 'Rétabli');
            });
        }
    };
    
    // === PERSISTANCE ===
    
    handleSaveWorkflow = async () => {
        const validation = this.validateWorkflow();
        
        if (validation.errors.length > 0) {
            this.showNotification('error', 'Impossible de sauvegarder: erreurs de validation');
            return;
        }
        
        try {
            const workflowData = {
                name: this.state.workflow.name,
                description: this.state.workflow.description,
                version: this.state.workflow.version,
                enabled: this.state.workflow.enabled,
                tasks: this.state.workflow.tasks,
                triggers: this.state.workflow.triggers,
                variables: this.state.workflow.variables,
                metadata: this.state.workflow.metadata
            };
            
            if (this.state.workflow.id) {
                // Mise à jour
                await workflowEngine.updateWorkflow(this.state.workflow.id, workflowData);
            } else {
                // Création
                const newWorkflow = await workflowEngine.createWorkflow(workflowData);
                this.setState(prevState => ({
                    workflow: {
                        ...prevState.workflow,
                        id: newWorkflow.id
                    }
                }));
            }
            
            this.showNotification('success', 'Workflow sauvegardé avec succès');
            
        } catch (error) {
            this.showNotification('error', `Erreur de sauvegarde: ${error.message}`);
        }
    };
    
    loadExistingWorkflows = async () => {
        try {
            // Récupérer la liste des workflows depuis le moteur
            const workflows = await this.getWorkflowsList();
            // Ici, on pourrait ouvrir une dialog pour sélectionner un workflow existant
        } catch (error) {
            console.error('Erreur lors du chargement des workflows:', error);
        }
    };
    
    getWorkflowsList = async () => {
        // Simulation - en production, ceci viendrait du workflow engine
        return [
            { id: 'workflow1', name: 'Workflow d\'approbation automatique', enabled: true },
            { id: 'workflow2', name: 'Workflow de synchronisation quotidienne', enabled: false },
            { id: 'workflow3', name: 'Workflow de génération de rapports', enabled: true }
        ];
    };
    
    exportWorkflow = () => {
        const workflowData = JSON.stringify(this.state.workflow, null, 2);
        const blob = new Blob([workflowData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.state.workflow.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('success', 'Workflow exporté');
    };
    
    importWorkflow = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedWorkflow = JSON.parse(e.target.result);
                
                this.setState({
                    workflow: {
                        ...importedWorkflow,
                        id: null // Réinitialiser l'ID pour une nouvelle sauvegarde
                    }
                }, () => {
                    this.drawGrid();
                    this.saveStateToHistory('import');
                    this.showNotification('success', 'Workflow importé avec succès');
                });
                
            } catch (error) {
                this.showNotification('error', 'Fichier de workflow invalide');
            }
        };
        
        reader.readAsText(file);
    };
    
    // === MÉTHODES UTILITAIRES ===
    
    generateTaskId = () => {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
    
    generateConnectionId = () => {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
    
    showNotification = (type, message) => {
        // Utiliser un système de notification ou console
        switch (type) {
            case 'success':
                console.log('✅', message);
                break;
            case 'error':
                console.error('❌', message);
                break;
            case 'warning':
                console.warn('⚠️', message);
                break;
            case 'info':
            default:
                console.info('ℹ️', message);
                break;
        }
    };
    
    selectAllNodes = () => {
        // Implémenter la sélection multiple
        this.showNotification('info', 'Sélection multiple non implémentée');
    };
    
    deleteSelected = () => {
        if (this.state.selectedNode) {
            this.deleteNode(this.state.selectedNode.id);
        } else if (this.state.selectedConnection) {
            this.deleteConnection(this.state.selectedConnection.id);
        }
    };
    
    // === RENDU ===
    
    render() {
        const {
            activeTab,
            selectedNode,
            taskPalette,
            isConnecting,
            connectionStart,
            validationErrors,
            validationWarnings,
            simulationRunning,
            simulationResults,
            searchTerm,
            workflow
        } = this.state;
        
        return (
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">
                            Builder de Workflow - {workflow.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<PlayArrow />}
                                onClick={this.startSimulation}
                                disabled={simulationRunning || workflow.tasks.length === 0}
                            >
                                {simulationRunning ? 'Simulation...' : 'Simuler'}
                            </Button>
                            
                            <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={this.handleSaveWorkflow}
                            >
                                Sauvegarder
                            </Button>
                            
                            <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={this.exportWorkflow}
                            >
                                Export
                            </Button>
                            
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<Upload />}
                            >
                                Import
                                <input
                                    type="file"
                                    hidden
                                    accept=".json"
                                    onChange={this.importWorkflow}
                                />
                            </Button>
                        </Box>
                    </Box>
                </Box>
                
                {/* Alertes de validation */}
                {validationErrors.length > 0 && (
                    <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
                        Erreurs de validation: {validationErrors.length}
                    </Alert>
                )}
                
                {validationWarnings.length > 0 && (
                    <Alert severity="warning" sx={{ mx: 2, mt: 1 }}>
                        Avertissements: {validationWarnings.length}
                    </Alert>
                )}
                
                {/* Contenu principal */}
                <Box sx={{ flex: 1, display: 'flex' }}>
                    {/* Palette de tâches */}
                    <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', p: 2, overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Tâches disponibles
                        </Typography>
                        
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Rechercher des tâches..."
                            value={searchTerm}
                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        
                        <Grid container spacing={1}>
                            {taskPalette
                                .filter(task => 
                                    !searchTerm || 
                                    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    task.category.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((task) => (
                                    <Grid item xs={12} key={task.type}>
                                        <Card
                                            sx={{
                                                cursor: 'grab',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('text/plain', task.type);
                                            }}
                                        >
                                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ color: task.color }}>
                                                        {task.icon}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {task.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {task.category}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                        </Grid>
                    </Box>
                    
                    {/* Canvas */}
                    <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <canvas
                            ref={this.canvasRef}
                            width={this.state.canvasSize.width}
                            height={this.state.canvasSize.height}
                            style={{
                                width: '100%',
                                height: '100%',
                                cursor: isConnecting ? 'crosshair' : 'default',
                                backgroundColor: '#fafafa'
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const taskType = e.dataTransfer.getData('text/plain');
                                
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = (e.clientX - rect.left - this.state.canvasOffset.x) / this.state.canvasZoom;
                                const y = (e.clientY - rect.top - this.state.canvasOffset.y) / this.state.canvasZoom;
                                
                                // Créer la tâche à la position de drop
                                this.addTaskFromPaletteWithPosition(taskType, x, y);
                            }}
                        />
                        
                        {/* Connexion en cours */}
                        {isConnecting && connectionStart && (
                            <svg
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none'
                                }}
                            >
                                <line
                                    x1={connectionStart.x}
                                    y1={connectionStart.y}
                                    x2={this.getMousePosition().x}
                                    y2={this.getMousePosition().y}
                                    stroke="#2196f3"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                            </svg>
                        )}
                    </Box>
                    
                    {/* Panneau de propriétés */}
                    <Box sx={{ width: 350, borderLeft: 1, borderColor: 'divider', p: 2, overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Propriétés
                        </Typography>
                        
                        {selectedNode ? (
                            <TaskProperties
                                task={selectedNode}
                                onUpdate={(updates) => this.updateTask(selectedNode.id, updates)}
                                onDelete={() => this.deleteNode(selectedNode.id)}
                            />
                        ) : (
                            <WorkflowProperties
                                workflow={workflow}
                                onUpdate={(updates) => this.setState(prevState => ({
                                    workflow: { ...prevState.workflow, ...updates }
                                }))}
                            />
                        )}
                    </Box>
                </Box>
                
                {/* Résultats de simulation */}
                {simulationResults && (
                    <SimulationResults
                        results={simulationResults}
                        onClose={() => this.setState({ simulationResults: null, isSimulation: false })}
                    />
                )}
            </Box>
        );
    }
    
    addTaskFromPaletteWithPosition = (taskType, x, y) => {
        const paletteTask = this.state.taskPalette.find(t => t.type === taskType);
        if (!paletteTask) return;
        
        const newTask = {
            id: this.generateTaskId(),
            type: taskType,
            name: paletteTask.name,
            x: Math.round(x / 20) * 20, // Alignement sur la grille
            y: Math.round(y / 20) * 20,
            width: 120,
            height: 80,
            config: this.getDefaultTaskConfig(taskType),
            inputs: [],
            outputs: [],
            status: 'idle',
            execution: null
        };
        
        this.setState(prevState => ({
            workflow: {
                ...prevState.workflow,
                tasks: [...prevState.workflow.tasks, newTask]
            },
            selectedNode: newTask
        }), () => {
            this.saveStateToHistory('add-task-positioned');
            this.drawGrid();
        });
    };
    
    getMousePosition = () => {
        return { x: 0, y: 0 }; // À implémenter
    };
    
    // === Rendu du canvas ===
    
    drawNodes = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.state.workflow.tasks.forEach(task => {
            this.drawNode(ctx, task);
        });
    };
    
    drawNode = (ctx, task) => {
        const { x, y, width, height } = task;
        const paletteTask = this.state.taskPalette.find(t => t.type === task.type);
        
        // Sauvegarder le contexte
        ctx.save();
        
        // Déplacer vers la position du nœud
        ctx.translate(x * this.state.canvasZoom + this.state.canvasOffset.x, y * this.state.canvasZoom + this.state.canvasOffset.y);
        ctx.scale(this.state.canvasZoom, this.state.canvasZoom);
        
        // Fond du nœud
        ctx.fillStyle = paletteTask?.color || '#666';
        ctx.fillRect(0, 0, width, height);
        
        // Bordure
        ctx.strokeStyle = this.state.selectedNode?.id === task.id ? '#fff' : '#333';
        ctx.lineWidth = this.state.selectedNode?.id === task.id ? 3 : 1;
        ctx.strokeRect(0, 0, width, height);
        
        // Texte
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(task.name, width / 2, height / 2);
        
        // Ports de connexion
        const portSize = 8;
        
        // Port d'entrée (à gauche)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-portSize/2, height/2 - portSize/2, portSize, portSize);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(-portSize/2, height/2 - portSize/2, portSize, portSize);
        
        // Port de sortie (à droite)
        ctx.fillRect(width - portSize/2, height/2 - portSize/2, portSize, portSize);
        ctx.strokeRect(width - portSize/2, height/2 - portSize/2, portSize, portSize);
        
        // Restaurer le contexte
        ctx.restore();
    };
    
    drawConnections = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.state.workflow.connections.forEach(connection => {
            this.drawConnection(ctx, connection);
        });
    };
    
    drawConnection = (ctx, connection) => {
        const sourceTask = this.state.workflow.tasks.find(t => t.id === connection.source);
        const targetTask = this.state.workflow.tasks.find(t => t.id === connection.target);
        
        if (!sourceTask || !targetTask) return;
        
        // Calculer les points de départ et d'arrivée
        const startX = (sourceTask.x + sourceTask.width) * this.state.canvasZoom + this.state.canvasOffset.x;
        const startY = (sourceTask.y + sourceTask.height / 2) * this.state.canvasZoom + this.state.canvasOffset.y;
        
        const endX = targetTask.x * this.state.canvasZoom + this.state.canvasOffset.x;
        const endY = (targetTask.y + targetTask.height / 2) * this.state.canvasZoom + this.state.canvasOffset.y;
        
        // Dessiner la ligne de connexion
        ctx.save();
        
        ctx.strokeStyle = this.state.selectedConnection?.id === connection.id ? '#2196f3' : '#666';
        ctx.lineWidth = this.state.selectedConnection?.id === connection.id ? 3 : 2;
        
        // Ligne courbe simple
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        const midX = (startX + endX) / 2;
        ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
        
        ctx.stroke();
        
        // Flèche à la fin
        const arrowSize = 8;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    };
}

// Composant pour les propriétés de tâche
const TaskProperties = ({ task, onUpdate, onDelete }) => {
    const [config, setConfig] = useState(task.config);
    
    useEffect(() => {
        setConfig(task.config);
    }, [task.config]);
    
    const handleConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onUpdate({ config: newConfig });
    };
    
    return (
        <Box>
            <Typography variant="subtitle1" gutterBottom>
                {task.name}
            </Typography>
            
            <TextField
                fullWidth
                label="Nom de la tâche"
                value={task.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                margin="normal"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
                Configuration
            </Typography>
            
            {/* Configuration spécifique par type de tâche */}
            {task.type === 'auto-approval' && (
                <Box>
                    <TextField
                        fullWidth
                        label="Durée max de prêt (jours)"
                        type="number"
                        value={config.maxLoanDays || ''}
                        onChange={(e) => handleConfigChange('maxLoanDays', parseInt(e.target.value))}
                        margin="normal"
                    />
                    
                    <TextField
                        fullWidth
                        label="Nb max de prêts utilisateur"
                        type="number"
                        value={config.maxUserLoans || ''}
                        onChange={(e) => handleConfigChange('maxUserLoans', parseInt(e.target.value))}
                        margin="normal"
                    />
                </Box>
            )}
            
            {task.type === 'notification' && (
                <Box>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Type de notification</InputLabel>
                        <Select
                            value={config.type || 'info'}
                            onChange={(e) => handleConfigChange('type', e.target.value)}
                        >
                            <MenuItem value="info">Information</MenuItem>
                            <MenuItem value="warning">Avertissement</MenuItem>
                            <MenuItem value="error">Erreur</MenuItem>
                            <MenuItem value="success">Succès</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}
            
            {task.type === 'delay' && (
                <Box>
                    <TextField
                        fullWidth
                        label="Durée (millisecondes)"
                        type="number"
                        value={config.duration || ''}
                        onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                        margin="normal"
                    />
                </Box>
            )}
            
            {task.type === 'api-call' && (
                <Box>
                    <TextField
                        fullWidth
                        label="URL"
                        value={config.url || ''}
                        onChange={(e) => handleConfigChange('url', e.target.value)}
                        margin="normal"
                    />
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Méthode</InputLabel>
                        <Select
                            value={config.method || 'GET'}
                            onChange={(e) => handleConfigChange('method', e.target.value)}
                        >
                            <MenuItem value="GET">GET</MenuItem>
                            <MenuItem value="POST">POST</MenuItem>
                            <MenuItem value="PUT">PUT</MenuItem>
                            <MenuItem value="DELETE">DELETE</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={onDelete}
                fullWidth
            >
                Supprimer la tâche
            </Button>
        </Box>
    );
};

// Composant pour les propriétés de workflow
const WorkflowProperties = ({ workflow, onUpdate }) => {
    return (
        <Box>
            <Typography variant="subtitle1" gutterBottom>
                Propriétés du workflow
            </Typography>
            
            <TextField
                fullWidth
                label="Nom"
                value={workflow.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                margin="normal"
            />
            
            <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={workflow.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
                <InputLabel>Catégorie</InputLabel>
                <Select
                    value={workflow.metadata.category || 'general'}
                    onChange={(e) => onUpdate({
                        metadata: { ...workflow.metadata, category: e.target.value }
                    })}
                >
                    <MenuItem value="general">Général</MenuItem>
                    <MenuItem value="approval">Approbation</MenuItem>
                    <MenuItem value="notification">Notification</MenuItem>
                    <MenuItem value="sync">Synchronisation</MenuItem>
                    <MenuItem value="report">Rapport</MenuItem>
                </Select>
            </FormControl>
            
            <FormControlLabel
                control={
                    <Switch
                        checked={workflow.enabled}
                        onChange={(e) => onUpdate({ enabled: e.target.checked })}
                    />
                }
                label="Workflow activé"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">
                Version: {workflow.version}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
                Tâches: {workflow.tasks.length}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
                Connexions: {workflow.connections.length}
            </Typography>
        </Box>
    );
};

// Composant pour les résultats de simulation
const SimulationResults = ({ results, onClose }) => {
    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Résultats de la simulation
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">
                        Résumé
                    </Typography>
                    <Typography>
                        Durée totale: {(results.totalTime / 1000).toFixed(2)}s
                    </Typography>
                    <Typography>
                        Tâches exécutées: {results.steps.length}
                    </Typography>
                    <Typography color={results.success ? 'success.main' : 'error.main'}>
                        Statut: {results.success ? 'Succès' : 'Échec'}
                    </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                    Détail des étapes
                </Typography>
                
                <List>
                    {results.steps.map((step, index) => (
                        <ListItem key={index}>
                            <ListItemIcon>
                                {step.status === 'completed' ? (
                                    <CheckCircle color="success" />
                                ) : (
                                    <Error color="error" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={step.taskName}
                                secondary={
                                    <Box>
                                        <Typography variant="body2">
                                            Type: {step.type} | Durée: {(step.duration / 1000).toFixed(2)}s
                                        </Typography>
                                        {step.error && (
                                            <Typography variant="body2" color="error">
                                                Erreur: {step.error}
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
                
                {results.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" color="error">
                            Erreurs
                        </Typography>
                        {results.errors.map((error, index) => (
                            <Alert key={index} severity="error" sx={{ mt: 1 }}>
                                {error.error}
                            </Alert>
                        ))}
                    </Box>
                )}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose}>Fermer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default WorkflowBuilder;