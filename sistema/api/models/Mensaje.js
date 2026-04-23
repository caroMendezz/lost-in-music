const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Mensajes = sequelize.define('mensajes', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  id_emisor: DataTypes.INTEGER(11),
  id_receptor: DataTypes.INTEGER(11),
  contenido: DataTypes.TEXT,
  fecha: DataTypes.DATE,
  leído: DataTypes.TINYINT(1)
});

module.exports = {
    Mensajes
}