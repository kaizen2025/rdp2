# =============================================================================
# Script d'installation automatique DocuCortex IA - Ollama Integration (Windows)
# =============================================================================

param(
    [switch]$SkipOllama,
    [switch]$SkipModels,
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"

# Fonctions d'affichage
function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================`n" -ForegroundColor Magenta
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔄 $Message" -ForegroundColor Blue
}

# Vérification des prérequis
function Test-Prerequisites {
    Write-Step "Vérification des prérequis"
    
    # PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        Write-Error "PowerShell 5+ requis (détecté: $($psVersion.ToString()))"
        exit 1
    }
    Write-Success "PowerShell $($psVersion.ToString())"
    
    # Node.js
    try {
        $nodeVersion = node --version
        $nodeMajor = $nodeVersion.TrimStart('v').Split('.')[0]
        if ([int]$nodeMajor -lt 18) {
            throw "Version trop ancienne"
        }
        Write-Success "Node.js $nodeVersion"
    }
    catch {
        Write-Error "Node.js 18+ requis. Téléchargez depuis https://nodejs.org"
        exit 1
    }
    
    # npm
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion disponible"
    }
    catch {
        Write-Error "npm non disponible"
        exit 1
    }
    
    # Git (optionnel)
    try {
        git --version | Out-Null
        Write-Success "Git disponible"
    }
    catch {
        Write-Warning "Git non installé (optionnel)"
    }
}

# Installation d'Ollama
function Install-Ollama {
    if ($SkipOllama) {
        Write-Info "Installation d'Ollama ignorée (-SkipOllama)"
        return
    }
    
    Write-Step "Installation d'Ollama"
    
    # Vérifier si Ollama est déjà installé
    try {
        $ollamaVersion = ollama --version
        Write-Success "Ollama déjà installé: $ollamaVersion"
        return
    }
    catch {
        Write-Info "Ollama non trouvé, installation en cours..."
    }
    
    # Proposer l'installation
    Write-Host "`nOllama est requis pour DocuCortex IA." -ForegroundColor Yellow
    Write-Host "1. Téléchargez depuis: https://ollama.ai/download/windows" -ForegroundColor Cyan
    Write-Host "2. Exécutez l'installateur en tant qu'administrateur" -ForegroundColor Cyan
    Write-Host "3. Redémarrez ce terminal après installation" -ForegroundColor Cyan
    
    $response = Read-Host "`nAvez-vous installé Ollama ? (y/N)"
    if ($response -notmatch '^[Yy]$') {
        Write-Info "Installation d'Ollama requise. Arrêt du script."
        exit 1
    }
    
    # Vérifier l'installation
    try {
        $ollamaVersion = ollama --version
        Write-Success "Ollama installé: $ollamaVersion"
    }
    catch {
        Write-Error "Ollama non accessible après installation"
        exit 1
    }
}

# Configuration du projet
function Initialize-Project {
    Write-Step "Configuration du projet"
    
    # Vérifier package.json
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json non trouvé"
        Write-Info "Assurez-vous d'être dans le dossier du projet rdp2"
        exit 1
    }
    
    # Installer les dépendances
    Write-Info "Installation des dépendances Node.js..."
    try {
        npm install
        Write-Success "Dépendances installées"
    }
    catch {
        Write-Error "Échec de l'installation des dépendances"
        throw
    }
    
    # Créer .env
    if (-not (Test-Path ".env")) {
        Write-Info "Création du fichier .env..."
        Copy-Item ".env.example" ".env"
        Write-Success "Fichier .env créé"
    }
    else {
        Write-Info "Fichier .env existant préservé"
    }
    
    # Créer les dossiers
    $folders = @("uploads", "data", "logs")
    foreach ($folder in $folders) {
        if (-not (Test-Path $folder)) {
            New-Item -ItemType Directory -Path $folder | Out-Null
        }
    }
    Write-Success "Dossiers de travail créés"
}

# Installation des modèles Ollama
function Install-OllamaModels {
    if ($SkipModels) {
        Write-Info "Installation des modèles ignorée (-SkipModels)"
        return
    }
    
    Write-Step "Installation des modèles Ollama"
    
    # Vérifier qu'Ollama fonctionne
    try {
        $null = ollama list
        Write-Success "Ollama accessible"
    }
    catch {
        Write-Error "Ollama non accessible. Démarrez avec: ollama serve"
        return
    }
    
    # Démarrer Ollama si nécessaire
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
        Write-Success "Ollama déjà en cours d'exécution"
    }
    catch {
        Write-Info "Démarrage d'Ollama en arrière-plan..."
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        
        # Attendre qu'Ollama soit prêt
        Write-Info "Attente du démarrage d'Ollama..."
        $maxAttempts = 30
        for ($i = 1; $i -le $maxAttempts; $i++) {
            try {
                $null = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 1
                Write-Success "Ollama démarré"
                break
            }
            catch {
                if ($i -eq $maxAttempts) {
                    Write-Error "Timeout: Ollama n'a pas démarré"
                    exit 1
                }
                Start-Sleep -Seconds 1
            }
        }
    }
    
    # Installer les modèles
    $models = @("llama2", "mistral", "llava")
    
    foreach ($model in $models) {
        Write-Info "Vérification du modèle $model..."
        
        $modelExists = ollama list | Select-String $model
        if ($modelExists) {
            Write-Success "Modèle $model déjà installé"
        }
        else {
            Write-Info "Installation du modèle $model..."
            try {
                ollama pull $model
                Write-Success "Modèle $model installé"
            }
            catch {
                Write-Warning "Échec de l'installation du modèle $model"
            }
        }
    }
    
    # Afficher la liste
    Write-Info "Modèles installés:"
    ollama list
}

