// backend/services/dataService.js - VERSION AVEC MODIFICATION DE PRÊT

const db = require('./databaseService');
const { generateId } = require('./utils');

const parseJSON = (field, defaultValue = null) => {
    if (field === null || field === undefined) return defaultValue;
    try { return JSON.parse(field) || defaultValue; } catch { return defaultValue; }
};
const stringifyJSON = (field) => {
    try { return JSON.stringify(field); } catch { return null; }
};

// ... (getComputers, saveComputer, deleteComputer, addComputerMaintenance restent identiques)
async function getComputers() {
    const rows = db.all('SELECT * FROM computers ORDER BY name ASC');
    return rows.map(c => ({ ...c, specifications: parseJSON(c.specifications, {}), warranty: parseJSON(c.warranty, {}), maintenanceHistory: parseJSON(c.maintenanceHistory, []) }));
}
async function saveComputer(computerData, technician) {
    const now = new Date().toISOString();
    const isUpdate = !!computerData.id;
    const id = isUpdate ? computerData.id : `pc_${Date.now()}`;
    const sql = isUpdate ? `UPDATE computers SET name=?, brand=?, model=?, serialNumber=?, status=?, notes=?, specifications=?, warranty=?, location=?, condition=?, assetTag=?, lastModified=?, modifiedBy=? WHERE id=?` : `INSERT INTO computers (id, name, brand, model, serialNumber, status, notes, specifications, warranty, location, condition, assetTag, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = isUpdate ? [ computerData.name, computerData.brand, computerData.model, computerData.serialNumber, computerData.status, computerData.notes, stringifyJSON(computerData.specifications), stringifyJSON(computerData.warranty), computerData.location, computerData.condition, computerData.assetTag, now, technician?.name, id ] : [ id, computerData.name, computerData.brand, computerData.model, computerData.serialNumber, computerData.status, computerData.notes, stringifyJSON(computerData.specifications), stringifyJSON(computerData.warranty), computerData.location, computerData.condition, computerData.assetTag, now, technician?.name ];
    try { db.run(sql, params); return { success: true }; } catch (error) { return { success: false, error: error.message }; }
}
async function deleteComputer(computerId, technician) {
    try { db.run('DELETE FROM computers WHERE id = ?', [computerId]); return { success: true }; } catch (error) { return { success: false, error: error.message }; }
}
async function addComputerMaintenance(computerId, maintenanceData, technician) {
    try {
        const computer = db.get('SELECT maintenanceHistory FROM computers WHERE id = ?', [computerId]);
        if (!computer) return { success: false, error: "Ordinateur non trouvé" };
        const history = parseJSON(computer.maintenanceHistory, []);
        const record = { id: `maint_${Date.now()}`, ...maintenanceData, performedBy: technician?.name || 'Unknown', date: new Date().toISOString() };
        history.push(record);
        db.run('UPDATE computers SET maintenanceHistory = ?, lastModified = ?, modifiedBy = ? WHERE id = ?', [ stringifyJSON(history), new Date().toISOString(), technician?.name, computerId ]);
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
}

function getDynamicLoanStatus(loan) {
    if (loan.status === 'returned' || loan.status === 'cancelled') return loan.status;
    if (loan.status === 'reserved' && new Date(loan.loanDate) > new Date()) return 'reserved';
    const now = new Date();
    const expectedReturn = new Date(loan.expectedReturnDate);
    const diffDays = Math.ceil((now - expectedReturn) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return 'critical';
    if (diffDays > 0) return 'overdue';
    return 'active';
}

async function getLoans() {
    // ✅ AMÉLIORATION: Tri par date de prêt la plus récente en premier
    const rows = db.all(`SELECT * FROM loans ORDER BY loanDate DESC`);
    return rows.map(l => ({ ...l, status: getDynamicLoanStatus(l), accessories: parseJSON(l.accessories, []), history: parseJSON(l.history, []), returnData: parseJSON(l.returnData, null) }));
}

async function createLoan(loanData, technician) {
    const id = `loan_${Date.now()}`;
    const now = new Date().toISOString();
    const history = [{ event: 'created', date: now, by: technician?.name, details: loanData }];
    const sql = `INSERT INTO loans (id, computerId, computerName, userName, userDisplayName, itStaff, loanDate, expectedReturnDate, status, notes, accessories, history, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        db.run(sql, [ id, loanData.computerId, loanData.computerName, loanData.userName, loanData.userDisplayName, loanData.itStaff, loanData.loanDate, loanData.expectedReturnDate, loanData.status, loanData.notes, stringifyJSON(loanData.accessories), stringifyJSON(history), now, technician?.name ]);
        db.run('UPDATE computers SET status = ? WHERE id = ?', [loanData.status === 'reserved' ? 'reserved' : 'loaned', loanData.computerId]);
        await addToLoanHistory({ ...loanData, eventType: 'created', by: technician?.name, byId: technician?.id, date: now, loanId: id });
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
}

// ✅ AMÉLIORATION: Nouvelle fonction pour modifier un prêt
async function updateLoan(loanId, loanData, technician) {
    const now = new Date().toISOString();
    const originalLoan = db.get('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (!originalLoan) return { success: false, error: 'Prêt non trouvé.' };

    const history = parseJSON(originalLoan.history, []);
    history.push({ event: 'updated', date: now, by: technician?.name, details: { old: originalLoan, new: loanData } });

    const sql = `UPDATE loans SET computerId=?, computerName=?, userName=?, userDisplayName=?, itStaff=?, loanDate=?, expectedReturnDate=?, notes=?, accessories=?, history=? WHERE id=?`;
    
    try {
        db.run(sql, [
            loanData.computerId, loanData.computerName, loanData.userName, loanData.userDisplayName,
            loanData.itStaff, loanData.loanDate, loanData.expectedReturnDate, loanData.notes,
            stringifyJSON(loanData.accessories), stringifyJSON(history), loanId
        ]);

        // Si l'ordinateur a changé, mettre à jour le statut des deux ordinateurs
        if (originalLoan.computerId !== loanData.computerId) {
            db.run('UPDATE computers SET status = ? WHERE id = ?', ['available', originalLoan.computerId]);
            db.run('UPDATE computers SET status = ? WHERE id = ?', [loanData.status === 'reserved' ? 'reserved' : 'loaned', loanData.computerId]);
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ... (le reste du fichier : returnLoan, extendLoan, cancelLoan, etc. reste identique)
async function returnLoan(loanId, technician, returnNotes, accessoryInfo) {
    const now = new Date().toISOString();
    const loan = db.get('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (!loan) return { success: false, error: 'Prêt non trouvé' };
    const history = parseJSON(loan.history, []);
    const returnData = { returnedAccessories: accessoryInfo.returnedAccessories || [], missingAccessories: (parseJSON(loan.accessories, [])).filter(id => !(accessoryInfo.returnedAccessories || []).includes(id)) };
    history.push({ event: 'returned', date: now, by: technician?.name, notes: returnNotes, details: returnData });
    try {
        db.run('UPDATE loans SET status = ?, actualReturnDate = ?, returnedBy = ?, notes = ?, history = ?, returnData = ? WHERE id = ?', ['returned', now, technician?.name, returnNotes, stringifyJSON(history), stringifyJSON(returnData), loanId]);
        db.run('UPDATE computers SET status = ? WHERE id = ?', ['available', loan.computerId]);
        await addToLoanHistory({ ...loan, eventType: 'returned', by: technician?.name, byId: technician?.id, date: now, loanId: loanId, details: { returnNotes, returnData } });
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
}
async function extendLoan(loanId, newReturnDate, reason, technician) {
    const now = new Date().toISOString();
    const loan = db.get('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (!loan) return { success: false, error: 'Prêt non trouvé' };
    const history = parseJSON(loan.history, []);
    history.push({ event: 'extended', date: now, by: technician?.name, reason });
    try {
        db.run('UPDATE loans SET expectedReturnDate = ?, extensionCount = extensionCount + 1, history = ? WHERE id = ?', [newReturnDate, stringifyJSON(history), loanId]);
        await addToLoanHistory({ ...loan, eventType: 'extended', by: technician?.name, byId: technician?.id, date: now, loanId: loanId, details: { reason, newReturnDate } });
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
}
async function cancelLoan(loanId, reason, technician) {
    const now = new Date().toISOString();
    const loan = db.get('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (!loan) return { success: false, error: 'Prêt non trouvé' };
    const history = parseJSON(loan.history, []);
    history.push({ event: 'cancelled', date: now, by: technician?.name, reason });
    try {
        db.run('UPDATE loans SET status = ?, history = ? WHERE id = ?', ['cancelled', stringifyJSON(history), loanId]);
        db.run('UPDATE computers SET status = ? WHERE id = ?', ['available', loan.computerId]);
        await addToLoanHistory({ ...loan, eventType: 'cancelled', by: technician?.name, byId: technician?.id, date: now, loanId: loanId, details: { reason } });
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
}
async function addToLoanHistory(event) {
    const id = `hist_${Date.now()}`;
    db.run('INSERT INTO loan_history (id, loanId, eventType, date, by, byId, computerId, computerName, userName, userDisplayName, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, event.loanId, event.eventType, event.date, event.by, event.byId, event.computerId, event.computerName, event.userName, event.userDisplayName, stringifyJSON(event.details)]);
}
async function getLoanHistory(filters = {}) {
    let query = 'SELECT * FROM loan_history WHERE 1=1';
    const params = [];
    if (filters.computerId) { query += ' AND computerId = ?'; params.push(filters.computerId); }
    if (filters.userName) { query += ' AND (userName = ? OR userDisplayName LIKE ?)'; params.push(filters.userName, `%${filters.userName}%`); }
    query += ' ORDER BY date DESC';
    if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
    const rows = db.all(query, params);
    return rows.map(r => ({ ...r, details: parseJSON(r.details, {}) }));
}
async function getLoanStatistics() {
    try {
        const computers = db.get(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available, SUM(CASE WHEN status = 'loaned' THEN 1 ELSE 0 END) as loaned, SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance FROM computers`);
        const allActiveLoans = await getLoans();
        const activeLoansStats = allActiveLoans.reduce((acc, loan) => { if (loan.status !== 'returned' && loan.status !== 'cancelled') { acc[loan.status] = (acc[loan.status] || 0) + 1; } return acc; }, {});
        const history = db.get(`SELECT COUNT(*) as totalLoans FROM loan_history WHERE eventType = 'created'`);
        const topUsers = db.all(`SELECT userDisplayName, COUNT(*) as count FROM loan_history WHERE eventType = 'created' GROUP BY userDisplayName ORDER BY count DESC LIMIT 5`);
        const topComputers = db.all(`SELECT computerName, COUNT(*) as count FROM loan_history WHERE eventType = 'created' GROUP BY computerName ORDER BY count DESC LIMIT 5`);
        return { computers: { total: computers.total || 0, available: computers.available || 0, loaned: computers.loaned || 0, maintenance: computers.maintenance || 0 }, loans: { active: activeLoansStats.active || 0, reserved: activeLoansStats.reserved || 0, overdue: activeLoansStats.overdue || 0, critical: activeLoansStats.critical || 0 }, history: { totalLoans: history.totalLoans || 0 }, topUsers: topUsers.map(u => ({ user: u.userDisplayName, count: u.count })), topComputers, };
    } catch (error) { console.error("Erreur statistiques:", error); return null; }
}
async function getLoanSettings() {
    const defaultSettings = { maxLoanDays: 90, maxExtensions: 3, reminderDaysBefore: [7, 3, 1], overdueReminderDays: [1, 3, 7], autoNotifications: true };
    const settingsRow = db.get("SELECT value FROM key_value_store WHERE key = 'loan_settings'");
    return settingsRow ? { ...defaultSettings, ...parseJSON(settingsRow.value, {}) } : defaultSettings;
}
async function updateLoanSettings(settings, technician) {
    const currentSettings = await getLoanSettings();
    const newSettings = { ...currentSettings, ...settings };
    db.run("INSERT OR REPLACE INTO key_value_store (key, value) VALUES ('loan_settings', ?)", [stringifyJSON(newSettings)]);
    return { success: true };
}

module.exports = {
    getComputers, saveComputer, deleteComputer, addComputerMaintenance,
    getLoans, createLoan, updateLoan, returnLoan, extendLoan, cancelLoan,
    getLoanHistory, getLoanStatistics,
    getLoanSettings, updateLoanSettings,
};