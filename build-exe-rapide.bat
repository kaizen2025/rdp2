@echo off
REM ========================================
REM Script de génération RAPIDE (sans réinstallation)
REM À utiliser si les dépendances sont déjà installées
REM ========================================

echo.
echo ======================================
echo   Build Rapide - Portable EXE
echo ======================================
echo.

echo [1/2] Nettoyage du build précédent...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
echo       ✓ Nettoyé

echo.
echo [2/2] Build complet (React + Electron)...
call npm run build:exe
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Génération échouée !
    pause
    exit /b 1
)

echo.
echo ✓ BUILD TERMINÉ !
echo Vérifiez le dossier dist\
echo.
pause
