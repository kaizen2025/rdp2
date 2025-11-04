# 🚀 GUIDE RAPIDE - Génération Exécutable RDS Viewer Anecoop v3.0.27

## ⚡ Génération en 3 Minutes

### 🪟 **Windows - Méthode Express**

```cmd
cd /workspace/rdp
generate-executable.bat
```

**C'est tout !** L'exécutable sera dans `dist/` en 3-10 minutes.

---

### 🐧 **Linux/Mac - Méthode Express**

```bash
cd /workspace/rdp
bash generate-executable.sh win    # Pour Windows
bash generate-executable.sh linux  # Pour Linux
bash generate-executable.sh mac    # Pour macOS
bash generate-executable.sh all    # Pour toutes les plateformes
```

---

## 📦 Ce qui est Généré Automatiquement

✅ **Installeur NSIS** (Windows)
- Fichier: `RDS-Viewer-Anecoop-Setup-3.0.27.exe`
- Taille: ~80-150 MB
- Installation en 1 clic
- Désinstallation propre

✅ **Exécutable Portable** (Windows)
- Fichier: `RDS-Viewer-Anecoop-3.0.27.exe`  
- Taille: ~80-150 MB
- Pas d'installation requise

✅ **Archive ZIP** (optionnel)
- Fichier: `RDS-Viewer-Anecoop-3.0.27-win.zip`
- Pour distribution manuelle

---

## 🔧 Que Fait le Script ?

Le script **génère automatiquement** tout ce dont vous avez besoin :

1. ✅ **Vérifie** Node.js et npm
2. ✅ **Installe** electron-builder (si nécessaire)
3. ✅ **Nettoie** les builds précédents
4. ✅ **Génère** les icônes (si manquantes)
5. ✅ **Build** l'application avec optimisations max
6. ✅ **Crée** l'installeur professionnel
7. ✅ **Vérifie** et affiche le résumé

---

## ⚙️ Configuration Automatique Appliquée

### Optimisations Intégrées
- ✅ **Compression maximale** (7z)
- ✅ **ASAR activé** (réduction 80%)
- ✅ **Code minifié** (Terser niveau 3)
- ✅ **Tree-shaking** activé
- ✅ **Exclusion fichiers inutiles** automatique
- ✅ **Build parallèle** multi-core

### Installeur Professionnel
- ✅ **Interface moderne** NSIS
- ✅ **Installation silencieuse** supportée (`/S`)
- ✅ **Raccourcis automatiques** (bureau + menu démarrer)
- ✅ **Désinstallation propre** (données + registre)
- ✅ **Détection versions** précédentes
- ✅ **Support multilingue** (FR/EN)

---

## 📊 Résultat Attendu

Après exécution du script, vous obtiendrez :

```
dist/
├── RDS-Viewer-Anecoop-Setup-3.0.27.exe     (Installeur - ~100 MB)
├── RDS-Viewer-Anecoop-3.0.27.exe           (Portable - ~100 MB)
└── win-unpacked/                            (Version décompressée)
    └── RDS Viewer Anecoop.exe
```

---

## 🎯 Personnalisation (Optionnel)

### Changer l'Icône

1. **Remplacer** `assets/icon-source.png` par votre logo (1024x1024)
2. **Générer** les icônes:
   ```bash
   npm run generate-icons
   ```
3. **Rebuild**:
   ```cmd
   generate-executable.bat
   ```

### Modifier la Configuration

Éditer `build/electron-builder.yml`:
- Nom de l'application
- Version
- Auteur
- Description
- Options d'installation

---

## 🐛 Résolution Problèmes

### ❌ Erreur: "Node.js non trouvé"
**Solution:** Installer Node.js depuis https://nodejs.org/

### ❌ Erreur: "electron-builder failed"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ Erreur: "Icon not found"
**Solution:**
```bash
node generate-icons.js
```

### ⚠️ Avertissement: "No code signing"
**Normal** si vous n'avez pas de certificat. L'exécutable fonctionne quand même.
Pour un build production, voir: `build/security/certificate-guide.md`

---

## 🚀 Distribution

### Installation Utilisateur Final

**Double-clic** sur `RDS-Viewer-Anecoop-Setup-3.0.27.exe`
- Installation en 1 clic
- Raccourci bureau créé automatiquement

### Installation Silencieuse (Entreprise)

```cmd
RDS-Viewer-Anecoop-Setup-3.0.27.exe /S /D=C:\Program Files\RDS Viewer
```

### Désinstallation

Via **Panneau de configuration > Programmes** ou:
```cmd
"%APPDATA%\RDS Viewer Anecoop\uninstall.exe" /S
```

---

## 📚 Documentation Complète

Pour plus de détails:
- **Configuration avancée**: `build/ELECTRON_BUILDER_DOCUMENTATION.md`
- **Guide icônes**: `build/GUIDE_ICONES_RESSOURCES.md`
- **Optimisations**: `build/optimization/README.md`
- **Sécurité**: `build/security/README.md`
- **Installation NSIS**: `build/installer/README.md`

---

## ⏱️ Temps de Build

| Système | CPU | Durée Estimée |
|---------|-----|---------------|
| Basique | 2-4 cores | 8-15 min |
| Moyen | 4-8 cores | 4-8 min |
| Puissant | 8+ cores | 2-4 min |

---

## ✅ Checklist Avant Distribution

- [ ] Application testée en mode dev
- [ ] Icônes personnalisées (optionnel)
- [ ] Version mise à jour dans `package.json`
- [ ] Build généré avec succès
- [ ] Installeur testé sur machine vierge
- [ ] Exécutable portable testé
- [ ] Désinstallation testée
- [ ] Code signé (optionnel, recommandé)

---

## 🎉 Félicitations !

Votre application **RDS Viewer Anecoop v3.0.27** est maintenant prête pour la distribution !

**Questions ?** Consultez les documentations dans `build/` ou les fichiers README.