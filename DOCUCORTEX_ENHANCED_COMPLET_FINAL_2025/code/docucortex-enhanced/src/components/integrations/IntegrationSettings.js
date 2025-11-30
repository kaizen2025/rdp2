// src/components/integrations/IntegrationSettings.js - CONFIGURATION DES INTÉGRATIONS
// Interface pour configurer les paramètres avancés des intégrations

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import integrationService from '../../services/integrationService.js';

const IntegrationSettings = () => {
    const [settings, setSettings] = useState({
        global: {
            autoSync: true,
            syncInterval: 300000,
            maxRetries: 3,
            retryDelay: 5000,
            timeout: 30000,
            batchSize: 100,
            enableNotifications: true,
            notificationEmail: 'admin@company.com',
            logLevel: 'info'
        },
        activeDirectory: {
            enabled: true,
            autoSync: true,
            syncInterval: 300000,
            fieldMappings: {
                userPrincipalName: 'email',
                displayName: 'fullName',
                givenName: 'firstName',
                sn: 'lastName',
                mail: 'email',
                department: 'department',
                title: 'position'
            },
            syncOptions: {
                includeDisabledUsers: false,
                syncGroups: true,
                syncOrganizationalUnits: true,
                mapManagerRelationships: true
            }
        },
        cmdb: {
            enabled: true,
            autoSync: true,
            syncInterval: 600000,
            endpoints: {
                equipment: '/api/equipment',
                assets: '/api/assets',
                warranties: '/api/warranties'
            },
            syncOptions: {
                includeInactiveEquipment: false,
                syncWarrantyInfo: true,
                syncMaintenanceSchedule: true,
                autoCreateWarrantyAlerts: true
            }
        },
        helpDesk: {
            enabled: true,
            autoTicketCreation: true,
            autoSync: false,
            syncInterval: 300000,
            ticketCategories: {
                equipment: 'Equipment',
                document: 'Document',
                user: 'User',
                technical: 'Technical'
            },
            priorityLevels: {
                low: 1,
                medium: 2,
                high: 3,
                critical: 4
            },
            syncOptions: {
                syncTicketUpdates: true,
                autoResolveEquipmentTickets: false,
                createTicketsForOverdueLoans: true,
                createTicketsForEquipmentIssues: true
            }
        },
        email: {
            enabled: true,
            smtp: {
                host: 'smtp.company.com',
                port: 587,
                secure: true,
                auth: {
                    user: '',
                    pass: ''
                }
            },
            templates: {
                loanReminder: true,
                overdueNotice: true,
                equipmentReturn: true,
                userWelcome: true,
                warrantyAlert: true
            },
            syncOptions: {
                sendBulkEmails: true,
                batchSize: 50,
                rateLimit: 10,
                retryFailedEmails: true
            }
        },
        calendar: {
            enabled: true,
            provider: 'google',
            autoSync: false,
            syncInterval: 300000,
            defaultDuration: 60,
            timezone: 'Europe/Paris',
            syncOptions: {
                createReturnReminders: true,
                syncEquipmentReservations: true,
                syncMaintenanceEvents: true,
                sendCalendarInvitations: true
            }
        }
    });

    const [activeTab, setActiveTab] = useState('global');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const tabs = [
        { id: 'global', name: 'Paramètres globaux', icon: '⚙️' },
        { id: 'activeDirectory', name: 'Active Directory', icon: '👥' },
        { id: 'cmdb', name: 'CMDB', icon: '🖥️' },
        { id: 'helpDesk', name: 'Help Desk', icon: '🎫' },
        { id: 'email', name: 'Email', icon: '📧' },
        { id: 'calendar', name: 'Calendrier', icon: '📅' }
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            
            // Simuler le chargement des paramètres depuis l'API
            // En réalité, on chargerait depuis integrationService.getSettings()
            
        } catch (err) {
            console.error('Erreur chargement paramètres:', err);
            setError('Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (section, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleNestedSettingChange = (section, parent, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [parent]: {
                    ...prev[section][parent],
                    [key]: value
                }
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            
            // Simuler la sauvegarde
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSuccess('Paramètres sauvegardés avec succès');
            setHasUnsavedChanges(false);
            
            // Effacer le message de succès après 3 secondes
            setTimeout(() => setSuccess(null), 3000);
            
        } catch (err) {
            console.error('Erreur sauvegarde paramètres:', err);
            setError('Erreur lors de la sauvegarde des paramètres');
        } finally {
            setSaving(false);
        }
    };

    const handleResetSettings = () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.')) {
            loadSettings();
            setHasUnsavedChanges(false);
            setSuccess('Paramètres réinitialisés');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const renderGlobalSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalle de synchronisation (secondes)
                    </label>
                    <input
                        type="number"
                        value={settings.global.syncInterval / 1000}
                        onChange={(e) => handleSettingChange('global', 'syncInterval', Number(e.target.value) * 1000)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">Intervalle par défaut pour les synchronisations automatiques</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout (millisecondes)
                    </label>
                    <input
                        type="number"
                        value={settings.global.timeout}
                        onChange={(e) => handleSettingChange('global', 'timeout', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="5000"
                        step="5000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Délai d'expiration des requêtes</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre maximum de tentatives
                    </label>
                    <input
                        type="number"
                        value={settings.global.maxRetries}
                        onChange={(e) => handleSettingChange('global', 'maxRetries', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nombre de tentatives en cas d'échec</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taille des lots
                    </label>
                    <input
                        type="number"
                        value={settings.global.batchSize}
                        onChange={(e) => handleSettingChange('global', 'batchSize', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="10"
                        max="1000"
                        step="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nombre d'enregistrements traités par lot</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.global.autoSync}
                        onChange={(e) => handleSettingChange('global', 'autoSync', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                        Synchronisation automatique activée
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.global.enableNotifications}
                        onChange={(e) => handleSettingChange('global', 'enableNotifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                        Notifications activées
                    </label>
                </div>
            </div>

            {settings.global.enableNotifications && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email pour les notifications
                    </label>
                    <input
                        type="email"
                        value={settings.global.notificationEmail}
                        onChange={(e) => handleSettingChange('global', 'notificationEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="admin@company.com"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de logs
                </label>
                <select
                    value={settings.global.logLevel}
                    onChange={(e) => handleSettingChange('global', 'logLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="error">Erreurs uniquement</option>
                    <option value="warn">Avertissements</option>
                    <option value="info">Informations</option>
                    <option value="debug">Debug (détaillé)</option>
                </select>
            </div>
        </div>
    );

    const renderActiveDirectorySettings = () => (
        <div className="space-y-6">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={settings.activeDirectory.enabled}
                    onChange={(e) => handleSettingChange('activeDirectory', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                    Intégration Active Directory activée
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalle de synchronisation (secondes)
                    </label>
                    <input
                        type="number"
                        value={settings.activeDirectory.syncInterval / 1000}
                        onChange={(e) => handleSettingChange('activeDirectory', 'syncInterval', Number(e.target.value) * 1000)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="60"
                        disabled={!settings.activeDirectory.enabled}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.activeDirectory.autoSync}
                        onChange={(e) => handleSettingChange('activeDirectory', 'autoSync', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={!settings.activeDirectory.enabled}
                    />
                    <label className="ml-2 text-sm text-gray-700">
                        Synchronisation automatique
                    </label>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Mapping des champs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.activeDirectory.fieldMappings).map(([adField, docField]) => (
                        <div key={adField} className="flex items-center space-x-3">
                            <div className="flex-1">
                                <label className="text-xs text-gray-600">Champ AD</label>
                                <input
                                    type="text"
                                    value={adField}
                                    readOnly
                                    className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded"
                                />
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex-1">
                                <label className="text-xs text-gray-600">Champ DocuCortex</label>
                                <input
                                    type="text"
                                    value={docField}
                                    onChange={(e) => handleNestedSettingChange('activeDirectory', 'fieldMappings', adField, e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    disabled={!settings.activeDirectory.enabled}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Options de synchronisation</h4>
                <div className="space-y-3">
                    {Object.entries(settings.activeDirectory.syncOptions).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleNestedSettingChange('activeDirectory', 'syncOptions', key, e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={!settings.activeDirectory.enabled}
                            />
                            <label className="ml-2 text-sm text-gray-700">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCMDSettings = () => (
        <div className="space-y-6">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={settings.cmdb.enabled}
                    onChange={(e) => handleSettingChange('cmdb', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                    Intégration CMDB activée
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalle de synchronisation (secondes)
                    </label>
                    <input
                        type="number"
                        value={settings.cmdb.syncInterval / 1000}
                        onChange={(e) => handleSettingChange('cmdb', 'syncInterval', Number(e.target.value) * 1000)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="60"
                        disabled={!settings.cmdb.enabled}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.cmdb.autoSync}
                        onChange={(e) => handleSettingChange('cmdb', 'autoSync', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={!settings.cmdb.enabled}
                    />
                    <label className="ml-2 text-sm text-gray-700">
                        Synchronisation automatique
                    </label>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Endpoints API</h4>
                <div className="space-y-3">
                    {Object.entries(settings.cmdb.endpoints).map(([key, endpoint]) => (
                        <div key={key}>
                            <label className="block text-sm text-gray-600 mb-1">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </label>
                            <input
                                type="text"
                                value={endpoint}
                                onChange={(e) => handleNestedSettingChange('cmdb', 'endpoints', key, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                disabled={!settings.cmdb.enabled}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Options de synchronisation</h4>
                <div className="space-y-3">
                    {Object.entries(settings.cmdb.syncOptions).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleNestedSettingChange('cmdb', 'syncOptions', key, e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={!settings.cmdb.enabled}
                            />
                            <label className="ml-2 text-sm text-gray-700">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderEmailSettings = () => (
        <div className="space-y-6">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={settings.email.enabled}
                    onChange={(e) => handleSettingChange('email', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                    Intégration Email activée
                </label>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration SMTP</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Serveur SMTP
                        </label>
                        <input
                            type="text"
                            value={settings.email.smtp.host}
                            onChange={(e) => handleNestedSettingChange('email', 'smtp', 'host', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="smtp.company.com"
                            disabled={!settings.email.enabled}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Port
                        </label>
                        <input
                            type="number"
                            value={settings.email.smtp.port}
                            onChange={(e) => handleNestedSettingChange('email', 'smtp', 'port', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={!settings.email.enabled}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Utilisateur SMTP
                        </label>
                        <input
                            type="text"
                            value={settings.email.smtp.auth.user}
                            onChange={(e) => handleNestedSettingChange('email', 'smtp', 'auth', 'user', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={!settings.email.enabled}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe SMTP
                        </label>
                        <input
                            type="password"
                            value={settings.email.smtp.auth.pass}
                            onChange={(e) => handleNestedSettingChange('email', 'smtp', 'auth', 'pass', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={!settings.email.enabled}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={settings.email.smtp.secure}
                            onChange={(e) => handleNestedSettingChange('email', 'smtp', 'secure', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={!settings.email.enabled}
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            Connexion sécurisée (TLS)
                        </label>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Templates d'email activés</h4>
                <div className="space-y-3">
                    {Object.entries(settings.email.templates).map(([key, enabled]) => (
                        <div key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => handleNestedSettingChange('email', 'templates', key, e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={!settings.email.enabled}
                            />
                            <label className="ml-2 text-sm text-gray-700">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Options de'envoi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taille des lots
                        </label>
                        <input
                            type="number"
                            value={settings.email.syncOptions.batchSize}
                            onChange={(e) => handleNestedSettingChange('email', 'syncOptions', 'batchSize', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="200"
                            disabled={!settings.email.enabled}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Limite d'envoi (par minute)
                        </label>
                        <input
                            type="number"
                            value={settings.email.syncOptions.rateLimit}
                            onChange={(e) => handleNestedSettingChange('email', 'syncOptions', 'rateLimit', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="1000"
                            disabled={!settings.email.enabled}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={settings.email.syncOptions.sendBulkEmails}
                            onChange={(e) => handleNestedSettingChange('email', 'syncOptions', 'sendBulkEmails', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={!settings.email.enabled}
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            Autoriser l'envoi en masse
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'global':
                return renderGlobalSettings();
            case 'activeDirectory':
                return renderActiveDirectorySettings();
            case 'cmdb':
                return renderCMDSettings();
            case 'email':
                return renderEmailSettings();
            default:
                return (
                    <div className="text-center py-12">
                        <span className="text-4xl mb-4 block">🚧</span>
                        <p className="text-gray-500">Configuration non encore disponible</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                ⚙️ Configuration des intégrations
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Paramètres avancés et configuration des systèmes externes
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {hasUnsavedChanges && (
                                <span className="text-yellow-600 text-sm">⚠️ Modifications non sauvegardées</span>
                            )}
                            
                            <button
                                onClick={handleResetSettings}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                                🔄 Réinitialiser
                            </button>
                            
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving || !hasUnsavedChanges}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? '⏳' : '💾'} Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex">
                            <span className="text-red-400 mr-2">⚠️</span>
                            <span className="text-red-700">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex">
                            <span className="text-green-400 mr-2">✅</span>
                            <span className="text-green-700">{success}</span>
                            <button
                                onClick={() => setSuccess(null)}
                                className="ml-auto text-green-400 hover:text-green-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Onglets */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Contenu des onglets */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-500">Chargement des paramètres...</p>
                            </div>
                        ) : (
                            renderTabContent()
                        )}
                    </div>
                </div>

                {/* Informations de version */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Dernière modification: {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    <p>Version des intégrations: 1.0.0</p>
                </div>
            </div>
        </div>
    );
};

export default IntegrationSettings;