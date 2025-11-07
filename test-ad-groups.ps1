# ========================================
# Script de diagnostic AD - Groupes VPN et Sortants_responsables
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DIAGNOSTIC GROUPES AD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour mesurer le temps d'exécution
function Measure-AdOperation {
    param(
        [string]$OperationName,
        [scriptblock]$Operation
    )

    Write-Host "🔍 Test: $OperationName" -ForegroundColor Yellow
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $result = & $Operation
        $stopwatch.Stop()
        $elapsed = $stopwatch.Elapsed.TotalSeconds

        if ($elapsed -lt 5) {
            Write-Host "   ✅ Temps: $($elapsed.ToString('0.00'))s - OK" -ForegroundColor Green
        } elseif ($elapsed -lt 10) {
            Write-Host "   ⚠️  Temps: $($elapsed.ToString('0.00'))s - Lent" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Temps: $($elapsed.ToString('0.00'))s - TROP LENT" -ForegroundColor Red
        }

        return $result
    }
    catch {
        $stopwatch.Stop()
        Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
        return $null
    }
}

# Import du module AD
Write-Host "📦 Import du module ActiveDirectory..." -ForegroundColor Cyan
try {
    Import-Module ActiveDirectory -ErrorAction Stop
    Write-Host "   ✅ Module chargé" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Impossible de charger le module AD" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Liste des groupes à tester
$groupsToTest = @("VPN", "Sortants_responsables")

foreach ($groupName in $groupsToTest) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " GROUPE: $groupName" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Test 1: Le groupe existe-t-il ?
    $group = Measure-AdOperation "Vérifier existence du groupe" {
        Get-ADGroup -Identity $groupName -ErrorAction SilentlyContinue
    }

    if (-not $group) {
        Write-Host "❌ Le groupe '$groupName' n'existe pas ou n'est pas accessible" -ForegroundColor Red
        Write-Host ""
        continue
    }

    Write-Host "   📋 DN: $($group.DistinguishedName)" -ForegroundColor Gray
    Write-Host ""

    # Test 2: Compter les membres directs (sans récursivité)
    Write-Host "👥 MEMBRES DIRECTS (non récursif)" -ForegroundColor Cyan
    $directMembers = Measure-AdOperation "Compter membres directs" {
        Get-ADGroupMember -Identity $groupName | Measure-Object
    }

    if ($directMembers) {
        $directCount = $directMembers.Count
        Write-Host "   📊 Nombre de membres directs: $directCount" -ForegroundColor White
    }
    Write-Host ""

    # Test 3: Compter les membres récursifs
    Write-Host "👥 MEMBRES RÉCURSIFS (tous les sous-groupes)" -ForegroundColor Cyan
    $recursiveMembers = Measure-AdOperation "Compter membres récursifs" {
        Get-ADGroupMember -Identity $groupName -Recursive | Measure-Object
    }

    if ($recursiveMembers) {
        $recursiveCount = $recursiveMembers.Count
        Write-Host "   📊 Nombre total (récursif): $recursiveCount" -ForegroundColor White

        if ($recursiveCount -gt 1000) {
            Write-Host "   ⚠️  ATTENTION: Plus de 1000 membres - c'est probablement la cause du timeout!" -ForegroundColor Yellow
        }
    }
    Write-Host ""

    # Test 4: Récupérer uniquement les utilisateurs (pas les groupes/ordinateurs)
    Write-Host "👤 UTILISATEURS UNIQUEMENT" -ForegroundColor Cyan
    $userMembers = Measure-AdOperation "Filtrer uniquement les utilisateurs" {
        Get-ADGroupMember -Identity $groupName -Recursive |
            Where-Object { $_.objectClass -eq 'user' } |
            Measure-Object
    }

    if ($userMembers) {
        $userCount = $userMembers.Count
        Write-Host "   📊 Nombre d'utilisateurs: $userCount" -ForegroundColor White
    }
    Write-Host ""

    # Test 5: Récupérer les détails des 5 premiers utilisateurs (test complet)
    Write-Host "📝 DÉTAILS DES UTILISATEURS (5 premiers)" -ForegroundColor Cyan
    $userDetails = Measure-AdOperation "Récupérer détails utilisateurs" {
        Get-ADGroupMember -Identity $groupName -Recursive |
            Where-Object { $_.objectClass -eq 'user' } |
            Select-Object -First 5 |
            Get-ADUser -Properties DisplayName |
            Select-Object SamAccountName, Name, DisplayName
    }

    if ($userDetails) {
        Write-Host "   ✅ Échantillon récupéré:" -ForegroundColor Green
        $userDetails | ForEach-Object {
            Write-Host "      • $($_.DisplayName) ($($_.SamAccountName))" -ForegroundColor Gray
        }
    }
    Write-Host ""

    # Test 6: Test COMPLET comme dans l'application (avec timeout simulé)
    Write-Host "🎯 SIMULATION REQUÊTE APPLICATION (comme dans le code)" -ForegroundColor Cyan
    Write-Host "   ⏱️  Limite: 15 secondes" -ForegroundColor Yellow

    $job = Start-Job -ScriptBlock {
        param($grp)
        Import-Module ActiveDirectory
        Get-ADGroupMember -Identity $grp -Recursive |
            Where-Object { $_.objectClass -eq 'user' } |
            Get-ADUser -Properties DisplayName |
            Select-Object SamAccountName, Name, DisplayName |
            ConvertTo-Json -Compress
    } -ArgumentList $groupName

    $completed = Wait-Job -Job $job -Timeout 15

    if ($completed) {
        $result = Receive-Job -Job $job
        $members = $result | ConvertFrom-Json
        $count = if ($members -is [Array]) { $members.Count } else { 1 }

        Write-Host "   ✅ SUCCÈS - $count utilisateur(s) récupéré(s) en moins de 15s" -ForegroundColor Green

        if ($members -is [Array] -and $members.Count -le 10) {
            Write-Host "   📋 Liste complète:" -ForegroundColor Gray
            $members | ForEach-Object {
                Write-Host "      • $($_.DisplayName) ($($_.SamAccountName))" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   ❌ TIMEOUT - La requête a dépassé 15 secondes" -ForegroundColor Red
        Write-Host "   💡 C'est exactement le problème rencontré dans l'application!" -ForegroundColor Yellow
        Stop-Job -Job $job
    }

    Remove-Job -Job $job -Force
    Write-Host ""

    # Recommandations
    Write-Host "💡 RECOMMANDATIONS" -ForegroundColor Cyan
    if ($recursiveCount -and $recursiveCount -gt 500) {
        Write-Host "   1. Le groupe est très volumineux ($recursiveCount membres)" -ForegroundColor Yellow
        Write-Host "   2. Augmenter le timeout de 15s à 30s ou 60s" -ForegroundColor Yellow
        Write-Host "   3. Implémenter une pagination" -ForegroundColor Yellow
        Write-Host "   4. Cacher les résultats plus longtemps (1h au lieu de 5min)" -ForegroundColor Yellow
    } elseif ($completed) {
        Write-Host "   ✅ Le groupe fonctionne correctement" -ForegroundColor Green
        Write-Host "   💡 Le problème peut être temporaire (charge serveur AD)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Investiguer la performance du serveur AD" -ForegroundColor Yellow
        Write-Host "   💡 Contacter l'administrateur AD" -ForegroundColor Gray
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " FIN DU DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 RÉSUMÉ:" -ForegroundColor White
Write-Host "   • Si timeout > 15s: Augmenter le timeout dans adService.js (ligne 77)" -ForegroundColor Gray
Write-Host "   • Si > 1000 membres: Implémenter pagination" -ForegroundColor Gray
Write-Host "   • Si AD lent: Optimiser ou cacher plus longtemps" -ForegroundColor Gray
Write-Host ""
