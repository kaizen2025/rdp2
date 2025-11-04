#!/bin/bash

# Script d'installation automatique pour la suite de tests de charge DocuCortex
# Ce script vérifie les prérequis, installe les dépendances et configure l'environnement

set -e  # Arrêt en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleur
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# En-tête
echo -e "${BLUE}"
echo "============================================================"
echo "🚀 INSTALLATION SUITE DE TESTS DE CHARGE - DOCUCORTEX"
echo "============================================================"
echo -e "${NC}"

# Vérification de Node.js
print_status "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez installer Node.js 14.0.0 ou supérieur."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    print_error "Node.js version $(node -v) détectée. Version minimale requise: 14.0.0"
    exit 1
fi

print_success "Node.js $(node -v) détecté ✅"

# Vérification de npm
print_status "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé. Veuillez installer npm."
    exit 1
fi
print_success "npm $(npm -v) détecté ✅"

# Vérification du répertoire
print_status "Vérification du répertoire de travail..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
print_success "Répertoire de travail: $SCRIPT_DIR"

# Installation des dépendances Node.js
print_status "Installation des dépendances Node.js..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dépendances npm installées ✅"
else
    print_error "Fichier package.json non trouvé!"
    exit 1
fi

# Installation globale d'Artillery (optionnel)
print_status "Vérification d'Artillery..."
if ! command -v artillery &> /dev/null; then
    print_warning "Artillery n'est pas installé globalement."
    read -p "Voulez-vous installer Artillery globalement? (y/N): " install_artillery
    if [[ $install_artillery =~ ^[Yy]$ ]]; then
        npm install -g artillery
        print_success "Artillery installé globalement ✅"
    else
        print_status "Artillery non installé. Utilisation de npx artillery pour les tests."
    fi
else
    print_success "Artillery $(artillery -V) détecté ✅"
fi

# Vérification des outils système
print_status "Vérification des outils système..."

# curl
if ! command -v curl &> /dev/null; then
    print_warning "curl non trouvé. Installation recommandée."
else
    print_success "curl disponible ✅"
fi

# jq (pour le traitement JSON)
if ! command -v jq &> /dev/null; then
    print_warning "jq non trouvé. Installation recommandée pour le traitement JSON."
    read -p "Voulez-vous installer jq? (y/N): " install_jq
    if [[ $install_jq =~ ^[Yy]$ ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
            print_success "jq installé via apt-get ✅"
        elif command -v yum &> /dev/null; then
            sudo yum install -y jq
            print_success "jq installé via yum ✅"
        elif command -v brew &> /dev/null; then
            brew install jq
            print_success "jq installé via Homebrew ✅"
        else
            print_warning "Impossible d'installer jq automatiquement. Installez-le manuellement."
        fi
    fi
else
    print_success "jq disponible ✅"
fi

# Création des répertoires
print_status "Création des répertoires de travail..."
mkdir -p reports
mkdir -p data
mkdir -p logs
print_success "Répertoires créés ✅"

# Génération des données de test
print_status "Génération des données de test..."

# Données utilisateurs pour Artillery
cat > data/users.csv << 'EOF'
username,email,department
admin,admin@docucortex.com,IT
manager,manager@docucortex.com,Management
user1,user1@docucortex.com,HR
user2,user2@docucortex.com,Finance
user3,user3@docucortex.com,Marketing
user4,user4@docucortex.com,Sales
user5,user5@docucortex.com,Operations
analyst,analyst@docucortex.com,Analytics
developer,developer@docucortex.com,IT
designer,designer@docucortex.com,Design
EOF

# Données documents pour Artillery
cat > data/documents.csv << 'EOF'
filename,type,size,tags
Report_2024.pdf,pdf,2048000,financial,q4
Project_Plan.docx,docx,1024000,project,planning
Meeting_Notes.txt,txt,512000,meeting,minutes
Invoice_001.pdf,pdf,512000,billing,invoice
Contract_Draft.doc,doc,1536000,legal,contract
Technical_Spec.pdf,pdf,3072000,technical,specification
User_Manual.docx,docx,2048000,documentation,user
Data_Analysis.xlsx,xlsx,1024000,analytics,data
Budget_2024.xlsx,xlsx,768000,financial,budget
Training_Material.pdf,pdf,1536000,training,education
EOF

print_success "Données de test générées ✅"

# Configuration des variables d'environnement
print_status "Configuration de l'environnement..."

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
# Configuration des tests de charge DocuCortex
# Modifiez ces valeurs selon votre environnement

# URL de base de l'API
API_BASE_URL=http://localhost:3000

# Configuration MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=docucortex_test

# Configuration PostgreSQL
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=
PG_DATABASE=docucortex_test

# Configuration des tests
DEFAULT_LOAD_USERS=50
DEFAULT_TEST_DURATION=2h
DEFAULT_ENDURANCE_DURATION=4h

# Configuration des logs
LOG_LEVEL=info
SAVE_DETAILED_LOGS=true
EOF
    print_success "Fichier .env créé. Modifiez les valeurs selon votre configuration."
else
    print_success "Fichier .env existant trouvé."
fi

# Test de connectivité
print_status "Test de connectivité à l'API..."

API_URL="http://localhost:3000"
if command -v curl &> /dev/null; then
    if curl -s --max-time 5 "$API_URL/api/health" > /dev/null 2>&1; then
        print_success "API accessible à $API_URL ✅"
    else
        print_warning "API non accessible à $API_URL. Les tests fonctionneront en mode simulateur."
        print_warning "Assurez-vous que DocuCortex est en cours d'exécution sur le port 3000."
    fi
else
    print_warning "curl non disponible. Test de connectivité ignoré."
fi

# Test des bases de données
print_status "Test de connectivité aux bases de données..."

# Test MySQL
if command -v mysql &> /dev/null; then
    if mysql -h localhost -u root -e "SELECT 1;" > /dev/null 2>&1; then
        print_success "Connexion MySQL OK ✅"
    else
        print_warning "Connexion MySQL échouée. Tests DB fonctionneront en mode simulateur."
    fi
else
    print_warning "Client MySQL non trouvé."
fi

# Test PostgreSQL
if command -v psql &> /dev/null; then
    if psql -h localhost -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Connexion PostgreSQL OK ✅"
    else
        print_warning "Connexion PostgreSQL échouée. Tests DB fonctionneront en mode simulateur."
    fi
else
    print_warning "Client PostgreSQL non trouvé."
fi

# Création du script de démarrage rapide
cat > quick-start.sh << 'EOF'
#!/bin/bash
# Script de démarrage rapide pour les tests de charge

echo "🚀 Démarrage rapide des tests de charge DocuCortex"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "index.js" ]; then
    echo "❌ Erreur: index.js non trouvé. Exécutez ce script depuis le répertoire load-testing."
    exit 1
fi

# Charger les variables d'environnement
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Menu des tests rapides
echo "Sélectionnez un test à exécuter:"
echo "1) Test utilisateurs concurrents (rapide)"
echo "2) Test base de données concurrente"
echo "3) Test charge WebSocket"
echo "4) Test données volumineuses"
echo "5) Test endurance (2h)"
echo "6) Tous les tests"
echo "7) Menu complet"

read -p "Votre choix (1-7): " choice

case $choice in
    1)
        echo "🎯 Exécution du test utilisateurs concurrents..."
        node index.js --test concurrentUsers --skip-checks
        ;;
    2)
        echo "🎯 Exécution du test base de données..."
        node index.js --test databaseConcurrent --skip-checks
        ;;
    3)
        echo "🎯 Exécution du test WebSocket..."
        node index.js --test websocketLoad --skip-checks
        ;;
    4)
        echo "🎯 Exécution du test données volumineuses..."
        node index.js --test bigDataPerformance --skip-checks
        ;;
    5)
        echo "🎯 Exécution du test endurance (2h)..."
        node index.js --test enduranceTest --duration 2h --skip-checks
        ;;
    6)
        echo "🎯 Exécution de tous les tests..."
        node index.js --all --skip-checks
        ;;
    7)
        echo "🎯 Menu complet..."
        node index.js
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo "✅ Test terminé! Consultez le répertoire reports/ pour les résultats."
EOF

