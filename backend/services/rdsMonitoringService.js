// backend/services/rdsMonitoringService.js - Monitoring RDS avancé avec alertes

const { PowerShell } = require('../../lib/powershellWrapper');
const EventEmitter = require('events');
const configService = require('./configService');
const { checkTcpConnection } = require('./rdsService'); // Import de la vérification TCP

class RDSMonitoringService extends EventEmitter {
    constructor() {
        super();
        this.monitoringInterval = null;
        this.alertThresholds = {
            diskSpaceGB: 5, // Alerte si moins de 5GB
            cpuPercent: 90, // Alerte si CPU > 90%
            memoryPercent: 85, // Alerte si RAM > 85%
        };
        this.monitoringFrequency = 60000; // Check toutes les 60s
        this.serverStats = new Map(); // Cache stats par serveur
        this.alertHistory = []; // Historique des alertes
        this.maxAlertHistory = 100;
    }

    /**
     * Démarrer le monitoring automatique
     */
    start() {
        if (this.monitoringInterval) {
            console.log('[RDSMonitoring] Déjà démarré');
            return;
        }

        console.log('[RDSMonitoring] Démarrage du monitoring...');
        this.monitoringInterval = setInterval(() => {
            this.checkAllServers().catch(err => {
                console.error('[RDSMonitoring] Erreur monitoring:', err);
            });
        }, this.monitoringFrequency);

        // Check immédiat au démarrage
        this.checkAllServers();
    }

