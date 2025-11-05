# 🐛 DEBUG - Exe Portable RDS Viewer

## ❌ **Problème Actuel**

Le serveur backend (port 3002) ne démarre PAS dans l'exe packagé.

**Symptômes:**
- L'exe s'ouvre et se referme immédiatement
- Message d'erreur: "Erreur Critique du Serveur"
- Console: `ERR_CONNECTION_REFUSED` sur `http://localhost:3002/api/*`

---

## 🔍 **Cause Identifiée**

Le processus Node.js forké (`fork()`) ne trouve pas les modules npm (`express`, `better-sqlite3`, etc.) dans l'exe packagé.

**Erreur réelle (cachée):**
```
Error: Cannot find module 'express'
```

---

## ✅ **Correctif Appliqué**

**Configuration de `NODE_PATH`** pour que le serveur forké trouve les modules dans `app.asar.unpacked/node_modules`.

**Modification:** `electron/main.js` (commit `ea3e476`)

```javascript
const nodeModulesPath = path.join(unpackedPath, 'node_modules');

const serverProcess = fork(serverPath, [], {
    env: {
        ...process.env,
        RUNNING_IN_ELECTRON: 'true',
        NODE_PATH: nodeModulesPath, // ✅ AJOUTÉ
        PORT: '3002'
    }
});
```

---

## 🔄 **Instructions de Test**

### **Étape 1: Récupérer le Correctif**

```bash
cd C:\Projet\rdp2
git pull origin claude/analyze-rdp2-new-tab-011CUoZ5CHryY1QJTnUgFgxX
```

**Vérifier:**
```bash
git log --oneline -5
```

Devrait afficher:
```
ea3e476 fix: Add NODE_PATH to forked server process to find npm modules
84b23fd fix: Correct server path in packaged exe (app.asar.unpacked)
1aafdb7 fix: Remove invalid 'comment' properties from electron-builder.json
6d9c7df fix: Add missing icon.png for portable exe splash screen
```

---

### **Étape 2: Rebuild l'Exe**

```bash
npm run build:portable
```

**Temps:** ~2-3 minutes

**Résultat:** `dist\RDS Viewer-3.0.26-Portable.exe`

---

### **Étape 3: Test avec Logs Détaillés**

#### **A. Lancer l'exe**

```bash
.\dist\"RDS Viewer-3.0.26-Portable.exe"
```

#### **B. Ouvrir DevTools IMMÉDIATEMENT** (avant que ça se ferme)

```
Appuyer sur F12 (ou Ctrl+Shift+I) dès l'ouverture
```

#### **C. Aller sur l'onglet Console**

---

### **Étape 4: Analyser les Logs**

## ✅ **Logs ATTENDUS (Succès):**

```
[INFO] ===================================================
[INFO] 🚀 Démarrage de l'application Electron... v3.0.26
[INFO] Mode de développement (isDev): false
[INFO] Chemin de l'application: C:\...\resources\app.asar
[INFO] ===================================================

[INFO] Environnement de production détecté. Démarrage du serveur Node.js interne...
[INFO] Chemin app: C:\...\resources\app.asar
[INFO] Chemin unpacked: C:\...\resources\app.asar.unpacked
[INFO] Chemin du serveur: C:\...\resources\app.asar.unpacked\server\server.js

[INFO] ✅ Fichier serveur trouvé, démarrage...
[INFO] Configuration NODE_PATH: C:\...\resources\app.asar.unpacked\node_modules

[INFO] ✅ Processus serveur démarré.

[Server] 🚀 Serveur backend démarré sur http://localhost:3002
[Server] ✅ Base de données SQLite connectée (ONLINE) : \\192.168.1.230\...
[Server] ✅ WebSocket serveur démarré sur le port 3003

ApiService initialisé avec baseURL: http://localhost:3002/api
✅ Connexion réussie à http://localhost:3002/api/health
✅ Configuration chargée depuis le serveur
```

---

## ❌ **Logs d'ERREUR (Échec):**

### **Erreur 1: Fichier Serveur Introuvable**

```
[ERROR] ❌ ERREUR: Fichier serveur introuvable: C:\...\app.asar.unpacked\server\server.js
```

**Cause:** Les fichiers `server/` ne sont pas dans l'exe.

**Solution:** Vérifier `electron-builder.json` → `asarUnpack` contient `"server/**/*"`

---

### **Erreur 2: Module Express Introuvable**

