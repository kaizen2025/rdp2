@echo off
REM Script d'installation propre pour DocuCortex IA (Windows)
REM Résout les problèmes de dépendances natives

echo ========================================
echo Installation de DocuCortex IA
echo ========================================
echo.

REM Vérifier Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe !
    echo Telechargez-le depuis https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Nettoyer si demandé
if "%1"=="--clean" (
    echo Nettoyage des anciennes installations...
    if exist node_modules rmdir /s /q node_modules
    if exist package-lock.json del /f /q package-lock.json
    if exist build rmdir /s /q build
    if exist dist rmdir /s /q dist
    echo.
)

REM Installer les dépendances
echo Installation des dependances...
call npm install --ignore-scripts
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] L'installation a echoue !
    pause
    exit /b 1
)
echo.

REM Recompiler better-sqlite3
echo Compilation de better-sqlite3...
call npm rebuild better-sqlite3
if %ERRORLEVEL% NEQ 0 (
    echo [AVERTISSEMENT] La compilation de better-sqlite3 a echoue
    echo L'application pourrait ne pas fonctionner correctement
)
echo.

echo ========================================
echo Installation terminee avec succes !
echo ========================================
echo.
echo Commandes disponibles:
echo   npm run dev         - Lancer en mode developpement
echo   npm run build       - Compiler le projet
echo   npm run build:exe   - Creer l'executable portable
echo.
pause
