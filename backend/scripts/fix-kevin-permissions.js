/**
 * Script pour corriger les permissions de Kevin (super_admin)
 */

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../data/rds_viewer_data.sqlite');
const db = new Database(dbPath);

console.log('🔧 Correction des permissions de Kevin BIVIA (super_admin)...\n');

// Kevin devrait avoir toutes les permissions
const updatePermissions = db.prepare(`
    UPDATE app_permissions
    SET
        can_access_dashboard = 1,
        can_access_rds_sessions = 1,
        can_access_servers = 1,
        can_access_users = 1,
        can_access_ad_groups = 1,
        can_access_loans = 1,
        can_access_docucortex = 1,
        can_manage_users = 1,
        can_manage_permissions = 1,
        can_view_reports = 1
    WHERE user_id = (SELECT id FROM app_users WHERE username = 'kevin_bivia')
`);

// Mettre Kevin en admin
const updateAdmin = db.prepare(`
    UPDATE app_users
    SET is_admin = 1
    WHERE username = 'kevin_bivia'
`);

updatePermissions.run();
updateAdmin.run();

console.log('✅ Permissions de Kevin mises à jour (super_admin = toutes permissions)');

// Vérifier
const user = db.prepare('SELECT id, username, display_name, is_admin FROM app_users WHERE username = ?').get('kevin_bivia');
const perms = db.prepare('SELECT * FROM app_permissions WHERE user_id = ?').get(user.id);

console.log(`\n✅ ${user.display_name} (Admin: ${user.is_admin ? 'Oui' : 'Non'})`);
console.log('   Permissions:');
console.log(`     - Dashboard: ${perms.can_access_dashboard ? '✓' : '✗'}`);
console.log(`     - Sessions RDS: ${perms.can_access_rds_sessions ? '✓' : '✗'}`);
console.log(`     - Serveurs: ${perms.can_access_servers ? '✓' : '✗'}`);
console.log(`     - Utilisateurs: ${perms.can_access_users ? '✓' : '✗'}`);
console.log(`     - Groupes AD: ${perms.can_access_ad_groups ? '✓' : '✗'}`);
console.log(`     - Prêts: ${perms.can_access_loans ? '✓' : '✗'}`);
console.log(`     - DocuCortex: ${perms.can_access_docucortex ? '✓' : '✗'}`);
console.log(`     - Gestion utilisateurs: ${perms.can_manage_users ? '✓' : '✗'}`);
console.log(`     - Gestion permissions: ${perms.can_manage_permissions ? '✓' : '✗'}`);

db.close();
console.log('\n✅ Terminé!');
