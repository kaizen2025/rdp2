// src/pages/ChatPage.js - VERSION MODERNE ET FLUIDE (DISCORD-STYLE)

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import {
    Box, Paper, Typography, TextField, IconButton, Button, Avatar, List,
    ListItemText, ListItemAvatar, ListItemButton, Divider, Menu, MenuItem,
    DialogTitle, DialogContent, DialogActions, CircularProgress, ListSubheader,
    Stack, Chip, Popover, ListItemIcon, Badge, Tooltip, InputAdornment
} from '@mui/material';

// Icons
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TagIcon from '@mui/icons-material/Tag';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EmojiPicker from 'emoji-picker-react';

import { useApp } from '../contexts/AppContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import apiService from '../services/apiService';
import { getDmChannelKey } from '../utils/chatUtils';
import StyledDialog from '../components/StyledDialog';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

const DraggablePaper = (props) => {
    const nodeRef = React.useRef(null);
    return (
        <Draggable nodeRef={nodeRef} handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper ref={nodeRef} {...props} />
        </Draggable>
    );
};

// --- Composants UI Modernes ---

const ChannelItem = memo(({ channel, isSelected, onClick, unreadCount }) => (
    <ListItemButton
        selected={isSelected}
        onClick={onClick}
        sx={{
            borderRadius: 1,
            mb: 0.5,
            mx: 1,
            '&.Mui-selected': {
                bgcolor: 'rgba(102, 126, 234, 0.12)',
                borderLeft: '3px solid #667eea',
                '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.18)' }
            }
        }}
    >
        <ListItemIcon sx={{ minWidth: 32, color: isSelected ? 'primary.main' : 'text.secondary' }}>
            <TagIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
            primary={channel.name}
            primaryTypographyProps={{
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'primary.main' : 'text.primary'
            }}
        />
        {unreadCount > 0 && (
            <Chip label={unreadCount} size="small" color="error" sx={{ height: 20, minWidth: 20 }} />
        )}
    </ListItemButton>
));

const DMItem = memo(({ technician, isSelected, onClick, isOnline, unreadCount }) => (
    <ListItemButton
        selected={isSelected}
        onClick={onClick}
        sx={{
            borderRadius: 1,
            mb: 0.5,
            mx: 1,
            '&.Mui-selected': {
                bgcolor: 'rgba(102, 126, 234, 0.12)',
                borderLeft: '3px solid #667eea'
            }
        }}
    >
        <ListItemAvatar sx={{ minWidth: 40 }}>
            <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                color="success"
                invisible={!isOnline}
            >
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                    {technician.avatar || technician.name.charAt(0)}
                </Avatar>
            </Badge>
        </ListItemAvatar>
        <ListItemText
            primary={technician.name}
            primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: isSelected ? 600 : 400
            }}
        />
        {unreadCount > 0 && (
            <Chip label={unreadCount} size="small" color="error" sx={{ height: 20, minWidth: 20 }} />
        )}
    </ListItemButton>
));

