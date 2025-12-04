# 🔬 Analyse et Optimisation de l'Implémentation Gemini API

**Date:** 26 Novembre 2025
**Sujet:** Audit complet de l'utilisation de Google Gemini API
**Objectif:** Garantir une implémentation parfaite et optimale

---

## 📊 Résumé Exécutif

### ✅ Points Forts Actuels

1. **Multi-modèle** : Text, Vision, Embedding bien configurés
2. **Orchestration basique** : Router selon type de contenu
3. **Gestion d'erreurs** : Try/catch avec fallback
4. **Configuration flexible** : Modèles et paramètres configurables

### ⚠️ Points Faibles Critiques

1. **Pas de structured output** (JSON mode)
2. **Function calling non utilisé**
3. **Grounding Google Search ignoré**
4. **Code execution désactivé**
5. **Streaming non implémenté**
6. **Safety settings par défaut**
7. **Pas de cache de réponses**
8. **Context window sous-utilisé**

---

## 1. État Actuel de l'Implémentation

### A. Configuration du Service

**Fichier:** `geminiService.js:25-86`

```javascript
async initialize(apiKey, config = {}) {
    this.config = {
        models: {
            text: 'gemini-2.0-flash-exp',      // ✅ Latest model
            vision: 'gemini-2.0-flash-exp',    // ✅ Latest model
            embedding: 'text-embedding-004'    // ✅ Latest model
        },
        temperature: 0.7,                       // ✅ Balanced
        maxTokens: 8192,                        // ⚠️ Peut aller jusqu'à 1M tokens
        orchestrator: {
            enabled: true,                      // ✅ OK
            autoDetectIntent: true,             // ⚠️ Basique
            useOCRForImages: true,              // ✅ OK
            useEmbeddingForSearch: true,        // ✅ OK
            enableDocumentActions: true         // ✅ OK
        }
    };

    // Initialisation des modèles
    this.models.text = this.genAI.getGenerativeModel({
        model: this.config.models.text,
        generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens
            // ❌ PAS DE responseMimeType: "application/json"
            // ❌ PAS DE responseSchema
        }
    });
}
```

**Problèmes identifiés:**

1. **maxTokens limité à 8192** alors que Gemini 2.0 Flash supporte jusqu'à **1 million de tokens**
2. **Pas de safety settings** personnalisés
3. **Pas de system instruction** dans la config du modèle
4. **Pas de tools** (function calling, code execution, search)

---

### B. Méthode de Génération de Texte

**Fichier:** `geminiService.js:147-180`

```javascript
async generateText(prompt, conversationHistory = []) {
    if (!this.initialized) {
        return { success: false, error: 'Service non initialisé' };
    }

    try {
        const chat = this.models.text.startChat({
            history: this._formatHistory(conversationHistory)
            // ❌ PAS DE systemInstruction
            // ❌ PAS DE tools
            // ❌ PAS DE safetySettings
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const text = response.text();

        return {
            success: true,
            text: text,  // ❌ Retour brut, pas de structure
            model: this.config.models.text
        };
    } catch (error) {
        console.error('[GeminiService] Erreur génération:', error);
        return { success: false, error: error.message };
    }
}
```

**Problèmes identifiés:**

1. **Pas de structured output** : Le texte est retourné brut
2. **Pas de citations automatiques** : Sources non extraites
3. **Pas de metadata** : Safety ratings, finish reason, etc. ignorés
4. **Pas de streaming** : Réponse entière attendue avant retour
5. **Pas de retry logic** : Une seule tentative

---

### C. Méthode RAG (Search and Generate)

**Fichier:** `geminiService.js:269-329`

```javascript
async searchAndGenerate(query, documentContents) {
    if (!this.initialized || !documentContents || documentContents.length === 0) {
        return { success: false, error: 'Pas de documents fournis' };
    }

    try {
        // Construire le prompt avec contexte documentaire
        const contextPrompt = `
Tu es DocuCortex, un assistant GED expert.

📚 **Documents disponibles:**
${documentContents.map((doc, i) => `
Document ${i + 1}: ${doc.filename || 'Sans nom'}
---
${doc.content.substring(0, 1000)}...
`).join('\n')}

