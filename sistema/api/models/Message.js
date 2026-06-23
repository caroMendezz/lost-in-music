const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Message = sequelize.define("message", {
    messageId: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },

    senderId: {
        type: DataTypes.INTEGER(11),
        allowNull: false
    },

    receiverId: {
        type: DataTypes.INTEGER(11),
        allowNull: false
    },

    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    sent_at: {
        type: DataTypes.DATE,
        allowNull: false
    },

    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

module.exports = {
    Message
};