@echo off
setlocal enabledelayedexpansion

echo ============================================
echo MISE A JOUR COMPLETE DU PROJET RDP2
echo ============================================
echo.
echo Ce script va:
echo 1. Arreter tous les processus Node/Electron
echo 2. Mettre a jour depuis Git (merge des corrections)
echo 3. Nettoyer completement node_modules
echo 4. Reinstaller toutes les dependances
echo 5. Verifier l'installation
echo.
echo Appuyez sur une touche pour continuer ou Ctrl+C pour annuler...
pause >nul
echo.

cd C:\Projet\rdp2

echo ============================================
echo [1/7] Arret des processus en cours...
echo ============================================
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul
echo OK
echo.

echo ============================================
echo [2/7] Sauvegarde et fetch Git...
echo ============================================
git stash
git fetch origin
echo OK
echo.

echo ============================================
echo [3/7] Merge de la branche de corrections dans main...
echo ============================================
git checkout main
git pull origin main
git merge origin/claude/fix-and-improve-project-01733jRqEyXifQHjDwDBK598 -m "Merge: Integration des corrections critiques"
if %errorlevel% neq 0 (
    echo.
    echo ATTENTION: Conflits detectes lors du merge !
    echo.
    echo Que voulez-vous faire ?
    echo 1 - Accepter TOUTES les corrections (recommande)
    echo 2 - Garder ma version locale
    echo 3 - Annuler le merge
    echo.
    set /p merge_choice="Votre choix (1/2/3): "

    if "!merge_choice!"=="1" (
        git checkout --theirs .
        git add .
        git commit -m "Merge: Resolution des conflits en faveur des corrections"
        echo Conflits resolus avec les corrections.
    ) else if "!merge_choice!"=="2" (
        git checkout --ours .
        git add .
        git commit -m "Merge: Resolution des conflits en gardant la version locale"
        echo Conflits resolus avec votre version.
    ) else (
        git merge --abort
        echo Merge annule. Script arrete.
        pause
        exit /b 1
    )
)

git push origin main
echo OK
echo.

echo ============================================
echo [4/7] Nettoyage complet (peut prendre du temps)...
echo ============================================
echo Suppression de node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules supprime
)

echo Nettoyage du cache npm...
npm cache clean --force

echo Suppression des fichiers temporaires...
if exist package-lock.json del /f package-lock.json
if exist .ports.json del /f .ports.json

echo OK
echo.

echo ============================================
echo [5/7] Reinstallation des dependances...
echo ============================================
echo Cette etape peut prendre 5-10 minutes...
echo.

npm install
if %errorlevel% neq 0 (
    echo.
    echo ERREUR lors de l'installation des dependances !
    echo Nouvelle tentative sans scripts...
    npm install --ignore-scripts
)
echo OK
echo.

echo ============================================
echo [6/7] Verification de l'installation...
echo ============================================
echo Node version:
node -v

echo NPM version:
npm -v

echo.
echo Verification d'Electron:
if exist node_modules\electron (
    echo [OK] Electron installe
) else (
    echo [ERREUR] Electron manquant, installation...
    npm install electron@31.0.0 --save-dev
)

echo.
echo Verification des fichiers critiques:
if exist electron\main.js (
    echo [OK] electron\main.js
) else (
    echo [ERREUR] electron\main.js manquant !
)

if exist server\server.js (
    echo [OK] server\server.js
) else (
    echo [ERREUR] server\server.js manquant !
)

if exist src\index.js (
    echo [OK] src\index.js
) else if exist src\index.tsx (
    echo [OK] src\index.tsx
) else (
    echo [ERREUR] Fichier d'entree React manquant !
)
echo.

echo ============================================
echo [7/7] Test rapide du backend...
echo ============================================
echo Demarrage du backend pour test (5 secondes)...
start /B node server/server.js
timeout /t 5 /nobreak >nul

curl -s http://localhost:3002/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend demarre et repond sur le port 3002
) else (
    echo [ATTENTION] Backend ne repond pas - verifiez les logs
)

echo Arret du backend de test...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo ============================================
echo MISE A JOUR TERMINEE !
echo ============================================
echo.
echo Pour demarrer l'application :
echo   npm run electron:start
echo.
echo Si seule la page web s'ouvre (pas Electron) :
echo   start-electron-only.bat
echo.
echo Pour diagnostiquer les problemes :
echo   diagnose-and-fix.bat
echo.

set /p start_now="Voulez-vous demarrer l'application maintenant ? (O/N): "
if /i "%start_now%"=="O" (
    echo.
    echo Demarrage de l'application...
    npm run electron:start
)

pause
