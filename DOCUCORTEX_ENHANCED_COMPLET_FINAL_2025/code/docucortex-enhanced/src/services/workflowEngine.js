// src/services/workflowEngine.js - MOTEUR DE WORKFLOW AUTOMATISÉ POUR DOCUCORTEX
// Moteur de workflow configurable avec exécution asynchrone, scheduling et monitoring

import EventEmitter from 'events';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

// Configuration par défaut du moteur de workflow
const WORKFLOW_CONFIG = {
    maxConcurrentExecutions: 10,
    executionTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000, // 1 seconde
    queueSize: 100,
    heartbeatInterval: 30000, // 30 secondes
    cleanupInterval: 300000 // 5 minutes
};

// États des workflows
const WORKFLOW_STATES = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    PAUSED: 'paused'
};

// États des tâches
const TASK_STATES = {
    WAITING: 'waiting',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    RETRYING: 'retrying'
};

class WorkflowEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = { ...WORKFLOW_CONFIG, ...options };
        
        // Stockage des workflows
        this.workflows = new Map();
        this.executions = new Map();
        this.taskQueue = [];
        this.activeExecutions = new Set();
        
        // Queue système pour les tâches
        this.taskQueueSystem = {
            high: [],
            normal: [],
            low: []
        };
        
        // Index pour optimisation des recherches
        this.workflowIndex = new Map();
        this.executionIndex = new Map();
        
        // Timers de maintenance
        this.heartbeatTimer = null;
        this.cleanupTimer = null;
        
        // Id compteur
        this.nextId = 1;
        
        // Persistance
        this.storageKey = 'docucortex_workflows';
        
        // Initialiser la persistence
        this.loadFromStorage();
        
        // Démarrer les services de maintenance
        this.startMaintenanceServices();
    }

    // 🚀 MOTEUR PRINCIPAL

    /**
     * Créer un nouveau workflow
     */
    async createWorkflow(workflowData) {
        const workflow = {
            id: this.generateId('workflow'),
            name: workflowData.name || `Workflow ${Date.now()}`,
            description: workflowData.description || '',
            version: workflowData.version || '1.0.0',
            enabled: workflowData.enabled !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: workflowData.createdBy || 'system',
            
            // Configuration du workflow
            triggers: workflowData.triggers || [],
            tasks: workflowData.tasks || [],
            conditions: workflowData.conditions || {},
            variables: workflowData.variables || {},
            timeout: workflowData.timeout || this.config.executionTimeout,
            
            // Métadonnées
            metadata: {
                category: workflowData.category || 'general',
                priority: workflowData.priority || 'normal',
                tags: workflowData.tags || [],
                ...workflowData.metadata
            },
            
            // Statistiques
            statistics: {
                totalExecutions: 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0,
                lastExecutionAt: null
            }
        };

        // Valider le workflow
        const validation = this.validateWorkflow(workflow);
        if (!validation.isValid) {
            throw new Error(`Workflow invalide: ${validation.errors.join(', ')}`);
        }

        // Stocker le workflow
        this.workflows.set(workflow.id, workflow);
        this.indexWorkflow(workflow);
        
        // Sauvegarder
        this.saveToStorage();
        
        // Émettre un événement
        this.emit('workflow-created', workflow);
        
        return workflow;
    }

    /**
     * Exécuter un workflow
     */
    async executeWorkflow(workflowId, context = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow non trouvé: ${workflowId}`);
        }

        if (!workflow.enabled) {
            throw new Error(`Workflow désactivé: ${workflowId}`);
        }

        // Vérifier les limites d'exécution concurrente
        if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
            throw new Error('Limite d\'exécutions concurrentes atteinte');
        }

        const execution = {
            id: this.generateId('exec'),
            workflowId,
            status: WORKFLOW_STATES.PENDING,
            startedAt: new Date().toISOString(),
            completedAt: null,
            context: {
                ...context,
                userId: context.userId || 'system',
                sessionId: context.sessionId || this.generateId('session'),
                metadata: {}
            },
            currentTaskId: null,
            tasks: [],
            results: {},
            errors: [],
            logs: []
        };

        // Initialiser les tâches
        for (const task of workflow.tasks) {
            execution.tasks.push({
                taskId: task.id,
                state: TASK_STATES.WAITING,
                attempts: 0,
                startedAt: null,
                completedAt: null,
                result: null,
                error: null,
                logs: []
            });
        }

        // Stocker l'exécution
        this.executions.set(execution.id, execution);
        this.activeExecutions.add(execution.id);
        this.indexExecution(execution);

        // Démarrer l'exécution
        this.executeWorkflowInternal(execution);

        return execution.id;
    }

    /**
     * Exécution interne du workflow
     */
    async executeWorkflowInternal(execution) {
        const workflow = this.workflows.get(execution.workflowId);
        const executionId = execution.id;

        try {
            this.updateExecutionStatus(executionId, WORKFLOW_STATES.RUNNING);
            this.logExecution(executionId, 'INFO', 'Workflow execution started');

            // Vérifier les déclencheurs
            if (!await this.checkTriggers(workflow, execution.context)) {
                this.logExecution(executionId, 'WARNING', 'Triggers not met, skipping execution');
                this.updateExecutionStatus(executionId, WORKFLOW_STATES.COMPLETED);
                this.completeWorkflow(executionId);
                return;
            }

            // Exécuter les tâches séquentiellement
            for (let i = 0; i < workflow.tasks.length; i++) {
                const task = workflow.tasks[i];
                
                // Vérifier si le workflow est toujours actif
                if (execution.status === WORKFLOW_STATES.CANCELLED) {
                    break;
                }

                await this.executeTask(executionId, task, i);
                
                // Vérifier les conditions de branche
                if (i < workflow.tasks.length - 1) {
                    const nextTask = await this.evaluateConditions(workflow, execution, task);
                    if (nextTask === null) {
                        this.logExecution(executionId, 'INFO', 'Workflow branching condition met');
                        break;
                    }
                }
            }

            // Finaliser le workflow
            if (execution.status === WORKFLOW_STATES.RUNNING) {
                this.updateExecutionStatus(executionId, WORKFLOW_STATES.COMPLETED);
                this.completeWorkflow(executionId);
            }

        } catch (error) {
            this.logExecution(executionId, 'ERROR', `Workflow execution failed: ${error.message}`);
            this.updateExecutionStatus(executionId, WORKFLOW_STATES.FAILED, error);
            this.completeWorkflow(executionId);
        }
    }

    /**
     * Exécuter une tâche individuelle
     */
    async executeTask(executionId, task, taskIndex) {
        const execution = this.executions.get(executionId);
        if (!execution) return;

        const taskExecution = execution.tasks[taskIndex];
        taskExecution.state = TASK_STATES.RUNNING;
        taskExecution.attempts++;
        taskExecution.startedAt = new Date().toISOString();
        execution.currentTaskId = task.id;

        this.logExecution(executionId, 'INFO', `Starting task: ${task.name}`);

        try {
            // Vérifier les conditions de la tâche
            if (!await this.evaluateTaskConditions(task, execution.context)) {
                taskExecution.state = TASK_STATES.SKIPPED;
                this.logExecution(executionId, 'INFO', `Task skipped due to conditions: ${task.name}`);
                return;
            }

            // Charger le type de tâche
            const taskHandler = this.getTaskHandler(task.type);
            if (!taskHandler) {
                throw new Error(`Type de tâche non supporté: ${task.type}`);
            }

            // Exécuter la tâche avec gestion des retries
            let result;
            let lastError;

            for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
                try {
                    if (attempt > 0) {
                        taskExecution.state = TASK_STATES.RETRYING;
                        this.logExecution(executionId, 'WARNING', `Retrying task (attempt ${attempt}): ${task.name}`);
                        await this.sleep(this.config.retryDelay * attempt);
                    }

                    result = await taskHandler.execute({
                        task,
                        context: execution.context,
                        variables: { ...execution.context.variables, ...task.variables },
                        executionId
                    });

                    break; // Succès, sortir de la boucle
                } catch (error) {
                    lastError = error;
                    
                    if (attempt === this.config.retryAttempts) {
                        throw error;
                    }
                }
            }

            // Tâche terminée avec succès
            taskExecution.state = TASK_STATES.COMPLETED;
            taskExecution.result = result;
            taskExecution.completedAt = new Date().toISOString();
            
            // Mettre à jour les variables de contexte
            if (task.outputVariable) {
                execution.context.variables[task.outputVariable] = result;
            }

            this.logExecution(executionId, 'INFO', `Task completed: ${task.name}`);
            this.emit('task-completed', { executionId, taskId: task.id, result });

        } catch (error) {
            taskExecution.state = TASK_STATES.FAILED;
            taskExecution.error = error.message;
            taskExecution.completedAt = new Date().toISOString();
            
            this.logExecution(executionId, 'ERROR', `Task failed: ${task.name} - ${error.message}`);
            this.emit('task-failed', { executionId, taskId: task.id, error: error.message });

            // Selon la configuration, stopper ou continuer
            if (task.failOnError !== false) {
                throw error;
            }
        }
    }

    // 🔄 GESTION DES WORKFLOWS

    /**
     * Valider la configuration d'un workflow
     */
    validateWorkflow(workflow) {
        const errors = [];

        // Vérifications de base
        if (!workflow.name || workflow.name.trim() === '') {
            errors.push('Le nom du workflow est requis');
        }

        if (!workflow.tasks || !Array.isArray(workflow.tasks) || workflow.tasks.length === 0) {
            errors.push('Au moins une tâche est requise');
        }

        // Vérifier chaque tâche
        workflow.tasks.forEach((task, index) => {
            if (!task.id) {
                errors.push(`Tâche ${index + 1}: ID manquant`);
            }
            if (!task.name) {
                errors.push(`Tâche ${index + 1}: Nom manquant`);
            }
            if (!task.type) {
                errors.push(`Tâche ${index + 1}: Type manquant`);
            }
            if (task.handler && typeof task.handler.execute !== 'function') {
                errors.push(`Tâche ${index + 1}: Handler invalide`);
            }
        });

        // Vérifier les triggers
        if (workflow.triggers) {
            workflow.triggers.forEach((trigger, index) => {
                if (!trigger.type) {
                    errors.push(`Trigger ${index + 1}: Type manquant`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Mettre à jour un workflow
     */
    async updateWorkflow(workflowId, updates) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow non trouvé: ${workflowId}`);
        }

        // Créer une nouvelle version
        const updatedWorkflow = {
            ...workflow,
            ...updates,
            id: workflowId,
            updatedAt: new Date().toISOString(),
            version: this.incrementVersion(workflow.version)
        };

        // Valider la mise à jour
        const validation = this.validateWorkflow(updatedWorkflow);
        if (!validation.isValid) {
            throw new Error(`Workflow invalide: ${validation.errors.join(', ')}`);
        }

        // Sauvegarder
        this.workflows.set(workflowId, updatedWorkflow);
        this.indexWorkflow(updatedWorkflow);
        this.saveToStorage();

        this.emit('workflow-updated', updatedWorkflow);
        return updatedWorkflow;
    }

    /**
     * Supprimer un workflow
     */
    async deleteWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow non trouvé: ${workflowId}`);
        }

        // Vérifier s'il y a des exécutions actives
        const activeExecutions = Array.from(this.executions.values())
            .filter(exec => exec.workflowId === workflowId && exec.status === WORKFLOW_STATES.RUNNING);

        if (activeExecutions.length > 0) {
            throw new Error(`Impossible de supprimer: ${activeExecutions.length} exécution(s) active(s)`);
        }

        // Supprimer
        this.workflows.delete(workflowId);
        this.workflowIndex.delete(workflowId);
        
        // Supprimer les exécutions terminées
        for (const [execId, execution] of this.executions.entries()) {
            if (execution.workflowId === workflowId) {
                this.executions.delete(execId);
                this.executionIndex.delete(execId);
            }
        }

        this.saveToStorage();
        this.emit('workflow-deleted', { workflowId });
    }

    /**
     * Activer/désactiver un workflow
     */
    async toggleWorkflow(workflowId, enabled) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow non trouvé: ${workflowId}`);
        }

        workflow.enabled = enabled;
        workflow.updatedAt = new Date().toISOString();
        
        this.workflows.set(workflowId, workflow);
        this.saveToStorage();

        this.emit('workflow-toggled', { workflowId, enabled });
        return workflow;
    }

    // ⏰ PLANIFICATION ET DÉCLENCHEURS

    /**
     * Programmer l'exécution d'un workflow
     */
    async scheduleWorkflow(workflowId, schedule, context = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow non trouvé: ${workflowId}`);
        }

        const scheduledExecution = {
            id: this.generateId('scheduled'),
            workflowId,
            schedule,
            context,
            createdAt: new Date().toISOString(),
            nextExecution: this.calculateNextExecution(schedule),
            enabled: true,
            executions: []
        };

        // Stocker la planification
        if (!workflow.schedules) {
            workflow.schedules = [];
        }
        workflow.schedules.push(scheduledExecution);

        this.saveToStorage();
        this.emit('workflow-scheduled', scheduledExecution);

        return scheduledExecution.id;
    }

    /**
     * Calculer la prochaine exécution selon la planification
     */
    calculateNextExecution(schedule) {
        const now = new Date();
        
        switch (schedule.type) {
            case 'once':
                return parseISO(schedule.runAt);
            
            case 'interval':
                return addDays(now, schedule.intervalDays || 1);
            
            case 'cron':
                // Implementation simplifiée pour les cron expressions courantes
                if (schedule.expression === '0 9 * * 1-5') { // Chaque jour de semaine à 9h
                    const next = new Date(now);
                    next.setHours(9, 0, 0, 0);
                    
                    // Passer au lundi suivant si c'est le week-end
                    while (next.getDay() === 0 || next.getDay() === 6) {
                        next.setDate(next.getDate() + 1);
                    }
                    
                    // Si l'heure est passée, passer au jour suivant
                    if (next <= now) {
                        next.setDate(next.getDate() + 1);
                        while (next.getDay() === 0 || next.getDay() === 6) {
                            next.setDate(next.getDate() + 1);
                        }
                    }
                    
                    return next;
                }
                break;
            
            default:
                return addDays(now, 1);
        }
    }

    /**
     * Vérifier les déclencheurs d'un workflow
     */
    async checkTriggers(workflow, context) {
        if (!workflow.triggers || workflow.triggers.length === 0) {
            return true; // Pas de triggers, exécuter
        }

        for (const trigger of workflow.triggers) {
            switch (trigger.type) {
                case 'manual':
                    return context.manual === true;
                
                case 'event':
                    // Les événements sont gérés par l'EventEmitter
                    return context.event === trigger.event;
                
                case 'condition':
                    return await this.evaluateCondition(trigger.condition, context);
                
                case 'schedule':
                    const nextExecution = this.calculateNextExecution(trigger.schedule);
                    return nextExecution <= new Date();
                
                case 'webhook':
                    return context.webhook === trigger.name;
                
                default:
                    console.warn(`Type de trigger non supporté: ${trigger.type}`);
            }
        }

        return false;
    }

    // 🔧 GESTION DES TÂCHES

    /**
     * Obtenir le handler d'un type de tâche
     */
    getTaskHandler(taskType) {
        // Registry des handlers de tâches
        const handlers = {
            'auto-approval': () => import('./workflowTasks/AutoApprovalTask.js'),
            'notification': () => import('./workflowTasks/NotificationTask.js'),
            'escalation': () => import('./workflowTasks/EscalationTask.js'),
            'data-sync': () => import('./workflowTasks/DataSyncTask.js'),
            'report': () => import('./workflowTasks/ReportTask.js'),
            'condition': () => import('./workflowTasks/ConditionTask.js'),
            'delay': () => import('./workflowTasks/DelayTask.js'),
            'api-call': () => import('./workflowTasks/ApiCallTask.js')
        };

        const importHandler = handlers[taskType];
        if (!importHandler) {
            return null;
        }

        // Charger le handler dynamiquement
        return importHandler().then(module => module.default || module);
    }

    /**
     * Enregistrer un nouveau type de tâche
     */
    registerTaskType(taskType, handler) {
        // Cette méthode permet d'ajouter dynamiquement de nouveaux types de tâches
        if (typeof handler.execute !== 'function') {
            throw new Error('Le handler doit avoir une méthode execute');
        }

        this.taskTypes = this.taskTypes || {};
        this.taskTypes[taskType] = handler;
    }

    // 📊 MONITORING ET LOGS

    /**
     * Obtenir les statistiques du moteur
     */
    getEngineStats() {
        const workflows = Array.from(this.workflows.values());
        const executions = Array.from(this.executions.values());

        return {
            workflows: {
                total: workflows.length,
                active: workflows.filter(w => w.enabled).length,
                inactive: workflows.filter(w => !w.enabled).length
            },
            executions: {
                total: executions.length,
                pending: executions.filter(e => e.status === WORKFLOW_STATES.PENDING).length,
                running: executions.filter(e => e.status === WORKFLOW_STATES.RUNNING).length,
                completed: executions.filter(e => e.status === WORKFLOW_STATES.COMPLETED).length,
                failed: executions.filter(e => e.status === WORKFLOW_STATES.FAILED).length,
                cancelled: executions.filter(e => e.status === WORKFLOW_STATES.CANCELLED).length
            },
            system: {
                activeExecutions: this.activeExecutions.size,
                queueSize: this.taskQueue.length,
                memoryUsage: this.getMemoryUsage()
            }
        };
    }

    /**
     * Obtenir les logs d'une exécution
     */
    getExecutionLogs(executionId, options = {}) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Exécution non trouvée: ${executionId}`);
        }

        const { level, limit = 100, offset = 0 } = options;
        
        let logs = execution.logs;
        
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        return logs.slice(offset, offset + limit);
    }

    /**
     * Journaliser une exécution
     */
    logExecution(executionId, level, message, data = null) {
        const execution = this.executions.get(executionId);
        if (!execution) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };

        execution.logs.push(logEntry);

        // Limiter la taille des logs
        if (execution.logs.length > 1000) {
            execution.logs = execution.logs.slice(-500);
        }

        this.emit('execution-log', { executionId, ...logEntry });
    }

    // 🛠️ UTILITAIRES

    /**
     * Mettre à jour le statut d'une exécution
     */
    updateExecutionStatus(executionId, status, error = null) {
        const execution = this.executions.get(executionId);
        if (!execution) return;

        const previousStatus = execution.status;
        execution.status = status;

        if (status === WORKFLOW_STATES.COMPLETED || status === WORKFLOW_STATES.FAILED) {
            execution.completedAt = new Date().toISOString();
            this.activeExecutions.delete(executionId);
            
            // Mettre à jour les statistiques du workflow
            const workflow = this.workflows.get(execution.workflowId);
            if (workflow) {
                workflow.statistics.totalExecutions++;
                workflow.statistics.lastExecutionAt = execution.completedAt;
                
                if (status === WORKFLOW_STATES.COMPLETED) {
                    workflow.statistics.successfulExecutions++;
                } else if (status === WORKFLOW_STATES.FAILED) {
                    workflow.statistics.failedExecutions++;
                }
                
                // Calculer la durée moyenne
                const duration = new Date(execution.completedAt) - new Date(execution.startedAt);
                const avgDuration = ((workflow.statistics.averageExecutionTime * (workflow.statistics.totalExecutions - 1)) + duration) / workflow.statistics.totalExecutions;
                workflow.statistics.averageExecutionTime = avgDuration;
            }
        }

        this.emit('execution-status-changed', {
            executionId,
            previousStatus,
            status,
            error
        });
    }

    /**
     * Finaliser un workflow
     */
    completeWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) return;

        this.activeExecutions.delete(executionId);
        this.emit('workflow-completed', execution);
    }

    /**
     * Évaluer des conditions
     */
    async evaluateConditions(workflow, execution, currentTask) {
        // Implementation simplifiée - peut être étendue
        if (currentTask.nextTaskCondition) {
            return await this.evaluateCondition(currentTask.nextTaskCondition, execution.context);
        }
        return true;
    }

    /**
     * Évaluer une condition
     */
    async evaluateCondition(condition, context) {
        if (!condition) return true;

        try {
            switch (condition.type) {
                case 'simple':
                    return this.evaluateSimpleCondition(condition, context);
                
                case 'javascript':
                    return this.evaluateJavaScriptCondition(condition, context);
                
                case 'comparison':
                    return this.evaluateComparisonCondition(condition, context);
                
                default:
                    console.warn(`Type de condition non supporté: ${condition.type}`);
                    return true;
            }
        } catch (error) {
            console.error('Erreur lors de l\'évaluation de condition:', error);
            return false;
        }
    }

    /**
     * Évaluer une condition simple
     */
    evaluateSimpleCondition(condition, context) {
        const value = this.getValueFromContext(condition.field, context);
        
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'not_equals':
                return value !== condition.value;
            case 'contains':
                return String(value).includes(condition.value);
            case 'greater_than':
                return Number(value) > Number(condition.value);
            case 'less_than':
                return Number(value) < Number(condition.value);
            default:
                return false;
        }
    }

    /**
     * Obtenir une valeur du contexte
     */
    getValueFromContext(path, context) {
        return path.split('.').reduce((obj, key) => obj?.[key], context);
    }

    /**
     * Évaluer les conditions d'une tâche
     */
    async evaluateTaskConditions(task, context) {
        if (!task.conditions || task.conditions.length === 0) {
            return true;
        }

        for (const condition of task.conditions) {
            const result = await this.evaluateCondition(condition, context);
            if (!result) {
                return false;
            }
        }

        return true;
    }

    /**
     * Attendre (sleep)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Générer un ID unique
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${this.nextId++}`;
    }

    /**
     * Incrémenter la version
     */
    incrementVersion(version) {
        const parts = version.split('.');
        const patch = parseInt(parts[2] || '0') + 1;
        return `${parts[0] || '1'}.${parts[1] || '0'}.${patch}`;
    }

    /**
     * Indexer un workflow pour optimisation
     */
    indexWorkflow(workflow) {
        this.workflowIndex.set(workflow.id, {
            name: workflow.name.toLowerCase(),
            category: workflow.metadata.category,
            tags: workflow.metadata.tags,
            enabled: workflow.enabled
        });
    }

    /**
     * Indexer une exécution pour optimisation
     */
    indexExecution(execution) {
        this.executionIndex.set(execution.id, {
            workflowId: execution.workflowId,
            status: execution.status,
            startedAt: execution.startedAt
        });
    }

    /**
     * Obtenir l'utilisation mémoire approximative
     */
    getMemoryUsage() {
        // Estimation simple - peut être améliorée avec des outils spécialisés
        return {
            workflows: this.workflows.size * 1024, // Estimation en bytes
            executions: this.executions.size * 2048,
            total: (this.workflows.size + this.executions.size) * 1536
        };
    }

    // 💾 PERSISTANCE

    /**
     * Sauvegarder en localStorage
     */
    saveToStorage() {
        try {
            const data = {
                workflows: Array.from(this.workflows.values()),
                executions: Array.from(this.executions.values()),
                config: this.config,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Impossible de sauvegarder les workflows:', error);
        }
    }

    /**
     * Charger depuis localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Charger les workflows
                if (data.workflows) {
                    data.workflows.forEach(workflow => {
                        this.workflows.set(workflow.id, workflow);
                        this.indexWorkflow(workflow);
                    });
                }
                
                // Charger les exécutions (seulement les terminées)
                if (data.executions) {
                    data.executions
                        .filter(exec => exec.status !== WORKFLOW_STATES.RUNNING)
                        .forEach(execution => {
                            this.executions.set(execution.id, execution);
                            this.indexExecution(execution);
                        });
                }
                
                // Charger la configuration
                if (data.config) {
                    this.config = { ...this.config, ...data.config };
                }
            }
        } catch (error) {
            console.warn('Impossible de charger les workflows:', error);
        }
    }

    // 🔧 SERVICES DE MAINTENANCE

    /**
     * Démarrer les services de maintenance
     */
    startMaintenanceServices() {
        // Heartbeat pour monitorer la santé du moteur
        this.heartbeatTimer = setInterval(() => {
            this.performHeartbeat();
        }, this.config.heartbeatInterval);

        // Nettoyage périodique
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }

    /**
     * Vérifier la santé du moteur
     */
    performHeartbeat() {
        // Vérifier les exécutions qui n'avancent pas
        const stuckExecutions = Array.from(this.executions.values())
            .filter(exec => {
                if (exec.status !== WORKFLOW_STATES.RUNNING) return false;
                
                const lastLog = exec.logs[exec.logs.length - 1];
                if (!lastLog) return false;
                
                const lastActivity = new Date(lastLog.timestamp);
                const now = new Date();
                const timeDiff = now - lastActivity;
                
                return timeDiff > this.config.executionTimeout;
            });

        stuckExecutions.forEach(execution => {
            this.logExecution(execution.id, 'ERROR', 'Execution appears to be stuck, marking as failed');
            this.updateExecutionStatus(execution.id, WORKFLOW_STATES.FAILED, new Error('Execution timeout'));
        });

        this.emit('heartbeat', {
            timestamp: new Date().toISOString(),
            activeExecutions: this.activeExecutions.size,
            stuckExecutions: stuckExecutions.length
        });
    }

    /**
     * Nettoyer les anciennes données
     */
    performCleanup() {
        // Supprimer les exécutions terminées de plus de 7 jours
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        for (const [executionId, execution] of this.executions.entries()) {
            if (execution.status !== WORKFLOW_STATES.RUNNING) {
                const completedAt = execution.completedAt ? new Date(execution.completedAt) : null;
                
                if (completedAt && completedAt < sevenDaysAgo) {
                    this.executions.delete(executionId);
                    this.executionIndex.delete(executionId);
                }
            }
        }

        // Limiter le nombre de logs par exécution
        for (const execution of this.executions.values()) {
            if (execution.logs.length > 500) {
                execution.logs = execution.logs.slice(-250);
            }
        }

        this.saveToStorage();
    }

    /**
     * Arrêter le moteur
     */
    shutdown() {
        // Arrêter les timers
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        // Sauvegarder avant l'arrêt
        this.saveToStorage();

        this.emit('shutdown');
    }
}

// Export singleton
const workflowEngine = new WorkflowEngine();

export default workflowEngine;
export { WORKFLOW_STATES, TASK_STATES };
