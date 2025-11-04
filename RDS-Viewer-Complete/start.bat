@echo off
REM ==============================================================================
REM DocuCortex IA - RDP2 - Script de démarrage complet
REM ==============================================================================

echo ========================================
echo   DocuCortex IA - RDP2
echo   Demarrage de l'application
echo ========================================
echo.

REM Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH
    echo Telechargez Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)

REM Afficher la version de Node.js
echo [INFO] Version Node.js:
node --version
echo.

REM Vérifier que npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] npm n'est pas installe
    pause
    exit /b 1
)

REM Aller dans le répertoire du projet
cd /d "%~dp0"

REM Vérifier que node_modules existe
if not exist "node_modules" (
    echo [INFO] Installation des dependances...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERREUR] Echec de l'installation des dependances
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Verification de la connexion Ollama...
curl -s http://192.168.1.232:11434/api/tags >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [AVERTISSEMENT] Ollama n'est pas accessible sur http://192.168.1.232:11434
    echo Verifiez que Ollama est demarre et accessible
    echo.
) else (
    echo [OK] Ollama est accessible
    echo.
)

echo [INFO] Demarrage du serveur backend...
start "DocuCortex Backend" cmd /k "npm run server:start"

REM Attendre que le serveur démarre
timeout /t 3 /nobreak >nul

echo [INFO] Demarrage du frontend React...
start "DocuCortex Frontend" cmd /k "npm start"

REM Attendre que le frontend démarre
timeout /t 5 /nobreak >nul

echo [INFO] Demarrage d'Electron...
start "DocuCortex Electron" cmd /k "npm run electron"

echo.
echo ========================================
echo   DocuCortex IA est en cours de demarrage
echo ========================================
echo.
echo Services lances:
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:3000
echo   - Electron: Application de bureau
echo.
echo Appuyez sur une touche pour fermer cette fenetre
echo (Les services continueront a fonctionner)
pause >nul
