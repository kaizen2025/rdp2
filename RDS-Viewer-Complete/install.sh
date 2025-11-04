#!/bin/bash

# =============================================================================
# Script d'installation automatique DocuCortex IA - Ollama Integration
# =============================================================================

set -e  # Arrêt en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions d'affichage
print_header() {
    echo -e "\n${MAGENTA}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${MAGENTA}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}🔄 $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    print_step "Vérification des prérequis"
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        echo "Veuillez installer Node.js 18+ depuis https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION détectée (minimum requis: 18)"
        exit 1
    fi
    
    print_success "Node.js $NODE_VERSION détecté"
    
    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION disponible"
    
    # Git
    if ! command -v git &> /dev/null; then
        print_warning "Git n'est pas installé (optionnel pour ce projet)"
    else
        print_success "Git disponible"
    fi
}

# Installation d'Ollama
install_ollama() {
    print_step "Installation d'Ollama"
    
    if command -v ollama &> /dev/null; then
        print_success "Ollama déjà installé: $(ollama --version)"
        return 0
    fi
    
    print_info "Installation d'Ollama en cours..."
    
    # Détecter l'OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt &> /dev/null; then
            print_info "Détecté: Ubuntu/Debian"
            curl -fsSL https://ollama.ai/install.sh | sh
        elif command -v yum &> /dev/null; then
            print_info "Détecté: RHEL/CentOS"
            curl -fsSL https://ollama.ai/install.sh | sh
        else
            print_info "Linux générique détecté"
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            print_info "Installation via Homebrew..."
            brew install ollama
        else
            print_info "Homebrew non trouvé. Veuillez installer Ollama manuellement depuis https://ollama.ai"
            open https://ollama.ai
            read -p "Appuyez sur Entrée après avoir installé Ollama..."
        fi
    else
        print_error "OS non supporté pour l'installation automatique: $OSTYPE"
        print_info "Veuillez installer Ollama manuellement depuis https://ollama.ai"
        exit 1
    fi
    
    # Vérifier l'installation
    if command -v ollama &> /dev/null; then
        print_success "Ollama installé avec succès"
    else
        print_error "Échec de l'installation d'Ollama"
        exit 1
    fi
}

# Configuration du projet
setup_project() {
    print_step "Configuration du projet"
    
    # Vérifier que nous sommes dans le bon dossier
    if [ ! -f "package.json" ]; then
        print_error "package.json non trouvé"
        print_info "Assurez-vous d'être dans le dossier du projet rdp2"
        exit 1
    fi
    
    # Installer les dépendances Node.js
    print_info "Installation des dépendances Node.js..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Dépendances installées"
    else
        print_error "Échec de l'installation des dépendances"
        exit 1
    fi
    
    # Créer le fichier .env
    if [ ! -f ".env" ]; then
        print_info "Création du fichier .env..."
        cp .env.example .env
        print_success "Fichier .env créé"
    else
        print_info "Fichier .env existant préservé"
    fi
    
    # Créer les dossiers nécessaires
    mkdir -p uploads data logs
    print_success "Dossiers de travail créés"
}

# Installation des modèles Ollama
install_models() {
    print_step "Installation des modèles Ollama"
    
    # Vérifier qu'Ollama fonctionne
    if ! ollama list &> /dev/null; then
        print_error "Ollama n'est pas accessible"
        print_info "Assurez-vous qu'Ollama est démarré: ollama serve"
        exit 1
    fi
    
    # Démarrer Ollama en arrière-plan si nécessaire
    if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_info "Démarrage d'Ollama en arrière-plan..."
        ollama serve &
        OLLAMA_PID=$!
        
        # Attendre qu'Ollama soit prêt
        print_info "Attente du démarrage d'Ollama..."
        for i in {1..30}; do
            if curl -s http://localhost:11434/api/tags &> /dev/null; then
                print_success "Ollama démarré"
                break
            fi
            sleep 1
        done
        
        if [ $i -eq 30 ]; then
            print_error "Timeout: Ollama n'a pas démarré"
            exit 1
        fi
    fi
    
    # Installer les modèles recommandés
    MODELS=("llama2" "mistral" "llava")
    
    for model in "${MODELS[@]}"; do
        print_info "Installation du modèle $model..."
        
        if ollama list | grep -q "$model"; then
            print_success "Modèle $model déjà installé"
        else
            ollama pull "$model"
            if [ $? -eq 0 ]; then
                print_success "Modèle $model installé"
            else
                print_warning "Échec de l'installation du modèle $model"
            fi
        fi
    done
    
    # Afficher la liste des modèles
    print_info "Modèles installés:"
    ollama list
}