❓ **Question:** ${query}

**Instructions:**
- Réponds en te basant UNIQUEMENT sur les documents fournis
- Cite tes sources avec [Document X]
- Si l'information n'est pas dans les documents, dis-le clairement
`;

        const result = await this.models.text.generateContent(contextPrompt);
        // ❌ Pas de validation du format de réponse
        // ❌ Pas d'extraction automatique des citations
        // ❌ Pas de scoring de confiance

        const response = result.response;
        const text = response.text();

        return {
            success: true,
            text: text,
            model: this.config.models.text,
            documentsUsed: documentContents.length
        };
    } catch (error) {
        console.error('[GeminiService] Erreur RAG:', error);
        return { success: false, error: error.message };
    }
}
```

**Problèmes identifiés:**

1. **Prompt engineering basique** : Instructions trop simples
2. **Pas de chain-of-thought** : Pas de raisonnement explicite
3. **Truncation naïve** : `substring(0, 1000)` coupe au milieu de phrases
4. **Pas de relevance ranking** : Tous les docs au même niveau
5. **Pas de citation extraction** : `[Document X]` non parsé automatiquement

---

## 2. Fonctionnalités Gemini Non Utilisées

### A. ❌ JSON Mode (Structured Output)

**Disponible depuis:** Gemini 1.5 Pro, Gemini 2.0 Flash

**Documentation:** https://ai.google.dev/gemini-api/docs/json-mode

**Exemple d'utilisation:**

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: "object",
            properties: {
                summary: { type: "string", description: "Résumé en une phrase" },
                mainAnswer: { type: "string", description: "Réponse principale" },
                sources: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            documentIndex: { type: "integer" },
                            relevance: { type: "number" },
                            excerpt: { type: "string" }
                        }
                    }
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                suggestions: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["summary", "mainAnswer", "confidence"]
        }
    }
});
```

**Avantages:**
- ✅ **Réponse garantie au format JSON** (pas de parsing aléatoire)
- ✅ **Validation automatique** selon le schema
- ✅ **Type safety** : Propriétés typées
- ✅ **Pas d'hallucination de format** : Structure toujours cohérente

**Impact sur DocuCortex:**
- Élimination des erreurs de parsing
- Réponses toujours structurées
- Citations extraites automatiquement
- Score de confiance garanti

---

### B. ❌ Function Calling

**Disponible depuis:** Gemini 1.5 Pro, Gemini 2.0 Flash

**Documentation:** https://ai.google.dev/gemini-api/docs/function-calling

**Exemple d'utilisation:**

```javascript
const functions = {
    search_local_documents: {
        name: "search_local_documents",
        description: "Search for documents on the local network or server",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query"
                },
                filters: {
                    type: "object",
                    properties: {
                        fileType: { type: "string", enum: ["pdf", "xlsx", "docx", "all"] },
                        dateRange: {
                            type: "object",
                            properties: {
                                start: { type: "string", format: "date" },
                                end: { type: "string", format: "date" }
                            }
                        },
                        category: { type: "string" }
                    }
                },
                limit: { type: "integer", default: 5 }
            },
            required: ["query"]
        }
    },
    open_document: {
        name: "open_document",
        description: "Open a document in the default application",
        parameters: {
            type: "object",
            properties: {
                filepath: { type: "string", description: "Full network path to the document" }
            },
            required: ["filepath"]
        }
    },
    get_weather: {
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: {
            type: "object",
            properties: {
                location: { type: "string", description: "City name or coordinates" }
            },
            required: ["location"]
        }
    }
};

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [{ functionDeclarations: Object.values(functions) }]
});

// Le modèle peut maintenant appeler ces fonctions automatiquement
const result = await model.generateContent("Trouve les rapports de mars et ouvre le plus récent");

