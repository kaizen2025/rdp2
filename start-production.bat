@echo off
echo 🚀 Démarrage RDS Viewer Anecoop Production...
echo ===============================================

REM Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Charger les variables d'environnement
if exist ".env.production" (
    echo ✅ Variables d'environnement trouvées
) else (
    echo ⚠️ Fichier .env.production non trouvé
)

REM Créer les répertoires nécessaires
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups
if not exist "temp" mkdir temp

echo.
echo 🚀 Démarrage de l'application...
set NODE_ENV=production

REM Utiliser le script de démarrage corrigé
node start-electron-final.js

echo.
echo 📴 L'application s'est fermée.
pause