    /**
     * Arrêter le monitoring
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('[RDSMonitoring] Monitoring arrêté');
        }
    }

    /**
     * Mettre à jour les seuils d'alerte
     */
    updateThresholds(thresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...thresholds };
        console.log('[RDSMonitoring] Seuils mis à jour:', this.alertThresholds);
        this.emit('thresholds_updated', this.alertThresholds);
    }

    /**
     * Obtenir les stats d'un serveur RDS
     */
    async getServerStats(serverName, domain, credential) {
        try {
            // Étape 1: Vérification TCP rapide
            const isOnline = await checkTcpConnection(serverName, 3389, 2000);
            if (!isOnline) {
                // Serveur hors ligne, on retourne une erreur silencieuse ou un statut hors ligne
                // Pour éviter de spammer les logs, on peut juste retourner success: false
                return { success: false, error: `Serveur ${serverName} injoignable (TCP 3389)` };
            }

            const ps = new PowerShell();

            // Script PowerShell pour obtenir stats complètes
            // Utilisation de SilentlyContinue pour éviter les popups d'erreur/auth
            const script = `
                $ErrorActionPreference = 'SilentlyContinue' 
                $server = '${serverName}'
                ${credential ? `$cred = Get-StoredCredential -Target '${credential}'` : ''}

                # CPU (via WMI)
                $cpu = Get-WmiObject Win32_Processor -ComputerName $server ${credential ? '-Credential $cred' : ''} -ErrorAction SilentlyContinue |
                    Measure-Object -Property LoadPercentage -Average |
                    Select-Object -ExpandProperty Average

                if ($null -eq $cpu) { $cpu = 0 }

                # Memory (via WMI)
                $os = Get-WmiObject Win32_OperatingSystem -ComputerName $server ${credential ? '-Credential $cred' : ''} -ErrorAction SilentlyContinue
                
                if ($null -ne $os) {
                    $totalMemoryGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
                    $freeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
                    $usedMemoryGB = $totalMemoryGB - $freeMemoryGB
                    $memoryPercent = [math]::Round(($usedMemoryGB / $totalMemoryGB) * 100, 2)
                } else {
                    $totalMemoryGB = 0; $freeMemoryGB = 0; $usedMemoryGB = 0; $memoryPercent = 0
                }

                # Disques (tous les volumes)
                $disks = Get-WmiObject Win32_LogicalDisk -ComputerName $server ${credential ? '-Credential $cred' : ''} -Filter "DriveType=3" -ErrorAction SilentlyContinue |
                    ForEach-Object {
                        @{
                            Drive = $_.DeviceID
                            TotalGB = [math]::Round($_.Size / 1GB, 2)
                            FreeGB = [math]::Round($_.FreeSpace / 1GB, 2)
                            UsedGB = [math]::Round(($_.Size - $_.FreeSpace) / 1GB, 2)
                            UsedPercent = [math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 2)
                        }
                    }
                
                if ($null -eq $disks) { $disks = @() }

                # Sessions actives (qwinsta peut prompter si accès refusé, on redirige stderr)
                $sessions = qwinsta /server:$server 2>$null | Select-String "Active" | Measure-Object | Select-Object -ExpandProperty Count
                if ($null -eq $sessions) { $sessions = 0 }

                # Résultat JSON
                @{
                    ServerName = $server
                    Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                    CPU = @{
                        Percent = $cpu
                    }
                    Memory = @{
                        TotalGB = $totalMemoryGB
                        UsedGB = $usedMemoryGB
                        FreeGB = $freeMemoryGB
                        UsedPercent = $memoryPercent
                    }
                    Disks = $disks
                    Sessions = @{
                        Active = $sessions
                    }
                } | ConvertTo-Json -Depth 10
            `;

            // Replace server placeholder and execute
            const fullScript = script.replace('$serverName', `'${serverName}'`);
            const stats = await ps.executeJson(fullScript);

            // Mettre à jour le cache
            this.serverStats.set(serverName, {
                ...stats,
                lastUpdate: new Date()
            });

            // Vérifier les alertes
            this.checkAlerts(serverName, stats);

            return { success: true, stats };

        } catch (error) {
            console.error(`[RDSMonitoring] Erreur stats ${serverName}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Vérifier toutes les alertes pour un serveur
     */
    checkAlerts(serverName, stats) {
        const alerts = [];

        // Alerte CPU
        if (stats.CPU.Percent > this.alertThresholds.cpuPercent) {
            alerts.push({
                type: 'cpu',
                severity: 'warning',
                message: `CPU élevé: ${stats.CPU.Percent}% (seuil: ${this.alertThresholds.cpuPercent}%)`,
                value: stats.CPU.Percent,
                threshold: this.alertThresholds.cpuPercent
            });
        }

        // Alerte Mémoire
        if (stats.Memory.UsedPercent > this.alertThresholds.memoryPercent) {
            alerts.push({
                type: 'memory',
                severity: 'warning',
                message: `Mémoire élevée: ${stats.Memory.UsedPercent}% (${stats.Memory.UsedGB} GB / ${stats.Memory.TotalGB} GB)`,
                value: stats.Memory.UsedPercent,
                threshold: this.alertThresholds.memoryPercent
            });
        }

        // Alerte Disque (CRITIQUE)
        stats.Disks.forEach(disk => {
            if (disk.FreeGB < this.alertThresholds.diskSpaceGB) {
                alerts.push({
                    type: 'disk',
                    severity: 'critical',
                    message: `⚠️ ESPACE DISQUE CRITIQUE ${disk.Drive}: ${disk.FreeGB} GB libres (seuil: ${this.alertThresholds.diskSpaceGB} GB)`,
                    value: disk.FreeGB,
                    threshold: this.alertThresholds.diskSpaceGB,
                    drive: disk.Drive,
                    totalGB: disk.TotalGB,
                    usedPercent: disk.UsedPercent
                });
            } else if (disk.FreeGB < this.alertThresholds.diskSpaceGB * 2) {
                // Warning si moins de 2x le seuil
                alerts.push({
                    type: 'disk',
                    severity: 'warning',
                    message: `Espace disque faible ${disk.Drive}: ${disk.FreeGB} GB libres`,
                    value: disk.FreeGB,
                    threshold: this.alertThresholds.diskSpaceGB * 2,
                    drive: disk.Drive
                });
            }
        });

        // Émettre les alertes
        if (alerts.length > 0) {
            const alert = {
                serverName,
                timestamp: new Date(),
                alerts,
                stats
            };

            this.addToAlertHistory(alert);
            this.emit('alert', alert);

            console.log(`[RDSMonitoring] 🚨 ${alerts.length} alerte(s) pour ${serverName}`);
            alerts.forEach(a => console.log(`  - ${a.severity.toUpperCase()}: ${a.message}`));
        }
    }

    /**
     * Ajouter alerte à l'historique
     */
    addToAlertHistory(alert) {
        this.alertHistory.unshift(alert);

        // Limiter la taille de l'historique
        if (this.alertHistory.length > this.maxAlertHistory) {
            this.alertHistory = this.alertHistory.slice(0, this.maxAlertHistory);
        }
    }

    /**
     * Vérifier tous les serveurs configurés
     */
    async checkAllServers() {
        const config = configService.getConfig();
        if (!config) {
            console.warn('[RDSMonitoring] Config not loaded yet');
            return;
        }
        const servers = config.rds_servers || [];

        console.log(`[RDSMonitoring] Check de ${servers.length} serveurs...`);

        const promises = servers.map(server =>
            this.getServerStats(server, config.domain, config.credential_target)
        );

        const results = await Promise.allSettled(promises);

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        console.log(`[RDSMonitoring] ✅ ${successCount}/${servers.length} serveurs vérifiés`);

        // Émettre événement avec résumé
        this.emit('monitoring_cycle_complete', {
            timestamp: new Date(),
            serversChecked: servers.length,
            successCount,
            alerts: this.getActiveAlerts()
        });
    }

    /**
     * Obtenir les alertes actives (dernières 24h)
     */
    getActiveAlerts() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.alertHistory.filter(a => a.timestamp > oneDayAgo);
    }

    /**
     * Obtenir stats en cache
     */
    getCachedStats(serverName) {
        return this.serverStats.get(serverName);
    }

    /**
     * Obtenir toutes les stats en cache
     */
    getAllCachedStats() {
        return Array.from(this.serverStats.values());
    }

    /**
     * Obtenir configuration actuelle
     */
    getConfig() {
        return {
            thresholds: this.alertThresholds,
            frequency: this.monitoringFrequency,
            isRunning: !!this.monitoringInterval,
            serversMonitored: this.serverStats.size,
            alertHistory: this.alertHistory.length
        };
    }
}

// Singleton
const monitoringService = new RDSMonitoringService();

module.exports = monitoringService;