# Configuration des permissions
setup_permissions() {
    print_step "Configuration des permissions"
    
    # Rendre les scripts exécutables
    chmod +x scripts/*.js 2>/dev/null || true
    print_success "Permissions configurées"
}

# Test de l'installation
test_installation() {
    print_step "Test de l'installation"
    
    # Test Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js opérationnel"
    fi
    
    # Test npm
    if command -v npm &> /dev/null; then
        print_success "npm opérationnel"
    fi
    
    # Test Ollama
    if command -v ollama &> /dev/null; then
        print_success "Ollama installé"
        
        # Test connectivité Ollama
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            print_success "Connexion Ollama réussie"
        else
            print_warning "Ollama installé mais non accessible (normal si pas démarré)"
        fi
    fi
    
    # Test projet
    if [ -f ".env" ] && [ -d "node_modules" ]; then
        print_success "Configuration projet terminée"
    fi
}

# Affichage des instructions finales
show_final_instructions() {
    print_header "INSTALLATION TERMINÉE"
    
    echo -e "${GREEN}🎉 DocuCortex IA avec Ollama a été installé avec succès !${NC}\n"
    
    echo -e "${CYAN}📋 PROCHAINES ÉTAPES:${NC}"
    echo -e "1. ${YELLOW}Démarrer Ollama (si pas déjà fait):${NC}"
    echo -e "   ${BLUE}ollama serve${NC}"
    echo ""
    echo -e "2. ${YELLOW}Démarrer l'application:${NC}"
    echo -e "   ${BLUE}npm run electron:dev${NC}"
    echo ""
    echo -e "3. ${YELLOW}Tester la connectivité:${NC}"
    echo -e "   ${BLUE}npm run ollama:test${NC}"
    echo ""
    
    echo -e "${CYAN}🚀 COMMANDES UTILES:${NC}"
    echo -e "• ${BLUE}npm run electron:dev${NC}     - Démarrage complet (dev)"
    echo -e "• ${BLUE}npm run server:dev${NC}       - Serveur seulement"
    echo -e "• ${BLUE}npm start${NC}                - Frontend seulement"
    echo -e "• ${BLUE}npm run ollama:test${NC}      - Test de connectivité"
    echo -e "• ${BLUE}ollama serve${NC}             - Démarrer Ollama"
    echo -e "• ${BLUE}ollama list${NC}              - Voir les modèles"
    echo ""
    
    echo -e "${CYAN}📖 DOCUMENTATION:${NC}"
    echo -e "• ${BLUE}docs/quick-start.md${NC}      - Guide de démarrage rapide"
    echo -e "• ${BLUE}docs/installation.md${NC}     - Installation détaillée"
    echo -e "• ${BLUE}docs/utilisation.md${NC}      - Guide d'utilisation"
    echo -e "• ${BLUE}README.md${NC}                - Vue d'ensemble"
    echo ""
    
    echo -e "${YELLOW}⚡ DANS LE NAVIGATEUR:${NC}"
    echo -e "1. Ouvrir l'application DocuCortex"
    echo -e "2. Cliquer sur l'onglet 'DocuCortex IA'"
    echo -e "3. Vérifier le statut dans 'Statut & Tests'"
    echo -e "4. Essayer la génération dans 'Génération de Texte'"
    echo ""
    
    echo -e "${GREEN}✨ Profitez de DocuCortex IA avec l'intelligence artificielle !${NC}\n"
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    print_error "Installation interrompue"
    print_info "Nettoyage en cours..."
    
    # Arrêter Ollama si on l'avons démarré
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
    fi
    
    exit 1
}

# Gestion des signaux
trap cleanup INT TERM

# Main
main() {
    print_header "INSTALLATION DOCUCORTEX IA - OLLAMA"
    
    echo -e "${CYAN}Ce script va installer et configurer DocuCortex IA avec Ollama.${NC}"
    echo -e "${CYAN}Durée estimée: 5-15 minutes selon votre connexion.${NC}\n"
    
    # Demander confirmation
    read -p "Continuer l'installation ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation annulée"
        exit 0
    fi
    
    # Exécution des étapes
    check_prerequisites
    install_ollama
    setup_project
    install_models
    setup_permissions
    test_installation
    show_final_instructions
}

# Vérifier si le script est exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi