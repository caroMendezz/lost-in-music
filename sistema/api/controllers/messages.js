const { Message } = require("../models/Message");
const { User } = require("../models/User");

const createMessage = async (data) => {

    try {

        const {
            senderId,
            receiverId,
            content,
            messageType,
            fileUrl,
            fileName
        } = data;


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


        if (
            messageType === "image" ||
            messageType === "file"
        ) {

            if (!fileUrl) {

                throw new Error(
                    "File URL is required"
                );

            }

        }


        const message = await Message.create({

            senderId,
            receiverId,

            content:
                content || null,

            messageType:
                messageType || "text",

            fileUrl:
                fileUrl || null,

            fileName:
                fileName || null,

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

        if (message.senderId !== userId) {
            throw new Error("You cannot delete this message");
        }

        await message.destroy();

        return message;

    } catch (error) {

        console.error(error);
        throw error;

    }
};


module.exports = {
    createMessage,
    deleteMessage
};
