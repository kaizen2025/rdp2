/**
 * JSON Schemas pour Structured Output (Gemini JSON Mode)
 * Définit les formats de réponse attendus pour chaque type d'intent
 */

/**
 * Schema pour les réponses de recherche documentaire
 */
const documentSearchResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['document_search'],
            description: 'Type d\'intent détecté'
        },
        summary: {
            type: 'string',
            description: 'Résumé concis de ce qui a été trouvé (1-2 phrases)'
        },
        documents: {
            type: 'array',
            description: 'Liste des documents trouvés',
            items: {
                type: 'object',
                properties: {
                    filename: {
                        type: 'string',
                        description: 'Nom du fichier'
                    },
                    path: {
                        type: 'string',
                        description: 'Chemin complet du fichier'
                    },
                    type: {
                        type: 'string',
                        enum: ['pdf', 'xlsx', 'docx', 'pptx', 'txt', 'other'],
                        description: 'Type de fichier'
                    },
                    relevance: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Score de pertinence (0-100)'
                    },
                    preview: {
                        type: 'string',
                        description: 'Extrait pertinent du document (100-200 caractères)'
                    },
                    metadata: {
                        type: 'object',
                        properties: {
                            size: { type: 'string', description: 'Taille du fichier' },
                            modified: { type: 'string', description: 'Date de modification' },
                            author: { type: 'string', description: 'Auteur si disponible' }
                        }
                    }
                },
                required: ['filename', 'path', 'type', 'relevance']
            }
        },
        totalFound: {
            type: 'integer',
            description: 'Nombre total de documents trouvés'
        },
        suggestions: {
            type: 'array',
            description: 'Suggestions d\'actions pour l\'utilisateur',
            items: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['open_document', 'view_folder', 'refine_search', 'analyze_document'],
                        description: 'Type d\'action suggérée'
                    },
                    label: {
                        type: 'string',
                        description: 'Texte du bouton d\'action'
                    },
                    target: {
                        type: 'string',
                        description: 'Cible de l\'action (path, query, etc.)'
                    }
                },
                required: ['action', 'label']
            }
        },
        confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Confiance dans les résultats (0-100)'
        }
    },
    required: ['intent', 'summary', 'documents', 'totalFound', 'suggestions', 'confidence']
};

/**
 * Schema pour l'analyse de documents
 */
const documentAnalysisResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['document_analysis'],
            description: 'Type d\'intent'
        },
        documentName: {
            type: 'string',
            description: 'Nom du document analysé'
        },
        analysisType: {
            type: 'string',
            enum: ['summary', 'extract_data', 'extract_tables', 'comparison', 'full_analysis'],
            description: 'Type d\'analyse effectuée'
        },
        summary: {
            type: 'string',
            description: 'Résumé exécutif du document (2-4 phrases)'
        },
        keyPoints: {
            type: 'array',
            description: 'Points clés extraits du document',
            items: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        description: 'Catégorie du point (ex: "Objectif", "Chiffres clés", "Conclusion")'
                    },
                    content: {
                        type: 'string',
                        description: 'Contenu du point clé'
                    },
                    page: {
                        type: 'integer',
                        description: 'Numéro de page si applicable'
                    }
                },
                required: ['content']
            }
        },
        extractedData: {
            type: 'object',
            description: 'Données structurées extraites',
            properties: {
                tables: {
                    type: 'array',
                    description: 'Tableaux extraits',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            headers: { type: 'array', items: { type: 'string' } },
                            rows: {
                                type: 'array',
                                items: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                dates: {
                    type: 'array',
                    description: 'Dates importantes mentionnées',
                    items: { type: 'string' }
                },
                amounts: {
                    type: 'array',
                    description: 'Montants financiers mentionnés',
                    items: {
                        type: 'object',
                        properties: {
                            value: { type: 'number' },
                            currency: { type: 'string' },
                            context: { type: 'string' }
                        }
                    }
                },
                entities: {
                    type: 'array',
                    description: 'Entités nommées (personnes, lieux, organisations)',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            type: { type: 'string', enum: ['person', 'location', 'organization', 'other'] }
                        }
                    }
                }
            }
        },
        actionItems: {
            type: 'array',
            description: 'Actions à effectuer mentionnées dans le document',
            items: {
                type: 'object',
                properties: {
                    action: { type: 'string' },
                    deadline: { type: 'string' },
                    responsible: { type: 'string' }
                },
                required: ['action']
            }
        },
        confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Confiance dans l\'analyse'
        }
    },
    required: ['intent', 'documentName', 'analysisType', 'summary', 'keyPoints', 'confidence']
};

/**
 * Schema pour les questions factuelles générales
 */
const factualQuestionResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['factual_question'],
            description: 'Type d\'intent'
        },
        question: {
            type: 'string',
            description: 'Question reformulée de manière claire'
        },
        answer: {
            type: 'string',
            description: 'Réponse directe et concise'
        },
        details: {
            type: 'array',
            description: 'Détails supplémentaires organisés par section',
            items: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Titre de la section de détails'
                    },
                    content: {
                        type: 'string',
                        description: 'Contenu détaillé'
                    }
                },
                required: ['title', 'content']
            }
        },
        sources: {
            type: 'array',
            description: 'Sources d\'information (si applicables)',
            items: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['web', 'knowledge_base', 'calculation', 'internal'],
                        description: 'Type de source'
                    },
                    reference: {
                        type: 'string',
                        description: 'Référence ou lien'
                    }
                }
            }
        },
        relatedQuestions: {
            type: 'array',
            description: 'Questions connexes suggérées',
            items: { type: 'string' }
        },
        confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Confiance dans la réponse'
        }
    },
    required: ['intent', 'question', 'answer', 'confidence']
};

