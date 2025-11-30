// src/integrations/ActiveDirectoryConnector.js - CONNECTEUR ACTIVE DIRECTORY
// Connecteur pour synchronisation et authentification avec Active Directory

import { format } from 'date-fns';

class ActiveDirectoryConnector {
    constructor(config = {}) {
        this.config = {
            ldapUrl: config.ldapUrl || '',
            domain: config.domain || '',
            bindDN: config.bindDN || '',
            bindCredentials: config.bindCredentials || '',
            ouBase: config.ouBase || 'DC=domain,DC=com',
            autoSync: config.autoSync || false,
            syncInterval: config.syncInterval || 300000, // 5 minutes
            fieldMappings: config.fieldMappings || {},
            enabled: config.enabled !== false,
            retryAttempts: config.retryAttempts || 3,
            timeout: config.timeout || 30000,
            ...config
        };

        this.connection = null;
        this.isConnected = false;
        this.lastSync = null;
        this.syncQueue = [];
        this.retryCount = 0;
        this.ldap = null;
        this.authenticatedUser = null;

        // Charger le module LDAP si disponible
        this.initializeLDAP();
    }

    // 🔧 Initialisation LDAP
    async initializeLDAP() {
        try {
            // En mode navigateur, utiliser ldapjs via npm ou WebLDAP
            if (typeof window !== 'undefined') {
                // Utiliser WebLDAP ou LDAP over HTTP
                this.ldap = await this.initializeWebLDAP();
            } else {
                // En mode serveur, utiliser ldapjs
                const ldap = require('ldapjs');
                this.ldap = ldap;
            }
            console.log('Connecteur Active Directory initialisé');
        } catch (error) {
            console.warn('LDAP module non disponible, utilisation du mode simulation:', error);
            this.ldap = null;
        }
    }

    async initializeWebLDAP() {
        // Simulation pour le navigateur - à remplacer par une vraie implémentation WebLDAP
        return {
            createClient: () => ({
                bind: this.mockLDAPBind,
                search: this.mockLDAPSearch,
                unbind: () => Promise.resolve()
            })
        };
    }

    // 🔐 Authentification
    async authenticate(username, password) {
        if (!this.ldap) {
            throw new Error('Module LDAP non disponible');
        }

        const client = this.ldap.createClient({
            url: this.config.ldapUrl,
            timeout: this.config.timeout
        });

        try {
            const userDN = `${username}@${this.config.domain}`;
            
            return new Promise((resolve, reject) => {
                client.bind(userDN, password, (err) => {
                    client.unbind();
                    
                    if (err) {
                        reject(new Error(`Échec d'authentification: ${err.message}`));
                    } else {
                        this.authenticatedUser = {
                            username,
                            domain: this.config.domain,
                            authenticated: true,
                            timestamp: new Date().toISOString()
                        };
                        resolve(this.authenticatedUser);
                    }
                });
            });
        } catch (error) {
            client.unbind();
            throw error;
        }
    }

    async authenticateWithTicket(ticket) {
        // Authentification via ticket Kerberos/SPNEGO
        try {
            const result = await this.validateTicket(ticket);
            this.authenticatedUser = result;
            return result;
        } catch (error) {
            throw new Error(`Échec authentification ticket: ${error.message}`);
        }
    }

    async validateTicket(ticket) {
        // Validation du ticket Kerberos - simulation
        return {
            username: 'user@domain.com',
            domain: this.config.domain,
            authenticated: true,
            groups: ['Domain Users', 'DocuCortex Users'],
            timestamp: new Date().toISOString()
        };
    }

    // 🔄 Synchronisation des utilisateurs
    async syncUsers(syncType = 'full') {
        if (!this.isConnected) {
            await this.connect();
        }

        let users = [];
        try {
            switch (syncType) {
                case 'full':
                    users = await this.syncAllUsers();
                    break;
                case 'incremental':
                    users = await this.syncIncrementalUsers();
                    break;
                case 'partial':
                    users = await this.syncPartialUsers();
                    break;
                default:
                    throw new Error(`Type de synchronisation non supporté: ${syncType}`);
            }

            this.lastSync = new Date().toISOString();
            return {
                type: syncType,
                userCount: users.length,
                users,
                timestamp: this.lastSync,
                syncId: this.generateSyncId()
            };
        } catch (error) {
            console.error('Erreur synchronisation utilisateurs AD:', error);
            throw error;
        }
    }

