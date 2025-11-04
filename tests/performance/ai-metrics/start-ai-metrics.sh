#!/bin/bash

# Script de démarrage rapide pour les tests de métriques IA
# DocuCortex - Système de métriques pour les temps de réponse IA/OCR sous charge

set -e

echo "🚀 Démarrage du Système de Métriques IA"
echo "========================================"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des logs colorés
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        log_error "Node.js version >= 14 requise (actuellement: $(node -v))"
        exit 1
    fi
    
    log_success "Node.js $(node -v) détecté"
    
    # Vérifier Python pour EasyOCR
    if command -v python3 &> /dev/null; then
        log_success "Python3 détecté"
    else
        log_warning "Python3 non trouvé (EasyOCR aura besoin de Python)"
    fi
    
    # Vérifier npm
    if command -v npm &> /dev/null; then
        log_success "npm détecté"
    else
        log_error "npm n'est pas installé"
        exit 1
    fi
}

# Installer les dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    # Installer les dépendances Node.js
    if [ -f "package.json" ]; then
        npm install
        log_success "Dépendances Node.js installées"
    else
        log_warning "package.json non trouvé, création minimale..."
        cat > package.json << EOF
{
  "name": "ai-metrics-test",
  "version": "1.0.0",
  "description": "Tests de performance pour les services IA",
  "main": "ai-metrics-orchestrator.js",
  "scripts": {
    "test": "node ai-metrics-orchestrator.js",
    "start": "node ai-metrics-orchestrator.js --tests all",
    "quick": "node ai-metrics-orchestrator.js --tests ollama,easyocr --parallel",
    "dashboard": "python3 -m http.server 8080"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "ping": "^0.4.4"
  }
}
EOF
        npm install
        log_success "Dépendances de base installées"
    fi
    
    # Installer Python EasyOCR si disponible
    if command -v python3 &> /dev/null; then
        log_info "Vérification d'EasyOCR..."
        python3 -c "import easyocr" 2>/dev/null && log_success "EasyOCR installé" || {
            log_warning "EasyOCR non installé (optionnel)"
        }
    fi
}

# Créer les dossiers nécessaires
setup_directories() {
    log_info "Configuration de l'environnement..."
    
    # Créer les dossiers
    mkdir -p results
    mkdir -p temp
    mkdir -p logs
    
    # Créer le fichier de configuration par défaut
    if [ ! -f "config/test-config.json" ]; then
        mkdir -p config
        cat > config/test-config.json << EOF
{
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3.2:3b",
    "concurrentUsers": 5,
    "enabled": true
  },
  "docucortex": {
    "baseUrl": "http://localhost:3000",
    "concurrentUsers": 8,
    "enabled": true
  },
  "network": {
    "testDuration": 180,
    "enabled": true
  },
  "general": {
    "parallel": false,
    "outputDir": "./results"
  }
}
EOF
        log_success "Configuration par défaut créée"
    fi
    
    # Créer un fichier .env.example
    if [ ! -f ".env.example" ]; then
        cat > .env.example << EOF
# Configuration des services IA
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

DOCUCORTEX_HOST=localhost
DOCUCORTEX_PORT=3000

# Configuration des alertes
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_NOTIFICATIONS=admin@docucortex.com

# Configuration réseau
NETWORK_TIMEOUT=5000
PING_COUNT=100
EOF
        log_success "Fichier .env.example créé"
    fi
}

