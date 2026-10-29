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

    // Varios archivos en un solo mensaje (JSON con la lista de URLs).
    // Solo se usa para mensajes "image" con mas de una foto; fileUrl conserva
    // SIEMPRE la primera para compatibilidad con todo lo que ya lee ese campo.
    fileUrls: {
        type: DataTypes.TEXT,
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
    },

    // Anular envio para todos: el registro se conserva, solo cambia este estado
    deletedForAll: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    // Eliminar para ti: oculta el mensaje solo para quien lo elimino
    deletedBySender: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    deletedByReceiver: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    // Fecha de la ultima edicion del texto (null = nunca fue editado)
    editedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Mensaje original al que responde este mensaje (null = mensaje normal)
    replyToMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "messages",
            key: "messageId"
        }
    }
});

User.hasMany(Message, {
    foreignKey: "senderId",
    sourceKey: "userId",
    as: "sentMessages"
});

User.hasMany(Message, {
    foreignKey: "receiverId",
    sourceKey: "userId",
    as: "receivedMessages"
});

Message.belongsTo(User, {
    foreignKey: "senderId",
    targetKey: "userId",
    as: "sender"
});

Message.belongsTo(User, {
    foreignKey: "receiverId",
    targetKey: "userId",
    as: "receiver"
});

module.exports = {
    Message
};
