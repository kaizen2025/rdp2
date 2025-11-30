// src/integrations/EmailConnector.js - CONNECTEUR EMAIL
// Connecteur pour notifications automatiques et communications email

class EmailConnector {
    constructor(config = {}) {
        this.config = {
            smtp: {
                host: config.smtp?.host || 'localhost',
                port: config.smtp?.port || 587,
                secure: config.smtp?.secure || false,
                auth: {
                    user: config.smtp?.auth?.user || '',
                    pass: config.smtp?.auth?.pass || ''
                }
            },
            templates: config.templates || {
                loanReminder: 'loan_reminder',
                overdueNotice: 'overdue_notice',
                equipmentReturn: 'equipment_return',
                userWelcome: 'user_welcome',
                equipmentIssue: 'equipment_issue',
                warrantyAlert: 'warranty_alert'
            },
            fromEmail: config.fromEmail || 'noreply@docucortex.com',
            fromName: config.fromName || 'DocuCortex System',
            replyTo: config.replyTo || 'support@docucortex.com',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            enabled: config.enabled !== false,
            batchSize: config.batchSize || 50,
            rateLimit: config.rateLimit || 10, // emails par minute
            ...config
        };

        this.smtpTransport = null;
        this.isConnected = false;
        this.emailCache = new Map();
        this.templateCache = new Map();
        this.rateLimiter = {
            sent: 0,
            windowStart: Date.now(),
            maxEmails: this.config.rateLimit
        };

        // Templates de base
        this.defaultTemplates = this.initializeDefaultTemplates();
        
        // Initialiser le transport SMTP
        this.initializeTransport();
    }

    // 🔧 Initialisation
    initializeTransport() {
        if (!this.config.smtp.host) {
            console.warn('Configuration SMTP non fournie, utilisation du mode simulation');
            return;
        }

        try {
            // En mode navigateur, utiliser une API email ou service externe
            if (typeof window !== 'undefined') {
                this.smtpTransport = this.createBrowserTransport();
            } else {
                // En mode serveur, utiliser nodemailer
                const nodemailer = require('nodemailer');
                this.smtpTransport = nodemailer.createTransport(this.config.smtp);
            }

            console.log('Transport email initialisé');
        } catch (error) {
            console.error('Erreur initialisation transport email:', error);
            this.smtpTransport = null;
        }
    }

    createBrowserTransport() {
        // Transport simulé pour navigateur
        return {
            sendMail: async (mailOptions) => {
                console.log('Email simulé (navigateur):', mailOptions);
                return {
                    accepted: [mailOptions.to],
                    rejected: [],
                    response: '250 OK (simulated)'
                };
            }
        };
    }

