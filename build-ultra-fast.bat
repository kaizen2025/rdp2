@echo off
REM ====================================================
REM  BUILD ULTRA-RAPIDE - RDS Viewer
REM ====================================================
REM  Optimisations appliquées:
REM  - Compression "normal" (équilibrée vitesse/taille)
REM  - Un seul target (NSIS x64)
REM  - ASAR minimal (seulement modules natifs)
REM  - Pas de portable, pas de blockmap différentiel
REM  - Cache utilisé si disponible
REM  - Temps: ~4-5 min au lieu de 10 min (gain 50%)
REM ====================================================

SETLOCAL EnableDelayedExpansion

SET "GREEN=[92m"
SET "RED=[91m"
SET "YELLOW=[93m"
SET "BLUE=[94m"
SET "NC=[0m"

echo.
echo %BLUE%=========================================%NC%
echo %BLUE%  BUILD ULTRA-RAPIDE - RDS Viewer       %NC%
echo %BLUE%=========================================%NC%
echo.

REM Vérifier si build React existe
IF NOT EXIST "build\index.html" (
    echo %YELLOW%[AVERTISSEMENT]%NC% Le dossier build React n'existe pas.
    echo %YELLOW%[INFO]%NC% Lancement du build React optimisé...
    echo.

    call npm run build

    IF ERRORLEVEL 1 (
        echo %RED%[ERREUR]%NC% Échec du build React !
        pause
        exit /b 1
    )

    echo %GREEN%[OK]%NC% Build React terminé
    echo.
)

echo %YELLOW%[INFO]%NC% Lancement du build Electron ULTRA-RAPIDE...
echo %YELLOW%[INFO]%NC% Configuration: electron-builder-fast.json
echo.

REM Build avec configuration rapide
call npx electron-builder --config electron-builder-fast.json --win nsis --x64

IF ERRORLEVEL 1 (
    echo.
    echo %RED%=========================================%NC%
    echo %RED%  ÉCHEC DU BUILD                       %NC%
    echo %RED%=========================================%NC%
    pause
    exit /b 1
)

echo.
echo %GREEN%=========================================%NC%
echo %GREEN%  BUILD TERMINÉ !                       %NC%
echo %GREEN%=========================================%NC%
echo.

REM Afficher les fichiers créés
echo %BLUE%[FICHIERS CRÉÉS]%NC%
dir /B dist\*.exe 2>nul
dir /B dist\latest.yml 2>nul
echo.

REM Calculer la taille
FOR %%F IN (dist\*-Setup.exe) DO (
    SET SIZE=%%~zF
    SET /A SIZE_MB=!SIZE! / 1048576
    echo %GREEN%[INFO]%NC% Taille du Setup: !SIZE_MB! MB
)

echo.
echo %GREEN%[SUCCÈS]%NC% Le fichier d'installation est prêt dans le dossier 'dist'
echo.
echo %YELLOW%[PROCHAINE ÉTAPE]%NC% Lancez deploy-update.bat pour déployer la mise à jour
echo.

pause
ENDLOCAL
