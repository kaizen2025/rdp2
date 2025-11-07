// src/index.js - MISE À JOUR POUR REACT 18

import React from 'react';
import { createRoot } from 'react-dom/client'; // Import de createRoot
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/common/ErrorBoundary';

// Version de l'application - Incrémenter pour forcer le nettoyage du cache
const APP_VERSION = '3.0.32';
const VERSION_KEY = 'rdp2_app_version';

/**
 * Nettoie le localStorage si la version de l'app a changé
 * Cela résout les problèmes de permissions et cache obsolète
 */
function cleanupStorageIfNeeded() {
    try {
        const storedVersion = localStorage.getItem(VERSION_KEY);

        if (storedVersion !== APP_VERSION) {
            console.log(`🔄 Version changée: ${storedVersion} → ${APP_VERSION}`);
            console.log('🧹 Nettoyage du cache localStorage...');

            // Liste des clés à préserver (ne pas supprimer)
            const keysToKeep = [
                // Ajouter ici les clés importantes à conserver si nécessaire
            ];

            // Sauvegarder les clés à préserver
            const preserved = {};
            keysToKeep.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) preserved[key] = value;
            });

            // Nettoyer tout le localStorage
            localStorage.clear();

            // Restaurer les clés préservées
            Object.entries(preserved).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            // Enregistrer la nouvelle version
            localStorage.setItem(VERSION_KEY, APP_VERSION);

            console.log('✅ Cache nettoyé avec succès');
            console.log('ℹ️  Vous devrez vous reconnecter');
        } else {
            console.log(`✅ Version à jour: ${APP_VERSION}`);
        }
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage du cache:', error);
        // Ne pas bloquer l'application en cas d'erreur
    }
}

// Nettoyer le cache AVANT de rendre l'application
cleanupStorageIfNeeded();

// Nouvelle méthode de rendu pour React 18
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
