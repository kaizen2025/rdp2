#!/bin/bash
# scripts/test-dashboard.sh
# Script pour exécuter les tests du Dashboard avec différentes configurations

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$PROJECT_DIR/src/tests"
COVERAGE_DIR="$PROJECT_DIR/coverage/dashboard"

# Fonction pour afficher l'aide
show_help() {
    echo -e "${BLUE}Tests Dashboard - RDS Viewer Anecoop${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --unit          Exécuter uniquement les tests unitaires"
    echo "  -i, --integration   Exécuter uniquement les tests d'intégration"
    echo "  -p, --performance   Exécuter uniquement les tests de performance"
    echo "  -a, --all           Exécuter tous les tests (défaut)"
    echo "  -c, --coverage      Générer le rapport de couverture"
    echo "  -w, --watch         Mode watch pour développement"
    echo "  -d, --debug         Mode debug avec output verbeux"
    echo "  -f, --filter PATTERN Filtrer les tests par pattern"
    echo "  -h, --help          Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 --unit                           # Tests unitaires uniquement"
    echo "  $0 --integration --coverage         # Tests d'intégration avec couverture"
    echo "  $0 --performance --debug            # Tests de performance en mode debug"
    echo "  $0 --all --filter 'Heatmap'         # Tous les tests, filtrer par 'Heatmap'"
}

# Fonction pour afficher les résultats
show_results() {
    local exit_code=$1
    local test_type=$2
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Tests $test_type réussis${NC}"
    else
        echo -e "${RED}✗ Tests $test_type échoués${NC}"
    fi
    echo ""
}

# Fonction pour nettoyer les anciens résultats
cleanup() {
    echo -e "${YELLOW}Nettoyage des anciens résultats...${NC}"
    rm -rf "$COVERAGE_DIR"
    rm -f "$PROJECT_DIR/test-results/dashboard-tests.xml"
}

# Fonction pour créer les répertoires nécessaires
setup_directories() {
    mkdir -p "$PROJECT_DIR/coverage/dashboard"
    mkdir -p "$PROJECT_DIR/test-results"
}

# Fonction pour exécuter les tests unitaires
run_unit_tests() {
    echo -e "${BLUE}Exécution des tests unitaires...${NC}"
    
    local cmd="npm test -- --testPathPattern=dashboard.test.js --config=src/tests/jest.config.dashboard.js"
    
    if [ "$WATCH_MODE" = true ]; then
        cmd="$cmd --watch"
    fi
    
    if [ "$DEBUG_MODE" = true ]; then
        cmd="$cmd --verbose --detectOpenHandles"
    fi
    
    if [ -n "$FILTER_PATTERN" ]; then
        cmd="$cmd --testNamePattern='$FILTER_PATTERN'"
    fi
    
    eval $cmd
    local exit_code=$?
    show_results $exit_code "unitaires"
    return $exit_code
}

# Fonction pour exécuter les tests d'intégration
run_integration_tests() {
    echo -e "${BLUE}Exécution des tests d'intégration...${NC}"
    
    local cmd="npm test -- --testPathPattern=dashboard-integration.test.js --config=src/tests/jest.config.dashboard.js"
    
    if [ "$WATCH_MODE" = true ]; then
        cmd="$cmd --watch"
    fi
    
    if [ "$DEBUG_MODE" = true ]; then
        cmd="$cmd --verbose --detectOpenHandles"
    fi
    
    if [ -n "$FILTER_PATTERN" ]; then
        cmd="$cmd --testNamePattern='$FILTER_PATTERN'"
    fi
    
    eval $cmd
    local exit_code=$?
    show_results $exit_code "d'intégration"
    return $exit_code
}

