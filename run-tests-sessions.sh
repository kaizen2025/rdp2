#!/bin/bash

# Script d'aide pour exécuter les tests des Sessions RDS
# RDS Viewer Anecoop

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher l'aide
show_help() {
    echo -e "${BLUE}Tests des Sessions RDS - RDS Viewer Anecoop${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commandes disponibles :"
    echo "  unit          Exécuter les tests unitaires uniquement"
    echo "  integration   Exécuter les tests d'intégration uniquement"
    echo "  performance   Exécuter les tests de performance uniquement"
    echo "  all           Exécuter tous les tests (défaut)"
    echo "  coverage      Exécuter tous les tests avec rapport de couverture"
    echo "  watch         Lancer les tests en mode watch"
    echo "  debug         Exécuter les tests en mode debug"
    echo "  ci            Exécuter les tests en mode CI (sans watch, avec coverage)"
    echo "  clean         Nettoyer les caches et rapports"
    echo "  help          Afficher cette aide"
    echo ""
    echo "Exemples :"
    echo "  $0 unit                    # Tests unitaires uniquement"
    echo "  $0 performance             # Tests de performance uniquement"
    echo "  $0 coverage               # Tests avec couverture"
    echo "  $0 ci                     # Tests pour CI"
    echo ""
}

# Fonction pour afficher un message d'information
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher un message de succès
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Fonction pour afficher un message d'erreur
error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour afficher un message d'avertissement
warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    info "Vérification des prérequis..."
    
    # Vérifier si Jest est installé
    if ! command -v npx &> /dev/null; then
        error "npx n'est pas installé. Veuillez installer Node.js/npm."
        exit 1
    fi
    
    # Vérifier si le projet a package.json
    if [ ! -f "package.json" ]; then
        error "package.json non trouvé. Assurez-vous d'être dans le répertoire du projet."
        exit 1
    fi
    
    success "Prérequis validés"
}

# Fonction pour nettoyer les caches
clean_cache() {
    info "Nettoyage des caches..."
    
    # Nettoyer le cache Jest
    if [ -d ".jest-cache" ]; then
        rm -rf .jest-cache
        info "Cache Jest nettoyé"
    fi
    
    # Nettoyer les rapports de couverture
    if [ -d "coverage" ]; then
        rm -rf coverage
        info "Rapports de couverture nettoyés"
    fi
    
    success "Nettoyage terminé"
}

# Fonction pour exécuter les tests unitaires
run_unit_tests() {
    info "Exécution des tests unitaires..."
    npx jest src/tests/sessions/sessions.test.js --verbose
}

# Fonction pour exécuter les tests d'intégration
run_integration_tests() {
    info "Exécution des tests d'intégration..."
    npx jest src/tests/sessions/sessions-integration.test.js --verbose
}

# Fonction pour exécuter les tests de performance
run_performance_tests() {
    info "Exécution des tests de performance..."
    npx jest src/tests/sessions/sessions-performance.test.js --verbose --testTimeout=60000
}

# Fonction pour exécuter tous les tests
run_all_tests() {
    info "Exécution de tous les tests des sessions RDS..."
    npx jest src/tests/sessions/ --verbose
}

# Fonction pour exécuter les tests avec couverture
run_coverage_tests() {
    info "Exécution des tests avec rapport de couverture..."
    npx jest src/tests/sessions/ --coverage --coverageReporters=html,lcov,text-summary
    info "Rapport de couverture généré dans coverage/"
    if command -v open &> /dev/null; then
        info "Ouverture du rapport de couverture..."
        open coverage/index.html 2>/dev/null || echo "Consultez coverage/index.html pour le rapport détaillé"
    fi
}

# Fonction pour exécuter les tests en mode watch
run_watch_tests() {
    info "Lancement des tests en mode watch..."
    npx jest src/tests/sessions/ --watch
}

# Fonction pour exécuter les tests en mode debug
run_debug_tests() {
    info "Exécution des tests en mode debug..."
    npx jest src/tests/sessions/ --verbose --detectOpenHandles --runInBand
}

# Fonction pour exécuter les tests en mode CI
run_ci_tests() {
    info "Exécution des tests en mode CI..."
    export CI=true
    npx jest src/tests/sessions/ --coverage --ci --watchAll=false --maxWorkers=2
}

# Fonction pour afficher les statistiques des tests
show_stats() {
    info "Statistiques des tests des sessions RDS :"
    
    if [ -d "src/tests/sessions" ]; then
        UNIT_COUNT=$(find src/tests/sessions -name "*.test.js" | wc -l)
        MOCK_COUNT=$(find src/tests/sessions -name "mockData.js" | wc -l)
        
        echo "  - Tests unitaires: sessions.test.js"
        echo "  - Tests intégration: sessions-integration.test.js" 
        echo "  - Tests performance: sessions-performance.test.js"
        echo "  - Données mock: mockData.js"
        echo "  - Configuration: jest.config.js, setup.js, matchers.js"
    else
        warning "Dossier des tests non trouvé"
    fi
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
    COMMAND="all"
else
    COMMAND=$1
fi

# Vérifier les prérequis
check_prerequisites

# Exécuter la commande demandée
case $COMMAND in
    "unit"|"unitaire")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "performance"|"perf")
        run_performance_tests
        ;;
    "all"|"")
        run_all_tests
        ;;
    "coverage"|"couverture")
        run_coverage_tests
        ;;
    "watch")
        run_watch_tests
        ;;
    "debug")
        run_debug_tests
        ;;
    "ci")
        run_ci_tests
        ;;
    "clean"|"nettoyer")
        clean_cache
        ;;
    "stats"|"statistiques")
        show_stats
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        error "Commande inconnue: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac

# Message de fin
success "Exécution terminée"
