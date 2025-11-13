/**
 * Script de vérification de la migration
 */

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../data/rds_viewer_data.sqlite');
const db = new Database(dbPath);

console.log('📊 Vérification des utilisateurs migrés:\n');

const users = db.prepare('SELECT id, username, display_name, email, position, is_admin, is_active, must_change_password FROM app_users').all();

users.forEach(user => {
    console.log(`✅ ${user.display_name} (${user.username})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Position: ${user.position}`);
    console.log(`   Admin: ${user.is_admin ? 'Oui' : 'Non'}`);
    console.log(`   Actif: ${user.is_active ? 'Oui' : 'Non'}`);
    console.log(`   Doit changer mot de passe: ${user.must_change_password ? 'Oui' : 'Non'}`);

    const perms = db.prepare('SELECT * FROM app_permissions WHERE user_id = ?').get(user.id);
    if (perms) {
        console.log(`   Permissions:`);
        console.log(`     - Dashboard: ${perms.can_access_dashboard ? '✓' : '✗'}`);
        console.log(`     - Sessions RDS: ${perms.can_access_rds_sessions ? '✓' : '✗'}`);
        console.log(`     - Serveurs: ${perms.can_access_servers ? '✓' : '✗'}`);
        console.log(`     - Utilisateurs: ${perms.can_access_users ? '✓' : '✗'}`);
        console.log(`     - Groupes AD: ${perms.can_access_ad_groups ? '✓' : '✗'}`);
        console.log(`     - Prêts: ${perms.can_access_loans ? '✓' : '✗'}`);
        console.log(`     - DocuCortex: ${perms.can_access_docucortex ? '✓' : '✗'}`);
        console.log(`     - Gestion utilisateurs: ${perms.can_manage_users ? '✓' : '✗'}`);
        console.log(`     - Gestion permissions: ${perms.can_manage_permissions ? '✓' : '✗'}`);
    }
    console.log('');
});

db.close();
