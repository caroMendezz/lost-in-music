const { Op } = require("sequelize");    
const { Message } = require("../models/Message");
const { User } = require("../models/User");

const VALID_TYPES = ["text", "image", "file"];

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

        const messageType = data.messageType || "text";
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


    const getMessages = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const otherUserId = Number(req.params.otherUserId);

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            order: [["sent_at", "ASC"]]
        });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};

};


module.exports = {
    createMessage,
    deleteMessage,
    getMessages
};
