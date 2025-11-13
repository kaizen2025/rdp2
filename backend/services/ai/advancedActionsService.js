/**
 * Service d'Actions Avancées sur Documents
 * - Édition documents in-app
 * - Annotations et surlignage
 * - Partage via email/Teams
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class AdvancedActionsService {
    constructor() {
        this.annotations = new Map(); // Stockage annotations par document
        this.emailTransporter = null;
        this.teamsWebhook = null;
    }

    /**
     * Configure le service
     */
    async initialize(config = {}) {
        console.log('[AdvancedActions] Initialisation...');

        // Config email
        if (config.email) {
            this.emailTransporter = nodemailer.createTransport({
                host: config.email.host || 'smtp.office365.com',
                port: config.email.port || 587,
                secure: false,
                auth: {
                    user: config.email.user,
                    pass: config.email.password
                }
            });
            console.log('[AdvancedActions] ✅ Email configuré');
        }

        // Config Teams
        if (config.teams?.webhookUrl) {
            this.teamsWebhook = config.teams.webhookUrl;
            console.log('[AdvancedActions] ✅ Teams webhook configuré');
        }

        return { success: true };
    }

    // ==================== ANNOTATIONS ====================

    /**
     * Ajoute une annotation à un document
     */
    async addAnnotation(documentId, annotation) {
        try {
            console.log(`[AdvancedActions] ✍️ Ajout annotation sur doc ${documentId}`);

            const {
                type,           // 'highlight' | 'comment' | 'tag'
                content,        // Contenu de l'annotation
                position,       // { page, x, y } ou { start, end } pour texte
                color,          // Couleur pour surlignage
                author,         // Auteur de l'annotation
                isPrivate       // Annotation privée ou partagée
            } = annotation;

            if (!this.annotations.has(documentId)) {
                this.annotations.set(documentId, []);
            }

            const newAnnotation = {
                id: this.generateId(),
                type,
                content,
                position,
                color: color || '#FFEB3B',
                author,
                isPrivate: isPrivate || false,
                createdAt: new Date().toISOString(),
                replies: []
            };

            this.annotations.get(documentId).push(newAnnotation);

            console.log(`[AdvancedActions] ✅ Annotation ajoutée: ${newAnnotation.id}`);

            return {
                success: true,
                annotation: newAnnotation
            };

        } catch (error) {
            console.error('[AdvancedActions] Erreur ajout annotation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Récupère annotations d'un document
     */
    async getAnnotations(documentId, filters = {}) {
        try {
            let annotations = this.annotations.get(documentId) || [];

            // Filtres
            if (filters.type) {
                annotations = annotations.filter(a => a.type === filters.type);
            }
            if (filters.author) {
                annotations = annotations.filter(a => a.author === filters.author);
            }
            if (filters.onlyPublic) {
                annotations = annotations.filter(a => !a.isPrivate);
            }

            return {
                success: true,
                count: annotations.length,
                annotations: annotations
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Surligne un texte dans un document
     */
    async highlightText(documentId, highlightData) {
        return await this.addAnnotation(documentId, {
            type: 'highlight',
            content: highlightData.text,
            position: highlightData.position,
            color: highlightData.color || '#FFEB3B',
            author: highlightData.author
        });
    }

    /**
     * Ajoute un commentaire
     */
    async addComment(documentId, commentData) {
        return await this.addAnnotation(documentId, {
            type: 'comment',
            content: commentData.comment,
            position: commentData.position,
            author: commentData.author,
            isPrivate: commentData.isPrivate
        });
    }

    // ==================== ÉDITION DOCUMENTS ====================

    /**
     * Édite un document (texte simple)
     */
    async editDocument(documentPath, edits) {
        try {
            console.log(`[AdvancedActions] ✏️ Édition document: ${documentPath}`);

            // Lire contenu actuel
            const content = await fs.readFile(documentPath, 'utf8');

            // Appliquer modifications
            let newContent = content;
            for (const edit of edits) {
                if (edit.type === 'replace') {
                    newContent = newContent.replace(edit.search, edit.replace);
                } else if (edit.type === 'insert') {
                    const parts = [
                        newContent.substring(0, edit.position),
                        edit.text,
                        newContent.substring(edit.position)
                    ];
                    newContent = parts.join('');
                } else if (edit.type === 'delete') {
                    newContent = newContent.substring(0, edit.start) +
                                newContent.substring(edit.end);
                }
            }

            // Créer backup
            const backupPath = `${documentPath}.backup.${Date.now()}`;
            await fs.copyFile(documentPath, backupPath);

            // Sauvegarder nouveau contenu
            await fs.writeFile(documentPath, newContent, 'utf8');

            console.log(`[AdvancedActions] ✅ Document édité avec succès`);

            return {
                success: true,
                backupPath: backupPath,
                changesCount: edits.length
            };

        } catch (error) {
            console.error('[AdvancedActions] Erreur édition:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Restaure un backup
     */
    async restoreBackup(backupPath, originalPath) {
        try {
            await fs.copyFile(backupPath, originalPath);
            console.log(`[AdvancedActions] ✅ Backup restauré`);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== PARTAGE ====================

    /**
     * Partage document par email
     */
    async shareViaEmail(documentPath, emailData) {
        try {
            console.log(`[AdvancedActions] 📧 Partage email: ${emailData.to}`);

            if (!this.emailTransporter) {
                throw new Error('Email non configuré');
            }

            const {
                to,
                cc,
                subject,
                message,
                includeAttachment
            } = emailData;

            const mailOptions = {
                from: this.emailTransporter.options.auth.user,
                to: to,
                cc: cc,
                subject: subject || 'Document partagé via DocuCortex',
                html: this.buildEmailHTML(message, documentPath),
                attachments: includeAttachment ? [{
                    filename: path.basename(documentPath),
                    path: documentPath
                }] : []
            };

            const info = await this.emailTransporter.sendMail(mailOptions);

            console.log(`[AdvancedActions] ✅ Email envoyé: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                recipients: to
            };

        } catch (error) {
            console.error('[AdvancedActions] Erreur envoi email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Partage document sur Teams
     */
    async shareViaTeams(documentPath, teamsData) {
        try {
            console.log(`[AdvancedActions] 💬 Partage Teams`);

            if (!this.teamsWebhook) {
                throw new Error('Teams webhook non configuré');
            }

            const {
                channelName,
                message,
                mentions
            } = teamsData;

            // Construire carte Teams
            const card = {
                "@type": "MessageCard",
                "@context": "https://schema.org/extensions",
                "summary": "Document partagé",
                "themeColor": "667eea",
                "title": "📄 Document partagé via DocuCortex",
                "sections": [{
                    "activityTitle": message || "Nouveau document partagé",
                    "activitySubtitle": path.basename(documentPath),
                    "activityImage": "https://via.placeholder.com/64",
                    "facts": [
                        {
                            "name": "Fichier:",
                            "value": path.basename(documentPath)
                        },
                        {
                            "name": "Chemin:",
                            "value": documentPath
                        },
                        {
                            "name": "Partagé le:",
                            "value": new Date().toLocaleString('fr-FR')
                        }
                    ]
                }],
                "potentialAction": [{
                    "@type": "OpenUri",
                    "name": "Ouvrir le document",
                    "targets": [{
                        "os": "default",
                        "uri": `file:///${documentPath.replace(/\\/g, '/')}`
                    }]
                }]
            };

            // Envoyer via webhook
            const fetch = require('node-fetch');
            const response = await fetch(this.teamsWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card)
            });

            if (response.ok) {
                console.log(`[AdvancedActions] ✅ Partagé sur Teams`);
                return {
                    success: true,
                    channel: channelName
                };
            } else {
                throw new Error(`Teams API error: ${response.statusText}`);
            }

        } catch (error) {
            console.error('[AdvancedActions] Erreur partage Teams:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Génère un lien de partage temporaire
     */
    async generateShareLink(documentPath, options = {}) {
        try {
            const {
                expiresIn = 86400000,  // 24h par défaut
                password = null,
                maxDownloads = null
            } = options;

            const linkId = this.generateId();
            const expiresAt = Date.now() + expiresIn;

            const shareLink = {
                id: linkId,
                documentPath: documentPath,
                createdAt: Date.now(),
                expiresAt: expiresAt,
                password: password,
                maxDownloads: maxDownloads,
                downloads: 0,
                url: `https://docucortex.anecoop.fr/share/${linkId}`
            };

            // TODO: Sauvegarder dans DB
            console.log(`[AdvancedActions] 🔗 Lien généré: ${shareLink.url}`);

            return {
                success: true,
                link: shareLink
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== CONVERSION FORMATS ====================

    /**
     * Convertit document en PDF
     */
    async convertToPDF(documentPath, outputPath) {
        try {
            console.log(`[AdvancedActions] 📄 Conversion PDF: ${documentPath}`);

            // TODO: Implémenter conversion réelle (libreoffice, pandoc, etc.)
            // Pour l'instant, mock

            return {
                success: true,
                outputPath: outputPath,
                message: 'Conversion PDF (mock)'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== HELPERS ====================

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    buildEmailHTML(message, documentPath) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
                    .content { padding: 20px; }
                    .document { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .footer { background: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>📄 DocuCortex - Document Partagé</h2>
                    <p>Anecoop France</p>
                </div>
                <div class="content">
                    <p>${message || 'Un document a été partagé avec vous.'}</p>
                    <div class="document">
                        <strong>Fichier:</strong> ${path.basename(documentPath)}<br>
                        <strong>Chemin:</strong> <code>${documentPath}</code>
                    </div>
                </div>
                <div class="footer">
                    Powered by DocuCortex • Anecoop France
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Statistiques
     */
    getStats() {
        return {
            totalAnnotations: Array.from(this.annotations.values())
                .reduce((sum, arr) => sum + arr.length, 0),
            documentsAnnotated: this.annotations.size,
            emailConfigured: !!this.emailTransporter,
            teamsConfigured: !!this.teamsWebhook
        };
    }
}

module.exports = new AdvancedActionsService();