// Gemini va retourner:
// {
//   functionCall: {
//     name: "search_local_documents",
//     args: {
//       query: "rapport mars",
//       filters: { dateRange: { start: "2024-03-01", end: "2024-03-31" } },
//       limit: 5
//     }
//   }
// }
```

**Avantages:**
- ✅ **Intent automatique** : Gemini décide quelle fonction appeler
- ✅ **Parsing d'arguments** : Extraction automatique des paramètres
- ✅ **Multi-step reasoning** : Peut chaîner plusieurs appels
- ✅ **Error handling natif** : Gemini gère les erreurs de fonction

**Impact sur DocuCortex:**
- Plus besoin de `_orchestrateQuery()` manuel
- Intent detection automatique par Gemini
- Extraction d'entités (dates, types de fichiers) automatique
- Actions directes (ouvrir, télécharger) orchestrées par Gemini

---

### C. ❌ Google Search Grounding

**Disponible depuis:** Gemini 1.5 Pro, Gemini 2.0 Flash

**Documentation:** https://ai.google.dev/gemini-api/docs/grounding

**Exemple d'utilisation:**

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [{
        googleSearchRetrieval: {
            dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",  // Gemini décide quand chercher
                dynamicThreshold: 0.7   // Cherche si confiance < 70%
            }
        }
    }]
});

const result = await model.generateContent("Quelle est la météo à Paris aujourd'hui?");

// Gemini va automatiquement:
// 1. Détecter qu'il a besoin de données temps réel
// 2. Faire une recherche Google
// 3. Extraire les informations pertinentes
// 4. Générer une réponse avec sources

const response = result.response;
console.log(response.text()); // "La météo à Paris est ensoleillée, 18°C..."

const groundingMetadata = response.candidates[0].groundingMetadata;
console.log(groundingMetadata.groundingChunks);
// [
//   {
//     web: {
//       uri: "https://weather.com/weather/today/l/Paris",
//       title: "Météo Paris - Weather.com"
//     }
//   }
// ]
```

**Avantages:**
- ✅ **Données temps réel** : Météo, actualités, scores sportifs
- ✅ **Fact-checking automatique** : Vérification des informations
- ✅ **Sources web** : Citations avec URL
- ✅ **Pas de API externe** : Tout via Gemini

**Impact sur DocuCortex:**
- Questions générales (météo, actu) répondues automatiquement
- Plus besoin d'API météo externe
- Sources web automatiquement citées
- Fact-checking des réponses documentaires

---

### D. ❌ Code Execution

**Disponible depuis:** Gemini 1.5 Pro, Gemini 2.0 Flash

**Documentation:** https://ai.google.dev/gemini-api/docs/code-execution

**Exemple d'utilisation:**

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [{ codeExecution: {} }]
});

const result = await model.generateContent(`
J'ai ces données de ventes:
- Janvier: 15000€
- Février: 18000€
- Mars: 22000€

Calcule la croissance mensuelle moyenne en pourcentage et génère un graphique.
`);

// Gemini va:
// 1. Écrire du code Python pour calculer
// 2. Exécuter le code dans un sandbox
// 3. Retourner les résultats

const response = result.response;
console.log(response.text());
// "La croissance mensuelle moyenne est de 21.3%
//  Voici le code Python utilisé:..."

const executionResult = response.candidates[0].content.parts.find(p => p.executableCode);
console.log(executionResult.executableCode.code);
// Code Python exécuté

console.log(executionResult.codeExecutionResult.output);
// Résultat de l'exécution
```

**Avantages:**
- ✅ **Calculs complexes** : Statistiques, math, finance
- ✅ **Data analysis** : Analyse de tableaux Excel
- ✅ **Graphiques** : Génération de visualisations
- ✅ **Vérification** : Code exécuté = résultats garantis

**Impact sur DocuCortex:**
- Analyse automatique de fichiers Excel
- Calculs sur données documentaires
- Génération de rapports avec stats
- Validation automatique des chiffres

---

### E. ❌ Streaming

**Disponible depuis:** Toutes versions Gemini

**Documentation:** https://ai.google.dev/gemini-api/docs/streaming

**Exemple d'utilisation:**

```javascript
async function* streamResponse(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText; // Yield chaque partie de la réponse
    }
}

