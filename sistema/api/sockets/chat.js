const {
    createMessage,
    deleteMessage
} = require("../controllers/messages");


function setupChat(io) {

    io.on("connection", (socket) => {

        console.log(
            "User connected:",
            socket.id
        );


        // Join user's room
        socket.on("joinChat", (userId) => {

            socket.join(`user_${userId}`);

            console.log(
                `User ${userId} joined room`
            );

        });


        // Send message
        socket.on("sendMessage", async (data) => {

            try {

                const message =
                    await createMessage(data);


                // Send message to receiver
                io
                    .to(`user_${data.receiverId}`)
                    .emit(
                        "newMessage",
                        message
                    );


                // Confirm to sender
                socket.emit(
                    "messageSent",
                    message
                );


            } catch (error) {

                console.error(error);

                socket.emit(
                    "messageError",
                    {
                        message: error.message
                    }
                );

            }

        });


        // Delete message
        socket.on(
            "deleteMessage",
            async ({ messageId, userId }) => {

                try {

                    const message =
                        await deleteMessage(
                            messageId,
                            userId
                        );


                    io
                        .to(`user_${message.receiverId}`)
                        .emit(
                            "messageDeleted",
                            {
                                messageId
                            }
                        );


                    socket.emit(
                        "messageDeleted",
                        {
                            messageId
                        }
                    );


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
                socket.id
            );

        });

    });

}


module.exports = setupChat;
