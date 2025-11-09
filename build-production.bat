@echo off
echo ================================================
echo  BUILD PRODUCTION OPTIMISE
echo  Reduction 1.5GB -^> 400MB node_modules
echo ================================================
echo.

REM Sauvegarder node_modules dev
echo [1/8] Sauvegarde environnement dev...
if exist node_modules_dev_backup (
    echo Suppression ancienne sauvegarde...
    rmdir /s /q node_modules_dev_backup
)
echo Sauvegarde node_modules...
move node_modules node_modules_dev_backup

REM Installer SEULEMENT production dependencies
echo [2/8] Installation dependencies PRODUCTION uniquement...
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
echo [3/8] Verification taille node_modules production...
dir node_modules | find "File(s)"
echo.

REM Build React
echo [4/8] Build React optimise...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR lors du build React!
    echo Restauration node_modules dev...
    if exist node_modules rmdir /s /q node_modules
    move node_modules_dev_backup node_modules
    pause
    exit /b 1
)

REM Package Electron
echo [5/8] Package Electron portable...
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
echo [6/8] Restauration environnement dev...
if exist node_modules (
    echo Suppression node_modules production...
    rmdir /s /q node_modules
)
echo Restauration node_modules dev...
move node_modules_dev_backup node_modules

REM Verification
echo [7/8] Verification fichier genere...
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

echo [8/8] Environnement dev restaure
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
