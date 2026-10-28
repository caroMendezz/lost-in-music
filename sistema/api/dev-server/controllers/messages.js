const { Op } = require("sequelize");
const { Message } = require("../models/Message");
const { User } = require("../models/User");

const VALID_TYPES = ["text", "image", "file"];

// Maximo de imagenes que puede llevar un solo mensaje (mismo limite que usa el frontend)
const MAX_IMAGES_PER_MESSAGE = 10;

// Un mensaje propio solo se puede editar durante los primeros 15 minutos desde su envio.
// Se calcula siempre contra la fecha de envio almacenada (sent_at), no contra el momento
// en que se carga la pagina ni contra cuanto tiempo esta abierta la conversacion.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

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
        data.fileUrls = null;
    } else {
        // En la base se guarda como JSON (TEXT); el cliente siempre recibe lista o null
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

// true si el mensaje fue eliminado "para ti" por ese usuario (no afecta al otro participante)
const isHiddenForUser = (message, userId) =>
    (Number(message.senderId) === Number(userId) && Boolean(message.deletedBySender)) ||
    (Number(message.receiverId) === Number(userId) && Boolean(message.deletedByReceiver));

// Mensajes tal como se envian al cliente + referencia liviana al mensaje original de cada respuesta:
//   replyTo: { messageId, senderId, deletedForAll }
// NUNCA incluye contenido ni flags de "eliminado para ti" (privados de cada participante).
// Sirve para que el cliente sepa quien escribio el original y si fue anulado para todos aunque
// el original ya no este visible para el, sin exponer contenido que no deberia ver.
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


        // Lista de imagenes del mensaje (solo mensajes "image").
        // Se normaliza aqui para que el cliente viejo (fileUrl unico) y el nuevo
        // (fileUrls) convivan sin cambios en el resto de las funcionalidades.
        const imageUrls = Array.isArray(fileUrls)
            ? fileUrls.filter((u) => typeof u === "string" && u.trim() !== "")
            : [];

        if (messageType === "image" && imageUrls.length > MAX_IMAGES_PER_MESSAGE) {
            throw new Error(`A message can include at most ${MAX_IMAGES_PER_MESSAGE} images`);
        }

        // fileUrl siempre conserva la primera imagen (compatibilidad con lo existente)
        const storedFileUrl = fileUrl || imageUrls[0] || null;

        if (messageType !== "text" && !storedFileUrl) {
            throw new Error("File URL is required");
        }


        // Respuesta a un mensaje existente: se guarda SOLO la referencia (id).
        // El mensaje original debe existir y pertenecer a la misma conversacion
        // (misma pareja de usuarios) a la que se esta enviando el mensaje.
        let replyTo = null;
        const hasReply = replyToMessageId !== undefined && replyToMessageId !== null && replyToMessageId !== "";

        if (hasReply) {
            const originalId = Number(replyToMessageId);

            if (!Number.isInteger(originalId)) {
                throw new Error("Invalid reply reference");
            }

            replyTo = await Message.findByPk(originalId);

            if (!replyTo) {
                throw new Error("The message you are replying to does not exist");
            }

            const originalParticipants = [Number(replyTo.senderId), Number(replyTo.receiverId)];
            const sameConversation =
                Number(senderId) !== Number(receiverId) &&
                originalParticipants.includes(Number(senderId)) &&
                originalParticipants.includes(Number(receiverId));

            if (!sameConversation) {
                throw new Error("You cannot reply with a message from another conversation");
            }

            // Un mensaje que el usuario elimino "para ti" ya no es visible para el: no se puede citar
            if (isHiddenForUser(replyTo, senderId)) {
                throw new Error("The message you are replying to is no longer available");
            }
        }


        const message = await Message.create({

            senderId,
            receiverId,

            content: content || null,

            messageType,

            fileUrl: storedFileUrl,

            fileName: fileName || null,

            fileUrls:
                messageType === "image" && imageUrls.length > 0
                    ? JSON.stringify(imageUrls)
                    : null,

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

// Editar: solo el emisor, solo mensajes de texto no anulados. Actualiza el MISMO registro.
const editMessage = async (messageId, userId, content) => {

    try {

        const message = await Message.findByPk(messageId);

        if (!message || message.deletedBySender) {
            throw new Error("Message not found");
        }

        if (Number(message.senderId) !== Number(userId)) {
            throw new Error("You cannot edit this message");
        }

        if (message.deletedForAll) {
            throw new Error("You cannot edit a deleted message");
        }

        if (message.messageType !== "text") {
            throw new Error("Only text messages can be edited");
        }

        // Limite de edicion: 15 minutos desde el envio, medidos contra sent_at.
        // Se valida en el backend tambien para que no se pueda evadir con una peticion directa.
        const sentAt = new Date(message.sent_at).getTime();
        if (!Number.isFinite(sentAt) || Date.now() - sentAt > EDIT_WINDOW_MS) {
            throw new Error("A message can only be edited during the first 15 minutes after being sent");
        }

        const newContent = typeof content === "string" ? content.trim() : "";

        if (newContent === "") {
            throw new Error("Message content cannot be empty");
        }

        // Sin cambios: no se marca como editado
        if (newContent === message.content) {
            return message;
        }

        await message.update({ content: newContent, editedAt: new Date() });

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

        res.json(await serializeMessages(messages));
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
// NUEVO: DELETE /conversations/:otherUserId
// Elimina la conversacion SOLO para el usuario autenticado: se marcan sus mensajes
// como ocultos para el (deletedBySender / deletedByReceiver). Los mensajes del otro
// participante NO se tocan, por lo que su historial sigue intacto.
// ---------------------------------------------------------------
const deleteConversationForUser = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const otherUserId = Number(req.params.otherUserId);

        if (!Number.isInteger(otherUserId) || otherUserId <= 0 || otherUserId === userId) {
            return res.status(400).json({ message: "Conversacion invalida" });
        }

        // Un solo UPDATE por direccion: los mensajes enviados por el usuario quedan
        // ocultos para el (deletedBySender) y los recibidos tambien (deletedByReceiver).
        // Los mensajes del otro participante no se tocan: su historial sigue intacto.
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
