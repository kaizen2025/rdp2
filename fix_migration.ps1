# fix_migration.ps1 - Script PowerShell de finalisation migration SQLite
# Ajoute les routes manquantes, crée les tables SQLite, vérifie les dépendances

$ErrorActionPreference = "Stop"

# Chemins
$PROJECT_ROOT = $PSScriptRoot
$SERVER_JS_PATH = Join-Path $PROJECT_ROOT "server\server.js"
$DB_PATH = Join-Path $PROJECT_ROOT "database\docucortex.db"

# Routes à ajouter
$ROUTES_TO_ADD = @"

        // ✅ Routes utilisateurs RDS (SQLite)
        app.use('/api/users', require('../backend/routes/userRoutes'));

        // ✅ Routes chat
        app.use('/api/chat', require('../backend/routes/chatRoutes'));

        // ✅ Routes préférences
        app.use('/api/preferences', require('../backend/routes/preferencesRoutes'));
"@

function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "INFO"
    )
    
    $icons = @{
        "INFO"    = "ℹ️"
        "SUCCESS" = "✅"
        "ERROR"   = "❌"
        "WARNING" = "⚠️"
    }
    
    $icon = $icons[$Status]
    Write-Host "$icon $Message"
}

function Add-RoutesToServerJS {
    Write-Status "Ajout des routes dans server.js..." "INFO"
    
    if (-not (Test-Path $SERVER_JS_PATH)) {
        Write-Status "Fichier non trouvé: $SERVER_JS_PATH" "ERROR"
        return $false
    }
    
    # Lire le fichier
    $content = Get-Content $SERVER_JS_PATH -Raw -Encoding UTF8
    
    # Vérifier si les routes sont déjà présentes
    if ($content -match "require\('../backend/routes/userRoutes'\)") {
        Write-Status "Routes déjà présentes dans server.js" "WARNING"
        return $true
    }
    
    # Trouver l'emplacement pour insérer les routes
    $pattern = "(app\.use\('/api/notifications',\s*notificationRoutes\);)"
    
    if ($content -notmatch $pattern) {
        Write-Status "Pattern d'insertion non trouvé dans server.js" "ERROR"
        return $false
    }
    
    # Créer un backup
    $backupPath = "$SERVER_JS_PATH.backup_auto"
    Copy-Item $SERVER_JS_PATH $backupPath -Force
    Write-Status "Backup créé: $backupPath" "INFO"
    
    # Insérer les routes
    $newContent = $content -replace $pattern, "`$1$ROUTES_TO_ADD"
    
    # Écrire le nouveau contenu
    Set-Content -Path $SERVER_JS_PATH -Value $newContent -Encoding UTF8 -NoNewline
    
    Write-Status "Routes ajoutées avec succès dans server.js" "SUCCESS"
    return $true
}

