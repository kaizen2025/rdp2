@echo off
REM Script d'installation des dépendances pour RDS Viewer (Windows)

echo ═══════════════════════════════════════════════════════
echo    RDS Viewer - Installation des Dépendances
echo ═══════════════════════════════════════════════════════
echo.

REM Vérifier Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js n'est pas installé.
    echo Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node -v

REM Vérifier npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm n'est pas installé.
    pause
    exit /b 1
)

echo [INFO] npm version:
npm -v
echo.

echo [INFO] Nettoyage des anciens modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json

echo.
echo [INFO] Installation des dépendances...
echo.

REM Tentative d'installation normale
npm install
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [INFO] Installation réussie!
    goto CHECK_PACKAGES
)

echo.
echo [WARN] Installation échouée. Tentative avec des options alternatives...
echo.

REM Tentative avec legacy-peer-deps
npm install --legacy-peer-deps
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [INFO] Installation réussie avec --legacy-peer-deps!
    goto CHECK_PACKAGES
)

echo.
echo [ERROR] Installation échouée.
echo.
echo Problèmes possibles:
echo   1. Problème de connexion réseau
echo   2. Proxy ou pare-feu bloquant
echo   3. Problème de permissions
echo.
echo Solutions suggérées:
echo   - Vérifier votre connexion Internet
echo   - Exécuter en tant qu'Administrateur
echo   - Configurer un proxy npm si nécessaire
echo   - Consulter INSTALLATION_FIXES.md pour plus d'aide
echo.
pause
exit /b 1

:CHECK_PACKAGES
echo.
echo ═══════════════════════════════════════════════════════
echo    Vérification des Packages Critiques
echo ═══════════════════════════════════════════════════════
echo.

REM Vérifier express
npm list express >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] express installé
) else (
    echo [ERROR] express NON installé
)

REM Vérifier electron
npm list electron >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] electron installé
) else (
    echo [ERROR] electron NON installé
)

REM Vérifier react
npm list react >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] react installé
) else (
    echo [ERROR] react NON installé
)

REM Vérifier react-scripts
npm list react-scripts >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] react-scripts installé
) else (
    echo [ERROR] react-scripts NON installé
)

REM Vérifier @google/generative-ai
npm list @google/generative-ai >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] @google/generative-ai installé
) else (
    echo [WARN] @google/generative-ai NON installé (optionnel)
)

echo.
echo [INFO] Vous pouvez maintenant démarrer l'application:
echo   npm run electron:start
echo.
echo ═══════════════════════════════════════════════════════
echo.

pause