/**
 * Schema pour les recherches web
 */
const webSearchResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['web_search'],
            description: 'Type d\'intent'
        },
        query: {
            type: 'string',
            description: 'Requête de recherche effectuée'
        },
        answer: {
            type: 'string',
            description: 'Réponse synthétique basée sur la recherche web'
        },
        results: {
            type: 'array',
            description: 'Résultats de recherche structurés',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    snippet: { type: 'string', description: 'Extrait du résultat' },
                    source: { type: 'string', description: 'Source (URL simulée ou nom)' },
                    date: { type: 'string', description: 'Date de publication si disponible' },
                    relevance: { type: 'number', minimum: 0, maximum: 100 }
                },
                required: ['title', 'snippet']
            }
        },
        timestamp: {
            type: 'string',
            description: 'Horodatage de la recherche (ISO format)'
        },
        confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Confiance dans les résultats'
        },
        note: {
            type: 'string',
            description: 'Note sur l\'actualité des informations'
        }
    },
    required: ['intent', 'query', 'answer', 'results', 'timestamp', 'confidence']
};

/**
 * Schema pour les commandes applicatives
 */
const appCommandResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['app_command'],
            description: 'Type d\'intent'
        },
        command: {
            type: 'string',
            description: 'Commande à exécuter'
        },
        parameters: {
            type: 'object',
            description: 'Paramètres de la commande'
        },
        confirmation: {
            type: 'string',
            description: 'Message de confirmation pour l\'utilisateur'
        },
        requiresConfirmation: {
            type: 'boolean',
            description: 'Si true, demander confirmation avant exécution'
        },
        previewResults: {
            type: 'object',
            description: 'Aperçu des résultats attendus',
            properties: {
                affectedItems: { type: 'integer' },
                description: { type: 'string' }
            }
        }
    },
    required: ['intent', 'command', 'confirmation']
};

/**
 * Schema pour les conversations contextuelles
 */
const conversationResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['conversation'],
            description: 'Type d\'intent'
        },
        response: {
            type: 'string',
            description: 'Réponse conversationnelle'
        },
        contextReference: {
            type: 'object',
            description: 'Référence au contexte précédent',
            properties: {
                previousIntent: { type: 'string' },
                referredDocument: { type: 'string' },
                continuationOf: { type: 'string' }
            }
        },
        suggestions: {
            type: 'array',
            description: 'Suggestions de suite de conversation',
            items: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['followup_question', 'related_action', 'clarification']
                    },
                    text: { type: 'string' }
                },
                required: ['type', 'text']
            }
        },
        tone: {
            type: 'string',
            enum: ['professional', 'friendly', 'neutral', 'technical'],
            description: 'Ton de la réponse'
        }
    },
    required: ['intent', 'response', 'tone']
};

/**
 * Schema générique pour erreurs ou fallback
 */
const errorResponseSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            enum: ['error', 'unknown'],
            description: 'Type d\'intent'
        },
        error: {
            type: 'string',
            description: 'Message d\'erreur'
        },
        errorType: {
            type: 'string',
            enum: ['not_found', 'invalid_query', 'service_error', 'unknown'],
            description: 'Type d\'erreur'
        },
        suggestions: {
            type: 'array',
            description: 'Suggestions pour résoudre le problème',
            items: { type: 'string' }
        },
        fallbackResponse: {
            type: 'string',
            description: 'Réponse alternative si possible'
        }
    },
    required: ['intent', 'error', 'errorType']
};

/**
 * Mapping intent -> schema
 */
const schemasByIntent = {
    document_search: documentSearchResponseSchema,
    document_analysis: documentAnalysisResponseSchema,
    factual_question: factualQuestionResponseSchema,
    web_search: webSearchResponseSchema,
    app_command: appCommandResponseSchema,
    conversation: conversationResponseSchema,
    error: errorResponseSchema,
    unknown: errorResponseSchema
};

/**
 * Obtenir le schema approprié pour un intent
 */
function getSchemaForIntent(intent) {
    return schemasByIntent[intent] || errorResponseSchema;
}

/**
 * Valider une réponse contre son schema
 */
function validateResponse(response, intent) {
    const schema = getSchemaForIntent(intent);

    // Validation basique (pour production, utiliser une lib comme Ajv)
    const required = schema.required || [];
    const missing = required.filter(field => !(field in response));

    if (missing.length > 0) {
        return {
            valid: false,
            errors: missing.map(field => `Champ requis manquant: ${field}`)
        };
    }

    return { valid: true };
}

module.exports = {
    // Schemas individuels
    documentSearchResponseSchema,
    documentAnalysisResponseSchema,
    factualQuestionResponseSchema,
    webSearchResponseSchema,
    appCommandResponseSchema,
    conversationResponseSchema,
    errorResponseSchema,

    // Mapping et helpers
    schemasByIntent,
    getSchemaForIntent,
    validateResponse
};
