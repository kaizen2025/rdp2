// src/index.js - MISE À JOUR POUR REACT 18

import React from 'react';
import { createRoot } from 'react-dom/client'; // Import de createRoot
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/common/ErrorBoundary';

// Version de l'application - Incrémenter pour forcer le nettoyage du cache
const APP_VERSION = '3.0.33';
const VERSION_KEY = 'rdp2_app_version';

/**
 * Nettoie COMPLETEMENT le localStorage à chaque démarrage
 * pour résoudre définitivement les problèmes de permissions
 */
function forceCleanStorage() {
    try {
        console.log('🔥 NETTOYAGE FORCÉ DU LOCALSTORAGE');
        console.log('📊 Avant nettoyage:', Object.keys(localStorage).length, 'clés');

        // Sauvegarder UNIQUEMENT la version
        const keysToPreserve = {
            [VERSION_KEY]: APP_VERSION
        };

        // Log de toutes les clés avant suppression
        const allKeys = Object.keys(localStorage);
        console.log('🗑️  Clés à supprimer:', allKeys);

        // TOUT supprimer
        localStorage.clear();

        // Restaurer uniquement la version
        Object.entries(keysToPreserve).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });

        console.log('✅ localStorage nettoyé complètement');
        console.log('📊 Après nettoyage:', Object.keys(localStorage).length, 'clés');
        console.log('ℹ️  Vous devrez vous reconnecter');

        return true;
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage du cache:', error);
        return false;
    }
}

/**
 * Nettoie le localStorage si la version de l'app a changé
 */
function cleanupStorageIfNeeded() {
    try {
        const storedVersion = localStorage.getItem(VERSION_KEY);

        // TOUJOURS nettoyer si version différente OU si pas de version enregistrée
        if (storedVersion !== APP_VERSION) {
            console.log(`🔄 Version changée: ${storedVersion} → ${APP_VERSION}`);
            return forceCleanStorage();
        } else {
            console.log(`✅ Version à jour: ${APP_VERSION}`);
            // Vérifier quand même qu'il n'y a pas de données corrompues
            const authUser = localStorage.getItem('auth_user');
            if (authUser) {
                try {
                    JSON.parse(authUser);
                    console.log('✅ Données auth valides');
                } catch {
                    console.warn('⚠️  Données auth corrompues - nettoyage...');
                    return forceCleanStorage();
                }
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du cache:', error);
        // En cas d'erreur, nettoyer par sécurité
        return forceCleanStorage();
    }
}

// Nettoyer le cache AVANT de rendre l'application
const wasCleared = cleanupStorageIfNeeded();

// Si le cache a été nettoyé, afficher un message à l'utilisateur
if (wasCleared) {
    // Créer un overlay temporaire
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: Arial, sans-serif;
    `;
    overlay.innerHTML = `
        <div style="text-align: center; padding: 40px; max-width: 500px;">
            <h1 style="font-size: 48px; margin: 0;">🧹</h1>
            <h2 style="margin: 20px 0;">Cache nettoyé</h2>
            <p style="margin: 10px 0; line-height: 1.6;">
                Le cache de l'application a été nettoyé pour résoudre les problèmes de permissions.
            </p>
            <p style="margin: 20px 0; font-weight: bold; color: #ffd700;">
                Vous devrez vous reconnecter
            </p>
            <button id="continueBtn" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            ">
                Continuer
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('continueBtn').onclick = () => {
        overlay.remove();
    };
}

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