    initializeDefaultTemplates() {
        return {
            loanReminder: {
                subject: 'Rappel de prêt - DocuCortex',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">🔔 Rappel de prêt DocuCortex</h2>
                        <p>Bonjour {{borrowerName}},</p>
                        <p>Nous vous rappelons que le prêt suivant arrive à échéance bientôt :</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">📄 Document</h3>
                            <p><strong>Titre :</strong> {{documentTitle}}</p>
                            <p><strong>Date d'emprunt :</strong> {{loanDate}}</p>
                            <p><strong>Date de retour prévue :</strong> {{returnDate}}</p>
                            <p><strong>Jours restants :</strong> <span style="color: {{statusColor}};">{{daysRemaining}} jours</span></p>
                        </div>

                        <p>Merci de bien vouloir retourner le document dans les délais.</p>
                        
                        <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                            <p style="margin: 0; font-size: 14px;">
                                📧 En cas de problème ou de retard prévu, contactez-nous à {{replyTo}}
                            </p>
                        </div>

                        <hr style="margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Cet email a été envoyé automatiquement par le système DocuCortex.<br>
                            Date : {{currentDate}}
                        </p>
                    </div>
                `,
                text: `
                    RAPPEL DE PRÊT - DocuCortex

                    Bonjour {{borrowerName}},

                    Nous vous rappelons que le prêt suivant arrive à échéance bientôt :

                    Document: {{documentTitle}}
                    Date d'emprunt: {{loanDate}}
                    Date de retour prévue: {{returnDate}}
                    Jours restants: {{daysRemaining}} jours

                    Merci de bien vouloir retourner le document dans les délais.

                    En cas de problème, contactez-nous à {{replyTo}}

                    Cet email a été envoyé automatiquement par le système DocuCortex.
                    Date: {{currentDate}}
                `
            },

            overdueNotice: {
                subject: '⚠️ Prêt en retard - DocuCortex',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">⚠️ Prêt en retard - DocuCortex</h2>
                        <p>Bonjour {{borrowerName}},</p>
                        <p>Votre prêt est maintenant en retard et nécessite une attention immédiate :</p>
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                            <h3 style="margin-top: 0; color: #dc2626;">📄 Document</h3>
                            <p><strong>Titre :</strong> {{documentTitle}}</p>
                            <p><strong>Date d'emprunt :</strong> {{loanDate}}</p>
                            <p><strong>Date de retour prévue :</strong> {{returnDate}}</p>
                            <p><strong>Retard :</strong> <span style="color: #dc2626; font-weight: bold;">{{daysOverdue}} jours</span></p>
                        </div>

                        <p><strong>Actions requises :</strong></p>
                        <ul>
                            <li>Retourner le document dans les plus brefs délais</li>
                            <li>Si vous avez besoin de plus de temps, contactez-nous</li>
                            <li>En cas de perte ou de dommage, signaler immédiatement</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{returnUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Retourner maintenant
                            </a>
                        </div>

                        <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                            <p style="margin: 0; font-size: 14px;">
                                📞 Contact urgent : {{replyTo}} | 📞 {{phoneNumber}}
                            </p>
                        </div>

                        <hr style="margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Cet email d'alerte a été envoyé automatiquement par DocuCortex.<br>
                            Date : {{currentDate}}
                        </p>
                    </div>
                `,
                text: `
                    PRÊT EN RETARD - DocuCortex

                    Bonjour {{borrowerName}},

                    Votre prêt est maintenant en retard et nécessite une attention immédiate :

                    Document: {{documentTitle}}
                    Date d'emprunt: {{loanDate}}
                    Date de retour prévue: {{returnDate}}
                    Retard: {{daysOverdue}} jours

                    ACTIONS REQUISES :
                    - Retourner le document dans les plus brefs délais
                    - Si vous avez besoin de plus de temps, contactez-nous
                    - En cas de perte ou de dommage, signaler immédiatement

                    Contactez-nous immédiatement : {{replyTo}} | {{phoneNumber}}

                    Cet email d'alerte a été envoyé automatiquement par DocuCortex.
                    Date: {{currentDate}}
                `
            },

            equipmentReturn: {
                subject: '🔄 Retour d\'équipement - DocuCortex',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">🔄 Confirmation de retour d'équipement</h2>
                        <p>Bonjour {{borrowerName}},</p>
                        <p>Nous accusons réception du retour de votre équipement :</p>
                        
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">🖥️ Équipement</h3>
                            <p><strong>Nom :</strong> {{equipmentName}}</p>
                            <p><strong>Tag d'actif :</strong> {{assetTag}}</p>
                            <p><strong>Numéro de série :</strong> {{serialNumber}}</p>
                            <p><strong>Date de retour :</strong> {{returnDate}}</p>
                            <p><strong>État :</strong> {{condition}}</p>
                        </div>

                        <p>Merci pour le retour en bon état.</p>
                        
                        <div style="margin-top: 30px; padding: 15px; background-color: #e0f2fe; border-radius: 8px;">
                            <p style="margin: 0; font-size: 14px;">
                                📧 Pour toute question : {{replyTo}}
                            </p>
                        </div>

                        <hr style="margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Cet email a été envoyé automatiquement par DocuCortex.<br>
                            Date : {{currentDate}}
                        </p>
                    </div>
                `,
                text: `
                    CONFIRMATION DE RETOUR D'ÉQUIPEMENT - DocuCortex

                    Bonjour {{borrowerName}},

                    Nous accusons réception du retour de votre équipement :

                    Équipement: {{equipmentName}}
                    Tag d'actif: {{assetTag}}
                    Numéro de série: {{serialNumber}}
                    Date de retour: {{returnDate}}
                    État: {{condition}}

                    Merci pour le retour en bon état.

                    Pour toute question : {{replyTo}}

                    Cet email a été envoyé automatiquement par DocuCortex.
                    Date: {{currentDate}}
                `
            },

            userWelcome: {
                subject: '👋 Bienvenue dans DocuCortex',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">👋 Bienvenue dans DocuCortex</h2>
                        <p>Bonjour {{userName}},</p>
                        <p>Bienvenue dans le système de gestion DocuCortex ! Votre compte a été créé avec succès.</p>
                        
                        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">👤 Vos informations</h3>
                            <p><strong>Nom :</strong> {{fullName}}</p>
                            <p><strong>Email :</strong> {{email}}</p>
                            <p><strong>Département :</strong> {{department}}</p>
                            <p><strong>Position :</strong> {{position}}</p>
                        </div>

                        <p><strong>Fonctionnalités disponibles :</strong></p>
                        <ul>
                            <li>📚 Gestion des documents et prêts</li>
                            <li>🖥️ Inventaire et réservation d'équipements</li>
                            <li>📊 Suivi et statistiques</li>
                            <li>🔔 Notifications et alertes</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{dashboardUrl}}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Accéder à DocuCortex
                            </a>
                        </div>

                        <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                            <p style="margin: 0; font-size: 14px;">
                                ❓ Besoin d'aide ? Consultez notre <a href="{{helpUrl}}">guide d'utilisation</a> ou contactez {{replyTo}}
                            </p>
                        </div>

                        <hr style="margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Cet email de bienvenue a été envoyé automatiquement par DocuCortex.<br>
                            Date : {{currentDate}}
                        </p>
                    </div>
                `,
                text: `
                    BIENVENUE DANS DOCUCORTEX

                    Bonjour {{userName}},

                    Bienvenue dans le système de gestion DocuCortex ! Votre compte a été créé avec succès.

                    Vos informations :
                    Nom: {{fullName}}
                    Email: {{email}}
                    Département: {{department}}
                    Position: {{position}}

                    Fonctionnalités disponibles :
                    - Gestion des documents et prêts
                    - Inventaire et réservation d'équipements
                    - Suivi et statistiques
                    - Notifications et alertes

                    Accédez à DocuCortex : {{dashboardUrl}}

                    Besoin d'aide ? Consultez notre guide d'utilisation : {{helpUrl}}
                    ou contactez {{replyTo}}

                    Cet email de bienvenue a été envoyé automatiquement par DocuCortex.
                    Date: {{currentDate}}
                `
            },

            warrantyAlert: {
                subject: '⚠️ Alerte garantie - DocuCortex',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #ea580c;">⚠️ Alerte garantie - DocuCortex</h2>
                        <p>Bonjour,</p>
                        <p>La garantie de l'équipement suivant arrive bientôt à expiration :</p>
                        
                        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                            <h3 style="margin-top: 0;">🖥️ Équipement</h3>
                            <p><strong>Nom :</strong> {{equipmentName}}</p>
                            <p><strong>Tag d'actif :</strong> {{assetTag}}</p>
                            <p><strong>Numéro de série :</strong> {{serialNumber}}</p>
                            <p><strong>Fournisseur :</strong> {{provider}}</p>
                            <p><strong>Date d'expiration :</strong> <span style="color: #ea580c; font-weight: bold;">{{expirationDate}}</span></p>
                            <p><strong>Jours restants :</strong> <span style="color: #ea580c;">{{daysRemaining}} jours</span></p>
                        </div>

                        <p><strong>Actions recommandées :</strong></p>
                        <ul>
                            <li>Renouveler la garantie si nécessaire</li>
                            <li>Planifier une maintenance préventive</li>
                            <li>Évaluer le remplacement potentiel</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{equipmentUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Voir l'équipement
                            </a>
                        </div>

                        <hr style="margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Cette alerte automatique a été générée par DocuCortex.<br>
                            Date : {{currentDate}}
                        </p>
                    </div>
                `,
                text: `
                    ALERTE GARANTIE - DocuCortex

                    Bonjour,

                    La garantie de l'équipement suivant arrive bientôt à expiration :

                    Équipement: {{equipmentName}}
                    Tag d'actif: {{assetTag}}
                    Numéro de série: {{serialNumber}}
                    Fournisseur: {{provider}}
                    Date d'expiration: {{expirationDate}}
                    Jours restants: {{daysRemaining}} jours

                    ACTIONS RECOMMANDÉES :
                    - Renouveler la garantie si nécessaire
                    - Planifier une maintenance préventive
                    - Évaluer le remplacement potentiel

                    Voir l'équipement : {{equipmentUrl}}

                    Cette alerte automatique a été générée par DocuCortex.
                    Date: {{currentDate}}
                `
            }
        };
    }

    // 🔗 Connexion
    async connect() {
        if (this.isConnected || !this.smtpTransport) return;

        try {
            if (this.smtpTransport.verify) {
                await new Promise((resolve, reject) => {
                    this.smtpTransport.verify((error, success) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(success);
                        }
                    });
                });
            }

            this.isConnected = true;
            console.log('Connecté au serveur SMTP');
        } catch (error) {
            console.error('Erreur connexion SMTP:', error);
            throw error;
        }
    }

    disconnect() {
        this.isConnected = false;
        this.smtpTransport = null;
        console.log('Déconnecté du serveur SMTP');
    }

    // 📧 Envoi d'emails
    async sendEmail(emailData) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            // Vérifier la limitation de débit
            this.checkRateLimit();

            // Préparer les options email
            const mailOptions = this.prepareMailOptions(emailData);

            // Envoyer l'email
            const result = await this.sendMail(mailOptions);
            
            // Mettre en cache
            this.emailCache.set(result.messageId, {
                ...emailData,
                messageId: result.messageId,
                sentAt: new Date().toISOString(),
                status: 'sent'
            });

            // Mettre à jour le rate limiter
            this.rateLimiter.sent++;

            return {
                success: true,
                messageId: result.messageId,
                accepted: result.accepted,
                rejected: result.rejected,
                sentAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur envoi email:', error);
            
            return {
                success: false,
                error: error.message,
                sentAt: new Date().toISOString()
            };
        }
    }

    async sendTemplateEmail(templateName, recipient, data = {}) {
        const template = this.getTemplate(templateName);
        
        const emailData = {
            to: recipient,
            subject: this.interpolateTemplate(template.subject, data),
            html: this.interpolateTemplate(template.html, data),
            text: this.interpolateTemplate(template.text, data),
            ...data
        };

        return await this.sendEmail(emailData);
    }

    async sendBulkEmails(emailList) {
        const results = [];
        const batchSize = this.config.batchSize;

        for (let i = 0; i < emailList.length; i += batchSize) {
            const batch = emailList.slice(i, i + batchSize);
            const batchPromises = batch.map(email => this.sendEmail(email));

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);

                // Pause entre les lots pour respecter les limites de débit
                if (i + batchSize < emailList.length) {
                    await this.delay(60000 / this.config.rateLimit); // 1 minute / rate limit
                }
            } catch (error) {
                console.error(`Erreur lot ${i / batchSize + 1}:`, error);
            }
        }

        return {
            total: emailList.length,
            successful: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            results
        };
    }

    // 📋 Templates spécifiques
    async sendLoanReminder(loanData, recipient) {
        const templateData = {
            ...loanData,
            borrowerName: loanData.borrower?.fullName || loanData.borrowerName,
            documentTitle: loanData.document?.title || loanData.documentTitle,
            daysRemaining: Math.ceil((new Date(loanData.returnDate) - new Date()) / (1000 * 60 * 60 * 24)),
            statusColor: this.getStatusColor(loanData.returnDate),
            currentDate: new Date().toLocaleDateString('fr-FR'),
            replyTo: this.config.replyTo
        };

        return await this.sendTemplateEmail('loanReminder', recipient, templateData);
    }

    async sendOverdueNotice(loanData, recipient) {
        const templateData = {
            ...loanData,
            borrowerName: loanData.borrower?.fullName || loanData.borrowerName,
            documentTitle: loanData.document?.title || loanData.documentTitle,
            daysOverdue: Math.ceil((new Date() - new Date(loanData.returnDate)) / (1000 * 60 * 60 * 24)),
            currentDate: new Date().toLocaleDateString('fr-FR'),
            replyTo: this.config.replyTo,
            phoneNumber: '+33 1 23 45 67 89',
            returnUrl: `${window.location.origin}/loans/${loanData.id}/return`
        };

        return await this.sendTemplateEmail('overdueNotice', recipient, templateData);
    }

    async sendEquipmentReturnConfirmation(equipmentData, borrower, returnData) {
        const templateData = {
            ...equipmentData,
            borrowerName: borrower.fullName,
            returnDate: returnData.returnDate || new Date().toISOString(),
            condition: returnData.condition || 'Bon état',
            currentDate: new Date().toLocaleDateString('fr-FR'),
            replyTo: this.config.replyTo
        };

        return await this.sendTemplateEmail('equipmentReturn', borrower.email, templateData);
    }

    async sendUserWelcome(userData) {
        const templateData = {
            ...userData,
            userName: userData.firstName || userData.fullName.split(' ')[0],
            currentDate: new Date().toLocaleDateString('fr-FR'),
            dashboardUrl: `${window.location.origin}/dashboard`,
            helpUrl: `${window.location.origin}/help`,
            replyTo: this.config.replyTo
        };

        return await this.sendTemplateEmail('userWelcome', userData.email, templateData);
    }

    async sendWarrantyAlert(equipmentData, recipients = []) {
        const templateData = {
            ...equipmentData,
            daysRemaining: Math.ceil((new Date(equipmentData.warrantyEndDate) - new Date()) / (1000 * 60 * 60 * 24)),
            expirationDate: new Date(equipmentData.warrantyEndDate).toLocaleDateString('fr-FR'),
            currentDate: new Date().toLocaleDateString('fr-FR'),
            equipmentUrl: `${window.location.origin}/equipment/${equipmentData.id}`,
            replyTo: this.config.replyTo
        };

        const results = [];
        for (const recipient of recipients) {
            const result = await this.sendTemplateEmail('warrantyAlert', recipient, templateData);
            results.push(result);
        }

        return results;
    }

    // 🛠️ Utilitaires
    prepareMailOptions(emailData) {
        return {
            from: {
                name: this.config.fromName,
                address: this.config.fromEmail
            },
            to: emailData.to,
            cc: emailData.cc,
            bcc: emailData.bcc,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            attachments: emailData.attachments || [],
            replyTo: this.config.replyTo,
            headers: {
                'X-Mailer': 'DocuCortex System',
                'X-Priority': emailData.priority || '3'
            }
        };
    }

    getTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }

        const template = this.defaultTemplates[templateName] || {
            subject: 'Notification DocuCortex',
            html: '<p>{{content}}</p>',
            text: '{{content}}'
        };

        this.templateCache.set(templateName, template);
        return template;
    }

    interpolateTemplate(template, data) {
        let result = template;
        
        // Remplacer toutes les variables {{variable}}
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, data[key] || '');
        });

        return result;
    }

    getStatusColor(returnDate) {
        const daysRemaining = Math.ceil((new Date(returnDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) return '#dc2626'; // Rouge - retard
        if (daysRemaining <= 1) return '#ea580c'; // Orange - aujourd'hui
        if (daysRemaining <= 3) return '#d97706'; // Jaune - bientôt
        return '#059669'; // Vert - OK
    }

    checkRateLimit() {
        const now = Date.now();
        
        // Réinitialiser le compteur si la fenêtre de temps a expiré (1 minute)
        if (now - this.rateLimiter.windowStart > 60000) {
            this.rateLimiter.sent = 0;
            this.rateLimiter.windowStart = now;
        }

        if (this.rateLimiter.sent >= this.rateLimiter.maxEmails) {
            const waitTime = 60000 - (now - this.rateLimiter.windowStart);
            throw new Error(`Limite de débit atteinte. Attendez ${Math.ceil(waitTime / 1000)} secondes.`);
        }
    }

    async sendMail(mailOptions) {
        if (!this.smtpTransport) {
            throw new Error('Transport email non disponible');
        }

        return new Promise((resolve, reject) => {
            this.smtpTransport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 📊 Statistiques et monitoring
    async getEmailStatistics() {
        const emails = Array.from(this.emailCache.values());
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);
        const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const stats = {
            total: emails.length,
            sent24h: emails.filter(e => new Date(e.sentAt) > last24h).length,
            sent7d: emails.filter(e => new Date(e.sentAt) > last7d).length,
            successRate: emails.length > 0 ? (emails.filter(e => e.status === 'sent').length / emails.length) * 100 : 0,
            byStatus: {},
            byTemplate: {},
            rateLimitInfo: {
                sent: this.rateLimiter.sent,
                limit: this.rateLimiter.maxEmails,
                windowStart: new Date(this.rateLimiter.windowStart)
            }
        };

        // Statistiques par statut
        emails.forEach(email => {
            const status = email.status || 'unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        });

        // Statistiques par template
        emails.forEach(email => {
            const template = email.template || 'unknown';
            stats.byTemplate[template] = (stats.byTemplate[template] || 0) + 1;
        });

        return stats;
    }

    // 🧪 Tests et validation
    async testConnection() {
        if (!this.smtpTransport) {
            return {
                connected: false,
                reason: 'Transport non configuré',
                timestamp: new Date().toISOString()
            };
        }

        try {
            await this.connect();
            
            return {
                connected: true,
                transport: 'smtp',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async sendTestEmail(recipient) {
        const testData = {
            to: recipient,
            subject: 'Test DocuCortex - Email Connector',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">✅ Test de connectivité DocuCortex</h2>
                    <p>Ce email de test a été envoyé avec succès depuis DocuCortex.</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Status:</strong> Connecté</p>
                </div>
            `,
            text: 'Test de connectivité DocuCortex - Email envoyé avec succès',
            template: 'test'
        };

        return await this.sendEmail(testData);
    }

    // 📈 Métriques et monitoring
    getMetrics() {
        return {
            connectionStatus: this.isConnected ? 'connected' : 'disconnected',
            emailCount: this.emailCache.size,
            templateCount: this.templateCache.size,
            rateLimit: {
                sent: this.rateLimiter.sent,
                max: this.rateLimiter.maxEmails,
                windowStart: this.rateLimiter.windowStart
            },
            config: {
                smtpHost: this.config.smtp.host,
                fromEmail: this.config.fromEmail,
                batchSize: this.config.batchSize,
                rateLimit: this.config.rateLimit
            },
            timestamp: new Date().toISOString()
        };
    }
}

export default EmailConnector;