    async syncAllUsers() {
        const users = [];
        const searchFilters = [
            '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))', // Actifs
            '(&(objectClass=user)(objectCategory=person))' // Tous les utilisateurs
        ];

        for (const filter of searchFilters) {
            const searchResults = await this.searchUsers(filter);
            users.push(...searchResults);
        }

        return this.processUserResults(users);
    }

    async syncIncrementalUsers() {
        const lastSyncTime = this.lastSync ? new Date(this.lastSync) : new Date(Date.now() - 86400000); // 24h par défaut
        
        const filter = `(&(objectClass=user)(whenChanged>=${format(lastSyncTime, 'yyyyMMddHHmmss.0Z')}))`;
        const searchResults = await this.searchUsers(filter);
        
        return this.processUserResults(searchResults);
    }

    async syncPartialUsers() {
        // Synchronisation des groupes spécifiques
        const targetGroups = ['DocuCortex Users', 'Equipment Managers', 'Administrators'];
        const users = [];

        for (const groupName of targetGroups) {
            const groupUsers = await this.getUsersByGroup(groupName);
            users.push(...groupUsers);
        }

        return this.processUserResults(users);
    }

    // 🔍 Recherche et requête LDAP
    async searchUsers(filter) {
        if (!this.ldap) {
            return this.getMockUsers(filter);
        }

        const client = this.ldap.createClient({
            url: this.config.ldapUrl,
            timeout: this.config.timeout
        });

        return new Promise((resolve, reject) => {
            const options = {
                filter,
                scope: 'sub',
                attributes: [
                    'dn', 'userPrincipalName', 'samAccountName', 'displayName',
                    'givenName', 'sn', 'mail', 'telephoneNumber', 'mobile',
                    'department', 'title', 'manager', 'userAccountControl',
                    'whenCreated', 'whenChanged', 'accountExpires', 'lastLogon',
                    'memberOf', 'objectGUID', 'objectSid'
                ]
            };

            const results = [];
            
            client.search(this.config.ouBase, options, (err, res) => {
                if (err) {
                    client.unbind();
                    reject(err);
                    return;
                }

                res.on('searchEntry', (entry) => {
                    results.push(this.processLDAPEntry(entry));
                });

                res.on('error', (error) => {
                    client.unbind();
                    reject(error);
                });

                res.on('end', (result) => {
                    client.unbind();
                    if (result.status === 0) {
                        resolve(results);
                    } else {
                        reject(new Error(`Erreur recherche LDAP: ${result.status}`));
                    }
                });
            });
        });
    }

    processLDAPEntry(entry) {
        const user = {
            dn: entry.dn.toString(),
            objectGUID: this.extractGUID(entry.objectGUID),
            objectSid: this.extractSID(entry.objectSid)
        };

        // Traitement des attributs
        if (entry.userPrincipalName) user.userPrincipalName = entry.userPrincipalName;
        if (entry.samAccountName) user.samAccountName = entry.samAccountName;
        if (entry.displayName) user.displayName = entry.displayName;
        if (entry.givenName) user.givenName = entry.givenName;
        if (entry.sn) user.sn = entry.sn;
        if (entry.mail) user.mail = entry.mail;
        if (entry.telephoneNumber) user.telephoneNumber = entry.telephoneNumber;
        if (entry.mobile) user.mobile = entry.mobile;
        if (entry.department) user.department = entry.department;
        if (entry.title) user.title = entry.title;
        if (entry.manager) user.manager = entry.manager;
        if (entry.userAccountControl) user.userAccountControl = entry.userAccountControl;
        if (entry.whenCreated) user.whenCreated = entry.whenCreated;
        if (entry.whenChanged) user.whenChanged = entry.whenChanged;
        if (entry.accountExpires) user.accountExpires = entry.accountExpires;
        if (entry.lastLogon) user.lastLogon = entry.lastLogon;
        if (entry.memberOf) user.memberOf = Array.isArray(entry.memberOf) ? entry.memberOf : [entry.memberOf];

        // Statuts calculés
        user.isActive = this.isUserActive(user.userAccountControl);
        user.isDisabled = !user.isActive;
        user.hasPasswordExpired = this.hasPasswordExpired(user.userAccountControl);
        user.isAdmin = this.isAdminUser(user.memberOf);
        
        return user;
    }

