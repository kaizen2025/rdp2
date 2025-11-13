-- Schema pour le système de gestion des utilisateurs et permissions

-- Table des utilisateurs de l'application
CREATE TABLE IF NOT EXISTS app_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,           -- Login (généralement email ou username AD)
    email TEXT UNIQUE NOT NULL,               -- Email
    display_name TEXT NOT NULL,               -- Nom complet
    position TEXT,                            -- Poste (ex: Technicien, Manager, Admin)
    password_hash TEXT NOT NULL,              -- Hash du mot de passe (bcrypt)
    is_admin INTEGER DEFAULT 0,               -- Super admin qui peut tout faire
    is_active INTEGER DEFAULT 1,              -- Utilisateur actif ou désactivé
    must_change_password INTEGER DEFAULT 1,   -- Doit changer le mdp à la prochaine connexion
    last_login DATETIME,                      -- Dernière connexion
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des permissions par onglet
CREATE TABLE IF NOT EXISTS app_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    -- Permissions pour chaque onglet (0 = pas accès, 1 = accès)
    can_access_dashboard INTEGER DEFAULT 1,
    can_access_rds_sessions INTEGER DEFAULT 0,
    can_access_servers INTEGER DEFAULT 0,
    can_access_users INTEGER DEFAULT 0,
    can_access_ad_groups INTEGER DEFAULT 0,
    can_access_loans INTEGER DEFAULT 0,
    can_access_docucortex INTEGER DEFAULT 0,

    -- Permissions additionnelles pour actions spécifiques
    can_manage_users INTEGER DEFAULT 0,        -- Gérer les utilisateurs de l'app
    can_manage_permissions INTEGER DEFAULT 0,   -- Modifier les permissions
    can_view_reports INTEGER DEFAULT 0,         -- Voir les rapports

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE(user_id)  -- Une seule ligne de permissions par utilisateur
);

-- Table d'audit des connexions
CREATE TABLE IF NOT EXISTS app_login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    login_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    failure_reason TEXT,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_is_active ON app_users(is_active);
CREATE INDEX IF NOT EXISTS idx_app_permissions_user_id ON app_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON app_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON app_login_history(login_timestamp);

-- Utilisateur admin par défaut (mot de passe: admin)
-- Hash bcrypt de "admin": $2b$10$N9qo8uLOickgx2ZMRZoMye1F.5IVs2y1nW0f1xjIhPEe/H.mjyLlW
INSERT OR IGNORE INTO app_users (id, username, email, display_name, position, password_hash, is_admin, must_change_password)
VALUES (1, 'admin', 'admin@anecoop.fr', 'Administrateur', 'Super Admin', '$2b$10$N9qo8uLOickgx2ZMRZoMye1F.5IVs2y1nW0f1xjIhPEe/H.mjyLlW', 1, 1);

-- Permissions complètes pour l'admin
INSERT OR IGNORE INTO app_permissions (
    user_id,
    can_access_dashboard, can_access_rds_sessions, can_access_servers,
    can_access_users, can_access_ad_groups, can_access_loans, can_access_docucortex,
    can_manage_users, can_manage_permissions, can_view_reports
)
VALUES (1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
