#!/usr/bin/env node
/**
 * Script de migration de la base de donnees AI
 * Ajoute les colonnes manquantes pour le support GED et documents reseau
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../../data/rdp2.db');
const BACKUP_PATH = path.join(__dirname, '../../data/rdp2_backup_' + Date.now() + '.db');

console.log('=== Migration Base de Donnees AI ===\n');

// Verifier que la base existe
if (!fs.existsSync(DB_PATH)) {
    console.log('❌ Base de donnees introuvable:', DB_PATH);
    console.log('ℹ️  La base sera creee au premier demarrage de l\'application');
    process.exit(0);
}

try {
    // Backup de la base
    console.log('📦 Backup de la base de donnees...');
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log('✅ Backup cree:', BACKUP_PATH);

    // Ouvrir la base
    const db = new Database(DB_PATH);

    // Verifier si les colonnes existent deja
    console.log('\n🔍 Verification de la structure...');
    const tableInfo = db.prepare('PRAGMA table_info(ai_documents)').all();
    const columns = tableInfo.map(col => col.name);

    const newColumns = [
        { name: 'filepath', type: 'TEXT', default: 'NULL' },
        { name: 'relative_path', type: 'TEXT', default: 'NULL' },
        { name: 'category', type: 'TEXT', default: 'NULL' },
        { name: 'document_type', type: 'TEXT', default: 'NULL' },
        { name: 'tags', type: 'TEXT', default: 'NULL' },
        { name: 'word_count', type: 'INTEGER', default: 'NULL' },
        { name: 'quality_score', type: 'REAL', default: 'NULL' },
        { name: 'author', type: 'TEXT', default: 'NULL' },
        { name: 'modified_date', type: 'DATETIME', default: 'NULL' },
        { name: 'source', type: 'TEXT', default: "'uploaded'" }
    ];

    let columnsAdded = 0;

    console.log('\n📝 Ajout des colonnes manquantes...');
    for (const col of newColumns) {
        if (!columns.includes(col.name)) {
            try {
                const sql = `ALTER TABLE ai_documents ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`;
                db.prepare(sql).run();
                console.log(`✅ Colonne ajoutee: ${col.name} (${col.type})`);
                columnsAdded++;
            } catch (error) {
                console.error(`❌ Erreur ajout colonne ${col.name}:`, error.message);
            }
        } else {
            console.log(`ℹ️  Colonne deja presente: ${col.name}`);
        }
    }

    // Creer les index
    console.log('\n📊 Creation des index...');
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_documents_filepath ON ai_documents(filepath)',
        'CREATE INDEX IF NOT EXISTS idx_documents_category ON ai_documents(category)',
        'CREATE INDEX IF NOT EXISTS idx_documents_source ON ai_documents(source)',
        'CREATE INDEX IF NOT EXISTS idx_documents_document_type ON ai_documents(document_type)',
        'CREATE INDEX IF NOT EXISTS idx_documents_modified_date ON ai_documents(modified_date)'
    ];

    for (const indexSql of indexes) {
        try {
            db.prepare(indexSql).run();
            const indexName = indexSql.match(/idx_\w+/)[0];
            console.log(`✅ Index cree: ${indexName}`);
        } catch (error) {
            console.error(`❌ Erreur creation index:`, error.message);
        }
    }

    // Statistiques
    console.log('\n📈 Statistiques:');
    const stats = db.prepare('SELECT COUNT(*) as count FROM ai_documents').get();
    console.log(`   Documents existants: ${stats.count}`);

    // Fermer la base
    db.close();

    console.log('\n✅ Migration terminee avec succes!');
    if (columnsAdded > 0) {
        console.log(`   ${columnsAdded} colonne(s) ajoutee(s)`);
    } else {
        console.log('   Aucune modification necessaire');
    }
    console.log('\n📦 Backup disponible:', BACKUP_PATH);

} catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error(error.stack);

    // Restaurer le backup en cas d'erreur
    if (fs.existsSync(BACKUP_PATH)) {
        console.log('\n🔄 Restauration du backup...');
        fs.copyFileSync(BACKUP_PATH, DB_PATH);
        console.log('✅ Base restauree');
    }

    process.exit(1);
}