# Fonction pour exécuter les tests de performance
run_performance_tests() {
    echo -e "${BLUE}Exécution des tests de performance...${NC}"
    echo -e "${YELLOW}Note: Ces tests peuvent prendre plusieurs minutes...${NC}"
    
    local cmd="PERFORMANCE_TESTS=true npm test -- --testPathPattern=dashboard-performance.test.js --config=src/tests/jest.config.dashboard.js --runInBand"
    
    if [ "$DEBUG_MODE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    if [ -n "$FILTER_PATTERN" ]; then
        cmd="$cmd --testNamePattern='$FILTER_PATTERN'"
    fi
    
    eval $cmd
    local exit_code=$?
    show_results $exit_code "de performance"
    return $exit_code
}

# Fonction pour générer le rapport de couverture
generate_coverage() {
    echo -e "${BLUE}Génération du rapport de couverture...${NC}"
    
    local cmd="npm test -- --coverage --testPathPattern='dashboard.*\\.test\\.js' --config=src/tests/jest.config.dashboard.js"
    
    eval $cmd
    
    if [ -d "$COVERAGE_DIR" ]; then
        echo -e "${GREEN}Rapport de couverture généré dans: $COVERAGE_DIR${NC}"
        
        # Ouvrir le rapport HTML si possible
        if command -v open > /dev/null 2>&1; then
            echo "Ouverture du rapport dans le navigateur..."
            open "$COVERAGE_DIR/lcov-report/index.html"
        elif command -v xdg-open > /dev/null 2>&1; then
            echo "Ouverture du rapport dans le navigateur..."
            xdg-open "$COVERAGE_DIR/lcov-report/index.html"
        fi
    fi
}

# Fonction pour exécuter tous les tests
run_all_tests() {
    echo -e "${BLUE}Exécution de tous les tests du Dashboard...${NC}"
    
    local total_exit_code=0
    
    # Tests unitaires
    if ! run_unit_tests; then
        total_exit_code=1
    fi
    
    # Tests d'intégration
    if ! run_integration_tests; then
        total_exit_code=1
    fi
    
    # Tests de performance (optionnel en mode --all)
    if [ "$SKIP_PERFORMANCE" != true ]; then
        echo -e "${YELLOW}Voulez-vous exécuter les tests de performance ? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if ! run_performance_tests; then
                total_exit_code=1
            fi
        fi
    fi
    
    return $total_exit_code
}

# Fonction pour afficher les métriques de performance
show_performance_metrics() {
    if [ -d "$PROJECT_DIR/coverage/dashboard" ]; then
        echo -e "${BLUE}Métriques de performance et couverture:${NC}"
        
        # Lire les métriques de Jest si disponibles
        if [ -f "$PROJECT_DIR/test-results/dashboard-tests.xml" ]; then
            echo "Résultats des tests disponibles dans: $PROJECT_DIR/test-results/dashboard-tests.xml"
        fi
        
        # Afficher les informations de couverture
        if [ -f "$PROJECT_DIR/coverage/coverage-final.json" ]; then
            echo "Données de couverture disponibles dans: $PROJECT_DIR/coverage/"
        fi
    fi
}

# Parsing des arguments
UNIT_TESTS=false
INTEGRATION_TESTS=false
PERFORMANCE_TESTS=false
ALL_TESTS=false
COVERAGE=false
WATCH_MODE=false
DEBUG_MODE=false
FILTER_PATTERN=""
SKIP_PERFORMANCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--unit)
            UNIT_TESTS=true
            shift
            ;;
        -i|--integration)
            INTEGRATION_TESTS=true
            shift
            ;;
        -p|--performance)
            PERFORMANCE_TESTS=true
            shift
            ;;
        -a|--all)
            ALL_TESTS=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -d|--debug)
            DEBUG_MODE=true
            shift
            ;;
        -f|--filter)
            FILTER_PATTERN="$2"
            shift 2
            ;;
        --skip-performance)
            SKIP_PERFORMANCE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Déterminer quels tests exécuter
if [ "$UNIT_TESTS" = false ] && [ "$INTEGRATION_TESTS" = false ] && [ "$PERFORMANCE_TESTS" = false ]; then
    ALL_TESTS=true
fi

# Configuration de l'environnement
export NODE_ENV=test
export PERFORMANCE_TESTS=false

# Setup initial
cleanup
setup_directories

echo -e "${BLUE}=== Tests Dashboard - RDS Viewer Anecoop ===${NC}"
echo -e "Répertoire de travail: $PROJECT_DIR"
echo -e "Répertoire de tests: $TEST_DIR"
echo ""

# Exécuter les tests selon les options
total_exit_code=0

if [ "$ALL_TESTS" = true ]; then
    if ! run_all_tests; then
        total_exit_code=1
    fi
else
    if [ "$UNIT_TESTS" = true ]; then
        if ! run_unit_tests; then
            total_exit_code=1
        fi
    fi
    
    if [ "$INTEGRATION_TESTS" = true ]; then
        if ! run_integration_tests; then
            total_exit_code=1
        fi
    fi
    
    if [ "$PERFORMANCE_TESTS" = true ]; then
        if ! run_performance_tests; then
            total_exit_code=1
        fi
    fi
fi

# Générer la couverture si demandée
if [ "$COVERAGE" = true ]; then
    generate_coverage
fi

# Afficher les métriques finales
show_performance_metrics

# Résumé final
echo ""
echo -e "${BLUE}=== Résumé ===${NC}"
if [ $total_exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests réussis !${NC}"
else
    echo -e "${RED}✗ Certains tests ont échoué${NC}"
fi

echo ""
echo -e "${YELLOW}Conseils pour l'amélioration:${NC}"
echo "- Utilisez --watch pour le développement"
echo "- Utilisez --debug pour diagnostiquer les problèmes"
echo "- Consultez les rapports dans coverage/dashboard/"
echo "- Vérifiez les logs dans test-results/"

exit $total_exit_code