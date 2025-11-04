#!/bin/bash

################################################################################
#  GENERATION RAPIDE DE L'EXECUTABLE RDS VIEWER ANECOOP v3.0.27
################################################################################
#  Ce script génère rapidement l'exécutable optimisé (Linux/Mac/Windows)
#  Usage: ./generate-executable.sh [win|linux|mac|all]
################################################################################

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
START_TIME=$(date +%s)
ERROR_COUNT=0
TARGET_PLATFORM="${1:-win}"  # Par défaut Windows

# Header
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║     GENERATION EXECUTABLE RDS VIEWER ANECOOP v3.0.27                 ║"
echo "║                  Build Optimisé Production                            ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}🚀 Début de la génération...${NC}"
echo ""

################################################################################
# ETAPE 1: Vérification de l'environnement
################################################################################
echo -e "${CYAN}[1/7] Vérification de l'environnement...${NC}"

# Vérification Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trouvé. Installation requise.${NC}"
    ((ERROR_COUNT++))
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js détecté: ${NODE_VERSION}${NC}"

# Vérification npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm non trouvé${NC}"
    ((ERROR_COUNT++))
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm détecté: ${NPM_VERSION}${NC}"

echo ""

################################################################################
# ETAPE 2: Installation des dépendances critiques
################################################################################
echo -e "${CYAN}[2/7] Installation des dépendances critiques...${NC}"

# Vérifier si electron-builder est installé
if ! npm list electron-builder &> /dev/null; then
    echo -e "${YELLOW}⏳ Installation de electron-builder...${NC}"
    npm install --save-dev electron-builder
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur installation electron-builder${NC}"
        ((ERROR_COUNT++))
        exit 1
    fi
fi
echo -e "${GREEN}✅ electron-builder installé${NC}"

# Vérifier si electron est installé
if ! npm list electron &> /dev/null; then
    echo -e "${YELLOW}⏳ Installation de electron...${NC}"
    npm install --save-dev electron
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur installation electron${NC}"
        ((ERROR_COUNT++))
        exit 1
    fi
fi
echo -e "${GREEN}✅ electron installé${NC}"

echo ""

################################################################################
# ETAPE 3: Nettoyage des builds précédents
################################################################################
echo -e "${CYAN}[3/7] Nettoyage des builds précédents...${NC}"

if [ -d "dist" ]; then
    echo -e "${YELLOW}⏳ Suppression de dist/...${NC}"
    rm -rf dist
fi

if [ -d "release" ]; then
    echo -e "${YELLOW}⏳ Suppression de release/...${NC}"
    rm -rf release
fi

if [ -d "out" ]; then
    echo -e "${YELLOW}⏳ Suppression de out/...${NC}"
    rm -rf out
fi

echo -e "${GREEN}✅ Nettoyage terminé${NC}"
echo ""

################################################################################
# ETAPE 4: Génération des icônes
################################################################################
echo -e "${CYAN}[4/7] Génération des icônes...${NC}"

if [ ! -d "build/icons" ]; then
    mkdir -p "build/icons"
fi

# Vérifier si les icônes existent déjà
if [ ! -f "build/icons/icon.png" ] || [ ! -f "build/icons/icon.ico" ]; then
    echo -e "${YELLOW}⏳ Génération des icônes...${NC}"
    
    # Utiliser generate-icons.js s'il existe
    if [ -f "generate-icons.js" ]; then
        node generate-icons.js
    else
        echo -e "${YELLOW}⚠️  Icônes par défaut seront utilisées${NC}"
    fi
else
    echo -e "${GREEN}✅ Icônes déjà présentes${NC}"
fi

echo ""

################################################################################
# ETAPE 5: Configuration du build
################################################################################
echo -e "${CYAN}[5/7] Configuration du build...${NC}"

# Vérifier la présence de electron-builder.yml
if [ ! -f "build/electron-builder.yml" ]; then
    echo -e "${YELLOW}⚠️  Configuration electron-builder.yml non trouvée${NC}"
    echo -e "${YELLOW}Utilisation de la configuration par défaut...${NC}"
