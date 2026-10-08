const { Op } = require("sequelize");
const { Message } = require("../models/Message");
const { User } = require("../models/User");

const VALID_TYPES = ["text", "image", "file"];

// Campos publicos del usuario (nunca password, email, DVH, etc.)
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

// Mensaje tal como se envia al cliente: si fue anulado para todos NO se expone su contenido
// (en la base de datos el registro y su contenido se conservan).
const toClientMessage = (message) => {
    const data = typeof message.toJSON === "function" ? message.toJSON() : { ...message };

    if (data.deletedForAll) {
        data.content = null;
        data.fileUrl = null;
        data.fileName = null;
    }

    return data;
};

const createMessage = async (data) => {

    try {

        const {
            senderId,
            receiverId,
            content,
            messageType = "text",
            fileUrl,
            fileName
        } = data;

        if (!VALID_TYPES.includes(messageType)) {
            throw new Error("Invalid message type");
        }

        const sender =
            await User.findByPk(senderId);

        if (!sender) {
            throw new Error("Sender not found");
        }


        const receiver =
            await User.findByPk(receiverId);

        if (!receiver) {
            throw new Error("Receiver not found");
        }


        if (
            messageType === "text" &&
            (!content || content.trim() === "")
        ) {

            throw new Error(
                "Message content cannot be empty"
            );

        }


        if (messageType !== "text" && !fileUrl) {
            throw new Error("File URL is required");
        }


        const message = await Message.create({

            senderId,
            receiverId,

            content: content || null,

            messageType,

            fileUrl: fileUrl || null,

            fileName: fileName || null,

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

        if (!message) {
            throw new Error("Message not found");
        }

        if (Number(message.senderId) !== Number(userId)) {
            throw new Error("You cannot delete this message");
        }

        await message.destroy();

        return message;

    } catch (error) {

        console.error(error);
        throw error;

    }

};

// Anular envio para todos: solo el emisor. No se borra el registro.
const revokeMessage = async (messageId, userId) => {

    try {

        const message = await Message.findByPk(messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (Number(message.senderId) !== Number(userId)) {
            throw new Error("You cannot revoke this message");
        }

        if (!message.deletedForAll) {
            await message.update({ deletedForAll: true });
        }

        return message;

    } catch (error) {

        console.error(error);
        throw error;

    }

};

// Eliminar para ti: oculta el mensaje solo para quien lo pide (emisor o receptor).
const deleteMessageForUser = async (messageId, userId) => {

    try {

        const message = await Message.findByPk(messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        const isSender = Number(message.senderId) === Number(userId);
        const isReceiver = Number(message.receiverId) === Number(userId);

        if (!isSender && !isReceiver) {
            throw new Error("You cannot delete this message");
        }

        await message.update(
            isSender ? { deletedBySender: true } : { deletedByReceiver: true }
        );

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

        const messages = await Message.findAll({
            where: {
                // Se excluyen los mensajes que el usuario elimino "para ti"
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId, deletedBySender: false },
                    { senderId: otherUserId, receiverId: userId, deletedByReceiver: false }
                ]
            },
            order: [["sent_at", "ASC"]]
        });

        res.json(messages.map(toClientMessage));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};


// ---------------------------------------------------------------
// NUEVO: GET /conversations
// Devuelve [{ user, lastMessage, unreadCount }] ordenado por ultimo mensaje (mas reciente primero)
// ---------------------------------------------------------------
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

        // Map conserva el orden de insercion: el primer mensaje visto por contacto es el ultimo
        const byContact = new Map();

        for (const m of messages) {
            const otherId =
                Number(m.senderId) === userId
                    ? Number(m.receiverId)
                    : Number(m.senderId);

            if (!byContact.has(otherId)) {
                byContact.set(otherId, { lastMessage: toClientMessage(m), unreadCount: 0 });
            }

            if (Number(m.receiverId) === userId && !m.is_read && !m.deletedForAll) {
                byContact.get(otherId).unreadCount += 1;
            }
        }

        if (byContact.size === 0) {
            return res.json([]);
        }

        const users = await User.findAll({
            where: { userId: [...byContact.keys()] },
            attributes: PUBLIC_USER_FIELDS
        });

        const usersById = new Map(users.map((u) => [Number(u.userId), u]));

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


// ---------------------------------------------------------------
// NUEVO: GET /users/:id  (datos publicos de un usuario)
// ---------------------------------------------------------------
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(Number(req.params.id), {
            attributes: PUBLIC_USER_FIELDS
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching user" });
    }
};


// ---------------------------------------------------------------
// NUEVO: PUT /messages/read/:otherUserId
// Marca como leidos los mensajes que otherUserId le envio al usuario autenticado
// ---------------------------------------------------------------
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

        // Avisa en tiempo real al emisor para que su "Enviado" pase a "Visto"
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

// ---------------------------------------------------------------
// NUEVO: GET /users/search?q=texto
// Busca usuarios por username para iniciar una conversacion nueva (excluye al propio usuario)
// ---------------------------------------------------------------
const searchUsers = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const q = String(req.query.q || "").trim();

        if (q.length < 2) {
            return res.json([]);
        }

        // escapa comodines de LIKE para que el texto se busque literalmente
        const safeQuery = q.replace(/[\\%_]/g, "\\$&");

        const users = await User.findAll({
            where: {
                username: { [Op.like]: `%${safeQuery}%` },
                userId: { [Op.ne]: userId },
                eliminated: 0
            },
            attributes: PUBLIC_USER_FIELDS,
            order: [["username", "ASC"]],
            limit: 10
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
    getUserById,
    markAsRead,
    searchUsers,
    revokeMessage,
    deleteMessageForUser,
    toClientMessage
};
