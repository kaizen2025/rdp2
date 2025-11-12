# 🚀 DocuCortex IA Ultra-Intelligente - Guide Complet

## 📋 Vue d'Ensemble

DocuCortex est maintenant une **IA polyvalente et multimodale** propulsée par **Gemini** avec fallback automatique vers **OpenRouter**.

### Deux Modes de Fonctionnement:

#### 🌟 Mode Assistant Général (Gemini)
- Répond à **toutes les questions** (météo, calculs, explications, etc.)
- Analyse de **fichiers multimédia** (images, PDF, Excel, Word, audio, vidéo)
- Édition et modification de documents
- Génération de fichiers (Excel, Word, etc.)

#### 📚 Mode GED Spécialisé
- Recherche de documents dans le réseau
- Listage de dossiers
- Extraction d'informations de fichiers professionnels
- Gestion documentaire avancée

**Détection automatique** du mode selon votre question!

---

## 🎯 Fonctionnalités Principales

### 1. **Upload de Fichiers Multiformat**

**Formats Supportés:**

| Type | Formats | Capacités |
|------|---------|-----------|
| **Images** | JPEG, PNG, WEBP, HEIC, HEIF, GIF | Analyse visuelle, OCR, description |
| **Documents** | PDF | Extraction texte, résumé, questions/réponses |
| **Tableurs** | Excel (.xlsx, .xls), CSV | Analyse données, modification, graphiques |
| **Traitement texte** | Word (.docx, .doc) | Édition, résumé, reformulation |
| **Présentations** | PowerPoint (.pptx) | Extraction contenu, suggestions |
| **Audio** | MP3, WAV, AAC, OGG, FLAC | Transcription, analyse |
| **Vidéo** | MP4, MOV, AVI, WEBM | Analyse contenu visuel |
| **Code/Texte** | .txt, .md, .json, .js, .py, etc. | Analyse, débogage, suggestions |

**Limite:** 50 MB par fichier, 10 fichiers simultanés

### 2. **Méthodes d'Upload**

#### A. Drag & Drop
1. **Glissez** vos fichiers directement sur la zone de chat
2. Déposez-les quand la zone devient bleue
3. Les fichiers apparaissent dans la zone de prévisualisation

#### B. Bouton Upload
1. Cliquez sur l'icône 📎 (trombone)
2. Sélectionnez un ou plusieurs fichiers
3. Validez

#### C. Upload Invisible
Tapez simplement votre question et uploadez les fichiers pertinents!

### 3. **Exemples d'Utilisation**

#### 📊 Analyse de Tableur Excel
```
Utilisateur: [Upload fichier ventes-2024.xlsx]
"Analyse ce fichier Excel et dis-moi quels sont les 3 meilleurs mois"

Gemini: 📊 Voici l'analyse de vos ventes 2024:

Fichiers trouvés: 1 fichier, 12 feuilles
- Feuille "Janvier": 234 lignes
- Feuille "Février": 189 lignes
...

Top 3 meilleurs mois:
1. Décembre: 145 320 € (+23%)
2. Novembre: 132 450 € (+18%)
3. Juin: 121 890 € (+12%)

📈 Tendance globale: +15% par rapport à 2023
```

#### 🖼️ Analyse d'Image
```
Utilisateur: [Upload screenshot-erreur.png]
"Qu'est-ce qui ne va pas dans cette capture d'écran?"

Gemini: 🔍 J'ai analysé l'image. Voici les problèmes identifiés:

1. **Erreur 404** visible dans la barre d'adresse
2. Le bouton "Connexion" est mal aligné
3. Le texte contient une faute: "Bienvenu" au lieu de "Bienvenue"

Suggestions de correction:
- Vérifier le lien de la page
- Ajuster le CSS du bouton (margin-left: 10px)
- Corriger l'orthographe dans le fichier de traduction
```

