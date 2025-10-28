# RDS Viewer Anecoop - Application Electron avec Auto-Update

## Vue d'ensemble

L'application a été convertie en application Electron portable avec un système de **mise à jour automatique**. Les utilisateurs recevront automatiquement les nouvelles versions sans avoir à télécharger manuellement un nouvel .exe.

## Comment ça fonctionne ?

### 1. **Serveur de mise à jour**

Les mises à jour sont hébergées sur : `http://192.168.1.230/updates/`

Ce serveur doit contenir :
- Le fichier `.exe` portable de la nouvelle version
- Le fichier `latest.yml` qui décrit la dernière version

### 2. **Vérification automatique**

- Au démarrage de l'application, elle vérifie automatiquement les mises à jour après 5 secondes
- L'utilisateur peut aussi vérifier manuellement (bouton à ajouter dans l'interface)

### 3. **Processus de mise à jour**

1. L'application détecte qu'une nouvelle version est disponible
2. Une popup demande à l'utilisateur s'il veut mettre à jour
3. Si oui, l'application télécharge la nouvelle version
4. L'utilisateur peut choisir de redémarrer maintenant ou plus tard
5. Au redémarrage, la nouvelle version est installée automatiquement

---

## Instructions pour les développeurs

### Installation des dépendances

```bash
npm install
```

### Développement

```bash
# Développer en mode web (comme avant)
npm run dev

# Tester l'application Electron
npm run electron:dev
```

### Build de l'application portable

```bash
# Build complet (React + Electron portable)
npm run electron:build:portable
```

Le fichier `.exe` sera généré dans le dossier `dist/` :
- Nom : `RDS Viewer Anecoop-3.0.0-portable.exe`

### Publier une nouvelle version

#### Étape 1 : Incrémenter la version

Modifier `package.json` :
```json
{
  "version": "3.0.1"  // Nouvelle version
}
```

#### Étape 2 : Builder la nouvelle version

```bash
npm run electron:build:portable
```

#### Étape 3 : Copier les fichiers sur le serveur de mise à jour

Copier ces fichiers dans `\\\\192.168.1.230\\updates\\` :

1. Le fichier `.exe` : `RDS Viewer Anecoop-3.0.1-portable.exe`
2. Le fichier `latest.yml` (généré automatiquement dans `dist/`)

**Exemple de `latest.yml` :**
```yaml
version: 3.0.1
files:
  - url: RDS Viewer Anecoop-3.0.1-portable.exe
    sha512: [hash généré automatiquement]
    size: [taille en bytes]
path: RDS Viewer Anecoop-3.0.1-portable.exe
sha512: [hash généré automatiquement]
releaseDate: '2025-10-28T10:30:00.000Z'
```

#### Étape 4 : Tester

1. Lancer l'ancienne version (3.0.0) sur un poste
2. L'application devrait détecter la nouvelle version (3.0.1)
3. Accepter la mise à jour
4. Vérifier que la nouvelle version s'installe correctement

---

## Configuration du serveur de mise à jour

### Option 1 : Serveur de fichiers Windows (recommandé pour votre cas)

1. Créer un dossier partagé sur `192.168.1.230` : `\\\\192.168.1.230\\updates\\`
2. Installer IIS ou un serveur HTTP simple pointant vers ce dossier
3. S'assurer que l'URL `http://192.168.1.230/updates/` est accessible

### Option 2 : GitHub Releases (alternative)

Si vous voulez utiliser GitHub Releases au lieu d'un serveur local :

1. Modifier `package.json` :
```json
"publish": {
  "provider": "github",
  "owner": "kaizen2025",
  "repo": "rdp"
}
```

2. Créer un token GitHub avec les permissions "repo"
3. Builder avec : `GH_TOKEN=votre_token npm run electron:build:portable`
4. Les utilisateurs téléchargeront automatiquement depuis GitHub

---

## Ajout d'un bouton de vérification manuelle

Pour ajouter un bouton "Vérifier les mises à jour" dans l'interface :

```javascript
// Dans un composant React
const handleCheckUpdates = async () => {
  if (window.electronAPI) {
    await window.electronAPI.checkForUpdates();
  }
};

<Button onClick={handleCheckUpdates}>
  Vérifier les mises à jour
</Button>
```

---

## Logs et débogage

Les logs de l'auto-updater sont sauvegardés dans :
- **Windows** : `%USERPROFILE%\\AppData\\Roaming\\RDS Viewer Anecoop\\logs\\`

Pour voir les logs en temps réel, ouvrir la console de développement Electron (F12).

---

## Résolution de problèmes

### L'application ne détecte pas les mises à jour

1. Vérifier que le serveur `http://192.168.1.230/updates/` est accessible
2. Vérifier que le fichier `latest.yml` est bien présent
3. Vérifier les logs dans `AppData\\Roaming\\RDS Viewer Anecoop\\logs\\`

### Erreur de signature

L'application portable n'a pas besoin de signature de code pour fonctionner, mais un avertissement Windows peut apparaître au premier lancement.

Pour éviter cela, signer l'application avec un certificat code signing :
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

---

## Avantages de cette solution

✅ **Mise à jour automatique** - Les utilisateurs reçoivent toujours la dernière version
✅ **Portable** - Un seul fichier `.exe`, pas d'installation
✅ **Simple** - Juste copier le fichier sur le serveur de mises à jour
✅ **Contrôlé** - Vous décidez quand publier une nouvelle version
✅ **Fiable** - Pas de dépendance externe (sauf le serveur local)

---

## Prochaines étapes

1. ✅ Configurer le serveur de mises à jour sur `192.168.1.230`
2. ✅ Builder la première version portable
3. ✅ Tester la mise à jour automatique
4. ✅ Distribuer l'application aux utilisateurs
