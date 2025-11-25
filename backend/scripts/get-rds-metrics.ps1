# Script PowerShell pour récupérer les métriques RDS
# Appelé par rdsService.js
param([string]$serverName)

try {
    $cpu = Get-WmiObject Win32_Processor -ComputerName $serverName -ErrorAction Stop | 
        Measure-Object -Property LoadPercentage -Average | 
        Select-Object -ExpandProperty Average
    
    $os = Get-WmiObject Win32_OperatingSystem -ComputerName $serverName -ErrorAction Stop
    $totalRAM = $os.TotalVisibleMemorySize * 1KB
    $freeRAM = $os.FreePhysicalMemory * 1KB
    $usedRAM = $totalRAM - $freeRAM
    $ramUsage = if ($totalRAM -gt 0) { ($usedRAM / $totalRAM) * 100 } else { 0 }

    $disk = Get-WmiObject Win32_LogicalDisk -ComputerName $serverName -Filter "DeviceID='C:'" -ErrorAction Stop
    $diskTotal = $disk.Size
    $diskFree = $disk.FreeSpace
    $diskUsed = $diskTotal - $diskFree
    $diskUsage = if ($diskTotal -gt 0) { ($diskUsed / $diskTotal) * 100 } else { 0 }

    $result = @{
        success = $true
        cpu = @{ usage = $cpu }
        ram = @{ usage = $ramUsage; total = $totalRAM; free = $freeRAM; used = $usedRAM }
        storage = @{ total = $diskTotal; free = $diskFree; used = $diskUsed; usage = $diskUsage }
        output = "Serveur en ligne"
    }
} catch {
    $result = @{ 
        success = $false
        output = "Erreur WMI: " + $_.Exception.Message
        error = $_.Exception.Message
    }
}

$result | ConvertTo-Json -Compress
