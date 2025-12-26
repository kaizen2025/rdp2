# 🚀 Guide de Build Ultra-Rapide - RDS Viewer

## ⚡ Méthode 1 : Build Ultra-Rapide (Recommandé pour développement)

**Temps estimé : ~2-3 minutes** (au lieu de 10 minutes)

### Utilisation :

```bash
build-ultra-fast.bat
```

Ou via npm :
```bash
npm run build:fast
```

### Optimisations appliquées :

1. **Compression désactivée** (`compression: "store"`)
   - Aucune compression ASAR = Build 3-4x plus rapide
   - Fichier final plus gros (~20-30% de plus) mais création instantanée

2. **Un seul target** (NSIS seulement)
   - Pas de version portable en même temps
   - Gain de temps : ~3 minutes

3. **ASAR minimal**
   - Seulement les modules natifs sont "unpacked"
   - `bcrypt` et `better-sqlite3` uniquement
   - Pas tout `node_modules`, `server`, `backend`

4. **Pas de differential package**
   - Pas de calcul de différentiel pour les mises à jour
   - Gain de temps : ~1 minute

5. **Exclusions optimisées**
   - Exclusion de `.bin`, tests, exemples, fichiers .d.ts
   - Moins de fichiers à traiter

### Configuration utilisée :

Fichier : `electron-builder-fast.json`

```json
{
  "compression": "store",           // ⚡ AUCUNE compression
  "asarUnpack": [                   // ⚡ Minimal
    "**/*.node",
    "**/node_modules/bcrypt/**/*",
    "**/node_modules/better-sqlite3/**/*"
  ],
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] }  // ⚡ Un seul target
    ]
  },
  "nsis": {
    "differentialPackage": false    // ⚡ Pas de diff
  }
}
```

---

## 🏗️ Méthode 2 : Build Normal (Pour production)

**Temps estimé : ~10 minutes**

### Utilisation :

```bash
npm run build:installer
```

Ou via script batch :
```bash
build-production.bat
```

### Avantages :

- ✅ Fichier final optimisé et compressé
- ✅ Taille réduite (~30% plus petit)
- ✅ Plusieurs formats (NSIS + Portable)
- ✅ Differential package pour mises à jour incrémentales

### Quand l'utiliser :

- ✅ Pour déploiement final en production
- ✅ Pour distribuer aux utilisateurs
- ✅ Pour créer des mises à jour officielles

---

## 📊 Comparaison des méthodes

| Critère | Build Ultra-Rapide | Build Normal |
|---------|-------------------|--------------|
| **Temps de build** | ~2-3 min | ~10 min |
| **Taille finale** | ~250 MB | ~190 MB |
| **Compression** | Aucune | Maximum |
| **Targets** | NSIS seulement | NSIS + Portable |
| **Usage recommandé** | Développement/Test | Production |
| **Differential** | Non | Oui |

---

## 🎯 Workflow recommandé

### Phase de développement :

1. **Développement actif** : Utilisez `build-ultra-fast.bat`
   - Testez rapidement vos changements
   - Itérez rapidement

2. **Tests internes** : Build rapide suffisant
   - Partagez avec l'équipe IT
   - Tests fonctionnels

### Phase de production :

3. **Déploiement final** : Utilisez `build-production.bat`
   - Avant de déployer vers les utilisateurs finaux
   - Pour créer les mises à jour officielles

---

## 🔧 Optimisations supplémentaires possibles

### 1. **Exclure les sourcemaps React** (Déjà fait ✅)
```json
"build": "GENERATE_SOURCEMAP=false craco build"
```

### 2. **Utiliser le cache Electron Builder**
Le cache est automatiquement utilisé. Emplacement :
- Windows : `%LOCALAPPDATA%\electron-builder\Cache`
- Gain : ~30 secondes sur builds suivants

### 3. **Build incrémental React** (Pour tests fréquents)
Si vous ne modifiez que le code Electron :
```bash
# Ne rebuild pas React si déjà fait
npx electron-builder --win nsis --x64 --config electron-builder-fast.json
```

### 4. **Désactiver antivirus temporairement**
L'antivirus peut ralentir la création du .exe
- Ajoutez le dossier `dist` aux exclusions
- Gain potentiel : 1-2 minutes

---

## 📝 Scripts disponibles

| Commande | Description | Temps |
|----------|-------------|-------|
| `build-ultra-fast.bat` | Build ultra-rapide NSIS | ~2-3 min |
| `npm run build:fast` | Même chose via npm | ~2-3 min |
| `npm run build:installer` | Build normal NSIS | ~6-7 min |
| `npm run build:portable` | Build portable seulement | ~6-7 min |
| `npm run build:all` | Build NSIS + Portable | ~10 min |
| `build-production.bat` | Build production complet | ~10 min |

---

## 🚨 Attention

### Différences Build Rapide vs Normal :

**Build Rapide** :
- ❌ Fichier plus gros (~60 MB de plus)
- ❌ Pas de compression = performance légèrement réduite au démarrage
- ❌ Un seul format (NSIS)
- ✅ Création 3-4x plus rapide

**Build Normal** :
- ✅ Fichier optimisé et compact
- ✅ Meilleure performance au runtime
- ✅ Plusieurs formats disponibles
- ❌ Temps de build plus long

### Recommandation :

> **Pour le développement et les tests** : Utilisez toujours `build-ultra-fast.bat`
>
> **Pour la production et le déploiement final** : Utilisez `build-production.bat`

---

## 📦 Workflow complet de déploiement

### 1. Build rapide pour tests :
```bash
build-ultra-fast.bat
```

### 2. Tester localement :
```bash
dist\RDS Viewer-3.0.26-Setup.exe
```

### 3. Si OK, build production final :
```bash
build-production.bat
```

### 4. Déployer :
```bash
deploy-update.bat
```

---

## 🔍 Détails techniques

### Pourquoi la compression ralentit ?

Electron-builder compresse l'archive ASAR avec différents algorithmes :
- `store` : Aucune compression (instantané)
- `normal` : Compression standard (~2 min)
- `maximum` : Compression maximale (~4 min)

La compression se fait fichier par fichier sur plusieurs centaines de fichiers, d'où le temps.

### Pourquoi plusieurs targets ralentissent ?

Chaque target (NSIS, Portable) :
1. Crée un dossier `win-unpacked` complet
2. Package tous les fichiers
3. Crée l'installateur/portable
4. Calcule les checksums

Faire 2 targets = 2x le travail.

### Pourquoi differential package ralentit ?

Le differential package calcule :
- Les différences avec la version précédente
- Un fichier de "patch" optimisé
- Des checksums supplémentaires

Cela ajoute ~1-2 minutes au build.

---

## ✅ Checklist avant déploiement

- [ ] Tests fonctionnels passés (build rapide)
- [ ] Build production créé
- [ ] Version incrémentée dans `package.json`
- [ ] Fichiers dans `dist` :
  - [ ] `RDS Viewer-X.X.XX-Setup.exe`
  - [ ] `latest.yml`
  - [ ] `*.blockmap`
- [ ] Déploiement via `deploy-update.bat`
- [ ] Test de la mise à jour automatique

---

## 🎉 Résultat

Avec le build ultra-rapide, vous passez de **10 minutes à 2-3 minutes** !

**Gain de temps : 70-75% 🚀**

Parfait pour :
- ✅ Itérations rapides en développement
- ✅ Tests fréquents
- ✅ Partage avec l'équipe IT
- ✅ Validation de bugs
