@echo off
REM ========================================
REM Script de nettoyage du projet rdp2
REM Supprime les fichiers inutilisés et obsolètes
REM ========================================

echo.
echo ======================================
echo   Nettoyage du Projet RDP2
echo ======================================
echo.

REM Créer un dossier de backup
set BACKUP_DIR=_backup_%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul

echo [1/5] Suppression des fichiers doublons à la racine...

REM Fichiers doublons (versions à la racine alors qu'ils sont dans electron/ ou server/)
if exist main.js (
    echo   - main.js (doublon de electron/main.js)
    move main.js "%BACKUP_DIR%\" >nul 2>&1
)

if exist server.js (
    echo   - server.js (doublon de server/server.js)
    move server.js "%BACKUP_DIR%\" >nul 2>&1
)

REM Scripts obsolètes
if exist simple-server.js (
    echo   - simple-server.js (obsolète)
    move simple-server.js "%BACKUP_DIR%\" >nul 2>&1
)

if exist start-electron-fixed.js (
    echo   - start-electron-fixed.js (obsolète)
    move start-electron-fixed.js "%BACKUP_DIR%\" >nul 2>&1
)

if exist start-simple.js (
    echo   - start-simple.js (obsolète)
    move start-simple.js "%BACKUP_DIR%\" >nul 2>&1
)

if exist start-with-ollama.js (
    echo   - start-with-ollama.js (intégré dans server.js)
    move start-with-ollama.js "%BACKUP_DIR%\" >nul 2>&1
)

echo       ✓ Fichiers doublons nettoyés

echo.
echo [2/5] Suppression des anciens fichiers de documentation obsolètes...

REM Garder seulement les docs récentes et importantes
REM Déplacer les anciens rapports/guides dans backup

if exist RAPPORT-GENERATION-EXECUTABLE.md (
    move RAPPORT-GENERATION-EXECUTABLE.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist AMELIORATIONS.md (
    move AMELIORATIONS.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist AMELIORATIONS_COMPLETES.md (
    move AMELIORATIONS_COMPLETES.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist AMELIORATIONS_PACK_COMPLET.md (
    move AMELIORATIONS_PACK_COMPLET.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist PHASE2_AMELIORATIONS_COMPLETES.md (
    move PHASE2_AMELIORATIONS_COMPLETES.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist PLAN_AMELIORATIONS_PRIORITAIRES.md (
    move PLAN_AMELIORATIONS_PRIORITAIRES.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist RAPPORT_ANALYSE_ET_CORRECTIONS.md (
    move RAPPORT_ANALYSE_ET_CORRECTIONS.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist FICHIERS_CREES.md (
    move FICHIERS_CREES.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist STATUS_FINAL.md (
    move STATUS_FINAL.md "%BACKUP_DIR%\" >nul 2>&1
)

if exist REPORT.md (
    move REPORT.md "%BACKUP_DIR%\" >nul 2>&1
)

echo       ✓ Anciens rapports archivés

echo.
echo [3/5] Suppression des fichiers de configuration temporaires...

del /q .ports.json 2>nul
del /q .react-port.json 2>nul

echo       ✓ Fichiers temporaires supprimés

echo.
echo [4/5] Nettoyage des fichiers vides/inutiles...

if exist "Nouveau document texte.txt" (
    del "Nouveau document texte.txt" >nul 2>&1
)

if exist del (
    rd /s /q del >nul 2>&1
)

if exist rmdir (
    rd /s /q rmdir >nul 2>&1
)

REM Supprimer les raccourcis obsolètes
if exist "src - Raccourci.lnk" (
    del "src - Raccourci.lnk" >nul 2>&1
)

echo       ✓ Fichiers inutiles supprimés

echo.
echo [5/5] Nettoyage des dossiers de build/cache...

REM Ne pas supprimer node_modules ou dist car ils peuvent être utilisés
REM Juste nettoyer les caches

if exist ".cache" (
    rd /s /q .cache >nul 2>&1
)

if exist ".parcel-cache" (
    rd /s /q .parcel-cache >nul 2>&1
)

echo       ✓ Cache nettoyé

echo.
echo ======================================
echo   NETTOYAGE TERMINÉ !
echo ======================================
echo.
echo Fichiers déplacés dans : %BACKUP_DIR%
echo.
echo Fichiers importants conservés :
echo   ✓ Tous les fichiers sources (src/, server/, backend/, electron/)
echo   ✓ Documentation importante (guides récents)
echo   ✓ Fichiers de configuration (package.json, electron-builder.json)
echo   ✓ RDS-Viewer-Complete/ (référence pour OCR)
echo.
echo Si vous ne constatez aucun problème après test,
echo vous pouvez supprimer le dossier %BACKUP_DIR%
echo.
pause
