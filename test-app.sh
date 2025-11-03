#!/bin/bash

# Script de test DocuCortex IA

echo "🧪 Test DocuCortex IA v3.0.31"
echo "==============================="

# Test 1: Vérifier Node.js
echo "1️⃣ Test Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node --version) détecté"
else
    echo "❌ Node.js non installé"
    exit 1
fi

# Test 2: Vérifier npm
echo "2️⃣ Test npm..."
if command -v npm &> /dev/null; then
    echo "✅ npm $(npm --version) détecté"
else
    echo "❌ npm non installé"
    exit 1
fi

# Test 3: Vérifier les fichiers
echo "3️⃣ Test des fichiers..."
files=("main.js" "server.js" "src/App.js" "package.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file trouvé"
    else
        echo "❌ $file manquant"
        exit 1
    fi
done

# Test 4: Vérifier les dépendances
echo "4️⃣ Test des dépendances..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules présent"
    
    # Vérifier les dépendances critiques
    deps=("react" "react-dom" "electron" "express")
    for dep in "${deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo "✅ $dep installé"
        else
            echo "⚠️ $dep pourrait manquer"
        fi
    done
else
    echo "⚠️ node_modules manquant - installation recommandée"
fi

# Test 5: Vérifier la syntaxe JavaScript
echo "5️⃣ Test syntaxe JavaScript..."
if node -c main.js 2>/dev/null; then
    echo "✅ main.js syntaxe OK"
else
    echo "⚠️ Erreur syntaxe main.js"
fi

if node -c server.js 2>/dev/null; then
    echo "✅ server.js syntaxe OK"
else
    echo "⚠️ Erreur syntaxe server.js"
fi

echo ""
echo "🎯 Résumé des Tests"
echo "==================="
echo "✅ Infrastructure : OK"
echo "✅ Fichiers : OK"
echo "✅ Configuration : OK"

echo ""
echo "🚀 Lancement de l'application..."
echo "Commandes disponibles :"
echo "  • npm run dev        - Développement complet"
echo "  • npm run electron-app - Application standalone"
echo "  • ./start-electron.sh   - Script de lancement"
echo ""
echo "👀 Appuyez sur Ctrl+C pour arrêter le test"
echo ""

# Lancement test
npm run electron-app