else
    echo -e "${GREEN}✅ Configuration electron-builder.yml trouvée${NC}"
fi

echo ""

################################################################################
# ETAPE 6: Build de l'application Electron
################################################################################
echo -e "${CYAN}[6/7] Génération de l'exécutable...${NC}"
echo -e "${YELLOW}⏳ Cette étape peut prendre 3-10 minutes...${NC}"
echo ""

# Définir les variables d'environnement pour optimisation
export NODE_ENV=production
export NODE_OPTIONS=--max-old-space-size=4096

# Déterminer les flags de build selon la plateforme
BUILD_FLAGS=""
case "$TARGET_PLATFORM" in
    win|windows)
        BUILD_FLAGS="--win --x64"
        echo -e "${CYAN}📦 Build pour Windows x64...${NC}"
        ;;
    linux)
        BUILD_FLAGS="--linux --x64"
        echo -e "${CYAN}📦 Build pour Linux x64...${NC}"
        ;;
    mac|macos)
        BUILD_FLAGS="--mac --x64"
        echo -e "${CYAN}📦 Build pour macOS x64...${NC}"
        ;;
    all)
        BUILD_FLAGS="--win --linux --mac --x64"
        echo -e "${CYAN}📦 Build pour toutes les plateformes...${NC}"
        ;;
    *)
        echo -e "${RED}❌ Plateforme non reconnue: $TARGET_PLATFORM${NC}"
        echo "Usage: $0 [win|linux|mac|all]"
        exit 1
        ;;
esac

# Lancer le build avec electron-builder
if [ -f "build/electron-builder.yml" ]; then
    echo -e "${CYAN}📦 Build avec configuration YAML...${NC}"
    npx electron-builder $BUILD_FLAGS --config build/electron-builder.yml
else
    echo -e "${CYAN}📦 Build avec configuration par défaut...${NC}"
    npx electron-builder $BUILD_FLAGS
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la génération de l'exécutable${NC}"
    ((ERROR_COUNT++))
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Exécutable généré avec succès !${NC}"
echo ""

################################################################################
# ETAPE 7: Vérification et rapport final
################################################################################
echo -e "${CYAN}[7/7] Vérification et rapport final...${NC}"

# Chercher les fichiers générés
EXECUTABLES_FOUND=0
INSTALLERS_FOUND=0

if [ -d "dist" ]; then
    # Chercher les exécutables
    while IFS= read -r -d '' file; do
        ((EXECUTABLES_FOUND++))
        FILE_SIZE=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}✅ Fichier trouvé: $file${NC}"
        echo -e "${CYAN}   Taille: $FILE_SIZE${NC}"
    done < <(find dist -type f \( -name "*.exe" -o -name "*.AppImage" -o -name "*.dmg" -o -name "*.deb" -o -name "*.rpm" \) -print0)
fi

echo ""
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                      GENERATION TERMINEE AVEC SUCCES                   ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Calculer le temps écoulé
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo -e "${GREEN}🎉 Génération terminée en ${MINUTES}min ${SECONDS}s !${NC}"
echo ""

echo -e "${CYAN}📊 Résumé:${NC}"
echo "   • Fichiers générés: $EXECUTABLES_FOUND"
echo "   • Emplacement: dist/"
echo "   • Version: 3.0.27"
echo "   • Plateforme: $TARGET_PLATFORM"
echo ""

echo -e "${CYAN}🚀 Prochaines étapes:${NC}"
echo "   1. Tester l'exécutable dans dist/"
echo "   2. Tester l'installeur (si généré)"
echo "   3. Distribuer aux utilisateurs"
echo ""

echo -e "${YELLOW}📁 Les fichiers sont disponibles dans le dossier 'dist'${NC}"
echo ""

# Liste détaillée des fichiers
if [ $EXECUTABLES_FOUND -gt 0 ]; then
    echo -e "${CYAN}📋 Fichiers générés:${NC}"
    ls -lh dist/ | grep -E "\.(exe|AppImage|dmg|deb|rpm)$"
fi

echo ""
echo -e "${GREEN}✨ Génération réussie !${NC}"
echo ""

exit 0
