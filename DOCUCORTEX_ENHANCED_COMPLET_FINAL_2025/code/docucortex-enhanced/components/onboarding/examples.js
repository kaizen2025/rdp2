// Exemple d'utilisation du UserOnboardingWorkflow
// Import du composant principal
import React from 'react';
import { UserOnboardingWorkflow, DEFAULT_CONFIG } from './index.js';

// Exemple 1: Utilisation basique
const BasicOnboardingExample = () => {
  const handleOnboardingComplete = (result) => {
    console.log('Onboarding terminé!', result);
    
    // Traitement des données collectées
    const { stepData, completedSteps, auditLog, summary } = result;
    
    // Envoi des données au backend
    fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userData: stepData,
        completedSteps,
        analytics: summary
      })
    });
  };

  return (
    <UserOnboardingWorkflow
      template="default"
      onComplete={handleOnboardingComplete}
      autoStart={true}
      showAssistant={true}
      enableNotifications={true}
      trackAnalytics={true}
    />
  );
};

// Exemple 2: Onboarding entreprise avec gestion d'état
const EnterpriseOnboardingExample = () => {
  const [isOnboardingVisible, setIsOnboardingVisible] = React.useState(false);
  const [userProgress, setUserProgress] = React.useState({});

  const handleStepChange = (step) => {
    console.log('Changement d\'étape:', step);
    
    // Analytics en temps réel
    if (window.gtag) {
      window.gtag('event', 'onboarding_step_change', {
        step_id: step.id,
        step_title: step.title
      });
    }
  };

  const handleOnboardingComplete = (result) => {
    console.log('Onboarding entreprise terminé:', result);
    
    // Enregistrement des données utilisateur
    updateUserProfile(result.stepData);
    
    // Redirection vers le dashboard
    window.location.href = '/dashboard';
  };

  const updateUserProfile = async (userData) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        console.log('Profil utilisateur mis à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  if (!isOnboardingVisible) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={() => setIsOnboardingVisible(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Commencer l'onboarding
        </button>
      </div>
    );
  }

  return (
    <UserOnboardingWorkflow
      template="enterprise"
      onComplete={handleOnboardingComplete}
      onStepChange={handleStepChange}
      autoStart={true}
      showAssistant={true}
      enableNotifications={true}
      trackAnalytics={true}
      className="enterprise-onboarding"
    />
  );
};

// Exemple 3: Onboarding développeur avec template personnalisé
const DeveloperOnboardingExample = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);

  const handleOnboardingComplete = (result) => {
    console.log('Onboarding développeur terminé:', result);
    setIsCompleted(true);
    
    // Configuration automatique de l'environnement de développement
    setupDevelopmentEnvironment(result.stepData);
  };

  const setupDevelopmentEnvironment = async (stepData) => {
    const { apiKey, projectName, environment } = stepData;
    
    // Configuration des clés API
    localStorage.setItem('dev_api_key', apiKey);
    
    // Configuration du projet
    localStorage.setItem('dev_project_name', projectName);
    
    // Configuration de l'environnement
    localStorage.setItem('dev_environment', environment);
    
    console.log('Environnement de développement configuré');
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">🎉 Configuration Terminée!</h2>
          <p className="text-gray-300 mb-6">
            Votre environnement de développement est maintenant configuré.
          </p>
          <button
            onClick={() => window.location.href = '/workspace'}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Accéder à l'Espace de Travail
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserOnboardingWorkflow
      template="developer"
      onComplete={handleOnboardingComplete}
      autoStart={true}
      showAssistant={true}
      enableNotifications={false} // Désactiver pour une expérience dev plus silencieuse
      trackAnalytics={true}
      className="developer-onboarding dark-theme"
    />
  );
};

// Exemple 4: Composant d'onboarding avec intégration custom
const CustomOnboardingIntegration = () => {
  const [onboardingState, setOnboardingState] = React.useState({
    isActive: false,
    currentStep: 0,
    progress: 0
  });

  React.useEffect(() => {
    // Vérifier si l'utilisateur a déjà complété l'onboarding
    const hasCompletedOnboarding = localStorage.getItem('user_onboarding_completed');
    
    if (!hasCompletedOnboarding) {
      setOnboardingState(prev => ({ ...prev, isActive: true }));
    }
  }, []);

  const handleOnboardingComplete = React.useCallback((result) => {
    console.log('Onboarding custom complété:', result);
    
    // Marquer comme complété
    localStorage.setItem('user_onboarding_completed', 'true');
    localStorage.setItem('onboarding_data', JSON.stringify(result));
    
    // Fermer l'onboarding
    setOnboardingState({
      isActive: false,
      currentStep: 0,
      progress: 100
    });

    // Analytics
    if (window.gtag) {
      window.gtag('event', 'onboarding_completed', {
        template: result.template || 'default',
        duration: result.summary?.timeSpent || 0,
        steps_completed: result.completedSteps?.length || 0
      });
    }

    // Redirection ou autre action
    handlePostOnboardingAction(result);
  }, []);

  const handlePostOnboardingAction = (result) => {
    // Actions post-onboarding personnalisées
    const { stepData } = result;
    
    if (stepData?.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else if (stepData?.role === 'developer') {
      window.location.href = '/dev/dashboard';
    } else {
      window.location.href = '/user/dashboard';
    }
  };

  if (!onboardingState.isActive) {
    return (
      <div className="app-content">
        {/* Votre application normale */}
        <h1>Bienvenue dans DocuCortex Enhanced</h1>
        <p>L'onboarding a été complété. Bienvenue!</p>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      <UserOnboardingWorkflow
        template="default"
        onComplete={handleOnboardingComplete}
        autoStart={true}
        showAssistant={true}
        enableNotifications={true}
        trackAnalytics={true}
        className="fullscreen-onboarding"
      />
    </div>
  );
};

// Exemple 5: Hook personnalisé pour l'intégration
const useOnboarding = () => {
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Charger la progression sauvegardée
    const savedProgress = localStorage.getItem('onboarding_progress');
    if (savedProgress) {
      try {
        const data = JSON.parse(savedProgress);
        setProgress(data.progress || 0);
        setIsCompleted(data.isCompleted || false);
      } catch (error) {
        console.warn('Erreur lors du chargement de la progression:', error);
      }
    }
  }, []);

  const startOnboarding = React.useCallback(() => {
    setIsCompleted(false);
    setProgress(0);
  }, []);

  const completeOnboarding = React.useCallback((result) => {
    setIsCompleted(true);
    setProgress(100);
    
    // Sauvegarder la completion
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completion_date', new Date().toISOString());
  }, []);

  const resetOnboarding = React.useCallback(() => {
    setIsCompleted(false);
    setProgress(0);
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_progress');
  }, []);

  return {
    isCompleted,
    progress,
    startOnboarding,
    completeOnboarding,
    resetOnboarding
  };
};

// Composant d'exemple avec le hook personnalisé
const HookExampleComponent = () => {
  const { isCompleted, progress, startOnboarding, resetOnboarding } = useOnboarding();

  if (!isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Progression: {progress}%</h2>
          <button
            onClick={startOnboarding}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuer l'onboarding
          </button>
          <button
            onClick={resetOnboarding}
            className="ml-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Onboarding Terminé!</h2>
        <p className="text-gray-600">Bienvenue dans DocuCortex Enhanced!</p>
      </div>
    </div>
  );
};

export {
  BasicOnboardingExample,
  EnterpriseOnboardingExample,
  DeveloperOnboardingExample,
  CustomOnboardingIntegration,
  HookExampleComponent,
  useOnboarding
};