@echo off
REM ==============================================================================
REM DocuCortex IA - RDP2 - Test de connectivité Ollama
REM ==============================================================================

echo ========================================
echo   Test Ollama - DocuCortex IA
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Test de connexion a Ollama sur http://192.168.1.232:11434...
echo.

REM Test basique avec curl
curl -s http://192.168.1.232:11434/api/tags
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] Impossible de se connecter a Ollama
    echo.
    echo Solutions:
    echo   1. Verifiez que Ollama est demarre sur 192.168.1.232
    echo   2. Verifiez votre connexion reseau
    echo   3. Verifiez l'adresse IP dans .env (OLLAMA_HOST)
    echo.
) else (
    echo.
    echo [OK] Connexion Ollama reussie
    echo.
)

REM Test avec le script Node.js
echo [INFO] Test detaille avec le script Node.js...
node scripts/test-ollama.js

echo.
pause
