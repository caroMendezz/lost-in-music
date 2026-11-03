const { Op } = require("sequelize");
const { Message } = require("../models/Message");
const { User } = require("../models/User");

const VALID_TYPES = ["text", "image", "file"];
const MAX_IMAGES_PER_MESSAGE = 10;
const EDIT_WINDOW_MS = 15 * 60 * 1000;

const PUBLIC_USER_FIELDS = [
    "userId",
    "username",
    "description",
    "profilePhoto",
    "banner",
    "ubication",
    "followerAmount",
    "followingAmount"
];

// 👇 HELPER PARA VERIFICAR BANEOS 👇
const isUserBanned = (penaltyDate) => {
    if (!penaltyDate || penaltyDate === 'nada') return false;
    const banDate = new Date(penaltyDate);
    if (Number.isNaN(banDate.getTime())) return false;
    return banDate.getTime() > Date.now();
};

const toClientMessage = (message) => {
    const data = typeof message.toJSON === "function" ? message.toJSON() : { ...message };

    if (data.deletedForAll) {
        data.content = null;
        data.fileUrl = null;
        data.fileName = null;
        data.fileUrls = null;
    } else {
        let urls = data.fileUrls;
        if (typeof urls === "string") {
            try {
                urls = JSON.parse(urls);
            } catch {
                urls = null;
            }
        }
        data.fileUrls = Array.isArray(urls)
            ? urls.filter((u) => typeof u === "string" && u !== "")
            : null;
    }

    return data;
};

const isHiddenForUser = (message, userId) =>
    (Number(message.senderId) === Number(userId) && Boolean(message.deletedBySender)) ||
    (Number(message.receiverId) === Number(userId) && Boolean(message.deletedByReceiver));

const serializeMessages = async (messages) => {
    const list = [].concat(messages);
    const originalIds = [...new Set(list.map((m) => m.replyToMessageId).filter(Boolean))];

    const originals = originalIds.length
        ? await Message.findAll({
              where: { messageId: originalIds },
              attributes: ["messageId", "senderId", "deletedForAll"]
          })
        : [];
    const originalsById = new Map(originals.map((o) => [Number(o.messageId), o]));

    return list.map((message) => {
        const data = toClientMessage(message);

        if (data.replyToMessageId) {
            const original = originalsById.get(Number(data.replyToMessageId));
            data.replyTo = original
                ? {
                      messageId: original.messageId,
                      senderId: original.senderId,
                      deletedForAll: Boolean(original.deletedForAll)
                  }
                : null;
        }

        return data;
    });
};

