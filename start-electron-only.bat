@echo off
echo ============================================
echo DEMARRAGE ELECTRON UNIQUEMENT
echo (Le backend et React doivent deja etre lances)
echo ============================================
echo.

cd C:\Projet\rdp2

echo Verification que le backend repond...
timeout /t 2 /nobreak >nul

:CHECK_BACKEND
curl -s http://localhost:3002/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Backend non detecte sur le port 3002...
    echo Nouvelle tentative dans 2 secondes...
    timeout /t 2 /nobreak >nul
    goto CHECK_BACKEND
)

echo Backend detecte ! Lancement d'Electron...
electron .

pause
