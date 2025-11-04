@echo off
REM ==============================================================================
REM DocuCortex IA - RDP2 - Démarrage serveur uniquement
REM ==============================================================================

echo ========================================
echo   DocuCortex IA - Serveur Backend
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Demarrage du serveur sur le port 5000...
npm run server:start

pause
