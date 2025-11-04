# Scripts de Build Electron Builder
## RDS Viewer Anecoop v3.0.27

---

## 📋 Vue d'Ensemble

Ce dossier contient les scripts de hooks pour Electron Builder. Ces scripts s'exécutent automatiquement à différentes étapes du processus de build.

## 📁 Fichiers

```
scripts/
├── before-build.js              # Avant le build
├── after-sign.js                # Après la signature
├── after-pack.js                # Après le packaging
├── after-all-artifact-build.js  # Après tous les builds
└── README.md                    # Ce fichier
```

## 🔄 Ordre d'Exécution

1. **before-build.js** - S'exécute en premier
2. Build React (séparé)
3. Packaging Electron
4. **after-pack.js** - Après chaque package
5. **after-sign.js** - Après la signature (si configurée)
6. Création des installeurs
7. **after-all-artifact-build.js** - En dernier, après tout

## 📝 Description des Scripts

### 1. before-build.js

**Quand:** Avant le début du build Electron  
**Durée:** ~5 secondes

**Actions:**
- ✅ Vérifie que le build React existe
- ✅ Vérifie les icônes (icon.ico)
- ✅ Valide package.json
- ✅ Nettoie les anciens builds
- ✅ Crée build-info.json
- ✅ Vérifie l'espace disque

**Test manuel:**
```bash
node scripts/before-build.js
```

### 2. after-sign.js

**Quand:** Après la signature de code (si WIN_CSC_LINK configuré)  
**Durée:** ~2 secondes

**Actions:**
- ✅ Vérifie la signature Windows (signtool)
- ✅ Crée signature-log.json
- ✅ Log les informations de certificat

**Test manuel:**
```bash
node scripts/after-sign.js
```

**Note:** Si aucun certificat n'est configuré, ce script log juste un avertissement.

### 3. after-pack.js

**Quand:** Après le packaging de l'application (avant l'installeur)  
**Durée:** ~10 secondes

**Actions:**
- ✅ Ajoute LICENSE.txt et VERSION.txt
- ✅ Crée README.txt pour le package
- ✅ Calcule la taille du package
- ✅ Crée package-manifest.json
- ✅ Liste les fichiers du package

**Fichiers créés dans le package:**
- LICENSE.txt
- VERSION.txt
- README.txt
- package-size.txt
- package-manifest.json

**Test manuel:**
```bash
node scripts/after-pack.js
```

### 4. after-all-artifact-build.js

**Quand:** Après que TOUS les artefacts ont été construits  
**Durée:** ~30 secondes

**Actions:**
- ✅ Liste tous les artefacts
- ✅ Calcule les checksums SHA256
- ✅ Génère un rapport de build complet
- ✅ Crée les release notes
- ✅ Affiche un résumé final

**Fichiers créés dans dist/:**
- checksums.json - Checksums JSON
- SHA256SUMS.txt - Checksums texte
- build-report.json - Rapport JSON
- build-report.txt - Rapport texte lisible
- release-notes.md - Notes de version

**Test manuel:**
```bash
node scripts/after-all-artifact-build.js
```

## 🛠️ Configuration

### Dans electron-builder.yml

```yaml
beforeBuild: "scripts/before-build.js"
afterSign: "scripts/after-sign.js"
afterPack: "scripts/after-pack.js"
afterAllArtifactBuild: "scripts/after-all-artifact-build.js"
```

### Dans electron-builder.json

```json
{
  "beforeBuild": "scripts/before-build.js",
  "afterSign": "scripts/after-sign.js",
  "afterPack": "scripts/after-pack.js",
  "afterAllArtifactBuild": "scripts/after-all-artifact-build.js"
}
```

**Note:** Ces hooks sont déjà configurés dans les fichiers de configuration fournis.

## 🚀 Utilisation

### Build Normal

Les scripts s'exécutent automatiquement lors du build:

```bash
# Build complet
npm run build
electron-builder --config build/electron-builder.yml
```

### Désactiver les Scripts

Pour désactiver temporairement les scripts, commentez-les dans la configuration:

```yaml
# beforeBuild: "scripts/before-build.js"
# afterSign: "scripts/after-sign.js"
# afterPack: "scripts/after-pack.js"
# afterAllArtifactBuild: "scripts/after-all-artifact-build.js"
```

### Tester Individuellement

Chaque script peut être testé séparément:

```bash
# Tester before-build
node scripts/before-build.js

# Tester after-sign
node scripts/after-sign.js

# Tester after-pack
node scripts/after-pack.js

# Tester after-all-artifact-build
node scripts/after-all-artifact-build.js
```

## 📊 Sorties des Scripts

### Console

Tous les scripts affichent des logs dans la console:

```
ℹ️ [2025-11-04T14:00:00.000Z] Message d'information
✅ [2025-11-04T14:00:01.000Z] Succès
⚠️ [2025-11-04T14:00:02.000Z] Avertissement
❌ [2025-11-04T14:00:03.000Z] Erreur
```

