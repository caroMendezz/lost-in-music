const sequelize = require("../config/db");
const { DataTypes} = require("sequelize")

const Notificacion = sequelize.define('notificación', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  título: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = {
    Notificacion   
}