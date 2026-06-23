const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")
const { Role } = require("./Role");

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },

  username: { //
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  description: { //
    type: DataTypes.TEXT,
    allowNull: false,
  },

  birthDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  gender: {
    type: DataTypes.ENUM('Femenino', 'Masculino', 'Otro', 'PrefieroNoDecir'),
    allowNull: false,
  },

  DVH: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  idrole: {
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
  profilePhoto: { //
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  banner: { //
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  friendId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  ubication: { //
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  penaltyDate: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

});

User.belongsTo(Role, {
  foreignKey: "idRole",
  targetKey: "idRole", 
});

module.exports = {
  User
};