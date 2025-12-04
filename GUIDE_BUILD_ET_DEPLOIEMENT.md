# 🚀 Guide de Build et Déploiement - RDS Viewer v3.1.0

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Build de l'Application](#build-de-lapplication)
3. [Configuration des Mises à Jour Automatiques](#configuration-des-mises-à-jour-automatiques)
4. [Déploiement](#déploiement)
5. [Test des Mises à Jour](#test-des-mises-à-jour)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Prérequis

### Logiciels Requis

- **Node.js** v18.x ou supérieur
  Télécharger: https://nodejs.org/

- **npm** v8.x ou supérieur
  (Inclus avec Node.js)

- **Windows 10/11** (pour build Windows)

### Vérification

```bash
node --version
# Doit afficher: v18.x.x ou supérieur

npm --version
# Doit afficher: 8.x.x ou supérieur
```

---

## 🔨 Build de l'Application

### Méthode 1: Script Automatisé (Recommandé)

```bash
# Lancer le script de build
build-release.bat
```

Ce script effectue automatiquement:
1. ✅ Vérification de Node.js et npm
2. ✅ Nettoyage des anciens builds
3. ✅ Installation des dépendances
4. ✅ Build React (production optimisée)
5. ✅ Build Electron (portable .exe)
6. ✅ Copie du fichier latest.yml
7. ✅ Affichage des instructions de déploiement

**Durée:** 5-15 minutes selon votre machine

### Méthode 2: Commandes Manuelles

```bash
# 1. Nettoyer
rmdir /s /q dist
rmdir /s /q build

# 2. Installer les dépendances (si nécessaire)
npm install

# 3. Build React
npm run build

# 4. Build Electron portable
npx electron-builder --config electron-builder-release.json --win portable --x64
```

### Fichiers Générés

Après le build, vous trouverez dans `dist/`:

```
dist/
├── RDS Viewer-3.1.0-Portable.exe    (Application portable, ~150-200 MB)
├── latest.yml                        (Configuration auto-update)
└── builder-effective-config.yaml     (Config electron-builder utilisée)
```

---

## ⚙️ Configuration des Mises à Jour Automatiques

### 1. Configuration Serveur de Mises à Jour

Le serveur de mises à jour est configuré dans `electron-builder-release.json`:

```json
{
  "publish": [
    {
      "provider": "generic",
      "url": "https://updates.anecoop.local",
      "channel": "latest"
    }
  ]
}
```

**À modifier selon votre infrastructure:**
- `url`: URL de votre serveur de mises à jour
- `channel`: Canal de distribution (`latest`, `beta`, `alpha`)

### 2. Structure du Serveur de Mises à Jour

Votre serveur doit exposer les fichiers suivants:

```
https://updates.anecoop.local/
├── RDS Viewer-3.1.0-Portable.exe
├── latest.yml
└── (versions précédentes si backup souhaité)
```

**Configuration Apache/Nginx:**

```nginx
# Exemple Nginx
server {
    listen 80;
    server_name updates.anecoop.local;

    root /var/www/updates;

    location / {
        autoindex on;
        add_header Access-Control-Allow-Origin *;
    }
}
```

```apache
# Exemple Apache
<VirtualHost *:80>
    ServerName updates.anecoop.local
    DocumentRoot /var/www/updates

    <Directory /var/www/updates>
        Options +Indexes
        Require all granted
        Header set Access-Control-Allow-Origin "*"
    </Directory>
</VirtualHost>
```

### 3. Génération du Hash SHA512

Le fichier `latest.yml` contient le hash SHA512 de l'exe pour vérifier l'intégrité.

**Méthode Windows (PowerShell):**

```powershell
Get-FileHash -Path "dist\RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512 | Select-Object Hash
```

**Méthode Linux/Mac:**

```bash
sha512sum "dist/RDS Viewer-3.1.0-Portable.exe"
```

### 4. Mise à Jour de latest.yml

Éditer `dist/latest.yml` et remplacer les valeurs:

```yaml
version: 3.1.0
files:
  - url: RDS Viewer-3.1.0-Portable.exe
    sha512: [VOTRE_HASH_SHA512_ICI]
    size: [TAILLE_EN_OCTETS]
path: RDS Viewer-3.1.0-Portable.exe
sha512: [VOTRE_HASH_SHA512_ICI]
releaseDate: '2025-11-26T12:00:00.000Z'
```

**Obtenir la taille du fichier:**

```powershell
# PowerShell
(Get-Item "dist\RDS Viewer-3.1.0-Portable.exe").Length
```

```bash
# Linux/Mac
stat -f%z "dist/RDS Viewer-3.1.0-Portable.exe"
```

---

## 📤 Déploiement

### Étape 1: Préparation des Fichiers

```bash
# 1. Calculer le hash SHA512
$hash = (Get-FileHash -Path "dist\RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512).Hash

# 2. Obtenir la taille
$size = (Get-Item "dist\RDS Viewer-3.1.0-Portable.exe").Length

# 3. Afficher les valeurs
Write-Host "SHA512: $hash"
Write-Host "Size: $size bytes"
```

### Étape 2: Mettre à Jour latest.yml

Remplacer dans `dist/latest.yml`:
- `sha512`: Coller le hash calculé
- `size`: Coller la taille en octets

### Étape 3: Upload sur le Serveur

**Méthode FTP/SFTP:**

```bash
# Exemple avec scp
scp "dist/RDS Viewer-3.1.0-Portable.exe" user@updates.anecoop.local:/var/www/updates/
scp "dist/latest.yml" user@updates.anecoop.local:/var/www/updates/
```

**Méthode Réseau Local (Windows):**

```bash
# Copier vers un partage réseau
copy "dist\RDS Viewer-3.1.0-Portable.exe" "\\serveur\updates\"
copy "dist\latest.yml" "\\serveur\updates\"
```

### Étape 4: Vérification

Tester l'accessibilité:

```bash
# Vérifier latest.yml
curl https://updates.anecoop.local/latest.yml

# Vérifier l'exe (téléchargement partiel)
curl -I https://updates.anecoop.local/RDS%20Viewer-3.1.0-Portable.exe
```

---

## 🧪 Test des Mises à Jour

### Test Manuel

1. **Installer une version ancienne** (ex: 3.0.26)

2. **Configurer l'URL de mise à jour**

   Modifier `config/config.json` dans l'application:
   ```json
   {
     "updateUrl": "https://updates.anecoop.local"
   }
   ```

3. **Lancer l'application**

   Au démarrage, l'application vérifie automatiquement les mises à jour.

4. **Vérifier les logs**

   Chercher dans les logs Electron:
   ```
   [Updater] 🔍 Vérification des mises à jour...
   [Updater] ✅ Mise à jour disponible: 3.1.0
   ```

5. **Accepter la mise à jour**

   - Cliquer sur "Oui" dans la boîte de dialogue
   - L'application télécharge et installe automatiquement
   - Redémarrage automatique

### Test en Temps Réel (Application Ouverte)

L'application vérifie les mises à jour:
- ✅ Au démarrage
- ✅ Toutes les heures (configurable)
- ✅ Manuellement via menu "Aide > Vérifier les mises à jour"

Pour tester:

1. Déployer la nouvelle version sur le serveur
2. Dans l'application: **Aide > Vérifier les mises à jour**
3. La notification apparaît immédiatement

---

## 🔍 Logs et Debugging

### Emplacement des Logs

```
Windows:
C:\Users\[USERNAME]\AppData\Roaming\rds-viewer\logs\

Fichiers:
- main.log (logs Electron)
- renderer.log (logs React)
```

### Messages Clés

```
[Updater] 🔍 Vérification des mises à jour...
[Updater] ✅ Mise à jour disponible: 3.1.0
[Updater] 📥 Téléchargement: 45.23%
[Updater] ✅ Mise à jour téléchargée.
[Updater] 🔄 Installation en cours...
```

### Activer les Logs Détaillés

Modifier `electron/main.js`:

```javascript
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
```

---

## 🐛 Troubleshooting

### Problème: "Erreur de vérification des mises à jour"

**Causes possibles:**
1. URL du serveur incorrecte
2. Serveur inaccessible
3. Fichier latest.yml absent ou malformé
4. Problème de CORS

**Solutions:**

1. **Vérifier l'URL:**
   ```bash
   curl https://updates.anecoop.local/latest.yml
   ```

2. **Vérifier CORS:**
   Le serveur doit autoriser les requêtes cross-origin:
   ```
   Access-Control-Allow-Origin: *
   ```

3. **Valider latest.yml:**
   ```yaml
   # Doit être un YAML valide
   version: 3.1.0
   files:
     - url: RDS Viewer-3.1.0-Portable.exe
   ```

### Problème: "Hash SHA512 incorrect"

**Cause:** Le hash dans latest.yml ne correspond pas au fichier .exe

**Solution:**

```powershell
# Recalculer le hash
$hash = (Get-FileHash -Path "RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512).Hash
Write-Host $hash

# Mettre à jour latest.yml avec le nouveau hash
```

### Problème: Mise à jour téléchargée mais ne s'installe pas

**Causes:**
1. Application non fermée proprement
2. Permissions insuffisantes
3. Antivirus bloquant

**Solutions:**

1. **Fermer complètement l'application:**
   ```
   Fichier > Quitter (ou Ctrl+Q)
   ```

2. **Exécuter en tant qu'administrateur** (si nécessaire)

3. **Ajouter une exception antivirus** pour le dossier de l'application

### Problème: "Update not available" alors que nouvelle version existe

**Causes:**
1. Version dans latest.yml ≤ version actuelle
2. Cache du fichier latest.yml

**Solutions:**

1. **Vérifier la version dans latest.yml:**
   ```yaml
   version: 3.1.0  # Doit être > version actuelle
   ```

2. **Forcer le rechargement:**
   ```bash
   # Ajouter un paramètre de cache buster
   https://updates.anecoop.local/latest.yml?t=123456789
   ```

3. **Supprimer le cache local:**
   ```
   C:\Users\[USERNAME]\AppData\Roaming\rds-viewer\Cache\
   ```

---

## 📊 Checklist de Déploiement

Avant de déployer en production:

- [ ] Build de l'application réussi (`build-release.bat`)
- [ ] Hash SHA512 calculé et vérifié
- [ ] Fichier latest.yml mis à jour avec hash et taille corrects
- [ ] Version incrémentée dans package.json et latest.yml
- [ ] Notes de version rédigées dans latest.yml
- [ ] Fichiers uploadés sur le serveur de mises à jour
- [ ] Accessibilité du serveur vérifiée (curl/wget)
- [ ] CORS configuré sur le serveur
- [ ] Test manuel effectué avec version ancienne
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Communication aux utilisateurs envoyée

---

## 🎯 Meilleures Pratiques

### Versioning

Suivre le semantic versioning:
```
MAJOR.MINOR.PATCH
3.1.0

MAJOR: Changements incompatibles (breaking changes)
MINOR: Nouvelles fonctionnalités (backward compatible)
PATCH: Corrections de bugs
```

### Canaux de Distribution

Utiliser plusieurs canaux pour tester avant production:

```json
{
  "publish": [
    {
      "provider": "generic",
      "url": "https://updates.anecoop.local",
      "channel": "beta"  // ou "alpha", "latest"
    }
  ]
}
```

### Rollback

Garder toujours les versions précédentes:

```
updates.anecoop.local/
├── RDS Viewer-3.1.0-Portable.exe
├── RDS Viewer-3.0.26-Portable.exe  (backup)
├── latest.yml
└── latest-3.0.26.yml               (backup)
```

En cas de problème, restaurer l'ancien latest.yml:

```bash
cp latest-3.0.26.yml latest.yml
```

---

## 📞 Support

En cas de problème:

1. **Consulter les logs:** `%APPDATA%\rds-viewer\logs\`
2. **Vérifier la documentation:** Ce fichier + README.md
3. **Contacter le support:** support@anecoop.com

---

**Version du Guide:** 1.0
**Dernière Mise à Jour:** 26 Novembre 2025
**Auteur:** Équipe Technique Anecoop
