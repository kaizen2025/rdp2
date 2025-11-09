@echo off
echo ================================================
echo  BUILD OPTIMISE - RDS Viewer Portable
echo ================================================
echo.

REM Nettoyer le cache et dist
echo [1/4] Nettoyage des fichiers temporaires...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo [2/4] Build React optimise...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR lors du build React!
    pause
    exit /b 1
)

echo [3/4] Packaging Electron portable...
call electron-builder --config electron-builder-optimized.json --win portable --x64
if %errorlevel% neq 0 (
    echo ERREUR lors du packaging Electron!
    pause
    exit /b 1
)

echo [4/4] Verification du fichier genere...
if exist "dist\RDS Viewer-3.0.26-Portable-Optimized.exe" (
    echo.
    echo ================================================
    echo  BUILD REUSSI!
    echo ================================================
    echo  Fichier: dist\RDS Viewer-3.0.26-Portable-Optimized.exe
    echo.
    dir "dist\*.exe"
    echo.
    echo Voulez-vous lancer l'application? (O/N)
    set /p launch=
    if /i "%launch%"=="O" (
        start "" "dist\RDS Viewer-3.0.26-Portable-Optimized.exe"
    )
) else (
    echo ERREUR: Le fichier EXE n'a pas ete genere!
    pause
    exit /b 1
)