const createMessage = async (data) => {
    try {
        const {
            senderId,
            receiverId,
            content,
            messageType = "text",
            fileUrl,
            fileName,
            fileUrls,
            replyToMessageId
        } = data;

        if (!VALID_TYPES.includes(messageType)) throw new Error("Invalid message type");

        const sender = await User.findByPk(senderId);
        if (!sender) throw new Error("Sender not found");

        const receiver = await User.findByPk(receiverId);
        if (!receiver) throw new Error("Receiver not found");
        
        // 👇 NO PERMITIR ENVIAR MENSAJES A UN BANEADO 👇
        if (isUserBanned(receiver.penaltyDate)) {
            throw new Error("No puedes enviar mensajes a un usuario suspendido");
        }

        if (messageType === "text" && (!content || content.trim() === "")) {
            throw new Error("Message content cannot be empty");
        }

        const imageUrls = Array.isArray(fileUrls)
            ? fileUrls.filter((u) => typeof u === "string" && u.trim() !== "")
            : [];

        if (messageType === "image" && imageUrls.length > MAX_IMAGES_PER_MESSAGE) {
            throw new Error(`A message can include at most ${MAX_IMAGES_PER_MESSAGE} images`);
        }

        const storedFileUrl = fileUrl || imageUrls[0] || null;

        if (messageType !== "text" && !storedFileUrl) {
            throw new Error("File URL is required");
        }

        let replyTo = null;
        const hasReply = replyToMessageId !== undefined && replyToMessageId !== null && replyToMessageId !== "";

        if (hasReply) {
            const originalId = Number(replyToMessageId);

            if (!Number.isInteger(originalId)) throw new Error("Invalid reply reference");

            replyTo = await Message.findByPk(originalId);

            if (!replyTo) throw new Error("The message you are replying to does not exist");

            const originalParticipants = [Number(replyTo.senderId), Number(replyTo.receiverId)];
            const sameConversation =
                Number(senderId) !== Number(receiverId) &&
                originalParticipants.includes(Number(senderId)) &&
                originalParticipants.includes(Number(receiverId));

            if (!sameConversation) throw new Error("You cannot reply with a message from another conversation");

            if (isHiddenForUser(replyTo, senderId)) throw new Error("The message you are replying to is no longer available");
        }

        const message = await Message.create({
            senderId,
            receiverId,
            content: content || null,
            messageType,
            fileUrl: storedFileUrl,
            fileName: fileName || null,
            fileUrls: messageType === "image" && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
            replyToMessageId: replyTo ? replyTo.messageId : null,
            sent_at: new Date()
        });

        return message;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const deleteMessage = async (messageId, userId) => {
    try {
        const message = await Message.findByPk(messageId);
        if (!message) throw new Error("Message not found");
        if (Number(message.senderId) !== Number(userId)) throw new Error("You cannot delete this message");

        await message.destroy();
        return message;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const editMessage = async (messageId, userId, content) => {
    try {
        const message = await Message.findByPk(messageId);

        if (!message || message.deletedBySender) throw new Error("Message not found");
        if (Number(message.senderId) !== Number(userId)) throw new Error("You cannot edit this message");
        if (message.deletedForAll) throw new Error("You cannot edit a deleted message");
        if (message.messageType !== "text") throw new Error("Only text messages can be edited");

        const sentAt = new Date(message.sent_at).getTime();
        if (!Number.isFinite(sentAt) || Date.now() - sentAt > EDIT_WINDOW_MS) {
            throw new Error("A message can only be edited during the first 15 minutes after being sent");
        }

        const newContent = typeof content === "string" ? content.trim() : "";

        if (newContent === "") throw new Error("Message content cannot be empty");
        if (newContent === message.content) return message;

        await message.update({ content: newContent, editedAt: new Date() });
        return message;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const revokeMessage = async (messageId, userId) => {
    try {
        const message = await Message.findByPk(messageId);
        if (!message) throw new Error("Message not found");
        if (Number(message.senderId) !== Number(userId)) throw new Error("You cannot revoke this message");

        if (!message.deletedForAll) await message.update({ deletedForAll: true });
        return message;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const deleteMessageForUser = async (messageId, userId) => {
    try {
        const message = await Message.findByPk(messageId);
        if (!message) throw new Error("Message not found");

        const isSender = Number(message.senderId) === Number(userId);
        const isReceiver = Number(message.receiverId) === Number(userId);

        if (!isSender && !isReceiver) throw new Error("You cannot delete this message");

        await message.update(isSender ? { deletedBySender: true } : { deletedByReceiver: true });
        return message;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getMessages = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const otherUserId = Number(req.params.otherUserId);

        // 👇 VERIFICAR SI EL OTRO USUARIO ESTÁ BANEADO 👇
        const otherUser = await User.findByPk(otherUserId);
        if (otherUser && isUserBanned(otherUser.penaltyDate)) {
            return res.status(403).json({ 
                message: "Este usuario se encuentra suspendido. No podés ver ni enviar mensajes.", 
                code: "OTHER_USER_BANNED" 
            });
        }

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId, deletedBySender: false },
                    { senderId: otherUserId, receiverId: userId, deletedByReceiver: false }
                ]
            },
            order: [["sent_at", "ASC"]]
        });

        res.json(await serializeMessages(messages));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};

const getConversations = async (req, res) => {
    try {
        const userId = Number(req.user.userId);

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, deletedBySender: false },
                    { receiverId: userId, deletedByReceiver: false }
                ]
            },
            order: [["sent_at", "DESC"]]
        });

        const byContact = new Map();

        for (const m of messages) {
            const otherId = Number(m.senderId) === userId ? Number(m.receiverId) : Number(m.senderId);
            if (!byContact.has(otherId)) {
                byContact.set(otherId, { lastMessage: toClientMessage(m), unreadCount: 0 });
            }
            if (Number(m.receiverId) === userId && !m.is_read && !m.deletedForAll) {
                byContact.get(otherId).unreadCount += 1;
            }
        }

        if (byContact.size === 0) return res.json([]);

        // 👇 FILTRAR USUARIOS BANEADOS DE LA LISTA DE CHATS 👇
        const usersRaw = await User.findAll({
            where: { userId: [...byContact.keys()] },
            attributes: [...PUBLIC_USER_FIELDS, "penaltyDate"] // Traemos la fecha de ban
        });

        const usersById = new Map();
        usersRaw.forEach((u) => {
            if (!isUserBanned(u.penaltyDate)) {
                const { penaltyDate, ...user } = u.toJSON();
                usersById.set(Number(user.userId), user);
            }
        });

        const conversations = [...byContact.entries()]
            .filter(([otherId]) => usersById.has(otherId))
            .map(([otherId, data]) => ({
                user: usersById.get(otherId),
                lastMessage: data.lastMessage,
                unreadCount: data.unreadCount
            }));

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching conversations" });
    }
};

