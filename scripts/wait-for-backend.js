#!/usr/bin/env node
/**
 * Script pour attendre que le backend soit prêt avant de démarrer Electron
 */

const http = require('http');

const fs = require('fs');
const path = require('path');

const MAX_RETRIES = 30; // 30 tentatives
const RETRY_DELAY = 1000; // 1 seconde entre chaque tentative
const DEFAULT_BACKEND_PORT = 3002;

let retryCount = 0;

function getBackendPort() {
    try {
        const portsPath = path.join(process.cwd(), '.ports.json');
        if (!fs.existsSync(portsPath)) return DEFAULT_BACKEND_PORT;
        const ports = JSON.parse(fs.readFileSync(portsPath, 'utf8'));
        return ports.http || DEFAULT_BACKEND_PORT;
    } catch (error) {
        return DEFAULT_BACKEND_PORT;
    }
}

function checkBackend(port) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port,
            path: '/api/health',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                reject(new Error(`Backend responded with status ${res.statusCode}`));
            }
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function waitForBackend() {
    console.log('⏳ Attente du démarrage du backend...');

    while (retryCount < MAX_RETRIES) {
        try {
            const port = getBackendPort();
            await checkBackend(port);
            console.log('✅ Backend prêt ! Démarrage d\'Electron...');
            process.exit(0);
        } catch (error) {
            retryCount++;
            if (retryCount >= MAX_RETRIES) {
                console.error(`❌ Impossible de se connecter au backend après ${MAX_RETRIES} tentatives.`);
                console.error('   Assurez-vous que le backend est en cours d\'exécution.');
                process.exit(1);
            }
            process.stdout.write(`\r⏳ Tentative ${retryCount}/${MAX_RETRIES}...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}

waitForBackend();
