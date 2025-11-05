# 🔍 MODE DEBUG ACTIVÉ - Instructions

## ✅ Changements Appliqués

J'ai activé le **mode debug complet** pour diagnostiquer le problème du serveur backend :

### **1. DevTools Activé en Production** 🛠️
Les outils de développement Chrome s'ouvriront automatiquement au démarrage de l'exe.

### **2. Logging Détaillé du Serveur** 📝
Le serveur affiche maintenant :
- Chemins complets (__dirname, process.cwd)
- Variables d'environnement (NODE_ENV, RUNNING_IN_ELECTRON)
- Mode de démarrage (production vs dev)
- Ports utilisés
- Stack traces complètes en cas d'erreur

---

## 🚀 Procédure de Debug

### **Étape 1 : Récupérer les Changements**

```cmd
cd C:\Projet\rdp2
git pull
```

### **Étape 2 : Régénérer l'Exécutable**

```cmd
npm run build:exe
```

**OU plus rapide (si déjà généré une fois) :**

```cmd
rmdir /s /q dist
npm run build && npx electron-builder --win portable --config electron-builder.json
```

### **Étape 3 : Lancer l'Exe**

```cmd
cd dist
"DocuCortex IA-3.0.26-Portable.exe"
```

### **Étape 4 : Observer les Logs**

Quand l'application s'ouvre, vous verrez **2 fenêtres** :

