# Guide de Dépannage - RDS Viewer

## Problèmes Identifiés et Solutions

### 1. Erreur: Module @google/generative-ai Manquant

**Symptôme:**
```
Error: Cannot find module '@google/generative-ai'
```

**Cause:** Le package npm n'est pas installé.

**Solution:**
```bash
npm install @google/generative-ai
```

**Vérification:**
```bash
npm list @google/generative-ai
```

---

### 2. Erreur Active Directory: Connexion à l'annuaire non disponible

**Symptôme:**
```
Import-Module : Une connexion à l'annuaire sur lequel traiter la demande n'était pas disponible.
Il s'agit probablement d'une situation transitoire.
```

**Cause:** Problème de connexion réseau temporaire avec le contrôleur de domaine Active Directory.

**Solutions:**

1. **Vérifier la connectivité réseau:**
   ```powershell
   # Tester la connexion au contrôleur de domaine
   Test-Connection SRV-AD-1 -Count 4
   Test-Connection SRV-AD-2 -Count 4
   ```

2. **Vérifier la résolution DNS:**
   ```powershell
   nslookup anecoopfr.local
   ```

3. **Redémarrer le service DNS:**
   ```powershell
   # En tant qu'administrateur
   Restart-Service Dnscache
   ```

4. **Augmenter le timeout PowerShell:**
   Modifiez dans `electron/activeDirectory.js`:
   ```javascript
   const timeout = 30000; // Augmenter de 15s à 30s
   ```

5. **Solution temporaire:** Le système réessaiera automatiquement et finira par se connecter

**Note:** Cette erreur est souvent transitoire et se résout d'elle-même après quelques tentatives.

---

### 3. Avertissements de Dépréciation

#### util._extend

**Symptôme:**
```
DeprecationWarning: The `util._extend` API is deprecated.
Please use Object.assign() instead.
```

**Cause:** Provient de `concurrently` ou d'autres dépendances externes.

**Impact:** Aucun impact fonctionnel.

**Solution:**
- Ces avertissements seront résolus lors de la mise à jour des dépendances
- Pas d'action requise pour le moment

#### Webpack Dev Server Middleware

**Symptôme:**
```
DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated.
Please use the 'setupMiddlewares' option.
```

**Cause:** Provient de `react-scripts` v5.0.1.

**Impact:** Aucun impact fonctionnel.

**Solution:**
- Sera résolu lors de la mise à jour vers react-scripts v6.x
- Pas d'action requise pour le moment

---

### 4. Vulnérabilités npm

**Symptôme:**
```
13 vulnerabilities (4 moderate, 9 high)
```

**Solutions:**

1. **Audit complet:**
   ```bash
   npm audit
   ```

2. **Correction automatique:**
   ```bash
   npm audit fix
   ```

3. **Force fix (peut casser des dépendances):**
   ```bash
   npm audit fix --force
   ```

4. **Approche recommandée:**
   ```bash
   # Vérifier les vulnérabilités critiques
   npm audit | grep "Critical"

   # Corriger seulement les vulnérabilités sans breaking changes
   npm audit fix --only=prod
   ```

**Note:** Testez l'application après chaque correction.

---

### 5. Erreur: API Key Not Valid (Gemini)

**Symptôme:**
```
❌ Erreur API Gemini: API key not valid. Please pass a valid API key.
```

**Cause:** Clé API invalide, manquante ou mal configurée.

**Solutions:**

1. **Vérifier que .env.ai existe:**
   ```bash
   ls -la .env.ai
   ```

2. **Vérifier le format de la clé:**
   ```bash
   # Doit être sur une seule ligne, sans espaces, sans guillemets
   cat .env.ai | grep GEMINI
   ```

3. **Format correct:**
   ```env
   GEMINI_API_KEY=AIzaSyVotreClééé...
   ```

4. **Format INCORRECT:**
   ```env
   GEMINI_API_KEY = AIza...     # Espaces
   GEMINI_API_KEY="AIza..."     # Guillemets
   GEMINI_API_KEY=               # Vide
   ```

5. **Obtenir une nouvelle clé:**
   - Visitez https://ai.google.dev/
   - Créez une nouvelle clé API
   - Remplacez dans `.env.ai`
   - Redémarrez l'application