const deleteConversationForUser = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const otherUserId = Number(req.params.otherUserId);

        if (!Number.isInteger(otherUserId) || otherUserId <= 0 || otherUserId === userId) {
            return res.status(400).json({ message: "Conversacion invalida" });
        }

        const [sent] = await Message.update(
            { deletedBySender: true },
            { where: { senderId: userId, receiverId: otherUserId, deletedBySender: false } }
        );

        const [received] = await Message.update(
            { deletedByReceiver: true },
            { where: { senderId: otherUserId, receiverId: userId, deletedByReceiver: false } }
        );

        res.json({ deleted: sent + received });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting conversation" });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(Number(req.params.id), {
            attributes: [...PUBLIC_USER_FIELDS, "penaltyDate"]
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // 👇 SI EL USUARIO BUSCADO ESTÁ BANEADO, NO MOSTRAR SUS DATOS 👇
        if (isUserBanned(user.penaltyDate)) {
            return res.status(403).json({ 
                message: "Este usuario está suspendido.", 
                code: "OTHER_USER_BANNED" 
            });
        }

        const { penaltyDate, ...userData } = user.toJSON();
        res.json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching user" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const otherUserId = Number(req.params.otherUserId);

        const [updated] = await Message.update(
            { is_read: true },
            {
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    is_read: false
                }
            }
        );

        if (updated > 0) {
            const io = req.app.get("io");
            if (io) {
                io.to(`user_${otherUserId}`).emit("messagesRead", { readerId: userId });
            }
        }

        res.json({ updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error marking messages as read" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const isAdmin = Number(req.user.idRole) === 2; // 👈 Verificamos si es admin
        const q = String(req.query.q || "").trim();

        if (q.length < 2) {
            return res.json([]);
        }

        const safeQuery = q.replace(/[\\%_]/g, "\\$&");

        const usersRaw = await User.findAll({
            where: {
                username: { [Op.like]: `%${safeQuery}%` },
                userId: { [Op.ne]: userId },
                eliminated: 0
            },
            attributes: [...PUBLIC_USER_FIELDS, "penaltyDate"],
            order: [["username", "ASC"]],
            limit: 10
        });

        // 👇 FILTRAR BANEADOS SOLO SI NO ES ADMIN 👇
        const users = usersRaw
            .filter((u) => isAdmin || !isUserBanned(u.penaltyDate))
            .map((u) => {
                const { penaltyDate, ...userData } = u.toJSON();
                return userData;
            });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error searching users" });
    }
};

module.exports = {
    createMessage,
    deleteMessage,
    getMessages,
    getConversations,
    deleteConversationForUser,
    getUserById,
    markAsRead,
    searchUsers,
    revokeMessage,
    deleteMessageForUser,
    editMessage,
    toClientMessage,
    serializeMessages,
    isHiddenForUser,
    EDIT_WINDOW_MS
};