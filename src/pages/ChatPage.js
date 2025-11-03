// src/pages/ChatPage.js - VERSION FINALE AVEC CORRECTION DRAGGABLE ET ESLINT

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Draggable from 'react-draggable';
import {
    Box, Paper, Typography, TextField, IconButton, Button, Avatar, List,
    ListItemText, ListItemAvatar, ListItemButton, Divider, Menu, MenuItem,
    DialogTitle, DialogContent, DialogActions, CircularProgress, ListSubheader,
    Stack, Chip, Popover, ListItemIcon, Badge, Tooltip
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
import EmojiPicker from 'emoji-picker-react';

import { useApp } from '../contexts/AppContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ NOUVEAU
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

const AddChannelDialog = memo(({ open, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({ name, description });
        setName('');
        setDescription('');
        onClose();
    };
    
    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Nouveau Canal</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Nom du canal" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
                <TextField margin="dense" label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">Créer</Button>
            </DialogActions>
        </StyledDialog>
    );
});

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
            onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
            sx={{ display: 'flex', px: 2, py: isFirstInGroup ? 1.5 : 0.2, '&:hover': { bgcolor: 'action.hover' }, position: 'relative' }}
            onDoubleClick={() => isOwn && onEdit(message)}
        >
            {isFirstInGroup ? (
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    invisible={!isOnline}
                >
                    <Avatar sx={{ width: 36, height: 36 }}>{message.authorAvatar}</Avatar>
                </Badge>
            ) : (
                <Box sx={{ width: 36, mr: 2 }} />
            )}
            <Box sx={{ flex: 1 }}>
                {isFirstInGroup && <Stack direction="row" alignItems="baseline" spacing={1}><Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>{message.authorName}</Typography><Typography variant="caption" color="text.secondary">{new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Typography></Stack>}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: isFirstInGroup ? 0 : -0.5 }}>
                    {message.text}{message.edited && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(modifié)</Typography>}
                </Typography>
                {message.file_info && <Chip icon={<DescriptionIcon />} label={message.file_info.name} size="small" variant="outlined" sx={{ mt: 1 }} />}
                {message.reactions && Object.keys(message.reactions).length > 0 && <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>{Object.entries(message.reactions).filter(([key]) => key !== 'edited').map(([emoji, users]) => users.length > 0 && <Tooltip key={emoji} title={getReactionAuthors(users)}><Chip label={`${emoji} ${users.length}`} size="small" variant={users.includes(currentUser?.id) ? 'filled' : 'outlined'} onClick={() => onReact(message.id, emoji)} sx={{ cursor: 'pointer' }} /></Tooltip>)}</Stack>}
                {isHovered && <Paper sx={{ position: 'absolute', top: -16, right: 8, display: 'flex', gap: 0.2, borderRadius: 2 }}><Tooltip title="Réagir"><IconButton size="small" onClick={(e) => setReactionAnchor(e.currentTarget)}><AddReactionIcon sx={{fontSize: 18}} /></IconButton></Tooltip>{isOwn && <Tooltip title="Plus d'options"><IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}><MoreVertIcon sx={{fontSize: 18}} /></IconButton></Tooltip>}</Paper>}
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}><MenuItem onClick={() => { onEdit(message); setMenuAnchor(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Modifier</MenuItem><MenuItem onClick={() => { onDelete(message.id); setMenuAnchor(null); }}><ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>Supprimer</MenuItem></Menu>
                <Popover open={Boolean(reactionAnchor)} anchorEl={reactionAnchor} onClose={() => setReactionAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Stack direction="row" sx={{ p: 0.5 }}>{EMOJI_REACTIONS.map(emoji => <IconButton key={emoji} onClick={() => { onReact(message.id, emoji); setReactionAnchor(null); }}>{emoji}</IconButton>)}</Stack></Popover>
            </Box>
        </Box>
    );
});

const DateDivider = memo(({ date }) => {
    const formatDate = () => {
        const today = new Date(); const yesterday = new Date(); yesterday.setDate(today.getDate() - 1); const messageDate = new Date(date);
        if (today.toDateString() === messageDate.toDateString()) return 'AUJOURD\'HUI';
        if (yesterday.toDateString() === messageDate.toDateString()) return 'HIER';
        return messageDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    };
    return <Divider sx={{ my: 2 }}><Chip label={formatDate()} size="small" /></Divider>;
});

const ChatDialog = ({ open, onClose, onlineTechnicians = [] }) => {
    const { currentTechnician, showNotification, events, config } = useApp();
    const { markChannelAsRead } = useUnreadMessages(); // ✅ NOUVEAU hook
    const [currentChannel, setCurrentChannel] = useState('general');
    const [channels, setChannels] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [addChannelOpen, setAddChannelOpen] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const emojiPickerAnchor = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = useCallback((behavior = 'auto') => { messagesEndRef.current?.scrollIntoView({ behavior }); }, []);
    const loadData = useCallback(async () => { try { const channelsData = await apiService.getChatChannels(); setChannels(channelsData || []); setTechnicians(config.it_technicians || []); } catch (error) { showNotification('error', 'Impossible de charger les données du chat.'); } }, [showNotification, config]);
    const loadMessages = useCallback(async (channelId) => { if (!channelId || !currentTechnician?.id) return; setIsLoading(true); setMessages([]); try { const msgs = await apiService.getChatMessages(channelId); setMessages(msgs || []); } catch (error) { showNotification('error', `Erreur chargement messages: ${error.message}`); setMessages([]); } finally { setIsLoading(false); } }, [currentTechnician, showNotification]);
    useEffect(() => { if (open) loadData(); }, [open, loadData]);
    useEffect(() => { if (open && currentChannel) loadMessages(currentChannel); }, [open, currentChannel, loadMessages]);
    
    // ✅ NOUVEAU: Marquer le canal comme lu quand on change de canal ou quand de nouveaux messages arrivent
    useEffect(() => {
        if (open && currentChannel && messages.length > 0) {
            // Marquer comme lu après un court délai (pour être sûr que l'utilisateur voit les messages)
            const timer = setTimeout(() => {
                markChannelAsRead(currentChannel);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [open, currentChannel, messages, markChannelAsRead]);
    
    useEffect(() => { const handleNewMessage = (msg) => { if (msg.channelId === currentChannel) setMessages(prev => [...prev, msg]); }; const handleUpdate = () => loadMessages(currentChannel); const unsubNew = events.on('chat_message_new', handleNewMessage); const unsubUpdate = events.on('chat_message_updated', handleUpdate); const unsubDelete = events.on('chat_message_deleted', handleUpdate); const unsubReaction = events.on('chat_reaction_toggled', handleUpdate); const unsubChannels = events.on('data_updated:chat_channels', loadData); return () => { unsubNew(); unsubUpdate(); unsubDelete(); unsubReaction(); unsubChannels(); }; }, [currentChannel, events, loadMessages, loadData]);
    useEffect(() => { if (!isLoading) scrollToBottom('auto'); }, [isLoading, scrollToBottom]);
    useEffect(() => { if (!isSending) scrollToBottom('smooth'); }, [messages, isSending, scrollToBottom]);
    const handleSendMessage = async () => { if (!newMessage.trim() || isSending) return; setIsSending(true); const originalMessage = newMessage; setNewMessage(''); try { if (editingMessage) { await apiService.editChatMessage(editingMessage.id, currentChannel, originalMessage); setEditingMessage(null); } else { await apiService.sendChatMessage(currentChannel, originalMessage); } } catch (error) { showNotification('error', `Erreur: ${error.message}`); setNewMessage(originalMessage); } finally { setIsSending(false); } };
    const handleAddChannel = async ({ name, description }) => { try { await apiService.addChatChannel(name, description); showNotification('success', `Canal "${name}" créé.`); loadData(); } catch (error) { showNotification('error', `Erreur: ${error.message}`); } };
    const handleEditMessage = (message) => { setEditingMessage(message); setNewMessage(message.text); };
    const handleDeleteMessage = async (messageId) => { if (!window.confirm("Supprimer ce message ?")) return; try { await apiService.deleteChatMessage(messageId, currentChannel); } catch (error) { showNotification('error', `Erreur: ${error.message}`); } };
    const handleReaction = async (messageId, emoji) => { try { await apiService.toggleChatReaction(messageId, currentChannel, emoji); } catch (error) { showNotification('error', `Erreur: ${error.message}`); } };
    const handleFileSelect = (e) => { if (e.target.files[0]) showNotification('info', `Envoi de fichier non implémenté. Fichier: ${e.target.files[0].name}`); };
    const currentTargetName = useMemo(() => { if (currentChannel.startsWith('dm--')) { const otherUserId = currentChannel.split('--').find(id => id !== currentTechnician?.id); return technicians.find(t => t.id === otherUserId)?.name || 'Message Privé'; } return channels.find(c => c.id === currentChannel)?.name || 'Canal'; }, [currentChannel, channels, technicians, currentTechnician]);
    const onlineIds = useMemo(() => new Set(onlineTechnicians.map(t => t.id)), [onlineTechnicians]);

    return (
        <StyledDialog open={open} onClose={onClose} PaperComponent={DraggablePaper} maxWidth="lg" PaperProps={{ sx: { height: '80vh', width: '80vw' } }}>
            <DialogTitle sx={{ cursor: 'move', m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} id="draggable-dialog-title"><Typography variant="h6">Chat Équipe IT</Typography><IconButton onClick={onClose} aria-label="Fermer"><CloseIcon /></IconButton></DialogTitle>
            <DialogContent dividers sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
                <Box sx={{ width: 260, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        <ListSubheader sx={{ bgcolor: 'grey.100' }}>Canaux <IconButton size="small" onClick={() => setAddChannelOpen(true)} aria-label="Ajouter un canal"><AddIcon fontSize="small" /></IconButton></ListSubheader>
                        <List dense>{channels.map(c => <ListItemButton key={c.id} selected={currentChannel === c.id} onClick={() => setCurrentChannel(c.id)}><ListItemIcon sx={{ minWidth: 32 }}><TagIcon fontSize="small" /></ListItemIcon><ListItemText primary={c.name} /></ListItemButton>)}</List>
                        <ListSubheader sx={{ bgcolor: 'grey.100' }}>Messages Privés</ListSubheader>
                        <List dense>{technicians.filter(t => t.id !== currentTechnician?.id).map(t => { const dmId = getDmChannelKey(currentTechnician?.id, t.id); const isOnline = onlineIds.has(t.id); return <ListItemButton key={t.id} selected={currentChannel === dmId} onClick={() => setCurrentChannel(dmId)}><ListItemAvatar sx={{ minWidth: 36 }}><Badge color="success" variant="dot" invisible={!isOnline} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Avatar sx={{ width: 24, height: 24 }}>{t.avatar}</Avatar></Badge></ListItemAvatar><ListItemText primary={t.name} /></ListItemButton>; })}</List>
                    </Box>
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}><Typography variant="h6">{currentChannel.startsWith('dm--') ? '' : '#'}{currentTargetName}</Typography></Box>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> :
                         messages.length === 0 ? <Typography sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>C'est le début de votre conversation. Dites bonjour !</Typography> :
                         messages.map((msg, index) => {
                            const prevMsg = messages[index - 1];
                            const isFirstInGroup = !prevMsg || prevMsg.authorId !== msg.authorId || (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) > 5 * 60 * 1000;
                            const showDateDivider = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                            const isOnline = onlineIds.has(msg.authorId);
                            return (<React.Fragment key={msg.id}>{showDateDivider && <DateDivider date={msg.timestamp} />}<MessageItem message={msg} isFirstInGroup={isFirstInGroup} currentUser={currentTechnician} onEdit={handleEditMessage} onDelete={handleDeleteMessage} onReact={handleReaction} isOnline={isOnline} /></React.Fragment>);
                         })}
                        <div ref={messagesEndRef} />
                    </Box>
                    <Paper elevation={3} sx={{ p: 1, m: 2, borderRadius: 2 }}>
                        {editingMessage && <Box sx={{ p: 1, mb: 1, bgcolor: 'warning.lighter', borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption">Modification...</Typography><IconButton size="small" onClick={() => { setEditingMessage(null); setNewMessage('') }}><CloseIcon fontSize="small" /></IconButton></Box>}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                            <Tooltip title="Joindre un fichier"><IconButton onClick={() => fileInputRef.current.click()} aria-label="Joindre un fichier"><AttachFileIcon /></IconButton></Tooltip>
                            <Tooltip title="Ajouter un emoji"><IconButton ref={emojiPickerAnchor} onClick={() => setEmojiPickerOpen(true)} aria-label="Ouvrir le sélecteur d'emojis"><EmojiEmotionsIcon /></IconButton></Tooltip>
                            <TextField fullWidth multiline maxRows={5} placeholder={`Message pour ${currentTargetName}`} variant="standard" InputProps={{ disableUnderline: true }} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                            <IconButton color="primary" onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} aria-label="Envoyer le message"><SendIcon /></IconButton>
                        </Box>
                    </Paper>
                </Box>
            </DialogContent>
            <Popover open={emojiPickerOpen} anchorEl={emojiPickerAnchor.current} onClose={() => setEmojiPickerOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}><EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} /></Popover>
            <AddChannelDialog open={addChannelOpen} onClose={() => setAddChannelOpen(false)} onSave={handleAddChannel} />
        </StyledDialog>
    );
};

export default ChatDialog;