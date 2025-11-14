@echo off
echo ============================================
echo CORRECTION : ELECTRON NE SE LANCE PAS
echo ============================================
echo.

cd C:\Projet\rdp2

echo Etape 1 : Arret de tous les processus...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul
echo OK
echo.

echo Etape 2 : Verification d'Electron...
if not exist node_modules\electron (
    echo Electron n'est pas installe ! Installation en cours...
    npm install electron@31.0.0 --save-dev
    if %errorlevel% neq 0 (
        echo ERREUR lors de l'installation d'Electron !
        echo Tentative avec --force...
        npm install electron@31.0.0 --save-dev --force
    )
) else (
    echo Electron est deja installe.
    npm list electron
)
echo.

echo Etape 3 : Verification du script wait-for-backend.js...
if not exist scripts\wait-for-backend.js (
    echo ERREUR : scripts\wait-for-backend.js manquant !
    echo Impossible de continuer.
    pause
    exit /b 1
)
echo OK
echo.

echo Etape 4 : Nettoyage du fichier .ports.json...
if exist .ports.json (
    del /f .ports.json
    echo Fichier .ports.json supprime
) else (
    echo Aucun fichier .ports.json a supprimer
)
echo.

echo Etape 5 : Test de demarrage Electron seul...
echo.
echo Nous allons tester si Electron peut demarrer.
echo Une fenetre Electron devrait s'ouvrir brievement.
echo.
timeout /t 3 /nobreak

echo Test : electron --version
call npx electron --version
if %errorlevel% neq 0 (
    echo.
    echo ERREUR : Electron ne peut pas s'executer !
    echo Reinstallation complete d'Electron...
    rmdir /s /q node_modules\electron 2>nul
    npm install electron@31.0.0 --save-dev --force
)
echo.

echo ============================================
echo CORRECTION TERMINEE
echo ============================================
echo.
echo MAINTENANT, choisissez une option :
echo.
echo 1 - Demarrer l'application complete (backend + React + Electron)
echo 2 - Demarrer UNIQUEMENT le backend et React (pour debug)
echo 3 - Test rapide : Lancer Electron seul (sans backend)
echo 4 - Quitter
echo.
set /p choix="Votre choix (1/2/3/4) : "

if "%choix%"=="1" (
    echo.
    echo Demarrage de l'application complete...
    npm run electron:start
) else if "%choix%"=="2" (
    echo.
    echo Demarrage backend + React uniquement...
    echo Backend sera sur http://localhost:3002
    echo React sera sur http://localhost:3000
    echo.
    echo ATTENTION : Vous devrez lancer Electron separement avec :
    echo   electron .
    echo.
    npm run dev
) else if "%choix%"=="3" (
    echo.
    echo Test Electron seul (peut echouer si backend absent)...
    electron .
) else (
    echo Au revoir !
)

pause