#### 📄 Résumé de PDF
```
Utilisateur: [Upload rapport-annuel-150pages.pdf]
"Résume-moi ce rapport en 5 points clés"

Gemini: 📄 Résumé du rapport annuel (150 pages):

**Points Clés:**

1. **Croissance** : +23% de chiffre d'affaires (85M€)
2. **Innovation** : Lancement de 12 nouveaux produits
3. **International** : Expansion en Asie (+5 pays)
4. **RH** : 230 nouveaux employés recrutés
5. **Durabilité** : -15% d'émissions CO2

📊 Confiance: 95%
```

#### ✏️ Modification de Document Word
```
Utilisateur: [Upload lettre-motivation.docx]
"Améliore cette lettre de motivation et rends-la plus professionnelle"

Gemini: ✅ J'ai amélioré votre lettre de motivation:

**Modifications apportées:**
- Structure réorganisée (3 paragraphes clairs)
- Vocabulaire plus formel et professionnel
- Ajout d'exemples concrets de réalisations
- Correction de 4 fautes d'orthographe
- Amélioration du paragraphe de conclusion

📥 Téléchargez la version modifiée: [lettre-motivation-amelioree.docx]
```

#### 📈 Génération d'Excel depuis Texte
```
Utilisateur: "Génère-moi un fichier Excel avec:
- Colonnes: Nom, Prénom, Email, Téléphone
- 20 exemples de données fictives"

Gemini: ✅ Tableau Excel généré!

**Contenu:**
- 4 colonnes (Nom, Prénom, Email, Téléphone)
- 20 lignes de données fictives
- Format professionnel

📥 [Télécharger: donnees-fictives.xlsx]
```

### 4. **Questions Générales (Mode Assistant)**

DocuCortex peut aussi répondre à **n'importe quelle question**:

```
❓ "C'est quoi la météo à Perpignan?"
❓ "Explique-moi les boucles en Python"
❓ "Traduis ce texte en espagnol"
❓ "Comment calculer la TVA à 20%?"
❓ "Aide-moi à écrire un email professionnel"
```

### 5. **Gestion des Conversations**

#### Nouvelle Conversation
Cliquez sur **"Nouveau"** pour démarrer une conversation fraîche

#### Historique
1. Cliquez sur l'icône **🕐 Historique**
2. Sélectionnez une conversation passée
3. Continuez où vous vous étiez arrêté

#### Suppression
- **Une conversation** : Cliquez sur 🗑️ à côté de la conversation
- **Tout l'historique** : Cliquez sur "Tout supprimer" dans l'historique

### 6. **Paramètres et Configuration**

#### Tester les Providers
1. Cliquez sur l'icône **⚙️ Paramètres**
2. Voyez les providers disponibles:
   - **Gemini AI** (Priorité 1 - Principal)
   - **OpenRouter** (Priorité 2 - Fallback)
3. Cliquez sur **🔄 Test** pour vérifier la connexion

#### Provider Actif
Le provider actif s'affiche en haut de l'interface:
```
Propulsé par gemini • Mode Hybride: GED + Assistant Général
```

#### Fallback Automatique
Si Gemini échoue, OpenRouter prend automatiquement le relais!

---

## 💡 Cas d'Usage Avancés

### Analyse Comptable
```
[Upload] bilan-comptable.xlsx
"Identifie les anomalies dans ce bilan"
```

### Traduction de Documents
```
[Upload] contrat-francais.pdf
"Traduis ce contrat en anglais et génère un Word"
```

### Debugging Code
```
[Upload] app.py
"Trouve les bugs dans ce code Python"
```

### Extraction de Données
```
[Upload] factures-janvier.pdf
"Extrait toutes les factures en Excel avec: Date, N°, Montant, Client"
```

### Génération de Rapports
```
"Crée-moi un rapport Excel d'analyse de ventes avec graphiques
pour les données suivantes: [colle tes données]"
```

---

## 🔧 Configuration Technique

