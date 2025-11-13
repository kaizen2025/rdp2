// Script pour vérifier la base de données de PRODUCTION
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ATTENTION : Vérifier la base de PRODUCTION sans modifier les données
const productionDbPath = '\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite';

console.log('🔍 VÉRIFICATION BASE DE DONNÉES DE PRODUCTION');
console.log('================================================\n');
console.log(`📂 Chemin: ${productionDbPath}\n`);

try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(productionDbPath)) {
        console.error('❌ ERREUR: La base de données de production n\'existe pas à ce chemin !');
        console.log('\nSur Windows, le chemin devrait être accessible.');
        console.log('Sur Linux/Mac, vous devez monter le partage réseau d\'abord.\n');
        process.exit(1);
    }

    console.log('✅ Base de données trouvée\n');

    // Ouvrir en mode READONLY pour ne RIEN modifier
    const db = new Database(productionDbPath, { readonly: true });

    // 1. Vérifier si les tables app_users existent
    console.log('🔍 Vérification des tables...\n');

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);

    console.log('📋 Tables existantes:', tableNames.join(', '));

    const hasAppUsers = tableNames.includes('app_users');
    const hasAppPermissions = tableNames.includes('app_permissions');
    const hasLoans = tableNames.includes('loans');

    console.log('\n📊 État des tables:');
    console.log(`   app_users: ${hasAppUsers ? '✅ Existe' : '❌ N\'existe pas'}`);
    console.log(`   app_permissions: ${hasAppPermissions ? '✅ Existe' : '❌ N\'existe pas'}`);
    console.log(`   loans: ${hasLoans ? '✅ Existe' : '❌ N\'existe pas'}`);

    // 2. Vérifier les utilisateurs app_users
    if (hasAppUsers) {
        console.log('\n👥 UTILISATEURS APP_USERS:');
        console.log('================================================\n');

        const users = db.prepare('SELECT id, username, display_name, email, is_admin, is_active FROM app_users').all();

        if (users.length === 0) {
            console.log('⚠️  AUCUN utilisateur dans app_users !');
            console.log('   → Il faut migrer les techniciens vers cette base.\n');
        } else {
            console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
            users.forEach(u => {
                console.log(`   👤 ${u.display_name} (${u.username})`);
                console.log(`      Email: ${u.email}`);
                console.log(`      Admin: ${u.is_admin === 1 ? 'OUI' : 'NON'}`);
                console.log(`      Actif: ${u.is_active === 1 ? 'OUI' : 'NON'}`);
                console.log('');
            });
        }
    }

    // 3. Vérifier les prêts en cours (CRITIQUE)
    if (hasLoans) {
        console.log('\n📦 PRÊTS EN COURS:');
        console.log('================================================\n');

        const activeLoans = db.prepare(`
            SELECT id, computerName, userDisplayName, loanDate, expectedReturnDate, status
            FROM loans
            WHERE status NOT IN ('returned', 'cancelled')
            ORDER BY loanDate DESC
        `).all();

        console.log(`✅ ${activeLoans.length} prêt(s) en cours:\n`);

        if (activeLoans.length > 0) {
            activeLoans.forEach(loan => {
                console.log(`   📦 ${loan.computerName} → ${loan.userDisplayName}`);
                console.log(`      Prêté le: ${loan.loanDate}`);
                console.log(`      Retour prévu: ${loan.expectedReturnDate}`);
                console.log(`      Statut: ${loan.status}`);
                console.log('');
            });

            console.log('\n⚠️  ATTENTION: Ne PAS supprimer ou remplacer cette base !');
            console.log('   Les prêts en cours doivent être préservés.\n');
        }
    }

    // 4. Statistiques générales
    console.log('\n📊 STATISTIQUES:');
    console.log('================================================\n');

    if (hasLoans) {
        const totalLoans = db.prepare('SELECT COUNT(*) as count FROM loans').get();
        console.log(`   Total de prêts historiques: ${totalLoans.count}`);
    }

    const computers = db.prepare('SELECT COUNT(*) as count FROM computers').get();
    console.log(`   Ordinateurs enregistrés: ${computers.count}`);

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`   Utilisateurs Excel: ${users.count}`);

    db.close();

    console.log('\n✅ Vérification terminée sans modification de la base.\n');

} catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
}
