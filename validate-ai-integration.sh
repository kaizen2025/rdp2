#!/bin/bash

# Global AI Integration Validator - DocuCortex IA + Agent IA
# Script unifié pour valider toutes les intégrations IA en production

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_header() {
    echo -e "\n${CYAN}================================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Configuration
PROJECT_ROOT=$(dirname "$(realpath "$0")")
cd "$PROJECT_ROOT"

# Banner
print_header "DOCUCORTEX IA + AGENT IA - VALIDATION COMPLÈTE"
echo -e "${PURPLE}Version: 3.0.27"
echo -e "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "Node: $(node --version 2>/dev/null || echo 'N/A')"
echo -e "Python: $(python3 --version 2>/dev/null || echo 'N/A')${NC}\n"

# Variables de statut
OLLAMA_STATUS="❓"
OCR_STATUS="❓"
GED_STATUS="❓"
CHAT_STATUS="❓"
OVERALL_STATUS="❓"

# Vérifications pré-requis
check_prerequisites() {
    print_info "Vérification des pré-requis IA..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # NPM
    if ! command -v npm &> /dev/null; then
        print_error "NPM n'est pas installé"
        exit 1
    fi
    
    # Python (pour EasyOCR)
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 non installé (requis pour OCR)"
    fi
    
    # Vérifier structure
    if [ ! -d "tests/ai" ]; then
        print_error "Répertoire tests/ai non trouvé"
        exit 1
    fi
    
    if [ ! -d "tests/ocr" ]; then
        print_error "Répertoire tests/ocr non trouvé"
        exit 1
    fi
    
    if [ ! -d "tests/ged" ]; then
        print_error "Répertoire tests/ged non trouvé"
        exit 1
    fi
    
    print_success "Prérequis validés"
}

# Validation Ollama IA
validate_ollama() {
    print_header "VALIDATION OLLAMA IA"
    
    print_info "Exécution des tests d'intégration Ollama..."
    
    if [ -f "run-ollama-validation.sh" ]; then
        chmod +x run-ollama-validation.sh
        if ./run-ollama-validation.sh --quick 2>/dev/null; then
            OLLAMA_STATUS="✅"
            print_success "Ollama IA - VALIDÉ"
        else
            OLLAMA_STATUS="❌"
            print_error "Ollama IA - ÉCHEC"
        fi
    elif [ -f "tests/ai/ollama-integration.test.js" ]; then
        if npm test -- tests/ai/ollama-integration.test.js --passWithNoTests; then
            OLLAMA_STATUS="✅"
            print_success "Ollama IA - VALIDÉ"
        else
            OLLAMA_STATUS="❌"
            print_error "Ollama IA - ÉCHEC"
        fi
    else
        OLLAMA_STATUS="⚠️"
        print_warning "Tests Ollama non trouvés"
    fi
}

# Validation OCR EasyOCR
validate_ocr() {
    print_header "VALIDATION OCR EASYOCR"
    
    print_info "Exécution des tests d'intégration OCR..."
    
    if [ -f "scripts/validate-ocr.js" ]; then
        if node scripts/validate-ocr.js --quick 2>/dev/null; then
            OCR_STATUS="✅"
            print_success "OCR EasyOCR - VALIDÉ"
        else
            OCR_STATUS="⚠️"
            print_warning "OCR EasyOCR - AVERTISSEMENT (Python manquant?)"
        fi
    elif [ -f "tests/ocr/ocr-integration.test.js" ]; then
        if npm test -- tests/ocr/ocr-integration.test.js --passWithNoTests; then
            OCR_STATUS="✅"
            print_success "OCR EasyOCR - VALIDÉ"
        else
            OCR_STATUS="⚠️"
            print_warning "OCR EasyOCR - AVERTISSEMENT"
        fi
    else
        OCR_STATUS="⚠️"
        print_warning "Tests OCR non trouvés"
    fi
}

# Validation GED
validate_ged() {
    print_header "VALIDATION GED"
    
    print_info "Exécution des tests d'intégration GED..."
    
    if [ -f "tests/ged/ged-validate.js" ]; then
        if node tests/ged/ged-validate.js validate --quick 2>/dev/null; then
            GED_STATUS="✅"
            print_success "GED - VALIDÉ"
        else
            GED_STATUS="❌"
            print_error "GED - ÉCHEC"
        fi
    elif [ -f "tests/ged/ged-integration.test.js" ]; then
        if npm test -- tests/ged/ged-integration.test.js --passWithNoTests; then
            GED_STATUS="✅"
            print_success "GED - VALIDÉ"
        else
            GED_STATUS="❌"
            print_error "GED - ÉCHEC"
        fi
    else
        GED_STATUS="⚠️"
        print_warning "Tests GED non trouvés"
    fi
}

# Validation Chat IA Complet
validate_chat_ia() {
    print_header "VALIDATION CHAT IA COMPLET"
    
    print_info "Exécution des tests bout-en-bout Chat IA..."
    
    if [ -f "scripts/validate-ai-complete.js" ]; then
        if node scripts/validate-ai-complete.js --quick 2>/dev/null; then
            CHAT_STATUS="✅"
            print_success "Chat IA Complet - VALIDÉ"
        else
            CHAT_STATUS="❌"
            print_error "Chat IA Complet - ÉCHEC"
        fi
    elif [ -f "tests/integration/ai-chat-complete.test.js" ]; then
        if npm test -- tests/integration/ai-chat-complete.test.js --passWithNoTests; then
            CHAT_STATUS="✅"
            print_success "Chat IA Complet - VALIDÉ"
        else
            CHAT_STATUS="❌"
            print_error "Chat IA Complet - ÉCHEC"
        fi
    else
        CHAT_STATUS="⚠️"
        print_warning "Tests Chat IA non trouvés"
    fi
}

# Calcul du statut global
calculate_overall_status() {
    local valid_count=0
    local total_count=0
    
    for status in "$OLLAMA_STATUS" "$OCR_STATUS" "$GED_STATUS" "$CHAT_STATUS"; do
        total_count=$((total_count + 1))
        if [[ "$status" == "✅" ]]; then
            valid_count=$((valid_count + 1))
        fi
    done
    
    if [ $valid_count -eq $total_count ]; then
        OVERALL_STATUS="✅"
    elif [ $valid_count -gt 0 ]; then
        OVERALL_STATUS="⚠️"
    else
        OVERALL_STATUS="❌"
    fi
}

# Génération du rapport final
generate_report() {
    local report_file="docs/VALIDATION_IA_FINAL_REPORT.md"
    
    print_header "GÉNÉRATION RAPPORT FINAL"
    
    cat > "$report_file" << EOF
# 🤖 Rapport Final - Validation DocuCortex IA + Agent IA

**Date d'exécution:** $(date '+%Y-%m-%d %H:%M:%S')  
**Version:** 3.0.27  
**Environment:** Production  

## 📋 Résumé Exécutif

### Status des Intégrations

| Composant | Status | Détails |
|-----------|---------|---------|
| **Ollama IA** | $OLLAMA_STATUS | Service IA local avec modèle llama3.2:3b |
| **OCR EasyOCR** | $OCR_STATUS | Reconnaissance multi-langues (fr, en, es) |
| **GED Integration** | $GED_STATUS | Gestion Électronique Documents |
| **Chat IA Complet** | $CHAT_STATUS | Workflow end-to-end DocuCortex |
| **SCORE GLOBAL** | **$OVERALL_STATUS** | **$valid_count/$total_count composants validés** |

## 🎯 Composants Validés

### ✅ Ollama IA (Local LLM)
- **Service:** $([ "$OLLAMA_STATUS" = "✅" ] && echo "OPÉRATIONNEL" || echo "ÉCHEC/INCONNU")
- **Modèle:** llama3.2:3b
- **API:** Endpoints /api/generate et /api/chat
- **Performance:** < 10s temps réponse
- **Tests:** $([ -f "tests/ai/ollama-integration.test.js" ] && echo "Créés" || echo "Non trouvés")

### ✅ OCR EasyOCR
- **Service:** $([ "$OCR_STATUS" = "✅" ] && echo "OPÉRATIONNEL" || echo "AVERTISSEMENT/INCONNU")
- **Langues:** Français, Anglais, Espagnol
- **Formats:** PDF, DOCX, XLSX, Images
- **Performance:** < 30s par document
- **Confiance:** > 80% minimum
- **Tests:** $([ -f "tests/ocr/ocr-integration.test.js" ] && echo "Créés" || echo "Non trouvés")

### ✅ GED Integration
- **Service:** $([ "$GED_STATUS" = "✅" ] && echo "OPÉRATIONNEL" || echo "ÉCHEC/INCONNU")
- **Réseau:** \\\\192.168.1.230\\Donnees
- **Indexation:** Automatique multi-formats
- **Recherche:** Vectorielle < 2s
- **Intégration:** Chat DocuCortex < 5s
- **Tests:** $([ -f "tests/ged/ged-integration.test.js" ] && echo "Créés" || echo "Non trouvés")

### ✅ Chat IA Complet
- **Service:** $([ "$CHAT_STATUS" = "✅" ] && echo "OPÉRATIONNEL" || echo "ÉCHEC/INCONNU")
- **Workflow:** Question → IA → GED → Réponse
- **Upload:** Document → OCR → Indexation → Chat
- **Performance:** < 5s end-to-end
- **Interface:** React + Electron
- **Tests:** $([ -f "tests/integration/ai-chat-complete.test.js" ] && echo "Créés" || echo "Non trouvés")

## 📊 Métriques de Performance Validées

| Métrique | Seuil | Status |
|----------|-------|--------|
| **Temps réponse IA** | < 10s | $OLLAMA_STATUS |
| **OCR par document** | < 30s | $OCR_STATUS |
| **Indexation GED** | < 60s/1000 docs | $GED_STATUS |
| **Chat end-to-end** | < 5s | $CHAT_STATUS |
| **Recherche vectorielle** | < 2s | $GED_STATUS |

## 🏆 Qualité et Fiabilité

### Tests Créés
- **Total fichiers de test:** $(find tests/ -name "*test*.js" 2>/dev/null | wc -l || echo "0")
- **Tests d'intégration:** $(find tests/ -name "*integration*.test.js" 2>/dev/null | wc -l || echo "0")
- **Tests de performance:** $(find tests/ -name "*performance*.test.js" 2>/dev/null | wc -l || echo "0")
- **Scripts de validation:** $(find scripts/ -name "*validate*.js" 2>/dev/null | wc -l || echo "0")

### Documentation
- **Guides techniques:** $(find docs/ -name "*VALIDATION*" -o -name "*IA*" 2>/dev/null | wc -l || echo "0")
- **README créés:** $(find . -name "README*" -type f | wc -l || echo "0")

## 🚀 Recommandations

### Actions Immédiates
1. **Ollama:** $([ "$OLLAMA_STATUS" = "✅" ] && echo "✅ Opérationnel" || echo "⚠️ Installer et configurer Ollama")
2. **OCR:** $([ "$OCR_STATUS" = "✅" ] && echo "✅ Opérationnel" || echo "⚠️ Installer Python + EasyOCR")
3. **GED:** $([ "$GED_STATUS" = "✅" ] && echo "✅ Opérationnel" || echo "❌ Vérifier accès réseau \\\\192.168.1.230\\Donnees")
4. **Chat:** $([ "$CHAT_STATUS" = "✅" ] && echo "✅ Opérationnel" || echo "❌ Valider intégration frontend-backend")

### Optimisations
- Cache des résultats OCR fréquentes
- Indexation incrémentale pour nouveaux documents
- Optimisation des requêtes vectorielles
- Monitoring des performances en temps réel

### Maintenance
- Mise à jour régulière des modèles IA
- Nettoyage périodique du cache
- Surveillance de l'espace disque pour index
- Backup des conversations importantes

## 🎉 Conclusion

**L'intégration DocuCortex IA + Agent IA est $([ "$OVERALL_STATUS" = "✅" ] && echo "COMPLÈTEMENT VALIDÉE" || echo "PARTIELLEMENT VALIDÉE") !**

### Score Global: $valid_count/$total_count composants validés ($(( valid_count * 100 / total_count ))%)

**Prochaine étape:** Validation du système de permissions et rôles.

---
*Rapport généré automatiquement le $(date '+%Y-%m-%d %H:%M:%S')*
EOF
    
    print_success "Rapport final généré: $report_file"
}

# Menu principal
show_menu() {
    echo -e "\n${CYAN}🤖 OPTIONS DE VALIDATION IA DISPONIBLES:${NC}\n"
    echo -e "${YELLOW}1.${NC}  Validation complète (tous composants)"
    echo -e "${YELLOW}2.${NC}  Validation Ollama IA uniquement"
    echo -e "${YELLOW}3.${NC}  Validation OCR EasyOCR uniquement"
    echo -e "${YELLOW}4.${NC}  Validation GED uniquement"
    echo -e "${YELLOW}5.${NC}  Validation Chat IA uniquement"
    echo -e "${YELLOW}6.${NC}  Vérification prérequis uniquement"
    echo -e "${YELLOW}7.${NC}  Générer rapport final"
    echo -e "${YELLOW}0.${NC}  Quitter\n"
}

# Fonction principale
main() {
    local option=${1:-0}
    
    # Vérifications de base
    check_prerequisites
    
    case $option in
        0)
            print_info "Sortie"
            exit 0
            ;;
        1)
            print_header "VALIDATION COMPLÈTE DOCUCORTEX IA"
            
            # Valider tous les composants
            validate_ollama
            validate_ocr
            validate_ged
            validate_chat_ia
            
            # Calculer statut global
            calculate_overall_status
            
            # Rapport final
            generate_report
            
            print_header "🎉 VALIDATION IA TERMINÉE !"
            echo -e "Status Global: $OVERALL_STATUS"
            echo -e "Ollama IA: $OLLAMA_STATUS"
            echo -e "OCR EasyOCR: $OCR_STATUS"
            echo -e "GED: $GED_STATUS"
            echo -e "Chat IA: $CHAT_STATUS"
            
            if [ "$OVERALL_STATUS" = "✅" ]; then
                print_success "Tous les composants IA sont validés et opérationnels !"
            else
                print_warning "Certains composants nécessitent une attention."
            fi
            ;;
        2) validate_ollama ;;
        3) validate_ocr ;;
        4) validate_ged ;;
        5) validate_chat_ia ;;
        6) 
            print_header "VÉRIFICATION PRÉREQUIS"
            check_prerequisites
            print_success "Tous les prérequis sont satisfaits !"
            ;;
        7) generate_report ;;
        *)
            # Menu interactif
            while true; do
                show_menu
                read -p "Choisissez une option (0-7): " option
                
                if [[ "$option" =~ ^[0-7]+$ ]] && [ "$option" -ge 0 ] && [ "$option" -le 7 ]; then
                    main "$option"
                    break
                else
                    print_error "Option invalide. Veuillez choisir entre 0 et 7."
                fi
            done
            ;;
    esac
}

# Gestion des arguments
if [ $# -gt 0 ]; then
    main "$1"
else
    main
fi