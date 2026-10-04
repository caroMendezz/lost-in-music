const sequelize = require("../config/db")
const { User } = require("./User");
const { DataTypes } = require("sequelize");

const Message = sequelize.define("message", {

    messageId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "userId"
        }
    },

    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "userId"
        }
    },

    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    messageType: {
        type: DataTypes.ENUM(
            "text",
            "image",
            "file"
        ),
        allowNull: false,
        defaultValue: "text"
    },

    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },

    fileName: {
        type: DataTypes.STRING,
        allowNull: true
    },

    sent_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

User.hasMany(Message, {
    foreignKey: "senderId",
    as: "sentMessages"
});

User.hasMany(Message, {
    foreignKey: "receiverId",
    as: "receivedMessages"
});

Message.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender"
});

Message.belongsTo(User, {
    foreignKey: "receiverId",
    as: "receiver"
});


module.exports = {
    Message
}