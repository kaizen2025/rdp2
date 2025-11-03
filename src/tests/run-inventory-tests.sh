#!/bin/bash

# src/tests/run-inventory-tests.sh - SCRIPT D'EXÉCUTION DES TESTS D'INVENTAIRE

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
JEST_CMD="npx jest"
REPORTER_JUNIT="--reporters=default --reporters=jest-junit"
REPORTER_HTML="--reporters=default --reporters=jest-html-reporters"
COVERAGE="--coverage --coverageReporters=html --coverageReporters=text-summary --coverageReporters=json"

# Fonction pour afficher les en-têtes
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Fonction pour afficher l'aide
show_help() {
    echo -e "${CYAN}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo -e "${YELLOW}OPTIONS:${NC}"
    echo -e "  ${BLUE}--unit${NC}           Exécuter uniquement les tests unitaires"
    echo -e "  ${BLUE}--integration${NC}   Exécuter uniquement les tests d'intégration"
    echo -e "  ${BLUE}--performance${NC}   Exécuter uniquement les tests de performance"
    echo -e "  ${BLUE}--all${NC}           Exécuter tous les tests (par défaut)"
    echo -e "  ${BLUE}--watch${NC}         Mode watch pour développement"
    echo -e "  ${BLUE}--coverage${NC}      Générer un rapport de couverture"
    echo -e "  ${BLUE}--verbose${NC}       Mode verbeux"
    echo -e "  ${BLUE}--debug${NC}         Activer le debug des tests"
    echo -e "  ${BLUE}--help${NC}          Afficher cette aide"
    echo ""
    echo -e "${YELLOW}EXEMPLES:${NC}"
    echo -e "  ${CYAN}$0${NC}                           # Tous les tests"
    echo -e "  ${CYAN}$0 --unit${NC}                    # Tests unitaires uniquement"
    echo -e "  ${CYAN}$0 --integration --coverage${NC}  # Tests d'intégration avec couverture"
    echo -e "  ${CYAN}$0 --watch${NC}                   # Mode watch"
    echo ""
}

# Fonction pour nettoyer les résultats précédents
cleanup_results() {
    echo -e "${YELLOW}🧹 Nettoyage des résultats précédents...${NC}"
    rm -rf test-results/
    rm -rf coverage/inventory/
    mkdir -p test-results/
}

# Fonction pour configurer l'environnement
setup_environment() {
    echo -e "${YELLOW}🔧 Configuration de l'environnement de test...${NC}"
    
    # Variables d'environnement pour les tests
    export NODE_ENV=test
    export PERFORMANCE_TESTS=true
    export DEBUG_TESTS=${DEBUG_TESTS:-false}
    export CI=${CI:-false}
    
    # Vérifier que les dépendances sont installées
    if [ ! -d "node_modules" ]; then
        echo -e "${RED}❌ node_modules non trouvé. Exécutez 'npm install' d'abord.${NC}"
        exit 1
    fi
    
    # Vérifier Jest
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx non disponible. Node.js doit être installé.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environnement configuré${NC}"
}

# Fonction pour exécuter les tests unitaires
run_unit_tests() {
    print_header "TESTS UNITAIRES"
    
    local cmd="$JEST_CMD --testPathPattern=inventory.test.js --config=src/tests/jest.config.inventory.js"
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    if [ "$COVERAGE_MODE" = true ]; then
        cmd="$cmd $COVERAGE"
    fi
    
    echo -e "${BLUE}Exécution: $cmd${NC}"
    
    $cmd
    local result=$?
    
    print_result $result "Tests unitaires"
    return $result
}

# Fonction pour exécuter les tests d'intégration
run_integration_tests() {
    print_header "TESTS D'INTÉGRATION"
    
    local cmd="$JEST_CMD --testPathPattern=inventory-integration.test.js --config=src/tests/jest.config.inventory.js --testTimeout=60000"
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    if [ "$COVERAGE_MODE" = true ]; then
        cmd="$cmd $COVERAGE"
    fi
    
    echo -e "${BLUE}Exécution: $cmd${NC}"
    
    $cmd
    local result=$?
    
    print_result $result "Tests d'intégration"
    return $result
}

# Fonction pour exécuter les tests de performance
run_performance_tests() {
    print_header "TESTS DE PERFORMANCE"
    
    local cmd="$JEST_CMD --testPathPattern=inventory-performance.test.js --config=src/tests/jest.config.inventory.js --testTimeout=120000"
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    echo -e "${BLUE}Exécution: $cmd${NC}"
    
    $cmd
    local result=$?
    
    print_result $result "Tests de performance"
    return $result
}

# Fonction pour exécuter tous les tests
run_all_tests() {
    print_header "TOUS LES TESTS D'INVENTAIRE"
    
    local cmd="$JEST_CMD --testPathPattern='inventory' --config=src/tests/jest.config.inventory.js"
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    if [ "$COVERAGE_MODE" = true ]; then
        cmd="$cmd $COVERAGE"
    fi
    
    echo -e "${BLUE}Exécution: $cmd${NC}"
    
    $cmd
    local result=$?
    
    print_result $result "Tous les tests"
    return $result
}

