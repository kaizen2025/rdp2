/**
 * Extension du service de base de donnees pour l'Agent IA
 * Gere les tables ai_*
 */

const dbService = require('../databaseService');
const fs = require('fs');
const path = require('path');

class AIDatabaseService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialise les tables AI avec migration automatique
     */
    initialize() {
        if (this.initialized) return;

        try {
            // Vérifier si la table existe et migrer si nécessaire
            this.migrateSchema();

            // Exécuter le schéma complet pour les tables qui n'existent pas
            const schemaPath = path.join(__dirname, '../../schemas/ai_schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf-8');

            try {
                dbService.exec(schema);
            } catch (error) {
                // Ignorer les erreurs "table already exists" ou "duplicate column"
                if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
                    throw error;
                }
            }

            this.initialized = true;
            console.log('✅ Tables IA initialisées avec succès');
        } catch (error) {
            console.error('❌ Erreur initialisation tables IA:', error);
            throw error;
        }
    }

    /**
     * Migre le schéma de la base de données si nécessaire
     */
    migrateSchema() {
        try {
            // Vérifier si la table ai_documents existe
            const tableExists = dbService.get(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='ai_documents'
            `);

            if (!tableExists) {
                console.log('ℹ️  Table ai_documents n\'existe pas, elle sera créée');
                return;
            }

            // Récupérer les colonnes actuelles de ai_documents
            const columns = dbService.all('PRAGMA table_info(ai_documents)');
            const columnNames = columns.map(col => col.name);

            console.log(`🔍 Vérification du schéma (${columnNames.length} colonnes existantes)`);

            // Liste des colonnes à ajouter si manquantes pour ai_documents
            const requiredColumns = [
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

            let migrationsApplied = 0;

            for (const col of requiredColumns) {
                if (!columnNames.includes(col.name)) {
                    console.log(`📝 Migration: Ajout de la colonne '${col.name}'`);
                    const sql = `ALTER TABLE ai_documents ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`;
                    dbService.run(sql);
                    migrationsApplied++;
                }
            }

            // ✅ NOUVEAU - Migration pour ai_conversations (is_pinned)
            const convColumns = dbService.all('PRAGMA table_info(ai_conversations)');
            const convColumnNames = convColumns.map(col => col.name);

            if (!convColumnNames.includes('is_pinned')) {
                console.log(`📝 Migration: Ajout de la colonne 'is_pinned' à ai_conversations`);
                dbService.run(`ALTER TABLE ai_conversations ADD COLUMN is_pinned INTEGER DEFAULT 0`);
                migrationsApplied++;
            }

            if (migrationsApplied > 0) {
                console.log(`✅ Migration terminée: ${migrationsApplied} colonne(s) ajoutée(s)`);

                // Créer les index pour les nouvelles colonnes
                this.createMissingIndexes();
            } else {
                console.log('✅ Schéma à jour, aucune migration nécessaire');
            }

        } catch (error) {
            console.error('❌ Erreur migration schéma:', error);
            // Ne pas throw, laisser l'initialisation continuer
        }
    }

    /**
     * Crée les index manquants
     */
    createMissingIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_documents_filepath ON ai_documents(filepath)',
            'CREATE INDEX IF NOT EXISTS idx_documents_category ON ai_documents(category)',
            'CREATE INDEX IF NOT EXISTS idx_documents_source ON ai_documents(source)',
            'CREATE INDEX IF NOT EXISTS idx_documents_document_type ON ai_documents(document_type)',
            'CREATE INDEX IF NOT EXISTS idx_documents_modified_date ON ai_documents(modified_date)'
        ];

        for (const indexSql of indexes) {
            try {
                dbService.run(indexSql);
            } catch (error) {
                // Ignorer les erreurs d'index existants
                if (!error.message.includes('already exists')) {
                    console.warn('⚠️ Erreur création index:', error.message);
                }
            }
        }

        console.log('✅ Index créés/vérifiés');
    }

    // ==================== DOCUMENTS ====================

    /**
     * Cree un nouveau document IA (avec support GED et reseau)
     */
    createAIDocument(data) {
        this.initialize();

        const stmt = dbService.prepare(`
            INSERT INTO ai_documents (
                filename, file_type, file_size, content, metadata, language,
                filepath, relative_path, category, document_type, tags,
                word_count, quality_score, author, modified_date, source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            data.filename,
            data.file_type,
            data.file_size,
            data.content,
            data.metadata,
            data.language || 'fr',
            data.filepath || null,
            data.relative_path || data.relativePath || null,
            data.category || null,
            data.document_type || null,
            data.tags || null,
            data.word_count || null,
            data.quality_score || null,
            data.author || null,
            data.modified_date || data.modifiedDate || null,
            data.source || 'uploaded'
        );

        return result.lastInsertRowid;
    }

    /**
     * Obtient un document par ID
     */
    getAIDocumentById(id) {
        this.initialize();
        return dbService.get('SELECT * FROM ai_documents WHERE id = ?', [id]);
    }

    /**
     * Obtient tous les documents
     */
    getAllAIDocuments(limit = 100, offset = 0) {
        this.initialize();
        return dbService.all(
            'SELECT * FROM ai_documents ORDER BY indexed_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
    }

    /**
     * Compte les documents
     */
    getAIDocumentsCount() {
        this.initialize();
        const result = dbService.get('SELECT COUNT(*) as count FROM ai_documents');
        return result ? result.count : 0;
    }

    /**
     * Supprime un document
     */
    deleteAIDocument(id) {
        this.initialize();
        const result = dbService.run('DELETE FROM ai_documents WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Supprime tous les documents
     */
    deleteAllAIDocuments() {
        this.initialize();
        dbService.run('DELETE FROM ai_documents');
        dbService.run('DELETE FROM ai_document_chunks');
    }

    /**
     * Met a jour un document
     */
    updateAIDocument(id, data) {
        this.initialize();
        const fields = [];
        const values = [];

        Object.keys(data).forEach(key => {
            fields.push(`${key} = ?`);
            values.push(data[key]);
        });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE ai_documents SET ${fields.join(', ')} WHERE id = ?`;
        const result = dbService.run(sql, values);
        
        return result.changes > 0;
    }

    // ==================== CHUNKS ====================

    /**
     * Cree un chunk de document
     */
    createAIDocumentChunk(data) {
        this.initialize();
        
        const stmt = dbService.prepare(`
            INSERT INTO ai_document_chunks (document_id, chunk_text, chunk_position, word_count, tfidf_vector)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            data.document_id,
            data.chunk_text,
            data.chunk_position,
            data.word_count,
            data.tfidf_vector || null
        );
        
        return result.lastInsertRowid;
    }

    /**
     * Obtient les chunks d'un document
     */
    getDocumentChunks(documentId) {
        this.initialize();
        return dbService.all(
            'SELECT * FROM ai_document_chunks WHERE document_id = ? ORDER BY chunk_position',
            [documentId]
        );
    }

    /**
     * Compte tous les chunks
     */
    getAIChunksCount() {
        this.initialize();
        const result = dbService.get('SELECT COUNT(*) as count FROM ai_document_chunks');
        return result ? result.count : 0;
    }

    // ==================== CONVERSATIONS ====================

    /**
     * Cree une conversation
     */
    createAIConversation(data) {
        this.initialize();
        
        const stmt = dbService.prepare(`
            INSERT INTO ai_conversations (
                session_id, user_message, ai_response, context_used,
                confidence_score, response_time_ms, language
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            data.session_id,
            data.user_message,
            data.ai_response,
            data.context_used,
            data.confidence_score,
            data.response_time_ms,
            data.language || 'fr'
        );
        
        return result.lastInsertRowid;
    }

    /**
     * Obtient les conversations d'une session
     */
    getAIConversationsBySession(sessionId, limit = 50) {
        this.initialize();
        return dbService.all(
            'SELECT * FROM ai_conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT ?',
            [sessionId, limit]
        );
    }

    /**
     * Obtient les conversations recentes
     */
    getRecentAIConversations(limit = 50) {
        this.initialize();
        return dbService.all(
            'SELECT * FROM ai_conversations ORDER BY created_at DESC LIMIT ?',
            [limit]
        );
    }

    /**
     * Compte les conversations
     */
    getAIConversationsCount() {
        this.initialize();
        const result = dbService.get('SELECT COUNT(*) as count FROM ai_conversations');
        return result ? result.count : 0;
    }

    /**
     * Met à jour le statut épinglé d'une conversation
     */
    updateConversationPinned(conversationId, isPinned) {
        this.initialize();
        const result = dbService.run(
            'UPDATE ai_conversations SET is_pinned = ? WHERE id = ?',
            [isPinned ? 1 : 0, conversationId]
        );
        return result.changes > 0;
    }

    /**
     * Supprime une conversation par ID
     */
    deleteConversation(conversationId) {
        this.initialize();
        const result = dbService.run(
            'DELETE FROM ai_conversations WHERE id = ?',
            [conversationId]
        );
        return result.changes > 0;
    }

    /**
     * Supprime les anciennes conversations
     */
    deleteOldConversations(daysOld = 30) {
        this.initialize();
        const result = dbService.run(
            `DELETE FROM ai_conversations
             WHERE created_at < datetime('now', '-' || ? || ' days')`,
            [daysOld]
        );
        return result.changes;
    }

    // ==================== PARAMETRES ====================

    /**
     * Obtient un parametre
     */
    getAISetting(key) {
        this.initialize();
        return dbService.get(
            'SELECT * FROM ai_settings WHERE setting_key = ?',
            [key]
        );
    }

    /**
     * Obtient tous les parametres
     */
    getAllAISettings() {
        this.initialize();
        return dbService.all('SELECT * FROM ai_settings ORDER BY setting_key');
    }

    /**
     * Met a jour un parametre
     */
    updateAISetting(key, value) {
        this.initialize();
        
        const stmt = dbService.prepare(`
            INSERT INTO ai_settings (setting_key, setting_value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(setting_key) 
            DO UPDATE SET setting_value = excluded.setting_value, 
                         updated_at = CURRENT_TIMESTAMP
        `);
        
        stmt.run(key, value);
    }

    // ==================== STATISTIQUES ====================

    /**
     * Met a jour les statistiques du jour
     */
    updateDailyStats(data) {
        this.initialize();
        
        const today = new Date().toISOString().split('T')[0];
        
        const stmt = dbService.prepare(`
            INSERT INTO ai_usage_stats (
                stat_date, total_queries, total_documents,
                avg_response_time_ms, avg_confidence_score
            ) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(stat_date)
            DO UPDATE SET
                total_queries = total_queries + excluded.total_queries,
                total_documents = excluded.total_documents,
                avg_response_time_ms = (avg_response_time_ms + excluded.avg_response_time_ms) / 2,
                avg_confidence_score = (avg_confidence_score + excluded.avg_confidence_score) / 2
        `);
        
        stmt.run(
            today,
            data.queries || 0,
            data.documents || 0,
            data.responseTime || 0,
            data.confidence || 0
        );
    }

    /**
     * Obtient les statistiques
     */
    getAIStats(days = 7) {
        this.initialize();
        return dbService.all(
            `SELECT * FROM ai_usage_stats 
             WHERE stat_date >= date('now', '-' || ? || ' days')
             ORDER BY stat_date DESC`,
            [days]
        );
    }

    // ==================== UTILITAIRES ====================

    /**
     * Recherche dans les documents
     */
    searchDocuments(query, limit = 10) {
        this.initialize();
        
        // Recherche simple par texte
        return dbService.all(
            `SELECT * FROM ai_documents 
             WHERE content LIKE ? OR filename LIKE ?
             ORDER BY indexed_at DESC LIMIT ?`,
            [`%${query}%`, `%${query}%`, limit]
        );
    }

    /**
     * Obtient les statistiques globales
     */
    getOverallStats() {
        this.initialize();
        
        return {
            documents: this.getAIDocumentsCount(),
            chunks: this.getAIChunksCount(),
            conversations: this.getAIConversationsCount(),
            avgDocumentSize: dbService.get(
                'SELECT AVG(LENGTH(content)) as avg FROM ai_documents'
            ),
            languageDistribution: dbService.all(
                'SELECT language, COUNT(*) as count FROM ai_documents GROUP BY language'
            )
        };
    }

    /**
     * Nettoie la base de donnees
     */
    cleanup() {
        this.initialize();
        
        const transaction = dbService.transaction(() => {
            // Supprimer les anciennes conversations (> 90 jours)
            const deletedConvs = this.deleteOldConversations(90);
            
            // Supprimer les statistiques anciennes (> 365 jours)
            const deletedStats = dbService.run(
                `DELETE FROM ai_usage_stats 
                 WHERE stat_date < date('now', '-365 days')`
            );
            
            // Vacuum pour recuperer l'espace
            dbService.exec('VACUUM');
            
            return {
                conversationsDeleted: deletedConvs,
                statsDeleted: deletedStats.changes
            };
        });
        
        return transaction();
    }
}

module.exports = new AIDatabaseService();