const MessageItem = memo(({ message, isFirstInGroup, currentUser, onEdit, onDelete, onReact, isOnline }) => {
    const { config } = useApp();
    const [isHovered, setIsHovered] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [reactionAnchor, setReactionAnchor] = useState(null);

    const isOwn = message.authorId === currentUser?.id;
    const allTechnicians = config?.it_technicians || [];
    const getReactionAuthors = (users) => users.map(uid => allTechnicians.find(t => t.id === uid)?.name || uid).join(', ');

    return (
        <Box
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                display: 'flex',
                px: 2,
                py: isFirstInGroup ? 1 : 0.2,
                bgcolor: isHovered ? 'rgba(0,0,0,0.02)' : 'transparent',
                position: 'relative'
            }}
        >
            {isFirstInGroup ? (
                <Box sx={{ mr: 2, mt: 0.5 }}>
                    <Avatar
                        sx={{ width: 40, height: 40, bgcolor: isOwn ? 'primary.main' : 'secondary.main', cursor: 'pointer' }}
                    >
                        {message.authorAvatar || (message.authorName ? message.authorName.charAt(0) : '?')}
                    </Avatar>
                </Box>
            ) : (
                <Box sx={{ width: 40, mr: 2 }} />
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
                {isFirstInGroup && (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isOwn ? 'primary.main' : 'text.primary' }}>
                            {message.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ position: 'relative' }}>
                    <Typography
                        variant="body2"
                        component="div"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: 'text.primary',
                            fontSize: '0.95rem',
                            lineHeight: 1.5
                        }}
                    >
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                    </Typography>

                    {message.edited && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            (modifié)
                        </Typography>
                    )}
                </Box>

                {/* Reactions */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {Object.entries(message.reactions).filter(([key]) => key !== 'edited').map(([emoji, users]) => users.length > 0 && (
                            <Tooltip key={emoji} title={getReactionAuthors(users)}>
                                <Chip
                                    label={`${emoji} ${users.length}`}
                                    size="small"
                                    variant={users.includes(currentUser?.id) ? 'filled' : 'outlined'}
                                    onClick={() => onReact(message.id, emoji)}
                                    color={users.includes(currentUser?.id) ? 'primary' : 'default'}
                                    sx={{
                                        height: 24,
                                        fontSize: '0.8rem',
                                        borderColor: 'divider',
                                        bgcolor: users.includes(currentUser?.id) ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                                    }}
                                />
                            </Tooltip>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Actions Floating Menu */}
            {isHovered && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: -15,
                        right: 10,
                        display: 'flex',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.1)',
                        zIndex: 10
                    }}
                >
                    <Tooltip title="Réagir">
                        <IconButton size="small" onClick={(e) => setReactionAnchor(e.currentTarget)} sx={{ borderRadius: 0, p: 0.8 }}>
                            <AddReactionIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {isOwn && (
                        <>
                            <Tooltip title="Modifier">
                                <IconButton size="small" onClick={() => onEdit(message)} sx={{ borderRadius: 0, p: 0.8 }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                                <IconButton size="small" onClick={() => onDelete(message.id)} sx={{ borderRadius: 0, p: 0.8, color: 'error.main' }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Paper>
            )}

            <Menu anchorEl={reactionAnchor} open={Boolean(reactionAnchor)} onClose={() => setReactionAnchor(null)}>
                <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
                    {EMOJI_REACTIONS.map(emoji => (
                        <IconButton key={emoji} onClick={() => { onReact(message.id, emoji); setReactionAnchor(null); }}>
                            {emoji}
                        </IconButton>
                    ))}
                </Box>
            </Menu>
        </Box>
    );
});

const AddChannelDialog = ({ open, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Créer un canal</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Nom" fullWidth value={name} onChange={(e) => setName(e.target.value)} variant="outlined" />
                <TextField margin="dense" label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} variant="outlined" />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={() => { onSave({ name, description }); setName(''); onClose(); }} variant="contained">Créer</Button>
            </DialogActions>
        </StyledDialog>
    );
};

