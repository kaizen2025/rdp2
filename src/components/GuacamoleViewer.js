// src/components/GuacamoleViewer.js - VERSION FINALE CORRIGÉE (RÈGLES DES HOOKS)

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
        
        const tunnel = new Guacamole.WebSocketTunnel(wsUrl.toString());
        const client = new Guacamole.Client(tunnel);
        guacClientRef.current = client;

        const handleError = (error) => {
            console.error('❌ Erreur Guacamole:', error);
            let message = "Erreur de connexion RDP. Vérifiez que la session est active et que Guacamole est bien configuré.";
            if (error?.code === 1006) message = "Connexion au serveur Guacamole refusée. Le service est-il démarré ?";
            setStatus('ERROR');
            setErrorMessage(message);
            client?.disconnect();
        };

        tunnel.onerror = handleError;
        client.onerror = handleError;
        
        displayElement.innerHTML = '';
        displayElement.appendChild(client.getDisplay().getElement());

        client.connect(`token=${encodeURIComponent(token)}`);
        
        client.onstatechange = (state) => {
            const states = { 0: 'IDLE', 1: 'CONNECTING', 2: 'WAITING', 3: 'CONNECTED', 4: 'DISCONNECTING', 5: 'DISCONNECTED' };
            setStatus(states[state] || 'UNKNOWN');
        };

        const keyboard = new Guacamole.Keyboard(document);
        keyboard.onkeydown = (keysym) => client.sendKeyEvent(1, keysym);
        keyboard.onkeyup = (keysym) => client.sendKeyEvent(0, keysym);

        const mouse = new Guacamole.Mouse(client.getDisplay().getElement());
        mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (state) => client.sendMouseState(state);
        
        const resizeObserver = new ResizeObserver(() => {
            if (client.getDisplay()?.isReady()) {
                client.sendSize(displayElement.clientWidth, displayElement.clientHeight);
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