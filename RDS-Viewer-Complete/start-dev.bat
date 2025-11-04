@echo off
REM ==============================================================================
REM DocuCortex IA - RDP2 - Démarrage rapide (mode développement)
REM ==============================================================================

echo ========================================
echo   DocuCortex IA - Mode Developpement
echo ========================================
echo.

cd /d "%~dp0"

REM Vérifier Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js non installe
    pause
    exit /b 1
)

REM Lancer en mode développement (tout dans une fenêtre)
echo [INFO] Demarrage de l'application en mode dev...
npm run electron:dev

pause
