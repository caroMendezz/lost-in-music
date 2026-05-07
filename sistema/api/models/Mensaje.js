const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Mensajes = sequelize.define('mensajes', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },
    id_emisor: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    unique: true
  },
    id_receptor: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    unique: true
  },
    contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
    fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
    leído: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
});

module.exports = {
    Mensajes
}