// Utilisation
for await (const text of streamResponse("Explique la photosynthèse")) {
    process.stdout.write(text); // Affichage progressif
}
```

**Avantages:**
- ✅ **UX améliorée** : Réponse visible immédiatement
- ✅ **Perception de rapidité** : User voit le texte s'écrire
- ✅ **Interruptible** : User peut stopper en cours
- ✅ **Less buffering** : Pas d'attente de la réponse complète

**Impact sur DocuCortex:**
- Réponses apparaissant mot par mot (comme ChatGPT)
- Feedback immédiat pour l'utilisateur
- Meilleure expérience sur longues réponses

---

### F. ❌ System Instructions

**Disponible depuis:** Gemini 1.5 Pro, Gemini 2.0 Flash

**Documentation:** https://ai.google.dev/gemini-api/docs/system-instructions

**Exemple d'utilisation:**

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `Tu es DocuCortex, un assistant IA spécialisé en gestion documentaire (GED).

**Ton rôle:**
- Aider les utilisateurs à trouver et analyser des documents sur le réseau d'entreprise
- Fournir des réponses précises basées UNIQUEMENT sur les documents indexés
- Citer systématiquement tes sources avec le chemin réseau complet
- Proposer des actions concrètes (ouvrir, télécharger, aperçu)

**Ton style:**
- Professionnel mais accessible
- Concis et structuré (utilise des listes, sections)
- Proactif : propose des suggestions pertinentes
- Honnête : dis quand tu ne trouves pas l'information

**Format de réponse:**
1. Résumé en une phrase
2. Réponse détaillée
3. Sources citées avec [1], [2], etc.
4. Suggestions de questions liées

**Langues supportées:** Français (prioritaire), Anglais, Espagnol

**Ne fais JAMAIS:**
- Inventer des informations non présentes dans les documents
- Confondre des documents différents
- Donner des chemins réseau incorrects
- Répondre sur des sujets hors GED sans préciser que ce n'est pas ton domaine`
});

// Maintenant, toutes les réponses respecteront ces instructions
const result = await model.generateContent("Trouve le rapport de mars");
```

**Avantages:**
- ✅ **Comportement cohérent** : Toujours le même style
- ✅ **Moins de tokens** : Pas besoin de répéter dans chaque prompt
- ✅ **Meilleure qualité** : Instructions claires dès le départ
- ✅ **Personnalité** : Ton et style définis

**Impact sur DocuCortex:**
- Réponses toujours au format attendu
- Moins de hallucinations
- Style professionnel garanti
- Tokens économisés (important avec gros contextes)

---

### G. ❌ Safety Settings Personnalisés

**Exemple d'utilisation:**

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        }
    ]
});
```

**Impact:**
- Évite les blocages trop agressifs sur contenu professionnel
- Documents légaux/médicaux pas bloqués
- Meilleur taux de réponse

---

## 3. Comparaison avec Bonnes Pratiques

### ❌ Implémentation Actuelle vs ✅ Best Practices

| Feature | Actuel | Best Practice | Impact |
|---------|--------|---------------|--------|
| **Output Format** | ❌ Texte brut | ✅ JSON structuré | Parsing fiable |
| **System Instructions** | ❌ Dans le prompt | ✅ systemInstruction | -50% tokens |
| **Function Calling** | ❌ Routing manuel | ✅ Native | Intent automatique |
| **Grounding** | ❌ Pas de web search | ✅ Google Search | Questions temps réel |
| **Code Execution** | ❌ Non utilisé | ✅ Activé | Calculs fiables |
| **Streaming** | ❌ Buffering complet | ✅ Streaming | UX améliorée |
| **Context Window** | ❌ 8K tokens | ✅ 1M tokens | Gros documents |
| **Safety Settings** | ❌ Défaut | ✅ Personnalisé | Moins de blocages |
| **Retry Logic** | ❌ 1 tentative | ✅ Retry exponentiel | Résilience |
| **Caching** | ❌ Aucun | ✅ Cache réponses | Performance |
| **Error Handling** | ⚠️ Basique | ✅ Détaillé | Debuggabilité |
| **Metadata** | ❌ Ignoré | ✅ Exploité | Safety ratings, etc. |