### Fichiers Générés

**Dans build/ (source):**
- build-info.json

**Dans dist/win-unpacked/ (package):**
- LICENSE.txt
- VERSION.txt
- README.txt
- package-size.txt
- package-manifest.json

**Dans dist/ (artefacts):**
- checksums.json
- SHA256SUMS.txt
- build-report.json
- build-report.txt
- release-notes.md
- signature-log.json

## 🔧 Personnalisation

### Ajouter des Actions

Vous pouvez modifier les scripts pour ajouter vos propres actions:

#### Exemple: Envoyer une notification

```javascript
// Dans after-all-artifact-build.js
async function sendNotification(buildResult) {
  // Envoyer un email
  // Notifier Slack
  // etc.
}
```

#### Exemple: Upload automatique

```javascript
// Dans after-all-artifact-build.js
async function uploadArtifacts(artifactPaths) {
  // Upload vers S3
  // Upload vers serveur FTP
  // etc.
}
```

#### Exemple: Mise à jour automatique du changelog

```javascript
// Dans before-build.js
async function updateChangelog() {
  // Lire CHANGELOG.md
  // Ajouter une nouvelle entrée
  // etc.
}
```

### Structure d'un Hook

Tous les hooks suivent cette structure:

```javascript
#!/usr/bin/env node

// Fonction principale (async)
async function hookFunction(context) {
  // Votre code ici
  console.log('Hook exécuté');
}

// Export pour electron-builder
exports.default = hookFunction;

// Test direct (optionnel)
if (require.main === module) {
  hookFunction({}).then(() => {
    console.log('Test terminé');
  }).catch(error => {
    console.error('Erreur:', error);
    process.exit(1);
  });
}
```

## 🐛 Dépannage

### Erreur: "Cannot find module"

```bash
# Vérifier que les dépendances sont installées
npm install
```

### Erreur: "Permission denied"

```bash
# Linux/Mac: Rendre les scripts exécutables
chmod +x scripts/*.js

# Windows: Exécuter avec Node explicitement
node scripts/before-build.js
```

### Scripts ne s'exécutent pas

**Vérifications:**
1. Les chemins dans electron-builder.yml sont corrects
2. Les scripts ont les permissions d'exécution
3. Node.js est dans le PATH

**Debug:**
```bash
# Build en mode debug
DEBUG=electron-builder electron-builder --config build/electron-builder.yml
```

### Erreur dans un script

Les scripts sont conçus pour:
- **before-build.js**: Arrête le build en cas d'erreur critique
- **Autres scripts**: Affichent un warning mais continuent

Pour rendre un script non-bloquant:
```javascript
try {
  // Code qui peut échouer
} catch (error) {
  log('Erreur non-critique', 'warning');
  // Ne pas faire process.exit(1)
}
```

## 📚 Ressources

### Electron Builder Hooks Documentation

- https://www.electron.build/configuration/configuration#hooks

### Hooks Disponibles

- `beforeBuild` - Avant le build
- `afterPack` - Après le packaging
- `afterSign` - Après la signature
- `afterAllArtifactBuild` - Après tous les artefacts
- `onNodeModuleFile` - Pour chaque fichier de node_modules
- `beforePack` - Avant le packaging (moins utilisé)

### Context Objects

Chaque hook reçoit un objet context différent:

**beforeBuild:**
```javascript
{
  appDir: '/path/to/app',
  electronVersion: '28.2.0',
  platform: 'win32',
  arch: 'x64'
}
```

**afterPack:**
```javascript
{
  appOutDir: '/path/to/dist/win-unpacked',
  packager: { /* ... */ },
  electronPlatformName: 'win32',
  arch: 'x64'
}
```

**afterAllArtifactBuild:**
```javascript
{
  outDir: '/path/to/dist',
  artifactPaths: ['/path/to/Setup.exe', ...],
  configuration: { /* ... */ }
}
```

## ✅ Checklist

Avant de modifier les scripts:

- [ ] Sauvegarder les scripts originaux
- [ ] Tester les modifications en standalone
- [ ] Vérifier que le build fonctionne
- [ ] Documenter les changements
- [ ] Commit dans Git

## 🎯 Bonnes Pratiques

1. **Logs clairs:** Utilisez des logs descriptifs
2. **Gestion d'erreurs:** Gérez les erreurs proprement
3. **Performance:** Évitez les opérations longues
4. **Idempotence:** Les scripts doivent pouvoir être réexécutés
5. **Documentation:** Documentez les modifications

## 📞 Support

Pour toute question sur les scripts:
1. Consulter ce README
2. Consulter la documentation Electron Builder
3. Vérifier les logs de build
4. Contacter le support technique

---

**Version:** 3.0.27  
**Date:** 2025-11-04  
**Auteur:** Anecoop Configuration Team

**Scripts optimisés pour un build professionnel et automatisé.**
