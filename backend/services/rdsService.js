// backend/services/rdsService.js - VERSION CORRIGÉE AVEC TRANSACTION BETTER-SQLITE3 ET PING TCP

const { exec } = require('child_process');
const iconv = require('iconv-lite');
const net = require('net'); // AJOUT: Module natif pour les connexions TCP
const path = require('path'); // AJOUT: Pour le script PowerShell externe
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

// Fonction utilitaire pour vérifier la connexion TCP
function checkTcpConnection(host, port, timeout = 2000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function refreshAndStoreRdsSessions() {
    const servers = configService.appConfig?.rds_servers || [];
    if (servers.length === 0) {
        console.warn('⚠️ Aucun serveur RDS configuré.');
        return { success: false, count: 0, error: "Aucun serveur RDS configuré." };
    }

    console.log(`🔍 Interrogation de ${servers.length} serveurs RDS...`);

    const promises = servers.map(server =>
        new Promise(async (resolve) => {
            // Étape 1: Vérification TCP rapide (Port 3389)
            const isOnline = await checkTcpConnection(server, 3389, 2000);
            if (!isOnline) {
                console.log(`   ⚠️ ${server} n'est pas accessible via TCP (3389). Ignoré.`);
                resolve([]);
                return;
            }

            console.log(`   → Tentative quser sur ${server}...`);
            // Étape 2: Exécution sécurisée de quser avec echo . | pour éviter les prompts
            exec(`echo . | quser /server:${server}`, { encoding: 'buffer', timeout: 8000 }, (error, stdout, stderr) => {
                const stderrStr = iconv.decode(stderr, 'cp850').trim();

                if (error && !stderrStr.includes('Aucun utilisateur')) {
                    if (!stderrStr.includes('Accès refusé') && !stderrStr.includes('Access is denied')) {
                        console.warn(`   ⚠️ Erreur quser pour ${server}:`, stderrStr || error.message);
                    }
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
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'get-rds-metrics.ps1');
        const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -serverName "${server}"`;

        exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erreur pingServer ${server}:`, error.message);
                // Fallback: check TCP if PowerShell fails
                checkTcpConnection(server, 3389).then(isOnline => {
                    resolve({
                        success: isOnline,
                        output: isOnline ? "En ligne (WMI inaccessible)" : "Hors ligne",
                        cpu: { usage: 0 },
                        ram: { usage: 0, total: 0, free: 0, used: 0 },
                        storage: { usage: 0, total: 0, free: 0, used: 0 }
                    });
                });
                return;
            }

            const trimmedOutput = stdout.trim();
            if (!trimmedOutput) {
                console.warn(`⚠️ Réponse vide de pingServer pour ${server}. Stderr: ${stderr}`);
                resolve({
                    success: false,
                    output: "Pas de données reçues",
                    cpu: { usage: 0 },
                    ram: { usage: 0, total: 0, free: 0, used: 0 },
                    storage: { usage: 0, total: 0, free: 0, used: 0 }
                });
                return;
            }

            try {
                const result = JSON.parse(trimmedOutput);
                resolve(result);
            } catch (parseError) {
                console.error(`❌ Erreur parsing JSON pingServer ${server}:`, parseError.message);
                console.debug(`   Contenu brut reçu: "${trimmedOutput}"`);
                resolve({
                    success: false,
                    output: "Erreur de lecture des données",
                    cpu: { usage: 0 },
                    ram: { usage: 0, total: 0, free: 0, used: 0 },
                    storage: { usage: 0, total: 0, free: 0, used: 0 }
                });
            }
        });
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
    checkTcpConnection
};