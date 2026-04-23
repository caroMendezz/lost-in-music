const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Notificacion = sequelize.define('notificación', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  fecha: DataTypes.DATE,
  título: DataTypes.STRING(150),
  descripcion: DataTypes.TEXT
});

module.exports = {
    Notificacion   
}