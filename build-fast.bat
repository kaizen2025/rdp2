@echo off
echo ================================================
echo  BUILD RAPIDE - Sans blocage portable
echo ================================================
echo.

REM Nettoyer
echo [1/5] Nettoyage...
if exist dist\win-unpacked rmdir /s /q dist\win-unpacked
if exist build rmdir /s /q build

echo [2/5] Build React optimise...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR lors du build React!
    pause
    exit /b 1
)

echo [3/5] Package Electron (sans portable)...
call electron-builder --win dir --x64 --config electron-builder-optimized.json
if %errorlevel% neq 0 (
    echo ERREUR lors du packaging Electron!
    pause
    exit /b 1
)

echo [4/5] Creation portable manuel...
if exist "dist\RDS-Viewer-Portable" rmdir /s /q "dist\RDS-Viewer-Portable"
xcopy "dist\win-unpacked" "dist\RDS-Viewer-Portable\" /E /I /Q /Y

echo [5/5] Creation lanceur...
(
echo @echo off
echo cd /d "%%~dp0"
echo start "" "RDS Viewer.exe"
) > "dist\RDS-Viewer-Portable\Lancer RDS Viewer.bat"

echo.
echo ================================================
echo  BUILD TERMINE!
echo ================================================
echo  Application: dist\RDS-Viewer-Portable\
echo  Lanceur: Lancer RDS Viewer.bat
echo.
dir "dist\RDS-Viewer-Portable\" | findstr "RDS Viewer.exe"
echo.
echo Voulez-vous lancer l'application? (O/N)
set /p launch=
if /i "%launch%"=="O" (
    cd dist\RDS-Viewer-Portable
    start "" "RDS Viewer.exe"
)