### Configuration Gemini (Recommandé)

1. **Obtenir une clé API Gemini:**
   - Allez sur https://ai.google.dev/
   - Cliquez "Get API Key"
   - Créez une clé (gratuite!)
   - Format: `AIza...`

2. **Configurer dans l'application:**
   - Page **Configuration IA**
   - Section **Gemini AI**
   - Collez votre clé API
   - Sauvegardez

3. **Tester:**
   - Cliquez "Tester"
   - Devrait afficher: ✅ Connecté

### Configuration OpenRouter (Fallback)

1. **Obtenir une clé API OpenRouter:**
   - https://openrouter.ai/keys
   - Créez un compte
   - Générez une clé
   - Format: `sk-or-v1-...`

2. **Configurer:**
   - Même page Configuration IA
   - Section **OpenRouter**
   - Collez votre clé
   - Testez

### Fichier .env.ai

Créez `.env.ai` à la racine:
```bash
GEMINI_API_KEY=AIza...votre_clé_gemini
OPENROUTER_API_KEY=sk-or-v1-...votre_clé_openrouter
```

---

## 📊 Limitations et Performances

| Critère | Valeur |
|---------|--------|
| **Taille max fichier** | 50 MB |
| **Fichiers simultanés** | 10 maximum |
| **Temps de réponse** | 2-10 secondes |
| **Formats supportés** | 20+ formats |
| **Provider principal** | Gemini (gratuit) |
| **Provider fallback** | OpenRouter |
| **Historique** | Illimité |

---

## 🐛 Dépannage

### Problème: Upload échoue
**Solution:**
- Vérifiez la taille (<50 MB)
- Vérifiez le format (voir liste supportée)
- Réessayez

### Problème: Réponse lente
**Causes possibles:**
- Fichier très gros
- Gemini surchargé → Fallback vers OpenRouter

### Problème: Erreur "Provider non disponible"
**Solution:**
1. Allez dans Paramètres
2. Testez Gemini
3. Si erreur, vérifiez votre clé API
4. OpenRouter prendra le relais

### Problème: Fichier modifié non téléchargeable
**Solution:**
- Attendez la fin de la génération
- Vérifiez le dossier `data/outputs`
- Réessayez la requête

---

## 🎨 Interface Utilisateur

### Zone de Messages
- **Bleu clair** : Vos messages
- **Blanc** : Réponses de DocuCortex
- **Rouge** : Erreurs

### Badges de Confiance
Chaque réponse affiche:
```
Confiance: 95% • gemini
```

### Fichiers Joints
Affichés avec icônes selon le type:
- 🖼️ Images
- 📄 PDF
- 📊 Excel
- 📝 Word
- 🎵 Audio
- 🎬 Vidéo

---

## 🚀 Commandes Rapides

```bash
# Mise à jour du code
git pull origin claude/fix-multiple-issues-011CUwBXoLxB2jX6Hzo37Fjt

# Installation des dépendances (si nécessaire)
npm install

# Lancer l'application
npm run electron:start

# Build production
build-production.bat
```

---

## 📞 Support

En cas de problème:
1. Consultez les logs du serveur
2. Vérifiez la console navigateur (F12)
3. Testez les providers dans Paramètres
4. Vérifiez vos clés API

---

## 🎯 Prochaines Améliorations

- [ ] Support vidéo/audio avancé (transcription complète)
- [ ] Génération de PowerPoint
- [ ] Édition d'images (crop, resize, filtres)
- [ ] Graphiques Excel automatiques
- [ ] Export PDF enrichi
- [ ] OCR multilingue amélioré
- [ ] Fine-tuning personnalisé

---

**Version:** 3.0.26 + Multimodal
**Dernière mise à jour:** 2025-01-12
**Provider:** Gemini AI + OpenRouter

Bon voyage avec DocuCortex IA Ultra-Intelligente! 🚀🤖✨
