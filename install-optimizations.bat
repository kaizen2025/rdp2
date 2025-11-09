@echo off
REM install-optimizations.bat - Installation des optimisations pour build portable exceptionnel

echo ==================================================
echo   RDS Viewer - Installation des Optimisations
echo   Version: 3.0.26
echo ==================================================
echo.

REM Vérifier que npm est installé
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Erreur: npm n'est pas installe. Veuillez installer Node.js d'abord.
    pause
    exit /b 1
)

echo OK npm detecte
echo.

REM Installation des dépendances d'optimisation
echo Installation des dependances d'optimisation webpack...
call npm install --save-dev @craco/craco@^7.1.0
call npm install --save-dev compression-webpack-plugin@^11.1.0
call npm install --save-dev terser-webpack-plugin@^5.3.10
call npm install --save-dev webpack-bundle-analyzer@^4.10.1
call npm install --save-dev babel-plugin-import@^1.13.8

echo.
echo Installation de React Query pour cache intelligent...
call npm install @tanstack/react-query@^5.56.2
call npm install --save-dev @tanstack/react-query-devtools@^5.56.2

echo.
echo Installation des dependances de performance...
call npm install react-lazy-load-image-component@^1.6.2
call npm install workbox-webpack-plugin@^7.1.0

echo.
echo OK Toutes les dependances d'optimisation sont installees !
echo.
echo Prochaines etapes:
echo   1. Modifier package.json pour utiliser craco:
echo      "start": "craco start",
echo      "build": "craco build",
echo.
echo   2. Lancer le build optimise:
echo      npm run build:optimized
echo.
echo   3. Consultez OPTIMIZATION_GUIDE.md pour plus de details
echo.
echo ==================================================
pause
