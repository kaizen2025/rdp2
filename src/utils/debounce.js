/**
 * Utilitaire de debouncing ultra-optimisé pour environnement TSE
 * Prévient les clics multiples et les appels répétés qui saturent les ressources
 */

/**
 * Debounce classique - retarde l'exécution jusqu'à ce que l'utilisateur arrête d'appeler
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms (défaut: 300ms)
 * @returns {Function} Fonction debouncée
 */
export function debounce(func, wait = 300) {
    let timeout;

    const debouncedFunction = function(...args) {
        const context = this;

        clearTimeout(timeout);

        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };

    // Permet d'annuler le debounce si nécessaire
    debouncedFunction.cancel = function() {
        clearTimeout(timeout);
    };

    return debouncedFunction;
}

/**
 * Throttle - limite le nombre d'exécutions dans un intervalle de temps
 * Utile pour éviter la saturation des ressources en TSE
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Délai minimum entre exécutions en ms (défaut: 500ms)
 * @returns {Function} Fonction throttlée
 */
export function throttle(func, limit = 500) {
    let inThrottle;
    let lastResult;

    return function(...args) {
        const context = this;

        if (!inThrottle) {
            lastResult = func.apply(context, args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }

        return lastResult;
    };
}

/**
 * Debounce leading - exécute immédiatement puis ignore les appels suivants
 * Parfait pour les boutons où on veut un feedback immédiat mais éviter les doubles clics
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai de cooldown en ms (défaut: 500ms)
 * @returns {Function} Fonction debouncée leading
 */
export function debounceLeading(func, wait = 500) {
    let timeout;
    let isExecuting = false;

    return function(...args) {
        const context = this;

        // Si déjà en cours d'exécution, ignorer
        if (isExecuting) {
            console.log('[Debounce] Appel ignoré - fonction en cours d\'exécution');
            return;
        }

        // Exécuter immédiatement
        isExecuting = true;
        const result = func.apply(context, args);

        // Réinitialiser après le délai
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            isExecuting = false;
        }, wait);

        return result;
    };
}

/**
 * Debounce async - version optimisée pour les fonctions async
 * Gère correctement les promesses et évite les race conditions
 * @param {Function} func - Fonction async à debouncer
 * @param {number} wait - Délai en ms (défaut: 300ms)
 * @returns {Function} Fonction async debouncée
 */
export function debounceAsync(func, wait = 300) {
    let timeout;
    let lastPromise;

    return async function(...args) {
        const context = this;

        // Annuler le timeout précédent
        clearTimeout(timeout);

        // Créer une nouvelle promesse
        lastPromise = new Promise((resolve, reject) => {
            timeout = setTimeout(async () => {
                try {
                    const result = await func.apply(context, args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, wait);
        });

        return lastPromise;
    };
}

/**
 * Debounce async leading - exécute immédiatement et empêche les exécutions concurrentes
 * Idéal pour les opérations lourdes (RDP, Shadow, AD operations) en TSE
 * @param {Function} func - Fonction async à debouncer
 * @param {number} cooldown - Temps de cooldown en ms (défaut: 1000ms)
 * @returns {Function} Fonction async debouncée leading
 */
export function debounceAsyncLeading(func, cooldown = 1000) {
    let isExecuting = false;
    let timeout;

    return async function(...args) {
        const context = this;

        // Si déjà en cours d'exécution, ignorer
        if (isExecuting) {
            console.log('[Debounce Async Leading] Opération en cours, appel ignoré');
            return { success: false, error: 'Opération déjà en cours' };
        }

        try {
            isExecuting = true;
            const result = await func.apply(context, args);
            return result;
        } catch (error) {
            console.error('[Debounce Async Leading] Erreur:', error);
            throw error;
        } finally {
            // Cooldown avant de permettre une nouvelle exécution
            timeout = setTimeout(() => {
                isExecuting = false;
            }, cooldown);
        }
    };
}

/**
 * Hook React pour debouncing avec cleanup automatique
 * Utilisation: const debouncedCallback = useDebounce(callback, 300);
 */
export function createDebouncedCallback(callback, wait = 300) {
    let timeout;

    const debouncedFn = (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), wait);
    };

    // Fonction de cleanup pour composants React
    debouncedFn.cleanup = () => {
        clearTimeout(timeout);
    };

    return debouncedFn;
}

/**
 * Rate limiter - limite le nombre d'appels par période
 * Utile pour protéger les APIs et éviter la saturation en TSE
 * @param {Function} func - Fonction à rate-limiter
 * @param {number} maxCalls - Nombre max d'appels
 * @param {number} perMs - Période en ms (défaut: 1000ms)
 * @returns {Function} Fonction rate-limitée
 */
export function rateLimit(func, maxCalls = 5, perMs = 1000) {
    const calls = [];

    return function(...args) {
        const now = Date.now();

        // Nettoyer les appels expirés
        while (calls.length > 0 && calls[0] < now - perMs) {
            calls.shift();
        }

        // Vérifier la limite
        if (calls.length >= maxCalls) {
            console.warn(`[Rate Limit] Limite atteinte: ${maxCalls} appels par ${perMs}ms`);
            return { success: false, error: 'Trop d\'appels, veuillez patienter' };
        }

        // Enregistrer l'appel et exécuter
        calls.push(now);
        return func.apply(this, args);
    };
}

export default {
    debounce,
    throttle,
    debounceLeading,
    debounceAsync,
    debounceAsyncLeading,
    createDebouncedCallback,
    rateLimit
};