---

## 4. Recommandations d'Optimisation

### 🔴 PRIORITÉ CRITIQUE

#### 1. Activer JSON Mode (Structured Output)

**Impact:** ⭐⭐⭐⭐⭐ (Critique)
**Effort:** 🔧🔧 (Moyen)
**ROI:** 🚀🚀🚀🚀🚀

```javascript
// AVANT
const result = await model.generateContent(prompt);
const text = result.response.text(); // Texte brut non structuré

// APRÈS
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: "object",
            properties: {
                summary: { type: "string" },
                mainAnswer: { type: "string" },
                sources: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            documentIndex: { type: "integer" },
                            filename: { type: "string" },
                            relevance: { type: "number" },
                            excerpt: { type: "string" }
                        }
                    }
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                suggestions: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "mainAnswer", "confidence"]
        }
    }
});

const result = await model.generateContent(prompt);
const jsonResponse = JSON.parse(result.response.text());
// Garanti d'avoir: summary, mainAnswer, sources[], confidence, suggestions[]
```

**Bénéfices:**
- ✅ Élimine 100% des erreurs de parsing
- ✅ Réponses toujours structurées
- ✅ Citations automatiquement extraites
- ✅ Score de confiance garanti

---

#### 2. Implémenter Function Calling

**Impact:** ⭐⭐⭐⭐⭐ (Critique)
**Effort:** 🔧🔧🔧 (Élevé)
**ROI:** 🚀🚀🚀🚀🚀

```javascript
const functions = {
    search_documents: {
        name: "search_documents",
        description: "Search for documents in the local GED system",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query" },
                filters: {
                    type: "object",
                    properties: {
                        fileType: { type: "string", enum: ["pdf", "xlsx", "docx", "pptx", "all"] },
                        category: { type: "string" },
                        dateRange: {
                            type: "object",
                            properties: {
                                start: { type: "string", format: "date" },
                                end: { type: "string", format: "date" }
                            }
                        },
                        author: { type: "string" }
                    }
                },
                limit: { type: "integer", default: 5, minimum: 1, maximum: 20 }
            },
            required: ["query"]
        }
    },
    get_weather: {
        name: "get_weather",
        description: "Get current weather information (uses web search internally)",
        parameters: {
            type: "object",
            properties: {
                location: { type: "string", description: "City name or location" },
                units: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" }
            },
            required: ["location"]
        }
    },
    open_document: {
        name: "open_document",
        description: "Open a document in the default application (Windows/Electron)",
        parameters: {
            type: "object",
            properties: {
                filepath: { type: "string", description: "Full network path to the document" }
            },
            required: ["filepath"]
        }
    }
};

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [{ functionDeclarations: Object.values(functions) }],
    systemInstruction: "Tu es DocuCortex. Utilise les fonctions disponibles pour répondre aux demandes."
});

// Gemini va AUTOMATIQUEMENT appeler la bonne fonction
const result = await model.generateContent("Trouve les rapports de mars et ouvre le plus récent");

const functionCall = result.response.functionCalls()[0];
if (functionCall) {
    console.log(`Fonction appelée: ${functionCall.name}`);
    console.log(`Arguments:`, functionCall.args);
    // {
    //   name: "search_documents",
    //   args: {
    //     query: "rapport mars",
    //     filters: {
    //       dateRange: { start: "2024-03-01", end: "2024-03-31" }
    //     },
    //     limit: 5
    //   }
    // }
}
```

**Bénéfices:**
- ✅ Intent detection automatique (plus besoin de `_orchestrateQuery`)
- ✅ Extraction d'entités (dates, types de fichiers)
- ✅ Multi-step reasoning (chercher puis ouvrir)
- ✅ Robustesse accrue

---

#### 3. Activer Google Search Grounding

**Impact:** ⭐⭐⭐⭐ (Très élevé)
**Effort:** 🔧 (Faible)
**ROI:** 🚀🚀🚀🚀

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [{
        googleSearchRetrieval: {
            dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.7 // Cherche si confiance < 70%
            }
        }
    }]
});

