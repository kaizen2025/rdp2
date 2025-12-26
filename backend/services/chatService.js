// backend/services/chatService.js - VERSION AMÉLIORÉE AVEC GESTION COMPLÈTE

const db = require('./databaseService');
const { generateId } = require('./utils');

const parseJSON = (field, defaultValue = null) => {
    try { return field ? JSON.parse(field) : defaultValue; } catch { return defaultValue; }
};
const stringifyJSON = (field) => {
    try { return JSON.stringify(field); } catch { return null; }
};

// --- CANAUX ---

async function getChannels() {
    try {
        return db.all('SELECT * FROM chat_channels ORDER BY name ASC');
    } catch (error) {
        console.error("Erreur getChannels:", error);
        throw error;
    }
}

async function addChannel(name, description, author) {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!id) throw new Error("Le nom du canal est invalide.");
    try {
        db.run('INSERT INTO chat_channels (id, name, description, createdAt, createdBy) VALUES (?, ?, ?, ?, ?)',
            [id, name, description || '', new Date().toISOString(), author?.id || 'unknown']);
        return { success: true, id };
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error(`Un canal avec le nom "${name}" existe déjà.`);
        }
        throw error;
    }
}

// --- MESSAGES ---

function getDmChannelKey(userId1, userId2) {
    return `dm--${[userId1, userId2].sort().join('--')}`;
}

async function getMessages(channelId) {
    try {
        const rows = db.all('SELECT * FROM chat_messages WHERE channelId = ? ORDER BY timestamp ASC', [channelId]);
        return rows.map(m => ({
            ...m,
            reactions: parseJSON(m.reactions, {}),
            file_info: parseJSON(m.file_info, null),
            edited: !!(parseJSON(m.reactions, {})?.edited),
        }));
    } catch (error) {
        console.error("Erreur getMessages:", error);
        throw error;
    }
}

async function addMessage(channelId, messageText, author, fileInfo = null) {
    const id = generateId();
    const now = new Date().toISOString();
    try {
        db.run(
            'INSERT INTO chat_messages (id, channelId, authorId, authorName, authorAvatar, text, timestamp, file_info, reactions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, channelId, author.id, author.name, author.avatar, messageText, now, fileInfo ? stringifyJSON(fileInfo) : null, stringifyJSON({})]
        );
        const newMessage = db.get('SELECT * FROM chat_messages WHERE id = ?', [id]);
        return { ...newMessage, reactions: {}, file_info: fileInfo };
    } catch (error) {
        console.error("Erreur addMessage:", error);
        throw error;
    }
}

async function editMessage(messageId, channelId, newText, author) {
    const message = db.get('SELECT authorId, reactions FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
    if (!message) throw new Error("Message introuvable.");
    if (message.authorId !== author.id) throw new Error("Action non autorisée.");

    const reactions = parseJSON(message.reactions, {});
    reactions.edited = true;

    try {
        db.run('UPDATE chat_messages SET text = ?, reactions = ? WHERE id = ?', [newText, stringifyJSON(reactions), messageId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

async function deleteMessage(messageId, channelId, author) {
    const message = db.get('SELECT authorId FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
    if (!message) throw new Error("Message introuvable.");
    if (message.authorId !== author.id && !author.permissions?.includes('admin')) {
        throw new Error("Action non autorisée.");
    }
    try {
        db.run('DELETE FROM chat_messages WHERE id = ?', [messageId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

// --- MESSAGES PRIVÉS ---

/**
 * Crée ou récupère un canal de message privé entre deux utilisateurs
 * @param {string} userId1 - ID du premier utilisateur
 * @param {string} userId2 - ID du deuxième utilisateur
 * @param {Object} user1 - Objet utilisateur 1 avec name, avatar
 * @param {Object} user2 - Objet utilisateur 2 avec name, avatar
 * @returns {Object} Canal privé créé ou existant
 */
async function getOrCreatePrivateChannel(userId1, userId2, user1, user2) {
    const channelId = getDmChannelKey(userId1, userId2);
    const now = new Date().toISOString();

    try {
        // Vérifier si le canal existe déjà
        let channel = db.get('SELECT * FROM chat_channels WHERE id = ?', [channelId]);

        if (channel) {
            return {
                success: true,
                channel: {
                    ...channel,
                    participants: parseJSON(channel.participants, [])
                },
                isNew: false
            };
        }

        // Créer nouveau canal privé
        const participants = [
            { id: userId1, name: user1.name, avatar: user1.avatar },
            { id: userId2, name: user2.name, avatar: user2.avatar }
        ];

        const channelName = `DM: ${user1.name} ↔ ${user2.name}`;

        db.run(
            'INSERT INTO chat_channels (id, name, description, createdAt, createdBy, is_private, participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [channelId, channelName, 'Conversation privée', now, userId1, 1, stringifyJSON(participants)]
        );

        channel = db.get('SELECT * FROM chat_channels WHERE id = ?', [channelId]);

        return {
            success: true,
            channel: {
                ...channel,
                participants: parseJSON(channel.participants, [])
            },
            isNew: true
        };
    } catch (error) {
        console.error('[ChatService] Erreur création canal privé:', error);
        throw error;
    }
}

/**
 * Récupère tous les canaux privés d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Array} Liste des canaux privés
 */
async function getPrivateChannels(userId) {
    try {
        const channels = db.all('SELECT * FROM chat_channels WHERE is_private = 1');

        // Filtrer uniquement les canaux où l'utilisateur est participant
        const userChannels = channels.filter(channel => {
            const participants = parseJSON(channel.participants, []);
            return participants.some(p => p.id === userId);
        });

        return userChannels.map(channel => ({
            ...channel,
            participants: parseJSON(channel.participants, [])
        }));
    } catch (error) {
        console.error('[ChatService] Erreur récupération canaux privés:', error);
        throw error;
    }
}

// --- RÉACTIONS ---

async function toggleReaction(messageId, channelId, emoji, userId) {
    try {
        const message = db.get('SELECT reactions FROM chat_messages WHERE id = ? AND channelId = ?', [messageId, channelId]);
        if (!message) throw new Error("Message introuvable.");

        const reactions = parseJSON(message.reactions, {});
        reactions[emoji] = reactions[emoji] || [];

        const userIndex = reactions[emoji].indexOf(userId);
        if (userIndex > -1) {
            reactions[emoji].splice(userIndex, 1);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji].push(userId);
        }

        db.run('UPDATE chat_messages SET reactions = ? WHERE id = ?', [stringifyJSON(reactions), messageId]);
        return { success: true };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getChannels,
    addChannel,
    getMessages,
    addMessage,
    editMessage,
    deleteMessage,
    getDmChannelKey,
    getOrCreatePrivateChannel,
    getPrivateChannels,
    toggleReaction,
};