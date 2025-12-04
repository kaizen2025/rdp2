$file = Get-Item "dist\RDS Viewer-3.1.0-Portable.exe"
$sizeMB = [math]::Round($file.Length/1MB,2)
$sizeBytes = $file.Length

Write-Host "=========================================="
Write-Host "Informations du fichier .exe"
Write-Host "=========================================="
Write-Host "Nom:       " $file.Name
Write-Host "Taille:    " $sizeMB "MB"
Write-Host "Bytes:     " $sizeBytes
Write-Host "Date:      " $file.LastWriteTime
Write-Host "=========================================="
Write-Host ""
Write-Host "Calcul du SHA512 en cours..."
Write-Host ""

$hash = (Get-FileHash -Path "dist\RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512).Hash

Write-Host "SHA512 (Hex):"
Write-Host $hash
Write-Host ""

# Convertir en Base64 pour latest.yml
$bytes = [byte[]] -split ($hash -replace '..', '0x$& ')
$base64 = [Convert]::ToBase64String($bytes)

Write-Host "SHA512 (Base64 pour latest.yml):"
Write-Host $base64
Write-Host ""
Write-Host "=========================================="
Write-Host "Valeurs pour latest.yml:"
Write-Host "=========================================="
Write-Host "sha512: $base64"
Write-Host "size: $sizeBytes"
Write-Host "=========================================="
