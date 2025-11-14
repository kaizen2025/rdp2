@echo off
echo ============================================
echo DIAGNOSTIC ET CORRECTION DU PROJET RDP2
echo ============================================
echo.

cd C:\Projet\rdp2

echo [ETAPE 1] Verification de l'environnement...
echo Node version:
node -v
echo NPM version:
npm -v
echo.

echo [ETAPE 2] Verification des processus en cours...
echo Arret de tous les processus Node.js...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [ETAPE 3] Verification de l'installation Electron...
if not exist node_modules\electron (
    echo ERREUR: Electron n'est pas installe !
    echo Installation d'Electron...
    npm install electron@31.0.0 --save-dev
) else (
    echo Electron est installe.
)
echo.

echo [ETAPE 4] Test du backend seul...
echo Demarrage du backend pour 5 secondes...
start /B node server/server.js
timeout /t 5 /nobreak >nul

echo Test de connexion au backend sur le port 3002...
curl -s http://localhost:3002/api/health
if %errorlevel% neq 0 (
    echo ERREUR: Le backend ne repond pas sur le port 3002
) else (
    echo Backend OK !
)
echo.

echo Arret du backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [ETAPE 5] Verification des fichiers critiques...
if not exist electron\main.js (
    echo ERREUR: electron\main.js manquant !
) else (
    echo electron\main.js OK
)

if not exist server\server.js (
    echo ERREUR: server\server.js manquant !
) else (
    echo server\server.js OK
)

if not exist scripts\wait-for-backend.js (
    echo ERREUR: scripts\wait-for-backend.js manquant !
) else (
    echo scripts\wait-for-backend.js OK
)
echo.

echo [ETAPE 6] Verification de package.json...
findstr /C:"electron:start" package.json >nul
if %errorlevel% neq 0 (
    echo ERREUR: Script electron:start manquant dans package.json !
) else (
    echo Script electron:start OK
)
echo.

echo ============================================
echo DIAGNOSTIC TERMINE
echo ============================================
echo.
echo Voulez-vous demarrer l'application maintenant ? (O/N)
set /p choix=
if /i "%choix%"=="O" (
    echo.
    echo Demarrage de l'application...
    npm run electron:start
) else (
    echo.
    echo Pour demarrer manuellement, executez:
    echo npm run electron:start
)
pause