chmod +x quick-start.sh
print_success "Script quick-start.sh créé ✅"

# Script de nettoyage
cat > cleanup.sh << 'EOF'
#!/bin/bash
# Script de nettoyage des données de test

echo "🧹 Nettoyage des données de test..."

# Supprimer les rapports old (plus de 30 jours)
find reports/ -name "*.json" -mtime +30 -delete 2>/dev/null || true
find reports/ -name "*.html" -mtime +30 -delete 2>/dev/null || true

# Nettoyer les logs anciens
find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Supprimer les données de test dans la DB (optionnel)
read -p "Voulez-vous supprimer les données de test de la base de données? (y/N): " cleanup_db
if [[ $cleanup_db =~ ^[Yy]$ ]]; then
    echo "⚠️ Suppression des données de test de la base de données..."
    # Ces requêtes supprimeraient les données de test
    # mysql -e "DELETE FROM documents WHERE name LIKE 'Document_%';"
    # psql -c "DELETE FROM documents WHERE name LIKE 'Document_%';"
    echo "✅ Nettoyage DB terminé (simulé)"
fi

echo "✅ Nettoyage terminé!"
EOF

chmod +x cleanup.sh
print_success "Script cleanup.sh créé ✅"

# Test d'installation
print_status "Test d'installation..."

if node index.js --help > /dev/null 2>&1; then
    print_success "Installation vérifiée avec succès! ✅"
else
    print_error "Erreur lors du test d'installation."
    exit 1
fi

# Résumé final
echo
echo -e "${GREEN}🎉 INSTALLATION TERMINÉE AVEC SUCCÈS! 🎉${NC}"
echo
echo -e "${BLUE}📋 PROCHAINES ÉTAPE:${NC}"
echo "1. Modifiez le fichier .env selon votre configuration"
echo "2. Démarrez DocuCortex sur http://localhost:3000"
echo "3. Exécutez un test: ./quick-start.sh"
echo "4. Ou utilisez: node index.js"
echo
echo -e "${BLUE}📚 COMMANDES UTILES:${NC}"
echo "• ./quick-start.sh              # Menu de tests rapides"
echo "• node index.js --help          # Aide complète"
echo "• node index.js --all           # Tous les tests"
echo "• npm run load-test:concurrent  # Test spécifique"
echo "• ./cleanup.sh                  # Nettoyage"
echo
echo -e "${BLUE}📁 STRUCTURE:${NC}"
echo "• index.js                      # Orchestrateur principal"
echo "• scripts/                      # Scripts de tests individuels"
echo "• reports/                      # Rapports générés"
echo "• data/                         # Données de test"
echo "• artillery-config.yml          # Configuration Artillery"
echo
echo -e "${GREEN}🚀 Prêt pour les tests de charge! 🚀${NC}"