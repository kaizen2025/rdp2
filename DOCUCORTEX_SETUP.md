# 🎭 DocuCortex - Chef d'Orchestre Ultra-Intelligent

## Guide de Configuration Gemini Multimodal

### 🔑 Obtenir votre Clé API Gemini

1. **Aller sur Google AI Studio**
   - URL: https://ai.google.dev/
   - Ou directement: https://aistudio.google.com/app/apikey

2. **Créer une clé API**
   - Cliquez sur "Get API Key"
   - Créez un nouveau projet ou sélectionnez-en un existant
   - Copiez votre clé (format: `AIza...`)

3. **Vérifier les modèles disponibles (PowerShell)**
   ```powershell
   $apiKey = "VOTRE_CLE_API"
   $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey" -Method Get
   $response.models | Select-Object name, displayName
   ```

### ⚙️ Configuration dans DocuCortex

1. **Ouvrir les Paramètres**
   - Menu latéral → **⚙️ Paramètres**
   - Onglet **Configuration IA - DocuCortex**

2. **Section Gemini AI (Priorité 1)**
   - **Activer** le switch "Activé"
   - **Clé API Gemini**: Collez votre clé `AIza...`

3. **Modèles Multimodaux Recommandés**

   | Modèle | Type | Usage |
   |--------|------|-------|
   | **gemini-2.0-flash-exp** | 📝 Texte | Questions générales, conversations |
   | **gemini-2.0-flash-exp** | 🖼️ Vision | Images, Excel scanné, documents scannés |
   | **text-embedding-004** | 🔍 Embedding | Recherche sémantique, classement |

4. **Options Chef d'Orchestre** ✨
   - ✅ **Activer l'orchestrateur intelligent**: Détection automatique du type de requête
   - ✅ **OCR automatique pour images**: Extraction texte depuis images/scans
   - ✅ **Embeddings pour recherche**: Recherche sémantique avancée
   - ✅ **Actions documents**: Boutons "Ouvrir" et "Voir répertoire"

5. **Tester la Connexion**
   - Cliquez sur "Tester" à côté des modèles
   - Vérifiez le message vert de confirmation

6. **Sauvegarder**
   - Cliquez sur "💾 Sauvegarder la Configuration"

### 🎨 Utilisation de DocuCortex

#### 1️⃣ **Questions Générales**
DocuCortex peut maintenant répondre à TOUT :
```
👤 Quelle est la météo à Perpignan ?
🤖 Actuellement à Perpignan, il fait...

👤 Combien font 234 × 567 ?
🤖 Le résultat est 132,678

👤 Qui est le président de la France ?
🤖 Emmanuel Macron est le président...
```

#### 2️⃣ **Recherche Documentaire GED**
```
👤 Trouve-moi les offres de prix de mars 2024
🤖 J'ai trouvé 3 documents :
   📄 Offre_Prix_Mars2024.pdf
   📂 Bouton: [Ouvrir] [Voir dossier] [Aperçu]
```

#### 3️⃣ **Analyse d'Images & Excel Scanné**
Uploadez une image via le bouton **📤 Upload** :
```
👤 [Upload facture.jpg] Extrais les informations
🤖 📊 Facture analysée :
   • N° Facture: FAC-2024-001
   • Montant HT: 1,250.00 €
   • TVA 20%: 250.00 €
   • Total TTC: 1,500.00 €

   📂 [Ouvrir] [Voir dossier]
```

#### 4️⃣ **Actions Rapides sur Documents**
Chaque document trouvé propose :
- 🔍 **Aperçu**: Prévisualisation dans modal
- 📥 **Télécharger**: Download le fichier
- 📂 **Ouvrir**: Ouvre dans l'application par défaut
- 🗂️ **Voir dossier**: Ouvre le répertoire réseau

### 🧠 Le Chef d'Orchestre en Action

DocuCortex détecte **automatiquement** :

| Détection | Action Automatique |
|-----------|-------------------|
| 📝 Question générale | → Modèle **Texte** |
| 🖼️ Image uploadée | → Modèle **Vision** + OCR |
| 🔍 "Cherche", "Trouve" | → **RAG** (Recherche + Génération) |
| 📄 Documents indexés | → Modèle **Embedding** pour score sémantique |

### 💡 Exemples de Prompts

**Conversation:**
```
Bonjour DocuCortex, présente-toi
```

**Recherche:**
```
Cherche les procédures de sécurité
Trouve-moi les documents de février 2024
Où sont les contrats clients ?
```

**Analyse Image:**
```
[Upload tableau_excel.jpg]
Convertis ce tableau en format texte
```

**Questions + Documents:**
```
D'après les documents uploadés, quel est le budget prévu pour 2024 ?
Résume les 3 derniers rapports mensuels
```

### 🎯 Architecture Technique

```
┌─────────────────────────────────────────────┐
│         🎭 Chef d'Orchestre Gemini          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────┐ │
│  │ 📝 Texte    │  │ 🖼️  Vision   │  │🔍  │ │
│  │ 2.0-flash   │  │ 2.0-flash    │  │Emb │ │
│  └─────────────┘  └──────────────┘  └────┘ │
│                                             │
│        ↓ Détection Automatique ↓            │
│                                             │
│  • Questions générales  → Texte             │
│  • Images / Excel scan  → Vision + OCR      │
│  • Recherche docs       → RAG + Embedding   │
│  • Actions documents    → Shell.openPath    │
│                                             │
└─────────────────────────────────────────────┘
```

### 🔧 Dépannage

**Problème: "Gemini non initialisé"**
- Vérifiez que la clé API est bien renseignée
- Cliquez sur "Tester" pour valider
- Sauvegardez et rafraîchissez la page

**Problème: "Fonction non disponible (mode web)"**
- Les actions "Ouvrir" nécessitent Electron
- Utilisez la version desktop de l'application
- En mode web, utilisez "Aperçu" ou "Télécharger"

**Problème: Pas de réponse aux questions générales**
- Vérifiez que Gemini est **activé** (switch ON)
- Le modèle texte doit être configuré
- Testez la connexion API

### 📊 Monitoring

Les statistiques sont disponibles dans :
- **Paramètres → IA → Statistiques**
- Nombre de requêtes par modèle
- Temps de réponse moyen
- Taux de succès

### 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances Gemini
npm install @google/generative-ai

# 2. Configurer la clé API dans l'interface
# Paramètres → Configuration IA → Gemini

# 3. Activer l'orchestrateur
# Cocher toutes les options Chef d'Orchestre

# 4. Tester !
# Onglet DocuCortex IA → Poser une question
```

### 🎁 Fonctionnalités Bonus

- ✅ **Nouvelle Conversation**: Reset propre
- ✅ **Effacer Historique**: Purge complète
- ✅ **Upload Documents**: Drag & drop ou bouton
- ✅ **Notifications**: Feedback temps réel
- ✅ **Markdown Support**: Mise en forme riche
- ✅ **Suggestions**: Questions suggérées
- ✅ **Citations**: Sources avec scores
- ✅ **Actions Rapides**: 1 clic pour ouvrir

---

**📧 Support**: kevin.bivia@anecoop.fr
**📚 Documentation**: `/docs/`
**🐛 Issues**: GitHub Issues
