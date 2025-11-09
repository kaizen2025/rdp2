@echo off
echo ================================================
echo  BUILD PRODUCTION OPTIMISE
echo  electron-builder gere prod deps automatiquement
echo ================================================
echo.

REM Nettoyage complet
echo [1/3] Nettoyage dossiers build/dist...
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

REM Build React
echo [2/3] Build React optimise...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR lors du build React!
    pause
    exit /b 1
)
echo Build React termine!
echo.

REM Package Electron (electron-builder inclut automatiquement seulement prod deps)
echo [3/3] Package Electron portable...
echo electron-builder va inclure seulement les production dependencies
call electron-builder --config electron-builder-optimized.json --win portable --x64
if %errorlevel% neq 0 (
    echo ERREUR lors du packaging Electron!
    pause
    exit /b 1
)

echo.
echo ================================================
echo  BUILD TERMINE!
echo ================================================
echo.

REM Verification
if exist "dist\RDS Viewer-3.0.26-Portable-Optimized.exe" (
    echo EXE portable genere avec succes:
    dir "dist\RDS Viewer-3.0.26-Portable-Optimized.exe"
    echo.
) else (
    echo AVERTISSEMENT: EXE portable non trouve
    if exist "dist\win-unpacked" (
        echo Mais dossier win-unpacked cree avec succes:
        dir "dist\win-unpacked\RDS Viewer.exe"
    )
)

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