function Create-SQLiteTables {
    Write-Status "Création des tables SQLite..." "INFO"
    
    # Créer le dossier database s'il n'existe pas
    $dbDir = Split-Path $DB_PATH -Parent
    if (-not (Test-Path $dbDir)) {
        New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
    }
    
    # Schéma SQL
    $sqlSchema = @"
CREATE TABLE IF NOT EXISTS chat_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private INTEGER DEFAULT 0,
    members TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited INTEGER DEFAULT 0,
    reactions TEXT,
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"@
    
    try {
        # Utiliser sqlite3.exe si disponible, sinon créer via script SQL
        $sqliteExe = Get-Command sqlite3 -ErrorAction SilentlyContinue
        
        if ($sqliteExe) {
            # Méthode avec sqlite3.exe
            $sqlSchema | sqlite3 $DB_PATH
        }
        else {
            # Créer un fichier SQL temporaire et utiliser Node.js
            $tempSqlFile = Join-Path $PROJECT_ROOT "temp_schema.sql"
            Set-Content -Path $tempSqlFile -Value $sqlSchema
            
            # Script Node.js temporaire pour créer les tables
            $nodeScript = @"
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('$($DB_PATH.Replace('\', '\\'))');
const sql = fs.readFileSync('$($tempSqlFile.Replace('\', '\\'))', 'utf8');
db.exec(sql, (err) => {
    if (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
    console.log('Tables créées avec succès');
    db.close();
});
"@
            $tempNodeFile = Join-Path $PROJECT_ROOT "temp_create_tables.js"
            Set-Content -Path $tempNodeFile -Value $nodeScript
            
            # Exécuter avec Node.js
            node $tempNodeFile
            
            # Nettoyer
            Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
            Remove-Item $tempNodeFile -ErrorAction SilentlyContinue
        }
        
        Write-Status "Tables SQLite créées/vérifiées" "SUCCESS"
        Write-Status "Base de données: $DB_PATH" "INFO"
        return $true
        
    }
    catch {
        Write-Status "Erreur lors de la création des tables: $_" "ERROR"
        return $false
    }
}

function Test-NPMDependencies {
    Write-Status "Vérification des dépendances npm..." "INFO"
    
    $packageJsonPath = Join-Path $PROJECT_ROOT "package.json"
    
    if (-not (Test-Path $packageJsonPath)) {
        Write-Status "package.json non trouvé" "ERROR"
        return @()
    }
    
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $dependencies = @{}
    
    if ($packageJson.dependencies) {
        $packageJson.dependencies.PSObject.Properties | ForEach-Object {
            $dependencies[$_.Name] = $_.Value
        }
    }
    
    if ($packageJson.devDependencies) {
        $packageJson.devDependencies.PSObject.Properties | ForEach-Object {
            $dependencies[$_.Name] = $_.Value
        }
    }
    
    $requiredPackages = @('xlsx', 'multer', 'sqlite3')
    $missingPackages = @()
    
    foreach ($pkg in $requiredPackages) {
        if ($dependencies.ContainsKey($pkg)) {
            Write-Status "Package trouvé: $pkg" "SUCCESS"
        }
        else {
            Write-Status "Package manquant: $pkg" "WARNING"
            $missingPackages += $pkg
        }
    }
    
    return $missingPackages
}

function Test-BackendRoutes {
    Write-Status "Vérification des fichiers de routes backend..." "INFO"
    
    $routes = @(
        "backend\routes\userRoutes.js",
        "backend\routes\chatRoutes.js",
        "backend\routes\preferencesRoutes.js"
    )
    
    $allExist = $true
    foreach ($route in $routes) {
        $routePath = Join-Path $PROJECT_ROOT $route
        if (Test-Path $routePath) {
            Write-Status "Route trouvée: $(Split-Path $route -Leaf)" "SUCCESS"
        }
        else {
            Write-Status "Route manquante: $(Split-Path $route -Leaf)" "ERROR"
            $allExist = $false
        }
    }
    
    return $allExist
}

# ========== MAIN ==========

Write-Host ""
Write-Host "============================================================"
Write-Host "🚀 FINALISATION MIGRATION SQLITE - AUTOMATIQUE"
Write-Host "============================================================"
Write-Host ""

$success = $true

# 1. Vérifier les routes backend
if (-not (Test-BackendRoutes)) {
    Write-Status "Certaines routes backend sont manquantes!" "ERROR"
    $success = $false
}

# 2. Ajouter les routes dans server.js
if (-not (Add-RoutesToServerJS)) {
    $success = $false
}

# 3. Créer les tables SQLite
if (-not (Create-SQLiteTables)) {
    $success = $false
}

# 4. Vérifier les dépendances npm
$missingPackages = Test-NPMDependencies

# Résumé final
Write-Host ""
Write-Host "============================================================"
if ($success -and $missingPackages.Count -eq 0) {
    Write-Status "MIGRATION FINALISÉE AVEC SUCCÈS!" "SUCCESS"
    Write-Host ""
    Write-Host "📋 Prochaines étapes:"
    Write-Host "   1. Redémarrer le serveur backend"
    Write-Host "   2. Vérifier la console pour les erreurs"
    Write-Host "   3. Tester les endpoints: /api/users, /api/chat, /api/preferences"
}
elseif ($missingPackages.Count -gt 0) {
    Write-Status "Migration presque terminée" "WARNING"
    Write-Host ""
    Write-Host "📋 Action requise:"
    Write-Host "   Installer les packages manquants: npm install $($missingPackages -join ' ')"
    Write-Host "   Puis redémarrer le serveur"
}
else {
    Write-Status "Erreurs détectées lors de la migration" "ERROR"
    Write-Host ""
    Write-Host "📋 Consultez les messages ci-dessus pour plus de détails"
}

Write-Host "============================================================"
Write-Host ""

if (-not $success) {
    exit 1
}
