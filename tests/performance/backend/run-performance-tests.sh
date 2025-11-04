#!/bin/bash

# Script de lancement des tests de performance backend DocuCortex
# @file run-performance-tests.sh

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$PROJECT_DIR/results"
LOG_FILE="$RESULTS_DIR/performance-tests-$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}🚀 Lancement des tests de performance backend DocuCortex${NC}"
echo "=================================================="

# Créer le dossier results s'il n'existe pas
mkdir -p "$RESULTS_DIR"

# Fonction d'affichage des logs
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    log_error "Fichier package.json non trouvé. Assurez-vous d'être dans le bon répertoire."
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    log "📦 Installation des dépendances..."
    cd "$PROJECT_DIR"
    npm install
    log_success "Dépendances installées"
fi

# Vérifier que le serveur backend est accessible
check_server() {
    log "🔍 Vérification de la disponibilité du serveur backend..."
    
    if curl -s --max-time 5 http://localhost:3002/api/health > /dev/null 2>&1; then
        log_success "Serveur backend accessible sur http://localhost:3002"
        return 0
    else
        log_warning "Serveur backend non accessible sur http://localhost:3002"
        log_warning "Les tests continueront mais peuvent échouer"
        return 1
    fi
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Afficher cette aide"
    echo "  -a, --all           Exécuter tous les tests (défaut)"
    echo "  -t, --test TYPE     Exécuter seulement le type de test spécifié"
    echo "                     Types disponibles: api, database, websocket, load, memory, ged"
    echo "  -e, --env ENV       Spécifier l'environnement (development, staging, production)"
    echo "  -o, --output DIR    Spécifier le dossier de sortie (défaut: results/)"
    echo "  -v, --verbose       Mode verbeux"
    echo "  --no-reports        Ne pas générer de rapports"
    echo ""
    echo "Exemples:"
    echo "  $0 --all                    # Exécuter tous les tests"
    echo "  $0 --test api               # Tests seulement pour les API"
    echo "  $0 --test database --verbose # Tests base de données en mode verbeux"
    echo "  $0 --env production         # Tests en mode production"
}

# Configuration par défaut
TEST_TYPES="all"
ENVIRONMENT="development"
VERBOSE=false
GENERATE_REPORTS=true

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            TEST_TYPES="all"
            shift
            ;;
        -t|--test)
            TEST_TYPES="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -o|--output)
            RESULTS_DIR="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-reports)
            GENERATE_REPORTS=false
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Afficher la configuration
log "📋 Configuration:"
log "   Tests: $TEST_TYPES"
log "   Environnement: $ENVIRONMENT"
log "   Dossier de sortie: $RESULTS_DIR"
log "   Mode verbeux: $VERBOSE"
log "   Génération rapports: $GENERATE_REPORTS"
log ""

# Vérifier la disponibilité du serveur
check_server

# Se déplacer dans le répertoire du projet
cd "$PROJECT_DIR"

# Préparer la commande de test
CMD="node index.js"

# Ajouter les options
if [ "$TEST_TYPES" != "all" ]; then
    CMD="$CMD $TEST_TYPES"
fi

if [ "$VERBOSE" = true ]; then
    CMD="$CMD --verbose"
fi

CMD="$CMD --env=$ENVIRONMENT"
CMD="$CMD --output=$RESULTS_DIR"

if [ "$GENERATE_REPORTS" = false ]; then
    CMD="$CMD --no-reports"
fi

# Lancer les tests
log "🎯 Lancement des tests..."
echo "Commande: $CMD"
echo ""

# Capturer le temps de début
START_TIME=$(date +%s)

# Exécuter les tests
if eval "$CMD"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_success "Tests terminés avec succès en ${DURATION}s"
    
    # Afficher les fichiers de rapport générés
    log "📁 Rapports générés dans: $RESULTS_DIR"
    if ls "$RESULTS_DIR"/*.json 1> /dev/null 2>&1; then
        log "Fichiers JSON:"
        ls -la "$RESULTS_DIR"/*.json | while read -r line; do
            log "   $line"
        done
    fi
    
    if ls "$RESULTS_DIR"/*.html 1> /dev/null 2>&1; then
        log "Fichiers HTML:"
        ls -la "$RESULTS_DIR"/*.html | while read -r line; do
            log "   $line"
        done
    fi
    
    if ls "$RESULTS_DIR"/*.csv 1> /dev/null 2>&1; then
        log "Fichiers CSV:"
        ls -la "$RESULTS_DIR"/*.csv | while read -r line; do
            log "   $line"
        done
    fi
    
else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_error "Tests échoués après ${DURATION}s"
    log_error "Consultez les logs pour plus de détails: $LOG_FILE"
    exit 1
fi

# Ouvrir le rapport HTML dans le navigateur (optionnel)
if [ "$GENERATE_REPORTS" = true ] && ls "$RESULTS_DIR"/*.html 1> /dev/null 2>&1; then
    LATEST_REPORT=$(ls -t "$RESULTS_DIR"/*.html | head -1)
    echo ""
    read -p "Ouvrir le rapport HTML dans le navigateur ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open &> /dev/null; then
            open "$LATEST_REPORT"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$LATEST_REPORT"
        else
            log "Ouvrez manuellement le rapport: $LATEST_REPORT"
        fi
    fi
fi

log_success "🎉 Fin des tests de performance"
log "Log détaillé: $LOG_FILE"