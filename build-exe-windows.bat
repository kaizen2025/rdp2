@echo off
REM ========================================
REM Script de génération d'exécutable portable
REM DocuCortex IA - Windows Build Script
REM ========================================

echo.
echo ======================================
echo   DocuCortex IA - Build Portable EXE
echo ======================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installé !
    echo Téléchargez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Nettoyage des anciens fichiers...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist node_modules rmdir /s /q node_modules
echo       ✓ Nettoyage terminé

echo.
echo [2/5] Installation des dépendances...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] L'installation des dépendances a échoué !
    pause
    exit /b 1
)
echo       ✓ Dépendances installées

echo.
echo [3/5] Compilation du frontend React...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] La compilation du frontend a échoué !
    pause
    exit /b 1
)
echo       ✓ Frontend compilé

echo.
echo [4/5] Génération de l'exécutable portable...
call npx electron-builder --win portable --config electron-builder.json
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] La génération de l'exécutable a échoué !
    pause
    exit /b 1
)
echo       ✓ Exécutable généré

echo.
echo [5/5] Vérification du résultat...
if exist "dist\DocuCortex IA-3.0.26-Portable.exe" (
    echo       ✓ Exécutable créé avec succès !
    echo.
    echo ======================================
    echo   BUILD RÉUSSI !
    echo ======================================
    echo.
    echo L'exécutable portable se trouve dans :
    echo   dist\DocuCortex IA-3.0.26-Portable.exe
    echo.
    echo Taille du fichier :
    dir "dist\DocuCortex IA-3.0.26-Portable.exe" | find "DocuCortex"
) else (
    echo [ATTENTION] L'exécutable n'a pas été trouvé à l'emplacement attendu.
    echo Vérifiez le dossier dist\ pour voir ce qui a été généré.
    dir dist\*.exe /s
)

echo.
echo Appuyez sur une touche pour quitter...
pause >nul
