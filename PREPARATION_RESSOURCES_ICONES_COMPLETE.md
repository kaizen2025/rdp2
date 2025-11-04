# Guide de Préparation des Ressources - DocuCortex IA

## 📋 Résumé de la Préparation

Toutes les ressources nécessaires pour l'application Electron DocuCortex IA ont été préparées avec succès.

Date de création: 2025-11-04
Version de l'application: 3.0.31

## ✅ Fichiers Créés

### 1. Documentation des Icônes
- **build/icons/README.md** - Guide complet sur les icônes nécessaires, spécifications et outils

### 2. Script de Génération d'Icônes
- **generate-icons.js** - Script automatique de génération d'icônes
  - Génère icon.ico (Windows) multi-résolution
  - Génère icon.png (Linux) 512x512
  - Crée toutes les variantes de taille
  - Support ImageMagick et Sharp
  - Génère une icône exemple si aucune source n'est fournie

### 3. Configuration package.json
Modifications apportées au package.json:

#### Métadonnées ajoutées:
```json
{
  "author": {
    "name": "DocuCortex Team",
    "email": "contact@docucortex.com",
    "url": "https://www.docucortex.com"
  },
  "homepage": "https://www.docucortex.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/docucortex/docucortex-ia.git"
  },
  "license": "MIT"
}
```

#### Scripts ajoutés:
- `generate-icons` - Génère les icônes
- `pack` - Build sans empaquetage (test rapide)
- `dist` - Build complet
- `build:win` - Build pour Windows
- `build:linux` - Build pour Linux
- `build:mac` - Build pour macOS
- `build:all` - Build multi-plateforme
- `postinstall` - Installation des dépendances Electron

#### Configuration electron-builder complète:
- **appId**: com.docucortex.ia
- **productName**: DocuCortex IA
- **Cibles Windows**: NSIS (x64, ia32), Portable (x64)
- **Cibles Linux**: AppImage, deb, rpm, snap
- **Cibles macOS**: dmg, zip
- **Compression**: normal
- **ASAR**: activé
- **Publish**: GitHub Releases

### 4. Scripts d'Installation Linux
- **build/scripts/after-install.sh** - Script post-installation
  - Crée les dossiers utilisateur
  - Configure les permissions
  - Crée le fichier de configuration
  - Met à jour les bases de données système

- **build/scripts/after-remove.sh** - Script post-désinstallation
  - Nettoie les liens symboliques
  - Met à jour les bases de données
  - Informe l'utilisateur des données conservées

### 5. Configuration NSIS Windows
- **build/installer.nsh** - Configuration personnalisée de l'installeur Windows
  - Vérification des versions précédentes
  - Création des dossiers de données utilisateur
  - Configuration du registre Windows
  - Gestion des raccourcis
  - Messages en français
  - Interface personnalisée

### 6. Permissions macOS
- **build/entitlements.mac.plist** - Droits d'accès macOS
  - Accès réseau
  - Accès fichiers
  - Hardened Runtime
  - Permissions caméra/audio

### 7. Icônes Générées
- **assets/icon-source.png** - Image source (1024x1024)
- **build/icons/icon.ico** - Icône Windows multi-résolution
- **build/icons/icon.png** - Icône Linux (512x512)
- **build/icons/icon-{size}.png** - Variantes: 16, 32, 48, 64, 128, 256, 512, 1024

## 📦 Dépendances Ajoutées

Dans devDependencies:
- `electron-builder` ^24.9.1 - Empaquetage Electron
- `sharp` ^0.33.0 - Manipulation d'images
- `png2icons` ^2.0.1 - Conversion PNG vers ICO/ICNS

## 🚀 Utilisation

### Génération des Icônes

Pour générer les icônes à partir d'une image source personnalisée:

```bash
# 1. Placer votre image dans assets/icon-source.png (min 512x512, idéal 1024x1024)
# 2. Exécuter le script
npm run generate-icons
```

Une icône exemple est déjà générée pour commencer rapidement.

### Build de l'Application

```bash
# Installer les dépendances (si ce n'est pas déjà fait)
npm install

# Build pour Windows
npm run build:win

# Build pour Linux
npm run build:linux

# Build pour macOS
npm run build:mac

# Build pour toutes les plateformes
npm run build:all
```

Les fichiers générés se trouvent dans le dossier `dist/`.

### Test sans Empaquetage

Pour tester rapidement sans créer les installeurs:

```bash
npm run pack
```

Les fichiers non empaquetés se trouvent dans `dist/win-unpacked/` (ou linux-unpacked/mac/).

## 📁 Structure Créée

```
rdp/
├── assets/
│   └── icon-source.png          # Image source pour générer les icônes
├── build/
│   ├── icons/
│   │   ├── README.md             # Documentation des icônes
│   │   ├── icon.ico              # Icône Windows
│   │   ├── icon.png              # Icône Linux
│   │   └── icon-*.png            # Variantes de taille
│   ├── scripts/
│   │   ├── after-install.sh      # Post-installation Linux
│   │   └── after-remove.sh       # Post-désinstallation Linux
│   ├── installer.nsh             # Configuration NSIS Windows
│   └── entitlements.mac.plist    # Permissions macOS
├── generate-icons.js             # Script de génération d'icônes
└── package.json                  # Configuration mise à jour
```

## ⚙️ Configuration Complète

