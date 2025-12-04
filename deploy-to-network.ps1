param(
    [string]$NetworkPath = "\\192.168.1.230\donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\update\"
)

Write-Host "=========================================="
Write-Host "Déploiement RDS Viewer 3.1.0"
Write-Host "=========================================="
Write-Host ""

# Vérifier l'accès réseau
Write-Host "[1/5] Vérification de l'accès réseau..."
if (-not (Test-Path $NetworkPath)) {
    Write-Host "❌ ERREUR: Impossible d'accéder au chemin réseau" -ForegroundColor Red
    Write-Host "   Chemin: $NetworkPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Accès réseau OK" -ForegroundColor Green
Write-Host ""

# Vérifier les fichiers sources
Write-Host "[2/5] Vérification des fichiers sources..."
$exePath = "dist\RDS Viewer-3.1.0-Portable.exe"
$ymlPath = "dist\latest.yml"

if (-not (Test-Path $exePath)) {
    Write-Host "❌ ERREUR: Fichier .exe non trouvé" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $ymlPath)) {
    Write-Host "❌ ERREUR: Fichier latest.yml non trouvé" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Fichiers sources OK" -ForegroundColor Green
Write-Host "   - $exePath ($(([math]::Round((Get-Item $exePath).Length/1MB,2))) MB)"
Write-Host "   - $ymlPath"
Write-Host ""

# Copier le .exe
Write-Host "[3/5] Copie du fichier .exe (147 MB, cela peut prendre quelques secondes)..."
try {
    Copy-Item $exePath $NetworkPath -Force
    Write-Host "✅ .exe copié avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ ERREUR lors de la copie du .exe: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Copier latest.yml
Write-Host "[4/5] Copie de latest.yml..."
try {
    Copy-Item $ymlPath $NetworkPath -Force
    Write-Host "✅ latest.yml copié avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ ERREUR lors de la copie de latest.yml: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Vérification finale
Write-Host "[5/5] Vérification finale..."
$deployedExe = Join-Path $NetworkPath "RDS Viewer-3.1.0-Portable.exe"
$deployedYml = Join-Path $NetworkPath "latest.yml"

if ((Test-Path $deployedExe) -and (Test-Path $deployedYml)) {
    Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Fichiers déployés sur le réseau:"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    $exeInfo = Get-Item $deployedExe
    $ymlInfo = Get-Item $deployedYml

    Write-Host "📄 RDS Viewer-3.1.0-Portable.exe"
    Write-Host "   Taille: $([math]::Round($exeInfo.Length/1MB,2)) MB"
    Write-Host "   Date:   $($exeInfo.LastWriteTime)"
    Write-Host ""
    Write-Host "📄 latest.yml"
    Write-Host "   Taille: $([math]::Round($ymlInfo.Length/1KB,2)) KB"
    Write-Host "   Date:   $($ymlInfo.LastWriteTime)"
    Write-Host ""

    # Vérifier le contenu de latest.yml
    Write-Host "Vérification du contenu de latest.yml:"
    $ymlContent = Get-Content $deployedYml | Select-Object -First 5
    $ymlContent | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }

} else {
    Write-Host "❌ ERREUR: Fichiers non trouvés après déploiement" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================="
Write-Host "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS"
Write-Host "=========================================="
Write-Host ""
Write-Host "📢 Les utilisateurs avec RDS Viewer 3.0.x ou inférieur"
Write-Host "   recevront une notification de mise à jour automatique."
Write-Host ""
Write-Host "🔧 Pour tester la mise à jour:"
Write-Host "   1. Lancer une version 3.0.x de RDS Viewer"
Write-Host "   2. Attendre la notification de mise à jour"
Write-Host "   3. Cliquer sur 'Télécharger et installer'"
Write-Host ""
Write-Host "📍 Emplacement réseau:"
Write-Host "   $NetworkPath"
Write-Host ""
