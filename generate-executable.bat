@echo off
REM ============================================================================
REM  GENERATION RAPIDE DE L'EXECUTABLE RDS VIEWER ANECOOP v3.0.27
REM ============================================================================
REM  Ce script génère rapidement l'exécutable Windows optimisé
REM  Usage: generate-executable.bat
REM ============================================================================

setlocal EnableDelayedExpansion

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║     GENERATION EXECUTABLE RDS VIEWER ANECOOP v3.0.27                 ║
echo ║                  Build Optimise Production                            ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Couleurs pour le terminal
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "CYAN=[36m"
set "RESET=[0m"

set START_TIME=%TIME%
set ERROR_COUNT=0

echo %CYAN%🚀 Début de la génération...%RESET%
echo.

REM ============================================================================
REM ETAPE 1: Vérification de l'environnement
REM ============================================================================
echo %CYAN%[1/7] Vérification de l'environnement...%RESET%

REM Vérification Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%❌ Node.js non trouvé. Installation requise.%RESET%
    set /a ERROR_COUNT+=1
    goto :ERROR
)
echo %GREEN%✅ Node.js détecté%RESET%

REM Vérification npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%❌ npm non trouvé%RESET%
    set /a ERROR_COUNT+=1
    goto :ERROR
)
echo %GREEN%✅ npm détecté%RESET%

echo.

REM ============================================================================
REM ETAPE 2: Installation des dépendances critiques
REM ============================================================================
echo %CYAN%[2/7] Installation des dépendances critiques...%RESET%

REM Vérifier si electron-builder est installé
npm list electron-builder >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%⏳ Installation de electron-builder...%RESET%
    call npm install --save-dev electron-builder
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%❌ Erreur installation electron-builder%RESET%
        set /a ERROR_COUNT+=1
        goto :ERROR
    )
)
echo %GREEN%✅ electron-builder installé%RESET%

REM Vérifier si electron est installé
npm list electron >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%⏳ Installation de electron...%RESET%
    call npm install --save-dev electron
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%❌ Erreur installation electron%RESET%
        set /a ERROR_COUNT+=1
        goto :ERROR
    )
)
echo %GREEN%✅ electron installé%RESET%

echo.

REM ============================================================================
REM ETAPE 3: Nettoyage des builds précédents
REM ============================================================================
echo %CYAN%[3/7] Nettoyage des builds précédents...%RESET%

if exist "dist" (
    echo %YELLOW%⏳ Suppression de dist/...%RESET%
    rmdir /s /q "dist" 2>nul
)

if exist "release" (
    echo %YELLOW%⏳ Suppression de release/...%RESET%
    rmdir /s /q "release" 2>nul
)

if exist "out" (
    echo %YELLOW%⏳ Suppression de out/...%RESET%
    rmdir /s /q "out" 2>nul
)

echo %GREEN%✅ Nettoyage terminé%RESET%
echo.

REM ============================================================================
REM ETAPE 4: Génération des icônes
REM ============================================================================
echo %CYAN%[4/7] Génération des icônes...%RESET%

if not exist "build\icons" (
    mkdir "build\icons"
)

REM Vérifier si les icônes existent déjà
if not exist "build\icons\icon.ico" (
    echo %YELLOW%⏳ Génération de icon.ico...%RESET%
    
    REM Utiliser generate-icons.js s'il existe
    if exist "generate-icons.js" (
        node generate-icons.js
    ) else (
        echo %YELLOW%⚠️  Icône par défaut sera utilisée%RESET%
    )
) else (
    echo %GREEN%✅ Icônes déjà présentes%RESET%
)

echo.

REM ============================================================================
REM ETAPE 5: Mise à jour package.json pour build
REM ============================================================================
echo %CYAN%[5/7] Configuration du build...%RESET%

REM Vérifier la présence de electron-builder.yml
if not exist "build\electron-builder.yml" (
    echo %YELLOW%⚠️  Configuration electron-builder.yml non trouvée%RESET%
    echo %YELLOW%Utilisation de la configuration par défaut...%RESET%
) else (
    echo %GREEN%✅ Configuration electron-builder.yml trouvée%RESET%
)

