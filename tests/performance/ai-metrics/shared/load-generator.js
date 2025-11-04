/**
 * Générateur de charge pour les tests de performance
 * Gère la création de charges progressives, continues et en rafale
 */

class LoadGenerator {
    constructor(maxConcurrentUsers = 10) {
        this.maxConcurrentUsers = maxConcurrentUsers;
        this.activeUsers = new Set();
        this.userQueue = [];
        this.isRunning = false;
        this.loadProfile = 'constant'; // constant, progressive, burst, random
        
        // Configuration des profils de charge
        this.profiles = {
            constant: {
                name: 'Charge constante',
                description: 'Nombre fixe d\'utilisateurs simultanés',
                parameters: {
                    concurrentUsers: maxConcurrentUsers,
                    duration: 300000 // 5 minutes
                }
            },
            progressive: {
                name: 'Charge progressive',
                description: 'Augmentationgraduelle du nombre d\'utilisateurs',
                parameters: {
                    startUsers: 1,
                    increment: 2,
                    interval: 30000, // 30 secondes
                    maxUsers: maxConcurrentUsers
                }
            },
            burst: {
                name: 'Rafales de charge',
                description: 'Pics de charge suivis de pauses',
                parameters: {
                    burstUsers: maxConcurrentUsers,
                    burstDuration: 10000, // 10 secondes
                    restDuration: 30000, // 30 secondes
                    cycles: 5
                }
            },
            random: {
                name: 'Charge aléatoire',
                description: 'Variations aléatoires de la charge',
                parameters: {
                    minUsers: 1,
                    maxUsers: maxConcurrentUsers,
                    changeInterval: 5000, // 5 secondes
                    variation: 0.3 // 30% de variation
                }
            }
        };
    }

    /**
     * Démarre une charge progressive
     * @param {number} rampUpTime - Temps de montée en charge en secondes
     * @param {Function} requestFunction - Fonction à exécuter pour chaque utilisateur
     */
    async startProgressiveLoad(rampUpTime, requestFunction) {
        console.log(`🚀 Démarrage de la charge progressive (${rampUpTime}s)...`);
        
        this.isRunning = true;
        const startTime = Date.now();
        const endTime = startTime + (rampUpTime * 1000);
        let currentUserId = 0;
        
        while (this.isRunning && Date.now() < endTime) {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / (rampUpTime * 1000);
            
            // Calculer le nombre d'utilisateurs actuel
            const targetUsers = Math.floor(progress * this.maxConcurrentUsers);
            const currentUsers = this.activeUsers.size;
            
            // Ajouter ou supprimer des utilisateurs
            if (currentUsers < targetUsers) {
                // Ajouter des utilisateurs
                const usersToAdd = Math.min(targetUsers - currentUsers, 5); // Maximum 5 à la fois
                for (let i = 0; i < usersToAdd; i++) {
                    const userId = currentUserId++;
                    await this.addUser(userId, requestFunction);
                }
            } else if (currentUsers > targetUsers) {
                // Supprimer des utilisateurs
                const usersToRemove = Math.min(currentUsers - targetUsers, 3);
                for (let i = 0; i < usersToRemove; i++) {
                    await this.removeUser();
                }
            }
            
            // Pause avant la prochaine vérification
            await this.sleep(1000);
        }
        
        // Maintenir la charge finale pendant un peu
        const maintainTime = 30000; // 30 secondes
        const maintainEnd = Date.now() + maintainTime;
        
        while (this.isRunning && Date.now() < maintainEnd) {
            await this.sleep(1000);
        }
        
        await this.stop();
    }

    /**
     * Démarre une charge continue
     * @param {number} duration - Durée du test en millisecondes
     * @param {Function} requestFunction - Fonction à exécuter
     */
    async startContinuousLoad(duration, requestFunction) {
        console.log(`🔄 Démarrage de la charge continue (${duration / 1000}s)...`);
        
        this.isRunning = true;
        const startTime = Date.now();
        const endTime = startTime + duration;
        
        // Créer le pool d'utilisateurs
        const userPromises = [];
        for (let i = 0; i < this.maxConcurrentUsers; i++) {
            userPromises.push(this.continuousUser(i, requestFunction, endTime));
        }
        
        try {
            await Promise.all(userPromises);
        } catch (error) {
            console.error('Erreur dans la charge continue:', error.message);
        }
    }

    /**
     * Simule un utilisateur continu
     */
    async continuousUser(userId, requestFunction, endTime) {
        while (this.isRunning && Date.now() < endTime) {
            try {
                const requestId = Date.now();
                await requestFunction(userId, requestId);
                
                // Attendre entre les requêtes
                await this.sleep(1000 + Math.random() * 2000); // 1-3 secondes
            } catch (error) {
                console.error(`Erreur utilisateur ${userId}:`, error.message);
                await this.sleep(5000); // Attendre 5 secondes en cas d'erreur
            }
        }
    }