const ChatDialog = ({ open, onClose, onlineTechnicians = [], initialMessage = '' }) => {
    const { currentTechnician, showNotification, events, config } = useApp();
    const { markChannelAsRead, unreadMessages } = useUnreadMessages();
    const [currentChannel, setCurrentChannel] = useState('general');
    const [channels, setChannels] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState(initialMessage);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [addChannelOpen, setAddChannelOpen] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const emojiPickerAnchor = useRef(null);
    const messagesEndRef = useRef(null);

    // Charger les données
    useEffect(() => {
        const load = async () => {
            try {
                const chans = await apiService.getChatChannels();
                setChannels(chans || []);
                setTechnicians(config.it_technicians || []);
            } catch (e) {
                console.error(e);
            }
        };
        if (open) load();
    }, [open, config]);

    // Charger les messages
    useEffect(() => {
        if (!currentChannel) return;
        const loadMsgs = async () => {
            setIsLoading(true);
            try {
                const msgs = await apiService.getChatMessages(currentChannel);
                setMessages(msgs || []);
                markChannelAsRead(currentChannel);
            } catch (e) {
                showNotification('error', 'Erreur chargement messages');
            } finally {
                setIsLoading(false);
            }
        };
        loadMsgs();
    }, [currentChannel, markChannelAsRead, showNotification]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            if (editingMessage) {
                await apiService.editChatMessage(editingMessage.id, currentChannel, newMessage);
                setEditingMessage(null);
            } else {
                await apiService.sendChatMessage(currentChannel, newMessage);
            }
            setNewMessage('');
        } catch (e) {
            showNotification('error', 'Erreur envoi message');
        }
    };

    const onlineIds = useMemo(() => new Set(onlineTechnicians.map(t => t.id)), [onlineTechnicians]);

    const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    const filteredTechs = technicians.filter(t => t.id !== currentTechnician?.id && t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            PaperComponent={DraggablePaper}
            maxWidth="lg"
            PaperProps={{ sx: { height: '85vh', width: '90vw', maxWidth: 1200, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden' } }}
        >
            {/* Header Dragable */}
            <Box id="draggable-dialog-title" sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'move' }}>
                <Typography variant="h6" fontWeight="bold">💬 Tech Chat</Typography>
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Paper elevation={0} sx={{ width: 280, bgcolor: '#f5f7fa', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                            }}
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                    </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            CANAUX
                            <IconButton size="small" onClick={() => setAddChannelOpen(true)}><AddIcon fontSize="small" /></IconButton>
                        </ListSubheader>
                        <List dense disablePadding>
                            {filteredChannels.map(c => (
                                <ChannelItem
                                    key={c.id}
                                    channel={c}
                                    isSelected={currentChannel === c.id}
                                    onClick={() => setCurrentChannel(c.id)}
                                    unreadCount={0} // TODO: Implement unread logic for channels
                                />
                            ))}
                        </List>

                        <Divider sx={{ my: 1 }} />

                        <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 'bold' }}>MESSAGES PRIVÉS</ListSubheader>
                        <List dense disablePadding>
                            {filteredTechs.map(t => {
                                const dmId = getDmChannelKey(currentTechnician?.id, t.id);
                                return (
                                    <DMItem
                                        key={t.id}
                                        technician={t}
                                        isSelected={currentChannel === dmId}
                                        onClick={() => setCurrentChannel(dmId)}
                                        isOnline={onlineIds.has(t.id)}
                                        unreadCount={0} // TODO: Implement unread logic for DMs
                                    />
                                );
                            })}
                        </List>
                    </Box>

                    {/* Current User Profile */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>{currentTechnician?.name.charAt(0)}</Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="subtitle2" noWrap>{currentTechnician?.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>En ligne</Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Main Chat Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                    {/* Chat Header */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TagIcon color="action" />
                            <Typography variant="h6" fontWeight="600">
                                {channels.find(c => c.id === currentChannel)?.name || 'Message Privé'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {channels.find(c => c.id === currentChannel)?.description}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Messages List */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                {messages.map((msg, index) => {
                                    const prevMsg = messages[index - 1];
                                    const isFirstInGroup = !prevMsg || prevMsg.authorId !== msg.authorId || (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) > 5 * 60 * 1000;
                                    const isOnline = onlineIds.has(msg.authorId);
                                    return (
                                        <MessageItem
                                            key={msg.id}
                                            message={msg}
                                            isFirstInGroup={isFirstInGroup}
                                            currentUser={currentTechnician}
                                            isOnline={isOnline}
                                            onEdit={(m) => { setEditingMessage(m); setNewMessage(m.text); }}
                                            onDelete={async (id) => { if(window.confirm('Supprimer ?')) await apiService.deleteChatMessage(id, currentChannel); }}
                                            onReact={async (id, emoji) => await apiService.toggleChatReaction(id, currentChannel, emoji)}
                                        />
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 2, bgcolor: '#f5f7fa', borderTop: '1px solid #e0e0e0' }}>
                        <Paper elevation={0} sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <IconButton sx={{ p: '10px' }} onClick={() => document.getElementById('file-input').click()}>
                                <AttachFileIcon />
                            </IconButton>
                            <input type="file" id="file-input" style={{ display: 'none' }} />

                            <TextField
                                sx={{ flex: 1 }}
                                placeholder={`Envoyer un message dans #${channels.find(c => c.id === currentChannel)?.name || 'discussion'}`}
                                variant="standard"
                                multiline
                                maxRows={4}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                InputProps={{ disableUnderline: true }}
                            />

                            <IconButton sx={{ p: '10px' }} onClick={(e) => { setEmojiPickerOpen(true); emojiPickerAnchor.current = e.currentTarget; }}>
                                <EmojiEmotionsIcon />
                            </IconButton>
                            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                            <IconButton color="primary" sx={{ p: '10px' }} onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                <SendIcon />
                            </IconButton>
                        </Paper>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                            *Markdown supporté
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Popover
                open={emojiPickerOpen}
                anchorEl={emojiPickerAnchor.current}
                onClose={() => setEmojiPickerOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <EmojiPicker onEmojiClick={(e) => { setNewMessage(prev => prev + e.emoji); setEmojiPickerOpen(false); }} />
            </Popover>

            <AddChannelDialog open={addChannelOpen} onClose={() => setAddChannelOpen(false)} onSave={async (data) => { await apiService.createChatChannel(data); }} />
        </StyledDialog>
    );
};

export default ChatDialog;
