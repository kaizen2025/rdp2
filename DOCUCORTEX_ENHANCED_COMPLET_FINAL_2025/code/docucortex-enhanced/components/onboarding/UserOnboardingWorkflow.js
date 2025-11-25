import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  User, 
  Settings, 
  Shield, 
  Bell,
  ChevronLeft,
  MessageCircle,
  X,
  Clock,
  TrendingUp,
  FileText,
  Zap,
  Brain,
  Target,
  Award
} from 'lucide-react';

// Configuration des templates de workflow
const ONBOARDING_TEMPLATES = {
  default: {
    id: 'default',
    name: 'Onboarding Standard',
    steps: [
      { id: 'welcome', title: 'Bienvenue', icon: User, required: true, duration: 3000 },
      { id: 'profile', title: 'Profil Utilisateur', icon: User, required: true, duration: 8000 },
      { id: 'preferences', title: 'Préférences', icon: Settings, required: false, duration: 5000 },
      { id: 'security', title: 'Sécurité', icon: Shield, required: true, duration: 6000 },
      { id: 'notifications', title: 'Notifications', icon: Bell, required: false, duration: 4000 },
      { id: 'complete', title: 'Finalisation', icon: Award, required: true, duration: 3000 }
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Onboarding Entreprise',
    steps: [
      { id: 'welcome', title: 'Bienvenue Enterprise', icon: User, required: true, duration: 4000 },
      { id: 'company', title: 'Informations Société', icon: FileText, required: true, duration: 10000 },
      { id: 'permissions', title: 'Permissions & Rôles', icon: Shield, required: true, duration: 8000 },
      { id: 'integration', title: 'Intégrations', icon: Zap, required: false, duration: 12000 },
      { id: 'compliance', title: 'Conformité', icon: CheckCircle, required: true, duration: 6000 },
      { id: 'training', title: 'Formation', icon: Target, required: true, duration: 15000 }
    ]
  },
  developer: {
    id: 'developer',
    name: 'Onboarding Développeur',
    steps: [
      { id: 'welcome', title: 'Bienvenue Dev', icon: Brain, required: true, duration: 3000 },
      { id: 'environment', title: 'Configuration', icon: Settings, required: true, duration: 10000 },
      { id: 'api', title: 'API & SDK', icon: Zap, required: true, duration: 12000 },
      { id: 'docs', title: 'Documentation', icon: FileText, required: false, duration: 8000 },
      { id: 'resources', title: 'Ressources', icon: TrendingUp, required: false, duration: 6000 }
    ]
  }
};

// Constantes d'optimisation mémoire
const MEMORY_CONSTANTS = {
  MAX_STEPS_IN_MEMORY: 10,
  CLEANUP_INTERVAL: 30000,
  DEBOUNCE_DELAY: 500,
  VIRTUALIZATION_THRESHOLD: 20
};

// Hook pour l'optimisation mémoire
const useMemoryOptimization = () => {
  const cleanupTimerRef = useRef(null);
  
  const cleanupMemory = useCallback(() => {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }, []);

  useEffect(() => {
    cleanupTimerRef.current = setInterval(cleanupMemory, MEMORY_CONSTANTS.CLEANUP_INTERVAL);
    
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupMemory]);

  return { cleanupMemory };
};

// Hook pour les notifications intelligentes
const useSmartNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: notification.type || 'info',
      priority: notification.priority || 'medium',
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Limite à 5 notifications
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showStepNotification = useCallback((step, type) => {
    addNotification({
      type,
      title: `Étape ${step.title}`,
      message: type === 'success' ? 'Étape complétée avec succès!' : 
               type === 'warning' ? 'Attention requise pour cette étape.' :
               'Nouvelle étape disponible.',
      autoClose: true,
      priority: step.required ? 'high' : 'medium'
    });
  }, [addNotification]);

  return { notifications, addNotification, removeNotification, showStepNotification };
};

