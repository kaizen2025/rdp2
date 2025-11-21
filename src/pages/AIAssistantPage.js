// src/pages/AIAssistantPage.js - Page DocuCortex IA
import React from 'react';
import { Box } from '@mui/material';
import ChatInterfaceDocuCortex from '../components/AI/ChatInterfaceDocuCortex';

const AIAssistantPage = () => {
    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <ChatInterfaceDocuCortex sessionId="default-session" />
        </Box>
    );
};

export default AIAssistantPage;