---

### 6. Erreur: Port Already in Use

**Symptôme:**
```
Error: Port 3002 is already in use
```

**Solutions:**

1. **Windows:**
   ```cmd
   # Trouver le processus utilisant le port
   netstat -ano | findstr :3002

   # Tuer le processus (remplacez PID)
   taskkill /PID <PID> /F
   ```

2. **Linux/Mac:**
   ```bash
   # Trouver le processus
   lsof -i :3002

   # Tuer le processus
   kill -9 <PID>
   ```

3. **Arrêter proprement:**
   ```bash
   # Si l'application tourne encore
   # Appuyez sur Ctrl+C dans chaque terminal
   ```

---

### 7. Erreur: Electron ne Démarre Pas

**Symptôme:**
L'application démarre mais la fenêtre Electron ne s'affiche pas.

**Solutions:**

1. **Vérifier que React est prêt:**
   ```
   [1] [React Starter] ✅ React server is ready on port 3000.
   ```

2. **Augmenter le timeout:**
   Modifiez dans `electron/main.js`:
   ```javascript
   const MAX_RETRIES = 50; // Augmenter de 30 à 50
   ```

3. **Vider le cache Electron:**
   ```bash
   # Windows
   rd /s /q %APPDATA%\rds-viewer

   # Linux/Mac
   rm -rf ~/.config/rds-viewer
   ```

4. **Réinstaller Electron:**
   ```bash
   npm uninstall electron
   npm install electron
   ```

---

### 8. Erreur: Documents Non Indexés

**Symptôme:**
Les documents uploadés ne sont pas trouvés par DocuCortex.

**Solutions:**

1. **Vérifier la base de données:**
   ```bash
   # Ouvrir la base de données SQLite
   sqlite3 <chemin_vers_database>

   # Vérifier les documents
   SELECT COUNT(*) FROM ai_documents;
   ```

2. **Réindexer les documents:**
   - Allez dans Configuration IA
   - Cliquez sur "Réindexer tous les documents"

3. **Vérifier les permissions:**
   - Assurez-vous que l'application a accès au dossier de la base de données
   - Vérifiez les permissions de lecture/écriture

---

### 9. Performance Lente

**Symptôme:**
DocuCortex répond lentement.

**Solutions:**

1. **Utiliser un modèle plus rapide:**
   Dans `/config/ai-config.json`:
   ```json
   {
     "providers": {
       "gemini": {
         "model": "gemini-1.5-flash"  // Plus rapide
       }
     }
   }
   ```

2. **Réduire le timeout:**
   ```json
   {
     "providers": {
       "gemini": {
         "timeout": 60000  // Réduire de 120s à 60s
       }
     }
   }
   ```

3. **Limiter le contexte:**
   ```json
   {
     "chat": {
       "max_context": 5  // Réduire de 10 à 5
     }
   }
   ```

4. **Vider le cache:**
   ```bash
   # Supprimer les fichiers temporaires
   rm -rf .cache/
   rm -rf tmp/
   ```

---

### 10. Erreur: Cannot Connect to Backend

**Symptôme:**
```
[Proxy ERROR] Le serveur backend n'est pas accessible sur http://localhost:3002
```

**Solutions:**

1. **Vérifier que le serveur backend tourne:**
   ```bash
   # Vous devriez voir:
   # [0] 🚀 SERVEUR PRÊT !
   # [0]    - API sur http://localhost:3002
   ```

2. **Vérifier les ports:**
   ```bash
   cat .ports.json
   ```

3. **Redémarrer l'application:**
   ```bash
   # Ctrl+C puis:
   npm run electron:start
   ```

4. **Vérifier le pare-feu:**
   - Autorisez Node.js dans le pare-feu Windows
   - Autorisez les ports 3000, 3001, 3002, 3003

---

## Procédure de Diagnostic Complète

Si vous rencontrez un problème non listé ci-dessus:

### 1. Vérifier les Logs

**Serveur Backend:**
```
[0] ✅ SERVEUR PRÊT !
[0]    - API sur http://localhost:3002
```

**React Dev Server:**
```
[1] [React Starter] ✅ React server is ready on port 3000.
```