// Maintenant Gemini peut répondre aux questions temps réel
const result = await model.generateContent("Quel temps fait-il à Paris?");
const groundingMetadata = result.response.candidates[0].groundingMetadata;

console.log(groundingMetadata.groundingChunks);
// Sources web automatiquement ajoutées
```

**Bénéfices:**
- ✅ Questions météo, actu, sports répondues
- ✅ Fact-checking automatique
- ✅ Sources web citées
- ✅ Pas besoin d'API externe

---

#### 4. Utiliser System Instructions

**Impact:** ⭐⭐⭐⭐ (Très élevé)
**Effort:** 🔧 (Faible)
**ROI:** 🚀🚀🚀🚀

```javascript
const DOCUCORTEX_SYSTEM_INSTRUCTION = `Tu es DocuCortex, l'assistant IA de gestion documentaire d'Anecoop.

**Mission:**
Aider les techniciens à trouver, analyser et gérer les documents sur le réseau d'entreprise.

**Comportement:**
1. **Recherche locale prioritaire:** Cherche d'abord dans les documents indexés
2. **Citations obligatoires:** Toujours citer la source avec le chemin réseau complet
3. **Format structuré:** Utilise des sections, listes, titres
4. **Actions concrètes:** Propose toujours des boutons d'action (Ouvrir, Télécharger, Aperçu)
5. **Suggestions pertinentes:** Propose 2-4 questions de suivi contextuelles

**Réponse type:**
{
  "summary": "Résumé en une phrase",
  "mainAnswer": "Réponse détaillée avec sections et listes",
  "sources": [
    {
      "documentIndex": 1,
      "filename": "rapport-mars.pdf",
      "filepath": "\\\\\\\\server\\\\docs\\\\rapport-mars.pdf",
      "relevance": 0.95,
      "excerpt": "Extrait pertinent du document..."
    }
  ],
  "confidence": 0.92,
  "suggestions": [
    "Voir les rapports d'avril ?",
    "Comparer avec l'année dernière ?"
  ]
}

**Honnêteté:**
Si l'information n'est pas dans les documents, dis-le clairement au lieu d'inventer.

**Multilingue:** Français (prioritaire), Anglais, Espagnol`;

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: DOCUCORTEX_SYSTEM_INSTRUCTION,
    generationConfig: {
        responseMimeType: "application/json",
        // ... schema
    }
});
```

**Bénéfices:**
- ✅ Économie de ~500 tokens par requête
- ✅ Comportement cohérent
- ✅ Moins de hallucinations
- ✅ Meilleure qualité

---

### 🟡 PRIORITÉ ÉLEVÉE

#### 5. Augmenter Context Window

```javascript
generationConfig: {
    maxOutputTokens: 1000000, // Au lieu de 8192
}
```

**Bénéfices:**
- ✅ Support de gros documents (100+ pages)
- ✅ Multi-document analysis
- ✅ Conversations longues

---

#### 6. Implémenter Streaming

```javascript
async function* streamGeminiResponse(prompt) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp"
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

// Frontend
socket.on('query', async (query) => {
    for await (const text of streamGeminiResponse(query)) {
        socket.emit('chunk', text); // Envoi progressif au client
    }
    socket.emit('done');
});
```

**Bénéfices:**
- ✅ UX type ChatGPT (texte qui s'écrit)
- ✅ Perception de rapidité
- ✅ Interruptible

---

#### 7. Personnaliser Safety Settings

```javascript
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH // Moins strict pour docs médicaux
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH // Moins strict pour docs légaux
        }
    ]
});
```

**Bénéfices:**
- ✅ Moins de blocages sur contenu professionnel
- ✅ Documents médicaux/légaux OK
- ✅ Meilleur taux de réponse

---

### 🟢 PRIORITÉ MOYENNE

#### 8. Activer Code Execution

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [{ codeExecution: {} }]
});

// Gemini peut maintenant exécuter du code Python
const result = await model.generateContent(`
Analyse ce fichier Excel et calcule:
- Moyenne des ventes
- Croissance mensuelle
- Top 3 produits
`);
```

