-- Schema de base de donnees pour l'Agent IA Local

-- Table des documents indexes (avec support reseau et GED)
CREATE TABLE IF NOT EXISTS ai_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    content TEXT NOT NULL,
    metadata TEXT,
    language TEXT DEFAULT 'fr',
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Champs reseau et GED
    filepath TEXT,
    relative_path TEXT,
    category TEXT,
    document_type TEXT,
    tags TEXT,
    word_count INTEGER,
    quality_score REAL,
    author TEXT,
    modified_date DATETIME,
    source TEXT DEFAULT 'uploaded'
);

-- Table des chunks de documents (pour recherche vectorielle)
CREATE TABLE IF NOT EXISTS ai_document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_position INTEGER NOT NULL,
    word_count INTEGER,
    tfidf_vector TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES ai_documents(id) ON DELETE CASCADE
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    context_used TEXT,
    confidence_score REAL,
    response_time_ms INTEGER,
    language TEXT DEFAULT 'fr',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des parametres de l'IA
CREATE TABLE IF NOT EXISTS ai_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des statistiques d'utilisation
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    total_queries INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    avg_response_time_ms REAL,
    avg_confidence_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_documents_filename ON ai_documents(filename);
CREATE INDEX IF NOT EXISTS idx_documents_language ON ai_documents(language);
CREATE INDEX IF NOT EXISTS idx_documents_filepath ON ai_documents(filepath);
CREATE INDEX IF NOT EXISTS idx_documents_category ON ai_documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_source ON ai_documents(source);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON ai_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_modified_date ON ai_documents(modified_date);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON ai_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_settings_key ON ai_settings(setting_key);

-- Parametres par defaut
INSERT OR IGNORE INTO ai_settings (setting_key, setting_value, description) VALUES
    ('default_language', 'fr', 'Langue par defaut de l agent IA'),
    ('max_response_length', '500', 'Longueur maximale des reponses'),
    ('confidence_threshold', '0.5', 'Seuil de confiance minimum'),
    ('chunk_size', '1000', 'Taille des chunks de texte en mots'),
    ('top_k_results', '5', 'Nombre de resultats a considerer'),
    ('enable_ocr', 'true', 'Activer OCR pour images'),
    ('response_style', 'professional', 'Style de reponse: casual, professional, technical');
