#!/bin/bash

# Script d'installation des dépendances pour RDS Viewer
# Ce script aide à installer les dépendances avec gestion des erreurs

echo "═══════════════════════════════════════════════════════"
echo "   RDS Viewer - Installation des Dépendances"
echo "═══════════════════════════════════════════════════════"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier Node.js
info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
info "Node.js version: $NODE_VERSION"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé."
    exit 1
fi

NPM_VERSION=$(npm -v)
info "npm version: $NPM_VERSION"

echo ""
info "Nettoyage des anciens modules..."
rm -rf node_modules package-lock.json

echo ""
info "Installation des dépendances..."
echo ""

# Tentative d'installation normale
if npm install; then
    info "✅ Installation réussie!"
else
    warn "❌ Installation échouée. Tentative avec des options alternatives..."

    # Tentative avec legacy-peer-deps
    echo ""
    warn "Tentative avec --legacy-peer-deps..."
    if npm install --legacy-peer-deps; then
        info "✅ Installation réussie avec --legacy-peer-deps!"
    else
        error "❌ Installation échouée."
        echo ""
        error "Problèmes possibles:"
        echo "  1. Problème de connexion réseau"
        echo "  2. Proxy ou pare-feu bloquant"
        echo "  3. Problème de permissions"
        echo ""
        error "Solutions suggérées:"
        echo "  - Vérifier votre connexion Internet"
        echo "  - Configurer un proxy npm si nécessaire: npm config set proxy http://proxy:port"
        echo "  - Exécuter avec sudo (Linux/Mac) ou en administrateur (Windows)"
        echo "  - Essayer avec un VPN si vous êtes en Chine"
        echo ""
        exit 1
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   Vérification des Packages Critiques"
echo "═══════════════════════════════════════════════════════"
echo ""

# Vérifier les packages critiques
check_package() {
    local package=$1
    if npm list "$package" &> /dev/null; then
        info "✅ $package installé"
        return 0
    else
        error "❌ $package NON installé"
        return 1
    fi
}

MISSING=0

check_package "express" || MISSING=1
check_package "electron" || MISSING=1
check_package "react" || MISSING=1
check_package "react-scripts" || MISSING=1
check_package "@google/generative-ai" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    warn "Certains packages sont manquants. Vous pouvez:"
    echo "  1. Réessayer l'installation: npm install"
    echo "  2. Installer les packages manquants individuellement"
    echo "  3. Consulter INSTALLATION_FIXES.md pour plus d'aide"
else
    echo ""
    info "✅ Tous les packages critiques sont installés!"
    echo ""
    info "Vous pouvez maintenant démarrer l'application:"
    echo "  npm run electron:start"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