# Démarrer les services en mode test
start_test_services() {
    log_info "Démarrage des services de test..."
    
    # Vérifier si les services sont déjà actifs
    SERVICES_STATUS=""
    
    # Vérifier Ollama
    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        SERVICES_STATUS="${SERVICES_STATUS}✅ Ollama: Actif\n"
    else
        log_warning "Ollama non détecté sur localhost:11434"
        SERVICES_STATUS="${SERVICES_STATUS}⚠️ Ollama: Inactif\n"
    fi
    
    # Vérifier DocuCortex
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        SERVICES_STATUS="${SERVICES_STATUS}✅ DocuCortex: Actif\n"
    else
        log_warning "DocuCortex non détecté sur localhost:3000"
        SERVICES_STATUS="${SERVICES_STATUS}⚠️ DocuCortex: Inactif\n"
    fi
    
    echo -e "$SERVICES_STATUS"
    echo ""
    
    # Option pour démarrer les services
    if [[ $AUTO_START_SERVICES == "true" ]]; then
        log_info "Démarrage automatique des services..."
        
        # Démarrer Ollama en arrière-plan si disponible
        if command -v ollama &> /dev/null; then
            nohup ollama serve > logs/ollama.log 2>&1 &
            echo $! > logs/ollama.pid
            log_success "Ollama démarré (PID: $(cat logs/ollama.pid))"
            sleep 3
        fi
        
        # Démarrer DocuCortex si disponible
        if [ -f "server.js" ]; then
            nohup node server.js > logs/docucortex.log 2>&1 &
            echo $! > logs/docucortex.pid
            log_success "DocuCortex démarré (PID: $(cat logs/docucortex.pid))"
            sleep 3
        fi
    fi
}

# Afficher le menu principal
show_menu() {
    echo ""
    echo "📊 SYSTÈME DE MÉTRIQUES IA - DOCUCORTEX"
    echo "======================================"
    echo ""
    echo "1) 🚀 Exécution rapide (Ollama + EasyOCR)"
    echo "2) 📋 Tests complets (tous les services)"
    echo "3) 🤖 Test Ollama uniquement"
    echo "4) 👁️ Test EasyOCR uniquement"
    echo "5) 💬 Test DocuCortex IA uniquement"
    echo "6) 📁 Test GED uniquement"
    echo "7) 🌐 Test réseau uniquement"
    echo "8) 🔄 Test de dégradation"
    echo "9) 📊 Démarrer le dashboard"
    echo "10) ⚙️ Configuration"
    echo "11) 📄 Voir les résultats"
    echo "12) 🛑 Arrêter les services"
    echo "0) Quitter"
    echo ""
}

# Fonction pour exécuter les tests
run_test() {
    local test_type=$1
    log_info "Exécution du test: $test_type"
    
    case $test_type in
        "quick")
            node ai-metrics-orchestrator.js --tests ollama,easyocr --parallel
            ;;
        "full")
            node ai-metrics-orchestrator.js --tests all
            ;;
        "ollama")
            node ai-metrics-orchestrator.js --tests ollama
            ;;
        "easyocr")
            node ai-metrics-orchestrator.js --tests easyocr
            ;;
        "docucortex")
            node ai-metrics-orchestrator.js --tests docucortex
            ;;
        "ged")
            node ai-metrics-orchestrator.js --tests ged
            ;;
        "network")
            node ai-metrics-orchestrator.js --tests network
            ;;
        "degradation")
            node ai-metrics-orchestrator.js --tests degradation
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log_success "Test terminé avec succès"
    else
        log_error "Échec du test"
    fi
}

# Démarrer le dashboard
start_dashboard() {
    log_info "Démarrage du dashboard..."
    
    if [ -f "dashboards/metrics-dashboard.html" ]; then
        log_success "Dashboard disponible sur http://localhost:8080"
        log_info "Ouvrez votre navigateur sur: http://localhost:8080/dashboards/metrics-dashboard.html"
        
        # Démarrer un serveur HTTP simple
        cd dashboards
        python3 -m http.server 8080 > ../logs/dashboard.log 2>&1 &
        echo $! > ../logs/dashboard.pid
        cd ..
        
        log_info "Serveur dashboard démarré (PID: $(cat logs/dashboard.pid))"
    else
        log_error "Dashboard non trouvé"
    fi
}