    // 👥 Gestion des groupes
    async getUsersByGroup(groupName) {
        const filter = `(&(objectClass=user)(memberOf=CN=${groupName},${this.config.ouBase}))`;
        return await this.searchUsers(filter);
    }

    async getUserGroups(userDN) {
        if (!this.ldap) {
            return this.getMockUserGroups(userDN);
        }

        // Rechercher les groupes de l'utilisateur
        const client = this.ldap.createClient({
            url: this.config.ldapUrl,
            timeout: this.config.timeout
        });

        return new Promise((resolve, reject) => {
            const options = {
                filter: `(member=${userDN})`,
                scope: 'sub',
                attributes: ['cn', 'distinguishedName', 'description']
            };

            const groups = [];
            
            client.search(this.config.ouBase, options, (err, res) => {
                if (err) {
                    client.unbind();
                    reject(err);
                    return;
                }

                res.on('searchEntry', (entry) => {
                    groups.push({
                        name: entry.cn,
                        dn: entry.dn.toString(),
                        description: entry.description || ''
                    });
                });

                res.on('error', (error) => {
                    client.unbind();
                    reject(error);
                });

                res.on('end', (result) => {
                    client.unbind();
                    if (result.status === 0) {
                        resolve(groups);
                    } else {
                        reject(new Error(`Erreur recherche groupes: ${result.status}`));
                    }
                });
            });
        });
    }

    // 📊 Synchronisation organisationnelle
    async syncOrganizationalStructure() {
        const structure = {
            departments: await this.getDepartments(),
            locations: await this.getLocations(),
            managers: await this.getManagers()
        };

        return structure;
    }

    async getDepartments() {
        const filter = '(&(objectClass=organizationalUnit)(!(objectClass=domain)))';
        const searchResults = await this.searchUsers(filter);
        return searchResults.map(ou => ({
            name: ou.name || ou.ou,
            dn: ou.dn,
            description: ou.description || ''
        }));
    }

    async getLocations() {
        // Extraire les localisations des comptes utilisateurs
        const users = await this.syncAllUsers();
        const locations = new Map();

        users.forEach(user => {
            if (user.department) {
                if (!locations.has(user.department)) {
                    locations.set(user.department, {
                        name: user.department,
                        userCount: 0,
                        managers: []
                    });
                }
                locations.get(user.department).userCount++;
            }
        });

        return Array.from(locations.values());
    }

    async getManagers() {
        const users = await this.syncAllUsers();
        const managers = new Map();

        users.forEach(user => {
            if (user.title && user.title.toLowerCase().includes('manager')) {
                managers.set(user.dn, {
                    user,
                    subordinates: users.filter(u => u.manager === user.dn).length
                });
            }
        });

        return Array.from(managers.values());
    }

    // 🔗 Connexion et gestion
    async connect() {
        if (this.isConnected) return;

        if (!this.ldap) {
            console.warn('LDAP non disponible, utilisation du mode simulation');
            this.isConnected = true;
            return;
        }

        try {
            this.connection = this.ldap.createClient({
                url: this.config.ldapUrl,
                timeout: this.config.timeout
            });

            await this.bind();
            this.isConnected = true;
            this.retryCount = 0;
            
            console.log('Connecté à Active Directory');
        } catch (error) {
            console.error('Erreur connexion AD:', error);
            throw error;
        }
    }

    async bind() {
        if (!this.connection) {
            throw new Error('Connexion LDAP non initialisée');
        }

        return new Promise((resolve, reject) => {
            this.connection.bind(this.config.bindDN, this.config.bindCredentials, (err) => {
                if (err) {
                    reject(new Error(`Erreur bind LDAP: ${err.message}`));
                } else {
                    resolve();
                }
            });
        });
    }

    disconnect() {
        if (this.connection) {
            this.connection.unbind();
            this.connection = null;
        }
        this.isConnected = false;
        this.authenticatedUser = null;
    }

    // 🔍 Utilitaires
    extractGUID(guid) {
        if (!guid) return null;
        // Conversion GUID en string
        return guid.toString('base64');
    }

    extractSID(sid) {
        if (!sid) return null;
        // Conversion SID en string
        return sid.toString('base64');
    }

    isUserActive(userAccountControl) {
        if (!userAccountControl) return true;
        // 0x2 = ADS_UF_ACCOUNTDISABLE
        return (userAccountControl & 0x2) === 0;
    }

