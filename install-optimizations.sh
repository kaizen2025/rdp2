#!/bin/bash
# install-optimizations.sh - Installation des optimisations pour build portable exceptionnel

echo "=================================================="
echo "  RDS Viewer - Installation des Optimisations"
echo "  Version: 3.0.26"
echo "=================================================="
echo ""

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js d'abord."
    exit 1
fi

echo "✅ npm détecté: $(npm --version)"
echo ""

# Installation des dépendances d'optimisation
echo "📦 Installation des dépendances d'optimisation webpack..."
npm install --save-dev @craco/craco@^7.1.0
npm install --save-dev compression-webpack-plugin@^11.1.0
npm install --save-dev terser-webpack-plugin@^5.3.10
npm install --save-dev webpack-bundle-analyzer@^4.10.1
npm install --save-dev babel-plugin-import@^1.13.8

echo ""
echo "📦 Installation de React Query pour cache intelligent..."
npm install @tanstack/react-query@^5.56.2
npm install --save-dev @tanstack/react-query-devtools@^5.56.2

echo ""
echo "📦 Installation des dépendances de performance..."
npm install react-lazy-load-image-component@^1.6.2
npm install workbox-webpack-plugin@^7.1.0

echo ""
echo "✅ Toutes les dépendances d'optimisation sont installées !"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Modifier package.json pour utiliser craco:"
echo "     \"start\": \"craco start\","
echo "     \"build\": \"craco build\","
echo ""
echo "  2. Lancer le build optimisé:"
echo "     npm run build:optimized"
echo ""
echo "  3. Consultez OPTIMIZATION_GUIDE.md pour plus de détails"
echo ""
echo "=================================================="
