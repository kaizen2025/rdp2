#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de finalisation automatique de la migration SQLite
- Ajoute les routes manquantes dans server.js
- Crée les tables SQLite nécessaires
- Vérifie les dépendances npm
"""

import os
import sys
import re
import sqlite3
import subprocess
import json
from pathlib import Path

# Chemins
PROJECT_ROOT = Path(__file__).parent
SERVER_JS_PATH = PROJECT_ROOT / "server" / "server.js"
DB_PATH = PROJECT_ROOT / "database" / "docucortex.db"

# Routes à ajouter
ROUTES_TO_ADD = """
        // ✅ Routes utilisateurs RDS (SQLite)
        app.use('/api/users', require('../backend/routes/userRoutes'));

        // ✅ Routes chat
        app.use('/api/chat', require('../backend/routes/chatRoutes'));

        // ✅ Routes préférences
        app.use('/api/preferences', require('../backend/routes/preferencesRoutes'));
"""

# Schéma SQL des tables
SQL_SCHEMA = """
-- Tables pour le système de chat
CREATE TABLE IF NOT EXISTS chat_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private INTEGER DEFAULT 0,
    members TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited INTEGER DEFAULT 0,
    reactions TEXT,
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id)
);

-- Table pour les préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""


def print_status(message, status="INFO"):
    """Affiche un message formaté"""
    icons = {
        "INFO": "ℹ️",
        "SUCCESS": "✅",
        "ERROR": "❌",
        "WARNING": "⚠️"
    }
    print(f"{icons.get(status, 'ℹ️')} {message}")


def check_file_exists(filepath):
    """Vérifie si un fichier existe"""
    if not filepath.exists():
        print_status(f"Fichier non trouvé: {filepath}", "ERROR")
        return False
    return True


def add_routes_to_server_js():
    """Ajoute les routes manquantes dans server.js"""
    print_status("Ajout des routes dans server.js...", "INFO")
    
    if not check_file_exists(SERVER_JS_PATH):
        return False
    
    # Lire le fichier
    with open(SERVER_JS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifier si les routes sont déjà présentes
    if "require('../backend/routes/userRoutes')" in content:
        print_status("Routes déjà présentes dans server.js", "WARNING")
        return True
    
    # Trouver l'emplacement pour insérer les routes
    # On cherche après app.use('/api/notifications', notificationRoutes);
    pattern = r"(app\.use\('/api/notifications',\s*notificationRoutes\);)"
    
    if not re.search(pattern, content):
        print_status("Pattern d'insertion non trouvé dans server.js", "ERROR")
        return False
    
    # Insérer les routes
    new_content = re.sub(
        pattern,
        r"\1" + ROUTES_TO_ADD,
        content,
        count=1
    )
    
    # Sauvegarder avec backup
    backup_path = SERVER_JS_PATH.with_suffix('.js.backup_auto')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print_status(f"Backup créé: {backup_path}", "INFO")
    
    # Écrire le nouveau contenu
    with open(SERVER_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print_status("Routes ajoutées avec succès dans server.js", "SUCCESS")
    return True


def create_sqlite_tables():
    """Crée les tables SQLite manquantes"""
    print_status("Création des tables SQLite...", "INFO")
    
    # Créer le dossier database s'il n'existe pas
    db_dir = DB_PATH.parent
    db_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Connexion à la base de données
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Exécuter le schéma SQL
        cursor.executescript(SQL_SCHEMA)
        conn.commit()
        
        # Vérifier que les tables ont été créées
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = ['chat_channels', 'chat_messages', 'user_preferences']
        for table in required_tables:
            if table in tables:
                print_status(f"Table '{table}' créée/vérifiée", "SUCCESS")
            else:
                print_status(f"Table '{table}' manquante", "ERROR")
        
        conn.close()
        print_status(f"Base de données: {DB_PATH}", "INFO")
        return True
        
    except Exception as e:
        print_status(f"Erreur lors de la création des tables: {e}", "ERROR")
        return False


def check_npm_dependencies():
    """Vérifie et installe les dépendances npm manquantes"""
    print_status("Vérification des dépendances npm...", "INFO")
    
    required_packages = ['xlsx', 'multer', 'sqlite3']
    missing_packages = []
    
    try:
        # Vérifier package.json
        package_json_path = PROJECT_ROOT / "package.json"
        if package_json_path.exists():
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                dependencies = {**package_data.get('dependencies', {}), 
                              **package_data.get('devDependencies', {})}
            
            for pkg in required_packages:
                if pkg not in dependencies:
                    missing_packages.append(pkg)
                    print_status(f"Package manquant: {pkg}", "WARNING")
                else:
                    print_status(f"Package trouvé: {pkg}", "SUCCESS")
        
        if missing_packages:
            print_status(f"Installation des packages manquants: {', '.join(missing_packages)}", "INFO")
            # Note: On ne fait que signaler, l'utilisateur pourra lancer npm install
            return missing_packages
        
        return []
        
    except Exception as e:
        print_status(f"Erreur lors de la vérification npm: {e}", "ERROR")
        return []


def verify_backend_routes():
    """Vérifie que les fichiers de routes backend existent"""
    print_status("Vérification des fichiers de routes backend...", "INFO")
    
    routes = [
        PROJECT_ROOT / "backend" / "routes" / "userRoutes.js",
        PROJECT_ROOT / "backend" / "routes" / "chatRoutes.js",
        PROJECT_ROOT / "backend" / "routes" / "preferencesRoutes.js"
    ]
    
    all_exist = True
    for route_file in routes:
        if route_file.exists():
            print_status(f"Route trouvée: {route_file.name}", "SUCCESS")
        else:
            print_status(f"Route manquante: {route_file.name}", "ERROR")
            all_exist = False
    
    return all_exist


def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("🚀 FINALISATION MIGRATION SQLITE - AUTOMATIQUE")
    print("="*60 + "\n")
    
    success = True
    
    # 1. Vérifier les routes backend
    if not verify_backend_routes():
        print_status("Certaines routes backend sont manquantes!", "ERROR")
        success = False
    
    # 2. Ajouter les routes dans server.js
    if not add_routes_to_server_js():
        success = False
    
    # 3. Créer les tables SQLite
    if not create_sqlite_tables():
        success = False
    
    # 4. Vérifier les dépendances npm
    missing_packages = check_npm_dependencies()
    
    # Résumé final
    print("\n" + "="*60)
    if success and not missing_packages:
        print_status("MIGRATION FINALISÉE AVEC SUCCÈS!", "SUCCESS")
        print("\n📋 Prochaines étapes:")
        print("   1. Redémarrer le serveur backend")
        print("   2. Vérifier la console pour les erreurs")
        print("   3. Tester les endpoints: /api/users, /api/chat, /api/preferences")
    elif missing_packages:
        print_status("Migration presque terminée", "WARNING")
        print("\n📋 Action requise:")
        print(f"   Installer les packages manquants: npm install {' '.join(missing_packages)}")
        print("   Puis redémarrer le serveur")
    else:
        print_status("Erreurs détectées lors de la migration", "ERROR")
        print("\n📋 Consultez les messages ci-dessus pour plus de détails")
    
    print("="*60 + "\n")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
