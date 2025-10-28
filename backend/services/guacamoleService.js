// backend/services/guacamoleService.js - VERSION CORRIGÉE POUR AUTH-JSON

const crypto = require('crypto');
const configService = require('./configService');

/**
 * Génère un token de connexion au format auth-json pour Guacamole.
 * Le format attendu est : JSON signé avec HMAC-SHA256, chiffré avec AES-128-CBC, encodé en base64.
 * PRÉREQUIS: Avoir installé l'extension "guacamole-auth-json" et configuré avec la même secretKey.
 */
async function generateConnectionToken(connectionDetails) {
    const { server, username, password, sessionId, multiScreen } = connectionDetails;
    const guacConfig = configService.appConfig.guacamole;

    if (!guacConfig || !guacConfig.secretKey) {
        throw new Error("La 'secretKey' est manquante dans la section 'guacamole' de votre config.json.");
    }

    // Log détaillé pour le débogage
    console.log(`🥑 Génération du token auth-json pour Guacamole...`, {
        server,
        username,
        sessionId: sessionId || 'N/A',
        multiScreen,
        shadowConnect: !!sessionId,
    });

    // Construction de l'objet de connexion au format Guacamole
    const authData = {
        username: username || 'rdp-user',
        expires: Date.now() + 60000, // Expire dans 60 secondes
        connections: {
            [`rdp-${server}-${Date.now()}`]: {
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
                    // Si c'est une session shadow, on utilise 'initial-program' pour lancer mstsc
                    ...(sessionId && {
                        'initial-program': `mstsc /shadow:${sessionId} /control`,
                        'username': configService.appConfig.username,
                        'password': configService.appConfig.password,
                        'domain': configService.appConfig.domain
                    })
                }
            }
        }
    };

    try {
        // Convertir la clé secrète de base64 en buffer
        const secretKey = Buffer.from(guacConfig.secretKey, 'base64');

        // Vérifier que la clé fait 32 bytes (256 bits) pour AES-256 ou 16 bytes (128 bits) pour AES-128
        if (secretKey.length !== 32 && secretKey.length !== 16) {
            throw new Error(`La clé secrète doit faire 16 ou 32 bytes. Taille actuelle: ${secretKey.length} bytes`);
        }

        // 1. Convertir authData en JSON
        const jsonData = JSON.stringify(authData);
        const jsonBuffer = Buffer.from(jsonData, 'utf8');

        // 2. Signer avec HMAC-SHA256
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(jsonBuffer);
        const signature = hmac.digest();

        // 3. Préfixer la signature au JSON
        const signedData = Buffer.concat([signature, jsonBuffer]);

        // 4. Chiffrer avec AES en CBC mode (IV = zéros)
        const algorithm = secretKey.length === 16 ? 'aes-128-cbc' : 'aes-256-cbc';
        const iv = Buffer.alloc(16, 0); // IV de 16 bytes remplis de zéros
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(signedData), cipher.final()]);

        // 5. Encoder en base64
        const token = encrypted.toString('base64');

        console.log(`✅ Token auth-json pour Guacamole généré (${token.length} caractères).`);
        return token;
    } catch (error) {
        console.error("❌ Erreur lors de la génération du token auth-json:", error);
        throw new Error("Échec de la création du token de connexion: " + error.message);
    }
}

module.exports = {
    generateConnectionToken,
};