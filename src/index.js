// src/index.js - MISE À JOUR POUR DÉMARRAGE ASYNCHRONE DE L'API

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/common/ErrorBoundary';
import { apiServicePromise } from './apiService'; // --- IMPORT DE LA PROMESSE ---

const container = document.getElementById('root');
const root = createRoot(container);

// --- NOUVELLE LOGIQUE DE RENDU ASYNCHRONE ---

// 1. Afficher un indicateur de chargement initial
root.render(
  <React.StrictMode>
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>Démarrage de l'application...</h1>
      <p>Connexion au serveur backend en cours...</p>
    </div>
  </React.StrictMode>
);

// 2. Attendre que le service API soit prêt
apiServicePromise.then(() => {
  // 3. Une fois prêt, rendre l'application principale
  console.log('[index.js] Le service API est prêt. Rendu de l\'application principale.');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}).catch(error => {
  // En cas d'échec de l'initialisation, l'erreur est déjà affichée par apiService.js
  console.error('[index.js] Échec du rendu de l\'application car l\'initialisation de l\'API a échoué.', error);
});

// --- FIN DE LA NOUVELLE LOGIQUE ---

reportWebVitals();
