@echo off
REM ========================================
REM Script de Build RDS Viewer v3.1.0
REM Génère l'application portable .exe
REM ========================================

echo.
echo ========================================
echo   RDS Viewer v3.1.0 - Build Release
echo ========================================
echo.

REM Vérifier Node.js
echo [1/7] Verification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)
echo ✓ Node.js detecte

REM Vérifier npm
echo.
echo [2/7] Verification de npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: npm n'est pas disponible
    pause
    exit /b 1
)
echo ✓ npm detecte

REM Nettoyer les anciens builds
echo.
echo [3/7] Nettoyage des anciens builds...
if exist dist (
    echo Suppression du dossier dist/...
    rmdir /s /q dist
)
if exist build (
    echo Suppression du dossier build/...
    rmdir /s /q build
)
echo ✓ Nettoyage termine

REM Installer les dépendances si nécessaire
echo.
echo [4/7] Verification des dependances...
if not exist node_modules (
    echo Installation des dependances (cela peut prendre quelques minutes)...
    call npm install
    if errorlevel 1 (
        echo ERREUR: Echec de l'installation des dependances
        pause
        exit /b 1
    )
) else (
    echo ✓ node_modules existe deja
)

REM Build de l'application React
echo.
echo [5/8] Build de l'application React...
echo (Cela peut prendre 2-5 minutes)
call npm run build
if errorlevel 1 (
    echo ERREUR: Echec du build React
    pause
    exit /b 1
)
echo ✓ Build React termine

REM Rebuild des modules natifs pour Electron
echo.
echo [6/8] Rebuild des modules natifs (Electron)...
call npm run rebuild:native
if errorlevel 1 (
    echo ERREUR: Echec du rebuild des modules natifs
    pause
    exit /b 1
)
echo V Rebuild natif termine

REM Build de l'application Electron avec electron-builder
echo.
echo [7/8] Build de l'application Electron portable...
echo (Cela peut prendre 3-10 minutes selon votre machine)
call npx electron-builder --config electron-builder-release.json --win portable --x64
if errorlevel 1 (
    echo ERREUR: Echec du build Electron
    pause
    exit /b 1
)
echo ✓ Build Electron termine

REM Afficher le résultat
echo.
echo [8/8] Generation terminee !
echo.
echo ========================================
echo   Build Complete !
echo ========================================
echo.
echo L'application portable se trouve dans : dist\
echo.
dir dist\*.exe
echo.

REM Copier latest.yml dans dist pour les mises à jour
echo Copie de latest.yml vers dist\...
if exist latest.yml (
    copy /Y latest.yml dist\latest.yml >nul
    echo ✓ latest.yml copie
) else (
    echo ATTENTION: latest.yml introuvable
)

echo.
echo ========================================
echo   Instructions de deploiement
echo ========================================
echo.
echo 1. Copier les fichiers suivants sur votre serveur de mises a jour :
echo    - dist\RDS Viewer-3.1.0-Portable.exe
echo    - dist\latest.yml
echo.
echo 2. Mettre a jour latest.yml avec le SHA512 du .exe
echo.
echo 3. URL de mise a jour configuree dans electron-builder-release.json :
echo    https://updates.anecoop.local
echo.
echo 4. Les utilisateurs recevront automatiquement la notification
echo    de mise a jour au demarrage de l'application.
echo.
pause
