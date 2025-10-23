# Diagnostic et Solutions - Projet RDP Viewer

## 🔴 Problèmes Critiques Résolus

### 1. ERR_INSUFFICIENT_RESOURCES - Boucle Infinie (✅ RÉSOLU)

**Symptômes:**
- Milliers de requêtes vers `/api/loans/history?limit=5`
- Erreur `ERR_INSUFFICIENT_RESOURCES`
- Console saturée de logs
- Application inutilisable

**Cause Racine:**
Le hook `useDataFetching.js` incluait `fetchFunction` dans les dépendances de `useCallback` et `useEffect`, créant une boucle infinie car cette fonction était recréée à chaque render.

**Solution Appliquée:**
```javascript
// AVANT (❌ Boucle infinie)
const fetchData = useCallback(async () => {
    const result = await fetchFunction();
    setData(result);
}, [fetchFunction]); // ❌ fetchFunction change à chaque render

// APRÈS (✅ Stable)
const fetchFunctionRef = useRef(fetchFunction);
useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
}, [fetchFunction]);

const fetchData = async () => {
    const result = await fetchFunctionRef.current(); // ✅ Référence stable
    setData(result);
};
```

**Fichier modifié:** `src/hooks/useDataFetching.js`

---

## 🟡 Problèmes Identifiés (Nécessitent Action)

### 2. Techniciens Connectés (0)

**Symptômes:**
- Widget "Techniciens Connectés" affiche toujours 0
- L'utilisateur connecté n'apparaît pas dans la liste

**Diagnostic:**
1. ✅ Le code d'enregistrement existe: `LoginPage.js:73` appelle `apiService.login()`
2. ✅ L'endpoint backend existe: `apiRoutes.js:41` appelle `registerTechnicianLogin()`
3. ✅ Le service enregistre dans la BDD: `technicianService.js:34-36`

**Causes Possibles:**

#### A. Base de données non accessible
Le fichier SQLite doit être à ce chemin réseau :
```
\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\rds_viewer_data.sqlite
```

**Vérifications à faire:**
```bash
# Depuis le serveur backend
node -e "console.log(require('./backend/services/configService').appConfig.databasePath)"

# Vérifier que le fichier existe
ls -la "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite"
```

#### B. Serveur backend non démarré
Le backend doit tourner sur `http://localhost:3002`

**Démarrage:**
```bash
node server/server.js
# Ou en développement:
npm run dev
```

#### C. Permissions réseau
L'utilisateur qui exécute le serveur Node.js doit avoir accès en lecture/écriture au partage réseau `\\192.168.1.230\Donnees\...`

**Test de connexion:**
```bash
# Dans la console Node.js du backend, chercher cette ligne:
✅ Base de données SQLite connectée : \\192.168.1.230\Donnees\...
```

#### D. Vérification SQL directe
Connectez-vous à la base de données SQLite et vérifiez:

```bash
# Installer sqlite3 si nécessaire
npm install -g sqlite3

# Se connecter (adapter le chemin)
sqlite3 "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite"

# Vérifier la table
SELECT * FROM technician_presence WHERE status = 'online';

# Voir toutes les entrées
SELECT * FROM technician_presence;
```

**Solution:**
1. Vérifier que le serveur backend est bien démarré
2. Vérifier les logs du serveur lors de la connexion
3. Vérifier les permissions réseau
4. Tester l'API directement: `http://localhost:3002/api/technicians/connected`

---

### 3. Connexion Shadow/RDP Échoue

**Symptômes:**
```
WebSocket connection to 'ws://localhost:8080/guacamole/websocket-tunnel' failed:
WebSocket is closed before the connection is established.
```

**Cause:**
Le serveur Apache Guacamole n'est PAS démarré sur `localhost:8080`

**Configuration Requise:**

Guacamole doit être installé et configuré avec:

#### A. Installation Guacamole
```bash
# Docker (recommandé)
docker run -d -p 8080:8080 \
  -v /path/to/drive:/drive:ro \
  --name guacamole \
  guacamole/guacamole

# Ou installation manuelle
# Suivre: https://guacamole.apache.org/doc/gug/installing-guacamole.html
```

#### B. Configuration guacamole.properties
Fichier: `/etc/guacamole/guacamole.properties`
```properties
# Extension d'authentification JSON (obligatoire pour les tokens JWT)
auth-provider: net.sourceforge.guacamole.net.auth.json.JSONAuthenticationProvider

# Clé secrète (DOIT correspondre à celle dans config.json)
json-secret-key: PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w=

# IMPORTANT: Cette clé doit être identique à celle dans:
# /home/user/rdp/config/config.json -> guacamole.secretKey
```

