const jwt = require("jsonwebtoken");
const { createMessage, deleteMessage } = require("../controllers/messages");


function setupChat(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = payload.id;
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

                io.to(`user_${message.receiverId}`).emit("newMessage", message);
                socket.emit("messageSent", message);
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


        socket.on("disconnect", () => {

            console.log(
                "User disconnected:",
                socket.id, socket.userId
            );

        });

    });

}


module.exports = setupChat;
