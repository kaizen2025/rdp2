#!/bin/bash

# Script de lancement DocuCortex IA

echo "🚀 Démarrage DocuCortex IA v3.0.31"
echo "=================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Construire l'application React
echo "🔨 Construction de l'application React..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction"
    exit 1
fi

echo "✅ Construction réussie"

# Démarrer l'application Electron
echo "⚡ Démarrage d'Electron..."
echo "🎯 DocuCortex IA sera bientôt ouvert dans une fenêtre Electron"

NODE_ENV=production electron .

echo "👋 Application fermée"