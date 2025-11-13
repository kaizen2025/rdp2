// backend/services/notificationScheduler.js
const { ipcMain } = require('electron');
const dataService = require('./dataService');
const rdsService = require('./rdsService');
const notificationService = require('./notificationService');
const configService = require('./configService');

let schedulerInterval = null;
let mainWindow = null;

const checkOverdueLoans = async () => {
    const loans = await dataService.getLoans();
    const overdueLoans = loans.filter(loan => loan.status === 'overdue' || loan.status === 'critical');

    for (const loan of overdueLoans) {
        const notification = {
            title: 'Prêt en retard',
            body: `Le prêt de ${loan.computerName} à ${loan.userDisplayName} est en retard.`,
            type: 'warning',
        };
        // Avoid sending the same notification repeatedly
        const existingNotif = await notificationService.findNotificationByContent(notification.body);
        if (!existingNotif) {
            await notificationService.createNotification(notification);
            if (mainWindow) {
                mainWindow.webContents.send('show-notification', notification);
            }
        }
    }
};

const checkServerStatus = async () => {
    const servers = configService.appConfig?.rds_servers || [];
    if (servers.length === 0) return;

    for (const server of servers) {
        const status = await rdsService.pingServer(server);
        if (!status.success) {
            const notification = {
                title: 'Serveur hors ligne',
                body: `Le serveur RDS "${server}" est hors ligne.`,
                type: 'error',
            };
            const existingNotif = await notificationService.findNotificationByContent(notification.body);
            if (!existingNotif) {
                await notificationService.createNotification(notification);
                if (mainWindow) {
                    mainWindow.webContents.send('show-notification', notification);
                }
            }
        } else if (status.cpu && status.cpu.usage > 90) {
            const notification = {
                title: 'Alerte CPU',
                body: `L'utilisation du CPU sur le serveur "${server}" est supérieure à 90%.`,
                type: 'warning',
            };
            const existingNotif = await notificationService.findNotificationByContent(notification.body);
            if (!existingNotif) {
                await notificationService.createNotification(notification);
                if (mainWindow) {
                    mainWindow.webContents.send('show-notification', notification);
                }
            }
        } else if (status.storage && status.storage.usage > 90) {
            const notification = {
                title: 'Alerte Stockage',
                body: `L'utilisation du stockage sur le serveur "${server}" est supérieure à 90%.`,
                type: 'warning',
            };
            const existingNotif = await notificationService.findNotificationByContent(notification.body);
            if (!existingNotif) {
                await notificationService.createNotification(notification);
                if (mainWindow) {
                    mainWindow.webContents.send('show-notification', notification);
                }
            }
        }
    }
};

const runChecks = async () => {
    console.log('Running scheduled checks...');
    await checkOverdueLoans();
    await checkServerStatus();
};

const start = (win) => {
    mainWindow = win;
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }
    // Run checks every 5 minutes
    schedulerInterval = setInterval(runChecks, 5 * 60 * 1000);
    // Also run checks on startup
    runChecks();
};

const stop = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
};

module.exports = {
    start,
    stop,
};
