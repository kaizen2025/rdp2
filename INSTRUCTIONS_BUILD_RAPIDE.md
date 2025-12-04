# ⚡ Instructions de Build Rapide - RDS Viewer v3.1.0

## 🎯 Build en 3 Étapes

### 1️⃣ Prérequis

✅ **Node.js 18+** installé
✅ **Projet cloné** dans votre dossier

### 2️⃣ Build de l'Application

**Option A: Script Automatisé (Recommandé)**

```bash
# Double-cliquer sur le fichier
build-release.bat
```

**Option B: Commande npm**

```bash
npm run build:release
```

**Durée:** 5-15 minutes

### 3️⃣ Fichiers Générés

Dossier `dist/` contiendra:

```
✅ RDS Viewer-3.1.0-Portable.exe  (Application portable)
✅ latest.yml                      (Configuration auto-update)
```

---

## 📤 Déploiement Rapide

### 1. Calculer le Hash

```powershell
Get-FileHash -Path "dist\RDS Viewer-3.1.0-Portable.exe" -Algorithm SHA512
```

### 2. Mettre à Jour latest.yml

Remplacer dans `dist/latest.yml`:
- `sha512`: Coller le hash
- `size`: Taille du fichier en octets

### 3. Upload sur le Serveur

Copier les 2 fichiers sur votre serveur de mises à jour:
- `RDS Viewer-3.1.0-Portable.exe`
- `latest.yml`

URL configurée: `https://updates.anecoop.local`

---

## ✅ Checklist

- [ ] Build réussi
- [ ] Hash SHA512 calculé
- [ ] latest.yml mis à jour
- [ ] Fichiers uploadés sur le serveur
- [ ] Test manuel effectué

---

## 🆘 En Cas de Problème

**Erreur de build?**
```bash
# Nettoyer et réessayer
rmdir /s /q dist
rmdir /s /q build
npm run build:release
```

**Hash incorrect?**
- Recalculer avec PowerShell
- Mettre à jour latest.yml
- Re-upload sur le serveur

---

## 📚 Documentation Complète

Pour les détails complets, voir:
- **GUIDE_BUILD_ET_DEPLOIEMENT.md** (documentation complète)
- **DOCUCORTEX_V2_IMPROVEMENTS_COMPLETE.md** (changelog technique)

---

**Version:** 3.1.0
**Date:** 26 Novembre 2025
**Support:** support@anecoop.com
