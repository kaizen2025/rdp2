#!/bin/bash

# Script de correction des dépendances DocuCortex AI
# Version 3.0.27 - Compatible Node.js 18.19.0

echo "🚀 Correction des dépendances DocuCortex AI..."
echo "Version Node.js: $(node --version)"
echo "Version npm: $(npm --version)"
echo ""

# 1. Nettoyage complet
echo "🧹 Nettoyage des installations précédentes..."
rm -rf node_modules package-lock.json
rm -rf ~/.npm/_logs/*.log
echo "✅ Nettoyage terminé"

# 2. Installation des dépendances système pour la compilation native
echo ""
echo "🔧 Installation des outils de compilation..."
apt-get update -qq
apt-get install -y -qq build-essential python3-dev python3-setuptools

# 3. Installation des dépendances avec résolutions
echo ""
echo "📦 Installation des dépendances avec optimisations..."
npm install --legacy-peer-deps --ignore-scripts

# 4. Reconstruction des modules natifs
echo ""
echo "🔨 Reconstruction des modules natifs..."
npm rebuild better-sqlite3 --build-from-source --ignore-scripts=false

# 5. Installation des scripts post-installation
echo ""
echo "⚙️ Installation des scripts post-installation..."
npm run postinstall

# 6. Vérification finale
echo ""
echo "✅ Vérification de l'installation..."
npm list --depth=0

echo ""
echo "🎉 Installation terminée avec succès!"
echo "Vous pouvez maintenant lancer l'application avec:"
echo "  npm run dev        - Mode développement"
echo "  npm run server:start - Serveur backend seulement"
echo "  npm run start:auto - Frontend React seulement"