// src/components/GuacamoleViewer.js - VERSION CORRIGÉE SANS ERREUR isReady()

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Guacamole from 'guacamole-common-js';
import { Box, Typography, CircularProgress, Alert, IconButton, Tooltip, Button } from '@mui/material';

// Icons
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import RefreshIcon from '@mui/icons-material/Refresh';

const GuacamoleViewer = ({ token, url }) => {
    const displayRef = useRef(null);
    const guacClientRef = useRef(null);
    const [status, setStatus] = useState('CONNECTING');
    const [errorMessage, setErrorMessage] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Vérifier que Guacamole est bien importé
    const guacLoaded = !!Guacamole;

    useLayoutEffect(() => {
        if (!guacLoaded || !token || !url || !displayRef.current) return;

        console.log('🔌 Initialisation Guacamole Viewer...');
        const displayElement = displayRef.current;

        const wsUrl = new URL(url);
        wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl.pathname += (wsUrl.pathname.endsWith('/') ? '' : '/') + 'websocket-tunnel';
        // Passer le token en query parameter pour le WebSocket
        wsUrl.searchParams.set('token', token);

        const tunnel = new Guacamole.WebSocketTunnel(wsUrl.toString());
        const client = new Guacamole.Client(tunnel);
        guacClientRef.current = client;

        const handleError = (error) => {
            console.error('❌ Erreur Guacamole:', error);
            let message = "Erreur de connexion RDP. Vérifiez que la session est active et que Guacamole est bien configuré.";

            // Interpréter les codes d'erreur de Guacamole pour des messages plus clairs.
            if (error?.code) {
                switch (error.code) {
                    case 768: // Upstream error
                        message = "Erreur 768 : La connexion au serveur RDS distant a échoué. Vérifiez que le serveur est bien allumé et accessible sur le réseau depuis le serveur Guacamole.";
                        break;
                    case 1006: // WebSocket connection closed unexpectedly
                        message = "Connexion au serveur Guacamole refusée. Le service est-il démarré sur le port 8080 ?";
                        break;
                    case 517: // Client forbidden
                        message = "Erreur 517 : Accès refusé par Guacamole. Le token est invalide ou expiré. Assurez-vous que la 'secretKey' dans votre config.json correspond bien à la propriété 'json-secret' dans le fichier guacamole.properties de votre serveur Guacamole.";
                        break;
                    default:
                        message = `Erreur Guacamole non reconnue (Code: ${error.code}). Contactez un administrateur.`;
                }
            }

            setStatus('ERROR');
            setErrorMessage(message);
            client?.disconnect();
        };

        tunnel.onerror = handleError;
        client.onerror = handleError;

        displayElement.innerHTML = '';
        displayElement.appendChild(client.getDisplay().getElement());

        // Ne pas passer le token dans connect() car il est déjà dans l'URL
        client.connect();

        // Gestion des changements d'état
        client.onstatechange = (state) => {
            const states = { 0: 'IDLE', 1: 'CONNECTING', 2: 'WAITING', 3: 'CONNECTED', 4: 'DISCONNECTING', 5: 'DISCONNECTED' };
            const statusName = states[state] || 'UNKNOWN';
            setStatus(statusName);

            // Envoyer la taille du display quand la connexion est établie
            if (state === 3) { // CONNECTED
                setTimeout(() => {
                    try {
                        client.sendSize(displayElement.clientWidth, displayElement.clientHeight);
                        console.log('✅ Taille du display envoyée au serveur Guacamole');
                    } catch (e) {
                        console.warn('⚠️ Erreur lors de l\'envoi de la taille:', e);
                    }
                }, 100);
            }
        };

        const keyboard = new Guacamole.Keyboard(document);
        keyboard.onkeydown = (keysym) => client.sendKeyEvent(1, keysym);
        keyboard.onkeyup = (keysym) => client.sendKeyEvent(0, keysym);

        const mouse = new Guacamole.Mouse(client.getDisplay().getElement());
        mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (state) => client.sendMouseState(state);

        // Observer le redimensionnement de la fenêtre
        const resizeObserver = new ResizeObserver(() => {
            // Envoyer la nouvelle taille uniquement si connecté
            if (guacClientRef.current && client) {
                try {
                    client.sendSize(displayElement.clientWidth, displayElement.clientHeight);
                } catch (e) {
                    // Ignorer les erreurs si pas encore connecté
                }
            }
        });
        resizeObserver.observe(displayElement);

        return () => {
            resizeObserver.disconnect();
            client.disconnect();
            displayElement.innerHTML = '';
        };
    }, [token, url, guacLoaded, retryCount]);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!displayRef.current) return;
        if (!isFullscreen) displayRef.current.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    if (!guacLoaded) {
        return <Alert severity="error">Librairie Guacamole (guacamole-common-js) non trouvée. Vérifiez son chargement.</Alert>;
    }

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a1a', overflow: 'hidden' }}>
            <Box ref={displayRef} sx={{ width: '100%', height: '100%', position: 'absolute', cursor: status === 'CONNECTED' ? 'default' : 'wait' }} />
            {status !== 'CONNECTED' && (
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', p: 4, background: 'rgba(0,0,0,0.8)', borderRadius: 2, zIndex: 1 }}>
                    {status === 'ERROR' ? (
                        <Box sx={{minWidth: 300}}><Alert severity="error">{errorMessage}</Alert><Button variant="contained" onClick={() => setRetryCount(c => c + 1)} startIcon={<RefreshIcon />} sx={{ mt: 2 }}>Réessayer</Button></Box>
                    ) : (
                        <><CircularProgress color="inherit" /><Typography sx={{ mt: 2, color: 'white' }}>Connexion en cours...</Typography></>
                    )}
                </Box>
            )}
            {status === 'CONNECTED' && (
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}><Tooltip title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}><IconButton onClick={toggleFullscreen} sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>{isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</IconButton></Tooltip></Box>
            )}
        </Box>
    );
};

export default GuacamoleViewer;
