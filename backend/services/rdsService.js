// backend/services/rdsService.js - VERSION CORRIGÉE AVEC TRANSACTION BETTER-SQLITE3 ET PING TCP

const { exec } = require('child_process');
const iconv = require('iconv-lite');
const net = require('net'); // AJOUT: Module natif pour les connexions TCP
const configService = require('./configService');
const db = require('./databaseService');

function parseQuserOutput(output, serverName) {
    const sessions = [];
    const lines = output.split(/[\r\n]+/).filter(line => {
        const lowerLine = line.toLowerCase();
        return line.trim() !== '' && !lowerLine.includes('utilisateur') && !lowerLine.includes('user name');
    });

    for (const line of lines) {
        try {
            const trimmedLine = line.trim().replace(/^>/, '').trim();
            const parts = trimmedLine.split(/\s+/);
            if (parts.length < 5) continue;

            const user = parts[0];
            let sessionName, id, state, idle, logonRaw;

            if (isNaN(parseInt(parts[1], 10))) {
                sessionName = parts[1];
                id = parts[2];
                state = parts[3];
                idle = parts[4];
                logonRaw = parts.slice(5).join(' ');
            } else {
                sessionName = '';
                id = parts[1];
                state = parts[2];
                idle = parts[3];
                logonRaw = parts.slice(4).join(' ');
            }

            let logonTime = null;
            const dateMatch = logonRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2})/);
            if (dateMatch) {
                const [, day, month, year, hours, minutes] = dateMatch;
                try {
                    const parsedDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
                    if (!isNaN(parsedDate.getTime())) logonTime = parsedDate.toISOString();
                } catch (e) {
                    console.warn("Erreur de parsing de date:", e);
                }
            }

            sessions.push({
                server: serverName,
                username: user,
                sessionName,
                sessionId: id,
                state,
                idle,
                logonTime,
                isActive: state && (state.toLowerCase() === 'actif' || state.toLowerCase() === 'active'),
            });
        } catch (e) {
            console.error(`Erreur analyse ligne quser sur ${serverName}: "${line}"`, e);
        }
    }
    return sessions;
}

async function refreshAndStoreRdsSessions() {
    const servers = configService.appConfig?.rds_servers || [];
    if (servers.length === 0) {
        console.warn('⚠️ Aucun serveur RDS configuré.');
        return { success: false, count: 0, error: "Aucun serveur RDS configuré." };
    }

    console.log(`🔍 Interrogation de ${servers.length} serveurs RDS...`);

    const promises = servers.map(server =>
        new Promise((resolve) => {
            console.log(`   → Tentative quser sur ${server}...`);
            exec(`quser /server:${server}`, { encoding: 'buffer', timeout: 8000, windowsHide: true }, (error, stdout, stderr) => {
                const stderrStr = iconv.decode(stderr, 'cp850').trim();

                if (error && !stderrStr.includes('Aucun utilisateur')) {
                    console.warn(`   ⚠️ Erreur quser pour ${server}:`, stderrStr || error.message);
                    resolve([]);
                    return;
                }

                const output = iconv.decode(stdout, 'cp850');
                const sessions = parseQuserOutput(output, server);
                console.log(`   ✅ ${server}: ${sessions.length} session(s) trouvée(s)`);
                resolve(sessions);
            });
        })
    );

    const results = await Promise.all(promises);
    const allSessions = results.flat();
    const now = new Date().toISOString();

    console.log(`📊 Total: ${allSessions.length} sessions récupérées`);

    try {
        const updateTransaction = db.prepare(`
            INSERT OR REPLACE INTO rds_sessions 
            (id, server, sessionId, username, sessionName, state, idleTime, logonTime, isActive, lastUpdate)
            VALUES (@id, @server, @sessionId, @username, @sessionName, @state, @idleTime, @logonTime, @isActive, @lastUpdate)
        `);

        const performUpdate = db.transaction((sessions) => {
            db.run('DELETE FROM rds_sessions');
            for (const session of sessions) {
                updateTransaction.run({
                    id: `${session.server}-${session.sessionId}`,
                    server: session.server,
                    sessionId: session.sessionId,
                    username: session.username,
                    sessionName: session.sessionName,
                    state: session.state,
                    idleTime: session.idle,
                    logonTime: session.logonTime,
                    isActive: session.isActive ? 1 : 0,
                    lastUpdate: now,
                });
            }
        });

        performUpdate(allSessions);

        console.log(`✅ ${allSessions.length} sessions RDS stockées dans la base de données.`);
        return { success: true, count: allSessions.length };

    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des sessions RDS:", error);
        throw error;
    }
}

async function getStoredRdsSessions() {
    try {
        const rows = db.all('SELECT * FROM rds_sessions ORDER BY server, username');
        return rows.map(s => ({
            ...s,
            isActive: !!s.isActive
        }));
    } catch (error) {
        console.error("❌ Erreur lecture sessions RDS:", error);
        return [];
    }
}

