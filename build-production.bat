@echo off
echo ================================================
echo  BUILD PRODUCTION OPTIMISE
echo  Build React puis install prod-only (400MB)
echo ================================================
echo.

REM Nettoyage complet
echo [1/8] Nettoyage dossiers build/dist...
if exist dist (
    echo Suppression dist...
    rmdir /s /q dist
)
if exist build (
    echo Suppression build...
    rmdir /s /q build
)
if exist node_modules\.cache (
    echo Suppression cache...
    rmdir /s /q node_modules\.cache
)
echo Nettoyage termine!
echo.

REM Build React AVEC node_modules dev (car craco est necessaire)
echo [2/8] Build React optimise (avec craco)...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR lors du build React!
    pause
    exit /b 1
)
echo Build React termine!
echo.

REM Sauvegarder node_modules dev
echo [3/8] Sauvegarde node_modules dev...
if exist node_modules_dev_backup (
    echo Suppression ancienne sauvegarde...
    rmdir /s /q node_modules_dev_backup
)
echo Sauvegarde...
move node_modules node_modules_dev_backup

REM Installer SEULEMENT production dependencies
echo [4/8] Installation dependencies PRODUCTION uniquement...
call npm install --production --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERREUR lors de l'installation production!
    echo Restauration node_modules dev...
    if exist node_modules rmdir /s /q node_modules
    move node_modules_dev_backup node_modules
    pause
    exit /b 1
)

REM Afficher taille node_modules prod
echo [5/8] Verification taille node_modules production...
dir node_modules | find "File(s)"
echo.

REM Package Electron
echo [6/8] Package Electron portable...
call electron-builder --config electron-builder-optimized.json --win portable --x64
if %errorlevel% neq 0 (
    echo ERREUR lors du packaging Electron!
    echo Restauration node_modules dev...
    if exist node_modules rmdir /s /q node_modules
    move node_modules_dev_backup node_modules
    pause
    exit /b 1
)

REM Restaurer node_modules dev
echo [7/8] Restauration environnement dev...
if exist node_modules (
    echo Suppression node_modules production...
    rmdir /s /q node_modules
)
echo Restauration node_modules dev...
move node_modules_dev_backup node_modules

REM Verification
echo [8/8] Verification fichier genere...
if exist "dist\RDS Viewer-3.0.26-Portable-Optimized.exe" (
    echo.
    echo ================================================
    echo  BUILD REUSSI!
    echo ================================================
    dir "dist\RDS Viewer-3.0.26-Portable-Optimized.exe"
    echo.
) else (
    echo AVERTISSEMENT: EXE portable non trouve, mais win-unpacked existe
    if exist "dist\win-unpacked" (
        echo Dossier win-unpacked cree avec succes
        dir "dist\win-unpacked\RDS Viewer.exe"
    )
)

echo.
echo Environnement dev restaure!
echo.
echo ================================================
echo  TERMINE!
echo ================================================
echo.
echo Voulez-vous tester l'application? (O/N)
set /p launch=
if /i "%launch%"=="O" (
    if exist "dist\RDS Viewer-3.0.26-Portable-Optimized.exe" (
        start "" "dist\RDS Viewer-3.0.26-Portable-Optimized.exe"
    ) else if exist "dist\win-unpacked\RDS Viewer.exe" (
        start "" "dist\win-unpacked\RDS Viewer.exe"
    )
)
