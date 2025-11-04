#!/bin/bash

# Script de démarrage pour les tests de performance UI
# Ce script lance tous les tests de réactivité de l'interface utilisateur

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages avec couleurs
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVERTISSEMENT]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Fonction pour afficher l'en-tête
show_header() {
    echo -e "${BLUE}"
    echo "================================================================"
    echo "          🚀 TESTS DE PERFORMANCE UI - RÉACTIVITÉ"
    echo "================================================================"
    echo -e "${NC}"
    echo "Ce script lance la suite complète de tests de performance pour"
    echo "évaluer la réactivité de l'interface utilisateur sous charge."
    echo ""
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    print_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 14 ]; then
        print_error "Node.js version 14+ requise. Version actuelle: $(node --version)"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    
    print_success "Prérequis validés"
}

# Fonction pour installer les dépendances
install_dependencies() {
    print_info "Vérification des dépendances..."
    
    local package_file="package.json"
    if [ ! -f "$package_file" ]; then
        print_error "Fichier package.json non trouvé"
        exit 1
    fi
    
    # Vérifier si jest est installé
    if ! npm list jest &> /dev/null; then
        print_info "Installation de jest et dépendances..."
        npm install --save-dev jest @testing-library/react @testing-library/jest-dom
        npm install --save-dev @mui/material @mui/icons-material @react-spring/web
        npm install jest-html-reporters puppeteer
    else
        print_success "Dépendances déjà installées"
    fi
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    print_info "Création des répertoires..."
    
    mkdir -p tests/performance/ui-reactivity/results
    mkdir -p tests/performance/ui-reactivity/logs
    
    print_success "Répertoires créés"
}

# Fonction pour valider la configuration
validate_config() {
    print_info "Validation de la configuration..."
    
    local config_file="tests/performance/ui-reactivity/config/jest-ui.config.js"
    if [ ! -f "$config_file" ]; then
        print_error "Configuration Jest non trouvée: $config_file"
        exit 1
    fi
    
    print_success "Configuration validée"
}

# Fonction pour nettoyer les résultats précédents
cleanup_previous_results() {
    print_info "Nettoyage des résultats précédents..."
    
    local results_dir="tests/performance/ui-reactivity/results"
    if [ -d "$results_dir" ]; then
        # Garder seulement les 5 rapports les plus récents
        cd "$results_dir"
        ls -t *.html *.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
        cd - > /dev/null
    fi
    
    print_success "Nettoyage terminé"
}

# Fonction pour lancer les tests unitaires
run_unit_tests() {
    print_info "🚀 Lancement des tests unitaires de performance..."
    
    # Configuration Jest
    export JEST_CONFIG_PATH="tests/performance/ui-reactivity/config/jest-ui.config.js"
    
    # Lancer les tests avec rapport
    npx jest --config="$JEST_CONFIG_PATH" \
             --runInBand \
             --verbose \
             --coverage \
             --detectOpenHandles \
             --forceExit \
             tests/performance/ui-reactivity/
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Tests unitaires terminés avec succès"
    else
        print_error "Échec des tests unitaires (code: $exit_code)"
        return $exit_code
    fi
}

# Fonction pour lancer la simulation d'utilisateurs concurrents
run_concurrent_simulation() {
    print_info "👥 Lancement de la simulation d'utilisateurs concurrents..."
    
    # Vérifier si un serveur de développement est en cours
    local base_url="${UI_PERFORMANCE_BASE_URL:-http://localhost:3000}"
    
    # Test de connectivité
    if curl -f -s -o /dev/null "$base_url" 2>/dev/null; then
        print_success "Serveur détecté sur $base_url"
    else
        print_warning "Serveur non détecté sur $base_url"
        print_info "Lancement du serveur de développement..."
        
        # Chercher un script de démarrage React
        if [ -f "package.json" ]; then
            if npm run dev 2>/dev/null &
            then
                local dev_pid=$!
                print_info "Serveur de développement lancé (PID: $dev_pid)"
                print_info "Attente du démarrage..."
                sleep 10
            fi
        fi
        
        # Vérifier à nouveau
        if ! curl -f -s -o /dev/null "$base_url" 2>/dev/null; then
            print_warning "Impossible de lancer le serveur automatiquement"
            print_info "Veuillez lancer manuellement: npm start"
            print_info "Puis relancez ce script"
            return 1
        fi
    fi
    
    # Lancer la simulation
    cd tests/performance/ui-reactivity
    node concurrent-users-simulator.js
    local exit_code=$?
    cd - > /dev/null
    
    if [ $exit_code -eq 0 ]; then
        print_success "Simulation d'utilisateurs concurrents terminée"
    else
        print_error "Échec de la simulation (code: $exit_code)"
        return $exit_code
    fi
}

