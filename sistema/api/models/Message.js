const sequelize = require("../config/db"); 
const { DataTypes } = require("sequelize"); 
const { User } = require("./User"); 

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
            key: "userId" // <-- CORREGIDO
        }
    },

    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "userId" // <-- CORREGIDO
        }
    },

    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    messageType: {
        type: DataTypes.ENUM("text", "image", "file"),
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
  sourceKey: "userId" 
});

User.hasMany(Message, {
  foreignKey: "receiverId",
  sourceKey: "userId" 
});

Message.belongsTo(User, {
  foreignKey: "senderId",
  targetKey: "userId" 
});

Message.belongsTo(User, {
  foreignKey: "receiverId",
  targetKey: "userId" 
});

module.exports = {
    Message
};