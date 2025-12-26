@echo off
REM ==============================================
REM Script de Deployment Automatique des Mises a Jour
REM ==============================================
REM Version: 1.0
REM Description: Copie automatiquement les fichiers de mise a jour
REM              vers le serveur reseau si la version a change

SETLOCAL EnableDelayedExpansion

REM === CONFIGURATION ===
SET "UPDATE_SERVER=\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update"
SET "DIST_DIR=%~dp0dist"
SET "VERSION_FILE=%~dp0package.json"

REM Couleurs
SET "GREEN=[92m"
SET "RED=[91m"
SET "YELLOW=[93m"
SET "BLUE=[94m"
SET "NC=[0m"

echo.
echo %BLUE%=========================================%NC%
echo %BLUE%  DEPLOYMENT MISE A JOUR AUTOMATIQUE   %NC%
echo %BLUE%=========================================%NC%
echo.

REM === VERIFICATION 1: Dossier dist existe ===
IF NOT EXIST "%DIST_DIR%" (
    echo %RED%[ERREUR]%NC% Le dossier dist n'existe pas !
    echo %YELLOW%[INFO]%NC% Executez d'abord: npm run build:installer
    pause
    exit /b 1
)

REM === VERIFICATION 2: Fichiers necessaires ===
IF NOT EXIST "%DIST_DIR%\latest.yml" (
    echo %RED%[ERREUR]%NC% Le fichier latest.yml est introuvable !
    echo %YELLOW%[INFO]%NC% Build incomplet. Executez: npm run build:installer
    pause
    exit /b 1
)

REM Trouver le fichier Setup.exe (version dynamique)
FOR %%F IN ("%DIST_DIR%\*-Setup.exe") DO (
    SET "SETUP_FILE=%%F"
    SET "SETUP_NAME=%%~nxF"
)

IF NOT DEFINED SETUP_FILE (
    echo %RED%[ERREUR]%NC% Aucun fichier Setup.exe trouve dans dist !
    pause
    exit /b 1
)

echo %GREEN%[OK]%NC% Fichiers trouves:
echo     - latest.yml
echo     - %SETUP_NAME%
echo.

REM === VERIFICATION 3: Serveur de mise a jour accessible ===
echo %YELLOW%[INFO]%NC% Verification du serveur de mise a jour...
IF NOT EXIST "%UPDATE_SERVER%" (
    echo %RED%[ERREUR]%NC% Le serveur de mise a jour est inaccessible !
    echo     Chemin: %UPDATE_SERVER%
    echo.
    echo %YELLOW%[INFO]%NC% Verifiez que:
    echo     1. Le partage reseau existe
    echo     2. Vous avez les droits d'ecriture
    echo     3. Le serveur est allume
    pause
    exit /b 1
)

echo %GREEN%[OK]%NC% Serveur de mise a jour accessible
echo.

REM === EXTRACTION VERSION DEPUIS package.json ===
echo %YELLOW%[INFO]%NC% Lecture de la version actuelle...
FOR /F "tokens=2 delims=:, " %%A IN ('findstr /C:"\"version\"" "%VERSION_FILE%"') DO (
    SET VERSION=%%~A
)
echo %GREEN%[OK]%NC% Version actuelle: %VERSION%
echo.

REM === VERIFICATION 4: Comparer avec version deployee ===
IF EXIST "%UPDATE_SERVER%\latest.yml" (
    echo %YELLOW%[INFO]%NC% Comparaison avec la version deployee...

    REM Extraire la version du latest.yml deploye
    FOR /F "tokens=2" %%V IN ('findstr "^version:" "%UPDATE_SERVER%\latest.yml"') DO (
        SET DEPLOYED_VERSION=%%V
    )

    IF "!DEPLOYED_VERSION!"=="%VERSION%" (
        echo %YELLOW%[AVERTISSEMENT]%NC% La version %VERSION% est deja deployee !
        echo.
        choice /C ON /M "Voulez-vous re-deployer quand meme (O=Oui, N=Non)"
        IF ERRORLEVEL 2 (
            echo %BLUE%[INFO]%NC% Deployment annule par l'utilisateur.
            pause
            exit /b 0
        )
    ) ELSE (
        echo %GREEN%[OK]%NC% Nouvelle version detectee:
        echo     Deployee: !DEPLOYED_VERSION!
        echo     Nouvelle: %VERSION%
    )
) ELSE (
    echo %YELLOW%[INFO]%NC% Aucune version deployee. Premier deployment.
)

echo.

REM === COPIE DES FICHIERS ===
echo %BLUE%=========================================%NC%
echo %BLUE%  COPIE DES FICHIERS DE MISE A JOUR     %NC%
echo %BLUE%=========================================%NC%
echo.

echo %YELLOW%[1/2]%NC% Copie de latest.yml...
copy /Y "%DIST_DIR%\latest.yml" "%UPDATE_SERVER%\" >nul 2>&1
IF ERRORLEVEL 1 (
    echo %RED%[ERREUR]%NC% Echec de la copie de latest.yml
    pause
    exit /b 1
)
echo %GREEN%[OK]%NC% latest.yml copie avec succes

echo %YELLOW%[2/2]%NC% Copie de %SETUP_NAME%...
echo     Taille:
FOR %%A IN ("%SETUP_FILE%") DO (
    SET SIZE=%%~zA
    SET /A SIZE_MB=!SIZE! / 1048576
    echo     ~!SIZE_MB! MB
)
copy /Y "%SETUP_FILE%" "%UPDATE_SERVER%\" >nul 2>&1
IF ERRORLEVEL 1 (
    echo %RED%[ERREUR]%NC% Echec de la copie du Setup.exe
    pause
    exit /b 1
)
echo %GREEN%[OK]%NC% %SETUP_NAME% copie avec succes

echo.
echo %GREEN%=========================================%NC%
echo %GREEN%  DEPLOYMENT REUSSI !                   %NC%
echo %GREEN%=========================================%NC%
echo.

REM === RESUME ===
echo %BLUE%[RESUME]%NC%
echo     Version deployee: %VERSION%
echo     Serveur: %UPDATE_SERVER%
echo     URL update: file://192.168.1.230/Donnees/Informatique/PROGRAMMES/Programme RDS/RDS Viewer Group/update
echo.
echo %GREEN%[INFO]%NC% Les utilisateurs recevront une notification automatiquement
echo     au prochain demarrage de leur application (apres 5 secondes).
echo.

REM === VERIFICATION FINALE ===
echo %YELLOW%[VERIFICATION]%NC% Fichiers presents sur le serveur:
dir /B "%UPDATE_SERVER%\latest.yml" 2>nul
dir /B "%UPDATE_SERVER%\%SETUP_NAME%" 2>nul
echo.

REM === TEST OPTIONNEL ===
echo %YELLOW%[TEST]%NC% Verification de l'accessibilite des fichiers...
IF EXIST "%UPDATE_SERVER%\latest.yml" (
    echo %GREEN%[OK]%NC% latest.yml est accessible sur le serveur
) ELSE (
    echo %RED%[ERREUR]%NC% latest.yml n'est pas accessible !
)

IF EXIST "%UPDATE_SERVER%\%SETUP_NAME%" (
    echo %GREEN%[OK]%NC% %SETUP_NAME% est accessible sur le serveur
) ELSE (
    echo %RED%[ERREUR]%NC% %SETUP_NAME% n'est pas accessible !
)
echo.

echo %GREEN%[TERMINE]%NC% Vous pouvez fermer cette fenetre.
echo.
pause
ENDLOCAL