# Configuration des permissions
function Set-Permissions {
    Write-Step "Configuration des permissions"
    
    # Aucune permission spéciale nécessaire sur Windows pour les scripts JS
    Write-Success "Permissions configurées"
}

# Test de l'installation
function Test-Installation {
    Write-Step "Test de l'installation"
    
    # Test Node.js
    try {
        $null = node --version
        Write-Success "Node.js opérationnel"
    }
    catch {
        Write-Error "Node.js non accessible"
    }
    
    # Test npm
    try {
        $null = npm --version
        Write-Success "npm opérationnel"
    }
    catch {
        Write-Error "npm non accessible"
    }
    
    # Test Ollama
    try {
        $null = ollama --version
        Write-Success "Ollama installé"
        
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
            Write-Success "Connexion Ollama réussie"
        }
        catch {
            Write-Warning "Ollama installé mais non démarré (normal)"
        }
    }
    catch {
        Write-Error "Ollama non accessible"
    }
    
    # Test projet
    if ((Test-Path ".env") -and (Test-Path "node_modules")) {
        Write-Success "Configuration projet terminée"
    }
    else {
        Write-Error "Configuration projet incomplète"
    }
}

# Instructions finales
function Show-FinalInstructions {
    Write-Header "INSTALLATION TERMINÉE"
    
    Write-Host "🎉 DocuCortex IA avec Ollama a été installé avec succès !" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
    Write-Host "1. Démarrer Ollama (si pas déjà fait):" -ForegroundColor Yellow
    Write-Host "   ollama serve" -ForegroundColor Blue
    Write-Host ""
    Write-Host "2. Démarrer l'application:" -ForegroundColor Yellow
    Write-Host "   npm run electron:dev" -ForegroundColor Blue
    Write-Host ""
    Write-Host "3. Tester la connectivité:" -ForegroundColor Yellow
    Write-Host "   npm run ollama:test" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "🚀 COMMANDES UTILES:" -ForegroundColor Cyan
    Write-Host "• npm run electron:dev     - Démarrage complet (dev)" -ForegroundColor Blue
    Write-Host "• npm run server:dev       - Serveur seulement" -ForegroundColor Blue
    Write-Host "• npm start                - Frontend seulement" -ForegroundColor Blue
    Write-Host "• npm run ollama:test      - Test de connectivité" -ForegroundColor Blue
    Write-Host "• ollama serve             - Démarrer Ollama" -ForegroundColor Blue
    Write-Host "• ollama list              - Voir les modèles" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "📖 DOCUMENTATION:" -ForegroundColor Cyan
    Write-Host "• docs\quick-start.md      - Guide de démarrage rapide" -ForegroundColor Blue
    Write-Host "• docs\installation.md     - Installation détaillée" -ForegroundColor Blue
    Write-Host "• docs\utilisation.md      - Guide d'utilisation" -ForegroundColor Blue
    Write-Host "• README.md                - Vue d'ensemble" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "⚡ DANS L'APPLICATION:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir DocuCortex IA" -ForegroundColor Cyan
    Write-Host "2. Cliquer sur l'onglet 'DocuCortex IA'" -ForegroundColor Cyan
    Write-Host "3. Vérifier le statut dans 'Statut & Tests'" -ForegroundColor Cyan
    Write-Host "4. Essayer la génération dans 'Génération de Texte'" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "✨ Profitez de DocuCortex IA avec l'intelligence artificielle !" -ForegroundColor Green
    Write-Host ""
}

# Fonction principale
function Main {
    Write-Header "INSTALLATION DOCUCORTEX IA - OLLAMA (Windows)"
    
    Write-Host "Ce script va installer et configurer DocuCortex IA avec Ollama." -ForegroundColor Cyan
    Write-Host "Durée estimée: 5-15 minutes selon votre connexion." -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $Force) {
        $response = Read-Host "Continuer l'installation ? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Info "Installation annulée"
            return
        }
    }
    
    try {
        Test-Prerequisites
        Install-Ollama
        Initialize-Project
        Install-OllamaModels
        Set-Permissions
        Test-Installation
        Show-FinalInstructions
    }
    catch {
        Write-Error "Installation échouée: $($_.Exception.Message)"
        exit 1
    }
}

# Exécution
if ($MyInvocation.InvocationName -ne '.') {
    Main
}