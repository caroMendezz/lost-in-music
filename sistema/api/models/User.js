const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Role = require("./Role");

// Foto de perfil que recibe automáticamente toda cuenta que no sube una imagen.
// El archivo se sirve desde el backend en /assets/default-profile.png
const DEFAULT_PROFILE_PHOTO = "/assets/default-profile.png";

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },

  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  birthDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  gender: {
    type: DataTypes.ENUM('Femenino', 'Masculino', 'Otro', 'PrefieroNoDecir', 'NoBinario'),
    allowNull: false,
  },

  DVH: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  idRole: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  eliminated: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },

  followerAmount: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },

  followingAmount: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },

  profilePhoto: {
    type: DataTypes.TEXT('long'), // Permite guardar cadenas Base64 muy grandes
    allowNull: false,
  },

  banner: {
    type: DataTypes.TEXT('long'), // Permite guardar cadenas Base64 muy grandes
    allowNull: false,
  },

  friendId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },

  ubication: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  penaltyDate: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  // Sanción temporal aplicada por un administrador.
  // bannedUntil null = sin sanción vigente.
  bannedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },

  banReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  }
}, {
  // CONFIGURACIÓN DEL MODELO (Separado correctamente en el segundo argumento)
  tableName: "users",
  timestamps: true,
  hooks: {
    beforeValidate: (user) => {
      if (!user.profilePhoto) {
        user.profilePhoto = DEFAULT_PROFILE_PHOTO;
      }
    }
  }
});

User.belongsTo(Role, {
  foreignKey: "idRole",
  targetKey: "idRole", 
});

module.exports = {
  User,
  DEFAULT_PROFILE_PHOTO,
};