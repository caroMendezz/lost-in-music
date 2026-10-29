const jwt = require("jsonwebtoken");
const {
    createMessage,
    deleteMessage,
    revokeMessage,
    deleteMessageForUser,
    editMessage,
    toClientMessage,
    serializeMessages
} = require("../controllers/messages");

function setupChat(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = payload.userId;
            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {

        console.log(
            "User connected:",
            socket.userId, socket.id
        );
        socket.join(`user_${socket.userId}`);


        socket.on("sendMessage", async (data) => {

            try {
                const message = await createMessage({
                    ...data,
                    senderId: socket.userId
                });

                // Incluye la referencia liviana al mensaje original (replyTo) si es una respuesta
                const [payload] = await serializeMessages([message]);

                io.to(`user_${message.receiverId}`).emit("newMessage", payload);
                io.to(`user_${message.receiverId}`).emit("userTyping", {
                    senderId: socket.userId,
                    isTyping: false
                });
                socket.emit("messageSent", payload);
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


    
        socket.on(
            "deleteMessage",
            async ({ messageId }) => {

                try {

                    const message =
                        await deleteMessage(
                            messageId,
                            socket.userId
                        );

                    io.to(`user_${message.receiverId}`)
                        .to(`user_${message.senderId}`)
                        .emit("messageDeleted", { messageId });

                } catch (error) {

                    console.error(error);

                    socket.emit(
                        "messageError",
                        {
                            message: error.message
                        }
                    );
                }   
            }
        );


        // Anular envio para todos: no borra el registro, lo marca como anulado y avisa a ambos usuarios
        socket.on("revokeMessage", async (data) => {

            try {
                const message = await revokeMessage(data?.messageId, socket.userId);
                const [payload] = await serializeMessages([message]);

                // Se avisa a cada participante por separado: quien ya habia eliminado el mensaje
                // "para ti" recibe hiddenForViewer=true para que el mensaje NO reaparezca en su chat
                // (solo actualiza las respuestas que lo citan).
                io.to(`user_${message.senderId}`).emit("messageRevoked", {
                    ...payload,
                    hiddenForViewer: Boolean(message.deletedBySender)
                });
                if (Number(message.receiverId) !== Number(message.senderId)) {
                    io.to(`user_${message.receiverId}`).emit("messageRevoked", {
                        ...payload,
                        hiddenForViewer: Boolean(message.deletedByReceiver)
                    });
                }
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


        // Eliminar para ti: solo se oculta para el usuario que lo pidio (y sus otras pestañas)
        socket.on("deleteMessageForMe", async (data) => {

            try {
                await deleteMessageForUser(data?.messageId, socket.userId);

                io.to(`user_${socket.userId}`).emit("messageDeletedForMe", {
                    messageId: data.messageId
                });
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


        // Editar mensaje: actualiza el registro existente y avisa a ambos usuarios
        socket.on("editMessage", async (data) => {

            try {
                const message = await editMessage(data?.messageId, socket.userId, data?.content);
                const [payload] = await serializeMessages([message]);

                // No se envia a quien elimino el mensaje "para ti"
                if (!message.deletedBySender) {
                    io.to(`user_${message.senderId}`).emit("messageEdited", payload);
                }
                if (!message.deletedByReceiver && Number(message.receiverId) !== Number(message.senderId)) {
                    io.to(`user_${message.receiverId}`).emit("messageEdited", payload);
                }
            } catch (error) {
                console.error(error);
                socket.emit("messageError", { message: error.message });
            }

        });


        // Indicador de escritura en tiempo real: retransmite al destinatario
        socket.on("typing", (data) => {
            const receiverId = Number(data?.receiverId);
            if (!receiverId || receiverId === Number(socket.userId)) return;
            io.to(`user_${receiverId}`).emit("userTyping", {
                senderId: socket.userId,
                isTyping: true
            });
        });

        socket.on("stopTyping", (data) => {
            const receiverId = Number(data?.receiverId);
            if (!receiverId || receiverId === Number(socket.userId)) return;
            io.to(`user_${receiverId}`).emit("userTyping", {
                senderId: socket.userId,
                isTyping: false
            });
        });


        socket.on("disconnect", () => {

            console.log(
                "User disconnected:",
                socket.id, socket.userId
            );

        });

    });

}


module.exports = setupChat;
