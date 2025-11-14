# 🚀 GUIDE DE DÉMARRAGE - RDP2 Viewer

## 📋 Problème : Seule la page web s'ouvre (pas Electron)

### 🔍 Diagnostic Rapide

Quand vous lancez `npm run electron:start`, **3 processus** doivent démarrer en parallèle :

1. **Backend** (server/server.js) → Port 3002
2. **React Dev** (webpack-dev-server) → Port 3000
3. **Electron** (attends que le backend soit prêt, puis lance l'app)

**Si seule la page web s'ouvre**, cela signifie que :
- ✅ Backend démarre OK
- ✅ React démarre OK
- ❌ **Electron ne se lance pas**

---

## 🛠️ Solutions par Ordre de Priorité

### **Solution 1 : Réinstallation Complète (Recommandée)**

```cmd
REM Depuis C:\Projet\rdp2
full-update.bat
```

Ce script fait TOUT automatiquement :
- Merge les corrections depuis Git
- Nettoie node_modules
- Réinstalle toutes les dépendances
- Vérifie Electron
- Lance l'application

---

### **Solution 2 : Vérification et Réparation Rapide**

```cmd
REM Depuis C:\Projet\rdp2
diagnose-and-fix.bat
```

Ce script diagnostique le problème et propose des solutions.

---

### **Solution 3 : Installation Manuelle d'Electron**

Si Electron n'est pas installé :

```cmd
cd C:\Projet\rdp2
npm install electron@31.0.0 --save-dev
npm run electron:start
```

---

### **Solution 4 : Lancer Electron Séparément**

Si le backend et React sont déjà lancés :

```cmd
REM Depuis C:\Projet\rdp2
start-electron-only.bat
```

Ou manuellement :

```cmd
cd C:\Projet\rdp2
electron .
```

---

### **Solution 5 : Vérifier le Port du Backend**

Le script `wait-for-backend.js` cherche le backend sur le **port 3002**.

**Test manuel** :
```cmd
REM Dans un terminal séparé
cd C:\Projet\rdp2
node server/server.js
```

**Dans un autre terminal** :
```cmd
curl http://localhost:3002/api/health
```

Si ça ne répond pas, le problème vient du backend.

---

## 🔧 Commandes de Dépannage Manuelles

### 1. Nettoyer et Réinstaller

```cmd
cd C:\Projet\rdp2

REM Arrêter tous les processus
taskkill /F /IM node.exe
taskkill /F /IM electron.exe

REM Nettoyer
rmdir /s /q node_modules
del package-lock.json
del .ports.json

REM Réinstaller
npm cache clean --force
npm install
```

### 2. Mettre à Jour depuis Git

```cmd
cd C:\Projet\rdp2

git fetch origin
git checkout main
git pull origin main
git merge origin/claude/fix-and-improve-project-01733jRqEyXifQHjDwDBK598
git push origin main
```

### 3. Vérifier l'Installation

```cmd
cd C:\Projet\rdp2

REM Vérifier Node et npm
node -v
npm -v

REM Vérifier Electron
npm list electron

REM Vérifier les fichiers critiques
dir electron\main.js
dir server\server.js
dir scripts\wait-for-backend.js
```

### 4. Démarrer en Mode Debug

```cmd
cd C:\Projet\rdp2

REM Terminal 1 : Backend
node server/server.js

REM Terminal 2 : React (dans un nouveau terminal)
npm run start

REM Terminal 3 : Electron (dans un nouveau terminal)
npm run electron:dev
```

---

## 📝 Logs et Debugging

### Voir les Logs du Backend

Le backend affiche ses logs directement dans le terminal.
Cherchez :
- `✅ SERVEUR PRÊT !`
- `API sur http://localhost:3002`

### Voir les Logs d'Electron

Les logs Electron sont dans :
```
%APPDATA%\rds-viewer\logs\main.log
```

Ou :
```
C:\Users\VotreNom\AppData\Roaming\rds-viewer\logs\main.log
```

### Activer le Mode Verbose

```cmd
set DEBUG=*
npm run electron:start
```

---

## ⚡ Commandes Rapides

| Action | Commande |
|--------|----------|
| **Tout mettre à jour** | `full-update.bat` |
| **Diagnostiquer** | `diagnose-and-fix.bat` |
| **Démarrer l'app** | `npm run electron:start` |
| **Démarrer Electron seul** | `start-electron-only.bat` ou `electron .` |
| **Backend seul** | `node server/server.js` |
| **React seul** | `npm run start` |
| **Nettoyer** | `rmdir /s /q node_modules && npm install` |

---

## 🆘 Problèmes Courants

### "Cannot find module 'electron'"
**Solution** : `npm install electron@31.0.0 --save-dev`

### "Backend ne répond pas"
**Solution** : Vérifiez les logs du backend, la base de données SQLite doit être accessible

### "Port 3002 déjà utilisé"
**Solution** :
```cmd
taskkill /F /IM node.exe
del .ports.json
npm run electron:start
```

### "pdf-parse error"
**Solution** :
```cmd
rmdir /s /q node_modules\pdf-parse
npm install pdf-parse@1.1.1
```

### "Electron s'ouvre mais reste blanc"
**Solution** : Le backend n'est pas prêt ou React n'a pas compilé. Attendez 30 secondes.

---

## 📞 Support

Si aucune solution ne fonctionne :

1. Vérifiez les logs : `%APPDATA%\rds-viewer\logs\main.log`
2. Lancez `diagnose-and-fix.bat` et copiez le résultat
3. Vérifiez la console du terminal pour les erreurs

---

## ✅ Checklist de Vérification

Avant de lancer l'application :

- [ ] Node.js installé (v18+) : `node -v`
- [ ] npm installé : `npm -v`
- [ ] Git configuré : `git --version`
- [ ] Dossier `node_modules` présent
- [ ] Electron installé : `npm list electron`
- [ ] Fichiers critiques présents :
  - [ ] `electron/main.js`
  - [ ] `server/server.js`
  - [ ] `src/index.js` ou `src/index.tsx`
- [ ] Aucun processus Node en cours : `taskkill /F /IM node.exe`
- [ ] Port 3002 libre
- [ ] Port 3000 libre

---

**Dernière mise à jour** : 2025-11-14
**Version** : 3.0.26
