# Guide de Configuration de l'IA - DocuCortex

## Vue d'Ensemble

DocuCortex est l'assistant IA documentaire intelligent intégré dans RDS Viewer. Il utilise **Gemini** comme provider principal et **OpenRouter** comme fallback secondaire.

## Configuration Rapide

### Étape 1: Créer le fichier .env.ai

```bash
# Copiez le template
cp .env.ai.example .env.ai
```

### Étape 2: Obtenir une Clé API Gemini (REQUIS)

1. Visitez https://ai.google.dev/
2. Cliquez sur "Get API Key" dans l'en-tête
3. Connectez-vous avec votre compte Google
4. Cliquez sur "Create API Key"
5. Copiez votre clé (format: `AIza...`)
6. Collez-la dans `.env.ai`:

```env
GEMINI_API_KEY=AIzaVotreClééé...
```

### Étape 3: Obtenir une Clé API OpenRouter (OPTIONNEL - Fallback)

1. Visitez https://openrouter.ai/
2. Créez un compte gratuit
3. Allez dans votre profil > "Keys"
4. Créez une nouvelle clé
5. Copiez votre clé (format: `sk-or-v1-...`)
6. Collez-la dans `.env.ai`:

```env
OPENROUTER_API_KEY=sk-or-v1-VotreCléééé...
```

### Étape 4: Redémarrer l'Application

```bash
# Arrêtez l'application (Ctrl+C)
# Puis redémarrez:
npm run electron:start
```

### Étape 5: Tester la Configuration