    /**
     * Démarre un test de charge en rafales
     * @param {Function} requestFunction - Fonction à exécuter
     */
    async startBurstLoad(requestFunction) {
        console.log('💥 Démarrage du test en rafales...');
        
        this.isRunning = true;
        const profile = this.profiles.burst;
        
        for (let cycle = 0; cycle < profile.parameters.cycles && this.isRunning; cycle++) {
            console.log(`🎯 Rafale ${cycle + 1}/${profile.parameters.cycles}`);
            
            // Phase de rafale
            await this.runBurst(profile.parameters.burstUsers, profile.parameters.burstDuration, requestFunction);
            
            // Phase de repos
            if (cycle < profile.parameters.cycles - 1) {
                console.log(`😴 Pause de ${profile.parameters.restDuration / 1000}s...`);
                await this.sleep(profile.parameters.restDuration);
            }
        }
        
        await this.stop();
    }

    /**
     * Exécute une rafale de requêtes
     */
    async runBurst(userCount, duration, requestFunction) {
        const burstStart = Date.now();
        const burstEnd = burstStart + duration;
        
        // Créer les utilisateurs de la rafale
        const userPromises = [];
        for (let i = 0; i < userCount; i++) {
            userPromises.push(this.burstUser(i, burstEnd, requestFunction));
        }
        
        await Promise.all(userPromises);
    }

    /**
     * Simule un utilisateur en rafale
     */
    async burstUser(userId, burstEnd, requestFunction) {
        let requestCount = 0;
        
        while (this.isRunning && Date.now() < burstEnd) {
            try {
                const requestId = requestCount++;
                await requestFunction(userId, requestId);
                
                // Courte pause entre les requêtes
                await this.sleep(100 + Math.random() * 200); // 100-300ms
            } catch (error) {
                console.error(`Erreur rafale utilisateur ${userId}:`, error.message);
            }
        }
    }

    /**
     * Démarre une charge aléatoire
     * @param {Function} requestFunction - Fonction à exécuter
     */
    async startRandomLoad(requestFunction) {
        console.log('🎲 Démarrage de la charge aléatoire...');
        
        this.isRunning = true;
        const profile = this.profiles.random;
        
        let currentUsers = profile.parameters.minUsers;
        
        while (this.isRunning) {
            // Varier le nombre d'utilisateurs
            const variation = (Math.random() - 0.5) * 2 * profile.parameters.variation;
            const targetUsers = Math.floor(
                currentUsers * (1 + variation)
            );
            
            // Limiter aux bornes
            currentUsers = Math.max(
                profile.parameters.minUsers,
                Math.min(profile.parameters.maxUsers, targetUsers)
            );
            
            console.log(`📊 Charge actuelle: ${currentUsers} utilisateurs`);
            
            // Ajuster le nombre d'utilisateurs
            await this.adjustUserCount(currentUsers, requestFunction);
            
            // Attendre avant le prochain changement
            await this.sleep(profile.parameters.changeInterval);
        }
    }

    /**
     * Ajuste le nombre d'utilisateurs actifs
     */
    async adjustUserCount(targetCount, requestFunction) {
        const currentCount = this.activeUsers.size;
        
        if (currentCount < targetCount) {
            // Ajouter des utilisateurs
            const usersToAdd = targetCount - currentCount;
            for (let i = 0; i < usersToAdd; i++) {
                const userId = currentCount + i;
                await this.addUser(userId, requestFunction);
            }
        } else if (currentCount > targetCount) {
            // Supprimer des utilisateurs
            const usersToRemove = currentCount - targetCount;
            for (let i = 0; i < usersToRemove; i++) {
                await this.removeUser();
            }
        }
    }

    /**
     * Ajoute un utilisateur au pool actif
     */
    async addUser(userId, requestFunction) {
        if (this.activeUsers.has(userId)) return;
        
        const user = {
            id: userId,
            requestCount: 0,
            startTime: Date.now(),
            lastRequest: Date.now(),
            errorCount: 0
        };
        
        this.activeUsers.add(userId);
        this.userQueue.push(user);
        
        // Démarrer la boucle de requêtes pour cet utilisateur
        this.startUserRequests(user, requestFunction);
    }

