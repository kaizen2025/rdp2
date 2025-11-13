// backend/services/technicianService.js - VERSION CORRIGÉE

const os = require('os');
const db = require('./databaseService');
const sessionState = require('./sessionState'); // Bien que sessionState soit côté Electron, on le garde pour la structure

// Cette fonction sera maintenant appelée périodiquement par le serveur
async function updateAllTechniciansPresence() {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        // Marque comme 'offline' les techniciens qui n'ont pas donné de signe de vie récemment
        db.run("UPDATE technician_presence SET status = 'offline' WHERE status = 'online' AND lastActivity < ?", [fiveMinutesAgo]);
    } catch (error) {
        console.error("Erreur lors du nettoyage des présences:", error);
    }
}

async function updateTechnicianPresence(technician, status) {
    if (!technician || !technician.id) return { success: false, error: "Données technicien invalides." };
    const now = new Date().toISOString();
    const currentPresence = db.get('SELECT loginTime FROM technician_presence WHERE id = ?', [technician.id]);
    const loginTime = (status === 'online' && currentPresence?.loginTime) ? currentPresence.loginTime : now;

    try {
        const sql = `REPLACE INTO technician_presence (id, name, avatar, position, status, hostname, loginTime, lastActivity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [technician.id, technician.name, technician.avatar, technician.position, status, os.hostname(), loginTime, now]);
        return { success: true };
    } catch (error) {
        console.error("Erreur updateTechnicianPresence:", error);
        return { success: false, error: error.message };
    }
}

async function registerTechnicianLogin(technician) {
    console.log(`✅ Enregistrement de la connexion pour ${technician.name}.`);
    return await updateTechnicianPresence(technician, 'online');
}

async function logoutTechnician(technicianId) {
    const technician = db.get('SELECT * FROM technician_presence WHERE id = ?', [technicianId]);
    if (technician) {
        console.log(`🔌 Enregistrement de la déconnexion pour ${technician.name}.`);
        return await updateTechnicianPresence(technician, 'offline');
    }
    return { success: true };
}

async function getConnectedTechnicians() {
    try {
        // On ne filtre plus par date ici, on laisse la tâche de fond le faire.
        // Cela permet de voir un technicien même si la tâche de fond n'est pas encore passée.
        const rows = db.all("SELECT * FROM technician_presence WHERE status = 'online'");
        return rows;
    } catch (error) {
        console.error("Erreur getConnectedTechnicians:", error);
        return [];
    }
}

async function saveTechnicianPhoto(technicianId, photoData) {
    try {
        db.run('UPDATE technician_presence SET photo = ? WHERE id = ?', [photoData, technicianId]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    registerTechnicianLogin,
    logoutTechnician,
    getConnectedTechnicians,
    updateTechnicianPresence,
    updateAllTechniciansPresence, // Exporter la nouvelle fonction
    saveTechnicianPhoto,
};