// src/utils/debounce.js - UTILITAIRES DE DÉBOUNCING OPTIMISÉS

// 🎯 DÉBOUNCE STANDARD POUR LES FILTRES DE RECHERCHE
export const debounce = (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

// ⚡ DÉBOUNCE RAPIDE POUR LA RECHERCHE EN TEMPS RÉEL
export const debounceSearch = (func, wait = 300) => {
    return debounce(func, wait);
};

// 🎨 DÉBOUNCE POUR LES ANIMATIONS ET LE SCROLL
export const debounceScroll = (func, wait = 100) => {
    return debounce(func, wait);
};

// 📊 DÉBOUNCE POUR LES MÉTRIQUES DE PERFORMANCE
export const debounceMetrics = (func, wait = 500) => {
    return debounce(func, wait);
};

// 🔄 THROTTLE POUR LIMITER LA FRÉQUENCE D'APPEL
export const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// 🎯 DÉBOUNCE AVEC RAPPEL DE NETTOYAGE
export const debounceWithCleanup = (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

// 🔍 FONCTION DE DÉBAUNCING SPÉCIALISÉE POUR LA RECHERCHE
export const createSearchDebouncer = (onSearch, options = {}) => {
    const {
        delay = 300,
        minLength = 2,
        onEmpty = null,
        onStart = null
    } = options;

    const debouncedSearch = debounce((searchTerm) => {
        if (searchTerm.length >= minLength) {
            onSearch(searchTerm);
        } else if (searchTerm.length === 0 && onEmpty) {
            onEmpty();
        }
    }, delay);

    return (searchTerm) => {
        if (onStart) onStart(searchTerm);
        debouncedSearch(searchTerm);
    };
};

// 📱 DÉBOUNCE ADAPTATIF BASÉ SUR LA CONNEXION
export const getAdaptiveDebounceDelay = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return 300; // Valeur par défaut
    
    // Ajuster le délai selon la qualité de connexion
    switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
            return 800; // Délai plus long pour connexions lentes
        case '3g':
            return 500;
        case '4g':
        case 'wifi':
        default:
            return 300;
    }
};

// 🎛️ DÉBOUNCE AVEC OPTIONS AVANCÉES
export const createAdvancedDebouncer = (func, options = {}) => {
    const {
        delay = 300,
        maxWait = 1000,
        immediate = false,
        onComplete = null,
        onError = null
    } = options;

    let timeout = null;
    let lastCallTime = 0;
    let result;

    const invokeFunction = (time) => {
        const args = arguments;
        const callTime = time;
        lastCallTime = callTime;
        
        try {
            result = func.apply(this, args);
            if (onComplete) onComplete(result);
        } catch (error) {
            if (onError) onError(error);
            throw error;
        }
        
        return result;
    };

    const leading = (time) => {
        lastCallTime = time;
        timeout = setTimeout(timerExpired, delay);
        return immediate ? invokeFunction(time) : undefined;
    };

    const trailing = (time) => {
        timeout = setTimeout(timerExpired, delay);
        return time - lastCallTime >= maxWait ? invokeFunction(time) : undefined;
    };

    const timerExpired = () => {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailing(time);
        }
    };

    const shouldInvoke = (time) => {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastCallTime;
        return (
            lastCallTime === 0 ||
            timeSinceLastCall >= delay ||
            timeSinceLastCall < 0 ||
            timeSinceLastInvoke >= maxWait
        );
    };

    const cancel = () => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        lastCallTime = 0;
        timeout = null;
    };

    const flush = () => {
        return timeout === null ? undefined : trailing(Date.now());
    };

    const pending = () => {
        return timeout !== null;
    };

    const debouncedFunction = function executedFunction(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);
        
        const argsForFunction = args;
        const resultForFunction = isInvoking ? invokeFunction.apply(this, argsForFunction) : undefined;

        return resultForFunction;
    };

    debouncedFunction.cancel = cancel;
    debouncedFunction.flush = flush;
    debouncedFunction.pending = pending;

    return debouncedFunction;
};

// 📦 EXPORT D'UN DÉBOUNCEUR OPTIMISÉ POUR LA RECHERCHE
export const optimizedSearchDebounce = createAdvancedDebouncer(
    (searchTerm) => {
        // Logique de recherche optimisée
        console.log(`🔍 Recherche: ${searchTerm}`);
    },
    {
        delay: getAdaptiveDebounceDelay(),
        maxWait: 2000,
        onComplete: (result) => {
            console.log('✅ Recherche terminée:', result);
        },
        onError: (error) => {
            console.error('❌ Erreur de recherche:', error);
        }
    }
);

export default debounce;