// Script pour vérifier les utilisateurs dans la base de données
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/rds_viewer_data.sqlite');
const db = new Database(dbPath);

console.log('📊 Vérification de la base de données app_users...\n');

try {
    const users = db.prepare('SELECT id, username, email, display_name, position, is_admin, is_active FROM app_users').all();

    console.log(`✅ Nombre d'utilisateurs trouvés: ${users.length}\n`);

    users.forEach(user => {
        console.log(`👤 ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Display Name: ${user.display_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Position: ${user.position}`);
        console.log(`   Admin: ${user.is_admin === 1 ? 'OUI' : 'NON'}`);
        console.log(`   Actif: ${user.is_active === 1 ? 'OUI' : 'NON'}`);
        console.log('');
    });

    // Vérifier les permissions
    console.log('\n🔐 Permissions:');
    const permissions = db.prepare('SELECT * FROM app_permissions').all();
    permissions.forEach(perm => {
        const user = users.find(u => u.id === perm.user_id);
        if (user) {
            console.log(`\n👤 ${user.display_name}:`);
            console.log(`   Dashboard: ${perm.can_access_dashboard}`);
            console.log(`   RDS Sessions: ${perm.can_access_rds_sessions}`);
            console.log(`   Servers: ${perm.can_access_servers}`);
            console.log(`   Users: ${perm.can_access_users}`);
            console.log(`   AD Groups: ${perm.can_access_ad_groups}`);
            console.log(`   Loans: ${perm.can_access_loans}`);
            console.log(`   DocuCortex: ${perm.can_access_docucortex}`);
        }
    });

} catch (error) {
    console.error('❌ Erreur:', error.message);
}

db.close();