```
[Server ERROR] Error: Cannot find module 'express'
```

**Cause:** `NODE_PATH` ne fonctionne pas.

**Solution (de secours):** Voir section "Plan B" ci-dessous.

---

### **Erreur 3: Connexion Refusée**

```
ERR_CONNECTION_REFUSED sur http://localhost:3002/api/health
```

**Cause:** Le serveur n'a pas démarré du tout.

**Diagnostic:** Vérifier les logs `[Server ERROR]` dans la console.

---

## 🔧 **Plan B - Si NODE_PATH Ne Fonctionne Pas**

Si vous voyez toujours `Cannot find module 'express'`, il faudra utiliser une approche différente.

### **Option B1: Utiliser execArgv**

Modifier `electron/main.js`:

```javascript
const serverProcess = fork(serverPath, [], {
    silent: true,
    execArgv: [`--require=${path.join(unpackedPath, 'node_modules')}`],
    env: {
        ...process.env,
        RUNNING_IN_ELECTRON: 'true',
        PORT: '3002'
    }
});
```

### **Option B2: Démarrer le Serveur DANS Electron (Sans Fork)**

Modifier `electron/main.js`:

```javascript
function startServer() {
    if (!isDev) {
        const appPath = app.getAppPath();
        const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');

        // Configurer NODE_PATH globalement
        process.env.NODE_PATH = path.join(unpackedPath, 'node_modules');
        require('module').Module._initPaths();

        // Charger le serveur directement (pas de fork)
        const serverPath = path.join(unpackedPath, 'server', 'server.js');
        require(serverPath);

        logToUI('info', '[Main] ✅ Serveur backend chargé dans le processus principal');
    }
}
```

**Avantage:** Plus simple, pas de problème de module resolution.
**Inconvénient:** Le serveur tourne dans le même processus qu'Electron.

---

## 📊 **Checklist de Vérification**

Après le rebuild, vérifier:

- [ ] L'exe se lance sans se fermer immédiatement
- [ ] DevTools (F12) s'ouvre
- [ ] Console affiche: `[INFO] ✅ Fichier serveur trouvé`
- [ ] Console affiche: `[INFO] Configuration NODE_PATH: ...`
- [ ] Console affiche: `[Server] 🚀 Serveur backend démarré`
- [ ] Console affiche: `ApiService initialisé`
- [ ] PAS d'erreur `ERR_CONNECTION_REFUSED`
- [ ] PAS d'erreur `Cannot find module`
- [ ] Page de login s'affiche correctement

---

## 🆘 **Si Ça Ne Fonctionne Toujours Pas**

### **Envoyer ces Informations:**

1. **Screenshot de la console (F12) au démarrage**
2. **Copier tous les logs qui commencent par `[INFO]`, `[ERROR]`, `[Server]`**
3. **Vérifier si le fichier existe:**
   ```bash
   dir "dist\win-unpacked\resources\app.asar.unpacked\server\server.js"
   ```
4. **Vérifier si node_modules existe:**
   ```bash
   dir "dist\win-unpacked\resources\app.asar.unpacked\node_modules\express"
   ```

---

## 🎯 **Tests Supplémentaires**

### **Test 1: Vérifier le Port 3002**

Pendant que l'exe tourne:

```bash
netstat -ano | findstr :3002
```

**Résultat attendu:**
```
TCP    0.0.0.0:3002    0.0.0.0:0    LISTENING    [PID]
```

Si rien, le serveur ne démarre pas.

---

### **Test 2: Tester le Serveur Manuellement**

```bash
curl http://localhost:3002/api/health
```

**Résultat attendu:**
```json
{"status":"ok","message":"Le serveur est opérationnel."}
```

---

### **Test 3: Vérifier les Logs Electron**

Les logs Electron sont dans:

```
%USERPROFILE%\AppData\Roaming\RDS Viewer\logs\main.log
```

Ouvrir ce fichier et chercher:
- `[Server]` pour voir les logs du serveur
- `Error:` pour voir les erreurs

---

## 📚 **Documentation**

- `BUILD_GUIDE.md` - Guide complet de compilation
- `DATABASE_ARCHITECTURE.md` - Architecture base de données
- `electron/main.js` - Code de démarrage Electron

---

**Date de création:** 2025-11-05
**Dernière mise à jour:** 2025-11-05
**Commit:** ea3e476

---

**🚀 Testez maintenant et envoyez-moi les logs !**