# Fonction pour afficher les résultats
show_results() {
    print_info "📊 Affichage des résultats..."
    
    local results_dir="tests/performance/ui-reactivity/results"
    
    if [ -d "$results_dir" ]; then
        local report_count=$(ls -1 "$results_dir"/*.html 2>/dev/null | wc -l)
        
        if [ $report_count -gt 0 ]; then
            print_success "$report_count rapport(s) généré(s):"
            echo ""
            ls -la "$results_dir"/*.html 2>/dev/null | awk '{print "  📄 " $9 " (" $5 " bytes)"}'
            echo ""
            
            # Ouvrir le dernier rapport HTML si possible
            local latest_report=$(ls -t "$results_dir"/*.html 2>/dev/null | head -n1)
            if [ -n "$latest_report" ]; then
                if command -v xdg-open &> /dev/null; then
                    xdg-open "$latest_report" 2>/dev/null &
                    print_info "Ouverture du rapport: $latest_report"
                elif command -v open &> /dev/null; then
                    open "$latest_report" 2>/dev/null &
                    print_info "Ouverture du rapport: $latest_report"
                fi
            fi
        else
            print_warning "Aucun rapport HTML trouvé"
        fi
    else
        print_warning "Répertoire de résultats non trouvé"
    fi
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help         Afficher cette aide"
    echo "  -u, --unit         Lancer seulement les tests unitaires"
    echo "  -s, --simulation   Lancer seulement la simulation d'utilisateurs"
    echo "  -c, --clean        Nettoyer seulement les résultats précédents"
    echo "  --install          Installer seulement les dépendances"
    echo "  --validate         Valider seulement la configuration"
    echo ""
    echo "Variables d'environnement:"
    echo "  UI_PERFORMANCE_BASE_URL    URL du serveur de test (défaut: http://localhost:3000)"
    echo "  UI_PERFORMANCE_USERS       Nombre d'utilisateurs simulés (défaut: 50)"
    echo "  UI_PERFORMANCE_DURATION    Durée des tests en ms (défaut: 60000)"
    echo ""
}

# Fonction principale
main() {
    local run_unit=true
    local run_simulation=true
    local only_clean=false
    local only_install=false
    local only_validate=false
    
    # Parser les arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -u|--unit)
                run_simulation=false
                shift
                ;;
            -s|--simulation)
                run_unit=false
                shift
                ;;
            -c|--clean)
                only_clean=true
                shift
                ;;
            --install)
                only_install=true
                shift
                ;;
            --validate)
                only_validate=true
                shift
                ;;
            *)
                print_error "Option inconnue: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Afficher l'en-tête
    if [ "$only_clean" = false ] && [ "$only_install" = false ] && [ "$only_validate" = false ]; then
        show_header
    fi
    
    # Exécuter les étapes selon les options
    if [ "$only_install" = true ]; then
        check_prerequisites
        install_dependencies
        print_success "Installation terminée"
        exit 0
    fi
    
    if [ "$only_validate" = true ]; then
        check_prerequisites
        validate_config
        print_success "Validation terminée"
        exit 0
    fi
    
    if [ "$only_clean" = true ]; then
        cleanup_previous_results
        print_success "Nettoyage terminé"
        exit 0
    fi
    
    # Suite normale
    check_prerequisites
    create_directories
    install_dependencies
    validate_config
    cleanup_previous_results
    
    local failed=false
    
    if [ "$run_unit" = true ]; then
        if ! run_unit_tests; then
            failed=true
        fi
        echo ""
    fi
    
    if [ "$run_simulation" = true ]; then
        if ! run_concurrent_simulation; then
            failed=true
        fi
        echo ""
    fi
    
    if [ "$failed" = false ]; then
        print_success "🎉 Tous les tests ont été exécutés avec succès!"
        show_results
    else
        print_error "❌ Certains tests ont échoué. Vérifiez les logs ci-dessus."
        exit 1
    fi
}

# Gestion des signaux pour arrêt propre
cleanup() {
    print_info "Arrêt propre en cours..."
    # Ajouter ici le code de nettoyage si nécessaire
    exit 0
}

trap cleanup SIGINT SIGTERM

# Lancement du script principal
main "$@"