# Afficher les résultats
show_results() {
    log_info "Résultats des tests..."
    
    if [ -d "results" ] && [ "$(ls -A results)" ]; then
        echo "📁 Fichiers de résultats disponibles:"
        ls -la results/
        
        echo ""
        echo "📊 Derniers rapports:"
        ls -t results/*.json 2>/dev/null | head -3 | while read file; do
            echo "  - $(basename "$file") ($(stat -c%s "$file") bytes)"
        done
    else
        log_warning "Aucun résultat trouvé"
    fi
}

# Arrêter les services
stop_services() {
    log_info "Arrêt des services..."
    
    # Arrêter Ollama
    if [ -f "logs/ollama.pid" ]; then
        kill $(cat logs/ollama.pid) 2>/dev/null || true
        rm logs/ollama.pid
        log_success "Ollama arrêté"
    fi
    
    # Arrêter DocuCortex
    if [ -f "logs/docucortex.pid" ]; then
        kill $(cat logs/docucortex.pid) 2>/dev/null || true
        rm logs/docucortex.pid
        log_success "DocuCortex arrêté"
    fi
    
    # Arrêter le dashboard
    if [ -f "logs/dashboard.pid" ]; then
        kill $(cat logs/dashboard.pid) 2>/dev/null || true
        rm logs/dashboard.pid
        log_success "Dashboard arrêté"
    fi
    
    # Nettoyer les processus orphelins
    pkill -f "node.*ai-metrics" 2>/dev/null || true
    log_success "Services arrêtés"
}

# Fonction principale
main() {
    # Charger les variables d'environnement
    if [ -f ".env" ]; then
        export $(cat .env | xargs)
    fi
    
    # Gestion des arguments en ligne de commande
    if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
        echo "🚀 Système de Métriques IA - DocuCortex"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Afficher cette aide"
        echo "  --quick             Exécution rapide"
        echo "  --full              Tests complets"
        echo "  --dashboard         Démarrer le dashboard"
        echo "  --services          Démarrer les services"
        echo "  --stop              Arrêter les services"
        echo "  --config            Configuration"
        echo "  --results           Voir les résultats"
        echo ""
        echo "Variables d'environnement:"
        echo "  AUTO_START_SERVICES=true  Démarrer automatiquement les services"
        echo ""
        exit 0
    fi
    
    # Exécution directe des arguments
    case "$1" in
        "--quick")
            check_prerequisites
            install_dependencies
            setup_directories
            start_test_services
            run_test "quick"
            exit 0
            ;;
        "--full")
            check_prerequisites
            install_dependencies
            setup_directories
            start_test_services
            run_test "full"
            exit 0
            ;;
        "--dashboard")
            start_dashboard
            exit 0
            ;;
        "--services")
            start_test_services
            exit 0
            ;;
        "--stop")
            stop_services
            exit 0
            ;;
        "--config")
            setup_directories
            log_success "Configuration disponible dans config/test-config.json"
            exit 0
            ;;
        "--results")
            show_results
            exit 0
            ;;
    esac
    
    # Mode interactif
    while true; do
        show_menu
        echo -n "Votre choix: "
        read choice
        
        case $choice in
            1)
                run_test "quick"
                ;;
            2)
                run_test "full"
                ;;
            3)
                run_test "ollama"
                ;;
            4)
                run_test "easyocr"
                ;;
            5)
                run_test "docucortex"
                ;;
            6)
                run_test "ged"
                ;;
            7)
                run_test "network"
                ;;
            8)
                run_test "degradation"
                ;;
            9)
                start_dashboard
                ;;
            10)
                setup_directories
                echo ""
                echo "⚙️ Configuration:"
                echo "- Config: config/test-config.json"
                echo "- Alertes: alerts/alert-config.json"
                echo "- Variables: .env.example"
                ;;
            11)
                show_results
                ;;
            12)
                stop_services
                ;;
            0)
                stop_services
                echo "👋 Au revoir!"
                exit 0
                ;;
            *)
                log_error "Choix invalide"
                ;;
        esac
        
        echo ""
        echo "Appuyez sur Entrée pour continuer..."
        read
        clear
    done
}

# Trap pour nettoyer à la sortie
trap 'stop_services' EXIT

# Lancement principal
main "$@"