# 🚀 Démarrage Rapide - RDS Viewer

## ⚠️ IMPORTANT : Problème résolu

Le problème que vous rencontriez était dû au fait que **`npm install` n'avait jamais été exécuté** dans votre environnement Windows. Le script `start-react.js` a été amélioré pour détecter ce problème et afficher des messages clairs.

---

## 📋 Étapes de démarrage (Dans l'ordre !)

### Étape 1 : Installation des dépendances

**⚠️ À FAIRE UNE SEULE FOIS** après avoir cloné ou réinstallé le projet.

```powershell
# Dans PowerShell, à la racine du projet C:\Projet\rdp2
npm install
```

**Durée estimée** : 2-3 minutes

**Vérification** :
```powershell
# Vérifiez que le dossier existe
Test-Path node_modules
# Devrait retourner: True

# Vérifiez que react-scripts existe
Test-Path node_modules\.bin\react-scripts.cmd
# Devrait retourner: True
```

---

### Étape 2 : Démarrage de l'application

```powershell
# Dans C:\Projet\rdp2
npm run electron:start
```

**Ce que fait cette commande** :
1. ✅ Démarre le serveur backend Express (port 3002)
2. ✅ Démarre le serveur React Dev (port 3000 ou 3001)
3. ✅ Lance l'application Electron

**Temps de démarrage normal** : 30-60 secondes

---

## 🔍 Diagnostic en temps réel

### Messages normaux (succès ✅)

```
[React Starter] 🔍 Checking dependencies...
[React Starter] ✅ Dependencies check passed
[React Starter] 🚀 Starting React dev server on port 3000...
[React Starter] 🔨 Compilation started...
[React Dev Server] Compiled successfully!
[React Starter] ✅ React server is ready on port 3000.
[React Starter] ✅ Fichier .react-port.json créé avec port 3000
```

### Erreurs possibles et solutions

#### ❌ Erreur : `node_modules directory not found`

**Cause** : Vous n'avez pas exécuté `npm install`

**Solution** :
```powershell
npm install
```

---

#### ❌ Erreur : `Port 3002 is already in use`

**Cause** : Une instance du serveur est déjà en cours

**Solution** :
```powershell
# Trouver le processus qui utilise le port
netstat -ano | findstr "3002"

# Tuer le processus (remplacez <PID> par le numéro affiché)
taskkill /F /PID <PID>
```

---

#### ❌ Erreur : `TIMEOUT: React compilation took too long`

**Causes possibles** :
- Erreurs de syntaxe dans le code
- Mémoire insuffisante
- Processus bloqué

**Solution** :
```powershell
# 1. Arrêter tout avec Ctrl+C

# 2. Nettoyer le cache
npm cache clean --force

# 3. Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
npm install

# 4. Relancer
npm run electron:start
```

---

#### ❌ Erreur : `Failed to compile` avec erreurs ESLint

**Solution** : Les erreurs ESLint ne bloquent plus la compilation grâce à `ESLINT_NO_DEV_ERRORS=true`. L'application démarrera quand même.

---

## 🛠️ Commandes de maintenance

### Nettoyage complet (en cas de problème persistant)

```powershell
# Arrêter tout avec Ctrl+C

# Supprimer les fichiers générés
Remove-Item -Force .ports.json -ErrorAction SilentlyContinue
Remove-Item -Force .react-port.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue

# Nettoyer npm
npm cache clean --force

# Réinstaller
Remove-Item -Recurse -Force node_modules
npm install

# Redémarrer
npm run electron:start
```

---

### Démarrage manuel (mode debug)

Si vous voulez lancer les 3 processus séparément pour mieux débugger :

**Terminal 1** - Backend :
```powershell
npm run server:start
```

**Terminal 2** - React :
```powershell
npm run start
```

**Terminal 3** - Electron :
```powershell
npm run electron:dev
```

---

## 📊 Configuration des API IA

Une fois l'application démarrée :

1. Connectez-vous
2. Allez dans **Configuration** (⚙️ en haut à droite)
3. Sélectionnez l'onglet **"API IA (HF & OpenRouter)"**
4. Entrez vos clés API :
   - **Hugging Face** : https://huggingface.co/settings/tokens
   - **OpenRouter** : https://openrouter.ai/keys
5. Testez chaque connexion
6. Sauvegardez

---

## 🆘 En cas de problème persistant

### Vérifications à faire

```powershell
# 1. Vérifier la version de Node.js (doit être >= 16)
node --version

# 2. Vérifier la version de npm (doit être >= 8)
npm --version

# 3. Vérifier que Git est installé
git --version

# 4. Vérifier l'espace disque (au moins 2 GB libres)
Get-PSDrive C

# 5. Vérifier les processus qui utilisent les ports
netstat -ano | findstr "3000 3001 3002 3003"
```

### Logs détaillés

Les logs sont affichés dans la console. Pour sauvegarder les logs :

```powershell
npm run electron:start > logs.txt 2>&1
```

---

## 📝 Checklist de démarrage

- [ ] Node.js installé (version >= 16)
- [ ] npm installé (version >= 8)
- [ ] Git installé
- [ ] Projet cloné dans `C:\Projet\rdp2`
- [ ] **`npm install` exécuté avec succès**
- [ ] Aucun processus n'utilise les ports 3000-3003
- [ ] Connexion au réseau ANECOOPFR
- [ ] Accès aux serveurs RDS configurés dans `config/config.json`

---

## 🎯 Résumé des améliorations apportées

✅ **start-react.js amélioré** :
- Détection automatique si `node_modules` manque
- Timeout de 3 minutes pour la compilation
- Messages d'erreur clairs et solutions suggérées
- Nettoyage automatique des fichiers obsolètes
- Support complet Windows (`.cmd`, `.ps1`)

✅ **Corrections précédentes** :
- Erreur `Object.values()` dans Utilisateurs et Groupes AD → **Corrigée**
- Erreur 500 dans le chat IA → **Corrigée**
- Panel de configuration des API IA → **Ajouté**
- Permissions avec noms explicites en français → **Ajouté**
- Suppression de toutes les références Ollama → **Complétée**

---

## 💡 Astuce

Si vous développez régulièrement, créez un raccourci PowerShell :

**Fichier** : `C:\Projet\rdp2\start.ps1`
```powershell
Set-Location C:\Projet\rdp2
npm run electron:start
```

Puis double-cliquez sur `start.ps1` pour démarrer l'application.

---

**Dernière mise à jour** : 2025-11-07
**Version** : 3.0.26
