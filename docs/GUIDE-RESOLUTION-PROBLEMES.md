# Guide Complet de Résolution de Problèmes - RDS Viewer Anecoop

**Version :** 3.0.31  
**Date :** 2025-11-04  
**Statut :** Documentation Officielle de Support Technique

---

## 📋 Table des Matières

1. [Problèmes de Démarrage](#1-problèmes-de-démarrage)
2. [Problèmes de Connexion](#2-problèmes-de-connexion)
3. [Problèmes de Performance](#3-problèmes-de-performance)
4. [Problèmes avec Services IA](#4-problèmes-avec-services-ia)
5. [Problèmes de Permissions](#5-problèmes-de-permissions)
6. [Problèmes GED (Gestion Électronique de Documents)](#6-problèmes-ged)
7. [Erreurs Courantes et Solutions](#7-erreurs-courantes-et-solutions)
8. [Logs et Diagnostics](#8-logs-et-diagnostics)
9. [Procédures de Réparation](#9-procédures-de-réparation)

---

## 1. Problèmes de Démarrage

### 1.1 Application ne Démarre Pas

#### **Symptômes**
- Double-clic sur l'exécutable ne lance rien
- Fenêtre de l'application ne s'ouvre pas
- Application se ferme immédiatement après le démarrage
- Aucun message d'erreur visible

#### **Causes Possibles**
1. **Dépendances manquantes** - Modules Node.js non installés
2. **Fichiers corrompus** - Installation incomplète ou dégradée
3. **Conflits de processus** - Une autre instance est déjà en cours d'exécution
4. **Permissions insuffisantes** - Droits d'accès manquants
5. **Antivirus bloque l'exécution** - Faux positif de sécurité

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier les Processus en Cours**
```bash
# Windows - Ouvrir le Gestionnaire des tâches (Ctrl+Maj+Échap)
# Rechercher "RDS Viewer" ou "electron.exe"
# Terminer tous les processus associés

# Ou via PowerShell
taskkill /F /IM "RDS Viewer.exe"
taskkill /F /IM electron.exe
```

**Solution 2 : Réinstaller les Dépendances (Mode Développement)**
```bash
cd C:\chemin\vers\rdp
npm run install:clean
# Ou
npm install
```

**Solution 3 : Vérifier les Logs de Démarrage**
```bash
# Logs Electron se trouvent dans :
%APPDATA%\RDS Viewer\logs\main.log

# Ouvrir le fichier et rechercher les erreurs
notepad "%APPDATA%\RDS Viewer\logs\main.log"
```

**Solution 4 : Exclure de l'Antivirus**
1. Ouvrir Windows Security
2. Protection contre les virus et menaces > Paramètres
3. Exclusions > Ajouter une exclusion
4. Ajouter le dossier d'installation de RDS Viewer

**Solution 5 : Démarrage en Mode Sans Échec (Développement)**
```bash
# Désactiver le cache et les plugins
electron . --disable-gpu --no-sandbox
```

#### **Prévention**
- ✅ Toujours installer en tant qu'administrateur
- ✅ Garder l'antivirus à jour avec les exceptions configurées
- ✅ Effectuer des sauvegardes régulières des configurations
- ✅ Documenter toute modification des fichiers système

---

### 1.2 Erreurs au Lancement

#### **Symptômes**
- Message d'erreur « Module not found »
- Erreur « Cannot find module 'electron-updater' »
- Erreur « Cannot find module 'electron-log' »
- Fenêtre d'erreur Windows avec détails techniques

#### **Causes Possibles**
1. **Modules Node.js manquants** - Installation incomplète
2. **Version Node.js incompatible** - Version trop ancienne
3. **Corruption du cache npm** - Fichiers corrompus
4. **Conflits de versions** - Dépendances incompatibles

#### **Solutions Étape par Étape**

**Solution 1 : Installer les Modules Manquants**
```bash
# Installer les dépendances critiques
npm install electron-updater electron-log electron-is-dev

# Installer toutes les dépendances
npm install
```

**Solution 2 : Nettoyer et Réinstaller**
```bash
# Supprimer node_modules et le cache
rmdir /S /Q node_modules
npm cache clean --force

# Réinstaller
npm install
```

**Solution 3 : Vérifier la Version Node.js**
```bash
# Vérifier la version actuelle
node --version
# Version recommandée : v18.x ou v20.x

# Si nécessaire, mettre à jour via nvm ou l'installeur officiel
```

**Solution 4 : Utiliser le Script de Correction**
```bash
# Script automatique de réparation
cd C:\chemin\vers\rdp
fix-package.bat
```

**Solution 5 : Rebuild des Modules Natifs**
```bash
# Recompiler les modules natifs (better-sqlite3, etc.)
npm rebuild

# Ou spécifiquement pour Electron
npm run rebuild
```

#### **Prévention**
- ✅ Utiliser une version LTS de Node.js
- ✅ Documenter les dépendances dans package.json
- ✅ Exécuter `npm audit` régulièrement
- ✅ Tester après chaque mise à jour de dépendance

---

### 1.3 Écran Blanc au Démarrage

#### **Symptômes**
- Fenêtre s'ouvre mais reste blanche
- Aucun contenu React ne s'affiche
- Console de développement affiche des erreurs

#### **Causes Possibles**
1. **Serveur backend non démarré** - Port 3002 inaccessible
2. **Serveur React non compilé** - Build manquant en production
3. **Erreurs JavaScript critiques** - Bugs bloquant le rendu
4. **Problème de CORS** - Requêtes bloquées

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier le Serveur Backend**
```bash
# Tester manuellement le backend
curl http://localhost:3002/api/config

# Si erreur, démarrer le serveur
cd C:\chemin\vers\rdp
node server/server.js
```

**Solution 2 : Ouvrir la Console de Développement**
```javascript
// Dans electron/main.js, ligne 91, décommenter :
mainWindow.webContents.openDevTools();

// Relancer l'application et examiner les erreurs
```

**Solution 3 : Rebuild React (Mode Production)**
```bash
# Recompiler l'interface React
npm run build

# Vérifier que build/index.html existe
dir build\index.html
```

**Solution 4 : Mode Développement pour Debug**
```bash
# Démarrer en mode développement
npm start
# L'application devrait s'ouvrir dans le navigateur
```

**Solution 5 : Vérifier les Chemins**
```javascript
// Dans electron/main.js, vérifier :
const prodPath = path.join(__dirname, '..', 'build', 'index.html');
console.log('Production path:', prodPath);
```

#### **Prévention**
- ✅ Toujours tester le build de production avant déploiement
- ✅ Maintenir des logs détaillés côté serveur
- ✅ Utiliser des healthchecks pour le backend
- ✅ Documenter le processus de build complet

---

## 2. Problèmes de Connexion

### 2.1 Impossible de se Connecter à la Base de Données

#### **Symptômes**
- Erreur « Database connection failed »
- Message « SQLITE_CANTOPEN »
- Données ne se chargent pas
- Widget « Techniciens Connectés » affiche 0

#### **Causes Possibles**
1. **Chemin réseau invalide** - Partage réseau non accessible
2. **Permissions insuffisantes** - Droits d'accès manquants
3. **Fichier SQLite manquant/corrompu** - Base de données endommagée
4. **Problème réseau** - Serveur de fichiers hors ligne

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier le Chemin de la Base**
```bash
# Chemin par défaut
\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\rds_viewer_data.sqlite

# Tester l'accès
dir "\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\"
```

**Solution 2 : Vérifier les Permissions**
```powershell
# Tester l'accès en écriture
echo "test" > "\\192.168.1.230\Donnees\Informatique\PROGRAMMES\Programme RDS\RDS Viewer Group\test.txt"

# Si erreur, contacter l'administrateur réseau
```

**Solution 3 : Vérifier la Configuration**
```javascript
// Dans config/config.json
{
  "databasePath": "\\\\192.168.1.230\\Donnees\\Informatique\\PROGRAMMES\\Programme RDS\\RDS Viewer Group\\rds_viewer_data.sqlite"
}

// Note : Doubles backslashes nécessaires en JSON
```

**Solution 4 : Tester la Connexion SQLite**
```bash
# Installer sqlite3 si nécessaire
npm install -g sqlite3

# Se connecter
sqlite3 "\\192.168.1.230\Donnees\...\rds_viewer_data.sqlite"

# Tester une requête
SELECT COUNT(*) FROM technician_presence;
```

**Solution 5 : Recréer la Base de Données**
```bash
# Sauvegarder l'ancienne
copy "\\192.168.1.230\...\rds_viewer_data.sqlite" "backup_$(date).sqlite"

# Réinitialiser avec le script
node backend/services/databaseService.js
```

#### **Prévention**
- ✅ Configurer des sauvegardes automatiques quotidiennes
- ✅ Utiliser un système de monitoring réseau
- ✅ Documenter les chemins UNC et leurs alternatives
- ✅ Tester les permissions régulièrement

---

### 2.2 Échec d'Authentification Utilisateur

#### **Symptômes**
- Message « Identifiants incorrects »
- Connexion refuse même avec bon mot de passe
- Erreur LDAP/Active Directory
- Page de login boucle sans succès

#### **Causes Possibles**
1. **Serveur AD inaccessible** - Active Directory hors ligne
2. **Credentials expirés** - Mot de passe changé dans AD
3. **Problème de cache** - Tokens corrompus
4. **Configuration LDAP incorrecte** - Mauvais paramètres

#### **Solutions Étape par Étape**

**Solution 1 : Tester la Connexion AD**
```powershell
# Tester l'authentification AD
$cred = Get-Credential
Test-ADAuthentication -Credential $cred

# Ou tester manuellement
dsquery user -name "NomUtilisateur"
```

**Solution 2 : Vérifier la Configuration LDAP**
```javascript
// Dans config/config.json
{
  "ldap": {
    "server": "ldap://dc.anecoop.local",
    "baseDN": "DC=anecoop,DC=local",
    "searchUser": "CN=service_account,OU=Users,DC=anecoop,DC=local",
    "searchPassword": "mot_de_passe_service"
  }
}
```

**Solution 3 : Nettoyer le Cache d'Authentification**
```bash
# Supprimer les tokens stockés
rmdir /S /Q "%APPDATA%\RDS Viewer\auth-cache"

# Ou via l'interface
# Paramètres > Avancé > Nettoyer le cache
```

**Solution 4 : Mode Démo (Développement)**
```javascript
// LoginPage.js - Utiliser le compte de démo
Username: admin
Password: admin
```

**Solution 5 : Logs de Debug LDAP**
```bash
# Activer les logs détaillés
SET DEBUG=ldap:*
node server/server.js

# Examiner les erreurs LDAP
```

#### **Prévention**
- ✅ Configurer un compte de service dédié avec mot de passe permanent
- ✅ Implémenter un système de cache offline
- ✅ Tester les connexions AD régulièrement
- ✅ Documenter les procédures de récupération

---

### 2.3 Connexion RDP/Shadow Échoue

#### **Symptômes**
- Erreur WebSocket « Connection failed »
- Message « Guacamole not available »
- Écran noir lors de la connexion RDP
- Timeout de connexion

#### **Causes Possibles**
1. **Guacamole non démarré** - Serveur sur port 8080 absent
2. **Token JWT invalide** - Clé secrète incorrecte
3. **Serveur cible inaccessible** - Machine RDS hors ligne
4. **Pare-feu bloque** - Port 3389 ou 8080 fermé

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier Guacamole**
```bash
# Tester le serveur Guacamole
curl http://localhost:8080/guacamole/

# Si erreur, démarrer Guacamole
docker start guacamole
# Ou
systemctl start guacamole
```

**Solution 2 : Vérifier la Configuration JWT**
```javascript
// Dans config/config.json
{
  "guacamole": {
    "url": "http://localhost:8080/guacamole",
    "secretKey": "PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w="
  }
}

// Dans /etc/guacamole/guacamole.properties
json-secret-key: PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w=
// DOIT être identique !
```

**Solution 3 : Tester la Connexion RDP Directement**
```bash
# Utiliser mstsc.exe natif
mstsc /v:192.168.1.xxx

# Si cela fonctionne, le problème est dans Guacamole
```

**Solution 4 : Vérifier les Ports**
```powershell
# Tester si le port est ouvert
Test-NetConnection -ComputerName 192.168.1.xxx -Port 3389

# Vérifier Guacamole
Test-NetConnection -ComputerName localhost -Port 8080
```

**Solution 5 : Redémarrer les Services**
```bash
# Redémarrer Guacamole
docker restart guacamole

# Redémarrer le backend
taskkill /F /IM node.exe
node server/server.js
```

#### **Prévention**
- ✅ Monitorer l'état de Guacamole avec un healthcheck
- ✅ Documenter la configuration JWT
- ✅ Configurer des alertes de disponibilité
- ✅ Maintenir une connexion RDP de secours (mstsc)

---

## 3. Problèmes de Performance

### 3.1 Application Lente ou Figée

#### **Symptômes**
- Interface ne répond pas (freeze)
- Latence importante sur les clics
- Scrolling saccadé
- Chargement des données très lent

#### **Causes Possibles**
1. **Boucle infinie** - Hooks React mal configurés
2. **Mémoire saturée** - Fuites mémoire (memory leaks)
3. **Base de données non optimisée** - Index manquants
4. **Trop de requêtes simultanées** - Surcharge réseau
5. **Cache non utilisé** - Données rechargées constamment

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier les Boucles Infinies**
```bash
# Ouvrir la console de développement (F12)
# Chercher des milliers de logs identiques
# Si oui, c'est probablement une boucle infinie

# Exemple connu : useDataFetching.js
# Solution appliquée : utilisation de useRef
```

**Solution 2 : Analyser la Mémoire**
```javascript
// Dans Chrome DevTools
// 1. Performance > Record
// 2. Effectuer les actions lentes
// 3. Stop > Analyser les pics mémoire

// Ou via Task Manager
// Vérifier la consommation mémoire de "RDS Viewer"
```

**Solution 3 : Optimiser la Base de Données**
```bash
# Exécuter le script d'optimisation
node scripts/optimize-database.js

# Ou manuellement
sqlite3 rds_viewer_data.sqlite
VACUUM;
ANALYZE;
```

**Solution 4 : Activer le Cache**
```javascript
// Vérifier dans config/config.json
{
  "cache": {
    "enabled": true,
    "ttl": 300000  // 5 minutes
  }
}
```

**Solution 5 : Limiter les Requêtes**
```javascript
// Dans src/hooks/useDataFetching.js
// Vérifier le paramètre refreshInterval
refreshInterval: 30000  // 30 secondes minimum recommandé
```

#### **Prévention**
- ✅ Profiler régulièrement l'application avec React DevTools
- ✅ Implémenter une pagination pour les listes longues
- ✅ Utiliser le lazy loading pour les composants lourds
- ✅ Optimiser les requêtes SQL avec des index
- ✅ Monitorer l'utilisation mémoire en production

---

### 3.2 Chargement Lent au Démarrage

#### **Symptômes**
- Splash screen reste affiché longtemps
- Premier affichage prend plus de 10 secondes
- Indicateur de chargement infini
- Timeout de requêtes initiales

#### **Causes Possibles**
1. **Base de données volumineuse** - Trop de données à charger
2. **Services tiers lents** - Active Directory répond lentement
3. **Réseau lent** - Latence réseau élevée
4. **Pas de préchargement** - Données chargées séquentiellement

#### **Solutions Étape par Étape**

**Solution 1 : Implémenter un Chargement Progressif**
```javascript
// Charger les données critiques d'abord
// Puis charger les données secondaires en arrière-plan

// LoginPage.js - Exemple
const login = async () => {
  // 1. Authentification (bloquant)
  await authenticate();
  
  // 2. Données essentielles (bloquant)
  await loadEssentialData();
  
  // 3. Redirection
  navigate('/dashboard');
  
  // 4. Données secondaires (non-bloquant)
  loadSecondaryData(); // Sans await
};
```

**Solution 2 : Utiliser le Cache Agressivement**
```javascript
// Charger depuis le cache pendant que les données fraîches arrivent
const data = await getCachedData() || await fetchFreshData();
```

**Solution 3 : Optimiser les Requêtes SQL**
```sql
-- Ajouter des index sur les colonnes fréquemment utilisées
CREATE INDEX idx_user_active ON users(is_active);
CREATE INDEX idx_session_status ON rds_sessions(status);
CREATE INDEX idx_loan_dates ON loans(start_date, end_date);
```

**Solution 4 : Parallel Loading**
```javascript
// Charger plusieurs ressources en parallèle
const [users, sessions, config] = await Promise.all([
  fetchUsers(),
  fetchSessions(),
  fetchConfig()
]);
```

**Solution 5 : Précharger en Arrière-Plan**
```javascript
// Dans electron/main.js
// Démarrer le serveur AVANT d'ouvrir la fenêtre
await startServer();
await waitForServerReady();
createWindow();
```

#### **Prévention**
- ✅ Monitorer les temps de chargement avec des métriques
- ✅ Implémenter une stratégie de cache multi-niveaux
- ✅ Utiliser un CDN pour les ressources statiques
- ✅ Optimiser la taille du bundle JavaScript
- ✅ Compresser les données transmises (gzip)

---

### 3.3 Pics de Consommation Mémoire

#### **Symptômes**
- Application utilise > 500 MB de RAM
- Mémoire augmente progressivement (memory leak)
- Système devient lent après quelques heures d'utilisation
- Crash avec « Out of Memory »

#### **Causes Possibles**
1. **Fuites mémoire React** - Composants non nettoyés
2. **Listeners non supprimés** - Event listeners accumulés
3. **Cache illimité** - Données mises en cache indéfiniment
4. **Fichiers non fermés** - Handles de fichiers ouverts
5. **WebSocket non fermé** - Connexions accumulées

#### **Solutions Étape par Étape**

**Solution 1 : Identifier la Fuite avec Chrome DevTools**
```javascript
// 1. Ouvrir DevTools > Memory
// 2. Take heap snapshot
// 3. Utiliser l'app normalement
// 4. Take another heap snapshot
// 5. Comparer et identifier les objets qui augmentent
```

**Solution 2 : Nettoyer les useEffect**
```javascript
// Toujours retourner une fonction de nettoyage
useEffect(() => {
  const subscription = eventSource.subscribe();
  
  return () => {
    subscription.unsubscribe(); // ✅ Nettoyage
  };
}, []);
```

**Solution 3 : Limiter la Taille du Cache**
```javascript
// Dans CacheContext.js
const MAX_CACHE_SIZE = 100; // Limiter à 100 entrées

if (cacheKeys.length > MAX_CACHE_SIZE) {
  // Supprimer les plus anciennes
  const oldestKey = cacheKeys[0];
  delete cache[oldestKey];
}
```

**Solution 4 : Fermer les WebSockets**
```javascript
// Toujours fermer les connexions
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3003');
  
  return () => {
    ws.close(); // ✅ Fermeture
  };
}, []);
```

**Solution 5 : Redémarrage Périodique (Workaround)**
```javascript
// Recommandation : Redémarrer l'app tous les X jours
// Ou implémenter un bouton "Redémarrer" dans les paramètres
```

#### **Prévention**
- ✅ Utiliser React.memo pour éviter les rendus inutiles
- ✅ Profiler régulièrement avec React Profiler
- ✅ Implémenter des tests de fuites mémoire
- ✅ Limiter la durée de vie des caches
- ✅ Documenter les patterns de nettoyage

---

## 4. Problèmes avec Services IA

### 4.1 Ollama Non Disponible

#### **Symptômes**
- Message « Ollama service is not running »
- Chat IA ne répond pas
- Erreur « Connection refused on port 11434 »
- Indicateur « IA Indisponible » affiché

#### **Causes Possibles**
1. **Ollama non installé** - Logiciel absent
2. **Service non démarré** - Ollama arrêté
3. **Port incorrect** - Mauvaise configuration
4. **Modèle non téléchargé** - Modèle IA manquant

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier l'Installation d'Ollama**
```bash
# Tester si Ollama est installé
ollama --version

# Si non installé, télécharger depuis
# https://ollama.ai/download
```

**Solution 2 : Démarrer le Service Ollama**
```bash
# Démarrer manuellement
ollama serve

# Ou comme service (Windows)
sc start OllamaService

# Vérifier l'état
curl http://localhost:11434/api/tags
```

**Solution 3 : Télécharger le Modèle**
```bash
# Télécharger le modèle par défaut (llama2)
ollama pull llama2

# Ou le modèle configuré dans config/ai-config.json
ollama pull mistral
```

**Solution 4 : Vérifier la Configuration**
```javascript
// Dans config/ai-config.json
{
  "ollama": {
    "enabled": true,
    "baseUrl": "http://localhost:11434",
    "model": "llama2",
    "timeout": 30000
  }
}
```

**Solution 5 : Mode Fallback (Sans IA)**
```javascript
// Dans SettingsPage > AI Settings
// Désactiver temporairement Ollama
"aiEnabled": false
```

#### **Prévention**
- ✅ Configurer Ollama comme service Windows (démarrage auto)
- ✅ Télécharger les modèles lors de l'installation initiale
- ✅ Implémenter un healthcheck pour Ollama
- ✅ Fournir des messages d'erreur clairs à l'utilisateur
- ✅ Documenter les alternatives (OpenAI API)

---

### 4.2 Erreurs OCR (Reconnaissance de Texte)

#### **Symptômes**
- Erreur « OCR failed to extract text »
- Texte reconnu contient des caractères incorrects
- Traitement OCR très lent (> 1 minute)
- Images non traitées

#### **Causes Possibles**
1. **Qualité image insuffisante** - Image floue ou basse résolution
2. **Langue non supportée** - OCR configuré pour mauvaise langue
3. **Bibliothèque Tesseract manquante** - Dépendance absente
4. **Mémoire insuffisante** - OCR nécessite beaucoup de RAM
5. **Format image non supporté** - Type de fichier incompatible

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier l'Installation de Tesseract**
```bash
# Vérifier si tesseract.js est installé
npm list tesseract.js

# Si manquant
npm install tesseract.js
```

**Solution 2 : Améliorer la Qualité des Images**
```javascript
// Avant traitement OCR
// 1. Convertir en niveaux de gris
// 2. Augmenter le contraste
// 3. Redimensionner si nécessaire (min 300 DPI)

// Exemple dans DocumentUploader.js
const preprocessImage = (image) => {
  // Conversion en niveaux de gris
  // Augmentation du contraste
  // ...
};
```

**Solution 3 : Configurer la Langue**
```javascript
// Dans config/ai-config.json
{
  "ocr": {
    "language": "fra+eng",  // Français + Anglais
    "psm": 3,  // Page segmentation mode
    "oem": 1   // OCR Engine mode
  }
}
```

**Solution 4 : Optimiser les Performances OCR**
```javascript
// Traiter par lots (batch processing)
const processDocuments = async (files) => {
  const BATCH_SIZE = 3; // 3 documents simultanément max
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(file => processOCR(file)));
  }
};
```

**Solution 5 : Formats Supportés**
```javascript
// Vérifier le format avant traitement
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];

if (!SUPPORTED_FORMATS.includes(file.type)) {
  throw new Error('Format non supporté');
}
```

#### **Prévention**
- ✅ Valider les images avant traitement OCR
- ✅ Fournir des recommandations de qualité à l'utilisateur
- ✅ Implémenter un prétraitement automatique des images
- ✅ Limiter la taille des fichiers (< 10 MB)
- ✅ Afficher une barre de progression pendant l'OCR

---

### 4.3 Agent IA ne Répond Pas

#### **Symptômes**
- Chat reste en attente indéfiniment
- Message « Agent is thinking... » sans fin
- Timeout après 30 secondes
- Réponses vides ou incohérentes

#### **Causes Possibles**
1. **Modèle IA trop lent** - Hardware insuffisant
2. **Prompt trop complexe** - Question mal formulée
3. **Contexte trop long** - Historique de chat volumineux
4. **Service IA surchargé** - Trop de requêtes simultanées
5. **Erreur de parsing** - Réponse mal formatée

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier les Logs d'Ollama**
```bash
# Consulter les logs Ollama
ollama logs

# Chercher des erreurs
grep "error" ~/.ollama/logs/*.log
```

**Solution 2 : Réduire la Taille du Contexte**
```javascript
// Dans ChatInterfaceDocuCortex.js
const MAX_HISTORY = 10; // Limiter à 10 messages

const messages = chatHistory.slice(-MAX_HISTORY);
```

**Solution 3 : Simplifier le Prompt**
```javascript
// Éviter les prompts trop complexes
// MAUVAIS
"Analyse ce document de 50 pages et extrais toutes les informations sur..."

// BON
"Résume les 3 points clés de ce document."
```

**Solution 4 : Augmenter le Timeout**
```javascript
// Dans config/ai-config.json
{
  "ollama": {
    "timeout": 60000  // 60 secondes
  }
}
```

**Solution 5 : Utiliser un Modèle Plus Léger**
```bash
# Passer de llama2 (4GB) à mistral (2GB)
ollama pull mistral

# Mettre à jour config/ai-config.json
"model": "mistral"
```

#### **Prévention**
- ✅ Implémenter une file d'attente pour les requêtes IA
- ✅ Fournir des exemples de bonnes questions
- ✅ Limiter la taille du contexte automatiquement
- ✅ Afficher le temps de traitement estimé
- ✅ Permettre l'annulation des requêtes longues

---

## 5. Problèmes de Permissions

### 5.1 Accès Refusé (403 Forbidden)

#### **Symptômes**
- Message « Vous n'avez pas les permissions nécessaires »
- Boutons grisés ou cachés
- Erreur 403 dans la console
- Redirection vers la page d'accueil

#### **Causes Possibles**
1. **Rôle utilisateur incorrect** - Permissions insuffisantes
2. **Cache de permissions obsolète** - Droits non mis à jour
3. **Configuration permissions incorrecte** - Fichier JSON mal configuré
4. **Groupe AD manquant** - Utilisateur pas dans le bon groupe

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier le Rôle Utilisateur**
```bash
# Dans la base de données SQLite
sqlite3 rds_viewer_data.sqlite

SELECT username, role, permissions FROM users WHERE username = 'nom_utilisateur';
```

**Solution 2 : Forcer le Rafraîchissement des Permissions**
```javascript
// Dans l'interface utilisateur
// Paramètres > Avancé > Rafraîchir les Permissions

// Ou via API
curl -X POST http://localhost:3002/api/users/refresh-permissions \
  -H "Authorization: Bearer TOKEN"
```

**Solution 3 : Vérifier la Configuration des Permissions**
```javascript
// Dans config/permissions-advanced-mock.json
{
  "roles": {
    "admin": {
      "permissions": ["*"]  // Accès total
    },
    "technician": {
      "permissions": ["read:sessions", "write:sessions", "read:users"]
    }
  }
}
```

**Solution 4 : Vérifier l'Appartenance aux Groupes AD**
```powershell
# Lister les groupes de l'utilisateur
Get-ADUser -Identity "nom_utilisateur" -Properties MemberOf | 
  Select-Object -ExpandProperty MemberOf
```

**Solution 5 : Mode Développement (Bypass Permissions)**
```javascript
// UNIQUEMENT POUR DEBUG
// Dans config/config.json
{
  "development": {
    "bypassPermissions": true  // ⚠️ Risque sécurité
  }
}
```

#### **Prévention**
- ✅ Documenter clairement la hiérarchie des rôles
- ✅ Implémenter un système de logs pour les tentatives d'accès refusées
- ✅ Fournir des messages d'erreur explicites
- ✅ Créer un tableau de bord de gestion des permissions
- ✅ Synchroniser régulièrement avec Active Directory

---

### 5.2 Permissions Incohérentes

#### **Symptômes**
- Certaines fonctionnalités accessibles, d'autres non, sans logique
- Permissions changent après reconnexion
- Différence entre permissions affichées et effectives
- Erreurs intermittentes d'accès

#### **Causes Possibles**
1. **Cache de permissions corrompu** - Données incohérentes
2. **Synchronisation AD échouée** - Groupes non à jour
3. **Conflit de rôles multiples** - Règles contradictoires
4. **Base de données corrompue** - Données permissions invalides

#### **Solutions Étape par Étape**

**Solution 1 : Valider la Structure des Permissions**
```bash
# Exécuter le script de validation
node scripts/final-permissions-check.js

# Vérifier le rapport généré
cat logs/permissions-validation/final-check-*.json
```

**Solution 2 : Nettoyer le Cache de Permissions**
```bash
# Supprimer le cache
rmdir /S /Q data\cache\permissions

# Redémarrer l'application
```

**Solution 3 : Forcer la Resynchronisation AD**
```javascript
// Via l'API
curl -X POST http://localhost:3002/api/ad/sync-all

// Ou via l'interface
// Paramètres > Active Directory > Synchroniser Maintenant
```

**Solution 4 : Vérifier les Conflits de Rôles**
```sql
-- Utilisateurs avec plusieurs rôles
SELECT username, GROUP_CONCAT(role) as roles 
FROM user_roles 
GROUP BY username 
HAVING COUNT(role) > 1;
```

**Solution 5 : Réinitialiser les Permissions d'un Utilisateur**
```bash
# Via le script de réparation
node scripts/reset-user-permissions.js --user "nom_utilisateur"
```

#### **Prévention**
- ✅ Implémenter des règles de priorité pour les conflits
- ✅ Logger toutes les modifications de permissions
- ✅ Effectuer des audits réguliers des permissions
- ✅ Automatiser la synchronisation AD (cron job)
- ✅ Créer des tests automatisés de validation des permissions

---

## 6. Problèmes GED

### 6.1 Upload de Fichiers Échoue

#### **Symptômes**
- Erreur « Upload failed »
- Barre de progression reste bloquée
- Message « File too large »
- Fichier n'apparaît pas dans la liste après upload

#### **Causes Possibles**
1. **Fichier trop volumineux** - Dépassement de la limite
2. **Espace disque insuffisant** - Serveur plein
3. **Permissions insuffisantes** - Droits d'écriture manquants
4. **Type de fichier non autorisé** - Extension bloquée
5. **Timeout réseau** - Upload trop long

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier la Taille du Fichier**
```javascript
// Limite par défaut : 50 MB
// Dans server/server.js
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Pour augmenter (attention à l'espace disque)
app.use(express.json({ limit: '100mb' }));
```

**Solution 2 : Vérifier l'Espace Disque**
```bash
# Windows
dir "data\ged"

# Vérifier l'espace disque disponible
wmic logicaldisk get size,freespace,caption
```

**Solution 3 : Vérifier les Permissions**
```bash
# Tester l'écriture dans le dossier GED
echo "test" > "data\ged\test.txt"

# Si erreur, ajuster les permissions
icacls "data\ged" /grant Users:(OI)(CI)F
```

**Solution 4 : Extensions Autorisées**
```javascript
// Dans config/config.json
{
  "ged": {
    "allowedExtensions": [
      ".pdf", ".doc", ".docx", ".xls", ".xlsx", 
      ".jpg", ".jpeg", ".png", ".txt"
    ],
    "maxFileSize": 52428800  // 50 MB en bytes
  }
}
```

**Solution 5 : Upload par Morceaux (Chunked Upload)**
```javascript
// Pour les très gros fichiers
// Diviser l'upload en chunks de 5 MB
const CHUNK_SIZE = 5 * 1024 * 1024;

const uploadLargeFile = async (file) => {
  const chunks = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let i = 0; i < chunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await uploadChunk(chunk, i, chunks);
  }
};
```

#### **Prévention**
- ✅ Afficher clairement les limites de taille avant l'upload
- ✅ Valider les fichiers côté client avant l'envoi
- ✅ Implémenter une barre de progression précise
- ✅ Permettre la reprise des uploads interrompus
- ✅ Nettoyer automatiquement les uploads partiels

---

### 6.2 Recherche GED ne Fonctionne Pas

#### **Symptômes**
- Résultats de recherche vides
- Recherche très lente (> 10 secondes)
- Certains documents ne sont jamais trouvés
- Erreur « Search index not available »

#### **Causes Possibles**
1. **Index de recherche non créé** - Base de recherche manquante
2. **OCR non exécuté** - Texte des documents non extrait
3. **Requête mal formée** - Syntaxe de recherche incorrecte
4. **Cache de recherche obsolète** - Index non mis à jour
5. **Trop de résultats** - Requête trop générale

#### **Solutions Étape par Étape**

**Solution 1 : Reconstruire l'Index de Recherche**
```bash
# Exécuter le script d'indexation
node backend/services/gedService.js --rebuild-index

# Vérifier la progression
tail -f logs/ged-indexing.log
```

**Solution 2 : Lancer l'OCR sur les Documents**
```bash
# Traiter tous les documents sans texte
node backend/services/ocrService.js --process-all

# Ou via l'interface
# Paramètres > GED > Indexer les Documents
```

**Solution 3 : Optimiser la Requête de Recherche**
```javascript
// Utiliser des opérateurs booléens
// ET, OU, NON, guillemets pour phrases exactes

// Exemples :
// "facture 2024" ET client
// contrat OU convention
// rapport NON draft
```

**Solution 4 : Vérifier la Configuration de Recherche**
```javascript
// Dans config/config.json
{
  "ged": {
    "search": {
      "enabled": true,
      "fuzzySearch": true,  // Recherche approximative
      "minQueryLength": 3,  // Minimum 3 caractères
      "maxResults": 100
    }
  }
}
```

**Solution 5 : Utiliser les Filtres**
```javascript
// Filtrer par type, date, auteur
const results = await searchDocuments({
  query: "facture",
  filters: {
    type: "pdf",
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  }
});
```

#### **Prévention**
- ✅ Indexer automatiquement les nouveaux documents
- ✅ Planifier une réindexation hebdomadaire
- ✅ Fournir une aide contextuelle pour la recherche
- ✅ Implémenter une recherche par facettes
- ✅ Monitorer les performances de recherche

---

### 6.3 Documents Corrompus ou Inaccessibles

#### **Symptômes**
- Erreur lors de l'ouverture d'un document
- Aperçu ne s'affiche pas
- Message « File not found »
- Document téléchargé mais vide

#### **Causes Possibles**
1. **Fichier réellement corrompu** - Données endommagées
2. **Chemin de fichier incorrect** - Base de données désynchronisée
3. **Permissions fichier** - Droits d'accès manquants
4. **Virus/Quarantaine** - Fichier bloqué par l'antivirus
5. **Stockage défaillant** - Disque dur endommagé

#### **Solutions Étape par Étape**

**Solution 1 : Vérifier l'Existence du Fichier**
```bash
# Vérifier le chemin dans la base de données
sqlite3 rds_viewer_data.sqlite
SELECT id, filename, filepath FROM ged_documents WHERE id = 123;

# Vérifier que le fichier existe physiquement
dir "chemin\complet\du\fichier.pdf"
```

**Solution 2 : Réparer la Base de Données GED**
```bash
# Synchroniser la base avec le système de fichiers
node scripts/sync-ged-database.js

# Rapport des fichiers orphelins
# Rapport des enregistrements sans fichiers
```

**Solution 3 : Restaurer depuis la Sauvegarde**
```bash
# Si sauvegarde disponible
copy "backups\ged\2024-11-03\fichier.pdf" "data\ged\fichier.pdf"

# Mettre à jour la base de données
UPDATE ged_documents SET status = 'active' WHERE id = 123;
```

**Solution 4 : Vérifier l'Antivirus**
```bash
# Consulter les logs de l'antivirus
# Windows Defender
Get-MpThreatDetection

# Restaurer si faux positif
Restore-MpThreat -ThreatID [ID]
```

**Solution 5 : Détecter les Fichiers Corrompus**
```bash
# Script de validation
node scripts/validate-ged-files.js

# Génère un rapport CSV
# fichier, taille, checksum, état, erreur
```

#### **Prévention**
- ✅ Implémenter des checksums (MD5/SHA256) pour chaque fichier
- ✅ Sauvegarder régulièrement les documents
- ✅ Valider l'intégrité après upload
- ✅ Dupliquer les fichiers critiques
- ✅ Surveiller la santé du stockage (SMART)

---

## 7. Erreurs Courantes et Solutions

### 7.1 Erreur « ERR_INSUFFICIENT_RESOURCES »

#### **Description**
Boucle infinie de requêtes saturant les ressources du navigateur.

#### **Solution**
```javascript
// Ce problème a été résolu dans useDataFetching.js
// Utilisation de useRef au lieu de dépendances directes

// Si le problème persiste :
// 1. Vider le cache du navigateur
// 2. Redémarrer l'application
// 3. Vérifier les logs pour identifier la source
```

---

### 7.2 Erreur « Module not found »

#### **Description**
Dépendance npm manquante ou chemin d'import incorrect.

#### **Solution**
```bash
# Installer les dépendances manquantes
npm install

# Ou spécifiquement
npm install nom-du-module

# Nettoyer et réinstaller si persistant
npm run install:clean
```

---

### 7.3 Erreur « Port Already in Use »

#### **Description**
Un port nécessaire (3000, 3002, 3003, 8080) est déjà utilisé.

#### **Solution**
```bash
# Identifier le processus
netstat -ano | findstr :3002

# Terminer le processus (remplacer PID)
taskkill /PID [numéro_pid] /F

# Ou utiliser un autre port
SET PORT=3005
npm start
```

---

### 7.4 Erreur « WebSocket Connection Failed »

#### **Description**
Impossible de se connecter au serveur WebSocket.

#### **Solution**
```bash
# Vérifier que le serveur backend est démarré
curl http://localhost:3002/api/config

# Vérifier le port WebSocket
netstat -ano | findstr :3003

# Redémarrer le serveur
node server/server.js
```

---

### 7.5 Erreur « SQLITE_BUSY »

#### **Description**
La base de données SQLite est verrouillée par un autre processus.

#### **Solution**
```bash
# Attendre quelques secondes et réessayer

# Si persistant, vérifier les processus accédant à la base
handle.exe rds_viewer_data.sqlite

# En dernier recours, redémarrer l'application
```

---

### 7.6 Erreur « CORS Policy »

#### **Description**
Requête bloquée par la politique CORS du navigateur.

#### **Solution**
```javascript
// Vérifier la configuration CORS dans server/server.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3005'],
  credentials: true
}));

// Ajouter les origines nécessaires
```

---

### 7.7 Erreur « Cannot Read Property of Undefined »

#### **Description**
Tentative d'accès à une propriété d'un objet undefined ou null.

#### **Solution**
```javascript
// Utiliser l'optional chaining (?.)
const value = data?.user?.name;

// Ou vérifier avant d'accéder
if (data && data.user && data.user.name) {
  const name = data.user.name;
}

// Utiliser des valeurs par défaut
const name = data?.user?.name || 'Inconnu';
```

---

## 8. Logs et Diagnostics

### 8.1 Où Trouver les Logs

#### **Logs Electron (Application)**
```bash
# Windows
%APPDATA%\RDS Viewer\logs\main.log
%APPDATA%\RDS Viewer\logs\renderer.log

# Chemin complet typique
C:\Users\[VotreNom]\AppData\Roaming\RDS Viewer\logs\
```

#### **Logs Backend (Serveur Node.js)**
```bash
# Dossier de l'application
logs\server.log
logs\database.log
logs\api.log

# Console directe
# Si démarré manuellement : voir la console du terminal
```

#### **Logs React (Frontend)**
```bash
# Console du navigateur (F12)
# Ou console DevTools Electron

# Logs sauvegardés
%APPDATA%\RDS Viewer\logs\renderer.log
```

#### **Logs Spécifiques**
```bash
# Logs de permissions
logs\permissions-validation\

# Logs GED
logs\ged\

# Logs OCR
logs\ocr\

# Logs IA
logs\ai\
```

---

### 8.2 Comment Lire les Logs

#### **Format des Logs**
```
[2025-11-04 14:53:04] [INFO] Message de log
[2025-11-04 14:53:05] [ERROR] Erreur survenue : détails
[2025-11-04 14:53:06] [WARN] Avertissement
```

#### **Niveaux de Log**
- **DEBUG** : Informations détaillées pour le développement
- **INFO** : Informations générales (démarrage, connexion, etc.)
- **WARN** : Avertissements (non bloquants)
- **ERROR** : Erreurs (nécessitent attention)
- **FATAL** : Erreurs critiques (application inutilisable)

#### **Rechercher des Erreurs**
```bash
# Windows PowerShell
Get-Content "logs\main.log" | Select-String "ERROR"

# Ou avec findstr
findstr /i "error" logs\main.log

# Dernières lignes du log
Get-Content "logs\main.log" -Tail 50
```

---

### 8.3 Activer les Logs de Debug

#### **Mode Développement**
```bash
# Démarrer avec logs verbeux
SET DEBUG=*
npm start

# Ou spécifiquement pour certains modules
SET DEBUG=express:*,ldap:*
node server/server.js
```

#### **Electron DevTools**
```javascript
// Dans electron/main.js
// Décommenter cette ligne (ligne 91)
mainWindow.webContents.openDevTools();

// Ou ouvrir manuellement avec
// Ctrl+Maj+I dans l'application
```

#### **Logs SQL**
```javascript
// Dans backend/services/databaseService.js
// Activer les logs SQL
db.verbose().on('trace', (sql) => {
  console.log('[SQL]', sql);
});
```

---

### 8.4 Exporter les Logs pour Support

#### **Script d'Export Automatique**
```bash
# Créer un archive de logs
node scripts/export-logs.js

# Génère : logs-export-2025-11-04.zip
# Contient : tous les logs + config + état système
```

#### **Export Manuel**
```bash
# Créer un dossier de support
mkdir support-logs
xcopy logs support-logs\ /E /I
copy config\config.json support-logs\
systeminfo > support-logs\system-info.txt

# Compresser
powershell Compress-Archive -Path support-logs -DestinationPath support-logs.zip
```

---

## 9. Procédures de Réparation

### 9.1 Réinitialisation Légère

#### **Quand l'Utiliser**
- L'application ne répond plus correctement
- Comportement instable ou imprévisible
- Après une mise à jour problématique

#### **Procédure**
```bash
# 1. Fermer complètement l'application
taskkill /F /IM "RDS Viewer.exe"

# 2. Nettoyer le cache
rmdir /S /Q "%APPDATA%\RDS Viewer\cache"

# 3. Supprimer les données temporaires
rmdir /S /Q "%APPDATA%\RDS Viewer\temp"

# 4. Conserver les configurations et logs
# Ne PAS supprimer config\ ni logs\

# 5. Redémarrer l'application
```

---

### 9.2 Réinitialisation Complète

#### **Quand l'Utiliser**
- Erreurs persistantes malgré dépannage
- Configuration corrompue
- Retour à l'état d'usine nécessaire

#### **Procédure**
```bash
# ⚠️ ATTENTION : Sauvegarde OBLIGATOIRE avant

# 1. Sauvegarder les données importantes
mkdir backup-rds-viewer
xcopy "%APPDATA%\RDS Viewer" backup-rds-viewer\ /E /I
xcopy config backup-rds-viewer\config\ /E /I

# 2. Fermer l'application
taskkill /F /IM "RDS Viewer.exe"
taskkill /F /IM node.exe

# 3. Supprimer tous les fichiers utilisateur
rmdir /S /Q "%APPDATA%\RDS Viewer"

# 4. Nettoyer l'installation (mode dev)
rmdir /S /Q node_modules
rmdir /S /Q build
rmdir /S /Q dist

# 5. Réinstaller
npm install
npm run build

# 6. Redémarrer l'application
```

---

### 9.3 Réinstallation de l'Application

#### **Méthode Propre**
```bash
# 1. Sauvegarder la configuration
copy config\config.json backup-config.json

# 2. Désinstaller (si installé via Setup)
# Panneau de configuration > Programmes > Désinstaller RDS Viewer

# 3. Nettoyer les résidus
rmdir /S /Q "%APPDATA%\RDS Viewer"
rmdir /S /Q "C:\Program Files\RDS Viewer"

# 4. Réinstaller depuis le setup
# RDS-Viewer-Setup-3.0.31.exe

# 5. Restaurer la configuration
copy backup-config.json "C:\Program Files\RDS Viewer\config\config.json"
```

---

### 9.4 Réparation de la Base de Données

#### **Diagnostic**
```bash
# Vérifier l'intégrité
sqlite3 rds_viewer_data.sqlite "PRAGMA integrity_check;"

# Si retourne autre chose que "ok", la base est corrompue
```

#### **Réparation**
```bash
# 1. Sauvegarder immédiatement
copy rds_viewer_data.sqlite rds_viewer_data.sqlite.backup

# 2. Exporter les données
sqlite3 rds_viewer_data.sqlite .dump > backup.sql

# 3. Recréer la base
del rds_viewer_data.sqlite
sqlite3 rds_viewer_data.sqlite < backup.sql

# 4. Vérifier
sqlite3 rds_viewer_data.sqlite "PRAGMA integrity_check;"

# 5. Optimiser
sqlite3 rds_viewer_data.sqlite "VACUUM; ANALYZE;"
```

---

### 9.5 Reconstruction de l'Index de Recherche

#### **Procédure**
```bash
# 1. Arrêter l'application
taskkill /F /IM "RDS Viewer.exe"

# 2. Supprimer l'ancien index
rmdir /S /Q data\search-index

# 3. Lancer la réindexation
node scripts/rebuild-search-index.js

# 4. Vérifier la progression
tail -f logs\indexing.log

# 5. Redémarrer l'application
```

---

### 9.6 Réinstallation des Services IA

#### **Ollama**
```bash
# 1. Arrêter Ollama
sc stop OllamaService
taskkill /F /IM ollama.exe

# 2. Désinstaller
# Panneau de configuration > Programmes > Désinstaller Ollama

# 3. Nettoyer les résidus
rmdir /S /Q "%LOCALAPPDATA%\Ollama"
rmdir /S /Q "%USERPROFILE%\.ollama"

# 4. Réinstaller
# Télécharger depuis https://ollama.ai/download

# 5. Télécharger les modèles
ollama pull llama2
ollama pull mistral
```

#### **Tesseract OCR**
```bash
# Réinstaller la dépendance
npm uninstall tesseract.js
npm install tesseract.js

# Télécharger les fichiers de langue
node scripts/download-tesseract-lang.js
```

---

## 📞 Obtenir de l'Aide Supplémentaire

### Support Technique

**Email :** support@anecoop.local  
**Téléphone :** +34 xxx xxx xxx  
**Heures :** Lun-Ven 9h-18h

### Informations à Fournir

Lors d'une demande de support, merci de fournir :

1. ✅ **Version de l'application** : Menu > À Propos
2. ✅ **Système d'exploitation** : Windows 10/11, version
3. ✅ **Description du problème** : Symptômes détaillés
4. ✅ **Logs récents** : Exporter via scripts/export-logs.js
5. ✅ **Captures d'écran** : Si erreur visuelle
6. ✅ **Étapes pour reproduire** : Comment déclencher le problème

### Ressources Additionnelles

- 📖 **Documentation complète** : `docs/`
- 🚀 **Guide de démarrage** : `GUIDE_INSTALLATION_COMPLET.md`
- 🔧 **Guide de déploiement** : `GUIDE_DEPLOIEMENT_PRODUCTION.md`
- 🤖 **Guide Agent IA** : `GUIDE_AGENT_IA.md`

---

## 📝 Historique des Révisions

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 2025-11-04 | Création initiale du guide |

---

**© 2025 Anecoop - RDS Viewer - Tous droits réservés**
