const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Usuario = sequelize.define('Usuario', {
  idusuario: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },

  nombre: { //
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  contraseña: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  descripcion: { //
    type: DataTypes.TEXT,
    allowNull: false,
  },

  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  genero: {
    type: DataTypes.ENUM('Femenino', 'Masculino', 'Otro', 'PrefieroNoDecir'),
    allowNull: false,
  },

  DVH: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  rol: {
    type: DataTypes.ENUM('Admin','User'),
    allowNull: false,
  },
  eliminado: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
  cant_seguidores: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  cant_seguidos: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  foto_perfil: { //
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  banner: { //
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  id_amigo: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  ubicacion: { //
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  fecha_penalizacion: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

});

module.exports = {
  Usuario
};