**Electron:**
```
[2] 23:13:46.305 > [Main] 🚀 Démarrage de l'application Electron...
```

### 2. Vérifier les Dépendances

```bash
# Vérifier Node.js
node -v  # Doit être >= 16.x

# Vérifier npm
npm -v   # Doit être >= 7.x

# Vérifier les packages critiques
npm list express
npm list electron
npm list react
npm list @google/generative-ai
```

### 3. Nettoyer et Réinstaller

```bash
# Supprimer node_modules et caches
rm -rf node_modules
rm -rf package-lock.json
rm -rf .cache
rm -rf build

# Réinstaller
npm install

# Redémarrer
npm run electron:start
```

### 4. Vérifier la Configuration

```bash
# Vérifier que les fichiers existent
ls -la .env.ai
ls -la config/ai-config.json
ls -la config/config.json
```

### 5. Activer les Logs de Debug

Dans `/electron/main.js`, ajoutez:
```javascript
console.log = (...args) => {
    const timestamp = new Date().toISOString();
    require('fs').appendFileSync('debug.log', `[${timestamp}] ${args.join(' ')}\n`);
};
```

---

## Contacts et Support

### Documentation

- **Gemini**: https://ai.google.dev/docs
- **OpenRouter**: https://openrouter.ai/docs
- **Electron**: https://www.electronjs.org/docs
- **React**: https://react.dev/

### Logs Importants

- Serveur Backend: Console `[0]`
- React Dev Server: Console `[1]`
- Electron: Console `[2]`
- Fichier de log: `debug.log` (si activé)

### Commandes Utiles

```bash
# Vérifier l'état de l'application
npm run electron:start

# Logs détaillés
npm run electron:start --verbose

# Mode développement séparé
npm run dev

# Build de production
npm run build
```

---

## Checklist de Vérification Rapide

Avant de demander de l'aide, vérifiez:

- [ ] Node.js >= 16.x installé
- [ ] npm >= 7.x installé
- [ ] `npm install` exécuté sans erreurs
- [ ] `.env.ai` existe avec une clé API Gemini valide
- [ ] Aucun processus n'utilise les ports 3000-3003
- [ ] Connectivité réseau active
- [ ] Accès au contrôleur de domaine AD (pour les fonctionnalités AD)
- [ ] Application redémarrée après modification de `.env.ai`
- [ ] Clé API Gemini testée via l'interface

---

## Résumé des Corrections Appliquées

### Modifications du Projet

1. **Suppression de l'Assistant Gemini Séparé**
   - Route `/assistant` supprimée
   - Composant `GeminiAssistant.jsx` supprimé
   - Tout centralisé dans DocuCortex

2. **Configuration Simplifée**
   - Template `.env.ai.example` créé
   - Documentation complète ajoutée
   - Guide de configuration étape par étape

3. **Amélioration de la Résilience**
   - Service Gemini gère gracieusement les dépendances manquantes
   - Messages d'erreur clairs et informatifs
   - Fallback automatique vers OpenRouter

### Fichiers Créés/Modifiés

- ✅ `.env.ai.example` - Template de configuration
- ✅ `AI_CONFIGURATION_GUIDE.md` - Guide de configuration complet
- ✅ `TROUBLESHOOTING_GUIDE.md` - Ce guide
- ✅ `backend/services/ai/geminiService.js` - Chargement optionnel
- ✅ `src/layouts/MainLayout.js` - Route /assistant supprimée
- ✅ `src/components/GeminiAssistant.jsx` - SUPPRIMÉ

---

## Prochaines Étapes Recommandées

1. **Configurer les Clés API**
   - Créez `.env.ai` depuis le template
   - Obtenez une clé Gemini gratuite
   - Testez via l'interface

2. **Mettre à Jour les Dépendances** (optionnel)
   ```bash
   npm audit fix
   npm update
   ```

3. **Optimiser les Performances**
   - Ajustez les paramètres dans `ai-config.json`
   - Choisissez le bon modèle Gemini

4. **Surveiller les Logs**
   - Vérifiez régulièrement les logs du serveur
   - Identifiez les problèmes rapidement

---

Bonne utilisation! 🚀
