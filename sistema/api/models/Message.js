const Message = sequelize.define("message", {

    messageId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false
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
