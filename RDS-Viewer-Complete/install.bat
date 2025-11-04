@echo off
REM ==============================================================================
REM DocuCortex IA - RDP2 - Installation complète
REM ==============================================================================

echo ========================================
echo   DocuCortex IA - Installation
echo ========================================
echo.

cd /d "%~dp0"

REM Vérifier Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js n'est pas installe
    echo Telechargez depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Nettoyer les anciens modules
if exist "node_modules" (
    echo [INFO] Suppression des anciens modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    del /f /q package-lock.json
)

echo.
echo [INFO] Installation des dependances...
call npm install

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] Echec de l'installation
    pause
    exit /b 1
)

echo.
echo [INFO] Configuration de l'environnement...
if not exist ".env" (
    copy ".env.example" ".env"
    echo [INFO] Fichier .env cree depuis .env.example
    echo [INFO] Editez .env pour configurer Ollama si necessaire
)

echo.
echo ========================================
echo   Installation terminee avec succes
echo ========================================
echo.
echo Prochaines etapes:
echo   1. Editez .env pour configurer Ollama (si necessaire)
echo   2. Lancez start.bat pour demarrer l'application
echo   3. Ou lancez start-dev.bat pour le mode developpement
echo.
pause