    hasPasswordExpired(userAccountControl) {
        if (!userAccountControl) return false;
        // Logique pour déterminer si le mot de passe a expiré
        return (userAccountControl & 0x800000) !== 0; // ADS_UF_PASSWORD_EXPIRED
    }

    isAdminUser(memberOf) {
        if (!memberOf || !Array.isArray(memberOf)) return false;
        const adminGroups = ['Domain Admins', 'Enterprise Admins', 'Schema Admins'];
        return memberOf.some(group => adminGroups.some(admin => group.includes(admin)));
    }

    // 🧪 Tests et validation
    async testConnection() {
        try {
            await this.connect();
            
            // Test de recherche simple
            const testFilter = '(&(objectClass=user)(cn=*))';
            const results = await this.searchUsers(testFilter);
            
            return {
                connected: true,
                userCount: results.length,
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

    async healthCheck() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            // Test rapide
            const startTime = Date.now();
            await this.searchUsers('(&(objectClass=user)(cn=*))');
            const responseTime = Date.now() - startTime;

            return {
                healthy: true,
                responseTime,
                lastSync: this.lastSync,
                userCount: await this.getUserCount(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async getUserCount() {
        const results = await this.searchUsers('(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))');
        return results.length;
    }

    generateSyncId() {
        return `AD_SYNC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 📊 Traitement des résultats
    processUserResults(results) {
        return results.map(user => {
            // Normaliser les données
            return {
                ...user,
                email: user.mail || user.userPrincipalName,
                fullName: user.displayName || `${user.givenName} ${user.sn}`.trim(),
                firstName: user.givenName || '',
                lastName: user.sn || '',
                phone: user.telephoneNumber || '',
                mobilePhone: user.mobile || '',
                position: user.title || '',
                department: user.department || '',
                managerId: user.manager || '',
                lastLogin: user.lastLogon ? new Date(user.lastLogon * 1000).toISOString() : null,
                passwordLastSet: user.whenChanged,
                accountExpiry: user.accountExpires ? new Date(user.accountExpires * 1000).toISOString() : null
            };
        });
    }

    // 🧪 Mock pour développement
    async getMockUsers(filter) {
        // Données simulées pour le développement
        return [
            {
                dn: 'CN=John Doe,OU=Users,DC=domain,DC=com',
                userPrincipalName: 'john.doe@domain.com',
                samAccountName: 'john.doe',
                displayName: 'John Doe',
                givenName: 'John',
                sn: 'Doe',
                mail: 'john.doe@domain.com',
                telephoneNumber: '555-0101',
                mobile: '555-0101',
                department: 'IT',
                title: 'Developer',
                userAccountControl: 512,
                memberOf: ['CN=DocuCortex Users,OU=Groups,DC=domain,DC=com']
            }
        ];
    }

    async getMockUserGroups(userDN) {
        return [
            {
                name: 'DocuCortex Users',
                dn: 'CN=DocuCortex Users,OU=Groups,DC=domain,DC=com'
            }
        ];
    }

    // Méthodes pour simulation LDAP
    mockLDAPBind(dn, password, callback) {
        // Simulation du bind LDAP
        setTimeout(() => {
            if (password === 'correctpassword') {
                callback(null);
            } else {
                callback(new Error('Invalid credentials'));
            }
        }, 100);
    }

    mockLDAPSearch(filter, callback) {
        // Simulation de recherche LDAP
        setTimeout(() => {
            const results = this.getMockUsers(filter);
            callback(null, { entries: results });
        }, 100);
    }

    // 🔄 Reconnexion automatique
    async reconnect() {
        console.log('Reconnexion à Active Directory...');
        this.disconnect();
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await this.connect();
                console.log('Reconnexion AD réussie');
                return true;
            } catch (error) {
                console.warn(`Tentative ${attempt} échouée:`, error.message);
                if (attempt === this.config.retryAttempts) {
                    throw new Error(`Impossible de se reconnecter après ${this.config.retryAttempts} tentatives`);
                }
                
                // Attendre avant la prochaine tentative
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    // 📈 Métriques et monitoring
    getMetrics() {
        return {
            connectionStatus: this.isConnected ? 'connected' : 'disconnected',
            lastSync: this.lastSync,
            totalUsers: this.userCount,
            activeUsers: this.activeUserCount,
            retryCount: this.retryCount,
            authenticated: !!this.authenticatedUser,
            timestamp: new Date().toISOString()
        };
    }
}

export default ActiveDirectoryConnector;