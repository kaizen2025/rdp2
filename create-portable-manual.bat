@echo off
echo ================================================
echo  CREATION PORTABLE MANUELLE - Sans blocage
echo ================================================
echo.

REM Vérifier que win-unpacked existe
if not exist "dist\win-unpacked" (
    echo ERREUR: dist\win-unpacked n'existe pas!
    echo Lancez d'abord: npm run build
    pause
    exit /b 1
)

echo [1/3] Nettoyage portable precedent...
if exist "dist\RDS-Viewer-Portable" rmdir /s /q "dist\RDS-Viewer-Portable"

echo [2/3] Creation du dossier portable...
xcopy "dist\win-unpacked" "dist\RDS-Viewer-Portable\" /E /I /Q /Y

echo [3/3] Creation du lanceur...
(
echo @echo off
echo cd /d "%%~dp0"
echo start "" "RDS Viewer.exe"
) > "dist\RDS-Viewer-Portable\Lancer RDS Viewer.bat"

echo.
echo ================================================
echo  PORTABLE CREE AVEC SUCCES!
echo ================================================
echo  Dossier: dist\RDS-Viewer-Portable\
echo  Lanceur: Lancer RDS Viewer.bat
echo.
echo Voulez-vous tester l'application? (O/N)
set /p launch=
if /i "%launch%"=="O" (
    cd dist\RDS-Viewer-Portable
    start "" "Lancer RDS Viewer.bat"
)