    /**
     * Démarre les requêtes pour un utilisateur
     */
    async startUserRequests(user, requestFunction) {
        while (this.activeUsers.has(user.id)) {
            try {
                const requestId = user.requestCount++;
                const startTime = Date.now();
                
                await requestFunction(user.id, requestId);
                
                user.lastRequest = Date.now();
                
                // Attendre entre les requêtes
                const delay = 1000 + Math.random() * 3000; // 1-4 secondes
                await this.sleep(delay);
                
            } catch (error) {
                user.errorCount++;
                console.error(`Erreur utilisateur ${user.id}:`, error.message);
                
                // Attendre plus longtemps en cas d'erreur
                await this.sleep(5000);
                
                // Limiter le nombre d'erreurs
                if (user.errorCount > 10) {
                    console.warn(`Utilisateur ${user.id} supprimé après trop d'erreurs`);
                    this.activeUsers.delete(user.id);
                    break;
                }
            }
        }
    }

    /**
     * Supprime un utilisateur du pool
     */
    async removeUser() {
        if (this.activeUsers.size === 0) return;
        
        // Supprimer un utilisateur aléatoire
        const userIds = Array.from(this.activeUsers);
        const userIdToRemove = userIds[Math.floor(Math.random() * userIds.length)];
        
        this.activeUsers.delete(userIdToRemove);
        
        // Retirer de la queue
        const queueIndex = this.userQueue.findIndex(user => user.id === userIdToRemove);
        if (queueIndex !== -1) {
            this.userQueue.splice(queueIndex, 1);
        }
    }

    /**
     * Arrête le générateur de charge
     */
    async stop() {
        console.log('⏹️ Arrêt du générateur de charge...');
        this.isRunning = false;
        
        // Vider le pool d'utilisateurs
        this.activeUsers.clear();
        this.userQueue = [];
        
        // Attendre que les requêtes en cours se terminent
        await this.sleep(2000);
        
        console.log('✅ Générateur de charge arrêté');
    }

    /**
     * Obtient les statistiques de charge actuelles
     */
    getCurrentStats() {
        return {
            activeUsers: this.activeUsers.size,
            queuedUsers: this.userQueue.length,
            maxUsers: this.maxConcurrentUsers,
            isRunning: this.isRunning,
            uptime: this.startTime ? Date.now() - this.startTime : 0
        };
    }

    /**
     * Obtient les statistiques détaillées par utilisateur
     */
    getDetailedStats() {
        return this.userQueue.map(user => ({
            id: user.id,
            requestCount: user.requestCount,
            errorCount: user.errorCount,
            uptime: Date.now() - user.startTime,
            lastRequest: user.lastRequest,
            avgRequestsPerMinute: user.requestCount / ((Date.now() - user.startTime) / 60000)
        }));
    }

    /**
     * Génère un rapport de charge
     */
    generateLoadReport() {
        const stats = this.getCurrentStats();
        const detailed = this.getDetailedStats();
        
        const totalRequests = detailed.reduce((sum, user) => sum + user.requestCount, 0);
        const totalErrors = detailed.reduce((sum, user) => sum + user.errorCount, 0);
        const avgRequestsPerUser = detailed.length > 0 ? totalRequests / detailed.length : 0;
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                ...stats,
                totalRequests,
                totalErrors,
                errorRate: errorRate.toFixed(2),
                avgRequestsPerUser: avgRequestsPerUser.toFixed(2)
            },
            detailed,
            loadProfile: this.loadProfile,
            utilizationPercent: ((stats.activeUsers / stats.maxUsers) * 100).toFixed(2)
        };
    }

    /**
     * Utilitaires
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Configure le profil de charge
     */
    setLoadProfile(profile) {
        if (this.profiles[profile]) {
            this.loadProfile = profile;
            console.log(`📊 Profil de charge configuré: ${this.profiles[profile].name}`);
        } else {
            console.warn(`⚠️ Profil de charge inconnu: ${profile}`);
        }
    }

    /**
     * Définit le nombre maximum d'utilisateurs
     */
    setMaxUsers(count) {
        this.maxConcurrentUsers = count;
        console.log(`👥 Nombre maximum d'utilisateurs: ${count}`);
    }

    /**
     * Démarre le monitoring de la charge
     */
    startLoadMonitoring(interval = 5000) {
        this.startTime = Date.now();
        
        this.monitoringInterval = setInterval(() => {
            const report = this.generateLoadReport();
            console.log(`📊 Stats charge [${new Date().toLocaleTimeString()}]: ` +
                `${report.summary.activeUsers}/${report.summary.maxUsers} users, ` +
                `${report.summary.totalRequests} req, ` +
                `${report.summary.errorRate}% errors`);
        }, interval);
    }

    /**
     * Arrête le monitoring de la charge
     */
    stopLoadMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}

module.exports = LoadGenerator;