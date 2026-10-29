const { DataTypes } = require("sequelize");
const sequelize = require("./db");

// Columnas que se agregaron al integrar la mensajeria completa en el modelo Message.
// sequelize.sync() crea la tabla si no existe, pero NO agrega columnas nuevas a una
// tabla ya creada con la version anterior del backend. Esto completa esa migracion
// sin usar alter:true (que podria tocar el resto del esquema).
const MESSAGE_COLUMNS = {
    receiverId: {
        // Se agrega como NULL para no romper filas historicas que no tienen receptor.
        // Las filas nuevas siempre se crean con receptor (allowNull:false en el modelo).
        type: DataTypes.INTEGER,
        allowNull: true
    },
    messageType: {
        type: DataTypes.ENUM("text", "image", "file"),
        allowNull: false,
        defaultValue: "text"
    },
    fileUrls: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deletedForAll: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
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
    editedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    replyToMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
};

async function ensureMessagesColumns() {
    const queryInterface = sequelize.getQueryInterface();

    let table;
    try {
        table = await queryInterface.describeTable("messages");
    } catch (error) {
        // La tabla no existe todavia: sequelize.sync() la crea completa en el proximo arranque.
        console.warn("No se pudo revisar la tabla messages:", error.message);
        return;
    }

    for (const [name, definition] of Object.entries(MESSAGE_COLUMNS)) {
        if (table[name]) continue;

        await queryInterface.addColumn("messages", name, definition);
        console.log(`Columna agregada a messages: ${name}`);
    }
}

// Columnas del modelo User que quedaron desactualizadas en tablas creadas con
// versiones anteriores: profilePhoto se guarda como data URL base64 (mucho mas
// grande que un VARCHAR(255)) y el enum de gender no contemplaba 'NoBinario'.
const USERS_GENDER_VALUES = [
    "Femenino",
    "Masculino",
    "Otro",
    "PrefieroNoDecir",
    "NoBinario"
];

async function ensureUsersColumns() {
    const queryInterface = sequelize.getQueryInterface();

    let table;
    try {
        table = await queryInterface.describeTable("users");
    } catch (error) {
        // La tabla no existe todavia: sequelize.sync() la crea completa en el proximo arranque.
        console.warn("No se pudo revisar la tabla users:", error.message);
        return;
    }

    const profilePhotoType = String(table.profilePhoto?.type || "").toUpperCase();
    if (table.profilePhoto && profilePhotoType !== "LONGTEXT") {
        await queryInterface.changeColumn("users", "profilePhoto", {
            type: DataTypes.TEXT("long"),
            allowNull: false
        });
        console.log("Columna users.profilePhoto ampliada a LONGTEXT (fotos en base64)");
    }

    const genderType = String(table.gender?.type || "");
    if (table.gender && !USERS_GENDER_VALUES.every((value) => genderType.includes(value))) {
        await queryInterface.changeColumn("users", "gender", {
            type: DataTypes.ENUM(...USERS_GENDER_VALUES),
            allowNull: false
        });
        console.log("Columna users.gender actualizada con las opciones actuales");
    }
}

module.exports = { ensureMessagesColumns, ensureUsersColumns };