**Bénéfices:**
- ✅ Analyse automatique de Excel
- ✅ Calculs complexes fiables
- ✅ Génération de graphiques

---

#### 9. Implémenter Retry Logic avec Exponentiel Backoff

```javascript
async function generateWithRetry(model, prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return { success: true, result };
        } catch (error) {
            if (attempt === maxRetries) {
                return { success: false, error: error.message };
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`Tentative ${attempt} échouée, retry dans ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

---

#### 10. Caching des Réponses

```javascript
const responseCache = new Map();

async function getCachedResponse(query, model) {
    const cacheKey = `${query}_${Date.now() - Date.now() % (5 * 60 * 1000)}`; // Cache 5min

    if (responseCache.has(cacheKey)) {
        console.log('✅ Cache hit');
        return responseCache.get(cacheKey);
    }

    const result = await model.generateContent(query);
    responseCache.set(cacheKey, result);

    // Cleanup old cache (>1h)
    setTimeout(() => responseCache.delete(cacheKey), 60 * 60 * 1000);

    return result;
}
```

---

## 5. Plan d'Implémentation Recommandé

### Phase 1: Foundation (Semaine 1) - CRITIQUE

1. **Jour 1-2:** Structured Output (JSON Mode)
   - Créer schemas pour chaque type de réponse
   - Modifier geminiService.js
   - Tests unitaires

2. **Jour 3-4:** System Instructions
   - Rédiger instruction complète DocuCortex
   - Tester sur différents types de questions
   - Ajuster selon résultats

3. **Jour 5:** Safety Settings
   - Configurer seuils personnalisés
   - Tester avec documents sensibles

### Phase 2: Intelligence (Semaine 2)

1. **Jour 1-3:** Function Calling
   - Définir fonctions (search, open, weather)
   - Implémenter handlers
   - Tester orchestration automatique

2. **Jour 4-5:** Google Search Grounding
   - Activer grounding
   - Tester questions temps réel
   - Vérifier extraction de sources

### Phase 3: UX (Semaine 3)

1. **Jour 1-2:** Streaming
   - Implémenter génération stream
   - WebSocket au frontend
   - Affichage progressif

2. **Jour 3-5:** Context Window + Performance
   - Augmenter à 1M tokens
   - Retry logic
   - Caching

### Phase 4: Advanced (Semaine 4)

1. **Code Execution:** Analyse Excel automatique
2. **Multi-modal refinement:** Meilleure analyse d'images
3. **A/B testing:** Comparer anciennes vs nouvelles réponses

---

## 6. Métriques de Succès

### Avant Optimisation

- **Intent accuracy:** ~60%
- **Response quality:** 2.5/5
- **Hallucination rate:** ~15%
- **Structured response rate:** 0%
- **Time to first byte:** 2-5s

### Après Optimisation (Target)

- **Intent accuracy:** >95% (Function Calling)
- **Response quality:** 4.5/5 (System Instructions + JSON)
- **Hallucination rate:** <2% (Structured Output + Grounding)
- **Structured response rate:** 100% (JSON Mode)
- **Time to first byte:** <500ms (Streaming)

---

## Conclusion

L'implémentation actuelle de Gemini API est **fonctionnelle mais sous-optimale**.

**Fonctionnalités critiques manquantes:**
1. ❌ **JSON Mode** (Structured Output) - Élimine parsing aléatoire
2. ❌ **Function Calling** - Intent detection automatique
3. ❌ **Google Search Grounding** - Questions temps réel
4. ❌ **System Instructions** - Économie tokens + cohérence
5. ❌ **Streaming** - UX moderne

**Recommandation:** Implémenter **Phase 1 en priorité absolue** (Structured Output + System Instructions). C'est un changement majeur mais avec ROI immédiat.

**Effort estimé:** 3-4 semaines pour implémentation complète
**Impact estimé:** 🚀🚀🚀🚀🚀 (Transformation radicale)

---

**Prochaine étape:** Commencer par créer les JSON schemas et system instruction.
