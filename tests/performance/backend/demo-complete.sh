#!/bin/bash

# Script de démonstration rapide des tests de performance
# Ce script montre les différentes ways d'utiliser la suite de tests

echo "🚀 Démonstration de la Suite de Tests de Performance Backend DocuCortex"
echo "=================================================================="
echo ""

# Fonction pour afficher les sections
show_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Fonction pour exécuter et afficher la commande
run_demo() {
    echo "$ $1"
    echo "➡️  Exécution..."
    eval "$1"
    echo "✅ Terminé !"
    echo ""
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Veuillez exécuter ce script depuis le dossier backend/tests/performance/"
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Erreur: Node.js n'est pas installé"
    exit 1
fi

echo "✅ Environnement valide"
echo ""

show_section "1. DÉMONSTRATION RAPIDE - API & BASE DE DONNÉES SEULEMENT"
echo "Cette démo teste les endpoints API et les requêtes SQLite"
run_demo "node demo.js"

show_section "2. INSTALLATION DES DÉPENDANCES"
echo "Installation des packages nécessaires (si pas déjà fait)"
run_demo "npm install"

show_section "3. TESTS API UNIQUEMENT"
echo "Test des performances des endpoints REST"
run_demo "node index.js api --verbose"

show_section "4. TESTS BASE DE DONNÉES UNIQUEMENT"
echo "Test des requêtes SQLite et de l'indexation"
run_demo "node index.js database"

show_section "5. TESTS WEBSOCKET UNIQUEMENT"
echo "Test de la communication temps réel"
run_demo "node index.js websocket"

show_section "6. TESTS DE CHARGE UNIQUEMENT"
echo "Simulation de charge utilisateur"
run_demo "node index.js load --env staging"

show_section "7. PROFILAGE MÉMOIRE UNIQUEMENT"
echo "Analyse de l'utilisation mémoire et CPU"
run_demo "node index.js memory"

show_section "8. TESTS GED UNIQUEMENT"
echo "Test des opérations de gestion électronique de documents"
run_demo "node index.js ged"

show_section "9. TESTS COMPLETS"
echo "Exécution de toute la suite de tests"
run_demo "node index.js all --env production"

show_section "10. SCRIPT DE LANCEMENT AUTOMATISÉ"
echo "Utilisation du script bash avec options"
run_demo "./run-performance-tests.sh --help"

echo ""
echo "🎉 Démonstration terminée !"
echo ""
echo "📚 Ressources utiles:"
echo "   - README.md : Documentation complète"
echo "   - config.js : Configuration des tests"
echo "   - results/ : Rapports générés"
echo "   - RAPPORT_CREATION.md : Détails de création"
echo ""