#### C. Vérification
```bash
# Tester que Guacamole répond
curl http://localhost:8080/guacamole/

# Devrait retourner du HTML
```

#### D. Configuration dans config.json
Fichier: `/home/user/rdp/config/config.json`
```json
{
  "guacamole": {
    "url": "http://localhost:8080/guacamole",
    "username": "guacadmin",
    "password": "guacadmin",
    "secretKey": "PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w="
  }
}
```

**Solutions:**
1. Démarrer le serveur Guacamole
2. Vérifier que l'extension `guacamole-auth-json` est installée
3. S'assurer que la `secretKey` est identique dans `guacamole.properties` et `config.json`
4. Redémarrer Guacamole après modification de la configuration

---

## ✅ Checklist de Démarrage

### Backend
- [ ] Serveur backend démarré: `node server/server.js`
- [ ] Base de données accessible: Log `✅ Base de données SQLite connectée`
- [ ] Configuration chargée: Log `✅ Configuration chargée`
- [ ] API répond: `curl http://localhost:3002/api/config`

### Guacamole
- [ ] Serveur Guacamole démarré
- [ ] Extension JSON installée
- [ ] SecretKey configurée et identique dans les 2 fichiers
- [ ] Test connexion: `curl http://localhost:8080/guacamole/`

### Frontend
- [ ] Build réussi: `npm run build`
- [ ] Serveur de développement: `npm start`
- [ ] Connexion à l'API: Vérifier les logs de la console

### Base de Données
- [ ] Fichier SQLite accessible sur le réseau
- [ ] Permissions lecture/écriture OK
- [ ] Table `technician_presence` existe
- [ ] Table `rds_sessions` existe

---

## 📊 Architecture du Système

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  React Frontend │ ───────>│  Node.js Backend │ ───────>│  SQLite Database │
│  (Port 3000)    │  HTTP   │  (Port 3002)     │  Local  │  (Réseau)        │
└─────────────────┘         └──────────────────┘         └──────────────────┘
         │                            │
         │                            │ PowerShell
         │                            v
         │                   ┌──────────────────┐
         │                   │  Active Directory│
         │                   │  (LDAP/WinRM)    │
         │                   └──────────────────┘
         │
         │ WebSocket
         v
┌─────────────────┐
│  Guacamole      │
│  (Port 8080)    │ ─────> Serveurs RDS (Port 3389)
└─────────────────┘  RDP
```

---

## 🔧 Commandes Utiles

### Logs Backend
```bash
# Démarrer avec logs verbeux
NODE_ENV=development node server/server.js

# Vérifier la connexion à la BDD
grep "Base de données" server/logs.txt
```

### Tests API
```bash
# Techniciens connectés
curl http://localhost:3002/api/technicians/connected

# Configuration
curl http://localhost:3002/api/config

# Sessions RDS
curl http://localhost:3002/api/rds-sessions
```

### Debugging Base de Données
```bash
# Voir la structure
sqlite3 path/to/db.sqlite ".schema"

# Compter les techniciens online
sqlite3 path/to/db.sqlite "SELECT COUNT(*) FROM technician_presence WHERE status='online';"

# Voir le dernier login
sqlite3 path/to/db.sqlite "SELECT * FROM technician_presence ORDER BY loginTime DESC LIMIT 1;"
```

---

## 📝 Notes Importantes

1. **Chemin Réseau Windows**: Les chemins UNC (`\\server\share`) doivent être accessibles depuis le processus Node.js
2. **Mode WAL**: La base SQLite utilise le mode WAL pour supporter plusieurs lecteurs simultanés
3. **Authentification**: Le mot de passe de démo est `admin` (à modifier en production)
4. **Ports**:
   - Frontend dev: 3000
   - Backend API: 3002
   - WebSocket: 3003
   - Guacamole: 8080

---

## 🚀 Prochaines Étapes

1. ✅ Démarrer le backend et vérifier les logs
2. ✅ Tester l'accès à la base de données
3. ✅ Se connecter avec un compte technicien
4. ✅ Vérifier que le technicien apparaît dans le widget
5. ⏳ Installer et configurer Guacamole
6. ⏳ Tester une connexion RDP shadow

---

**Dernière mise à jour:** 2025-10-23
**Corrections appliquées:** useDataFetching.js (boucle infinie)
