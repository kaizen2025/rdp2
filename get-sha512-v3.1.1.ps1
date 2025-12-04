$exePath = Join-Path $PSScriptRoot "dist\RDS Viewer-3.1.1-Portable.exe"

if (-not (Test-Path $exePath)) {
    Write-Host "ERREUR: Fichier non trouvé: $exePath" -ForegroundColor Red
    exit 1
}

$file = Get-Item $exePath
$sizeMB = [math]::Round($file.Length/1MB,2)
$sizeBytes = $file.Length

Write-Host "=========================================="
Write-Host "RDS Viewer v3.1.1 - Informations"
Write-Host "=========================================="
Write-Host "Nom:       " $file.Name
Write-Host "Taille:    " $sizeMB "MB"
Write-Host "Bytes:     " $sizeBytes
Write-Host "Date:      " $file.LastWriteTime
Write-Host "=========================================="
Write-Host ""
Write-Host "Calcul du SHA512 en cours..."

$hash = (Get-FileHash -Path $exePath -Algorithm SHA512).Hash
$bytes = [byte[]] -split ($hash -replace '..', '0x$& ')
$base64 = [Convert]::ToBase64String($bytes)

Write-Host ""
Write-Host "SHA512 (Base64 pour latest.yml):"
Write-Host $base64
Write-Host ""
Write-Host "=========================================="
Write-Host "Copier ces valeurs dans latest.yml:"
Write-Host "=========================================="
Write-Host "version: 3.1.1"
Write-Host "sha512: $base64"
Write-Host "size: $sizeBytes"
Write-Host "=========================================="