echo.

REM ============================================================================
REM ETAPE 6: Build de l'application Electron
REM ============================================================================
echo %CYAN%[6/7] Génération de l'exécutable Windows...%RESET%
echo %YELLOW%⏳ Cette étape peut prendre 3-10 minutes...%RESET%
echo.

REM Définir les variables d'environnement pour optimisation
set NODE_ENV=production
set NODE_OPTIONS=--max-old-space-size=4096

REM Lancer le build avec electron-builder
if exist "build\electron-builder.yml" (
    echo %CYAN%📦 Build avec configuration YAML...%RESET%
    call npx electron-builder --win --x64 --config build/electron-builder.yml
) else (
    echo %CYAN%📦 Build avec configuration par défaut...%RESET%
    call npx electron-builder --win --x64
)

if %ERRORLEVEL% NEQ 0 (
    echo %RED%❌ Erreur lors de la génération de l'exécutable%RESET%
    set /a ERROR_COUNT+=1
    goto :ERROR
)

echo.
echo %GREEN%✅ Exécutable généré avec succès !%RESET%
echo.

REM ============================================================================
REM ETAPE 7: Vérification et rapport final
REM ============================================================================
echo %CYAN%[7/7] Vérification et rapport final...%RESET%

REM Chercher l'exécutable généré
set "EXECUTABLE_FOUND=0"
for /r "dist" %%f in (*.exe) do (
    set "EXECUTABLE_FOUND=1"
    echo %GREEN%✅ Exécutable trouvé: %%f%RESET%
    
    REM Obtenir la taille du fichier
    for %%A in ("%%f") do set "FILE_SIZE=%%~zA"
    set /a FILE_SIZE_MB=!FILE_SIZE! / 1048576
    echo %CYAN%   Taille: !FILE_SIZE_MB! MB%RESET%
)

if !EXECUTABLE_FOUND! EQU 0 (
    echo %RED%❌ Aucun exécutable trouvé dans dist/%RESET%
    set /a ERROR_COUNT+=1
    goto :ERROR
)

REM Chercher l'installeur
set "INSTALLER_FOUND=0"
for /r "dist" %%f in (*Setup*.exe) do (
    set "INSTALLER_FOUND=1"
    echo %GREEN%✅ Installeur trouvé: %%f%RESET%
    
    for %%A in ("%%f") do set "INST_SIZE=%%~zA"
    set /a INST_SIZE_MB=!INST_SIZE! / 1048576
    echo %CYAN%   Taille: !INST_SIZE_MB! MB%RESET%
)

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                      GENERATION TERMINEE AVEC SUCCES                   ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Calculer le temps écoulé
set END_TIME=%TIME%
echo %GREEN%🎉 Génération terminée !%RESET%
echo.

echo %CYAN%📊 Résumé:%RESET%
echo    • Exécutables générés: dist/
if !INSTALLER_FOUND! EQU 1 (
    echo    • Installeur NSIS: Disponible
)
echo    • Version: 3.0.27
echo    • Plateforme: Windows x64
echo.

echo %CYAN%🚀 Prochaines étapes:%RESET%
echo    1. Tester l'exécutable dans dist/
echo    2. Tester l'installeur (si généré)
echo    3. Distribuer aux utilisateurs
echo.

echo %YELLOW%📁 Les fichiers sont disponibles dans le dossier 'dist'%RESET%
echo.

goto :END

REM ============================================================================
REM Gestion des erreurs
REM ============================================================================
:ERROR
echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                         ERREUR DE GENERATION                           ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo %RED%❌ La génération a échoué avec %ERROR_COUNT% erreur(s)%RESET%
echo.
echo %YELLOW%🔧 Actions recommandées:%RESET%
echo    1. Vérifier que Node.js et npm sont installés
echo    2. Exécuter: npm install
echo    3. Vérifier les logs ci-dessus pour plus de détails
echo    4. Consulter la documentation dans build/README.md
echo.
pause
exit /b 1

:END
echo %GREEN%✨ Génération réussie ! Vous pouvez fermer cette fenêtre.%RESET%
echo.
pause
exit /b 0
