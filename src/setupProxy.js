// src/setupProxy.js - Configuration du proxy pour le serveur React de dev

const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

module.exports = function(app) {
  // Lire le port du backend depuis .ports.json
  let apiPort = 3002; // Port par défaut

  try {
    const portsFilePath = path.join(__dirname, '..', '.ports.json');
    if (fs.existsSync(portsFilePath)) {
      const ports = JSON.parse(fs.readFileSync(portsFilePath, 'utf8'));
      if (ports.http) {
        apiPort = ports.http;
        console.log(`[Setup Proxy] ✅ Backend trouvé sur le port ${apiPort}`);
      }
    }
  } catch (error) {
    console.warn(`[Setup Proxy] ⚠️ Impossible de lire .ports.json, utilisation du port par défaut ${apiPort}`);
  }

  const apiUrl = `http://localhost:${apiPort}`;
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