1. **Fenêtre principale** (avec l'erreur bleue)
2. **DevTools** (console de debug) ← C'EST CELLE-CI QU'ON VEUT

---

## 📊 Que Chercher dans les Logs

### **Dans l'onglet "Console" des DevTools, cherchez :**

#### **A. Logs du processus Electron (main)**
```
[Main] 🚀 Démarrage de l'application...
[Main] Mode de développement (isDev): false
[Main] Chemin de l'application: C:\...
[Main] Environnement de production détecté...
[Main] Chemin du serveur: C:\...\server\server.js
[Main] ✅ Processus serveur démarré.
```

#### **B. Logs du serveur backend**
```
[Server] 🔍 [DEBUG] __dirname: ...
[Server] 🔍 [DEBUG] process.cwd(): ...
[Server] 🔍 [DEBUG] NODE_ENV: ...
[Server] 🔍 [DEBUG] RUNNING_IN_ELECTRON: true
[Server] 🔍 [DEBUG] isProduction: true
[Server] ✅ Mode PRODUCTION - Ports fixes: {API_PORT: 3002, WS_PORT: 3003}
```

#### **C. Erreurs Critiques (si présentes)**
```
[Server ERROR] ❌ ERREUR CRITIQUE AU DÉMARRAGE: ...
[Server ERROR] ❌ Stack trace: ...
```

---

## 📸 Copier les Logs

### **Méthode 1 : Sélection Manuelle**

1. Cliquez dans la console
2. Appuyez sur `Ctrl+A` (tout sélectionner)
3. `Ctrl+C` (copier)
4. Collez dans un fichier texte ou directement dans la conversation

### **Méthode 2 : Clic Droit**

1. Clic droit dans la console
2. "Save as..." → Sauvegarder les logs dans un fichier

### **Méthode 3 : Screenshot**

1. Appuyez sur `Windows + Shift + S`
2. Sélectionnez la zone de la console
3. Collez l'image (`Ctrl+V`)

---

## 🎯 Ce Que Je Recherche Spécifiquement

### **1. Le serveur démarre-t-il ?**
```
[Server] 🚀 SERVEUR PRÊT !
```
- ✅ Si OUI : Le problème est ailleurs (réseau/ports)
- ❌ Si NON : Regarder l'erreur juste avant

### **2. Quel est le __dirname ?**
```
[Server] 🔍 [DEBUG] __dirname: C:\...\app.asar\server
```
- Si le chemin contient `.asar` → Problème de chemins ASAR
- Sinon → Autre problème

### **3. Y a-t-il une erreur de require() ?**
```
[Server ERROR] Error: Cannot find module '../backend/services/configService'
```
- Si OUI : Problème de résolution des modules

### **4. Y a-t-il une erreur de base de données ?**
```
[Server ERROR] ⚠️ ATTENTION: Impossible de se connecter à la base de données
```
- Si OUI mais serveur démarre quand même : Mode dégradé OK
- Si serveur crash : Problème critique

---

## 🔍 Logs Attendus (NORMAL)

Si tout fonctionne correctement, vous devriez voir :

```
[Main] 🚀 Démarrage de l'application...
[Main] Mode de développement (isDev): false
[Main] Environnement de production détecté...
[Main] Chemin du serveur: C:\Users\...\AppData\Local\Programs\...\resources\app.asar\server\server.js
[Main] ✅ Processus serveur démarré.
[Main] 🎬 Création de la fenêtre principale...
[Main] Chargement du fichier de production: C:\...\resources\app.asar\build\index.html
[Main] 🔍 DevTools ouvert pour debugging
[Server] 🔍 [DEBUG] Appel de startServer()...
[Server] 🔍 [DEBUG] __dirname: C:\...\app.asar\server
[Server] 🔍 [DEBUG] process.cwd(): C:\Users\...
[Server] 🔍 [DEBUG] RUNNING_IN_ELECTRON: true
[Server] 🔍 [DEBUG] isProduction: true
[Server] ✅ Mode PRODUCTION - Ports fixes: { API_PORT: 3002, WS_PORT: 3003 }
[Server] ✅ Configuration chargée.
[Server] ✅ Base de données connectée.
[Server] ✅ WebSocket initialisé sur le port 3003
[Server] ✅ Routes API configurées.
[Server] 🕒 Planification des tâches de fond...
[Server] ✅ Tâches de fond planifiées.
[Server] 🚀 SERVEUR PRÊT !
[Server]    - API sur http://localhost:3002
[Server]    - WebSocket sur le port 3003
[Main] ✅ Fenêtre prête à être affichée.
```

---

## ❌ Logs Problématiques (À CHERCHER)

Si vous voyez un de ces messages, **copiez-le** :

```
[Server ERROR] ❌ ERREUR CRITIQUE AU DÉMARRAGE
[Server ERROR] ❌ ERREUR LORS DE L'APPEL DE startServer()
[Server ERROR] Error: Cannot find module
[Server ERROR] ENOENT: no such file or directory
[Main] ❌ Erreur critique du processus serveur
```

---

## 📋 Template de Rapport

Copiez ce template et remplissez-le :

```
=== RAPPORT DE DEBUG ===

1. L'exe se lance : OUI / NON
2. DevTools s'ouvre automatiquement : OUI / NON
3. Message d'erreur affiché à l'écran :
   [Coller le message]

4. Logs dans la Console (onglet Console de DevTools) :
   [Coller TOUS les logs, au moins 50 lignes]

5. Erreurs dans la Console (filtrer par "ERROR") :
   [Coller les erreurs en rouge]

6. Onglet Network (Réseau) :
   - Requête à http://localhost:3002/api/... : Réussie / Échouée
   - Statut : [200 / 404 / Connection refused / ...]
```

---

## 🛠️ Actions Selon les Logs

### **Si : "Cannot find module '../backend/services/...'"**
→ Problème de chemins ASAR, je devrai corriger les imports

### **Si : "ENOENT: no such file or directory, open 'config.json'"**
→ Le fichier config.json n'est pas copié dans l'exe

### **Si : "Error: listen EADDRINUSE :::3002"**
→ Le port 3002 est déjà utilisé (fermer autres instances)

### **Si : "SERVEUR PRÊT" mais page bleue quand même**
→ Problème de connexion frontend-backend (ports/URLs)

---

## 🎯 Prochaines Étapes

1. **Régénérez l'exe** avec `git pull` puis `npm run build:exe`
2. **Lancez-le** et attendez que DevTools s'ouvre
3. **Copiez TOUS les logs** de la console
4. **Envoyez-moi** les logs (texte brut ou screenshot)

Je pourrai alors **identifier précisément** le problème et le corriger ! 🎯

---

## ⚡ Raccourcis Utiles dans DevTools

- `Ctrl+F` : Rechercher dans les logs
- `Ctrl+L` : Effacer la console
- `Ctrl+Shift+C` : Inspecter un élément
- Clic sur "⚙️" en haut à droite → "Preserve log" : Garder les logs au refresh

---

**Génère l'exe maintenant et envoie-moi les logs ! 🚀**
