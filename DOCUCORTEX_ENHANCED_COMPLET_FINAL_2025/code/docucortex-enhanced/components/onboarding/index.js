// Exports du module d'onboarding
export { default as UserOnboardingWorkflow } from './UserOnboardingWorkflow.js';

// Templates disponibles
export const ONBOARDING_TEMPLATES = {
  default: {
    id: 'default',
    name: 'Onboarding Standard',
    steps: [
      { id: 'welcome', title: 'Bienvenue', icon: 'User', required: true, duration: 3000 },
      { id: 'profile', title: 'Profil Utilisateur', icon: 'User', required: true, duration: 8000 },
      { id: 'preferences', title: 'Préférences', icon: 'Settings', required: false, duration: 5000 },
      { id: 'security', title: 'Sécurité', icon: 'Shield', required: true, duration: 6000 },
      { id: 'notifications', title: 'Notifications', icon: 'Bell', required: false, duration: 4000 },
      { id: 'complete', title: 'Finalisation', icon: 'Award', required: true, duration: 3000 }
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Onboarding Entreprise',
    steps: [
      { id: 'welcome', title: 'Bienvenue Enterprise', icon: 'User', required: true, duration: 4000 },
      { id: 'company', title: 'Informations Société', icon: 'FileText', required: true, duration: 10000 },
      { id: 'permissions', title: 'Permissions & Rôles', icon: 'Shield', required: true, duration: 8000 },
      { id: 'integration', title: 'Intégrations', icon: 'Zap', required: false, duration: 12000 },
      { id: 'compliance', title: 'Conformité', icon: 'CheckCircle', required: true, duration: 6000 },
      { id: 'training', title: 'Formation', icon: 'Target', required: true, duration: 15000 }
    ]
  },
  developer: {
    id: 'developer',
    name: 'Onboarding Développeur',
    steps: [
      { id: 'welcome', title: 'Bienvenue Dev', icon: 'Brain', required: true, duration: 3000 },
      { id: 'environment', title: 'Configuration', icon: 'Settings', required: true, duration: 10000 },
      { id: 'api', title: 'API & SDK', icon: 'Zap', required: true, duration: 12000 },
      { id: 'docs', title: 'Documentation', icon: 'FileText', required: false, duration: 8000 },
      { id: 'resources', title: 'Ressources', icon: 'TrendingUp', required: false, duration: 6000 }
    ]
  }
};

// Configuration par défaut
export const DEFAULT_CONFIG = {
  template: 'default',
  autoStart: true,
  showAssistant: true,
  enableNotifications: true,
  trackAnalytics: true
};

// Utilitaires
export const createCustomTemplate = (name, steps) => ({
  id: name.toLowerCase().replace(/\s+/g, '_'),
  name,
  steps: steps.map((step, index) => ({
    ...step,
    duration: step.duration || 5000,
    required: step.required !== false
  }))
});

export const validateStepData = (step, data) => {
  const requiredFields = getRequiredFields(step);
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`Le champ ${field} est requis`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const getRequiredFields = (step) => {
  const fieldMap = {
    profile: ['firstName', 'lastName', 'email'],
    preferences: ['theme', 'language'],
    security: ['password', 'securityQuestion'],
    notifications: ['emailNotifications', 'pushNotifications'],
    company: ['companyName', 'industry'],
    permissions: ['role', 'department']
  };
  
  return fieldMap[step.id] || [];
};

// Hooks utilitaires pour l'utilisation externe
export const useOnboardingAnalytics = () => {
  const getProgress = (completedSteps, totalSteps) => {
    return Math.round((completedSteps.length / totalSteps) * 100);
  };

  const getEstimatedTimeRemaining = (currentStepIndex, steps) => {
    const remainingSteps = steps.length - currentStepIndex - 1;
    const averageStepTime = steps
      .slice(currentStepIndex)
      .reduce((sum, step) => sum + step.duration, 0) / Math.max(remainingSteps, 1);
    
    return Math.ceil(averageStepTime / 60000); // Convertir en minutes
  };

  return { getProgress, getEstimatedTimeRemaining };
};

export const useOnboardingStorage = () => {
  const saveProgress = (stepData, completedSteps) => {
    try {
      localStorage.setItem('onboarding_progress', JSON.stringify({
        stepData,
        completedSteps: Array.from(completedSteps),
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Impossible de sauvegarder la progression:', error);
    }
  };

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem('onboarding_progress');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Impossible de charger la progression:', error);
      return null;
    }
  };

  const clearProgress = () => {
    localStorage.removeItem('onboarding_progress');
  };

  return { saveProgress, loadProgress, clearProgress };
};

// Constants d'optimisation mémoire
export const MEMORY_CONSTANTS = {
  MAX_STEPS_IN_MEMORY: 10,
  CLEANUP_INTERVAL: 30000,
  DEBOUNCE_DELAY: 500,
  VIRTUALIZATION_THRESHOLD: 20
};

// Configuration des icônes Lucide React
export const STEP_ICONS = {
  User: 'User',
  Settings: 'Settings',
  Shield: 'Shield',
  Bell: 'Bell',
  Award: 'Award',
  FileText: 'FileText',
  Zap: 'Zap',
  CheckCircle: 'CheckCircle',
  Target: 'Target',
  Brain: 'Brain',
  TrendingUp: 'TrendingUp'
};