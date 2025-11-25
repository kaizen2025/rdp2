// src/components/integrations/ConnectionManager.js - GESTIONNAIRE DE CONNEXIONS
// Interface pour configurer et gérer les connexions aux systèmes externes

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import integrationService from '../../services/integrationService.js';

const ConnectionManager = () => {
    const [connections, setConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [editingConnection, setEditingConnection] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [testingConnection, setTestingConnection] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Configuration par défaut des connecteurs
    const defaultConfigurations = {
        activeDirectory: {
            name: 'Active Directory',
            description: 'Synchronisation des utilisateurs et groupes depuis l\'Active Directory',
            type: 'ldap',
            fields: [
                { name: 'ldapUrl', label: 'URL LDAP', type: 'url', required: true, placeholder: 'ldap://ldap.company.com:389' },
                { name: 'domain', label: 'Domaine AD', type: 'text', required: true, placeholder: 'company.com' },
                { name: 'bindDN', label: 'DN de liaison', type: 'text', required: true, placeholder: 'CN=svc-docucortex,OU=Service Accounts,DC=company,DC=com' },
                { name: 'bindCredentials', label: 'Mot de passe', type: 'password', required: true },
                { name: 'ouBase', label: 'OU de base', type: 'text', required: true, default: 'DC=company,DC=com' }
            ]
        },
        cmdb: {
            name: 'CMDB',
            description: 'Intégration avec le système de gestion de configuration',
            type: 'rest',
            fields: [
                { name: 'apiUrl', label: 'URL API CMDB', type: 'url', required: true, placeholder: 'https://cmdb.company.com/api' },
                { name: 'apiKey', label: 'Clé API', type: 'text', required: true },
                { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false, default: 30000 }
            ]
        },
        helpDesk: {
            name: 'Help Desk',
            description: 'Intégration avec le système de tickets et incidents',
            type: 'rest',
            fields: [
                { name: 'apiUrl', label: 'URL API Help Desk', type: 'url', required: true, placeholder: 'https://helpdesk.company.com/api' },
                { name: 'apiKey', label: 'Clé API', type: 'text', required: true },
                { name: 'username', label: 'Nom d\'utilisateur', type: 'text', required: false },
                { name: 'password', label: 'Mot de passe', type: 'password', required: false }
            ]
        },
        email: {
            name: 'Serveur Email (SMTP)',
            description: 'Configuration du serveur SMTP pour les notifications',
            type: 'smtp',
            fields: [
                { name: 'smtp.host', label: 'Serveur SMTP', type: 'text', required: true, placeholder: 'smtp.company.com' },
                { name: 'smtp.port', label: 'Port SMTP', type: 'number', required: true, default: 587 },
                { name: 'smtp.secure', label: 'Connexion sécurisée (TLS)', type: 'checkbox', required: false },
                { name: 'smtp.auth.user', label: 'Utilisateur SMTP', type: 'text', required: true },
                { name: 'smtp.auth.pass', label: 'Mot de passe SMTP', type: 'password', required: true },
                { name: 'fromEmail', label: 'Email expéditeur', type: 'email', required: true, placeholder: 'noreply@company.com' }
            ]
        },
        calendar: {
            name: 'Calendrier',
            description: 'Intégration avec Google Calendar ou Outlook',
            type: 'oauth',
            fields: [
                { name: 'provider', label: 'Provider', type: 'select', required: true, options: [
                    { value: 'google', label: 'Google Calendar' },
                    { value: 'outlook', label: 'Microsoft Outlook' }
                ]},
                { name: 'clientId', label: 'Client ID', type: 'text', required: true },
                { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
                { name: 'calendarId', label: 'ID Calendrier', type: 'text', required: false, default: 'primary' }
            ]
        }
    };

    const [connectionForm, setConnectionForm] = useState({
        name: '',
        type: 'activeDirectory',
        enabled: true,
        config: {},
        autoSync: false,
        syncInterval: 300000
    });

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            setLoading(true);
            // Simuler le chargement des connexions
            const mockConnections = [
                {
                    id: 'ad-1',
                    name: 'AD Production',
                    type: 'activeDirectory',
                    enabled: true,
                    connected: true,
                    lastSync: new Date().toISOString(),
                    config: {
                        ldapUrl: 'ldap://ldap.company.com:389',
                        domain: 'company.com',
                        ouBase: 'DC=company,DC=com'
                    }
                },
                {
                    id: 'cmdb-1',
                    name: 'CMDB Principal',
                    type: 'cmdb',
                    enabled: true,
                    connected: false,
                    lastSync: null,
                    config: {
                        apiUrl: 'https://cmdb.company.com/api',
                        timeout: 30000
                    }
                },
                {
                    id: 'email-1',
                    name: 'SMTP Internal',
                    type: 'email',
                    enabled: true,
                    connected: true,
                    lastSync: new Date().toISOString(),
                    config: {
                        smtp: {
                            host: 'smtp.company.com',
                            port: 587,
                            secure: true
                        },
                        fromEmail: 'noreply@company.com'
                    }
                }
            ];

            setConnections(mockConnections);
        } catch (err) {
            console.error('Erreur chargement connexions:', err);
            setError('Erreur lors du chargement des connexions');
        } finally {
            setLoading(false);
        }
    };

    const handleAddConnection = () => {
        setConnectionForm({
            name: '',
            type: 'activeDirectory',
            enabled: true,
            config: {},
            autoSync: false,
            syncInterval: 300000
        });
        setShowAddForm(true);
    };

    const handleEditConnection = (connection) => {
        setConnectionForm({ ...connection });
        setEditingConnection(connection.id);
        setShowAddForm(true);
    };

    const handleFormChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setConnectionForm(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    [parent]: {
                        ...prev.config[parent],
                        [child]: value
                    }
                }
            }));
        } else {
            setConnectionForm(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleTestConnection = async (connectionId) => {
        setTestingConnection(connectionId);
        try {
            const connection = connections.find(c => c.id === connectionId);
            const result = await integrationService.testConnection(connection.type);
            
            if (result.connected) {
                setSuccess(`✅ Connexion ${connection.name} réussie`);
                // Mettre à jour le statut de connexion
                setConnections(prev => prev.map(c => 
                    c.id === connectionId 
                        ? { ...c, connected: true, lastSync: new Date().toISOString() }
                        : c
                ));
            } else {
                setError(`❌ Échec de connexion pour ${connection.name}: ${result.error}`);
                setConnections(prev => prev.map(c => 
                    c.id === connectionId 
                        ? { ...c, connected: false }
                        : c
                ));
            }
        } catch (err) {
            console.error('Erreur test connexion:', err);
            setError('Erreur lors du test de connexion');
        } finally {
            setTestingConnection(null);
        }
    };

    const handleDeleteConnection = async (connectionId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette connexion ?')) {
            return;
        }

        try {
            setConnections(prev => prev.filter(c => c.id !== connectionId));
            setSuccess('Connexion supprimée avec succès');
        } catch (err) {
            console.error('Erreur suppression connexion:', err);
            setError('Erreur lors de la suppression');
        }
    };

    const handleSaveConnection = async () => {
        try {
            setLoading(true);

            if (!connectionForm.name || !connectionForm.type) {
                setError('Veuillez remplir tous les champs requis');
                return;
            }

            if (editingConnection) {
                // Mise à jour
                setConnections(prev => prev.map(c => 
                    c.id === editingConnection 
                        ? { 
                            ...connectionForm, 
                            id: editingConnection,
                            lastSync: c.lastSync,
                            connected: c.connected
                          }
                        : c
                ));
                setSuccess('Connexion mise à jour avec succès');
            } else {
                // Création
                const newConnection = {
                    ...connectionForm,
                    id: `${connectionForm.type}-${Date.now()}`,
                    createdAt: new Date().toISOString()
                };
                setConnections(prev => [...prev, newConnection]);
                setSuccess('Connexion créée avec succès');
            }

            setShowAddForm(false);
            setEditingConnection(null);
        } catch (err) {
            console.error('Erreur sauvegarde connexion:', err);
            setError('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const getConnectionIcon = (type) => {
        const icons = {
            activeDirectory: '👥',
            cmdb: '🖥️',
            helpDesk: '🎫',
            email: '📧',
            calendar: '📅'
        };
        return icons[type] || '🔗';
    };

    const getStatusColor = (connected) => {
        return connected ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    };

    const renderFormField = (field) => {
        const value = field.name.includes('.') 
            ? connectionForm.config[field.name.split('.')[0]]?.[field.name.split('.')[1]] || ''
            : connectionForm[field.name] || field.default || '';

        switch (field.type) {
            case 'text':
            case 'url':
            case 'email':
            case 'password':
                return (
                    <input
                        type={field.type}
                        value={value}
                        onChange={(e) => handleFormChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                );
            
            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleFormChange(field.name, Number(e.target.value))}
                        required={field.required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                );
            
            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleFormChange(field.name, e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                );
            
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleFormChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Sélectionner...</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* En-tête */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            🔗 Gestionnaire de connexions
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Configurez et gérez les connexions aux systèmes externes
                        </p>
                    </div>
                    
                    <button
                        onClick={handleAddConnection}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        ➕ Nouvelle connexion
                    </button>
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

                {/* Liste des connexions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Connexions configurées ({connections.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Connexion
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dernière sync
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {connections.map((connection) => (
                                    <tr key={connection.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3">
                                                    {getConnectionIcon(connection.type)}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {connection.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {connection.enabled ? 'Activé' : 'Désactivé'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {defaultConfigurations[connection.type]?.name || connection.type}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connection.connected)}`}>
                                                {connection.connected ? 'Connecté' : 'Déconnecté'}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {connection.lastSync 
                                                ? format(new Date(connection.lastSync), 'dd/MM/yyyy HH:mm', { locale: fr })
                                                : 'Jamais'
                                            }
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleTestConnection(connection.id)}
                                                    disabled={testingConnection === connection.id}
                                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                                    title="Tester la connexion"
                                                >
                                                    {testingConnection === connection.id ? '⏳' : '🧪'} Tester
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleEditConnection(connection)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Modifier"
                                                >
                                                    ✏️ Modifier
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleDeleteConnection(connection.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
                                                >
                                                    🗑️ Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {connections.length === 0 && (
                            <div className="text-center py-12">
                                <span className="text-4xl mb-4 block">🔗</span>
                                <p className="text-gray-500">
                                    Aucune connexion configurée. Cliquez sur "Nouvelle connexion" pour commencer.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulaire d'ajout/modification */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {editingConnection ? 'Modifier la connexion' : 'Nouvelle connexion'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingConnection(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Informations générales */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom de la connexion *
                                        </label>
                                        <input
                                            type="text"
                                            value={connectionForm.name}
                                            onChange={(e) => handleFormChange('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: AD Production"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Type de connexion *
                                        </label>
                                        <select
                                            value={connectionForm.type}
                                            onChange={(e) => handleFormChange('type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="activeDirectory">Active Directory</option>
                                            <option value="cmdb">CMDB</option>
                                            <option value="helpDesk">Help Desk</option>
                                            <option value="email">Email (SMTP)</option>
                                            <option value="calendar">Calendrier</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Configuration */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Configuration
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {defaultConfigurations[connectionForm.type]?.description}
                                    </p>

                                    <div className="space-y-4">
                                        {defaultConfigurations[connectionForm.type]?.fields.map((field) => (
                                            <div key={field.name}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                {renderFormField(field)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={connectionForm.enabled}
                                            onChange={(e) => handleFormChange('enabled', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Connexion activée
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={connectionForm.autoSync}
                                            onChange={(e) => handleFormChange('autoSync', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Synchronisation automatique
                                        </label>
                                    </div>
                                </div>

                                {connectionForm.autoSync && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Intervalle de synchronisation (secondes)
                                        </label>
                                        <input
                                            type="number"
                                            value={connectionForm.syncInterval / 1000}
                                            onChange={(e) => handleFormChange('syncInterval', Number(e.target.value) * 1000)}
                                            min="60"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingConnection(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveConnection}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? '⏳' : '💾'} {editingConnection ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionManager;