// src/setupProxy.js - Configuration du proxy pour le serveur React de dev

const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

// ✅ NOUVEAU: Logique d'attente robuste pour .ports.json
const getApiPort = () => {
  return new Promise((resolve, reject) => {
    const portsFilePath = path.join(__dirname, '..', '.ports.json');
    let attempts = 0;
    const maxAttempts = 30; // Attendre 30 secondes max
    const interval = 1000;

    const checkFile = () => {
      if (fs.existsSync(portsFilePath)) {
        try {
          const content = fs.readFileSync(portsFilePath, 'utf8');
          if (content.trim() === '') {
             if (++attempts >= maxAttempts) {
               return reject(new Error('.ports.json est vide après 30s'));
             }
             setTimeout(checkFile, interval);
             return;
          }
          const ports = JSON.parse(content);
          if (ports.http) {
            console.log(`[Setup Proxy] ✅ Backend trouvé sur le port ${ports.http} après ${attempts}s`);
            return resolve(ports.http);
          }
        } catch (e) {
          // Fichier en cours d'écriture, on ignore et on réessaie
        }
      }

      if (++attempts >= maxAttempts) {
        return reject(new Error('.ports.json introuvable après 30s'));
      }
      setTimeout(checkFile, interval);
    };

    console.log('[Setup Proxy] ⏳ Attente du fichier .ports.json...');
    checkFile();
  });
};


module.exports = async function(app) {
  let apiPort;
  try {
    apiPort = await getApiPort();
  } catch (error) {
    console.error(`[Setup Proxy] ❌ Erreur critique: ${error.message}`);
    // Utiliser un port par défaut pour ne pas bloquer complètement, mais afficher une erreur
    apiPort = 3002;
    // Créer un middleware qui affiche une erreur claire dans le navigateur
    app.use('/api', (req, res) => {
        res.status(504).send(
            `<h1>Erreur Proxy 504</h1>
             <p>Le serveur de développement React n'a pas pu se connecter au serveur backend.</p>
             <p><b>Raison:</b> ${error.message}</p>
             <p>Veuillez vérifier que le serveur backend (<code>npm run server:start</code>) est démarré et fonctionne correctement.</p>`
        );
    });
    return;
  }

  // ✅ CORRECTION: Utiliser 127.0.0.1 pour plus de robustesse dans les environnements de test
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  console.log(`[Setup Proxy] 🔗 Proxy /api -> ${apiUrl}`);

  // Proxy pour toutes les requêtes /api vers le backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} → ${apiUrl}${req.url}`);
      },
      onError: (err, req, res) => {
        console.error(`[Proxy ERROR] ${req.method} ${req.url}:`, err.message);
        res.status(502).json({
          success: false,
          error: 'Proxy Error',
          message: `Le serveur backend n'est pas accessible sur ${apiUrl}`,
          details: err.message
        });
      }
    })
  );

  console.log(`[Setup Proxy] ✅ Proxy configuré pour /api -> ${apiUrl}`);
};
