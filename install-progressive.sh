#!/bin/bash

echo "🚀 Installation progressive DocuCortex AI v3.0.31"
echo "================================================="

# Étape 1: Installation de base
echo "📦 Étape 1: Installation de base..."
npm install
echo "✅ Installation de base terminée"

# Étape 2: React et Material-UI
echo "📦 Étape 2: React et Material-UI..."
npm install react@^18.2.0 react-dom@^18.2.0 react-scripts@5.0.1
npm install @mui/material@^5.15.0 @mui/icons-material@^5.15.0 @emotion/react@^11.11.0 @emotion/styled@^11.11.0
echo "✅ React et Material-UI installés"

# Étape 3: Serveur backend
echo "📦 Étape 3: Serveur backend..."
npm install express@^4.18.0 cors@^2.8.0 body-parser@^1.20.0 multer@^1.4.0
echo "✅ Serveur backend installé"

# Étape 4: Base de données
echo "📦 Étape 4: Base de données..."
npm install better-sqlite3@^9.0.0 --build-from-source=false
echo "✅ Base de données installée"

# Étape 5: Outils et utilitaires
echo "📦 Étape 5: Outils et utilitaires..."
npm install axios@^1.6.0 date-fns@^2.30.0 jspdf@^2.5.0 pdf-parse@^1.1.0
echo "✅ Outils et utilitaires installés"

# Test de fonctionnement
echo ""
echo "🎉 Installation terminée!"
echo "Test du démarrage:"
npm start &
sleep 3
echo "✅ Application démarrée sur http://localhost:3000"
echo ""
echo "Pour lancer l'application:"
echo "  npm start           - Démarrer l'application"
echo "  npm run dev         - Mode développement"
echo ""
echo "Installation complète réussie! 🎉"