### Windows (NSIS)
- Installeur avec assistant
- Installation par utilisateur ou tous les utilisateurs
- Raccourcis bureau et menu démarrer
- Désinstalleur intégré
- Support x64 et x86 (ia32)
- Version portable disponible
- Messages en français

### Linux
- AppImage (portable, pas d'installation)
- Package .deb (Debian, Ubuntu, Mint, etc.)
- Package .rpm (Fedora, RHEL, CentOS, etc.)
- Package Snap (Ubuntu Store)
- Intégration menu applications
- Icônes système
- Scripts post-installation/désinstallation

### macOS
- Image disque .dmg
- Archive .zip
- Support Intel et Apple Silicon (si configuré)
- Darkmode support
- Entitlements configurés

## 🎨 Personnalisation des Icônes

Pour remplacer l'icône exemple par votre propre logo:

1. Créez une image PNG de haute qualité:
   - Taille minimale: 512x512 pixels
   - Taille recommandée: 1024x1024 pixels
   - Format: PNG avec transparence
   - Style: Simple, clair, visible en petite taille

2. Remplacez `assets/icon-source.png` par votre image

3. Régénérez les icônes:
   ```bash
   npm run generate-icons
   ```

4. Vérifiez les icônes générées dans `build/icons/`

5. Rebuildez l'application:
   ```bash
   npm run build:win  # ou build:linux, build:mac
   ```

## 📝 Métadonnées Configurées

- **Nom de l'application**: DocuCortex IA
- **Version**: 3.0.31
- **Description**: Gestionnaire Intelligent avec Intelligence Artificielle
- **Auteur**: DocuCortex Team
- **Email**: contact@docucortex.com
- **Site web**: https://www.docucortex.com
- **Licence**: MIT
- **Copyright**: Copyright © 2025 DocuCortex Team

## 🔄 Mises à Jour Automatiques

La configuration est prête pour les mises à jour automatiques via GitHub Releases:

```json
"publish": [{
  "provider": "github",
  "owner": "docucortex",
  "repo": "docucortex-ia",
  "releaseType": "release"
}]
```

Pour activer:
1. Configurez un token GitHub (GH_TOKEN)
2. Publiez sur GitHub Releases
3. L'application vérifiera automatiquement les nouvelles versions

## ✨ Optimisations Appliquées

- **Compression**: Normal (bon équilibre taille/temps)
- **ASAR**: Activé (empaquetage des sources)
- **npmRebuild**: Activé (modules natifs)
- **Exclusions**: Tests, docs, fichiers inutiles
- **parallelBuild**: Disponible pour builds plus rapides

## 🐛 Dépannage

### Les icônes ne s'affichent pas
```bash
npm run generate-icons
npm run build:win
```

### Erreur "electron-builder not found"
```bash
npm install --save-dev electron-builder
```

### Erreur "sharp not found"
```bash
npm install --save-dev sharp
```

### Build échoue
1. Vérifiez que React build fonctionne: `npm run build`
2. Vérifiez les logs dans `dist/builder-debug.yml`
3. Nettoyez et réinstallez: `npm run clean && npm install`

## 📚 Documentation Supplémentaire

- **build/icons/README.md** - Guide complet des icônes
- **build/README.md** - Documentation Electron Builder (déjà existante)
- **build/ELECTRON_BUILDER_DOCUMENTATION.md** - Documentation détaillée (déjà existante)
- **build/GUIDE_ICONES_RESSOURCES.md** - Guide icônes et ressources (déjà existant)

## 🎯 Prochaines Étapes

1. **Personnaliser l'icône** (optionnel):
   - Créer votre propre logo
   - Remplacer assets/icon-source.png
   - Exécuter `npm run generate-icons`

2. **Tester le build**:
   ```bash
   npm run pack
   ```

3. **Builder pour production**:
   ```bash
   npm run build:win    # ou build:linux, build:mac
   ```

4. **Distribuer**:
   - Les fichiers sont dans `dist/`
   - Télécharger sur GitHub Releases
   - Ou distribuer manuellement

## ✅ Checklist de Validation

- [✓] README des icônes créé
- [✓] Script generate-icons.js créé
- [✓] Configuration electron-builder dans package.json
- [✓] Scripts de build ajoutés (build:win, build:linux, build:mac, build:all)
- [✓] Métadonnées complètes (auteur, homepage, licence)
- [✓] Scripts d'installation Linux (after-install.sh, after-remove.sh)
- [✓] Configuration NSIS Windows (installer.nsh)
- [✓] Permissions macOS (entitlements.mac.plist)
- [✓] Icônes générées (icon.ico, icon.png, variantes)
- [✓] Image source créée (assets/icon-source.png)
- [✓] Dépendances ajoutées (electron-builder, sharp, png2icons)

## 🎉 Conclusion

Toutes les ressources nécessaires pour l'empaquetage de l'application Electron DocuCortex IA ont été préparées avec succès. 

Vous pouvez maintenant:
1. Personnaliser les icônes si nécessaire
2. Tester le build avec `npm run pack`
3. Créer les installeurs avec `npm run build:win` (ou autres plateformes)
4. Distribuer votre application

Pour toute question, consultez la documentation dans le dossier `build/`.

---

**Préparation terminée**: 2025-11-04  
**Version de l'application**: 3.0.31  
**État**: ✅ Prêt pour le build