// Hook pour l'audit trail
const useAuditTrail = () => {
  const [auditLog, setAuditLog] = useState([]);
  
  const logAction = useCallback((action, details = {}) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      action,
      details,
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('onboarding_session_id') || 'unknown'
    };
    
    setAuditLog(prev => [...prev.slice(-49), logEntry]); // Garde les 50 dernières entrées
  }, []);

  const getAuditSummary = useCallback(() => {
    const summary = {
      totalActions: auditLog.length,
      stepCompletions: auditLog.filter(entry => entry.action === 'step_completed').length,
      errors: auditLog.filter(entry => entry.action === 'error').length,
      timeSpent: 0
    };
    
    // Calculer le temps passé (simplifié)
    if (auditLog.length > 1) {
      const first = new Date(auditLog[0].timestamp).getTime();
      const last = new Date(auditLog[auditLog.length - 1].timestamp).getTime();
      summary.timeSpent = Math.round((last - first) / 1000);
    }
    
    return summary;
  }, [auditLog]);

  return { auditLog, logAction, getAuditSummary };
};

// Assistant virtuel intégré
const VirtualAssistant = ({ 
  isVisible, 
  currentStep, 
  onClose, 
  getStepGuidance,
  showMessage 
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (isVisible && currentStep) {
      setIsTyping(true);
      const guidance = getStepGuidance(currentStep);
      
      const timer = setTimeout(() => {
        setMessage(guidance);
        setIsTyping(false);
        showMessage(guidance);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, currentStep, getStepGuidance, showMessage]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm p-4 z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Assistant IA</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="min-h-[60px]">
        {isTyping ? (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Assistant en train d'écrire...</span>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{message}</p>
        )}
      </div>
    </motion.div>
  );
};

// Composant principal du workflow d'onboarding
const UserOnboardingWorkflow = ({
  template = 'default',
  onComplete,
  onStepChange,
  className = '',
  autoStart = true,
  showAssistant = true,
  enableNotifications = true,
  trackAnalytics = true
}) => {
  // État principal
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Hooks d'optimisation
  const { cleanupMemory } = useMemoryOptimization();
  const { notifications, addNotification, removeNotification, showStepNotification } = useSmartNotifications();
  const { auditLog, logAction, getAuditSummary } = useAuditTrail();

  // Template actuel (mémoïsé pour éviter les recalculs)
  const currentTemplate = useMemo(() => ONBOARDING_TEMPLATES[template] || ONBOARDING_TEMPLATES.default, [template]);
  const currentStep = useMemo(() => currentTemplate.steps[currentStepIndex], [currentTemplate.steps, currentStepIndex]);
  const progress = useMemo(() => (completedSteps.size / currentTemplate.steps.length) * 100, [completedSteps.size, currentTemplate.steps.length]);

  // Initialisation
  useEffect(() => {
    if (autoStart && !startTime) {
      setStartTime(new Date());
      sessionStorage.setItem('onboarding_session_id', `session_${Date.now()}`);
      logAction('workflow_started', { template, autoStart });
    }
  }, [autoStart, startTime, template, logAction]);

  // Auto-cleanup mémoire
  useEffect(() => {
    cleanupMemory();
  }, [currentStepIndex, cleanupMemory]);

  // Fonctions utilitaires
  const getStepGuidance = useCallback((step) => {
    const guidanceMessages = {
      welcome: "Bienvenue! Je vais vous guider à travers votre processus d'onboarding. Commençons par personnaliser votre expérience.",
      profile: "Commençons par créer votre profil. Ces informations nous aident à personnaliser votre expérience.",
      preferences: "Configurez vos préférences pour optimiser votre workflow. Vous pourrez toujours modifier ces paramètres plus tard.",
      security: "Sécurisons votre compte avec des paramètres de sécurité appropriés. C'est essentiel pour protéger vos données.",
      notifications: "Personnalisez vos notifications pour rester informé sans être submergé.",
      complete: "Félicitations! Vous avez terminé l'onboarding. Vous êtes maintenant prêt à utiliser DocuCortex Enhanced."
    };
    
    return guidanceMessages[step.id] || `Passons à l'étape: ${step.title}`;
  }, []);

  const validateCurrentStep = useCallback(() => {
    if (!currentStep) return { isValid: true };
    
    const requiredFields = getRequiredFields(currentStep);
    const stepFields = stepData[currentStep.id] || {};
    
    for (const field of requiredFields) {
      if (!stepFields[field] || stepFields[field].toString().trim() === '') {
        return { 
          isValid: false, 
          error: `Le champ ${field} est requis` 
        };
      }
    }
    
    return { isValid: true };
  }, [currentStep, stepData]);

  const getRequiredFields = useCallback((step) => {
    const fieldMap = {
      profile: ['firstName', 'lastName', 'email'],
      preferences: ['theme', 'language'],
      security: ['password', 'securityQuestion'],
      notifications: ['emailNotifications', 'pushNotifications'],
      company: ['companyName', 'industry'],
      permissions: ['role', 'department']
    };
    
    return fieldMap[step.id] || [];
  }, []);

  // Gestion des actions
  const nextStep = useCallback(async () => {
    if (isPaused) return;
    
    setIsLoading(true);
    logAction('step_attempted', { stepId: currentStep?.id, stepIndex: currentStepIndex });

    // Validation progressive
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      setErrors({ [currentStep.id]: validation.error });
      logAction('validation_failed', { stepId: currentStep?.id, error: validation.error });
      setIsLoading(false);
      return;
    }

    // Marquer l'étape comme terminée
    setCompletedSteps(prev => new Set([...prev, currentStep?.id]));
    setErrors({});
    
    // Notification intelligente
    if (enableNotifications) {
      showStepNotification(currentStep, 'success');
    }
    
    logAction('step_completed', { 
      stepId: currentStep?.id, 
      stepIndex: currentStepIndex,
      timeSpent: Date.now() - startTime?.getTime() || 0
    });

    // Passer à l'étape suivante
    if (currentStepIndex < currentTemplate.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      if (trackAnalytics) {
        onStepChange?.(currentTemplate.steps[currentStepIndex + 1]);
      }
    } else {
      // Workflow terminé
      const summary = getAuditSummary();
      logAction('workflow_completed', { summary });
      onComplete?.({ 
        stepData, 
        completedSteps: Array.from(completedSteps), 
        auditLog,
        summary 
      });
    }
    
    setIsLoading(false);
  }, [currentStep, currentStepIndex, currentTemplate.steps, stepData, isPaused, validateCurrentStep, showStepNotification, enableNotifications, logAction, trackAnalytics, onStepChange, onComplete, getAuditSummary, startTime, completedSteps]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      logAction('step_navigated_back', { from: currentStepIndex, to: currentStepIndex - 1 });
    }
  }, [currentStepIndex, logAction]);

  const skipStep = useCallback(() => {
    if (currentStep && !currentStep.required) {
      logAction('step_skipped', { stepId: currentStep.id });
      nextStep();
    }
  }, [currentStep, nextStep, logAction]);

  const pauseWorkflow = useCallback(() => {
    setIsPaused(true);
    logAction('workflow_paused', { currentStepIndex });
  }, [logAction, currentStepIndex]);

  const resumeWorkflow = useCallback(() => {
    setIsPaused(false);
    logAction('workflow_resumed', { currentStepIndex });
  }, [logAction, currentStepIndex]);

  // Gestion des erreurs et données
  const handleStepDataChange = useCallback((stepId, data) => {
    setStepData(prev => ({ ...prev, [stepId]: { ...prev[stepId], ...data } }));
    setErrors(prev => ({ ...prev, [stepId]: null }));
    
    logAction('step_data_updated', { stepId, dataKeys: Object.keys(data) });
  }, [logAction]);

  const showAssistantMessage = useCallback((message) => {
    setAssistantMessage(message);
    if (showAssistant) {
      setTimeout(() => setAssistantMessage(''), 5000);
    }
  }, [showAssistant]);

  // Rendu du composant
  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Terminé!</h2>
          <p className="text-gray-600">Félicitations, vous avez complété votre onboarding avec succès.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      {/* En-tête avec progression */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentTemplate.name}
              </h1>
              <p className="text-sm text-gray-600">
                Étape {currentStepIndex + 1} sur {currentTemplate.steps.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={isPaused ? resumeWorkflow : pauseWorkflow}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {isPaused ? 'Reprendre' : 'Pause'}
              </button>
              
              <button
                onClick={() => setShowAssistant(!showAssistant)}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Progression: {Math.round(progress)}%</span>
            <span>Temps restant estimé: {Math.max(0, (currentTemplate.steps.length - currentStepIndex - 1) * 2)} min</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* En-tête de l'étape */}
          <div className="flex items-center mb-6">
            <div className={`p-3 rounded-lg ${completedSteps.has(currentStep.id) ? 'bg-green-100' : 'bg-blue-100'}`}>
              {React.createElement(currentStep.icon, { 
                className: `w-6 h-6 ${completedSteps.has(currentStep.id) ? 'text-green-600' : 'text-blue-600'}` 
              })}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{currentStep.title}</h2>
              {currentStep.required && (
                <span className="text-sm text-red-600">Requis</span>
              )}
            </div>
          </div>

          {/* Contenu de l'étape (exemple basique) */}
          <StepContent
            step={currentStep}
            data={stepData[currentStep.id] || {}}
            onChange={(data) => handleStepDataChange(currentStep.id, data)}
            error={errors[currentStep.id]}
            isLoading={isLoading}
          />

          {/* Actions */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0 || isLoading}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </button>

            <div className="flex space-x-3">
              {!currentStep.required && (
                <button
                  onClick={skipStep}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Ignorer
                </button>
              )}
              
              <button
                onClick={nextStep}
                disabled={isLoading || isPaused}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {currentStepIndex === currentTemplate.steps.length - 1 ? 'Terminer' : 'Suivant'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Timeline des étapes */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression du Workflow</h3>
          <div className="space-y-3">
            {currentTemplate.steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  completedSteps.has(step.id) 
                    ? 'bg-green-100 text-green-600' 
                    : index === currentStepIndex 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    React.createElement(step.icon, { className: "w-4 h-4" })
                  )}
                </div>
                <span className={`ml-3 ${
                  completedSteps.has(step.id) 
                    ? 'text-green-700 line-through' 
                    : index === currentStepIndex 
                      ? 'text-blue-700 font-medium' 
                      : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {step.required && (
                  <span className="ml-2 text-xs text-red-500">*</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Assistant virtuel */}
      <VirtualAssistant
        isVisible={showAssistant}
        currentStep={currentStep}
        onClose={() => setShowAssistant(false)}
        getStepGuidance={getStepGuidance}
        showMessage={showAssistantMessage}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-40">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                notification.type === 'success' ? 'bg-green-50 border border-green-200' :
                notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                notification.type === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                  {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                  {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Composant de contenu d'étape (exemple)
const StepContent = ({ step, data, onChange, error, isLoading }) => {
  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Bienvenue dans DocuCortex Enhanced!</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nous sommes ravis de vous accueillir. Ce processus d'onboarding vous guidera à travers 
              les fonctionnalités principales pour vous permettre de commencer rapidement.
            </p>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={data.firstName || ''}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={data.lastName || ''}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre nom"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => onChange({ email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thème</label>
              <select
                value={data.theme || 'light'}
                onChange={(e) => onChange({ theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
              <select
                value={data.language || 'fr'}
                onChange={(e) => onChange({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Configuration de l'étape "{step.title}" - Cette section sera personnalisée selon vos besoins.
            </p>
          </div>
        );
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {renderStepContent()}
    </div>
  );
};

export default UserOnboardingWorkflow;