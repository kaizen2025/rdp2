// add_routes.js - Script Node.js robuste pour ajouter les routes
const fs = require('fs');
const path = require('path');

const SERVER_JS_PATH = path.join(__dirname, 'server', 'server.js');

const ROUTES_TO_ADD = `
        // ✅ Routes utilisateurs RDS (SQLite)
        app.use('/api/users', require('../backend/routes/userRoutes'));

        // ✅ Routes chat
        app.use('/api/chat', require('../backend/routes/chatRoutes'));

        // ✅ Routes préférences
        app.use('/api/preferences', require('../backend/routes/preferencesRoutes'));
`;

console.log('📝 Lecture de server.js...');
const content = fs.readFileSync(SERVER_JS_PATH, 'utf8');

// Vérifier si les routes sont déjà présentes
if (content.includes("require('../backend/routes/userRoutes')")) {
    console.log('⚠️  Routes déjà présentes dans server.js');
    process.exit(0);
}

// Trouver la ligne après app.use('/api/notifications', notificationRoutes);
const lines = content.split('\n');
let insertIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("app.use('/api/notifications', notificationRoutes);")) {
        insertIndex = i + 1;
        break;
    }
}

if (insertIndex === -1) {
    console.error('❌ Pattern non trouvé dans server.js');
    process.exit(1);
}

// Créer backup
const backupPath = SERVER_JS_PATH + '.backup_' + Date.now();
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup créé: ${backupPath}`);

// Insérer les routes  
lines.splice(insertIndex, 0, ROUTES_TO_ADD);

// Aussi mettre à jour le console.log à la fin
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("console.log('✅ Routes API configurées")) {
        lines[i] = lines[i].replace(
            'auth + notifications',
            'auth + notifications + users + chat + preferences'
        );
        break;
    }
}

// Écrire le fichier
const newContent = lines.join('\n');
fs.writeFileSync(SERVER_JS_PATH, newContent, 'utf8');

console.log('✅ Routes ajoutées avec succès dans server.js');
console.log('📋 Routes ajoutées:');
console.log('   - /api/users');
console.log('   - /api/chat');
console.log('   - /api/preferences');
