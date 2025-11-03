#!/bin/bash
# Script d'installation propre pour DocuCortex IA
# Résout les problèmes de dépendances natives

set -e

echo "🚀 Installation de DocuCortex IA"
echo "================================"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé !"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Nettoyer les anciennes installations si demandé
if [ "$1" == "--clean" ]; then
    echo "🧹 Nettoyage des anciennes installations..."
    rm -rf node_modules package-lock.json build dist
fi

# Installer les dépendances en ignorant les scripts problématiques
echo "📦 Installation des dépendances..."
npm install --ignore-scripts

# Recompiler better-sqlite3 (critique pour l'application)
echo "🔨 Compilation de better-sqlite3..."
npm rebuild better-sqlite3

echo ""
echo "✅ Installation terminée avec succès !"
echo ""
echo "Commandes disponibles:"
echo "  npm run dev              - Lancer en mode développement"
echo "  npm run build            - Compiler le projet"
echo "  npm run build:exe        - Créer l'exécutable portable"
echo ""