# Fonction pour exécuter en mode watch
run_watch_mode() {
    print_header "MODE WATCH"
    
    local cmd="$JEST_CMD --testPathPattern='inventory' --config=src/tests/jest.config.inventory.js --watch"
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    echo -e "${BLUE}Exécution: $cmd${NC}"
    echo -e "${YELLOW}💡 Utilisez Ctrl+C pour quitter${NC}"
    
    $cmd
}

# Fonction pour générer un rapport détaillé
generate_report() {
    print_header "GÉNÉRATION DU RAPPORT"
    
    echo -e "${YELLOW}📊 Compilation des résultats...${NC}"
    
    # Vérifier les rapports générés
    if [ -f "test-results/inventory-report.html" ]; then
        echo -e "${GREEN}✅ Rapport HTML généré: test-results/inventory-report.html${NC}"
    fi
    
    if [ -f "test-results/inventory-junit.xml" ]; then
        echo -e "${GREEN}✅ Rapport JUnit généré: test-results/inventory-junit.xml${NC}"
    fi
    
    if [ -d "coverage/lcov-report" ]; then
        echo -e "${GREEN}✅ Rapport de couverture généré: coverage/lcov-report/index.html${NC}"
    fi
    
    echo -e "${CYAN}📈 Résumé des résultats:${NC}"
    if [ -f "test-results/junit.xml" ]; then
        local total_tests=$(grep -o 'tests="[0-9]*"' test-results/junit.xml | grep -o '[0-9]*' | head -1)
        local failures=$(grep -o 'failures="[0-9]*"' test-results/junit.xml | grep -o '[0-9]*' | head -1)
        local errors=$(grep -o 'errors="[0-9]*"' test-results/junit.xml | grep -o '[0-9]*' | head -1)
        
        echo -e "   Tests exécutés: $total_tests"
        echo -e "   Échecs: $failures"
        echo -e "   Erreurs: $errors"
        
        if [ "$failures" = "0" ] && [ "$errors" = "0" ]; then
            echo -e "${GREEN}🎉 Tous les tests ont réussi!${NC}"
        else
            echo -e "${RED}⚠️  Certains tests ont échoué${NC}"
        fi
    fi
}

# Fonction principale
main() {
    # Configuration par défaut
    RUN_ALL=true
    VERBOSE=false
    COVERAGE_MODE=false
    WATCH_MODE=false
    DEBUG_MODE=false
    
    # Parser les arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit)
                RUN_ALL=false
                UNIT_TESTS=true
                shift
                ;;
            --integration)
                RUN_ALL=false
                INTEGRATION_TESTS=true
                shift
                ;;
            --performance)
                RUN_ALL=false
                PERFORMANCE_TESTS=true
                shift
                ;;
            --all)
                RUN_ALL=true
                UNIT_TESTS=true
                INTEGRATION_TESTS=true
                PERFORMANCE_TESTS=true
                shift
                ;;
            --watch)
                WATCH_MODE=true
                shift
                ;;
            --coverage)
                COVERAGE_MODE=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --debug)
                DEBUG_MODE=true
                export DEBUG_TESTS=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Option inconnue: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Configuration de l'environnement
    setup_environment
    
    # Nettoyage préalable
    cleanup_results
    
    # Activer le mode debug si demandé
    if [ "$DEBUG_MODE" = true ]; then
        echo -e "${YELLOW}🐛 Mode debug activé${NC}"
        export DEBUG_TESTS=true
    fi
    
    local exit_code=0
    
    # Exécution selon le mode
    if [ "$WATCH_MODE" = true ]; then
        run_watch_mode
    elif [ "$RUN_ALL" = true ]; then
        run_all_tests
        exit_code=$?
    else
        # Exécution sélective
        if [ "$UNIT_TESTS" = true ]; then
            run_unit_tests
            exit_code=$?
        fi
        
        if [ "$INTEGRATION_TESTS" = true ]; then
            run_integration_tests
            if [ $? -ne 0 ]; then
                exit_code=1
            fi
        fi
        
        if [ "$PERFORMANCE_TESTS" = true ]; then
            run_performance_tests
            if [ $? -ne 0 ]; then
                exit_code=1
            fi
        fi
    fi
    
    # Génération du rapport si demandé
    if [ "$COVERAGE_MODE" = true ]; then
        generate_report
    fi
    
    # Message final
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 Suite de tests terminée avec succès!${NC}"
    else
        echo -e "${RED}❌ Suite de tests terminée avec des erreurs${NC}"
    fi
    
    exit $exit_code
}

# Vérification des arguments et exécution
if [ $# -eq 0 ]; then
    # Aucun argument, afficher l'aide
    show_help
    exit 0
else
    main "$@"
fi
