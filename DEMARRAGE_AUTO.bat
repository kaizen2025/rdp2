@echo off
title DocuCortex IA - Gestionnaire Intelligent

echo.
echo ======================================================
echo   DocuCortex IA - Démarrage avec Gestion Auto des Ports
echo ======================================================
echo.

cd /d "%~dp0"

echo 🔍 Vérification des processus Node.js existants...
tasklist | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ⚠️  Processus Node.js détectés, arrêt en cours...
    taskkill /IM node.exe /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo.
echo 🚀 Démarrage de DocuCortex IA avec gestion automatique des ports...
echo.
echo 📋 Ce que va faire l'application :
echo    • Détecter automatiquement les ports occupés
echo    • Utiliser le premier port libre trouvé
echo    • Démarrer React sur ce port
echo    • Lancer Electron pour l'interface desktop
echo.
echo ⏳ Démarrage en cours...
echo.

node start-electron-fixed.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du démarrage
    echo.
    echo 💡 Suggestions :
    echo    • Vérifiez que Node.js est installé
    echo    • Assurez-vous d'être dans le bon répertoire
    echo    • Vérifiez les logs ci-dessus pour plus d'informations
    echo.
    pause
)