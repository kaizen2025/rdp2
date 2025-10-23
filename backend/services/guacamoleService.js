// backend/services/guacamoleService.js - VERSION FINALE UTILISANT L'AUTHENTIFICATION PAR TOKEN JSON

const jwt = require('jsonwebtoken');
const configService = require('./configService');

/**
 * Génère un token de connexion JWT signé pour une session RDP spécifique via Guacamole.
 * C'est la méthode la plus moderne et sécurisée pour les connexions ad-hoc.
 * PRÉREQUIS: Avoir installé l'extension "guacamole-auth-json" et configuré guacamole.properties avec la même secretKey.
 */
async function generateConnectionToken(connectionDetails) {
    const { server, username, password, sessionId, multiScreen } = connectionDetails;
    const guacConfig = configService.appConfig.guacamole;

    if (!guacConfig || !guacConfig.secretKey) {
        throw new Error("La 'secretKey' est manquante dans la section 'guacamole' de votre config.json. Elle est requise pour cette méthode d'authentification.");
    }

    // Log détaillé pour le débogage
    console.log(`🥑 Génération du token JWT pour Guacamole...`, {
        server,
        username,
        sessionId: sessionId || 'N/A',
        multiScreen,
        shadowConnect: !!sessionId,
    });

    // Construction de l'objet de connexion dynamique
    const connectionConfig = {
        protocol: 'rdp',
        parameters: {
            hostname: server,
            port: '3389',
            'ignore-cert': 'true',
            'security': 'any',
            'resize-method': 'display-update',
            'enable-font-smoothing': 'true',
            'enable-wallpaper': 'true',
            'enable-theming': 'true',
            'enable-desktop-composition': 'true',
            'color-depth': '24',
            ...(username && { username: username }),
            ...(password && { password: password }),
            ...(multiScreen && { 'use-multimon': 'true' }),
            // Si c'est une session shadow, on utilise 'initial-program' pour lancer mstsc.
            // On se connecte avec les identifiants admin du config.json pour avoir les droits.
            ...(sessionId && {
                'initial-program': `mstsc /shadow:${sessionId} /control`, // Avec consentement
                'username': configService.appConfig.username,
                'password': configService.appConfig.password,
                'domain': configService.appConfig.domain
            })
        }
    };

    // Création du payload JWT
    const payload = {
        // Le token est valide 60 secondes pour initier la connexion
        exp: Math.floor(Date.now() / 1000) + 60,
        connection: connectionConfig
    };

    try {
        // Signer le token avec la clé secrète partagée
        const token = jwt.sign(payload, guacConfig.secretKey);
        console.log(`✅ Token JWT pour Guacamole généré.`);
        return token;
    } catch (error) {
        console.error("❌ Erreur lors de la signature du token JWT pour Guacamole:", error);
        throw new Error("Échec de la création du token de connexion.");
    }
}

module.exports = {
    generateConnectionToken,
};