1. Ouvrez l'application
2. Allez dans **Configuration IA** (via le menu ou l'URL `/ai-config`)
3. Cliquez sur **"Tester"** pour chaque provider
4. Vérifiez que Gemini est marqué comme "Actif"

## Configuration Détaillée

### Structure du fichier .env.ai

```env
# ============================================
# Gemini (Provider Principal)
# ============================================
GEMINI_API_KEY=AIzaVotreCléGemini

# ============================================
# OpenRouter (Provider Secondaire - Fallback)
# ============================================
OPENROUTER_API_KEY=sk-or-v1-VotreCléOpenRouter

# ============================================
# Hugging Face (Optionnel - Non utilisé)
# ============================================
HUGGINGFACE_API_KEY=hf_VotreCléHuggingFace
```

### Configuration ai-config.json

Le fichier `/config/ai-config.json` contient les paramètres des providers:

```json
{
  "aiProvider": "gemini",
  "providers": {
    "gemini": {
      "enabled": true,
      "priority": 1,
      "apiKey": "STORED_IN_ENV_FILE",
      "model": "gemini-1.5-flash",
      "timeout": 120000,
      "temperature": 0.7,
      "max_tokens": 4096
    },
    "openrouter": {
      "enabled": true,
      "priority": 2,
      "apiKey": "STORED_IN_ENV_FILE",
      "baseUrl": "https://openrouter.ai/api/v1",
      "model": "openrouter/polaris-alpha",
      "timeout": 120000,
      "temperature": 0.7,
      "max_tokens": 4096
    }
  },
  "fallback": {
    "enabled": true,
    "autoSwitch": true,
    "retryAttempts": 3
  }
}
```

**Note**: Les clés API ne sont JAMAIS stockées dans ce fichier. Elles sont chargées depuis `.env.ai`.

## Utilisation de DocuCortex

### Accès

- **Interface**: Cliquez sur l'onglet "DocuCortex IA" dans la navigation
- **URL directe**: `/ai-assistant`

### Fonctionnalités

1. **Chat Intelligent**
   - Posez des questions sur vos documents
   - Recherche automatique dans la base documentaire
   - Réponses contextuelles

2. **Upload de Documents**
   - Formats supportés: PDF, DOCX, TXT, PNG, JPG
   - OCR automatique pour les images
   - Indexation automatique

3. **Providers Multiples**
   - Provider principal: Gemini (rapide, gratuit, performant)
   - Fallback automatique vers OpenRouter si Gemini échoue
   - Basculement transparent sans interruption

## Configuration Avancée

### Modifier le Modèle Gemini

Dans `/config/ai-config.json`, changez le modèle:

```json
{
  "providers": {
    "gemini": {
      "model": "gemini-1.5-pro"  // Plus puissant mais plus lent
      // ou: "gemini-1.5-flash"   // Plus rapide (par défaut)
      // ou: "gemini-pro"         // Version standard
    }
  }
}
```

### Désactiver le Fallback

```json
{
  "fallback": {
    "enabled": false,
    "autoSwitch": false,
    "retryAttempts": 1
  }
}
```

### Ajuster la Température

```json
{
  "providers": {
    "gemini": {
      "temperature": 0.5  // Plus déterministe (0.0-1.0)
      // 0.0 = Très déterministe
      // 0.7 = Équilibré (défaut)
      // 1.0 = Plus créatif
    }
  }
}
```

## Dépannage

### Erreur: "Package @google/generative-ai non installé"

```bash
npm install @google/generative-ai
```

### Erreur: "API key not valid"

1. Vérifiez que votre clé est correcte dans `.env.ai`
2. Assurez-vous qu'il n'y a pas d'espaces avant/après la clé
3. Testez la clé directement sur https://ai.google.dev/
4. Vérifiez que vous avez activé l'API Gemini dans Google Cloud Console

### Erreur: "Clé API non configurée"

1. Vérifiez que `.env.ai` existe à la racine du projet
2. Vérifiez que la clé est correctement formatée:
   ```env
   GEMINI_API_KEY=VotreCléIci
   # PAS:
   # GEMINI_API_KEY = VotreCléIci (espaces)
   # GEMINI_API_KEY="VotreCléIci" (guillemets)
   ```
3. Redémarrez complètement l'application

### Le Provider Gemini n'est pas actif

1. Allez dans **Configuration IA**
2. Vérifiez que Gemini est "Activé"
3. Testez la connexion
4. Si le test échoue, vérifiez votre clé API
5. Consultez les logs du serveur pour plus de détails

### Performance Lente

1. Utilisez `gemini-1.5-flash` au lieu de `gemini-1.5-pro`
2. Réduisez `max_tokens` dans la configuration
3. Augmentez le `timeout` si nécessaire

## Sécurité

### Ne JAMAIS Committer .env.ai

Le fichier `.env.ai` est déjà dans `.gitignore`. NE LE RETIREZ PAS.

### Rotation des Clés

Si vous pensez qu'une clé a été compromise:

1. Visitez le portail du provider (Google AI ou OpenRouter)
2. Révoquez la clé actuelle
3. Créez une nouvelle clé
4. Mettez à jour `.env.ai`
5. Redémarrez l'application

## Limites et Quotas

### Gemini (Gratuit)

- **Limite**: 60 requêtes/minute
- **Quota journalier**: 1500 requêtes/jour
- **Taille max**: 30,720 tokens par requête

### OpenRouter (Gratuit)

- Dépend du modèle choisi
- Certains modèles sont gratuits avec limitations
- Consultez: https://openrouter.ai/docs#limits

## Support

### Logs

Les logs du serveur contiennent des informations détaillées:

```
[0] ✅ Service Gemini initialisé avec succès.
[0] ✅ gemini défini comme provider actif
[0] ✅ Service IA initialisé - Provider actif: gemini
```

### Tester Manuellement

```bash
# Tester que le fichier .env.ai est lu
cat .env.ai

# Vérifier que le package Gemini est installé
npm list @google/generative-ai
```

### Contacter le Support

Si vous rencontrez des problèmes:

1. Consultez les logs du serveur
2. Vérifiez la configuration dans `/ai-config`
3. Testez les clés API via l'interface
4. Consultez la documentation officielle:
   - Gemini: https://ai.google.dev/docs
   - OpenRouter: https://openrouter.ai/docs

## Modifications depuis la Version Précédente

### Changements Majeurs

1. **Suppression de l'Assistant Gemini Séparé**
   - L'onglet `/assistant` a été supprimé
   - Toutes les fonctionnalités sont maintenant dans DocuCortex

2. **Gemini comme Provider Principal**
   - Gemini est maintenant le provider prioritaire (priority: 1)
   - OpenRouter est utilisé en fallback (priority: 2)

3. **Configuration Simplifiée**
   - Clés API dans `.env.ai` uniquement
   - Configuration centralisée dans `/ai-config`
   - Interface de test intégrée

### Migration

Si vous utilisiez l'ancien système:

1. Vos conversations existantes sont préservées
2. Vos documents indexés restent disponibles
3. Configurez simplement votre clé Gemini dans `.env.ai`
4. L'application utilisera automatiquement Gemini

## Conclusion

DocuCortex avec Gemini offre une expérience IA puissante et rapide pour la gestion documentaire. En cas de problème, consultez les logs et testez vos clés API via l'interface de configuration.

Bonne utilisation! 🚀