async function pingServer(server) {
    const getSystemDetails = () => new Promise((resolve, reject) => {
        // Script PowerShell OPTIMISÉ : toutes les requêtes en parallèle via CIM session
        const psScript = `
$ErrorActionPreference = 'Stop'
try {
    # ✅ OPTIMISATION: Utiliser une session CIM unique pour toutes les requêtes
    $session = New-CimSession -ComputerName '${server}' -OperationTimeoutSec 5 -ErrorAction Stop

    # ✅ OPTIMISATION: Récupérer toutes les données en parallèle avec jobs asynchrones
    $cpuJob = Get-CimInstance -CimSession $session -ClassName Win32_Processor -AsJob
    $osJob = Get-CimInstance -CimSession $session -ClassName Win32_OperatingSystem -AsJob
    $diskJob = Get-CimInstance -CimSession $session -ClassName Win32_LogicalDisk -Filter "DriveType=3" -AsJob

    # Attendre tous les jobs avec timeout
    $jobs = @($cpuJob, $osJob, $diskJob)
    Wait-Job -Job $jobs -Timeout 8 | Out-Null

    # Récupérer les résultats
    $cpu = Receive-Job -Job $cpuJob -ErrorAction SilentlyContinue | Select-Object -First 1
    $os = Receive-Job -Job $osJob -ErrorAction SilentlyContinue | Select-Object -First 1
    $disks = Receive-Job -Job $diskJob -ErrorAction SilentlyContinue

    # Nettoyer les jobs
    Remove-Job -Job $jobs -Force -ErrorAction SilentlyContinue
    Remove-CimSession -CimSession $session -ErrorAction SilentlyContinue

    # Calculer les métriques
    $cpuLoad = if ($cpu) { [math]::Round([double]$cpu.LoadPercentage, 2) } else { 0 }
    $ramTotal = if ($os) { [math]::Round([int64]$os.TotalVisibleMemorySize * 1024) } else { 0 }
    $ramFree = if ($os) { [math]::Round([int64]$os.FreePhysicalMemory * 1024) } else { 0 }
    $diskTotal = if ($disks) { ($disks | Measure-Object -Property Size -Sum).Sum } else { 0 }
    $diskFree = if ($disks) { ($disks | Measure-Object -Property FreeSpace -Sum).Sum } else { 0 }

    @{
        cpu = @{ usage = $cpuLoad }
        memory = @{ total = $ramTotal; free = $ramFree }
        storage = @{ total = $diskTotal; free = $diskFree }
    } | ConvertTo-Json -Compress
} catch {
    # En cas d'erreur, retourner un JSON avec l'erreur pour que JS puisse le lire proprement
    @{
        error = $_.Exception.Message
        cpu = @{ usage = 0 }
        memory = @{ total = 0; free = 0 }
        storage = @{ total = 0; free = 0 }
    } | ConvertTo-Json -Compress
    exit 0
}`;

        // Encoder le script en Base64 pour éviter les problèmes d'échappement
        const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');
        const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedScript}`;

        // ✅ OPTIMISATION: Réduire timeout de 15s à 10s grâce aux requêtes parallèles
        exec(command, { timeout: 10000, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[RDS] Erreur PowerShell pour ${server}:`, stderr || error.message);
                return reject(error);
            }

            try {
                const cleanOutput = stdout.trim();
                if (!cleanOutput) {
                    return reject(new Error('PowerShell n\'a retourné aucune donnée'));
                }

                const result = JSON.parse(cleanOutput);

                console.log(`[RDS] ✅ Métriques ${server} - CPU: ${result.cpu?.usage}%, RAM: ${(result.memory?.total / 1024 / 1024 / 1024).toFixed(2)}GB, Stockage: ${(result.storage?.total / 1024 / 1024 / 1024).toFixed(2)}GB`);

                resolve({
                    cpu: {
                        usage: result.cpu?.usage || 0
                    },
                    memory: {
                        total: result.memory?.total || 0,
                        free: result.memory?.free || 0
                    },
                    storage: {
                        total: result.storage?.total || 0,
                        free: result.storage?.free || 0
                    }
                });
            } catch (parseError) {
                console.error(`[RDS] Erreur parsing JSON pour ${server}:`, parseError.message, 'Output:', stdout);
                reject(new Error(`Erreur parsing JSON: ${parseError.message}`));
            }
        });
    });

    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);

        socket.on('connect', async () => {
            socket.destroy();
            try {
                const details = await getSystemDetails();
                resolve({
                    success: true,
                    output: `Le serveur ${server} est en ligne.`,
                    ...details
                });
            } catch (error) {
                resolve({
                    success: true,
                    output: `Le serveur ${server} est en ligne, mais les détails système n'ont pu être récupérés.`,
                    error: error.message
                });
            }
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ success: false, output: `Timeout: ${server} ne répond pas.` });
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve({ success: false, output: `Erreur de connexion à ${server}: ${err.message}` });
        });

        socket.connect(3389, server);
    });
}


async function sendMessage(server, sessionId, message) {
    return new Promise((resolve) => {
        const command = sessionId === '*'
            ? `msg * /server:${server} "${message.replace(/"/g, '""')}"`
            : `msg ${sessionId} /server:${server} "${message.replace(/"/g, '""')}"`;

        exec(command, (error) => {
            if (error) {
                console.error(`❌ Erreur envoi message vers ${server}:${sessionId}:`, error.message);
                resolve({ success: false, error: error.message });
            } else {
                console.log(`✅ Message envoyé vers ${server}:${sessionId}`);
                resolve({ success: true });
            }
        });
    });
}

module.exports = {
    refreshAndStoreRdsSessions,
    getStoredRdsSessions,
    pingServer,
    sendMessage,
};